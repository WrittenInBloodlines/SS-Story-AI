import { createProjectMemoryCandidate } from './ai-project-memory-candidate.js';

export function createProjectMemoryCandidateQueue() {
  const queue = [];

  return {
    add(input) {
      const candidate = createProjectMemoryCandidate(input);
      if (!candidate.content) return null;
      queue.push(candidate);
      return candidate;
    },

    addMany(inputs = []) {
      return inputs.map(input => this.add(input)).filter(Boolean);
    },

    peek() {
      return queue[0] || null;
    },

    all() {
      return [...queue];
    },

    take(count = queue.length) {
      const amount = Math.max(0, Number.isFinite(count) ? count : 0);
      return queue.splice(0, amount);
    },

    remove(index) {
      if (index < 0 || index >= queue.length) return null;
      return queue.splice(index, 1)[0] || null;
    },

    clear() {
      queue.length = 0;
    },

    get size() {
      return queue.length;
    }
  };
}
