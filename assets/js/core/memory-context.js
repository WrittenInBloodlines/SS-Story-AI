import { searchMemoryIndex, getLockedMemories } from './memory-index.js';

export function buildMemoryContext(project, query = '', options = {}) {
  if (!project) return [];

  const limit = Number.isFinite(options.limit) ? options.limit : 50;
  const candidates = query.trim()
    ? searchMemoryIndex(project, query)
    : (project.memory || project.memories || []);

  return candidates
    .slice(0, limit)
    .map(memory => ({
      id: memory.id,
      title: memory.title,
      content: memory.content,
      category: memory.category || memory.type || 'general',
      source: memory.source || null,
      locked: memory.locked === true,
      priority: memory.priority || 'normal'
    }));
}

export function buildLockedMemoryContext(project) {
  return getLockedMemories(project).map(memory => ({
    id: memory.id,
    title: memory.title,
    content: memory.content,
    category: memory.category || 'general',
    source: memory.source || null
  }));
}
