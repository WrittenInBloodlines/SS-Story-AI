import { createAIChatContextSelection } from './ai-chat-context-selection.js';
import { createAIChatContextBudget } from './ai-chat-context-budget.js';
import { createAIChatMemoryPriority } from './ai-chat-memory-priority.js';

export function createAIChatContextBuilder(options = {}) {
  const selection = options.selection || createAIChatContextSelection();
  const priority = options.priority || createAIChatMemoryPriority();
  const budget = options.budget || createAIChatContextBudget(options);

  return {
    build({ recentMessages = [], memoryContext = [], pinnedContext = [], instructions = [] } = {}, settings = {}) {
      const selected = selection.select({
        recentMessages,
        memoryContext,
        pinnedContext,
        instructions
      });
      const ranked = priority.rank(selected);
      const allocated = budget.allocate(ranked, settings);

      return {
        items: allocated.items,
        usedCharacters: allocated.usedCharacters,
        remainingCharacters: allocated.remainingCharacters,
        omittedItems: allocated.omittedItems,
        totalCandidates: ranked.length,
        truncated: allocated.omittedItems > 0
      };
    }
  };
}
