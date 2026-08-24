import { createAIChatPersistence } from './ai-chat-persistence.js';
import { createAIChatMessageStore } from './ai-chat-message-store.js';

export function createAIChatHistory(options = {}) {
  const persistence = options.persistence || createAIChatPersistence(options.storage);
  const store = options.store || createAIChatMessageStore();
  const loadedChats = new Set();

  function ensureLoaded(chatId) {
    if (loadedChats.has(chatId)) return;

    const savedMessages = persistence.load(chatId);
    for (const message of savedMessages) {
      store.add(chatId, message);
    }

    loadedChats.add(chatId);
  }

  function persist(chatId) {
    persistence.save(chatId, store.getAll(chatId));
  }

  return {
    load(chatId) {
      ensureLoaded(chatId);
      return store.getAll(chatId);
    },

    add(chatId, message) {
      ensureLoaded(chatId);
      const stored = store.add(chatId, message);
      persist(chatId);
      return stored;
    },

    update(chatId, messageId, changes = {}) {
      ensureLoaded(chatId);
      const updated = store.update(chatId, messageId, changes);
      if (updated) persist(chatId);
      return updated;
    },

    remove(chatId, messageId) {
      ensureLoaded(chatId);
      const removed = store.remove(chatId, messageId);
      if (removed) persist(chatId);
      return removed;
    },

    clear(chatId) {
      ensureLoaded(chatId);
      store.clear(chatId);
      persistence.remove(chatId);
      loadedChats.delete(chatId);
    },

    reload(chatId) {
      store.clear(chatId);
      loadedChats.delete(chatId);
      ensureLoaded(chatId);
      return store.getAll(chatId);
    }
  };
}
