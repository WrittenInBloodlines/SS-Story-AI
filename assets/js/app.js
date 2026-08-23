import { load, esc } from './storage.js';

const db = load();
const list = document.querySelector('#project-list');
const count = document.querySelector('#project-count');

function render() {
  list.innerHTML = '';
  const total = db.projects.length;
  count.textContent = `${total} project${total === 1 ? '' : 's'}`;

  if (!total) {
    list.innerHTML = '<div class="panel"><b>No projects yet</b><span class="muted">Create your first story universe.</span></div>';
    return;
  }

  for (const project of db.projects) {
    const card = document.createElement('a');
    card.className = 'project-card';
    card.href = `pages/project.html?project=${encodeURIComponent(project.id)}`;
    card.innerHTML = `
      <b>${esc(project.name)}</b>
      <span class="muted">${esc(project.description || 'No description')}</span>
      <small>${project.chapters?.length || 0} chapters · ${project.characters?.length || 0} characters</small>
    `;
    list.appendChild(card);
  }
}

document.querySelector('[data-action="new-project"]').addEventListener('click', () => {
  location.href = 'create-project.html';
});

document.querySelector('[data-action="settings"]').addEventListener('click', () => {
  window.alert('Settings will be available in a dedicated section.');
});

render();