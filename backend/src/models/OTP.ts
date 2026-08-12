import pool from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import { generateId, addMinutes } from '../utils/helpers';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface OTP extends RowDataPacket {
  id: string;
  mobile_number: string;
  otp_hash: string;
  session_info: string | null;
  purpose: 'REGISTRATION' | 'LOGIN';
  expires_at: Date;
  attempts: number;
  is_verified: boolean;
  created_at: Date;
}

export class OTPModel {
  static async create(
    mobile_number: string,
    otp_code: string,
    purpose: 'REGISTRATION' | 'LOGIN',
    session_info?: string
  ): Promise<string> {
    // Invalidate any previous OTPs for this number
    await pool.execute(
      'UPDATE otps SET is_verified = 1 WHERE mobile_number = ? AND is_verified = 0',
      [mobile_number]
    );

    const id = generateId();
    const otp_hash = await bcrypt.hash(otp_code, 10);
    const expires_at = addMinutes(new Date(), env.otp.expiryMinutes);

    await pool.execute<ResultSetHeader>(
      `INSERT INTO otps (id, mobile_number, otp_hash, session_info, purpose, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, mobile_number, otp_hash, session_info || null, purpose, expires_at]
    );
    logger.info(`[OTP DB] Created OTP session ${id} for ${mobile_number} (Purpose: ${purpose})`);
    return id;
  }

  static async findLatestUnverified(
    mobile_number: string,
    purpose?: 'REGISTRATION' | 'LOGIN'
  ): Promise<OTP | null> {
    let query = `SELECT * FROM otps WHERE mobile_number = ? AND is_verified = 0`;
    const params: any[] = [mobile_number];

    if (purpose) {
      query += ` AND purpose = ?`;
      params.push(purpose);
    }

    query += ` ORDER BY created_at DESC LIMIT 1`;
    const [rows] = await pool.execute<OTP[]>(query, params);
    return rows[0] || null;
  }

  static async incrementAttempts(id: string): Promise<number> {
    await pool.execute('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', [id]);
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT attempts FROM otps WHERE id = ?', [id]);
    return (rows[0] as { attempts: number })?.attempts || 0;
  }

  static async markVerified(id: string): Promise<string> {
    await pool.execute('UPDATE otps SET is_verified = 1 WHERE id = ?', [id]);
    return id;
  }

  static async verifyOtpToken(mobile_number: string, otpToken: string): Promise<boolean> {
    const [rows] = await pool.execute<OTP[]>(
      `SELECT * FROM otps WHERE id = ? AND mobile_number = ? AND is_verified = 1`,
      [otpToken, mobile_number]
    );
    return rows.length > 0;
  }

  static async verify(mobile_number: string, otp_code: string, purpose: 'REGISTRATION' | 'LOGIN'): Promise<{
    success: boolean;
    error?: string;
    token?: string;
  }> {
    logger.info(`[OTP Verify Request] Number: ${mobile_number}, Purpose: ${purpose}, Input Code: ${otp_code}`);

    // ── DEV MODE OVERRIDE ──────────────────────────────────────────────────
    if (env.otp.devMode && otp_code === env.otp.devCode) {
      let otp = await this.findLatestUnverified(mobile_number, purpose);
      if (!otp) {
        otp = await this.findLatestUnverified(mobile_number);
      }
      if (otp) {
        const token = await this.markVerified(otp.id);
        return { success: true, token };
      }
      const dummyId = await this.create(mobile_number, env.otp.devCode, purpose);
      const token = await this.markVerified(dummyId);
      return { success: true, token };
    }

    // ── PRODUCTION VERIFICATION ───────────────────────────────────────────
    let otp = await this.findLatestUnverified(mobile_number, purpose);
    if (!otp) {
      // Fallback: check any unverified OTP for this number regardless of purpose
      otp = await this.findLatestUnverified(mobile_number);
    }

    if (!otp) {
      logger.warn(`[OTP Verify Failed] No unverified OTP session found for ${mobile_number}`);
      return { success: false, error: 'OTP session not found. Please request a new code.' };
    }

    // Check expiration using JS timestamp comparison (immune to DB timezone mismatches)
    const expiresAtTime = new Date(otp.expires_at).getTime();
    if (Date.now() > expiresAtTime) {
      logger.warn(`[OTP Verify Failed] OTP session ${otp.id} expired at ${otp.expires_at}`);
      return { success: false, error: 'OTP code has expired. Please request a new code.' };
    }

    if (otp.attempts >= env.otp.maxAttempts) {
      logger.warn(`[OTP Verify Failed] Max attempts (${env.otp.maxAttempts}) exceeded for session ${otp.id}`);
      return { success: false, error: 'Maximum OTP attempts exceeded. Please request a new code.' };
    }

    const attempts = await this.incrementAttempts(otp.id);
    const isValid = await bcrypt.compare(otp_code, otp.otp_hash);

    if (!isValid) {
      const remaining = env.otp.maxAttempts - attempts;
      logger.warn(`[OTP Verify Failed] Invalid code entered for ${mobile_number}. Attempts left: ${remaining}`);
      return { success: false, error: `Invalid OTP code. ${remaining} attempt(s) remaining.` };
    }

    const token = await this.markVerified(otp.id);
    logger.info(`[OTP Verify Success] Session ${otp.id} verified successfully for ${mobile_number}`);
    return { success: true, token };
  }

  static async getCooldownSeconds(mobile_number: string, purpose: 'REGISTRATION' | 'LOGIN'): Promise<number> {
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as request_count FROM otps
       WHERE mobile_number = ? AND created_at > NOW() - INTERVAL 1 HOUR`,
      [mobile_number]
    );
    const requestCount = (countRows[0] as { request_count: number })?.request_count || 0;

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT created_at FROM otps
       WHERE mobile_number = ?
       ORDER BY created_at DESC LIMIT 1`,
      [mobile_number]
    );
    if (!rows[0]) return 0;

    const createdAt = new Date((rows[0] as { created_at: Date }).created_at);
    const elapsed = (Date.now() - createdAt.getTime()) / 1000;

    // 1st request: 60s (1 min), 2nd request: 600s (10 mins - 10x), 3rd+ request: 6000s
    let baseCooldown = env.otp.resendCooldownSeconds || 60;
    if (requestCount === 2) {
      baseCooldown = baseCooldown * 10; // 600s (10 minutes)
    } else if (requestCount >= 3) {
      baseCooldown = baseCooldown * 100; // 6000s
    }

    const cooldown = baseCooldown - elapsed;
    return Math.max(0, Math.ceil(cooldown));
  }
}
