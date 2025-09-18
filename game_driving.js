// Dr. Driving – Responsive, Lane-locked, HiDPI

const canvas = document.getElementById('drivingCanvas');
const ctx = canvas.getContext('2d');

// Constants
const ROAD_DASH_H = 38;
const CAR_RADIUS = 10;
const CAR_SHADOW_BLUR = 25;
const LANE_COUNT = 4;
const MIN_SPEED = 4;
const MAX_SPEED = 20;

let roadDashOffset = 0;
let floatingText = null;

// Game state
const game = {
  running: false,
  paused: false,
  gameOver: false,
  score: 0,
  highScore: Number(localStorage.getItem('drivingHighScore') || 0),
  speed: 7,
  car: { lane: 2, x: 0, y: 0, w: 46, h: 74 },
  traffic: [],
  lanes: [] // x positions for lanes (center of each)
};

// ===== Responsive sizing (HiDPI) =====
// The canvas is CSS-sized by .canvas-wrap (aspect-ratio). Here we set the
// internal pixel resolution based on devicePixelRatio to keep it sharp.
function sizeCanvasHiDPI() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  // Read the layout size the browser computed
  const displayWidth  = Math.max(300, Math.round(canvas.clientWidth));
  const displayHeight = Math.max(180, Math.round(canvas.clientHeight));

  // Set the internal buffer to DPR-scaled resolution
  canvas.width  = Math.round(displayWidth * dpr);
  canvas.height = Math.round(displayHeight * dpr);

  // Reset transform, then scale drawing so 1 unit = 1 CSS pixel
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // (Optional) store for convenience
  canvas.__cssWidth  = displayWidth;
  canvas.__cssHeight = displayHeight;
}

// Debounced/throttled resize to avoid layout thrash on mobile rotations
let __resizeTick = null;
function scheduleResize() {
  if (__resizeTick) return;
  __resizeTick = requestAnimationFrame(() => {
    __resizeTick = null;
    onResize();
  });
}

function setLanes() {
  // Road width 400 CSS px, centered in canvas width
  // Car width 46; some side padding so lanes look nice at all sizes
  const roadWidth = 400;
  const sidePad = 36;
  const carW = game.car.w;
  const roadX = canvas.__cssWidth / 2 - roadWidth / 2;
  const usable = roadWidth - sidePad * 2 - carW;

  game.lanes = [];
  const gap = LANE_COUNT > 1 ? (usable / (LANE_COUNT - 1)) : 0;
  for (let i = 0; i < LANE_COUNT; i++) {
    game.lanes.push(Math.round(roadX + sidePad + carW / 2 + i * gap));
  }
}

function onResize() {
  sizeCanvasHiDPI();
  setLanes();

  // Keep player at its lane center & ~80% down the screen
  game.car.x = game.lanes[game.car.lane] - game.car.w / 2;
  game.car.y = Math.round(canvas.__cssHeight * 0.8) - game.car.h / 2;

  draw();
}

window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);

// ===== Init / Reset =====
function randColorPair() {
  const pals = [
    ['#ff7675', '#c4453d'],
    ['#74b9ff', '#3867d6'],
    ['#ffeaa7', '#d6a824'],
    ['#55efc4', '#189d72'],
    ['#a29bfe', '#574b90']
  ];
  return pals[Math.floor(Math.random() * pals.length)];
}

function showFloatingText(text) {
  floatingText = {
    text, x: canvas.__cssWidth / 2, y: canvas.__cssHeight / 2, opacity: 1, dy: -1.1, fadeRate: 0.012
  };
}

function resetGame() {
  game.score = 0;
  game.speed = 7;
  game.gameOver = false;

  // Ensure canvas & lanes correct before placing objects
  onResize();

  // Start player in middle lane
  game.car.lane = Math.min(2, LANE_COUNT - 1);
  game.car.x = game.lanes[game.car.lane] - game.car.w / 2;
  game.car.y = Math.round(canvas.__cssHeight * 0.8) - game.car.h / 2;

  game.traffic.length = 0;
  for (let i = 0; i < 6; i++) {
    const lane = Math.floor(Math.random() * game.lanes.length);
    const [c1, c2] = randColorPair();
    game.traffic.push({ lane, x: 0, y: -i * 200, w: 46, h: 74, grad: [c1, c2] });
  }
  draw();
  updateLabels();
}

// ===== Drawing =====
function drawRoad() {
  const roadX = canvas.__cssWidth / 2 - 200;
  const roadGrad = ctx.createLinearGradient(0, 0, 0, canvas.__cssHeight);
  roadGrad.addColorStop(0, '#2d2d2d');
  roadGrad.addColorStop(1, '#1b1b1b');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(roadX, 0, 400, canvas.__cssHeight);

  ctx.strokeStyle = '#eeeeee';
  ctx.lineWidth = 6;
  ctx.setLineDash([ROAD_DASH_H, ROAD_DASH_H]);
  ctx.lineDashOffset = roadDashOffset;

  for (let i = 1; i < LANE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(game.lanes[i], 0);
    ctx.lineTo(game.lanes[i], canvas.__cssHeight);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function roundRect(x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawCar(obj, isPlayer = false) {
  const { x, y, w, h } = obj;
  ctx.save();
  ctx.shadowColor = isPlayer ? '#ffc107aa' : '#000a';
  ctx.shadowBlur = CAR_SHADOW_BLUR;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  if (isPlayer) { grad.addColorStop(0, '#ffd34e'); grad.addColorStop(1, '#d29e14'); }
  else { grad.addColorStop(0, obj.grad[0]); grad.addColorStop(1, obj.grad[1]); }

  ctx.fillStyle = grad;
  roundRect(x, y, w, h, CAR_RADIUS, true, false);
  ctx.restore();

  // windshield
  ctx.fillStyle = '#263238';
  roundRect(x + 7, y + 13, w - 14, 22, 4, true, false);

  if (isPlayer) {
    ctx.fillStyle = '#fffcc2';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x + 6, y - 10, w - 12, 8);
    ctx.globalAlpha = 1;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.__cssWidth, canvas.__cssHeight);

  drawRoad();

  // Always snap to lane center
  game.car.x = game.lanes[game.car.lane] - game.car.w / 2;
  drawCar(game.car, true);

  game.traffic.forEach(t => {
    t.x = game.lanes[t.lane] - t.w / 2;
    drawCar(t);
  });

  ctx.fillStyle = '#17f3ff';
  ctx.font = '20px Orbitron, sans-serif';
  ctx.fillText('SCORE ' + game.score, 30, 40);
  ctx.fillText('HI ' + game.highScore, 30, 70);

  if (floatingText) {
    ctx.save();
    ctx.font = 'bold 46px Orbitron, Russo One, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#17f3ff';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = floatingText.opacity;
    ctx.fillStyle = '#fff';
    ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

function updateLabels() {
  document.getElementById('scoreLabel').textContent = 'Score: ' + game.score;
  document.getElementById('highScoreLabel').textContent = 'High Score: ' + game.highScore;
}

// ===== Loop =====
function gameLoop() {
  if (!game.running || game.paused || game.gameOver) return;

  // lane dashes
  const LANE_LINE_SPEED = 4.5;
  roadDashOffset += LANE_LINE_SPEED;
  if (roadDashOffset >= ROAD_DASH_H * 2) roadDashOffset = 0;

  // traffic
  game.traffic.forEach(t => t.y += game.speed);
  if (game.traffic.length < 6 && Math.random() < 0.04) {
    const lane = Math.floor(Math.random() * game.lanes.length);
    const [c1, c2] = randColorPair();
    game.traffic.unshift({ lane, x: 0, y: -130, w: 46, h: 74, grad: [c1, c2] });
  }
  game.traffic = game.traffic.filter(t => t.y < canvas.__cssHeight + 40);

  // collisions (lane-based)
  for (const t of game.traffic) {
    const overlapY = (t.y + t.h * 0.8 > game.car.y + 8) && (t.y < game.car.y + game.car.h * 0.8);
    if (overlapY && t.lane === game.car.lane) {
      game.gameOver = true;
      game.running = false;
      if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('drivingHighScore', game.highScore);
      }
      updateLabels();
      setTimeout(() => { alert('Game Over! Score: ' + game.score); resetGame(); }, 200);
      return;
    }
  }

  // scoring & speed
  game.score++;
  if (game.score > game.highScore) game.highScore = game.score;
  if (game.score % 120 === 0) game.speed = Math.min(game.speed + 0.6, MAX_SPEED);

  if (game.score > 0 && game.score % 150 === 0 && !floatingText) {
    const messages = ['Good!', 'Nice!', 'Awesome!', 'Keep Going!', 'Well Done!', 'Pro Racer!', 'Smooth!', 'Bravo!'];
    showFloatingText(messages[Math.floor(Math.random() * messages.length)]);
  }
  if (floatingText) {
    floatingText.y += -1.1;
    floatingText.opacity -= 0.012;
    if (floatingText.opacity <= 0) floatingText = null;
  }

  updateLabels();
  draw();
  requestAnimationFrame(gameLoop);
}

// ===== Controls =====
document.getElementById('btnStart').onclick = () => {
  if (game.running && !game.paused) return;
  if (!game.running) resetGame();
  game.running = true; game.paused = false; gameLoop();
};
document.getElementById('btnPause').onclick = () => {
  if (!game.running || game.gameOver) return;
  game.paused = !game.paused;
  if (!game.paused) gameLoop();
};
document.getElementById('btnRestart').onclick = () => {
  resetGame(); game.running = true; game.paused = false; gameLoop();
};

// Keyboard
window.addEventListener('keydown', e => {
  if (!game.running || game.paused || game.gameOver) return;
  if (e.key === 'ArrowLeft' && game.car.lane > 0) game.car.lane--;
  if (e.key === 'ArrowRight' && game.car.lane < game.lanes.length - 1) game.car.lane++;
  if (e.key === 'ArrowUp')   game.speed = Math.min(game.speed + 1.3, MAX_SPEED);
  if (e.key === 'ArrowDown') game.speed = Math.max(game.speed - 1.3, MIN_SPEED);
  // key feedback sound (optional)
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key) && window.__carSwipeSound){
    try{ window.__carSwipeSound.currentTime = 0; window.__carSwipeSound.play(); }catch(_){}
  }
  draw();
});

// Mobile swipes
let startX = null, startY = null, moved = false;
const swipeThreshold = 35; // px

// Passive listeners; touch-action:none on .canvas-wrap prevents page scroll
canvas.addEventListener('touchstart', (e) => {
  if (!game.running || game.paused || game.gameOver) return;
  const t = e.touches[0];
  startX = t.clientX; startY = t.clientY; moved = false;
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (!game.running || game.paused || game.gameOver) return;
  if (startX == null || startY == null) return;
  const t = e.touches[0];
  const dx = t.clientX - startX;
  const dy = t.clientY - startY;
  if (moved) return;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
    if (dx < 0 && game.car.lane > 0) game.car.lane--;
    if (dx > 0 && game.car.lane < game.lanes.length - 1) game.car.lane++;
    moved = true;
  } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > swipeThreshold) {
    if (dy < 0) game.speed = Math.min(game.speed + 1.3, MAX_SPEED);     // up = accelerate
    if (dy > 0) game.speed = Math.max(game.speed - 1.3, MIN_SPEED);     // down = brake
    moved = true;
  }

  if (moved && window.__carSwipeSound) {
    try{ window.__carSwipeSound.currentTime = 0; window.__carSwipeSound.play(); }catch(_){}
  }
  draw();
}, { passive: true });

canvas.addEventListener('touchend', () => { startX = startY = null; moved = false; }, { passive: true });

// Boot
resetGame();
