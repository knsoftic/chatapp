import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { generateId } from '../utils/helpers';

export interface User extends RowDataPacket {
  id: string;
  mobile_number: string;
  country_code: string;
  email: string | null;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  bio: string | null;
  is_online: boolean;
  last_seen: Date | null;
  expo_push_token: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: string;
  mobile_number: string;
  first_name: string;
  last_name: string;
  profile_picture: string | null;
  bio: string | null;
  is_online: boolean;
  last_seen: Date | null;
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute<User[]>('SELECT * FROM users WHERE id = ? AND is_active = 1', [id]);
    return rows[0] || null;
  }

  static async findByMobile(mobile_number: string): Promise<User | null> {
    const [rows] = await pool.execute<User[]>(
      'SELECT * FROM users WHERE mobile_number = ?',
      [mobile_number]
    );
    return rows[0] || null;
  }

  static async create(data: {
    mobile_number: string;
    first_name: string;
    last_name: string;
    email?: string | null;
  }): Promise<User> {
    const id = generateId();
    await pool.execute<ResultSetHeader>(
      `INSERT INTO users (id, mobile_number, first_name, last_name, email)
       VALUES (?, ?, ?, ?, ?)`,
      [id, data.mobile_number, data.first_name, data.last_name, data.email || null]
    );
    return (await this.findById(id))!;
  }

  static async update(id: string, data: Partial<{
    first_name: string;
    last_name: string;
    email: string | null;
    bio: string | null;
    profile_picture: string | null;
    is_online: boolean;
    last_seen: Date;
    expo_push_token: string | null;
  }>): Promise<void> {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setClauses = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await pool.execute(`UPDATE users SET ${setClauses} WHERE id = ?`, values);
  }

  static async setOnline(id: string, isOnline: boolean): Promise<void> {
    if (isOnline) {
      await pool.execute('UPDATE users SET is_online = 1 WHERE id = ?', [id]);
    } else {
      await pool.execute(
        'UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?',
        [id]
      );
    }
  }

  static async searchByMobile(mobile_number: string, requesterId: string): Promise<PublicUser | null> {
    const [rows] = await pool.execute<User[]>(
      `SELECT id, mobile_number, first_name, last_name, profile_picture, bio, is_online, last_seen
       FROM users WHERE mobile_number = ? AND id != ? AND is_active = 1`,
      [mobile_number, requesterId]
    );
    return rows[0] || null;
  }

  static async deactivate(id: string): Promise<void> {
    await pool.execute(
      'UPDATE users SET is_active = 0, mobile_number = CONCAT("DELETED_", id, "_", mobile_number) WHERE id = ?',
      [id]
    );
  }

  static toPublic(user: User): PublicUser {
    return {
      id: user.id,
      mobile_number: user.mobile_number,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_picture: user.profile_picture,
      bio: user.bio,
      is_online: Boolean(user.is_online),
      last_seen: user.last_seen,
    };
  }
}
