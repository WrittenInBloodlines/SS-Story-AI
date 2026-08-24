import { getRecentChatMessages } from './chat-memory.js';
import { getChatCompactions } from './chat-compaction.js';
import { assembleContext } from './context-assembler.js';
import { prioritizeContext } from './context-priority.js';
import { trimToBudget } from './context-budget.js';

export function assembleChatContext(project, chatId, options = {}) {
  if (!project || !chatId) return null;

  const recentLimit = Number.isInteger(options.recentLimit)
    ? Math.max(0, options.recentLimit)
    : 30;
  const maxCharacters = Number.isFinite(options.maxCharacters)
    ? Math.max(1, options.maxCharacters)
    : 20000;

  const recentMessages = getRecentChatMessages(project, chatId, recentLimit);
  const compactions = getChatCompactions(project, chatId);
  const query = options.query || recentMessages.map(message => message.content).join(' ');
  const storyContext = assembleContext(project, {
    ...options,
    query,
    maxCharacters
  });

  const chatItems = [
    ...compactions.map(compaction => ({
      contextType: 'olderChat',
      contextPriority: 40,
      content: compaction.content,
      source: compaction
    })),
    ...recentMessages.map(message => ({
      contextType: 'recentChat',
      contextPriority: 60,
      content: `${message.role}: ${message.content}`,
      source: message
    }))
  ];

  const storyItems = storyContext?.contextItems || [];
  const selected = trimToBudget(
    prioritizeContext([...storyItems, ...chatItems]),
    maxCharacters
  );

  return {
    chatId,
    recentMessages,
    compactions,
    storyContext,
    contextItems: selected,
    contextSize: selected.reduce((total, item) => total + String(item.content || '').length, 0),
    contextBudget: maxCharacters,
    generatedAt: new Date().toISOString()
  };
}
