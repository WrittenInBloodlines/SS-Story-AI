export function createAIChatLengthWarning(options = {}) {
  const warningThreshold = Number.isFinite(options.warningThreshold)
    ? options.warningThreshold
    : 0.8;

  return {
    evaluate({ estimatedCharacters = 0, maxCharacters = 0, totalMessages = 0 } = {}) {
      if (!maxCharacters || maxCharacters <= 0) {
        return {
          level: 'unknown',
          shouldWarn: false,
          shouldSuggestNewChat: false,
          estimatedCharacters,
          maxCharacters,
          totalMessages
        };
      }

      const ratio = estimatedCharacters / maxCharacters;
      const shouldWarn = ratio >= warningThreshold;
      const shouldSuggestNewChat = ratio >= 1;

      return {
        level: shouldSuggestNewChat ? 'critical' : shouldWarn ? 'warning' : 'normal',
        shouldWarn,
        shouldSuggestNewChat,
        ratio,
        estimatedCharacters,
        maxCharacters,
        totalMessages
      };
    }
  };
}
