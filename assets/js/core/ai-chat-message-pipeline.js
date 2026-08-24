import { createAIChatGateway } from './ai-chat-gateway.js';

export function createAIChatMessagePipeline(project, providerId, callbacks = {}) {
  const gateway = createAIChatGateway(project, providerId, callbacks);

  return {
    async send(chatId, content, options = {}) {
      if (!chatId) throw new Error('Chat ID is required.');
      if (!String(content || '').trim()) {
        throw new Error('Message content cannot be empty.');
      }

      return gateway.send(chatId, content, options);
    },

    open(chatId, options = {}) {
      return gateway.getSession(chatId, options.callbacks || {});
    },

    close(chatId) {
      return gateway.stop(chatId);
    },

    destroy(chatId) {
      return gateway.destroy(chatId);
    }
  };
}
