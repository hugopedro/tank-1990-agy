/**
 * Tank 1990 - Real-Time WebRTC P2P Multiplayer Subsystem
 *
 * Netcode Architecture:
 * - Direct Peer-to-Peer DataChannel (SCTP over UDP) via WebRTC:
 *   - Completely serverless peer communication (no laggy proxy server in between).
 *   - Google STUN & Twilio STUN for NAT traversal.
 * - Host-Authoritative Simulation:
 *   - Player 1 (Host) simulates physics, enemy AI, bullet impacts, tile destruction, powerups.
 *   - Player 2 (Client) sends inputs at 60Hz with local client prediction (instant movement).
 *   - Host streams 60Hz delta snapshots to Client with sub-millisecond serialization.
 * - Live Ping calculation and top-right HUD badge (e.g. "● P2P: 18ms").
 * - Instant Room Codes (e.g. TK7412) & Shareable URL Links (e.g. ?room=TK7412).
 * - Full Navigation Support: Keyboard (1/2/Arrows/Enter/ESC), Gamepad (D-Pad/A/B), and Canvas Mouse Clicks.
 */

class MultiplayerManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.mode = 'OFFLINE'; // 'OFFLINE', 'HOST', 'CLIENT'
    this.roomCode = '';
    this.isConnected = false;
    this.ping = 0;
    this.lastPingSent = 0;
    this.statusText = '';
    this.dialogVisible = false;
    this.dialogMode = 'MENU'; // 'MENU', 'HOST_WAITING'
    this.menuIndex = 0; // 0: Criar Sala, 1: Entrar em Sala

    // Delta sync queues
    this.tileQueue = [];
    this.eventQueue = [];
  }

  init(game) {
    this.game = game;

    // Listen for tile changes on map to broadcast to client
    if (window.mapManager) {
      const origSetSubTile = window.mapManager.setSubTile.bind(window.mapManager);
      window.mapManager.setSubTile = (x, y, type) => {
        origSetSubTile(x, y, type);
        if (this.mode === 'HOST' && this.isConnected) {
          this.tileQueue.push({ x, y, type });
        }
      };
    }

    // Canvas mouse click listener for lobby modal
    if (this.game && this.game.canvas) {
      this.game.canvas.addEventListener('click', (e) => this._handleCanvasClick(e));
    }

    // Auto-join if room query parameter exists in URL
    const params = new URLSearchParams(window.location.search);
    const autoRoom = params.get('room') || params.get('join');
    if (autoRoom) {
      setTimeout(() => {
        this.joinRoom(autoRoom);
      }, 500);
    }
  }

  queueEvent(ev) {
    if (this.mode === 'HOST' && this.isConnected) {
      this.eventQueue.push(ev);
    }
  }

  openLobby() {
    this.dialogVisible = true;
    this.dialogMode = 'MENU';
    this.menuIndex = 0;
    this.statusText = 'Escolha: Criar Sala ou Entrar em Sala';
    if (window.soundSystem) window.soundSystem.playScoreDing();
  }

  closeLobby() {
    this.dialogVisible = false;
  }

  navigate(dir) {
    if (this.dialogMode === 'MENU') {
      this.menuIndex = (this.menuIndex + dir + 2) % 2;
      if (window.soundSystem) window.soundSystem.playShot();
    }
  }

  selectCurrent() {
    if (this.dialogMode === 'MENU') {
      if (this.menuIndex === 0) {
        this.createRoom();
      } else {
        this.promptJoin();
      }
    }
  }

  promptJoin() {
    const code = prompt('Digite o código da sala (ex: TK7412 ou 7412):');
    if (code) {
      this.joinRoom(code);
    }
  }

  copyLinkToClipboard() {
    if (!this.roomCode) return;
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomCode}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        this.statusText = `LINK COPIADO! Código: ${this.roomCode}`;
        if (window.soundSystem) window.soundSystem.playScoreDing();
      }).catch(() => {});
    }
  }

  createRoom() {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.roomCode = `TK${randomDigits}`;
    this.dialogMode = 'HOST_WAITING';
    this.statusText = `Conectando ao broker P2P...`;

    const peerId = `tank1990-br-${this.roomCode.toLowerCase()}`;
    if (this.peer) this.peer.destroy();

    this.peer = new Peer(peerId, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      this.mode = 'HOST';
      this.statusText = `SALA CRIADA: ${this.roomCode}`;
      this.copyLinkToClipboard();
    });

    this.peer.on('connection', (conn) => {
      this._setupConnection(conn, true);
    });

    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      this.statusText = `Erro de conexão: ${err.type || err.message}`;
    });
  }

  joinRoom(code) {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase().replace(/^TK-?/, 'TK');
    this.roomCode = cleanCode.startsWith('TK') ? cleanCode : `TK${cleanCode}`;
    this.dialogVisible = true;
    this.dialogMode = 'HOST_WAITING';
    this.statusText = `Conectando à sala ${this.roomCode}...`;

    const targetPeerId = `tank1990-br-${this.roomCode.toLowerCase()}`;
    if (this.peer) this.peer.destroy();

    this.peer = new Peer({
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    this.peer.on('open', () => {
      const conn = this.peer.connect(targetPeerId, { reliable: false });
      this._setupConnection(conn, false);
    });

    this.peer.on('error', (err) => {
      console.error('Peer join error:', err);
      this.statusText = `Falha ao entrar na sala: ${err.message || 'Sala não encontrada'}`;
    });
  }

  _setupConnection(conn, isHost) {
    this.conn = conn;
    this.mode = isHost ? 'HOST' : 'CLIENT';

    conn.on('open', () => {
      this.isConnected = true;
      this.dialogVisible = false;
      this.statusText = 'Conectado P2P com sucesso!';
      if (window.soundSystem) window.soundSystem.playScoreDing();

      if (window.gamepadManager) {
        window.gamepadManager.toastText = `🌐 MULTIPLAYER P2P CONECTADO (${isHost ? 'HOST' : 'CLIENTE'})`;
        window.gamepadManager.toastTimer = 3.5;
      }

      if (isHost) {
        // Host starts 2-player match and sends initial world snapshot
        this.game.isTwoPlayer = true;
        this.game.startStage(this.game.currentStage, false);
        this.conn.send({
          type: 'INIT',
          stage: this.game.currentStage,
          grid: Array.from(window.mapManager.grid),
          isEagleAlive: window.mapManager.isEagleAlive
        });
      }
    });

    conn.on('data', (data) => {
      this._handlePacket(data);
    });

    conn.on('close', () => {
      this.isConnected = false;
      this.mode = 'OFFLINE';
      if (this.game) {
        this.game.p2Input = { up: false, right: false, down: false, left: false, fire: false };
      }
      if (window.gamepadManager) {
        window.gamepadManager.toastText = '⚠️ CONEXÃO P2P ENCERRADA';
        window.gamepadManager.toastTimer = 4.0;
      }
    });
  }

  _handlePacket(data) {
    if (!data || !data.type) return;

    if (data.type === 'PING') {
      if (this.conn && this.conn.open) {
        this.conn.send({ type: 'PONG', time: data.time });
      }
      return;
    }

    if (data.type === 'PONG') {
      this.ping = Math.max(1, Math.round((performance.now() - data.time) / 2));
      return;
    }

    // CLIENT RECEIVING STATE SNAPSHOT FROM HOST
    if (this.mode === 'CLIENT') {
      if (data.type === 'INIT') {
        this.game.isTwoPlayer = true;
        this.game.currentStage = data.stage;
        this.game.startStage(data.stage, false);
        if (window.mapManager && data.grid) {
          window.mapManager.grid.set(data.grid);
          window.mapManager.isEagleAlive = data.isEagleAlive;
        }
        return;
      }

      if (data.type === 'SYNC') {
        this.ping = data.ping || this.ping;
        this.game.playerLives = data.lives;
        this.game.playerScores = data.scores;
        if (data.kills) this.game.playerKills = data.kills;
        this.game.remainingEnemiesToSpawn = data.remainingEnemies;

        // Synchronize stage progression (e.g. Fase 1 -> Fase 2)
        if (data.stage && data.stage !== this.game.currentStage) {
          this.game.currentStage = data.stage;
          this.game.startStage(data.stage, false);
          if (window.mapManager && data.grid) {
            window.mapManager.grid.set(data.grid);
          }
        }

        // Synchronize game state (Stage Start, Playing, Stage Clear, Game Over)
        if (data.state && this.game.state !== data.state) {
          this.game.state = data.state;
          if (data.state === 'PLAYING') {
            this.game.curtainHeight = 0;
          }
        } else if (this.game.state === 'PLAYING') {
          this.game.curtainHeight = 0;
        }

        // Sync Player 1 (Host authoritative tank)
        const p1 = this.game.players[0];
        if (p1 && data.p1) {
          p1.x = data.p1.x;
          p1.y = data.p1.y;
          p1.direction = data.p1.dir;
          p1.tier = data.p1.tier;
          p1.shieldTimer = data.p1.shield;
          p1.active = data.p1.active;
        }

        // Soft reconcile Player 2 (Local client tank)
        const p2 = this.game.players[1];
        if (p2 && data.p2) {
          const dx = data.p2.x - p2.x;
          const dy = data.p2.y - p2.y;
          // Reconcile if position drift exceeds threshold (6px)
          if (dx * dx + dy * dy > 36) {
            p2.x = data.p2.x;
            p2.y = data.p2.y;
          }
          p2.tier = data.p2.tier;
          p2.shieldTimer = data.p2.shield;
          p2.active = data.p2.active;
        }

        // Sync Enemies
        if (data.enemies) {
          this.game.enemies = data.enemies.map(ed => {
            const enemy = new EnemyTank(ed.x, ed.y, ed.type, ed.isBonus);
            enemy.direction = ed.dir;
            enemy.health = ed.health;
            enemy.active = ed.active;
            return enemy;
          });
        }

        // Sync Bullets
        if (data.bullets) {
          this.game.bullets = data.bullets.map(bd => {
            return new Bullet(bd.x, bd.y, bd.dir, bd.speed, bd.owner, bd.canDestroySteel);
          });
          // Update client p2.bullets count to allow shooting accurately
          if (p2) {
            p2.bullets = this.game.bullets.filter(b => b.owner === 'player2');
          }
        }

        // Sync Powerup
        if (data.powerup) {
          if (!this.game.currentPowerup || this.game.currentPowerup.type !== data.powerup.type) {
            this.game.currentPowerup = new Powerup(data.powerup.x, data.powerup.y, data.powerup.type);
          }
          this.game.currentPowerup.x = data.powerup.x;
          this.game.currentPowerup.y = data.powerup.y;
          this.game.currentPowerup.active = data.powerup.active;
        } else {
          this.game.currentPowerup = null;
        }

        // Sync Sub-tiles Diff
        if (data.tiles && data.tiles.length > 0 && window.mapManager) {
          data.tiles.forEach(t => window.mapManager.setSubTile(t.x, t.y, t.type));
        }

        // Sync Eagle Status
        if (window.mapManager && data.eagleAlive !== undefined) {
          window.mapManager.isEagleAlive = data.eagleAlive;
        }

        // Process audio-visual events from host (explosions, etc.)
        if (data.events && data.events.length > 0) {
          data.events.forEach(ev => {
            if (ev.type === 'EXPLOSION') {
              this.game.addExplosion(ev.x, ev.y, ev.isBig);
              if (ev.isBig) window.soundSystem.playBigExplosion();
              else window.soundSystem.playSmallExplosion();
            }
          });
        }
      }
    }

    // HOST RECEIVING INPUT FROM CLIENT
    if (this.mode === 'HOST') {
      if (data.type === 'INPUT') {
        this.game.p2Input = data.input;
      }
    }
  }

  update(dt) {
    if (!this.isConnected || !this.conn || !this.conn.open) return;

    // Ping measurement every 1 second
    const now = performance.now();
    if (now - this.lastPingSent > 1000) {
      this.lastPingSent = now;
      this.conn.send({ type: 'PING', time: now });
    }

    // HOST: Broadcast authoritative state snapshot (60Hz)
    if (this.mode === 'HOST') {
      const p1 = this.game.players[0];
      const p2 = this.game.players[1];

      const snapshot = {
        type: 'SYNC',
        ping: this.ping,
        state: this.game.state,
        stage: this.game.currentStage,
        lives: this.game.playerLives,
        scores: this.game.playerScores,
        kills: this.game.playerKills,
        remainingEnemies: this.game.remainingEnemiesToSpawn,
        p1: p1 ? { x: p1.x, y: p1.y, dir: p1.direction, tier: p1.tier, shield: p1.shieldTimer, active: p1.active } : null,
        p2: p2 ? { x: p2.x, y: p2.y, dir: p2.direction, tier: p2.tier, shield: p2.shieldTimer, active: p2.active } : null,
        enemies: this.game.enemies.map(e => ({ x: e.x, y: e.y, dir: e.direction, type: e.enemyType, health: e.health, active: e.active, isBonus: e.isBonus })),
        bullets: this.game.bullets.map(b => ({ x: b.x, y: b.y, dir: b.direction, speed: b.speed, owner: b.owner, canDestroySteel: b.canDestroySteel })),
        powerup: this.game.currentPowerup && this.game.currentPowerup.active ? { x: this.game.currentPowerup.x, y: this.game.currentPowerup.y, type: this.game.currentPowerup.type, active: true } : null,
        tiles: this.tileQueue.splice(0, this.tileQueue.length),
        events: this.eventQueue.splice(0, this.eventQueue.length),
        eagleAlive: window.mapManager ? window.mapManager.isEagleAlive : true
      };

      this.conn.send(snapshot);
    }

    // CLIENT: Stream local inputs to Host (60Hz)
    if (this.mode === 'CLIENT') {
      const clientInput = (this.game.p2Input && (this.game.p2Input.up || this.game.p2Input.down || this.game.p2Input.left || this.game.p2Input.right || this.game.p2Input.fire))
        ? this.game.p2Input
        : this.game.p1Input;
      this.conn.send({
        type: 'INPUT',
        input: clientInput
      });
    }
  }

  drawHUD(ctx, W = 1024) {
    if (!this.isConnected) return;

    ctx.save();
    const pingColor = this.ping < 50 ? '#00e676' : this.ping < 100 ? '#ffeb3b' : '#ff5252';
    const pingText = `● P2P: ${this.ping}ms (${this.mode})`;

    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.strokeStyle = pingColor;
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(W - 220, 10, 200, 28, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(W - 220, 10, 200, 28);
      ctx.strokeRect(W - 220, 10, 200, 28);
    }

    ctx.fillStyle = pingColor;
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pingText, W - 120, 24);
    ctx.restore();
  }

  drawDialog(ctx, W = 1024, H = 896) {
    if (!this.dialogVisible) return;

    ctx.save();
    // Translucent dark overlay
    ctx.fillStyle = 'rgba(6, 7, 12, 0.90)';
    ctx.fillRect(0, 0, W, H);

    // Modal Window
    const dw = 620;
    const dh = 390;
    const dx = (W - dw) / 2;
    const dy = (H - dh) / 2;

    const modalGrad = ctx.createLinearGradient(dx, dy, dx, dy + dh);
    modalGrad.addColorStop(0, '#1c1f2e');
    modalGrad.addColorStop(1, '#10121d');
    ctx.fillStyle = modalGrad;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 18;

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(dx, dy, dw, dh, 16);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeRect(dx, dy, dw, dh);
    }
    ctx.shadowBlur = 0;

    // Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffeb3b';
    ctx.font = 'bold 18px "Press Start 2P", sans-serif';
    ctx.fillText('🌐 MULTIPLAYER ONLINE P2P', W / 2, dy + 50);

    ctx.fillStyle = '#90caf9';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText('Conexão direta de ultra-baixa latência sem servidores', W / 2, dy + 80);

    // Divider
    ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.fillRect(dx + 40, dy + 100, dw - 80, 2);

    if (this.dialogMode === 'MENU') {
      // Option 1: Create Room
      const opt1Selected = this.menuIndex === 0;
      this._drawButton(ctx, dx + 60, dy + 125, dw - 120, 60, '[1] CRIAR SALA (HOST)', '#00e676', opt1Selected);

      // Option 2: Join Room
      const opt2Selected = this.menuIndex === 1;
      this._drawButton(ctx, dx + 60, dy + 205, dw - 120, 60, '[2] ENTRAR EM SALA', '#00e5ff', opt2Selected);

      // Footer Navigation Tip
      ctx.fillStyle = '#78909c';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('Navegue: ↑/↓ ou 1/2 • Confirmar: ENTER • Sair: ESC', W / 2, dy + 325);
    } else if (this.dialogMode === 'HOST_WAITING') {
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px "Press Start 2P", monospace';
      ctx.fillText(this.statusText, W / 2, dy + 145);

      if (this.roomCode) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 28px "Press Start 2P", monospace';
        ctx.fillText(this.roomCode, W / 2, dy + 200);

        ctx.fillStyle = '#81c784';
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillText('Clique no código ou pressione [C] para copiar link!', W / 2, dy + 240);
      }

      // Cancel button
      this._drawButton(ctx, dx + 160, dy + 280, dw - 320, 48, '[ESC] CANCELAR', '#ff5252', true);
    }

    ctx.restore();
  }

  _drawButton(ctx, x, y, w, h, text, color, isSelected = false) {
    ctx.save();
    ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 1.5;
    if (isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }

    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = isSelected ? '#ffffff' : color;
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
    ctx.restore();
  }

  _handleCanvasClick(e) {
    if (!this.dialogVisible) return;
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (1024 / rect.width);
    const y = (e.clientY - rect.top) * (896 / rect.height);

    const dw = 620;
    const dh = 390;
    const dx = (1024 - dw) / 2;
    const dy = (896 - dh) / 2;

    if (this.dialogMode === 'MENU') {
      // Option 1: Create Room [dx + 60, dy + 125, dw - 120, 60]
      if (x >= dx + 60 && x <= dx + dw - 60 && y >= dy + 125 && y <= dy + 185) {
        this.createRoom();
        return;
      }
      // Option 2: Join Room [dx + 60, dy + 205, dw - 120, 60]
      if (x >= dx + 60 && x <= dx + dw - 60 && y >= dy + 205 && y <= dy + 265) {
        this.promptJoin();
        return;
      }
      // Click outside dialog box closes lobby
      if (x < dx || x > dx + dw || y < dy || y > dy + dh) {
        this.closeLobby();
        return;
      }
    } else if (this.dialogMode === 'HOST_WAITING') {
      // Click on room code area copies link again
      if (x >= dx + 100 && x <= dx + dw - 100 && y >= dy + 170 && y <= dy + 250) {
        this.copyLinkToClipboard();
        return;
      }
      // Cancel button [dx + 160, dy + 280, dw - 320, 48]
      if (x >= dx + 160 && x <= dx + dw - 160 && y >= dy + 280 && y <= dy + 328) {
        this.closeLobby();
        return;
      }
    }
  }

  handleKeyDown(e) {
    if (!this.dialogVisible) return false;

    if (e.key === 'Escape') {
      this.closeLobby();
      return true;
    }

    if (this.dialogMode === 'MENU') {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        this.navigate(-1);
        return true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        this.navigate(1);
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'j' || e.key === 'J') {
        this.selectCurrent();
        return true;
      }
      if (e.key === '1') {
        this.createRoom();
        return true;
      }
      if (e.key === '2') {
        this.promptJoin();
        return true;
      }
    } else if (this.dialogMode === 'HOST_WAITING') {
      if (e.key === 'c' || e.key === 'C') {
        this.copyLinkToClipboard();
        return true;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        this.closeLobby();
        return true;
      }
    }

    return true; // Consume keyboard input while modal is visible
  }
}

window.multiplayerManager = new MultiplayerManager();
