export function validateProject(project) {
  const errors = [];

  if (!project) {
    errors.push('Project data is missing.');
    return errors;
  }

  const requiredArrays = [
    'characters',
    'world',
    'relationships',
    'events',
    'memory',
    'plot',
    'chapters',
    'chats',
    'media'
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(project[key])) {
      errors.push(`Project field "${key}" must be an array.`);
    }
  }

  return errors;
}

export function validateCharacter(character) {
  const errors = [];

  if (!character?.name?.trim()) errors.push('Character name is required.');
  if (!character?.id) errors.push('Character ID is required.');

  return errors;
}

export function validateMemoryEntry(entry) {
  const errors = [];

  if (!entry?.title?.trim()) errors.push('Memory title is required.');
  if (!entry?.content?.trim()) errors.push('Memory content is required.');
  if (!entry?.id) errors.push('Memory ID is required.');

  return errors;
}
