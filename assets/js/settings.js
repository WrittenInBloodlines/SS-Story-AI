import { load, save } from './storage.js';

const db = load();
const storyLength = document.querySelector('#story-length');
const creativity = document.querySelector('#creativity');
const writingMode = document.querySelector('#writing-mode');
const continuity = document.querySelector('#continuity');
const status = document.querySelector('#settings-status');

storyLength.value = db.settings.storyLength || 'very-long';
creativity.value = db.settings.creativity || 'controlled';
writingMode.value = db.settings.writingMode || 'story';
continuity.checked = db.projects.every(project => project.settings?.continuityChecks !== false);

function saveSettings() {
  db.settings.storyLength = storyLength.value;
  db.settings.creativity = creativity.value;
  db.settings.writingMode = writingMode.value;
  for (const project of db.projects) {
    project.settings = { ...(project.settings || {}), storyLength: storyLength.value, creativity: creativity.value, writingMode: writingMode.value, continuityChecks: continuity.checked };
  }
  save(db);
  status.textContent = 'Saved locally.';
  window.setTimeout(() => { status.textContent = 'Changes are saved automatically.'; }, 1200);
}

[storyLength, creativity, writingMode, continuity].forEach(input => input.addEventListener('change', saveSettings));
