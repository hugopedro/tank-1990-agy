/**
 * Tank 1990 / Battle City NES Tank System
 * PlayerTank and EnemyTank classes with grid-assisted corner sliding,
 * authentic tread animations, ice inertia, and AI behavior trees.
 */

class BaseTank {
  constructor(x, y, isPlayer = false) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.direction = 0; // 0=UP, 1=RIGHT, 2=DOWN, 3=LEFT
    this.speed = 1.3;
    this.isPlayer = isPlayer;
    this.animFrame = 0;
    this.animDist = 0;
    this.bullets = [];
    this.maxBullets = 1;
    this.bulletSpeed = 3.2;
    this.canDestroySteel = false;
    this.hasBoat = false;
    this.shieldTimer = 0;
    this.active = true;
    this.isMoving = false;
    this.iceSlideDist = 0;
    this.freezeTimer = 0;
    this.renderOffsetX = 0;
    this.renderOffsetY = 0;
  }

  giveShield(duration) {
    this.shieldTimer = Math.max(this.shieldTimer, duration);
  }

  updateCommon(dt) {
    if (this.shieldTimer > 0) {
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
    }
    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dt);
    }

    // Filter active bullets
    this.bullets = this.bullets.filter(b => b.active);
  }

  tryMove(dir, dt, map, allTanks) {
    if (this.freezeTimer > 0) return;

    this.isMoving = true;
    const oldDir = this.direction;
    this.direction = dir;

    // Corner auto-alignment (NES Battle City signature mechanic):
    // When turning 90 degrees, gently snap perpendicular axis to nearest 8px grid
    if (oldDir !== dir) {
      let alignedX = this.x;
      let alignedY = this.y;
      if (dir === 0 || dir === 2) { // Turning vertical: align X
        const remX = this.x % 8;
        if (remX > 0 && remX <= 4) alignedX -= remX;
        else if (remX > 4) alignedX += (8 - remX);
      } else { // Turning horizontal: align Y
        const remY = this.y % 8;
        if (remY > 0 && remY <= 4) alignedY -= remY;
        else if (remY > 4) alignedY += (8 - remY);
      }
      if (this._canOccupy(alignedX, alignedY, map, allTanks)) {
        this.x = alignedX;
        this.y = alignedY;
      }
    }

    const dist = this.speed * dt * 60;
    let nextX = this.x;
    let nextY = this.y;

    if (dir === 0) nextY -= dist;
    else if (dir === 1) nextX += dist;
    else if (dir === 2) nextY += dist;
    else if (dir === 3) nextX -= dist;

    // Check map & tanks collision
    if (this._canOccupy(nextX, nextY, map, allTanks)) {
      this.x = nextX;
      this.y = nextY;
      this.animDist += dist;
      if (this.animDist > 4) {
        this.animDist = 0;
        this.animFrame = (this.animFrame + 1) % 2;

        if (window.particleSystem) {
          const midTx = Math.floor((this.x + 8) / 8);
          const midTy = Math.floor((this.y + 8) / 8);
          if (this.hasBoat && map.getSubTile(midTx, midTy) === 4) {
            window.particleSystem.addWaterRipple(this.x + 8, this.y + 8);
          } else if (Math.random() > 0.35) {
            window.particleSystem.addTreadDust(this.x + 8, this.y + 8, this.direction);
          }
        }
      }
      return true;
    } else {
      // Sub-pixel flush approach: smoothly advance up to the exact obstacle contact point
      let low = 0;
      let high = dist;
      for (let step = 0; step < 4; step++) {
        const mid = (low + high) * 0.5;
        let testX = this.x;
        let testY = this.y;
        if (dir === 0) testY -= mid;
        else if (dir === 1) testX += mid;
        else if (dir === 2) testY += mid;
        else if (dir === 3) testX -= mid;

        if (this._canOccupy(testX, testY, map, allTanks)) {
          low = mid;
        } else {
          high = mid;
        }
      }

      if (low > 0.05) {
        if (dir === 0) this.y -= low;
        else if (dir === 1) this.x += low;
        else if (dir === 2) this.y += low;
        else if (dir === 3) this.x -= low;
        this.animDist += low;
      } else {
        // Still animate treads when pushing against an obstacle without moving
        this.animDist += dist * 0.4;
        if (this.animDist > 4) {
          this.animDist = 0;
          this.animFrame = (this.animFrame + 1) % 2;
        }
      }
      // Never snap backwards! Tank stays flush with ZERO tremor.
      return false;
    }
  }

  _canOccupy(x, y, map, allTanks) {
    // Playfield boundaries (0 to 208 - 16 = 192)
    if (x < 0 || x > 192 || y < 0 || y > 192) return false;

    // Map sub-tiles check
    // The tank occupies a 16x16 area, corresponding to 2x2 or up to 3x3 8x8 sub-tiles
    const minTx = Math.floor(x / 8);
    const maxTx = Math.floor((x + 15.9) / 8);
    const minTy = Math.floor(y / 8);
    const maxTy = Math.floor((y + 15.9) / 8);

    for (let ty = minTy; ty <= maxTy; ty++) {
      for (let tx = minTx; tx <= maxTx; tx++) {
        const tile = map.getSubTile(tx, ty);
        if (tile === 1 || tile === 2) return false; // Brick or Steel
        if (tile === 4 && !this.hasBoat) return false; // Water impassable without Boat
        if (tile === 9) return false; // Eagle / Base impassable
      }
    }

    // Other tanks collision check
    for (let i = 0; i < allTanks.length; i++) {
      const other = allTanks[i];
      if (other === this || !other.active) continue;

      const overlap = !(
        x + 14.8 < other.x + 1.2 ||
        x + 1.2 > other.x + 14.8 ||
        y + 14.8 < other.y + 1.2 ||
        y + 1.2 > other.y + 14.8
      );

      if (overlap) {
        // If tanks were already touching/overlapping at start position, allow movement that separates them
        const currDistSq = (this.x - other.x) ** 2 + (this.y - other.y) ** 2;
        const nextDistSq = (x - other.x) ** 2 + (y - other.y) ** 2;
        if (nextDistSq < currDistSq) {
          return false; // Moving closer is blocked
        }
      }
    }

    return true;
  }

  fire() {
    if (this.freezeTimer > 0) return null;
    if (this.bullets.length >= this.maxBullets) return null;

    // Bullet spawn point based on direction
    let bx = this.x + 8;
    let by = this.y + 8;
    if (this.direction === 0) by = this.y - 1;
    else if (this.direction === 1) bx = this.x + 17;
    else if (this.direction === 2) by = this.y + 17;
    else if (this.direction === 3) bx = this.x - 1;

    const ownerName = this.isPlayer ? (this.playerIndex === 1 ? 'player2' : 'player1') : 'enemy';
    const bullet = new Bullet(bx, by, this.direction, this.bulletSpeed, ownerName, this.canDestroySteel);
    this.bullets.push(bullet);

    if (this.isPlayer) {
      window.soundSystem.playShot();
      if (window.gamepadManager) {
        window.gamepadManager.rumble(this.playerIndex, 0.28, 0.05, 55);
      }
    }
    if (window.particleSystem) {
      window.particleSystem.addMuzzleSmoke(this.x + 8, this.y + 8, this.direction);
    }
    return bullet;
  }
}

class PlayerTank extends BaseTank {
  constructor(playerIndex = 0) {
    // Player 1 spawns at (64, 192), Player 2 spawns at (128, 192)
    const startX = playerIndex === 1 ? 128 : 64;
    const startY = 192;
    super(startX, startY, true);

    this.playerIndex = playerIndex;
    this.spawnX = startX;
    this.spawnY = startY;
    this.tier = 0;
    this.speed = 1.35;
    this.bulletSpeed = 3.2;
    this.maxBullets = 1;
    this.canDestroySteel = false;
    this.giveShield(3.5); // Initial invulnerability
  }

  respawn() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.direction = 0;
    this.tier = 0;
    this.speed = 1.35;
    this.bulletSpeed = 3.2;
    this.maxBullets = 1;
    this.canDestroySteel = false;
    this.hasBoat = false;
    this.bullets = [];
    this.active = true;
    this.renderOffsetX = 0;
    this.renderOffsetY = 0;
    this.giveShield(4.0);
  }

  upgradeTier() {
    this.tier = Math.min(3, this.tier + 1);
    if (this.tier === 1) {
      this.bulletSpeed = 4.4;
    } else if (this.tier === 2) {
      this.bulletSpeed = 4.4;
      this.maxBullets = 2;
    } else if (this.tier === 3) {
      this.bulletSpeed = 4.6;
      this.maxBullets = 2;
      this.canDestroySteel = true; // Can break steel and trees!
    }
  }

  update(dt, map, allTanks, input) {
    this.updateCommon(dt);
    this.isMoving = false;

    // Check if on ice
    const midTx = Math.floor((this.x + 8) / 8);
    const midTy = Math.floor((this.y + 8) / 8);
    const onIce = map.getSubTile(midTx, midTy) === 5;

    let moveDir = -1;
    if (input.up) moveDir = 0;
    else if (input.right) moveDir = 1;
    else if (input.down) moveDir = 2;
    else if (input.left) moveDir = 3;

    if (moveDir !== -1) {
      this.tryMove(moveDir, dt, map, allTanks);
      if (onIce) this.iceSlideDist = 12;
    } else if (onIce && this.iceSlideDist > 0) {
      // Ice sliding inertia
      this.tryMove(this.direction, dt * 0.7, map, allTanks);
      this.iceSlideDist--;
    }

    if (input.fire) {
      this.fire();
    }
  }
}

class EnemyTank extends BaseTank {
  constructor(x, y, type = 'basic', isBonus = false) {
    super(x, y, false);
    this.enemyType = type;
    this.isBonus = isBonus;
    this.direction = 2; // Default facing DOWN towards base

    // AI timing
    this.decisionTimer = Math.random() * 0.5 + 0.3;
    this.fireTimer = Math.random() * 1.0 + 0.5;
    this.stuckTimer = 0;

    // Attributes by enemy type
    switch (type) {
      case 'basic':
        this.speed = 0.95;
        this.bulletSpeed = 2.8;
        this.health = 1;
        this.points = 100;
        break;
      case 'fast':
        this.speed = 1.95;
        this.bulletSpeed = 3.4;
        this.health = 1;
        this.points = 200;
        break;
      case 'power':
        this.speed = 1.15;
        this.bulletSpeed = 4.8;
        this.health = 1;
        this.points = 300;
        break;
      case 'armor':
        this.speed = 0.95;
        this.bulletSpeed = 3.0;
        this.health = 4; // 4 hits to destroy!
        this.points = 400;
        break;
    }
  }

  takeHit() {
    if (this.shieldTimer > 0) return false;
    this.health--;
    if (this.health <= 0) {
      this.active = false;
      return true; // Destroyed
    }
    return false; // Damaged
  }

  update(dt, map, allTanks, players, eaglePos) {
    this.updateCommon(dt);
    if (!this.active || this.freezeTimer > 0) return;

    // AI Decision Timer
    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = Math.random() * 0.8 + 0.5;
      this._chooseDirection(players, eaglePos);
    }

    // Try moving in current direction
    const moved = this.tryMove(this.direction, dt, map, allTanks);
    if (!moved) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.3) {
        this.stuckTimer = 0;
        this._pickAlternativeDirection();
      }
    } else {
      this.stuckTimer = 0;
    }

    // AI Firing Logic
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = Math.random() * 1.2 + 0.6;
      this.fire();
    }
  }

  _chooseDirection(players, eaglePos) {
    // 40% bias towards Eagle, 25% bias towards nearest player, 35% random
    const roll = Math.random();
    let target = eaglePos;

    if (roll < 0.35 && players.length > 0 && players[0].active) {
      target = players[0];
    }

    if (roll < 0.65 && target) {
      const dx = target.x - this.x;
      const dy = target.y - this.y;

      if (Math.abs(dy) > Math.abs(dx)) {
        this.direction = dy > 0 ? 2 : 0; // DOWN or UP
      } else {
        this.direction = dx > 0 ? 1 : 3; // RIGHT or LEFT
      }
    } else {
      // Choose random direction
      this.direction = Math.floor(Math.random() * 4);
    }
  }

  _pickAlternativeDirection() {
    const validDirs = [0, 1, 2, 3].filter(d => d !== this.direction);
    this.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
  }
}

window.PlayerTank = PlayerTank;
window.EnemyTank = EnemyTank;
