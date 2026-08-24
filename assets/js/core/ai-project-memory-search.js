function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

export function createAIProjectMemorySearch(memoryStore) {
  if (!memoryStore || typeof memoryStore.getAll !== 'function') {
    throw new Error('A project memory store is required.');
  }

  return {
    search(projectId, query, options = {}) {
      const normalizedQuery = normalize(query);
      if (!normalizedQuery) return [];

      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      const memories = memoryStore.getAll(projectId, options);

      return memories
        .map(memory => {
          const haystack = normalize([
            memory.content,
            memory.type,
            ...(memory.tags || [])
          ].join(' '));
          const matches = terms.filter(term => haystack.includes(term)).length;
          const importance = Number.isFinite(memory.importance) ? memory.importance : 50;
          const confidence = Number.isFinite(memory.confidence) ? memory.confidence : 1;
          return {
            memory,
            score: matches * 100 + importance * confidence,
            matches
          };
        })
        .filter(result => result.matches > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, Number.isFinite(options.limit) ? options.limit : 20);
    }
  };
}
