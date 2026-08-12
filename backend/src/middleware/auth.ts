import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthError } from '../utils/errors';
import { UserModel } from '../models/User';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    mobile_number: string;
    first_name: string;
    last_name: string;
  };
}

export async function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthError('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.jwt.secret) as { userId: string };
    const user = await UserModel.findById(payload.userId);
    if (!user || !user.is_active) {
      return next(new AuthError('User not found or inactive'));
    }
    req.userId = user.id;
    req.user = {
      id: user.id,
      mobile_number: user.mobile_number,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AuthError('Token expired', 'TOKEN_EXPIRED'));
    }
    return next(new AuthError('Invalid token'));
  }
}

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.jwt.secret, { expiresIn: env.jwt.expiresIn as string });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn as string });
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.jwt.refreshSecret) as { userId: string };
}
