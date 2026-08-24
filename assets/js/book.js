import { getProject } from './storage.js';

const project = getProject();
if (!project) location.href = '../index.html';

const book = document.querySelector('#book');
const format = document.querySelector('#format');
const fontSize = document.querySelector('#font-size');
const printButton = document.querySelector('#print');
const content = document.querySelector('#book-content');

function applyFormat() {
  if (book && format) book.dataset.format = format.value;
}

function applyFontSize() {
  if (content && fontSize) content.style.fontSize = `${fontSize.value}px`;
}

format?.addEventListener('change', applyFormat);
fontSize?.addEventListener('input', applyFontSize);

printButton?.addEventListener('click', () => {
  if (globalThis.AndroidBridge?.printPage) {
    globalThis.AndroidBridge.printPage();
    return;
  }
  globalThis.print();
});

if (project?.chapters?.length) {
  content.innerHTML = project.chapters.map((chapter, index) => `
    <section>
      <h1>${index + 1}. ${chapter.title || 'Kapitel'}</h1>
      <p>${(chapter.text || '').replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]))}</p>
    </section>
  `).join('');
}

applyFormat();
applyFontSize();