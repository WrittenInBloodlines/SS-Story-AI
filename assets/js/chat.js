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

const requestedChatId = new URLSearchParams(location.search).get('chat');
let activeChatId = project.activeChatId || requestedChatId || null;
let chat = null;
let gemmaGenerating = false;
let gemmaThinkingTimer = null;
let gemmaTypingBubble = null;

function chatUrl(chatId) {
  const params = new URLSearchParams({ project: projectId(), chat: chatId });
  return `chat.html?${params.toString()}`;
}

function ensureChats() {
  let selectedId = requestedChatId || activeChatId;

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

    const selected = current.chats.find(item => item.id === selectedId) ||
      current.chats.find(item => item.id === current.activeChatId) ||
      [...current.chats].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))[0];

    selectedId = selected.id;
    current.activeChatId = selectedId;
    selected.messages = Array.isArray(selected.messages) ? selected.messages : [];
  });

  activeChatId = selectedId;
  const freshProject = getProject();
  chat = freshProject?.chats?.find(item => item.id === activeChatId) || null;
  return chat;
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
    const messages = Array.isArray(item.messages) ? item.messages : [];
    const preview = messages.length ? messages[messages.length - 1].text : 'No messages yet';

    return `
      <a class="chat-list-item ${item.id === activeChatId ? 'active' : ''}" href="${esc(chatUrl(item.id))}" data-chat-id="${esc(item.id)}">
        <span class="chat-list-title">${esc(item.title || 'Untitled Chat')}</span>
        <span class="chat-list-preview">${esc(String(preview || '').slice(0, 72))}</span>
      </a>
    `;
  }).join('');

  chatList.querySelectorAll('[data-chat-id]').forEach(link => {
    link.addEventListener('click', event => {
      const targetId = link.dataset.chatId;
      if (!targetId) return;
      activeChatId = targetId;
      updateProject(current => {
        if (current.chats.some(item => item.id === targetId)) current.activeChatId = targetId;
      });
    });
  });
}

function render() {
  if (!chat) chat = ensureChats();
  if (!chat) return;

  title.textContent = chat.title || 'Chat';
  heading.textContent = chat.title || 'Chat';
  if (!gemmaGenerating) status.textContent = 'Local draft';
  renderChatList();

  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  if (!messages.length) {
    box.innerHTML = `
      <div class="empty">
        <h2>Your Story Chat</h2>
        <p>Start writing. Messages are stored locally in this project.</p>
      </div>
    `;
    return;
  }

  box.innerHTML = messages.map(message => `
    <article class="message ${message.role === 'user' ? 'message-user' : 'message-assistant'}">
      <div class="message-role">${message.role === 'user' ? 'You' : 'Gemma'}</div>
      <div class="message-text">${esc(message.text).replace(/\n/g, '<br>')}</div>
    </article>
  `).join('');

  box.scrollTop = box.scrollHeight;
}

function startGemmaThinkingIndicator() {
  stopGemmaThinkingIndicator();
  removeGemmaTypingBubble();

  // Gemma gets a real assistant bubble on the left. The dots are only shown
  // while native inference is actually running and disappear once a response
  // or an error arrives.
  const bubble = document.createElement('article');
  bubble.className = 'message message-assistant message-gemma-typing';
  bubble.setAttribute('aria-label', 'Gemma is generating a response');
  bubble.innerHTML = `
    <div class="message-role">Gemma</div>
    <div class="message-text gemma-typing-dots" aria-hidden="true">…</div>
  `;

  box.appendChild(bubble);
  gemmaTypingBubble = bubble;
  box.scrollTop = box.scrollHeight;

  const frames = ['…', '… ..', '… .. .', '… ..', '…'];
  let index = 0;
  gemmaThinkingTimer = window.setInterval(() => {
    if (!gemmaGenerating || !gemmaTypingBubble) return;
    index = (index + 1) % frames.length;
    const dots = gemmaTypingBubble.querySelector('.gemma-typing-dots');
    if (dots) dots.textContent = frames[index];
  }, 420);
}

function stopGemmaThinkingIndicator() {
  if (gemmaThinkingTimer !== null) {
    window.clearInterval(gemmaThinkingTimer);
    gemmaThinkingTimer = null;
  }
}

function removeGemmaTypingBubble() {
  if (gemmaTypingBubble) {
    gemmaTypingBubble.remove();
    gemmaTypingBubble = null;
  }
}

function saveMessage(text, bypassContinuity = false) {
  if (!text || gemmaGenerating) return;

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
    currentChat.updatedAt = message.createdAt;
    current.activeChatId = currentChat.id;

    if (currentChat.messages.length === 1 && currentChat.title === 'Main Chat') {
      const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
      currentChat.title = words || 'Main Chat';
    }
  });

  const freshProject = getProject();
  chat = freshProject?.chats?.find(item => item.id === activeChatId) || null;
  input.value = '';
  renderWarnings([]);
  render();
  input.focus();
  generateWithGemma();
}

function generateWithGemma() {
  if (!window.AndroidBridge || typeof window.AndroidBridge.generateGemmaAsync !== 'function') return;
  if (typeof window.AndroidBridge.gemmaStatus !== 'function') return;

  let statusInfo;
  try {
    statusInfo = JSON.parse(window.AndroidBridge.gemmaStatus());
  } catch {
    return;
  }

  if (!statusInfo.loaded) {
    status.textContent = 'Gemma is not loaded.';
    return;
  }

  const currentProject = getProject();
  const currentChat = currentProject?.chats?.find(item => item.id === activeChatId);
  if (!currentChat || gemmaGenerating) return;

  const messages = (currentChat.messages || []).map(message => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.text || ''
  }));

  const requestId = `gemma-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Keep this identical to the native runtime prompt. The native inference
  // engine requires its system prompt to be configured immediately after the
  // GGUF model is loaded, so generation must not attempt to replace it later.
  const payload = JSON.stringify({
    messages
  });

  gemmaGenerating = true;
  input.disabled = true;
  status.textContent = 'Gemma • Generating…';
  startGemmaThinkingIndicator();

  let settled = false;
  let timeout = null;

  const cleanup = () => {
    window.removeEventListener('ss-gemma-generation', handleResult);
    if (timeout !== null) window.clearTimeout(timeout);
    stopGemmaThinkingIndicator();
    removeGemmaTypingBubble();
  };

  const finish = (callback) => {
    if (settled) return;
    settled = true;
    cleanup();
    callback();
    gemmaGenerating = false;
    input.disabled = false;
    input.focus();
  };

  const handleResult = event => {
    const data = event?.detail;
    if (!data || data.requestId !== requestId) return;

    finish(() => {
      if (!data.ok) {
        status.textContent = data.message || 'Gemma could not generate a response.';
        return;
      }

      const text = String(data.text || '').trim();
      if (!text) {
        status.textContent = 'Gemma returned an empty response.';
        return;
      }

      const assistantMessage = {
        id: newId('message'),
        role: 'assistant',
        text,
        createdAt: new Date().toISOString()
      };

      updateProject(current => {
        const targetChat = current.chats.find(item => item.id === activeChatId);
        if (!targetChat) return;
        targetChat.messages = Array.isArray(targetChat.messages) ? targetChat.messages : [];
        targetChat.messages.push(assistantMessage);
        targetChat.updatedAt = assistantMessage.createdAt;
      });

      chat = getProject()?.chats?.find(item => item.id === activeChatId) || chat;
      status.textContent = 'Gemma • local response';
      render();
    });
  };

  window.addEventListener('ss-gemma-generation', handleResult);

  timeout = window.setTimeout(() => {
    finish(() => {
      status.textContent = 'Gemma took too long to respond.';
    });
  }, 180000);

  try {
    window.AndroidBridge.generateGemmaAsync(requestId, payload);
  } catch (error) {
    finish(() => {
      status.textContent = `Gemma error: ${error?.message || error}`;
    });
  }
}

function createChat() {
  const now = new Date().toISOString();
  let createdId = null;

  updateProject(current => {
    if (!Array.isArray(current.chats)) current.chats = [];
    const created = {
      id: newId('chat'),
      title: 'New Chat',
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    createdId = created.id;
    current.chats.push(created);
    current.activeChatId = created.id;
  });

  if (createdId) location.href = chatUrl(createdId);
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

chat = ensureChats();
render();
