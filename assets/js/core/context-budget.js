export const CONTEXT_PRIORITIES = Object.freeze({
  LOCKED_CANON: 100,
  CURRENT_SCENE: 95,
  CURRENT_STATE: 90,
  CHARACTER: 85,
  ACTIVE_TIMELINE: 80,
  RELEVANT_MEMORY: 70,
  RECENT_CHAT: 60,
  OLDER_CHAT: 40
});

export function estimateTextSize(value) {
  if (value == null) return 0;
  return String(value).length;
}

export function estimateContextSize(context) {
  return estimateTextSize(JSON.stringify(context));
}

export function trimToBudget(items = [], maxCharacters = 20000) {
  if (!Number.isFinite(maxCharacters) || maxCharacters <= 0) return [];

  let used = 0;
  const result = [];

  for (const item of items) {
    const size = estimateTextSize(item?.content ?? item);
    if (used + size > maxCharacters) continue;

    result.push(item);
    used += size;
  }

  return result;
}

export function sortByContextPriority(items = []) {
  return [...items].sort((a, b) => {
    const priorityA = Number(a?.contextPriority || 0);
    const priorityB = Number(b?.contextPriority || 0);
    return priorityB - priorityA;
  });
}
