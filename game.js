// Elements
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const uiTitle = document.getElementById('ui-title');
const pauseLayer = document.getElementById('pause-layer');
const pauseBtn = document.getElementById('pause-btn');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const colorPicker = document.getElementById('snake-color');

// Game Config
const TILE_SIZE = 25; // Logical tile size
const BOARD_COLOR_1 = '#aad751';
const BOARD_COLOR_2 = '#a2d149';
const FOOD_COLOR = '#e7471d'; 
let S_HEAD_COLOR = '#3e6222';
let S_BODY_COLOR = '#4a752c';

// Dynamic Grid variables
let GRID_COLS = 20;
let GRID_ROWS = 20;

// State Variables
let gameSpeed = 130; 
let lastTime = 0;
let isPlaying = false;
let isPaused = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('classicSnakeHighScore') || 0;

let snake = [];
let food = { x: 0, y: 0 };
let inputDirection = { x: 0, y: 0 };
let currentDirection = { x: 0, y: 0 };

// Simple Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration = 0.1, type = 'sine', volume = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Initial Setup
highScoreEl.textContent = highScore;
resizeCanvas(); // Set initial full screen

// Event Listeners
window.addEventListener('resize', handleResize);
window.addEventListener('keydown', handleKeyDown);
startBtn.addEventListener('click', startGame);

pauseBtn.addEventListener('click', togglePause);
document.addEventListener('keydown', (e) => {
    if ((e.key === 'p' || e.key === 'Escape') && isPlaying && !gameOver) {
        togglePause();
    }
});

// Color picker logic (Lighter and darker variant of hex)
colorPicker.addEventListener('input', (e) => {
    S_BODY_COLOR = e.target.value;
    S_HEAD_COLOR = LightenDarkenColor(e.target.value, -30); // Make head slightly darker
});

// Helper for color shading
function LightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] == "#") { col = col.slice(1); usePound = true; }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

// On-screen Mobile Controls
['up', 'down', 'left', 'right'].forEach(dir => {
    document.getElementById(`btn-${dir}`).addEventListener('pointerdown', (e) => {
        e.preventDefault(); 
        triggerDir(dir);
    });
});

// Canvas Sizing Function to fill strictly the visual area
function resizeCanvas() {
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    
    // Fit into 25px blocks dynamically based on user screen size
    GRID_COLS = Math.floor(width / TILE_SIZE);
    GRID_ROWS = Math.floor(height / TILE_SIZE);
    
    // Make sure we have at least minimum playable space
    if(GRID_COLS < 5) GRID_COLS = 5;
    if(GRID_ROWS < 5) GRID_ROWS = 5;
    
    canvas.width = GRID_COLS * TILE_SIZE;
    canvas.height = GRID_ROWS * TILE_SIZE;
    
    if(!isPlaying) draw(); // Re-draw board while idle
}

// Handlers
function handleResize() {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(resizeCanvas, 100);
}

function startGame() {
    uiLayer.classList.remove('active');
    pauseLayer.classList.remove('active');
    pauseBtn.disabled = false;
    pauseBtn.textContent = '⏸ Pause';
    
    const startX = Math.floor(GRID_COLS / 2);
    const startY = Math.floor(GRID_ROWS / 2);

    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    
    inputDirection = { x: 1, y: 0 };
    currentDirection = { x: 1, y: 0 };
    
    score = 0;
    gameOver = false;
    isPlaying = true;
    isPaused = false;
    gameSpeed = 130; 
    
    scoreEl.textContent = score;
    placeFood();
    playSound(400, 0.15, 'sine');
    
    window.requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (!isPlaying || isPaused) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowUp': case 'w': triggerDir('up'); break;
        case 'ArrowDown': case 's': triggerDir('down'); break;
        case 'ArrowLeft': case 'a': triggerDir('left'); break;
        case 'ArrowRight': case 'd': triggerDir('right'); break;
    }
}

function triggerDir(direction) {
    if (!isPlaying || isPaused) return;

    switch(direction) {
        case 'up': if (currentDirection.y === 0) inputDirection = { x: 0, y: -1 }; break;
        case 'down': if (currentDirection.y === 0) inputDirection = { x: 0, y: 1 }; break;
        case 'left': if (currentDirection.x === 0) inputDirection = { x: -1, y: 0 }; break;
        case 'right': if (currentDirection.x === 0) inputDirection = { x: 1, y: 0 }; break;
    }
}

function togglePause() {
    if (!isPlaying || gameOver) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseBtn.textContent = '▶ Resume';
        pauseLayer.classList.add('active');
        playSound(200, 0.1, 'triangle');
    } else {
        pauseBtn.textContent = '⏸ Pause';
        pauseLayer.classList.remove('active');
        playSound(400, 0.1, 'triangle');
        window.requestAnimationFrame(gameLoop);
    }
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food = {
            x: Math.floor(Math.random() * GRID_COLS),
            y: Math.floor(Math.random() * GRID_ROWS)
        };
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function gameLoop(timestamp) {
    if (gameOver || isPaused) return;
    
    window.requestAnimationFrame(gameLoop);
    
    const timeSinceLastRender = timestamp - lastTime;
    if (timeSinceLastRender < gameSpeed) return;
    
    lastTime = timestamp;
    update();
    draw();
}

function update() {
    currentDirection = inputDirection;

    const head = { 
        x: snake[0].x + currentDirection.x, 
        y: snake[0].y + currentDirection.y 
    };

    // WRAPPING LOGIC (Instead of Wall Collision)
    if (head.x < 0) head.x = GRID_COLS - 1;
    else if (head.x >= GRID_COLS) head.x = 0;
    
    if (head.y < 0) head.y = GRID_ROWS - 1;
    else if (head.y >= GRID_ROWS) head.y = 0;

    // Self Collision -> Game Over
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        return triggerGameOver();
    }

    snake.unshift(head);

    // Food Logic
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        playSound(600, 0.1, 'square'); 
        
        // Dynamic speed curve
        if (gameSpeed > 55) {
            gameSpeed -= 2;
        }
        placeFood();
    } else {
        snake.pop(); // Remove tail
    }
}

function triggerGameOver() {
    gameOver = true;
    isPlaying = false;
    pauseBtn.disabled = true;
    
    playSound(150, 0.5, 'sawtooth', 0.2); 
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('classicSnakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    uiTitle.textContent = 'GAME OVER';
    uiTitle.style.color = '#e74c3c';
    startBtn.textContent = 'PLAY AGAIN';
    
    uiLayer.classList.add('active');
}

function draw() {
    // 1. Checkerboard BG
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? BOARD_COLOR_1 : BOARD_COLOR_2;
            ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    if (snake.length === 0) return; // Prevent draw errors when uninitialized

    // 2. Draw Food (Apple Style)
    const fX = food.x * TILE_SIZE;
    const fY = food.y * TILE_SIZE;
    const cO = TILE_SIZE / 2;
    
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    ctx.arc(fX + cO, fY + cO, TILE_SIZE * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.ellipse(fX + cO, fY + cO - TILE_SIZE*0.3, 4, 2, Math.PI/4, 0, Math.PI*2);
    ctx.fill();

    // 3. Draw Snake
    ctx.lineJoin = "round";
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        const padding = 1;
        const w = TILE_SIZE - (padding * 2);
        const x = segment.x * TILE_SIZE + padding;
        const y = segment.y * TILE_SIZE + padding;
        
        ctx.fillStyle = isHead ? S_HEAD_COLOR : S_BODY_COLOR;
        
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, w, w, isHead ? 6 : 4);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, w, w);
        }
        
        if (isHead) drawEyes(segment.x, segment.y);
    });
}

function drawEyes(hX, hY) {
    ctx.fillStyle = '#ffffff'; 
    const e = 4; const p = 2; // size
    
    let o1 = { x: 0, y: 0 }, o2 = { x: 0, y: 0 };
    
    if (currentDirection.x === 1) { 
        o1 = { x: TILE_SIZE - 8, y: 6 }; o2 = { x: TILE_SIZE - 8, y: TILE_SIZE - 10 };
    } else if (currentDirection.x === -1) { 
        o1 = { x: 4, y: 6 }; o2 = { x: 4, y: TILE_SIZE - 10 };
    } else if (currentDirection.y === -1) { 
        o1 = { x: 6, y: 4 }; o2 = { x: TILE_SIZE - 10, y: 4 };
    } else { 
        o1 = { x: 6, y: TILE_SIZE - 8 }; o2 = { x: TILE_SIZE - 10, y: TILE_SIZE - 8 };
    }

    const bX = hX * TILE_SIZE; const bY = hY * TILE_SIZE;

    ctx.fillRect(bX + o1.x, bY + o1.y, e, e);
    ctx.fillRect(bX + o2.x, bY + o2.y, e, e);
    
    ctx.fillStyle = '#000000';
    let px = currentDirection.x === 1 ? 2 : (currentDirection.x === -1 ? 0 : 1);
    let py = currentDirection.y === 1 ? 2 : (currentDirection.y === -1 ? 0 : 1);
    
    ctx.fillRect(bX + o1.x + px, bY + o1.y + py, p, p);
    ctx.fillRect(bX + o2.x + px, bY + o2.y + py, p, p);
}