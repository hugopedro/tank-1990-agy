/**
 * Tank 1990 Powerup System
 * Includes classic Battle City items + Tank 1990 signature items:
 * Helmet, Clock, Shovel, Star, Grenade, Tank (1-UP), Pistol, Boat
 * Supports enemy tank powerup theft (authentic Tank 1990 mechanic)!
 */

class Powerup {
  constructor(x, y, type) {
    this.x = x; // 16x16 pixel position
    this.y = y;
    this.type = type;
    this.active = true;
    this.lifetime = 25.0; // Despawns after 25 seconds if uncollected
    this.blinkTimer = 0;
    this.visible = true;
  }

  update(dt) {
    if (!this.active) return;
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }

    // Blink when near expiration
    if (this.lifetime < 5.0) {
      this.blinkTimer += dt;
      if (this.blinkTimer > 0.15) {
        this.blinkTimer = 0;
        this.visible = !this.visible;
      }
    } else {
      this.visible = true;
    }
  }

  checkCollision(tank) {
    if (!this.active) return false;
    // Tank is 16x16, Powerup is 16x16
    const overlap = !(
      tank.x + 15 < this.x ||
      tank.x > this.x + 15 ||
      tank.y + 15 < this.y ||
      tank.y > this.y + 15
    );

    if (overlap) {
      this.apply(tank);
      this.active = false;
      return true;
    }
    return false;
  }

  apply(tank) {
    window.soundSystem.playPowerupGet();

    if (tank.isPlayer) {
      // Award 500 points to player
      if (window.game) window.game.addScore(tank.playerIndex, 500, this.x, this.y);

      switch (this.type) {
        case 'helmet':
          tank.giveShield(10.0);
          break;

        case 'clock':
          if (window.game) window.game.freezeEnemies(10.0);
          break;

        case 'shovel':
          if (window.mapManager) window.mapManager.activateShovel();
          break;

        case 'star':
          tank.upgradeTier();
          break;

        case 'grenade':
          if (window.game) window.game.destroyAllEnemies(tank.playerIndex);
          break;

        case 'tank':
          if (window.game) {
            window.game.addLife(tank.playerIndex);
            window.soundSystem.playLifeUp();
          }
          break;

        case 'pistol':
          // Tank 1990 special: instant max level (Tier 3 Super Tank) + shield
          tank.tier = 3;
          tank.bulletSpeed = 4.6;
          tank.maxBullets = 2;
          tank.canDestroySteel = true;
          tank.giveShield(5.0);
          break;

        case 'boat':
          // Tank 1990 special: amphibious water traversal
          tank.hasBoat = true;
          break;
      }
    } else {
      // Tank 1990 iconic mechanic: Enemy picked up a powerup!
      switch (this.type) {
        case 'helmet':
          tank.giveShield(8.0);
          break;
        case 'clock':
          // Enemy freezes players!
          if (window.game) window.game.freezePlayers(6.0);
          break;
        case 'shovel':
          // Enemy shovel turns base wall to empty or damages base!
          break;
        case 'star':
        case 'pistol':
          // Enemy upgrades to armor tank!
          tank.health = 4;
          tank.enemyType = 'armor';
          tank.bulletSpeed = 4.2;
          break;
        case 'grenade':
          // Enemy nuke destroys player tank!
          if (window.game) window.game.killPlayer(0);
          break;
        case 'tank':
          // Extra enemy spawned or heals
          tank.health = Math.min(4, tank.health + 1);
          break;
        case 'boat':
          tank.hasBoat = true;
          break;
      }
    }
  }

  draw(ctx) {
    if (this.active && this.visible) {
      window.spriteManager.drawPowerup(ctx, this);
    }
  }

  static spawnRandom(map) {
    const types = ['helmet', 'clock', 'shovel', 'star', 'grenade', 'tank', 'pistol', 'boat'];
    const selected = types[Math.floor(Math.random() * types.length)];

    // Find safe random spot within bounds (16 to 192 px)
    const rx = Math.floor(Math.random() * 11 + 1) * 16;
    const ry = Math.floor(Math.random() * 11 + 1) * 16;

    const p = new Powerup(rx, ry, selected);
    window.soundSystem.playPowerupSpawn();
    return p;
  }
}

window.Powerup = Powerup;
