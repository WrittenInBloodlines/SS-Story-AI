import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#world-list');
const addButton = document.querySelector('#add-world');

function render() {
  const world = getProject()?.world || [];
  list.innerHTML = world.length ? world.map(entry => `<article class="card"><div><b>${esc(entry.title)}</b><div class="muted">${esc(entry.text)}</div></div><button class="danger" data-delete="${entry.id}">Delete</button></article>`).join('') : '<div class="panel"><b>No world entries</b><span class="muted">Add locations, rules, organizations, history, or other world information.</span></div>';
}

async function addWorld() {
  const title = await ssPrompt('New World Entry', 'Title');
  if (!title?.trim()) return;
  const text = await ssPrompt('New World Entry', 'Description');
  if (!text?.trim()) return;
  updateProject(current => current.world.push({ id: newId('world'), title: title.trim(), text: text.trim(), createdAt: Date.now(), updatedAt: Date.now() }));
  render();
}

async function deleteWorld(id) {
  if (!await ssConfirm('Delete World Entry', 'Delete this world entry?')) return;
  updateProject(current => { current.world = current.world.filter(entry => entry.id !== id); });
  render();
}

addButton.addEventListener('click', addWorld);
list.addEventListener('click', event => { const button = event.target.closest('[data-delete]'); if (button) deleteWorld(button.dataset.delete); });
render();
