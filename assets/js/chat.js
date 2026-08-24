import { getProject, updateProject, newId, esc } from './storage.js';

const project = getProject();

if (!project) {
  location.href = '../index.html';
  throw new Error('Project not found');
}

const form = document.querySelector('#chat-form');
const input = document.querySelector('#message');
const box = document.querySelector('#messages');
const title = document.querySelector('#chat-title');

let chat = project.chats[0] || {
  id: newId('chat'),
  title: 'Main Chat',
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

if (!project.chats.some(item => item.id === chat.id)) {
  updateProject(current => {
    current.chats.push(chat);
  });
}

function render() {
  title.textContent = chat.title || 'Chat';

  if (!chat.messages.length) {
    box.innerHTML = `
      <div class="empty">
        <h2>Your Story Chat</h2>
        <p>The chat is ready. A language model can be connected later without changing the stored conversation.</p>
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

form.addEventListener('submit', event => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  const message = {
    id: newId('message'),
    role: 'user',
    text,
    createdAt: new Date().toISOString()
  };

  updateProject(current => {
    const currentChat = current.chats.find(item => item.id === chat.id);

    if (!currentChat) {
      current.chats.push({ ...chat, messages: [message] });
      chat = current.chats[current.chats.length - 1];
      return;
    }

    currentChat.messages.push(message);
    currentChat.updatedAt = new Date().toISOString();
    chat = currentChat;
  });

  input.value = '';
  render();
  input.focus();
});

render();
