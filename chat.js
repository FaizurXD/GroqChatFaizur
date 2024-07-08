const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Groq = require('groq-sdk');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const logErrorToFile = (error) => {
  const errorMessage = `[${new Date().toISOString()}] ${error}\n`;
  fs.appendFile('err.txt', errorMessage, (err) => {
    if (err) console.error('Failed to write to err.txt:', err);
  });
};

app.get('/chat', (req, res) => {
  const messages = [];
  res.render('chat', { messages });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'llama3-8b-8192',
    });

    const botMessage = chatCompletion.choices[0]?.message?.content || 'No response';
    res.json({ reply: botMessage });
  } catch (error) {
    console.error('Error fetching chat completion:', error);
    logErrorToFile(error);
    res.status(500).json({ reply: 'Error: Unable to get response.' });
  }
});

io.on('connection', (socket) => {
  socket.on('chat message', async (msg) => {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: msg,
          },
        ],
        model: 'llama3-8b-8192',
      });

      const botMessage = chatCompletion.choices[0]?.message?.content || 'No response';
      socket.emit('chat message', botMessage);
    } catch (error) {
      console.error('Error fetching chat completion:', error);
      logErrorToFile(error);
      socket.emit('chat message', 'Error: Unable to get response.');
    }
  });

  socket.on('disconnect', () => {});
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});