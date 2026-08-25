import { createModelAdapter, AIModelError } from './model.js';

export function createLocalModelAdapter() {
  if (!window.AndroidBridge || typeof window.AndroidBridge.generateGemmaAsync !== 'function') {
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
        // Keep local Gemma responses deliberately short while we verify
        // native inference on-device. 48 tokens is enough for a normal
        // conversational answer and greatly reduces the chance of a slow
        // phone spending two minutes on a simple test prompt.
        maxTokens: Math.min(request.settings?.maxTokens ?? 48, 128)
      });

      const requestId = `gemma-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      return await new Promise((resolve, reject) => {
        let settled = false;

        const cleanup = () => {
          window.removeEventListener('ss-gemma-generation', handleResult);
          clearTimeout(timeout);
        };

        const finish = (callback) => {
          if (settled) return;
          settled = true;
          cleanup();
          callback();
        };

        const handleResult = (event) => {
          const data = event?.detail;
          if (!data || data.requestId !== requestId) return;

          finish(() => {
            if (!data.ok) {
              reject(new AIModelError(
                data.message || 'Gemma could not generate a response.',
                data.code || 'LOCAL_MODEL_FAILED'
              ));
              return;
            }

            resolve(data.text || '');
          });
        };

        // Do not leave the chat waiting for two minutes for the first test.
        // Native generation is capped to a short response above, so one
        // minute is a much better failure boundary during on-device testing.
        const timeout = setTimeout(() => {
          finish(() => {
            reject(new AIModelError(
              'Gemma took too long to generate a response.',
              'LOCAL_MODEL_TIMEOUT'
            ));
          });
        }, 60000);

        window.addEventListener('ss-gemma-generation', handleResult);

        try {
          window.AndroidBridge.generateGemmaAsync(requestId, payload);
        } catch (error) {
          finish(() => {
            reject(new AIModelError(
              error?.message || 'Could not start local Gemma generation.',
              'LOCAL_MODEL_START_FAILED'
            ));
          });
        }
      });
    }
  });
}
