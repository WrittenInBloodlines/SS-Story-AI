import { getProject, updateProject, newId, esc, go } from './storage.js';

const project = getProject();
if (!project) location.href = '../index.html';

const list = document.querySelector('#character-list');
const addButton = document.querySelector('#add-character');

function render() {
  const characters = getProject()?.characters || [];
  list.innerHTML = characters.length
    ? characters.map(character => `
      <article class="card">
        <div class="card-main">
          <div>
            <h2>${esc(character.name)}</h2>
            <p class="muted">${esc(character.description || 'No description yet.')}</p>
          </div>
          <div class="card-actions">
            <button class="secondary" data-action="edit" data-id="${character.id}">Edit</button>
            <button class="danger" data-action="delete" data-id="${character.id}">Delete</button>
          </div>
        </div>
      </article>
    `).join('')
    : `<div class="panel"><b>No characters yet</b><span class="muted">Create your first canonical character.</span></div>`;
}

function createCharacter() {
  const name = prompt('Character name');
  if (!name?.trim()) return;
  const description = prompt('Short description') || '';
  updateProject(project => {
    project.characters.push({
      id: newId('character'),
      name: name.trim(),
      description: description.trim(),
      appearance: '',
      personality: '',
      backstory: '',
      abilities: '',
      relationships: [],
      referenceImages: [],
      createdAt: Date.now()
    });
  });
  render();
}

function editCharacter(id) {
  const character = getProject()?.characters.find(item => item.id === id);
  if (!character) return;
  const name = prompt('Character name', character.name);
  if (!name?.trim()) return;
  const description = prompt('Short description', character.description || '') ?? character.description;
  updateProject(project => {
    const item = project.characters.find(entry => entry.id === id);
    if (item) {
      item.name = name.trim();
      item.description = description.trim();
    }
  });
  render();
}

function deleteCharacter(id) {
  const character = getProject()?.characters.find(item => item.id === id);
  if (!character) return;
  if (!confirm(`Delete character "${character.name}"?`)) return;
  updateProject(project => {
    project.characters = project.characters.filter(item => item.id !== id);
  });
  render();
}

addButton.addEventListener('click', createCharacter);
list.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'edit') editCharacter(button.dataset.id);
  if (button.dataset.action === 'delete') deleteCharacter(button.dataset.id);
});

render();