/* ---------------------------------------------------------------------------
 * busAudio — a tiny Web Audio groove engine for /quyoubus.
 *
 * Everything is synthesised at runtime (no audio files at all): a funk/disco
 * kit (kick / snare / hat), a filtered saw bass, and chord stabs, driven by a
 * 16-step lookahead scheduler. Each station gets its own tempo, key and chord
 * progression, so the music changes as the bus rolls on.
 *
 * The scheduler also reports every step back to the UI so the 3D cabin can
 * dance on the beat and the rhythm mini-game can score taps against the grid.
 * ------------------------------------------------------------------------- */

export type StepCb = (step: number, time: number, bar: number) => void;

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

interface StationMusic { bpm: number; base: number; roots: number[]; quality: number[] }
/** four grooves — A-minor funk, G disco, B-minor drive, F-major finale */
export const STATION_MUSIC: StationMusic[] = [
  { bpm: 102, base: 45, roots: [0, 0, 5, 7], quality: [0, 3, 7, 10] },
  { bpm: 112, base: 43, roots: [0, 3, 5, 3], quality: [0, 4, 7, 11] },
  { bpm: 120, base: 47, roots: [0, -2, 3, 5], quality: [0, 3, 7, 10] },
  { bpm: 98, base: 41, roots: [0, 5, 3, 7], quality: [0, 4, 7, 9] },
];

export class BusAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private timer: number | null = null;
  private step = 0;
  private bar = 0;
  private nextTime = 0;
  private originTime = 0;
  private music: StationMusic = STATION_MUSIC[0];

  playing = false;
  muted = false;
  onStep: StepCb | null = null;

  /** must be called from a user gesture (button click) */
  async start() {
    if (this.playing) return;
    if (!this.ctx) {
      const AC: typeof AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      // one shared noise buffer for the drums
      const len = Math.floor(this.ctx.sampleRate * 0.4);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.playing = true;
    this.step = 0; this.bar = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.originTime = this.nextTime;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop() {
    this.playing = false;
    if (this.timer !== null) { window.clearInterval(this.timer); this.timer = null; }
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  /** switch groove when the bus reaches a new station */
  setStation(i: number) {
    const next = STATION_MUSIC[i % STATION_MUSIC.length];
    if (next === this.music) return;
    this.music = next;
    if (this.ctx) this.originTime = this.nextTime; // re-anchor the beat grid
  }

  get secondsPerBeat() { return 60 / this.music.bpm; }

  /** current audio-clock time (0 when the engine has never started) */
  now() { return this.ctx ? this.ctx.currentTime : 0; }

  /** signed offset (seconds) from the nearest quarter-note, or null if idle */
  tapOffset(): number | null {
    if (!this.ctx || !this.playing) return null;
    const spb = this.secondsPerBeat;
    let phase = (this.ctx.currentTime - this.originTime) % spb;
    if (phase < 0) phase += spb;
    return phase > spb / 2 ? phase - spb : phase;
  }

  dispose() { this.stop(); if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; } }

  /* ------------------------- scheduling ------------------------- */
  private schedule() {
    const ctx = this.ctx; if (!ctx || !this.playing) return;
    const sixteenth = this.secondsPerBeat / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime);
      this.onStep?.(this.step, this.nextTime, this.bar);
      this.step += 1;
      if (this.step >= 16) { this.step = 0; this.bar += 1; }
      this.nextTime += sixteenth;
    }
  }

  private playStep(s: number, t: number) {
    const m = this.music;
    const root = m.base + m.roots[this.bar % m.roots.length];
    // drums — funk pattern
    if (s === 0 || s === 6 || s === 8 || s === 14) this.kick(t, s === 0 ? 1 : 0.75);
    if (s === 4 || s === 12) this.snare(t);
    if (s % 2 === 0) this.hat(t, s % 4 === 0 ? 0.16 : 0.09);
    if (s === 7 || s === 15) this.hat(t, 0.12);
    // bass — syncopated
    if (s === 0) this.bass(t, root, 0.2);
    if (s === 3) this.bass(t, root + 12, 0.1);
    if (s === 6) this.bass(t, root + 7, 0.14);
    if (s === 8) this.bass(t, root, 0.16);
    if (s === 11) this.bass(t, root + 10, 0.1);
    if (s === 14) this.bass(t, root + 12, 0.12);
    // chord stabs on the off-beats
    if (s === 2 || s === 10) this.stab(t, m.quality.map((q) => root + 24 + q));
    if (s === 7) this.stab(t, m.quality.map((q) => root + 24 + q), 0.06);
  }

  /* ------------------------- instruments ------------------------- */
  private kick(t: number, vel = 1) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.13);
    g.gain.setValueAtTime(0.9 * vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(this.master!); o.start(t); o.stop(t + 0.22);
  }
  private snare(t: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.42, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    src.connect(bp); bp.connect(g); g.connect(this.master!); src.start(t); src.stop(t + 0.2);
  }
  private hat(t: number, vel: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    src.connect(hp); hp.connect(g); g.connect(this.master!); src.start(t); src.stop(t + 0.07);
  }
  private bass(t: number, midi: number, dur: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = mtof(midi);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1100, t); f.frequency.exponentialRampToValueAtTime(240, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.master!); o.start(t); o.stop(t + dur + 0.03);
  }
  private stab(t: number, midis: number[], dur = 0.13) {
    const ctx = this.ctx!;
    midis.forEach((m) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = mtof(m);
      f.type = 'lowpass'; f.frequency.value = 2800;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(f); f.connect(g); g.connect(this.master!); o.start(t); o.stop(t + dur + 0.02);
    });
  }
}
