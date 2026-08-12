import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { useAuthStore } from '../store/authStore';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.access_token) {
      config.headers.Authorization = `Bearer ${tokens.access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh
let isRefreshing = false;
let failedQueue: { resolve: (value: string) => void; reject: (error: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const data = error.response.data as { code?: string };
      if (data?.code === 'TOKEN_EXPIRED') {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`,
            };
            return api(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = useAuthStore.getState().tokens?.refresh_token;
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: new_refresh } = response.data.data;
          useAuthStore.getState().setTokens({ access_token, refresh_token: new_refresh });
          processQueue(null, access_token);
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${access_token}`,
          };
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          useAuthStore.getState().logout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export default api;

// ── Auth API ─────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile_number: string, purpose: 'LOGIN' | 'REGISTRATION') =>
    api.post('/auth/send-otp', { mobile_number, purpose }),

  verifyOtp: (mobile_number: string, otp_code: string, purpose: 'LOGIN' | 'REGISTRATION') =>
    api.post('/auth/verify-otp', { mobile_number, otp_code, purpose }),

  register: (data: {
    mobile_number: string;
    otp_token: string;
    first_name: string;
    last_name: string;
    email?: string;
  }) => api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),
};

// ── User API ──────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: Partial<{ first_name: string; last_name: string; email: string; bio: string; profile_picture: string }>) =>
    api.put('/users/me', data),
  deleteAccount: () => api.delete('/users/me'),
  searchUser: (q: string) => api.get('/users/search', { params: { q } }),
  syncContacts: (phone_numbers: string[]) => api.post('/users/sync-contacts', { phone_numbers }),
  getUserById: (id: string) => api.get(`/users/${id}`),
};

// ── Conversation API ──────────────────────────────────────────────────────
export const conversationApi = {
  list: () => api.get('/conversations'),
  create: (participant_id: string) => api.post('/conversations', { participant_id }),
  createConversation: (participant_id: string) => api.post('/conversations', { participant_id }),
  get: (id: string) => api.get(`/conversations/${id}`),
  getMessages: (id: string, cursor?: string | null, limit = 30) =>
    api.get(`/conversations/${id}/messages`, { params: { cursor, limit } }),
};

// ── Message API ───────────────────────────────────────────────────────────
export const messageApi = {
  send: (data: {
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
  }) => api.post('/messages', data),
  markDelivered: (id: string) => api.post(`/messages/${id}/delivered`),
  markRead: (id: string) => api.post(`/messages/${id}/read`),
  bulkRead: (conversation_id: string) => api.post('/messages/bulk-read', { conversation_id }),
};

// ── Upload API ───────────────────────────────────────────────────────────
export const uploadApi = {
  document: (formData: FormData) =>
    api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  voice: (formData: FormData) =>
    api.post('/upload/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Device API ────────────────────────────────────────────────────────────
export const deviceApi = {
  register: (expo_push_token: string, platform: 'android' | 'ios' | 'web') =>
    api.post('/devices/register', { expo_push_token, platform }),
  remove: (token: string) => api.delete(`/devices/${token}`),
};
