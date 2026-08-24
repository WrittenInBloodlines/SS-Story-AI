const STORAGE_PREFIX = 'ss-story-ai:project-memory:';

function storageAvailable(storage) {
  return Boolean(storage && typeof storage.getItem === 'function');
}

function keyFor(projectId) {
  return `${STORAGE_PREFIX}${projectId}`;
}

function normalizeMemory(memory = {}) {
  return {
    id: memory.id || `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: memory.type || 'fact',
    content: typeof memory.content === 'string' ? memory.content.trim() : '',
    importance: Number.isFinite(memory.importance) ? memory.importance : 50,
    confidence: Number.isFinite(memory.confidence) ? memory.confidence : 1,
    source: memory.source || 'user',
    status: memory.status || 'active',
    tags: Array.isArray(memory.tags) ? [...new Set(memory.tags)] : [],
    metadata: memory.metadata || {},
    createdAt: memory.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function createAIProjectMemoryStore(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  function load(projectId) {
    if (!projectId || !storageAvailable(storage)) return [];
    const raw = storage.getItem(keyFor(projectId));
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.memories) ? parsed.memories : [];
    } catch {
      return [];
    }
  }

  function save(projectId, memories) {
    if (!projectId || !storageAvailable(storage)) return false;
    storage.setItem(keyFor(projectId), JSON.stringify({
      version: 1,
      projectId,
      memories,
      updatedAt: new Date().toISOString()
    }));
    return true;
  }

  return {
    getAll(projectId, options = {}) {
      const memories = load(projectId);
      if (options.includeInactive) return memories;
      return memories.filter(memory => memory.status === 'active');
    },

    add(projectId, memory) {
      const normalized = normalizeMemory(memory);
      if (!normalized.content) throw new Error('Memory content cannot be empty.');
      const memories = load(projectId);
      memories.push(normalized);
      save(projectId, memories);
      return normalized;
    },

    update(projectId, memoryId, changes = {}) {
      const memories = load(projectId);
      const index = memories.findIndex(memory => memory.id === memoryId);
      if (index === -1) return null;

      memories[index] = {
        ...memories[index],
        ...changes,
        id: memories[index].id,
        updatedAt: new Date().toISOString()
      };
      save(projectId, memories);
      return memories[index];
    },

    remove(projectId, memoryId) {
      const memories = load(projectId);
      const index = memories.findIndex(memory => memory.id === memoryId);
      if (index === -1) return false;
      memories.splice(index, 1);
      save(projectId, memories);
      return true;
    },

    clear(projectId) {
      if (!projectId || !storageAvailable(storage)) return false;
      storage.removeItem(keyFor(projectId));
      return true;
    }
  };
}
