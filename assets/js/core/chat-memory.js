import { newId, updateProject } from '../storage.js';

export const CHAT_MESSAGE_ROLES = Object.freeze({
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
});

export function createChatMessage(data = {}) {
  if (!data.content?.trim()) return null;

  const message = {
    id: newId('message'),
    role: data.role || CHAT_MESSAGE_ROLES.USER,
    content: data.content.trim(),
    chatId: data.chatId || null,
    chapterId: data.chapterId || null,
    sceneId: data.sceneId || null,
    createdAt: new Date().toISOString()
  };

  updateProject(project => {
    project.chatMessages.push(message);
  });

  return message;
}

export function getChatMessages(project, chatId, options = {}) {
  if (!project || !chatId) return [];

  let messages = (project.chatMessages || [])
    .filter(message => message.chatId === chatId);

  if (options.limit && Number.isInteger(options.limit)) {
    messages = messages.slice(-Math.max(0, options.limit));
  }

  return messages;
}

export function getRecentChatMessages(project, chatId, limit = 20) {
  return getChatMessages(project, chatId, { limit });
}

export function getChatMessage(project, messageId) {
  return project?.chatMessages?.find(message => message.id === messageId) || null;
}
