/***** Pro Arcade Hill Climb - Fully Responsive (Desktop + Mobile Controls) *****/

const canvas = document.getElementById('hillCanvas');
const ctx    = canvas.getContext('2d');

const HILL_STEP_X     = 64;
const HILL_STEP_Y     = 65;
const GRAVITY         = 0.53;
const MAX_FORWARD     = 3.9;
const FUEL_SPAWN_DIST = 540;
const BASE_FUEL_USE   = 0.0095;
const EXTRA_FUEL_USE  = 0.014;
const CITY_STRIP_H    = 120;

const FUEL_CANS = [], BUILDINGS = [];
let floatingText = null, lastNiceScore = 0;

// Game state
let game = {
  running:false, paused:false, gameOver:false,
  score:0, highScore:Number(localStorage.getItem('hillHigh')||0),
  fuel:100,
  car:{x:140,y:320,vy:0,vx:0.43,angle:0,vangle:0,onGround:true},
  gas:false, brake:false, left:false, right:false,
  hills:[], offset:0, clouds:[]
};
const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
const hillY = x=>{
  const h=game.hills;
  for(let i=1;i<h.length;i++){
    if(x<=h[i].x){
      const t=(x-h[i-1].x)/(h[i].x-h[i-1].x);
      return h[i-1].y + t*(h[i].y-h[i-1].y);
    }
  }
  return h.at(-1).y;
};
let nextFuelX = 400;
function spawnFuelCan(x,y){ FUEL_CANS.push({x,y:y-28,picked:false}); nextFuelX += FUEL_SPAWN_DIST;}
function genHills(startX=0,startY=340){
  const pts=[]; let x=startX,y=startY;
  if(game.hills.length) pts.push(game.hills.at(-1)); else pts.push({x,y});
  for(let i=0;i<24;i++){
    x += HILL_STEP_X + Math.random()*58;
    y += (Math.random()<0.54?-1:1)*(HILL_STEP_Y + Math.random()*34);
    y = clamp(y,120,435);
    pts.push({x,y});
    while(x >= nextFuelX) spawnFuelCan(x,y);
  }
  game.hills = game.hills.length ? game.hills.concat(pts.slice(1)) : pts;
}
function extendHills(){
  if(game.car.x+800 > game.hills.at(-1).x) genHills(game.hills.at(-1).x,game.hills.at(-1).y);
}
function makeClouds(){
  while(game.clouds.length<7){
    game.clouds.push({
      x:Math.random()*2200,
      y:60+Math.random()*120,
      w:120+Math.random()*90,
      speed:0.24+Math.random()*0.21
    });
  }
}
function genBuildings(){
  while(BUILDINGS.length<54){
    const lastX = BUILDINGS.at(-1)?.x + BUILDINGS.at(-1)?.w || 0;
    const w     = 60 + Math.random()*50;
    const h     = 40 + Math.random()*80;
    const shade = 40 + Math.random()*40;
    BUILDINGS.push({x:lastX,w,h,shade});
  }
}
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);                  ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);              ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);                ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);                  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.fill();
}
// --- FLOATING ARCADE NEON TEXT ---
function showFloatingText(text) {
  floatingText = {
    text,
    x: canvas.width / 2 + (Math.random() - 0.5) * 220,
    y: 160 + Math.random() * 120,
    opacity: 1,
    dy: -0.89,
    fadeRate: 0.014,
    color: ['#17f3ff','#f12fbb','#32cd32'][Math.floor(Math.random()*3)]
  };
}
function drawBG(){
  const sky=ctx.createLinearGradient(0,0,0,canvas.height);
  sky.addColorStop(0,'#9cd7ff'); sky.addColorStop(1,'#7bb0f8');
  ctx.fillStyle=sky; ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle='#fff26655'; ctx.beginPath();
  ctx.arc(90,80,50,0,2*Math.PI); ctx.fill();

  ctx.save();
  ctx.translate(-game.offset*0.3,canvas.height-CITY_STRIP_H);
  BUILDINGS.forEach(b=>{
    ctx.fillStyle=`rgb(${b.shade},${b.shade+30},${b.shade+70})`;
    ctx.fillRect(b.x, CITY_STRIP_H-b.h, b.w, b.h);
  });
  ctx.restore();

  game.clouds.forEach(c=>{
    c.x -= c.speed; if(c.x < -200) c.x = game.car.x + 1200;
    ctx.fillStyle='rgba(255,255,255,0.88)';
    ctx.beginPath();
    ctx.ellipse(c.x-game.offset,c.y,c.w,40,0,0,2*Math.PI);
    ctx.fill();
  });

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-20,canvas.height);
  game.hills.forEach(p=> ctx.lineTo(p.x-game.offset, p.y));
  ctx.lineTo(game.hills.at(-1).x-game.offset,canvas.height);
  ctx.closePath();
  ctx.fillStyle='#46c76a'; ctx.shadowBlur=15; ctx.shadowColor='#2b2b2b';
  ctx.fill();
  ctx.restore();
  ctx.lineWidth=6; ctx.strokeStyle='#2f6130';
  ctx.beginPath(); game.hills.forEach(p=> ctx.lineTo(p.x-game.offset,p.y+5)); ctx.stroke();
}
function drawFuelCans(){
  FUEL_CANS.forEach(f=>{
    if(f.picked) return; const sx=f.x-game.offset;
    if(sx < -60) return;
    ctx.save(); ctx.translate(sx,f.y);
    ctx.fillStyle='#e84118'; roundRect(-14,-18,28,32,5);
    ctx.fillStyle='#333'; ctx.fillRect(-8,-22,16,6);
    ctx.restore();
  });
}
function drawCar(){
  const c=game.car, carY=hillY(c.x);
  ctx.save(); ctx.translate(c.x-game.offset,carY-12); ctx.rotate(c.angle);

  const grad=ctx.createLinearGradient(-38,0,38,32);
  grad.addColorStop(0,'#feaa4b'); grad.addColorStop(1,'#fe822d');
  ctx.fillStyle=grad; roundRect(-38,-12,76,24,8);

  ctx.fillStyle='#bfefff'; ctx.fillRect(-12,-16,24,10);

  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-4,-15,6,0,2*Math.PI); ctx.fill();
  ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(-4,-15,4,0,Math.PI,true); ctx.fill();

  ctx.fillStyle='#222';
  ctx.beginPath(); ctx.arc(-26,16,13,0,2*Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(26,16,13,0,2*Math.PI); ctx.fill();
  ctx.restore();
}
function drawHUD(){
  ctx.font='19px Orbitron, sans-serif';
  ctx.fillStyle='#fff';
  ctx.fillText('Score '+game.score,18,32);
  ctx.fillText('High '+game.highScore,18,60);
  ctx.fillStyle='#ccc'; ctx.fillRect(18,76,120,12);
  ctx.fillStyle='#e84118'; ctx.fillRect(18,76,120*game.fuel/100,12);
  ctx.strokeStyle='#000'; ctx.strokeRect(18,76,120,12);
  // Neon floating encouragement
  if (floatingText) {
    ctx.save();
    ctx.font = 'bold 44px Orbitron, Russo One, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = floatingText.color;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = floatingText.opacity;
    ctx.fillStyle = floatingText.color;
    ctx.fillText(floatingText.text, floatingText.x, floatingText.y);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
function drawAll(){ drawBG(); drawFuelCans(); drawCar(); drawHUD(); }
function stepPhysics(){
  const c=game.car, groundY=hillY(c.x), aheadY=hillY(c.x+30),
        slope=Math.atan2(aheadY-groundY,30);

  let accel = 0;
  if(game.gas)   accel -= 0.23;
  if(game.brake) accel += 0.17;
  c.vx += -accel * Math.cos(slope);
  c.vx *= 0.983;
  c.vx = clamp(c.vx,-1.73,MAX_FORWARD);

  if(c.y < groundY-1){
    c.vy += GRAVITY; c.onGround=false;
  } else {
    c.y = groundY-1; c.vy=0; c.onGround=true;
    c.angle += (slope-c.angle)*0.23;
  }

  if(game.left)  c.vangle -= 0.033;
  if(game.right) c.vangle += 0.033;
  c.angle += c.vangle; c.vangle *= 0.87;

  c.x += c.vx; c.y += c.vy;

  if(game.running){
    const drain = BASE_FUEL_USE + EXTRA_FUEL_USE*Math.abs(c.vx);
    game.fuel = clamp(game.fuel - drain, 0, 100);
  }

  FUEL_CANS.forEach(f=>{
    if(f.picked) return;
    if(Math.abs(f.x-c.x)<25 && Math.abs(f.y-(groundY-18))<25){
      f.picked=true; game.fuel = clamp(game.fuel+31,0,100);
    }
  });

  if(Math.abs(c.angle)>1.49 || game.fuel<=0){
    game.running=false; game.gameOver=true;
    setTimeout(()=>{
      alert((game.fuel<=0?'Out of fuel!\n':'Car flipped!\n')+'Score: '+game.score);
      resetGame();
    },360);
    return;
  }

  game.offset = Math.max(c.x-140,0);
  game.score  = Math.floor(c.x-140);
  if(game.score > game.highScore){
    game.highScore = game.score;
    localStorage.setItem('hillHigh', game.highScore);
  }
  extendHills();

  // Motivational Arcade Messages
  if (game.running && game.score > 0 && game.score % 120 === 0 && (game.score!==lastNiceScore)) {
    const msgs = ['Nice!', 'Wow!', 'Good!', 'Pro!', 'Superb!', 'Keep Going!', 'Insane!', 'Skilled!'];
    showFloatingText(msgs[Math.floor(Math.random()*msgs.length)]);
    lastNiceScore = game.score;
  }
  if (floatingText) {
    floatingText.y += floatingText.dy;
    floatingText.opacity -= floatingText.fadeRate;
    if (floatingText.opacity <= 0) floatingText = null;
  }
}
function loop(){
  if(!game.running||game.paused||game.gameOver) return;
  stepPhysics(); drawAll(); updateLabels(); requestAnimationFrame(loop);
}
// Button controls
document.getElementById('btnStart').onclick=()=>{
  if(game.running&&!game.paused) return;
  if(!game.running) resetGame();
  game.running=true; game.paused=false; loop();
};
document.getElementById('btnPause').onclick=()=>{
  if(!game.running||game.gameOver) return;
  game.paused=!game.paused; if(!game.paused) loop();
};
document.getElementById('btnRestart').onclick=()=>{
  resetGame(); game.running=true; loop();
};
/* DESKTOP ALPHABET + ARROW KEYS CONTROL */
window.addEventListener('keydown',e=>{
  const key = e.key.toLowerCase();
  if(key==='w'||e.keyCode===38)   game.gas=true;
  if(key==='s'||e.keyCode===40)   game.brake=true;
  if(key==='a'||e.keyCode===37)   game.left=true;
  if(key==='d'||e.keyCode===39)   game.right=true;
});
window.addEventListener('keyup',e=>{
  const key = e.key.toLowerCase();
  if(key==='w'||e.keyCode===38)   game.gas=false;
  if(key==='s'||e.keyCode===40)   game.brake=false;
  if(key==='a'||e.keyCode===37)   game.left=false;
  if(key==='d'||e.keyCode===39)   game.right=false;
});
/* MOBILE SWIPE CONTROLS */
let startX=null, startY=null, moved=false;
canvas.addEventListener('touchstart',e=>{
  if(e.touches.length===1){
    startX=e.touches[0].clientX;
    startY=e.touches[0].clientY;
    moved=false;
  }
});
canvas.addEventListener('touchmove',e=>{
  if(startX==null||startY==null) return;
  const dx=e.touches[0].clientX-startX;
  const dy=e.touches[0].clientY-startY;
  if(Math.abs(dx)>Math.abs(dy)){
    // Horizontal swipe: left/right (tilt)
    if(dx>30)  {game.left=false; game.right=true; moved=true;}
    else if(dx<-30){game.right=false; game.left=true; moved=true;}
  } else {
    // Vertical swipe: up/down (accelerate/brake)
    if(dy<-30){game.gas=true; game.brake=false; moved=true;}
    else if(dy>30){game.gas=false; game.brake=true; moved=true;}
  }
});
canvas.addEventListener('touchend',e=>{
  startX=null; startY=null;
  game.gas=false; game.brake=false; game.left=false; game.right=false;
  moved=false;
});
// Resize (responsive canvas!)
function resizeCanvas() {
  // On mobile: fit to parent width, else 900px max
  let w = Math.min(window.innerWidth-16, 900);
  let h = w>700 ? 240 : (w>420 ? 160 : 120);
  canvas.width = w;
  canvas.height = h;
  drawAll();
}
window.addEventListener('resize', resizeCanvas);
function resetGame(){
  Object.assign(game,{
    score:0,fuel:100,offset:0,gameOver:false,
    car:{x:140,y:320,vy:0,vx:0.43,angle:0,vangle:0,onGround:true},
    hills:[], clouds:[]
  });
  FUEL_CANS.length=0; BUILDINGS.length=0; nextFuelX=400;
  genHills(); makeClouds(); genBuildings(); drawAll(); updateLabels();
  floatingText = null; lastNiceScore = 0;
}
function updateLabels(){
  document.getElementById('scoreLabel').textContent='Score: '+game.score;
}