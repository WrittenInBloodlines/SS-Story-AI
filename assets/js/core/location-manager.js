import { newId, updateProject } from '../storage.js';

export function createLocation(data = {}) {
  if (!data.name?.trim()) return null;

  const location = {
    id: newId('location'),
    name: data.name.trim(),
    description: data.description || '',
    type: data.type || 'place',
    parentLocationId: data.parentLocationId || null,
    notes: Array.isArray(data.notes) ? data.notes : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  updateProject(project => {
    project.locations.push(location);
  });

  return location;
}

export function getLocation(project, locationId) {
  return project?.locations?.find(location => location.id === locationId) || null;
}

export function addLocationNote(locationId, text) {
  if (!text?.trim()) return null;

  let note = null;

  updateProject(project => {
    const location = getLocation(project, locationId);
    if (!location) return;

    note = {
      id: newId('location_note'),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    location.notes.push(note);
    location.updatedAt = new Date().toISOString();
  });

  return note;
}
