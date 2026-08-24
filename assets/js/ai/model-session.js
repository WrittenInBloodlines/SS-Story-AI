export function createModelSession({ gateway } = {}) {
  if (!gateway || typeof gateway.generate !== 'function') throw new Error('A model gateway is required.');

  return {
    async send({ messages = [], projectId = null, chapterId = null, chatId = null, userInstruction = '', settings = {} } = {}) {
      const result = await gateway.generate({
        messages,
        projectId,
        chapterId,
        chatId,
        userInstruction,
        settings
      });

      return {
        text: result?.text ?? result?.content ?? String(result ?? ''),
        raw: result
      };
    }
  };
}
