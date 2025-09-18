const shootSound = document.getElementById('shootSound');
const blockBreakSound = document.getElementById('blockBreakSound');
const pigHitSound = document.getElementById('pigHitSound');
const failSound = document.getElementById('failSound');
const winSound = document.getElementById('winSound');

function playShoot(){ try{ shootSound.currentTime=0; shootSound.play(); }catch(_){} }
function playBlock(){ try{ blockBreakSound.currentTime=0; blockBreakSound.play(); }catch(_){} }
function playPig(){ try{ pigHitSound.currentTime=0; pigHitSound.play(); }catch(_){} }
function playFail(){ try{ failSound.currentTime=0; failSound.play(); }catch(_){} }
function playWin(){ try{ winSound.currentTime=0; winSound.play(); }catch(_){} }

// ====== CANVAS & HiDPI SETUP ======
const canvas = document.getElementById('abCanvas');
const ctx = canvas.getContext('2d');

function sizeCanvasHiDPI(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const w = Math.max(300, Math.round(canvas.clientWidth));
  const h = Math.max(160, Math.round(canvas.clientHeight));
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0); // draw in CSS pixels
  canvas.__cssWidth = w; canvas.__cssHeight = h;
}

let _resizeTick = null;
function scheduleResize(){ if(_resizeTick) return; _resizeTick = requestAnimationFrame(()=>{ _resizeTick=null; onResize(); }); }
window.addEventListener('resize', scheduleResize);
window.addEventListener('orientationchange', scheduleResize);

// ====== LEVEL DATA ======
const levels = [
  { birds:[ {type:'red',color:'#D61C22'}, {type:'red',color:'#D61C22'}, {type:'yellow',color:'#FFD400'} ],
    blocks:[ {x:.66,y:.84,w:.071,h:.06,hp:2}, {x:.74,y:.84,w:.071,h:.06,hp:2}, {x:.705,y:.74,w:.142,h:.055,hp:3} ],
    pigs:[ {x:.74,y:.70,r:.032} ] },
  { birds:[ {type:'red',color:'#D61C22'}, {type:'yellow',color:'#FFD400'}, {type:'blue',color:'#49c7f3'}, {type:'big',color:'#b9463c'} ],
    blocks:[ {x:.60,y:.84,w:.071,h:.06,hp:2}, {x:.67,y:.84,w:.071,h:.06,hp:2}, {x:.74,y:.84,w:.071,h:.06,hp:2}, {x:.63,y:.74,w:.142,h:.055,hp:3}, {x:.70,y:.66,w:.071,h:.05,hp:3} ],
    pigs:[ {x:.67,y:.69,r:.032}, {x:.74,y:.78,r:.029} ] },
  { birds:[ {type:'red',color:'#D61C22'}, {type:'yellow',color:'#FFD400'}, {type:'blue',color:'#49c7f3'}, {type:'big',color:'#b9463c'}, {type:'blue',color:'#49c7f3'} ],
    blocks:[ {x:.60,y:.84,w:.071,h:.06,hp:3}, {x:.67,y:.84,w:.071,h:.06,hp:3}, {x:.74,y:.84,w:.071,h:.06,hp:3}, {x:.62,y:.72,w:.174,h:.05,hp:3}, {x:.65,y:.63,w:.103,h:.047,hp:3} ],
    pigs:[ {x:.67,y:.58,r:.031}, {x:.74,y:.78,r:.029}, {x:.60,y:.78,r:.026} ] }
];
// NOTE: blocks/pigs positions are percentages of canvas (x,y,w,h,r) for perfect scaling.

// ====== GAME STATE ======
let game = { running:false, gameOver:false, level:1, birds:[], slingshot:{}, pigs:[], blocks:[], particles:[], score:0 };
let screenShake = 0;
const messages = ["Nice!","Excellent!","Awesome!","Great Shot!","Perfect!","Good Hit!","Smashed!","Skill!","Kaboom!"];

function showStyleMsg(txt){ const el = document.getElementById('abStyleMsg'); el.textContent=txt; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 900); }

function geom(){
  const W = canvas.__cssWidth, H = canvas.__cssHeight;
  return {
    groundY: H - 35,
    baseX: Math.round(W * 0.16),
    baseY: Math.round(H - 92),
  };
}

function pxX(frac){ return Math.round(frac * canvas.__cssWidth); }
function pxY(frac){ return Math.round(frac * canvas.__cssHeight); }
function pxW(frac){ return Math.round(frac * canvas.__cssWidth); }
function pxH(frac){ return Math.round(frac * canvas.__cssHeight); }

function resetGame(levelIndex=0){
  sizeCanvasHiDPI();
  const L = levels[levelIndex] || levels[0];
  game.level = levelIndex+1;
  game.running = false; game.gameOver = false; game.score = 0; game.particles.length = 0;

  const g = geom();
  game.birds = L.birds.map(b=>({ x:g.baseX, y:g.baseY, vx:0, vy:0, flying:false, hit:false, fade:1, t:0, type:b.type, color:b.color, splitUsed:false, speeded:false }));
  game.slingshot = { x:g.baseX, y:g.baseY, pullX:g.baseX, pullY:g.baseY, pulling:false, ready:true, fade:1 };

  game.blocks = L.blocks.map(blk=>({ x:pxX(blk.x), y:pxY(blk.y), w:pxW(blk.w), h:pxH(blk.h), hp:blk.hp, vx:0, vy:0 }));
  game.pigs   = L.pigs.map(p=>({ x:pxX(p.x), y:pxY(p.y), r:Math.max(14, pxW(p.r)), alive:true, vx:0, vy:0, dizzy:0 }));

  updateLabels(); draw(); hideOverlay();
}

function updateLabels(){
  document.getElementById('scoreLabel').textContent = 'Score: ' + game.score;
  document.getElementById('levelLabel').textContent = 'Level: ' + game.level;
}

// ====== DRAWING ======
function drawParallaxBg(){
  const W = canvas.__cssWidth, H = canvas.__cssHeight;
  let t = performance.now() / 13000;
  let grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#fffbe4'); grad.addColorStop(.5,'#b8e6fa'); grad.addColorStop(1,'#91bbdf');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.globalAlpha = .21; ctx.beginPath(); ctx.arc(95, 70, 55, 0, 2*Math.PI); ctx.fillStyle='#fff8c3'; ctx.shadowBlur=45; ctx.shadowColor='#fff59d'; ctx.fill(); ctx.restore();
  for(let i=0;i<4;i++){
    let speed = 18 + 14*i;
    let x = (t*speed*W + i*230) % (W+200) - 100;
    ctx.save(); ctx.globalAlpha = 0.14 + 0.16*i; ctx.beginPath(); ctx.ellipse(x, 70 + i*22, 58 - 9*i, 20 + 5*i, 0, 0, 2*Math.PI); ctx.fillStyle='#fff'; ctx.shadowBlur=13; ctx.shadowColor='#fff'; ctx.fill(); ctx.restore();
  }
}

function draw(){
  sizeCanvasHiDPI(); // keep sharp if container changed (cheap with DPR transform)
  const W = canvas.__cssWidth, H = canvas.__cssHeight; const g = geom();

  if(screenShake>0){ ctx.save(); ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake); screenShake*=.8; }

  drawParallaxBg();
  ctx.fillStyle = '#65a840'; ctx.fillRect(0, g.groundY, W, H-g.groundY);

  // Slingshot
  ctx.lineWidth=12; ctx.strokeStyle='#4c3520';
  ctx.beginPath(); ctx.moveTo(g.baseX+9, H-30); ctx.lineTo(g.baseX-5, H-92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(g.baseX-9, H-30); ctx.lineTo(g.baseX+3, H-92); ctx.stroke();
  ctx.save(); ctx.lineWidth=5; ctx.strokeStyle='#c8a567';
  if(game.slingshot.pulling) drawCurve(g.baseX+3, H-92, game.slingshot.pullX, game.slingshot.pullY, g.baseX-5, H-92);
  ctx.restore();

  // Blocks
  for(const blk of game.blocks) if(blk.hp>0){ ctx.save(); ctx.shadowColor='#ac9973'; ctx.shadowBlur=8; ctx.fillStyle='#d9b377'; ctx.fillRect(blk.x, blk.y, blk.w, blk.h); ctx.strokeStyle='#a8833d'; ctx.strokeRect(blk.x, blk.y, blk.w, blk.h); ctx.restore(); }

  // Pigs
  for(const pig of game.pigs){ if(!(pig.alive || pig.dizzy>0)) continue; drawPig(pig); }

  // Particles
  for(const p of game.particles){ ctx.save(); ctx.globalAlpha=p.a; ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,2*Math.PI); ctx.fill(); ctx.restore(); }

  // Birds
  for(const bird of game.birds){
    if(!bird.flying && !bird.hit){ ctx.save(); ctx.globalAlpha=game.slingshot.fade; drawBird(game.slingshot.pullX, game.slingshot.pullY, bird.color, bird.type, false, bird.t); ctx.restore(); break; }
    if(bird.flying && !bird.hit){ ctx.save(); ctx.globalAlpha=bird.fade; drawBird(bird.x, bird.y, bird.color, bird.type, true, bird.t); ctx.restore(); }
  }
  for(let i=1;i<game.birds.length;i++){ const b = game.birds[i]; if(!b.flying && !b.hit){ ctx.globalAlpha=.55*game.slingshot.fade; drawBird(60, H-30 + i*16, b.color, b.type); ctx.globalAlpha=1; } }

  if(screenShake>0) ctx.restore();
}

function drawPig(pig){
  const H = canvas.__cssHeight;
  ctx.save();
  ctx.beginPath(); ctx.arc(pig.x, pig.y, pig.r, 0, 2*Math.PI); ctx.fillStyle = pig.alive ? '#bbe976' : '#e7d076'; ctx.shadowColor='#a0ce5b'; ctx.shadowBlur=15; ctx.fill(); ctx.shadowBlur=0; ctx.strokeStyle='#8bd237'; ctx.lineWidth=4; ctx.stroke();
  // eyes
  ctx.beginPath(); ctx.arc(pig.x-7, pig.y-8, 6, 0, 2*Math.PI); ctx.arc(pig.x+7, pig.y-8, 6, 0, 2*Math.PI); ctx.fillStyle='#fff'; ctx.fill();
  ctx.save();
  if(pig.dizzy>0){ ctx.strokeStyle='#ad0'; ctx.lineWidth=2.2; for(let a=0;a<2;a++){ let cx=pig.x+(a?7:-7), cy=pig.y-8; ctx.beginPath(); for(let j=0;j<8;j++){ let ang=j*Math.PI/4, r=2+j*.8; ctx.lineTo(cx+Math.cos(ang)*r, cy+Math.sin(ang)*r);} ctx.stroke(); } }
  else{ ctx.beginPath(); ctx.arc(pig.x-7, pig.y-8, 2, 0, 2*Math.PI); ctx.arc(pig.x+7, pig.y-8, 2, 0, 2*Math.PI); ctx.fillStyle='#333'; ctx.fill(); }
  ctx.restore();
  // nostrils + mouth
  ctx.beginPath(); ctx.ellipse(pig.x-3, pig.y+8, 2, 4, 0, 0, 2*Math.PI); ctx.ellipse(pig.x+3, pig.y+8, 2, 4, 0, 0, 2*Math.PI); ctx.fillStyle='#669f3a'; ctx.fill();
  ctx.beginPath(); if(pig.dizzy>0){ ctx.arc(pig.x, pig.y+13, 7, Math.PI, 2*Math.PI, false); } else { ctx.arc(pig.x, pig.y+13, 10, Math.PI*.13, Math.PI*.9, false); } ctx.lineWidth=3; ctx.strokeStyle='#3b6414'; ctx.stroke();
  ctx.restore();
}

function drawBird(x,y,color,type='red',spinning=false,t=0){
  ctx.save(); if(spinning){ ctx.translate(x,y); ctx.rotate(t); ctx.translate(-x,-y); }
  ctx.beginPath(); ctx.ellipse(x, y+14, 19, 7, 0, 0, 2*Math.PI); ctx.globalAlpha=.14; ctx.fillStyle='#000'; ctx.fill(); ctx.globalAlpha=1;
  ctx.beginPath(); let r=(type==='big'?24:18); ctx.arc(x,y,r,0,2*Math.PI); ctx.fillStyle=color; ctx.shadowColor='#111'; ctx.shadowBlur=7; ctx.fill(); ctx.shadowBlur=0;
  ctx.beginPath(); ctx.arc(x+7, y-8, 5, 0, 2*Math.PI); ctx.fillStyle='#fff'; ctx.fill(); ctx.beginPath(); ctx.arc(x+8, y-9, 2, 0, 2*Math.PI); ctx.fillStyle='#111'; ctx.fill();
  ctx.beginPath(); ctx.moveTo(x+r-2, y+1); ctx.lineTo(x+r+8, y+6); ctx.lineTo(x+r-7, y+8); ctx.closePath(); ctx.fillStyle='#ffd400'; ctx.fill();
  if(type==='blue'){ ctx.beginPath(); ctx.arc(x-6,y+8,4,0,2*Math.PI); ctx.fillStyle='#0ef'; ctx.globalAlpha=.6; ctx.fill(); ctx.globalAlpha=1; }
  if(type==='yellow'){ ctx.beginPath(); ctx.moveTo(x+r-5,y-2); ctx.lineTo(x+r+6,y+8); ctx.lineTo(x+r-9,y+7); ctx.closePath(); ctx.fillStyle='#f7fa61'; ctx.fill(); }
  if(type==='big'){ ctx.beginPath(); ctx.arc(x-7, y+6, 7, 0, Math.PI*2); ctx.fillStyle='#ca7b63'; ctx.globalAlpha=.52; ctx.fill(); ctx.globalAlpha=1; }
  ctx.restore();
}

function drawCurve(x1,y1,x2,y2,x3,y3){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(x2,y2,x3,y3); ctx.stroke(); }

// ====== PHYSICS ======
function spawnParticles(x,y,c){ for(let i=0;i<14;i++){ const th=Math.random()*2*Math.PI, sp=2+Math.random()*2; game.particles.push({x,y,vx:Math.cos(th)*sp,vy:Math.sin(th)*sp,r:3+Math.random()*2,c,a:1}); } }

function stepPhysics(){
  const H = canvas.__cssHeight; const g = geom();
  for(const bird of game.birds){
    if(!bird.flying || bird.hit) continue;
    bird.x += bird.vx; bird.y += bird.vy; bird.t += .12;
    if(bird.type==='yellow' && bird.speeded) bird.vx *= 1.01;
    bird.vy += (bird.type==='big'?0.53:0.48);
    const groundBird = H - (bird.type==='big'?20:16) - 35;
    if(bird.y > groundBird){ bird.y = groundBird; bird.vy *= -0.35; bird.vx *= 0.73; bird.fade *= 0.98; if(Math.abs(bird.vy)<1.7 && Math.abs(bird.vx)<0.6) bird.hit = true; if(Math.random()<0.45) spawnParticles(bird.x, bird.y+17, '#ccc'); }

    for(const blk of game.blocks){
      if(blk.hp<=0) continue;
      const r = (bird.type==='big'?24:16);
      if(bird.x>blk.x-r && bird.x<blk.x+blk.w+r && bird.y>blk.y-20 && bird.y<blk.y+blk.h+10){
        const impact = (bird.type==='big'?2:1); blk.hp -= impact; bird.vx *= -0.47; bird.vy *= -0.37; game.score += 10*impact; screenShake = 10;
        if(blk.hp<=0){ game.score += 40; spawnParticles(blk.x+blk.w/2, blk.y+blk.h/2, '#a8833d'); showStyleMsg(messages[Math.floor(Math.random()*messages.length)]); playBlock(); }
        if(bird.type==='big' && !bird.hit){ screenShake=24; spawnParticles(bird.x,bird.y,'#cf6a60'); }
      }
    }

    for(const pig of game.pigs){
      const r = (bird.type==='big'?24:16);
      if(pig.alive && Math.hypot(bird.x-pig.x, bird.y-pig.y) < pig.r + r){ pig.alive=false; bird.hit=true; pig.dizzy=32; game.score += 65; screenShake = 18; spawnParticles(pig.x,pig.y,'#b7e47e'); showStyleMsg(messages[Math.floor(Math.random()*messages.length)]); playPig(); }
    }

    if(bird.x > canvas.__cssWidth + 80 || bird.y > H + 80 || bird.x < -60) bird.hit = true;
    if(bird.flying && !bird.hit && Math.random()<.55){ game.particles.push({ x:bird.x+Math.random()*7-3.5, y:bird.y+Math.random()*7-3.5, vx:0, vy:0, r:2+Math.random()*1.2, c:bird.color+'b0', a:.35+Math.random()*.2 }); }
  }

  for(const pig of game.pigs){ if(!pig.alive){ pig.dizzy = Math.max(0, pig.dizzy-1); continue; } let support = game.blocks.find(blk=>blk.hp>0 && pig.x>blk.x-9 && pig.x<blk.x+blk.w+9); if(!support && pig.y < H-37){ pig.vy = (pig.vy||0) + .48; pig.y += pig.vy; if(pig.y>H-37){ pig.y=H-37; pig.vy=0; } pig.dizzy = 12; } }

  for(const blk of game.blocks){ if(blk.hp<=0) continue; let support = blk.y >= H-43 || game.blocks.find(b2=>b2!==blk && b2.hp>0 && Math.abs(b2.x-blk.x)<45 && b2.y-blk.y>15); if(!support){ blk.vy = (blk.vy||0) + .36; blk.y += blk.vy; if(blk.y>H-20){ blk.hp=0; blk.y=H; } } else { blk.vy = 0; } }

  for(const p of game.particles){ p.x+=p.vx; p.y+=p.vy; p.vy+=.03; p.a*=.95; }
  game.particles = game.particles.filter(p=>p.a>.08 && p.y<canvas.__cssHeight);
}

function loop(){
  if(!game.running || game.gameOver) return;
  stepPhysics(); draw(); updateLabels();
  const allDead = game.pigs.every(p=>!p.alive);
  const allBirdsUsed = game.birds.every(b=>b.hit);
  if(allDead){ game.running=false; game.gameOver=true; showOverlay('🎉 Level Complete!', 'Score: '+game.score, true); playWin(); return; }
  if(allBirdsUsed && !allDead){ game.running=false; game.gameOver=true; showOverlay('Level Failed', 'Score: '+game.score, false); playFail(); return; }
  requestAnimationFrame(loop);
}

// ====== OVERLAYS ======
function showOverlay(title, score, win){ const ov=document.getElementById('abOverlay'); ov.classList.add('show'); document.getElementById('overlayTitle').textContent=title; document.getElementById('overlayScore').textContent=score; document.getElementById('btnNextLevel').style.display=win?'inline-block':'none'; document.getElementById('btnRetry').style.display=win?'none':'inline-block'; }
function hideOverlay(){ document.getElementById('abOverlay').classList.remove('show'); }

// ====== INPUT (MOBILE + DESKTOP) ======
let pointerDown = false;
function getPointerPosition(e){ const r = canvas.getBoundingClientRect(); let x,y; if(e.touches){ x=e.touches[0].clientX - r.left; y=e.touches[0].clientY - r.top; } else { x=e.clientX - r.left; y=e.clientY - r.top; } return {x,y}; }

function startPull(e){ if(game.gameOver) return; const {x,y} = getPointerPosition(e); const {baseX,baseY} = geom(); if(Math.hypot(x-baseX, y-baseY) < 32 && game.slingshot.ready){ game.slingshot.pulling=true; pointerDown=true; game.slingshot.pullX=x; game.slingshot.pullY=y; window.addEventListener('mousemove', dragPull); window.addEventListener('touchmove', dragPull, {passive:false}); window.addEventListener('mouseup', releasePull); window.addEventListener('touchend', releasePull); e.preventDefault && e.preventDefault(); } }

function dragPull(e){ if(!game.slingshot.pulling) return; const {x,y} = getPointerPosition(e); const {baseX,baseY} = geom(); let dx=x-baseX, dy=y-baseY; const dist = Math.hypot(dx,dy); const maxPull = 85; if(dist>maxPull){ dx = dx*maxPull/dist; dy = dy*maxPull/dist; } game.slingshot.pullX = baseX + dx; game.slingshot.pullY = baseY + dy; e.preventDefault && e.preventDefault(); }

function releasePull(e){ if(!game.slingshot.pulling) return; game.slingshot.pulling=false; pointerDown=false; const bird = game.birds.find(b=>!b.flying && !b.hit); if(!bird) return; const {baseX,baseY} = geom(); let dx = game.slingshot.pullX - baseX, dy = game.slingshot.pullY - baseY; const mult = (bird.type==='big'?0.14:0.17); bird.flying=true; bird.vx = -dx * mult; bird.vy = -dy * mult; game.slingshot.fade=.32; setTimeout(()=>game.slingshot.fade=1,210); game.slingshot.pullX=baseX; game.slingshot.pullY=baseY; game.slingshot.ready=false; setTimeout(()=>game.slingshot.ready=true,450); window.removeEventListener('mousemove', dragPull); window.removeEventListener('touchmove', dragPull); window.removeEventListener('mouseup', releasePull); window.removeEventListener('touchend', releasePull); playShoot(); e && e.preventDefault && e.preventDefault(); }

// Special abilities
function boostYellow(){ const yel = game.birds.find(b=>b.flying && !b.hit && b.type==='yellow' && !b.speeded); if(yel){ yel.vx*=1.7; yel.vy*=1.1; yel.speeded=true; } }
function splitBlue(){ const main = game.birds.find(b=>b.flying && !b.hit && !b.splitUsed && b.type==='blue'); if(main){ main.splitUsed=true; for(const d of [-.23,0,.23]){ game.birds.push({ ...main, x:main.x, y:main.y, vx:main.vx + 3.4*Math.sin(d), vy:main.vy + 3.4*Math.cos(d), flying:true, hit:false, fade:1, splitUsed:true }); } main.hit=true; } }

// Desktop
canvas.addEventListener('mousedown', startPull);
canvas.addEventListener('mouseup', boostYellow); // yellow boost on mouseup
canvas.addEventListener('click', splitBlue); // blue split shortcut

// Mobile (prevent scroll while interacting)
canvas.addEventListener('touchstart', startPull, {passive:false});
canvas.addEventListener('touchend', (e)=>{ if(!pointerDown){ splitBlue(); boostYellow(); } pointerDown=false; }, {passive:false});

// Keyboard
document.addEventListener('keydown', (e)=>{ if(e.code==='Space') splitBlue(); });

// ====== BUTTONS ======
const btnStart = document.getElementById('btnStart');
const btnRestart = document.getElementById('btnRestart');
const btnNextLevel = document.getElementById('btnNextLevel');
const btnRetry = document.getElementById('btnRetry');

btnStart.onclick = ()=>{ if(game.running) return; game.running=true; game.gameOver=false; hideOverlay(); loop(); };
btnRestart.onclick = ()=>{ resetGame(0); game.running=true; game.gameOver=false; loop(); };
btnNextLevel.onclick = ()=>{ hideOverlay(); const next = (game.level) % levels.length; resetGame(next); game.running=true; game.gameOver=false; loop(); };
btnRetry.onclick = ()=>{ hideOverlay(); resetGame(game.level-1); game.running=true; game.gameOver=false; loop(); };

// ====== OVERLAY SHIMS (reuse howtoplay modal styles) ======
function convertOverlay(){
  const abOverlay = document.getElementById('abOverlay');
  // already styled as .howtoplay-modal in HTML
}

// ====== INIT ======
function hideOverlay(){ document.getElementById('abOverlay').classList.remove('show'); }
resetGame();