// ── Color Palette ─────────────────────────────────────────────────────────
export const Colors = {
  // Primary brand
  primary: '#4F46E5',       // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',

  // Accent
  accent: '#06B6D4',        // Cyan
  accentLight: '#67E8F9',

  // Success
  success: '#10B981',
  successLight: '#6EE7B7',

  // Warning
  warning: '#F59E0B',

  // Error
  error: '#EF4444',
  errorLight: '#FCA5A5',

  // Chat bubbles
  outgoing: '#4F46E5',
  outgoingText: '#FFFFFF',
  incoming: '#1E2139',
  incomingText: '#E2E8F0',

  // Status
  online: '#10B981',
  offline: '#6B7280',
  delivered: '#6B7280',
  read: '#06B6D4',

  // Dark theme (default)
  dark: {
    background: '#0A0E1A',
    surface: '#111827',
    surfaceElevated: '#1A2035',
    card: '#1E2139',
    border: '#2D3748',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    placeholder: '#475569',
    inputBg: '#1A2035',
    headerBg: '#111827',
    tabBar: '#111827',
    divider: '#1E2139',
    skeleton: '#1E2139',
    skeletonHighlight: '#2D3748',
  },

  // Light theme
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    placeholder: '#CBD5E1',
    inputBg: '#F1F5F9',
    headerBg: '#FFFFFF',
    tabBar: '#FFFFFF',
    divider: '#E2E8F0',
    skeleton: '#E2E8F0',
    skeletonHighlight: '#F1F5F9',
  },
};

export type ThemeMode = 'dark' | 'light';
