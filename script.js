const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let score = 0;
let gameSpeed = 4;
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

// Игрок - УВЕЛИЧЕН!
const player = {
    x: 100,
    y: 0,
    width: 100,  // Было 60, стало 100!
    height: 120, // Было 80, стало 120!
    velocityY: 0,
    gravity: 0.8,
    jumpPower: -19, // Прыжок еще сильнее!
    isJumping: false,
    groundY: canvas.height - 140,
    
    draw() {
        if (images.player.complete && images.player.naturalWidth > 0) {
            ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
        } else {
            // Рисуем человечка
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x, this.y + 30, this.width, this.height - 30);
            // Голова
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + 15, 15, 0, Math.PI * 2);
            ctx.fill();
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
        this.y = player.groundY + player.height - 70;
        this.width = 55;
        this.height = 70;
        // Хитбокс меньше для легкости!
        this.hitboxShrink = 15; // Пикселей с каждой стороны
    }
    
    draw() {
        if (images.fire.complete && images.fire.naturalWidth > 0) {
            ctx.drawImage(images.fire, this.x, this.y, this.width, this.height);
        } else {
            // Рисуем огонь
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y + 10);
            ctx.lineTo(this.x + this.width - 10, this.y + this.height - 10);
            ctx.lineTo(this.x + 10, this.y + this.height - 10);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Возвращаем уменьшенный хитбокс для проверки столкновения
    getHitbox() {
        return {
            x: this.x + this.hitboxShrink,
            y: this.y + this.hitboxShrink,
            width: this.width - this.hitboxShrink * 2,
            height: this.height - this.hitboxShrink * 2
        };
    }
    
    update() {
        this.x -= gameSpeed;
    }
}

class Coin {
    constructor() {
        this.x = canvas.width;
        // Монеты теперь НИЖЕ - досягаемые!
        const randomHeight = Math.random();
        if (randomHeight < 0.4) {
            this.y = player.groundY + 20; // На земле
        } else if (randomHeight < 0.7) {
            this.y = player.groundY - 40; // Низкий прыжок
        } else {
            this.y = player.groundY - 80; // Средний прыжок
        }
        this.width = 45;
        this.height = 45;
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
                ctx.strokeStyle = '#f1c40f';
                ctx.lineWidth = 3;
                ctx.stroke();
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
    // Препятствия реже!
    if (frameCount % 180 === 0) {
        obstacles.push(new Obstacle());
    }
}

function spawnCoin() {
    // Монет БОЛЬШЕ!
    if (frameCount % 50 === 0 && Math.random() < 0.9) {
        coins.push(new Coin());
    }
}

function update() {
    if (!gameRunning) return;
    
    frameCount++;
    
    // Ускорение еще медленнее
    if (frameCount % 500 === 0) {
        gameSpeed += 0.25;
    }
    
    player.update();
    spawnObstacle();
    spawnCoin();
    
    obstacles = obstacles.filter(obs => {
        obs.update();
        
        // Используем уменьшенный хитбокс огня!
        const obstacleHitbox = obs.getHitbox();
        if (checkCollision(player, obstacleHitbox)) {
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
    
    // Забавные комментарии в зависимости от очков
    let comment = '';
    if (score === 0) {
        comment = '😢 Позор семьи!';
    } else if (score < 100) {
        comment = '🥖 На батон хлеба не хватит...';
    } else if (score < 200) {
        comment = '🍞 На батон хлеба хватит!';
    } else if (score < 350) {
        comment = '💰 Копишь на что-то серьёзное?';
    } else if (score < 500) {
        comment = '📱 Кралечке на айфон насобирал!';
    } else if (score < 700) {
        comment = '👔 Начальник доволен, но можно лучше!';
    } else if (score < 1000) {
        comment = '🌟 Отличная работа!';
    } else {
        comment = '🏆 Легенда офиса!';
    }
    
    // Добавляем комментарий в Game Over экран
    const finalScoreElement = document.getElementById('finalScore');
    finalScoreElement.innerHTML = score + '<br><span style="font-size: 18px; color: #f39c12;">' + comment + '</span>';
    
    document.getElementById('gameOver').style.display = 'block';
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    restartGame();
}

function restartGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 4;
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
