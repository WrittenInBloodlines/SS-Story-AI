import { getProject } from './storage.js';
import { ssChoose } from './dialog.js';

const project = getProject();
if (!project) location.href = '../index.html';
const book = document.querySelector('#book');
const formatTrigger = document.querySelector('#format-trigger');
const fontSize = document.querySelector('#font-size');
const printButton = document.querySelector('#print');
const content = document.querySelector('#book-content');
let currentFormat = 'a5';

function applyFormat() {
  if (!book) return;
  book.dataset.format = currentFormat;
  if (formatTrigger) formatTrigger.textContent = currentFormat === 'letter' ? 'Letter' : currentFormat.toUpperCase();
}
function applyFontSize() { if (content && fontSize) content.style.fontSize = `${fontSize.value}px`; }

formatTrigger?.addEventListener('click', async () => {
  const selected = await ssChoose('Book Format', [{ value: 'a5', label: 'A5' }, { value: 'a4', label: 'A4' }, { value: 'letter', label: 'Letter' }], currentFormat);
  if (!selected) return;
  currentFormat = selected;
  applyFormat();
});
fontSize?.addEventListener('input', applyFontSize);
printButton?.addEventListener('click', () => { if (globalThis.AndroidBridge?.printPage) globalThis.AndroidBridge.printPage(currentFormat); else globalThis.print(); });

if (project?.chapters?.length) {
  content.innerHTML = project.chapters.map((chapter, index) => `<section><h1>${index + 1}. ${chapter.title || 'Kapitel'}</h1><p>${(chapter.text || '').replace(/[&<>]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character]))}</p></section>`).join('');
}
applyFormat();
applyFontSize();
