export function createChatSummary(chat, options = {}) {
  if (!chat) return null;

  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  const maxMessages = options.maxMessages || 20;
  const recentMessages = messages.slice(-maxMessages);

  return {
    chatId: chat.id,
    messageCount: messages.length,
    recentMessages: recentMessages.map(message => ({
      role: message.role,
      text: message.text,
      createdAt: message.createdAt
    })),
    generatedAt: new Date().toISOString()
  };
}

export function getChatContinuationContext(chat, options = {}) {
  const summary = createChatSummary(chat, options);
  if (!summary) return null;

  return {
    chatId: summary.chatId,
    messageCount: summary.messageCount,
    recentMessages: summary.recentMessages
  };
}
