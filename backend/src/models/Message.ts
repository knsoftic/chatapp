import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateId } from '../utils/helpers';

export type MessageType = 'TEXT' | 'VOICE' | 'DOCUMENT' | 'IMAGE' | 'SYSTEM';
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface Message extends RowDataPacket {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  client_message_id: string;
  message_type: MessageType;
  message_text: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration: number | null;
  status: MessageStatus;
  created_at: Date;
  delivered_at: Date | null;
  read_at: Date | null;
}

export interface CreateMessageData {
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
}

export class MessageModel {
  /**
   * Create or return existing message (idempotent via client_message_id).
   */
  static async createOrFind(data: CreateMessageData): Promise<{ message: Message; created: boolean }> {
    // Check for existing message first
    const existing = await this.findByClientId(data.sender_id, data.client_message_id);
    if (existing) return { message: existing, created: false };

    const id = generateId();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO messages
        (id, conversation_id, sender_id, receiver_id, client_message_id, message_type,
         message_text, file_url, file_name, file_size, mime_type, duration, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SENT')`,
      [
        id,
        data.conversation_id,
        data.sender_id,
        data.receiver_id,
        data.client_message_id,
        data.message_type,
        data.message_text || null,
        data.file_url || null,
        data.file_name || null,
        data.file_size || null,
        data.mime_type || null,
        data.duration || null,
      ]
    );

    const message = await this.findById(id);
    return { message: message!, created: true };
  }

  static async findById(id: string): Promise<Message | null> {
    const [rows] = await pool.execute<Message[]>('SELECT * FROM messages WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByClientId(senderId: string, clientMessageId: string): Promise<Message | null> {
    const [rows] = await pool.execute<Message[]>(
      'SELECT * FROM messages WHERE sender_id = ? AND client_message_id = ?',
      [senderId, clientMessageId]
    );
    return rows[0] || null;
  }

  static async getConversationMessages(
    conversationId: string,
    limit: number,
    cursor: string | null
  ): Promise<Message[]> {
    let query = 'SELECT * FROM messages WHERE conversation_id = ?';
    const params: unknown[] = [conversationId];

    if (cursor) {
      query += ' AND created_at < (SELECT created_at FROM messages WHERE id = ?)';
      params.push(cursor);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute<Message[]>(query, params);
    return rows.reverse(); // Return chronological order
  }

  static async markDelivered(messageId: string): Promise<void> {
    await pool.execute(
      `UPDATE messages SET status = 'DELIVERED', delivered_at = NOW()
       WHERE id = ? AND status IN ('SENT', 'SENDING')`,
      [messageId]
    );
  }

  static async markRead(messageId: string): Promise<void> {
    await pool.execute(
      `UPDATE messages SET status = 'READ', read_at = NOW()
       WHERE id = ? AND status != 'READ'`,
      [messageId]
    );
  }

  static async markAllReadInConversation(conversationId: string, receiverId: string): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE messages SET status = 'READ', read_at = NOW()
       WHERE conversation_id = ? AND receiver_id = ? AND status != 'READ'`,
      [conversationId, receiverId]
    );
    return result.affectedRows;
  }

  static async markAllDeliveredInConversation(conversationId: string, receiverId: string): Promise<Message[]> {
    const [undelivered] = await pool.execute<Message[]>(
      `SELECT * FROM messages WHERE conversation_id = ? AND receiver_id = ? AND status = 'SENT'`,
      [conversationId, receiverId]
    );
    if (undelivered.length > 0) {
      await pool.execute(
        `UPDATE messages SET status = 'DELIVERED', delivered_at = NOW()
         WHERE conversation_id = ? AND receiver_id = ? AND status = 'SENT'`,
        [conversationId, receiverId]
      );
    }
    return undelivered;
  }
}
