export function createAIChatContinuation(options = {}) {
  const createChat = options.createChat;
  if (typeof createChat !== 'function') {
    throw new Error('A createChat function is required.');
  }

  return {
    async continueInNewChat(sourceChat, settings = {}) {
      if (!sourceChat?.id) throw new Error('Source chat ID is required.');

      const newChat = await createChat({
        title: settings.title || `${sourceChat.title || 'Chat'} - Continued`,
        projectId: sourceChat.projectId || null,
        metadata: {
          ...(sourceChat.metadata || {}),
          continuedFromChatId: sourceChat.id,
          continuationCreatedAt: new Date().toISOString()
        }
      });

      return {
        sourceChatId: sourceChat.id,
        newChat,
        continuation: {
          sourceChatId: sourceChat.id,
          preserveSource: true,
          reuseProjectContext: settings.reuseProjectContext !== false,
          reuseMemoryContext: settings.reuseMemoryContext !== false,
          inspectSourceHistory: settings.inspectSourceHistory !== false
        }
      };
    }
  };
}
