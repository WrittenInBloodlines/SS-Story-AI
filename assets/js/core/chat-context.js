import { getRecentChatMessages } from './chat-memory.js';
import { getChatCompactions } from './chat-compaction.js';
import { assembleContext } from './context-assembler.js';

export function buildChatContext(project, chatId, options = {}) {
  if (!project || !chatId) return null;

  const recentLimit = Number.isInteger(options.recentLimit)
    ? Math.max(0, options.recentLimit)
    : 30;

  const recentMessages = getRecentChatMessages(project, chatId, recentLimit);
  const compactions = getChatCompactions(project, chatId);
  const query = options.query || recentMessages.map(message => message.content).join(' ');

  const storyContext = assembleContext(project, {
    ...options,
    query,
    maxCharacters: options.maxCharacters
  });

  return {
    chatId,
    recentMessages,
    compactions,
    storyContext,
    generatedAt: new Date().toISOString()
  };
}
