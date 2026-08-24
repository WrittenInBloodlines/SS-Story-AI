export async function readProviderStream(response, onToken = () => {}) {
  if (!response?.body) throw new Error('The provider did not return a readable stream.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onToken(chunk);
  }

  const finalChunk = decoder.decode();
  if (finalChunk) {
    fullText += finalChunk;
    onToken(finalChunk);
  }

  return fullText;
}
