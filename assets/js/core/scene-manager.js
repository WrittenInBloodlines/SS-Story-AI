import { newId, updateProject } from '../storage.js';

export function createScene(data = {}) {
  if (!data.title?.trim()) return null;

  const scene = {
    id: newId('scene'),
    title: data.title.trim(),
    chapterId: data.chapterId || null,
    locationId: data.locationId || null,
    characterIds: Array.isArray(data.characterIds) ? data.characterIds : [],
    startState: data.startState || {},
    endState: data.endState || {},
    eventIds: Array.isArray(data.eventIds) ? data.eventIds : [],
    order: Number.isFinite(data.order) ? data.order : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.scenes.push(scene);
  });

  return scene;
}

export function getScene(project, sceneId) {
  return project?.scenes?.find(scene => scene.id === sceneId) || null;
}

export function getChapterScenes(project, chapterId) {
  if (!project || !chapterId) return [];

  return (project.scenes || [])
    .filter(scene => scene.chapterId === chapterId)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
}
