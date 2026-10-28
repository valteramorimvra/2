// v1.2.19 item 2: BANCO PRÓPRIO DOS 7 CRUZEIROS PESADOS (projetos originais). Pré-renderizado UMA vez no carregamento, em JS puro, sobre o PCM
// das gravações CC0 já decodificadas (canhao_grande / canhao_medio / canhao_rapido) + síntese física determinística; enviado ao pool do mixer
// fixo (Worklet ou ScriptProcessor de reserva): 0 nós de áudio em combate. Proporcional ao calibre:
//  · cp_grande (280–305 mm): gravação baixada ~ -4 semitons (tubo maior, carga maior), ONDA DE CHOQUE (estalo de boca de 0–4 ms, banda larga
//    com energia 1–6 kHz audível no alto-falante do celular), BOOM sub-grave 52→26 Hz com harmônicos 2º/3º (saturação suave → o celular
//    "ouve" o grave pelos harmônicos 100–300 Hz), corpo 300–1200 Hz (casaria/convés), ECO DO MAR (reflexões 0,11/0,29/0,62 s) e
//    reverberação longa (Schroeder 4 pentes + 2 passa-tudo) com estrondo rolando (~3,5 s);
//  · cp_longe: o mesmo disparo a distância (agudos absorvidos pelo ar, mais estrondo e eco);
//  · cp_100 (100 mm automático): estampido médio, seco, corpo 400–2 kHz, cauda curta (1,2 s);
//  · cp_30 (30 mm): tiro curto e duro, estalo 2–6 kHz, cauda 0,3 s;
//  · cp_127 (12,7 mm): estalo seco, curtíssimo (0,16 s).
// Pico normalizado com limitador suave (tanh) → sem clipping. Gerador pseudoaleatório fixo → mesmo som em todo carregamento.
const rng = (s) => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 * 2 - 1; };
const lp1 = (y, sr, fc) => { const a = 1 - Math.exp(-2 * Math.PI * fc / sr); let s = 0; for (let i = 0; i < y.length; i++) { s += a * (y[i] - s); y[i] = s; } return y; };
const hp1 = (y, sr, fc) => { const a = 1 - Math.exp(-2 * Math.PI * fc / sr); let s = 0; for (let i = 0; i < y.length; i++) { s += a * (y[i] - s); y[i] -= s; } return y; };
const bp = (y, sr, f1, f2) => hp1(lp1(lp1(y, sr, f2), sr, f2 * 1.4), sr, f1);
function reamostra(src, rate, n) { const y = new Float32Array(n); for (let i = 0; i < n; i++) { const p = i * rate, k = p | 0, f = p - k; if (k + 1 >= src.length) break; y[i] = src[k] * (1 - f) + src[k + 1] * f; } return y; }
function pico(y) { let p = 0; for (let i = 0; i < y.length; i++) { const a = Math.abs(y[i]); if (a > p) p = a; } return p; }
function normaliza(y, alvo, dr = 1.6) { const p = pico(y) || 1; const g = dr / p, k = alvo / Math.tanh(dr); for (let i = 0; i < y.length; i++) y[i] = Math.tanh(y[i] * g) * k; return y; } /* limitador suave: pico exato = alvo, nunca > 1 */
function reverb(x, sr, tempo, wet, lp) { const n = x.length, y = new Float32Array(n), C = [0.0297, 0.0371, 0.0411, 0.0437].map((t) => Math.round(t * sr * 1.7)), fb = C.map((d) => Math.pow(10, -3 * d / sr / tempo));
  const bufs = C.map((d) => new Float32Array(d)), ps = C.map(() => 0), lps = C.map(() => 0), a = 1 - Math.exp(-2 * Math.PI * lp / sr);
  for (let i = 0; i < n; i++) { let s = 0; for (let c = 0; c < 4; c++) { const b = bufs[c], o = b[ps[c]]; lps[c] += a * (o - lps[c]); b[ps[c]] = x[i] + lps[c] * fb[c]; ps[c] = (ps[c] + 1) % b.length; s += o; } y[i] = s * 0.25; }
  for (const [t, g] of [[0.005, 0.7], [0.0017, 0.7]]) { const d = Math.round(t * sr), b = new Float32Array(d); let p = 0; for (let i = 0; i < n; i++) { const o = b[p], v = y[i] + o * g; b[p] = v; y[i] = o - v * g; p = (p + 1) % d; } }
  for (let i = 0; i < n; i++) y[i] = x[i] + y[i] * wet; return y; }
function ecoMar(y, sr, R) { const n = y.length, z = Float32Array.from(y); for (const [t, g, f] of R) { const d = Math.round(t * sr), w = lp1(Float32Array.from(y), sr, f); for (let i = d; i < n; i++) z[i] += w[i - d] * g; } return z; }
/** Gera o banco. B = { canhao_grande, canhao_medio, canhao_rapido } como Float32Array mono; sr = taxa. Devolve { nome: Float32Array }. */
export function bancoPesado(B, sr) { const out = {}, r = rng(1219);
  { const nV = Math.round(4.6 * sr); for (let i = 0, nb = Math.ceil(0.004 * sr) + 2 * nV; i < nb; i++) r(); } /* v1.2.22: avança o rng como na 1.2.21 → os outros bancos ficam idênticos */
  { /* 280–305 mm · v1.2.22: 6,2 s (antes 4,6 s cortava a cauda), boom/corpo/estrondo mais longos, rng próprio */ const r = rng(12221); const dur = 6.2, n = Math.round(dur * sr), g0 = B.canhao_grande; const y = g0 ? reamostra(g0, 0.79, n) : new Float32Array(n); const pk = pico(y) || 0.5;
    for (let i = 0; i < n; i++) { const t = i / sr; /* onda de choque: estalo de boca (meia senoide de 1,4 ms + ruído de 4 ms) */ const ch = t < 0.0014 ? Math.sin(Math.PI * t / 0.0014) * 1.25 : 0; const cr = t < 0.004 ? r() * (1 - t / 0.004) * 0.9 : 0;
      /* boom: varredura 52→26 Hz + 2º e 3º harmônicos (audíveis no celular) */ const f = 26 + 26 * Math.exp(-t / 0.35), ph = 2 * Math.PI * (26 * t + 26 * 0.35 * (1 - Math.exp(-t / 0.35))); const env = (1 - Math.exp(-t / 0.004)) * Math.exp(-t / 1.0);
      const boom = env * (Math.sin(ph) * 0.95 + Math.sin(2 * ph) * 0.42 + Math.sin(3 * ph + 0.4) * 0.22) * (f > 0 ? 1 : 0); y[i] = y[i] / pk * 1.15 + (ch + cr) * 1.0 + Math.tanh(boom * 1.6) * 0.62; } /* v1.2.22b: boom 30–80 Hz mais forte */
    const corpo = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; corpo[i] = r() * (Math.exp(-t / 0.32) + 0.22 * Math.exp(-t / 1.1)) * (1 - Math.exp(-t / 0.006)); } bp(corpo, sr, 300, 1200); const pc = pico(corpo) || 1; for (let i = 0; i < n; i++) y[i] += corpo[i] / pc * 0.8;
    const rol = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; rol[i] = r() * Math.exp(-t / 2.0) * (1 - Math.exp(-t / 0.08)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 1.7 * t)); } lp1(lp1(rol, sr, 420), sr, 420); const pr = pico(rol) || 1; for (let i = 0; i < n; i++) y[i] += rol[i] / pr * 0.5; /* estrondo rolando */ const rug = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; rug[i] = r() * Math.exp(-t / 1.2) * (1 - Math.exp(-t / 0.03)); } bp(rug, sr, 300, 900); const pg = pico(rug) || 1; for (let i = 0; i < n; i++) y[i] += rug[i] / pg * 0.95; /* v1.2.22b: rugido 300–900 Hz do estrondo (a parte do trovão que o alto-falante do celular reproduz) */
    const e = ecoMar(y, sr, [[0.11, 0.42, 2600], [0.29, 0.3, 1500], [0.62, 0.2, 900]]); const w = reverb(e, sr, 2.8, 0.42, 3200); const nf = Math.round(0.35 * sr); for (let i = 0; i < nf; i++) w[n - 1 - i] *= i / nf; /* v1.2.22: fim sem corte */ out.cp_grande = normaliza(hp1(w, sr, 18), 0.92, 2.6); /* limitador mais denso: o estampido e o corpo ficam fortes na banda do celular */
    const L = Float32Array.from(out.cp_grande); lp1(lp1(L, sr, 1300), sr, 1800); const L2 = ecoMar(L, sr, [[0.21, 0.5, 700], [0.55, 0.35, 500], [1.1, 0.25, 380]]); out.cp_longe = normaliza(reverb(L2, sr, 3.4, 0.55, 1200), 0.85, 2.2); }
  { /* 100 mm automático */ const dur = 1.3, n = Math.round(dur * sr), m0 = B.canhao_medio; const y = m0 ? reamostra(m0, 1.06, n) : new Float32Array(n); const pk = pico(y) || 0.5;
    for (let i = 0; i < n; i++) { const t = i / sr; const ch = t < 0.0009 ? Math.sin(Math.PI * t / 0.0009) : 0; const cr = t < 0.003 ? r() * (1 - t / 0.003) * 0.7 : 0; const ph = 2 * Math.PI * (62 * t + 40 * 0.12 * (1 - Math.exp(-t / 0.12))); const boom = (1 - Math.exp(-t / 0.002)) * Math.exp(-t / 0.22) * (Math.sin(ph) + 0.45 * Math.sin(2 * ph)); y[i] = y[i] / pk * 0.9 + ch * 0.8 + cr + Math.tanh(boom * 1.3) * 0.5; }
    const c = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; c[i] = r() * Math.exp(-t / 0.09); } bp(c, sr, 400, 2000); const pc = pico(c) || 1; for (let i = 0; i < n; i++) y[i] += c[i] / pc * 0.4;
    out.cp_100 = normaliza(reverb(ecoMar(y, sr, [[0.09, 0.3, 2400], [0.24, 0.18, 1400]]), sr, 1.1, 0.3, 4200), 0.86); }
  { /* 30 mm */ const dur = 0.42, n = Math.round(dur * sr), q0 = B.canhao_rapido; const y = q0 ? reamostra(q0, 1.12, n) : new Float32Array(n); const pk = pico(y) || 0.5;
    for (let i = 0; i < n; i++) { const t = i / sr; const ch = t < 0.0006 ? Math.sin(Math.PI * t / 0.0006) : 0; const cr = t < 0.0025 ? r() * (1 - t / 0.0025) : 0; const boom = Math.exp(-t / 0.05) * Math.sin(2 * Math.PI * 120 * t) * (1 - Math.exp(-t / 0.001)); y[i] = (y[i] / pk * 0.8 + ch * 0.6 + cr * 0.7 + boom * 0.35) * Math.exp(-Math.max(0, t - 0.12) / 0.09); }
    out.cp_30 = normaliza(reverb(hp1(y, sr, 90), sr, 0.45, 0.2, 5000), 0.8); }
  { /* 12,7 mm */ const dur = 0.2, n = Math.round(dur * sr), q0 = B.canhao_rapido; const y = q0 ? reamostra(q0, 1.7, n) : new Float32Array(n); const pk = pico(y) || 0.5;
    for (let i = 0; i < n; i++) { const t = i / sr; const cr = t < 0.0015 ? r() * (1 - t / 0.0015) : 0; const ch = t < 0.0004 ? Math.sin(Math.PI * t / 0.0004) : 0; y[i] = (y[i] / pk * 0.7 + cr * 0.8 + ch * 0.5) * Math.exp(-Math.max(0, t - 0.04) / 0.045); }
    out.cp_127 = normaliza(reverb(hp1(y, sr, 180), sr, 0.3, 0.15, 6000), 0.72); }
  return out; }
export const NOMES_PESADO = ['cp_grande', 'cp_longe', 'cp_100', 'cp_30', 'cp_127'];
