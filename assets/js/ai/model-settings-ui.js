export function createModelSettingsUI({ controller, state } = {}) {
  if (!controller) throw new Error('A model settings controller is required.');

  return {
    async save(config) {
      const saved = controller.configure(config);
      state?.success();
      return saved;
    },

    async test() {
      state?.startTest();
      try {
        const result = await controller.test();
        state?.success();
        return result;
      } catch (error) {
        state?.failure(error?.message || error);
        throw error;
      }
    },

    getState() {
      return state?.get() || null;
    }
  };
}
