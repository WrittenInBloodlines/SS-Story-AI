export const CURRENT_SCHEMA_VERSION = 2;

export function createId(prefix = 'item') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    memory: [],
    plot: [],
    chapters: [],
    chats: [],
    media: []
  };
}

export function migrateProject(project) {
  if (!project || typeof project !== 'object') return null;

  const migrated = { ...project };
  const arrayFields = [
    'characters',
    'world',
    'relationships',
    'events',
    'memory',
    'plot',
    'chapters',
    'chats',
    'media'
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(migrated[field])) migrated[field] = [];
  }

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
