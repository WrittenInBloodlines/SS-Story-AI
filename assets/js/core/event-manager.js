import { newId, updateProject } from '../storage.js';

export function createStoryEvent(data = {}) {
  if (!data.title?.trim() || !data.description?.trim()) return null;

  const event = {
    id: newId('event'),
    title: data.title.trim(),
    description: data.description.trim(),
    chapterId: data.chapterId || null,
    characterIds: Array.isArray(data.characterIds) ? data.characterIds : [],
    order: Number.isFinite(data.order) ? data.order : null,
    status: data.status || 'established',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.events.push(event);
  });

  return event;
}

export function getStoryEvent(project, eventId) {
  return project?.events?.find(event => event.id === eventId) || null;
}

export function getChapterEvents(project, chapterId) {
  if (!project || !chapterId) return [];

  return (project.events || [])
    .filter(event => event.chapterId === chapterId)
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
}

export function getCharacterEvents(project, characterId) {
  if (!project || !characterId) return [];

  return (project.events || []).filter(event =>
    event.characterIds?.includes(characterId)
  );
}
