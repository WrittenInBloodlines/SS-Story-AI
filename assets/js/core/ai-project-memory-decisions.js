export const MEMORY_DECISIONS = Object.freeze({
  KEEP_EXISTING: 'keep-existing',
  USE_NEW: 'use-new',
  CREATE_EXCEPTION: 'create-exception',
  EDIT_EXISTING: 'edit-existing',
  STORE_BOTH: 'store-both',
  IGNORE: 'ignore'
});

export function createProjectMemoryDecision(decision, details = {}) {
  if (!Object.values(MEMORY_DECISIONS).includes(decision)) {
    throw new Error(`Unknown memory decision: ${decision}`);
  }

  return {
    decision,
    ...details,
    createdAt: new Date().toISOString()
  };
}
