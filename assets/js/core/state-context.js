import { getSubjectStates } from './state-tracker.js';

export function buildStateContext(project, subjectIds = []) {
  if (!project) return [];

  const allowed = new Set(subjectIds);

  return (project.states || [])
    .filter(state => !allowed.size || allowed.has(state.subjectId))
    .map(state => ({
      id: state.id,
      subjectId: state.subjectId,
      subjectType: state.subjectType,
      key: state.key,
      value: state.value,
      sourceSceneId: state.sourceSceneId,
      sourceChapterId: state.sourceChapterId,
      established: state.established
    }));
}

export function buildSubjectStateContext(project, subjectId) {
  return getSubjectStates(project, subjectId).map(state => ({
    key: state.key,
    value: state.value,
    sourceSceneId: state.sourceSceneId,
    sourceChapterId: state.sourceChapterId,
    established: state.established
  }));
}
