import { getProject, updateProject, newId, esc, projectId } from './storage.js';
import { checkContinuity } from './ai/continuity.js';

const project = getProject();
if (!project) { location.href = '../index.html'; throw new Error('Project not found'); }
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
let gemmaBubble = null;
let gemmaStreamText = '';

function chatUrl(chatId) { return `chat.html?${new URLSearchParams({ project: projectId(), chat: chatId }).toString()}`; }

function ensureChats() {
  let selectedId = requestedChatId || activeChatId;
  updateProject(current => {
    if (!Array.isArray(current.chats)) current.chats = [];
    if (!current.chats.length) {
      const now = new Date().toISOString();
      current.chats.push({ id: newId('chat'), title: 'Main Chat', messages: [], createdAt: now, updatedAt: now });
    }
    const selected = current.chats.find(item => item.id === selectedId) || current.chats.find(item => item.id === current.activeChatId) || [...current.chats].sort((a,b) => new Date(b.updatedAt||0)-new Date(a.updatedAt||0))[0];
    selectedId = selected.id;
    current.activeChatId = selectedId;
    selected.messages = Array.isArray(selected.messages) ? selected.messages : [];
  });
  activeChatId = selectedId;
  chat = getProject()?.chats?.find(item => item.id === activeChatId) || null;
  return chat;
}

function renderWarnings(warnings = []) {
  if (!warningBox) return;
  if (!warnings.length) { warningBox.hidden = true; warningBox.innerHTML = ''; return; }
  warningBox.hidden = false;
  warningBox.innerHTML = `<div class="continuity-warning-title">Continuity Check</div>${warnings.map(w => `<div class="continuity-warning continuity-${esc(w.severity)}"><span>${esc(w.message)}</span></div>`).join('')}<div class="continuity-warning-actions"><button type="button" id="continue-anyway">Continue Anyway</button></div>`;
  document.querySelector('#continue-anyway')?.addEventListener('click', () => { warningBox.hidden = true; warningBox.innerHTML = ''; saveMessage(input.value.trim(), true); });
}

function renderChatList() {
  const current = getProject();
  const chats = [...(current?.chats || [])].sort((a,b) => new Date(b.updatedAt||0)-new Date(a.updatedAt||0));
  chatList.innerHTML = chats.map(item => {
    const messages = Array.isArray(item.messages) ? item.messages : [];
    const preview = messages.length ? messages[messages.length - 1].text : 'No messages yet';
    return `<a class="chat-list-item ${item.id === activeChatId ? 'active' : ''}" href="${esc(chatUrl(item.id))}" data-chat-id="${esc(item.id)}"><span class="chat-list-title">${esc(item.title || 'Untitled Chat')}</span><span class="chat-list-preview">${esc(String(preview || '').slice(0,72))}</span></a>`;
  }).join('');
  chatList.querySelectorAll('[data-chat-id]').forEach(link => link.addEventListener('click', () => {
    const id = link.dataset.chatId;
    if (!id) return;
    activeChatId = id;
    updateProject(current => { if (current.chats.some(item => item.id === id)) current.activeChatId = id; });
  }));
}

function render() {
  if (!chat) chat = ensureChats();
  if (!chat) return;
  title.textContent = chat.title || 'Chat';
  heading.textContent = chat.title || 'Chat';
  if (!gemmaGenerating) status.textContent = 'Local draft';
  renderChatList();
  const messages = Array.isArray(chat.messages) ? chat.messages : [];
  if (!messages.length) { box.innerHTML = '<div class="empty"><h2>Your Story Chat</h2><p>Start writing. Messages are stored locally in this project.</p></div>'; return; }
  box.innerHTML = messages.map(message => `<article class="message ${message.role === 'user' ? 'message-user' : 'message-assistant'}"><div class="message-role">${message.role === 'user' ? 'You' : 'Gemma'}</div><div class="message-text">${esc(message.text).replace(/\n/g,'<br>')}</div></article>`).join('');
  box.scrollTop = box.scrollHeight;
}

function createGemmaBubble() {
  if (gemmaBubble) gemmaBubble.remove();
  gemmaStreamText = '';
  const bubble = document.createElement('article');
  bubble.className = 'message message-assistant message-gemma-streaming';
  bubble.innerHTML = '<div class="message-role">Gemma</div><div class="message-text gemma-stream-text"></div>';
  box.appendChild(bubble);
  gemmaBubble = bubble;
  box.scrollTop = box.scrollHeight;
}

function appendGemmaToken(token) {
  if (!gemmaBubble || !token) return;
  gemmaStreamText += String(token);
  const target = gemmaBubble.querySelector('.gemma-stream-text');
  if (target) target.innerHTML = esc(gemmaStreamText).replace(/\n/g,'<br>');
  box.scrollTop = box.scrollHeight;
}

function removeGemmaBubble() { if (gemmaBubble) { gemmaBubble.remove(); gemmaBubble = null; } }

function saveMessage(text, bypassContinuity = false) {
  if (!text || gemmaGenerating) return;
  if (!bypassContinuity) {
    const warnings = checkContinuity(text, getProject());
    if (warnings.length) { renderWarnings(warnings); return; }
  }
  const message = { id: newId('message'), role: 'user', text, createdAt: new Date().toISOString() };
  updateProject(current => {
    const currentChat = current.chats.find(item => item.id === activeChatId);
    if (!currentChat) return;
    currentChat.messages = Array.isArray(currentChat.messages) ? currentChat.messages : [];
    currentChat.messages.push(message); currentChat.updatedAt = message.createdAt; current.activeChatId = currentChat.id;
    if (currentChat.messages.length === 1 && currentChat.title === 'Main Chat') currentChat.title = text.trim().split(/\s+/).slice(0,6).join(' ') || 'Main Chat';
  });
  chat = getProject()?.chats?.find(item => item.id === activeChatId) || null;
  input.value = ''; renderWarnings([]); render(); input.focus(); generateWithGemma();
}

function generateWithGemma() {
  if (!window.AndroidBridge || typeof window.AndroidBridge.generateGemmaAsync !== 'function' || typeof window.AndroidBridge.gemmaStatus !== 'function') return;
  let statusInfo;
  try { statusInfo = JSON.parse(window.AndroidBridge.gemmaStatus()); } catch { return; }
  if (!statusInfo.loaded) { status.textContent = 'Gemma is not loaded.'; return; }
  const currentChat = getProject()?.chats?.find(item => item.id === activeChatId);
  if (!currentChat || gemmaGenerating) return;
  const messages = (currentChat.messages || []).map(message => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.text || '' }));
  const requestId = `gemma-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const payload = JSON.stringify({ messages, maxTokens: 32 });
  gemmaGenerating = true; input.disabled = true; status.textContent = 'Gemma • Generating…'; createGemmaBubble();
  let settled = false;
  let timeout = null;

  const cleanup = () => {
    window.removeEventListener('ss-gemma-token', handleToken);
    window.removeEventListener('ss-gemma-generation', handleResult);
    if (timeout !== null) window.clearTimeout(timeout);
  };
  const finish = callback => {
    if (settled) return;
    settled = true; cleanup(); callback(); gemmaGenerating = false; input.disabled = false; input.focus();
  };
  const handleToken = event => {
    const data = event?.detail;
    if (!data || data.requestId !== requestId) return;
    appendGemmaToken(data.token);
  };
  const handleResult = event => {
    const data = event?.detail;
    if (!data || data.requestId !== requestId) return;
    finish(() => {
      if (!data.ok) { removeGemmaBubble(); status.textContent = data.message || 'Gemma could not generate a response.'; return; }
      const text = String(data.text || gemmaStreamText || '').trim();
      removeGemmaBubble();
      if (!text) { status.textContent = 'Gemma returned an empty response.'; return; }
      const assistantMessage = { id: newId('message'), role: 'assistant', text, createdAt: new Date().toISOString() };
      updateProject(current => {
        const targetChat = current.chats.find(item => item.id === activeChatId);
        if (!targetChat) return;
        targetChat.messages = Array.isArray(targetChat.messages) ? targetChat.messages : [];
        targetChat.messages.push(assistantMessage); targetChat.updatedAt = assistantMessage.createdAt;
      });
      chat = getProject()?.chats?.find(item => item.id === activeChatId) || chat;
      status.textContent = 'Gemma • local response'; render();
    });
  };
  window.addEventListener('ss-gemma-token', handleToken);
  window.addEventListener('ss-gemma-generation', handleResult);
  timeout = window.setTimeout(() => finish(() => { removeGemmaBubble(); status.textContent = 'Gemma took too long to respond.'; }), 180000);
  try { window.AndroidBridge.generateGemmaAsync(requestId, payload); }
  catch (error) { finish(() => { removeGemmaBubble(); status.textContent = `Gemma error: ${error?.message || error}`; }); }
}

function createChat() {
  const now = new Date().toISOString(); let createdId = null;
  updateProject(current => {
    if (!Array.isArray(current.chats)) current.chats = [];
    const created = { id: newId('chat'), title: 'New Chat', messages: [], createdAt: now, updatedAt: now };
    createdId = created.id; current.chats.push(created); current.activeChatId = created.id;
  });
  if (createdId) location.href = chatUrl(createdId);
}

newChatButton?.addEventListener('click', createChat);
form.addEventListener('submit', event => { event.preventDefault(); saveMessage(input.value.trim()); });
input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); form.requestSubmit(); } });
chat = ensureChats(); render();
