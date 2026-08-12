import { Response, NextFunction } from 'express';
import { MessageModel } from '../models/Message';
import { ConversationModel } from '../models/Conversation';
import { successResponse, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { sendMessageSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { parsePagination } from '../utils/helpers';
import { NotificationService } from '../services/notificationService';
import { getIO } from '../sockets/socketHandler';
import xss from 'xss';

// GET /api/conversations/:id/messages
export async function getMessages(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversationId = req.params.id;
    const isParticipant = await ConversationModel.isParticipant(conversationId, req.userId!);
    if (!isParticipant) throw new ForbiddenError('Access denied');

    const { limit, cursor } = parsePagination(
      req.query.limit as string,
      req.query.cursor as string
    );

    const messages = await MessageModel.getConversationMessages(conversationId, limit, cursor);

    // Auto-deliver all messages for this receiver
    const delivered = await MessageModel.markAllDeliveredInConversation(conversationId, req.userId!);
    if (delivered.length > 0) {
      const io = getIO();
      delivered.forEach((msg) => {
        io.to(`user:${msg.sender_id}`).emit('message_delivered', {
          message_id: msg.id,
          conversation_id: conversationId,
          delivered_at: new Date().toISOString(),
        });
      });
    }

    const hasMore = messages.length === limit;
    const nextCursor = hasMore ? messages[0]?.id : null;

    res.json(successResponse({ messages, has_more: hasMore, next_cursor: nextCursor }));
  } catch (err) {
    next(err);
  }
}

// POST /api/messages
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = sendMessageSchema.parse(req.body);

    // Verify sender is participant
    const isParticipant = await ConversationModel.isParticipant(body.conversation_id, req.userId!);
    if (!isParticipant) throw new ForbiddenError('Access denied');

    // Cannot message yourself
    if (body.receiver_id === req.userId) {
      throw new ForbiddenError('Cannot send message to yourself', 'SELF_MESSAGE');
    }

    // Validate message content
    if (body.message_type === 'TEXT' && !body.message_text?.trim()) {
      throw new ValidationError('Text message cannot be empty');
    }
    if (['VOICE', 'DOCUMENT', 'IMAGE'].includes(body.message_type) && !body.file_url) {
      throw new ValidationError('File URL required for this message type');
    }

    const { message, created } = await MessageModel.createOrFind({
      conversation_id: body.conversation_id,
      sender_id: req.userId!,
      receiver_id: body.receiver_id,
      client_message_id: body.client_message_id,
      message_type: body.message_type,
      message_text: body.message_text ? xss(body.message_text) : null,
      file_url: body.file_url,
      file_name: body.file_name,
      file_size: body.file_size,
      mime_type: body.mime_type,
      duration: body.duration,
    });

    if (created) {
      await ConversationModel.touch(body.conversation_id);

      // Emit real-time event to receiver
      const io = getIO();
      io.to(`user:${body.receiver_id}`).emit('message_new', message);
      io.to(`user:${req.userId}`).emit('message_sent', message);

      // Send push notification if receiver is offline
      await NotificationService.sendMessageNotification(body.receiver_id, message, req.user!);
    }

    res.status(created ? 201 : 200).json(successResponse(message));
  } catch (err) {
    next(err);
  }
}

// POST /api/messages/:id/delivered
export async function markDelivered(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await MessageModel.findById(req.params.id);
    if (!message) throw new NotFoundError('Message not found');
    if (message.receiver_id !== req.userId) throw new ForbiddenError('Access denied');

    await MessageModel.markDelivered(message.id);
    const io = getIO();
    io.to(`user:${message.sender_id}`).emit('message_delivered', {
      message_id: message.id,
      conversation_id: message.conversation_id,
      delivered_at: new Date().toISOString(),
    });

    res.json(successResponse(null, 'Marked as delivered'));
  } catch (err) {
    next(err);
  }
}

// POST /api/messages/:id/read
export async function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const message = await MessageModel.findById(req.params.id);
    if (!message) throw new NotFoundError('Message not found');
    if (message.receiver_id !== req.userId) throw new ForbiddenError('Access denied');

    await MessageModel.markRead(message.id);
    const io = getIO();
    io.to(`user:${message.sender_id}`).emit('message_read', {
      message_id: message.id,
      conversation_id: message.conversation_id,
      read_at: new Date().toISOString(),
    });

    res.json(successResponse(null, 'Marked as read'));
  } catch (err) {
    next(err);
  }
}

// POST /api/messages/bulk-read
export async function bulkMarkRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { conversation_id } = req.body;
    if (!conversation_id) throw new ValidationError('conversation_id required');

    const isParticipant = await ConversationModel.isParticipant(conversation_id, req.userId!);
    if (!isParticipant) throw new ForbiddenError('Access denied');

    const count = await MessageModel.markAllReadInConversation(conversation_id, req.userId!);
    const otherUserId = await ConversationModel.getOtherParticipantId(conversation_id, req.userId!);

    if (count > 0 && otherUserId) {
      const io = getIO();
      io.to(`user:${otherUserId}`).emit('messages_read', {
        conversation_id,
        reader_id: req.userId,
        read_at: new Date().toISOString(),
      });
    }

    res.json(successResponse({ count }, 'Messages marked as read'));
  } catch (err) {
    next(err);
  }
}
