import { Request, Response, NextFunction } from 'express';
import { AppError, errorResponse } from '../utils/errors';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message, err.code));
    return;
  }

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(400).json(errorResponse(messages, 'VALIDATION_ERROR'));
    return;
  }

  // Duplicate entry (MySQL)
  if ((err as NodeJS.ErrnoException).code === 'ER_DUP_ENTRY') {
    res.status(409).json(errorResponse('Duplicate entry', 'DUPLICATE_ENTRY'));
    return;
  }

  logger.error('Unhandled error', err);
  res.status(500).json(errorResponse('An unexpected error occurred', 'INTERNAL_ERROR'));
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(errorResponse(`Route ${req.originalUrl} not found`, 'NOT_FOUND'));
}
