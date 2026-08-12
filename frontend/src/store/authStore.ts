import { create } from 'zustand';
import { User, AuthTokens } from '../types';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../constants/config';
import { userApi } from '../services/api';

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setAuth: (user: User, access_token: string, refresh_token: string) => Promise<void>;
  login: (user: User, tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user }),

  setTokens: (tokens) => {
    set({ tokens });
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token).catch(() => {});
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token).catch(() => {});
  },

  setAuth: async (user: User, access_token: string, refresh_token: string) => {
    const tokens = { access_token, refresh_token };
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({ user, tokens, isAuthenticated: true });
  },

  login: async (user, tokens) => {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({ user, tokens, isAuthenticated: true });
  },

  logout: async () => {
    await storage.clear();
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        storage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        const user = JSON.parse(userData) as User;
        set({
          tokens: { access_token: accessToken, refresh_token: refreshToken },
          user,
          isAuthenticated: true,
        });

        // Refresh user data in background
        get().refreshUser().catch(() => {});
      }
    } catch (err) {
      await storage.clear();
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const response = await userApi.getMe();
      const user = response.data.data as User;
      set({ user });
      await storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch {}
  },
}));
