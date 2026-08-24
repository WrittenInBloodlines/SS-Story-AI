import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#plot-list');
const addButton = document.querySelector('#add-plot');

function render() {
  const plot = getProject()?.plot || [];
  list.innerHTML = plot.length ? plot.map(thread => `<article class="card"><div class="card-main"><div><b>${esc(thread.title)}</b><p class="muted">${esc(thread.text)}</p><small class="muted">${esc(thread.status || 'Open')}</small></div><div class="card-actions"><button class="secondary" data-action="open" data-id="${thread.id}">Open</button><button class="danger" data-action="delete" data-id="${thread.id}">Delete</button></div></div></article>`).join('') : '<div class="panel"><b>No story threads</b><span class="muted">Open storylines, secrets, and unresolved questions will appear here.</span></div>';
}

async function addPlot() {
  const title = await ssPrompt('New Story Thread', 'Story thread');
  if (!title?.trim()) return;
  const text = await ssPrompt('New Story Thread', 'Description');
  if (!text?.trim()) return;
  updateProject(current => current.plot.push({ id: newId('plot'), title: title.trim(), text: text.trim(), status: 'Open', createdAt: Date.now(), updatedAt: Date.now() }));
  render();
}

async function openPlot(id) {
  const thread = getProject()?.plot.find(item => item.id === id);
  if (!thread) return;
  await ssConfirm(thread.title, `${thread.text}\n\nStatus: ${thread.status || 'Open'}`);
}

async function deletePlot(id) {
  const thread = getProject()?.plot.find(item => item.id === id);
  if (!thread || !await ssConfirm('Delete Story Thread', `Delete “${thread.title}”?`)) return;
  updateProject(current => { current.plot = current.plot.filter(item => item.id !== id); });
  render();
}

addButton.addEventListener('click', addPlot);
list.addEventListener('click', event => { const button = event.target.closest('[data-action]'); if (!button) return; if (button.dataset.action === 'open') openPlot(button.dataset.id); if (button.dataset.action === 'delete') deletePlot(button.dataset.id); });
render();
