export function normalizeModelRequest(request = {}) {
  const messages = Array.isArray(request.messages)
    ? request.messages
        .filter(message => message && typeof message === 'object')
        .map(message => ({
          role: message.role || 'user',
          content: String(message.content ?? message.text ?? '')
        }))
        .filter(message => message.content.trim())
    : [];

  if (!messages.length) {
    throw new Error('A model request requires at least one message.');
  }

  return {
    ...request,
    messages
  };
}
