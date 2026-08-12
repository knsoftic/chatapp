import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web doesn't support SecureStore, fall back to in-memory/localStorage
const isWeb = Platform.OS === 'web';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },

  async clear(): Promise<void> {
    if (isWeb) {
      try {
        localStorage.clear();
      } catch {}
      return;
    }
    // Clear known keys
    const keys = ['access_token', 'refresh_token', 'user_data', 'theme_mode', 'notification_settings'];
    await Promise.all(keys.map((k) => SecureStore.deleteItemAsync(k).catch(() => {})));
  },
};
