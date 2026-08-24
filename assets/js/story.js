import { getProject, updateProject, newId, esc } from './storage.js';

const project = getProject();
if (!project) location.href = '../index.html';

let active = project.chapters[0] || null;
const chapterList = document.querySelector('#chapter-list');
const titleInput = document.querySelector('#chapter-title');
const textInput = document.querySelector('#chapter-text');
const newButton = document.querySelector('#new-chapter');

function renderList() {
  chapterList.innerHTML = project.chapters.length
    ? project.chapters.map(chapter => `
      <button class="card ${active?.id === chapter.id ? 'active' : ''}" data-id="${chapter.id}">
        ${esc(chapter.title || 'Untitled Chapter')}
      </button>
    `).join('')
    : '<div class="panel"><b>No chapters</b><span class="muted">Create your first chapter to begin writing.</span></div>';
}

function loadChapter(chapter) {
  active = chapter;
  titleInput.value = chapter?.title || '';
  textInput.value = chapter?.text || '';
  renderList();
}

newButton.addEventListener('click', () => {
  updateProject(current => {
    const chapter = {
      id: newId('chapter'),
      title: `Chapter ${current.chapters.length + 1}`,
      text: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    current.chapters.push(chapter);
    active = chapter;
  });
  loadChapter(active);
});

titleInput.addEventListener('input', event => {
  if (!active) return;
  updateProject(current => {
    const chapter = current.chapters.find(item => item.id === active.id);
    if (!chapter) return;
    chapter.title = event.target.value;
    chapter.updatedAt = Date.now();
    active = chapter;
  });
  renderList();
});

textInput.addEventListener('input', event => {
  if (!active) return;
  updateProject(current => {
    const chapter = current.chapters.find(item => item.id === active.id);
    if (!chapter) return;
    chapter.text = event.target.value;
    chapter.updatedAt = Date.now();
    active = chapter;
  });
});

chapterList.addEventListener('click', event => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  const chapter = project.chapters.find(item => item.id === button.dataset.id);
  if (chapter) loadChapter(chapter);
});

renderList();
if (active) loadChapter(active);
