export const logger = {
  log: (...args: unknown[]) => {
    if (__DEV__) console.log('[ChatApp]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn('[ChatApp]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ChatApp]', ...args);
  },
};
