export function createModelGateway({ client, generation } = {}) {
  if (!client || typeof client.generate !== 'function') throw new Error('A model client is required.');
  if (!generation || typeof generation.generate !== 'function') throw new Error('A generation engine is required.');

  return {
    isReady() {
      return client.isReady();
    },

    async test() {
      return client.testConnection();
    },

    async generate(request = {}) {
      if (!client.isReady()) throw new Error('No language model is configured.');
      return generation.generate(request);
    }
  };
}
