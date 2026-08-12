import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserModel } from '../models/User';
import { ConversationModel } from '../models/Conversation';
import { MessageModel } from '../models/Message';
import { logger } from '../utils/logger';

let io: SocketIOServer;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Authentication Middleware ──────────────────────────────────────────────
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('No token provided'));

    try {
      const payload = jwt.verify(token, env.jwt.secret) as { userId: string };
      const user = await UserModel.findById(payload.userId);
      if (!user || !user.is_active) return next(new Error('Unauthorized'));
      socket.userId = user.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection Handler ────────────────────────────────────────────────────
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info(`Socket connected: ${userId} (${socket.id})`);

    // Join private user room
    socket.join(`user:${userId}`);

    // Mark user online
    await UserModel.setOnline(userId, true);
    io.emit('user_online', { user_id: userId });

    // ── Join Conversation ────────────────────────────────────────────────
    socket.on('join_conversation', async ({ conversation_id }: { conversation_id: string }) => {
      try {
        const isParticipant = await ConversationModel.isParticipant(conversation_id, userId);
        if (!isParticipant) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }
        socket.join(`conv:${conversation_id}`);

        // Auto-deliver messages when joining
        const delivered = await MessageModel.markAllDeliveredInConversation(conversation_id, userId);
        delivered.forEach((msg) => {
          io.to(`user:${msg.sender_id}`).emit('message_delivered', {
            message_id: msg.id,
            conversation_id,
            delivered_at: new Date().toISOString(),
          });
        });
      } catch (err) {
        logger.error('join_conversation error', err);
      }
    });

    // ── Leave Conversation ───────────────────────────────────────────────
    socket.on('leave_conversation', ({ conversation_id }: { conversation_id: string }) => {
      socket.leave(`conv:${conversation_id}`);
    });

    // ── Message Send (via Socket as alternative to REST) ─────────────────
    socket.on('message_send', async (data: {
      conversation_id: string;
      receiver_id: string;
      client_message_id: string;
      message_type: string;
      message_text?: string;
      file_url?: string;
      file_name?: string;
      file_size?: number;
      mime_type?: string;
      duration?: number;
    }) => {
      try {
        const isParticipant = await ConversationModel.isParticipant(data.conversation_id, userId);
        if (!isParticipant || data.receiver_id === userId) {
          socket.emit('message_failed', { client_message_id: data.client_message_id, error: 'Access denied' });
          return;
        }

        const { message, created } = await MessageModel.createOrFind({
          conversation_id: data.conversation_id,
          sender_id: userId,
          receiver_id: data.receiver_id,
          client_message_id: data.client_message_id,
          message_type: data.message_type as any,
          message_text: data.message_text,
          file_url: data.file_url,
          file_name: data.file_name,
          file_size: data.file_size,
          mime_type: data.mime_type,
          duration: data.duration,
        });

        if (created) {
          await ConversationModel.touch(data.conversation_id);
          io.to(`user:${data.receiver_id}`).emit('message_new', message);
        }
        socket.emit('message_sent', message);
      } catch (err) {
        logger.error('message_send error', err);
        socket.emit('message_failed', {
          client_message_id: data.client_message_id,
          error: 'Failed to send message',
        });
      }
    });

    // ── Read Receipt ─────────────────────────────────────────────────────
    socket.on('messages_read', async ({ conversation_id }: { conversation_id: string }) => {
      try {
        const isParticipant = await ConversationModel.isParticipant(conversation_id, userId);
        if (!isParticipant) return;

        const count = await MessageModel.markAllReadInConversation(conversation_id, userId);
        if (count > 0) {
          const otherUserId = await ConversationModel.getOtherParticipantId(conversation_id, userId);
          if (otherUserId) {
            io.to(`user:${otherUserId}`).emit('messages_read', {
              conversation_id,
              reader_id: userId,
              read_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        logger.error('messages_read error', err);
      }
    });

    // ── Typing Indicators ────────────────────────────────────────────────
    socket.on('typing_start', async ({ conversation_id, receiver_id }: { conversation_id: string; receiver_id: string }) => {
      try {
        const isParticipant = await ConversationModel.isParticipant(conversation_id, userId);
        if (!isParticipant) return;
        io.to(`user:${receiver_id}`).emit('typing_start', { conversation_id, user_id: userId });
      } catch {}
    });

    socket.on('typing_stop', async ({ conversation_id, receiver_id }: { conversation_id: string; receiver_id: string }) => {
      try {
        io.to(`user:${receiver_id}`).emit('typing_stop', { conversation_id, user_id: userId });
      } catch {}
    });

    // ── Heartbeat ────────────────────────────────────────────────────────
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack', { timestamp: Date.now() });
    });

    // ── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      logger.info(`Socket disconnected: ${userId} (${reason})`);

      // Check if user has other active connections
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      if (sockets.length === 0) {
        await UserModel.setOnline(userId, false);
        io.emit('user_offline', { user_id: userId, last_seen: new Date().toISOString() });
      }
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}
