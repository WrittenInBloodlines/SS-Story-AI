import { createModelAdapter } from './model-adapter.js';

function normalizeLocalResponse(response) {
  if (typeof response === 'string') {
    return { text: response, raw: response };
  }

  if (response?.text) {
    return { text: String(response.text), raw: response };
  }

  if (response?.response) {
    return { text: String(response.response), raw: response };
  }

  return { text: '', raw: response };
}

async function requestLocalEndpoint(request, provider) {
  if (!provider.endpoint) {
    throw new Error('Local model provider is missing an endpoint.');
  }

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      context: request.context,
      temperature: request.temperature,
      max_output_tokens: request.maxOutputTokens
    })
  });

  if (!response.ok) {
    throw new Error(`Local model request failed with status ${response.status}.`);
  }

  return normalizeLocalResponse(await response.json());
}

async function streamLocalEndpoint(request, provider, onToken) {
  if (!provider.endpoint) {
    throw new Error('Local model provider is missing an endpoint.');
  }

  const response = await fetch(provider.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      context: request.context,
      temperature: request.temperature,
      max_output_tokens: request.maxOutputTokens,
      stream: true
    })
  });

  if (!response.ok) {
    throw new Error(`Local model stream failed with status ${response.status}.`);
  }

  if (!response.body) {
    const result = normalizeLocalResponse(await response.json());
    if (result.text) onToken(result.text);
    return result;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    text += chunk;
    onToken(chunk);
  }

  return { text, raw: text };
}

export function createLocalModelAdapter(provider) {
  return createModelAdapter(provider, {
    generate: request => requestLocalEndpoint(request, provider),
    stream: (request, onToken) => streamLocalEndpoint(request, provider, onToken)
  });
}
