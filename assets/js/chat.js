import { getProject, updateProject, newId, esc, projectId } from './storage.js';
import { checkContinuity } from './ai/continuity.js';

const project = getProject();

if (!project) {
  location.href = '../index.html';
  throw new Error('Project not found');
}

const form = document.querySelector('#chat-form');
const input = document.querySelector('#message');
const box = document.querySelector('#messages');
const title = document.querySelector('#chat-title');
const heading = document.querySelector('#chat-heading');
const status = document.querySelector('#chat-status');
const warningBox = document.querySelector('#continuity-warnings');
const chatList = document.querySelector('#chat-list');
const newChatButton = document.querySelector('#new-chat');

let activeChatId = new URLSearchParams(location.search).get('chat');

function ensureChats() {
  let selected;

  updateProject(current => {
    if (!Array.isArray(current.chats)) current.chats = [];

    if (!current.chats.length) {
      const now = new Date().toISOString();
      current.chats.push({
        id: newId('chat'),
        title: 'Main Chat',
        messages: [],
        createdAt: now,
        updatedAt: now
      });
    }

    selected = current.chats.find(chat => chat.id === activeChatId) || current.chats[0];
    activeChatId = selected.id;
  });

  return selected;
}

let chat = ensureChats();

function chatUrl(chatId) {
  const params = new URLSearchParams({ project: projectId(), chat: chatId });
  return `chat.html?${params.toString()}`;
}

function renderWarnings(warnings = []) {
  if (!warningBox) return;

  if (!warnings.length) {
    warningBox.hidden = true;
    warningBox.innerHTML = '';
    return;
  }

  warningBox.hidden = false;
  warningBox.innerHTML = `
    <div class="continuity-warning-title">Continuity Check</div>
    ${warnings.map(warning => `
      <div class="continuity-warning continuity-${esc(warning.severity)}">
        <span>${esc(warning.message)}</span>
      </div>
    `).join('')}
    <div class="continuity-warning-actions">
      <button type="button" id="continue-anyway">Continue Anyway</button>
    </div>
  `;

  document.querySelector('#continue-anyway')?.addEventListener('click', () => {
    warningBox.hidden = true;
    warningBox.innerHTML = '';
    saveMessage(input.value.trim(), true);
  });
}

function renderChatList() {
  const current = getProject();
  const chats = [...(current?.chats || [])].sort((a, b) => {
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  chatList.innerHTML = chats.map(item => {
    const preview = item.messages?.length
      ? item.messages[item.messages.length - 1].text
      : 'No messages yet';

    return `
      <a class="chat-list-item ${item.id === activeChatId ? 'active' : ''}" href="${esc(chatUrl(item.id))}">
        <span class="chat-list-title">${esc(item.title || 'Untitled Chat')}</span>
        <span class="chat-list-preview">${esc(preview.slice(0, 72))}</span>
      </a>
    `;
  }).join('');
}

function render() {
  title.textContent = chat.title || 'Chat';
  heading.textContent = chat.title || 'Chat';
  status.textContent = 'Local draft';
  renderChatList();

  if (!chat.messages?.length) {
    box.innerHTML = `
      <div class="empty">
        <h2>Your Story Chat</h2>
        <p>Start writing. Messages are stored locally in this project.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = chat.messages.map(message => `
    <article class="message ${message.role === 'user' ? 'message-user' : 'message-assistant'}">
      <div class="message-role">${message.role === 'user' ? 'You' : 'S•S Story AI'}</div>
      <div class="message-text">${esc(message.text).replace(/\n/g, '<br>')}</div>
    </article>
  `).join('');

  box.scrollTop = box.scrollHeight;
}

function saveMessage(text, bypassContinuity = false) {
  if (!text) return;

  if (!bypassContinuity) {
    const warnings = checkContinuity(text, getProject());
    if (warnings.length) {
      renderWarnings(warnings);
      return;
    }
  }

  const message = {
    id: newId('message'),
    role: 'user',
    text,
    createdAt: new Date().toISOString()
  };

  updateProject(current => {
    const currentChat = current.chats.find(item => item.id === activeChatId);
    if (!currentChat) return;

    currentChat.messages = Array.isArray(currentChat.messages) ? currentChat.messages : [];
    currentChat.messages.push(message);
    currentChat.updatedAt = new Date().toISOString();
    chat = currentChat;

    if (currentChat.messages.length === 1 && currentChat.title === 'Main Chat') {
      const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
      currentChat.title = words || 'Main Chat';
      chat = currentChat;
    }
  });

  input.value = '';
  renderWarnings([]);
  render();
  input.focus();
}

function createChat() {
  const now = new Date().toISOString();
  const created = {
    id: newId('chat'),
    title: 'New Chat',
    messages: [],
    createdAt: now,
    updatedAt: now
  };

  updateProject(current => {
    current.chats.push(created);
  });

  location.href = chatUrl(created.id);
}

newChatButton?.addEventListener('click', createChat);

form.addEventListener('submit', event => {
  event.preventDefault();
  saveMessage(input.value.trim());
});

input.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

render();
