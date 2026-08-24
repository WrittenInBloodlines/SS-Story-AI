import { newId, updateProject } from '../storage.js';
import { getChatMessages } from './chat-memory.js';
import { getChatCompactions } from './chat-compaction.js';

export function createChatContinuation(data = {}) {
  if (!data.sourceChatId || !data.targetChatId) return null;

  const continuation = {
    id: newId('chat_continuation'),
    sourceChatId: data.sourceChatId,
    targetChatId: data.targetChatId,
    reason: data.reason || 'manual-continuation',
    createdAt: new Date().toISOString()
  };

  updateProject(project => {
    project.chatContinuations.push(continuation);
  });

  return continuation;
}

export function buildContinuationContext(project, sourceChatId, options = {}) {
  if (!project || !sourceChatId) return null;

  const recentLimit = Number.isInteger(options.recentLimit) ? Math.max(0, options.recentLimit) : 30;
  const recentMessages = getChatMessages(project, sourceChatId, { limit: recentLimit });
  const compactions = getChatCompactions(project, sourceChatId);

  return {
    sourceChatId,
    recentMessages,
    compactions,
    continuationInstruction: 'Continue this conversation as a continuation of the source chat. Preserve established context and do not require the user to re-explain information already available in the provided context.'
  };
}

export function getChatContinuations(project, chatId) {
  if (!project || !chatId) return [];

  return (project.chatContinuations || []).filter(item =>
    item.sourceChatId === chatId || item.targetChatId === chatId
  );
}
