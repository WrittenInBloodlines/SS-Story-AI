import { getProject } from '../storage.js';

function normalize(value = '') {
  return String(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

function includesAny(text, values) {
  const normalized = normalize(text);
  return values.some(value => normalized.includes(normalize(value)));
}

export function checkContinuity(text, project = getProject()) {
  if (!project || !text?.trim()) return [];

  const warnings = [];
  const normalized = normalize(text);

  for (const event of project.events || []) {
    const eventText = normalize(`${event.title || ''} ${event.description || ''}`);
    if (!eventText) continue;

    const strongOverlap = eventText.length > 35 && (
      normalized.includes(eventText) || eventText.includes(normalized)
    );

    if (strongOverlap) {
      warnings.push({
        type: 'existing-event',
        severity: 'info',
        message: `This may repeat an event already recorded as "${event.title || 'Untitled event'}".`
      });
    }
  }

  for (const character of project.characters || []) {
    const name = normalize(character.name);
    if (!name || !normalized.includes(name)) continue;

    const restrictions = [
      ...(character.notes || '').split(/[.!?]/),
      ...(character.personality || '').split(/[.!?]/)
    ].filter(Boolean);

    const violentAction = includesAny(normalized, ['hits', 'punches', 'attacks', 'beats', 'strikes']);
    if (violentAction && restrictions.some(item => normalize(item).includes('avoids violence'))) {
      warnings.push({
        type: 'character-consistency',
        severity: 'warning',
        message: `${character.name} may be acting against a recorded character trait: "avoids violence".`
      });
    }
  }

  const knownLocations = (project.world || []).filter(item => item.type === 'location' || item.category === 'location');
  const mentionedLocations = knownLocations.filter(location => {
    const name = normalize(location.name);
    return name && normalized.includes(name);
  });

  if (mentionedLocations.length > 1) {
    warnings.push({
      type: 'location-transition',
      severity: 'info',
      message: `Multiple known locations are mentioned. Make sure the scene explains the transition between them.`
    });
  }

  return warnings;
}
