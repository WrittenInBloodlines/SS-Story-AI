function normalizeMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter(message => message && typeof message === 'object')
    .map(message => ({
      id: message.id || null,
      role: message.role || 'user',
      text: typeof message.text === 'string' ? message.text : '',
      status: message.status || 'complete',
      createdAt: message.createdAt || null,
      metadata: message.metadata || {}
    }));
}

function estimateCharacters(messages) {
  return messages.reduce((total, message) => total + message.text.length, 0);
}

function takeRecentMessages(messages, maxCharacters) {
  if (!Number.isFinite(maxCharacters) || maxCharacters <= 0) return [];

  const selected = [];
  let characters = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const nextCharacters = characters + message.text.length;

    if (selected.length > 0 && nextCharacters > maxCharacters) break;

    selected.unshift(message);
    characters = nextCharacters;
  }

  return selected;
}

export function createAIChatContextManager(options = {}) {
  const defaultMaxCharacters = Number.isFinite(options.maxCharacters)
    ? options.maxCharacters
    : 24000;

  return {
    build(messages, settings = {}) {
      const normalized = normalizeMessages(messages);
      const maxCharacters = Number.isFinite(settings.maxCharacters)
        ? settings.maxCharacters
        : defaultMaxCharacters;
      const recent = takeRecentMessages(normalized, maxCharacters);

      return {
        messages: recent,
        totalMessages: normalized.length,
        includedMessages: recent.length,
        estimatedCharacters: estimateCharacters(recent),
        omittedMessages: Math.max(0, normalized.length - recent.length),
        truncated: recent.length < normalized.length
      };
    },

    inspect(messages, settings = {}) {
      const normalized = normalizeMessages(messages);
      const maxCharacters = Number.isFinite(settings.maxCharacters)
        ? settings.maxCharacters
        : defaultMaxCharacters;
      const estimatedCharacters = estimateCharacters(normalized);

      return {
        totalMessages: normalized.length,
        estimatedCharacters,
        maxCharacters,
        nearLimit: estimatedCharacters >= maxCharacters * 0.8,
        overLimit: estimatedCharacters > maxCharacters,
        omittedIfTrimmed: Math.max(0, normalized.length - takeRecentMessages(normalized, maxCharacters).length)
      };
    }
  };
}
