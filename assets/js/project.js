import { getProject, go, esc } from './storage.js';

const project = getProject();
if (!project) {
  location.href = '../index.html';
  throw new Error('No project selected');
}

const title = document.querySelector('#title');
const description = document.querySelector('#description');
const projectName = document.querySelector('#project-name');
const stats = document.querySelector('#project-stats');

title.textContent = project.name;
description.textContent = project.description || 'No description yet.';
if (projectName) projectName.textContent = project.name;
if (stats) stats.innerHTML = [
  ['Chapters', project.chapters?.length || 0],
  ['Characters', project.characters?.length || 0],
  ['World entries', project.world?.length || 0],
  ['Relationships', project.relationships?.length || 0],
  ['Events', project.events?.length || 0],
  ['Memories', project.memories?.length || 0],
  ['Plot threads', project.plot?.length || 0]
].map(([label, count]) => `<div class="stat"><strong>${count}</strong><span>${label}</span></div>`).join('');

const currentPage = location.pathname.split('/').pop();
for (const link of document.querySelectorAll('[data-tab]')) {
  const target = `${link.dataset.tab}.html`;
  link.href = `${target}?project=${encodeURIComponent(project.id)}`;
  if (target === currentPage) link.classList.add('active');
}

document.querySelector('[data-action="chat"]')?.addEventListener('click', () => go('chat.html'));
document.querySelector('[data-action="settings"]')?.addEventListener('click', () => { location.href = `settings.html?project=${encodeURIComponent(project.id)}`; });

window.SSStoryProject = { project, esc }; 
