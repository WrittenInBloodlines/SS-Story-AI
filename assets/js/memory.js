import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#memory-list');
const addButton = document.querySelector('#add-memory');

function render() {
  const memories = getProject()?.memories || [];
  list.innerHTML = memories.length ? memories.map(entry => `<article class="card"><div class="card-main"><div><h2>${esc(entry.title)}</h2><p class="muted">${esc(entry.text)}</p><small class="muted">${entry.locked ? 'Locked memory' : 'Editable memory'}</small></div><div class="card-actions"><button class="secondary" data-action="edit" data-id="${entry.id}">Edit</button><button class="danger" data-action="delete" data-id="${entry.id}">Delete</button></div></div></article>`).join('') : `<div class="panel"><b>No memory entries yet</b><span class="muted">Add information that should remain available across chats.</span></div>`;
}

async function createMemory() {
  const title = await ssPrompt('New Memory', 'Memory title');
  if (!title?.trim()) return;
  const text = await ssPrompt('New Memory', 'Memory information');
  if (!text?.trim()) return;
  const lockedChoice = await ssConfirm('Protect Memory?', 'Lock this memory entry? Locked entries are protected from automatic changes later.');
  updateProject(project => project.memories.push({ id: newId('memory'), title: title.trim(), text: text.trim(), locked: lockedChoice, createdAt: Date.now(), updatedAt: Date.now() }));
  render();
}

async function editMemory(id) {
  const entry = getProject()?.memories.find(item => item.id === id);
  if (!entry) return;
  const title = await ssPrompt('Edit Memory', 'Memory title', entry.title);
  if (!title?.trim()) return;
  const text = await ssPrompt('Edit Memory', 'Memory information', entry.text);
  if (!text?.trim()) return;
  updateProject(project => { const item = project.memories.find(memory => memory.id === id); if (item) { item.title = title.trim(); item.text = text.trim(); item.updatedAt = Date.now(); } });
  render();
}

async function deleteMemory(id) {
  const entry = getProject()?.memories.find(item => item.id === id);
  if (!entry || !await ssConfirm('Delete Memory', `Delete memory “${entry.title}”?`)) return;
  updateProject(project => { project.memories = project.memories.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', createMemory);
list.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; if (button.dataset.action === 'edit') editMemory(button.dataset.id); if (button.dataset.action === 'delete') deleteMemory(button.dataset.id); });
render();
