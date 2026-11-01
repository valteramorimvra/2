// Nexo Naval Strike v1.2.18 — NÚCLEO do mixer para o caminho SEM AudioWorklet.
// Mesmo algoritmo e mesmo protocolo de mensagens de public/audio/mixer.js (buf/play/g/stop/diag), executado num ScriptProcessorNode
// criado UMA vez no início do áudio. Assim o caminho de reserva também cria 0 nós de áudio por disparo e toca exatamente as mesmas
// camadas pré-renderizadas que o Worklet (nenhum som removido).
const NV = 64, NS = 16;
function voz() { return { bu: 0, on: 0, b: null, pos: 0, inc: 1, g: 0, gA: 0, gl: 0, gr: 0, pan: 0, a: 1, y1l: 0, y2l: 0, y1r: 0, y2r: 0, eco: 0, ini: 0, fade: 0, loop: 0, esp: 0, sm: 0, gT: 0, incT: 1 }; }
export class NucleoMixer {
  constructor(sampleRate, tempo, post, nb = 1) { this.nb = Math.max(1, nb | 0); this.be = new Float32Array(this.nb).fill(1); this.sr = sampleRate; this.tempo = tempo; this.post = post; this.B = []; this.V = []; this.S = []; for (let i = 0; i < NV; i++) this.V.push(voz()); for (let i = 0; i < NS; i++) this.S.push(voz()); this.ini = 0; this.nq = 0; }
  coef(fc) { return fc >= 19000 ? 1 : 1 - Math.exp(-2 * Math.PI * fc / this.sr); }
  msg(m) { const sampleRate = this.sr;
    if (m.t === 'buf') { this.B[m.id] = { c: m.c, n: m.c[0].length, sr: m.sr }; return; }
    if (m.t === 'play') { const b = this.B[m.k]; if (!b) return; const v = this.V[m.s]; if (v.on) this.sombra(v);
      v.on = 1; v.b = b; v.pos = 0; v.inc = (m.r || 1) * b.sr / sampleRate; v.g = m.g; v.gA = 0; v.pan = m.p || 0; v.a = this.coef(m.fc || 20000); v.y1l = v.y2l = v.y1r = v.y2r = 0; v.eco = m.e || 0; v.ini = 1; v.fade = 0; v.loop = m.l ? 1 : 0; v.sm = m.sm ? 1 - Math.exp(-128 / (sampleRate * m.sm)) : 0; v.gT = v.g; v.incT = v.inc; if (m.o) v.pos = Math.floor(m.o * (b.n - 2)); v.esp = m.w ? Math.round(m.w * sampleRate) : 0; v.bu = Math.min(this.nb - 1, Math.max(0, m.bu | 0));
      this.ini++; if (m.q) this.post({ t: 'ini', q: m.q, tc: this.tempo() }); return; }
    if (m.t === 'g') { const v = this.V[m.s]; if (v.on) { if (v.sm) v.gT = m.g; else v.g = m.g; if (m.p != null) v.pan = m.p; if (m.fc) v.a = this.coef(m.fc); if (m.r) { const x = m.r * v.b.sr / sampleRate; if (v.sm) v.incT = x; else v.inc = x; } } return; }
    if (m.t === 'stop') { const v = this.V[m.s]; if (v.on) { this.sombra(v); v.on = 0; } return; }
    if (m.t === 'be') { for (let i = 0; i < this.nb; i++) if (m.g[i] != null) this.be[i] = m.g[i]; return; }
    if (m.t === 'diag') this.post({ t: 'diag', nq: this.nq, ini: this.ini, ativas: this.V.reduce((a, v) => a + v.on, 0) });
  }
  sombra(v) { let s = null; for (const q of this.S) if (!q.on) { s = q; break; } if (!s) s = this.S[0]; Object.assign(s, v); s.fade = Math.max(1, Math.round(this.sr * 0.006)); s.fadeN = s.fade; s.on = 1; }
  /** Mistura em blocos de 128 amostras (como o Worklet: rampas de ganho e suavização dos laços idênticas). */
  processa(L, R, EL, ER, X) { const n = L.length; L.fill(0); R.fill(0); if (EL) { EL.fill(0); ER.fill(0); } if (X) for (const [a, b] of X) { a.fill(0); b.fill(0); } /* v1.2.23: X = barramentos 1..nb−1 ([L, R]); barramento 0 = L/R */
    for (let o = 0; o < n; o += 128) { const m = Math.min(128, n - o); this.nq++; const l = L.subarray(o, o + m), r = R.subarray(o, o + m), el = EL ? EL.subarray(o, o + m) : l, er = EL ? ER.subarray(o, o + m) : r; const Bs = X ? [[l, r], ...X.map(([a, b]) => [a.subarray(o, o + m), b.subarray(o, o + m)])] : null;
      for (const v of this.V) if (v.on) { const q = Bs && v.bu < Bs.length ? Bs[v.bu] : [l, r]; this.toca(v, q[0], q[1], el, er, m, !EL); } for (const v of this.S) if (v.on) { const q = Bs && v.bu < Bs.length ? Bs[v.bu] : [l, r]; this.toca(v, q[0], q[1], el, er, m, !EL); } } }
  toca(v, L, R, EL, ER, n, semEco) { if (v.sm) { v.g += (v.gT - v.g) * v.sm; v.inc += (v.incT - v.inc) * v.sm; } const b = v.b, c0 = b.c[0], c1 = b.c[1] || null, N = b.n; const st = !!c1;
    const x = st ? (v.pan <= 0 ? v.pan + 1 : v.pan) : (v.pan + 1) / 2, cg = Math.cos(x * Math.PI / 2), sg = Math.sin(x * Math.PI / 2);
    const gIni = v.gA, gFim = v.g, a = v.a; let y1l = v.y1l, y2l = v.y2l, y1r = v.y1r, y2r = v.y2r, pos = v.pos; const eco = semEco || !v.eco ? 0 : v.eco * this.be[v.bu];
    let i0 = 0; if (v.esp > 0) { if (v.esp >= n) { v.esp -= n; return; } i0 = v.esp; v.esp = 0; }
    for (let i = i0; i < n; i++) { if (pos >= N - 1) { if (v.loop) pos -= N - 1; else { v.on = 0; break; } }
      const k = pos | 0, f = pos - k; let l = c0[k] + (c0[k + 1] - c0[k]) * f, r = c1 ? c1[k] + (c1[k + 1] - c1[k]) * f : l; pos += v.inc;
      let g = gIni + (gFim - gIni) * (i / n); if (v.ini) g *= Math.min(1, (i - i0) / 32 + 0.03); if (v.fade) { g *= v.fade / v.fadeN; if (--v.fade <= 0) { v.on = 0; break; } }
      if (a < 1) { y1l += a * (l - y1l); y2l += a * (y1l - y2l); l = y2l; y1r += a * (r - y1r); y2r += a * (y1r - y2r); r = y2r; }
      let ol, or; if (st) { if (v.pan <= 0) { ol = l + r * cg; or = r * sg; } else { ol = l * cg; or = r + l * sg; } } else { ol = l * cg; or = l * sg; }
      L[i] += ol * g; R[i] += or * g; if (eco) { EL[i] += ol * g * eco; ER[i] += or * g * eco; } }
    v.ini = 0; v.gA = gFim; v.pos = pos; v.y1l = y1l; v.y2l = y2l; v.y1r = y1r; v.y2r = y2r; }
}
