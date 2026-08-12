import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatMessageTime(dateStr: string): string {
  const date = parseISO(dateStr);
  return format(date, 'h:mm a');
}

export function formatConversationTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MM/dd/yyyy');
}

export function formatLastSeen(dateStr: string | null | undefined): string {
  if (!dateStr) return 'last seen a while ago';
  try {
    return `last seen ${formatDistanceToNow(parseISO(dateStr), { addSuffix: true })}`;
  } catch {
    return 'last seen a while ago';
  }
}

export function formatDateSeparator(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

export function shouldShowDateSeparator(prev: string | undefined, current: string): boolean {
  if (!prev) return true;
  const prevDate = parseISO(prev);
  const currentDate = parseISO(current);
  return format(prevDate, 'yyyy-MM-dd') !== format(currentDate, 'yyyy-MM-dd');
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateClientMessageId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}
