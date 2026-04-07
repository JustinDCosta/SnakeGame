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
let screenShake = 0;

// Game entities
let snake = [];
let food = { x: 0, y: 0 };
let inputDirection = { x: 0, y: 0 };
let currentDirection = { x: 0, y: 0 };
let particles = [];

// Audio & Music system
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let musicInterval = null;
let currentNote = 0;
const scale = [261.63, 311.13, 349.23, 392.00, 466.16]; // C minor pentatonic

function playSound(freq, duration = 0.1, type = 'sine', vol = 0.3) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function startMusic() {
    if (musicInterval) clearInterval(musicInterval);
    musicInterval = setInterval(() => {
        if (!isPlaying) return;
        // Simple arpeggiator
        const freq = scale[currentNote % scale.length] / (currentNote % 8 === 0 ? 2 : 1);
        playSound(freq, 0.15, 'triangle', 0.1);
        currentNote++;
    }, 250); // 16th notes at some tempo
}

function stopMusic() {
    if (musicInterval) clearInterval(musicInterval);
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}

function spawnParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
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
    particles = [];
    screenShake = 0;
    
    scoreEl.textContent = score;
    placeFood();
    playSound(400, 0.2, 'triangle'); // Start sound
    startMusic();
    
    window.requestAnimationFrame(gameLoop);
}

function handleInput(e) {
    if(!isPlaying) return;
    
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    switch(e.key) {
        case 'ArrowUp': case 'w': case 'W':
            if (currentDirection.y !== 0) break;
            inputDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': case 'S':
            if (currentDirection.y !== 0) break;
            inputDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': case 'A':
            if (currentDirection.x !== 0) break;
            inputDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': case 'D':
            if (currentDirection.x !== 0) break;
            inputDirection = { x: 1, y: 0 }; break;
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
        valid = !snake.some(s => s.x === newFoodPos.x && s.y === newFoodPos.y);
    }
    food = newFoodPos;
}

// Optimization: Pre-calculate screen shake rendering offset instead of full canvas translation where possible
function applyScreenShake() {
    if (screenShake > 0) {
        const dx = (Math.random() - 0.5) * screenShake;
        const dy = (Math.random() - 0.5) * screenShake;
        ctx.translate(dx, dy);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
        return {dx, dy};
    }
    return {dx: 0, dy: 0};
}

// Game Loop
function gameLoop(currentTime) {
    // Animation frame for smooth particles, separated from logical tick
    window.requestAnimationFrame(gameLoop);

    if (gameOver && screenShake === 0 && particles.length === 0) return;

    const timeSinceLastRender = currentTime - lastRenderTime;

    // Logical update runs at fixed gameSpeed
    if (isPlaying && timeSinceLastRender >= gameSpeed) {
        update();
        lastRenderTime = currentTime;
    }

    // Rendering runs as fast as possible for smooth particles
    draw();
}

function update() {
    currentDirection = inputDirection;

    const head = { ...snake[0] };
    head.x += currentDirection.x;
    head.y += currentDirection.y;

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) return triggerGameOver();
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) return triggerGameOver();

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        
        // CSS popup animation on score
        scoreEl.style.transform = 'scale(1.5)';
        scoreEl.style.color = '#ff00ff';
        setTimeout(() => {
            scoreEl.style.transform = 'scale(1)';
            scoreEl.style.color = 'inherit';
        }, 150);

        playSound(800, 0.1, 'square');
        spawnParticles(head.x * TILE_SIZE + TILE_SIZE/2, head.y * TILE_SIZE + TILE_SIZE/2, '#ff00ff');
        
        if(gameSpeed > 50) gameSpeed -= 2;
        placeFood();
    } else {
        snake.pop();
    }
}

function triggerGameOver() {
    gameOver = true;
    isPlaying = false;
    screenShake = 15; // Set screen shake intensity
    stopMusic();
    playSound(150, 0.5, 'sawtooth', 0.5);
    spawnParticles(snake[0].x * TILE_SIZE + TILE_SIZE/2, snake[0].y * TILE_SIZE + TILE_SIZE/2, '#39ff14', 30);
    handleGameOverUI();
}

function draw() {
    ctx.save();
    
    // Smooth clear
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shift = applyScreenShake();

    // Subtle grid
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for(let i=0; i<=canvas.width; i+=TILE_SIZE) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Draw snake (gradient & neon)
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        ctx.fillStyle = isHead ? '#39ff14' : '#2ecc71';
        ctx.shadowBlur = isHead ? 20 : 5;
        ctx.shadowColor = '#39ff14';
        
        // Dynamic sizing for fluid snake look (head bigger, tail slightly smaller)
        const sizeAdjustment = isHead ? 0 : 2;
        const size = TILE_SIZE - sizeAdjustment;
        const offset = sizeAdjustment / 2;
        
        ctx.fillRect(
            segment.x * TILE_SIZE + offset,
            segment.y * TILE_SIZE + offset,
            size, size
        );
    });
    ctx.shadowBlur = 0; // reset

    // Draw food (pulsing)
    if (isPlaying) {
        const pulse = Math.sin(Date.now() / 150) * 3; // pulse effect
        ctx.fillStyle = '#ff00ff';
        ctx.shadowBlur = 15 + pulse;
        ctx.shadowColor = '#ff00ff';
        
        ctx.beginPath();
        const centerX = (food.x * TILE_SIZE) + TILE_SIZE/2;
        const centerY = (food.y * TILE_SIZE) + TILE_SIZE/2;
        ctx.arc(centerX, centerY, TILE_SIZE/2 - 2 + (pulse / 3), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Update & Draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    ctx.restore(); // Undo screen shake translation
}

function handleGameOverUI() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }

    uiTitle.textContent = 'GAME OVER';
    uiTitle.style.color = 'var(--neon-pink)';
    startBtn.textContent = 'RESTART';
    
    setTimeout(() => {
        uiLayer.classList.add('active');
    }, 800);
}