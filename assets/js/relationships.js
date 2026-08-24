import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#relationship-list');
const addButton = document.querySelector('#add-relationship');

function render() {
  const relationships = getProject()?.relationships || [];
  list.innerHTML = relationships.length ? relationships.map(item => `<article class="card"><div class="card-main"><div><h2>${esc(item.from)} <span class="muted">${esc(item.type)}</span> ${esc(item.to)}</h2><p class="muted">${esc(item.description || 'No description yet.')}</p></div><div class="card-actions"><button class="secondary" data-action="edit" data-id="${item.id}">Edit</button><button class="danger" data-action="delete" data-id="${item.id}">Delete</button></div></div></article>`).join('') : '<div class="panel"><b>No relationships yet</b><span class="muted">Add a canonical relationship between two characters.</span></div>';
}

async function addRelationship() {
  const project = getProject();
  const names = (project?.characters || []).map(item => item.name);
  const hint = names.length ? `First character · Available: ${names.join(', ')}` : 'First character';
  const from = await ssPrompt('New Relationship', hint);
  if (!from?.trim()) return;
  const to = await ssPrompt('New Relationship', names.length ? `Second character · Available: ${names.join(', ')}` : 'Second character');
  if (!to?.trim()) return;
  const type = await ssPrompt('New Relationship', 'Relationship type', 'connected to');
  if (type === null) return;
  const description = await ssPrompt('New Relationship', 'Description') || '';
  updateProject(current => current.relationships.push({ id: newId('relationship'), from: from.trim(), to: to.trim(), type: type.trim() || 'connected to', description: description.trim(), createdAt: Date.now(), updatedAt: Date.now() }));
  render();
}

async function editRelationship(id) {
  const entry = getProject()?.relationships.find(item => item.id === id);
  if (!entry) return;
  const from = await ssPrompt('Edit Relationship', 'First character', entry.from);
  if (!from?.trim()) return;
  const to = await ssPrompt('Edit Relationship', 'Second character', entry.to);
  if (!to?.trim()) return;
  const type = await ssPrompt('Edit Relationship', 'Relationship type', entry.type || 'connected to');
  if (type === null) return;
  const description = await ssPrompt('Edit Relationship', 'Description', entry.description || '');
  if (description === null) return;
  updateProject(current => { const item = current.relationships.find(rel => rel.id === id); if (item) { item.from = from.trim(); item.to = to.trim(); item.type = type.trim() || 'connected to'; item.description = description.trim(); item.updatedAt = Date.now(); } });
  render();
}

async function deleteRelationship(id) {
  const entry = getProject()?.relationships.find(item => item.id === id);
  if (!entry || !await ssConfirm('Delete Relationship', `Delete relationship between ${entry.from} and ${entry.to}?`)) return;
  updateProject(project => { project.relationships = project.relationships.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', addRelationship);
list.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; if (button.dataset.action === 'edit') editRelationship(button.dataset.id); if (button.dataset.action === 'delete') deleteRelationship(button.dataset.id); });
render();
