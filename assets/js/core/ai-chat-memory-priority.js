const DEFAULT_PRIORITIES = {
  system: 100,
  instructions: 95,
  memory: 90,
  pinned: 85,
  canon: 85,
  recent: 70,
  normal: 50,
  low: 20
};

export function createAIChatMemoryPriority(options = {}) {
  const priorities = {
    ...DEFAULT_PRIORITIES,
    ...(options.priorities || {})
  };

  return {
    getPriority(type) {
      return Number.isFinite(priorities[type]) ? priorities[type] : priorities.normal;
    },

    rank(items = []) {
      return [...items]
        .filter(Boolean)
        .map((item, index) => ({
          ...item,
          _priority: Number.isFinite(item.priority)
            ? item.priority
            : this.getPriority(item.type),
          _order: index
        }))
        .sort((a, b) => {
          if (b._priority !== a._priority) return b._priority - a._priority;
          return a._order - b._order;
        })
        .map(({ _priority, _order, ...item }) => item);
    }
  };
}
