export const MODEL_PROVIDER_TYPES = Object.freeze({
  LOCAL: 'local',
  REMOTE: 'remote',
  CUSTOM: 'custom'
});

export function createModelProvider(config = {}) {
  return {
    id: config.id || 'default-model',
    name: config.name || 'Unnamed Model',
    type: config.type || MODEL_PROVIDER_TYPES.LOCAL,
    endpoint: config.endpoint || null,
    model: config.model || null,
    supportsStreaming: Boolean(config.supportsStreaming),
    supportsVision: Boolean(config.supportsVision),
    supportsVideo: Boolean(config.supportsVideo),
    maxContextCharacters: Number.isFinite(config.maxContextCharacters)
      ? config.maxContextCharacters
      : 20000
  };
}

export function validateModelProvider(provider) {
  if (!provider?.id) return { valid: false, reason: 'missing-id' };
  if (!provider?.name) return { valid: false, reason: 'missing-name' };
  if (!Object.values(MODEL_PROVIDER_TYPES).includes(provider.type)) {
    return { valid: false, reason: 'invalid-type' };
  }

  return { valid: true, reason: null };
}
