export function createAIChatComposer(pipeline) {
  if (!pipeline) {
    throw new Error('AI chat pipeline is required.');
  }

  function normalizeAttachments(attachments) {
    if (!Array.isArray(attachments)) return [];

    return attachments
      .filter(Boolean)
      .map((attachment, index) => ({
        id: attachment.id || `attachment-${index + 1}`,
        type: attachment.type || 'unknown',
        name: attachment.name || null,
        url: attachment.url || null,
        mimeType: attachment.mimeType || null,
        size: Number.isFinite(attachment.size) ? attachment.size : 0,
        source: attachment.source || null,
        metadata: attachment.metadata || {}
      }));
  }

  return {
    async submit(chatId, content, options = {}) {
      const text = String(content || '').trim();
      const attachments = normalizeAttachments(options.attachments);

      if (!text && attachments.length === 0) {
        throw new Error('A message requires text or at least one attachment.');
      }

      return pipeline.send(chatId, text, {
        ...options,
        attachments
      });
    },

    normalizeAttachments
  };
}
