import { buildStoryInstruction } from './prompt.js';
import { createModelRegistry } from './model-registry.js';

function normalizeMessages(messages = []) {
  return messages.map(message => ({
    role: message.role || 'user',
    content: typeof message.content === 'string' ? message.content : String(message.text || '')
  }));
}

export function createAIGenerationEngine(options = {}) {
  const registry = options.registry || createModelRegistry();

  return {
    getModels() {
      return registry.list();
    },

    setModel(id) {
      return registry.setActive(id);
    },

    getModel() {
      return registry.getActive();
    },

    async generate({ projectId = null, chapterId = null, chatId = null, messages = [], userInstruction = '', settings = {} } = {}) {
      const model = registry.getActive();
      const systemInstruction = buildStoryInstruction({ chapterId, userInstruction });

      const request = {
        model: model.id,
        projectId,
        chapterId,
        chatId,
        system: systemInstruction,
        messages: normalizeMessages(messages),
        settings: {
          temperature: Number.isFinite(settings.temperature) ? settings.temperature : 0.8,
          maxTokens: Number.isFinite(settings.maxTokens) ? settings.maxTokens : 2000,
          ...settings
        }
      };

      return model.generate(request);
    },

    async *stream(request = {}) {
      const model = registry.getActive();
      const systemInstruction = buildStoryInstruction({
        chapterId: request.chapterId,
        userInstruction: request.userInstruction || ''
      });

      yield* model.stream({
        ...request,
        model: model.id,
        system: systemInstruction,
        messages: normalizeMessages(request.messages || [])
      });
    }
  };
}
