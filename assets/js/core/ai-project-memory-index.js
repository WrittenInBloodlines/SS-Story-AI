export function createProjectMemoryIndex() {
  const records = new Map();
  const byType = new Map();
  const bySubject = new Map();

  function addToIndex(map, key, id) {
    if (!key) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(id);
  }

  function removeFromIndex(map, key, id) {
    const ids = map.get(key);
    if (!ids) return;
    ids.delete(id);
    if (ids.size === 0) map.delete(key);
  }

  return {
    add(record) {
      if (!record?.id) throw new Error('Memory record ID is required.');
      records.set(record.id, record);
      addToIndex(byType, record.type, record.id);
      addToIndex(bySubject, record.subjectId, record.id);
      return record;
    },

    remove(record) {
      if (!record?.id) return false;
      records.delete(record.id);
      removeFromIndex(byType, record.type, record.id);
      removeFromIndex(bySubject, record.subjectId, record.id);
      return true;
    },

    get(id) {
      return records.get(id) || null;
    },

    getByType(type) {
      return [...(byType.get(type) || [])]
        .map(id => records.get(id))
        .filter(Boolean);
    },

    getBySubject(subjectId) {
      return [...(bySubject.get(subjectId) || [])]
        .map(id => records.get(id))
        .filter(Boolean);
    },

    all() {
      return [...records.values()];
    },

    clear() {
      records.clear();
      byType.clear();
      bySubject.clear();
    }
  };
}
