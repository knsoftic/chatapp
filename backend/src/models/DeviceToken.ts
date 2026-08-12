import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateId } from '../utils/helpers';

export interface DeviceToken extends RowDataPacket {
  id: string;
  user_id: string;
  expo_push_token: string;
  platform: 'android' | 'ios' | 'web';
  created_at: Date;
  updated_at: Date;
}

export class DeviceTokenModel {
  static async upsert(
    userId: string,
    expoPushToken: string,
    platform: 'android' | 'ios' | 'web'
  ): Promise<void> {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO device_tokens (id, user_id, expo_push_token, platform)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = ?, platform = ?, updated_at = NOW()`,
      [generateId(), userId, expoPushToken, platform, userId, platform]
    );
  }

  static async remove(expoPushToken: string): Promise<void> {
    await pool.execute('DELETE FROM device_tokens WHERE expo_push_token = ?', [expoPushToken]);
  }

  static async removeAllForUser(userId: string): Promise<void> {
    await pool.execute('DELETE FROM device_tokens WHERE user_id = ?', [userId]);
  }

  static async getTokensForUser(userId: string): Promise<string[]> {
    const [rows] = await pool.execute<DeviceToken[]>(
      'SELECT expo_push_token FROM device_tokens WHERE user_id = ?',
      [userId]
    );
    return rows.map((r) => r.expo_push_token);
  }
}
