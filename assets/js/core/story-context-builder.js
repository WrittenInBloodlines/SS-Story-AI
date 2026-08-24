import { buildCanonContext } from './canon-context.js';
import { buildSceneContext } from './scene-context.js';
import { buildStateContext } from './state-context.js';
import { rankMemories, searchMemories } from './memory-query.js';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function buildStoryContext(project, options = {}) {
  if (!project) return null;

  const subjectIds = unique(options.subjectIds || []);
  const query = options.query || '';
  const memoryLimit = Number.isInteger(options.memoryLimit) ? Math.max(0, options.memoryLimit) : 20;

  const searchedMemories = searchMemories(project, query, options.memoryFilters || {});
  const memories = rankMemories(searchedMemories, query)
    .slice(0, memoryLimit)
    .map(memory => ({
      id: memory.id,
      type: memory.type,
      title: memory.title,
      content: memory.content,
      tags: memory.tags,
      priority: memory.priority,
      source: memory.source
    }));

  const characters = (project.characters || [])
    .filter(character => !subjectIds.length || subjectIds.includes(character.id))
    .map(character => ({
      id: character.id,
      name: character.name,
      appearance: character.appearance,
      personality: character.personality,
      role: character.role
    }));

  return {
    project: {
      id: project.id,
      title: project.title,
      description: project.description
    },
    characters,
    memories,
    canon: buildCanonContext(project, subjectIds),
    states: buildStateContext(project, subjectIds),
    scene: options.sceneId ? buildSceneContext(project, options.sceneId) : null,
    generatedAt: new Date().toISOString()
  };
}
