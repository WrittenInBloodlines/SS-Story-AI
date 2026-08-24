import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#event-list');
const addButton = document.querySelector('#add-event');

function render() {
  const events = getProject()?.events || [];
  list.innerHTML = events.length ? events.map(item => `<article class="card"><div class="card-main"><div><p class="eyebrow">${esc(item.chapter || 'Unassigned')}</p><h2>${esc(item.title)}</h2><p class="muted">${esc(item.description || 'No description yet.')}</p></div><div class="card-actions"><button class="secondary" data-action="edit" data-id="${item.id}">Edit</button><button class="danger" data-action="delete" data-id="${item.id}">Delete</button></div></div></article>`).join('') : '<div class="panel"><b>No events yet</b><span class="muted">Add established events to build a reliable story timeline.</span></div>';
}

async function addEvent() {
  const title = await ssPrompt('New Event', 'Event title');
  if (!title?.trim()) return;
  const description = await ssPrompt('New Event', 'What happened?') || '';
  const chapter = await ssPrompt('New Event', 'Chapter or location reference') || '';
  updateProject(project => project.events.push({ id: newId('event'), title: title.trim(), description: description.trim(), chapter: chapter.trim(), createdAt: Date.now(), updatedAt: Date.now() }));
  render();
}

async function editEvent(id) {
  const entry = getProject()?.events.find(item => item.id === id);
  if (!entry) return;
  const title = await ssPrompt('Edit Event', 'Event title', entry.title);
  if (!title?.trim()) return;
  const description = await ssPrompt('Edit Event', 'What happened?', entry.description || '');
  if (description === null) return;
  const chapter = await ssPrompt('Edit Event', 'Chapter or location reference', entry.chapter || '');
  if (chapter === null) return;
  updateProject(project => { const item = project.events.find(event => event.id === id); if (item) { item.title = title.trim(); item.description = description.trim(); item.chapter = chapter.trim(); item.updatedAt = Date.now(); } });
  render();
}

async function deleteEvent(id) {
  const entry = getProject()?.events.find(item => item.id === id);
  if (!entry || !await ssConfirm('Delete Event', `Delete event “${entry.title}”?`)) return;
  updateProject(project => { project.events = project.events.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', addEvent);
list.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; if (button.dataset.action === 'edit') editEvent(button.dataset.id); if (button.dataset.action === 'delete') deleteEvent(button.dataset.id); });
render();
