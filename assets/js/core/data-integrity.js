import { migrateProject } from './schema.js';
import { validateProject } from '../ai/validators.js';

export function normalizeProject(project) {
  const normalized = migrateProject(project);
  if (!normalized) return { project: null, errors: ['Project data is invalid.'] };

  return {
    project: normalized,
    errors: validateProject(normalized)
  };
}

export function isProjectUsable(project) {
  return normalizeProject(project).errors.length === 0;
}
