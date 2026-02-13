const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// パドル
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth)/2;

// ボール
let x = canvas.width/2;
let y = canvas.height-30;
let dx = 2;
let dy = -2;
const ballRadius = 10;

// ブロック
const brickRowCount = 3;
const brickColumnCount = 5;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
let bricks = [];

// スコア
let score = 0;

// 初期化関数（リセット用）
function initBricks() {
    bricks = [];
    for(let c=0; c<brickColumnCount; c++){
        bricks[c] = [];
        for(let r=0; r<brickRowCount; r++){
            bricks[c][r] = { x:0, y:0, status:1 };
        }
    }
    score = 0;
}

// 初期化
initBricks();

// キー操作
let rightPressed = false;
let leftPressed = false;
document.addEventListener("keydown", e => {
  if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// 衝突判定
function collisionDetection(){
    for(let c=0;c<brickColumnCount;c++){
        for(let r=0;r<brickRowCount;r++){
            let b = bricks[c][r];
            if(b.status === 1){
                if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight){
                    dy = -dy;
                    b.status = 0;
                    score++;
                    if(score === brickRowCount * brickColumnCount){
                        // クリア
                        drawClear();
                        setTimeout(resetGame, 2000); // 2秒後にリセット
                    }
                }
            }
        }
    }
}

// クリア画面描画
function drawClear(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "#0ff";
    ctx.textAlign = "center";
    ctx.fillText("ゲームクリア！", canvas.width/2, canvas.height/2);
}

// 描画関数
function drawBall(){
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#ff0";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle(){
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0f0";
    ctx.fill();
    ctx.closePath();
}

function drawBricks(){
    for(let c=0;c<brickColumnCount;c++){
        for(let r=0;r<brickRowCount;r++){
            if(bricks[c][r].status === 1){
                let brickX = (c*(brickWidth+brickPadding))+brickOffsetLeft;
                let brickY = (r*(brickHeight+brickPadding))+brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "#f00";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// ゲームリセット
function resetGame(){
    x = canvas.width/2;
    y = canvas.height-30;
    dx = 2;
    dy = -2;
    paddleX = (canvas.width - paddleWidth)/2;
    initBricks();
    draw();
}

// メイン描画
function draw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();

    // 壁反射
    if(x + dx > canvas.width-ballRadius || x + dx < ballRadius) dx = -dx;
    if(y + dy < ballRadius) dy = -dy;
    else if(y + dy > canvas.height-ballRadius){
        if(x > paddleX && x < paddleX + paddleWidth) dy = -dy;
        else alert("ゲームオーバー"), resetGame();
    }

    // パドル移動
    if(rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
    if(leftPressed && paddleX > 0) paddleX -= 5;

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

draw();
