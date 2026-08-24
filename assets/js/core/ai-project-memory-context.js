import { createAIProjectMemorySearch } from './ai-project-memory-search.js';

export function createAIProjectMemoryContext(memoryStore, options = {}) {
  const search = options.search || createAIProjectMemorySearch(memoryStore);

  return {
    collect(projectId, query, settings = {}) {
      const results = search.search(projectId, query, {
        limit: settings.limit || 12,
        includeInactive: false
      });

      return results.map(result => ({
        type: 'memory',
        content: result.memory.content,
        sourceId: result.memory.id,
        priority: result.memory.importance,
        metadata: {
          memoryType: result.memory.type,
          confidence: result.memory.confidence,
          tags: result.memory.tags,
          score: result.score
        }
      }));
    }
  };
}
