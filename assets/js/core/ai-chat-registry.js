export function createAIChatRegistry() {
  const chats = new Map();

  return {
    register(chat) {
      if (!chat?.id) throw new Error('A chat requires an ID.');
      chats.set(chat.id, { ...chat });
      return { ...chats.get(chat.id) };
    },

    get(chatId) {
      const chat = chats.get(chatId);
      return chat ? { ...chat } : null;
    },

    update(chatId, changes = {}) {
      const chat = chats.get(chatId);
      if (!chat) return null;
      const updated = { ...chat, ...changes, updatedAt: new Date().toISOString() };
      chats.set(chatId, updated);
      return { ...updated };
    },

    remove(chatId) {
      return chats.delete(chatId);
    },

    list() {
      return Array.from(chats.values()).map(chat => ({ ...chat }));
    },

    has(chatId) {
      return chats.has(chatId);
    },

    clear() {
      chats.clear();
    }
  };
}
