import { getChat } from './chat-manager.js';

export function getStoryContext(project, options = {}) {
  if (!project) return null;

  const chapter = project.chapters?.find(item => item.id === options.chapterId) || null;
  const chat = getChat(project, options.chatId);

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description || ''
    },
    chapter,
    chat,
    characters: project.characters || [],
    world: project.world || [],
    relationships: project.relationships || [],
    events: project.events || [],
    memory: project.memory || [],
    plot: project.plot || []
  };
}

export function getChapterContext(project, chapterId) {
  const context = getStoryContext(project, { chapterId });
  return context?.chapter || null;
}
