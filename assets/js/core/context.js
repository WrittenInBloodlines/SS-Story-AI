import { ensureProjectShape } from '../storage.js';

export function buildProjectContext(project, options = {}) {
  const p = ensureProjectShape(structuredClone(project));
  const maxItems = options.maxItems ?? 40;
  return {
    project: { id: p.id, name: p.name, description: p.description || '' },
    characters: p.characters.slice(0, maxItems),
    relationships: p.relationships.slice(0, maxItems),
    world: p.world.slice(0, maxItems),
    memory: p.memory.slice(0, maxItems),
    plot: p.plot.slice(0, maxItems),
    events: p.events.slice(0, maxItems),
    chapters: p.chapters.slice(-10).map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      summary: chapter.summary || '',
      text: options.includeChapterText ? chapter.text || '' : undefined
    }))
  };
}

export function serializeContext(context) {
  return JSON.stringify(context, null, 2);
}

export function findCharacter(project, name) {
  const target = String(name || '').trim().toLowerCase();
  return project.characters.find(character => String(character.name || '').toLowerCase() === target) || null;
}