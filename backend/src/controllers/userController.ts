import { Response, NextFunction } from 'express';
import pool from '../config/database';
import { UserModel, User } from '../models/User';
import { normalizeMobileNumber, maskMobileNumber } from '../utils/helpers';
import { successResponse, NotFoundError } from '../utils/errors';
import { updateProfileSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { DeviceTokenModel } from '../models/DeviceToken';
import xss from 'xss';

// GET /api/users/me
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.userId!);
    if (!user) throw new NotFoundError('User not found');
    res.json(successResponse(user));
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/me
export async function updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateProfileSchema.parse(req.body);
    const sanitized = {
      ...body,
      first_name: body.first_name ? xss(body.first_name) : undefined,
      last_name: body.last_name ? xss(body.last_name) : undefined,
      bio: body.bio ? xss(body.bio) : body.bio,
    };
    await UserModel.update(req.userId!, sanitized);
    const user = await UserModel.findById(req.userId!);
    res.json(successResponse(UserModel.toPublic(user!), 'Profile updated'));
  } catch (err) {
    next(err);
  }
}

// GET /api/users/search?q=:mobile
export async function searchUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 7) {
      res.status(400).json({ success: false, message: 'Enter a valid mobile number', code: 'INVALID_QUERY' });
      return;
    }
    const mobile_number = normalizeMobileNumber(q.trim());
    const user = await UserModel.searchByMobile(mobile_number, req.userId!);
    if (!user) {
      res.json(successResponse(null, 'User not found'));
      return;
    }
    const result = {
      ...user,
      mobile_number_masked: maskMobileNumber(user.mobile_number),
    };
    res.json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

// POST /api/users/sync-contacts
export async function syncContacts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawNumbers: string[] = req.body.phone_numbers || [];
    if (!Array.isArray(rawNumbers) || rawNumbers.length === 0) {
      res.json(successResponse({ on_app: [], not_on_app: [] }));
      return;
    }

    const normalizedMap = new Map<string, string>();
    rawNumbers.forEach((num) => {
      if (typeof num === 'string' && num.trim().length >= 7) {
        const norm = normalizeMobileNumber(num);
        if (norm) normalizedMap.set(norm, num);
      }
    });

    const normList = Array.from(normalizedMap.keys());
    if (normList.length === 0) {
      res.json(successResponse({ on_app: [], not_on_app: [] }));
      return;
    }

    // Escape question marks for MySQL IN clause
    const placeholders = normList.map(() => '?').join(',');
    const [rows] = await pool.execute<User[]>(
      `SELECT id, mobile_number, first_name, last_name, bio, profile_picture
       FROM users WHERE is_active = 1 AND id != ? AND mobile_number IN (${placeholders})`,
      [req.userId!, ...normList]
    );

    const onAppMobiles = new Set(rows.map((u) => u.mobile_number));
    const notOnApp: string[] = [];

    normalizedMap.forEach((orig, norm) => {
      if (!onAppMobiles.has(norm)) {
        notOnApp.push(orig);
      }
    });

    res.json(
      successResponse({
        on_app: rows.map((u) => UserModel.toPublic(u)),
        not_on_app: notOnApp,
      })
    );
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id
export async function getUserById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user || !user.is_active) throw new NotFoundError('User not found');
    res.json(successResponse(UserModel.toPublic(user)));
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/me
export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await DeviceTokenModel.removeAllForUser(req.userId!);
    await UserModel.deactivate(req.userId!);
    res.json(successResponse(null, 'Account deleted successfully'));
  } catch (err) {
    next(err);
  }
}
