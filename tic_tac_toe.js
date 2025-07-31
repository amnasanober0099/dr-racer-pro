const cells       = document.querySelectorAll('[data-cell]');
const statusText  = document.getElementById('status');
const restartBtn  = document.getElementById('restart');
const btnPvc      = document.getElementById('btnPvc');
const btnPvp      = document.getElementById('btnPvp');
const effectMsg   = document.getElementById('effect-msg');

// SOUND EFFECTS
const moveXSound  = document.getElementById('moveXSound');
const moveOSound  = document.getElementById('moveOSound');
const winSound    = document.getElementById('winSound');

const WIN_COMBINATIONS = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];
const EFFECTS = ['Good!', 'Great!', 'Awesome!', 'Nice!', 'Amazing!', 'Winner!', 'Superb!'];

let mode = 'pvc'; // 'pvc' or 'pvp'
let human = 'X', ai = 'O', current = 'X', gameOver = false, board = Array(9).fill('');

// Mode switch
btnPvc.onclick = ()=>{ mode='pvc'; btnPvc.classList.add('active'); btnPvp.classList.remove('active'); startGame(); };
btnPvp.onclick = ()=>{ mode='pvp'; btnPvp.classList.add('active'); btnPvc.classList.remove('active'); startGame(); };
restartBtn.onclick = startGame;

function startGame() {
  gameOver = false;
  current = 'X';
  board = Array(9).fill('');
  cells.forEach((cell, idx) => {
    cell.textContent = '';
    cell.className = 'tic-cell';
    cell.addEventListener('click', handleClick, { once: true });
  });
  setStatus(mode==='pvc' ? `Your turn — <strong>X</strong>` : `Player <strong>X</strong>'s turn`);
  effectMsg.textContent = '';
  effectMsg.classList.remove('show');
}

function handleClick(e) {
  if(gameOver) return;
  const cell = e.target;
  const idx = [...cells].indexOf(cell);
  if(board[idx]) return;

  makeMove(idx, current);

  // --- SFX per move
  if(current === "X" && moveXSound) { moveXSound.currentTime = 0; moveXSound.play(); }
  if(current === "O" && moveOSound) { moveOSound.currentTime = 0; moveOSound.play(); }

  if (checkWin(current))   return winEffect(current);
  if (isDraw())            return endGame("It's a draw.");

  if(mode==='pvc' && current===human) {
    setStatus(`Computer's turn — <strong>O</strong>`);
    setTimeout(()=> {
      let idx = bestMove(board.slice());
      makeMove(idx, ai);

      // --- SFX for computer move
      if(moveOSound) { moveOSound.currentTime = 0; moveOSound.play(); }

      if (checkWin(ai))   return winEffect(ai);
      if (isDraw())       return endGame("It's a draw.");
      setStatus(`Your turn — <strong>X</strong>`);
    }, 480);
  } else {
    current = current==='X'?'O':'X';
    setStatus(mode==='pvp' ? `Player <strong>${current}</strong>'s turn` : (current===human?`Your turn — <strong>X</strong>`:`Computer's turn — <strong>O</strong>`));
  }
}

function makeMove(idx, player) {
  board[idx]=player;
  cells[idx].textContent = player;
  cells[idx].classList.add('disabled');
  cells[idx].removeEventListener('click', handleClick);
}

function checkWin(player) {
  return WIN_COMBINATIONS.find(combo =>
    combo.every(i => board[i] === player)
  );
}
function isDraw() {
  return board.every(cell => cell);
}

function winEffect(player) {
  const combo = checkWin(player);
  if(combo){
    combo.forEach(i => cells[i].classList.add('win'));
    showEffect();
    if(winSound) { winSound.currentTime = 0; winSound.play(); }
    endGame(`<b>${player==='X' ? (mode==='pvc'?'You win!':'Player X wins!') : (mode==='pvc'?'Computer wins!':'Player O wins!')}</b>`);
  }
}
function showEffect() {
  effectMsg.textContent = EFFECTS[Math.floor(Math.random()*EFFECTS.length)];
  effectMsg.classList.add('show');
  setTimeout(()=>effectMsg.classList.remove('show'), 900);
}
function endGame(msg){
  gameOver=true;
  setStatus(msg);
  cells.forEach(cell=>cell.classList.add('disabled'));
  if(winSound) { winSound.currentTime = 0; winSound.play(); }
}
// ---- AI (minimax) ---
function bestMove(bd) {
  let best = -Infinity, move=null;
  bd.forEach((cell,idx)=>{
    if(!cell){
      bd[idx]=ai;
      let score=minimax(bd,0,false);
      bd[idx]='';
      if(score>best){best=score;move=idx;}
    }
  });
  return move;
}
function minimax(bd, depth, isMax) {
  if (staticWin(bd, ai))    return 10-depth;
  if (staticWin(bd, human)) return depth-10;
  if (bd.every(c=>c))       return 0;
  if(isMax){
    let best=-Infinity;
    bd.forEach((c,idx)=>{
      if(!c){
        bd[idx]=ai;
        let val=minimax(bd,depth+1,false);
        bd[idx]='';
        best=Math.max(best,val);
      }
    });
    return best;
  }else{
    let best=Infinity;
    bd.forEach((c,idx)=>{
      if(!c){
        bd[idx]=human;
        let val=minimax(bd,depth+1,true);
        bd[idx]='';
        best=Math.min(best,val);
      }
    });
    return best;
  }
}
function staticWin(bd,player){
  return WIN_COMBINATIONS.some(combo=>combo.every(i=>bd[i]===player));
}
function setStatus(html){ statusText.innerHTML=html; }

// Auto-start on page load
startGame();
