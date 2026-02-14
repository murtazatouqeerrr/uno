const socket = io();

let currentRoom = null;
let playerId = null;
let playerName = null;
let playerAvatar = '😀';
let myHand = [];

// DOM elements
const menu = document.getElementById('menu');
const lobby = document.getElementById('lobby');
const game = document.getElementById('game');
const winner = document.getElementById('winner');

const avatarOptions = document.getElementById('avatarOptions');
const playerNameInput = document.getElementById('playerName');
const createRoomBtn = document.getElementById('createRoomBtn');
const roomCodeInput = document.getElementById('roomCodeInput');
const joinRoomBtn = document.getElementById('joinRoomBtn');
const settingsBtn = document.getElementById('settingsBtn');

const roomCodeDisplay = document.getElementById('roomCode');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const playerList = document.getElementById('playerList');
const startGameBtn = document.getElementById('startGameBtn');
const leaveLobbyBtn = document.getElementById('leaveLobbyBtn');

const stackingRule = document.getElementById('stackingRule');
const jumpInRule = document.getElementById('jumpInRule');
const sevenZeroRule = document.getElementById('sevenZeroRule');

const gameRoomCode = document.getElementById('gameRoomCode');
const deckCount = document.getElementById('deckCount');
const players = document.getElementById('players');
const deck = document.getElementById('deck');
const discardPile = document.getElementById('discardPile');
const hand = document.getElementById('hand');
const unoBtn = document.getElementById('unoBtn');
const leaveGameBtn = document.getElementById('leaveGameBtn');
const soundToggle = document.getElementById('soundToggle');

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const reactions = document.getElementById('reactions');

const winnerName = document.getElementById('winnerName');
const matchStats = document.getElementById('matchStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const viewStatsBtn = document.getElementById('viewStatsBtn');

const statsScreen = document.getElementById('statsScreen');
const statsContent = document.getElementById('statsContent');
const closeStatsBtn = document.getElementById('closeStatsBtn');

const colorModal = document.getElementById('colorModal');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const soundEnabled = document.getElementById('soundEnabled');
const animationsEnabled = document.getElementById('animationsEnabled');

const colorName = document.getElementById('colorName');
const colorIndicator = document.getElementById('colorIndicator');

let pendingWildCard = null;
let currentGameStats = {
  startTime: null,
  cardsPlayed: 0,
  cardsDrawn: 0
};

// Initialize
soundManager.init();
initAvatars();
loadSettings();

function initAvatars() {
  const avatars = ['😀', '😎', '🤓', '😇', '🤠', '🥳', '🤖', '👽', '🦄', '🐱', '🐶', '🐼', '🦊', '🐯', '🦁', '🐸'];
  const savedAvatar = localStorage.getItem('playerAvatar') || '😀';
  playerAvatar = savedAvatar;
  
  avatars.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'avatar-option';
    btn.textContent = emoji;
    if (emoji === savedAvatar) btn.classList.add('selected');
    btn.onclick = () => {
      document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      playerAvatar = emoji;
      localStorage.setItem('playerAvatar', emoji);
    };
    avatarOptions.appendChild(btn);
  });
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('gameSettings') || '{}');
  soundEnabled.checked = settings.sound !== false;
  animationsEnabled.checked = settings.animations !== false;
  soundManager.enabled = soundEnabled.checked;
}

// Event listeners
createRoomBtn.addEventListener('click', () => {
  playerName = playerNameInput.value.trim();
  if (!playerName) {
    alert('Please enter your name');
    soundManager.play('error');
    return;
  }
  console.log('Creating room with:', { name: playerName, avatar: playerAvatar });
  socket.emit('createRoom', { name: playerName, avatar: playerAvatar });
});

joinRoomBtn.addEventListener('click', () => {
  playerName = playerNameInput.value.trim();
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!playerName || !code) {
    alert('Please enter your name and room code');
    soundManager.play('error');
    return;
  }
  socket.emit('joinRoom', { roomCode: code, name: playerName, avatar: playerAvatar });
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('show');
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('show');
  const settings = {
    sound: soundEnabled.checked,
    animations: animationsEnabled.checked
  };
  localStorage.setItem('gameSettings', JSON.stringify(settings));
  soundManager.enabled = soundEnabled.checked;
});

soundToggle.addEventListener('click', () => {
  const enabled = soundManager.toggle();
  soundToggle.textContent = enabled ? '🔊' : '🔇';
  soundEnabled.checked = enabled;
});

sendChatBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit('chatMessage', { roomCode: currentRoom, message: msg });
    chatInput.value = '';
  }
}

document.querySelectorAll('.reaction-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const emoji = btn.dataset.emoji;
    socket.emit('reaction', { roomCode: currentRoom, emoji, playerName });
  });
});

copyLinkBtn.addEventListener('click', () => {
  const link = `${window.location.origin}?room=${currentRoom}`;
  navigator.clipboard.writeText(link);
  copyLinkBtn.textContent = '✓ Copied!';
  setTimeout(() => {
    copyLinkBtn.textContent = '📋 Copy Invite Link';
  }, 2000);
});

startGameBtn.addEventListener('click', () => {
  const rules = {
    stacking: stackingRule.checked,
    jumpIn: jumpInRule.checked,
    sevenZero: sevenZeroRule.checked
  };
  console.log('Starting game with:', { roomCode: currentRoom, rules });
  socket.emit('startGame', { roomCode: currentRoom, rules });
});

leaveLobbyBtn.addEventListener('click', () => {
  location.reload();
});

leaveGameBtn.addEventListener('click', () => {
  location.reload();
});

playAgainBtn.addEventListener('click', () => {
  socket.emit('playAgain', currentRoom);
});

backToMenuBtn.addEventListener('click', () => {
  location.reload();
});

viewStatsBtn.addEventListener('click', () => {
  showStats();
});

closeStatsBtn.addEventListener('click', () => {
  showScreen(winner);
});

// Color selection for wild cards
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    colorModal.classList.remove('show');
    if (pendingWildCard !== null) {
      socket.emit('playCard', { 
        roomCode: currentRoom, 
        cardIndex: pendingWildCard,
        chosenColor: color
      });
      pendingWildCard = null;
    }
  });
});

deck.addEventListener('click', () => {
  socket.emit('drawCard', currentRoom);
  currentGameStats.cardsDrawn++;
  soundManager.play('cardDraw');
});

unoBtn.addEventListener('click', () => {
  socket.emit('callUno', currentRoom);
  soundManager.play('uno');
});

// Socket events
socket.on('roomCreated', (data) => {
  currentRoom = data.roomCode;
  playerId = data.playerId;
  showLobby();
});

socket.on('roomJoined', (data) => {
  currentRoom = data.roomCode;
  playerId = data.playerId;
  showLobby();
});

socket.on('playerJoined', (room) => {
  console.log('playerJoined event received:', room);
  if (lobby.classList.contains('hidden')) {
    showLobby();
  }
  updateLobby(room);
});

socket.on('playerLeft', (room) => {
  console.log('playerLeft event received:', room);
  if (room && room.players.length > 0) {
    updateLobby(room);
  } else {
    alert('Room closed');
    location.reload();
  }
});

socket.on('gameUpdate', (gameState) => {
  console.log('gameUpdate event received:', gameState);
  if (!game.classList.contains('hidden')) {
    updateGame(gameState);
  } else {
    showGame();
    currentGameStats.startTime = Date.now();
    currentGameStats.cardsPlayed = 0;
    currentGameStats.cardsDrawn = 0;
    updateGame(gameState);
  }
  
  if (gameState.winner) {
    const duration = Math.floor((Date.now() - currentGameStats.startTime) / 1000);
    saveGameStats(gameState, duration);
    soundManager.play('win');
    showWinner(gameState);
  }
});

socket.on('unoCalled', (callerId) => {
  console.log('UNO called by', callerId);
});

socket.on('chatMessage', (data) => {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'chat-message';
  if (data.filtered) {
    msgDiv.classList.add('filtered');
  }
  msgDiv.innerHTML = `<strong>${data.avatar} ${data.playerName}:</strong> ${data.message}`;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('chatWarning', (message) => {
  const warningDiv = document.createElement('div');
  warningDiv.className = 'chat-warning';
  warningDiv.textContent = '⚠️ ' + message;
  chatMessages.appendChild(warningDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Show visual warning
  document.body.classList.add('warning-flash');
  setTimeout(() => {
    document.body.classList.remove('warning-flash');
  }, 1000);
});

socket.on('reaction', (data) => {
  const reactionDiv = document.createElement('div');
  reactionDiv.className = 'reaction-float';
  reactionDiv.textContent = data.emoji;
  reactionDiv.style.left = Math.random() * 80 + 10 + '%';
  reactions.appendChild(reactionDiv);
  setTimeout(() => reactionDiv.remove(), 2000);
});

socket.on('error', (message) => {
  alert(message);
  soundManager.play('error');
});

// Helper functions
function showScreen(screen) {
  [menu, lobby, game, winner].forEach(s => s.classList.add('hidden'));
  screen.classList.remove('hidden');
}

function showLobby() {
  showScreen(lobby);
  roomCodeDisplay.textContent = currentRoom;
}

function showGame() {
  showScreen(game);
  gameRoomCode.textContent = currentRoom;
}

function showWinner(name) {
  showScreen(winner);
  winnerName.textContent = name;
}

function updateLobby(room) {
  playerList.innerHTML = '';
  room.players.forEach(player => {
    const li = document.createElement('li');
    const avatar = player.avatar || '😀';
    const name = player.name || 'Player';
    const isHost = player.id === room.host ? ' 👑' : '';
    li.innerHTML = `${avatar} ${name}${isHost}`;
    playerList.appendChild(li);
  });

  if (playerId === room.host && room.players.length >= 2) {
    startGameBtn.classList.remove('hidden');
  } else {
    startGameBtn.classList.add('hidden');
  }
}

function updateGame(gameState) {
  deckCount.textContent = gameState.deckCount;

  // Update current color
  const currentColor = gameState.currentColor || gameState.topCard.color;
  if (currentColor !== 'wild') {
    colorName.textContent = currentColor.toUpperCase();
    colorIndicator.style.background = getColorHex(currentColor);
  }

  // Update players
  players.innerHTML = '';
  gameState.players.forEach((player, index) => {
    const div = document.createElement('div');
    div.className = 'player-info';
    if (index === gameState.currentPlayerIndex) {
      div.classList.add('active');
    }
    const avatar = player.avatar || '😀';
    const name = player.name || 'Player';
    div.innerHTML = `
      <div class="player-avatar">${avatar}</div>
      <div>${name}</div>
      <div>Cards: ${player.cardCount}</div>
      ${player.calledUno ? '<div>🔴 UNO!</div>' : ''}
    `;
    players.appendChild(div);
  });

  // Update discard pile
  const topCard = gameState.topCard;
  discardPile.innerHTML = createCardHTML(topCard);

  // Update hand
  if (gameState.myHand) {
    myHand = gameState.myHand;
    renderHand();
  }
}

function getColorHex(color) {
  const colors = {
    red: '#dd0000',
    blue: '#0055aa',
    green: '#00aa00',
    yellow: '#ffaa00'
  };
  return colors[color] || '#999';
}

function createCardHTML(card) {
  if (card.color === 'wild') {
    return `<div class="card wild">${card.value.toUpperCase()}</div>`;
  }
  
  let displayValue = card.value.toUpperCase();
  if (card.value === 'skip') displayValue = '⊘';
  if (card.value === 'reverse') displayValue = '⇄';
  if (card.value === 'draw2') displayValue = '+2';
  if (card.value === 'draw4') displayValue = '+4';
  
  return `
    <div class="card ${card.color}">
      <div class="card-inner">${displayValue}</div>
    </div>
  `;
}

function renderHand() {
  hand.innerHTML = '';
  myHand.forEach((card, index) => {
    const cardEl = document.createElement('div');
    cardEl.innerHTML = createCardHTML(card);
    const cardDiv = cardEl.firstElementChild;
    
    cardDiv.addEventListener('click', () => {
      if (card.color === 'wild') {
        pendingWildCard = index;
        colorModal.classList.add('show');
      } else {
        socket.emit('playCard', { roomCode: currentRoom, cardIndex: index });
        currentGameStats.cardsPlayed++;
        soundManager.play('cardPlay');
      }
    });
    
    hand.appendChild(cardDiv);
  });
}

function saveGameStats(gameState, duration) {
  const stats = JSON.parse(localStorage.getItem('unoStats') || '[]');
  
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isWinner = gameState.winner === myPlayer?.name;
  
  stats.push({
    date: new Date().toISOString(),
    winner: gameState.winner,
    isWinner: isWinner,
    players: gameState.players.length,
    duration: duration,
    cardsPlayed: currentGameStats.cardsPlayed,
    cardsDrawn: currentGameStats.cardsDrawn,
    playerName: myPlayer?.name || playerName
  });
  
  localStorage.setItem('unoStats', JSON.stringify(stats));
}

function showWinner(gameState) {
  const stats = JSON.parse(localStorage.getItem('unoStats') || '[]');
  const lastGame = stats[stats.length - 1];
  
  winnerName.textContent = gameState.winner;
  
  if (lastGame) {
    matchStats.innerHTML = `
      <div><strong>Match Duration:</strong> ${lastGame.duration}s</div>
      <div><strong>Players:</strong> ${lastGame.players}</div>
      <div><strong>Cards Played:</strong> ${lastGame.cardsPlayed}</div>
      <div><strong>Cards Drawn:</strong> ${lastGame.cardsDrawn}</div>
      <div><strong>Result:</strong> ${lastGame.isWinner ? '🏆 Victory!' : '😔 Defeat'}</div>
    `;
  }
  
  showScreen(winner);
}

function showStats() {
  const stats = JSON.parse(localStorage.getItem('unoStats') || '[]');
  
  if (stats.length === 0) {
    statsContent.innerHTML = '<p>No games played yet!</p>';
  } else {
    const wins = stats.filter(s => s.isWinner).length;
    const totalGames = stats.length;
    const winRate = ((wins / totalGames) * 100).toFixed(1);
    const avgDuration = Math.floor(stats.reduce((sum, s) => sum + s.duration, 0) / totalGames);
    
    let html = `
      <div class="stat-row">
        <h3>Overall Statistics</h3>
        <div>Total Games: ${totalGames}</div>
        <div>Wins: ${wins}</div>
        <div>Losses: ${totalGames - wins}</div>
        <div>Win Rate: ${winRate}%</div>
        <div>Average Game Duration: ${avgDuration}s</div>
      </div>
      <h3 style="margin-top: 20px;">Recent Games</h3>
    `;
    
    stats.slice(-10).reverse().forEach((stat, i) => {
      const date = new Date(stat.date).toLocaleString();
      html += `
        <div class="stat-row">
          <div><strong>${stat.isWinner ? '🏆 WIN' : '😔 LOSS'}</strong> - ${date}</div>
          <div>Winner: ${stat.winner}</div>
          <div>Duration: ${stat.duration}s | Players: ${stat.players}</div>
          <div>Played: ${stat.cardsPlayed} | Drew: ${stat.cardsDrawn}</div>
        </div>
      `;
    });
    
    statsContent.innerHTML = html;
  }
  
  showScreen(statsScreen);
}

// Check for room code in URL
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
if (roomFromUrl) {
  roomCodeInput.value = roomFromUrl;
}
