// Element References
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const uiLayer = document.getElementById('ui-layer');
const startBtn = document.getElementById('start-btn');
const uiTitle = document.getElementById('ui-title');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');

// Game Constants
const GRID_SIZE = 20; // 20x20 grid -> 30px tiles for 600x600 px canvas
const TILE_SIZE = canvas.width / GRID_SIZE;
const BOARD_COLOR_1 = '#aad751';
const BOARD_COLOR_2 = '#a2d149';
const SNAKE_HEAD_COLOR = '#3e6222';
const SNAKE_BODY_COLOR = '#4a752c';
const FOOD_COLOR = '#e7471d'; // Apple red

// State Variables
let gameSpeed = 130; // Milliseconds per update loop
let lastTime = 0;
let isPlaying = false;
let gameOver = false;
let score = 0;
let highScore = localStorage.getItem('classicSnakeHighScore') || 0;

let snake = [];
let food = { x: 0, y: 0 };
let inputDirection = { x: 0, y: 0 };
let currentDirection = { x: 0, y: 0 };

// Init simple, non-jarring audio
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

// Bind Listeners
window.addEventListener('keydown', handleInput);
startBtn.addEventListener('click', startGame);
highScoreEl.textContent = highScore;

// Pre-render checkerboard background once
draw();

function startGame() {
    uiLayer.classList.remove('active');
    
    // Initial Snake (Length 3)
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    
    inputDirection = { x: 1, y: 0 };
    currentDirection = { x: 1, y: 0 };
    
    score = 0;
    gameOver = false;
    isPlaying = true;
    gameSpeed = 140; // slightly slower start
    
    scoreEl.textContent = score;
    placeFood();
    
    playSound(400, 0.15, 'sine');
    
    window.requestAnimationFrame(gameLoop);
}

function handleInput(e) {
    if (!isPlaying) return;
    
    // Prevent screen scrolling when using arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
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
    let valid = false;
    while (!valid) {
        food = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
        // Ensure food does not spawn inside the snake body
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function gameLoop(timestamp) {
    if (gameOver) return;
    
    window.requestAnimationFrame(gameLoop);
    
    const timeSinceLastRender = timestamp - lastTime;
    if (timeSinceLastRender < gameSpeed) return;
    
    lastTime = timestamp;
    update();
    draw();
}

function update() {
    // Lock in the movement direction for this tick
    currentDirection = inputDirection;

    // Determine new head position
    const head = { 
        x: snake[0].x + currentDirection.x, 
        y: snake[0].y + currentDirection.y 
    };

    // Collision: Walls
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return triggerGameOver();
    }
    
    // Collision: Snake Body
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        return triggerGameOver();
    }

    // Move forward
    snake.unshift(head);

    // Collision: Food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        playSound(600, 0.1, 'square'); // Eating sound
        
        // Speed scaling curve
        if (gameSpeed > 60) {
            gameSpeed -= 2;
        }
        
        placeFood();
    } else {
        // Did not eat -> move tail
        snake.pop();
    }
}

function triggerGameOver() {
    gameOver = true;
    isPlaying = false;
    
    playSound(150, 0.4, 'sawtooth', 0.2); // Game over sound
    
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
    // 1. Draw Checkerboard Board
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? BOARD_COLOR_1 : BOARD_COLOR_2;
            ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // 2. Draw Food (Modern Apple shape)
    const foodPixelX = food.x * TILE_SIZE;
    const foodPixelY = food.y * TILE_SIZE;
    const centerOffset = TILE_SIZE / 2;
    
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    ctx.arc(foodPixelX + centerOffset, foodPixelY + centerOffset, TILE_SIZE * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add tiny green leaf to apple
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    // Leaf roughly top off-center from the apple
    ctx.ellipse(foodPixelX + centerOffset, foodPixelY + centerOffset - TILE_SIZE*0.3, 4, 2, Math.PI/4, 0, Math.PI*2);
    ctx.fill();

    // 3. Draw Snake
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        // Slight distinct padding for each segment block
        const padding = 1;
        const width = TILE_SIZE - (padding * 2);
        const x = segment.x * TILE_SIZE + padding;
        const y = segment.y * TILE_SIZE + padding;
        
        ctx.fillStyle = isHead ? SNAKE_HEAD_COLOR : SNAKE_BODY_COLOR;
        
        // Use rounded rect on supported browsers, else regular rect
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, width, isHead ? 6 : 4);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, width, width);
        }
        
        // Draw eyes if it is the head
        if (isHead) {
            drawEyes(segment.x, segment.y);
        }
    });
}

function drawEyes(headGridX, headGridY) {
    ctx.fillStyle = '#ffffff'; // White of the eye
    const eyeSize = 4;
    const pupilSize = 2;
    
    // Determine eye positions based on current direction
    let eye1Offset = { x: 0, y: 0 };
    let eye2Offset = { x: 0, y: 0 };
    
    if (currentDirection.x === 1) { // Right
        eye1Offset = { x: TILE_SIZE - 8, y: 6 };
        eye2Offset = { x: TILE_SIZE - 8, y: TILE_SIZE - 10 };
    } else if (currentDirection.x === -1) { // Left
        eye1Offset = { x: 4, y: 6 };
        eye2Offset = { x: 4, y: TILE_SIZE - 10 };
    } else if (currentDirection.y === -1) { // Up
        eye1Offset = { x: 6, y: 4 };
        eye2Offset = { x: TILE_SIZE - 10, y: 4 };
    } else { // Down (or default start)
        eye1Offset = { x: 6, y: TILE_SIZE - 8 };
        eye2Offset = { x: TILE_SIZE - 10, y: TILE_SIZE - 8 };
    }

    const baseX = headGridX * TILE_SIZE;
    const baseY = headGridY * TILE_SIZE;

    // Draw White
    ctx.fillRect(baseX + eye1Offset.x, baseY + eye1Offset.y, eyeSize, eyeSize);
    ctx.fillRect(baseX + eye2Offset.x, baseY + eye2Offset.y, eyeSize, eyeSize);
    
    // Draw Pupils (black)
    ctx.fillStyle = '#000000';
    let pOffsetX = currentDirection.x === 1 ? 2 : (currentDirection.x === -1 ? 0 : 1);
    let pOffsetY = currentDirection.y === 1 ? 2 : (currentDirection.y === -1 ? 0 : 1);
    
    ctx.fillRect(baseX + eye1Offset.x + pOffsetX, baseY + eye1Offset.y + pOffsetY, pupilSize, pupilSize);
    ctx.fillRect(baseX + eye2Offset.x + pOffsetX, baseY + eye2Offset.y + pOffsetY, pupilSize, pupilSize);
}