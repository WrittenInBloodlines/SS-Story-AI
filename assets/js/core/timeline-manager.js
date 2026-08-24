import { getChapterEvents } from './event-manager.js';

export function buildStoryTimeline(project) {
  if (!project) return [];

  return [...(project.events || [])]
    .sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
}

export function buildChapterTimeline(project, chapterId) {
  return getChapterEvents(project, chapterId);
}

export function findTimelineConflicts(project) {
  if (!project) return [];

  const conflicts = [];
  const timeline = buildStoryTimeline(project);

  for (let index = 0; index < timeline.length - 1; index += 1) {
    const current = timeline[index];
    const next = timeline[index + 1];

    if (
      current.order !== null &&
      next.order !== null &&
      current.order === next.order
    ) {
      conflicts.push({
        type: 'duplicate-order',
        eventIds: [current.id, next.id],
        message: 'Two story events share the same timeline order.'
      });
    }
  }

  return conflicts;
}
