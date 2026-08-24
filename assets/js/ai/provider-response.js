export function normalizeProviderResponse(response) {
  if (!response) throw new Error('Empty model response.');

  const choice = response.choices?.[0];
  const message = choice?.message;
  const text = message?.content ?? choice?.text ?? '';

  if (!text) throw new Error('The model returned no text.');

  return {
    text,
    finishReason: choice?.finish_reason || null,
    model: response.model || null,
    usage: response.usage || null,
    raw: response
  };
}
