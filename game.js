const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const milestoneMsg = document.getElementById("milestoneMsg");
const pauseBtn = document.getElementById("pauseBtn");
const themeToggle = document.getElementById("themeToggle");
const followBtn = document.getElementById("followBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const BASE_WIDTH = 480;
const BASE_HEIGHT = 320;

const GRAVITY = 0.6;
const JUMP = -12;

let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("goldenFlyHighScore") || "0");
let speed = 2;
const MAX_SPEED = 8;
const speedCurve = 0.0008;

let milestoneShown = false;

const milestoneSounds = ["Great!", "Awesome!", "Keep it up!", "Nice!", "Wow!"];

const player = {
  x: 50,
  y: 0,
  width: 30,
  height: 30,
  velocityY: 0,
  grounded: false
};

const groundHeight = 50;
let obstacles = [];

// Adjusted createObstacle with dynamic gap for early game
function createObstacle() {
  const height = Math.random() * 60 + 30;

  // Wider gap for early obstacles (score < 10)
  let gap = score < 10 ? 250 : 150;

  obstacles.push({
    x: canvas.width + gap,
    y: canvas.height - groundHeight - height,
    width: 25,
    height: height
  });
}

function resizeCanvas() {
  let container = document.getElementById("gameWrapper");
  let width = container.clientWidth;
  let height = width * 2 / 3;
  canvas.width = BASE_WIDTH;
  canvas.height = BASE_HEIGHT;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
}

function resetGame() {
  score = 0;
  speed = 2;
  player.y = canvas.height - groundHeight - player.height;
  player.velocityY = 0;
  obstacles = [];
  gameOver = false;
  milestoneShown = false;
  scoreEl.textContent = "Score: 0";
  highScoreEl.textContent = `High Score: ${highScore}`;
  milestoneMsg.textContent = "";
}

function drawPlayer() {
  ctx.fillStyle = "#f9d71c";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillStyle = "#121b2b";
  ctx.fillRect(player.x + 6, player.y + 8, 5, 5);
  ctx.fillRect(player.x + 18, player.y + 8, 5, 5);
}

function drawGround() {
  ctx.fillStyle = "#123d6a";
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

function drawObstacles() {
  ctx.fillStyle = "#124a1f";
  obstacles.forEach(obs => {
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
}

function updateObstacles() {
  obstacles.forEach(obs => {
    obs.x -= speed;
  });

  if (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
    obstacles.shift();
    score++;
    scoreEl.textContent = "Score: " + score;

    if (score > highScore) {
      highScore = score;
      localStorage.setItem("goldenFlyHighScore", highScore);
      highScoreEl.textContent = `High Score: ${highScore}`;
    }

    if (score % 10 === 0) {
      showMilestoneMessage(score);
    }
  }

  // Use dynamic gap based on score
  let lastObstacleX = obstacles.length ? obstacles[obstacles.length - 1].x : canvas.width;
  let minGap = score < 10 ? 250 : 150;

  if (obstacles.length === 0 || lastObstacleX < canvas.width - minGap) {
    createObstacle();
  }
}

function showMilestoneMessage(score) {
  let msg = milestoneSounds[(score / 10) % milestoneSounds.length | 0];
  milestoneMsg.textContent = msg;
  milestoneMsg.style.opacity = 1;
  setTimeout(() => {
    milestoneMsg.textContent = "";
  }, 1000);
}

function checkCollision() {
  for (let obs of obstacles) {
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y + player.height > obs.y
    ) {
      return true;
    }
  }
  return false;
}

function gameLoop() {
  if (gamePaused || gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();

  if (!gameStarted) {
    ctx.fillStyle = "#f9d71c";
    ctx.font = "22px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Press ENTER to start", canvas.width / 2, canvas.height / 2);
    requestAnimationFrame(gameLoop);
    return;
  }

  player.velocityY += GRAVITY;
  player.y += player.velocityY;

  if (player.y + player.height >= canvas.height - groundHeight) {
    player.y = canvas.height - groundHeight - player.height;
    player.velocityY = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }

  updateObstacles();
  drawObstacles();
  drawPlayer();

  if (checkCollision()) {
    gameOver = true;

    // Vibrate for 500ms on game over if supported
    if (navigator.vibrate) {
      navigator.vibrate(500);
    }

    ctx.fillStyle = "#f9d71c";
    ctx.font = "24px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Game Over! Press ENTER to restart", canvas.width / 2, canvas.height / 2);
    return;
  }

  if (speed < MAX_SPEED) {
    speed += speedCurve * (MAX_SPEED - speed);
  }

  requestAnimationFrame(gameLoop);
}

// ========== EVENTS ==========

document.addEventListener("keydown", e => {
  if (e.code === "Enter") {
    if (!gameStarted || gameOver) {
      resetGame();
      gameStarted = true;
      gamePaused = false;
      gameOver = false;
      gameLoop();
    }
  }

  if ((e.code === "Space" || e.code === "ArrowUp") && gameStarted && !gameOver && !gamePaused) {
    if (player.grounded) {
      player.velocityY = JUMP;
    }
  }

  if (e.code === "KeyP") {
    togglePause();
  }
});

canvas.addEventListener("touchstart", () => {
  if (player.grounded && gameStarted && !gamePaused && !gameOver) {
    player.velocityY = JUMP;
  }
});

pauseBtn.addEventListener("click", togglePause);
themeToggle.addEventListener("click", toggleTheme);
fullscreenBtn.addEventListener("click", toggleFullscreen);

function togglePause() {
  gamePaused = !gamePaused;
  pauseBtn.textContent = gamePaused ? "Resume" : "Pause";
  if (!gamePaused) gameLoop();
}

function toggleTheme() {
  document.body.classList.toggle("light-mode");
  themeToggle.textContent = document.body.classList.contains("light-mode")
    ? "Dark Mode"
    : "Light Mode";
}

function toggleFullscreen() {
  const wrapper = document.getElementById("gameWrapper");
  if (!document.fullscreenElement && wrapper.requestFullscreen) {
    wrapper.requestFullscreen();
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

followBtn.addEventListener("click", () => {
  window.open("https://www.instagram.com/mr_ajhacker/", "_blank");
});

window.addEventListener("resize", resizeCanvas);

resetGame();
resizeCanvas();
gameLoop();
