import { createAIChatPersistence } from './ai-chat-persistence.js';
import { createAIChatMessageStore } from './ai-chat-message-store.js';
import { createAIChatHistory } from './ai-chat-history.js';

export function createAIChatRuntime(options = {}) {
  const store = options.store || createAIChatMessageStore();
  const persistence = options.persistence || createAIChatPersistence(options.storage);
  const history = options.history || createAIChatHistory({ store, persistence });
  const activeChats = new Map();

  function ensureChat(chatId) {
    if (!chatId) throw new Error('Chat ID is required.');
    if (!activeChats.has(chatId)) {
      history.load(chatId);
      activeChats.set(chatId, {
        chatId,
        openedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString()
      });
    }
    return activeChats.get(chatId);
  }

  function touch(chatId) {
    const session = ensureChat(chatId);
    session.lastActivityAt = new Date().toISOString();
    return session;
  }

  return {
    open(chatId) {
      return { ...ensureChat(chatId) };
    },

    close(chatId) {
      if (!activeChats.has(chatId)) return false;
      activeChats.delete(chatId);
      return true;
    },

    getMessages(chatId) {
      ensureChat(chatId);
      return history.load(chatId);
    },

    addMessage(chatId, message) {
      touch(chatId);
      return history.add(chatId, message);
    },

    updateMessage(chatId, messageId, changes = {}) {
      touch(chatId);
      return history.update(chatId, messageId, changes);
    },

    removeMessage(chatId, messageId) {
      touch(chatId);
      return history.remove(chatId, messageId);
    },

    clearChat(chatId) {
      ensureChat(chatId);
      history.clear(chatId);
      activeChats.delete(chatId);
    },

    reloadChat(chatId) {
      ensureChat(chatId);
      return history.reload(chatId);
    },

    getActiveChats() {
      return Array.from(activeChats.values()).map(session => ({ ...session }));
    },

    hasChat(chatId) {
      return activeChats.has(chatId);
    }
  };
}
