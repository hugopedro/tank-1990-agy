/**
 * Tank 1990 UI & HUD System - Hybrid Classic & Modern 2D Edition
 * Manages Title screen, Stage Intermission curtains, Status Sidebar,
 * Score Tally screen, Game Over sequence, and CRT styling.
 */

class UIManager {
  constructor() {
    this.titleMenuIndex = 0; // 0 = 1 Player, 1 = 2 Players, 2 = Stage Select
    this.intermissionTimer = 0;
    this.curtainPos = 0;
    this.isCurtainClosing = false;
    this.isCurtainOpening = false;
    this.gameOverY = 224;
    this.tallyStep = 0;
    this.tallyTimer = 0;
    this.tallyCounts = [0, 0, 0, 0];
    this.targetCounts = [0, 0, 0, 0];
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
    const W = 256 * scale;
    const H = 224 * scale;

    ctx.save();
    if (isModern) {
      // Modern Vibrant Mario-style Title Screen
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#1a1d2e');
      bgGrad.addColorStop(0.6, '#131522');
      bgGrad.addColorStop(1, '#0a0b12');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // High Score Bar
      const hiScore = localStorage.getItem('tank1990_hiscore') || '20000';
      ctx.font = `bold ${11 * scale}px "Press Start 2P", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('HI-SCORE', 120, 60);
      ctx.fillStyle = '#ffc107';
      ctx.fillText(`${hiScore}`, 580, 60);

      // Modern 3D Logo Plaque
      const bx = 140;
      const by = 140;
      const bw = 744;
      const bh = 220;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx + 12, by + 12, bw, bh, 20);
      else ctx.fillRect(bx + 12, by + 12, bw, bh);
      ctx.fill();

      // Outer gold frame
      const plaqueGrad = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      plaqueGrad.addColorStop(0, '#ffeb3b');
      plaqueGrad.addColorStop(0.5, '#f57f17');
      plaqueGrad.addColorStop(1, '#ff6f00');
      ctx.fillStyle = plaqueGrad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 20);
      else ctx.fillRect(bx, by, bw, bh);
      ctx.fill();

      // Inner Red Felt
      const innerGrad = ctx.createLinearGradient(bx + 16, by + 16, bx + bw - 16, by + bh - 16);
      innerGrad.addColorStop(0, '#d50000');
      innerGrad.addColorStop(1, '#880e4f');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx + 16, by + 16, bw - 32, bh - 32, 14);
      else ctx.fillRect(bx + 16, by + 16, bw - 32, bh - 32);
      ctx.fill();

      // Bold 3D Title Text
      ctx.font = '900 64px "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText('TANK 1990', W / 2 + 4, by + 128 + 4);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffc107';
      ctx.shadowBlur = 16;
      ctx.fillText('TANK 1990', W / 2, by + 128);
      ctx.shadowBlur = 0;

      // Subtitle
      ctx.font = 'bold 16px "Press Start 2P", sans-serif';
      ctx.fillStyle = '#ffe082';
      ctx.fillText('★ SUPER BATTLE CITY HD ★', W / 2, by + 172);

      // Credits
      ctx.font = 'bold 12px "Press Start 2P", sans-serif';
      ctx.fillStyle = '#90a4ae';
      ctx.fillText('© 1980 1985 1990 NAMCO LTD.', W / 2, 430);

      // Menu Options with Glowing Selection
      const options = ['1 JOGADOR (LOCAL)', '2 JOGADORES (LOCAL)', '🌐 MULTIPLAYER ONLINE', 'SELECIONAR FASE'];
      ctx.textAlign = 'left';

      options.forEach((opt, idx) => {
        const y = 490 + idx * 64;
        const isSelected = (idx === this.titleMenuIndex);

        if (isSelected) {
          // Selection pill highlight
          ctx.fillStyle = 'rgba(255, 193, 7, 0.18)';
          ctx.strokeStyle = '#ffc107';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(W / 2 - 240, y - 24, 480, 48, 12);
          else ctx.fillRect(W / 2 - 240, y - 24, 480, 48);
          ctx.fill();
          ctx.stroke();

          // Modern 3D Tank Cursor
          const miniTank = window.spriteManager.cache.get('p1_t0_d1_f0');
          if (miniTank) {
            ctx.drawImage(miniTank, 0, 0, 16, 16, W / 2 - 220, y - 18, 36, 36);
          }

          ctx.fillStyle = '#ffeb3b';
          ctx.font = 'bold 16px "Press Start 2P", sans-serif';
          ctx.fillText(opt, W / 2 - 165, y + 8);
        } else {
          ctx.fillStyle = '#78909c';
          ctx.font = 'bold 15px "Press Start 2P", sans-serif';
          ctx.fillText(opt, W / 2 - 165, y + 8);
        }
      });

      // Press Enter Flash Prompt
      if (Math.floor((time || 0) * 2) % 2 === 0) {
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px "Press Start 2P", sans-serif';
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('PRESSIONE ENTER OU ESPAÇO', W / 2, 780);
      }

      // Keyboard shortcuts tip
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px "Press Start 2P", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillText('[G] ESTILO  •  [M] SOM  •  [F] TELA CHEIA  •  [R] RESET', W / 2, 840);

    } else {
      // Classic NES Title Screen (Scaled 4x)
      ctx.fillStyle = PALETTE.greyBorder;
      ctx.fillRect(0, 0, W, H);

      const hiScore = localStorage.getItem('tank1990_hiscore') || '20000';
      this._drawText(ctx, 'HI-SCORE', 32 * scale, 16 * scale, '#ffffff', 8 * scale);
      this._drawText(ctx, `${hiScore}`, 144 * scale, 16 * scale, '#fc9838', 8 * scale);

      ctx.fillStyle = '#000000';
      ctx.fillRect(36 * scale, 42 * scale, 184 * scale, 52 * scale);
      ctx.fillStyle = '#b53120';
      ctx.fillRect(38 * scale, 44 * scale, 180 * scale, 48 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${22 * (scale / 4 * 1.5)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('TANK 1990', W / 2, 76 * scale);

      ctx.textAlign = 'left';
      this._drawText(ctx, '© 1980 1985 1990', 56 * scale, 106 * scale, '#000000', 8 * scale);
      this._drawText(ctx, 'NAMCO LTD.', 84 * scale, 118 * scale, '#000000', 8 * scale);

      const options = ['1 PLAYER', '2 PLAYERS', 'ONLINE CO-OP', 'STAGE SELECT'];
      options.forEach((opt, idx) => {
        const y = (136 + idx * 16) * scale;
        this._drawText(ctx, opt, 82 * scale, y, '#ffffff', 8 * scale);
      });

      const cursorY = (134 + this.titleMenuIndex * 16) * scale;
      const tankCursor = window.spriteManager.cache.get('p1_t0_d1_f0');
      if (tankCursor) {
        ctx.drawImage(tankCursor, 0, 0, 16, 16, 60 * scale, cursorY, 16 * scale, 16 * scale);
      }

      if (Math.floor((time || 0) * 2) % 2 === 0) {
        this._drawText(ctx, 'PRESS ENTER OR SPACE', 40 * scale, 204 * scale, '#fc9838', 8 * scale);
      }
      this._drawText(ctx, 'G:STYLE  M:SOUND  F:FULL', 32 * scale, 216 * scale, '#505050', 6 * scale);
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
