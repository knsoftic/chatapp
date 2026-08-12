import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { deviceApi } from './api';
import { storage } from './storage';
import { STORAGE_KEYS } from '../constants/config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.warn('Notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('messages', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'notification.wav',
      });
    }

    return true;
  },

  async registerDevice(): Promise<void> {
    try {
      const granted = await this.requestPermissions();
      if (!granted) return;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'YOUR_EXPO_PROJECT_ID', // Replace with your Expo project ID
      });

      const token = tokenData.data;
      const platform = Platform.OS as 'android' | 'ios' | 'web';

      await deviceApi.register(token, platform);
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN + '_push', token);
    } catch (err) {
      console.error('Failed to register for push notifications:', err);
    }
  },

  async unregisterDevice(): Promise<void> {
    try {
      const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN + '_push');
      if (token) {
        await deviceApi.remove(token);
        await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN + '_push');
      }
    } catch {}
  },

  addNotificationListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  },

  addResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },
};
