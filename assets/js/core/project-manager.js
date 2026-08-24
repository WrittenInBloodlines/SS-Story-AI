import { migrateProject } from './schema.js';

export function prepareProject(project) {
  return migrateProject(project);
}

export function touchProject(project) {
  return {
    ...project,
    updatedAt: new Date().toISOString()
  };
}

export function getProjectSummary(project) {
  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description || '',
    updatedAt: project.updatedAt || project.createdAt || null,
    counts: {
      characters: project.characters?.length || 0,
      world: project.world?.length || 0,
      relationships: project.relationships?.length || 0,
      events: project.events?.length || 0,
      memory: project.memory?.length || 0,
      plot: project.plot?.length || 0,
      chapters: project.chapters?.length || 0,
      chats: project.chats?.length || 0,
      media: project.media?.length || 0
    }
  };
}
