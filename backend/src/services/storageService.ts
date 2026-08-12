import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const UPLOAD_DIR = path.join(process.cwd(), env.upload.localUploadDir);
const VOICE_DIR = path.join(UPLOAD_DIR, 'voice');
const DOCS_DIR = path.join(UPLOAD_DIR, 'documents');
const PROFILE_DIR = path.join(UPLOAD_DIR, 'profiles');

// Ensure all upload directories exist on startup
export function ensureUploadDirs(): void {
  [UPLOAD_DIR, VOICE_DIR, DOCS_DIR, PROFILE_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
}

/**
 * Build a public URL for a locally stored file
 */
function buildPublicUrl(subPath: string, filename: string): string {
  // In dev, use local IP with port 5000
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://172.20.10.2:5000`;
  return `${baseUrl}/uploads/${subPath}/${filename}`;
}

/**
 * Save a file buffer to disk and return its public URL
 */
export async function saveFileToDisk(
  buffer: Buffer,
  originalName: string,
  type: 'voice' | 'document' | 'profile'
): Promise<{ url: string; filename: string; size: number }> {
  const ext = path.extname(originalName) || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}_${random}${ext}`;

  let destDir: string;
  let subPath: string;

  switch (type) {
    case 'voice':
      destDir = VOICE_DIR;
      subPath = 'voice';
      break;
    case 'document':
      destDir = DOCS_DIR;
      subPath = 'documents';
      break;
    case 'profile':
      destDir = PROFILE_DIR;
      subPath = 'profiles';
      break;
  }

  const filePath = path.join(destDir, filename);
  fs.writeFileSync(filePath, buffer);

  const url = buildPublicUrl(subPath, filename);
  logger.info(`File saved: ${filePath} → ${url}`);

  return { url, filename, size: buffer.length };
}

/**
 * Delete a file from disk by its public URL
 */
export async function deleteFileFromDisk(publicUrl: string): Promise<void> {
  try {
    const urlPath = new URL(publicUrl).pathname; // e.g. /uploads/voice/xyz.mp4
    const filePath = path.join(process.cwd(), urlPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`File deleted: ${filePath}`);
    }
  } catch (err) {
    logger.warn('Failed to delete file:', err);
  }
}
