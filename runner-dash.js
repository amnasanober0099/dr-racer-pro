// Runner Dash – Pro Arcade Version (SFX Edition)

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let W = canvas.width, H = canvas.height;

function fitCanvas() {
  let w = Math.min(window.innerWidth * 0.98, 420);
  canvas.width = w;
  canvas.height = Math.max(w * 0.62, 110);
  W = canvas.width;
  H = canvas.height;
  GROUND_Y = H - 42;
}
window.addEventListener('resize', fitCanvas);

// ==== SFX LOADING ====
const jumpSound = document.getElementById("jumpSound");
const slideSound = document.getElementById("slideSound");
const coinSound = document.getElementById("coinSound");
const gameoverSound = document.getElementById("gameoverSound");
// =====================

let GROUND_Y = H-42, GRAVITY = 0.6, JUMP_VEL = -10, SLIDE_TIME = 34, SPEED=4;
const PLAYER = {x:50,y:GROUND_Y-38,w:30,h:38,vy:0,isJumping:false,isSliding:false,slideTimer:0, canJump:true};
let obstacles=[], coins=[], score=0, coinsCount=0, frame=0, gameState="ready", steps=0;

const COMPLIMENTS = [
  "Great! 🎉", "Awesome! 🚀", "Nice!", "Superb!", "Amazing!", "Go!", "Legendary!", "Cool!", "Keep Going!", "Epic!"
];

function initVars() {
  fitCanvas();
  PLAYER.y = GROUND_Y-38; PLAYER.vy = 0; PLAYER.isJumping=false; PLAYER.isSliding=false; PLAYER.canJump=true;
  score = 0; coinsCount = 0; frame = 0; steps = 0;
  obstacles=[]; coins=[];
  document.getElementById("game-status").textContent="";
  document.getElementById("score").textContent=score;
  document.getElementById("coins").textContent=coinsCount;
  document.getElementById("steps").textContent=steps;
}
function setReady() {
  gameState = "ready";
  initVars();
  drawGame();
}
function startGame() {
  if(gameState==="playing") return;
  initVars();
  gameState = "playing";
  requestAnimationFrame(gameLoop);
}
function restartGame() {
  setReady();
}
document.getElementById('btnStart').onclick = startGame;
document.getElementById('btnRestart').onclick = restartGame;

function spawnObstacle() {
  let types = [
    {w:26,h:30,y:GROUND_Y-30,type:'block'},
    {w:24,h:44,y:GROUND_Y-44,type:'tall'},
  ];
  let o = Math.random()>0.55 ? types[1] : types[0];
  obstacles.push({x:W+8,w:o.w,h:o.h,y:o.y,type:o.type,scored:false});
}
function spawnCoin() {
  let y = [GROUND_Y-60, GROUND_Y-110, GROUND_Y-30][Math.floor(Math.random()*3)];
  coins.push({x:W+8, y:y, r:12, collected:false});
}
function updateGame() {
  frame++;
  // --- Move player
  if(PLAYER.isJumping) {
    PLAYER.vy += GRAVITY;
    PLAYER.y += PLAYER.vy;
    if(PLAYER.y >= GROUND_Y-38) {
      PLAYER.y = GROUND_Y-38;
      PLAYER.isJumping = false; PLAYER.vy=0;
      PLAYER.canJump = true;
    }
  }
  if(PLAYER.isSliding) {
    PLAYER.slideTimer--;
    if(PLAYER.slideTimer<=0) PLAYER.isSliding=false;
  }
  // --- Move obstacles
  obstacles.forEach(o=>o.x-=SPEED);
  coins.forEach(c=>c.x-=SPEED);
  obstacles = obstacles.filter(o=>o.x+o.w>0);
  coins = coins.filter(c=>c.x+c.r>0 && !c.collected);
  // Spawn new
  if(frame%63===0) spawnObstacle();
  if(frame%51===0 && Math.random()>0.2) spawnCoin();
  // --- Collision check
  obstacles.forEach(o=>{
    if(
      PLAYER.x+PLAYER.w-7 > o.x && PLAYER.x+7 < o.x+o.w &&
      PLAYER.y+PLAYER.h > o.y && PLAYER.y < o.y+o.h
    ) {
      if(o.type==="block" && !PLAYER.isJumping) gameOver();
      if(o.type==="tall" && !PLAYER.isSliding) gameOver();
    }
    if(!o.scored && o.x+o.w<PLAYER.x) {
      steps++;
      document.getElementById("steps").textContent=steps;
      o.scored=true;
      if(steps%5===0) showCompliment();
    }
  });
  coins.forEach(c=>{
    if(!c.collected &&
      PLAYER.x+PLAYER.w-12 > c.x && PLAYER.x+12 < c.x+c.r &&
      PLAYER.y+PLAYER.h-8 > c.y && PLAYER.y+8 < c.y+c.r
    ) {
      c.collected=true;
      coinsCount++;
      document.getElementById("coins").textContent=coinsCount;
      if(coinSound) { coinSound.currentTime = 0; coinSound.play(); }
      if(Math.random()>0.52) showCompliment();
    }
  });
  // --- Score
  if(frame%4===0 && gameState==="playing") {
    score++;
    document.getElementById("score").textContent=score;
    if(score>0 && score%150===0) showCompliment("LEVEL UP!");
  }
}

function showCompliment(msg) {
  const eff = document.getElementById('effect-msg');
  eff.textContent = msg || COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
  eff.classList.add("show");
  setTimeout(() => {
    eff.classList.remove("show");
    eff.textContent = '';
  }, 1100);
}

function drawGame() {
  ctx.clearRect(0,0,W,H);
  let grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,"#181c2b");grad.addColorStop(1,"#292c3c");
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
  // Moving ground
  let groundOffset = (frame*SPEED)%60;
  for(let i=-1;i<W/60+2;i++) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(i*60+30-groundOffset,GROUND_Y+23,28,Math.PI,2*Math.PI);
    ctx.fillStyle="#232c47";
    ctx.globalAlpha=0.16;
    ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle="#17f3ff";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(0,GROUND_Y+1); ctx.lineTo(W,GROUND_Y+1);
  ctx.stroke();
  // Coins
  for(let c of coins) if(!c.collected){
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x,c.y,c.r,0,2*Math.PI);
    ctx.fillStyle="gold";
    ctx.shadowColor="#f7e955"; ctx.shadowBlur=11;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth=2;
    ctx.strokeStyle="#fff";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x-3,c.y-3,c.r/2,0,2*Math.PI);
    ctx.fillStyle="#fff6";
    ctx.fill();
  }
  // Obstacles
  for(let o of obstacles){
    ctx.save();
    ctx.shadowColor="#ff3257";
    ctx.shadowBlur=12;
    ctx.fillStyle=o.type==="block"?"#fd4766":"#c6b8ff";
    ctx.strokeStyle="#fff";
    ctx.lineWidth=2.2;
    ctx.beginPath();
    ctx.rect(o.x,o.y,o.w,o.h);
    ctx.fill(); ctx.stroke();
    ctx.restore();
    if(o.type==="tall"){
      ctx.save();
      ctx.beginPath();
      ctx.arc(o.x+o.w/2,o.y+o.h/2,7,0,2*Math.PI);
      ctx.fillStyle="#3cf17e";
      ctx.globalAlpha=0.38;
      ctx.fill();
      ctx.restore();
    }
  }
  // Player
  ctx.save();
  ctx.shadowColor="#17f3ff";
  ctx.shadowBlur=19;
  ctx.fillStyle=PLAYER.isSliding?"#f12fbb":(PLAYER.isJumping?"#fae055":"#18ffd2");
  ctx.beginPath();
  ctx.ellipse(PLAYER.x+PLAYER.w/2,PLAYER.y+PLAYER.h/2,PLAYER.w/2,PLAYER.h/2,0,0,2*Math.PI);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(PLAYER.x+PLAYER.w/2+7,PLAYER.y+PLAYER.h/2-3,3.2,0,2*Math.PI);
  ctx.fillStyle="#222";
  ctx.globalAlpha=0.79;
  ctx.fill();
  ctx.restore();
  if(gameState==="over"){
    ctx.save();
    ctx.fillStyle="rgba(22,14,44,0.73)";
    ctx.fillRect(0,0,W,H);
    ctx.font="2rem Orbitron";
    ctx.fillStyle="#f12fbb";
    ctx.textAlign="center";
    ctx.fillText("GAME OVER",W/2,H/2-10);
    ctx.font="1.12rem Russo One";
    ctx.fillStyle="#fff";
    ctx.fillText("Press Restart",W/2,H/2+28);
    ctx.restore();
  } else if(gameState==="ready") {
    ctx.save();
    ctx.font="1.25rem Orbitron";
    ctx.fillStyle="#fff";
    ctx.textAlign="center";
    ctx.globalAlpha=0.87;
    ctx.fillText("Press Start to Play!", W/2, H/2+15);
    ctx.restore();
  }
}

function gameOver() {
  gameState="over";
  document.getElementById("game-status").textContent="Game Over! Press Restart.";
  showCompliment("Game Over!");
  if(gameoverSound) { gameoverSound.currentTime = 0; gameoverSound.play(); }
}

// --- Controls ---
document.addEventListener("keydown",e=>{
  if(gameState!=="playing") return;
  if((e.code==="Space" || e.key==="w" || e.key==="W") && !PLAYER.isJumping && !PLAYER.isSliding && PLAYER.canJump) {
    PLAYER.isJumping=true; PLAYER.vy=JUMP_VEL;
    PLAYER.canJump = false;
    if(jumpSound) { jumpSound.currentTime = 0; jumpSound.play(); }
  }
  if((e.key==="s"||e.key==="S"||e.key==="ArrowDown") && !PLAYER.isSliding && !PLAYER.isJumping) {
    PLAYER.isSliding=true; PLAYER.slideTimer=SLIDE_TIME;
    if(slideSound) { slideSound.currentTime = 0; slideSound.play(); }
  }
});
document.addEventListener("touchstart",e=>{
  if(gameState!=="playing") return;
  if(e.touches.length===1){
    if(!PLAYER.isJumping && !PLAYER.isSliding && PLAYER.canJump) {
      PLAYER.isJumping=true; PLAYER.vy=JUMP_VEL;
      PLAYER.canJump = false;
      if(jumpSound) { jumpSound.currentTime = 0; jumpSound.play(); }
    }
  } else if(e.touches.length===2) {
    if(!PLAYER.isSliding && !PLAYER.isJumping){
      PLAYER.isSliding=true; PLAYER.slideTimer=SLIDE_TIME;
      if(slideSound) { slideSound.currentTime = 0; slideSound.play(); }
    }
  }
});

function gameLoop() {
  if(gameState==="playing") updateGame();
  drawGame();
  if(gameState==="playing") requestAnimationFrame(gameLoop);
}

window.onload = ()=>{
  fitCanvas();
  setReady();
};
