// Compliment messages for effect!
const compliments = [
  "Nice Move! 🎉", "Excellent! 🚀", "Awesome! 💥",
  "Superb! 😎", "Amazing! 🌟", "Sweet! 🍬",
  "Fruity Fun! 🍇", "Woah! 🔥"
];

// --- Fewer fruits for easy mode!
const fruits = [
  "🍉","🍌","🍓","🍍"
];

// Board settings
const ROWS = 8, COLS = 8, MOVES = 25;
let board = [], score = 0, moves = MOVES, gameActive = false, selected = null, leaderboard = [];

function randomFruit() {
  return fruits[Math.floor(Math.random() * fruits.length)];
}

// Easier: Allow initial matches for more frequent matches in-game!
function initBoard() {
  board = [];
  for(let r=0;r<ROWS;r++) {
    let row = [];
    for(let c=0;c<COLS;c++) row.push(randomFruit());
    board.push(row);
  }
  // Comment out clearInitialMatches to allow initial matches!
  // clearInitialMatches();
}

function renderBoard() {
  let html = '';
  for(let r=0;r<ROWS;r++) {
    html += '<div class="board-row">';
    for(let c=0;c<COLS;c++) {
      let cellId = `cell-${r}-${c}`;
      let sel = (selected && selected.r===r && selected.c===c) ? "selected":"";
      html += `<div class="fruit-cell ${sel}" id="${cellId}" data-r="${r}" data-c="${c}" onclick="cellClick(${r},${c})">${board[r][c]}</div>`;
    }
    html += '</div>';
  }
  document.getElementById("fruit-board").innerHTML = html;
}

function startGame() {
  score = 0;
  moves = MOVES;
  gameActive = true;
  selected = null;
  document.getElementById("score").textContent = score;
  document.getElementById("moves").textContent = moves;
  document.getElementById("game-status").textContent = "";
  document.getElementById("effect-msg").textContent = "";
  document.getElementById("effect-msg").classList.remove("show");
  initBoard();
  renderBoard();
}

function cellClick(r,c) {
  if(!gameActive || moves<=0) return;
  if(!selected) {
    selected = {r:r, c:c};
    renderBoard();
  } else {
    if(selected.r===r && selected.c===c) {
      selected = null;
      renderBoard();
      return;
    }
    if(isAdjacent(selected.r,selected.c,r,c)) {
      swap(selected.r,selected.c,r,c);
      if(findMatches().length) {
        moves--;
        document.getElementById("moves").textContent = moves;
        handleMatches(() => {
          selected = null;
          renderBoard();
          if(moves<=0) gameOver();
        });
      } else {
        // Not a valid move, swap back
        swap(selected.r,selected.c,r,c);
        selected = null;
        renderBoard();
      }
    } else {
      selected = {r:r, c:c};
      renderBoard();
    }
  }
}

function isAdjacent(r1,c1,r2,c2) {
  return (Math.abs(r1-r2)+Math.abs(c1-c2))===1;
}

function swap(r1,c1,r2,c2) {
  let tmp = board[r1][c1];
  board[r1][c1] = board[r2][c2];
  board[r2][c2] = tmp;
  renderBoard();
}

function findMatches() {
  let matches = [];
  // Horizontal
  for(let r=0;r<ROWS;r++) {
    let streak=1;
    for(let c=1;c<=COLS;c++) {
      if(c<COLS && board[r][c]===board[r][c-1]) {
        streak++;
      } else {
        if(streak>=3) matches.push({r:r, c:c-streak, len:streak, dir:'h'});
        streak=1;
      }
    }
  }
  // Vertical
  for(let c=0;c<COLS;c++) {
    let streak=1;
    for(let r=1;r<=ROWS;r++) {
      if(r<ROWS && board[r][c]===board[r-1][c]) {
        streak++;
      } else {
        if(streak>=3) matches.push({r:r-streak, c:c, len:streak, dir:'v'});
        streak=1;
      }
    }
  }
  return matches;
}

function handleMatches(cb) {
  let matches = findMatches();
  if(!matches.length) {
    if(cb) cb();
    return;
  }
  let toClear = Array.from({length:ROWS},()=>Array(COLS).fill(0));
  matches.forEach(m => {
    for(let i=0;i<m.len;i++) {
      if(m.dir==='h') toClear[m.r][m.c+i]=1;
      if(m.dir==='v') toClear[m.r+i][m.c]=1;
    }
    score += (m.len>=4) ? 30*m.len : 10*m.len;
  });
  document.getElementById("score").textContent = score;

  // Compliment message logic
  let showCompliment = false;
  if (matches.some(m => m.len >= 4)) showCompliment = true;
  else if (Math.random() > 0.3) showCompliment = true;
  if(showCompliment){
    let compliment = compliments[Math.floor(Math.random() * compliments.length)];
    showEffectMsg(compliment);
  }

  // Animate clearing
  for(let r=0;r<ROWS;r++)
    for(let c=0;c<COLS;c++)
      if(toClear[r][c]) {
        let cell = document.getElementById(`cell-${r}-${c}`);
        if(cell) cell.classList.add("clearing");
      }
  setTimeout(()=>{
    // Remove matched
    for(let r=ROWS-1;r>=0;r--)
      for(let c=0;c<COLS;c++)
        if(toClear[r][c]) {
          for(let k=r;k>0;k--) board[k][c]=board[k-1][c];
          board[0][c]=randomFruit();
        }
    renderBoard();
    setTimeout(()=>handleMatches(cb),210);
  },400);
}

// For original hard mode, you could use this:
// function clearInitialMatches() { ... }

function gameOver() {
  gameActive = false;
  document.getElementById("game-status").textContent = "Game Over! Final Score: "+score+". Enter your name for leaderboard.";
  setTimeout(()=>addToLeaderboard(),600);
}

function addToLeaderboard() {
  let user = prompt("Enter your name for Leadership Board:");
  if(!user) user = "Player";
  leaderboard.push({name:user, score:score});
  leaderboard.sort((a,b)=>b.score-a.score);
  renderLeaderboard();
}

function renderLeaderboard() {
  let html = '<ol style="padding-left:1.2rem;font-size:1.08rem;">';
  leaderboard.slice(0,10).forEach(e=>{
    html += `<li><b>${e.name}</b> – <span style="color:var(--primary);">${e.score}</span></li>`;
  });
  html += '</ol>';
  if(!leaderboard.length) html = "<i>No records yet.</i>";
  document.getElementById("leaderboard-list").innerHTML = html;
}

function showEffectMsg(msg){
  const eff = document.getElementById('effect-msg');
  eff.textContent = msg;
  eff.classList.add('show');
  setTimeout(() => {
    eff.classList.remove('show');
    eff.textContent = '';
  }, 1200);
}

window.onload = function() {
  startGame();
  renderLeaderboard();
};
