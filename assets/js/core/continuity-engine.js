import { buildStoryTimeline } from './timeline-manager.js';
import { getCharacterRelationships } from './relationship-manager.js';
import { getCharacterEvents } from './event-manager.js';

export function analyzeContinuity(project, draft = '') {
  if (!project || !draft?.trim()) return [];

  const warnings = [];
  const text = draft.trim();
  const lowerText = text.toLowerCase();

  for (const character of project.characters || []) {
    if (!character.name) continue;

    const name = character.name.toLowerCase();
    if (!lowerText.includes(name)) continue;

    const relationships = getCharacterRelationships(project, character.id);
    const events = getCharacterEvents(project, character.id);

    if (character.personality?.trim()) {
      warnings.push({
        type: 'character-context',
        severity: 'info',
        characterId: character.id,
        characterName: character.name,
        message: `Check whether the scene is consistent with ${character.name}'s established personality.`,
        evidence: character.personality
      });
    }

    if (relationships.length || events.length) {
      warnings.push({
        type: 'established-context',
        severity: 'info',
        characterId: character.id,
        characterName: character.name,
        message: `This scene involves established character context for ${character.name}.`,
        relationshipCount: relationships.length,
        eventCount: events.length
      });
    }
  }

  const timeline = buildStoryTimeline(project);
  if (timeline.length) {
    warnings.push({
      type: 'timeline-context',
      severity: 'info',
      message: 'The project has established timeline events that can be checked against this draft.',
      eventCount: timeline.length
    });
  }

  return warnings;
}

export function createContinuityWarning(data = {}) {
  return {
    id: `warning_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: data.type || 'unknown',
    severity: data.severity || 'warning',
    message: data.message || 'Potential continuity issue detected.',
    evidence: data.evidence || null,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

export function resolveContinuityWarning(warning, action = 'dismiss') {
  if (!warning) return null;

  return {
    ...warning,
    status: action,
    resolvedAt: new Date().toISOString()
  };
}
