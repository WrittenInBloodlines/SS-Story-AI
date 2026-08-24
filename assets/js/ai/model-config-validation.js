export function validateModelConfig(config = {}) {
  const errors = [];

  if (!config.provider) errors.push('Provider is required.');
  if (!config.model) errors.push('Model name is required.');
  if (!config.endpoint) errors.push('Endpoint is required.');
  if (!config.apiKey) errors.push('API key is required.');

  try {
    if (config.endpoint) new URL(config.endpoint);
  } catch {
    errors.push('Endpoint must be a valid URL.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
