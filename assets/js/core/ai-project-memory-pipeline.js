import { createProjectMemoryCandidate } from './ai-project-memory-candidate.js';

export function createProjectMemoryPipeline(options = {}) {
  const review = options.review;
  const store = options.store;
  if (!review || typeof review.review !== 'function') {
    throw new Error('A memory review service is required.');
  }
  if (!store || typeof store.add !== 'function') {
    throw new Error('A memory store is required.');
  }

  return {
    inspect(input, existingMemories = []) {
      const candidate = createProjectMemoryCandidate(input);
      return review.review(candidate, existingMemories);
    },

    commit(candidate, decision, details = {}) {
      if (decision === 'ignore') {
        return { stored: false, decision, candidate };
      }

      if (decision === 'use-new' || decision === 'store-both' || decision === 'create-exception') {
        const stored = store.add({
          ...candidate,
          metadata: {
            ...(candidate.metadata || {}),
            ...(details.metadata || {}),
            memoryDecision: decision
          }
        });
        return { stored: true, decision, memory: stored };
      }

      return {
        stored: false,
        decision,
        candidate,
        requiresFollowUp: true,
        details
      };
    }
  };
}
