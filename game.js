const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const godStatusElement = document.getElementById('godStatus');
const godModeElement = document.getElementById('godMode');
const godBtn = document.getElementById('godBtn');
const rankingListElement = document.getElementById('rankingList');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalInput = document.getElementById('modalInput');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');
const bgSelect = document.getElementById('bgSelect');
const bgMusicBtn = document.getElementById('bgMusicBtn');
const soundBtn = document.getElementById('soundBtn');

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CREATOR_CODE = 'xiaobo666';
const RANKING_KEY = 'snakeRanking';
const MAX_RANKING = 10;

const BACKGROUND_THEMES = {
    dark: { bg: '#0a0a0a', grid: '#1a1a2e', body: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' },
    forest: { bg: '#0a1a0a', grid: '#1a3a1a', body: 'linear-gradient(135deg, #0a1a0a 0%, #0d2d0d 100%)' },
    ocean: { bg: '#0a0a1a', grid: '#1a1a3a', body: 'linear-gradient(135deg, #0a1a2a 0%, #0d1d3d 100%)' },
    sunset: { bg: '#1a0a0a', grid: '#3a1a1a', body: 'linear-gradient(135deg, #2a1a0a 0%, #1a0a0a 100%)' },
    neon: { bg: '#1a0a2a', grid: '#3a1a4a', body: 'linear-gradient(135deg, #2a0a3a 0%, #1a0a2a 100%)' },
    wallpaper: { bg: '#1a1a1a', grid: 'rgba(255,255,255,0.1)', body: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)', image: 'https://neeko-copilot.bytedance.net/api/text2image?prompt=beautiful%20young%20Chinese%20ethnic%20minority%20girl%20with%20intricate%20braided%20hair%20wearing%20traditional%20costume%20with%20silver%20jewelry%20earrings%20and%20headpiece%20clear%20blue%20sky%20with%20white%20clouds%20cinematic%20lighting%20portrait%20photography&image_size=landscape_16_9' }
};

let backgroundImage = null;

canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = 0;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;
let isGodMode = false;
let isCreator = false;
let currentPlayerName = '玩家';
let modalCallback = null;
let currentTheme = 'dark';
let bgMusicEnabled = false;
let soundEnabled = true;

let audioContext = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

function playTone(frequency, duration, type = 'sine', volume = 0.1) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playBackgroundMusic() {
    if (!bgMusicEnabled) return;
    try {
        const ctx = getAudioContext();
        
        const scales = {
            major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
            pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
            minor: [261.63, 277.18, 293.66, 329.63, 349.23, 369.99, 415.30, 440.00]
        };
        
        const chords = {
            C: [261.63, 329.63, 392.00],
            G: [392.00, 493.88, 587.33],
            Am: [277.18, 329.63, 440.00],
            F: [349.23, 440.00, 523.25]
        };
        
        const chordList = ['C', 'G', 'Am', 'F', 'C', 'F', 'G', 'C'];
        const scalesList = ['major', 'pentatonic', 'minor', 'major'];
        
        let scaleIndex = 0;
        let chordIndex = 0;
        let noteIndex = 0;
        let beatCount = 0;
        
        function playChord(chordName) {
            const chordNotes = chords[chordName];
            chordNotes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = i === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq / (i === 0 ? 1 : i === 1 ? 2 : 4), ctx.currentTime);
                
                gain.gain.setValueAtTime(0.008, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 1.5);
            });
        }
        
        function playNote() {
            if (!bgMusicEnabled || isGameOver) return;
            
            const currentScale = scales[scalesList[scaleIndex % scalesList.length]];
            const currentChord = chordList[chordIndex % chordList.length];
            
            if (beatCount % 4 === 0) {
                playChord(currentChord);
            }
            
            const noteFreq = currentScale[noteIndex % currentScale.length];
            const noteVariation = Math.random() > 0.7 ? 12 : 0;
            
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            const gain2 = ctx.createGain();
            
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
            const types = ['sine', 'square', 'sine'];
            osc1.type = types[Math.floor(Math.random() * types.length)];
            osc2.type = 'sine';
            
            osc1.frequency.setValueAtTime(noteFreq + noteVariation, ctx.currentTime);
            osc2.frequency.setValueAtTime(noteFreq * 2, ctx.currentTime);
            
            const volume1 = 0.015 + Math.random() * 0.005;
            const volume2 = 0.008 + Math.random() * 0.003;
            
            gain1.gain.setValueAtTime(volume1, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            
            gain2.gain.setValueAtTime(volume2, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.4);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.3);
            
            noteIndex += Math.random() > 0.5 ? 1 : 2;
            beatCount++;
            
            if (beatCount % 8 === 0) {
                scaleIndex++;
            }
            if (beatCount % 4 === 0) {
                chordIndex++;
            }
            
            const delay = 350 + Math.random() * 150;
            setTimeout(playNote, delay);
        }
        
        playNote();
    } catch (e) {
        console.log('Background music not supported');
    }
}

function playEatSound() {
    playTone(800, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(1000, 0.15, 'sine', 0.1), 100);
}

function playGameOverSound() {
    playTone(200, 0.3, 'triangle', 0.2);
    setTimeout(() => playTone(150, 0.4, 'triangle', 0.15), 300);
}

function playSuccessSound() {
    playTone(523.25, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.1), 100);
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.1), 200);
}

function changeTheme(themeName) {
    currentTheme = themeName;
    const theme = BACKGROUND_THEMES[themeName];
    document.body.style.background = theme.body;
    
    if (theme.image) {
        if (!backgroundImage) {
            backgroundImage = new Image();
            backgroundImage.crossOrigin = 'anonymous';
            backgroundImage.onload = () => {
                draw();
            };
            backgroundImage.src = theme.image;
        } else {
            draw();
        }
    } else {
        backgroundImage = null;
        draw();
    }
}

function showModal(title, placeholder, callback) {
    modalTitle.textContent = title;
    modalInput.placeholder = placeholder;
    modalInput.value = '';
    modalOverlay.classList.add('show');
    modalCallback = callback;
    modalInput.focus();
}

function hideModal() {
    modalOverlay.classList.remove('show');
    modalInput.value = '';
    modalCallback = null;
}

function init() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    isPaused = false;
    isGameOver = false;
    scoreElement.textContent = score;
    spawnFood();
    draw();
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
    };
    const foodOnSnake = snake.some(segment => segment.x === food.x && segment.y === food.y);
    if (foodOnSnake) {
        spawnFood();
    }
}

function draw() {
    const theme = BACKGROUND_THEMES[currentTheme];
    
    if (theme.image && backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } else {
        ctx.fillStyle = theme.bg;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
    }

    snake.forEach((segment, index) => {
        if (index === 0) {
            if (isGodMode && isCreator) {
                ctx.fillStyle = '#ffd700';
                ctx.shadowColor = '#ffd700';
            } else {
                ctx.fillStyle = '#00ff88';
                ctx.shadowColor = '#00ff88';
            }
            ctx.shadowBlur = 15;
        } else {
            if (isGodMode && isCreator) {
                const alpha = 1 - (index / snake.length) * 0.5;
                ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            } else {
                const alpha = 1 - (index / snake.length) * 0.5;
                ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
            }
            ctx.shadowBlur = 0;
        }
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
        ctx.shadowBlur = 0;
    });

    ctx.fillStyle = '#ff4444';
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    if (isPaused && !isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暂停', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    }

    if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 30);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`最终得分: ${score}`, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
        ctx.fillText('按开始按钮重新游戏', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 40);
    }

    if (isGodMode && isCreator) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
}

function move() {
    const head = { ...snake[0] };
    direction = nextDirection;

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    if (isGodMode && isCreator) {
        if (head.x < 0) head.x = (CANVAS_SIZE / GRID_SIZE) - 1;
        if (head.x >= CANVAS_SIZE / GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = (CANVAS_SIZE / GRID_SIZE) - 1;
        if (head.y >= CANVAS_SIZE / GRID_SIZE) head.y = 0;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        playEatSound();
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
            playSuccessSound();
        }
        spawnFood();
    } else {
        snake.pop();
    }

    checkCollision();
}

function checkCollision() {
    if (isGodMode && isCreator) return;

    const head = snake[0];

    if (head.x < 0 || head.x >= CANVAS_SIZE / GRID_SIZE ||
        head.y < 0 || head.y >= CANVAS_SIZE / GRID_SIZE) {
        gameOver();
        return;
    }

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    playGameOverSound();
    saveScore();
    updateRanking();
    draw();
}

function saveScore() {
    const ranking = getRanking();
    const playerName = isCreator ? '👑 创造者' : currentPlayerName;
    const newEntry = { name: playerName, score: score, date: new Date().toLocaleDateString() };
    
    ranking.push(newEntry);
    ranking.sort((a, b) => b.score - a.score);
    ranking.splice(MAX_RANKING);
    
    localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
}

function getRanking() {
    try {
        return JSON.parse(localStorage.getItem(RANKING_KEY)) || [];
    } catch {
        return [];
    }
}

function updateRanking() {
    const ranking = getRanking();
    rankingListElement.innerHTML = '';

    if (ranking.length === 0) {
        rankingListElement.innerHTML = '<div class="rank-empty">暂无记录，开始游戏创造记录吧！</div>';
        return;
    }

    ranking.forEach((entry, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'rank-item';
        
        const position = document.createElement('span');
        position.className = `rank-position ${index < 3 ? 'top3' : ''}`;
        position.textContent = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        const name = document.createElement('span');
        name.className = 'rank-name';
        name.textContent = entry.name;
        
        const score = document.createElement('span');
        score.className = 'rank-score';
        score.textContent = entry.score;
        
        rankItem.appendChild(position);
        rankItem.appendChild(name);
        rankItem.appendChild(score);
        rankingListElement.appendChild(rankItem);
    });
}

function toggleGodMode() {
    if (!isCreator) {
        showModal('请输入创造者密码', '输入密码...', (inputCode) => {
            if (inputCode === CREATOR_CODE) {
                isCreator = true;
                toggleGodModeInternal();
                showMessage('欢迎回来，创造者！你现在拥有无敌能力和穿墙能力！');
            } else {
                showMessage('密码错误！只有创造者才能开启无敌模式！');
            }
        });
    } else {
        toggleGodModeInternal();
    }
}

function toggleGodModeInternal() {
    isGodMode = !isGodMode;
    godStatusElement.textContent = isGodMode ? '开' : '关';
    godModeElement.classList.toggle('active', isGodMode);
    godBtn.classList.toggle('active', isGodMode);
}

function toggleBgMusic() {
    bgMusicEnabled = !bgMusicEnabled;
    if (bgMusicEnabled) {
        bgMusicBtn.textContent = '🎶 关闭';
        bgMusicBtn.classList.add('off');
        playBackgroundMusic();
    } else {
        bgMusicBtn.textContent = '🎶 开启';
        bgMusicBtn.classList.remove('off');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundBtn.textContent = '🔊 开启';
        soundBtn.classList.remove('off');
    } else {
        soundBtn.textContent = '🔇 关闭';
        soundBtn.classList.add('off');
    }
}

function showMessage(msg) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 15px 30px;
        border-radius: 10px;
        z-index: 2000;
        font-size: 16px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    `;
    msgDiv.textContent = msg;
    document.body.appendChild(msgDiv);
    setTimeout(() => {
        msgDiv.remove();
    }, 2000);
}

function update() {
    if (!isPaused && !isGameOver) {
        move();
    }
    draw();
}

function startGame() {
    if (!gameLoop || isGameOver) {
        if (!isCreator) {
            showModal('请输入你的名字', '输入名字...', (name) => {
                if (name && name.trim()) {
                    currentPlayerName = name.trim();
                }
                initGame();
            });
        } else {
            initGame();
        }
    } else if (isPaused) {
        isPaused = false;
    }
}

function initGame() {
    init();
    gameLoop = setInterval(update, 100);
}

function togglePause() {
    if (!isGameOver && gameLoop) {
        isPaused = !isPaused;
    }
}

function resetGame() {
    clearInterval(gameLoop);
    gameLoop = null;
    init();
}

modalConfirm.addEventListener('click', () => {
    if (modalCallback) {
        modalCallback(modalInput.value);
    }
    hideModal();
});

modalCancel.addEventListener('click', () => {
    hideModal();
});

modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (modalCallback) {
            modalCallback(modalInput.value);
        }
        hideModal();
    } else if (e.key === 'Escape') {
        hideModal();
    }
});

bgSelect.addEventListener('change', (e) => {
    changeTheme(e.target.value);
});

bgMusicBtn.addEventListener('click', toggleBgMusic);
soundBtn.addEventListener('click', toggleSound);

const touchUp = document.getElementById('touchUp');
const touchDown = document.getElementById('touchDown');
const touchLeft = document.getElementById('touchLeft');
const touchRight = document.getElementById('touchRight');

touchUp.addEventListener('click', () => {
    if (direction !== 'down') nextDirection = 'up';
});

touchDown.addEventListener('click', () => {
    if (direction !== 'up') nextDirection = 'down';
});

touchLeft.addEventListener('click', () => {
    if (direction !== 'right') nextDirection = 'left';
});

touchRight.addEventListener('click', () => {
    if (direction !== 'left') nextDirection = 'right';
});

touchUp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'down') nextDirection = 'up';
});

touchDown.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'up') nextDirection = 'down';
});

touchLeft.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'right') nextDirection = 'left';
});

touchRight.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'left') nextDirection = 'right';
});

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
        case 'g':
        case 'G':
            toggleGodMode();
            break;
    }
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resetBtn.addEventListener('click', resetGame);
godBtn.addEventListener('click', toggleGodMode);

highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
highScoreElement.textContent = highScore;

updateRanking();
init();