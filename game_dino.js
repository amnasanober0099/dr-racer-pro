// ===== Arcade SFX =====
const jumpSound = document.getElementById('jumpSound');
const gameOverSound = document.getElementById('gameOverSound');
const bgMusic = document.getElementById('bgMusic');

function playJumpSound() {
  jumpSound.currentTime = 0;
  jumpSound.play();
}
function playGameOverSound() {
  gameOverSound.currentTime = 0;
  gameOverSound.play();
}
function playBGMusic() {
  if (bgMusic.paused) {
    bgMusic.volume = 0.25;
    bgMusic.play();
  }
}
function pauseBGMusic() {
  bgMusic.pause();
}

// ====== DINO RUN GAME LOGIC ======
const canvas = document.getElementById('dinoCanvas');
const ctx = canvas.getContext('2d');

let game = {
  running: false, paused: false, gameOver: false,
  score: 0, highScore: Number(localStorage.getItem('dinoHighScore') || 0),
  speed: 6.7, gravity: 1.01, jumpPower: 15,
  dino: { x: 72, y: 125, vy: 0, width: 44, height: 48, jumping: false },
  cactusArr: [],
  cloudArr: [],
  groundY: 170
};
let floatingText = null;

function setVars() {
  let w = canvas.width, h = canvas.height;
  game.groundY = Math.round(h * 0.775);
  game.dino.x = Math.round(w * 0.11);
  game.dino.width = Math.round(w * 0.07);
  game.dino.height = Math.round(h * 0.22);
  game.dino.y = Math.round(game.groundY - game.dino.height);
  game.gravity = h / 150;
  game.jumpPower = h / 10.2;
}

function resetGame() {
  setVars();
  game.score = 0;
  game.speed = 6.7;
  game.dino.jumping = false;
  game.dino.vy = 0;
  game.cactusArr = [{ x: canvas.width, y: game.groundY - game.dino.height + 7, width: 25, height: 40 }];
  game.cloudArr = [
    { x: canvas.width * 0.40, y: canvas.height * 0.19 },
    { x: canvas.width * 0.68, y: canvas.height * 0.23 },
    { x: canvas.width * 0.84, y: canvas.height * 0.14 }
  ];
  game.gameOver = false;
  floatingText = null;
  draw();
  updateLabels();
}

function draw() {
  ctx.fillStyle = "#e7f6fd";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // clouds
  ctx.save(); ctx.globalAlpha = 0.34; ctx.fillStyle = "#b4e0fc";
  for (let c of game.cloudArr)
    ctx.beginPath(), ctx.ellipse(c.x, c.y, 55, 18, 0, 0, 2 * Math.PI), ctx.fill();
  ctx.restore();
  // ground
  ctx.fillStyle = "#adb5bd";
  ctx.fillRect(0, game.groundY, canvas.width, 8);

  // cactus
  for (let cactus of game.cactusArr)
    drawCactus(cactus.x, cactus.y, cactus.width, cactus.height);
  // dino
  drawDino(game.dino.x, game.dino.y, game.dino.width, game.dino.height, !game.dino.jumping && Math.floor(game.score / 9) % 2 === 0);

  // NEON ARCADE floating motivational text (centered)
  if (floatingText) {
    ctx.save();
    ctx.font = 'bold 44px Orbitron, Russo One, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#17f3ff';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = floatingText.opacity;
    ctx.fillStyle = '#fff';
    ctx.fillText(floatingText.text, canvas.width / 2, canvas.height * 0.33 + floatingText.y);
    ctx.shadowColor = '#191d27';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

function drawDino(x, y, w, h, walk) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#525453";
  ctx.fillRect(0, 0, w, h - 5);
  // legs
  ctx.save(); ctx.translate(w * 0.2, h - 9); ctx.rotate(walk ? 0.42 : 0);
  ctx.fillStyle = "#888"; ctx.fillRect(0, 0, w * 0.21, h * 0.18); ctx.restore();
  ctx.save(); ctx.translate(w * 0.7, h - 9); ctx.rotate(walk ? -0.45 : 0);
  ctx.fillStyle = "#888"; ctx.fillRect(0, 0, w * 0.21, h * 0.18); ctx.restore();
  // tail
  ctx.save(); ctx.rotate(-0.21);
  ctx.fillStyle = "#4d9b76";
  ctx.fillRect(-w * 0.35, h * 0.70, w * 0.55, h * 0.09);
  ctx.restore();
  // eye
  ctx.fillStyle = "#fff";
  ctx.fillRect(w * 0.80, h * 0.21, w * 0.14, w * 0.14);
  ctx.fillStyle = "#111";
  ctx.fillRect(w * 0.85, h * 0.25, w * 0.07, w * 0.07);
  // arm/belly
  ctx.fillStyle = "#bad7c9";
  ctx.fillRect(w * 0.12, h * 0.63, w * 0.21, h * 0.08);
  // mouth
  ctx.fillStyle = "#333";
  ctx.fillRect(w * 0.80, h * 0.44, w * 0.13, h * 0.06);
  ctx.restore();
}

function drawCactus(x, y, w, h) {
  ctx.save();
  ctx.fillStyle = "#279149";
  ctx.fillRect(x, y, w, h - 8);
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 8, w / 2, 0, 2 * Math.PI); ctx.fill();
  ctx.restore();
}

function updateLabels() {
  document.getElementById('scoreLabel').innerText = 'Score: ' + game.score;
  document.getElementById('highScoreLabel').innerText = 'High Score: ' + game.highScore;
}

function showFloatingText(text) {
  floatingText = {
    text,
    y: 0,
    opacity: 1,
    dy: -1.2,
    fadeRate: 0.014
  };
}

function loop() {
  if (!game.running || game.paused || game.gameOver) return;
  for (let c of game.cloudArr) { c.x -= game.speed / 5; if (c.x < -50) c.x = canvas.width + Math.random() * 55; }
  for (let cactus of game.cactusArr) cactus.x -= game.speed;
  if (game.cactusArr.length && game.cactusArr[0].x < -50) game.cactusArr.shift();

  // SAFER, spaced cactus
  let last = game.cactusArr[game.cactusArr.length - 1];
  let minGap = 240 + Math.random() * 70;
  if (last && last.x < canvas.width - minGap) {
    let multi = Math.random() < 0.10;
    if (multi) {
      game.cactusArr.push({ x: canvas.width + 36, y: game.groundY - game.dino.height + 7, width: 22 + Math.random() * 8, height: 36 + Math.random() * 6 });
      game.cactusArr.push({ x: canvas.width + 70, y: game.groundY - game.dino.height + 7, width: 18 + Math.random() * 7, height: 32 });
    } else {
      game.cactusArr.push({ x: canvas.width + 32, y: game.groundY - game.dino.height + 7, width: 20 + Math.random() * 9, height: 30 + Math.random() * 7 });
    }
  }
  // Dino physics
  if (game.dino.jumping) {
    game.dino.y += game.dino.vy;
    game.dino.vy += game.gravity;
    if (game.dino.y >= game.groundY - game.dino.height) {
      game.dino.y = game.groundY - game.dino.height; game.dino.jumping = false; game.dino.vy = 0;
    }
  }
  // Collision
  for (let cactus of game.cactusArr) {
    if (cactus.x < game.dino.x + game.dino.width - 7 &&
      cactus.x + cactus.width > game.dino.x + 6 &&
      game.dino.y + game.dino.height - 8 > cactus.y + 2) {
      game.running = false; game.gameOver = true;
      playGameOverSound();
      pauseBGMusic();
      if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('dinoHighScore', game.highScore);
      }
      updateLabels();
      setTimeout(() => { alert("Game Over! Score: " + game.score); resetGame(); }, 190);
      return;
    }
  }
  game.score++;
  if (game.score > game.highScore) game.highScore = game.score;
  if (game.score % 90 === 0 && game.speed < 16) game.speed += 0.44;

  // Arcade neon floating text
  if (game.score > 0 && game.score % 150 === 0 && !floatingText) {
    const messages = ['Nice!', 'Awesome!', 'Good!', 'Pro Jump!', 'Keep Going!', 'Superb!', 'Bravo!', 'Excellent!'];
    showFloatingText(messages[Math.floor(Math.random() * messages.length)]);
  }
  if (floatingText) {
    floatingText.y += floatingText.dy;
    floatingText.opacity -= floatingText.fadeRate;
    if (floatingText.opacity <= 0) floatingText = null;
  }

  updateLabels();
  draw();
  requestAnimationFrame(loop);
}

// ===== Button controls =====
document.getElementById('btnStart').onclick = function () {
  if (game.running && !game.paused) return;
  if (!game.running) resetGame();
  game.running = true;
  game.paused = false;
  game.gameOver = false;
  playBGMusic();
  loop();
};
document.getElementById('btnPause').onclick = function () {
  if (!game.running || game.gameOver) return;
  game.paused = !game.paused;
  if (game.paused) pauseBGMusic();
  else { playBGMusic(); loop(); }
};
document.getElementById('btnRestart').onclick = function () {
  resetGame();
  game.running = true;
  game.paused = false;
  game.gameOver = false;
  playBGMusic();
  loop();
};

// ===== Keyboard controls (with sound) =====
window.addEventListener('keydown', e => {
  if (!game.running || game.paused || game.gameOver) return;
  if ((e.key === "ArrowUp" || e.key === " " || e.key === "Spacebar") && !game.dino.jumping) {
    game.dino.jumping = true; game.dino.vy = -game.jumpPower;
    playJumpSound();
  }
});

// ===== Tap/Touch controls for mobile =====
canvas.addEventListener('touchstart', function (e) {
  if (game.running && !game.paused && !game.gameOver && !game.dino.jumping) {
    game.dino.jumping = true; game.dino.vy = -game.jumpPower;
    playJumpSound();
  }
}, { passive: true });

// ===== Responsive resize =====
window.addEventListener('resize', () => {
  let parent = canvas.parentElement;
  let width = Math.min(650, parent.offsetWidth - 16);
  if (width < 320) width = 320;
  let ratio = 220 / 650;
  canvas.width = width;
  canvas.height = Math.round(width * ratio);
  setVars();
  resetGame();
});

resetGame();
