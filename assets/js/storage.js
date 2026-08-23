const KEY = 'ss-story-ai-v1';

function emptyDatabase() {
  return {
    version: 1,
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
    return {
      ...emptyDatabase(),
      ...db,
      projects: Array.isArray(db.projects) ? db.projects.map(ensureProjectShape) : []
    };
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
  return db.projects.find(project => project.id === projectId());
}

export function ensureProjectShape(project) {
  const p = project || {};
  p.characters ??= [];
  p.world ??= [];
  p.memory ??= [];
  p.plot ??= [];
  p.chapters ??= [];
  p.chats ??= [];
  p.media ??= [];
  p.relationships ??= [];
  p.events ??= [];
  p.settings ??= { storyLength: 'very-long', creativity: 'controlled' };
  p.updatedAt ??= Date.now();
  return p;
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
  project.updatedAt = Date.now();
  return project;
}

export { KEY };