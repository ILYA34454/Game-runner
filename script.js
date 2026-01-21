const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let score = 0;
let gameSpeed = 6;
let frameCount = 0;

// Загрузка изображений
const images = {
    background: new Image(),
    player: new Image(),
    fire: new Image(),
    coin: new Image()
};

images.background.src = 'background.png';
images.player.src = 'player.png';
images.fire.src = 'fire.png';
images.coin.src = 'coin.png';

let imagesLoaded = 0;
const totalImages = 4;

Object.values(images).forEach(img => {
    img.onload = () => {
        imagesLoaded++;
        console.log('Загружено:', img.src);
        if (imagesLoaded === totalImages) {
            console.log('ВСЕ КАРТИНКИ ЗАГРУЖЕНЫ!');
        }
    };
    img.onerror = () => {
        console.error('Ошибка загрузки:', img.src);
    };
});

// Игрок
const player = {
    x: 100,
    y: 0,
    width: 60,
    height: 80,
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -15,
    isJumping: false,
    groundY: canvas.height - 100,
    
    draw() {
        if (images.player.complete && images.player.naturalWidth > 0) {
            ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
        } else {
            // Запасной вариант
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },
    
    update() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.isJumping = false;
        }
    },
    
    jump() {
        if (!this.isJumping) {
            this.velocityY = this.jumpPower;
            this.isJumping = true;
        }
    }
};

player.y = player.groundY;

// Препятствия и монеты
let obstacles = [];
let coins = [];

class Obstacle {
    constructor() {
        this.x = canvas.width;
        this.y = player.groundY + player.height - 60;
        this.width = 50;
        this.height = 60;
    }
    
    draw() {
        if (images.fire.complete && images.fire.naturalWidth > 0) {
            ctx.drawImage(images.fire, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    
    update() {
        this.x -= gameSpeed;
    }
}

class Coin {
    constructor() {
        this.x = canvas.width;
        this.y = Math.random() < 0.5 ? player.groundY - 50 : player.groundY - 120;
        this.width = 40;
        this.height = 40;
        this.collected = false;
    }
    
    draw() {
        if (!this.collected) {
            if (images.coin.complete && images.coin.naturalWidth > 0) {
                ctx.drawImage(images.coin, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    update() {
        this.x -= gameSpeed;
    }
}

// Фон
let bgX = 0;

function drawBackground() {
    if (images.background.complete && images.background.naturalWidth > 0) {
        const bgWidth = images.background.width;
        const bgHeight = images.background.height;
        const scale = canvas.height / bgHeight;
        const scaledWidth = bgWidth * scale;
        
        for (let i = -1; i <= Math.ceil(canvas.width / scaledWidth) + 1; i++) {
            ctx.drawImage(images.background, 
                bgX + i * scaledWidth, 0, 
                scaledWidth, canvas.height);
        }
        
        bgX -= gameSpeed * 0.3;
        if (bgX <= -scaledWidth) bgX = 0;
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f6ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Земля
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(0, player.groundY + player.height, canvas.width, canvas.height);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function spawnObstacle() {
    if (frameCount % 120 === 0) {
        obstacles.push(new Obstacle());
    }
}

function spawnCoin() {
    if (frameCount % 80 === 0 && Math.random() < 0.7) {
        coins.push(new Coin());
    }
}

function update() {
    if (!gameRunning) return;
    
    frameCount++;
    
    if (frameCount % 300 === 0) {
        gameSpeed += 0.5;
    }
    
    player.update();
    spawnObstacle();
    spawnCoin();
    
    obstacles = obstacles.filter(obs => {
        obs.update();
        
        if (checkCollision(player, obs)) {
            gameOver();
            return false;
        }
        
        return obs.x + obs.width > 0;
    });
    
    coins = coins.filter(coin => {
        coin.update();
        
        if (!coin.collected && checkCollision(player, coin)) {
            coin.collected = true;
            score += 10;
            document.getElementById('score').textContent = `Очки: ${score}`;
        }
        
        return coin.x + coin.width > 0;
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    obstacles.forEach(obs => obs.draw());
    coins.forEach(coin => coin.draw());
    player.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').style.display = 'block';
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    restartGame();
}

function restartGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 6;
    frameCount = 0;
    obstacles = [];
    coins = [];
    player.y = player.groundY;
    player.velocityY = 0;
    player.isJumping = false;
    
    document.getElementById('score').textContent = 'Очки: 0';
    document.getElementById('gameOver').style.display = 'none';
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning) {
            if (document.getElementById('startScreen').style.display !== 'none') {
                startGame();
            } else {
                restartGame();
            }
        } else {
            player.jump();
        }
    }
});

// Запуск игры
gameLoop();
