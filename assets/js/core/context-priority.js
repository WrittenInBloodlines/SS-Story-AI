export const DEFAULT_CONTEXT_PRIORITY = Object.freeze({
  lockedCanon: 100,
  currentScene: 95,
  currentState: 90,
  activeCharacters: 85,
  activeTimeline: 80,
  relevantMemories: 70,
  recentChat: 60,
  olderChat: 40
});

export function getContextPriority(type, overrides = {}) {
  return Number.isFinite(overrides[type])
    ? overrides[type]
    : DEFAULT_CONTEXT_PRIORITY[type] ?? 0;
}

export function assignContextPriority(items = [], overrides = {}) {
  return items.map(item => ({
    ...item,
    contextPriority: getContextPriority(item.contextType, overrides)
  }));
}

export function prioritizeContext(items = []) {
  return [...items].sort((a, b) => {
    if (b.contextPriority !== a.contextPriority) {
      return b.contextPriority - a.contextPriority;
    }

    const aTimestamp = Date.parse(a.updatedAt || a.createdAt || '') || 0;
    const bTimestamp = Date.parse(b.updatedAt || b.createdAt || '') || 0;
    return bTimestamp - aTimestamp;
  });
}
