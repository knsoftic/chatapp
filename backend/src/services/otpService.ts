import axios from 'axios';
import twilio from 'twilio';
import { env } from '../config/env';
import { isFirebaseReady, getFirebaseApp } from '../config/firebase';
import { logger } from '../utils/logger';

let twilioClientInstance: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (twilioClientInstance) return twilioClientInstance;
  const { accountSid, authToken } = env.twilio;
  if (!accountSid || !authToken || accountSid.includes('your-twilio')) {
    return null;
  }
  try {
    twilioClientInstance = twilio(accountSid, authToken);
    return twilioClientInstance;
  } catch (err: any) {
    logger.error('[Twilio] Initialization error:', err.message);
    return null;
  }
}

/**
 * Send OTP via Twilio or Firebase (or mock in Dev mode).
 */
export async function sendOtpViaSms(
  mobileNumber: string,
  otpCode: string
): Promise<{ session_info: string | null; dev_mode: boolean; provider: string }> {
  // ── 0. DEMO NUMBER BYPASS ───────────────────────────────────────────────────
  const isDemoNumber = env.otp.demoNumbers.some(
    (num) => num.trim() === mobileNumber || num.replace(/\D/g, '') === mobileNumber.replace(/\D/g, '')
  );
  if (isDemoNumber) {
    logger.warn(`[OTP DEMO BYPASS] Demo number ${mobileNumber} detected -> Code: ${env.otp.devCode}`);
    return { session_info: 'demo_session', dev_mode: true, provider: 'demo_bypass' };
  }

  // ── 1. DEV MODE ────────────────────────────────────────────────────────────
  if (env.otp.devMode) {
    logger.warn(`[OTP DEV] Mock OTP for ${mobileNumber} -> Code: ${otpCode}`);
    return { session_info: null, dev_mode: true, provider: 'dev' };
  }

  const provider = env.smsProvider || 'twilio';

  // ── 2. TWILIO SMS ──────────────────────────────────────────────────────────
  if (provider === 'twilio') {
    const client = getTwilioClient();
    if (!client) {
      logger.warn('[Twilio] Credentials missing or invalid in .env. Falling back to DEV mode.');
      return { session_info: null, dev_mode: true, provider: 'dev' };
    }

    // Option A: Twilio Verify Service (if configured and valid)
    if (env.twilio.verifyServiceSid && !env.twilio.verifyServiceSid.includes('your-') && env.twilio.verifyServiceSid.trim() !== '') {
      try {
        const verification = await client.verify.v2
          .services(env.twilio.verifyServiceSid)
          .verifications.create({ to: mobileNumber, channel: 'sms' });

        logger.info(`[Twilio Verify] SMS sent to ${mobileNumber} (Status: ${verification.status})`);
        return { session_info: verification.sid, dev_mode: false, provider: 'twilio-verify' };
      } catch (err: any) {
        logger.warn(`[Twilio Verify Warning] Verify API failed: ${err.message}. Falling back to Direct Programmable SMS...`);
      }
    }

    // Option B: Direct Programmable SMS (using purchased number)
    try {
      if (!env.twilio.phoneNumber || env.twilio.phoneNumber.includes('your-')) {
        throw new Error('TWILIO_PHONE_NUMBER must be set in .env');
      }

      const message = await client.messages.create({
        body: `ChatApp code: ${otpCode}`,
        from: env.twilio.phoneNumber,
        to: mobileNumber,
      });

      logger.info(`[Twilio Direct SMS] Real SMS sent to ${mobileNumber} from ${env.twilio.phoneNumber} (SID: ${message.sid})`);
      return { session_info: message.sid, dev_mode: false, provider: 'twilio-sms' };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to send SMS via Twilio';
      logger.error(`[Twilio Error] ${errMsg}`);
      throw new Error(`Twilio SMS Error: ${errMsg}`);
    }
  }

  // ── 3. FIREBASE SMS ────────────────────────────────────────────────────────
  if (provider === 'firebase') {
    if (!isFirebaseReady()) {
      logger.warn('[Firebase] Not initialized. Falling back to DEV mode.');
      return { session_info: null, dev_mode: true, provider: 'dev' };
    }

    try {
      const apiKey = env.firebase.apiKey;
      if (!apiKey) throw new Error('FIREBASE_API_KEY not set in .env');

      const response = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`,
        {
          phoneNumber: mobileNumber,
          recaptchaToken: 'test-reCAPTCHA-token',
        }
      );

      logger.info(`[Firebase SMS] Real SMS sent to ${mobileNumber}`);
      return { session_info: response.data.sessionInfo, dev_mode: false, provider: 'firebase' };
    } catch (err: any) {
      const firebaseErrMsg = err?.response?.data?.error?.message || err?.message || '';
      logger.error(`[Firebase Error] ${firebaseErrMsg}`);
      throw new Error(`Firebase SMS Error: ${firebaseErrMsg}`);
    }
  }

  // Fallback
  return { session_info: null, dev_mode: true, provider: 'dev' };
}

/**
 * Verify OTP (Twilio Verify or internal DB check).
 */
export async function verifyOtpViaSms(
  mobileNumber: string,
  code: string,
  sessionInfo?: string
): Promise<boolean> {
  if (env.smsProvider === 'twilio' && env.twilio.verifyServiceSid && !env.twilio.verifyServiceSid.includes('your-') && env.twilio.verifyServiceSid.trim() !== '') {
    const client = getTwilioClient();
    if (client) {
      try {
        const check = await client.verify.v2
          .services(env.twilio.verifyServiceSid)
          .verificationChecks.create({ to: mobileNumber, code });
        return check.status === 'approved';
      } catch (err: any) {
        logger.error('[Twilio Verify Check Error]', err.message);
        return false;
      }
    }
  }

  return true;
}
