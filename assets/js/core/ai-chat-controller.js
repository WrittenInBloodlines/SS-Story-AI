import { createAIChatService } from './ai-chat-service.js';
import { inspectChatWindow } from './chat-window-manager.js';

export function createAIChatController(project, providerId, callbacks = {}) {
  const service = createAIChatService(project, providerId);

  const notify = (name, payload) => {
    if (typeof callbacks[name] === 'function') {
      callbacks[name](payload);
    }
  };

  return {
    async send(chatId, content, options = {}) {
      notify('onStart', { chatId, content });

      try {
        const windowState = inspectChatWindow(project, chatId, options.windowPolicy);
        notify('onWindowState', windowState);

        const result = await service.sendMessage(chatId, content, {
          ...options,
          onToken: token => notify('onToken', { chatId, token })
        });

        notify('onComplete', { chatId, result });
        return result;
      } catch (error) {
        const normalizedError = error instanceof Error
          ? error
          : new Error(String(error));

        notify('onError', {
          chatId,
          error: normalizedError
        });

        throw normalizedError;
      }
    }
  };
}
