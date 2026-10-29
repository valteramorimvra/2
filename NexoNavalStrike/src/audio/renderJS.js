// v1.2.18 — RENDERIZADOR OFFLINE EM JS PURO (reserva do OfflineAudioContext).
// Alguns WebViews deixam o OfflineAudioContext travado (startRendering nunca resolve). Antes, as camadas sintetizadas
// (canhões, mísseis, bipes, UI…) caíam na síntese AO VIVO em combate (centenas de nós por minuto → travadas).
// Este módulo emula o subconjunto de Web Audio usado pelas receitas (Oscillator, BufferSource, BiquadFilter, Gain,
// AudioParam com setValueAtTime / linearRamp / exponentialRamp) e renderiza a MESMA receita em JS, no carregamento,
// para um AudioBuffer real — o mixer toca o resultado como qualquer outra camada (0 nós em combate). Nenhum som removido.
const TWO_PI = Math.PI * 2;
class ParamJS {
  constructor(v) { this._v = v; this.ev = []; }
  get value() { return this._v; } set value(v) { this._v = v; }
  setValueAtTime(v, t) { this.ev.push([0, t, v]); return this; }
  linearRampToValueAtTime(v, t) { this.ev.push([1, t, v]); return this; }
  exponentialRampToValueAtTime(v, t) { this.ev.push([2, t, v]); return this; }
  setTargetAtTime(v, t, k) { this.ev.push([3, t, v, k]); return this; }
  cancelScheduledValues() { this.ev.length = 0; return this; }
  /** curva por amostra (Float32Array N), semântica do Web Audio para os eventos acima */
  curva(N, sr) { const a = new Float32Array(N); const E = this.ev.slice().sort((x, y) => x[1] - y[1]); let v = this._v, t0 = 0, j = 0, alvo = null;
    for (let i = 0; i < N; i++) { const t = i / sr;
      while (j < E.length && (E[j][0] === 0 || E[j][0] === 3) && E[j][1] <= t) { if (E[j][0] === 0) { v = E[j][2]; alvo = null; } else alvo = E[j]; t0 = E[j][1]; j++; }
      if (j < E.length && (E[j][0] === 1 || E[j][0] === 2)) { const e = E[j]; if (t >= e[1]) { v = e[2]; t0 = e[1]; j++; i--; continue; } const u = (t - t0) / Math.max(1e-9, e[1] - t0);
        a[i] = e[0] === 1 ? v + (e[2] - v) * u : (v > 0 && e[2] > 0) || (v < 0 && e[2] < 0) ? v * Math.pow(e[2] / v, u) : v; continue; }
      if (alvo) { a[i] = alvo[2] + (v - alvo[2]) * Math.exp(-(t - alvo[1]) / Math.max(1e-6, alvo[3])); continue; }
      a[i] = v; }
    return a; }
}
class NoJS { constructor(ctx) { this.ctx = ctx; this.ent = []; } connect(d) { if (d && d.ent) d.ent.push(this); return d; } disconnect() {}
  entrada(N) { const s = new Float32Array(N); for (const n of this.ent) { const o = n.saida(N); for (let i = 0; i < N; i++) s[i] += o[i]; } return s; }
  saida(N) { if (!this._o) this._o = this.proc(N); return this._o; } proc(N) { return this.entrada(N); } }
class GainJS extends NoJS { constructor(c) { super(c); this.gain = new ParamJS(1); } proc(N) { const s = this.entrada(N), g = this.gain.curva(N, this.ctx.sampleRate); for (let i = 0; i < N; i++) s[i] *= g[i]; return s; } }
class FonteJS extends NoJS { constructor(c) { super(c); this.t0 = 0; this.t1 = Infinity; this.onended = null; } start(t = 0, ofs = 0) { this.t0 = t; this.ofs = ofs; } stop(t) { this.t1 = t; } }
class OscJS extends FonteJS { constructor(c) { super(c); this.type = 'sine'; this.frequency = new ParamJS(440); this.detune = new ParamJS(0); }
  proc(N) { const sr = this.ctx.sampleRate, f = this.frequency.curva(N, sr), o = new Float32Array(N), i0 = Math.max(0, Math.ceil(this.t0 * sr)), i1 = Math.min(N, Math.ceil(this.t1 * sr)); let p = 0; const T = this.type;
    const blep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }; /* poliBLEP: sem aliasing audível, como o oscilador band-limited do Web Audio */
    for (let i = i0; i < i1; i++) { const dt = Math.min(0.5, Math.abs(f[i]) / sr); let y;
      if (T === 'sine') y = Math.sin(TWO_PI * p); else if (T === 'sawtooth') y = 2 * p - 1 - blep(p, dt); else if (T === 'square') { y = (p < 0.5 ? 1 : -1) + blep(p, dt) - blep((p + 0.5) % 1, dt); } else y = 1 - 4 * Math.abs(((p + 0.25) % 1) - 0.5);
      o[i] = y; p += dt; if (p >= 1) p -= 1; }
    return o; } }
class BufJS extends FonteJS { constructor(c) { super(c); this.buffer = null; this.loop = false; this.playbackRate = new ParamJS(1); }
  proc(N) { const sr = this.ctx.sampleRate, o = new Float32Array(N); if (!this.buffer) return o; const d = this.buffer.getChannelData(0), L = d.length, r = this.playbackRate.curva(N, sr), i0 = Math.max(0, Math.ceil(this.t0 * sr)), i1 = Math.min(N, Math.ceil(this.t1 * sr)); let pos = (this.ofs || 0) * this.buffer.sampleRate % (this.loop ? L : Infinity);
    for (let i = i0; i < i1; i++) { if (pos >= L) { if (!this.loop) break; pos -= L; } const k = pos | 0, fr = pos - k; o[i] = d[k] + (d[(k + 1) % L] - d[k]) * fr; pos += r[i] * this.buffer.sampleRate / sr; }
    return o; } }
class BiquadJS extends NoJS { constructor(c) { super(c); this.type = 'lowpass'; this.frequency = new ParamJS(350); this.Q = new ParamJS(1); this.gain = new ParamJS(0); this.detune = new ParamJS(0); }
  proc(N) { const sr = this.ctx.sampleRate, x = this.entrada(N), F = this.frequency.curva(N, sr), Qc = this.Q.curva(N, sr), G = this.gain.curva(N, sr), y = new Float32Array(N); let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0;
    for (let i = 0; i < N; i++) { if ((i & 15) === 0) { /* coeficientes da especificação Web Audio (Audio EQ Cookbook), recalculados a cada 16 amostras */ const f0 = Math.min(sr / 2 - 1, Math.max(10, F[i])), w = TWO_PI * f0 / sr, cs = Math.cos(w), sn = Math.sin(w), Q = Qc[i], A = Math.pow(10, G[i] / 40); let al, B0, B1, B2, A0, A1, A2;
        switch (this.type) { case 'highpass': al = sn / (2 * Math.pow(10, Q / 20)); B0 = (1 + cs) / 2; B1 = -(1 + cs); B2 = B0; A0 = 1 + al; A1 = -2 * cs; A2 = 1 - al; break;
          case 'bandpass': al = sn / (2 * Math.max(1e-4, Q)); B0 = al; B1 = 0; B2 = -al; A0 = 1 + al; A1 = -2 * cs; A2 = 1 - al; break;
          case 'notch': al = sn / (2 * Math.max(1e-4, Q)); B0 = 1; B1 = -2 * cs; B2 = 1; A0 = 1 + al; A1 = -2 * cs; A2 = 1 - al; break;
          case 'peaking': al = sn / (2 * Math.max(1e-4, Q)); B0 = 1 + al * A; B1 = -2 * cs; B2 = 1 - al * A; A0 = 1 + al / A; A1 = -2 * cs; A2 = 1 - al / A; break;
          case 'lowshelf': case 'highshelf': { const S = 1, al2 = sn / 2 * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2), sq = 2 * Math.sqrt(A) * al2, h = this.type === 'highshelf' ? -1 : 1;
            B0 = A * ((A + 1) - h * (A - 1) * cs + sq); B1 = 2 * h * A * ((A - 1) - h * (A + 1) * cs); B2 = A * ((A + 1) - h * (A - 1) * cs - sq); A0 = (A + 1) + h * (A - 1) * cs + sq; A1 = -2 * h * ((A - 1) + h * (A + 1) * cs); A2 = (A + 1) + h * (A - 1) * cs - sq; break; }
          default: al = sn / (2 * Math.pow(10, Q / 20)); B0 = (1 - cs) / 2; B1 = 1 - cs; B2 = B0; A0 = 1 + al; A1 = -2 * cs; A2 = 1 - al; }
        b0 = B0 / A0; b1 = B1 / A0; b2 = B2 / A0; a1 = A1 / A0; a2 = A2 / A0; }
      const xi = x[i], yi = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = yi; y[i] = yi; }
    return y; } }
class ShaperJS extends NoJS { constructor(c) { super(c); this.curve = null; this.oversample = 'none'; } proc(N) { const s = this.entrada(N), c = this.curve; if (!c) return s; const L = c.length - 1; for (let i = 0; i < N; i++) { const u = (Math.max(-1, Math.min(1, s[i])) + 1) / 2 * L, k = Math.min(L - 1, u | 0); s[i] = c[k] + (c[k + 1] - c[k]) * (u - k); } return s; } }
/** Contexto offline emulado: mesma interface usada pelas receitas; startRendering() devolve um AudioBuffer REAL (criado no contexto ao vivo). */
export class OfflineJS {
  constructor(real, canais, N, sr) { this.real = real; this.length = N; this.sampleRate = sr; this.currentTime = 0; this.destination = new NoJS(this); this.state = 'suspended'; }
  createGain() { return new GainJS(this); } createOscillator() { return new OscJS(this); } createBufferSource() { return new BufJS(this); } createBiquadFilter() { return new BiquadJS(this); } createWaveShaper() { return new ShaperJS(this); }
  createStereoPanner() { const n = new NoJS(this); n.pan = new ParamJS(0); return n; } createDelay() { const n = new NoJS(this); n.delayTime = new ParamJS(0); return n; }
  createBuffer(c, n, sr) { return this.real.createBuffer(c, n, sr); }
  startRendering() { const N = this.length, s = this.destination.saida(N), b = this.real.createBuffer(1, N, this.sampleRate); b.getChannelData(0).set(s); this.state = 'closed'; return Promise.resolve(b); }
}
