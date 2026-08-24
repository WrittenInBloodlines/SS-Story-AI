export function createModelTestMessage(text = 'Reply with a short confirmation that the model connection works.') {
  return {
    role: 'user',
    content: String(text).trim()
  };
}
