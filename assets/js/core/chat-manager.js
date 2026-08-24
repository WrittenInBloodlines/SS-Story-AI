import { newId, updateProject } from '../storage.js';

export function createChat(title = 'New Chat') {
  const chat = {
    id: newId('chat'),
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.chats.push(chat);
  });

  return chat;
}

export function addMessage(chatId, role, text, metadata = {}) {
  if (!text?.trim()) return null;

  const message = {
    id: newId('message'),
    role,
    text: text.trim(),
    metadata,
    createdAt: new Date().toISOString()
  };

  updateProject(project => {
    const chat = project.chats.find(item => item.id === chatId);
    if (!chat) return;

    chat.messages.push(message);
    chat.updatedAt = new Date().toISOString();
  });

  return message;
}

export function getChat(project, chatId) {
  return project?.chats?.find(chat => chat.id === chatId) || null;
}
