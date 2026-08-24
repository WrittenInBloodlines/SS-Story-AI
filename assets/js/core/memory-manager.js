import { newId, updateProject } from '../storage.js';
import { approveMemoryCandidate, rejectMemoryCandidate } from './memory-candidates.js';

export function addMemory(project, { title, content, category = 'general', source = 'user' }) {
  if (!project || !title?.trim() || !content?.trim()) return null;

  const memory = {
    id: newId('memory'),
    title: title.trim(),
    content: content.trim(),
    category,
    source,
    locked: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(currentProject => {
    currentProject.memory.push(memory);
  });

  return memory;
}

export function approveCandidateIntoMemory(candidate, options = {}) {
  const approved = approveMemoryCandidate(candidate);
  if (!approved) return null;

  return addMemory(options.project, {
    title: options.title || 'Imported Memory',
    content: approved.content,
    category: options.category || 'general',
    source: 'approved-candidate'
  });
}

export function rejectCandidate(candidate) {
  return rejectMemoryCandidate(candidate);
}

export function getMemory(project, memoryId) {
  return project?.memory?.find(item => item.id === memoryId) || null;
}

export function updateMemory(memoryId, changes = {}) {
  let updated = null;

  updateProject(project => {
    const memory = project.memory.find(item => item.id === memoryId);
    if (!memory || memory.locked) return;

    Object.assign(memory, changes, {
      updatedAt: new Date().toISOString()
    });
    updated = memory;
  });

  return updated;
}
