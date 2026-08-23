import { getProject, load, save, go, esc, touch } from './storage.js';

const project = getProject();
if (!project) {
  location.href = '../index.html';
  throw new Error('No project selected');
}

const title = document.querySelector('#title');
const description = document.querySelector('#description');
const projectName = document.querySelector('#project-name');

title.textContent = project.name;
description.textContent = project.description || 'Noch keine Beschreibung';
if (projectName) projectName.textContent = project.name;

const currentPage = location.pathname.split('/').pop();
for (const link of document.querySelectorAll('[data-tab]')) {
  const target = `${link.dataset.tab}.html`;
  link.href = `${target}?project=${encodeURIComponent(project.id)}`;
  if (target === currentPage) link.classList.add('active');
}

document.querySelector('[data-action="chat"]')?.addEventListener('click', () => go('chat.html'));

document.querySelector('[data-action="settings"]')?.addEventListener('click', () => {
  const db = load();
  const current = db.projects.find(p => p.id === project.id);
  if (!current) return;
  const next = prompt('Story-Länge: kurz, normal, lang, sehr-lang', current.settings?.storyLength || 'sehr-lang');
  if (!next) return;
  current.settings.storyLength = next;
  touch(current);
  save(db);
});

for (const card of document.querySelectorAll('.feature-card')) {
  card.addEventListener('click', () => card.classList.add('visited'));
}

window.SSStoryProject = { project, esc };