import { z } from 'zod';

export const sendOtpSchema = z.object({
  mobile_number: z
    .string()
    .min(7, 'Mobile number too short')
    .max(20, 'Mobile number too long')
    .regex(/^\+?[0-9\s\-().]+$/, 'Invalid mobile number format'),
  purpose: z.enum(['LOGIN', 'REGISTRATION']).default('LOGIN'),
});

export const verifyOtpSchema = z.object({
  mobile_number: z.string().min(7).max(20),
  otp_code: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must be digits'),
  purpose: z.enum(['LOGIN', 'REGISTRATION']).default('LOGIN'),
});

export const registerSchema = z.object({
  mobile_number: z.string().min(7).max(20),
  otp_token: z.string().min(1, 'OTP token required'),
  first_name: z.string().min(1).max(100).trim(),
  last_name: z.string().min(1).max(100).trim(),
  email: z.string().email().optional().nullable(),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1),
});

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  client_message_id: z.string().min(1).max(100),
  message_type: z.enum(['TEXT', 'VOICE', 'DOCUMENT', 'IMAGE', 'SYSTEM']).default('TEXT'),
  message_text: z.string().max(10000).optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  file_name: z.string().max(500).optional().nullable(),
  file_size: z.number().positive().optional().nullable(),
  mime_type: z.string().max(255).optional().nullable(),
  duration: z.number().positive().optional().nullable(),
});

export const createConversationSchema = z.object({
  participant_id: z.string().uuid('Invalid user ID'),
});

export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).trim().optional(),
  last_name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  profile_picture: z.string().url().optional().nullable(),
});

export const registerDeviceSchema = z.object({
  expo_push_token: z.string().min(1).max(500),
  platform: z.enum(['android', 'ios', 'web']),
});
