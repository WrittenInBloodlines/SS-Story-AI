import { getProject } from './storage.js';
import { ssChoose } from './dialog.js';

const project = getProject();
if (!project) location.href = '../index.html';
const book = document.querySelector('#book');
const formatTrigger = document.querySelector('#format-trigger');
const printButton = document.querySelector('#print');
const content = document.querySelector('#book-content');
let currentFormat = 'a5';

const formats = [
  { value: 'a3', label: 'A3' }, { value: 'a4', label: 'A4' }, { value: 'a5', label: 'A5' },
  { value: 'a6', label: 'A6' }, { value: 'a7', label: 'A7' }, { value: 'b4', label: 'B4' },
  { value: 'b5', label: 'B5' }, { value: 'letter', label: 'Letter' }, { value: 'legal', label: 'Legal' }
];

const formatTextSizes = { a3: '18px', a4: '17px', a5: '16px', a6: '15px', a7: '14px', b4: '17px', b5: '16px', letter: '17px', legal: '17px' };

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function renderBook() {
  if (!content) return;
  const chapters = project?.chapters || [];
  content.innerHTML = chapters.length
    ? chapters.map((chapter, index) => `<section><h1>${index + 1}. ${escapeHtml(chapter.title || 'Kapitel')}</h1><p>${escapeHtml(chapter.text || '')}</p></section>`).join('')
    : '<h1>Your Book</h1><p class="muted">Chapters will appear here automatically once they are created in the Story section.</p>';
}

function applyFormat() {
  if (!book || !content) return;
  book.dataset.format = currentFormat;
  content.style.fontSize = formatTextSizes[currentFormat] || '16px';
  content.style.textAlign = 'left';
  const selected = formats.find(item => item.value === currentFormat);
  if (formatTrigger) formatTrigger.textContent = selected?.label || currentFormat.toUpperCase();
}

formatTrigger?.addEventListener('click', async () => {
  const selected = await ssChoose('Book Format', formats, currentFormat);
  if (selected) { currentFormat = selected; applyFormat(); }
});

printButton?.addEventListener('click', () => {
  if (globalThis.AndroidBridge?.printPage) globalThis.AndroidBridge.printPage(currentFormat);
  else globalThis.print();
});

renderBook();
applyFormat();
