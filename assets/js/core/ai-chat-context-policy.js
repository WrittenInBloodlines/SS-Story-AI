export function createAIChatContextPolicy(options = {}) {
  const warningRatio = Number.isFinite(options.warningRatio) ? options.warningRatio : 0.8;
  const criticalRatio = Number.isFinite(options.criticalRatio) ? options.criticalRatio : 1;

  return {
    evaluate({ estimatedCharacters = 0, maxCharacters = 0, totalMessages = 0 } = {}) {
      if (!maxCharacters || maxCharacters <= 0) {
        return {
          level: 'unlimited',
          shouldWarn: false,
          shouldSuggestContinuation: false,
          shouldBlockGeneration: false,
          totalMessages,
          estimatedCharacters,
          maxCharacters
        };
      }

      const ratio = estimatedCharacters / maxCharacters;
      const shouldWarn = ratio >= warningRatio;
      const shouldSuggestContinuation = ratio >= criticalRatio;

      return {
        level: shouldSuggestContinuation ? 'critical' : shouldWarn ? 'warning' : 'normal',
        shouldWarn,
        shouldSuggestContinuation,
        shouldBlockGeneration: false,
        totalMessages,
        estimatedCharacters,
        maxCharacters,
        ratio
      };
    }
  };
}
