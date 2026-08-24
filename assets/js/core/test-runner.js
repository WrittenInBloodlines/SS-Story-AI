import { load, save } from '../storage.js';
import { validateProject } from '../ai/validators.js';

export function runStorageChecks() {
  const db = load();
  const results = [];

  results.push({
    name: 'Database loads',
    passed: Boolean(db && Array.isArray(db.projects))
  });

  for (const project of db.projects) {
    const errors = validateProject(project);
    results.push({
      name: `Project: ${project.name || project.id}`,
      passed: errors.length === 0,
      details: errors
    });
  }

  return results;
}

export function persistRoundTrip() {
  const before = load();
  save(before);
  const after = load();

  return JSON.stringify(before) === JSON.stringify(after);
}
