import { normalizeProjectMemoryType } from './ai-project-memory-types.js';

export function createProjectMemoryCandidate(input = {}) {
  return {
    type: normalizeProjectMemoryType(input.type),
    subjectId: input.subjectId || null,
    content: typeof input.content === 'string' ? input.content.trim() : '',
    importance: Number.isFinite(input.importance) ? input.importance : 50,
    confidence: Number.isFinite(input.confidence) ? input.confidence : 0.5,
    source: input.source || 'chat',
    sourceMessageId: input.sourceMessageId || null,
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.filter(Boolean))] : [],
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {}
  };
}
