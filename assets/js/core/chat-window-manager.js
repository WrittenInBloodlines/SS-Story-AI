import { getChatMessages } from './chat-memory.js';
import { getChatCompactions, createChatCompaction } from './chat-compaction.js';
import { getChatWindowState } from './chat-window-policy.js';

export function inspectChatWindow(project, chatId, options = {}) {
  if (!project || !chatId) return null;

  const messages = getChatMessages(project, chatId);
  const compactions = getChatCompactions(project, chatId);
  const policy = getChatWindowState(messages, options);

  return {
    chatId,
    ...policy,
    compactionCount: compactions.length,
    latestCompaction: compactions.at(-1) || null
  };
}

export function shouldCompactChat(project, chatId, options = {}) {
  const state = inspectChatWindow(project, chatId, options);
  return Boolean(state?.shouldWarn);
}

export function registerChatCompaction(project, chatId, data = {}) {
  if (!project || !chatId) return null;

  return createChatCompaction({
    ...data,
    chatId
  });
}
