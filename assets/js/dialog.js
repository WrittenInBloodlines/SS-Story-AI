function ensureRoot() {
  let root = document.querySelector('#ss-dialog-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'ss-dialog-root';
    document.body.appendChild(root);
  }
  if (!document.querySelector('#ss-dialog-styles')) {
    const link = document.createElement('link');
    link.id = 'ss-dialog-styles';
    link.rel = 'stylesheet';
    link.href = '../assets/css/dialog.css';
    document.head.appendChild(link);
  }
  return root;
}
function close(root, value) { root.innerHTML = ''; return value; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character])); }

export function ssPrompt(title, label = '', initialValue = '') {
  return new Promise(resolve => {
    const root = ensureRoot();
    root.innerHTML = `<div class="ss-dialog-backdrop"><section class="ss-dialog" role="dialog" aria-modal="true"><header class="ss-dialog-header"><h2 class="ss-dialog-title">${escapeHtml(title)}</h2></header><div class="ss-dialog-body">${label ? `<label class="ss-dialog-label" for="ss-dialog-input">${escapeHtml(label)}</label>` : ''}<input class="ss-dialog-input" id="ss-dialog-input" value="${escapeHtml(initialValue)}" autocomplete="off"></div><footer class="ss-dialog-actions"><button type="button" class="ss-dialog-cancel">Cancel</button><button type="button" class="ss-dialog-ok">OK</button></footer></section></div>`;
    const input = root.querySelector('#ss-dialog-input');
    const finish = value => resolve(close(root, value));
    root.querySelector('.ss-dialog-cancel').onclick = () => finish(null);
    root.querySelector('.ss-dialog-ok').onclick = () => finish(input.value);
    root.querySelector('.ss-dialog-backdrop').onclick = event => { if (event.target.classList.contains('ss-dialog-backdrop')) finish(null); };
    input.focus(); input.select();
    input.onkeydown = event => { if (event.key === 'Enter') finish(input.value); if (event.key === 'Escape') finish(null); };
  });
}

export function ssConfirm(title, message) {
  return new Promise(resolve => {
    const root = ensureRoot();
    root.innerHTML = `<div class="ss-dialog-backdrop"><section class="ss-dialog" role="dialog" aria-modal="true"><header class="ss-dialog-header"><h2 class="ss-dialog-title">${escapeHtml(title)}</h2></header><div class="ss-dialog-body"><div class="ss-dialog-message">${escapeHtml(message)}</div></div><footer class="ss-dialog-actions"><button type="button" class="ss-dialog-cancel">Cancel</button><button type="button" class="ss-dialog-ok">OK</button></footer></section></div>`;
    const finish = value => resolve(close(root, value));
    root.querySelector('.ss-dialog-cancel').onclick = () => finish(false);
    root.querySelector('.ss-dialog-ok').onclick = () => finish(true);
  });
}

export function ssChoose(title, options, selected = '') {
  return new Promise(resolve => {
    const root = ensureRoot();
    root.innerHTML = `<div class="ss-dialog-backdrop"><section class="ss-dialog" role="dialog" aria-modal="true"><header class="ss-dialog-header"><h2 class="ss-dialog-title">${escapeHtml(title)}</h2></header><div class="ss-dialog-body"><div class="ss-dialog-options">${options.map(option => `<button type="button" class="ss-dialog-option ${option.value === selected ? 'active' : ''}" data-value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</button>`).join('')}</div></div><footer class="ss-dialog-actions"><button type="button" class="ss-dialog-cancel">Cancel</button></footer></section></div>`;
    const finish = value => resolve(close(root, value));
    root.querySelector('.ss-dialog-cancel').onclick = () => finish(null);
    root.querySelectorAll('.ss-dialog-option').forEach(button => button.onclick = () => finish(button.dataset.value));
  });
}
