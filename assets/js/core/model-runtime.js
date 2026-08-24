import { getModelProvider } from './model-registry.js';
import { createModelService } from './model-service.js';

const services = new Map();

export function registerModelService(provider, handlers = {}) {
  const service = createModelService(provider, handlers);
  services.set(provider.id, service);
  return service;
}

export function unregisterModelService(providerId) {
  return services.delete(providerId);
}

export function getModelService(providerId) {
  return services.get(providerId) || null;
}

export function getRegisteredModelServices() {
  return Array.from(services.values());
}

export function resolveModelService(providerId) {
  const service = getModelService(providerId);
  if (service) return service;

  const provider = getModelProvider(providerId);
  if (!provider) return null;

  return registerModelService(provider);
}

export function clearModelServices() {
  services.clear();
}
