import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#world-list');
const addButton = document.querySelector('#add-world');

function render() {
  const world = getProject()?.world || [];
  list.innerHTML = world.length ? world.map(entry => `<article class="card"><div class="card-main"><div><h2>${esc(entry.title)}</h2><p class="muted">${esc(entry.text)}</p></div><div class="card-actions"><button class="secondary" data-action="edit" data-id="${entry.id}">Edit</button><button class="danger" data-action="delete" data-id="${entry.id}">Delete</button></div></div></article>`).join('') : '<div class="panel"><b>No world entries</b><span class="muted">Add locations, rules, organizations, history, or other world information.</span></div>';
}

async function addWorld() {
  const title = await ssPrompt('New World Entry', 'Title');
  if (!title?.trim()) return;
  const text = await ssPrompt('New World Entry', 'Description');
  if (!text?.trim()) return;
  updateProject(current => current.world.push({ id: newId('world'), title: title.trim(), text: text.trim(), createdAt: Date.now(), updatedAt: Date.now() }));
  render();
}

async function editWorld(id) {
  const entry = getProject()?.world.find(item => item.id === id);
  if (!entry) return;
  const title = await ssPrompt('Edit World Entry', 'Title', entry.title);
  if (!title?.trim()) return;
  const text = await ssPrompt('Edit World Entry', 'Description', entry.text || '');
  if (text === null) return;
  updateProject(current => { const item = current.world.find(world => world.id === id); if (item) { item.title = title.trim(); item.text = text.trim(); item.updatedAt = Date.now(); } });
  render();
}

async function deleteWorld(id) {
  const entry = getProject()?.world.find(item => item.id === id);
  if (!entry || !await ssConfirm('Delete World Entry', `Delete world entry “${entry.title}”?`)) return;
  updateProject(current => { current.world = current.world.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', addWorld);
list.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; if (button.dataset.action === 'edit') editWorld(button.dataset.id); if (button.dataset.action === 'delete') deleteWorld(button.dataset.id); });
render();
