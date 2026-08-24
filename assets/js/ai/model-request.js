export function createModelRequest({ messages = [], model, temperature, maxTokens, stream = true } = {}) {
  if (!model) throw new Error('A model is required.');

  return {
    model,
    messages: messages.map(message => ({
      role: message.role,
      content: typeof message.content === 'string' ? message.content : String(message.text || '')
    })),
    ...(Number.isFinite(temperature) ? { temperature } : {}),
    ...(Number.isFinite(maxTokens) ? { max_tokens: maxTokens } : {}),
    stream
  };
}
