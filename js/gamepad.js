/**
 * Tank 1990 Gamepad / Joystick Controller Subsystem
 * Full support for Xbox 360, Xbox One, Series X, and standard XInput controllers.
 * Supports:
 * - D-Pad & Left Analog Stick (with deadzone filtering)
 * - Face buttons (A, B, X, Y), Bumpers (LB, RB), Triggers (LT, RT)
 * - Start (Pause / Menu Confirm) & Back/Select (Option / Reset)
 * - Multi-controller 2-Player Local Co-op (Gamepad 0 = P1, Gamepad 1 = P2)
 * - Dual-Rumble Haptic Actuator feedback on shots, hits, and explosions
 * - On-screen connection toast notification
 */

class GamepadManager {
  constructor() {
    this.deadzone = 0.28;
    this.prevButtons = [{}, {}];
    this.previouslyConnected = new Set();
    this.toastText = '';
    this.toastTimer = 0;

    const onConnect = (pad) => {
      if (!pad) return;
      this.previouslyConnected.add(pad.index);
      const cleanName = (pad.id || 'Controle').replace(/\(.*\)/g, '').trim() || 'Controle USB/Bluetooth';
      this.toastText = `🎮 CONTROLE ${pad.index + 1} CONECTADO: ${cleanName}`;
      this.toastTimer = 3.5;
      if (window.soundSystem) window.soundSystem.playScoreDing();
    };

    window.addEventListener('gamepadconnected', (e) => {
      onConnect(e.gamepad || (e.detail && e.detail.gamepad));
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      const pad = e.gamepad || (e.detail && e.detail.gamepad);
      const idx = pad ? pad.index : 0;
      this.previouslyConnected.delete(idx);
      this.toastText = `⚠️ CONTROLE ${idx + 1} DESCONECTADO`;
      this.toastTimer = 3.0;
    });
  }

  update(dt, game) {
    if (this.toastTimer > 0) {
      this.toastTimer = Math.max(0, this.toastTimer - dt);
    }

    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Check newly connected/disconnected gamepads during poll
    for (let idx = 0; idx < Math.min(2, gamepads.length); idx++) {
      const gp = gamepads[idx];
      if (gp && gp.connected && !this.previouslyConnected.has(idx)) {
        this.previouslyConnected.add(idx);
        const cleanName = (gp.id || 'Controle').replace(/\(.*\)/g, '').trim() || 'Controle USB/Bluetooth';
        this.toastText = `🎮 CONTROLE ${idx + 1} CONECTADO: ${cleanName}`;
        this.toastTimer = 3.5;
        if (window.soundSystem) window.soundSystem.playScoreDing();
      } else if ((!gp || !gp.connected) && this.previouslyConnected.has(idx)) {
        this.previouslyConnected.delete(idx);
        this.toastText = `⚠️ CONTROLE ${idx + 1} DESCONECTADO`;
        this.toastTimer = 3.0;
      }
    }

    for (let idx = 0; idx < Math.min(2, gamepads.length); idx++) {
      const gp = gamepads[idx];
      if (!gp || !gp.connected) continue;

      const btn = (bIdx) => {
        if (!gp.buttons || !gp.buttons[bIdx]) return false;
        const b = gp.buttons[bIdx];
        return typeof b === 'object' ? (b.pressed || b.value > 0.35) : b > 0.35;
      };

      // Directions: D-Pad (buttons 12-15) OR Left Analog Stick (axes 0, 1)
      const dpadUp = btn(12);
      const dpadDown = btn(13);
      const dpadLeft = btn(14);
      const dpadRight = btn(15);

      const ax = (gp.axes && gp.axes[0] !== undefined) ? gp.axes[0] : 0;
      const ay = (gp.axes && gp.axes[1] !== undefined) ? gp.axes[1] : 0;

      const stickUp = ay < -this.deadzone;
      const stickDown = ay > this.deadzone;
      const stickLeft = ax < -this.deadzone;
      const stickRight = ax > this.deadzone;

      const up = dpadUp || stickUp;
      const down = dpadDown || stickDown;
      const left = dpadLeft || stickLeft;
      const right = dpadRight || stickRight;

      // Fire: A (0), B (1), X (2), Y (3), RB (5), RT (7)
      const fire = btn(0) || btn(1) || btn(2) || btn(5) || btn(7);

      // Edge triggers (just pressed)
      const prev = this.prevButtons[idx];
      const startJustPressed = btn(9) && !prev[9];
      const backJustPressed = btn(8) && !prev[8];
      const yJustPressed = btn(3) && !prev[3];
      const lbJustPressed = btn(4) && !prev[4];
      const aJustPressed = (btn(0) || btn(9)) && !prev['confirm'];
      const upJustPressed = up && !prev['up'];
      const downJustPressed = down && !prev['down'];

      // Multiplayer Dialog Navigation
      if (window.multiplayerManager && window.multiplayerManager.dialogVisible) {
        if (upJustPressed) {
          window.multiplayerManager.navigate(-1);
        } else if (downJustPressed) {
          window.multiplayerManager.navigate(1);
        } else if (aJustPressed) {
          window.multiplayerManager.selectCurrent();
        } else if (backJustPressed || btn(1)) {
          window.multiplayerManager.closeLobby();
        }
        return;
      }

      // Title Screen Navigation
      if (game.state === 'TITLE') {
        if (upJustPressed) {
          window.uiManager.titleMenuIndex = (window.uiManager.titleMenuIndex + 3) % 4;
          window.soundSystem.playShot();
        } else if (downJustPressed) {
          window.uiManager.titleMenuIndex = (window.uiManager.titleMenuIndex + 1) % 4;
          window.soundSystem.playShot();
        } else if (aJustPressed) {
          game._selectTitleMenuOption();
        } else if (backJustPressed) {
          game.isTwoPlayer = !game.isTwoPlayer;
          window.soundSystem.playScoreDing();
        } else if (yJustPressed || lbJustPressed) {
          game.toggleGraphicsMode();
          window.soundSystem.playScoreDing();
        }
      } else {
        // In-game Pause & Controls
        if (startJustPressed) {
          game.togglePause();
        }
        if (yJustPressed || lbJustPressed) {
          game.toggleGraphicsMode();
          window.soundSystem.playScoreDing();
        }
        if (backJustPressed && game.state === 'PLAYING') {
          game.state = 'TITLE';
          window.soundSystem.playPause();
        }

        // Apply joystick inputs to player
        if (idx === 0) {
          if (up) game.p1Input.up = true;
          if (down) game.p1Input.down = true;
          if (left) game.p1Input.left = true;
          if (right) game.p1Input.right = true;
          if (fire) game.p1Input.fire = true;
        } else if (idx === 1) {
          // Controller 2 controls Player 2
          if (up) game.p2Input.up = true;
          if (down) game.p2Input.down = true;
          if (left) game.p2Input.left = true;
          if (right) game.p2Input.right = true;
          if (fire) game.p2Input.fire = true;
        }
      }

      // Record states for next frame's edge-detection
      this.prevButtons[idx] = {
        9: btn(9),
        8: btn(8),
        3: btn(3),
        4: btn(4),
        confirm: btn(0) || btn(9),
        up: up,
        down: down
      };
    }
  }

  rumble(playerIndex = 0, weakMagnitude = 0.4, strongMagnitude = 0.2, durationMs = 120) {
    if (!navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    const gp = gamepads[playerIndex];
    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
      try {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: Math.min(1.0, weakMagnitude),
          strongMagnitude: Math.min(1.0, strongMagnitude)
        }).catch(() => {});
      } catch (err) {
        // Ignore unsupported browser quirks
      }
    }
  }

  drawToast(ctx, W = 1024) {
    if (this.toastTimer <= 0 || !this.toastText) return;

    const alpha = Math.min(1.0, this.toastTimer / 0.5);
    ctx.save();
    ctx.globalAlpha = alpha;

    // Toast Capsule
    const boxW = 560;
    const boxH = 34;
    const boxX = (W - boxW) / 2;
    const boxY = 848;

    const toastGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
    toastGrad.addColorStop(0, 'rgba(28, 32, 48, 0.95)');
    toastGrad.addColorStop(1, 'rgba(16, 18, 28, 0.95)');
    ctx.fillStyle = toastGrad;

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 17);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
    }
    ctx.shadowBlur = 0;

    // Glowing Controller Icon / LED
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(boxX + 22, boxY + boxH / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Toast Message
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.toastText, boxX + 38, boxY + boxH / 2 + 1);

    ctx.restore();
  }
}

window.gamepadManager = new GamepadManager();
