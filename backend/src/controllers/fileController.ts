import { Request, Response, NextFunction } from 'express';
import { saveFileToDisk } from '../services/storageService';
import { successResponse } from '../utils/errors';
import { env } from '../config/env';
import path from 'path';

const ALLOWED_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

const ALLOWED_VOICE_MIMES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/x-m4a',
];

// POST /api/upload/voice
export async function uploadVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No audio file provided' });
      return;
    }

    const mime = req.file.mimetype;
    if (!ALLOWED_VOICE_MIMES.includes(mime)) {
      res.status(400).json({ success: false, message: `Invalid audio format: ${mime}` });
      return;
    }

    const maxBytes = env.upload.maxFileSizeMb * 1024 * 1024;
    if (req.file.size > maxBytes) {
      res.status(400).json({ success: false, message: `File too large. Max ${env.upload.maxFileSizeMb}MB allowed.` });
      return;
    }

    const { url, filename, size } = await saveFileToDisk(
      req.file.buffer,
      req.file.originalname || 'voice.m4a',
      'voice'
    );

    res.json(successResponse({ url, filename, size, mime_type: mime }, 'Voice uploaded successfully'));
  } catch (err) {
    next(err);
  }
}

// POST /api/upload/document
export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file provided' });
      return;
    }

    const mime = req.file.mimetype;
    const ext = path.extname(req.file.originalname || '').toLowerCase().replace('.', '');

    const allowed = ALLOWED_DOC_MIMES.includes(mime) || env.upload.allowedDocTypes.includes(ext);
    if (!allowed) {
      res.status(400).json({ success: false, message: `File type not allowed: ${ext || mime}` });
      return;
    }

    const maxBytes = env.upload.maxFileSizeMb * 1024 * 1024;
    if (req.file.size > maxBytes) {
      res.status(400).json({ success: false, message: `File too large. Max ${env.upload.maxFileSizeMb}MB allowed.` });
      return;
    }

    const { url, filename, size } = await saveFileToDisk(
      req.file.buffer,
      req.file.originalname || 'document',
      'document'
    );

    res.json(
      successResponse(
        {
          url,
          filename: req.file.originalname,
          stored_filename: filename,
          size,
          mime_type: mime,
        },
        'Document uploaded successfully'
      )
    );
  } catch (err) {
    next(err);
  }
}
