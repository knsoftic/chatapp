import { Request, Response, NextFunction } from 'express';
import { OTPModel } from '../models/OTP';
import { UserModel } from '../models/User';
import { normalizeMobileNumber } from '../utils/helpers';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { successResponse, AuthError, ValidationError } from '../utils/errors';
import { sendOtpSchema, verifyOtpSchema, registerSchema, refreshTokenSchema } from '../validators/schemas';
import { env } from '../config/env';
import { sendOtpViaSms } from '../services/otpService';

// POST /api/auth/send-otp
export async function sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = sendOtpSchema.parse(req.body);
    const mobile_number = normalizeMobileNumber(body.mobile_number);

    // Auto-detect purpose
    const existing = await UserModel.findByMobile(mobile_number);
    const purpose: 'LOGIN' | 'REGISTRATION' = (existing && existing.is_active) ? 'LOGIN' : 'REGISTRATION';

    // Check cooldown (skip in dev mode)
    if (!env.isDev) {
      const cooldown = await OTPModel.getCooldownSeconds(mobile_number, purpose);
      if (cooldown > 0) {
        res.status(429).json({
          success: false,
          message: `Please wait ${cooldown} seconds before requesting a new OTP`,
          code: 'OTP_COOLDOWN',
          data: { cooldown_seconds: cooldown },
        });
        return;
      }
    }

    const otp_code = env.otp.devMode
      ? env.otp.devCode
      : Math.floor(100000 + Math.random() * 900000).toString();

    // Send SMS (or mock in dev mode)
    const { session_info, dev_mode } = await sendOtpViaSms(mobile_number, otp_code);

    // Save OTP record to DB
    await OTPModel.create(mobile_number, otp_code, purpose, session_info || undefined);

    res.json(
      successResponse(
        {
          purpose,
          is_existing_user: Boolean(existing && existing.is_active),
          dev_mode,
          ...(dev_mode ? { dev_otp: otp_code } : {}),
          expires_in_minutes: env.otp.expiryMinutes,
          resend_cooldown_seconds: env.otp.resendCooldownSeconds,
        },
        'OTP sent successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-otp
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = verifyOtpSchema.parse(req.body);
    const mobile_number = normalizeMobileNumber(body.mobile_number);

    const result = await OTPModel.verify(mobile_number, body.otp_code, body.purpose);
    if (!result.success) {
      throw new ValidationError(result.error || 'OTP verification failed', 'OTP_INVALID');
    }

    if (body.purpose === 'LOGIN' || body.purpose === 'REGISTRATION') {
      const user = await UserModel.findByMobile(mobile_number);
      if (user && user.is_active) {
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        res.json(
          successResponse(
            {
              access_token: accessToken,
              refresh_token: refreshToken,
              user: UserModel.toPublic(user),
              is_new_user: false,
            },
            'Login successful'
          )
        );
        return;
      }
    }

    // New user — return OTP verification token for profile setup
    res.json(
      successResponse(
        {
          otp_token: result.token,
          mobile_number,
          is_new_user: true,
        },
        'OTP verified. Proceed to complete profile setup.'
      )
    );
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const mobile_number = normalizeMobileNumber(body.mobile_number);

    const isValidToken = await OTPModel.verifyOtpToken(mobile_number, body.otp_token);
    if (!isValidToken) {
      throw new AuthError('Invalid or expired verification session. Please start over.', 'OTP_TOKEN_INVALID');
    }

    const existing = await UserModel.findByMobile(mobile_number);
    if (existing && existing.is_active) {
      const accessToken = generateAccessToken(existing.id);
      const refreshToken = generateRefreshToken(existing.id);
      res.json(
        successResponse(
          { access_token: accessToken, refresh_token: refreshToken, user: UserModel.toPublic(existing) },
          'Account already exists — logged in.'
        )
      );
      return;
    }

    const user = await UserModel.create({
      mobile_number,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json(
      successResponse(
        { access_token: accessToken, refresh_token: refreshToken, user: UserModel.toPublic(user) },
        'Registration successful'
      )
    );
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = refreshTokenSchema.parse(req.body);
    const payload = verifyRefreshToken(body.refresh_token);
    const user = await UserModel.findById(payload.userId);
    if (!user || !user.is_active) throw new AuthError('User not found');
    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    res.json(successResponse({ access_token: accessToken, refresh_token: newRefreshToken }, 'Token refreshed'));
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(successResponse(null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
}
