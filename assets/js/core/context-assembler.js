import { buildStoryContext } from './story-context-builder.js';
import { prioritizeContext } from './context-priority.js';
import { trimToBudget } from './context-budget.js';

function toContextItems(context) {
  const items = [];

  for (const canon of context.canon || []) {
    items.push({
      contextType: canon.locked ? 'lockedCanon' : 'relevantMemories',
      contextPriority: canon.locked ? 100 : 70,
      content: canon.statement,
      source: canon
    });
  }

  for (const character of context.characters || []) {
    items.push({
      contextType: 'activeCharacters',
      contextPriority: 85,
      content: JSON.stringify(character),
      source: character
    });
  }

  for (const state of context.states || []) {
    items.push({
      contextType: 'currentState',
      contextPriority: 90,
      content: JSON.stringify(state),
      source: state
    });
  }

  for (const memory of context.memories || []) {
    items.push({
      contextType: 'relevantMemories',
      contextPriority: memory.priority === 'high' ? 75 : 70,
      content: memory.content,
      source: memory
    });
  }

  if (context.scene) {
    items.push({
      contextType: 'currentScene',
      contextPriority: 95,
      content: JSON.stringify(context.scene),
      source: context.scene
    });
  }

  return items;
}

export function assembleContext(project, options = {}) {
  const storyContext = buildStoryContext(project, options);
  if (!storyContext) return null;

  const prioritized = prioritizeContext(toContextItems(storyContext));
  const budget = Number.isFinite(options.maxCharacters) ? options.maxCharacters : 20000;
  const selected = trimToBudget(prioritized, budget);

  return {
    ...storyContext,
    contextItems: selected,
    contextSize: selected.reduce((total, item) => total + String(item.content ?? '').length, 0),
    contextBudget: budget
  };
}
