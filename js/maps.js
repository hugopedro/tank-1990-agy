/**
 * Tank 1990 / Battle City NES Map System
 * Grid: 26 x 26 sub-tiles of 8x8 pixels (208 x 208 px playfield)
 * 13 x 13 large blocks of 16x16 pixels
 * Tile IDs:
 * 0: Empty
 * 1: Brick
 * 2: Steel
 * 3: Trees
 * 4: Water
 * 5: Ice
 * 9: Eagle
 */

class MapManager {
  constructor() {
    this.width = 26;
    this.height = 26;
    this.tileSize = 8; // 8x8 sub-tiles
    this.grid = new Uint8Array(this.width * this.height);
    this.isEagleAlive = true;
    this.shovelTimer = 0;
    this.shovelActive = false;
    this.shovelFlashing = false;
    this.eaglePos = { x: 12 * 8, y: 24 * 8 }; // Base at (12,24)-(13,25)

    // Base fortress cell indices in 26x26 grid
    this.baseFortressCells = [
      { x: 11, y: 23 }, { x: 12, y: 23 }, { x: 13, y: 23 }, { x: 14, y: 23 },
      { x: 11, y: 24 }, { x: 14, y: 24 },
      { x: 11, y: 25 }, { x: 14, y: 25 }
    ];

    this.stages = this._getStandardStages();
    this.currentStage = 1;
  }

  loadStage(stageNum) {
    this.currentStage = stageNum;
    this.isEagleAlive = true;
    this.shovelTimer = 0;
    this.shovelActive = false;
    this.grid.fill(0);

    const stageIdx = (stageNum - 1) % this.stages.length;
    const mapData = this.stages[stageIdx];

    // Load from 13x13 large blocks representation (each expands to 2x2 sub-tiles)
    for (let by = 0; by < 13; by++) {
      for (let bx = 0; bx < 13; bx++) {
        const tileType = mapData[by * 13 + bx];
        if (tileType > 0) {
          const sx = bx * 2;
          const sy = by * 2;
          this.setSubTile(sx, sy, tileType);
          this.setSubTile(sx + 1, sy, tileType);
          this.setSubTile(sx, sy + 1, tileType);
          this.setSubTile(sx + 1, sy + 1, tileType);
        }
      }
    }

    // Always place Eagle and brick fortress
    this._setupBase();
  }

  _setupBase() {
    // Eagle: 2x2 sub-tiles (16x16 px)
    this.setSubTile(12, 24, 9);
    this.setSubTile(13, 24, 9);
    this.setSubTile(12, 25, 9);
    this.setSubTile(13, 25, 9);

    // Initial Brick fortress around base
    this.baseFortressCells.forEach(pos => {
      this.setSubTile(pos.x, pos.y, 1);
    });

    // Clear player and enemy spawn zones
    // Enemy spawns: (0,0), (12,0), (24,0)
    this._clearZone(0, 0, 4, 4);
    this._clearZone(11, 0, 4, 4);
    this._clearZone(22, 0, 4, 4);
    // Player 1 spawn: (8, 24)
    this._clearZone(8, 24, 3, 2);
    // Player 2 spawn: (16, 24)
    this._clearZone(15, 24, 3, 2);
  }

  _clearZone(x, y, w, h) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.setSubTile(x + dx, y + dy, 0);
      }
    }
  }

  getSubTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 2; // Border behaves like steel
    return this.grid[y * this.width + x];
  }

  setSubTile(x, y, type) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.grid[y * this.width + x] = type;
    }
  }

  activateShovel() {
    this.shovelActive = true;
    this.shovelTimer = 20.0; // 20 seconds steel protection
    this._setFortressType(2); // Steel
  }

  _setFortressType(type) {
    this.baseFortressCells.forEach(pos => {
      this.setSubTile(pos.x, pos.y, type);
    });
  }

  update(dt) {
    if (this.shovelActive) {
      this.shovelTimer -= dt;
      if (this.shovelTimer <= 0) {
        this.shovelActive = false;
        this.shovelFlashing = false;
        this._setFortressType(1); // Revert to brick
      } else if (this.shovelTimer <= 4.0) {
        // Flash between steel and brick every 0.25s
        const flash = Math.floor(this.shovelTimer * 4) % 2 === 0;
        this._setFortressType(flash ? 2 : 1);
      }
    }
  }

  destroyEagle() {
    this.isEagleAlive = false;
    // Turn base cells into dead eagle marker
    this.setSubTile(12, 24, 9);
    this.setSubTile(13, 24, 9);
    this.setSubTile(12, 25, 9);
    this.setSubTile(13, 25, 9);
  }

  draw(ctx, layer = 'bottom', isModern = true, time = 0) {
    // layer: 'bottom' (ground, brick, steel, water, ice, eagle)
    // layer: 'top' (trees only, which overlay tanks and bullets!)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.getSubTile(x, y);
        if (tile === 0) continue;

        const px = x * this.tileSize;
        const py = y * this.tileSize;

        if (layer === 'top') {
          // Only draw trees on top layer
          if (tile === 3) {
            // Only draw top-left of 2x2 tree blocks or 8x8 clips
            if (x % 2 === 0 && y % 2 === 0) {
              window.spriteManager.drawTile(ctx, 3, px, py, isModern, time);
            }
          }
        } else {
          // Bottom layer
          if (tile === 1 || tile === 2) {
            window.spriteManager.drawTile(ctx, tile, px, py, isModern, time);
          } else if (tile === 4) {
            // Water (16x16)
            if (x % 2 === 0 && y % 2 === 0) {
              window.spriteManager.drawTile(ctx, 4, px, py, isModern, time);
            }
          } else if (tile === 5) {
            // Ice (16x16)
            if (x % 2 === 0 && y % 2 === 0) {
              window.spriteManager.drawTile(ctx, 5, px, py, isModern, time);
            }
          }
        }
      }
    }

    // Eagle is drawn on bottom layer
    if (layer === 'bottom') {
      window.spriteManager.drawEagle(ctx, this.eaglePos.x, this.eaglePos.y, this.isEagleAlive, isModern, time);
    }
  }

  _getStandardStages() {
    // 13x13 block maps: 0=Empty, 1=Brick, 2=Steel, 3=Trees, 4=Water, 5=Ice
    // Classic Battle City Stage 1
    const s1 = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
      0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0,
      0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0,
      1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 1,
      2, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 2,
      0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0,
      0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0,
      0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0,
      0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0
    ];

    // Stage 2: Trees & Steel intro
    const s2 = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 3, 3, 0, 1, 1, 0, 1, 1, 0, 3, 3, 0,
      0, 3, 3, 0, 1, 2, 0, 2, 1, 0, 3, 3, 0,
      0, 0, 0, 0, 1, 2, 0, 2, 1, 0, 0, 0, 0,
      1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
      0, 2, 0, 0, 3, 3, 3, 3, 3, 0, 0, 2, 0,
      0, 2, 0, 1, 3, 2, 2, 2, 3, 1, 0, 2, 0,
      0, 0, 0, 1, 3, 3, 3, 3, 3, 1, 0, 0, 0,
      1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1,
      0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0,
      0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0,
      0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    // Stage 3: Water crossings & Bridges
    const s3 = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 0, 4, 4, 4, 1, 4, 4, 4, 0, 1, 1,
      1, 1, 0, 4, 4, 4, 1, 4, 4, 4, 0, 1, 1,
      0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0,
      1, 2, 1, 0, 1, 0, 2, 0, 1, 0, 1, 2, 1,
      1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1,
      4, 4, 4, 4, 0, 1, 1, 1, 0, 4, 4, 4, 4,
      0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0,
      1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1,
      1, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1,
      0, 0, 0, 2, 0, 1, 0, 1, 0, 2, 0, 0, 0,
      0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    // Stage 4: Ice & Maze
    const s4 = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 5, 5, 1, 1, 0, 1, 0, 1, 1, 5, 5, 0,
      0, 5, 5, 1, 1, 0, 2, 0, 1, 1, 5, 5, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 5, 5, 3, 3, 3, 3, 3, 5, 5, 1, 1,
      2, 1, 5, 5, 3, 2, 0, 2, 3, 5, 5, 1, 2,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 4, 4, 0, 1, 1, 1, 0, 4, 4, 1, 1,
      1, 1, 4, 4, 0, 1, 2, 1, 0, 4, 4, 1, 1,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 2, 0, 1, 0, 1, 0, 2, 1, 1, 0,
      0, 1, 1, 2, 0, 0, 0, 0, 0, 2, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    // Stage 5: Fortress
    const s5 = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      2, 1, 0, 1, 1, 0, 2, 0, 1, 1, 0, 1, 2,
      2, 1, 0, 1, 1, 0, 2, 0, 1, 1, 0, 1, 2,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 0, 2, 2, 1, 0, 1, 2, 2, 0, 1, 1,
      0, 0, 0, 2, 2, 1, 0, 1, 2, 2, 0, 0, 0,
      3, 3, 0, 0, 0, 0, 2, 0, 0, 0, 0, 3, 3,
      3, 3, 0, 1, 1, 0, 0, 0, 1, 1, 0, 3, 3,
      0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0,
      1, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2, 1,
      1, 2, 0, 1, 1, 1, 0, 1, 1, 1, 0, 2, 1,
      0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ];

    return [s1, s2, s3, s4, s5];
  }
}

window.mapManager = new MapManager();
