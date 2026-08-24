export const CHAT_STATES = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading',
  GENERATING: 'generating',
  STOPPED: 'stopped',
  COMPLETE: 'complete',
  ERROR: 'error'
});

export function createAIChatState() {
  let state = CHAT_STATES.IDLE;
  let error = null;
  let activeMessageId = null;

  return {
    get() {
      return { state, error, activeMessageId };
    },

    set(nextState, changes = {}) {
      state = nextState;
      error = changes.error ?? null;
      activeMessageId = changes.activeMessageId ?? activeMessageId;
      return this.get();
    },

    reset() {
      state = CHAT_STATES.IDLE;
      error = null;
      activeMessageId = null;
      return this.get();
    }
  };
}
