/**
 * Tank 1990 / Battle City NES Audio Synthesizer
 * Uses Web Audio API to reproduce authentic 8-bit NES 2A03 sound chip channels:
 * - Pulse 1 & Pulse 2 (Square wave)
 * - Triangle wave (Bass & rumble)
 * - Noise channel (Explosions, hits, percussions)
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.engineOsc = null;
    this.engineGain = null;
    this.isEnginePlaying = false;
    this.noiseBuffer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this._createNoiseBuffer();
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    // NES pseudo-random noise emulation
    let shiftRegister = 1;
    for (let i = 0; i < bufferSize; i++) {
      // 15-bit shift register simulation for NES noise channel
      const bit0 = shiftRegister & 1;
      const bit1 = (shiftRegister >> 1) & 1;
      const feedback = bit0 ^ bit1;
      shiftRegister = (shiftRegister >> 1) | (feedback << 14);
      output[i] = (bit0 ? 1 : -1) * (0.3 + 0.7 * Math.random());
    }
  }

  playStageStart(onComplete) {
    if (!this.enabled) {
      if (onComplete) setTimeout(onComplete, 1800);
      return;
    }
    this.resume();
    if (!this.ctx) {
      if (onComplete) setTimeout(onComplete, 1800);
      return;
    }

    const t = this.ctx.currentTime + 0.05;
    
    // Battle City NES Stage Intro Theme
    // Melody in square wave 1 & square wave 2 harmony
    const notes = [
      // freq1, freq2, duration, startOffset
      { f1: 392.00, f2: 196.00, d: 0.12, o: 0.00 }, // G4 / G3
      { f1: 493.88, f2: 246.94, d: 0.12, o: 0.12 }, // B4 / B3
      { f1: 587.33, f2: 293.66, d: 0.12, o: 0.24 }, // D5 / D3
      { f1: 783.99, f2: 392.00, d: 0.20, o: 0.36 }, // G5 / G4
      { f1: 587.33, f2: 293.66, d: 0.12, o: 0.58 }, // D5 / D3
      { f1: 783.99, f2: 392.00, d: 0.30, o: 0.70 }, // G5 / G4

      { f1: 440.00, f2: 220.00, d: 0.12, o: 1.05 }, // A4 / A3
      { f1: 523.25, f2: 261.63, d: 0.12, o: 1.17 }, // C5 / C4
      { f1: 659.25, f2: 329.63, d: 0.12, o: 1.29 }, // E5 / E4
      { f1: 880.00, f2: 440.00, d: 0.20, o: 1.41 }, // A5 / A4
      { f1: 783.99, f2: 392.00, d: 0.12, o: 1.63 }, // G5 / G4
      { f1: 987.77, f2: 493.88, d: 0.35, o: 1.75 }, // B5 / B4
    ];

    notes.forEach(n => {
      this._playSquareTone(n.f1, t + n.o, n.d, 0.15, 'square');
      this._playSquareTone(n.f2, t + n.o, n.d, 0.10, 'triangle');
    });

    const totalDuration = 2.2;
    if (onComplete) {
      setTimeout(onComplete, totalDuration * 1000);
    }
  }

  _playSquareTone(freq, startTime, duration, volume = 0.15, waveType = 'square') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveType;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.setValueAtTime(volume, startTime + duration - 0.02);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playShot() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    // Classic fast descending chirp
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playBrickHit() {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    this.resume();

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.07);
  }

  playSteelHit() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.09);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  playSmallExplosion() {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    this.resume();

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.18);
  }

  playBigExplosion() {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    this.resume();

    const t = this.ctx.currentTime;

    // Noise layer
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(50, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.45);

    // Sub-bass thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(110, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    subGain.gain.setValueAtTime(0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    sub.start(t);
    sub.stop(t + 0.4);
  }

  playPowerupSpawn() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Authentic NES Battle City ROM Sound Sequence ($EE48):
    // 4-frame (~66.7ms) pulse wave jingle when bonus drops
    const notes = [391.12, 329.00, 391.12, 438.67, 391.12, 438.67, 492.78, 522.71];
    const frameDur = 4 / 60; // 0.0667s

    notes.forEach((freq, idx) => {
      const st = t + idx * frameDur;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.18, st);
      gain.gain.setValueAtTime(0.18, st + frameDur * 0.7);
      gain.gain.linearRampToValueAtTime(0.001, st + frameDur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + frameDur);
    });
  }

  playPowerupGet() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Authentic NES Battle City ROM Sound Sequence ($EE19):
    // 3-frame (~50ms) staccato pulse wave arpeggio:
    // C Major (G4, C5, E5, G5) -> B Major (F#4, B4, D#5, F#5) -> C Major High (C5, E5, G5, C6, E6)
    const notes = [
      391.12, 522.71, 658.00, 782.24,
      369.18, 492.78, 621.45, 735.93,
      522.71, 658.00, 782.24, 1045.43, 1316.01
    ];
    const frameDur = 3 / 60; // 0.050s per note

    notes.forEach((freq, idx) => {
      const st = t + idx * frameDur;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.20, st);
      gain.gain.setValueAtTime(0.20, st + frameDur * 0.75);
      gain.gain.linearRampToValueAtTime(0.001, st + frameDur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + frameDur);
    });
  }

  playLifeUp() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const sequence = [
      { f: 659.25, d: 0.09, o: 0.00 }, // E5
      { f: 880.00, d: 0.09, o: 0.09 }, // A5
      { f: 1046.50, d: 0.09, o: 0.18 }, // C6
      { f: 1318.51, d: 0.22, o: 0.27 }  // E6
    ];
    sequence.forEach(s => {
      this._playSquareTone(s.f, t + s.o, s.d, 0.2, 'square');
    });
  }

  playGameOver(onComplete) {
    if (!this.enabled) {
      if (onComplete) setTimeout(onComplete, 2200);
      return;
    }
    this.resume();
    if (!this.ctx) {
      if (onComplete) setTimeout(onComplete, 2200);
      return;
    }

    const t = this.ctx.currentTime + 0.05;
    // Classic mournful descending motif
    const notes = [
      { f: 587.33, d: 0.18, o: 0.00 }, // D5
      { f: 523.25, d: 0.18, o: 0.20 }, // C5
      { f: 493.88, d: 0.18, o: 0.40 }, // B4
      { f: 440.00, d: 0.24, o: 0.60 }, // A4
      { f: 392.00, d: 0.24, o: 0.85 }, // G4
      { f: 349.23, d: 0.24, o: 1.10 }, // F4
      { f: 329.63, d: 0.45, o: 1.35 }, // E4
      { f: 261.63, d: 0.60, o: 1.80 }  // C4
    ];

    notes.forEach(n => {
      this._playSquareTone(n.f, t + n.o, n.d, 0.2, 'square');
      this._playSquareTone(n.f / 2, t + n.o, n.d, 0.15, 'triangle');
    });

    if (onComplete) {
      setTimeout(onComplete, 2500);
    }
  }

  playPause() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    this._playSquareTone(880, t, 0.06, 0.15, 'square');
    this._playSquareTone(1320, t + 0.07, 0.08, 0.15, 'square');
  }

  playScoreDing() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this._playSquareTone(987.77, t, 0.04, 0.12, 'square');
  }

  updateEngine(isMoving) {
    if (!this.enabled) {
      this.stopEngine();
      return;
    }
    if (!this.ctx) return;

    if (!this.engineOsc) {
      try {
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();

        this.engineOsc.type = 'triangle';
        this.engineOsc.frequency.setValueAtTime(32, this.ctx.currentTime);
        this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
        this.isEnginePlaying = true;
      } catch (e) {
        return;
      }
    }

    const t = this.ctx.currentTime;
    if (isMoving) {
      this.engineOsc.frequency.setTargetAtTime(58, t, 0.05);
      this.engineGain.gain.setTargetAtTime(0.07, t, 0.05);
    } else {
      this.engineOsc.frequency.setTargetAtTime(28, t, 0.1);
      this.engineGain.gain.setTargetAtTime(0.025, t, 0.1);
    }
  }

  stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.05);
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopEngine();
    return this.enabled;
  }
}

window.soundSystem = new SoundSystem();
