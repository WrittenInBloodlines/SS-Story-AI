import { getProject, updateProject, newId, esc } from './storage.js';

const project = getProject();
if (!project) location.href = '../index.html';

const list = document.querySelector('#memory-list');
const addButton = document.querySelector('#add-memory');

function render() {
  const memory = getProject()?.memories || [];
  list.innerHTML = memory.length
    ? memory.map(entry => `
      <article class="card">
        <div class="card-main">
          <div>
            <h2>${esc(entry.title)}</h2>
            <p class="muted">${esc(entry.text)}</p>
            <small class="muted">${entry.locked ? 'Locked memory' : 'Editable memory'}</small>
          </div>
          <div class="card-actions">
            <button class="secondary" data-action="edit" data-id="${entry.id}">Edit</button>
            <button class="danger" data-action="delete" data-id="${entry.id}">Delete</button>
          </div>
        </div>
      </article>
    `).join('')
    : `<div class="panel"><b>No memory entries yet</b><span class="muted">Add information that should remain available across chats.</span></div>`;
}

function createMemory() {
  const title = prompt('Memory title');
  if (!title?.trim()) return;
  const text = prompt('Memory information');
  if (!text?.trim()) return;
  updateProject(project => {
    project.memories.push({
      id: newId('memory'),
      title: title.trim(),
      text: text.trim(),
      locked: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });
  render();
}

function editMemory(id) {
  const entry = getProject()?.memories.find(item => item.id === id);
  if (!entry) return;
  const title = prompt('Memory title', entry.title);
  if (!title?.trim()) return;
  const text = prompt('Memory information', entry.text);
  if (!text?.trim()) return;
  const locked = confirm('Lock this memory entry? Locked entries are intended to be protected from automatic changes later.');
  updateProject(project => {
    const item = project.memories.find(memory => memory.id === id);
    if (item) {
      item.title = title.trim();
      item.text = text.trim();
      item.locked = locked;
      item.updatedAt = Date.now();
    }
  });
  render();
}

function deleteMemory(id) {
  const entry = getProject()?.memories.find(item => item.id === id);
  if (!entry) return;
  if (!confirm(`Delete memory "${entry.title}"?`)) return;
  updateProject(project => {
    project.memories = project.memories.filter(item => item.id !== id);
  });
  render();
}

addButton.addEventListener('click', createMemory);
list.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  if (button.dataset.action === 'edit') editMemory(button.dataset.id);
  if (button.dataset.action === 'delete') deleteMemory(button.dataset.id);
});

render();