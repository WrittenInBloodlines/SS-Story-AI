import { getProject, updateProject, newId, esc } from './storage.js';

const project = getProject();
if (!project) location.href = '../index.html';

const list = document.querySelector('#world-list');
const addButton = document.querySelector('#add-world');

function render() {
  list.innerHTML = project.world.length
    ? project.world.map(entry => `
      <article class="card">
        <div>
          <b>${esc(entry.title)}</b>
          <div class="muted">${esc(entry.text)}</div>
        </div>
        <button class="danger" data-delete="${entry.id}">Delete</button>
      </article>
    `).join('')
    : '<div class="panel"><b>No world entries</b><span class="muted">Add locations, rules, organizations, history, or other world information.</span></div>';
}

addButton.addEventListener('click', () => {
  const title = prompt('Title');
  if (!title?.trim()) return;
  const text = prompt('Description');
  if (!text?.trim()) return;

  updateProject(current => {
    current.world.push({
      id: newId('world'),
      title: title.trim(),
      text: text.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  render();
});

list.addEventListener('click', event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const id = button.dataset.delete;
  if (!confirm('Delete this world entry?')) return;

  updateProject(current => {
    current.world = current.world.filter(entry => entry.id !== id);
  });

  render();
});

render();
