import { newId, updateProject } from '../storage.js';

export const CANON_FACT_TYPES = Object.freeze({
  CHARACTER: 'character',
  RELATIONSHIP: 'relationship',
  LOCATION: 'location',
  TIMELINE: 'timeline',
  WORLD: 'world',
  OBJECT: 'object',
  RULE: 'rule',
  CUSTOM: 'custom'
});

export function createCanonFact(data = {}) {
  if (!data.statement?.trim()) return null;

  const fact = {
    id: newId('canon_fact'),
    statement: data.statement.trim(),
    type: data.type || CANON_FACT_TYPES.CUSTOM,
    subjectIds: Array.isArray(data.subjectIds) ? data.subjectIds : [],
    sourceChapterId: data.sourceChapterId || null,
    sourceSceneId: data.sourceSceneId || null,
    sourceEventId: data.sourceEventId || null,
    importance: data.importance || 'normal',
    locked: data.locked === true,
    status: data.status || 'established',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.canonFacts.push(fact);
  });

  return fact;
}

export function getCanonFact(project, factId) {
  return project?.canonFacts?.find(fact => fact.id === factId) || null;
}

export function getCanonFacts(project, subjectIds = []) {
  if (!project) return [];
  const ids = new Set(subjectIds);

  return (project.canonFacts || []).filter(fact =>
    !ids.size || fact.subjectIds.some(id => ids.has(id))
  );
}

export function lockCanonFact(factId) {
  let updated = null;

  updateProject(project => {
    const fact = getCanonFact(project, factId);
    if (!fact) return;

    fact.locked = true;
    fact.updatedAt = new Date().toISOString();
    updated = fact;
  });

  return updated;
}
