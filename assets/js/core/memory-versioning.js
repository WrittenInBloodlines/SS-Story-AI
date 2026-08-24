import { newId, updateProject } from '../storage.js';

export function createMemoryVersion(memory, changes = {}, actor = 'user') {
  if (!memory) return null;

  return {
    id: newId('memory_version'),
    memoryId: memory.id,
    version: Number(memory.version || 0) + 1,
    content: changes.content ?? memory.content,
    title: changes.title ?? memory.title,
    type: changes.type ?? memory.type,
    tags: Array.isArray(changes.tags) ? changes.tags : [...(memory.tags || [])],
    priority: changes.priority ?? memory.priority,
    actor,
    reason: changes.reason || null,
    createdAt: new Date().toISOString()
  };
}

export function saveMemoryVersion(memoryId, changes = {}, actor = 'user') {
  let version = null;

  updateProject(project => {
    const memory = project.memories?.find(item => item.id === memoryId);
    if (!memory) return;

    version = createMemoryVersion(memory, changes, actor);
    project.memoryVersions.push(version);

    memory.version = version.version;
    Object.assign(memory, changes, {
      updatedAt: new Date().toISOString()
    });
  });

  return version;
}

export function getMemoryVersions(project, memoryId) {
  if (!project || !memoryId) return [];

  return (project.memoryVersions || [])
    .filter(version => version.memoryId === memoryId)
    .sort((a, b) => a.version - b.version);
}

export function getMemoryVersion(project, memoryId, versionNumber) {
  return getMemoryVersions(project, memoryId)
    .find(version => version.version === versionNumber) || null;
}
