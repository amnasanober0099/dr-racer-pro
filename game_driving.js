// Dr. Driving – Responsive & Lane-locked, Desktop+Mobile
const canvas   = document.getElementById('drivingCanvas');
const ctx      = canvas.getContext('2d');
const ROAD_DASH_H = 38, LANE_LINE_SPEED = 4.5, CAR_RADIUS = 10, CAR_SHADOW_BLUR = 25;
let roadDashOffset = 0, floatingText = null;

function resizeCanvas () {
  let parent = canvas.parentElement;
  let width = Math.min(900, parent.offsetWidth-12);
  if(width < 300) width = 300;
  let ratio = 460/900;
  canvas.width = width;
  canvas.height = Math.round(width*ratio);
}
resizeCanvas();
window.addEventListener('resize', ()=>{resizeCanvas();resetGame();});

let LANE_COUNT = 4;
let game = {
  running : false, paused : false, gameOver: false, score: 0,
  highScore: Number(localStorage.getItem('drivingHighScore') || 0),
  speed : 7,
  car   : { lane:2, x: 0, y: 0, w: 46, h: 74 },
  traffic: [],
  lanes  : []
};

function setLanes() {
  // Keep 4 lanes, spaced inside road (which is 400px wide, centered)
  let offset = (canvas.width/2-200)+36;
  let gap = (400-2*36-46)/(LANE_COUNT-1);
  game.lanes = [];
  for(let i=0;i<LANE_COUNT;i++) game.lanes.push(Math.round(offset + i*gap));
}
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
    text: text, x: canvas.width / 2, y: canvas.height / 2, opacity: 1, dy: -1.1, fadeRate: 0.012
  };
}
function resetGame () {
  setLanes();
  Object.assign(game, { score:0, speed:7, gameOver:false });
  game.car.lane = 2; // Start in middle
  game.car.x = game.lanes[game.car.lane];
  game.car.y = Math.round(canvas.height*0.8);
  game.traffic.length = 0;
  for (let i = 0; i < 6; i++) {
    const lane = Math.floor(Math.random()*game.lanes.length);
    const [c1,c2] = randColorPair();
    game.traffic.push({ lane, x:game.lanes[lane], y: -i*200, w:46, h:74, grad:[c1,c2] });
  }
  draw(); updateLabels();
}
function drawRoad () {
  const roadGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  roadGrad.addColorStop(0, '#2d2d2d');
  roadGrad.addColorStop(1, '#1b1b1b');
  let roadX = canvas.width/2-200;
  ctx.fillStyle = roadGrad;
  ctx.fillRect(roadX,0,400,canvas.height);
  ctx.strokeStyle = '#eeeeee';
  ctx.lineWidth   = 6;
  ctx.setLineDash([ROAD_DASH_H, ROAD_DASH_H]);
  ctx.lineDashOffset = roadDashOffset;
  for (let i = 1; i < LANE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(game.lanes[i], 0);
    ctx.lineTo(game.lanes[i], canvas.height);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
function drawCar (obj, isPlayer=false) {
  const { x,y,w,h } = obj;
  ctx.save();
  ctx.shadowColor = isPlayer ? '#ffc107aa' : '#000a';
  ctx.shadowBlur  = CAR_SHADOW_BLUR;
  const grad = ctx.createLinearGradient(x, y, x, y+h);
  if (isPlayer) { grad.addColorStop(0,'#ffd34e'); grad.addColorStop(1,'#d29e14'); }
  else          { grad.addColorStop(0,obj.grad[0]); grad.addColorStop(1,obj.grad[1]); }
  ctx.fillStyle = grad;
  roundRect(x, y, w, h, CAR_RADIUS, true, false);
  ctx.restore();
  ctx.fillStyle = '#263238';
  roundRect(x+7, y+13, w-14, 22, 4, true, false);
  if (isPlayer) {
    ctx.fillStyle = '#fffcc2';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x+6, y-10, w-12, 8);
    ctx.globalAlpha = 1;
  }
}
function roundRect(x,y,w,h,r,fill,stroke) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
function draw () {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawRoad();
  game.car.x = game.lanes[game.car.lane]; // always snap to lane center
  drawCar(game.car, true);
  game.traffic.forEach(t=> { t.x = game.lanes[t.lane]; drawCar(t); });
  ctx.fillStyle = '#17f3ff';
  ctx.font = '20px Orbitron, sans-serif';
  ctx.fillText('SCORE '+game.score, 30,40);
  ctx.fillText('HI '+game.highScore, 30,70);
  if (floatingText) {
    ctx.save();
    ctx.font = 'bold 46px Orbitron, Russo One, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#17f3ff';
    ctx.shadowBlur = 18;
    ctx.globalAlpha = floatingText.opacity;
    ctx.fillStyle = '#fff';
    ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    ctx.shadowColor = '#191d27';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
function updateLabels () {
  document.getElementById('scoreLabel').textContent     = 'Score: ' + game.score;
  document.getElementById('highScoreLabel').textContent = 'High Score: '  + game.highScore;
}
function gameLoop () {
  if (!game.running||game.paused||game.gameOver) return;
  roadDashOffset += LANE_LINE_SPEED;
  if (roadDashOffset >= ROAD_DASH_H*2) roadDashOffset = 0;
  game.traffic.forEach(t=> t.y += game.speed);
  if (game.traffic.length < 6 && Math.random()<0.04) {
    const lane = Math.floor(Math.random()*game.lanes.length);
    const [c1,c2] = randColorPair();
    game.traffic.unshift({ lane, x:game.lanes[lane], y:-130, w:46, h:74, grad:[c1,c2] });
  }
  game.traffic = game.traffic.filter(t=> t.y < canvas.height + 40);
  for (const t of game.traffic) {
    if (t.y + t.h*0.8 > game.car.y+8 &&
        t.y < game.car.y + game.car.h*0.8 &&
        t.lane === game.car.lane) {
      game.gameOver = true;
      game.running  = false;
      if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('drivingHighScore', game.highScore);
      }
      updateLabels();
      setTimeout(()=>{ alert('Game Over! Score: '+game.score); resetGame(); }, 200);
      return;
    }
  }
  game.score++;
  if (game.score > game.highScore) game.highScore = game.score;
  if (game.score % 120 === 0) game.speed += 0.6;
  if (game.score > 0 && game.score % 150 === 0 && !floatingText) {
    const messages = ['Good!', 'Nice!', 'Awesome!', 'Keep Going!', 'Well Done!', 'Pro Racer!', 'Smooth!', 'Bravo!'];
    showFloatingText(messages[Math.floor(Math.random() * messages.length)]);
  }
  if (floatingText) {
    floatingText.y += floatingText.dy;
    floatingText.opacity -= floatingText.fadeRate;
    if (floatingText.opacity <= 0) floatingText = null;
  }
  updateLabels();
  draw();
  requestAnimationFrame(gameLoop);
}
document.getElementById('btnStart').onclick = () => {
  if (game.running && !game.paused) return;
  if (!game.running) resetGame();
  game.running=true; game.paused=false; gameLoop();
};
document.getElementById('btnPause').onclick = () => {
  if (!game.running||game.gameOver) return;
  game.paused = !game.paused;
  if (!game.paused) gameLoop();
};
document.getElementById('btnRestart').onclick = () => {
  resetGame(); game.running=true; game.paused=false; gameLoop();
};

// Keyboard controls
window.addEventListener('keydown', e=>{
  if (!game.running||game.paused||game.gameOver) return;
  if (e.key==='ArrowLeft'){
    if(game.car.lane>0){ game.car.lane--; draw(); }
  }
  if (e.key==='ArrowRight'){
    if(game.car.lane<game.lanes.length-1){ game.car.lane++; draw(); }
  }
  if(e.key==='ArrowUp')   { game.speed=Math.min(game.speed+1.3, 20); }
  if(e.key==='ArrowDown') { game.speed=Math.max(game.speed-1.3, 4);  }
  draw();
});

// ==== MOBILE SWIPE CONTROLS ====
let touchStartX = 0, touchStartY = 0, touchMoved = false;
canvas.addEventListener('touchstart', function(e) {
  if (!game.running||game.paused||game.gameOver) return;
  if(e.touches.length==1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
  }
});
canvas.addEventListener('touchmove', function(e) {
  if (!game.running||game.paused||game.gameOver) return;
  if(e.touches.length==1) {
    let dx = e.touches[0].clientX - touchStartX;
    let dy = e.touches[0].clientY - touchStartY;
    if (touchMoved) return;
    // Horizontal swipe = move lane
    if(Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      if(dx < 0 && game.car.lane>0) {
        game.car.lane--;
        draw();
      } else if(dx > 0 && game.car.lane<game.lanes.length-1) {
        game.car.lane++;
        draw();
      }
      touchMoved = true;
    }
    // Vertical swipe = up/down = speed
    else if(Math.abs(dy) > 35 && Math.abs(dy) > Math.abs(dx)) {
      if(dy < 0) {
        game.speed = Math.min(game.speed+1.3, 20); // Up = Accelerate
      }
      else if(dy > 0) {
        game.speed = Math.max(game.speed-1.3, 4);  // Down = Brake
      }
      touchMoved = true;
      draw();
    }
  }
});
canvas.addEventListener('touchend', function(e){
  touchMoved = false;
});

resetGame();
