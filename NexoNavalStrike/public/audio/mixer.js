// Nexo Naval Strike v1.2.17 itens 33/35 — MIXER de efeitos em AudioWorklet.
// Todas as vozes são FIXAS (alocadas uma vez): tocar um som = só uma mensagem; nenhum nó de áudio é criado por disparo.
// Cada voz: leitura do buffer com taxa (interpolação linear), ganho com rampa (sem zíper), pan estéreo (mesmo algoritmo do StereoPanner),
// passa-baixa 12 dB/oit (2 polos simples, abafamento pela distância), envio de eco (saída 2 → bus de eco fixo). Roubo de voz com fade de 6 ms
// (vozes "sombra"). Início imediato (item 35: sem atraso por distância) — o som começa no próximo quantum (2,7 ms a 48 kHz).
const NV = 64, NS = 16;
function voz() { return { bu: 0, on: 0, b: null, pos: 0, inc: 1, g: 0, gA: 0, gl: 0, gr: 0, pan: 0, a: 1, y1l: 0, y2l: 0, y1r: 0, y2r: 0, eco: 0, ini: 0, fade: 0, loop: 0, esp: 0, sm: 0, gT: 0, incT: 1 }; }
class Mixer extends AudioWorkletProcessor {
  constructor(op) { super(); const po = op && op.processorOptions || {}; this.nb = Math.max(1, po.nb | 0 || 1); this.be = new Float32Array(this.nb).fill(1); /* v1.2.23: nb saídas = BARRAMENTOS (GainNodes fixos no jogo) + saída de eco; be = escala do eco por barramento (= slider) */ this.B = []; this.V = []; this.S = []; for (let i = 0; i < NV; i++) this.V.push(voz()); for (let i = 0; i < NS; i++) this.S.push(voz()); this.ini = 0; this.port.onmessage = (e) => this.msg(e.data); }
  coef(fc) { return fc >= 19000 ? 1 : 1 - Math.exp(-2 * Math.PI * fc / sampleRate); }
  msg(m) {
    if (m.t === 'buf') { this.B[m.id] = { c: m.c, n: m.c[0].length, sr: m.sr }; return; }
    if (m.t === 'play') { const b = this.B[m.k]; if (!b) return; const v = this.V[m.s]; if (v.on) this.sombra(v);
      v.on = 1; v.b = b; v.pos = 0; v.inc = (m.r || 1) * b.sr / sampleRate; v.g = m.g; v.gA = 0; v.pan = m.p || 0; v.a = this.coef(m.fc || 20000); v.y1l = v.y2l = v.y1r = v.y2r = 0; v.eco = m.e || 0; v.ini = 1; v.fade = 0; v.loop = m.l ? 1 : 0; v.sm = m.sm ? 1 - Math.exp(-128 / (sampleRate * m.sm)) : 0; v.gT = v.g; v.incT = v.inc; if (m.o) v.pos = Math.floor(m.o * (b.n - 2)); v.esp = m.w ? Math.round(m.w * sampleRate) : 0; v.bu = Math.min(this.nb - 1, Math.max(0, m.bu | 0)); /* início programado (só a camada rítmica da MÚSICA usa; efeitos começam já) */
      this.ini++; if (m.q) this.port.postMessage({ t: 'ini', q: m.q, tc: currentTime }); return; }
    if (m.t === 'g') { const v = this.V[m.s]; if (v.on) { if (v.sm) v.gT = m.g; else v.g = m.g; if (m.p != null) v.pan = m.p; if (m.fc) v.a = this.coef(m.fc); if (m.r) { const x = m.r * v.b.sr / sampleRate; if (v.sm) v.incT = x; else v.inc = x; } } return; }
    if (m.t === 'stop') { const v = this.V[m.s]; if (v.on) { this.sombra(v); v.on = 0; } return; }
    if (m.t === 'be') { for (let i = 0; i < this.nb; i++) if (m.g[i] != null) this.be[i] = m.g[i]; return; }
    if (m.t === 'diag') this.port.postMessage({ t: 'diag', nq: this.nq || 0, ini: this.ini, ativas: this.V.reduce((a, v) => a + v.on, 0) });
  }
  sombra(v) { let s = null; for (const q of this.S) if (!q.on) { s = q; break; } if (!s) s = this.S[0]; Object.assign(s, v); s.fade = Math.max(1, Math.round(sampleRate * 0.006)); s.fadeN = s.fade; s.on = 1; }
  toca(v, L, R, EL, ER, n) { if (v.sm) { v.g += (v.gT - v.g) * v.sm; v.inc += (v.incT - v.inc) * v.sm; } /* laços: suavização exponencial (como setTargetAtTime) */ const b = v.b, c0 = b.c[0], c1 = b.c[1] || null, N = b.n; const st = !!c1;
    const x = st ? (v.pan <= 0 ? v.pan + 1 : v.pan) : (v.pan + 1) / 2, cg = Math.cos(x * Math.PI / 2), sg = Math.sin(x * Math.PI / 2);
    const gIni = v.gA, gFim = v.g, a = v.a; let y1l = v.y1l, y2l = v.y2l, y1r = v.y1r, y2r = v.y2r, pos = v.pos; const eco = v.eco ? v.eco * this.be[v.bu] : 0;
    let i0 = 0; if (v.esp > 0) { if (v.esp >= n) { v.esp -= n; return; } i0 = v.esp; v.esp = 0; }
    for (let i = i0; i < n; i++) { if (pos >= N - 1) { if (v.loop) pos -= N - 1; else { v.on = 0; break; } }
      const k = pos | 0, f = pos - k; let l = c0[k] + (c0[k + 1] - c0[k]) * f, r = c1 ? c1[k] + (c1[k + 1] - c1[k]) * f : l; pos += v.inc;
      let g = gIni + (gFim - gIni) * (i / n); if (v.ini) g *= Math.min(1, (i - i0) / 32 + 0.03); if (v.fade) { g *= v.fade / v.fadeN; if (--v.fade <= 0) { v.on = 0; break; } }
      if (a < 1) { y1l += a * (l - y1l); y2l += a * (y1l - y2l); l = y2l; y1r += a * (r - y1r); y2r += a * (y1r - y2r); r = y2r; }
      let ol, or; if (st) { if (v.pan <= 0) { ol = l + r * cg; or = r * sg; } else { ol = l * cg; or = r + l * sg; } } else { ol = l * cg; or = l * sg; }
      L[i] += ol * g; R[i] += or * g; if (eco) { EL[i] += ol * g * eco; ER[i] += or * g * eco; } }
    v.ini = 0; v.gA = gFim; v.pos = pos; v.y1l = y1l; v.y2l = y2l; v.y1r = y1r; v.y2r = y2r; }
  process(_i, outs) { this.nq = (this.nq || 0) + 1; /* v1.2.18: pulso para o vigia do jogo */ const nb = this.nb, ne = outs.length > nb ? outs[nb] : null, e0 = ne || outs[0], EL = e0[0], ER = e0[1] || e0[0], n = outs[0][0].length;
    /* v1.2.23: cada voz escreve na saída do SEU barramento (mesma conta de antes: com 1 barramento é idêntico à 1.2.22) */
    for (const v of this.V) if (v.on) { const o = outs[v.bu < outs.length ? v.bu : 0]; this.toca(v, o[0], o[1] || o[0], EL, ER, n); } for (const v of this.S) if (v.on) { const o = outs[v.bu < outs.length ? v.bu : 0]; this.toca(v, o[0], o[1] || o[0], EL, ER, n); } return true; }
}
registerProcessor('nns-mixer', Mixer);
