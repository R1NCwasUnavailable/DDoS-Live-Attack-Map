// CRT / Phosphor Terminal Audio Engine (Section 6)
export class CRTTerminalAudio {
  private ctx: AudioContext | null = null;
  private humOsc: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private isMuted: boolean = true;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      // AudioContext unavailable
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx) {
      if (!muted) this.init();
      else return;
    }

    if (this.ctx && this.ctx.state === 'suspended' && !muted) {
      this.ctx.resume();
    }

    if (muted) {
      this.stopHum();
    } else {
      this.startHum();
    }
  }

  // 1. Cathode Ray 55Hz Transformer Hum
  private startHum() {
    if (!this.ctx || this.humOsc) return;
    try {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();

      this.humOsc.type = 'sine';
      this.humOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // 55Hz tube line hum

      this.humGain.gain.setValueAtTime(0.012, this.ctx.currentTime); // Extremely subtle

      this.humOsc.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);
      this.humOsc.start();
    } catch {
      // Audio error
    }
  }

  private stopHum() {
    if (this.humOsc) {
      try {
        this.humOsc.stop();
        this.humOsc.disconnect();
      } catch {
        // Ignored
      }
      this.humOsc = null;
      this.humGain = null;
    }
  }

  // 2. Geiger / Vector Intercept Click Tick
  playPacketTick(volumeGbps: number) {
    if (this.isMuted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // High-pass square click frequency scaled by volumetric attack density
      const baseFreq = 1400 + Math.min(2200, volumeGbps * 18);
      osc.type = 'square';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // Ignored
    }
  }

  destroy() {
    this.stopHum();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const crtAudio = new CRTTerminalAudio();

