/**
 * Tank 1990 / Battle City NES - Main Game Engine
 * Coordinates game loop, fixed timestep, physics, collision detection,
 * state machine, animations, score tracking, and input handling.
 */

const GAME_STATES = {
  TITLE: 'TITLE',
  STAGE_START: 'STAGE_START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  STAGE_CLEAR: 'STAGE_CLEAR',
  GAME_OVER: 'GAME_OVER'
};

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;

    // Canvas Resolution: 1024x896 (4x HD scale of 256x224)
    this.scale = 4;
    this.canvas.width = 1024;
    this.canvas.height = 896;
    this.width = 1024;
    this.height = 896;

    this.graphicsMode = 'modern'; // 'modern' or 'classic'
    this.screenShake = 0;

    this.state = GAME_STATES.TITLE;
    this.currentStage = 1;
    this.isTwoPlayer = false;

    // Players
    this.players = [];
    this.playerLives = [3, 3];
    this.playerScores = [0, 0];
    this.playerKills = [
      { basic: 0, fast: 0, power: 0, armor: 0 },
      { basic: 0, fast: 0, power: 0, armor: 0 }
    ];

    // Entities
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.spawnEffects = [];
    this.floatingScores = [];
    this.currentPowerup = null;

    // Enemy Wave Control
    this.remainingEnemiesToSpawn = 20;
    this.enemiesDefeated = 0;
    this.enemySpawnTimer = 0;
    this.spawnPositions = [
      { x: 0, y: 0 },
      { x: 96, y: 0 },
      { x: 192, y: 0 }
    ];
    this.spawnPosIndex = 0;

    // Freeze timer (from Clock powerup)
    this.enemyFreezeTimer = 0;

    // Input States
    this.p1Input = { up: false, right: false, down: false, left: false, fire: false };
    this.p2Input = { up: false, right: false, down: false, left: false, fire: false };

    // Timing & Loop
    this.lastTime = performance.now();
    this.gameTime = 0;
    this.stageTransitionTimer = 0;
    this.curtainHeight = 0;
    this.gameOverY = 224;

    this._setupInputListeners();
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame(this._loop.bind(this));
  }

  _setupInputListeners() {
    const GAME_KEYS = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      ' ', 'Spacebar',
      'w', 'W', 'a', 'A', 's', 'S', 'd', 'D',
      'j', 'J', 'k', 'K', 'p', 'P', 'm', 'M',
      'g', 'G', 'r', 'R', 'f', 'F', 'c', 'C', 'n', 'N',
      'Enter', '0', '1', '2'
    ]);

    window.addEventListener('keydown', e => {
      // Prevent browser default behavior (such as scrolling on Arrow keys or Space)
      if (GAME_KEYS.has(e.key)) {
        e.preventDefault();
      }

      // Audio auto-resume on first interaction
      window.soundSystem.resume();

      // Global Quick Shortcuts
      if (e.key === 'g' || e.key === 'G') {
        this.toggleGraphicsMode();
        window.soundSystem.playScoreDing();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        this.state = GAME_STATES.TITLE;
        window.soundSystem.playPause();
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      if (e.key === '1') {
        this.isTwoPlayer = false;
        window.soundSystem.playScoreDing();
        return;
      }

      if (e.key === '2') {
        this.isTwoPlayer = true;
        window.soundSystem.playScoreDing();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        const next = (this.currentStage % 5) + 1;
        this.startStage(next);
        window.soundSystem.playScoreDing();
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        const frame = document.getElementById('screenFrame');
        if (frame) frame.classList.toggle('crt');
        return;
      }

      // Multiplayer Dialog Input Intercept
      if (window.multiplayerManager && window.multiplayerManager.dialogVisible) {
        if (window.multiplayerManager.handleKeyDown(e)) {
          return;
        }
      }

      if (this.state === GAME_STATES.TITLE) {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          window.uiManager.titleMenuIndex = (window.uiManager.titleMenuIndex + 3) % 4;
          window.soundSystem.playShot();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          window.uiManager.titleMenuIndex = (window.uiManager.titleMenuIndex + 1) % 4;
          window.soundSystem.playShot();
        } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
          this._selectTitleMenuOption();
        }
        return;
      }

      // In-game Pause
      if (e.key === 'p' || e.key === 'P' || (e.key === 'Enter' && this.state === GAME_STATES.PLAYING)) {
        this.togglePause();
        return;
      }

      // Audio mute toggle
      if (e.key === 'm' || e.key === 'M') {
        const enabled = window.soundSystem.toggleSound();
        console.log('Audio:', enabled ? 'ON' : 'OFF');
        return;
      }

      // Player 1: WASD + Space / J (or Arrows if single player)
      if (e.key === 'w' || e.key === 'W' || (!this.isTwoPlayer && e.key === 'ArrowUp')) this.p1Input.up = true;
      if (e.key === 'd' || e.key === 'D' || (!this.isTwoPlayer && e.key === 'ArrowRight')) this.p1Input.right = true;
      if (e.key === 's' || e.key === 'S' || (!this.isTwoPlayer && e.key === 'ArrowDown')) this.p1Input.down = true;
      if (e.key === 'a' || e.key === 'A' || (!this.isTwoPlayer && e.key === 'ArrowLeft')) this.p1Input.left = true;
      if (e.key === ' ' || e.key === 'j' || e.key === 'J') this.p1Input.fire = true;

      // Player 2: Arrow Keys + Enter / Numpad 0
      if (this.isTwoPlayer) {
        if (e.key === 'ArrowUp') this.p2Input.up = true;
        if (e.key === 'ArrowRight') this.p2Input.right = true;
        if (e.key === 'ArrowDown') this.p2Input.down = true;
        if (e.key === 'ArrowLeft') this.p2Input.left = true;
        if (e.key === 'Enter' || e.key === '0') this.p2Input.fire = true;
      }
    });

    window.addEventListener('keyup', e => {
      if (GAME_KEYS.has(e.key)) {
        e.preventDefault();
      }

      // Player 1
      if (e.key === 'w' || e.key === 'W' || (!this.isTwoPlayer && e.key === 'ArrowUp')) this.p1Input.up = false;
      if (e.key === 'd' || e.key === 'D' || (!this.isTwoPlayer && e.key === 'ArrowRight')) this.p1Input.right = false;
      if (e.key === 's' || e.key === 'S' || (!this.isTwoPlayer && e.key === 'ArrowDown')) this.p1Input.down = false;
      if (e.key === 'a' || e.key === 'A' || (!this.isTwoPlayer && e.key === 'ArrowLeft')) this.p1Input.left = false;
      if (e.key === ' ' || e.key === 'j' || e.key === 'J') this.p1Input.fire = false;

      // Player 2
      if (this.isTwoPlayer) {
        if (e.key === 'ArrowUp') this.p2Input.up = false;
        if (e.key === 'ArrowRight') this.p2Input.right = false;
        if (e.key === 'ArrowDown') this.p2Input.down = false;
        if (e.key === 'ArrowLeft') this.p2Input.left = false;
        if (e.key === 'Enter' || e.key === '0') this.p2Input.fire = false;
      }
    });
  }

  _selectTitleMenuOption() {
    const opt = window.uiManager.titleMenuIndex;
    if (opt === 0) {
      this.isTwoPlayer = false;
      this.startStage(1);
    } else if (opt === 1) {
      this.isTwoPlayer = true;
      this.startStage(1);
    } else if (opt === 2) {
      // Multiplayer Online
      if (window.multiplayerManager) {
        window.multiplayerManager.openLobby();
      }
    } else if (opt === 3) {
      // Stage select
      this.currentStage = (this.currentStage % 5) + 1;
      window.soundSystem.playScoreDing();
    }
  }

  startStage(stageNum, skipIntermission = false) {
    this.currentStage = stageNum;
    this.curtainHeight = skipIntermission ? 0 : 112;
    this.stageTransitionTimer = skipIntermission ? 10 : 0;

    // Reset entities
    this.enemies = [];
    this.bullets = [];
    this.explosions = [];
    this.spawnEffects = [];
    this.floatingScores = [];
    this.currentPowerup = null;
    this.remainingEnemiesToSpawn = 20;
    this.enemiesDefeated = 0;
    this.enemyFreezeTimer = 0;
    this.enemySpawnTimer = 0.5;

    // Reset kills count for stage
    this.playerKills = [
      { basic: 0, fast: 0, power: 0, armor: 0 },
      { basic: 0, fast: 0, power: 0, armor: 0 }
    ];

    // Load Map
    window.mapManager.loadStage(stageNum);

    // Initialize Players
    this.players = [];
    const p1 = new PlayerTank(0);
    this.players.push(p1);
    if (skipIntermission) {
      p1.active = true;
    } else {
      this.addSpawnEffect(p1.spawnX, p1.spawnY, () => {
        p1.active = true;
      });
      p1.active = false;
    }

    if (this.isTwoPlayer) {
      const p2 = new PlayerTank(1);
      this.players.push(p2);
      if (skipIntermission) {
        p2.active = true;
      } else {
        this.addSpawnEffect(p2.spawnX, p2.spawnY, () => {
          p2.active = true;
        });
        p2.active = false;
      }
    }

    if (skipIntermission) {
      this.state = GAME_STATES.PLAYING;
    } else {
      this.state = GAME_STATES.STAGE_START;
      // Play Stage Start Intro Jingle
      window.soundSystem.playStageStart(() => {
        this.state = GAME_STATES.PLAYING;
      });
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.state = GAME_STATES.PAUSED;
      window.soundSystem.playPause();
      window.soundSystem.stopEngine();
    } else if (this.state === GAME_STATES.PAUSED) {
      this.state = GAME_STATES.PLAYING;
      window.soundSystem.playPause();
    }
  }

  _loop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // Cap at 50ms
    this.lastTime = time;
    this.gameTime += dt;

    // Global sprite animations update
    window.spriteManager.update(dt);

    // Gamepad controller input & rumble update
    if (window.gamepadManager) {
      window.gamepadManager.update(dt, this);
    }

    // State Updates
    switch (this.state) {
      case GAME_STATES.TITLE:
        this._updateTitle(dt);
        this._renderTitle();
        break;

      case GAME_STATES.STAGE_START:
        this._updateStageStart(dt);
        this._renderGame();
        break;

      case GAME_STATES.PLAYING:
        try {
          this._updatePlaying(dt);
          this._renderGame();
        } catch (err) {
          console.error('ERROR IN PLAYING:', err);
          this.ctx.fillStyle = 'red';
          this.ctx.fillRect(0, 0, 1024, 896);
          this.ctx.fillStyle = 'white';
          this.ctx.font = '20px monospace';
          this.ctx.fillText('ERR: ' + err.message, 50, 100);
        }
        break;

      case GAME_STATES.PAUSED:
        this._renderGame();
        this._renderPauseOverlay();
        break;

      case GAME_STATES.STAGE_CLEAR:
        this._updateStageClear(dt);
        this._renderStageClear();
        break;

      case GAME_STATES.GAME_OVER:
        this._updateGameOver(dt);
        this._renderGame();
        this._renderGameOver();
        break;
    }

    // Multiplayer background update
    if (window.multiplayerManager) {
      window.multiplayerManager.update(dt);
    }

    // Multiplayer HUD badge & modal dialog overlay
    if (window.multiplayerManager) {
      window.multiplayerManager.drawHUD(this.ctx, this.width);
      window.multiplayerManager.drawDialog(this.ctx, this.width, this.height);
    }

    requestAnimationFrame(this._loop.bind(this));
  }

  _updateTitle(dt) {
    // handled by input
  }

  _renderTitle() {
    window.uiManager.drawTitleScreen(this.ctx, this.gameTime, this.graphicsMode === 'modern', this.scale);
    if (window.gamepadManager) window.gamepadManager.drawToast(this.ctx, this.width);
  }

  _updateStageStart(dt) {
    this.stageTransitionTimer += dt;
    // Curtains open after 1.6s
    if (this.stageTransitionTimer > 1.4) {
      this.curtainHeight = Math.max(0, this.curtainHeight - dt * 250);
    }
  }

  _updatePlaying(dt) {
    // Client mode: simulate local Player 2 prediction & visuals only (Host is authoritative)
    if (window.multiplayerManager && window.multiplayerManager.mode === 'CLIENT') {
      this._updateClientPlaying(dt);
      return;
    }

    // Map updates (shovel timer etc.)
    window.mapManager.update(dt);

    // Freeze timer update
    if (this.enemyFreezeTimer > 0) {
      this.enemyFreezeTimer = Math.max(0, this.enemyFreezeTimer - dt);
    }

    // Update Players
    let anyPlayerMoving = false;
    this.players.forEach(p => {
      if (!p.active) return;
      const input = p.playerIndex === 1 ? this.p2Input : this.p1Input;
      const allTanks = [...this.players, ...this.enemies];
      p.update(dt, window.mapManager, allTanks, input);
      if (p.isMoving) anyPlayerMoving = true;

      // Handle bullets fired by player
      p.bullets.forEach(b => {
        if (!this.bullets.includes(b)) this.bullets.push(b);
      });
    });

    // Sound engine rumble
    window.soundSystem.updateEngine(anyPlayerMoving);

    // Spawn Enemies
    this._updateEnemySpawns(dt);

    // Update Enemies
    this.enemies.forEach(e => {
      if (!e.active) return;
      const allTanks = [...this.players, ...this.enemies];
      e.update(dt, window.mapManager, allTanks, this.players, window.mapManager.eaglePos);

      // Collect enemy bullets
      e.bullets.forEach(b => {
        if (!this.bullets.includes(b)) this.bullets.push(b);
      });
    });

    // Update Bullets
    this._updateBullets(dt);

    // Update Powerups
    if (this.currentPowerup) {
      if (!this.currentPowerup.active) {
        this.currentPowerup = null;
      } else {
        this.currentPowerup.update(dt);
        if (!this.currentPowerup.active) {
          this.currentPowerup = null;
        } else {
          // Check collision with all tanks (Player + Enemy theft!)
          const allTanks = [...this.players, ...this.enemies];
          for (let i = 0; i < allTanks.length; i++) {
            if (allTanks[i].active && this.currentPowerup.checkCollision(allTanks[i])) {
              this.currentPowerup = null;
              break;
            }
          }
        }
      }
    }

    // Update Explosions
    this._updateExplosions(dt);

    // Update Spawn Effects
    this._updateSpawnEffects(dt);

    // Update Floating Scores
    this._updateFloatingScores(dt);

    // Update Particles & Screen Shake
    if (window.particleSystem) {
      window.particleSystem.update(dt);
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
    }

    // Stage Clear Check: All 20 enemies spawned and killed!
    if (this.remainingEnemiesToSpawn === 0 && this.enemies.length === 0 && this.spawnEffects.length === 0) {
      this._startStageClearTally();
    }
  }

  _updateClientPlaying(dt) {
    if (window.mapManager) {
      window.mapManager.update(dt);
    }

    // Client-side prediction for Player 2 (Local player on Client machine)
    const p2 = this.players[1];
    let isMoving = false;
    if (p2 && p2.active && window.mapManager) {
      // Local keyboard / gamepad inputs (stored in p1Input) drive Player 2 locally
      p2.update(dt, window.mapManager, [...this.players, ...this.enemies], this.p1Input);
      isMoving = p2.isMoving;
    }

    // Engine sound rumble based on client movement
    window.soundSystem.updateEngine(isMoving);

    // Update animations, explosions, and visual particles locally
    this._updateExplosions(dt);
    this._updateSpawnEffects(dt);
    this._updateFloatingScores(dt);

    if (window.particleSystem) {
      window.particleSystem.update(dt);
    }
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 2.5);
    }
  }

  _updateEnemySpawns(dt) {
    if (this.remainingEnemiesToSpawn <= 0) return;
    if (this.enemies.length >= 4) return; // Max 4 active enemies on field

    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.enemySpawnTimer = 2.8;

      const spawnPos = this.spawnPositions[this.spawnPosIndex];
      this.spawnPosIndex = (this.spawnPosIndex + 1) % this.spawnPositions.length;

      // Check if spawn position is clear of active tanks
      const blocked = [...this.players, ...this.enemies].some(t => {
        return Math.abs(t.x - spawnPos.x) < 14 && Math.abs(t.y - spawnPos.y) < 14;
      });

      if (!blocked) {
        const enemyIndexInWave = 21 - this.remainingEnemiesToSpawn;
        // Determine enemy type
        let type = 'basic';
        if (enemyIndexInWave % 5 === 0) type = 'armor';
        else if (enemyIndexInWave % 3 === 0) type = 'power';
        else if (enemyIndexInWave % 2 === 0) type = 'fast';

        // Bonus tanks that drop powerups: 4th, 11th, and 18th in wave
        const isBonus = (enemyIndexInWave === 4 || enemyIndexInWave === 11 || enemyIndexInWave === 18);

        this.remainingEnemiesToSpawn--;

        // Spawn animation star
        this.addSpawnEffect(spawnPos.x, spawnPos.y, () => {
          const enemy = new EnemyTank(spawnPos.x, spawnPos.y, type, isBonus);
          this.enemies.push(enemy);
        });
      }
    }
  }

  _updateBullets(dt) {
    for (let i = 0; i < this.bullets.length; i++) {
      const b1 = this.bullets[i];
      if (!b1.active) continue;
      b1.update(dt, window.mapManager);

      if (!b1.active) continue;

      // 1. Bullet vs Bullet Collision (Iconic Battle City mechanic)
      for (let j = i + 1; j < this.bullets.length; j++) {
        const b2 = this.bullets[j];
        if (!b2.active) continue;

        // Bullets cancel if owners are opponents
        const isOpposing = (b1.owner.startsWith('player') && b2.owner === 'enemy') ||
                           (b1.owner === 'enemy' && b2.owner.startsWith('player'));

        if (isOpposing) {
          const distSq = (b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2;
          if (distSq < 36) { // Collided
            b1.destroy(false);
            b2.destroy(false);
            window.soundSystem.playSmallExplosion();
            break;
          }
        }
      }

      if (!b1.active) continue;

      // 2. Player Bullet vs Enemy Tanks
      if (b1.owner.startsWith('player')) {
        for (let e = 0; e < this.enemies.length; e++) {
          const enemy = this.enemies[e];
          if (!enemy.active) continue;

          if (this._checkBulletTankHit(b1, enemy)) {
            b1.destroy(false);
            const destroyed = enemy.takeHit();

            if (destroyed) {
              window.soundSystem.playBigExplosion();
              this.addExplosion(enemy.x + 8, enemy.y + 8, true);

              // Tally stats
              const pIdx = b1.owner === 'player2' ? 1 : 0;
              this.playerScores[pIdx] += enemy.points;
              this.playerKills[pIdx][enemy.enemyType]++;
              this.addFloatingScore(enemy.x, enemy.y, enemy.points);

              // Haptic Rumble on enemy destroy
              if (window.gamepadManager) {
                window.gamepadManager.rumble(pIdx, 0.6, 0.7, 240);
              }

              // Spawn bonus powerup if bonus tank!
              if (enemy.isBonus) {
                this.currentPowerup = Powerup.spawnRandom(window.mapManager);
              }

              this.enemies.splice(e, 1);
            } else {
              window.soundSystem.playSteelHit();
              this.addExplosion(b1.x, b1.y, false);
            }
            break;
          }
        }
      }

      // 3. Enemy Bullet vs Player Tanks
      if (b1.owner === 'enemy') {
        for (let p = 0; p < this.players.length; p++) {
          const player = this.players[p];
          if (!player.active) continue;

          if (this._checkBulletTankHit(b1, player)) {
            b1.destroy(false);
            if (player.shieldTimer > 0) {
              // Harmlessly bounced against shield
              window.soundSystem.playSteelHit();
              this.addExplosion(b1.x, b1.y, false);
            } else {
              // Destroy Player
              this.killPlayer(player.playerIndex);
            }
            break;
          }
        }
      }
    }

    this.bullets = this.bullets.filter(b => b.active);
  }

  _checkBulletTankHit(bullet, tank) {
    return (
      bullet.x >= tank.x - 2 &&
      bullet.x <= tank.x + 18 &&
      bullet.y >= tank.y - 2 &&
      bullet.y <= tank.y + 18
    );
  }

  killPlayer(playerIndex) {
    const player = this.players.find(p => p.playerIndex === playerIndex);
    if (!player || !player.active) return;

    player.active = false;
    window.soundSystem.playBigExplosion();
    this.addExplosion(player.x + 8, player.y + 8, true);

    // Haptic Rumble on player death
    if (window.gamepadManager) {
      window.gamepadManager.rumble(playerIndex, 0.9, 0.9, 350);
    }

    this.playerLives[playerIndex]--;

    if (this.playerLives[playerIndex] > 0) {
      // Respawn after 1.2s
      setTimeout(() => {
        if (this.state === GAME_STATES.PLAYING) {
          this.addSpawnEffect(player.spawnX, player.spawnY, () => {
            player.respawn();
          });
        }
      }, 1200);
    } else {
      // Check if all players dead
      const allDead = this.playerLives.every((l, idx) => {
        return !this.players[idx] || l <= 0;
      });
      if (allDead) {
        this.triggerGameOver();
      }
    }
  }

  onEagleDestroyed() {
    if (window.gamepadManager) {
      window.gamepadManager.rumble(0, 1.0, 1.0, 600);
      window.gamepadManager.rumble(1, 1.0, 1.0, 600);
    }
    this.triggerGameOver();
  }

  triggerGameOver() {
    if (this.state === GAME_STATES.GAME_OVER) return;
    this.state = GAME_STATES.GAME_OVER;
    this.gameOverY = 224;
    window.soundSystem.stopEngine();
    window.soundSystem.playGameOver(() => {
      setTimeout(() => {
        this.state = GAME_STATES.TITLE;
      }, 2500);
    });
  }

  addScore(playerIdx, points, x, y) {
    this.playerScores[playerIdx] += points;
    this.addFloatingScore(x, y, points);

    // High Score check
    const currentHi = parseInt(localStorage.getItem('tank1990_hiscore') || '20000', 10);
    if (this.playerScores[playerIdx] > currentHi) {
      localStorage.setItem('tank1990_hiscore', `${this.playerScores[playerIdx]}`);
    }
  }

  addLife(playerIdx) {
    this.playerLives[playerIdx] = Math.min(9, this.playerLives[playerIdx] + 1);
  }

  freezeEnemies(duration) {
    this.enemyFreezeTimer = duration;
    this.enemies.forEach(e => {
      e.freezeTimer = duration;
    });
  }

  freezePlayers(duration) {
    this.players.forEach(p => {
      p.freezeTimer = duration;
    });
  }

  destroyAllEnemies(playerIdx) {
    this.enemies.forEach(e => {
      e.active = false;
      window.soundSystem.playBigExplosion();
      this.addExplosion(e.x + 8, e.y + 8, true);
      this.playerScores[playerIdx] += 500;
      this.addFloatingScore(e.x, e.y, 500);
    });
    this.enemies = [];
  }

  toggleGraphicsMode() {
    this.graphicsMode = (this.graphicsMode === 'modern') ? 'classic' : 'modern';
    return this.graphicsMode;
  }

  addExplosion(x, y, isBig = false) {
    if (isBig && this.graphicsMode === 'modern') {
      this.screenShake = 0.35;
    }
    this.explosions.push({
      x: x,
      y: y,
      isBig: isBig,
      frame: 0,
      maxFrames: isBig ? 5 : 3,
      timer: 0,
      frameDuration: isBig ? 0.08 : 0.06
    });

    if (window.multiplayerManager && window.multiplayerManager.mode === 'HOST' && window.multiplayerManager.isConnected) {
      window.multiplayerManager.queueEvent({ type: 'EXPLOSION', x, y, isBig });
    }
  }

  _updateExplosions(dt) {
    this.explosions.forEach(e => {
      e.timer += dt;
      if (e.timer >= e.frameDuration) {
        e.timer = 0;
        e.frame++;
      }
    });
    this.explosions = this.explosions.filter(e => e.frame < e.maxFrames);
  }

  addSpawnEffect(x, y, onComplete) {
    this.spawnEffects.push({
      x: x,
      y: y,
      frame: 0,
      timer: 0,
      cycles: 0,
      onComplete: onComplete
    });
  }

  _updateSpawnEffects(dt) {
    for (let i = this.spawnEffects.length - 1; i >= 0; i--) {
      const sp = this.spawnEffects[i];
      sp.timer += dt;
      if (sp.timer >= 0.07) {
        sp.timer = 0;
        sp.frame = (sp.frame + 1) % 4;
        sp.cycles++;
        if (sp.cycles >= 12) { // 12 cycles (~0.84s)
          if (sp.onComplete) sp.onComplete();
          this.spawnEffects.splice(i, 1);
        }
      }
    }
  }

  addFloatingScore(x, y, points) {
    this.floatingScores.push({
      x: x + 4,
      y: y + 4,
      points: points,
      alpha: 1.0,
      timer: 0.7
    });
  }

  _updateFloatingScores(dt) {
    this.floatingScores.forEach(s => {
      s.y -= dt * 18;
      s.timer -= dt;
      s.alpha = Math.max(0, s.timer / 0.7);
    });
    this.floatingScores = this.floatingScores.filter(s => s.timer > 0);
  }

  _startStageClearTally() {
    this.state = GAME_STATES.STAGE_CLEAR;
    window.soundSystem.stopEngine();
    window.uiManager.tallyStep = 0;
    window.uiManager.tallyTimer = 0;
    window.uiManager.tallyCounts = [0, 0, 0, 0];
    window.uiManager.targetCounts = [
      this.playerKills[0].basic,
      this.playerKills[0].fast,
      this.playerKills[0].power,
      this.playerKills[0].armor
    ];
  }

  _updateStageClear(dt) {
    window.uiManager.tallyTimer += dt;
    if (window.uiManager.tallyTimer > 0.1) {
      window.uiManager.tallyTimer = 0;
      const step = window.uiManager.tallyStep;
      if (step < 4) {
        if (window.uiManager.tallyCounts[step] < window.uiManager.targetCounts[step]) {
          window.uiManager.tallyCounts[step]++;
          window.soundSystem.playScoreDing();
        } else {
          window.uiManager.tallyStep++;
        }
      } else if (step === 4) {
        // Finished tallying, wait 2 seconds then start next stage
        window.uiManager.tallyStep++;
        setTimeout(() => {
          this.startStage(this.currentStage + 1);
        }, 2200);
      }
    }
  }

  _renderStageClear() {
    window.uiManager.drawScoreTally(
      this.ctx,
      this.currentStage,
      this.playerScores[0],
      this.playerKills[0],
      null,
      this.graphicsMode === 'modern',
      this.scale
    );
  }

  _updateGameOver(dt) {
    if (this.gameOverY > 110) {
      this.gameOverY -= dt * 65;
    }
  }

  _renderGameOver() {
    window.uiManager.drawGameOver(this.ctx, this.gameOverY, this.graphicsMode === 'modern', this.scale);
  }

  _renderPauseOverlay() {
    this.ctx.save();
    this.ctx.fillStyle = '#e40058';
    this.ctx.font = 'bold 36px "Press Start 2P", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('PAUSE', 480, 448);
    this.ctx.restore();
  }

  _renderGame() {
    const isModern = (this.graphicsMode === 'modern');
    this.ctx.imageSmoothingEnabled = isModern;

    // 1. Clear background
    if (isModern) {
      // Modern High-Tech Cabinet Bezel
      const bgGrad = this.ctx.createLinearGradient(0, 0, 1024, 896);
      bgGrad.addColorStop(0, '#151722');
      bgGrad.addColorStop(1, '#0e1018');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, 1024, 896);

      // Playfield Bezel Frame
      this.ctx.fillStyle = '#222533';
      this.ctx.fillRect(60, 28, 840, 840);

      // Playfield arena floor
      const floorGrad = this.ctx.createLinearGradient(64, 32, 64, 864);
      floorGrad.addColorStop(0, '#1a1d26');
      floorGrad.addColorStop(1, '#12141a');
      this.ctx.fillStyle = floorGrad;
      this.ctx.fillRect(64, 32, 832, 832);

      // Subtle arena grid lines
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      this.ctx.lineWidth = 1;
      for (let g = 64; g <= 896; g += 64) {
        this.ctx.beginPath();
        this.ctx.moveTo(g, 32); this.ctx.lineTo(g, 864);
        this.ctx.moveTo(64, g - 32); this.ctx.lineTo(896, g - 32);
        this.ctx.stroke();
      }
    } else {
      // Classic NES Grey Border & Black Playfield
      this.ctx.fillStyle = PALETTE.greyBorder;
      this.ctx.fillRect(0, 0, 1024, 896);

      this.ctx.fillStyle = PALETTE.black;
      this.ctx.fillRect(64, 32, 832, 832);
    }

    // Apply Screen Shake if active
    this.ctx.save();
    if (this.screenShake > 0) {
      const shakeMag = this.screenShake * 12;
      const sx = (Math.random() - 0.5) * shakeMag;
      const sy = (Math.random() - 0.5) * shakeMag;
      this.ctx.translate(sx, sy);
    }

    // Translate to playfield and scale by 4
    this.ctx.save();
    this.ctx.translate(64, 32);
    this.ctx.scale(4, 4);

    // 3. Map bottom layer (Bricks, Steel, Water, Ice, Eagle)
    window.mapManager.draw(this.ctx, 'bottom', isModern, this.gameTime);

    // 4. Powerup
    if (this.currentPowerup && this.currentPowerup.active) {
      window.spriteManager.drawPowerup(this.ctx, this.currentPowerup, isModern, this.gameTime);
    }

    // 5. Particles below tanks
    if (isModern && window.particleSystem) {
      window.particleSystem.draw(this.ctx, 1);
    }

    // 6. Tanks (Players & Enemies)
    this.players.forEach(p => {
      if (p.active) window.spriteManager.drawTank(this.ctx, p, isModern, this.gameTime);
    });
    this.enemies.forEach(e => {
      if (e.active) window.spriteManager.drawTank(this.ctx, e, isModern, this.gameTime);
    });

    // 7. Bullets
    this.bullets.forEach(b => {
      if (b.active) window.spriteManager.drawBullet(this.ctx, b, isModern);
    });

    // 8. Explosions
    this.explosions.forEach(exp => {
      window.spriteManager.drawExplosion(this.ctx, exp, isModern);
    });

    // 9. Spawn Star Effects
    this.spawnEffects.forEach(sp => {
      window.spriteManager.drawSpawnEffect(this.ctx, sp, isModern, this.gameTime);
    });

    // 10. Floating Points
    this.floatingScores.forEach(fs => {
      this.ctx.save();
      this.ctx.fillStyle = isModern ? '#ffeb3b' : `rgba(255, 255, 255, ${fs.alpha})`;
      if (isModern) {
        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = 4;
        this.ctx.font = 'bold 8px "Press Start 2P", sans-serif';
      } else {
        this.ctx.font = '7px "Press Start 2P", monospace';
      }
      this.ctx.fillText(`+${fs.points}`, fs.x, fs.y);
      this.ctx.restore();
    });

    // 11. Map top layer (Trees / Bush overlay on top of tanks and bullets!)
    window.mapManager.draw(this.ctx, 'top', isModern, this.gameTime);

    this.ctx.restore(); // end scale(4,4)
    this.ctx.restore(); // end screen shake

    // 12. Right Sidebar (Enemies counter, Lives, Stage)
    const remainingEnemiesTotal = this.remainingEnemiesToSpawn + this.enemies.length;
    window.uiManager.drawSidebar(
      this.ctx,
      remainingEnemiesTotal,
      this.playerLives[0],
      this.playerLives[1],
      this.currentStage,
      this.isTwoPlayer,
      isModern,
      4
    );

    // 13. Stage Intermission Curtains
    if (this.curtainHeight > 0) {
      window.uiManager.drawStageIntermission(this.ctx, this.currentStage, this.curtainHeight, isModern, 4);
    }

    // 14. Gamepad Connection Toast
    if (window.gamepadManager) {
      window.gamepadManager.drawToast(this.ctx, this.width);
    }
  }
}

window.Game = Game;
