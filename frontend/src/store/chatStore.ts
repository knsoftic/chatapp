import { create } from 'zustand';
import { Conversation, Message, MessageStatus } from '../types';

interface TypingState {
  [conversationId: string]: Set<string>; // Set of user IDs typing
}

interface OnlineState {
  [userId: string]: { isOnline: boolean; lastSeen?: string };
}

interface ChatStore {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  typing: TypingState;
  onlineStatus: OnlineState;
  isSocketConnected: boolean;
  activeConversationId: string | null;

  // Conversation actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Partial<Conversation> & { id: string }) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;

  // Message actions
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, clientMessageId: string, message: Partial<Message>) => void;
  updateMessageStatus: (
    conversationId: string,
    messageId: string,
    status: MessageStatus,
    readAt?: string,
    deliveredAt?: string
  ) => void;
  markConversationMessagesRead: (conversationId: string, readerId: string, readAt: string) => void;

  // Typing actions
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  isUserTyping: (conversationId: string) => boolean;

  // Online status
  setUserOnlineStatus: (userId: string, isOnline: boolean, lastSeen?: string) => void;

  // Socket
  setSocketConnected: (connected: boolean) => void;
  setActiveConversation: (id: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  messages: {},
  typing: {},
  onlineStatus: {},
  isSocketConnected: false,
  activeConversationId: null,

  // ── Conversation ──────────────────────────────────────────────────────
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.find((c) => c.id === conversation.id);
      if (exists) return state;
      return { conversations: [conversation, ...state.conversations] };
    }),

  updateConversation: (update) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === update.id ? { ...c, ...update } : c
      ),
    })),

  updateConversationLastMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations
        .map((c) => {
          if (c.id !== conversationId) return c;
          const isReceived = message.sender_id !== c.other_user_id ? false : true;
          return {
            ...c,
            last_message_text: message.message_text,
            last_message_type: message.message_type,
            last_message_at: message.created_at,
            last_message_sender_id: message.sender_id,
            unread_count: isReceived ? c.unread_count + 1 : c.unread_count,
          };
        })
        .sort((a, b) => {
          const aTime = a.last_message_at || a.updated_at;
          const bTime = b.last_message_at || b.updated_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        }),
    })),

  incrementUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: c.unread_count + 1 } : c
      ),
    })),

  resetUnreadCount: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),

  // ── Messages ──────────────────────────────────────────────────────────
  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...messages, ...(state.messages[conversationId] || [])],
      },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Deduplicate by client_message_id or id
      const isDupe = existing.some(
        (m) =>
          m.id === message.id ||
          (m.client_message_id === message.client_message_id && m.sender_id === message.sender_id)
      );
      if (isDupe) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),

  updateMessage: (conversationId, clientMessageId, updated) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.client_message_id === clientMessageId ? { ...m, ...updated } : m
        ),
      },
    })),

  updateMessageStatus: (conversationId, messageId, status, readAt, deliveredAt) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.id === messageId
            ? {
                ...m,
                status,
                ...(readAt ? { read_at: readAt } : {}),
                ...(deliveredAt ? { delivered_at: deliveredAt } : {}),
              }
            : m
        ),
      },
    })),

  markConversationMessagesRead: (conversationId, readerId, readAt) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.receiver_id === readerId && m.status !== 'READ'
            ? { ...m, status: 'READ', read_at: readAt }
            : m
        ),
      },
    })),

  // ── Typing ────────────────────────────────────────────────────────────
  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typing[conversationId] || []);
      if (isTyping) {
        current.add(userId);
      } else {
        current.delete(userId);
      }
      return { typing: { ...state.typing, [conversationId]: current } };
    }),

  isUserTyping: (conversationId) => {
    const typingUsers = get().typing[conversationId];
    return typingUsers ? typingUsers.size > 0 : false;
  },

  // ── Online Status ─────────────────────────────────────────────────────
  setUserOnlineStatus: (userId, isOnline, lastSeen) =>
    set((state) => ({
      onlineStatus: {
        ...state.onlineStatus,
        [userId]: { isOnline, lastSeen },
      },
      // Also update conversations
      conversations: state.conversations.map((c) =>
        c.other_user_id === userId
          ? { ...c, other_user_is_online: isOnline, ...(lastSeen ? { other_user_last_seen: lastSeen } : {}) }
          : c
      ),
    })),

  // ── Socket ────────────────────────────────────────────────────────────
  setSocketConnected: (connected) => set({ isSocketConnected: connected }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
}));
