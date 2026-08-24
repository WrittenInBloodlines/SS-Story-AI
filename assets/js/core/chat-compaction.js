import { newId, updateProject } from '../storage.js';

export const COMPACTION_TYPES = Object.freeze({
  SUMMARY: 'summary',
  CHAPTER: 'chapter',
  SCENE: 'scene'
});

export function createChatCompaction(data = {}) {
  if (!data.chatId || !data.content?.trim()) return null;

  const compaction = {
    id: newId('chat_compaction'),
    chatId: data.chatId,
    type: data.type || COMPACTION_TYPES.SUMMARY,
    content: data.content.trim(),
    startMessageId: data.startMessageId || null,
    endMessageId: data.endMessageId || null,
    messageCount: Number.isInteger(data.messageCount) ? data.messageCount : 0,
    createdAt: new Date().toISOString()
  };

  updateProject(project => {
    project.chatCompactions.push(compaction);
  });

  return compaction;
}

export function getChatCompactions(project, chatId) {
  if (!project || !chatId) return [];

  return (project.chatCompactions || [])
    .filter(item => item.chatId === chatId)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function getLatestChatCompaction(project, chatId) {
  const compactions = getChatCompactions(project, chatId);
  return compactions.at(-1) || null;
}
