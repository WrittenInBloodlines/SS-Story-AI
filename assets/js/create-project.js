import { load, save, newId, go, ensureProjectShape } from './storage.js';

const form = document.querySelector('#project-form');

form.addEventListener('submit', event => {
  event.preventDefault();

  const db = load();
  const project = ensureProjectShape({
    id: newId('project'),
    name: document.querySelector('#name').value.trim(),
    description: document.querySelector('#description').value.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: Date.now(),
    characters: [],
    world: [],
    memory: [],
    plot: [],
    chapters: [],
    chats: [],
    media: [],
    relationships: [],
    events: []
  });

  db.projects.push(project);
  save(db);
  go('pages/project.html', project.id);
});