export function getModelAvailability(client) {
  if (!client) return { configured: false, ready: false };

  const configured = typeof client.isReady === 'function' && client.isReady();
  return {
    configured,
    ready: configured,
    status: configured ? 'ready-for-request' : 'needs-configuration'
  };
}
