import { createAIChatSession } from './ai-chat-session.js';

export function createAIChatGateway(project, providerId, callbacks = {}) {
  const sessions = new Map();

  function getOrCreateSession(chatId, sessionCallbacks = {}) {
    if (!sessions.has(chatId)) {
      sessions.set(
        chatId,
        createAIChatSession(project, chatId, providerId, {
          ...callbacks,
          ...sessionCallbacks
        })
      );
    }

    return sessions.get(chatId);
  }

  return {
    getSession(chatId, sessionCallbacks = {}) {
      if (!chatId) throw new Error('Chat ID is required.');
      return getOrCreateSession(chatId, sessionCallbacks);
    },

    async send(chatId, content, options = {}) {
      const session = getOrCreateSession(chatId, options.callbacks || {});
      return session.send(content, options);
    },

    stop(chatId) {
      const session = sessions.get(chatId);
      if (!session) return false;
      session.stop();
      return true;
    },

    destroy(chatId) {
      const session = sessions.get(chatId);
      if (!session) return false;
      session.destroy();
      sessions.delete(chatId);
      return true;
    },

    destroyAll() {
      for (const session of sessions.values()) {
        session.destroy();
      }
      sessions.clear();
    }
  };
}
