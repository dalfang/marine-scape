class Game {
  constructor() {
    this.startScreen = document.getElementById("game-intro");
    this.instructionsScreen = document.getElementById("instructions");
    this.gameScreen = document.getElementById("game-screen");
    this.gameViewport = document.getElementById("game-viewport");
    this.gameEndScreen = document.getElementById("game-end");
    this.player = new Player(
      this.gameScreen,
      40,
      -300,
      "./img/Playerright.png"
    );
    //this.backgroundMusic = document.getElementById('backgroundMusic');
    //this.backgroundMusic.volume = 0.25;
    this.height = 585;
    this.width = 900;
    this.obstacles = [];
    this.hearts = [new Heart(this.gameScreen)];
    this.bonuses = [new Bonus(this.gameScreen)];
    this.score = 0;
    this.leaderboard = this.getLeaderboard();
    this.highScore = this.leaderboard[0]?.score || 0;
    this.highScoreName = this.leaderboard[0]?.name || "";
    this.supabaseClient = this.createSupabaseClient();
    this.loadSharedLeaderboard();
    this.isNewHighScore = false;
    this.bubbles = 0;
    this.lives = 5;
    this.isGameOver = false;
    this.gameIntervalId = null;
    this.gameLoopFrequency = 1000 / 65;
    this.counter = 0;
    this.level = 120;
    this.minimumObstacleGap = 350;
    this.obstacleSpeed = 9;
    this.obstacleBounds = { top: 50, bottom: 550 };
    this.greenHeart = null;
    this.nextGreenHeartTick = this.randomGreenHeartDelay();
    this.boostTicksLeft = 0;
    this.immortalTicksLeft = 0;
    this.boostOverlay = null;
    this.speedFactor = 1;
    this.fitGameScreen = this.fitGameScreen.bind(this);
    window.addEventListener("resize", this.fitGameScreen);
  }

  instructions() {
    this.instructionsScreen.style.display = "block";
    this.instructionsScreen.style.height = `${this.height}px`;
    this.gameScreen.style.width = `${this.width}px`;
    this.startScreen.style.display = "none";
    this.gameViewport.style.display = "none";
    this.gameScreen.style.display = "none";
  }

  start() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.instructionsScreen.style.display = "none";
    this.gameScreen.style.height = `${this.height}px`;
    this.gameScreen.style.width = `${this.width}px`;
    this.startScreen.style.display = "none";
    this.gameViewport.style.display = "block";
    this.gameScreen.style.display = "block";
    this.fitGameScreen();
    new Image().src = "./img/bgwide-small.png";
    new Image().src = "./img/bgbrown.png";
    this.startRun();
    document.getElementById("lives-container").style.display = "flex";
    document.getElementById("score-container").style.display = "flex";
    this.updateScoreDisplay();
    this.lastFrameTime = performance.now();
    this.accumulatedTime = 0;
    const frame = (now) => {
      if (this.isGameOver) {
        return;
      }
      this.accumulatedTime += Math.min(now - this.lastFrameTime, 250);
      this.lastFrameTime = now;
      while (this.accumulatedTime >= this.gameLoopFrequency && !this.isGameOver) {
        this.gameLoop();
        this.accumulatedTime -= this.gameLoopFrequency;
      }
      this.gameIntervalId = requestAnimationFrame(frame);
    };
    this.gameIntervalId = requestAnimationFrame(frame);
  }

  gameLoop() {
    this.update();
    this.counter++;
    this.updateBoost();
    this.updateDifficulty();
    if (
      this.counter >= this.nextGreenHeartTick &&
      !this.greenHeart &&
      this.boostTicksLeft === 0
    ) {
      this.greenHeart = new Heart(this.gameScreen, "./img/greenheart.png", this.width);
      this.nextGreenHeartTick = this.counter + this.randomGreenHeartDelay();
    }
    if (this.counter % this.level === 0 && this.canSpawnObstacle()) {
      const bounds =
        this.boostTicksLeft > 0 ? { top: 0, bottom: this.height } : this.obstacleBounds;
      this.obstacles.push(new Obstacle(this.gameScreen, this.obstacleSpeed, bounds));
    }
    if (this.isGameOver) {
      cancelAnimationFrame(this.gameIntervalId);
      this.gameOver();
    }
  }

  updateDifficulty() {
    if (this.score >= 100 && !this.isDeepBackground) {
      this.isDeepBackground = true;
      this.fadeToDeepBackground();
      this.obstacleBounds = { top: 0, bottom: this.height };
    }
    if (this.score >= 1500) {
      this.level = 40;
      this.obstacleSpeed = 15;
    } else if (this.score >= 1000) {
      this.level = 45;
      this.obstacleSpeed = 14;
    } else if (this.score >= 800) {
      this.level = 55;
      this.obstacleSpeed = 13;
    } else if (this.score >= 600) {
      this.level = 65;
      this.obstacleSpeed = 12;
    } else if (this.score >= 400) {
      this.level = 75;
      this.obstacleSpeed = 11;
    } else if (this.score >= 200) {
      this.level = 85;
      this.obstacleSpeed = 10;
    }
  }

  fadeToDeepBackground() {
    const overlay = document.createElement("div");
    overlay.className = "deep-background";
    this.gameScreen.appendChild(overlay);
    overlay.getBoundingClientRect();
    overlay.style.opacity = "1";
  }

  canSpawnObstacle() {
    const newestObstacle = this.obstacles[this.obstacles.length - 1];
    if (!newestObstacle) {
      return true;
    }
    const gapAfterNewestObstacle = this.width - (newestObstacle.left + newestObstacle.width);
    return gapAfterNewestObstacle >= this.minimumObstacleGap;
  }

  fitGameScreen() {
    const availableWidth = Math.max(280, window.innerWidth - 24);
    const scale = Math.min(1, availableWidth / this.width);
    this.gameViewport.style.width = `${this.width * scale}px`;
    this.gameViewport.style.height = `${this.height * scale}px`;
    this.gameScreen.style.transform = `scale(${scale})`;
  }

  update() {
    const targetSpeed = this.boostTicksLeft > 0 ? 1.5 : 1;
    this.speedFactor += (targetSpeed - this.speedFactor) * 0.04;
    const speedFactor = this.speedFactor;
    this.player.speedMultiplier = speedFactor;
    this.player.move();

    this.obstacles.forEach((oneObstacle, oneObstacleIndex) => {
      oneObstacle.move(speedFactor);

      const thereWasACollisionCollision = this.player.didCollide(oneObstacle);
      if (thereWasACollisionCollision && this.immortalTicksLeft === 0) {
        this.obstacles.splice(oneObstacleIndex, 1);
        oneObstacle.element.remove();
        this.lives -= 1;
        if (this.lives === 0) {
          this.isGameOver = true;
        }
        const livesElement = document.getElementById("lives");
        livesElement.innerText = this.lives;
        this.player.directionX = -5;
        this.player.directionY = +2;
        setTimeout(() => {
          return;
        }, 500);
        console.log(setTimeout);
      }

      if (oneObstacle.left < 0 - oneObstacle.width) {
        this.obstacles.splice(oneObstacleIndex, 1);
        oneObstacle.element.remove();
        this.addScore(10);
      }
    });

    this.hearts.forEach((oneHeart, oneHeartIndex) => {
      oneHeart.move(speedFactor);

      const heartAcquired = this.player.didCollide(oneHeart);
      if (heartAcquired) {
        this.hearts.splice(oneHeartIndex, 1);
        oneHeart.element.remove();
        this.hearts.push(new Heart(this.gameScreen));
        this.lives += 1;
        const livesElement = document.getElementById("lives");
        livesElement.innerText = this.lives;
      }

      if (oneHeart.left < 0 - oneHeart.width) {
        this.hearts.splice(oneHeartIndex, 1);
        oneHeart.element.remove();
        this.hearts.push(new Heart(this.gameScreen));
      }
    });

    this.bonuses.forEach((oneBonus, oneBonusIndex) => {
      oneBonus.move(speedFactor);

      const bonusAcquired = this.player.didCollide(oneBonus);
      if (bonusAcquired) {
        this.bonuses.splice(oneBonusIndex, 1);
        oneBonus.element.remove();
        this.addScore(50);
        this.bonuses.push(new Bonus(this.gameScreen));
      }

      if (oneBonus.left < 0 - oneBonus.width) {
        this.bonuses.splice(oneBonusIndex, 1);
        oneBonus.element.remove();
        this.bonuses.push(new Bonus(this.gameScreen));
      }
    });

    if (this.greenHeart) {
      this.greenHeart.move(speedFactor);
      if (this.player.didCollide(this.greenHeart)) {
        this.removeGreenHeart();
        this.startBoost();
      } else if (this.greenHeart.left < 0 - this.greenHeart.width) {
        this.removeGreenHeart();
      }
    }
  }

  randomGreenHeartDelay() {
    return Math.floor(30 * 65 + Math.random() * 25 * 65);
  }

  removeGreenHeart() {
    this.greenHeart.element.remove();
    this.greenHeart = null;
  }

  startBoost() {
    this.boostTicksLeft = 10 * 65;
    this.immortalTicksLeft = 11 * 65;
    this.player.element.classList.add("immortal");
    const overlay = document.createElement("div");
    overlay.className = "boost-background";
    this.gameScreen.appendChild(overlay);
    overlay.getBoundingClientRect();
    overlay.style.opacity = "1";
    this.boostOverlay = overlay;
  }

  updateBoost() {
    if (this.immortalTicksLeft > 0) {
      this.immortalTicksLeft--;
      if (this.immortalTicksLeft === 0) {
        this.player.element.classList.remove("immortal");
      }
    }
    if (this.boostTicksLeft <= 0) {
      return;
    }
    this.boostTicksLeft--;
    if (this.counter % 6 === 0) {
      this.addScore(1);
    }
    if (this.boostTicksLeft === 0) {
      this.endBoost();
    }
  }

  endBoost() {
    const overlay = this.boostOverlay;
    this.boostOverlay = null;
    overlay.style.opacity = "0";
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
  }
  gameOver() {
    window.scrollTo(0, 0);
    window.setTimeout(() => window.scrollTo(0, 0), 0);
    this.startScreen.style.display = "none";
    this.instructionsScreen.style.display = "none";
    this.gameScreen.style.display = "none";
    this.gameViewport.style.display = "none";
    this.gameEndScreen.style.display = "block";
    document.getElementById("touch-controls").classList.remove("is-visible");
    document.getElementById("lives-container").style.display = "none";
    document.getElementById("score-container").style.display = "none";
    document.getElementById("final-score").innerText = this.score;
    this.renderLeaderboard();
    document.getElementById("new-high-score-message").style.display = "block";
    document.getElementById("new-high-score-message").innerText = this.isNewHighScore
      ? "New high score! Enter your name."
      : "Enter your name to save this score.";
    document.getElementById("high-score-form").style.display = "flex";
    document.getElementById("player-name").focus();
  }

  getLeaderboard() {
    const storedLeaderboard = localStorage.getItem("marineScapeLeaderboard");
    if (storedLeaderboard) {
      try {
        const leaderboard = JSON.parse(storedLeaderboard);
        if (Array.isArray(leaderboard)) {
          return leaderboard
            .filter((entry) => typeof entry.name === "string" && Number.isFinite(entry.score))
            .map((entry) => ({ name: entry.name.slice(0, 12), score: entry.score }))
            .sort((first, second) => second.score - first.score)
            .slice(0, 6);
        }
      } catch (error) {
        localStorage.removeItem("marineScapeLeaderboard");
      }
    }

    const previousScore = Number.parseInt(localStorage.getItem("marineScapeHighScore"), 10);
    if (Number.isNaN(previousScore) || previousScore === 0) {
      return [];
    }
    return [{
      name: localStorage.getItem("marineScapeHighScoreName") || "Anonymous",
      score: previousScore,
    }];
  }

  createSupabaseClient() {
    const url = window.SUPABASE_URL;
    const anonKey = window.SUPABASE_ANON_KEY;
    if (!url || !anonKey || !window.supabase) {
      return null;
    }
    const projectUrl = url.replace(/\/rest\/v1\/?$/, "");
    return window.supabase.createClient(projectUrl, anonKey);
  }

  async startRun() {
    this.runId = null;
    if (!this.supabaseClient) {
      return;
    }
    const { data, error } = await this.supabaseClient.rpc("start_run");
    if (error) {
      console.error("Could not start run", error);
      return;
    }
    this.runId = data;
  }

  async loadSharedLeaderboard() {
    if (!this.supabaseClient) {
      return;
    }

    const { data, error } = await this.supabaseClient
      .from("leaderboard")
      .select("name, score")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(6);

    if (error) {
      console.error("Could not load shared leaderboard", error);
      return;
    }

    this.leaderboard = data;
    this.highScore = data[0]?.score || 0;
    this.highScoreName = data[0]?.name || "";
    localStorage.setItem("marineScapeLeaderboard", JSON.stringify(data));
    this.renderLeaderboard();
    this.updateScoreDisplay();
  }

  addScore(points) {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
    }
    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    document.getElementById("score").innerText = this.score;
    document.getElementById("high-score").innerText = this.highScore;
    document.getElementById("high-score-name").innerText = this.highScoreName;
    document.getElementById("new-high-score").style.display = this.isNewHighScore
      ? "inline"
      : "none";
  }

  async saveHighScoreName(playerName) {
    const savedName = playerName.trim().slice(0, 12) || "Anonymous";
    const currentRun = { name: savedName, score: this.score };
    this.leaderboard = [...this.leaderboard, currentRun]
      .sort((first, second) => second.score - first.score)
      .slice(0, 6);
    const madeLeaderboard = this.leaderboard.includes(currentRun);
    this.highScore = this.leaderboard[0].score;
    this.highScoreName = this.leaderboard[0].name;
    localStorage.setItem("marineScapeLeaderboard", JSON.stringify(this.leaderboard));
    localStorage.setItem("marineScapeHighScore", this.highScore);
    localStorage.setItem("marineScapeHighScoreName", this.highScoreName);
    this.renderLeaderboard();
    document.getElementById("high-score-form").style.display = "none";
    document.getElementById("new-high-score-message").innerText = madeLeaderboard
      ? `${savedName}'s score of ${this.score} is on the leaderboard!`
      : `${savedName}'s score of ${this.score} did not reach the top six.`;

    if (!this.supabaseClient || !this.runId) {
      document.getElementById("new-high-score-message").innerText = "Score saved on this device only.";
      return;
    }

    const { error } = await this.supabaseClient.rpc("submit_score", {
      p_run_id: this.runId,
      p_name: savedName,
      p_score: this.score,
    });
    this.runId = null;

    if (error) {
      console.error("Could not save shared leaderboard score", error);
      document.getElementById("new-high-score-message").innerText = "Score saved on this device only.";
      return;
    }

    await this.loadSharedLeaderboard();
    document.getElementById("new-high-score-message").innerText = "Score saved to the shared leaderboard!";
  }

  renderLeaderboard() {
    const leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.replaceChildren();
    if (this.leaderboard.length === 0) {
      const emptyEntry = document.createElement("li");
      emptyEntry.innerText = "No scores saved yet";
      leaderboardList.appendChild(emptyEntry);
      return;
    }
    this.leaderboard.forEach((entry) => {
      const leaderboardEntry = document.createElement("li");
      leaderboardEntry.innerText = `${entry.name} - ${entry.score}`;
      leaderboardList.appendChild(leaderboardEntry);
    });
  }
}
