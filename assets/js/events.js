import { getProject, updateProject, newId, esc } from './storage.js';

if (!getProject()) location.href = '../index.html';

const list = document.querySelector('#event-list');
const addButton = document.querySelector('#add-event');

function render() {
  const events = getProject()?.events || [];
  list.innerHTML = events.length
    ? events.map(item => `
      <article class="card">
        <div class="card-main">
          <div>
            <p class="eyebrow">${esc(item.chapter || 'Unassigned')}</p>
            <h2>${esc(item.title)}</h2>
            <p class="muted">${esc(item.description || 'No description yet.')}</p>
          </div>
          <button class="danger" data-delete="${item.id}">Delete</button>
        </div>
      </article>`).join('')
    : `<div class="panel"><b>No events yet</b><span class="muted">Add established events to build a reliable story timeline.</span></div>`;
}

function addEvent() {
  const title = prompt('Event title');
  if (!title?.trim()) return;
  const description = prompt('What happened?') || '';
  const chapter = prompt('Chapter or location reference') || '';

  updateProject(project => {
    project.events.push({
      id: newId('event'),
      title: title.trim(),
      description: description.trim(),
      chapter: chapter.trim(),
      createdAt: Date.now()
    });
  });
  render();
}

addButton.addEventListener('click', addEvent);
list.addEventListener('click', event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  updateProject(project => {
    project.events = project.events.filter(item => item.id !== button.dataset.delete);
  });
  render();
});

render();