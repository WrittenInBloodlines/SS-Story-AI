import { getMemory } from './memory-manager.js';

export function buildMemoryIndex(project) {
  if (!project) return [];

  const memories = project.memory || project.memories || [];

  return memories.map(memory => ({
    id: memory.id,
    title: memory.title,
    category: memory.category || memory.type || 'general',
    source: memory.source || null,
    locked: memory.locked === true,
    priority: memory.priority || 'normal',
    tags: Array.isArray(memory.tags) ? memory.tags : []
  }));
}

export function searchMemoryIndex(project, query) {
  if (!query?.trim()) return [];

  const normalized = query.trim().toLowerCase();
  const memories = project?.memory || project?.memories || [];

  return memories.filter(memory => {
    const searchable = [
      memory.title,
      memory.content,
      memory.category,
      ...(memory.tags || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(normalized);
  });
}

export function getLockedMemories(project) {
  const memories = project?.memory || project?.memories || [];
  return memories.filter(memory => memory.locked === true);
}

export function getMemoryById(project, memoryId) {
  return getMemory(project, memoryId);
}
