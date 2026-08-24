import { createModelAdapter, AIModelError } from './model.js';

export function createLocalModelAdapter() {
  if (!window.AndroidBridge || typeof window.AndroidBridge.generateGemma !== 'function') {
    return null;
  }

  return createModelAdapter({
    id: 'gemma-local',
    name: 'Gemma • Local Android',
    async generate(request) {
      const payload = JSON.stringify({
        system: request.system || '',
        messages: request.messages || [],
        temperature: request.settings?.temperature ?? 0.8,
        maxTokens: request.settings?.maxTokens ?? 2000
      });

      const result = window.AndroidBridge.generateGemma(payload);
      if (!result) {
        throw new AIModelError('Gemma is not loaded on this device yet.', 'LOCAL_MODEL_NOT_LOADED');
      }

      let data;
      try {
        data = JSON.parse(result);
      } catch {
        throw new AIModelError('The local model returned an invalid response.', 'LOCAL_MODEL_INVALID_RESPONSE');
      }

      if (!data.ok) {
        throw new AIModelError(data.message || 'Gemma could not generate a response.', data.code || 'LOCAL_MODEL_FAILED');
      }

      return data.text || '';
    }
  });
}
