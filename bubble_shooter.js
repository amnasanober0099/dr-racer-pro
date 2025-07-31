// BUBBLE SHOOTER MOBILE-FRIENDLY

const canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d'),
  scoreEl = document.getElementById('score'),
  nextBubbleEl = document.getElementById('next-bubble'),
  niceEffect = document.getElementById('niceEffect');

const ROWS = 10, COLS = 9, R = 17, D = R * 2, OFFSET_Y = 30;
const COLORS = ['#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#2ecc71', '#17f3ff', '#f12fbb'];
const EFFECTS = ['NICE!', 'EXCELLENT!', 'SUPER!', 'AWESOME!', 'WOW!', 'COMBO!'];

let OFFSET_X, grid, score, active, nextColor, mouse = { x: 0, y: 0 }, popAnims = [];

const CANVAS_RATIO = 390 / 340;
function resizeCanvas() {
  // Responsive canvas (portrait always)
  let w = Math.min(window.innerWidth * 0.995, 380);
  let h = w * CANVAS_RATIO;
  canvas.width = w;
  canvas.height = h;
  OFFSET_X = (w - COLS * D) / 2;
  // update mouse default position after resize (center)
  mouse.x = canvas.width / 2;
  mouse.y = canvas.height / 3;
}
window.addEventListener('resize', resizeCanvas);

function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function drawBubble(x, y, r, color, glow = 10) {
  const dark = darken(color, 0.22);
  const grad = ctx.createRadialGradient(x - r / 3, y - r / 3, r / 8, x, y, r);
  grad.addColorStop(0, "#fff");
  grad.addColorStop(0.22, color);
  grad.addColorStop(1, dark);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#1c2231';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}
function popBubble(x, y, color) {
  popAnims.push({ x, y, color, r: R, t: 0 });
}
function animatePops() {
  for (let i = popAnims.length - 1; i >= 0; i--) {
    let p = popAnims[i];
    if (p.t > 1) { popAnims.splice(i, 1); continue; }
    ctx.save();
    ctx.globalAlpha = 1 - p.t;
    drawBubble(p.x, p.y, p.r + 13 * p.t, p.color, 19);
    ctx.globalAlpha = 1;
    ctx.restore();
    p.t += 0.05;
  }
}
function darken(hex, amt) {
  hex = hex.replace('#', '');
  let num = parseInt(hex, 16),
    r = (num >> 16) & 0xFF,
    g = (num >> 8) & 0xFF,
    b = num & 0xFF;
  r = Math.floor(r * (1 - amt));
  g = Math.floor(g * (1 - amt));
  b = Math.floor(b * (1 - amt));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function spawn() {
  active = {
    x: canvas.width / 2,
    y: canvas.height - R - 14,
    color: nextColor,
    vx: 0, vy: 0, moving: false
  };
  nextColor = randColor();
  nextBubbleEl.style.background = nextColor;
}

// Main loop
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const col = grid[r][c];
      if (col) drawBubble(OFFSET_X + c * D + R, OFFSET_Y + r * D + R, R, col);
    }
  }
  // Pop animation
  animatePops();
  // Aim line
  if (!active.moving) {
    const ang = Math.atan2(mouse.y - active.y, mouse.x - active.x);
    ctx.save();
    ctx.strokeStyle = 'rgba(23,243,255,0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(active.x, active.y);
    ctx.lineTo(active.x + Math.cos(ang) * 90, active.y + Math.sin(ang) * 90);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  // Draw active bubble
  drawBubble(active.x, active.y, R, active.color, 13);
}

function update() {
  if (active.moving) {
    active.x += active.vx;
    active.y += active.vy;
    // Wall bounce
    if (active.x <= R) {
      active.x = R;
      active.vx *= -1;
    }
    if (active.x >= canvas.width - R) {
      active.x = canvas.width - R;
      active.vx *= -1;
    }
    // Top or collision?
    if (active.y <= OFFSET_Y + R) return place();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) continue;
        const cx = OFFSET_X + c * D + R,
          cy = OFFSET_Y + r * D + R,
          dx = active.x - cx, dy = active.y - cy;
        if (dx * dx + dy * dy <= D * D) {
          return place();
        }
      }
    }
  }
}

// PC - Mouse aim & shoot
canvas.onmousemove = function (e) {
  if (window.innerWidth < 700) return; // Ignore mouse move on mobile
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
};
canvas.onclick = function (e) {
  if (window.innerWidth < 700) return; // On mobile, handled by touch
  shoot();
};

// Mobile - Touch drag aim + tap shoot
let isTouching = false;
canvas.addEventListener('touchstart', function (e) {
  isTouching = true;
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  mouse.x = t.clientX - rect.left;
  mouse.y = t.clientY - rect.top;
  // Touch tap == shoot
  if (!active.moving) shoot();
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
  if (!isTouching) return;
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  mouse.x = t.clientX - rect.left;
  mouse.y = t.clientY - rect.top;
}, { passive: false });

canvas.addEventListener('touchend', function (e) {
  isTouching = false;
}, { passive: false });

function shoot() {
  if (active.moving) return;
  // Only allow upward shooting (for kids / easy play)
  const ang = Math.atan2(mouse.y - active.y, mouse.x - active.x);
  if (ang > Math.PI * 0.90 || ang < -Math.PI * 0.90) return; // Prevent shooting downwards
  active.vx = Math.cos(ang) * 8;
  active.vy = Math.sin(ang) * 8;
  active.moving = true;
}

function place() {
  let minDist = Infinity, nearest = null;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c]) continue;
      const cx = OFFSET_X + c * D + R,
        cy = OFFSET_Y + r * D + R,
        dx = active.x - cx, dy = active.y - cy,
        d2 = dx * dx + dy * dy;
      if (d2 < minDist) {
        minDist = d2;
        nearest = { r, c };
      }
    }
  }

  let targetR, targetC;
  if (!nearest) {
    targetR = 0;
    let best = { d: Infinity, c: 0 };
    for (let c = 0; c < COLS; c++) {
      const cx = OFFSET_X + c * D + R,
        dx = active.x - cx;
      if (!grid[0][c] && Math.abs(dx) < best.d) {
        best = { d: Math.abs(dx), c };
      }
    }
    targetC = best.c;
  } else {
    let options = [];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      let nr = nearest.r + dr, nc = nearest.c + dc;
      if (
        nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
        !grid[nr][nc]
      ) {
        const cx = OFFSET_X + nc * D + R,
          cy = OFFSET_Y + nr * D + R,
          d2 = (active.x - cx) ** 2 + (active.y - cy) ** 2;
        options.push({ r: nr, c: nc, d: d2 });
      }
    });
    if (options.length) {
      options.sort((a, b) => a.d - b.d);
      targetR = options[0].r;
      targetC = options[0].c;
    } else {
      targetR = nearest.r;
      targetC = nearest.c;
    }
  }

  grid[targetR][targetC] = active.color;
  active.moving = false;
  let popped = handleMatches(targetR, targetC);
  let floating = dropFloating();
  if (popped || floating) triggerEffect((floating && popped) ? 'COMBO!' : (popped ? randomEffect() : 'NICE!'));
  spawn();
  updateHUD();
  if (isGameOver()) setTimeout(() => { alert("Game Over!\nScore: " + score); init(); }, 420);
}

// Only pop groups of 3 or more
function handleMatches(sr, sc) {
  const target = grid[sr][sc];
  let visited = {}, queue = [[sr, sc]], cluster = [];
  visited[`${sr},${sc}`] = true;
  while (queue.length) {
    const [r, c] = queue.shift();
    cluster.push([r, c]);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc, key = `${nr},${nc}`;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[key] && grid[nr][nc] === target) {
        visited[key] = true;
        queue.push([nr, nc]);
      }
    });
  }
  if (cluster.length >= 3) {
    cluster.forEach(([r, c]) => {
      popBubble(OFFSET_X + c * D + R, OFFSET_Y + r * D + R, grid[r][c]);
      grid[r][c] = null;
    });
    score += cluster.length * 5;
    return true;
  }
  return false;
}

// Floating bubbles "drop"
function dropFloating() {
  let connected = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  let queue = [];
  for (let c = 0; c < COLS; c++) {
    if (grid[0][c]) {
      queue.push([0, c]);
      connected[0][c] = true;
    }
  }
  while (queue.length) {
    let [r, c] = queue.shift();
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      let nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !connected[nr][nc] && grid[nr][nc]) {
        connected[nr][nc] = true;
        queue.push([nr, nc]);
      }
    });
  }
  let anyDropped = false;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (grid[r][c] && !connected[r][c]) {
        popBubble(OFFSET_X + c * D + R, OFFSET_Y + r * D + R, grid[r][c]);
        grid[r][c] = null;
        score += 3;
        anyDropped = true;
      }
    }
  }
  return anyDropped;
}

function triggerEffect(text) {
  niceEffect.textContent = text;
  niceEffect.style.display = 'block';
  niceEffect.classList.remove('show');
  void niceEffect.offsetWidth;
  niceEffect.classList.add('show');
  setTimeout(() => { niceEffect.style.display = 'none'; }, 1150);
}
function randomEffect() { return EFFECTS[Math.floor(Math.random() * EFFECTS.length)]; }

function updateHUD() {
  scoreEl.textContent = `Score: ${score}`;
}
function isGameOver() {
  for (let c = 0; c < COLS; c++) if (grid[ROWS - 1][c]) return true;
  return false;
}
function init() {
  resizeCanvas();
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
  }
  score = 0;
  nextColor = randColor();
  spawn();
  updateHUD();
  mouse.x = canvas.width / 2; mouse.y = canvas.height / 3;
}
resizeCanvas();
init();
loop();
