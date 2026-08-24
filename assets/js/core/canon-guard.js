const DEFAULT_LOCKED_FIELDS = new Set([
  'name',
  'description',
  'appearance',
  'personality',
  'backstory',
  'relationships'
]);

export function createCanonGuard({ lockedFields = DEFAULT_LOCKED_FIELDS } = {}) {
  return {
    isLocked(field) {
      return lockedFields.has(field);
    },

    checkChange(entity, changes = {}) {
      const blocked = Object.keys(changes).filter(field => lockedFields.has(field));

      if (!blocked.length) {
        return { allowed: true, blockedFields: [] };
      }

      return {
        allowed: false,
        blockedFields: blocked,
        message: 'This change affects protected canon data and requires explicit user approval.'
      };
    }
  };
}

export function requestCanonChange(entity, changes = {}) {
  return {
    id: `canon_change_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    entityId: entity?.id || null,
    changes,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}
