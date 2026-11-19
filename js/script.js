window.onload = function () {
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const musicToggle = document.getElementById("musicToggle");
  const highScoreForm = document.getElementById("high-score-form");
  const playerNameInput = document.getElementById("player-name");
  const touchControls = document.getElementById("touch-controls");
  const ourGame = new Game();

  if (localStorage.getItem("marineScapeMuted") === "true") {
    musicToggle.classList.add("paused");
  }

  function movePlayer(direction) {
    ourGame.player.directionX = 0;
    ourGame.player.directionY = 0;

    if (direction === "right") {
      ourGame.player.element.src = "./img/Playerright.png";
      ourGame.player.directionX = 4;
    } else if (direction === "left") {
      ourGame.player.element.src = "./img/Playerleft.png";
      ourGame.player.directionX = -4;
    } else if (direction === "up") {
      ourGame.player.element.src = "./img/Playerup.png";
      ourGame.player.directionY = -4;
    } else if (direction === "down") {
      ourGame.player.element.src = "./img/Playerdown.png";
      ourGame.player.directionY = 4;
    }
  }

  function stopPlayer() {
    ourGame.player.directionX = 0;
    ourGame.player.directionY = 0;
  }

  startButton.addEventListener("click", function () {
    instructions();
  });

  const closeInstructions = document.getElementById("instructions");
  closeInstructions.addEventListener("click", function () {
    startGame();
  });

  document.addEventListener("keydown", (event) => {
    console.log("a key was pressed", event);
    if (event.code === "ArrowRight") {
      movePlayer("right");
    } else if (event.code === "ArrowLeft") {
      movePlayer("left");
    } else if (event.code === "ArrowUp") {
      movePlayer("up");
    } else if (event.code === "ArrowDown") {
      movePlayer("down");
    }
  });

  document.addEventListener("keyup", () => {
    stopPlayer();
  });

  document.querySelectorAll(".touch-control").forEach((control) => {
    control.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      control.setPointerCapture(event.pointerId);
      movePlayer(control.dataset.direction);
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach((eventName) => {
      control.addEventListener(eventName, stopPlayer);
    });
  });

  function instructions() {
    console.log("to read");
    ourGame.instructions();
  }

  function startGame() {
    console.log("start game");
    ourGame.start();
    touchControls.classList.add("is-visible");
    const backgroundMusic = document.getElementById("backgroundMusic");
    if (localStorage.getItem("marineScapeMuted") === "true") {
      musicToggle.classList.add("paused");
    } else {
      backgroundMusic.play();
      musicToggle.classList.remove("paused");
    }
  }

  musicToggle.addEventListener("click", function () {
    const backgroundMusic = document.getElementById("backgroundMusic");
    if (backgroundMusic.paused) {
      backgroundMusic.play();
      musicToggle.classList.remove("paused");
      localStorage.setItem("marineScapeMuted", "false");
    } else {
      backgroundMusic.pause();
      musicToggle.classList.add("paused");
      localStorage.setItem("marineScapeMuted", "true");
    }
  });

  restartButton.addEventListener("click", () => {
    window.location.reload();
  });

  highScoreForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await ourGame.saveHighScoreName(playerNameInput.value);
  });

  if (new URLSearchParams(window.location.search).get("preview") === "game-over") {
    ourGame.score = 250;
    ourGame.gameOver();
  }
};
