import { getMemories } from './memory-manager.js';

export function searchMemories(project, query = '', filters = {}) {
  if (!project) return [];

  const normalizedQuery = query.trim().toLowerCase();
  const memories = getMemories(project, filters);

  if (!normalizedQuery) return memories;

  return memories.filter(memory => {
    const haystack = [
      memory.title,
      memory.content,
      ...(memory.tags || [])
    ].join(' ').toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function rankMemories(memories = [], query = '') {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [...memories];

  return [...memories]
    .map(memory => {
      const title = memory.title?.toLowerCase() || '';
      const content = memory.content?.toLowerCase() || '';
      const tags = (memory.tags || []).map(tag => tag.toLowerCase());
      let score = 0;

      if (title === normalizedQuery) score += 100;
      if (title.includes(normalizedQuery)) score += 50;
      if (tags.some(tag => tag === normalizedQuery)) score += 40;
      if (tags.some(tag => tag.includes(normalizedQuery))) score += 20;
      if (content.includes(normalizedQuery)) score += 10;
      if (memory.priority === 'high') score += 5;

      return { memory, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.memory);
}
