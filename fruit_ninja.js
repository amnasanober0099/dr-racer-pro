const compliments = [
  "Nice Move! 🎉", "Awesome! 💥", "Good!", "Amazing!", "Wow!", "Great!", "Perfect!", "Sweet!", "Unstoppable!"
];
const EMOJIS = ['🍎','🍌','🍊','🍉','🍇','🍓','🍋','🍐','🍍','🥝','🍒'];
const FRUIT_COLORS = ['#ff3c48','#ffd600','#ff9100','#1cc2ff','#b055e5','#38e52c','#ff36d2'];
const BOMB_COLOR = '#222';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl  = document.getElementById('score');
const livesEl  = document.getElementById('lives');
const effectMsg = document.getElementById('effect-msg');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let WIDTH=0, HEIGHT=0;
let fruits = [], swipe = [], splashes = [], score = 0, lives = 3;
let spawnTimer, running = false, gameOver = false;

function resizeCanvas() {
  const wrap = document.querySelector('.game-box');
  const dpr = window.devicePixelRatio || 1;
  let w = Math.round(wrap.clientWidth * 0.94);
  let h = Math.round(w * 0.72);
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(dpr, dpr);
    WIDTH = w; HEIGHT = h;
  }
}
window.addEventListener('resize', resizeCanvas);

class Fruit {
  constructor(opts={}) {
    this.x = opts.x ?? (WIDTH*0.15 + Math.random()*WIDTH*0.70);
    this.y = opts.y ?? HEIGHT+20;
    this.vx = (opts.vx ?? (Math.random()*5.2-2.6)) * (WIDTH/370);
    this.vy = opts.vy ?? (-(Math.random()*6+9)*(HEIGHT/400));
    this.type = opts.type ?? (Math.random() < 0.13 ? 'bomb' : 'fruit');
    this.sliced = false;
    this.emoji = (this.type==='bomb') ? '💣' : EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = ((Math.random()-0.5)*0.14);
    this.color = this.type==='fruit' ? FRUIT_COLORS[Math.floor(Math.random()*FRUIT_COLORS.length)] : BOMB_COLOR;
    this.size = Math.max(WIDTH,HEIGHT) * (this.type==='bomb' ? 0.072 : 0.098);
  }
  update(){
    this.vy += 0.28*(HEIGHT/400); // gravity
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rotSpeed;
  }
  draw(){
    const size = this.size;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = this.type==='bomb' ? '#111' : this.color;
    ctx.shadowBlur = 12;
    if(this.type==='fruit') {
      ctx.beginPath();
      ctx.arc(0,0,size/2.12,0,Math.PI*2);
      ctx.strokeStyle = this.color+"80";
      ctx.lineWidth = size*0.13;
      ctx.stroke();
    }
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, 0, 0);
    ctx.restore();
  }
  offScreen(){ return this.y - this.size/2 > HEIGHT+24; }
}

function drawSplashes(){
  for (let i=splashes.length-1; i>=0; i--) {
    let s = splashes[i];
    const t = (Date.now()-s.time)/370;
    if (t > 1) { splashes.splice(i,1); continue; }
    ctx.save();
    ctx.globalAlpha = 1-t;
    ctx.beginPath();
    for (let j=0;j<8;j++) {
      let ang = (Math.PI*2)*j/8 + s.ang;
      let r2 = s.radius + 13*t;
      let x2 = s.x + Math.cos(ang)*r2, y2 = s.y + Math.sin(ang)*r2;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5+5*(1-t);
    ctx.stroke();
    ctx.restore();
  }
}
function spawnBunch() {
  if (gameOver || !running) return;
  let n = Math.floor(Math.random()*2.5)+1;
  for(let i=0;i<n;i++) {
    setTimeout(()=>fruits.push(new Fruit()), i*185);
  }
}
function spawnLoop() {
  spawnBunch();
  spawnTimer = setTimeout(spawnLoop, 870+Math.random()*480);
}
function showCompliment(msg) {
  if(!msg) msg = compliments[Math.floor(Math.random()*compliments.length)];
  effectMsg.textContent = msg;
  effectMsg.classList.add('show');
  setTimeout(()=>effectMsg.classList.remove('show'), 1100);
}
function initGame() {
  resizeCanvas();
  fruits = []; swipe = []; splashes = []; score = 0; lives = 3; gameOver = false; running=false;
  updateHUD();
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  effectMsg.textContent="";
  startBtn.disabled = false;
}
function startGame() {
  if(running) return;
  running = true; gameOver = false;
  fruits = []; swipe = []; splashes = []; score = 0; lives = 3;
  updateHUD();
  effectMsg.textContent="";
  if (spawnTimer) clearTimeout(spawnTimer);
  spawnLoop();
  requestAnimationFrame(loop);
  startBtn.disabled = true;
}
function endGame() {
  gameOver=true; running = false;
  if (spawnTimer) clearTimeout(spawnTimer);
  showCompliment("Game Over!");
  playBombSound(); // <-- play bomb sound when game ends (on bomb slice)
  setTimeout(()=>{ startBtn.disabled = false; }, 650);
}
function restartGame() {
  initGame();
  setTimeout(()=>{startGame();},120);
}
function updateHUD() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${lives}`;
}
function drawSwipe() {
  if (swipe.length < 2) return;
  ctx.save();
  for (let i=0;i<swipe.length-1;i++) {
    const alpha = Math.max(0.17, 1-(Date.now()-swipe[i].t)/111);
    ctx.strokeStyle = `rgba(23,243,255,${alpha})`;
    ctx.lineWidth = Math.max(3,WIDTH*0.012) * (alpha);
    ctx.beginPath();
    ctx.moveTo(swipe[i].x, swipe[i].y);
    ctx.lineTo(swipe[i+1].x, swipe[i+1].y);
    ctx.stroke();
  }
  ctx.restore();
}
function loop() {
  if (!running) return;
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  fruits.forEach(f => { f.update(); f.draw(); });
  fruits = fruits.filter(f => {
    // Missed a fruit
    if (f.offScreen() && !f.sliced && f.type === 'fruit') {
      lives--; updateHUD(); showCompliment("Missed!");
      playMissSound(); // <-- play miss sound when fruit missed
    }
    return !(f.offScreen() || f.sliced);
  });
  drawSplashes();
  drawSwipe();
  if (swipe.length > 1) {
    for (let f of fruits) {
      if (f.sliced) continue;
      for (let i = 0; i < swipe.length-1; i++) {
        const p1 = swipe[i], p2 = swipe[i+1];
        if (distToSegment(f, p1, p2) < f.size/2.05) {
          f.sliced = true;
          if (f.type === 'bomb') {
            playBombSound(); // <-- play bomb sound
            return endGame();
          }
          score++;
          splashes.push({
            x:f.x, y:f.y, color:f.color, time:Date.now(), radius:13+Math.random()*13, ang:Math.random()*Math.PI*2
          });
          updateHUD();
          showCompliment();
          playSliceSound(); // <-- play slice sound on slicing fruit
          break;
        }
      }
    }
  }
  swipe = swipe.filter(p => Date.now() - p.t < 111);
  if (lives <= 0) return endGame();
  requestAnimationFrame(loop);
}
function pointerXY(e) {
  const rect = canvas.getBoundingClientRect();
  let x, y;
  if (e.touches && e.touches.length) {
    x = (e.touches[0].clientX - rect.left) * (WIDTH / rect.width);
    y = (e.touches[0].clientY - rect.top) * (HEIGHT / rect.height);
  } else {
    x = (e.clientX - rect.left) * (WIDTH / rect.width);
    y = (e.clientY - rect.top) * (HEIGHT / rect.height);
  }
  return { x, y };
}
canvas.onpointerdown = e => { if(!running) return; let p = pointerXY(e); swipe.push({ x:p.x, y:p.y, t:Date.now() });};
canvas.onpointermove = e => {
  if(!running) return;
  if (e.buttons || e.pressure>0.1 || e.pointerType==='touch') {
    let p = pointerXY(e);
    swipe.push({ x:p.x, y:p.y, t:Date.now() });
  }
};
canvas.ontouchstart = e => {
  if(!running) return;
  for(let t of e.touches) {
    let p = pointerXY({touches: [t]});
    swipe.push({ x:p.x, y:p.y, t:Date.now() });
  }
};
canvas.ontouchmove = canvas.onpointermove;
function distToSegment(f, p1, p2){
  const x0=f.x, y0=f.y,
        x1=p1.x, y1=p1.y, x2=p2.x, y2=p2.y,
        dx=x2-x1, dy=y2-y1,
        t = Math.max(0, Math.min(1,
            ((x0-x1)*dx + (y0-y1)*dy) / (dx*dx+dy*dy)
        )),
        x = x1 + dx*t, y = y1 + dy*t;
  return Math.hypot(x0-x, y0-y);
}
startBtn.onclick = startGame;
restartBtn.onclick = restartGame;

window.onload = () => {
  initGame();
  resizeCanvas();
};
window.addEventListener('resize', resizeCanvas);
