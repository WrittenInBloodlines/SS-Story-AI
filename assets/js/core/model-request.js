import { validateModelProvider } from './model-provider.js';

export function createModelRequest(provider, context, options = {}) {
  const validation = validateModelProvider(provider);
  if (!validation.valid) {
    throw new Error(`Invalid model provider: ${validation.reason}`);
  }

  return {
    providerId: provider.id,
    model: provider.model,
    messages: options.messages || [],
    context,
    temperature: Number.isFinite(options.temperature) ? options.temperature : 0.8,
    maxOutputTokens: Number.isInteger(options.maxOutputTokens) ? options.maxOutputTokens : null,
    stream: options.stream !== false,
    attachments: Array.isArray(options.attachments) ? options.attachments : [],
    metadata: options.metadata || {}
  };
}

export function validateModelRequest(request) {
  if (!request?.providerId) return { valid: false, reason: 'missing-provider' };
  if (!request?.context) return { valid: false, reason: 'missing-context' };
  if (!Array.isArray(request.messages)) return { valid: false, reason: 'invalid-messages' };
  if (!Array.isArray(request.attachments)) return { valid: false, reason: 'invalid-attachments' };

  return { valid: true, reason: null };
}
