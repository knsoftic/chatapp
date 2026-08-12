import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';

import { validateEnv, env } from './config/env';
import { testConnection } from './config/database';
import { initFirebase } from './config/firebase';
import { initSocketIO } from './sockets/socketHandler';
import { logger } from './utils/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { ensureUploadDirs } from './services/storageService';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import fileRoutes from './routes/files';
import deviceRoutes from './routes/devices';

async function bootstrap() {
  // Validate environment
  validateEnv();

  const app = express();
  const httpServer = http.createServer(app);

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        // In development, allow all origins (localhost, IP addresses, mobile devices)
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // ── Performance ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Parsing ───────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Logging ───────────────────────────────────────────────────────────────
  app.use(
    morgan(env.isDev ? 'dev' : 'combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  app.use('/api/', globalRateLimiter);

  // ── Static Files (local dev uploads) ─────────────────────────────────────
  app.use('/uploads', express.static(path.join(process.cwd(), env.upload.localUploadDir)));

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.nodeEnv });
  });

  // ── API Routes ────────────────────────────────────────────────────────────
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/upload', fileRoutes);
  app.use('/api/devices', deviceRoutes);

  // ── 404 ───────────────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Error Handler ─────────────────────────────────────────────────────────
  app.use(errorHandler);

  // ── Database ──────────────────────────────────────────────────────────────
  await testConnection();

  // ── Local File Storage Directories ───────────────────────────────────────
  ensureUploadDirs();
  logger.info('📁 Local disk storage ready (uploads/ folder)');

  // ── Firebase (Phone Auth only, no Storage) ────────────────────────────────
  initFirebase();

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  initSocketIO(httpServer);

  // ── Start ─────────────────────────────────────────────────────────────────
  httpServer.listen(env.port, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`🌐 Network access: http://172.20.10.2:${env.port}`);
    if (env.otp.devMode) {
      logger.warn(`⚠️  OTP DEV MODE ACTIVE — dev OTP code: ${env.otp.devCode}`);
    }
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
