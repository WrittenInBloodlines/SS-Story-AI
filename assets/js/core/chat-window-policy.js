export const CHAT_WINDOW_DEFAULTS = Object.freeze({
  warningCharacters: 120000,
  criticalCharacters: 180000,
  recentMessageLimit: 30,
  compactionMessageThreshold: 100
});

export function estimateChatCharacters(messages = []) {
  return messages.reduce((total, message) => {
    return total + String(message?.content || '').length;
  }, 0);
}

export function getChatWindowState(messages = [], options = {}) {
  const warningCharacters = Number.isFinite(options.warningCharacters)
    ? options.warningCharacters
    : CHAT_WINDOW_DEFAULTS.warningCharacters;
  const criticalCharacters = Number.isFinite(options.criticalCharacters)
    ? options.criticalCharacters
    : CHAT_WINDOW_DEFAULTS.criticalCharacters;
  const compactionMessageThreshold = Number.isInteger(options.compactionMessageThreshold)
    ? options.compactionMessageThreshold
    : CHAT_WINDOW_DEFAULTS.compactionMessageThreshold;

  const characterCount = estimateChatCharacters(messages);
  const messageCount = messages.length;

  let state = 'normal';
  if (characterCount >= criticalCharacters) {
    state = 'critical';
  } else if (characterCount >= warningCharacters || messageCount >= compactionMessageThreshold) {
    state = 'warning';
  }

  return {
    state,
    characterCount,
    messageCount,
    shouldWarn: state !== 'normal',
    shouldOfferContinuation: state === 'critical'
  };
}
