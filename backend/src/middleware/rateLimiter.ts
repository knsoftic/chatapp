import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { errorResponse } from '../utils/errors';

export const globalRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.isDev ? 10000 : env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDev,
  handler: (_req, res) => {
    res.status(429).json(errorResponse('Too many requests, please try again later.', 'RATE_LIMITED'));
  },
});

export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isDev ? 1000 : env.rateLimit.otpMax,
  keyGenerator: (req) => (req.body?.mobile_number as string) || req.ip || 'unknown',
  skip: () => env.isDev,
  handler: (_req, res) => {
    res.status(429).json(
      errorResponse('Too many OTP requests. Try again in a few moments.', 'OTP_RATE_LIMITED')
    );
  },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.isDev ? 1000 : 30,
  skip: () => env.isDev,
  handler: (_req, res) => {
    res.status(429).json(errorResponse('Too many search requests.', 'RATE_LIMITED'));
  },
});
