import { assembleChatContext } from './chat-context-assembler.js';
import { createModelRequest } from './model-request.js';
import { resolveModelService } from './model-runtime.js';

export function createAIChatService(project, providerId) {
  return {
    async sendMessage(chatId, content, options = {}) {
      if (!project || !chatId) {
        throw new Error('Project and chat ID are required.');
      }

      const text = String(content || '').trim();
      if (!text) {
        throw new Error('Message content cannot be empty.');
      }

      const context = assembleChatContext(project, chatId, {
        ...options,
        query: text
      });
      const service = resolveModelService(providerId);

      if (!service) {
        throw new Error(`No model service is registered for provider: ${providerId}`);
      }

      const request = createModelRequest(service.provider, context, {
        ...options,
        messages: [{ role: 'user', content: text }],
        stream: options.stream !== false
      });

      if (request.stream) {
        return service.stream(context, {
          ...options,
          messages: request.messages,
          attachments: request.attachments
        }, options.onToken || (() => {}));
      }

      return service.generate(context, {
        ...options,
        messages: request.messages,
        attachments: request.attachments
      });
    }
  };
}
