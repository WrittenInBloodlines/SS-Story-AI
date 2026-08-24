import { newId, updateProject } from '../storage.js';

export const STATE_TYPES = Object.freeze({
  CHARACTER: 'character',
  LOCATION: 'location',
  RELATIONSHIP: 'relationship',
  OBJECT: 'object',
  CUSTOM: 'custom'
});

export function createStateEntry(data = {}) {
  if (!data.subjectId || !data.key) return null;

  const entry = {
    id: newId('state'),
    subjectId: data.subjectId,
    subjectType: data.subjectType || STATE_TYPES.CUSTOM,
    key: data.key.trim(),
    value: data.value ?? null,
    sourceSceneId: data.sourceSceneId || null,
    sourceChapterId: data.sourceChapterId || null,
    established: data.established !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.states.push(entry);
  });

  return entry;
}

export function getSubjectStates(project, subjectId) {
  if (!project || !subjectId) return [];
  return (project.states || []).filter(state => state.subjectId === subjectId);
}

export function getState(project, subjectId, key) {
  return getSubjectStates(project, subjectId)
    .find(state => state.key.toLowerCase() === key.toLowerCase()) || null;
}

export function updateState(stateId, value, source = {}) {
  let updated = null;

  updateProject(project => {
    const state = project.states?.find(item => item.id === stateId);
    if (!state) return;

    state.value = value;
    state.sourceSceneId = source.sceneId || state.sourceSceneId;
    state.sourceChapterId = source.chapterId || state.sourceChapterId;
    state.updatedAt = new Date().toISOString();
    updated = state;
  });

  return updated;
}
