import { getCharacter } from './character-manager.js';

export function buildCharacterContext(project, characterIds = []) {
  if (!project) return [];

  return characterIds
    .map(id => getCharacter(project, id))
    .filter(Boolean)
    .map(character => ({
      id: character.id,
      name: character.name,
      description: character.description,
      appearance: character.appearance,
      personality: character.personality,
      backstory: character.backstory,
      role: character.role,
      traits: character.traits,
      relationships: character.relationships,
      referenceImages: character.referenceImages
    }));
}

export function findCharacterByName(project, name) {
  if (!project || !name?.trim()) return null;

  const target = name.trim().toLowerCase();
  return project.characters?.find(character => character.name.toLowerCase() === target) || null;
}
