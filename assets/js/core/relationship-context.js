import { getCharacterRelationships } from './relationship-manager.js';

export function buildRelationshipContext(project, characterIds = []) {
  if (!project) return [];

  const allowed = new Set(characterIds);

  return getRelevantRelationships(project, allowed).map(relationship => ({
    id: relationship.id,
    fromCharacterId: relationship.fromCharacterId,
    toCharacterId: relationship.toCharacterId,
    type: relationship.type,
    label: relationship.label,
    description: relationship.description,
    strength: relationship.strength,
    history: relationship.history
  }));
}

function getRelevantRelationships(project, characterIds) {
  if (!characterIds.size) return project.relationships || [];

  return (project.relationships || []).filter(relationship =>
    characterIds.has(relationship.fromCharacterId) ||
    characterIds.has(relationship.toCharacterId)
  );
}
