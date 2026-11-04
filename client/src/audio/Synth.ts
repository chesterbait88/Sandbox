import { AUDIO, MUSIC } from '@vw/config';

/** Procedural Web Audio: noise bursts and tones. No sample files. Unlocks on the first gesture. */
export class Synth {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private noise!: AudioBuffer;
  volume: number = AUDIO.masterVolume;

  constructor() {
    const unlock = () => {
      this.ensure();
      const wasPlaying = this.musicPlaying;
      void this.ctx?.resume().then(() => {
        if (wasPlaying) {
          this.stopMusic();
          this.startMusic();
        }
      });
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new AudioContext();
    } catch {
      return null;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return this.ctx;
  }

  /** Create the context and noise buffer ahead of the first blast (stays suspended until a gesture). */
  prime(): void {
    this.ensure();
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  private gainForDistance(dist: number): number {
    return 1 / (1 + dist / AUDIO.halfDistanceM);
  }

  private lowpassForDistance(dist: number): number {
    const t = Math.min(1, dist / (AUDIO.halfDistanceM * 4));
    return AUDIO.lowpassNearHz * (1 - t) + AUDIO.lowpassFarHz * t;
  }

  /** Explosion: filtered noise burst plus a sub thump. */
  boom(power: number, dist: number): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const amp = Math.min(1, 0.25 + power / 90) * this.gainForDistance(dist);
    const dur = 0.35 + power / 120;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(this.lowpassForDistance(dist), t);
    lp.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(lp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + dur);
    const og = ctx.createGain();
    og.gain.setValueAtTime(amp * 0.9, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.8);
    osc.connect(og).connect(this.master);
    osc.start(t);
    osc.stop(t + dur);
  }

  /** Gunshot: short bright noise click, louder and longer for big guns. */
  shot(kind: 'pistol' | 'shotgun' | 'rifle' | 'rocket'): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const dur = kind === 'shotgun' ? 0.18 : kind === 'rocket' ? 0.4 : 0.09;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = kind === 'rocket' ? 'lowpass' : 'highpass';
    hp.frequency.value = kind === 'rocket' ? 900 : kind === 'shotgun' ? 600 : 1500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(kind === 'pistol' ? 0.5 : 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(hp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur);
  }

  /** Glass: bright tink. */
  tink(dist: number): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2400 + Math.random() * 1200, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25 * this.gainForDistance(dist), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /** Melee swing: noise sweep. */
  swing(hit: boolean): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(hit ? 200 : 1200, t + 0.15);
    bp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(hit ? 0.5 : 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 0.2);
  }

  /** UI / mechanical click. */
  click(pitch = 1): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 600 * pitch;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  private musicTimer: number | null = null;
  private musicGain: GainNode | null = null;
  private musicBar = 0;

  /** Menu music: a looping synth arpeggio over a bass line, scheduled one bar at a time. */
  startMusic(): void {
    const ctx = this.ensure();
    if (!ctx || this.musicTimer !== null) return;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = MUSIC.gain;
    this.musicGain.connect(this.master);
    this.musicBar = 0;
    const scheduleBar = () => {
      const c = this.ctx;
      if (!c || !this.musicGain || c.state !== 'running') return;
      const barLen = (60 / MUSIC.bpm) * 4;
      const t0 = c.currentTime + 0.05;
      const chord = MUSIC.chords[this.musicBar % MUSIC.chords.length];
      // Bass: root, pulsing on each beat.
      for (let b = 0; b < 4; b++) {
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.value = chord[0] / 2;
        const g = c.createGain();
        const t = t0 + (b * barLen) / 4;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + barLen / 4 - 0.02);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 500;
        o.connect(lp).connect(g).connect(this.musicGain);
        o.start(t);
        o.stop(t + barLen / 4);
      }
      // Arpeggio: 8 sixteenth notes through the chord.
      for (let n = 0; n < 8; n++) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = chord[n % chord.length] * (n >= 4 ? 2 : 1);
        const g = c.createGain();
        const t = t0 + (n * barLen) / 8;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + barLen / 8);
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(2600, t);
        lp.frequency.exponentialRampToValueAtTime(600, t + barLen / 8);
        o.connect(lp).connect(g).connect(this.musicGain);
        o.start(t);
        o.stop(t + barLen / 8);
      }
      this.musicBar++;
      this.musicTimer = window.setTimeout(scheduleBar, barLen * 1000 - 60);
    };
    this.musicTimer = window.setTimeout(scheduleBar, 0);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearTimeout(this.musicTimer);
    this.musicTimer = null;
    if (this.musicGain && this.ctx) {
      const g = this.musicGain;
      g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      window.setTimeout(() => g.disconnect(), 800);
    }
    this.musicGain = null;
  }

  get musicPlaying(): boolean {
    return this.musicTimer !== null;
  }

  /** Milestone stinger: rising arpeggio. */
  stinger(): void {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return;
    const t = ctx.currentTime;
    [0, 4, 7, 12].forEach((semi, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 220 * Math.pow(2, semi / 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.07);
      g.gain.linearRampToValueAtTime(0.18, t + i * 0.07 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.35);
      osc.connect(g).connect(this.master);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.4);
    });
  }
}
