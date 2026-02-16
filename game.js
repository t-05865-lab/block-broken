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
let brickRowCount = 3 ;
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
document.addEventListener("keydown", e => {
  if(e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if(e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  if(e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
});

// クリックでゲーム開始
canvas.addEventListener("click", () => {
    if(gameState === "title"){
        gameState = "playing";
        resetGame();
    }
});

// ブロック初期化
function initBricks() {
    bricks = [];
    for(let c=0; c<brickColumnCount; c++){
        bricks[c] = [];
        for(let r=0; r<brickRowCount; r++){
            bricks[c][r] = { x:0, y:0, status:1 ,color: `hsl(${Math.random()*360}, 70%, 50%)`};
        }
    }
}

// ゲームリセット
function resetGame(){
    x = canvas.width/2;
    y = canvas.height-30;
    dx = 2 + (level-1)*0.5; // レベルで速度アップ
    dy = -2 - (level-1)*0.5;
    paddleX = (canvas.width - paddleWidth)/2;
    score = 0;
    brickRowCount = 3 + level - 1;
    initBricks();
}

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
                    if(score === brickRowCount*brickColumnCount){
                        gameState = "cleared";
                        drawClear();
                        setTimeout(() => {
                            level++;
                            gameState = "playing";
                            resetGame();
                            draw();
                        }, 2000);
                    }
                }
            }
        }
    }
}

// 描画関数
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
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

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

function drawScore(){
    ctx.font = "16px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText("スコア: "+score, 8, 20);
    ctx.fillText("レベル: "+level, canvas.width-80, 20);
}

// タイトル画面
function drawTitle(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "#0ff";
    ctx.textAlign = "center";
    ctx.fillText("ブロック崩しゲーム", canvas.width/2, canvas.height/2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText("クリックでスタート", canvas.width/2, canvas.height/2 + 20);
}

// クリア画面
function drawClear(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "#0ff";
    ctx.textAlign = "center";
    ctx.fillText("クリア！次のレベル", canvas.width/2, canvas.height/2);
}

// ゲームオーバー画面
function drawGameOver(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "#f0f";
    ctx.textAlign = "center";
    ctx.fillText("ゲームオーバー！", canvas.width/2, canvas.height/2);
}

// メイン描画
function draw(){
    if(gameState === "title"){
        drawTitle();
        requestAnimationFrame(draw);
        return;
    }
    if(gameState === "cleared" || gameState === "gameover") return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    collisionDetection();

    // 壁反射
if(x + dx > canvas.width - ballRadius || x + dx < ballRadius){
    dx = -dx;
}

if(y + dy < ballRadius){
    dy = -dy;
}
else if(y + dy > canvas.height - ballRadius){

    // パドルに当たっているか
    if(
        x > paddleX &&
        x < paddleX + paddleWidth
    ){
        let hitPoint = x - (paddleX + paddleWidth/2);
        dx = hitPoint * 0.15;
        dy = -Math.abs(dy);
    }
    else{
        gameState = "gameover";
        drawGameOver();
        setTimeout(() => {
            gameState = "title";
            draw();
        }, 2000);
        return;
    }


    // パドル操作
    if(rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
    if(leftPressed && paddleX > 0) paddleX -= 5;

    x += dx;
    y += dy;

    requestAnimationFrame(draw);
}

// ゲーム開始
draw();
