export const CURRENT_SCHEMA_VERSION = 3;

export function createId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
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

  // Version 2 stored long-term memory under `memory`. Keep it intact while
  // migrating it to the single canonical `memories` collection.
  migrated.memories = ensureArray(migrated.memories);
  if (migrated.memories.length === 0 && Array.isArray(migrated.memory)) {
    migrated.memories = migrated.memory;
  }
  delete migrated.memory;

  migrated.memoryVersions = ensureArray(migrated.memoryVersions);
  migrated.memoryChangeRequests = ensureArray(migrated.memoryChangeRequests);
  migrated.plot = ensureArray(migrated.plot);
  migrated.chapters = ensureArray(migrated.chapters);
  migrated.chats = ensureArray(migrated.chats);
  migrated.chatMessages = ensureArray(migrated.chatMessages);
  migrated.chatCompactions = ensureArray(migrated.chatCompactions);
  migrated.chatContinuations = ensureArray(migrated.chatContinuations);
  migrated.media = ensureArray(migrated.media);

  migrated.settings = {
    storyLength: 'long',
    creativity: 'controlled',
    writingMode: 'story',
    continuityChecks: true,
    ...(migrated.settings || {})
  };

  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  migrated.updatedAt = migrated.updatedAt || new Date().toISOString();

  return migrated;
}
