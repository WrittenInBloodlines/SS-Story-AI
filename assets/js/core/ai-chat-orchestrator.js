import { createAIChatMessageFlow } from './ai-chat-message-flow.js';

export function createAIChatOrchestrator(project, gateway, options = {}) {
  const messageFlow = options.messageFlow || createAIChatMessageFlow();
  const controllers = new Map();

  function getController(chatId) {
    if (!controllers.has(chatId)) {
      controllers.set(chatId, {
        activeAssistantMessageId: null,
        stopped: false
      });
    }
    return controllers.get(chatId);
  }

  return {
    async send(chatId, input = {}) {
      if (!chatId) throw new Error('Chat ID is required.');

      const controller = getController(chatId);
      controller.stopped = false;

      const userMessage = messageFlow.addUserMessage(chatId, input);
      const assistantMessage = messageFlow.beginAssistantMessage(chatId, {
        replyTo: userMessage.id
      });
      controller.activeAssistantMessageId = assistantMessage.id;

      try {
        const result = await gateway.send(chatId, userMessage.text, {
          ...input,
          attachments: userMessage.attachments,
          onToken: token => {
            if (controller.stopped) return;
            messageFlow.appendAssistantText(chatId, assistantMessage.id, token);
            options.onToken?.({ chatId, messageId: assistantMessage.id, token });
          }
        });

        if (controller.stopped) {
          return messageFlow.completeAssistantMessage(chatId, assistantMessage.id, {
            stopped: true
          });
        }

        const resultText = typeof result?.text === 'string' ? result.text : '';
        const current = messageFlow.prepare({ text: resultText });
        const stored = messageFlow.completeAssistantMessage(chatId, assistantMessage.id, {
          text: current.text || assistantMessage.text,
          raw: result?.raw ?? null
        });

        options.onComplete?.({ chatId, message: stored });
        return stored;
      } catch (error) {
        const failed = messageFlow.failAssistantMessage(chatId, assistantMessage.id, error);
        options.onError?.({ chatId, message: failed, error });
        throw error;
      } finally {
        controller.activeAssistantMessageId = null;
      }
    },

    stop(chatId) {
      const controller = controllers.get(chatId);
      if (!controller) return false;

      controller.stopped = true;
      gateway.stop(chatId);
      return true;
    },

    destroy(chatId) {
      controllers.delete(chatId);
      gateway.destroy(chatId);
    }
  };
}
