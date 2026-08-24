export function createProjectMemoryReview(options = {}) {
  const detector = options.detector;
  if (!detector || typeof detector.compare !== 'function') {
    throw new Error('A memory conflict detector is required.');
  }

  return {
    review(candidate, existingMemories = []) {
      const conflicts = detector.compare(candidate, existingMemories);
      const highest = conflicts[0] || null;

      return {
        candidate,
        conflicts,
        hasPotentialConflict: conflicts.length > 0,
        highestMatch: highest,
        recommendedAction: highest
          ? highest.sameSubject && highest.sameType
            ? 'review'
            : 'inspect'
          : 'store'
      };
    }
  };
}
