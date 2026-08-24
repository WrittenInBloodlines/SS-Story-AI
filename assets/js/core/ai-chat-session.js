import { createAIChatController } from './ai-chat-controller.js';

export function createAIChatSession(project, chatId, providerId, callbacks = {}) {
  const controller = createAIChatController(project, providerId, callbacks);
  let active = false;
  let destroyed = false;

  return {
    get isActive() {
      return active && !destroyed;
    },

    start() {
      if (destroyed) throw new Error('Chat session has been destroyed.');
      active = true;
      callbacks.onSessionStart?.({ chatId, providerId });
      return this;
    },

    async send(content, options = {}) {
      if (destroyed) throw new Error('Chat session has been destroyed.');
      if (!active) this.start();

      return controller.send(chatId, content, options);
    },

    stop() {
      if (destroyed) return;
      active = false;
      callbacks.onSessionStop?.({ chatId, providerId });
    },

    destroy() {
      if (destroyed) return;
      active = false;
      destroyed = true;
      callbacks.onSessionDestroy?.({ chatId, providerId });
    }
  };
}
