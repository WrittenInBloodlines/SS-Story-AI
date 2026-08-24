import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#relationship-list');
const addButton = document.querySelector('#add-relationship');

function render() {
  const project = getProject();
  const relationships = project?.relationships || [];
  list.innerHTML = relationships.length ? relationships.map(item => `<article class="card"><div class="card-main"><div><h2>${esc(item.from)} <span class="muted">${esc(item.type)}</span> ${esc(item.to)}</h2><p class="muted">${esc(item.description || 'No description yet.')}</p></div><button class="danger" data-delete="${item.id}">Delete</button></div></article>`).join('') : `<div class="panel"><b>No relationships yet</b><span class="muted">Add a canonical relationship between two characters.</span></div>`;
}

async function addRelationship() {
  const project = getProject();
  const names = (project?.characters || []).map(item => item.name);
  const hint = names.length ? `Available characters: ${names.join(', ')}` : 'Enter a character name.';
  const from = await ssPrompt('New Relationship', `First character\n${hint}`);
  if (!from?.trim()) return;
  const to = await ssPrompt('New Relationship', `Second character\n${hint}`);
  if (!to?.trim()) return;
  const type = await ssPrompt('New Relationship', 'Relationship type', 'connected to');
  if (type === null) return;
  const description = await ssPrompt('New Relationship', 'Description') || '';
  updateProject(project => project.relationships.push({ id: newId('relationship'), from: from.trim(), to: to.trim(), type: type.trim() || 'connected to', description: description.trim(), createdAt: Date.now() }));
  render();
}

async function deleteRelationship(id) {
  if (!await ssConfirm('Delete Relationship', 'Delete this relationship?')) return;
  updateProject(project => { project.relationships = project.relationships.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', addRelationship);
list.addEventListener('click', event => { const button = event.target.closest('[data-delete]'); if (button) deleteRelationship(button.dataset.delete); });
render();
