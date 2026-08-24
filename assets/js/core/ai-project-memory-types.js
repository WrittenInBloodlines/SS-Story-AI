export const PROJECT_MEMORY_TYPES = Object.freeze({
  FACT: 'fact',
  CHARACTER: 'character',
  RELATIONSHIP: 'relationship',
  CANON: 'canon',
  EVENT: 'event',
  LOCATION: 'location',
  WORLD_RULE: 'world-rule',
  PLOT_POINT: 'plot-point',
  OPEN_THREAD: 'open-thread',
  DECISION: 'decision',
  PREFERENCE: 'preference'
});

export function isProjectMemoryType(type) {
  return Object.values(PROJECT_MEMORY_TYPES).includes(type);
}

export function normalizeProjectMemoryType(type) {
  return isProjectMemoryType(type) ? type : PROJECT_MEMORY_TYPES.FACT;
}
