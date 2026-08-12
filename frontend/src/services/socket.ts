import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { logger } from '../utils/logger';
import type {
  SocketMessageNew,
  SocketTypingEvent,
  SocketOnlineEvent,
  SocketOfflineEvent,
  SocketDeliveredEvent,
  SocketReadEvent,
} from '../types';

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

export const socketService = {
  connect(): void {
    const token = useAuthStore.getState().tokens?.access_token;
    if (!token) return;
    if (socket?.connected) return;

    socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      logger.log('Socket connected');
      useChatStore.getState().setSocketConnected(true);
      startHeartbeat();
    });

    socket.on('disconnect', (reason) => {
      logger.warn('Socket disconnected:', reason);
      useChatStore.getState().setSocketConnected(false);
      stopHeartbeat();
    });

    socket.on('connect_error', (err) => {
      logger.error('Socket connection error:', err.message);
    });

    // ── Message Events ─────────────────────────────────────────────────
    socket.on('message_new', (data: SocketMessageNew) => {
      useChatStore.getState().addMessage(data.conversation_id, data as any);
      useChatStore.getState().updateConversationLastMessage(data.conversation_id, data as any);
    });

    socket.on('message_sent', (data: SocketMessageNew) => {
      useChatStore.getState().updateMessage(data.conversation_id, data.client_message_id, {
        ...data,
        status: 'SENT',
      } as any);
    });

    socket.on('message_failed', ({ client_message_id, error }: { client_message_id: string; error: string }) => {
      logger.error('Message failed:', error);
      // Update local message status to FAILED
    });

    socket.on('message_delivered', (data: SocketDeliveredEvent) => {
      useChatStore.getState().updateMessageStatus(
        data.conversation_id,
        data.message_id,
        'DELIVERED',
        undefined,
        data.delivered_at
      );
    });

    socket.on('message_read', ({ message_id, conversation_id, read_at }: { message_id: string; conversation_id: string; read_at: string }) => {
      useChatStore.getState().updateMessageStatus(conversation_id, message_id, 'READ', read_at);
    });

    socket.on('messages_read', (data: SocketReadEvent) => {
      useChatStore.getState().markConversationMessagesRead(data.conversation_id, data.reader_id, data.read_at);
    });

    // ── Typing Events ──────────────────────────────────────────────────
    socket.on('typing_start', (data: SocketTypingEvent) => {
      useChatStore.getState().setTyping(data.conversation_id, data.user_id, true);
    });

    socket.on('typing_stop', (data: SocketTypingEvent) => {
      useChatStore.getState().setTyping(data.conversation_id, data.user_id, false);
    });

    // ── Online Status ──────────────────────────────────────────────────
    socket.on('user_online', (data: SocketOnlineEvent) => {
      useChatStore.getState().setUserOnlineStatus(data.user_id, true);
    });

    socket.on('user_offline', (data: SocketOfflineEvent) => {
      useChatStore.getState().setUserOnlineStatus(data.user_id, false, data.last_seen);
    });

    // ── Heartbeat Ack ──────────────────────────────────────────────────
    socket.on('heartbeat_ack', () => {
      // Connection confirmed alive
    });
  },

  disconnect(): void {
    stopHeartbeat();
    socket?.disconnect();
    socket = null;
    useChatStore.getState().setSocketConnected(false);
  },

  joinConversation(conversationId: string): void {
    socket?.emit('join_conversation', { conversation_id: conversationId });
  },

  leaveConversation(conversationId: string): void {
    socket?.emit('leave_conversation', { conversation_id: conversationId });
  },

  sendMessage(data: {
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
  }): void {
    socket?.emit('message_send', data);
  },

  sendTypingStart(conversationId: string, receiverId: string): void {
    socket?.emit('typing_start', { conversation_id: conversationId, receiver_id: receiverId });
  },

  sendTypingStop(conversationId: string, receiverId: string): void {
    socket?.emit('typing_stop', { conversation_id: conversationId, receiver_id: receiverId });
  },

  markMessagesRead(conversationId: string): void {
    socket?.emit('messages_read', { conversation_id: conversationId });
  },

  isConnected(): boolean {
    return socket?.connected ?? false;
  },
};

function startHeartbeat() {
  stopHeartbeat();
  heartbeatInterval = setInterval(() => {
    socket?.emit('heartbeat');
  }, 30000);
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
