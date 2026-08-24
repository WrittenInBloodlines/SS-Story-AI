import { getLocation } from './location-manager.js';
import { getScene } from './scene-manager.js';

export function buildSceneContext(project, sceneId) {
  const scene = getScene(project, sceneId);
  if (!scene) return null;

  const location = getLocation(project, scene.locationId);
  const characters = (scene.characterIds || [])
    .map(id => project.characters?.find(character => character.id === id))
    .filter(Boolean);

  return {
    scene: {
      id: scene.id,
      title: scene.title,
      chapterId: scene.chapterId,
      order: scene.order,
      startState: scene.startState,
      endState: scene.endState,
      eventIds: scene.eventIds
    },
    location: location ? {
      id: location.id,
      name: location.name,
      description: location.description,
      type: location.type,
      parentLocationId: location.parentLocationId
    } : null,
    characters: characters.map(character => ({
      id: character.id,
      name: character.name,
      appearance: character.appearance,
      personality: character.personality,
      role: character.role
    }))
  };
}
