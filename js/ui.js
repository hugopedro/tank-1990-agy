/**
 * Tank 1990 UI & HUD System - Hybrid Classic & Modern 2D Edition
 * Manages Title screen, Stage Intermission curtains, Status Sidebar,
 * Score Tally screen, Game Over sequence, and CRT styling.
 */

class UIManager {
  constructor() {
    this.titleMenuIndex = 0; // 0 = 1 Player, 1 = 2 Players, 2 = Online, 3 = Stage Select
    this.intermissionTimer = 0;
    this.curtainPos = 0;
    this.isCurtainClosing = false;
    this.isCurtainOpening = false;
    this.gameOverY = 224;
    this.tallyStep = 0;
    this.tallyTimer = 0;
    this.tallyCounts = [0, 0, 0, 0];
    this.targetCounts = [0, 0, 0, 0];

    // Commemorative Couple Portrait Intro & ASCII System
    this.coupleImg = new Image();
    this.coupleImg.src = 'couple.png';
    this.coupleImgLoaded = false;
    this.coupleImg.onload = () => {
      this.coupleImgLoaded = true;
    };

    this.titleIntroTime = 0;
    this.titleIntroDuration = 2.4; // seconds to rise from bottom to center
    this.titleIntroDingPlayed = false;
  }

  resetTitleIntro() {
    this.titleIntroTime = 0;
    this.titleIntroDingPlayed = false;
  }

  skipTitleIntro() {
    this.titleIntroTime = this.titleIntroDuration;
  }

  updateTitle(dt) {
    if (this.titleIntroTime < this.titleIntroDuration) {
      this.titleIntroTime += dt;
      if (this.titleIntroTime >= this.titleIntroDuration && !this.titleIntroDingPlayed) {
        this.titleIntroDingPlayed = true;
        if (window.soundSystem) window.soundSystem.playScoreDing();
      }
    }
  }

  drawSidebar(ctx, remainingEnemies, p1Lives, p2Lives, stageNum, isTwoPlayer = false, isModern = true, scale = 4) {
    const startX = 224 * scale;
    const startY = 8 * scale;
    const width = 32 * scale;
    const height = 224 * scale;

    ctx.save();

    if (isModern) {
      // Modern Glassmorphism panel with metallic rim
      const sideGrad = ctx.createLinearGradient(startX, 0, startX + width, height);
      sideGrad.addColorStop(0, '#1c1f2e');
      sideGrad.addColorStop(0.5, '#161824');
      sideGrad.addColorStop(1, '#0f1019');
      ctx.fillStyle = sideGrad;
      ctx.fillRect(startX, 0, width, height);

      // Glowing neon separator line
      ctx.fillStyle = '#00d2ff';
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(startX, 0, 3, height);
      ctx.shadowBlur = 0;

      // Section Header: "ENEMIES"
      ctx.font = `bold ${8 * (scale / 4 * 1.2)}px "Press Start 2P", sans-serif`;
      ctx.fillStyle = '#7a849e';
      ctx.fillText('ENEMY', startX + 16, startY + 14);

      // Enemy Counter Badges
      const icon = window.spriteManager.cache.get('ui_enemy_icon');
      for (let i = 0; i < 20; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const ix = startX + 24 + col * 40;
        const iy = startY + 36 + row * 34;

        if (i < remainingEnemies) {
          // Active enemy icon with subtle glow
          ctx.fillStyle = 'rgba(255, 64, 129, 0.2)';
          ctx.beginPath();
          ctx.arc(ix + 12, iy + 12, 14, 0, Math.PI * 2);
          ctx.fill();

          if (icon) {
            ctx.drawImage(icon, 0, 0, 8, 8, ix, iy, 24, 24);
          }
        } else {
          // Defeated / dimmed slot
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.beginPath();
          ctx.arc(ix + 12, iy + 12, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Player 1 Section
      const p1Y = startY + 410;
      ctx.fillStyle = 'rgba(255, 193, 7, 0.15)';
      ctx.fillRect(startX + 10, p1Y - 10, width - 20, 68);
      ctx.strokeStyle = '#ffc107';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(startX + 10, p1Y - 10, width - 20, 68);

      ctx.fillStyle = '#ffc107';
      ctx.font = `bold ${10 * (scale / 4 * 1.2)}px "Press Start 2P", sans-serif`;
      ctx.fillText('P1', startX + 20, p1Y + 16);

      const miniTank = window.spriteManager.cache.get('p1_t0_d0_f0');
      if (miniTank) {
        ctx.drawImage(miniTank, 0, 0, 16, 16, startX + 54, p1Y + 2, 28, 28);
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`×${Math.max(0, p1Lives)}`, startX + 88, p1Y + 24);

      // Player 2 Section
      if (isTwoPlayer) {
        const p2Y = p1Y + 80;
        ctx.fillStyle = 'rgba(0, 230, 118, 0.15)';
        ctx.fillRect(startX + 10, p2Y - 10, width - 20, 68);
        ctx.strokeStyle = '#00e676';
        ctx.strokeRect(startX + 10, p2Y - 10, width - 20, 68);

        ctx.fillStyle = '#00e676';
        ctx.fillText('P2', startX + 20, p2Y + 16);

        const miniP2 = window.spriteManager.cache.get('p2_t0_d0_f0');
        if (miniP2) {
          ctx.drawImage(miniP2, 0, 0, 16, 16, startX + 54, p2Y + 2, 28, 28);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`×${Math.max(0, p2Lives)}`, startX + 88, p2Y + 24);
      }

      // Stage Flag at bottom
      const flagY = height - 120;
      const flag = window.spriteManager.cache.get('ui_flag');
      if (flag) {
        ctx.drawImage(flag, 0, 0, 16, 16, startX + 24, flagY, 40, 40);
      }
      ctx.fillStyle = '#ffb300';
      ctx.font = `bold ${16 * (scale / 4 * 1.2)}px "Press Start 2P", sans-serif`;
      ctx.fillText(`F ${stageNum}`, startX + 72, flagY + 28);

    } else {
      // Classic 8-bit NES Sidebar
      ctx.fillStyle = PALETTE.greyBorder;
      ctx.fillRect(startX, 0, width, height);

      const icon = window.spriteManager.cache.get('ui_enemy_icon');
      if (icon) {
        for (let i = 0; i < 20; i++) {
          if (i < remainingEnemies) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            ctx.drawImage(icon, 0, 0, 8, 8, startX + (6 + col * 10) * scale, (8 + row * 9) * scale, 8 * scale, 8 * scale);
          }
        }
      }

      // P1 Status
      const p1Y = 120 * scale;
      ctx.fillStyle = PALETTE.black;
      this._drawText(ctx, 'IP', startX + 6 * scale, p1Y, '#000000', 8 * scale);

      const miniTank = window.spriteManager.cache.get('p1_t0_d0_f0');
      if (miniTank) {
        ctx.drawImage(miniTank, 0, 0, 16, 16, startX + 4 * scale, p1Y + 9 * scale, 8 * scale, 8 * scale);
      }
      this._drawText(ctx, `${Math.max(0, p1Lives)}`, startX + 16 * scale, p1Y + 9 * scale, '#000000', 8 * scale);

      // P2 Status
      if (isTwoPlayer) {
        const p2Y = 144 * scale;
        this._drawText(ctx, 'IIP', startX + 4 * scale, p2Y, '#000000', 8 * scale);
        const miniP2 = window.spriteManager.cache.get('p2_t0_d0_f0');
        if (miniP2) {
          ctx.drawImage(miniP2, 0, 0, 16, 16, startX + 4 * scale, p2Y + 9 * scale, 8 * scale, 8 * scale);
        }
        this._drawText(ctx, `${Math.max(0, p2Lives)}`, startX + 16 * scale, p2Y + 9 * scale, '#000000', 8 * scale);
      }

      // Stage Flag
      const flagY = 180 * scale;
      const flag = window.spriteManager.cache.get('ui_flag');
      if (flag) {
        ctx.drawImage(flag, 0, 0, 16, 16, startX + 8 * scale, flagY, 16 * scale, 16 * scale);
      }
      this._drawText(ctx, `${stageNum}`, startX + 10 * scale, flagY + 18 * scale, '#000000', 8 * scale);
    }

    ctx.restore();
  }

  drawTitleScreen(ctx, time, isModern = true, scale = 4) {
    const W = 256 * scale; // 1024
    const H = 224 * scale; // 896

    // Retro Rising Intro Animation calculation:
    // The portrait begins below the screen (startY = 950) and rises up smoothly to the center of the menu (targetY = 190)
    const startY = H + 60;
    const targetY = isModern ? 190 : 180;
    const p = Math.min(1.0, this.titleIntroTime / this.titleIntroDuration);
    const ease = 1 - Math.pow(1 - p, 3); // retro smooth cubic ease-out
    const currentY = startY + (targetY - startY) * ease;
    const isRising = (p < 1.0);

    ctx.save();
    if (isModern) {
      // Modern Vibrant Title Screen Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#161927');
      bgGrad.addColorStop(0.5, '#10121d');
      bgGrad.addColorStop(1, '#090a10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle cyber grid
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // High Score Bar
      const hiScore = localStorage.getItem('tank1990_hiscore') || '20000';
      ctx.font = `bold ${10 * scale}px "Press Start 2P", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HI-SCORE', 140, 42);
      ctx.fillStyle = '#ffc107';
      ctx.fillText(`${hiScore}`, 580, 42);

      // Modern 3D Logo Plaque
      const bx = 180;
      const by = 55;
      const bw = 664;
      const bh = 115;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx + 8, by + 8, bw, bh, 14);
      else ctx.fillRect(bx + 8, by + 8, bw, bh);
      ctx.fill();

      // Outer gold frame
      const plaqueGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      plaqueGrad.addColorStop(0, '#ffeb3b');
      plaqueGrad.addColorStop(0.5, '#f57f17');
      plaqueGrad.addColorStop(1, '#ff6f00');
      ctx.fillStyle = plaqueGrad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 14);
      else ctx.fillRect(bx, by, bw, bh);
      ctx.fill();

      // Inner Red Felt
      const innerGrad = ctx.createLinearGradient(bx + 10, by + 10, bx + bw - 10, by + bh - 10);
      innerGrad.addColorStop(0, '#d50000');
      innerGrad.addColorStop(1, '#880e4f');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx + 10, by + 10, bw - 20, bh - 20, 10);
      else ctx.fillRect(bx + 10, by + 10, bw - 20, bh - 20);
      ctx.fill();

      // Bold 3D Title Text
      ctx.font = 'bold 44px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText('TANK 1990', W / 2 + 3, by + 68 + 3);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffc107';
      ctx.shadowBlur = 14;
      ctx.fillText('TANK 1990', W / 2, by + 68);
      ctx.shadowBlur = 0;

      // Subtitle
      ctx.font = 'bold 12px "Press Start 2P", sans-serif';
      ctx.fillStyle = '#ffe082';
      ctx.fillText('★ SUPER BATTLE CITY HD ★', W / 2, by + 98);

      // --- CENTER COMMEMORATIVE COUPLE PORTRAIT (Rising effect) ---
      const portW = 210;
      const portH = 210;
      const portX = (W - portW) / 2;
      const portY = currentY;

      // Thruster / Motion Trail while rising
      if (isRising) {
        ctx.save();
        const trailGrad = ctx.createLinearGradient(0, portY + portH, 0, H);
        trailGrad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
        trailGrad.addColorStop(0.3, 'rgba(255, 193, 7, 0.2)');
        trailGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = trailGrad;
        ctx.fillRect(portX + 10, portY + portH, portW - 20, H - (portY + portH));
        ctx.restore();
      }

      ctx.save();
      // Ambient shadow & glow
      ctx.shadowColor = 'rgba(0, 229, 255, 0.45)';
      ctx.shadowBlur = isRising ? 22 : 14;
      ctx.fillStyle = '#11131d';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(portX - 4, portY - 4, portW + 8, portH + 8, 16);
      else ctx.fillRect(portX - 4, portY - 4, portW + 8, portH + 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Metallic Cyber / Gold Border
      const borderGrad = ctx.createLinearGradient(portX, portY, portX + portW, portY + portH);
      borderGrad.addColorStop(0, '#00e5ff');
      borderGrad.addColorStop(0.45, '#ffd700');
      borderGrad.addColorStop(1, '#ff9100');
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(portX - 2, portY - 2, portW + 4, portH + 4, 14);
        ctx.stroke();
      } else {
        ctx.strokeRect(portX - 2, portY - 2, portW + 4, portH + 4);
      }

      // Draw Photo clipped to rounded box
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(portX, portY, portW, portH, 12);
      else ctx.rect(portX, portY, portW, portH);
      ctx.clip();

      if (this.coupleImgLoaded) {
        ctx.drawImage(this.coupleImg, portX, portY, portW, portH);
      } else {
        ctx.fillStyle = '#1e2230';
        ctx.fillRect(portX, portY, portW, portH);
        ctx.fillStyle = '#ffc107';
        ctx.font = 'bold 12px "Press Start 2P", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TANK 1990', portX + portW / 2, portY + portH / 2);
      }
      ctx.restore();

      // Ribbon / Badge underneath
      const badgeW = 210;
      const badgeH = 20;
      const badgeX = (W - badgeW) / 2;
      const badgeY = portY + portH + 6;
      ctx.fillStyle = 'rgba(12, 14, 22, 0.95)';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fillStyle = '#ffeb3b';
      ctx.font = 'bold 8.5px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★ TANK COMMANDERS ★', W / 2, badgeY + badgeH / 2 + 1);
      ctx.restore();

      // Menu Options with Glowing Selection
      const options = ['1 JOGADOR (LOCAL)', '2 JOGADORES (LOCAL)', '🌐 MULTIPLAYER ONLINE', 'SELECIONAR FASE'];
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      options.forEach((opt, idx) => {
        const y = 475 + idx * 56;
        const isSelected = (idx === this.titleMenuIndex);

        if (isSelected) {
          // Selection pill highlight
          ctx.fillStyle = 'rgba(255, 193, 7, 0.18)';
          ctx.strokeStyle = '#ffc107';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(W / 2 - 240, y - 22, 480, 44, 10);
          else ctx.fillRect(W / 2 - 240, y - 22, 480, 44);
          ctx.fill();
          ctx.stroke();

          // Modern 3D Tank Cursor
          const miniTank = window.spriteManager.cache.get('p1_t0_d1_f0');
          if (miniTank) {
            ctx.drawImage(miniTank, 0, 0, 16, 16, W / 2 - 220, y - 16, 32, 32);
          }

          ctx.fillStyle = '#ffeb3b';
          ctx.font = 'bold 15px "Press Start 2P", sans-serif';
          ctx.fillText(opt, W / 2 - 165, y + 6);
        } else {
          ctx.fillStyle = '#78909c';
          ctx.font = 'bold 14px "Press Start 2P", sans-serif';
          ctx.fillText(opt, W / 2 - 165, y + 6);
        }
      });

      // Press Enter Flash Prompt
      if (Math.floor((time || 0) * 2) % 2 === 0) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Press Start 2P", sans-serif';
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('PRESSIONE ENTER OU ESPAÇO', W / 2, 725);
      }

      // Keyboard shortcuts tip
      ctx.textAlign = 'center';
      ctx.font = 'bold 9.5px "Press Start 2P", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[G] ESTILO  •  [M] SOM  •  [F] TELA CHEIA  •  [R] RESET', W / 2, 775);

    } else {
      // Classic NES Title Screen (Scaled 4x)
      ctx.fillStyle = PALETTE.greyBorder;
      ctx.fillRect(0, 0, W, H);

      const hiScore = localStorage.getItem('tank1990_hiscore') || '20000';
      this._drawText(ctx, 'HI-SCORE', 160, 26, '#ffffff', 8 * scale);
      this._drawText(ctx, `${hiScore}`, 660, 26, '#fc9838', 8 * scale);

      // Classic Title Box (Centered top placement)
      const boxW = 540;
      const boxH = 80;
      const boxX = (W - boxW) / 2;
      const boxY = 64;

      ctx.fillStyle = '#000000';
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#b53120';
      ctx.fillRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TANK 1990', W / 2, boxY + boxH / 2);

      ctx.font = 'bold 9.5px "Press Start 2P", monospace';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('© 1980 1985 1990 NAMCO LTD.', W / 2, boxY + boxH + 18);

      // --- CENTER COMMEMORATIVE ASCII ART (Rising effect) ---
      const asciiW = 340;
      const asciiH = 240;
      const asciiX = (W - asciiW) / 2;
      const asciiY = currentY;

      // Terminal Box Background
      ctx.save();
      ctx.fillStyle = '#050a06';
      ctx.fillRect(asciiX, asciiY, asciiW, asciiH);

      // Terminal Phosphor Green Border
      ctx.strokeStyle = '#00e676';
      ctx.lineWidth = 2;
      ctx.strokeRect(asciiX, asciiY, asciiW, asciiH);

      // Terminal Title Header
      ctx.fillStyle = 'rgba(0, 230, 118, 0.18)';
      ctx.fillRect(asciiX, asciiY, asciiW, 18);
      ctx.fillStyle = '#00e676';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cursorChar = Math.floor((time || 0) * 3) % 2 === 0 ? '_' : ' ';
      ctx.fillText(`[ TANK CREW 1990 ]${cursorChar}`, W / 2, asciiY + 10);

      // Render ASCII Art Lines and Colors with CRT Luminance Boost
      const asciiData = window.COUPLE_ASCII_DATA;
      if (asciiData && asciiData.lines) {
        ctx.font = 'bold 7.5px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const padX = 8;
        const padY = 22;
        const availW = asciiW - padX * 2;
        const availH = asciiH - padY - 4;
        const cellW = availW / asciiData.cols;
        const cellH = availH / asciiData.rows;

        for (let r = 0; r < asciiData.rows; r++) {
          const line = asciiData.lines[r];
          const rowColors = asciiData.colors ? asciiData.colors[r] : null;
          const py = asciiY + padY + r * cellH;

          for (let c = 0; c < asciiData.cols; c++) {
            const ch = line[c];
            if (ch && ch !== ' ') {
              const hex = rowColors ? rowColors[c] : '#00e676';
              if (hex.length === 7) {
                const cr = parseInt(hex.slice(1, 3), 16);
                const cg = parseInt(hex.slice(3, 5), 16);
                const cb = parseInt(hex.slice(5, 7), 16);
                const br = Math.min(255, Math.floor(cr * 1.5 + 40));
                const bg = Math.min(255, Math.floor(cg * 1.5 + 40));
                const bb = Math.min(255, Math.floor(cb * 1.5 + 40));
                ctx.fillStyle = `rgb(${br},${bg},${bb})`;
              } else {
                ctx.fillStyle = hex;
              }
              ctx.fillText(ch, asciiX + padX + c * cellW, py);
            }
          }
        }

        // Retro CRT scanline effect over ASCII box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        for (let sl = 0; sl < asciiH; sl += 3) {
          ctx.fillRect(asciiX, asciiY + sl, asciiW, 1);
        }
      }
      ctx.restore();

      // Menu Options
      const options = ['1 PLAYER', '2 PLAYERS', 'ONLINE CO-OP', 'STAGE SELECT'];
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      options.forEach((opt, idx) => {
        const y = 475 + idx * 56;
        this._drawText(ctx, opt, 82 * scale, y + 14, '#ffffff', 8 * scale);
      });

      const cursorY = 475 + this.titleMenuIndex * 56;
      const tankCursor = window.spriteManager.cache.get('p1_t0_d1_f0');
      if (tankCursor) {
        ctx.drawImage(tankCursor, 0, 0, 16, 16, 60 * scale, cursorY, 16 * scale, 16 * scale);
      }

      if (Math.floor((time || 0) * 2) % 2 === 0) {
        this._drawText(ctx, 'PRESS ENTER OR SPACE', 40 * scale, 725, '#fc9838', 8 * scale);
      }
      this._drawText(ctx, 'G:STYLE  M:SOUND  F:FULL', 42 * scale, 775, '#505050', 6 * scale);
    }

    ctx.restore();
  }

  drawStageIntermission(ctx, stageNum, curtainPos, isModern = true, scale = 4) {
    const W = 256 * scale;
    const H = 224 * scale;
    const curH = curtainPos * scale;

    ctx.save();
    if (isModern) {
      // Modern sleek sliding door
      const doorGrad = ctx.createLinearGradient(0, 0, W, H);
      doorGrad.addColorStop(0, '#1a1d2e');
      doorGrad.addColorStop(1, '#0a0b12');
      ctx.fillStyle = doorGrad;

      // Top door
      ctx.fillRect(0, 0, W, curH);
      // Bottom door
      ctx.fillRect(0, H - curH, W, curH);

      // Glowing edges
      ctx.fillStyle = '#00d2ff';
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(0, curH - 3, W, 3);
      ctx.fillRect(0, H - curH, W, 3);
      ctx.shadowBlur = 0;

      if (curtainPos >= 110) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffc107';
        ctx.font = 'bold 36px "Press Start 2P", sans-serif';
        ctx.shadowColor = '#ff6f00';
        ctx.shadowBlur = 12;
        ctx.fillText(`FASE  ${stageNum}`, W / 2, H / 2 + 10);
      }
    } else {
      ctx.fillStyle = PALETTE.greyBorder;
      ctx.fillRect(0, 0, W, curH);
      ctx.fillRect(0, H - curH, W, curH);

      if (curtainPos >= 110) {
        ctx.fillStyle = PALETTE.black;
        this._drawText(ctx, `STAGE  ${stageNum}`, 90 * scale, 108 * scale, '#000000', 12 * scale);
      }
    }
    ctx.restore();
  }

  drawGameOver(ctx, y, isModern = true, scale = 4) {
    const W = 256 * scale;
    ctx.save();
    ctx.textAlign = 'center';

    if (isModern) {
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#d50000';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 44px "Press Start 2P", sans-serif';
      ctx.fillText('GAME OVER', W / 2, y * scale);
    } else {
      ctx.fillStyle = '#e40058';
      ctx.shadowColor = '#000000';
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      ctx.font = `bold ${16 * scale}px "Press Start 2P", monospace`;
      ctx.fillText('GAME OVER', W / 2, y * scale);
    }
    ctx.restore();
  }

  drawScoreTally(ctx, stageNum, p1Score, kills, onFinished, isModern = true, scale = 4) {
    const W = 256 * scale;
    const H = 224 * scale;

    ctx.save();
    if (isModern) {
      // Modern High-Tech Plaque
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#191c2c');
      bg.addColorStop(1, '#0e101a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffc107';
      ctx.font = 'bold 28px "Press Start 2P", sans-serif';
      ctx.fillText(`FASE  ${stageNum}  CONCLUÍDA!`, W / 2, 80);

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 18px "Press Start 2P", sans-serif';
      ctx.fillText(`PONTOS DO JOGADOR 1: ${p1Score}`, W / 2, 140);

      const enemyTypes = [
        { spr: 'enemy_basic_d0_f0', pts: 100, count: kills.basic, name: 'BÁSICO' },
        { spr: 'enemy_fast_d0_f0', pts: 200, count: kills.fast, name: 'SCOUT' },
        { spr: 'enemy_power_d0_f0', pts: 300, count: kills.power, name: 'POWER' },
        { spr: 'enemy_armor0_d0_f0', pts: 400, count: kills.armor, name: 'BLINDADO' }
      ];

      let totalKills = 0;
      enemyTypes.forEach((t, idx) => {
        const y = 220 + idx * 95;
        const count = this.tallyCounts[idx];
        const pts = count * t.pts;
        totalKills += count;

        // Card backing
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        if (ctx.roundRect) ctx.roundRect(140, y - 25, 744, 75, 12);
        else ctx.fillRect(140, y - 25, 744, 75);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Press Start 2P", sans-serif';
        ctx.fillText(`${pts} PTS`, 170, y + 16);

        // Tank icon
        const tankSpr = window.spriteManager.cache.get(t.spr);
        if (tankSpr) ctx.drawImage(tankSpr, 0, 0, 16, 16, 500, y - 16, 50, 50);

        ctx.fillText(`◄  ${count}`, 630, y + 16);
      });

      // Total Line
      ctx.fillStyle = '#ffc107';
      ctx.font = 'bold 22px "Press Start 2P", sans-serif';
      ctx.fillText(`TOTAL ABATIDOS: ${totalKills}`, 170, 680);

    } else {
      ctx.fillStyle = PALETTE.greyBorder;
      ctx.fillRect(0, 0, W, H);

      const hiScore = localStorage.getItem('tank1990_hiscore') || '20000';
      this._drawText(ctx, 'HI-SCORE', 32 * scale, 16 * scale, '#ffffff', 8 * scale);
      this._drawText(ctx, `${hiScore}`, 144 * scale, 16 * scale, '#fc9838', 8 * scale);

      this._drawText(ctx, `STAGE  ${stageNum}`, 96 * scale, 36 * scale, '#ffffff', 8 * scale);
      this._drawText(ctx, 'I-PLAYER', 32 * scale, 60 * scale, '#e40058', 8 * scale);
      this._drawText(ctx, `${p1Score}`, 40 * scale, 74 * scale, '#fc9838', 8 * scale);

      const enemyTypes = [
        { spr: 'enemy_basic_d0_f0', pts: 100, count: kills.basic },
        { spr: 'enemy_fast_d0_f0', pts: 200, count: kills.fast },
        { spr: 'enemy_power_d0_f0', pts: 300, count: kills.power },
        { spr: 'enemy_armor0_d0_f0', pts: 400, count: kills.armor }
      ];

      let totalKills = 0;
      enemyTypes.forEach((t, idx) => {
        const y = (96 + idx * 24) * scale;
        const count = this.tallyCounts[idx];
        const pts = count * t.pts;
        totalKills += count;

        this._drawText(ctx, `${pts}`, 40 * scale, y + 4 * scale, '#ffffff', 8 * scale);
        this._drawText(ctx, 'PTS', 88 * scale, y + 4 * scale, '#ffffff', 8 * scale);

        const tankSpr = window.spriteManager.cache.get(t.spr);
        if (tankSpr) ctx.drawImage(tankSpr, 0, 0, 16, 16, 126 * scale, y - 2 * scale, 16 * scale, 16 * scale);

        this._drawText(ctx, `◄ ${count}`, 154 * scale, y + 4 * scale, '#ffffff', 8 * scale);
      });

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(80 * scale, 192 * scale, 100 * scale, 2 * scale);

      this._drawText(ctx, 'TOTAL', 64 * scale, 202 * scale, '#ffffff', 8 * scale);
      this._drawText(ctx, `${totalKills}`, 154 * scale, 202 * scale, '#ffffff', 8 * scale);
    }
    ctx.restore();
  }

  _drawText(ctx, text, x, y, color = '#000000', size = 8) {
    ctx.save();
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

window.uiManager = new UIManager();
