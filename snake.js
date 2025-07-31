/*****  PRO ARCADE • NEON RAINBOW SNAKE (MOBILE V4 + SFX + Touch Buttons)  *****/
const cvs   = document.getElementById('snakeCanvas');
const ctx   = cvs.getContext('2d');
const CELL  = 20, GRID = cvs.width / CELL;

// --- SOUND EFFECTS
const eatSound = document.getElementById('eatSound');
const gameOverSound = document.getElementById('gameOverSound');

let snake, dir, food, score,
    best = Number(localStorage.getItem('snakeBest')||0),
    running=false, paused=false, hue=0;

// --- BUTTON HOOKUP ---
window.startGame   = startGame;
window.togglePause = togglePause;
window.restartGame = restartGame;

/* FOOD */
function spawnFood(){
  do{ food={x:rand(GRID),y:rand(GRID)}; }while(snake.some(s=>eq(s,food)));
}
function rand(n){ return Math.floor(Math.random()*n); }
function eq(a,b){ return a.x===b.x&&a.y===b.y; }

/* RESET / START */
function resetGame(){
  snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
  dir={x:1,y:0}; score=0; spawnFood(); hue=0; updateHUD(); draw();
}
function startGame(){ if(!running){resetGame();} running=true; paused=false; }
function togglePause(){ if(!running) return; paused=!paused; }
function restartGame(){ resetGame(); running=true; paused=false; }

/* DRAW */
function drawGrid(){
  ctx.strokeStyle='#142145'; ctx.lineWidth=1;
  for(let i=0;i<=GRID;i++){
    ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,cvs.height);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(cvs.width,i*CELL);ctx.stroke();
  }
}
function draw(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  drawGrid();

  // --- Rainbow snake ---
  ctx.shadowBlur = 15;
  snake.forEach((seg,i)=>{
    const segHue = (hue + i*18) % 360;
    ctx.fillStyle = `hsl(${segHue}, 100%, 55%)`;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(seg.x*CELL, seg.y*CELL, CELL, CELL);
  });
  ctx.shadowBlur = 0;

  // --- Food: neon pulse
  const pulse = 0.65 + 0.33 * Math.sin(Date.now()/200);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#f12fbb';
  ctx.fillRect(food.x*CELL, food.y*CELL, CELL, CELL);
  ctx.globalAlpha = 1;
}

/* STEP */
function step(){
  if(!running||paused) return;

  const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
  if(head.x<0||head.y<0||head.x>=GRID||head.y>=GRID|| snake.some(s=>eq(s,head))){
    running=false;
    setTimeout(()=>{
      gameOverSound.currentTime = 0;
      gameOverSound.play();
      setTimeout(()=>{
        alert(`Game Over!\nScore: ${score}`);
      }, 60);
    },110); 
    return;
  }
  snake.unshift(head);

  if(eq(head,food)){
    score++; 
    if (eatSound) { eatSound.currentTime = 0; eatSound.play(); }
    if(score>best){best=score;localStorage.setItem('snakeBest',best);}
    spawnFood();
  }else{ snake.pop(); }

  hue = (hue + 8) % 360;   // shift colours
  updateHUD(); draw();
}

/* HUD */
const sLbl=document.getElementById('scoreLabel'),
      bLbl=document.getElementById('highScoreLabel');
function updateHUD(){ sLbl.textContent=`Score: ${score}`; bLbl.textContent=`Best: ${best}`; }

/* INPUT */
window.addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  if(e.key==='ArrowUp'   && dir.y!==1 ) dir={x:0,y:-1};
  if(e.key==='ArrowDown' && dir.y!==-1) dir={x:0,y:1};
  if(e.key==='ArrowLeft' && dir.x!==1 ) dir={x:-1,y:0};
  if(e.key==='ArrowRight'&& dir.x!==-1) dir={x:1,y:0};
  if(e.key===' ') togglePause();
},{ passive:false });

/* --- MOBILE SWIPE / TOUCH --- */
let start=null;
cvs.addEventListener('touchstart',e=>{
  if(e.touches.length===1){
    start={x:e.touches[0].clientX,y:e.touches[0].clientY};
  }
}, {passive:true});
cvs.addEventListener('touchend',e=>{
  if(!start) return;
  let end={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};
  const dx=end.x-start.x,dy=end.y-start.y;
  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>10){
    if(dx>0&&dir.x!==-1) dir={x:1,y:0};
    if(dx<0&&dir.x!==1)  dir={x:-1,y:0};
  }else if(Math.abs(dy)>10){
    if(dy>0&&dir.y!==-1) dir={x:0,y:1};
    if(dy<0&&dir.y!==1)  dir={x:0,y:-1};
  }
  start=null;
}, {passive:true});

/* --- ON-SCREEN CONTROLS (ARROWS) FOR MOBILE --- */
function makeArrowPad(){
  if(document.getElementById('snakeTouchPad')) return;
  let pad = document.createElement('div');
  pad.id = 'snakeTouchPad';
  pad.style = 'position:fixed;bottom:17px;left:0;width:100vw;z-index:33;display:flex;justify-content:center;pointer-events:auto;';
  pad.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:3px;">
      <button class="btn btn-dark" id="arrU" style="opacity:0.85;width:54px;height:44px;"><i class="fas fa-arrow-up"></i></button>
      <div style="display:flex;justify-content:space-between;gap:3px;">
        <button class="btn btn-dark" id="arrL" style="opacity:0.85;width:44px;height:44px;"><i class="fas fa-arrow-left"></i></button>
        <button class="btn btn-dark" id="arrR" style="opacity:0.85;width:44px;height:44px;"><i class="fas fa-arrow-right"></i></button>
      </div>
      <button class="btn btn-dark" id="arrD" style="opacity:0.85;width:54px;height:44px;"><i class="fas fa-arrow-down"></i></button>
    </div>
  `;
  document.body.appendChild(pad);

  document.getElementById('arrU').addEventListener('touchstart', e=>{ if(dir.y!==1) dir={x:0,y:-1}; e.preventDefault(); },{passive:false});
  document.getElementById('arrD').addEventListener('touchstart', e=>{ if(dir.y!==-1) dir={x:0,y:1}; e.preventDefault(); },{passive:false});
  document.getElementById('arrL').addEventListener('touchstart', e=>{ if(dir.x!==1) dir={x:-1,y:0}; e.preventDefault(); },{passive:false});
  document.getElementById('arrR').addEventListener('touchstart', e=>{ if(dir.x!==-1) dir={x:1,y:0}; e.preventDefault(); },{passive:false});
}
if(window.innerWidth<650) setTimeout(makeArrowPad, 500);

/* Prevent page scroll on swipe over canvas/mobile pad */
['touchmove','touchstart','touchend'].forEach(ev=>{
  cvs.addEventListener(ev, e=>e.stopPropagation(), {passive:false});
});

/* PAUSE ON HIDDEN (focus loss) */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden && running) paused=true;
});

/* MAIN LOOP */
resetGame();
setInterval(step,160);
function anim(){ draw(); requestAnimationFrame(anim);} anim();
