export const CURRENT_SCHEMA_VERSION = 4;

export function createId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMessages(messages) {
  return ensureArray(messages).filter(message => message && typeof message === 'object').map(message => ({
    id: message.id || createId('message'),
    role: message.role === 'assistant' ? 'assistant' : 'user',
    text: String(message.text ?? message.content ?? ''),
    createdAt: message.createdAt || new Date().toISOString()
  }));
}

function normalizeChats(chats) {
  return ensureArray(chats).filter(chat => chat && typeof chat === 'object').map(chat => {
    const now = new Date().toISOString();
    return {
      id: chat.id || createId('chat'),
      title: String(chat.title || 'New Chat'),
      messages: normalizeMessages(chat.messages),
      createdAt: chat.createdAt || now,
      updatedAt: chat.updatedAt || chat.createdAt || now
    };
  });
}

export function createDefaultProject({ id, name, description = '' }) {
  const now = new Date().toISOString();

  return {
    id,
    name,
    description,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: {
      storyLength: 'long',
      creativity: 'controlled',
      writingMode: 'story',
      continuityChecks: true
    },
    characters: [],
    world: [],
    relationships: [],
    events: [],
    memories: [],
    memoryVersions: [],
    memoryChangeRequests: [],
    plot: [],
    chapters: [],
    chats: [],
    chatMessages: [],
    chatCompactions: [],
    chatContinuations: [],
    activeChatId: null,
    media: []
  };
}

export function migrateProject(project) {
  if (!project || typeof project !== 'object') return null;

  const migrated = { ...project };

  migrated.characters = ensureArray(migrated.characters);
  migrated.world = ensureArray(migrated.world);
  migrated.relationships = ensureArray(migrated.relationships);
  migrated.events = ensureArray(migrated.events);

  migrated.memories = ensureArray(migrated.memories);
  if (migrated.memories.length === 0 && Array.isArray(migrated.memory)) {
    migrated.memories = migrated.memory;
  }
  delete migrated.memory;

  migrated.memoryVersions = ensureArray(migrated.memoryVersions);
  migrated.memoryChangeRequests = ensureArray(migrated.memoryChangeRequests);
  migrated.plot = ensureArray(migrated.plot);
  migrated.chapters = ensureArray(migrated.chapters);

  migrated.chats = normalizeChats(migrated.chats);
  migrated.chatMessages = ensureArray(migrated.chatMessages);
  migrated.chatCompactions = ensureArray(migrated.chatCompactions);
  migrated.chatContinuations = ensureArray(migrated.chatContinuations);
  migrated.media = ensureArray(migrated.media);

  // Older builds could leave chat messages in a separate collection. Recover
  // them into their matching chat instead of silently losing the history.
  if (migrated.chatMessages.length) {
    const byChatId = new Map(migrated.chats.map(chat => [chat.id, chat]));
    for (const message of migrated.chatMessages) {
      const chatId = message?.chatId;
      if (!chatId) continue;
      let chat = byChatId.get(chatId);
      if (!chat) {
        const now = new Date().toISOString();
        chat = {
          id: chatId,
          title: 'Recovered Chat',
          messages: [],
          createdAt: message.createdAt || now,
          updatedAt: message.createdAt || now
        };
        migrated.chats.push(chat);
        byChatId.set(chatId, chat);
      }
      if (!chat.messages.some(existing => existing.id === message.id)) {
        chat.messages.push({
          id: message.id || createId('message'),
          role: message.role === 'assistant' ? 'assistant' : 'user',
          text: String(message.text ?? message.content ?? ''),
          createdAt: message.createdAt || new Date().toISOString()
        });
      }
      chat.updatedAt = message.createdAt || chat.updatedAt;
    }
  }

  migrated.settings = {
    storyLength: 'long',
    creativity: 'controlled',
    writingMode: 'story',
    continuityChecks: true,
    ...(migrated.settings || {})
  };

  if (!migrated.chats.length) {
    const now = new Date().toISOString();
    migrated.chats.push({
      id: createId('chat'),
      title: 'Main Chat',
      messages: [],
      createdAt: now,
      updatedAt: now
    });
  }

  const validActive = migrated.chats.some(chat => chat.id === migrated.activeChatId);
  if (!validActive) {
    const newest = [...migrated.chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    migrated.activeChatId = newest?.id || null;
  }

  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  migrated.updatedAt = migrated.updatedAt || new Date().toISOString();

  return migrated;
}
