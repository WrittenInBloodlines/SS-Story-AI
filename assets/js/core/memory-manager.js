import { newId, updateProject } from '../storage.js';
import { createMemoryPolicy, canModifyMemory } from './memory-policy.js';

export function createMemory(data = {}) {
  if (!data.content?.trim()) return null;

  const memory = {
    id: newId('memory'),
    type: data.type || 'custom',
    title: data.title?.trim() || 'Untitled Memory',
    content: data.content.trim(),
    tags: Array.isArray(data.tags) ? data.tags : [],
    priority: data.priority || 'normal',
    memoryPolicy: createMemoryPolicy(data.memoryPolicy),
    source: data.source || null,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.memories.push(memory);
  });

  return memory;
}

export function addMemory(project, data = {}) {
  return createMemory({ ...data, project });
}

export function getMemory(project, memoryId) {
  return project?.memories?.find(memory => memory.id === memoryId) || null;
}

export function getMemories(project, filters = {}) {
  if (!project) return [];

  return (project.memories || []).filter(memory => {
    if (filters.type && memory.type !== filters.type) return false;
    if (filters.priority && memory.priority !== filters.priority) return false;
    if (filters.tag && !memory.tags.includes(filters.tag)) return false;
    return true;
  });
}

export function updateMemory(memoryId, changes = {}, actor = 'user') {
  let updated = null;

  updateProject(project => {
    const memory = getMemory(project, memoryId);
    if (!memory || !canModifyMemory(memory, actor, 'update')) return;

    Object.assign(memory, changes, {
      updatedAt: new Date().toISOString()
    });

    updated = memory;
  });

  return updated;
}

export function deleteMemory(memoryId, actor = 'user') {
  let deleted = false;

  updateProject(project => {
    const memory = getMemory(project, memoryId);
    if (!memory || !canModifyMemory(memory, actor, 'delete')) return;

    project.memories = project.memories.filter(item => item.id !== memoryId);
    deleted = true;
  });

  return deleted;
}
