export async function testModelConnection(client) {
  if (!client || typeof client.testConnection !== 'function') {
    throw new Error('A model client is required.');
  }

  const startedAt = Date.now();
  const result = await client.testConnection();

  return {
    ...result,
    latencyMs: Date.now() - startedAt,
    testedAt: new Date().toISOString()
  };
}
