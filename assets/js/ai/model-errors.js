export function normalizeModelError(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown model error');
  const lower = message.toLowerCase();

  let type = 'unknown';
  if (lower.includes('401') || lower.includes('api key') || lower.includes('unauthorized')) type = 'authentication';
  else if (lower.includes('403') || lower.includes('forbidden')) type = 'permission';
  else if (lower.includes('404') || lower.includes('endpoint') || lower.includes('model')) type = 'configuration';
  else if (lower.includes('429') || lower.includes('rate')) type = 'rate-limit';
  else if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) type = 'network';

  return { type, message, retryable: type === 'network' || type === 'rate-limit' };
}
