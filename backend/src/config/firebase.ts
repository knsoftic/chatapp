import * as admin from 'firebase-admin';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;
let firebaseInitialized = false;

export function initFirebase(): admin.app.App {
  if (firebaseApp && firebaseInitialized) return firebaseApp;

  const isPlaceholder =
    !env.firebase.projectId ||
    env.firebase.projectId.includes('your-firebase') ||
    !env.firebase.privateKey ||
    env.firebase.privateKey.includes('YOUR_PRIVATE_KEY') ||
    env.firebase.privateKey.length < 100;

  if (isPlaceholder) {
    logger.warn('⚠️  Firebase credentials not configured. Running in OTP DEV mode only. Set real credentials in .env to enable live SMS OTP.');
    firebaseInitialized = false;
    return null as any;
  }

  try {
    // Format the private key — replace literal \n with real newlines
    const privateKey = env.firebase.privateKey.replace(/\\n/g, '\n');

    if (admin.apps.length > 0) {
      firebaseApp = admin.app();
    } else {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey,
        }),
        storageBucket: env.firebase.storageBucket,
      });
    }

    firebaseInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (err: any) {
    logger.error('❌ Firebase Admin SDK initialization failed:', err.message);
    logger.warn('Falling back to OTP DEV mode.');
    firebaseInitialized = false;
    return null as any;
  }
}

export function isFirebaseReady(): boolean {
  return firebaseInitialized && firebaseApp !== null;
}

export function getFirebaseApp(): admin.app.App | null {
  return firebaseApp;
}

export function getStorage(): admin.storage.Storage | null {
  if (!isFirebaseReady() || !firebaseApp) return null;
  return admin.storage(firebaseApp);
}
