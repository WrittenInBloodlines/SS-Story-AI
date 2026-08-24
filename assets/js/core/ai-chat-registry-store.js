const REGISTRY_KEY = 'ss-story-ai:chat-registry';

function readRegistry(storage) {
  if (!storage) return [];

  try {
    const parsed = JSON.parse(storage.getItem(REGISTRY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRegistry(storage, chats) {
  if (!storage) return;
  storage.setItem(REGISTRY_KEY, JSON.stringify(chats));
}

export function createAIChatRegistryStore(storage = null) {
  const backend = storage || (typeof localStorage !== 'undefined' ? localStorage : null);

  return {
    list() {
      return readRegistry(backend);
    },

    get(chatId) {
      return readRegistry(backend).find(chat => chat.id === chatId) || null;
    },

    upsert(chat) {
      if (!chat?.id) throw new Error('Chat ID is required.');

      const chats = readRegistry(backend);
      const index = chats.findIndex(item => item.id === chat.id);
      const normalized = {
        id: chat.id,
        title: chat.title || 'New Chat',
        projectId: chat.projectId || null,
        status: chat.status || 'idle',
        createdAt: chat.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: chat.metadata || {}
      };

      if (index === -1) chats.push(normalized);
      else chats[index] = { ...chats[index], ...normalized };

      writeRegistry(backend, chats);
      return normalized;
    },

    remove(chatId) {
      const chats = readRegistry(backend);
      const next = chats.filter(chat => chat.id !== chatId);
      writeRegistry(backend, next);
      return next.length !== chats.length;
    },

    clear() {
      if (backend) backend.removeItem(REGISTRY_KEY);
    }
  };
}
