export function createAIChatContextBudget(options = {}) {
  const maxCharacters = Number.isFinite(options.maxCharacters) ? options.maxCharacters : 24000;

  function getText(item) {
    return typeof item === 'string' ? item : item?.content || item?.text || '';
  }

  return {
    allocate(items = [], settings = {}) {
      const budget = Number.isFinite(settings.maxCharacters)
        ? settings.maxCharacters
        : maxCharacters;
      const selected = [];
      let used = 0;

      for (const item of items) {
        const text = getText(item);
        const size = text.length;

        if (!size) continue;
        if (used + size > budget && selected.length > 0) continue;

        selected.push(item);
        used += size;

        if (used >= budget) break;
      }

      return {
        items: selected,
        usedCharacters: used,
        remainingCharacters: Math.max(0, budget - used),
        budget,
        omittedItems: Math.max(0, items.length - selected.length)
      };
    }
  };
}
