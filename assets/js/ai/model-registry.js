import { createUnavailableModelAdapter } from './model.js';
import { createLocalModelAdapter } from './local-model-adapter.js';

export function createModelRegistry() {
  const adapters = new Map();
  let activeId = null;

  const fallback = createUnavailableModelAdapter();
  adapters.set(fallback.id, fallback);

  const local = createLocalModelAdapter();
  if (local) {
    adapters.set(local.id, local);
    activeId = local.id;
  }

  return {
    register(adapter) {
      if (!adapter?.id || typeof adapter.generate !== 'function') {
        throw new Error('Invalid model adapter.');
      }
      adapters.set(adapter.id, adapter);
      if (!activeId || activeId === fallback.id) activeId = adapter.id;
      return adapter;
    },

    remove(id) {
      if (id === fallback.id) return false;
      const removed = adapters.delete(id);
      if (activeId === id) activeId = adapters.keys().next().value || fallback.id;
      return removed;
    },

    setActive(id) {
      if (!adapters.has(id)) throw new Error(`Unknown model adapter: ${id}`);
      activeId = id;
      return adapters.get(id);
    },

    getActive() {
      return adapters.get(activeId) || fallback;
    },

    get(id) {
      return adapters.get(id) || null;
    },

    list() {
      return [...adapters.values()].map(adapter => ({
        id: adapter.id,
        name: adapter.name
      }));
    }
  };
}
