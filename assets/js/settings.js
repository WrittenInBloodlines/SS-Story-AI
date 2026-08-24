import { load, save } from './storage.js';
import { ssChoose } from './dialog.js';

const db = load();
const storyLength = document.querySelector('#story-length');
const creativity = document.querySelector('#creativity');
const writingMode = document.querySelector('#writing-mode');
const continuity = document.querySelector('#continuity');
const status = document.querySelector('#settings-status');
const gemmaPick = document.querySelector('#gemma-pick');
const gemmaStatus = document.querySelector('#gemma-status');
let values = { storyLength: db.settings.storyLength || 'very-long', creativity: db.settings.creativity || 'controlled', writingMode: db.settings.writingMode || 'story' };
continuity.checked = db.projects.length ? db.projects.every(project => project.settings?.continuityChecks !== false) : true;
const labels = { storyLength: { short: 'Short', medium: 'Medium', long: 'Long', 'very-long': 'Very long' }, creativity: { controlled: 'Controlled', balanced: 'Balanced', creative: 'Creative' }, writingMode: { story: 'Story', roleplay: 'Roleplay', outline: 'Outline' } };
function render() { storyLength.textContent = labels.storyLength[values.storyLength]; creativity.textContent = labels.creativity[values.creativity]; writingMode.textContent = labels.writingMode[values.writingMode]; }
function saveSettings() { db.settings = { ...db.settings, ...values }; for (const project of db.projects) project.settings = { ...(project.settings || {}), ...values, continuityChecks: continuity.checked }; save(db); status.textContent = 'Saved locally.'; window.setTimeout(() => { status.textContent = 'Changes are saved automatically.'; }, 1200); }
storyLength.addEventListener('click', async () => { const value = await ssChoose('Story Length', Object.entries(labels.storyLength).map(([value, label]) => ({ value, label })), values.storyLength); if (value) { values.storyLength = value; render(); saveSettings(); } });
creativity.addEventListener('click', async () => { const value = await ssChoose('Creativity', Object.entries(labels.creativity).map(([value, label]) => ({ value, label })), values.creativity); if (value) { values.creativity = value; render(); saveSettings(); } });
writingMode.addEventListener('click', async () => { const value = await ssChoose('Writing Mode', Object.entries(labels.writingMode).map(([value, label]) => ({ value, label })), values.writingMode); if (value) { values.writingMode = value; render(); saveSettings(); } });
continuity.addEventListener('change', saveSettings);

function updateGemmaStatus(message) {
  if (gemmaStatus) gemmaStatus.textContent = message;
}

if (gemmaPick) {
  gemmaPick.addEventListener('click', () => {
    if (window.AndroidBridge && typeof window.AndroidBridge.pickGemmaModel === 'function') {
      updateGemmaStatus('Choose a local model file…');
      window.AndroidBridge.pickGemmaModel();
    } else {
      updateGemmaStatus('Local model loading is available in the Android app.');
    }
  });
}

window.addEventListener('ss-gemma-status', event => {
  const detail = event.detail || {};
  updateGemmaStatus(detail.message || (detail.ok ? 'Gemma is loaded and ready.' : 'Gemma is not loaded.'));
});

if (window.AndroidBridge && typeof window.AndroidBridge.gemmaStatus === 'function') {
  try {
    const result = JSON.parse(window.AndroidBridge.gemmaStatus());
    updateGemmaStatus(result.loaded ? 'Gemma is loaded and ready.' : 'No local model loaded');
  } catch {
    updateGemmaStatus('Local model status unavailable.');
  }
}

render();
