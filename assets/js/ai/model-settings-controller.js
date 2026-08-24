export function createModelSettingsController({ client, health } = {}) {
  if (!client) throw new Error('A model client is required.');

  return {
    configure(config) {
      client.configure(config);
      return client.getConfig ? client.getConfig() : config;
    },

    async test() {
      health?.setChecking(client.getConfig?.().model || null);
      try {
        const result = await client.testConnection();
        health?.setOnline({ model: result.model || client.getConfig?.().model || null, latencyMs: result.latencyMs || null });
        return result;
      } catch (error) {
        health?.setOffline(error.message || String(error));
        throw error;
      }
    }
  };
}
