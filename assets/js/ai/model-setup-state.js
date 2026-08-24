export function createModelSetupState() {
  let state = { configured: false, testing: false, connected: false, error: null };

  return {
    get() {
      return { ...state };
    },
    startTest() {
      state = { ...state, testing: true, error: null };
      return this.get();
    },
    success() {
      state = { configured: true, testing: false, connected: true, error: null };
      return this.get();
    },
    failure(error) {
      state = { ...state, testing: false, connected: false, error: String(error || 'Connection failed.') };
      return this.get();
    }
  };
}
