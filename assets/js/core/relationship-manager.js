import { newId, updateProject } from '../storage.js';

export function createRelationship(fromCharacterId, toCharacterId, data = {}) {
  if (!fromCharacterId || !toCharacterId || fromCharacterId === toCharacterId) return null;

  const relationship = {
    id: newId('relationship'),
    fromCharacterId,
    toCharacterId,
    type: data.type || 'unknown',
    label: data.label || '',
    description: data.description || '',
    strength: data.strength || 'neutral',
    history: Array.isArray(data.history) ? data.history : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.relationships.push(relationship);
  });

  return relationship;
}

export function getRelationship(project, relationshipId) {
  return project?.relationships?.find(item => item.id === relationshipId) || null;
}

export function getCharacterRelationships(project, characterId) {
  if (!project || !characterId) return [];

  return project.relationships?.filter(relationship =>
    relationship.fromCharacterId === characterId ||
    relationship.toCharacterId === characterId
  ) || [];
}

export function addRelationshipEvent(relationshipId, event) {
  if (!event?.description?.trim()) return null;

  let added = null;

  updateProject(project => {
    const relationship = getRelationship(project, relationshipId);
    if (!relationship) return;

    added = {
      id: newId('relationship_event'),
      description: event.description.trim(),
      chapterId: event.chapterId || null,
      date: event.date || null,
      createdAt: new Date().toISOString()
    };

    relationship.history.push(added);
    relationship.updatedAt = new Date().toISOString();
  });

  return added;
}
