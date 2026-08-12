import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { DeviceTokenModel } from '../models/DeviceToken';
import { Message } from '../models/Message';
import { logger } from '../utils/logger';

const expo = new Expo();

interface SenderInfo {
  first_name: string;
  last_name: string;
}

export class NotificationService {
  static async sendMessageNotification(
    receiverId: string,
    message: Message,
    sender: SenderInfo
  ): Promise<void> {
    try {
      const tokens = await DeviceTokenModel.getTokensForUser(receiverId);
      if (tokens.length === 0) return;

      const senderName = `${sender.first_name} ${sender.last_name}`;
      let body = '';

      switch (message.message_type) {
        case 'TEXT':
          body = message.message_text || '';
          break;
        case 'VOICE':
          body = '🎤 Voice message';
          break;
        case 'DOCUMENT':
          body = `📄 ${message.file_name || 'Document'}`;
          break;
        case 'IMAGE':
          body = '🖼️ Image';
          break;
        default:
          body = 'New message';
      }

      const messages: ExpoPushMessage[] = tokens
        .filter((token) => Expo.isExpoPushToken(token))
        .map((token) => ({
          to: token,
          sound: 'default',
          title: senderName,
          body,
          data: {
            type: 'NEW_MESSAGE',
            conversation_id: message.conversation_id,
            message_id: message.id,
            sender_id: message.sender_id,
          },
          categoryId: 'message',
        }));

      if (messages.length === 0) return;

      const chunks = expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        // Handle invalid tokens
        ticketChunk.forEach((ticket, idx) => {
          if (ticket.status === 'error') {
            logger.warn(`Push notification error for token: ${messages[idx]?.to}`, ticket.message);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              DeviceTokenModel.remove(messages[idx]?.to as string).catch(() => {});
            }
          }
        });
      }
    } catch (err) {
      logger.error('Failed to send push notification', err);
    }
  }
}
