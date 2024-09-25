const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('public'));

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SNAKE_SIZE = 10;
const INITIAL_SNAKE_LENGTH = 5;
const GAME_SPEED = 100; // milliseconds between updates

// Game variables
let gameState = {
  snake: [],
  direction: 'RIGHT',
  food: {}
};

// Initialize the game
function initGame() {
  gameState.snake = [];
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    gameState.snake.push({ x: 200 - i * SNAKE_SIZE, y: 200 });
  }
  gameState.direction = 'RIGHT';
  placeFood();
}

// Place food at a random position
function placeFood() {
  gameState.food = {
    x: Math.floor(Math.random() * (GAME_WIDTH / SNAKE_SIZE)) * SNAKE_SIZE,
    y: Math.floor(Math.random() * (GAME_HEIGHT / SNAKE_SIZE)) * SNAKE_SIZE
  };
}

// Update game state
function updateGame() {
  const head = { ...gameState.snake[0] };

  switch (gameState.direction) {
    case 'UP':
      head.y -= SNAKE_SIZE;
      break;
    case 'DOWN':
      head.y += SNAKE_SIZE;
      break;
    case 'LEFT':
      head.x -= SNAKE_SIZE;
      break;
    case 'RIGHT':
      head.x += SNAKE_SIZE;
      break;
  }

  // Check for wall collision
  if (head.x < 0 || head.x >= GAME_WIDTH || head.y < 0 || head.y >= GAME_HEIGHT) {
    initGame();
    return;
  }

  // Check for self collision
  if (gameState.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    initGame();
    return;
  }

  // Move snake
  gameState.snake.unshift(head);

  // Check for food collision
  if (head.x === gameState.food.x && head.y === gameState.food.y) {
    placeFood();
  } else {
    gameState.snake.pop();
  }
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial game state
  sendGameState(ws);

  // Handle messages from the client
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    handlePlayerInput(data);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Send game state to the client
function sendGameState(ws) {
  ws.send(JSON.stringify(gameState));
}

// Handle player input
function handlePlayerInput(data) {
  const newDirection = data.direction.toUpperCase();
  const currentDirection = gameState.direction;

  // Prevent 180-degree turns
  if (
    (newDirection === 'UP' && currentDirection !== 'DOWN') ||
    (newDirection === 'DOWN' && currentDirection !== 'UP') ||
    (newDirection === 'LEFT' && currentDirection !== 'RIGHT') ||
    (newDirection === 'RIGHT' && currentDirection !== 'LEFT')
  ) {
    gameState.direction = newDirection;
  }
}

// Game loop
function gameLoop() {
  updateGame();
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendGameState(client);
    }
  });
}

// Initialize the game
initGame();

// Start the game loop
setInterval(gameLoop, GAME_SPEED);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});