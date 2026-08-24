import { getProject } from '../storage.js';

function formatSection(title, items) {
  if (!items?.length) return '';
  return `${title}:\n${items.map(item => JSON.stringify(item, null, 2)).join('\n')}`;
}

export function buildProjectContext(options = {}) {
  const project = getProject();
  if (!project) return '';

  const sections = [
    formatSection('PROJECT', [{ id: project.id, name: project.name, description: project.description }]),
    formatSection('CHARACTERS', project.characters),
    formatSection('WORLD', project.world),
    formatSection('RELATIONSHIPS', project.relationships),
    formatSection('MEMORY', project.memory),
    formatSection('PLOT THREADS', project.plot),
    formatSection('EVENTS', project.events)
  ].filter(Boolean);

  if (options.chapterId) {
    const chapter = project.chapters.find(item => item.id === options.chapterId);
    if (chapter) sections.push(formatSection('CURRENT CHAPTER', [chapter]));
  }

  if (options.chatId) {
    const chat = project.chats.find(item => item.id === options.chatId);
    if (chat) sections.push(formatSection('CURRENT CHAT', chat.messages));
  }

  return sections.join('\n\n');
}

export function buildStoryContext(chapterId) {
  return buildProjectContext({ chapterId });
}

export function buildChatContext(chatId) {
  return buildProjectContext({ chatId });
}
