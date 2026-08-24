import { createAIChatHistory } from './ai-chat-history.js';
import { createAIChatMessageFlow } from './ai-chat-message-flow.js';

export function createAIChatPersistentFlow(options = {}) {
  const history = options.history || createAIChatHistory(options);
  const messageFlow = options.messageFlow || createAIChatMessageFlow(options.store);

  function saveMessage(chatId, message) {
    const existing = history.load(chatId).find(item => item.id === message.id);
    if (existing) {
      return history.update(chatId, message.id, message);
    }
    return history.add(chatId, message);
  }

  return {
    load(chatId) {
      return history.load(chatId);
    },

    addUserMessage(chatId, input = {}) {
      const message = messageFlow.addUserMessage(chatId, input);
      return saveMessage(chatId, message);
    },

    beginAssistantMessage(chatId, metadata = {}) {
      const message = messageFlow.beginAssistantMessage(chatId, metadata);
      return saveMessage(chatId, message);
    },

    appendAssistantText(chatId, messageId, text) {
      const message = messageFlow.appendAssistantText(chatId, messageId, text);
      if (message) saveMessage(chatId, message);
      return message;
    },

    completeAssistantMessage(chatId, messageId, changes = {}) {
      const message = messageFlow.completeAssistantMessage(chatId, messageId, changes);
      if (message) saveMessage(chatId, message);
      return message;
    },

    failAssistantMessage(chatId, messageId, error) {
      const message = messageFlow.failAssistantMessage(chatId, messageId, error);
      if (message) saveMessage(chatId, message);
      return message;
    },

    remove(chatId, messageId) {
      return history.remove(chatId, messageId);
    },

    clear(chatId) {
      history.clear(chatId);
    },

    reload(chatId) {
      return history.reload(chatId);
    }
  };
}
