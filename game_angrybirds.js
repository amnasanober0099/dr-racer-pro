// ====== SOUND EFFECTS HOOKS ======
const shootSound = document.getElementById('shootSound');
const blockBreakSound = document.getElementById('blockBreakSound');
const pigHitSound = document.getElementById('pigHitSound');
const failSound = document.getElementById('failSound');
const winSound = document.getElementById('winSound');

function playShoot()   { shootSound.currentTime=0; shootSound.play(); }
function playBlock()   { blockBreakSound.currentTime=0; blockBreakSound.play(); }
function playPig()     { pigHitSound.currentTime=0; pigHitSound.play(); }
function playFail()    { failSound.currentTime=0; failSound.play(); }
function playWin()     { winSound.currentTime=0; winSound.play(); }

const canvas = document.getElementById('abCanvas');
const ctx = canvas.getContext('2d');
let screenShake = 0;

const messages = [
  "Nice!", "Excellent!", "Awesome!", "Great Shot!", "Perfect!", "Good Hit!", "Smashed!", "Skill!", "Kaboom!"
];
function showStyleMsg(txt) {
  const box = document.getElementById("abStyleMsg");
  box.textContent = txt;
  box.classList.add("show");
  setTimeout(()=>box.classList.remove("show"), 900);
}

const levels = [
  {
    birds: [
      { type: 'red', color: "#D61C22" },
      { type: 'red', color: "#D61C22" },
      { type: 'yellow', color: "#FFD400" },
    ],
    blocks: [
      {x:410, y:270, w:44, h:20, hp:2},
      {x:454, y:270, w:44, h:20, hp:2},
      {x:432, y:235, w:88, h:18, hp:3},
    ],
    pigs: [
      {x:454, y:220, r:20}
    ]
  },
  {
    birds: [
      { type: 'red', color: "#D61C22" },
      { type: 'yellow', color: "#FFD400" },
      { type: 'blue', color: "#49c7f3" },
      { type: 'big', color: "#b9463c" }
    ],
    blocks: [
      {x:370, y:270, w:44, h:20, hp:2},
      {x:414, y:270, w:44, h:20, hp:2},
      {x:458, y:270, w:44, h:20, hp:2},
      {x:392, y:235, w:88, h:18, hp:3},
      {x:436, y:200, w:44, h:18, hp:3}
    ],
    pigs: [
      {x:414, y:215, r:20},
      {x:458, y:250, r:18}
    ]
  },
  {
    birds: [
      { type: 'red', color: "#D61C22" },
      { type: 'yellow', color: "#FFD400" },
      { type: 'blue', color: "#49c7f3" },
      { type: 'big', color: "#b9463c" },
      { type: 'blue', color: "#49c7f3" }
    ],
    blocks: [
      {x:370, y:270, w:44, h:20, hp:3},
      {x:414, y:270, w:44, h:20, hp:3},
      {x:458, y:270, w:44, h:20, hp:3},
      {x:382, y:225, w:108, h:16, hp:3},
      {x:404, y:190, w:66, h:15, hp:3}
    ],
    pigs: [
      {x:414, y:175, r:19},
      {x:458, y:250, r:18},
      {x:370, y:250, r:16}
    ]
  }
];

let game = {
  running: false, gameOver: false, level: 1,
  birds: [], slingshot: {}, pigs: [], blocks: [], particles: [], score: 0,
};

function resetGame(levelIndex=0) {
  let level = levels[levelIndex] || levels[0];
  game.level = levelIndex+1;
  game.running = false;
  game.gameOver = false;
  game.birds = [];
  for (let b of level.birds) {
    game.birds.push({
      x:100, y:230, vx:0, vy:0, flying:false, hit:false, fade:1, t:0,
      type: b.type, color: b.color, splitUsed:false, speeded: false
    });
  }
  game.slingshot = {x:100, y:230, pullX:100, pullY:230, pulling:false, ready:true, fade:1};
  game.blocks = [];
  for (let blk of level.blocks) {
    game.blocks.push({...blk, vx:0, vy:0});
  }
  game.pigs = [];
  for (let pig of level.pigs) {
    game.pigs.push({...pig, alive:true, vx:0, vy:0, dizzy:0});
  }
  game.score = 0;
  game.particles = [];
  updateLabels();
  draw();
  hideOverlay();
  document.getElementById('levelLabel').classList.remove('level-anim');
  setTimeout(()=>document.getElementById('levelLabel').classList.add('level-anim'),40);
}

function updateLabels() {
  document.getElementById('scoreLabel').innerText = 'Score: '+game.score;
  document.getElementById('levelLabel').innerText = 'Level: '+game.level;
}

function drawParallaxBg() {
  let t = performance.now() / 13000;
  let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#fffbe4");
  grad.addColorStop(.5, "#b8e6fa");
  grad.addColorStop(1, "#91bbdf");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalAlpha = 0.21;
  ctx.beginPath();
  ctx.arc(95, 70, 55, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff8c3";
  ctx.shadowBlur = 45;
  ctx.shadowColor = "#fff59d";
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    let speed = 18 + 14 * i;
    let x = (t * speed * canvas.width + i * 230) % (canvas.width + 200) - 100;
    ctx.save();
    ctx.globalAlpha = 0.14 + 0.16 * i;
    ctx.beginPath();
    ctx.ellipse(x, 70 + i * 22, 58 - 9 * i, 20 + 5 * i, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 13;
    ctx.shadowColor = "#fff";
    ctx.fill();
    ctx.restore();
  }
}
function draw() {
  if (screenShake > 0) {
    ctx.save();
    ctx.translate((Math.random() - 0.5) * screenShake, (Math.random() - 0.5) * screenShake);
    screenShake *= 0.80;
  }
  drawParallaxBg();
  ctx.fillStyle="#65a840";
  ctx.fillRect(0,canvas.height-35,canvas.width,35);

  ctx.lineWidth=12; ctx.strokeStyle="#4c3520";
  ctx.beginPath(); ctx.moveTo(109,canvas.height-30); ctx.lineTo(95,canvas.height-92); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(91,canvas.height-30); ctx.lineTo(103,canvas.height-92); ctx.stroke();
  ctx.save();
  ctx.lineWidth=5; ctx.strokeStyle="#c8a567";
  if(game.slingshot.pulling)
    drawCurve(103,canvas.height-92,game.slingshot.pullX,game.slingshot.pullY,95,canvas.height-92);
  ctx.restore();

  for(let blk of game.blocks) if(blk.hp>0){
    ctx.save();
    ctx.shadowColor="#ac9973";
    ctx.shadowBlur=8;
    ctx.fillStyle = "#d9b377";
    ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
    ctx.strokeStyle="#a8833d";
    ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
    ctx.restore();
  }

  for (let pig of game.pigs) if (pig.alive || pig.dizzy > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(pig.x, pig.y, pig.r, 0, 2 * Math.PI);
    ctx.fillStyle = pig.alive ? "#bbe976" : "#e7d076";
    ctx.shadowColor = "#a0ce5b";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#8bd237";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pig.x - 7, pig.y - 8, 6, 0, 2 * Math.PI);
    ctx.arc(pig.x + 7, pig.y - 8, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.save();
    if (pig.dizzy > 0) {
      ctx.strokeStyle = "#ad0";
      ctx.lineWidth = 2.2;
      for (let a = 0; a < 2; a++) {
        let cx = pig.x + (a ? 7 : -7), cy = pig.y - 8;
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          let angle = j * Math.PI / 4;
          let r = 2 + j * 0.8;
          ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        }
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(pig.x - 7, pig.y - 8, 2, 0, 2 * Math.PI);
      ctx.arc(pig.x + 7, pig.y - 8, 2, 0, 2 * Math.PI);
      ctx.fillStyle = "#333";
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(pig.x - 3, pig.y + 8, 2, 4, 0, 0, 2 * Math.PI);
    ctx.ellipse(pig.x + 3, pig.y + 8, 2, 4, 0, 0, 2 * Math.PI);
    ctx.fillStyle = "#669f3a";
    ctx.fill();
    ctx.beginPath();
    if (pig.dizzy > 0) {
      ctx.arc(pig.x, pig.y + 13, 7, Math.PI, Math.PI * 2, false);
    } else {
      ctx.arc(pig.x, pig.y + 13, 10, Math.PI * 0.13, Math.PI * 0.9, false);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#3b6414";
    ctx.stroke();
    ctx.restore();
  }

  for(let p of game.particles){
    ctx.save();
    ctx.globalAlpha=p.a;
    ctx.fillStyle=p.c;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,2*Math.PI);
    ctx.fill();
    ctx.restore();
  }

  for(let bird of game.birds){
    if(!bird.flying && !bird.hit){
      ctx.save();
      ctx.globalAlpha=game.slingshot.fade;
      drawBird(game.slingshot.pullX,game.slingshot.pullY,bird.color,bird.type,false,bird.t);
      ctx.restore();
      break;
    }
    if(bird.flying && !bird.hit){
      ctx.save();
      ctx.globalAlpha=bird.fade;
      drawBird(bird.x,bird.y,bird.color,bird.type,true,bird.t);
      ctx.restore();
    }
  }
  for(let i=1;i<game.birds.length;i++){
    let bird=game.birds[i];
    if(!bird.flying && !bird.hit){
      ctx.globalAlpha=0.55*game.slingshot.fade;
      drawBird(60,canvas.height-30+i*16,bird.color,bird.type);
      ctx.globalAlpha=1.0;
    }
  }
  if (screenShake > 0) ctx.restore();
}

function drawBird(x, y, color, type="red", spinning = false, t = 0) {
  ctx.save();
  if (spinning) {
    ctx.translate(x, y);
    ctx.rotate(t);
    ctx.translate(-x, -y);
  }
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 19, 7, 0, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#000";
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  let r = (type==="big"?24:18);
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.shadowColor = "#111";
  ctx.shadowBlur = 7;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x + 7, y - 8, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 8, y - 9, 2, 0, 2 * Math.PI);
  ctx.fillStyle = "#111";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r-2, y + 1);
  ctx.lineTo(x + r+8, y + 6);
  ctx.lineTo(x + r-7, y + 8);
  ctx.closePath();
  ctx.fillStyle = "#ffd400";
  ctx.fill();
  if (type==="blue") {
    ctx.beginPath();
    ctx.arc(x-6, y+8, 4, 0, 2*Math.PI);
    ctx.fillStyle = "#0ef";
    ctx.globalAlpha = .6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (type==="yellow") {
    ctx.beginPath();
    ctx.moveTo(x+r-5,y-2); ctx.lineTo(x+r+6,y+8); ctx.lineTo(x+r-9,y+7); ctx.closePath();
    ctx.fillStyle="#f7fa61"; ctx.fill();
  }
  if (type==="big") {
    ctx.beginPath();
    ctx.arc(x-7, y+6, 7, 0, Math.PI*2);
    ctx.fillStyle = "#ca7b63";
    ctx.globalAlpha = .52;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawCurve(x1,y1,x2,y2,x3,y3){
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.quadraticCurveTo(x2,y2,x3,y3);
  ctx.stroke();
}
function stepPhysics() {
  for(let bird of game.birds){
    if(!bird.flying || bird.hit) continue;
    bird.x += bird.vx;
    bird.y += bird.vy;
    bird.t += 0.12;
    if (bird.type==="yellow" && bird.speeded) { bird.vx*=1.01; }
    bird.vy += (bird.type==="big"?0.53:0.48);
    if(bird.y>canvas.height-35-(bird.type==="big"?20:16)){
      bird.y=canvas.height-35-(bird.type==="big"?20:16);
      bird.vy*=-0.35; bird.vx*=0.73;
      bird.fade*=0.98;
      if(Math.abs(bird.vy)<1.7 && Math.abs(bird.vx)<0.6) bird.hit=true;
      if(Math.random()<0.45) spawnParticles(bird.x,bird.y+17,"#ccc");
    }
    for(let blk of game.blocks){
      let r = (bird.type==="big"?24:16);
      if(blk.hp>0 && bird.x>blk.x-r && bird.x<blk.x+blk.w+r && bird.y>blk.y-20 && bird.y<blk.y+blk.h+10){
        let impact = (bird.type==="big"?2:1);
        blk.hp-=impact; bird.vx*=-0.47; bird.vy*=-0.37; game.score+=10*impact; screenShake=10;
        if(blk.hp<=0){
          game.score+=40; spawnParticles(blk.x+blk.w/2,blk.y+blk.h/2, "#a8833d");
          showStyleMsg(messages[Math.floor(Math.random()*messages.length)]);
          playBlock();
        }
        if(bird.type==="big" && !bird.hit) { screenShake=24; spawnParticles(bird.x,bird.y,"#cf6a60"); }
      }
    }
    for(let pig of game.pigs){
      let r = (bird.type==="big"?24:16);
      if(pig.alive && Math.hypot(bird.x-pig.x,bird.y-pig.y)<pig.r+r){
        pig.alive=false; bird.hit=true; pig.dizzy=32; game.score+=65; screenShake=18;
        spawnParticles(pig.x,pig.y,"#b7e47e");
        showStyleMsg(messages[Math.floor(Math.random()*messages.length)]);
        playPig();
      }
    }
    if(bird.x>canvas.width+80||bird.y>canvas.height+80||bird.x<-60)
      bird.hit=true;
    if(bird.flying && !bird.hit && Math.random()<0.55){
      game.particles.push({
        x: bird.x+Math.random()*7-3.5,
        y: bird.y+Math.random()*7-3.5,
        vx: 0, vy: 0,
        r: 2+Math.random()*1.2,
        c: bird.color+"b0", a: 0.35+Math.random()*0.2
      });
    }
  }
  for(let pig of game.pigs){
    if(!pig.alive){
      pig.dizzy=Math.max(0,pig.dizzy-1);
      continue;
    }
    let support = game.blocks.find(blk=>blk.hp>0&&pig.x>blk.x-9&&pig.x<blk.x+blk.w+9);
    if(!support && pig.y<canvas.height-37){
      pig.vy+=0.48; pig.y+=pig.vy;
      if(pig.y>canvas.height-37) pig.y=canvas.height-37, pig.vy=0;
      pig.dizzy=12;
    }
  }
  for(let blk of game.blocks){
    if(blk.hp<=0) continue;
    let support = blk.y>=canvas.height-43 || game.blocks.find(b2=>b2!=blk && b2.hp>0 && Math.abs(b2.x-blk.x)<45 && b2.y-blk.y>15);
    if(!support){
      blk.vy+=0.36; blk.y+=blk.vy;
      if(blk.y>canvas.height-20){blk.hp=0; blk.y=canvas.height;}
    }else{
      blk.vy=0;
    }
  }
  for(let p of game.particles){
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.03; p.a*=0.95;
  }
  game.particles = game.particles.filter(p=>p.a>0.08 && p.y<canvas.height);
}

function spawnParticles(x,y,c){
  for(let i=0;i<14;i++){
    let th = Math.random()*2*Math.PI;
    let sp = 2+Math.random()*2;
    game.particles.push({x,y,vx:Math.cos(th)*sp,vy:Math.sin(th)*sp,r:3+Math.random()*2,c,a:1});
  }
}

function loop() {
  if(!game.running||game.gameOver) return;
  stepPhysics();
  draw();
  updateLabels();
  let allDead = game.pigs.every(p=>!p.alive);
  let allBirdsUsed = game.birds.every(b=>b.hit);
  if(allDead){
    game.running=false; game.gameOver=true;
    showOverlay("🎉 Level Complete!", "Score: "+game.score, true);
    playWin();
    return;
  }
  if(allBirdsUsed && !allDead){
    game.running=false; game.gameOver=true;
    showOverlay("Level Failed", "Score: "+game.score, false);
    playFail();
    return;
  }
  requestAnimationFrame(loop);
}

function showOverlay(title,score,win){
  const ov=document.getElementById('abOverlay');
  ov.classList.add('show');
  document.getElementById('overlayTitle').textContent=title;
  document.getElementById('overlayScore').textContent=score;
  document.getElementById('btnNextLevel').style.display=win?"inline-block":"none";
  document.getElementById('btnRetry').style.display=win?"none":"inline-block";
}
function hideOverlay(){
  document.getElementById('abOverlay').classList.remove('show');
}

// =========== TOUCH & MOUSE CONTROLS (FULL MOBILE SUPPORT) ==========
let pointerDown = false;

function getPointerPosition(e) {
  let rect = canvas.getBoundingClientRect();
  let x, y;
  if (e.touches) {
    x = e.touches[0].clientX - rect.left;
    y = e.touches[0].clientY - rect.top;
  } else {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
  }
  return {x, y};
}

function startPull(e){
  if(game.gameOver) return;
  let {x:ex, y:ey} = getPointerPosition(e);
  if(Math.hypot(ex-100,ey-230)<32 && game.slingshot.ready){
    game.slingshot.pulling=true;
    pointerDown = true;
    game.slingshot.pullX=ex; game.slingshot.pullY=ey;
    window.addEventListener('mousemove', dragPull);
    window.addEventListener('touchmove', dragPull, {passive:false});
    window.addEventListener('mouseup', releasePull);
    window.addEventListener('touchend', releasePull);
    e.preventDefault && e.preventDefault();
  }
}

function dragPull(e){
  if(!game.slingshot.pulling) return;
  let {x:ex, y:ey} = getPointerPosition(e);
  let dx=ex-100, dy=ey-230;
  let dist=Math.hypot(dx,dy);
  if(dist>85){ dx=dx*85/dist; dy=dy*85/dist;}
  game.slingshot.pullX=100+dx;
  game.slingshot.pullY=230+dy;
  e.preventDefault && e.preventDefault();
}

function releasePull(e){
  if(!game.slingshot.pulling) return;
  game.slingshot.pulling=false;
  pointerDown = false;
  let bird = game.birds.find(b=>!b.flying&&!b.hit);
  if(!bird) return;
  let dx=game.slingshot.pullX-100, dy=game.slingshot.pullY-230;
  bird.flying=true;
  let mult = (bird.type==="big"?0.14:0.17);
  bird.vx = -dx*mult; bird.vy=-dy*mult;
  game.slingshot.fade=0.32;
  setTimeout(()=>{game.slingshot.fade=1;},210);
  game.slingshot.pullX=100; game.slingshot.pullY=230;
  game.slingshot.ready=false;
  setTimeout(()=>{game.slingshot.ready=true;},450);
  window.removeEventListener('mousemove',dragPull);
  window.removeEventListener('touchmove',dragPull);
  window.removeEventListener('mouseup',releasePull);
  window.removeEventListener('touchend',releasePull);

  playShoot();
  e && e.preventDefault && e.preventDefault();
}

// Yellow bird speed boost (click/tap screen when yellow bird is in air)
function boostYellow(e){
  let yellow = game.birds.find(b=>b.flying && !b.hit && b.type==="yellow" && !b.speeded);
  if (yellow) { yellow.vx *= 1.7; yellow.vy *= 1.1; yellow.speeded = true; }
}

// Blue split (tap/click while blue flying)
function splitBlue(){
  let main = game.birds.find(b => b.flying && !b.hit && !b.splitUsed && b.type === "blue");
  if (main) {
    main.splitUsed = true;
    for (let d of [-0.23, 0, 0.23]) {
      game.birds.push({
        ...main,
        x: main.x,
        y: main.y,
        vx: main.vx + 3.4 * Math.sin(d),
        vy: main.vy + 3.4 * Math.cos(d),
        flying: true,
        hit: false,
        fade: 1,
        splitUsed: true,
      });
    }
    main.hit = true;
  }
}

// Desktop controls
canvas.addEventListener('mousedown',startPull);
canvas.addEventListener('mouseup', boostYellow); // yellow bird boost on mouseup

// Mobile controls
canvas.addEventListener('touchstart',startPull, {passive:false});
canvas.addEventListener('touchend', function(e){
  // If finger was not dragging, consider as a tap (for blue split/yellow boost)
  if (!pointerDown) {
    splitBlue();
    boostYellow();
  }
  pointerDown = false;
}, {passive:false});

// Keyboard controls for blue bird split (space)
document.addEventListener('keydown', function(e) {
  if (e.code === "Space") splitBlue();
});

// PC: click for blue split as well (optional)
canvas.addEventListener('click', function(e) {
  splitBlue();
});

// ========== BUTTONS ================
document.getElementById('btnNextLevel').onclick = function () {
  hideOverlay();
  let nextLevel = (game.level) % levels.length;
  resetGame(nextLevel);
  game.running=true; game.gameOver=false;
  loop();
};
document.getElementById('btnRetry').onclick = function () {
  hideOverlay();
  resetGame(game.level-1);
  game.running=true; game.gameOver=false;
  loop();
};
document.getElementById('btnStart').onclick = function () {
  if(game.running) return;
  game.running=true; game.gameOver=false;
  hideOverlay();
  loop();
};
document.getElementById('btnRestart').onclick = function () {
  resetGame(0);
  game.running=true; game.gameOver=false;
  loop();
};

// ========== GAME INIT ==============
resetGame();
