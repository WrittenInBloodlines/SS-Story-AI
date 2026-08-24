import { MODEL_PROVIDER_TYPES, validateModelProvider } from './model-provider.js';
import { createLocalModelAdapter } from './local-model-adapter.js';

export function createProviderConnection(provider) {
  const validation = validateModelProvider(provider);
  if (!validation.valid) {
    throw new Error(`Invalid model provider: ${validation.reason}`);
  }

  if (provider.type === MODEL_PROVIDER_TYPES.LOCAL) {
    return createLocalModelAdapter(provider);
  }

  throw new Error(`No connection adapter is registered for provider type: ${provider.type}`);
}

export async function testProviderConnection(provider) {
  const adapter = createProviderConnection(provider);
  const startedAt = performance.now();

  try {
    await adapter.generate({
      providerId: provider.id,
      model: provider.model,
      messages: [],
      context: {
        type: 'connection-test',
        content: 'Connection test. Return a short confirmation.'
      },
      temperature: 0,
      maxOutputTokens: 16,
      stream: false,
      attachments: [],
      metadata: { connectionTest: true }
    });

    return {
      connected: true,
      latencyMs: Math.round(performance.now() - startedAt),
      error: null
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
