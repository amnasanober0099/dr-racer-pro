// --- WATER SORT PUZZLE JS with SOUND EFFECTS (NO tube hover sound) ---
const COLORS = [
  "#fd4766", "#33d6f9", "#fae055", "#3cf17e", "#b487f7",
  "#ff7a3c", "#2be6b0", "#fb5bbd", "#f8c49c", "#00ecf6"
];
const COMPLIMENTS = [
  "Nice Move!", "Great!", "Awesome!", "Satisfying!", "Impressive!",
  "Well Done!", "Good Job!", "Smart!", "Perfect!", "Excellent!"
];
let tubes = [], moves = 0, level = 1, selected = -1, solved = false, leaderboard = [];

// Sound refs
const waterPourSound = document.getElementById('waterPourSound');
const levelCompleteSound = document.getElementById('levelCompleteSound');
const hoverSound = document.getElementById('hoverSound');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function genTubes(lvl) {
  let numColors = lvl+2;
  let numTubes = numColors + 2;
  let colors = COLORS.slice(0, numColors);
  let fills = [];
  for(let c of colors) for(let i=0;i<4;i++) fills.push(c);
  shuffle(fills);
  tubes = [];
  for(let i=0;i<numColors;i++) tubes.push(fills.slice(i*4, (i+1)*4));
  tubes = tubes.map(t=>t.reverse());
  tubes.push([],[]); // two empty tubes
}
function renderBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = "";
  tubes.forEach((tube, idx) => {
    let tubeDiv = document.createElement("div");
    tubeDiv.className = "tube" + (selected===idx ? " selected" : "");
    tubeDiv.onclick = ()=>tubeClick(idx);
    tubeDiv.tabIndex = 0; // accessibility
    // !! NO hover sound for tubes !!
    for(let i=0; i<tube.length; i++) {
      let layer = document.createElement("div");
      layer.className = "layer";
      layer.style.background = tube[i];
      layer.style.boxShadow = `0 2px 9px ${tube[i]}55, 0 0 0 #fff0`;
      tubeDiv.appendChild(layer);
    }
    board.appendChild(tubeDiv);
  });
  document.getElementById("moves").textContent = moves;
  document.getElementById("level").textContent = level;
}
function showCompliment(text) {
  let el = document.getElementById('compliment-effect');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => {
    el.classList.remove('show');
  }, 900);
}
function showLevelComplete() {
  showCompliment("LEVEL COMPLETE!");
  // Play win sound
  if (levelCompleteSound) {
    levelCompleteSound.currentTime = 0;
    levelCompleteSound.play();
  }
}
function tubeClick(idx) {
  if(solved) return;
  if(selected<0) {
    if(tubes[idx].length===0) return;
    selected = idx; renderBoard();
  } else {
    if(idx===selected){selected=-1; renderBoard(); return;}
    if(tubes[idx].length>=4) {selected=-1; renderBoard(); return;}
    let from = tubes[selected], to = tubes[idx];
    if(from.length===0){selected=-1;renderBoard();return;}
    let moving = from[from.length-1];
    if(to.length>0 && to[to.length-1]!==moving) {selected=-1; renderBoard(); return;}
    let moveCount = 1;
    for(let i=from.length-2;i>=0 && from[i]===moving;i--) moveCount++;
    let space = 4-to.length;
    let pour = Math.min(moveCount, space);
    for(let i=0;i<pour;i++) to.push(from.pop());
    moves++;
    selected=-1;
    renderBoard();
    // --- Water pour sound on every move
    if (waterPourSound) {
      waterPourSound.currentTime = 0;
      waterPourSound.play();
    }
    // Compliment on random pour
    if (Math.random() > 0.54) {
      let cmt = COMPLIMENTS[Math.floor(Math.random()*COMPLIMENTS.length)];
      showCompliment(cmt);
    }
    checkSolved();
  }
}
function checkSolved() {
  solved = tubes.every(t=>t.length===0 || (t.length===4 && t.every(c=>c===t[0])));
  if(solved) {
    setTimeout(()=>{
      showLevelComplete();
      setTimeout(()=>{
        level++; restartGame();
      }, 1200);
    }, 320);
  }
}
function restartGame() {
  moves = 0; selected = -1; solved = false;
  genTubes(level);
  renderBoard();
  document.getElementById("game-status").textContent = "";
}
function addToLeaderboard() {
  let name = prompt("Enter your name for Leadership Board:");
  if(!name) name = "Player";
  leaderboard.push({name, level, moves});
  leaderboard.sort((a,b)=>a.moves-b.moves);
  renderLeaderboard();
}
function renderLeaderboard() {
  let html = '<ol style="padding-left:1.2rem;font-size:1.08rem;">';
  leaderboard.slice(0,10).forEach(e=>{
    html += `<li><b>${e.name}</b> – Level <b>${e.level}</b> in <span style="color:var(--primary);">${e.moves} moves</span></li>`;
  });
  html += '</ol>';
  if(!leaderboard.length) html = "<i>No records yet.</i>";
  let el = document.getElementById("leaderboard-list");
  if(el) el.innerHTML = html;
}
window.onload = ()=>{
  restartGame();
  renderLeaderboard();
};
