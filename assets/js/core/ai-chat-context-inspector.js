import { createAIChatContextManager } from './ai-chat-context-manager.js';
import { createAIChatContextPolicy } from './ai-chat-context-policy.js';

export function createAIChatContextInspector(options = {}) {
  const manager = options.manager || createAIChatContextManager(options);
  const policy = options.policy || createAIChatContextPolicy(options);

  return {
    inspect(messages, settings = {}) {
      const inspection = manager.inspect(messages, settings);
      const decision = policy.evaluate(inspection);

      return {
        ...inspection,
        ...decision,
        action: decision.shouldSuggestContinuation
          ? 'suggest-new-chat'
          : decision.shouldWarn
            ? 'warn'
            : 'continue'
      };
    }
  };
}
