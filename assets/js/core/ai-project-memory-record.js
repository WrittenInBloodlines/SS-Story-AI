import { normalizeProjectMemoryType } from './ai-project-memory-types.js';

export function createProjectMemoryRecord(input = {}) {
  const now = new Date().toISOString();

  return {
    id: input.id || `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId: input.projectId || null,
    type: normalizeProjectMemoryType(input.type),
    subjectId: input.subjectId || null,
    content: typeof input.content === 'string' ? input.content.trim() : '',
    importance: Number.isFinite(input.importance) ? input.importance : 50,
    confidence: Number.isFinite(input.confidence) ? input.confidence : 1,
    status: input.status || 'active',
    source: input.source || null,
    sourceMessageId: input.sourceMessageId || null,
    tags: Array.isArray(input.tags) ? [...new Set(input.tags.filter(Boolean))] : [],
    metadata: input.metadata && typeof input.metadata === 'object' ? { ...input.metadata } : {},
    createdAt: input.createdAt || now,
    updatedAt: now
  };
}
