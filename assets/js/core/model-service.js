import { createModelRequest, validateModelRequest } from './model-request.js';
import { createModelAdapter } from './model-adapter.js';

export function createModelService(provider, handlers = {}) {
  const adapter = createModelAdapter(provider, handlers);

  return {
    provider,

    async generate(context, options = {}) {
      const request = createModelRequest(provider, context, options);
      const validation = validateModelRequest(request);

      if (!validation.valid) {
        throw new Error(`Invalid model request: ${validation.reason}`);
      }

      return adapter.generate(request);
    },

    async stream(context, options = {}, onToken = () => {}) {
      const request = createModelRequest(provider, context, {
        ...options,
        stream: true
      });

      const validation = validateModelRequest(request);
      if (!validation.valid) {
        throw new Error(`Invalid model request: ${validation.reason}`);
      }

      return adapter.stream(request, onToken);
    }
  };
}
