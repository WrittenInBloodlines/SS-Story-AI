export class AIModelError extends Error {
  constructor(message, code = 'MODEL_ERROR', details = {}) {
    super(message);
    this.name = 'AIModelError';
    this.code = code;
    this.details = details;
  }
}

export function createModelAdapter({ id, name, generate, stream } = {}) {
  if (!id) throw new AIModelError('A model adapter requires an id.', 'INVALID_ADAPTER');
  if (typeof generate !== 'function') throw new AIModelError('A model adapter requires a generate function.', 'INVALID_ADAPTER');

  return Object.freeze({
    id,
    name: name || id,
    async generate(request) {
      return generate(request);
    },
    async *stream(request) {
      if (typeof stream === 'function') {
        yield* stream(request);
        return;
      }

      yield await generate(request);
    }
  });
}

export function createUnavailableModelAdapter() {
  return createModelAdapter({
    id: 'unconfigured',
    name: 'No model configured',
    async generate() {
      throw new AIModelError(
        'No language model is configured yet. Add a provider before generating a response.',
        'MODEL_NOT_CONFIGURED'
      );
    }
  });
}
