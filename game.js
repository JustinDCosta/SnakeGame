// Core game configuration
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');

// Game state
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// Update UI on load
highScoreEl.textContent = highScore;

// Start Game
startBtn.addEventListener('click', () => {
    uiLayer.classList.remove('active');
    initGame();
});

function initGame() {
    isPlaying = true;
    score = 0;
    scoreEl.textContent = score;
    // TODO: Init snake and food
    requestAnimationFrame(gameLoop);
}

// Main Game Loop
let lastTime = 0;
const TILE_SIZE = 20; // 30x30 grid on 600x600 canvas
const GAME_SPEED = 100; // ms per update

function gameLoop(timestamp) {
    if (!isPlaying) return;

    if (timestamp - lastTime >= GAME_SPEED) {
        update();
        draw();
        lastTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
}

function update() {
    // Logic updates here
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Sound System (Web Audio API)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playTone(freq, duration, type='sine') {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Envelope to prevent clicking
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}