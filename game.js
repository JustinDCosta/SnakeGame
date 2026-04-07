// Core game configuration
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const uiTitle = document.getElementById('ui-title');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');

// Config & State
const GRID_SIZE = 25; // number of cells
const TILE_SIZE = canvas.width / GRID_SIZE;
let gameSpeed = 100; // ms per update
let lastRenderTime = 0;
let gameOver = false;
let isPlaying = false;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// Game entities
let snake = [];
let food = { x: 0, y: 0 };
let inputDirection = { x: 0, y: 0 };
let currentDirection = { x: 0, y: 0 }; // the direction physically moving

// Audio system snippet
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration = 0.1, type = 'sine') {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Setup Event Listeners
window.addEventListener('keydown', handleInput);
startBtn.addEventListener('click', startGame);
highScoreEl.textContent = highScore;

// Game logic
function startGame() {
    uiLayer.classList.remove('active');
    
    // Reset state
    snake = [{ x: 12, y: 12 }]; // Center
    inputDirection = { x: 1, y: 0 }; // Right
    currentDirection = { x: 1, y: 0 };
    score = 0;
    gameOver = false;
    isPlaying = true;
    gameSpeed = 120; // reset speed
    
    scoreEl.textContent = score;
    placeFood();
    playSound(400, 0.2, 'triangle'); // Start sound
    
    window.requestAnimationFrame(gameLoop);
}

function handleInput(e) {
    if(!isPlaying) return;
    
    // Prevent default scroll behavior for arrows
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (currentDirection.y !== 0) break;
            inputDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (currentDirection.y !== 0) break;
            inputDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (currentDirection.x !== 0) break;
            inputDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (currentDirection.x !== 0) break;
            inputDirection = { x: 1, y: 0 };
            break;
    }
}

function placeFood() {
    let newFoodPos;
    let valid = false;
    
    while (!valid) {
        newFoodPos = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        // Ensure food doesn't spawn on snake
        valid = !snake.some(s => s.x === newFoodPos.x && s.y === newFoodPos.y);
    }
    food = newFoodPos;
}

// Game Loop
function gameLoop(currentTime) {
    if (gameOver) {
        handleGameOver();
        return;
    }

    window.requestAnimationFrame(gameLoop);

    const timeSinceLastRender = currentTime - lastRenderTime;
    if (timeSinceLastRender < gameSpeed) return;
    lastRenderTime = currentTime;

    update();
    draw();
}

function update() {
    // Sync current direction with input
    currentDirection = inputDirection;

    // Calculate new head position
    const head = { ...snake[0] };
    head.x += currentDirection.x;
    head.y += currentDirection.y;

    // Check Wall Collisions
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver = true;
        return;
    }
    
    // Check Self Collisions
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver = true;
        return;
    }

    // Add new head
    snake.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        playSound(600, 0.1, 'square'); // eat sound
        
        // Slightly increase speed
        if(gameSpeed > 50) gameSpeed -= 2;
        
        placeFood();
    } else {
        // Remove tail
        snake.pop();
    }
}

function draw() {
    // Background clear
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for(let i=0; i<=canvas.width; i+=TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Draw snake (gradient for head)
    snake.forEach((segment, index) => {
        // Neon green effect
        ctx.fillStyle = index === 0 ? '#39ff14' : '#2ecc71';
        ctx.shadowBlur = index === 0 ? 15 : 5;
        ctx.shadowColor = '#39ff14';
        
        // Slight padding for body segments
        ctx.fillRect(segment.x * TILE_SIZE + 1, segment.y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw food (pulsing red/pink)
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    
    ctx.beginPath();
    const centerX = (food.x * TILE_SIZE) + TILE_SIZE/2;
    const centerY = (food.y * TILE_SIZE) + TILE_SIZE/2;
    ctx.arc(centerX, centerY, TILE_SIZE/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function handleGameOver() {
    isPlaying = false;
    playSound(150, 0.5, 'sawtooth'); // Game over sound
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    // UI Updates
    uiTitle.textContent = 'GAME OVER';
    uiTitle.style.color = 'var(--neon-pink)';
    startBtn.textContent = 'RESTART';
    
    setTimeout(() => {
        uiLayer.classList.add('active');
    }, 500);
}