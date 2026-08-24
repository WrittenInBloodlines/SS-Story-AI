import { load, save } from './storage.js';
import { ssChoose } from './dialog.js';

const db = load();
const storyLength = document.querySelector('#story-length');
const creativity = document.querySelector('#creativity');
const writingMode = document.querySelector('#writing-mode');
const continuity = document.querySelector('#continuity');
const status = document.querySelector('#settings-status');
let values = { storyLength: db.settings.storyLength || 'very-long', creativity: db.settings.creativity || 'controlled', writingMode: db.settings.writingMode || 'story' };
continuity.checked = db.projects.length ? db.projects.every(project => project.settings?.continuityChecks !== false) : true;
const labels = { storyLength: { short: 'Short', medium: 'Medium', long: 'Long', 'very-long': 'Very long' }, creativity: { controlled: 'Controlled', balanced: 'Balanced', creative: 'Creative' }, writingMode: { story: 'Story', roleplay: 'Roleplay', outline: 'Outline' } };
function render() { storyLength.textContent = labels.storyLength[values.storyLength]; creativity.textContent = labels.creativity[values.creativity]; writingMode.textContent = labels.writingMode[values.writingMode]; }
function saveSettings() { db.settings = { ...db.settings, ...values }; for (const project of db.projects) project.settings = { ...(project.settings || {}), ...values, continuityChecks: continuity.checked }; save(db); status.textContent = 'Saved locally.'; window.setTimeout(() => { status.textContent = 'Changes are saved automatically.'; }, 1200); }
storyLength.addEventListener('click', async () => { const value = await ssChoose('Story Length', Object.entries(labels.storyLength).map(([value, label]) => ({ value, label })), values.storyLength); if (value) { values.storyLength = value; render(); saveSettings(); } });
creativity.addEventListener('click', async () => { const value = await ssChoose('Creativity', Object.entries(labels.creativity).map(([value, label]) => ({ value, label })), values.creativity); if (value) { values.creativity = value; render(); saveSettings(); } });
writingMode.addEventListener('click', async () => { const value = await ssChoose('Writing Mode', Object.entries(labels.writingMode).map(([value, label]) => ({ value, label })), values.writingMode); if (value) { values.writingMode = value; render(); saveSettings(); } });
continuity.addEventListener('change', saveSettings);
render();
