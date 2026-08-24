export function createAIChatContextContinuation(options = {}) {
  const history = options.history;
  const contextManager = options.contextManager;
  if (!history || typeof history.load !== 'function') {
    throw new Error('A chat history manager is required.');
  }
  if (!contextManager || typeof contextManager.build !== 'function') {
    throw new Error('A context manager is required.');
  }

  return {
    buildSourceContext(sourceChatId, settings = {}) {
      const messages = history.load(sourceChatId);
      const snapshot = contextManager.build(messages, settings);

      return {
        sourceChatId,
        snapshot,
        sourceMessageCount: messages.length,
        createdAt: new Date().toISOString()
      };
    },

    async prepareContinuation(sourceChatId, createChat, settings = {}) {
      if (typeof createChat !== 'function') {
        throw new Error('A createChat function is required.');
      }

      const sourceContext = this.buildSourceContext(sourceChatId, settings);
      const source = settings.sourceChat || { id: sourceChatId };

      const newChat = await createChat({
        title: settings.title || `${source.title || 'Chat'} - Continued`,
        projectId: source.projectId || settings.projectId || null,
        metadata: {
          ...(source.metadata || {}),
          continuedFromChatId: sourceChatId,
          continuationContextCreatedAt: sourceContext.createdAt
        }
      });

      return {
        sourceChatId,
        newChat,
        context: sourceContext.snapshot,
        sourcePreserved: true
      };
    }
  };
}
