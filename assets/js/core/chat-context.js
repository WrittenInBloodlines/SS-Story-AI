import { getStoryContext } from './story-context.js';

export function buildChatContext(project, chatId, chapterId = null) {
  const context = getStoryContext(project, { chatId, chapterId });
  if (!context) return null;

  return {
    project: context.project,
    chapter: context.chapter,
    chat: context.chat,
    characters: context.characters,
    world: context.world,
    relationships: context.relationships,
    events: context.events,
    memory: context.memory,
    plot: context.plot
  };
}
