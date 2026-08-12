// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://192.168.100.212:5000/api'
  : 'https://chatappserver.knsoftic.com/api';

export const SOCKET_URL = __DEV__
  ? 'http://192.168.100.212:5000'
  : 'https://chatappserver.knsoftic.com';


// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME_MODE: 'theme_mode',
  NOTIFICATION_SETTINGS: 'notification_settings',
};

// Pagination
export const PAGE_SIZE = 30;

// Message
export const MAX_TEXT_LENGTH = 10000;
export const MAX_FILE_SIZE_MB = 50;

// OTP
export const OTP_LENGTH = 6;
export const OTP_RESEND_COOLDOWN = 60; // seconds

// Voice
export const MAX_VOICE_DURATION_SECONDS = 120;

// Responsive Breakpoints
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};
