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

    // Independent input state for player 1 and player 2 controllers
    this.padInputs = [
      { up: false, right: false, down: false, left: false, fire: false },
      { up: false, right: false, down: false, left: false, fire: false }
    ];

    // Reference to assigned gamepads for rumble and mapping
    this.assignedGamepads = [null, null];

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

  getP1Input() {
    return this.padInputs[0];
  }

  getP2Input() {
    return this.padInputs[1];
  }

  update(dt, game) {
    if (this.toastTimer > 0) {
      this.toastTimer = Math.max(0, this.toastTimer - dt);
    }

    // Reset pad inputs each frame to avoid sticky inputs
    this.padInputs[0] = { up: false, right: false, down: false, left: false, fire: false };
    this.padInputs[1] = { up: false, right: false, down: false, left: false, fire: false };
    this.assignedGamepads = [null, null];

    if (!navigator.getGamepads) return;
    const rawGamepads = navigator.getGamepads();
    if (!rawGamepads) return;

    // Check newly connected/disconnected gamepads during poll
    for (let i = 0; i < rawGamepads.length; i++) {
      const gp = rawGamepads[i];
      if (gp && gp.connected && !this.previouslyConnected.has(gp.index)) {
        this.previouslyConnected.add(gp.index);
        const cleanName = (gp.id || 'Controle').replace(/\(.*\)/g, '').trim() || 'Controle USB/Bluetooth';
        this.toastText = `🎮 CONTROLE ${gp.index + 1} CONECTADO: ${cleanName}`;
        this.toastTimer = 3.5;
        if (window.soundSystem) window.soundSystem.playScoreDing();
      } else if ((!gp || !gp.connected) && this.previouslyConnected.has(i)) {
        this.previouslyConnected.delete(i);
        this.toastText = `⚠️ CONTROLE ${i + 1} DESCONECTADO`;
        this.toastTimer = 3.0;
      }
    }

    // Filter connected controllers
    const connectedPads = Array.from(rawGamepads).filter(gp => gp && gp.connected);
    if (connectedPads.length === 0) return;

    // Controller mapping:
    // In Single-Player: first active controller controls Player 1.
    // In Two-Player: first controls Player 1, second controls Player 2.
    const playerPads = [];
    if (!game.isTwoPlayer) {
      playerPads.push({ playerIdx: 0, gp: connectedPads[0] });
    } else {
      playerPads.push({ playerIdx: 0, gp: connectedPads[0] });
      if (connectedPads.length > 1) {
        playerPads.push({ playerIdx: 1, gp: connectedPads[1] });
      }
    }

    for (const { playerIdx, gp } of playerPads) {
      this.assignedGamepads[playerIdx] = gp;

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

      // Dominant-Axis Resolution for Analog Stick to prevent diagonal fighting / UP bias
      let stickUp = false;
      let stickDown = false;
      let stickLeft = false;
      let stickRight = false;
      const stickMagnitude = Math.hypot(ax, ay);

      if (stickMagnitude > this.deadzone) {
        if (Math.abs(ax) > Math.abs(ay)) {
          // Horizontal dominant
          if (ax > 0) stickRight = true;
          else stickLeft = true;
        } else {
          // Vertical dominant
          if (ay > 0) stickDown = true;
          else stickUp = true;
        }
      }

      let up = dpadUp || stickUp;
      let down = dpadDown || stickDown;
      let left = dpadLeft || stickLeft;
      let right = dpadRight || stickRight;

      // Cancel out impossible opposing directions
      if (up && down) { up = false; down = false; }
      if (left && right) { left = false; right = false; }

      // Fire: A (0), B (1), X (2), RB (5), RT (7)
      const fire = btn(0) || btn(1) || btn(2) || btn(5) || btn(7);

      // Store in padInputs for this frame
      this.padInputs[playerIdx] = {
        up: up,
        down: down,
        left: left,
        right: right,
        fire: fire
      };

      // Edge triggers (just pressed)
      const prev = this.prevButtons[playerIdx] || {};
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
      }
      // Title Screen Navigation
      else if (game.state === 'TITLE') {
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
        if (backJustPressed && (game.state === 'PLAYING' || game.state === 'PAUSED')) {
          game.state = 'TITLE';
          window.soundSystem.playPause();
        }
        if (game.state === 'GAME_OVER' && (startJustPressed || aJustPressed)) {
          game.state = 'TITLE';
          window.soundSystem.playPause();
        }
      }

      // Record states for next frame's edge-detection (always updated)
      this.prevButtons[playerIdx] = {
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
    const gp = this.assignedGamepads[playerIndex] || (navigator.getGamepads() && navigator.getGamepads()[playerIndex]);
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
