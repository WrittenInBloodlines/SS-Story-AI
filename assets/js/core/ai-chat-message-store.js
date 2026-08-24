export function createAIChatMessageStore() {
  const messagesByChat = new Map();

  function getMessages(chatId) {
    if (!messagesByChat.has(chatId)) {
      messagesByChat.set(chatId, []);
    }
    return messagesByChat.get(chatId);
  }

  return {
    add(chatId, message) {
      if (!chatId) throw new Error('Chat ID is required.');
      if (!message) throw new Error('Message is required.');

      const storedMessage = {
        ...message,
        id: message.id || `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: message.createdAt || new Date().toISOString()
      };

      getMessages(chatId).push(storedMessage);
      return storedMessage;
    },

    getAll(chatId) {
      return [...getMessages(chatId)];
    },

    getLast(chatId) {
      const messages = getMessages(chatId);
      return messages.length ? messages[messages.length - 1] : null;
    },

    update(chatId, messageId, changes = {}) {
      const messages = getMessages(chatId);
      const index = messages.findIndex(message => message.id === messageId);
      if (index === -1) return null;

      messages[index] = {
        ...messages[index],
        ...changes,
        updatedAt: new Date().toISOString()
      };

      return messages[index];
    },

    remove(chatId, messageId) {
      const messages = getMessages(chatId);
      const index = messages.findIndex(message => message.id === messageId);
      if (index === -1) return false;

      messages.splice(index, 1);
      return true;
    },

    clear(chatId) {
      messagesByChat.set(chatId, []);
    },

    clearAll() {
      messagesByChat.clear();
    }
  };
}
