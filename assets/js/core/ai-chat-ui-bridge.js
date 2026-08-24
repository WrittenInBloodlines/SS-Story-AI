export function createAIChatUIBridge(gateway, ui = {}) {
  const activeChats = new Set();

  function emit(name, payload) {
    if (typeof ui[name] === 'function') {
      ui[name](payload);
    }
  }

  return {
    open(chatId) {
      if (!chatId) throw new Error('Chat ID is required.');
      activeChats.add(chatId);
      emit('onChatOpen', { chatId });
      return gateway.getSession(chatId, {
        onSessionStart: payload => emit('onSessionStart', payload),
        onSessionStop: payload => emit('onSessionStop', payload),
        onSessionDestroy: payload => emit('onSessionDestroy', payload),
        onStart: payload => emit('onRequestStart', payload),
        onWindowState: payload => emit('onWindowState', payload),
        onToken: payload => emit('onToken', payload),
        onComplete: payload => emit('onComplete', payload),
        onError: payload => emit('onError', payload)
      });
    },

    async send(chatId, content, options = {}) {
      if (!activeChats.has(chatId)) this.open(chatId);
      return gateway.send(chatId, content, {
        ...options,
        callbacks: options.callbacks || {}
      });
    },

    close(chatId) {
      activeChats.delete(chatId);
      gateway.stop(chatId);
      emit('onChatClose', { chatId });
    },

    destroy(chatId) {
      activeChats.delete(chatId);
      gateway.destroy(chatId);
      emit('onChatDestroy', { chatId });
    }
  };
}
