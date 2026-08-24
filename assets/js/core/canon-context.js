import { getCanonFacts } from './canon-facts.js';

export function buildCanonContext(project, subjectIds = []) {
  return getCanonFacts(project, subjectIds).map(fact => ({
    id: fact.id,
    statement: fact.statement,
    type: fact.type,
    subjectIds: fact.subjectIds,
    sourceChapterId: fact.sourceChapterId,
    sourceSceneId: fact.sourceSceneId,
    sourceEventId: fact.sourceEventId,
    importance: fact.importance,
    locked: fact.locked,
    status: fact.status
  }));
}

export function buildLockedCanonContext(project) {
  if (!project) return [];

  return (project.canonFacts || [])
    .filter(fact => fact.locked)
    .map(fact => ({
      id: fact.id,
      statement: fact.statement,
      type: fact.type,
      subjectIds: fact.subjectIds,
      importance: fact.importance,
      status: fact.status
    }));
}
