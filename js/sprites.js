/**
 * Tank 1990 - Hybrid Sprite & Modern 2D Vector Renderer
 * Supports BOTH:
 * 1. Classic NES 8-Bit Pixel Art (authentic to the 1990 ROM)
 * 2. Modern Juicy 2D HD (New Super Mario Bros. U aesthetic:
 *    rounded surfaces, clay/toy shading, ambient drop shadows,
 *    caustic water, swaying foliage, specular highlights, and recoil).
 */

window.PALETTE = {
  black: '#000000',
  white: '#ffffff',
  greyBorder: '#636363',
  lightGrey: '#b8b8b8',
  darkGrey: '#404040',
  brickRed: '#b53120',
  brickLight: '#fca044',
  brickDark: '#5c1000',
  steelLight: '#ffffff',
  steelMid: '#b8b8f8',
  steelDark: '#50509c',
  treeDark: '#005000',
  treeMid: '#00a800',
  treeLight: '#80d010',
  waterDark: '#0040b0',
  waterMid: '#0078f8',
  waterLight: '#ffffff',
  iceWhite: '#fcfcfc',
  iceBlue: '#3cbcfc',
  iceDark: '#0078a8',
  p1Yellow: '#fc9838',
  p1Light: '#fce4a0',
  p1Dark: '#b85400',
  p2Green: '#00a800',
  p2Light: '#b8f818',
  p2Dark: '#005000',
  enemyGrey: '#b8b8b8',
  enemyLight: '#ffffff',
  enemyDark: '#505050',
  bonusRed: '#e40058',
  bonusWhite: '#ffffff',
  eagleGold: '#fc9838',
  eagleWhite: '#ffffff',
  eagleDark: '#602000',
  deadEagle: '#707070'
};
var PALETTE = window.PALETTE;

class SpriteManager {
  constructor() {
    this.cache = new Map();
    this.waterFrame = 0;
    this.waterTimer = 0;
    this.shieldFrame = 0;
    this.shieldTimer = 0;
    this.bonusFlash = 0;
    this.bonusTimer = 0;
    this.init();
  }

  init() {
    this._createTerrainSprites();
    this._createEagleSprites();
    this._createPowerupSprites();
    this._createEffectSprites();
    this._createTankSprites();
    this._createUISprites();
  }

  update(dt) {
    this.waterTimer += dt;
    if (this.waterTimer > 0.28) {
      this.waterTimer = 0;
      this.waterFrame = (this.waterFrame + 1) % 2;
    }

    this.shieldTimer += dt;
    if (this.shieldTimer > 0.08) {
      this.shieldTimer = 0;
      this.shieldFrame = (this.shieldFrame + 1) % 2;
    }

    this.bonusTimer += dt;
    if (this.bonusTimer > 0.12) {
      this.bonusTimer = 0;
      this.bonusFlash = (this.bonusFlash + 1) % 2;
    }
  }

  _createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  /* ==========================================================
     CLASSIC 8-BIT SPRITES GENERATION
     ========================================================== */

  _createTerrainSprites() {
    // 8x8 Brick sub-tile
    const b = this._createCanvas(8, 8);
    const bctx = b.ctx;
    bctx.fillStyle = PALETTE.brickRed;
    bctx.fillRect(0, 0, 8, 8);
    bctx.fillStyle = PALETTE.black;
    bctx.fillRect(0, 3, 8, 1);
    bctx.fillRect(0, 7, 8, 1);
    bctx.fillRect(3, 0, 1, 3);
    bctx.fillRect(7, 4, 1, 3);
    bctx.fillStyle = PALETTE.brickLight;
    bctx.fillRect(0, 0, 3, 1);
    bctx.fillRect(4, 0, 3, 1);
    bctx.fillRect(0, 4, 7, 1);
    this.cache.set('brick', b.canvas);

    // 8x8 Steel sub-tile
    const s = this._createCanvas(8, 8);
    const sctx = s.ctx;
    sctx.fillStyle = PALETTE.steelMid;
    sctx.fillRect(0, 0, 8, 8);
    sctx.fillStyle = PALETTE.steelLight;
    sctx.fillRect(0, 0, 7, 1);
    sctx.fillRect(0, 0, 1, 7);
    sctx.fillStyle = PALETTE.steelDark;
    sctx.fillRect(7, 0, 1, 8);
    sctx.fillRect(0, 7, 8, 1);
    sctx.fillStyle = PALETTE.steelLight;
    sctx.fillRect(2, 2, 4, 1);
    sctx.fillRect(2, 4, 4, 1);
    sctx.fillStyle = PALETTE.steelDark;
    sctx.fillRect(3, 3, 2, 1);
    this.cache.set('steel', s.canvas);

    // 16x16 Trees
    const t = this._createCanvas(16, 16);
    const tctx = t.ctx;
    tctx.fillStyle = PALETTE.treeDark;
    tctx.fillRect(0, 0, 16, 16);
    tctx.fillStyle = PALETTE.treeMid;
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 4) {
        tctx.fillRect(x + 1, y, 2, 3);
        tctx.fillRect(x, y + 1, 4, 2);
      }
    }
    tctx.fillStyle = PALETTE.treeLight;
    for (let y = 0; y < 16; y += 4) {
      for (let x = 0; x < 16; x += 4) {
        tctx.fillRect(x + 1, y + 1, 1, 1);
        tctx.fillRect(x + 2, y + 2, 1, 1);
      }
    }
    this.cache.set('trees', t.canvas);

    // 16x16 Water - Frame 0
    const w0 = this._createCanvas(16, 16);
    const w0ctx = w0.ctx;
    w0ctx.fillStyle = PALETTE.waterDark;
    w0ctx.fillRect(0, 0, 16, 16);
    w0ctx.fillStyle = PALETTE.waterMid;
    for (let y = 1; y < 16; y += 4) w0ctx.fillRect(0, y, 16, 2);
    w0ctx.fillStyle = PALETTE.waterLight;
    w0ctx.fillRect(1, 1, 3, 1);
    w0ctx.fillRect(9, 1, 3, 1);
    w0ctx.fillRect(5, 5, 3, 1);
    w0ctx.fillRect(13, 5, 3, 1);
    this.cache.set('water0', w0.canvas);

    // 16x16 Water - Frame 1
    const w1 = this._createCanvas(16, 16);
    const w1ctx = w1.ctx;
    w1ctx.fillStyle = PALETTE.waterDark;
    w1ctx.fillRect(0, 0, 16, 16);
    w1ctx.fillStyle = PALETTE.waterMid;
    for (let y = 1; y < 16; y += 4) w1ctx.fillRect(0, y, 16, 2);
    w1ctx.fillStyle = PALETTE.waterLight;
    w1ctx.fillRect(5, 1, 3, 1);
    w1ctx.fillRect(13, 1, 3, 1);
    w1ctx.fillRect(1, 5, 3, 1);
    w1ctx.fillRect(9, 5, 3, 1);
    this.cache.set('water1', w1.canvas);

    // 16x16 Ice
    const ice = this._createCanvas(16, 16);
    const icectx = ice.ctx;
    icectx.fillStyle = PALETTE.iceWhite;
    icectx.fillRect(0, 0, 16, 16);
    icectx.fillStyle = PALETTE.iceBlue;
    for (let i = 0; i < 16; i += 4) {
      icectx.fillRect(i, i, 3, 1);
      icectx.fillRect((i + 8) % 16, (i + 4) % 16, 3, 1);
    }
    this.cache.set('ice', ice.canvas);
  }

  _createEagleSprites() {
    // Alive Eagle
    const e = this._createCanvas(16, 16);
    const ctx = e.ctx;
    ctx.fillStyle = PALETTE.eagleDark;
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = PALETTE.eagleGold;
    ctx.fillRect(2, 2, 12, 11);
    ctx.fillRect(1, 4, 14, 7);
    ctx.fillStyle = PALETTE.eagleWhite;
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillRect(4, 5, 8, 3);
    ctx.fillRect(2, 7, 2, 3);
    ctx.fillRect(12, 7, 2, 3);
    ctx.fillStyle = PALETTE.brickRed;
    ctx.fillRect(7, 6, 2, 3);
    this.cache.set('eagle_alive', e.canvas);

    // Dead Eagle
    const de = this._createCanvas(16, 16);
    const dctx = de.ctx;
    dctx.fillStyle = PALETTE.black;
    dctx.fillRect(0, 0, 16, 16);
    dctx.fillStyle = PALETTE.deadEagle;
    dctx.fillRect(2, 3, 12, 10);
    dctx.fillStyle = PALETTE.white;
    dctx.fillRect(5, 4, 2, 2);
    dctx.fillRect(9, 4, 2, 2);
    dctx.fillStyle = PALETTE.brickRed;
    dctx.fillRect(3, 11, 2, 2);
    this.cache.set('eagle_dead', de.canvas);
  }

  _createPowerupSprites() {
    const powerups = ['helmet', 'clock', 'shovel', 'star', 'grenade', 'tank', 'pistol', 'boat'];
    powerups.forEach(type => {
      const p = this._createCanvas(16, 16);
      const ctx = p.ctx;
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(0, 0, 16, 16);

      switch (type) {
        case 'helmet': {
          // ESCUDO (Heraldic Knight Shield)
          // Steel/Silver outer rim
          ctx.fillStyle = '#b0bec5';
          ctx.fillRect(2, 1, 12, 2); // Top rim
          ctx.fillRect(1, 2, 14, 7); // Main body width
          ctx.fillRect(2, 9, 12, 2);
          ctx.fillRect(3, 11, 10, 1);
          ctx.fillRect(4, 12, 8, 1);
          ctx.fillRect(5, 13, 6, 1);
          ctx.fillRect(6, 14, 4, 1);
          ctx.fillRect(7, 15, 2, 1); // Bottom tip

          // Inner Field: Royal Cobalt Blue
          ctx.fillStyle = '#0288d1';
          ctx.fillRect(3, 3, 10, 6);
          ctx.fillRect(4, 9, 8, 2);
          ctx.fillRect(5, 11, 6, 1);
          ctx.fillRect(6, 12, 4, 1);
          ctx.fillRect(7, 13, 2, 1);

          // Center Heraldic Cross (Gold)
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(7, 3, 2, 8); // Vertical arm
          ctx.fillRect(4, 5, 8, 2); // Horizontal arm

          // Specular highlights (Pure White)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(3, 1, 4, 1);
          ctx.fillRect(1, 3, 1, 5);
          ctx.fillRect(7, 5, 2, 2); // Center gleam
          break;
        }

        case 'star': {
          // SARGENTO (Military Sergeant Rank Chevrons - Promoção de Tanque)
          // Tactical dark patch backing
          ctx.fillStyle = '#1b2228';
          ctx.fillRect(2, 1, 12, 14);

          // Top Chevron 1 (Bright Gold ᐱ)
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(7, 1, 2, 2); // Peak
          ctx.fillRect(5, 2, 2, 2);
          ctx.fillRect(9, 2, 2, 2);
          ctx.fillRect(3, 3, 2, 2);
          ctx.fillRect(11, 3, 2, 2);

          // Middle Chevron 2 (Bright Gold ᐱ)
          ctx.fillRect(7, 5, 2, 2);
          ctx.fillRect(5, 6, 2, 2);
          ctx.fillRect(9, 6, 2, 2);
          ctx.fillRect(3, 7, 2, 2);
          ctx.fillRect(11, 7, 2, 2);

          // Bottom Chevron 3 (Bright Gold ᐱ)
          ctx.fillRect(7, 9, 2, 2);
          ctx.fillRect(5, 10, 2, 2);
          ctx.fillRect(9, 10, 2, 2);
          ctx.fillRect(3, 11, 2, 2);
          ctx.fillRect(11, 11, 2, 2);

          // Crisp White Highlights on chevron peaks
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(7, 1, 2, 1);
          ctx.fillRect(7, 5, 2, 1);
          ctx.fillRect(7, 9, 2, 1);

          // Base rocker bar at bottom
          ctx.fillStyle = '#ff9800';
          ctx.fillRect(4, 13, 8, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(7, 13, 2, 2);
          break;
        }

        case 'clock': {
          // RELÓGIO (Stopwatch / Clock Face)
          // Top ring/crown
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(7, 0, 2, 2);
          ctx.fillRect(6, 1, 4, 1);

          // Outer bezel ring
          ctx.fillStyle = '#37474f';
          ctx.fillRect(3, 2, 10, 13);
          ctx.fillRect(2, 3, 12, 11);

          // Dial face (Crisp White)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(4, 3, 8, 11);
          ctx.fillRect(3, 4, 10, 9);

          // Hour tick marks (12, 3, 6, 9)
          ctx.fillStyle = '#78909c';
          ctx.fillRect(7, 3, 2, 1);  // 12
          ctx.fillRect(12, 8, 1, 2); // 3
          ctx.fillRect(7, 13, 2, 1); // 6
          ctx.fillRect(3, 8, 1, 2);  // 9

          // Clock Hands (Red hands at 10:10)
          ctx.fillStyle = '#d50000';
          ctx.fillRect(7, 8, 2, 2); // Hub
          ctx.fillRect(5, 6, 2, 2); // Hour hand
          ctx.fillRect(9, 6, 2, 2); // Minute hand
          break;
        }

        case 'shovel': {
          // PÁ (Entrenching Spade Shovel)
          // Top T-Handle
          ctx.fillStyle = '#bcaaa4';
          ctx.fillRect(5, 1, 6, 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(6, 1, 4, 1);

          // Shaft (Wood pole)
          ctx.fillStyle = '#8d6e63';
          ctx.fillRect(7, 3, 2, 5);

          // Spade blade (Steel scoop)
          ctx.fillStyle = '#cfd8dc';
          ctx.fillRect(4, 8, 8, 4);
          ctx.fillRect(5, 12, 6, 2);
          ctx.fillRect(7, 14, 2, 1); // Tip

          // Blade center ridge & highlights
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(5, 9, 2, 3);
          ctx.fillStyle = '#546e7a';
          ctx.fillRect(7, 8, 2, 5); // Spine
          ctx.fillRect(9, 9, 2, 3);
          break;
        }

        case 'grenade': {
          // GRANADA (Pineapple Fragmentation Grenade)
          // Fuse & safety pin
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(5, 1, 2, 2); // Pin ring
          ctx.fillStyle = '#cfd8dc';
          ctx.fillRect(7, 2, 3, 3); // Lever

          // Grenade body (Olive green)
          ctx.fillStyle = '#33691e';
          ctx.fillRect(4, 5, 8, 9);
          ctx.fillRect(3, 6, 10, 7);

          // Fragmentation ribbed grid (Light olive segments)
          ctx.fillStyle = '#76ff03';
          ctx.fillRect(4, 6, 3, 2);
          ctx.fillRect(8, 6, 3, 2);
          ctx.fillRect(4, 9, 3, 2);
          ctx.fillRect(8, 9, 3, 2);
          ctx.fillRect(5, 12, 2, 1);
          ctx.fillRect(8, 12, 2, 1);
          break;
        }

        case 'tank': {
          // TANQUE (Mini Hero Tank - 1-UP Extra Life)
          // Barrel
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(7, 1, 2, 5);

          // Turret in center
          ctx.fillStyle = '#ff9800';
          ctx.fillRect(5, 5, 6, 5);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(7, 6, 2, 3); // Hatch

          // Left tread
          ctx.fillStyle = '#37474f';
          ctx.fillRect(2, 4, 3, 10);
          ctx.fillStyle = '#90a4ae';
          ctx.fillRect(2, 5, 2, 1);
          ctx.fillRect(2, 8, 2, 1);
          ctx.fillRect(2, 11, 2, 1);

          // Right tread
          ctx.fillStyle = '#37474f';
          ctx.fillRect(11, 4, 3, 10);
          ctx.fillStyle = '#90a4ae';
          ctx.fillRect(12, 5, 2, 1);
          ctx.fillRect(12, 8, 2, 1);
          ctx.fillRect(12, 11, 2, 1);

          // Front hull glint
          ctx.fillStyle = '#ffd54f';
          ctx.fillRect(5, 10, 6, 3);
          break;
        }

        case 'pistol': {
          // PISTOLA (Super Blaster Weapon)
          // Slide & barrel
          ctx.fillStyle = '#eceff1';
          ctx.fillRect(2, 3, 12, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, 3, 11, 1);

          // Muzzle & front sight
          ctx.fillStyle = '#90a4ae';
          ctx.fillRect(2, 2, 2, 1);
          ctx.fillRect(1, 4, 1, 2);

          // Trigger guard & hammer
          ctx.fillStyle = '#607d8b';
          ctx.fillRect(12, 2, 2, 2);
          ctx.fillRect(6, 7, 1, 3);
          ctx.fillRect(6, 9, 3, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(8, 7, 1, 2);

          // Checkered Grip (Warm orange/brown)
          ctx.fillStyle = '#e65100';
          ctx.fillRect(9, 7, 4, 7);
          ctx.fillStyle = '#ffb74d';
          ctx.fillRect(10, 8, 2, 2);
          ctx.fillRect(10, 11, 2, 2);
          break;
        }

        case 'boat': {
          // BARCO (Amphibious Patrol Boat)
          // Hull
          ctx.fillStyle = '#0288d1';
          ctx.fillRect(1, 9, 14, 4);
          ctx.fillRect(2, 13, 12, 1);
          ctx.fillRect(0, 9, 2, 2);

          // Cabin & Windshield
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(4, 5, 8, 4);
          ctx.fillStyle = '#263238';
          ctx.fillRect(5, 6, 6, 2);

          // Wake spray
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(0, 11, 2, 2);
          ctx.fillRect(13, 11, 3, 2);
          break;
        }
      }
      this.cache.set(`powerup_${type}`, p.canvas);
    });
  }

  _createEffectSprites() {
    // 4 Spawn Animation Frames
    const starSizes = [2, 5, 7, 4];
    starSizes.forEach((sz, idx) => {
      const sp = this._createCanvas(16, 16);
      const ctx = sp.ctx;
      const center = 8;
      ctx.fillStyle = PALETTE.white;
      ctx.fillRect(center - 1, center - sz, 2, sz * 2);
      ctx.fillRect(center - sz, center - 1, sz * 2, 2);
      this.cache.set(`spawn_${idx}`, sp.canvas);
    });

    // Shield Rings
    [0, 1].forEach(frame => {
      const sh = this._createCanvas(16, 16);
      const ctx = sh.ctx;
      ctx.fillStyle = frame === 0 ? PALETTE.white : PALETTE.p1Light;
      const dots = [[4, 1], [8, 0], [11, 1], [14, 4], [15, 8], [14, 11], [11, 14], [8, 15], [4, 14], [1, 11], [0, 8], [1, 4]];
      dots.forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));
      this.cache.set(`shield_${frame}`, sh.canvas);
    });

    // Explosions
    [0, 1, 2].forEach(f => {
      const exp = this._createCanvas(16, 16);
      const ctx = exp.ctx;
      const r = [3, 6, 7][f];
      ctx.fillStyle = f === 0 ? PALETTE.white : f === 1 ? PALETTE.p1Yellow : PALETTE.brickRed;
      ctx.beginPath();
      ctx.arc(8, 8, r, 0, Math.PI * 2);
      ctx.fill();
      this.cache.set(`sm_exp_${f}`, exp.canvas);
    });

    [0, 1, 2, 3, 4].forEach(f => {
      const exp = this._createCanvas(32, 32);
      const ctx = exp.ctx;
      const rad = [5, 9, 13, 14, 10][f];
      ctx.fillStyle = f < 2 ? PALETTE.p1Light : f < 4 ? PALETTE.bonusRed : PALETTE.darkGrey;
      ctx.beginPath();
      ctx.arc(16, 16, rad, 0, Math.PI * 2);
      ctx.fill();
      this.cache.set(`big_exp_${f}`, exp.canvas);
    });

    // Bullet
    const b = this._createCanvas(4, 4);
    b.ctx.fillStyle = PALETTE.white;
    b.ctx.fillRect(1, 0, 2, 4);
    b.ctx.fillRect(0, 1, 4, 2);
    this.cache.set('bullet', b.canvas);
  }

  _createTankSprites() {
    const playerConfigs = [
      { prefix: 'p1', primary: PALETTE.p1Yellow, light: PALETTE.p1Light, dark: PALETTE.p1Dark },
      { prefix: 'p2', primary: PALETTE.p2Green, light: PALETTE.p2Light, dark: PALETTE.p2Dark }
    ];

    playerConfigs.forEach(cfg => {
      for (let tier = 0; tier <= 3; tier++) {
        for (let dir = 0; dir < 4; dir++) {
          for (let frame = 0; frame < 2; frame++) {
            const key = `${cfg.prefix}_t${tier}_d${dir}_f${frame}`;
            const canvas = this._renderClassicTank(cfg.primary, cfg.light, cfg.dark, tier, dir, frame);
            this.cache.set(key, canvas);
          }
        }
      }
    });

    const enemyConfigs = [
      { type: 'basic', primary: PALETTE.enemyGrey, light: PALETTE.enemyLight, dark: PALETTE.enemyDark, tier: 0 },
      { type: 'fast', primary: PALETTE.enemyGrey, light: PALETTE.enemyLight, dark: PALETTE.enemyDark, tier: 1 },
      { type: 'power', primary: PALETTE.enemyGrey, light: PALETTE.enemyLight, dark: PALETTE.enemyDark, tier: 2 },
      { type: 'armor0', primary: PALETTE.p2Green, light: PALETTE.p2Light, dark: PALETTE.p2Dark, tier: 3 },
      { type: 'armor1', primary: PALETTE.p1Yellow, light: PALETTE.p1Light, dark: PALETTE.p1Dark, tier: 3 },
      { type: 'armor2', primary: PALETTE.lightGrey, light: PALETTE.white, dark: PALETTE.darkGrey, tier: 3 },
      { type: 'armor3', primary: PALETTE.bonusRed, light: PALETTE.white, dark: PALETTE.brickDark, tier: 3 },
    ];

    enemyConfigs.forEach(cfg => {
      for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 2; frame++) {
          const key = `enemy_${cfg.type}_d${dir}_f${frame}`;
          const canvas = this._renderClassicTank(cfg.primary, cfg.light, cfg.dark, cfg.tier, dir, frame);
          this.cache.set(key, canvas);

          const bonusKey = `enemy_${cfg.type}_bonus_d${dir}_f${frame}`;
          const bonusCanvas = this._renderClassicTank(PALETTE.bonusRed, PALETTE.bonusWhite, PALETTE.brickDark, cfg.tier, dir, frame);
          this.cache.set(bonusKey, bonusCanvas);
        }
      }
    });
  }

  _renderClassicTank(primary, light, dark, tier, dir, frame) {
    const { canvas, ctx } = this._createCanvas(16, 16);
    ctx.save();
    ctx.translate(8, 8);
    ctx.rotate((dir * 90 * Math.PI) / 180);
    ctx.translate(-8, -8);

    ctx.fillStyle = dark;
    ctx.fillRect(1, 1, 3, 14);
    ctx.fillRect(12, 1, 3, 14);

    ctx.fillStyle = light;
    for (let y = 1; y < 15; y += 2) {
      const offset = frame === 0 ? 0 : 1;
      if ((y + offset) % 4 < 2) {
        ctx.fillRect(1, y, 3, 1);
        ctx.fillRect(12, y, 3, 1);
      }
    }

    ctx.fillStyle = primary;
    ctx.fillRect(4, 4, 8, 9);
    ctx.fillStyle = light;
    ctx.fillRect(4, 4, 8, 2);

    ctx.fillStyle = dark;
    ctx.fillRect(6, 6, 4, 5);
    ctx.fillStyle = light;
    ctx.fillRect(6, 6, 3, 2);

    ctx.fillStyle = light;
    if (tier === 0) ctx.fillRect(7, 1, 2, 6);
    else if (tier === 1) ctx.fillRect(7, 0, 2, 7);
    else if (tier === 2) {
      ctx.fillRect(6, 1, 2, 6);
      ctx.fillRect(8, 1, 2, 6);
    } else {
      ctx.fillRect(6, 0, 4, 7);
      ctx.fillStyle = primary;
      ctx.fillRect(7, 0, 2, 8);
    }

    ctx.restore();
    return canvas;
  }

  _createUISprites() {
    const e = this._createCanvas(8, 8);
    e.ctx.fillStyle = PALETTE.black;
    e.ctx.fillRect(1, 2, 6, 5);
    e.ctx.fillRect(3, 0, 2, 3);
    e.ctx.fillStyle = PALETTE.brickRed;
    e.ctx.fillRect(2, 3, 4, 3);
    this.cache.set('ui_enemy_icon', e.canvas);

    const f = this._createCanvas(16, 16);
    f.ctx.fillStyle = PALETTE.black;
    f.ctx.fillRect(2, 2, 2, 12);
    f.ctx.fillStyle = PALETTE.brickRed;
    f.ctx.fillRect(4, 2, 9, 6);
    f.ctx.fillStyle = PALETTE.p1Yellow;
    f.ctx.fillRect(7, 4, 3, 2);
    this.cache.set('ui_flag', f.canvas);
  }

  /* ==========================================================
     MODERN 2D VECTOR RENDERING (New Super Mario Bros. U style)
     ========================================================== */

  drawModernTile(ctx, tileType, x, y, time) {
    // Coordinates are in 0..208 space (8x8 sub-tiles or 16x16 blocks)
    if (tileType === 1) {
      // Modern Brick (8x8)
      ctx.save();
      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(x + 0.5, y + 0.8, 7.5, 7.5);

      // Terracotta gradient
      const grad = ctx.createLinearGradient(x, y, x, y + 8);
      grad.addColorStop(0, '#e65c36');
      grad.addColorStop(0.3, '#cf4320');
      grad.addColorStop(1, '#94260e');
      ctx.fillStyle = grad;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, 7.5, 7.5, 1);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, 7.5, 7.5);
      }

      // Top sunshine bevel highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(x + 0.8, y + 0.5, 5.8, 1);

      // Mortar groove line
      ctx.fillStyle = '#4a1205';
      ctx.fillRect(x, y + 3.8, 7.5, 0.8);
      ctx.fillRect(x + 3.8, y, 0.8, 3.8);

      ctx.restore();
    } else if (tileType === 2) {
      // Modern Steel Plate (8x8)
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x + 0.5, y + 0.8, 7.5, 7.5);

      // Brushed titanium metal gradient
      const sGrad = ctx.createLinearGradient(x, y, x + 8, y + 8);
      sGrad.addColorStop(0, '#ffffff');
      sGrad.addColorStop(0.3, '#d0d8e8');
      sGrad.addColorStop(0.7, '#8894ab');
      sGrad.addColorStop(1, '#566075');
      ctx.fillStyle = sGrad;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, 7.5, 7.5, 1.2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, 7.5, 7.5);
      }

      // Bevel & rivets on corners
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 1.2, y + 1.2, 1, 1);
      ctx.fillRect(x + 5.2, y + 1.2, 1, 1);
      ctx.fillRect(x + 1.2, y + 5.2, 1, 1);
      ctx.fillRect(x + 5.2, y + 5.2, 1, 1);

      ctx.fillStyle = '#2b3342';
      ctx.fillRect(x + 1.7, y + 1.7, 0.8, 0.8);
      ctx.fillRect(x + 5.7, y + 1.7, 0.8, 0.8);
      ctx.fillRect(x + 1.7, y + 5.7, 0.8, 0.8);
      ctx.fillRect(x + 5.7, y + 5.7, 0.8, 0.8);

      // Diagonal specular gleam
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x + 2, y);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x, y + 4);
      ctx.lineTo(x, y + 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    } else if (tileType === 3) {
      // Modern Foliage / Trees (16x16)
      // Plump Mario-style rounded canopy with breathing idle wave
      ctx.save();
      const sway = Math.sin((time || 0) * 2.5 + x * 0.2) * 0.6;
      ctx.translate(x + 8 + sway, y + 8);

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 3, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Multi-layered lush green clumps
      const clumps = [
        { cx: -3, cy: 1, r: 5.5, col1: '#84e622', col2: '#289c0a' },
        { cx: 3, cy: 1, r: 5.5, col1: '#7ad91e', col2: '#208807' },
        { cx: 0, cy: -3, r: 5.8, col1: '#9df22e', col2: '#30b00e' }
      ];

      clumps.forEach(c => {
        const radGrad = ctx.createRadialGradient(c.cx - 1.5, c.cy - 1.5, 1, c.cx, c.cy, c.r);
        radGrad.addColorStop(0, c.col1);
        radGrad.addColorStop(0.7, c.col2);
        radGrad.addColorStop(1, '#0e5203');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
        ctx.fill();

        // Glossy sun highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(c.cx - 1.2, c.cy - 1.8, c.r * 0.4, c.r * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    } else if (tileType === 4) {
      // Modern Animated Water (16x16)
      ctx.save();
      // Tropical turquoise gradient
      const wGrad = ctx.createLinearGradient(x, y, x, y + 16);
      wGrad.addColorStop(0, '#00c6ff');
      wGrad.addColorStop(0.5, '#0072ff');
      wGrad.addColorStop(1, '#0048b8');
      ctx.fillStyle = wGrad;
      ctx.fillRect(x, y, 16, 16);

      // Undulating Caustics Waves
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      const t = time || 0;
      for (let w = 2; w < 16; w += 5) {
        const waveY = y + w + Math.sin(t * 3 + x * 0.4 + w) * 1.2;
        ctx.beginPath();
        ctx.ellipse(x + 8 + Math.cos(t * 2 + w) * 3, waveY, 5, 1, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shoreline foam highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(x, y, 16, 0.8);

      ctx.restore();
    } else if (tileType === 5) {
      // Modern Ice (16x16)
      ctx.save();
      const iGrad = ctx.createLinearGradient(x, y, x + 16, y + 16);
      iGrad.addColorStop(0, '#f0f8ff');
      iGrad.addColorStop(0.4, '#d8eefc');
      iGrad.addColorStop(1, '#a6d4f5');
      ctx.fillStyle = iGrad;
      ctx.fillRect(x, y, 16, 16);

      // Crystalline cracks and shine
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 14);
      ctx.lineTo(x + 8, y + 8);
      ctx.lineTo(x + 14, y + 10);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 12, y + 4, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  drawModernEagle(ctx, x, y, isAlive, time) {
    ctx.save();
    if (isAlive) {
      // Polished Stone Plinth
      ctx.fillStyle = '#3a3e4a';
      ctx.fillRect(x + 1, y + 12, 14, 4);
      ctx.fillStyle = '#788094';
      ctx.fillRect(x + 2, y + 12, 12, 1);

      // Golden ambient halo
      const pulse = Math.sin((time || 0) * 4) * 0.15 + 0.85;
      const haloGrad = ctx.createRadialGradient(x + 8, y + 7, 2, x + 8, y + 7, 10);
      haloGrad.addColorStop(0, `rgba(255, 215, 0, ${0.4 * pulse})`);
      haloGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(x + 8, y + 7, 10, 0, Math.PI * 2);
      ctx.fill();

      // 3D Golden Wings & Crest
      const goldGrad = ctx.createLinearGradient(x + 2, y + 1, x + 14, y + 12);
      goldGrad.addColorStop(0, '#fff480');
      goldGrad.addColorStop(0.3, '#ffc400');
      goldGrad.addColorStop(0.8, '#d48800');
      goldGrad.addColorStop(1, '#8a5200');
      ctx.fillStyle = goldGrad;

      // Eagle wings shape
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 1); // Head
      ctx.lineTo(x + 14, y + 4);
      ctx.lineTo(x + 13, y + 10);
      ctx.lineTo(x + 9, y + 12);
      ctx.lineTo(x + 8, y + 10);
      ctx.lineTo(x + 7, y + 12);
      ctx.lineTo(x + 3, y + 10);
      ctx.lineTo(x + 2, y + 4);
      ctx.closePath();
      ctx.fill();

      // Ruby gemstone eye with periodic glint
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(x + 8, y + 4, 1.2, 0, Math.PI * 2);
      ctx.fill();

      if (Math.floor((time || 0) * 2) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 7.5, y + 3.5, 1, 1);
      }
    } else {
      // Destroyed Eagle Statue
      ctx.fillStyle = '#22252a';
      ctx.fillRect(x + 1, y + 11, 14, 5);
      ctx.fillStyle = '#555a64';
      ctx.beginPath();
      ctx.moveTo(x + 3, y + 11);
      ctx.lineTo(x + 6, y + 6);
      ctx.lineTo(x + 9, y + 8);
      ctx.lineTo(x + 13, y + 11);
      ctx.closePath();
      ctx.fill();

      // Embers
      ctx.fillStyle = '#ff3d00';
      ctx.fillRect(x + 5, y + 8, 1.5, 1.5);
      ctx.fillRect(x + 10, y + 9, 1.5, 1.5);
    }
    ctx.restore();
  }

  drawModernTank(ctx, tank, time) {
    ctx.save();
    const cx = tank.x + (tank.renderOffsetX || 0) + 8;
    const cy = tank.y + (tank.renderOffsetY || 0) + 8;

    // 1. Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 1.5, 7.8, 7.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotate context to tank direction
    ctx.translate(cx, cy);
    ctx.rotate((tank.direction * 90 * Math.PI) / 180);

    // Color theme configuration
    let primaryLight = '#ffe066';
    let primaryMid = '#ffaa00';
    let primaryDark = '#b86600';
    let accentCol = '#ff3344';

    if (tank.isPlayer) {
      if (tank.playerIndex === 1) { // P2 (Luigi green)
        primaryLight = '#69f0ae';
        primaryMid = '#00c853';
        primaryDark = '#006a26';
        accentCol = '#ffffff';
      } else { // P1 (Mario gold)
        primaryLight = '#ffe066';
        primaryMid = '#ffaa00';
        primaryDark = '#b86600';
        accentCol = '#e60026';
      }
    } else {
      // Enemy themes
      if (tank.enemyType === 'basic') {
        primaryLight = '#ffffff';
        primaryMid = '#cfd8dc';
        primaryDark = '#607d8b';
        accentCol = '#00b0ff';
      } else if (tank.enemyType === 'fast') {
        primaryLight = '#ff8a80';
        primaryMid = '#ff1744';
        primaryDark = '#b71c1c';
        accentCol = '#ffffff';
      } else if (tank.enemyType === 'power') {
        primaryLight = '#b388ff';
        primaryMid = '#651fff';
        primaryDark = '#311b92';
        accentCol = '#00e5ff';
      } else if (tank.enemyType === 'armor') {
        const hp = tank.health;
        if (hp === 4) { // Emerald
          primaryLight = '#b9f6ca'; primaryMid = '#00e676'; primaryDark = '#007038';
        } else if (hp === 3) { // Citrine
          primaryLight = '#ffe57f'; primaryMid = '#ffd600'; primaryDark = '#c79100';
        } else if (hp === 2) { // Silver
          primaryLight = '#ffffff'; primaryMid = '#eceff1'; primaryDark = '#78909c';
        } else { // Molten ruby
          primaryLight = '#ff8a80'; primaryMid = '#d50000'; primaryDark = '#5c0000';
        }
      }

      // Bonus Tank Shimmer
      if (tank.isBonus && this.bonusFlash === 1) {
        primaryLight = '#ff80ab';
        primaryMid = '#ff4081';
        primaryDark = '#880e4f';
      }
    }

    // 2. Treads (Left & Right)
    ctx.fillStyle = '#21252d';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-7, -7, 3, 14, 1.2);
      ctx.roundRect(4, -7, 3, 14, 1.2);
      ctx.fill();
    } else {
      ctx.fillRect(-7, -7, 3, 14);
      ctx.fillRect(4, -7, 3, 14);
    }

    // Tread Wheels / Sprockets
    ctx.fillStyle = '#5a6275';
    for (let wy = -4.5; wy <= 4.5; wy += 4.5) {
      ctx.beginPath();
      ctx.arc(-5.5, wy, 1.1, 0, Math.PI * 2);
      ctx.arc(5.5, wy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Main Hull / Chassis
    const hullGrad = ctx.createLinearGradient(0, -6, 0, 6);
    hullGrad.addColorStop(0, primaryLight);
    hullGrad.addColorStop(0.4, primaryMid);
    hullGrad.addColorStop(1, primaryDark);
    ctx.fillStyle = hullGrad;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-4.5, -5.5, 9, 11, 2);
      ctx.fill();
    } else {
      ctx.fillRect(-4.5, -5.5, 9, 11);
    }

    // Accent Stripe / Decal
    ctx.fillStyle = accentCol;
    ctx.fillRect(-3, 3, 6, 1.5);

    // 4. Cannon Barrel (with Recoil spring)
    const tier = tank.tier || 0;
    const barrelGrad = ctx.createLinearGradient(-1.5, 0, 1.5, 0);
    barrelGrad.addColorStop(0, '#90a4ae');
    barrelGrad.addColorStop(0.5, '#ffffff');
    barrelGrad.addColorStop(1, '#455a64');
    ctx.fillStyle = barrelGrad;

    let bLength = 6.5;
    if (tier === 1) bLength = 8.5;
    else if (tier === 2) bLength = 7.5;
    else if (tier === 3) bLength = 9.5;

    if (tier === 2) {
      // Twin Cannons
      ctx.fillRect(-2.5, -bLength, 1.8, bLength);
      ctx.fillRect(0.7, -bLength, 1.8, bLength);
    } else if (tier === 3) {
      // Heavy Super Howitzer with Muzzle Brake
      ctx.fillRect(-2, -bLength, 4, bLength);
      ctx.fillStyle = primaryDark;
      ctx.fillRect(-2.5, -bLength - 1, 5, 2);
    } else {
      // Standard Barrel
      ctx.fillRect(-1.2, -bLength, 2.4, bLength);
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-1.5, -bLength - 0.5, 3, 1.2);
    }

    // 5. Spherical Turret Dome
    const turretGrad = ctx.createRadialGradient(-1, -1, 0.5, 0, 0, 4);
    turretGrad.addColorStop(0, '#ffffff');
    turretGrad.addColorStop(0.3, primaryLight);
    turretGrad.addColorStop(0.8, primaryMid);
    turretGrad.addColorStop(1, primaryDark);
    ctx.fillStyle = turretGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Turret hatch ring
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();

    // 6. Boat overlay if amphibious
    if (tank.hasBoat) {
      ctx.save();
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 9.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Modern Iridescent Shield
    if (tank.shieldTimer > 0) {
      ctx.save();
      const sAngle = (time || 0) * 4;
      const shGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 11);
      shGrad.addColorStop(0, 'rgba(0, 229, 255, 0.1)');
      shGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.4)');
      shGrad.addColorStop(1, 'rgba(255, 64, 129, 0.6)');

      ctx.fillStyle = shGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Energy Hex Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const rad = sAngle + (a * Math.PI) / 3;
        const hx = cx + Math.cos(rad) * 10.5;
        const hy = cy + Math.sin(rad) * 10.5;
        if (a === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  drawModernBullet(ctx, bullet) {
    ctx.save();
    // Warm glowing energy missile
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffbb00';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Trailing spark core
    ctx.fillStyle = '#ff6d00';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawModernPowerup(ctx, powerup, time) {
    ctx.save();
    // Juicy Mario-style floating bobbing
    const bob = Math.sin((time || 0) * 5 + powerup.x) * 2;
    const px = powerup.x + 8;
    const py = powerup.y + 8 + bob;

    // Glowing aura
    const aura = ctx.createRadialGradient(px, py, 2, px, py, 13);
    aura.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    aura.addColorStop(0.5, 'rgba(255, 179, 0, 0.25)');
    aura.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(px, py, 13, 0, Math.PI * 2);
    ctx.fill();

    // High-contrast circular medal badge with metallic gold border
    ctx.fillStyle = 'rgba(17, 19, 29, 0.92)';
    ctx.beginPath();
    ctx.arc(px, py, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Metallic gold rim
    const rimGrad = ctx.createLinearGradient(px - 9, py - 9, px + 9, py + 9);
    rimGrad.addColorStop(0, '#ffffff');
    rimGrad.addColorStop(0.35, '#ffd700');
    rimGrad.addColorStop(1, '#ff8f00');
    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Draw crisp sprite at native 16x16 size, centered without blurry downscaling!
    const spr = this.cache.get(`powerup_${powerup.type}`);
    if (spr) {
      ctx.drawImage(spr, Math.round(px - 8), Math.round(py - 8));
    }

    // Specular shine glint at top-left
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(px - 4, py - 4, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawModernExplosion(ctx, exp) {
    ctx.save();
    const f = exp.frame;
    const maxF = exp.maxFrames;
    const progress = f / maxF;
    const rad = (exp.isBig ? 14 : 7) * (0.6 + progress * 0.8);

    // Inner blinding white-yellow flash
    const expGrad = ctx.createRadialGradient(exp.x, exp.y, 1, exp.x, exp.y, rad);
    expGrad.addColorStop(0, '#ffffff');
    expGrad.addColorStop(0.3, '#ffe600');
    expGrad.addColorStop(0.7, '#ff3d00');
    expGrad.addColorStop(1, 'rgba(213, 0, 0, 0)');
    ctx.fillStyle = expGrad;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, rad, 0, Math.PI * 2);
    ctx.fill();

    // Puffy cartoon smoke clouds
    if (f > 1) {
      ctx.fillStyle = `rgba(55, 65, 81, ${0.8 - progress * 0.7})`;
      for (let a = 0; a < 5; a++) {
        const angle = (a * Math.PI * 2) / 5;
        const sx = exp.x + Math.cos(angle) * (rad * 0.7);
        const sy = exp.y + Math.sin(angle) * (rad * 0.7);
        ctx.beginPath();
        ctx.arc(sx, sy, rad * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ==========================================================
     UNIFIED DRAW DISPATCHERS (Supports Classic & Modern)
     ========================================================== */

  drawTile(ctx, tileType, x, y, isModern = true, time = 0) {
    if (isModern) {
      this.drawModernTile(ctx, tileType, x, y, time);
    } else {
      // Classic 8-bit
      if (tileType === 1) {
        const brick = this.cache.get('brick');
        if (brick) ctx.drawImage(brick, x, y);
      } else if (tileType === 2) {
        const steel = this.cache.get('steel');
        if (steel) ctx.drawImage(steel, x, y);
      } else if (tileType === 3) {
        const trees = this.cache.get('trees');
        if (trees) ctx.drawImage(trees, x, y);
      } else if (tileType === 4) {
        const water = this.cache.get(`water${this.waterFrame}`);
        if (water) ctx.drawImage(water, x, y);
      } else if (tileType === 5) {
        const ice = this.cache.get('ice');
        if (ice) ctx.drawImage(ice, x, y);
      }
    }
  }

  drawEagle(ctx, x, y, isAlive, isModern = true, time = 0) {
    if (isModern) {
      this.drawModernEagle(ctx, x, y, isAlive, time);
    } else {
      const key = isAlive ? 'eagle_alive' : 'eagle_dead';
      const spr = this.cache.get(key);
      if (spr) ctx.drawImage(spr, x, y);
    }
  }

  drawTank(ctx, tank, isModern = true, time = 0) {
    if (isModern) {
      this.drawModernTank(ctx, tank, time);
    } else {
      // Classic 8-bit
      let key;
      if (tank.isPlayer) {
        const p = tank.playerIndex === 1 ? 'p2' : 'p1';
        key = `${p}_t${tank.tier}_d${tank.direction}_f${tank.animFrame}`;
      } else {
        let typeStr = tank.enemyType;
        if (tank.enemyType === 'armor') {
          const hpIndex = Math.max(0, Math.min(3, 4 - tank.health));
          typeStr = `armor${hpIndex}`;
        }
        if (tank.isBonus && this.bonusFlash === 1) {
          key = `enemy_${typeStr}_bonus_d${tank.direction}_f${tank.animFrame}`;
        } else {
          key = `enemy_${typeStr}_d${tank.direction}_f${tank.animFrame}`;
        }
      }

      const rx = Math.round(tank.x + (tank.renderOffsetX || 0));
      const ry = Math.round(tank.y + (tank.renderOffsetY || 0));

      const spr = this.cache.get(key);
      if (spr) {
        ctx.drawImage(spr, rx, ry);
      }

      if (tank.hasBoat) {
        ctx.strokeStyle = PALETTE.waterLight;
        ctx.lineWidth = 1;
        ctx.strokeRect(rx, ry, 16, 16);
      }

      if (tank.shieldTimer > 0) {
        const shieldSpr = this.cache.get(`shield_${this.shieldFrame}`);
        if (shieldSpr) {
          ctx.drawImage(shieldSpr, rx, ry);
        }
      }
    }
  }

  drawBullet(ctx, bullet, isModern = true) {
    if (isModern) {
      this.drawModernBullet(ctx, bullet);
    } else {
      const spr = this.cache.get('bullet');
      if (spr) {
        ctx.drawImage(spr, Math.round(bullet.x - 2), Math.round(bullet.y - 2));
      }
    }
  }

  drawPowerup(ctx, powerup, isModern = true, time = 0) {
    if (!powerup || !powerup.active) return;
    if (isModern) {
      this.drawModernPowerup(ctx, powerup, time);
    } else {
      const spr = this.cache.get(`powerup_${powerup.type}`);
      if (spr) {
        ctx.drawImage(spr, Math.round(powerup.x), Math.round(powerup.y));
      }
    }
  }

  drawExplosion(ctx, exp, isModern = true) {
    if (isModern) {
      this.drawModernExplosion(ctx, exp);
    } else {
      if (exp.isBig) {
        const spr = this.cache.get(`big_exp_${exp.frame}`);
        if (spr) ctx.drawImage(spr, Math.round(exp.x - 16), Math.round(exp.y - 16));
      } else {
        const spr = this.cache.get(`sm_exp_${exp.frame}`);
        if (spr) ctx.drawImage(spr, Math.round(exp.x - 8), Math.round(exp.y - 8));
      }
    }
  }

  drawSpawnEffect(ctx, spawn, isModern = true, time = 0) {
    if (isModern) {
      ctx.save();
      const cx = spawn.x + 8;
      const cy = spawn.y + 8;
      const r = (spawn.frame + 1) * 2.2;

      ctx.fillStyle = '#ffeb3b';
      ctx.shadowColor = '#ffc107';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing star rays
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - r * 1.6, cy); ctx.lineTo(cx + r * 1.6, cy);
      ctx.moveTo(cx, cy - r * 1.6); ctx.lineTo(cx, cy + r * 1.6);
      ctx.stroke();
      ctx.restore();
    } else {
      const spr = this.cache.get(`spawn_${spawn.frame}`);
      if (spr) {
        ctx.drawImage(spr, Math.round(spawn.x), Math.round(spawn.y));
      }
    }
  }
}

window.spriteManager = new SpriteManager();
