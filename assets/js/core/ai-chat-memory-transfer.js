export function createAIChatMemoryTransfer(options = {}) {
  const history = options.history;
  const contextManager = options.contextManager;
  if (!history || typeof history.load !== 'function') {
    throw new Error('A chat history manager is required.');
  }
  if (!contextManager || typeof contextManager.build !== 'function') {
    throw new Error('A context manager is required.');
  }

  return {
    inspect(sourceChatId, settings = {}) {
      const messages = history.load(sourceChatId);
      const snapshot = contextManager.build(messages, settings);

      return {
        sourceChatId,
        snapshot,
        sourceMessageCount: messages.length,
        sourceHistoryPreserved: true,
        transferable: true
      };
    },

    createTransfer(sourceChatId, settings = {}) {
      const inspected = this.inspect(sourceChatId, settings);

      return {
        type: 'chat-continuation',
        sourceChatId,
        createdAt: new Date().toISOString(),
        sourceHistoryPreserved: true,
        context: inspected.snapshot,
        memoryPolicy: {
          inspectSourceHistory: settings.inspectSourceHistory !== false,
          reuseProjectContext: settings.reuseProjectContext !== false,
          reuseMemoryContext: settings.reuseMemoryContext !== false
        }
      };
    }
  };
}
