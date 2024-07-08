const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value.trim()) {
    const messageText = input.value.trim(); // Trimmed message text
    addMessage('You: ' + messageText, 'user-message'); // Display sent message
    socket.emit('chat message', messageText); // Emit message to server
    input.value = ''; // Clear input field
  }
});

socket.on('chat message', function(msg) {
  addMessage('FaizurAI: ' + msg, 'bot-message'); // Display received message
});

function addMessage(text, className) {
  const li = document.createElement('li');
  li.textContent = text;
  li.className = className;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}