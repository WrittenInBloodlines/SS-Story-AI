function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function createAIChatContextSelection() {
  return {
    select({ recentMessages = [], pinnedContext = [], memoryContext = [], instructions = [] } = {}) {
      const sections = [
        { type: 'instructions', items: instructions },
        { type: 'memory', items: memoryContext },
        { type: 'pinned', items: pinnedContext },
        { type: 'recent', items: recentMessages }
      ];

      return sections.flatMap(section => section.items
        .filter(Boolean)
        .map(item => ({
          type: section.type,
          content: normalizeText(typeof item === 'string' ? item : item.content || item.text),
          sourceId: typeof item === 'object' ? item.id || null : null,
          metadata: typeof item === 'object' ? item.metadata || {} : {}
        }))
        .filter(item => item.content));
    }
  };
}
