import { validateModelProvider } from './model-provider.js';

const providers = new Map();

export function registerModelProvider(provider) {
  const validation = validateModelProvider(provider);
  if (!validation.valid) {
    throw new Error(`Invalid model provider: ${validation.reason}`);
  }

  providers.set(provider.id, provider);
  return provider;
}

export function unregisterModelProvider(providerId) {
  return providers.delete(providerId);
}

export function getModelProvider(providerId) {
  return providers.get(providerId) || null;
}

export function getModelProviders() {
  return Array.from(providers.values());
}

export function hasModelProvider(providerId) {
  return providers.has(providerId);
}

export function clearModelProviders() {
  providers.clear();
}
