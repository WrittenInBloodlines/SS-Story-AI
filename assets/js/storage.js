import { CURRENT_SCHEMA_VERSION, migrateProject } from './core/schema.js';

const KEY = 'ss-story-ai-v1';

function emptyDatabase() {
  return {
    version: CURRENT_SCHEMA_VERSION,
    projects: [],
    settings: {
      theme: 'dark',
      storyLength: 'very-long',
      creativity: 'controlled',
      autosave: true
    }
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyDatabase();

    const db = JSON.parse(raw);
    const projects = Array.isArray(db.projects)
      ? db.projects.map(migrateProject).filter(Boolean)
      : [];

    const normalized = {
      ...emptyDatabase(),
      ...db,
      version: CURRENT_SCHEMA_VERSION,
      projects
    };

    localStorage.setItem(KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return emptyDatabase();
  }
}

export function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new CustomEvent('story-ai:saved'));
}

export function projectId() {
  return new URLSearchParams(location.search).get('project');
}

export function getProject() {
  const db = load();
  return db.projects.find(project => project.id === projectId()) || null;
}

export function updateProject(mutator) {
  const db = load();
  const project = db.projects.find(item => item.id === projectId());
  if (!project) return null;

  const migrated = migrateProject(project);
  const index = db.projects.indexOf(project);
  db.projects[index] = migrated;

  mutator(migrated, db);
  touch(migrated);
  save(db);
  return migrated;
}

export function ensureProjectShape(project) {
  return migrateProject(project);
}

export function newId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function go(page, id = projectId()) {
  const query = id ? `?project=${encodeURIComponent(id)}` : '';
  location.href = `${page}${query}`;
}

export function esc(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[character]));
}

export function touch(project) {
  project.updatedAt = new Date().toISOString();
  return project;
}

export { KEY };