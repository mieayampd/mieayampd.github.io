
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const TOPPING_TYPES = {
    sambal: { name: 'sambal', image: '/assets/img/game/toppings/topping-sambal.png', speed: 4, size: 45 },
    pangsit: { name: 'pangsit', image: '/assets/img/game/toppings/topping-pangsit.png', speed: 3, size: 55 },
    daunbawang: { name: 'daunbawang', image: '/assets/img/game/toppings/topping-daun-bawang.png', speed: 3.5, size: 50 }
};

let gameState = {
    isRunning: false,
    score: 0,
    highScore: parseInt(localStorage.getItem('mieAyamHighScore') || '0'),
    frameCount: 0,
    gameOver: false,
    selectedTopping: null,
    difficultyLevel: 0,
    startTime: 0,
    isMuted: localStorage.getItem('mieAyamMuted') === 'true',
    audioEnabled: true
};

const player = {
    x: 0, y: 0, width: 60, height: 60, speed: 7, image: null,
    keys: { left: false, right: false }
};

let toppings = [];
let canvas, ctx;
let images = {};
let sizeMultiplier = 1;

// Web Audio API Variables
let audioContext = null;
let bgmOsc = null;
let bgmGain = null;

function initGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    loadAssets().then(() => {
        setupListeners();
        updateHighScoreDisplay();
    });
}

async function loadAssets() {
    const assets = [
        { key: 'playerAvoidSambal', src: '/assets/img/game/players/player-avoid-sambal.png' },
        { key: 'playerAvoidPangsit', src: '/assets/img/game/players/player-avoid-pangsit.png' },
        { key: 'playerAvoidDaunbawang', src: '/assets/img/game/players/player-avoid-daunbawang.png' },
        { key: 'toppingSambal', src: '/assets/img/game/toppings/topping-sambal.png' },
        { key: 'toppingPangsit', src: '/assets/img/game/toppings/topping-pangsit.png' },
        { key: 'toppingDaunbawang', src: '/assets/img/game/toppings/topping-daun-bawang.png' }
    ];

    return Promise.all(assets.map(asset => new Promise(resolve => {
        const img = new Image();
        img.src = asset.src;
        img.onload = () => { images[asset.key] = img; resolve(); };
        img.onerror = resolve;
    })));
}

function setupListeners() {
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') player.keys.left = true;
        if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') player.keys.right = true;
    });

    document.addEventListener('keyup', e => {
        if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') player.keys.left = false;
        if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') player.keys.right = false;
    });

    document.querySelectorAll('.topping-option').forEach(btn => {
        btn.addEventListener('click', e => {
            gameState.selectedTopping = e.currentTarget.dataset.topping;
            startGame();
        });
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('gameOverScreen').classList.add('opacity-0', 'scale-95');
        document.getElementById('gameOverScreen').classList.add('pointer-events-none');
        document.getElementById('startScreen').classList.remove('opacity-0', 'pointer-events-none');
    });

    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    if (leftBtn) {
        ['mousedown', 'touchstart'].forEach(ev => leftBtn.addEventListener(ev, e => { player.keys.left = true; e.preventDefault(); }));
        ['mouseup', 'touchend', 'mouseleave'].forEach(ev => leftBtn.addEventListener(ev, () => player.keys.left = false));
        ['mousedown', 'touchstart'].forEach(ev => rightBtn.addEventListener(ev, e => { player.keys.right = true; e.preventDefault(); }));
        ['mouseup', 'touchend', 'mouseleave'].forEach(ev => rightBtn.addEventListener(ev, () => player.keys.right = false));
    }

    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        updateMuteIcon();
        muteBtn.addEventListener('click', toggleMute);
    }
}

// ===== AUDIO LOGIC (Oscillators) =====

function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.error('Failed to initialize Audio Context:', e);
            return false;
        }
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return true;
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    localStorage.setItem('mieAyamMuted', gameState.isMuted);
    updateMuteIcon();
    
    if (gameState.isMuted) {
        stopBGM();
    } else if (gameState.isRunning) {
        startBGM();
    }
}

function updateMuteIcon() {
    const icon = document.getElementById('volumeIcon');
    if (!icon) return;
    if (gameState.isMuted) {
        icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.81.86 5 3.48 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
    } else {
        icon.innerHTML = '<path d="M14 8.83v6.34L11.83 13H9v-2h2.83L14 8.83M16 4l-5 5H7v6h4l5 5V4z"/>';
    }
}

function playCollisionSound() {
    if (gameState.isMuted || !initAudioContext()) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
}

function startBGM() {
    if (gameState.isMuted || !initAudioContext()) return;
    stopBGM();

    console.log("Starting BGM...");
    bgmGain = audioContext.createGain();
    bgmGain.connect(audioContext.destination);
    bgmGain.gain.setValueAtTime(0, audioContext.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 1);

    function playNote(freq, time, duration = 0.4) {
        if (!gameState.isRunning || gameState.isMuted) return;
        const osc = audioContext.createOscillator();
        const g = audioContext.createGain();
        osc.type = 'sine'; // Sine is smoother for bass
        osc.connect(g);
        g.connect(bgmGain);
        osc.frequency.setValueAtTime(freq, time);
        g.gain.setValueAtTime(0.1, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.start(time);
        osc.stop(time + duration);
    }

    const tempo = 500; // ms
    gameState.bgmInterval = setInterval(() => {
        if (!gameState.isRunning || gameState.isMuted) {
            stopBGM();
            return;
        }
        const now = audioContext.currentTime;
        // Simple 4/4 Beat
        playNote(130.81, now); // C3
        playNote(196.00, now + 0.25, 0.2); // G3
    }, tempo);
}

function stopBGM() {
    console.log("Stopping BGM...");
    if (gameState.bgmInterval) {
        clearInterval(gameState.bgmInterval);
        gameState.bgmInterval = null;
    }
    if (bgmGain) {
        bgmGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        const g = bgmGain;
        setTimeout(() => { try { g.disconnect(); } catch(e) {} }, 300);
        bgmGain = null;
    }
}

// ===== GAME CORE =====

function resizeCanvas() {
    const container = canvas.parentNode;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    sizeMultiplier = Math.min(canvas.width / 800, 1);
    if (canvas.width < 500) sizeMultiplier = 0.7;

    player.width = 80 * sizeMultiplier;
    player.height = 80 * sizeMultiplier;
    player.speed = canvas.width / 60;
    if (player.speed < 7) player.speed = 7;

    player.y = canvas.height - player.height - 20;
    player.x = canvas.width / 2 - player.width / 2;
}

function startGame() {
    resizeCanvas();
    gameState.isRunning = true;
    gameState.score = 0;
    gameState.startTime = Date.now();
    gameState.frameCount = 0;
    gameState.difficultyLevel = 0;
    toppings = [];

    const spriteMap = { sambal: 'playerAvoidSambal', pangsit: 'playerAvoidPangsit', daunbawang: 'playerAvoidDaunbawang' };
    player.image = images[spriteMap[gameState.selectedTopping]];

    document.getElementById('startScreen').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('game-hud').classList.remove('opacity-0');
    if (window.innerWidth < 768) document.getElementById('mobileControls').classList.remove('opacity-0');

    startBGM();
    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameState.isRunning) return;
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    gameState.frameCount++;
    if (player.keys.left && player.x > 0) player.x -= player.speed;
    if (player.keys.right && player.x + player.width < canvas.width) player.x += player.speed;

    gameState.score = Math.floor((Date.now() - gameState.startTime) / 100);
    document.getElementById('currentScore').textContent = gameState.score;

    gameState.difficultyLevel = Math.floor(gameState.score / 200);
    const spawnRate = Math.max(30 - (gameState.difficultyLevel * 3), 10);
    
    if (gameState.frameCount % spawnRate === 0) spawnTopping();

    for (let i = toppings.length - 1; i >= 0; i--) {
        toppings[i].y += toppings[i].speed * (1 + gameState.difficultyLevel * 0.1);
        toppings[i].rotation += 2;
        if (toppings[i].y > canvas.height) toppings.splice(i, 1);
        else if (isColliding(player, toppings[i]) && toppings[i].type === gameState.selectedTopping) endGame();
    }
}

function spawnTopping() {
    const keys = Object.keys(TOPPING_TYPES);
    const typeKey = keys[Math.floor(Math.random() * keys.length)];
    const type = TOPPING_TYPES[typeKey];
    const spriteMap = { sambal: 'toppingSambal', pangsit: 'toppingPangsit', daunbawang: 'toppingDaunbawang' };
    const scaledSize = type.size * sizeMultiplier * 1.2;
    
    toppings.push({
        x: Math.random() * (canvas.width - scaledSize),
        y: -scaledSize,
        width: scaledSize,
        height: scaledSize,
        type: typeKey,
        speed: type.speed * (canvas.height / 600),
        rotation: 0,
        image: images[spriteMap[typeKey]]
    });
}

function isColliding(a, b) {
    const padding = 10;
    return a.x + padding < b.x + b.width - padding &&
           a.x + a.width - padding > b.x + padding &&
           a.y + padding < b.y + b.height - padding &&
           a.y + a.height - padding > b.y + padding;
}

function endGame() {
    gameState.isRunning = false;
    stopBGM();
    playCollisionSound();

    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('mieAyamHighScore', gameState.highScore);
        updateHighScoreDisplay();
    }

    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOverScreen').classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
    document.getElementById('mobileControls').classList.add('opacity-0');
}

function updateHighScoreDisplay() {
    document.getElementById('highScore').textContent = gameState.highScore;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (player.image) ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

    toppings.forEach(t => {
        if (t.image) {
            ctx.save();
            ctx.translate(t.x + t.width/2, t.y + t.height/2);
            ctx.rotate(t.rotation * Math.PI / 180);
            ctx.drawImage(t.image, -t.width/2, -t.height/2, t.width, t.height);
            ctx.restore();
        }
    });
}

window.onload = initGame;
