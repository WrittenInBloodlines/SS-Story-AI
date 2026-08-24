import { createModelConfig } from './provider-config.js';
import { createUnavailableModelAdapter } from './model.js';
import { createProviderAdapter } from './provider-adapter.js';

export function createModelClient(options = {}) {
  const configStore = options.config || createModelConfig();
  let adapter = createUnavailableModelAdapter();

  function refresh() {
    const config = configStore.getRuntimeConfig();
    if (!configStore.isConfigured()) {
      adapter = createUnavailableModelAdapter();
      return adapter;
    }

    adapter = createProviderAdapter(config);
    return adapter;
  }

  return {
    getConfig() {
      return configStore.get();
    },

    refresh,

    isReady() {
      return configStore.isConfigured();
    },

    async generate(request) {
      refresh();
      return adapter.generate(request);
    },

    async testConnection() {
      refresh();
      const startedAt = Date.now();

      try {
        await adapter.generate({
          messages: [{ role: 'user', content: 'Reply with the single word: OK' }]
        });

        return {
          ok: true,
          latencyMs: Date.now() - startedAt,
          model: adapter.name
        };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - startedAt,
          model: adapter.name,
          code: error?.code || 'CONNECTION_FAILED',
          message: error?.message || 'Connection test failed.'
        };
      }
    }
  };
}
