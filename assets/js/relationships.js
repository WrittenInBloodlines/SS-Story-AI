import { getProject, updateProject, newId, esc } from './storage.js';

if (!getProject()) location.href = '../index.html';

const list = document.querySelector('#relationship-list');
const addButton = document.querySelector('#add-relationship');

function render() {
  const project = getProject();
  const relationships = project?.relationships || [];
  list.innerHTML = relationships.length
    ? relationships.map(item => `
      <article class="card">
        <div class="card-main">
          <div>
            <h2>${esc(item.from)} <span class="muted">${esc(item.type)}</span> ${esc(item.to)}</h2>
            <p class="muted">${esc(item.description || 'No description yet.')}</p>
          </div>
          <button class="danger" data-delete="${item.id}">Delete</button>
        </div>
      </article>`).join('')
    : `<div class="panel"><b>No relationships yet</b><span class="muted">Add a canonical relationship between two characters.</span></div>`;
}

function addRelationship() {
  const project = getProject();
  const names = (project?.characters || []).map(item => item.name);
  const from = prompt(`First character${names.length ? `\nAvailable: ${names.join(', ')}` : ''}`);
  if (!from?.trim()) return;
  const to = prompt(`Second character${names.length ? `\nAvailable: ${names.join(', ')}` : ''}`);
  if (!to?.trim()) return;
  const type = prompt('Relationship type', 'connected to') || 'connected to';
  const description = prompt('Description') || '';

  updateProject(project => {
    project.relationships.push({
      id: newId('relationship'),
      from: from.trim(),
      to: to.trim(),
      type: type.trim(),
      description: description.trim(),
      createdAt: Date.now()
    });
  });
  render();
}

addButton.addEventListener('click', addRelationship);
list.addEventListener('click', event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  updateProject(project => {
    project.relationships = project.relationships.filter(item => item.id !== button.dataset.delete);
  });
  render();
});

render();