export const CONTINUITY_ACTIONS = Object.freeze({
  FIX: 'fix',
  SUGGEST: 'suggest',
  EXPLAIN: 'explain',
  CONTINUE: 'continue',
  DISMISS: 'dismiss'
});

export function createContinuityAction(warningId, action, data = {}) {
  return {
    id: `continuity_action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    warningId,
    action,
    data,
    createdAt: new Date().toISOString()
  };
}

export function canContinueDespiteWarning(action) {
  return action === CONTINUITY_ACTIONS.CONTINUE || action === CONTINUITY_ACTIONS.DISMISS;
}
