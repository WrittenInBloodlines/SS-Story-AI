export const CHAT_STOP_REASONS = Object.freeze({
  USER: 'user',
  WINDOW_LIMIT: 'window-limit',
  NAVIGATION: 'navigation',
  ERROR: 'error',
  REPLACED: 'replaced'
});

export function normalizeStopReason(reason) {
  if (!reason) return CHAT_STOP_REASONS.USER;
  return Object.values(CHAT_STOP_REASONS).includes(reason)
    ? reason
    : CHAT_STOP_REASONS.USER;
}
