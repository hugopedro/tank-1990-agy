/**
 * Tank 1990 Modern Edition - Particle & Juice System
 * Creates that juicy, delightful 2D feel (Super Mario Bros. U style):
 * - Dust puffs from treads
 * - Brick debris & mortar chunks with gravity
 * - Shower of metallic sparks on steel ricochets
 * - Soft cartoon smoke rings from cannon recoil
 * - Expanding water caustics and splash ripples
 * - Floating leaf specks from foliage
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;

      if (p.gravity) {
        p.vy += p.gravity * dt * 60;
      }

      p.vx *= (p.friction || 0.96);
      p.vy *= (p.friction || 0.96);

      if (p.grow) {
        p.size += p.grow * dt * 60;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.rotation !== undefined && p.vRot) {
        p.rotation += p.vRot * dt * 60;
      }
    }
  }

  // Tread Dust Puff
  addTreadDust(x, y, dir) {
    // Spawn small dusty clouds at tank treads
    const angle = (dir * 90 + 180 + (Math.random() * 40 - 20)) * (Math.PI / 180);
    const speed = Math.random() * 0.8 + 0.4;
    this.particles.push({
      type: 'dust',
      x: x + (Math.random() * 8 - 4),
      y: y + (Math.random() * 8 - 4),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 3 + 3,
      grow: 0.15,
      alpha: 0.6,
      maxLife: 0.45,
      life: 0.45,
      friction: 0.92,
      color: 'rgba(215, 205, 185, '
    });
  }

  // Brick Crumble Debris
  addBrickDebris(x, y) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1.2;
      const isMortar = Math.random() > 0.6;
      this.particles.push({
        type: 'debris',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // slight upward bounce
        gravity: 0.18,
        size: Math.random() * 3 + 2,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
        alpha: 1.0,
        maxLife: 0.6,
        life: 0.6,
        color: isMortar ? '#e0d0c0' : (Math.random() > 0.5 ? '#d84828' : '#b03018')
      });
    }
  }

  // Steel Ricochet Sparks
  addSteelSparks(x, y, bulletDir) {
    const baseAngle = (bulletDir * 90 + 180) * (Math.PI / 180);
    for (let i = 0; i < 9; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * 1.6;
      const speed = Math.random() * 3.5 + 2.0;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        alpha: 1.0,
        maxLife: 0.3,
        life: 0.3,
        friction: 0.92,
        color: Math.random() > 0.3 ? '#fff480' : '#ffffff'
      });
    }
  }

  // Cannon Muzzle Flash & Smoke Puff
  addMuzzleSmoke(x, y, dir) {
    const angle = dir * 90 * (Math.PI / 180);
    const mx = x + Math.sin(angle) * 10;
    const my = y - Math.cos(angle) * 10;

    // Golden Flash Star
    this.particles.push({
      type: 'flash',
      x: mx,
      y: my,
      vx: 0,
      vy: 0,
      size: 9,
      alpha: 1.0,
      maxLife: 0.08,
      life: 0.08,
      color: '#ffe066'
    });

    // Soft smoke puff
    for (let i = 0; i < 3; i++) {
      const sAngle = angle + (Math.random() - 0.5) * 0.8;
      const spd = Math.random() * 1.2 + 0.5;
      this.particles.push({
        type: 'smoke',
        x: mx,
        y: my,
        vx: Math.sin(sAngle) * spd,
        vy: -Math.cos(sAngle) * spd,
        size: Math.random() * 4 + 4,
        grow: 0.2,
        alpha: 0.7,
        maxLife: 0.35,
        life: 0.35,
        friction: 0.94,
        color: 'rgba(230, 230, 240, '
      });
    }
  }

  // Water Ripple
  addWaterRipple(x, y) {
    this.particles.push({
      type: 'ripple',
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      size: 6,
      grow: 0.35,
      alpha: 0.7,
      maxLife: 0.5,
      life: 0.5,
      color: 'rgba(255, 255, 255, '
    });
  }

  // Floating Tree Leaves
  addLeaves(x, y) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        type: 'leaf',
        x: x + Math.random() * 16,
        y: y + Math.random() * 16,
        vx: (Math.random() - 0.5) * 0.8,
        vy: Math.random() * 0.6 + 0.3,
        size: Math.random() * 2 + 2,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.15,
        alpha: 0.9,
        maxLife: 0.9,
        life: 0.9,
        color: Math.random() > 0.5 ? '#88d820' : '#4ca810'
      });
    }
  }

  draw(ctx, scale = 1) {
    ctx.save();
    this.particles.forEach(p => {
      const px = p.x * scale;
      const py = p.y * scale;
      const pSize = p.size * scale;

      if (p.type === 'dust' || p.type === 'smoke') {
        ctx.fillStyle = `${p.color}${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'debris') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-pSize / 2, -pSize / 2, pSize, pSize);
        ctx.restore();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4 * scale;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'flash') {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = '#ffbb00';
        ctx.shadowBlur = 8 * scale;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'ripple') {
        ctx.strokeStyle = `${p.color}${p.alpha * 0.7})`;
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'leaf') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.ellipse(0, 0, pSize * 1.5, pSize, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

window.particleSystem = new ParticleSystem();
