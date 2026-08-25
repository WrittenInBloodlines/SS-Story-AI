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
        // Keep the first local Android generation short. Gemma 3 1B can be
        // slow on-device, so 96 tokens is enough for quick conversational
        // tests while still allowing a useful answer.
        maxTokens: Math.min(request.settings?.maxTokens ?? 96, 256)
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

        // 2 minutes is enough for a short 96-token response, but prevents
        // the UI from being stuck indefinitely if native inference fails.
        const timeout = setTimeout(() => {
          finish(() => {
            reject(new AIModelError(
              'Gemma took too long to generate a response.',
              'LOCAL_MODEL_TIMEOUT'
            ));
          });
        }, 120000);

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
