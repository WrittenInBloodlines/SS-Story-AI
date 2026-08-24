export const MEMORY_ENTRY_TYPES = Object.freeze({
  CHARACTER: 'character',
  PROJECT: 'project',
  CANON: 'canon',
  RELATIONSHIP: 'relationship',
  EVENT: 'event',
  STATE: 'state',
  SCENE: 'scene',
  PREFERENCE: 'preference',
  CHAT: 'chat',
  CUSTOM: 'custom'
});

export const MEMORY_POLICIES = Object.freeze({
  USER_LOCKED: 'user-locked',
  CANON_LOCKED: 'canon-locked',
  ESTABLISHED: 'established',
  TEMPORARY: 'temporary'
});

export function createMemoryPolicy(data = {}) {
  return {
    policy: data.policy || MEMORY_POLICIES.ESTABLISHED,
    editableByAI: data.editableByAI === true,
    editableByUser: data.editableByUser !== false,
    deletableByAI: data.deletableByAI === true,
    deletableByUser: data.deletableByUser !== false,
    requiresUserConfirmation: data.requiresUserConfirmation !== false
  };
}

export function canModifyMemory(memory, actor = 'ai', action = 'update') {
  if (!memory) return false;

  const policy = memory.memoryPolicy || createMemoryPolicy();
  const isUser = actor === 'user';

  if (action === 'delete') {
    return isUser ? policy.deletableByUser : policy.deletableByAI;
  }

  return isUser ? policy.editableByUser : policy.editableByAI;
}

export function requiresConfirmation(memory, actor = 'ai') {
  if (!memory || actor !== 'ai') return false;
  return memory.memoryPolicy?.requiresUserConfirmation === true;
}
