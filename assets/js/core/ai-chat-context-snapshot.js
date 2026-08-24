export function createAIChatContextSnapshot(history, options = {}) {
  const messages = Array.isArray(history) ? history : [];
  const maxMessages = Number.isInteger(options.maxMessages) && options.maxMessages > 0
    ? options.maxMessages
    : messages.length;

  const selected = messages.slice(-maxMessages);

  return {
    version: 1,
    chatId: options.chatId || null,
    generatedAt: new Date().toISOString(),
    messageCount: messages.length,
    messages: selected.map(message => ({
      id: message.id,
      role: message.role,
      text: message.text || '',
      status: message.status || 'complete',
      metadata: message.metadata || {}
    }))
  };
}

export function getSnapshotText(snapshot) {
  if (!snapshot?.messages) return '';

  return snapshot.messages
    .map(message => `${message.role}: ${message.text}`)
    .join('\n');
}
