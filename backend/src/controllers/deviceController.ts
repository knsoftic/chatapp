import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DeviceTokenModel } from '../models/DeviceToken';
import { successResponse } from '../utils/errors';
import { registerDeviceSchema } from '../validators/schemas';

// POST /api/devices/register
export async function registerDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = registerDeviceSchema.parse(req.body);
    await DeviceTokenModel.upsert(req.userId!, body.expo_push_token, body.platform);
    res.json(successResponse(null, 'Device registered'));
  } catch (err) {
    next(err);
  }
}

// DELETE /api/devices/:token
export async function removeDevice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await DeviceTokenModel.remove(req.params.token);
    res.json(successResponse(null, 'Device removed'));
  } catch (err) {
    next(err);
  }
}
