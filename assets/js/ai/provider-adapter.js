import { AIModelError, createModelAdapter } from './model.js';

export function createProviderAdapter(config = {}) {
  const provider = config.provider;
  const endpoint = String(config.endpoint || '').trim();

  if (!provider || provider === 'unconfigured') {
    throw new AIModelError('A provider must be selected.', 'PROVIDER_NOT_CONFIGURED');
  }

  if (!endpoint) {
    throw new AIModelError('A provider endpoint is required.', 'ENDPOINT_NOT_CONFIGURED');
  }

  return createModelAdapter({
    id: `${provider}:${config.model || 'default'}`,
    name: config.model || provider,
    async generate(request) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: config.model,
          messages: request.messages || [],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: false
        })
      });

      if (!response.ok) {
        throw new AIModelError(
          `Provider request failed with status ${response.status}.`,
          'PROVIDER_REQUEST_FAILED',
          { status: response.status }
        );
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || data?.output?.[0]?.content?.[0]?.text || '';

      if (!text) {
        throw new AIModelError('The provider returned no assistant text.', 'EMPTY_MODEL_RESPONSE');
      }

      return text;
    }
  });
}
