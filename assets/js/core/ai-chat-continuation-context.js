export function createAIChatContinuationContext(options = {}) {
  const history = options.history;
  const builder = options.builder;

  if (!history || typeof history.load !== 'function') {
    throw new Error('A chat history manager is required.');
  }
  if (!builder || typeof builder.build !== 'function') {
    throw new Error('A context builder is required.');
  }

  return {
    async create(sourceChatId, createChat, settings = {}) {
      if (!sourceChatId) throw new Error('Source chat ID is required.');
      if (typeof createChat !== 'function') throw new Error('A createChat function is required.');

      const sourceMessages = history.load(sourceChatId);
      const context = builder.build({
        recentMessages: sourceMessages,
        memoryContext: settings.memoryContext || [],
        pinnedContext: settings.pinnedContext || [],
        instructions: settings.instructions || []
      }, settings);

      const newChat = await createChat({
        title: settings.title || 'Continued Chat',
        projectId: settings.projectId || null,
        metadata: {
          ...(settings.metadata || {}),
          continuedFromChatId: sourceChatId,
          sourceHistoryAvailable: true
        }
      });

      return {
        sourceChatId,
        newChat,
        context,
        sourceHistoryPreserved: true
      };
    }
  };
}
