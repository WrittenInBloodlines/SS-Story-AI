import { createModelAdapter, AIModelError } from './model.js';

function createPayload(request) {
  return JSON.stringify({
    system: request.system || '',
    messages: request.messages || [],
    temperature: request.settings?.temperature ?? 0.8,
    // Give story generation enough room while still keeping normal replies
    // reasonably bounded. This is a maximum, not a requirement to generate
    // this many tokens.
    maxTokens: Math.min(request.settings?.maxTokens ?? 256, 256)
  });
}

function startGemmaRequest(request) {
  const requestId = `gemma-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.AndroidBridge.generateGemmaAsync(requestId, createPayload(request));
  return requestId;
}

export function createLocalModelAdapter() {
  if (!window.AndroidBridge || typeof window.AndroidBridge.generateGemmaAsync !== 'function') {
    return null;
  }

  return createModelAdapter({
    id: 'gemma-local',
    name: 'Gemma • Local Android',

    async generate(request) {
      let text = '';
      for await (const token of this.stream(request)) text += token;
      return text;
    },

    async *stream(request) {
      const requestId = `gemma-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const queue = [];
      let finished = false;
      let failure = null;
      let wake = null;

      const signal = () => {
        if (wake) {
          const resolve = wake;
          wake = null;
          resolve();
        }
      };

      const handleToken = (event) => {
        const data = event?.detail;
        if (!data || data.requestId !== requestId) return;
        if (data.token) queue.push(String(data.token));
        signal();
      };

      const handleResult = (event) => {
        const data = event?.detail;
        if (!data || data.requestId !== requestId) return;

        if (!data.ok) {
          failure = new AIModelError(
            data.message || 'Gemma could not generate a response.',
            data.code || 'LOCAL_MODEL_FAILED'
          );
        }

        finished = true;
        signal();
      };

      window.addEventListener('ss-gemma-token', handleToken);
      window.addEventListener('ss-gemma-generation', handleResult);

      const timeout = setTimeout(() => {
        if (!finished) {
          failure = new AIModelError(
            'Gemma took too long to generate a response.',
            'LOCAL_MODEL_TIMEOUT'
          );
          finished = true;
          signal();
        }
      }, 180000);

      try {
        window.AndroidBridge.generateGemmaAsync(requestId, createPayload(request));

        while (!finished || queue.length > 0) {
          while (queue.length > 0) yield queue.shift();
          if (!finished) await new Promise(resolve => { wake = resolve; });
        }

        if (failure) throw failure;
      } catch (error) {
        if (error instanceof AIModelError) throw error;
        throw new AIModelError(
          error?.message || 'Could not start local Gemma generation.',
          'LOCAL_MODEL_START_FAILED'
        );
      } finally {
        clearTimeout(timeout);
        window.removeEventListener('ss-gemma-token', handleToken);
        window.removeEventListener('ss-gemma-generation', handleResult);
      }
    }
  });
}
