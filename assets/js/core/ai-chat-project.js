import { createAIChatPersistentFlow } from './ai-chat-persistent-flow.js';
import { createAIChatOrchestrator } from './ai-chat-orchestrator.js';

export function createAIChatProject(project, gateway, options = {}) {
  const flow = options.flow || createAIChatPersistentFlow(options);
  const orchestrator = createAIChatOrchestrator(project, gateway, {
    ...options,
    messageFlow: flow
  });

  return {
    loadChat(chatId) {
      return flow.load(chatId);
    },

    async send(chatId, input = {}) {
      return orchestrator.send(chatId, input);
    },

    stop(chatId) {
      return orchestrator.stop(chatId);
    },

    destroy(chatId) {
      return orchestrator.destroy(chatId);
    },

    clearChat(chatId) {
      flow.clear(chatId);
    },

    reloadChat(chatId) {
      return flow.reload(chatId);
    }
  };
}
