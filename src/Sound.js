export class SoundManager {
  constructor() {
    this._ctx = null;
  }

  _ensureCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this._ctx.state === 'suspended') this._ctx.resume();
    return this._ctx;
  }

  // Each cat has a unique voice pitch based on ID
  _baseFreq(catId) {
    const freqs = [420, 375, 455, 335, 495, 295, 555, 610, 315, 480];
    return freqs[(catId - 1) % 10];
  }

  play(catId, variant) {
    try {
      const ctx = this._ensureCtx();
      const f   = this._baseFreq(catId);
      if      (variant === 'pickup') this._pickup(ctx, f);
      else if (variant === 'drop')   this._drop(ctx, f);
      else if (variant === 'idle')   this._idle(ctx, f);
      else if (variant === 'play')   this._playChirp(ctx, f);
      else if (variant === 'fight')  this._fight(ctx, f);
      else if (variant === 'eat')    this._eat(ctx, f);
      else if (variant === 'sleep')  this._sleep(ctx, f);
    } catch (_) {}
  }

  _chain(ctx, fltFreq, Q) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const flt  = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.value = fltFreq;
    flt.Q.value = Q;
    osc.connect(flt);
    flt.connect(gain);
    gain.connect(ctx.destination);
    return { osc, gain, flt };
  }

  // Surprised "Mrow!" — quick rise on pickup
  _pickup(ctx, f) {
    const { osc, gain } = this._chain(ctx, 1700, 4);
    const n = ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * 0.85, n);
    osc.frequency.linearRampToValueAtTime(f * 1.55, n + 0.07);
    osc.frequency.linearRampToValueAtTime(f * 1.1,  n + 0.28);
    gain.gain.setValueAtTime(0, n);
    gain.gain.linearRampToValueAtTime(0.19, n + 0.03);
    gain.gain.setValueAtTime(0.19, n + 0.18);
    gain.gain.linearRampToValueAtTime(0, n + 0.33);
    osc.start(n); osc.stop(n + 0.36);
  }

  // Soft "mew" on drop
  _drop(ctx, f) {
    const { osc, gain } = this._chain(ctx, 1200, 3);
    const n = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(f * 1.08, n);
    osc.frequency.linearRampToValueAtTime(f * 0.7, n + 0.22);
    gain.gain.setValueAtTime(0, n);
    gain.gain.linearRampToValueAtTime(0.14, n + 0.02);
    gain.gain.linearRampToValueAtTime(0, n + 0.26);
    osc.start(n); osc.stop(n + 0.3);
  }

  // Classic "meow" — rise then fall
  _idle(ctx, f) {
    const { osc, gain } = this._chain(ctx, 1500, 4);
    const n = ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * 0.68, n);
    osc.frequency.linearRampToValueAtTime(f * 1.22, n + 0.17);
    osc.frequency.setValueAtTime(f * 1.22, n + 0.22);
    osc.frequency.linearRampToValueAtTime(f * 0.5,  n + 0.55);
    gain.gain.setValueAtTime(0, n);
    gain.gain.linearRampToValueAtTime(0.17, n + 0.05);
    gain.gain.setValueAtTime(0.17, n + 0.33);
    gain.gain.linearRampToValueAtTime(0, n + 0.58);
    osc.start(n); osc.stop(n + 0.62);
  }

  // Happy "Brrp" trill — 3 rising chirps
  _playChirp(ctx, f) {
    for (let i = 0; i < 3; i++) {
      const { osc, gain } = this._chain(ctx, 1900, 5);
      const n = ctx.currentTime + i * 0.12;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f * (1.1 + i * 0.14), n);
      osc.frequency.linearRampToValueAtTime(f * (1.4 + i * 0.09), n + 0.07);
      gain.gain.setValueAtTime(0, n);
      gain.gain.linearRampToValueAtTime(0.13, n + 0.02);
      gain.gain.linearRampToValueAtTime(0, n + 0.09);
      osc.start(n); osc.stop(n + 0.12);
    }
  }

  // Angry "Rrrowr" growl with vibrato
  _fight(ctx, f) {
    const { osc, gain } = this._chain(ctx, 750, 2);
    const n = ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f * 0.52, n);
    osc.frequency.linearRampToValueAtTime(f * 0.38, n + 0.45);
    const lfo = ctx.createOscillator();
    const lg  = ctx.createGain();
    lfo.frequency.value = 22;
    lg.gain.value = 20;
    lfo.connect(lg);
    lg.connect(osc.frequency);
    gain.gain.setValueAtTime(0, n);
    gain.gain.linearRampToValueAtTime(0.23, n + 0.04);
    gain.gain.setValueAtTime(0.23, n + 0.32);
    gain.gain.linearRampToValueAtTime(0, n + 0.52);
    lfo.start(n); osc.start(n);
    lfo.stop(n + 0.56); osc.stop(n + 0.56);
  }

  // Content purring while eating (AM-modulated)
  _eat(ctx, f) {
    const { osc, gain } = this._chain(ctx, 400, 1);
    const n = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.value = f * 0.28;
    const am = ctx.createOscillator();
    const ag = ctx.createGain();
    am.frequency.value = 28;
    ag.gain.value = 0.07;
    am.connect(ag);
    ag.connect(gain.gain);
    gain.gain.setValueAtTime(0, n);
    gain.gain.linearRampToValueAtTime(0.1, n + 0.12);
    gain.gain.setValueAtTime(0.1, n + 0.55);
    gain.gain.linearRampToValueAtTime(0, n + 0.78);
    am.start(n); osc.start(n);
    am.stop(n + 0.82); osc.stop(n + 0.82);
  }

  // Soft sleep purr
  _sleep(ctx, f) {
    const { osc, gain } = this._chain(ctx, 280, 0.8);
    const n = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.value = f * 0.18;
    gain.gain.setValueAtTime(0, n);
    gain.gain.linearRampToValueAtTime(0.055, n + 0.28);
    gain.gain.setValueAtTime(0.055, n + 1.1);
    gain.gain.linearRampToValueAtTime(0, n + 1.5);
    osc.start(n); osc.stop(n + 1.55);
  }
}
