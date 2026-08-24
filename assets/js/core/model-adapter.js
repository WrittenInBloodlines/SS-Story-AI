import { validateModelProvider } from './model-provider.js';
import { validateModelRequest } from './model-request.js';

export function createModelAdapter(provider, handlers = {}) {
  const providerValidation = validateModelProvider(provider);
  if (!providerValidation.valid) {
    throw new Error(`Invalid model provider: ${providerValidation.reason}`);
  }

  return {
    provider,
    async generate(request) {
      const requestValidation = validateModelRequest(request);
      if (!requestValidation.valid) {
        throw new Error(`Invalid model request: ${requestValidation.reason}`);
      }

      if (typeof handlers.generate !== 'function') {
        throw new Error('Model adapter does not implement generate().');
      }

      return handlers.generate(request);
    },
    async stream(request, onToken) {
      const requestValidation = validateModelRequest(request);
      if (!requestValidation.valid) {
        throw new Error(`Invalid model request: ${requestValidation.reason}`);
      }

      if (typeof handlers.stream !== 'function') {
        throw new Error('Model adapter does not implement stream().');
      }

      return handlers.stream(request, onToken);
    }
  };
}
