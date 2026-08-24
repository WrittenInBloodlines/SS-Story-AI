import { createChatSummary } from './chat-summary.js';
import { getStoryContext } from './story-context.js';
import { createChat } from './chat-manager.js';
import { updateProject } from '../storage.js';

export function prepareContinuation(project, chatId, chapterId = null) {
  if (!project) return null;

  const chat = project.chats?.find(item => item.id === chatId);
  if (!chat) return null;

  return {
    sourceChatId: chat.id,
    sourceChatTitle: chat.title,
    summary: createChatSummary(chat),
    storyContext: getStoryContext(project, { chatId, chapterId }),
    createdAt: new Date().toISOString()
  };
}

export function createContinuationChat(title = 'Continued Chat') {
  return createChat(title);
}

export function attachContinuation(project, chatId, continuation) {
  if (!project || !continuation) return null;

  let updatedChat = null;

  updateProject(currentProject => {
    const chat = currentProject.chats.find(item => item.id === chatId);
    if (!chat) return;

    chat.continuation = {
      sourceChatId: continuation.sourceChatId,
      sourceChatTitle: continuation.sourceChatTitle,
      createdAt: continuation.createdAt
    };
    chat.updatedAt = new Date().toISOString();
    updatedChat = chat;
  });

  return updatedChat;
}
