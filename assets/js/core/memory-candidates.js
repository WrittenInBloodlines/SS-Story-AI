export function extractMemoryCandidates(messages = []) {
  const candidates = [];

  for (const message of messages) {
    if (message.role !== 'user' || !message.text?.trim()) continue;

    const text = message.text.trim();
    if (text.length < 20) continue;

    candidates.push({
      id: `candidate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceMessageId: message.id,
      content: text,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }

  return candidates;
}

export function approveMemoryCandidate(candidate) {
  if (!candidate) return null;

  return {
    ...candidate,
    status: 'approved',
    approvedAt: new Date().toISOString()
  };
}

export function rejectMemoryCandidate(candidate) {
  if (!candidate) return null;

  return {
    ...candidate,
    status: 'rejected',
    rejectedAt: new Date().toISOString()
  };
}
