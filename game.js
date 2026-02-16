const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// パドル
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;

// ボール
let balls = [];
const ballRadius = 10;

// ブロック
let brickRowCount = 3;
let brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
let bricks = [];

// ゲーム状態
let score = 0;
let level = 1;
let gameState = "title"; // title, playing, cleared, gameover

// キー操作
let rightPressed = false;
let leftPressed = false;

// キーイベント
document.addEventListener("keydown", e => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  if (e.code === "Space") addMultiBall();
});
document.addEventListener("keyup", e => {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// クリックでゲーム開始
canvas.addEventListener("click", () => {
  if (gameState === "title") {
    gameState = "playing";
    resetGame();
  }
});

// ブロック初期化
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

// ゲームリセット
function resetGame() {
  balls = [
    {
      x: canvas.width / 2,
      y: canvas.height - 30,
      dx: 2 + (level - 1) * 0.5,
      dy: -2 - (level - 1) * 0.5
    }
  ];

  paddleX = (canvas.width - paddleWidth) / 2;
  brickRowCount = 3 + level - 1;
  score = 0;
  initBricks();
}

// 衝突判定
function collisionDetection() {
  if (!bricks || bricks.length === 0 || !balls || balls.length === 0) return;

  balls.forEach(ball => {
    for (let c = 0; c < brickColumnCount; c++) {
      if (!bricks[c]) continue;
      for (let r = 0; r < brickRowCount; r++) {
        let b = bricks[c][r];
        if (!b) continue;

        if (b.status === 1) {
          if (
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
    }
  });

  // 残ブロックチェック
  let remaining = 0;
  for (let c = 0; c < brickColumnCount; c++) {
    if (!bricks[c]) continue;
    for (let r = 0; r < brickRowCount; r++) {
      if (!bricks[c][r]) continue;
      if (bricks[c][r].status === 1) remaining++;
    }
  }

  if (remaining === 0 && gameState === "playing") {
    gameState = "cleared";
    setTimeout(() => {
      level++;
      gameState = "playing";
      resetGame();
    }, 1500);
  }
}

// 描画関数
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      let b = bricks[c][r];
      if (b && b.status === 1) {
        let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        b.x = brickX;
        b.y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
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

// 画面表示
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

// マルチボール
function addMultiBall() {
  if (balls.length >= 10) return;
  let newBalls = [];
  balls.forEach(ball => {
    newBalls.push({
      x: ball.x,
      y: ball.y,
      dx: -ball.dx,
      dy: ball.dy
    });
  });
  balls.push(...newBalls);
}

// メイン描画ループ
function draw() {
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

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBricks();
  drawBalls();
  drawPaddle();
  drawScore();
  collisionDetection();

  // ボール移動と壁・パドル判定
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
        // ボール削除
        balls.splice(i, 1);
      }
    }

    ball.x += ball.dx;
    ball.y += ball.dy;
  }

  // ボールが全滅したらゲームオーバー
  if (balls.length === 0) {
    gameState = "gameover";
  }

  // パドル操作
  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
  if (leftPressed && paddleX > 0) paddleX -= 5;

  requestAnimationFrame(draw);
}

// ゲーム開始
draw();
