import { v4 as uuidv4 } from 'uuid';

/**
 * Normalize a mobile number to E.164 format.
 * Strips spaces, dashes, and parentheses.
 */
export function normalizeMobileNumber(number: string): string {
  return number.replace(/[\s\-().]/g, '');
}

/**
 * Mask a mobile number for display: +92300****567
 */
export function maskMobileNumber(number: string): string {
  if (number.length < 7) return number;
  const start = number.substring(0, number.length - 7);
  const end = number.substring(number.length - 3);
  return `${start}****${end}`;
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Add minutes to a Date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Check if a Date is in the past
 */
export function isExpired(date: Date): boolean {
  return new Date() > date;
}

/**
 * Parse pagination params safely
 */
export function parsePagination(limit?: string, cursor?: string): { limit: number; cursor: string | null } {
  return {
    limit: Math.min(parseInt(limit || '30', 10), 100),
    cursor: cursor || null,
  };
}

/**
 * Sleep for ms milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
