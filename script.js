// GOOGLE SHEETS URL
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx1pgEzolCLPUjlDN0p9rttkluF-XkCh6kdu4As3Vfx54QYY_vRRWdHjeuXrVLJ5_Fv/exec';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameRunning = false;
let score = 0;
let gameSpeed = 4.5;
let frameCount = 0;

// Данные игрока
let playerData = {
    name: '',
    position: '',
    registered: false
};

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

// Игрок - увеличен под новый размер canvas
const player = {
    x: 120,
    y: 0,
    width: 130,
    height: 150,
    velocityY: 0,
    gravity: 0.9,
    jumpPower: -22,
    isJumping: false,
    groundY: canvas.height - 190,
    
    draw() {
        if (images.player.complete && images.player.naturalWidth > 0) {
            ctx.drawImage(images.player, this.x, this.y, this.width, this.height);
        } else {
            // Рисуем человечка
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x, this.y + 35, this.width, this.height - 35);
            // Голова
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + 18, 18, 0, Math.PI * 2);
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
        this.y = player.groundY + player.height - 90;
        this.width = 70;
        this.height = 90;
        this.hitboxShrink = 20;
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
            ctx.moveTo(this.x + this.width/2, this.y + 15);
            ctx.lineTo(this.x + this.width - 15, this.y + this.height - 15);
            ctx.lineTo(this.x + 15, this.y + this.height - 15);
            ctx.closePath();
            ctx.fill();
        }
    }
    
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
        const randomHeight = Math.random();
        if (randomHeight < 0.4) {
            this.y = player.groundY + 30;
        } else if (randomHeight < 0.7) {
            this.y = player.groundY - 50;
        } else {
            this.y = player.groundY - 100;
        }
        this.width = 55;
        this.height = 55;
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
                ctx.lineWidth = 4;
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
    if (frameCount % 180 === 0) {
        obstacles.push(new Obstacle());
    }
}

function spawnCoin() {
    if (frameCount % 50 === 0 && Math.random() < 0.9) {
        coins.push(new Coin());
    }
}

function update() {
    if (!gameRunning) return;
    
    frameCount++;
    
    if (frameCount % 500 === 0) {
        gameSpeed += 0.3;
    }
    
    player.update();
    spawnObstacle();
    spawnCoin();
    
    obstacles = obstacles.filter(obs => {
        obs.update();
        
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
            document.getElementById('score').textContent = `ОЧКИ: ${score}`;
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

function getScoreComment(score) {
    if (score === 0) {
        return '😢 ПОЗОР СЕМЬИ!';
    } else if (score < 100) {
        return '🥖 НА БАТОН НЕ ХВАТИТ...';
    } else if (score < 200) {
        return '🍞 НА БАТОН ХВАТИТ!';
    } else if (score < 350) {
        return '💰 КОПИШЬ НА ЧТО-ТО?';
    } else if (score < 500) {
        return '📱 НА АЙФОН НАСОБИРАЛ!';
    } else if (score < 700) {
        return '👔 НАЧАЛЬНИК ДОВОЛЕН!';
    } else if (score < 1000) {
        return '🌟 ОТЛИЧНАЯ РАБОТА!';
    } else {
        return '🏆 ЛЕГЕНДА ОФИСА!';
    }
}

async function saveToGoogleSheets(name, position, score) {
    try {
        document.getElementById('savingStatus').style.display = 'block';
        
        const response = await fetch(GOOGLE_SHEETS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                position: position,
                score: score
            })
        });
        
        console.log('Результат отправлен в Google Sheets!');
        document.getElementById('savingStatus').textContent = '✅ СОХРАНЕНО!';
        
    } catch (error) {
        console.error('Ошибка при отправке:', error);
        document.getElementById('savingStatus').textContent = '❌ ОШИБКА СОХРАНЕНИЯ';
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch(GOOGLE_SHEETS_URL);
        const data = await response.json();
        
        if (data.status === 'success' && data.leaderboard) {
            displayLeaderboard(data.leaderboard);
        }
    } catch (error) {
        console.error('Ошибка загрузки лидерборда:', error);
        document.getElementById('leaderboardLoading').textContent = '❌ ОШИБКА ЗАГРУЗКИ';
    }
}

function displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';
    
    // Показываем топ-10
    const top10 = leaderboard.slice(0, 10);
    
    top10.forEach((entry, index) => {
        const row = tbody.insertRow();
        const place = index + 1;
        
        let medal = '';
        if (place === 1) medal = '🥇';
        else if (place === 2) medal = '🥈';
        else if (place === 3) medal = '🥉';
        
        row.insertCell(0).textContent = `${medal} ${place}`;
        row.insertCell(1).textContent = entry.name;
        row.insertCell(2).textContent = entry.position;
        row.insertCell(3).textContent = entry.score;
    });
    
    document.getElementById('leaderboardLoading').style.display = 'none';
    document.getElementById('leaderboardTable').style.display = 'table';
}

function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('scoreComment').textContent = getScoreComment(score);
    document.getElementById('gameOver').style.display = 'block';
    
    // Сохраняем результат в Google Sheets
    saveToGoogleSheets(playerData.name, playerData.position, score);
}

function registerPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const position = document.getElementById('playerPosition').value.trim();
    
    if (!name || !position) {
        alert('ЗАПОЛНИТЕ ВСЕ ПОЛЯ!');
        return;
    }
    
    playerData.name = name;
    playerData.position = position;
    playerData.registered = true;
    
    // Сохраняем в localStorage чтобы не спрашивать снова
    localStorage.setItem('officeRunnerPlayer', JSON.stringify(playerData));
    
    // Показываем легенду
    document.getElementById('registrationScreen').style.display = 'none';
    document.getElementById('displayName').textContent = name;
    document.getElementById('displayPosition').textContent = position;
    document.getElementById('legendScreen').style.display = 'block';
}

function startGame() {
    document.getElementById('legendScreen').style.display = 'none';
    restartGame();
}

function restartGame() {
    gameRunning = true;
    score = 0;
    gameSpeed = 4.5;
    frameCount = 0;
    obstacles = [];
    coins = [];
    player.y = player.groundY;
    player.velocityY = 0;
    player.isJumping = false;
    
    document.getElementById('score').textContent = 'ОЧКИ: 0';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('savingStatus').style.display = 'none';
}

function viewLeaderboard() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('leaderboardScreen').style.display = 'block';
    document.getElementById('leaderboardLoading').style.display = 'block';
    document.getElementById('leaderboardTable').style.display = 'none';
    
    loadLeaderboard();
}

function closeLeaderboard() {
    document.getElementById('leaderboardScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';
}

// ИСПРАВЛЕНИЕ: Пробел работает в input, но не запускает игру
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        // Если фокус НА input - разрешаем пробел (не preventDefault)
        if (document.activeElement.tagName === 'INPUT') {
            return; // Пробел работает нормально в input
        }
        
        // Если фокус НЕ на input - используем для игры
        e.preventDefault();
        if (!gameRunning) {
            if (document.getElementById('legendScreen').style.display === 'block') {
                startGame();
            }
        } else {
            player.jump();
        }
    }
});

// Проверяем есть ли сохраненные данные игрока
window.addEventListener('load', () => {
    const savedPlayer = localStorage.getItem('officeRunnerPlayer');
    if (savedPlayer) {
        playerData = JSON.parse(savedPlayer);
        document.getElementById('registrationScreen').style.display = 'none';
        document.getElementById('displayName').textContent = playerData.name;
        document.getElementById('displayPosition').textContent = playerData.position;
        document.getElementById('legendScreen').style.display = 'block';
    }
});

// Запуск игры
gameLoop();
