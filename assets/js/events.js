import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#event-list');
const addButton = document.querySelector('#add-event');

function render() {
  const events = getProject()?.events || [];
  list.innerHTML = events.length ? events.map(item => `<article class="card"><div class="card-main"><div><p class="eyebrow">${esc(item.chapter || 'Unassigned')}</p><h2>${esc(item.title)}</h2><p class="muted">${esc(item.description || 'No description yet.')}</p></div><button class="danger" data-delete="${item.id}">Delete</button></div></article>`).join('') : `<div class="panel"><b>No events yet</b><span class="muted">Add established events to build a reliable story timeline.</span></div>`;
}

async function addEvent() {
  const title = await ssPrompt('New Event', 'Event title');
  if (!title?.trim()) return;
  const description = await ssPrompt('New Event', 'What happened?') || '';
  const chapter = await ssPrompt('New Event', 'Chapter or location reference') || '';
  updateProject(project => project.events.push({ id: newId('event'), title: title.trim(), description: description.trim(), chapter: chapter.trim(), createdAt: Date.now() }));
  render();
}

async function deleteEvent(id) {
  if (!await ssConfirm('Delete Event', 'Delete this event?')) return;
  updateProject(project => { project.events = project.events.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', addEvent);
list.addEventListener('click', event => { const button = event.target.closest('[data-delete]'); if (button) deleteEvent(button.dataset.delete); });
render();
