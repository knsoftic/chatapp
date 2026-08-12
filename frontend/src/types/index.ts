// ── User Types ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  mobile_number: string;
  email?: string | null;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  bio?: string | null;
  is_online: boolean;
  last_seen?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  id: string;
  mobile_number: string;
  mobile_number_masked?: string;
  first_name: string;
  last_name: string;
  profile_picture?: string | null;
  bio?: string | null;
  is_online: boolean;
  last_seen?: string | null;
}

// ── Auth Types ───────────────────────────────────────────────────────────
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── OTP Types ────────────────────────────────────────────────────────────
export type OTPPurpose = 'LOGIN' | 'REGISTRATION';

// ── Message Types ────────────────────────────────────────────────────────
export type MessageType = 'TEXT' | 'VOICE' | 'DOCUMENT' | 'IMAGE' | 'SYSTEM';
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  client_message_id: string;
  message_type: MessageType;
  message_text?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  duration?: number | null;
  status: MessageStatus;
  created_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
}

// ── Conversation Types ────────────────────────────────────────────────────
export interface Conversation {
  id: string;
  other_user_id: string;
  other_user_first_name: string;
  other_user_last_name: string;
  other_user_profile_picture?: string | null;
  other_user_is_online: boolean;
  other_user_last_seen?: string | null;
  last_message_text?: string | null;
  last_message_type?: MessageType | null;
  last_message_at?: string | null;
  last_message_sender_id?: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// ── Upload Result ────────────────────────────────────────────────────────
export interface UploadResult {
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  original_name: string;
}

// ── Socket Events ────────────────────────────────────────────────────────
export interface SocketMessageNew {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  client_message_id: string;
  message_type: MessageType;
  message_text?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  duration?: number;
  status: MessageStatus;
  created_at: string;
}

export interface SocketTypingEvent {
  conversation_id: string;
  user_id: string;
}

export interface SocketOnlineEvent {
  user_id: string;
}

export interface SocketOfflineEvent {
  user_id: string;
  last_seen: string;
}

export interface SocketDeliveredEvent {
  message_id: string;
  conversation_id: string;
  delivered_at: string;
}

export interface SocketReadEvent {
  conversation_id: string;
  reader_id: string;
  read_at: string;
}

// ── API Response ─────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

// ── Notification Settings ─────────────────────────────────────────────────
export interface NotificationSettings {
  pushEnabled: boolean;
  messagePreview: boolean;
  sound: boolean;
  vibration: boolean;
}
