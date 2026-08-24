import { createAIChatUIBridge } from './ai-chat-ui-bridge.js';

export function createAIChatMessagePipeline(project, providerId, callbacks = {}) {
  const bridge = createAIChatUIBridge(null, callbacks);

  return {
    async send(chatId, content, options = {}) {
      if (!chatId) throw new Error('Chat ID is required.');
      if (!String(content || '').trim()) {
        throw new Error('Message content cannot be empty.');
      }

      return bridge.send(chatId, content, {
        ...options,
        project,
        providerId
      });
    }
  };
}
