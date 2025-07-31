// === SKY ROCKET ASSAULT – Pro Arcade ===
// Responsive Jet Shooter with Full Mobile Touch Support

const cvs = document.getElementById('planeCanvas');
const ctx = cvs.getContext('2d');

const lblScore = document.getElementById('scoreLabel');
const lblHi    = document.getElementById('highScoreLabel');
const lblLives = document.getElementById('livesLabel');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');

// ======= GAME SETTINGS (DIFFICULT MODE) ======
const JET = 46; // small size for mobile
const ENEMY = {w:38,h:38,v:3.5,gap:28};
const MISSILE = {w:8,h:23,s:15};
const BULLET = {w:5,h:14,s:8};
const MAX_LIVES = 3;
const SPEED_RAMP_EVERY = 450;

let player, missiles, enemies, bullets, sparks;
let keys = {};
let score = 0, hi = 0, lives = MAX_LIVES, f = 0;
let playing = false, paused = false, gameWon = false;
let leaderboard = JSON.parse(localStorage.getItem('arcade_plane_lb')||'[]');

// ==== TOUCH CONTROLS VARS ====
let touchStart = null;
let moveDir = { x:0, y:0 };
let fireButtonPressed = false;

// ==== GAME RESET, HUD, ETC ====
function reset(){
  player={x:cvs.width/2-JET/2, y:cvs.height-80, w:JET, h:JET, fireCD:0};
  missiles=[]; enemies=[]; bullets=[]; sparks=[];
  score=0; lives=MAX_LIVES; f=0; gameWon=false; updHUD();
}
function updHUD(){
  lblScore.textContent=`Score: ${score}`;
  lblHi.textContent   =`High Score: ${hi}`;
  lblLives.textContent=`Lives: ${lives}`;
}
addEventListener('keydown',e=>{
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  keys[e.key]=true;
});
addEventListener('keyup',e=>keys[e.key]=false);

btnStart.onclick = ()=>!playing&&(playing=true,paused=false,reset(),loop());
btnPause.onclick = ()=>playing&&(paused=!paused);
btnRestart.onclick=()=>{playing=true;paused=false;reset();loop();};

function loop(){if(!playing)return;if(!paused){update();draw();}requestAnimationFrame(loop);}
function update(){
  f++;
  if(f%SPEED_RAMP_EVERY===0) ENEMY.v+=0.22;

  // --- Player movement (arrow keys OR mobile touch) ---
  const v=7.2;
  let dx=0, dy=0;
  if(keys['ArrowLeft'] || moveDir.x < -0.25) dx=-v;
  if(keys['ArrowRight']|| moveDir.x > 0.25) dx=v;
  if(keys['ArrowUp']   || moveDir.y < -0.25) dy=-v;
  if(keys['ArrowDown'] || moveDir.y > 0.25) dy=v;
  player.x = Math.max(0, Math.min(cvs.width-player.w, player.x+dx));
  player.y = Math.max(0, Math.min(cvs.height-player.h, player.y+dy));

  // --- Player rocket fire (space or fire button/tap) ---
  if((keys[' '] || fireButtonPressed) && player.fireCD<=0){
    missiles.push({x:player.x+player.w/2-MISSILE.w/2, y:player.y-8, w:MISSILE.w, h:MISSILE.h, v:MISSILE.s});
    player.fireCD=10;
  }
  if(player.fireCD>0) player.fireCD--;

  // Missiles move
  for(let i=missiles.length-1;i>=0;i--){ missiles[i].y-=MISSILE.s; if(missiles[i].y<-MISSILE.h) missiles.splice(i,1); }

  // Spawn enemy (difficult, fast respawn)
  if(f%ENEMY.gap===0 && !gameWon){
    enemies.push({x:Math.random()*(cvs.width-ENEMY.w),y:-ENEMY.h,w:ENEMY.w,h:ENEMY.h,v:ENEMY.v,fireDelay:26+Math.random()*12});
  }
  // Enemies update
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i]; e.y+=e.v;
    e.fireDelay--;
    if(e.fireDelay<=0){
      bullets.push({x:e.x+e.w/2-BULLET.w/2, y:e.y+e.h, w:BULLET.w, h:BULLET.h});
      e.fireDelay=45+Math.random()*23;
    }
    if(e.y>cvs.height+ENEMY.h) enemies.splice(i,1);
  }
  // Bullets move
  for(let i=bullets.length-1;i>=0;i--){ bullets[i].y+=BULLET.s; if(bullets[i].y>cvs.height) bullets.splice(i,1); }

  // Missile × enemy
  for(let mi=missiles.length-1;mi>=0;mi--){
    const m=missiles[mi];
    for(let ei=enemies.length-1;ei>=0;ei--){
      const e=enemies[ei];
      if(hit(m,e)){
        boom(e.x+e.w/2,e.y+e.h/2,"#ffd400"); missiles.splice(mi,1); enemies.splice(ei,1); score+=3; updHUD(); break;
      }
    }
  }
  // Player hit by enemy / bullet
  for(let ei=enemies.length-1;ei>=0;ei--) if(hit(player,enemies[ei])) crash(ei);
  for(let bi=bullets.length-1;bi>=0;bi--) if(hit(player,bullets[bi])){bullets.splice(bi,1);crash();}

  // Sparks
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.x+=s.vx;s.y+=s.vy;s.life--;if(!s.life)sparks.splice(i,1);}
  // Win
  if(!gameWon && enemies.length==0 && f>200 && f%ENEMY.gap>ENEMY.gap-2){
    gameWon=true; playing=false; setTimeout(showWin,450);
  }
}
function crash(removeEnemyIndex){
  if(removeEnemyIndex!==undefined) enemies.splice(removeEnemyIndex,1);
  boom(player.x+player.w/2,player.y+player.h/2,"#ffe1aa");
  if(--lives<=0){gameOver();} updHUD();
}
function draw(){
  // BG gradient
  const g=ctx.createLinearGradient(0,0,0,cvs.height);g.addColorStop(0,'#060015');g.addColorStop(1,'#150080');
  ctx.fillStyle=g;ctx.fillRect(0,0,cvs.width,cvs.height);

  // Missiles (player)
  missiles.forEach(m=>{
    ctx.save();
    ctx.shadowColor="#ffe500";ctx.shadowBlur=18;
    ctx.fillStyle='#fffde4';ctx.fillRect(m.x,m.y,m.w,m.h-7);
    ctx.shadowBlur=0;ctx.fillStyle='#ffc400';ctx.fillRect(m.x+1,m.y+m.h-8,m.w-2,9);
    ctx.restore();
  });

  // Player's neon jet
  neonJet(player.x,player.y,'#19faff',true);

  // Enemies (plane shaped)
  enemies.forEach(e=>neonJet(e.x,e.y,'#ff367f',false));

  // Bullets (enemy only)
  bullets.forEach(b=>{
    ctx.save();
    ctx.shadowColor="#f12fbb";ctx.shadowBlur=10;
    ctx.fillStyle='#f12fbb';ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.restore();
  });

  // Flame effect (player rocket fire)
  if((keys[' '] || fireButtonPressed) && missiles.length){
    ctx.save();
    ctx.globalAlpha = .7 + Math.random()*.2;
    ctx.beginPath();
    ctx.ellipse(player.x+player.w/2,player.y+player.h+13,8+Math.random()*2,16+Math.random()*6,0,0,Math.PI*2);
    ctx.fillStyle='rgba(255,220,55,.22)';
    ctx.shadowColor = "#fff600"; ctx.shadowBlur=12;
    ctx.fill();
    ctx.restore();
  }

  // Sparks/Explosion
  sparks.forEach(s=>{
    ctx.save();
    ctx.globalAlpha = s.life/16;
    ctx.fillStyle = s.col||"#fffab0";
    ctx.beginPath();ctx.arc(s.x,s.y,3,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
}
// --- Neon Jet Drawing ---
function neonJet(x,y,color,isPlayer){
  ctx.save();
  ctx.translate(x+JET/2,y+JET/2);
  if(!isPlayer) ctx.rotate(Math.PI);
  ctx.shadowColor=color; ctx.shadowBlur=13;
  ctx.beginPath();
  ctx.moveTo(0, -JET/2+3); // nose
  ctx.lineTo(JET*.19, 5); // right wing
  ctx.lineTo(0, JET*.36); // tail
  ctx.lineTo(-JET*.19, 5); // left wing
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = isPlayer ? .96 : .80;
  ctx.fill();
  ctx.shadowBlur=0; ctx.globalAlpha=1;
  if(isPlayer){
    ctx.beginPath();
    ctx.ellipse(0, -JET/4.1, JET*.12, JET*.20, 0, 0, Math.PI*2);
    ctx.fillStyle="#fff";
    ctx.globalAlpha=.18;
    ctx.fill();
    ctx.globalAlpha=1;
    ctx.save();
    ctx.globalAlpha=.5;
    ctx.beginPath();
    ctx.ellipse(0,JET*.38,JET*.13, JET*.18, 0,0,Math.PI*2);
    ctx.fillStyle='#ffe766';
    ctx.shadowColor='#ffd34a';
    ctx.shadowBlur=7;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function hit(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function boom(x,y,col){
  for(let i=0;i<10;i++){
    let th=Math.random()*2*Math.PI, sp=2+Math.random()*2;
    sparks.push({x,y,vx:Math.cos(th)*sp,vy:Math.sin(th)*sp,life:12,col});
  }
}
function gameOver(){
  playing=false; hi=Math.max(hi,score); updHUD();
  saveScore();
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.72)';
  ctx.fillRect(0,0,cvs.width,cvs.height);
  ctx.fillStyle='#fff';
  ctx.textAlign='center';
  ctx.font='bold 34px Orbitron, monospace';
  ctx.fillText('GAME OVER',cvs.width/2,cvs.height/2-18);
  ctx.font='22px Orbitron, monospace';
  ctx.fillText(`Score ${score}`,cvs.width/2,cvs.height/2+26);
  ctx.restore();
}
function showWin(){
  hi=Math.max(hi,score); updHUD();
  saveScore();
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.67)';
  ctx.fillRect(0,0,cvs.width,cvs.height);
  ctx.textAlign='center';
  ctx.font='bold 38px Orbitron, monospace';
  ctx.fillStyle='#ffd600';
  ctx.shadowColor="#fff";
  ctx.shadowBlur=16;
  ctx.fillText('ALL RAFALE DOWN!',cvs.width/2,cvs.height/2-16);
  ctx.shadowBlur=0;
  ctx.font='22px Orbitron, monospace';
  ctx.fillStyle='#fff';
  ctx.fillText(`Score ${score}`,cvs.width/2,cvs.height/2+28);
  ctx.restore();
}
/* === RESPONSIVE === */
function fit(){
  const w=document.querySelector('.plane-canvas').parentElement.clientWidth;
  cvs.width=Math.min(700,w-20);cvs.height=340;
}
addEventListener('resize',fit);fit();
reset();

/* === LEADERBOARD === */
function saveScore(){
  if(!score) return;
  let name = prompt("Game Over! Enter your name:") || "Player";
  leaderboard.push({name,score});
  leaderboard.sort((a,b)=>b.score-a.score);
  leaderboard=leaderboard.slice(0,10);
  localStorage.setItem('arcade_plane_lb',JSON.stringify(leaderboard));
}
function renderLeaderboard(){
  let html = '<ol style="padding-left:1.2rem;font-size:1.06rem;">';
  leaderboard.forEach(e=>{
    html += `<li><b>${e.name}</b> – <span style="color:var(--primary);">${e.score}</span></li>`;
  });
  if(!leaderboard.length) html = "<i>No records yet.</i>";
  document.getElementById("leaderboardList").innerHTML = html;
}
window.renderLeaderboard = renderLeaderboard;

updHUD();

// ========================
// === MOBILE CONTROLS ====
// ========================

// --- On mobile: swipe/drag to move, tap (anywhere) to fire rocket

cvs.addEventListener('touchstart', e => {
  if(!playing) return;
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
  moveDir = { x:0, y:0 };
}, {passive:false});

cvs.addEventListener('touchmove', e => {
  if(!playing || !touchStart) return;
  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  moveDir.x = dx/60; // the divisor makes it less sensitive
  moveDir.y = dy/60;
  e.preventDefault();
}, {passive:false});

cvs.addEventListener('touchend', e => {
  if(!playing) return;
  // Fire rocket on tap or short swipe
  fireButtonPressed = true;
  setTimeout(()=>fireButtonPressed = false, 120);
  // Reset move direction
  moveDir = { x:0, y:0 };
  touchStart = null;
}, {passive:false});

// --- For quick tap anywhere to fire (even if not on canvas)
document.body.addEventListener('touchend', e=>{
  if(!playing) return;
  fireButtonPressed = true;
  setTimeout(()=>fireButtonPressed = false, 120);
},{passive:true});

