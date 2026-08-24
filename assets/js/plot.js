import { getProject, updateProject, newId, esc } from './storage.js';

const project = getProject();
if (!project) location.href = '../index.html';

const list = document.querySelector('#plot-list');
const addButton = document.querySelector('#add-plot');

function render() {
  list.innerHTML = project.plot.length
    ? project.plot.map(thread => `
      <article class="card">
        <div>
          <b>${esc(thread.title)}</b>
          <div class="muted">${esc(thread.text)}</div>
        </div>
        <div class="card-actions">
          <small>${esc(thread.status || 'Open')}</small>
          <button class="danger" data-delete="${thread.id}">Delete</button>
        </div>
      </article>
    `).join('')
    : '<div class="panel"><b>No story threads</b><span class="muted">Open storylines, secrets, and unresolved questions will appear here.</span></div>';
}

addButton.addEventListener('click', () => {
  const title = prompt('Story thread');
  if (!title?.trim()) return;
  const text = prompt('Description');
  if (!text?.trim()) return;

  updateProject(current => {
    current.plot.push({
      id: newId('plot'),
      title: title.trim(),
      text: text.trim(),
      status: 'Open',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  render();
});

list.addEventListener('click', event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  if (!confirm('Delete this story thread?')) return;

  updateProject(current => {
    current.plot = current.plot.filter(thread => thread.id !== button.dataset.delete);
  });

  render();
});

render();
