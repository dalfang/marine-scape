window.onload = function () {
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const musicToggle = document.getElementById("musicToggle");
  const ourGame = new Game();

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
      ourGame.player.element.src = "./img/Playerright.png";
      ourGame.player.directionX = 4;
    } else if (event.code === "ArrowLeft") {
      ourGame.player.element.src = "./img/Playerleft.png";
      ourGame.player.directionX = -4;
    } else if (event.code === "ArrowUp") {
      ourGame.player.element.src = "./img/Playerup.png";
      ourGame.player.directionY = -4;
    } else if (event.code === "ArrowDown") {
      ourGame.player.element.src = "./img/Playerdown.png";
      ourGame.player.directionY = 4;
    }
  });

  document.addEventListener("keyup", () => {
    ourGame.player.directionX = 0;
    ourGame.player.directionY = 0;
  });

  function instructions() {
    console.log("to read");
    ourGame.instructions();
  }

  function startGame() {
    console.log("start game");
    ourGame.start();
    const backgroundMusic = document.getElementById("backgroundMusic");
    backgroundMusic.play();
    musicToggle.classList.remove("paused");
  }

  musicToggle.addEventListener("click", function () {
    const backgroundMusic = document.getElementById("backgroundMusic");
    if (backgroundMusic.paused) {
      backgroundMusic.play();
      musicToggle.classList.remove("paused");
    } else {
      backgroundMusic.pause();
      musicToggle.classList.add("paused");
    }
  });

  restartButton.addEventListener("click", () => {
    window.location.reload();
  });
};
