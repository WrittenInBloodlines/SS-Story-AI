const STORAGE_KEY = 'ss-story-ai-model-config';

const DEFAULT_CONFIG = Object.freeze({
  provider: 'unconfigured',
  model: '',
  endpoint: '',
  apiKey: '',
  temperature: 0.8,
  maxTokens: 2000,
  streaming: true
});

function readConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function sanitize(config) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    temperature: Number.isFinite(Number(config.temperature)) ? Number(config.temperature) : DEFAULT_CONFIG.temperature,
    maxTokens: Number.isFinite(Number(config.maxTokens)) ? Number(config.maxTokens) : DEFAULT_CONFIG.maxTokens,
    streaming: config.streaming !== false
  };
}

export function createModelConfig() {
  let config = readConfig();

  return {
    get() {
      return { ...config, apiKey: config.apiKey ? 'configured' : '' };
    },

    getRuntimeConfig() {
      return { ...config };
    },

    set(next = {}) {
      config = sanitize(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      return this.get();
    },

    update(patch = {}) {
      return this.set({ ...config, ...patch });
    },

    clear() {
      config = { ...DEFAULT_CONFIG };
      localStorage.removeItem(STORAGE_KEY);
      return this.get();
    },

    isConfigured() {
      return Boolean(config.provider && config.provider !== 'unconfigured' && config.model);
    }
  };
}
