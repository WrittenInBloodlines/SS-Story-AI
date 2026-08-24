import { createAIChatComposer } from './ai-chat-composer.js';
import { createAIChatMessageStore } from './ai-chat-message-store.js';

export function createAIChatMessageFlow(store = createAIChatMessageStore()) {
  const composer = createAIChatComposer();

  return {
    prepare(input = {}) {
      return composer.compose(input);
    },

    addUserMessage(chatId, input = {}) {
      const message = composer.compose(input);
      return store.add(chatId, {
        role: 'user',
        status: 'complete',
        ...message
      });
    },

    beginAssistantMessage(chatId, metadata = {}) {
      return store.add(chatId, {
        role: 'assistant',
        status: 'generating',
        text: '',
        attachments: [],
        metadata
      });
    },

    appendAssistantText(chatId, messageId, text) {
      const current = store.getAll(chatId).find(message => message.id === messageId);
      if (!current) return null;

      return store.update(chatId, messageId, {
        text: `${current.text || ''}${String(text || '')}`,
        status: 'generating'
      });
    },

    completeAssistantMessage(chatId, messageId, changes = {}) {
      return store.update(chatId, messageId, {
        ...changes,
        status: 'complete'
      });
    },

    failAssistantMessage(chatId, messageId, error) {
      return store.update(chatId, messageId, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
}
