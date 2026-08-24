export async function runModelTest({ session, text } = {}) {
  if (!session || typeof session.send !== 'function') throw new Error('A model session is required.');

  return session.send({
    messages: [
      { role: 'system', content: 'You are being tested for connectivity. Reply briefly and do not generate story content.' },
      { role: 'user', content: text || 'Connection test: reply with OK.' }
    ],
    userInstruction: text || 'Connection test: reply with OK.'
  });
}
