export function createContinuityWarning({ type, severity = 'info', message, suggestions = [] }) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    severity,
    message,
    suggestions
  };
}

export function hasWarningType(warnings = [], type) {
  return warnings.some(warning => warning.type === type);
}

export function uniqueWarnings(warnings = []) {
  const seen = new Set();

  return warnings.filter(warning => {
    const key = `${warning.type}:${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
