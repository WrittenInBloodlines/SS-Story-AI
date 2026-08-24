export function createProjectMemoryConflictDetector(options = {}) {
  const normalize = options.normalize || (value => String(value || '').trim().toLowerCase());

  function tokens(value) {
    return new Set(normalize(value).split(/\s+/).filter(token => token.length > 2));
  }

  function similarity(a, b) {
    const left = tokens(a);
    const right = tokens(b);
    if (!left.size || !right.size) return 0;

    let overlap = 0;
    for (const token of left) {
      if (right.has(token)) overlap += 1;
    }

    return overlap / Math.max(left.size, right.size);
  }

  return {
    compare(candidate, existing = []) {
      if (!candidate?.content) return [];

      return existing
        .filter(memory => memory && memory.id !== candidate.id)
        .map(memory => ({
          memory,
          similarity: similarity(candidate.content, memory.content),
          sameSubject: Boolean(candidate.subjectId && candidate.subjectId === memory.subjectId),
          sameType: candidate.type === memory.type
        }))
        .filter(result => result.similarity >= 0.35 || (result.sameSubject && result.sameType))
        .sort((a, b) => {
          const scoreA = a.similarity + (a.sameSubject ? 0.25 : 0) + (a.sameType ? 0.1 : 0);
          const scoreB = b.similarity + (b.sameSubject ? 0.25 : 0) + (b.sameType ? 0.1 : 0);
          return scoreB - scoreA;
        });
    }
  };
}
