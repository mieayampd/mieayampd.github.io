
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
    startTime: 0
};

const player = {
    x: 0, y: 0, width: 60, height: 60, speed: 7, image: null,
    keys: { left: false, right: false }
};

let toppings = [];
let canvas, ctx;
let images = {};

function initGame() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
}

function resizeCanvas() {
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    player.y = canvas.height - 80;
    player.x = canvas.width / 2 - player.width / 2;
}

function startGame() {
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
    
    toppings.push({
        x: Math.random() * (canvas.width - type.size),
        y: -type.size,
        width: type.size,
        height: type.size,
        type: typeKey,
        speed: type.speed,
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
    
    // Background simple gradient
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
