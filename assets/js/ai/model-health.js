export function createModelHealth() {
  let state = {
    status: 'unknown',
    model: null,
    latencyMs: null,
    lastCheckedAt: null,
    error: null
  };

  return {
    get() {
      return { ...state };
    },
    setChecking(model = null) {
      state = { ...state, status: 'checking', model, error: null };
      return this.get();
    },
    setOnline(details = {}) {
      state = {
        ...state,
        status: 'online',
        ...details,
        lastCheckedAt: new Date().toISOString(),
        error: null
      };
      return this.get();
    },
    setOffline(error = null) {
      state = {
        ...state,
        status: 'offline',
        lastCheckedAt: new Date().toISOString(),
        error
      };
      return this.get();
    }
  };
}
