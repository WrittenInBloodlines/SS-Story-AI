import { newId, updateProject } from '../storage.js';

const DEFAULT_CHARACTER = {
  description: '',
  appearance: '',
  personality: '',
  backstory: '',
  role: '',
  traits: [],
  relationships: [],
  referenceImages: [],
  notes: []
};

export function createCharacter(name = 'Unnamed Character', data = {}) {
  const character = {
    id: newId('character'),
    name: name.trim() || 'Unnamed Character',
    ...DEFAULT_CHARACTER,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.characters.push(character);
  });

  return character;
}

export function getCharacter(project, characterId) {
  return project?.characters?.find(character => character.id === characterId) || null;
}

export function addReferenceImage(characterId, image) {
  if (!image?.url && !image?.path) return null;

  let updated = null;

  updateProject(project => {
    const character = getCharacter(project, characterId);
    if (!character) return;

    const reference = {
      id: newId('reference'),
      url: image.url || null,
      path: image.path || null,
      label: image.label || 'Reference Image',
      createdAt: new Date().toISOString()
    };

    character.referenceImages.push(reference);
    character.updatedAt = new Date().toISOString();
    updated = reference;
  });

  return updated;
}

export function addCharacterNote(characterId, text) {
  if (!text?.trim()) return null;

  let note = null;

  updateProject(project => {
    const character = getCharacter(project, characterId);
    if (!character) return;

    note = {
      id: newId('character_note'),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    character.notes.push(note);
    character.updatedAt = new Date().toISOString();
  });

  return note;
}
