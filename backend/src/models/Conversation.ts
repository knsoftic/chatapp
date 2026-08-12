import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateId } from '../utils/helpers';

export interface Conversation extends RowDataPacket {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationWithParticipant extends RowDataPacket {
  id: string;
  created_at: Date;
  updated_at: Date;
  other_user_id: string;
  other_user_first_name: string;
  other_user_last_name: string;
  other_user_profile_picture: string | null;
  other_user_is_online: boolean;
  other_user_last_seen: Date | null;
  last_message_text: string | null;
  last_message_type: string | null;
  last_message_at: Date | null;
  last_message_sender_id: string | null;
  unread_count: number;
}

export class ConversationModel {
  /**
   * Find an existing 1-on-1 conversation between two users.
   */
  static async findBetweenUsers(userA: string, userB: string): Promise<Conversation | null> {
    const [rows] = await pool.execute<Conversation[]>(
      `SELECT c.*
       FROM conversations c
       JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = ?
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = ?`,
      [userA, userB]
    );
    return rows[0] || null;
  }

  /**
   * Create a new 1-on-1 conversation and add participants.
   */
  static async createBetweenUsers(userA: string, userB: string): Promise<Conversation> {
    const id = generateId();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute<ResultSetHeader>('INSERT INTO conversations (id) VALUES (?)', [id]);
      await conn.execute<ResultSetHeader>(
        'INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)',
        [generateId(), id, userA]
      );
      await conn.execute<ResultSetHeader>(
        'INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)',
        [generateId(), id, userB]
      );
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    const [rows] = await pool.execute<Conversation[]>('SELECT * FROM conversations WHERE id = ?', [id]);
    return rows[0];
  }

  /**
   * Get or create a conversation between two users.
   */
  static async getOrCreate(userA: string, userB: string): Promise<{ conversation: Conversation; created: boolean }> {
    let conversation = await this.findBetweenUsers(userA, userB);
    if (conversation) return { conversation, created: false };
    conversation = await this.createBetweenUsers(userA, userB);
    return { conversation, created: true };
  }

  /**
   * List all conversations for a user with last message + unread count.
   */
  static async listForUser(userId: string): Promise<ConversationWithParticipant[]> {
    const [rows] = await pool.execute<ConversationWithParticipant[]>(
      `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        u.id AS other_user_id,
        u.first_name AS other_user_first_name,
        u.last_name AS other_user_last_name,
        u.profile_picture AS other_user_profile_picture,
        u.is_online AS other_user_is_online,
        u.last_seen AS other_user_last_seen,
        lm.message_text AS last_message_text,
        lm.message_type AS last_message_type,
        lm.created_at AS last_message_at,
        lm.sender_id AS last_message_sender_id,
        (SELECT COUNT(*) FROM messages m2
          WHERE m2.conversation_id = c.id
          AND m2.receiver_id = ?
          AND m2.status != 'READ') AS unread_count
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ?
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id != ?
       JOIN users u ON u.id = cp2.user_id AND u.is_active = 1
       LEFT JOIN messages lm ON lm.id = (
         SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1
       )
       ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
      [userId, userId, userId]
    );
    return rows;
  }

  /**
   * Check if a user is a participant of a conversation.
   */
  static async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, userId]
    );
    return rows.length > 0;
  }

  /**
   * Get the other participant ID in a conversation.
   */
  static async getOtherParticipantId(conversationId: string, userId: string): Promise<string | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ?',
      [conversationId, userId]
    );
    return (rows[0] as { user_id: string })?.user_id || null;
  }

  /**
   * Touch updated_at on a conversation.
   */
  static async touch(conversationId: string): Promise<void> {
    await pool.execute('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversationId]);
  }
}
