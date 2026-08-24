const STORAGE_KEY_PREFIX = 'ss-story-ai:chat:';

function getStorageKey(chatId) {
  return `${STORAGE_KEY_PREFIX}${chatId}`;
}

function canUseStorage() {
  return typeof localStorage !== 'undefined';
}

export function createAIChatPersistence(storage = null) {
  const backend = storage || (canUseStorage() ? localStorage : null);

  return {
    isAvailable() {
      return Boolean(backend);
    },

    save(chatId, messages) {
      if (!chatId) throw new Error('Chat ID is required.');
      if (!backend) return false;

      backend.setItem(getStorageKey(chatId), JSON.stringify({
        version: 1,
        chatId,
        messages: Array.isArray(messages) ? messages : [],
        savedAt: new Date().toISOString()
      }));

      return true;
    },

    load(chatId) {
      if (!chatId) throw new Error('Chat ID is required.');
      if (!backend) return [];

      const raw = backend.getItem(getStorageKey(chatId));
      if (!raw) return [];

      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.messages) ? parsed.messages : [];
      } catch {
        return [];
      }
    },

    remove(chatId) {
      if (!chatId) throw new Error('Chat ID is required.');
      if (!backend) return false;

      backend.removeItem(getStorageKey(chatId));
      return true;
    },

    clear() {
      if (!backend) return false;

      const keys = [];
      for (let index = 0; index < backend.length; index += 1) {
        const key = backend.key(index);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) keys.push(key);
      }

      keys.forEach(key => backend.removeItem(key));
      return true;
    }
  };
}
