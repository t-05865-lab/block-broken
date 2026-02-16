const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    
    if (type === "hit") { // ブロック・パドル衝突音
        osc.type = "square";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === "wall") { // 壁反射音
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === "split") { // 分裂音
        osc.type = "triangle";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// --- パーティクル（火花）システム ---
let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        // ランダムな方向に飛び散る
        this.dx = (Math.random() - 0.5) * 4;
        this.dy = (Math.random() - 0.5) * 4;
        this.alpha = 1; // 透明度
        this.size = Math.random() * 3 + 2;
    }
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.alpha -= 0.02; // 徐々に消える
        this.size *= 0.95;  // 徐々に小さく
    }
    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0; // 透明度リセット
    }
}

function createParticles(x, y, color) {
    for(let i=0; i<8; i++) { // 1回の衝突で8個飛ばす
        particles.push(new Particle(x, y, color));
    }
}

// --- パドル ---
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

// --- ボール ---
let balls = [];
const ballRadius = 10;

// --- ブロック ---
let brickRowCount = 3;
let brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
let bricks = [];

// --- ゲーム状態 ---
let score = 0;
let level = 1;
let gameState = "title"; // title, playing, cleared, gameover

// --- キー操作 ---
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", e => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  if (e.code === "Space") addMultiBall();
});
document.addEventListener("keyup", e => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// --- クリックでゲーム開始 ---
canvas.addEventListener("click", () => {
  if (gameState === "title") {
    level = 1;
    gameState = "playing";
    resetGame();
    draw();
  }
  else if (gameState === "gameover"){
    gameState = "title";
    draw();
    }
    
});

// --- ブロック初期化 ---
function initBricks() {
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = {
        x: 0,
        y: 0,
        status: 1,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    }
  }
}

// --- ゲームリセット ---
function resetGame() {
  brickRowCount = 3 + (level - 1); // レベルに応じて行数増加
  balls = [
    {
      x: canvas.width / 2,
      y: canvas.height - 30,
      dx: 2 + (level - 1) * 0.5,
      dy: -2 - (level - 1) * 0.5
    }
  ];
  paddleX = (canvas.width - paddleWidth) / 2;
  score = 0;
  initBricks();
}

// --- 衝突判定 ---
function collisionDetection() {
  if (!bricks.length || !balls.length) return;

  balls.forEach(ball => {
    for (let c = 0; c < bricks.length; c++) {
      if (!bricks[c]) continue;
      for (let r = 0; r < bricks[c].length; r++) {
        const b = bricks[c][r];
        if (!b) continue;
        if (b.status === 1 &&
            ball.x > b.x &&
            ball.x < b.x + brickWidth &&
            ball.y > b.y &&
            ball.y < b.y + brickHeight
        ) {
          ball.dy = -ball.dy;
          b.status = 0;
          score++;
        }
      }
    }
  });

  // 残ブロックチェック
  let remaining = 0;
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const b = bricks[c][r];
      if (b && b.status === 1) remaining++;
    }
  }

  // 全ブロック破壊でクリア
  if (remaining === 0 && gameState === "playing") {
    gameState = "cleared";
    setTimeout(() => {
      level++;
      resetGame();
      gameState = "playing";
    }, 1500);
  }
}

// --- 描画関数 ---
function drawBricks() {
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const b = bricks[c][r];
      if (b && b.status === 1) {
        b.x = c * (brickWidth + brickPadding) + brickOffsetLeft;
        b.y = r * (brickHeight + brickPadding) + brickOffsetTop;
        ctx.beginPath();
        ctx.rect(b.x, b.y, brickWidth, brickHeight);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function drawBalls() {
  balls.forEach(ball => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  });
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0f0";
  ctx.fill();
  ctx.closePath();
}

function drawScore() {
  ctx.font = "16px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText("スコア: " + score, 10, 20);
  ctx.fillText("レベル: " + level, canvas.width - 80, 20);
}

function drawTitle() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial";
  ctx.fillStyle = "#0ff";
  ctx.textAlign = "center";
  ctx.fillText("ブロック崩しゲーム", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "20px Arial";
  ctx.fillText("クリックでスタート", canvas.width / 2, canvas.height / 2 + 20);
}

function drawClear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial";
  ctx.fillStyle = "#0ff";
  ctx.textAlign = "center";
  ctx.fillText("クリア！次のレベル", canvas.width / 2, canvas.height / 2);
}

function drawGameOver() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial";
  ctx.fillStyle = "#f0f";
  ctx.textAlign = "center";
  ctx.fillText("ゲームオーバー！", canvas.width / 2, canvas.height / 2);
}

// --- マルチボール ---
function addMultiBall() {
  if (balls.length >= 10) return;
  const newBalls = balls.map(ball => ({
    x: ball.x,
    y: ball.y,
    dx: -ball.dx,
    dy: ball.dy
  }));
  balls.push(...newBalls);
}

// --- メイン描画ループ ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === "title") {
    drawTitle();
    requestAnimationFrame(draw);
    return;
  }

  if (gameState === "cleared") {
    drawClear();
    requestAnimationFrame(draw);
    return;
  }

  if (gameState === "gameover") {
    drawGameOver();
    return;
  }

  drawBricks();
  drawBalls();
  drawPaddle();
  drawScore();
  collisionDetection();

  // ボール移動
  for (let i = balls.length - 1; i >= 0; i--) {
    let ball = balls[i];

    // 左右壁
    if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
      ball.dx = -ball.dx;
    }

    // 上壁
    if (ball.y + ball.dy < ballRadius) {
      ball.dy = -ball.dy;
    } else if (ball.y + ball.dy > canvas.height - paddleHeight - ballRadius) {
      // パドル判定
      if (ball.x + ballRadius > paddleX && ball.x - ballRadius < paddleX + paddleWidth) {
        let hitPoint = ball.x - (paddleX + paddleWidth / 2);
        ball.dx = hitPoint * 0.15;
        ball.dy = -Math.abs(ball.dy);
      } else {
        balls.splice(i, 1);
      }
    }

    ball.x += ball.dx;
    ball.y += ball.dy;
  }

  if (balls.length === 0 && gameState === "playing") {
    gameState = "gameover";
  }

  // パドル操作
  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
  if (leftPressed && paddleX > 0) paddleX -= 5;

  requestAnimationFrame(draw);
}

// --- ゲーム開始 ---
draw();
