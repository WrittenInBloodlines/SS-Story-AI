import { getProject, updateProject, newId, esc } from './storage.js';
import { ssPrompt, ssConfirm } from './dialog.js';

if (!getProject()) location.href = '../index.html';
const list = document.querySelector('#plot-list');
const addButton = document.querySelector('#add-plot');

function render() {
  const plot = getProject()?.plot || [];
  list.innerHTML = plot.length ? plot.map(thread => `<article class="card"><div><b>${esc(thread.title)}</b><div class="muted">${esc(thread.text)}</div></div><div class="card-actions"><small>${esc(thread.status || 'Open')}</small><button class="secondary" data-open="${thread.id}">Open</button><button class="danger" data-delete="${thread.id}">Delete</button></div></article>`).join('') : '<div class="panel"><b>No story threads</b><span class="muted">Open storylines, secrets, and unresolved questions will appear here.</span></div>';
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
  if (!await ssConfirm('Delete Story Thread', 'Delete this story thread?')) return;
  updateProject(current => { current.plot = current.plot.filter(thread => thread.id !== id); });
  render();
}

addButton.addEventListener('click', addPlot);
list.addEventListener('click', event => { const button = event.target.closest('[data-open],[data-delete]'); if (!button) return; if (button.dataset.open) openPlot(button.dataset.open); if (button.dataset.delete) deletePlot(button.dataset.delete); });
render();
