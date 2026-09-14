/**
 * Tank 1990 / Battle City NES Bullet System
 * Handles ballistic trajectory, sub-tile destruction, bullet-vs-bullet cancellation,
 * and steel/eagle penetration.
 */

class Bullet {
  constructor(x, y, direction, speed, owner, canDestroySteel = false) {
    this.x = x; // Center coordinates
    this.y = y;
    this.direction = direction; // 0=UP, 1=RIGHT, 2=DOWN, 3=LEFT
    this.speed = speed;
    this.owner = owner; // 'player1', 'player2', or 'enemy'
    this.canDestroySteel = canDestroySteel;
    this.active = true;
    this.radius = 2.5; // for circular / box collision
  }

  update(dt, map) {
    if (!this.active) return;

    // Movement step
    const dist = this.speed * dt * 60;
    if (this.direction === 0) this.y -= dist;
    else if (this.direction === 1) this.x += dist;
    else if (this.direction === 2) this.y += dist;
    else if (this.direction === 3) this.x -= dist;

    // Boundary check (Playfield is 208x208 px)
    if (this.x < 2 || this.x > 206 || this.y < 2 || this.y > 206) {
      this.destroy(false);
      window.soundSystem.playSteelHit();
      return;
    }

    // Map Collision Check
    this._checkMapCollision(map);
  }

  _checkMapCollision(map) {
    // Check 8x8 sub-tiles intersecting bullet head
    const hitPoints = [];
    if (this.direction === 0) { // UP
      hitPoints.push({ x: this.x - 2, y: this.y - 2 }, { x: this.x + 2, y: this.y - 2 });
    } else if (this.direction === 1) { // RIGHT
      hitPoints.push({ x: this.x + 2, y: this.y - 2 }, { x: this.x + 2, y: this.y + 2 });
    } else if (this.direction === 2) { // DOWN
      hitPoints.push({ x: this.x - 2, y: this.y + 2 }, { x: this.x + 2, y: this.y + 2 });
    } else { // LEFT
      hitPoints.push({ x: this.x - 2, y: this.y - 2 }, { x: this.x - 2, y: this.y + 2 });
    }

    let hitSolid = false;
    let hitSteel = false;
    let hitBrick = false;
    let hitEagle = false;

    hitPoints.forEach(pt => {
      const tx = Math.floor(pt.x / 8);
      const ty = Math.floor(pt.y / 8);
      const tile = map.getSubTile(tx, ty);

      if (tile === 1) { // Brick
        hitSolid = true;
        hitBrick = true;
        map.setSubTile(tx, ty, 0); // Destroy brick
      } else if (tile === 2) { // Steel
        hitSolid = true;
        if (this.canDestroySteel) {
          map.setSubTile(tx, ty, 0); // Tier 3 Super Tank destroys steel!
          hitBrick = true; // Treated as destructible hit
        } else {
          hitSteel = true;
        }
      } else if (tile === 3 && this.canDestroySteel) {
        // Tank 1990 feature: Super tank can cut through trees
        map.setSubTile(tx, ty, 0);
      } else if (tile === 9) { // Eagle / Base
        hitSolid = true;
        hitEagle = true;
      }
    });

    if (hitEagle) {
      map.destroyEagle();
      this.destroy(true);
      window.soundSystem.playBigExplosion();
      if (window.game) window.game.onEagleDestroyed();
      return;
    }

    if (hitSolid) {
      this.destroy(false);
      if (hitSteel) {
        window.soundSystem.playSteelHit();
        if (window.particleSystem) window.particleSystem.addSteelSparks(this.x, this.y, this.direction);
      } else if (hitBrick) {
        window.soundSystem.playBrickHit();
        if (window.particleSystem) window.particleSystem.addBrickDebris(this.x, this.y);
      }
    }
  }

  destroy(isBig = false) {
    this.active = false;
    if (window.game) {
      window.game.addExplosion(this.x, this.y, isBig);
    }
  }
}

window.Bullet = Bullet;
