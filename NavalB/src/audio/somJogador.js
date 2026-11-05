// Nexo Naval Strike v1.2.23 itens 1 e 2 — SONS DO NAVIO DO JOGADOR, sintetizados em JS puro (determinístico, sem assets, sem nós de áudio).
// Renderizado UMA vez no carregamento → buffers estéreo enviados ao mixer (ou ao pool nativo). Nada é criado em combate.
//  ij:canhao  — projétil de canhão no casco: CISALHAMENTO metálico (aço duro perfurado) → RESSONÂNCIA grave da quilha (sino oco) → ESTALO da fragmentação interna.
//  ij:missil  — míssil antinavio: IMPACTO cinético → explosão em 2 FASES (detonação da ogiva penetrante + queima turbulenta do combustível) → anteparas RACHANDO.
//  ij:torpedo — torpedo (v1.2.29 ST): BAQUE hidráulico subaquático (sub-grave < 60 Hz que faz a estrutura tremer) → COLAPSO abafado de toneladas de água → CAVITAÇÃO sob a linha d'água.
//  ij:granada — granada/morteiro: DETONAÇÃO seca de alta pressão no convés + TILINTAR granular de centenas de fragmentos ricocheteando em anteparas e sensores.
//  lj:missil  — lançamento de míssil: SOCO pneumático de ejeção (ar comprimido) → RUGIDO contínuo e ensurdecedor do motor-foguete.
//  lj:granada — lançamento de granada: BAQUE mecânico pesado, seco e muito pressurizado do tubo de artilharia naval.
function rng(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 2147483648 - 1; }; }
const TAU = Math.PI * 2;
/** afunilamento suave nos últimos 30 % de um segmento (nenhum segmento termina em degrau) */ const fim = (t, T) => (t < 0.7 * T ? 1 : 0.5 + 0.5 * Math.cos(Math.PI * Math.min(1, (t - 0.7 * T) / (0.3 * T))));
function biq(y, tipo, fc, q, sr) { const w = TAU * Math.min(fc, sr * 0.45) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al; let b0, b1, b2;
  if (tipo === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (tipo === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
  b0 /= a0; b1 /= a0; b2 /= a0; const a1 = -2 * cs / a0, a2 = (1 - al) / a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < y.length; i++) { const x = y[i], v = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = v; y[i] = v; } return y; }
function ruido(n, r) { const y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = r(); return y; }
/** soma em o[] a partir de t0 (s): f(t) amostra a amostra */
function add(o, sr, t0, dur, f) { const i0 = Math.max(0, Math.round(t0 * sr)), i1 = Math.min(o.length, i0 + Math.round(dur * sr)); for (let i = i0; i < i1; i++) o[i] += f((i - i0) / sr, i); }
/** ruído filtrado com envelope (ataque a, decaimento exponencial tau) */
function rajada(o, sr, r, t0, dur, tipo, fc, q, g, a, tau) { const n = Math.round(dur * sr), y = biq(ruido(n, r), tipo, fc, q, sr); if (tipo === 'bp') biq(y, 'bp', fc, q, sr); const i0 = Math.round(t0 * sr); for (let i = 0; i < n && i0 + i < o.length; i++) { const t = i / sr; o[i0 + i] += y[i] * g * Math.min(1, t / Math.max(1e-4, a)) * Math.exp(-t / tau) * fim(t, dur); } }
/** modo ressonante amortecido; f1 = frequência final (deriva exponencial em tf) */
function modo(o, sr, t0, f, tau, g, ph = 0, a = 0.0005, f1 = f, tf = 0.3) { const dur = Math.min(tau * 7, (o.length / sr) - t0); let p = ph; add(o, sr, t0, dur, (t) => { const fi = f1 + (f - f1) * Math.exp(-t / tf); p += TAU * fi / sr; return Math.sin(p) * g * Math.min(1, t / a) * Math.exp(-t / tau); }); }
/** varredura senoidal (baque) f0→f1 com harmônicos */
function baque(o, sr, t0, f0, f1, tf, tau, g, h2 = 0, h3 = 0, a = 0.001) { let p = 0; add(o, sr, t0, Math.min(tau * 7, o.length / sr - t0), (t) => { p += TAU * (f1 + (f0 - f1) * Math.exp(-t / tf)) / sr; const e = Math.min(1, t / a) * Math.exp(-t / tau); return (Math.sin(p) + h2 * Math.sin(2 * p + 0.3) + h3 * Math.sin(3 * p + 0.7)) * g * e; }); }
/** onda de choque de Friedlander (pressão positiva curta + fase negativa) */
function choque(o, sr, t0, ts, g) { add(o, sr, t0, ts * 6, (t) => { const x = t / ts; return g * Math.min(1, t / 0.00025) * (1 - x) * Math.exp(-1.8 * x); }); }
/** estalos esparsos (crepitar) */
function crepita(o, sr, r, t0, dur, dens, g, tauEnv, hp = 1500) { const n = Math.round(dur * sr), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; if ((r() + 1) / 2 < dens / sr * Math.exp(-t / tauEnv)) { const L = 20 + ((r() + 1) * 60) | 0, A = (0.4 + 0.6 * Math.abs(r())) * (r() < 0 ? -1 : 1); for (let k = 0; k < L && i + k < n; k++) y[i + k] += A * (1 - k / L) * r(); } } biq(y, 'hp', hp, 0.7, sr); const i0 = Math.round(t0 * sr); for (let i = 0; i < n && i0 + i < o.length; i++) o[i0 + i] += y[i] * g; }
/** reverberação Schroeder (4 pentes amortecidos + 2 passa-tudo), semente própria por canal → estéreo largo */
function reverb(x, sr, rt, amort, esp) { const n = x.length, o = new Float32Array(n); const D = [1557, 1617, 1491, 1422].map((d) => Math.round(d * esp * sr / 44100));
  for (const d of D) { const g = Math.pow(10, -3 * d / sr / rt), b = new Float32Array(d); let k = 0, lp = 0; for (let i = 0; i < n; i++) { const y = b[k]; lp = y * (1 - amort) + lp * amort; b[k] = x[i] + lp * g; k = (k + 1) % d; o[i] += y * 0.25; } }
  for (const [d0, g] of [[225, 0.5], [556, 0.5]]) { const d = Math.round(d0 * esp * sr / 44100), b = new Float32Array(d); let k = 0; for (let i = 0; i < n; i++) { const v = b[k], u = o[i] + v * g; b[k] = u; o[i] = v - u * g; k = (k + 1) % d; } } return o; }
function fecha(L, R, sr, alvo = 0.9, cauda = 0.25) { const n = L.length, nf = Math.round(cauda * sr); for (let i = 0; i < nf; i++) { const g = 0.5 + 0.5 * Math.cos(Math.PI * i / nf); L[n - nf + i] *= g; R[n - nf + i] *= g; } /* início sem degrau: rampa de 0,4 ms */ for (let i = 0, ni = Math.round(0.0004 * sr); i < ni; i++) { L[i] *= i / ni; R[i] *= i / ni; }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); /* picos isolados: saturação suave só acima de 0,8 do pico (sem ceifar) */ const lim = pk * 0.8, sat = (v) => { const a = Math.abs(v); return a <= lim ? v : Math.sign(v) * (lim + (pk - lim) * Math.tanh((a - lim) / (pk - lim))); };
  let pk2 = 0; for (let i = 0; i < n; i++) { L[i] = sat(L[i]); R[i] = sat(R[i]); pk2 = Math.max(pk2, Math.abs(L[i]), Math.abs(R[i])); } const k = alvo / (pk2 || 1); for (let i = 0; i < n; i++) { L[i] *= k; R[i] *= k; } return [L, R]; }
/** monta estéreo: seco (comum + por canal) + reverb por canal */
function estereo(sr, dur, seco, porCanal, rv) { const n = Math.round(dur * sr), C = new Float32Array(n); seco(C); const out = [];
  for (let c = 0; c < 2; c++) { const X = Float32Array.from(C); porCanal(X, c); const W = reverb(X, sr, rv.rt, rv.am, rv.esp * (c ? 1.07 : 1)); for (let i = 0; i < n; i++) X[i] += W[i] * rv.wet; out.push(X); } return out; }

function impCanhao(sr) { const r = rng(12301);
  return estereo(sr, 4.4, (o) => {
    /* 1) cisalhamento: aço duro sendo perfurado — chiado rasgado 1,5–6 kHz com granulação (modulação 300–800 Hz) */
    const n = Math.round(0.16 * sr), sh = biq(biq(ruido(n, r), 'hp', 1300, 0.7, sr), 'bp', 3200, 0.6, sr), am = biq(ruido(n, r), 'lp', 520, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr; o[i] += sh[i] * (0.55 + 3.5 * Math.abs(am[i])) * 1.1 * Math.min(1, t / 0.0006) * Math.exp(-t / 0.04); }
    choque(o, sr, 0, 0.0011, 0.7); [1870, 2930, 4120, 5480, 7310].forEach((f, k) => modo(o, sr, 0.001, f, 0.22 - 0.03 * k, 0.11, k)); /* chapa perfurada */
    /* 2) ressonância grave da QUILHA — sino oco (modos inarmônicos, cauda longa) */
    [[1, 1.7, 0.55], [1.58, 1.4, 0.38], [2.37, 1.1, 0.3], [3.02, 0.9, 0.22], [4.11, 0.7, 0.15], [5.4, 0.5, 0.1], [6.9, 0.38, 0.07]].forEach(([m, tau, g], k) => modo(o, sr, 0.008, 47 * m, tau, g, k * 0.9, 0.006, 47 * m * 0.99, 0.35));
    /* 3) ESTALO explosivo da fragmentação interna (espoleta retardada ~85 ms) */
    const tf = 0.085; choque(o, sr, tf, 0.0016, 1.0); rajada(o, sr, r, tf, 0.25, 'lp', 5200, 0.7, 0.95, 0.0003, 0.02); rajada(o, sr, r, tf, 0.9, 'lp', 1200, 0.7, 0.55, 0.002, 0.13); baque(o, sr, tf, 66, 34, 0.08, 0.24, 0.75, 0.3, 0.1);
    crepita(o, sr, r, tf + 0.02, 0.9, 140, 0.32, 0.18, 2200); /* estilhaços internos */
  }, (X, c) => { const r2 = rng(c ? 777 : 555); for (let j = 0; j < 9; j++) { const t = 0.2 + 1.1 * Math.pow((r2() + 1) / 2, 1.6); modo(X, sr, t, 2400 + 4200 * (r2() + 1) / 2, 0.05, 0.06 * Math.exp(-t)); } [1, 1.58, 2.37].forEach((m, k) => modo(X, sr, 0.008, 47 * m * (c ? 1.004 : 0.996), 1.3, 0.08, k)); /* batimento lento L/R = casco largo */ },
  { rt: 1.4, am: 0.35, esp: 1.0, wet: 0.24 }); }

function impMissil(sr) { const r = rng(12302);
  return estereo(sr, 5.6, (o) => {
    /* impacto cinético brutal: baque pesado + esmagamento do aço */ baque(o, sr, 0, 82, 40, 0.05, 0.09, 0.85, 0.35); rajada(o, sr, r, 0, 0.3, 'bp', 900, 0.7, 0.9, 0.0005, 0.045); [620, 1130, 1710, 2460].forEach((f, k) => modo(o, sr, 0, f, 0.16, 0.1, k));
    /* FASE 1: detonação da ogiva penetrante (22 ms depois) — onda de choque + estampido + SUB 48→26 Hz */ const t1 = 0.022; choque(o, sr, t1, 0.008, 1.3); rajada(o, sr, r, t1, 0.4, 'lp', 7000, 0.7, 0.95, 0.0003, 0.06); rajada(o, sr, r, t1, 1.6, 'lp', 1400, 0.7, 0.75, 0.003, 0.35); baque(o, sr, t1, 48, 26, 0.25, 0.75, 1.15, 0.32, 0.12, 0.004);
    /* FASE 2: queima turbulenta do combustível — rugido grave com turbulência lenta e crepitar */ const t2 = 0.15, n2 = Math.round(5.4 * sr), q = biq(ruido(n2, r), 'lp', 720, 0.6, sr), q2 = biq(biq(ruido(n2, r), 'bp', 190, 0.5, sr), 'lp', 400, 0.7, sr), tb = biq(biq(ruido(n2, r), 'lp', 7, 0.7, sr), 'lp', 7, 0.7, sr);
    let tm = 0; for (let i = 0; i < n2; i++) tm = Math.max(tm, Math.abs(tb[i])); const i2 = Math.round(t2 * sr);
    for (let i = 0; i < n2 && i2 + i < o.length; i++) { const t = i / sr, env = Math.min(1, t / 0.25) * (t < 1.7 ? 1 : Math.exp(-(t - 1.7) / 0.85)) * fim(t, 5.4), m = 0.55 + 0.45 * tb[i] / (tm || 1); o[i2 + i] += (q[i] * 1.5 + q2[i] * 2.2) * env * m * 0.55; }
    baque(o, sr, t2, 72, 44, 0.3, 0.5, 0.32, 0.2, 0, 0.06); crepita(o, sr, r, t2, 3.0, 55, 0.22, 1.2, 1800);
    /* anteparas rachando: estalos metálicos com gemido do aço, espalhados até 3 s */ for (let j = 0; j < 10; j++) { const t = 0.32 + 2.7 * Math.pow((r() + 1) / 2, 1.3), g = 0.65 * Math.exp(-(t - 0.3) / 1.6) + 0.12; choque(o, sr, t, 0.0007, g * 0.8); rajada(o, sr, r, t, 0.12, 'bp', 1000 + 1600 * (r() + 1) / 2, 1.1, g, 0.0003, 0.013); { const f = 260 + 640 * (r() + 1) / 2; modo(o, sr, t, f, 0.18, g * 0.22, j, 0.0005, f * 0.86, 0.15); } if (j % 3 === 0) modo(o, sr, t + 0.01, 120 + 40 * r(), 0.45, g * 0.14, 0, 0.03, 100 + 30 * r(), 0.4); }
  }, (X, c) => { const r2 = rng(c ? 1301 : 1302), n = Math.round(5.4 * sr), q = biq(ruido(n, r2), 'bp', 2400, 0.5, sr), i0 = Math.round(0.17 * sr); for (let i = 0; i < n && i0 + i < X.length; i++) { const t = i / sr; X[i0 + i] += q[i] * 0.12 * Math.min(1, t / 0.2) * (t < 1.4 ? 1 : Math.exp(-(t - 1.4) / 0.7)) * fim(t, 5.4); } },
  { rt: 1.6, am: 0.4, esp: 1.15, wet: 0.26 }); }

function impTorpedo(sr) { const r = rng(12303);
  return estereo(sr, 6.6, (o) => {
    /* baque hidráulico: onda de pressão na água (subida mais macia), SUB 36→20 Hz + 55 Hz */ baque(o, sr, 0, 36, 20, 0.6, 1.1, 1.25, 0.38, 0.16, 0.014); modo(o, sr, 0, 55, 0.8, 0.5, 0, 0.012); rajada(o, sr, r, 0, 2.4, 'lp', 120, 0.7, 1.6, 0.01, 0.5);
    /* corpo abafado da explosão (através do casco) */ const n0 = Math.round(1.2 * sr), b = biq(biq(ruido(n0, r), 'lp', 1100, 0.7, sr), 'lp', 380, 0.7, sr); for (let i = 0; i < n0; i++) { const t = i / sr; o[i] += b[i] * 0.85 * Math.min(1, t / 0.004) * Math.exp(-t / 0.25); }
    /* estrutura TREMENDO: ronco grave modulado 7–11 Hz + gemido do casco */ const n1 = Math.round(6.5 * sr), rr = biq(biq(ruido(n1, r), 'lp', 95, 0.7, sr), 'lp', 95, 0.7, sr); for (let i = 0; i < n1; i++) { const t = i / sr, f = 9 + 2 * Math.sin(TAU * 0.4 * t); o[i] += rr[i] * 3.2 * (0.6 + 0.4 * Math.sin(TAU * f * t)) * Math.min(1, t / 0.05) * Math.exp(-t / 1.5) * fim(t, 6.5); }
    [41, 67, 93].forEach((f, k) => modo(o, sr, 0.03, f, 1.8, 0.2, k, 0.04, f * 0.97, 0.8));
    /* colapso abafado de toneladas de água (coluna caindo de volta 0,9–3,5 s) */ const tc = 0.85, n2 = Math.round(5.7 * sr), w = biq(biq(ruido(n2, r), 'lp', 520, 0.7, sr), 'lp', 300, 0.7, sr), gr = new Float32Array(n2);
    for (let i = 0; i < n2; i++) { const t = i / sr; if ((r() + 1) / 2 < 34 / sr * Math.exp(-t / 1.4)) { const L = Math.round((0.02 + 0.04 * (r() + 1) / 2) * sr), A = 0.5 + 0.5 * Math.abs(r()); for (let k = 0; k < L && i + k < n2; k++) gr[i + k] += A * Math.sin(Math.PI * k / L) * r(); } } biq(biq(gr, 'bp', 520, 0.6, sr), 'lp', 900, 0.7, sr);
    const ic = Math.round(tc * sr); for (let i = 0; i < n2 && ic + i < o.length; i++) { const t = i / sr, env = (t < 0.7 ? Math.pow(t / 0.7, 1.6) : Math.exp(-(t - 0.7) / 1.0)) * fim(t, 5.7); o[ic + i] += (w[i] * 1.9 + gr[i] * 0.9) * env; }
    /* CAVITAÇÃO sob a linha d'água: bolhas (Minnaert 180–1400 Hz, subindo) + crepitar áspero, tudo abafado */ const n3 = Math.round(2.8 * sr), cv = new Float32Array(n3), r3 = rng(4401); for (let i = 0; i < n3; i++) { const t = i / sr; if ((r3() + 1) / 2 < 210 / sr * Math.exp(-t / 0.7)) { const f = 180 + 1220 * Math.pow((r3() + 1) / 2, 2), tau = 0.008 + 0.03 * (r3() + 1) / 2, A = 0.25 + 0.75 * Math.abs(r3()); let p = 0; for (let k = 0; k < tau * 6 * sr && i + k < n3; k++) { const s = k / sr; p += TAU * f * (1 + 0.15 * s / tau) / sr; cv[i + k] += A * Math.sin(p) * Math.exp(-s / tau); } } }
    crepita(cv, sr, r3, 0, 2.6, 90, 1.1, 0.5, 900); for (let i = 0; i < n3; i++) cv[i] *= fim(i / sr, 2.8); biq(cv, 'lp', 2400, 0.7, sr); for (let i = 0; i < n3 && Math.round(0.05 * sr) + i < o.length; i++) o[Math.round(0.05 * sr) + i] += cv[i] * 0.2;
  }, (X, c) => { const r2 = rng(c ? 2301 : 2302), n = Math.round(5.5 * sr), q = biq(biq(ruido(n, r2), 'lp', 260, 0.7, sr), 'lp', 260, 0.7, sr), i0 = Math.round(1.0 * sr); for (let i = 0; i < n && i0 + i < X.length; i++) { const t = i / sr; X[i0 + i] += q[i] * 0.7 * Math.min(1, t / 0.5) * Math.exp(-t / 1.1) * fim(t, 5.5); } },
  { rt: 1.2, am: 0.6, esp: 1.2, wet: 0.18 }); }

function impGranada(sr) { const r = rng(12304);
  return estereo(sr, 2.7, (o) => {
    /* detonação seca de alta pressão no convés */ choque(o, sr, 0, 0.0026, 1.2); rajada(o, sr, r, 0, 0.08, 'hp', 2000, 0.7, 0.9, 0.0002, 0.006); rajada(o, sr, r, 0, 0.3, 'bp', 1200, 0.6, 0.65, 0.0005, 0.035); baque(o, sr, 0, 96, 56, 0.04, 0.07, 0.55, 0.3, 0, 0.0008); rajada(o, sr, r, 0.002, 0.6, 'lp', 2500, 0.7, 0.25, 0.002, 0.08);
  }, (X, c) => { /* tilintar granular: centenas de fragmentos ricocheteando em anteparas e sensores (pan aleatório por fragmento) */ const r2 = rng(c ? 3301 : 3302), rp = rng(3399); let nfr = 0;
    for (let j = 0; j < 320; j++) { const t = 0.006 + 1.7 * Math.pow((rp() + 1) / 2, 2.4), pan = rp(), gc = c ? (1 + pan) / 2 : (1 - pan) / 2, A = (0.03 + 0.11 * Math.abs(rp())) * Math.exp(-t / 0.55) * Math.sqrt(gc) * 1.4, tipo = (rp() + 1) / 2; nfr++;
      if (tipo < 0.14) { let p = 0; const d = 0.06 + 0.09 * (rp() + 1) / 2, f0 = 3200 + 2200 * (rp() + 1) / 2; add(X, sr, t, d, (s) => { p += TAU * f0 * (1 - 0.6 * s / d) / sr; return Math.sin(p) * A * 0.8 * Math.sin(Math.PI * s / d); }); } /* ricochete "pwing" */
      else { const f = tipo > 0.9 ? 8500 + 3000 * (rp() + 1) / 2 : 2500 + 6500 * (rp() + 1) / 2; modo(X, sr, t, f, 0.006 + 0.034 * (rp() + 1) / 2, A, rp() * 3, 0.0002); modo(X, sr, t, f * 1.47, 0.012, A * 0.4, 0, 0.0002); rajada(X, sr, r2, t, 0.01, 'hp', 4000, 0.7, A * 0.5, 0.0001, 0.0015); } }
    void nfr; },
  { rt: 0.65, am: 0.3, esp: 0.8, wet: 0.13 }); }

function lancMissil(sr) { const r = rng(12305);
  return estereo(sr, 4.9, (o) => {
    /* SOCO pneumático: ar comprimido ejetando o míssil do tubo (thump + chuff + clank do contêiner) */ baque(o, sr, 0, 72, 38, 0.05, 0.085, 1.0, 0.3, 0.1, 0.0015); rajada(o, sr, r, 0, 0.35, 'bp', 420, 0.6, 1.1, 0.002, 0.042); rajada(o, sr, r, 0.004, 0.5, 'lp', 1200, 0.7, 0.55, 0.004, 0.12); [340, 780, 1460].forEach((f, k) => modo(o, sr, 0.002, f, 0.12, 0.13, k));
    /* ignição (110 ms) */ const ti = 0.11; choque(o, sr, ti, 0.0012, 0.55); rajada(o, sr, r, ti, 0.1, 'hp', 1500, 0.7, 0.6, 0.0003, 0.01);
  }, (X, c) => { /* RUGIDO contínuo do motor-foguete: chiado largo + ronco 250 Hz + sub + crepitar (por canal = largo), partida afastando (passa-baixa caindo) */ const r2 = rng(c ? 5301 : 5302), ti = 0.11, n = Math.round((4.9 - ti) * sr);
    const h = biq(ruido(n, r2), 'lp', 6000, 0.6, sr), m = biq(biq(ruido(n, r2), 'bp', 250, 0.5, sr), 'lp', 600, 0.7, sr), s = biq(biq(ruido(n, r2), 'lp', 90, 0.7, sr), 'lp', 90, 0.7, sr), cr = new Float32Array(n); crepita(cr, sr, r2, 0, n / sr, 130, 0.5, 99, 800);
    const i0 = Math.round(ti * sr); let lp = 0; for (let i = 0; i < n && i0 + i < X.length; i++) { const t = i / sr, env = Math.min(1, t / 0.04) * (t < 1.9 ? 1 : Math.exp(-(t - 1.9) / 1.1)), fc = t < 1.9 ? 6000 : 1200 + 4800 * Math.exp(-(t - 1.9) / 0.8), a = 1 - Math.exp(-TAU * fc / sr); const v = h[i] * 0.42 + m[i] * 1.7 + s[i] * 2.6 + cr[i]; lp += a * (v - lp); X[i0 + i] += lp * env * 1.5; } },
  { rt: 0.9, am: 0.3, esp: 1.3, wet: 0.12 }); }

function lancGranada(sr) { const r = rng(12306);
  return estereo(sr, 1.7, (o) => {
    /* BAQUE do tubo: pressão (choque) + corpo grave 82→52 Hz + ressonância do tubo + culatra metálica + gás da boca */ choque(o, sr, 0, 0.004, 1.0); baque(o, sr, 0, 82, 52, 0.04, 0.11, 1.05, 0.32, 0.1, 0.0008);
    [[168, 0.09, 0.35], [341, 0.07, 0.22], [517, 0.05, 0.14], [702, 0.04, 0.08]].forEach(([f, tau, g], k) => modo(o, sr, 0.0005, f, tau, g, k));
    [1240, 2210, 3480].forEach((f, k) => { modo(o, sr, 0, f, 0.05, 0.12, k); modo(o, sr, 0.062, f * 0.93, 0.04, 0.07, k); }); /* culatra + recuo */
    rajada(o, sr, r, 0.001, 0.4, 'lp', 900, 0.7, 0.6, 0.001, 0.09); rajada(o, sr, r, 0, 0.12, 'hp', 3000, 0.7, 0.22, 0.0003, 0.04);
  }, () => {}, { rt: 0.6, am: 0.3, esp: 1.0, wet: 0.1 }); }


/** TORPEDO sob a quilha do jogador (v1.2.29): baque hidráulico + colapso de água + cavitação — SÓ RUÍDO (sem senoide/modo/Minnaert afinado). */
function impTorpedoST(sr) { const r = rng(24501);
  return estereoST(sr, 6.4, (o) => {
    /* v1.2.29 Fiscal: baque hidráulico — energia dominante <60 Hz (≥50% no mix) */ choque(o, sr, 0, 0.005, 0.35);
    grave(o, sr, r, 0, 2.2, 32, 2.4, 0.006, 0.55); /* SUB 32 Hz dominante */
    grave(o, sr, r, 0.008, 2.6, 22, 1.8, 0.02, 0.85); /* infra 22 Hz */
    grave(o, sr, r, 0.015, 1.8, 48, 1.1, 0.03, 0.5); /* corpo <60 */
    rajada(o, sr, r, 0, 2.0, 'lp', 95, 0.7, 0.55, 0.015, 0.6); /* ruído só sub */
    const n0 = Math.round(1.4 * sr), b = biq(biq(ruido(n0, r), 'lp', 420, 0.7, sr), 'lp', 180, 0.7, sr); for (let i = 0; i < n0; i++) { const t = i / sr; o[i] += b[i] * 0.45 * Math.min(1, t / 0.006) * Math.exp(-t / 0.32); }
    /* estrutura tremendo: ronco <60 Hz em ruído */ const n1 = Math.round(6.2 * sr), rr = biq(biq(ruido(n1, r), 'lp', 55, 0.7, sr), 'lp', 55, 0.7, sr), tb = biq(biq(ruido(n1, r), 'lp', 7, 0.7, sr), 'lp', 7, 0.7, sr);
    let tm = 0; for (let i = 0; i < n1; i++) tm = Math.max(tm, Math.abs(tb[i])); for (let i = 0; i < n1; i++) { const t = i / sr, m = 0.55 + 0.45 * tb[i] / (tm || 1); o[i] += rr[i] * 2.2 * m * Math.min(1, t / 0.05) * Math.exp(-t / 1.6) * fim(t, 6.2); }
    /* colapso de água — abafado, menos mid */ const tc = 0.85, n2 = Math.round(5.5 * sr), w = biq(biq(ruido(n2, r), 'lp', 280, 0.7, sr), 'lp', 160, 0.7, sr); const ic = Math.round(tc * sr);
    for (let i = 0; i < n2 && ic + i < o.length; i++) { const t = i / sr, env = (t < 0.7 ? Math.pow(t / 0.7, 1.6) : Math.exp(-(t - 0.7) / 1.0)) * fim(t, 5.5); o[ic + i] += w[i] * 1.1 * env; }
    graos(o, sr, r, tc, 3.5, 50, 1.0, 0.18, 180, 600, 0.006, 0.03);
    crepita(o, sr, r, 0.05, 2.6, 80, 0.1, 0.9, 900); graos(o, sr, r, 0.05, 2.4, 100, 0.9, 0.08, 250, 900, 0.003, 0.018);
  }, (X, c) => { const r2 = rng(c ? 24511 : 24512); const n = Math.round(5.4 * sr), q = biq(biq(ruido(n, r2), 'lp', 90, 0.7, sr), 'lp', 90, 0.7, sr), i0 = Math.round(1.0 * sr);
    for (let i = 0; i < n && i0 + i < X.length; i++) { const t = i / sr; X[i0 + i] += q[i] * 0.85 * Math.min(1, t / 0.5) * Math.exp(-t / 1.1) * fim(t, 5.4); } },
  { seed: 24520, rt: 1.2, wet: 0.18, lp: 900 }); }

/* ===================== v1.2.24 item 1: IMPACTO NO NAVIO DO JOGADOR SEM TOM (granadas e mísseis) =====================
 * Só RUÍDO moldado: nenhuma senoide, modo ressonante, varredura tonal, pente/reverb Schroeder (que colore) ou oscilador afinado — nada de sino/gongo.
 *  · onda de choque de Friedlander (transiente forte, banda larga) · GRAVE cheio = ruído passa-baixa (sem altura definida) · estampido/estilhaços =
 *    grãos de ruído curtíssimos em instantes aleatórios (Poisson) · chapa RASGANDO = atrito irregular (impulsos Poisson) em banda larga (Q ≤ 1) ·
 *    destroços = rajadas esparsas · cauda = ruído seguindo a energia do som seco (difusa, sem modos). */
/** grave cheio sem altura: ruído passa-baixa (2× biquad) normalizado, ataque a, decaimento tau */
function grave(o, sr, r, t0, dur, fc, g, a, tau) { const n = Math.round(dur * sr), y = biq(biq(ruido(n, r), 'lp', fc, 0.6, sr), 'lp', fc, 0.6, sr); let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(y[i])); const i0 = Math.round(t0 * sr); for (let i = 0; i < n && i0 + i < o.length; i++) { const t = i / sr; o[i0 + i] += (y[i] / (m || 1)) * g * Math.min(1, t / a) * Math.exp(-t / tau) * fim(t, dur); } }
/** grãos de ruído (estilhaços/fragmentos batendo no aço): dens grãos/s decaindo em tauD; cada grão 0,3–3 ms, hp variável — cliques secos, sem altura */
function graos(o, sr, r, t0, dur, dens, tauD, g, hp0, hp1, lmin = 0.0003, lmax = 0.003) { const n = Math.round(dur * sr), y = new Float32Array(n), w = new Float32Array(n), z = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr; if ((r() + 1) / 2 < dens / sr * Math.exp(-t / tauD)) { const L = Math.round((lmin + (lmax - lmin) * Math.pow((r() + 1) / 2, 2)) * sr), A = (0.25 + 0.75 * Math.pow(Math.abs(r()), 0.5)) * Math.exp(-t / (tauD * 1.6)), tq = Math.max(1, L * (0.15 + 0.25 * (r() + 1) / 2)), alto = (r() + 1) / 2 < 0.55; for (let k = 0; k < L && i + k < n; k++) { const e = A * Math.min(1, k / 3) * Math.exp(-k / tq); if (alto) y[i + k] += e * r(); else w[i + k] += e * r(); } } }
  biq(y, 'hp', hp1, 0.7, sr); biq(w, 'hp', hp0, 0.7, sr); for (let i = 0; i < n; i++) z[i] = y[i] + w[i] * 0.8; const i0 = Math.round(t0 * sr); for (let i = 0; i < n && i0 + i < o.length; i++) o[i0 + i] += z[i] * g; }
/** chapa RASGANDO / estrutura cedendo: impulsos de atrito em intervalos IRREGULARES (Poisson, sem periodicidade → sem altura), banda larga Q 0,8, envelope em rajadas */
function rasgo(o, sr, r, t0, dur, dens, fc, g, tauE) { const n = Math.round(dur * sr), y = new Float32Array(n); const am = biq(biq(ruido(n, r), 'lp', 9, 0.7, sr), 'lp', 9, 0.7, sr); let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(am[i]));
  for (let i = 0; i < n; i++) { const t = i / sr; const k = 0.35 + 0.65 * Math.max(0, am[i] / (m || 1) + 0.4); if ((r() + 1) / 2 < dens * k / sr) { const L = Math.round((0.0004 + 0.0025 * (r() + 1) / 2) * sr), A = 0.5 + 0.5 * Math.abs(r()); for (let j = 0; j < L && i + j < n; j++) y[i + j] += A * r() * Math.exp(-j / (L * 0.35)); } y[i] += r() * 0.18 * k; }
  biq(y, 'bp', fc, 0.8, sr); biq(y, 'hp', fc * 0.35, 0.7, sr); const i0 = Math.round(t0 * sr); for (let i = 0; i < n && i0 + i < o.length; i++) { const t = i / sr; o[i0 + i] += y[i] * g * Math.min(1, t / 0.01) * Math.exp(-t / tauE) * fim(t, dur); } }
/** destroços: rajadas esparsas de ruído (metal no convés = banda média-alta; peças pesadas = passa-baixa) */
function destrocos(o, sr, r, t0, dur, nQ, g) { for (let j = 0; j < nQ; j++) { const t = t0 + dur * Math.pow((r() + 1) / 2, 0.8), gg = g * (0.4 + 0.6 * (r() + 1) / 2) * Math.exp(-(t - t0) / (dur * 0.7)); if ((r() + 1) / 2 < 0.6) { choque(o, sr, t, 0.0005, gg * 0.6); rajada(o, sr, r, t, 0.05, 'bp', 1800 + 2600 * (r() + 1) / 2, 0.7, gg, 0.0002, 0.008 + 0.012 * (r() + 1) / 2); } else rajada(o, sr, r, t, 0.12, 'lp', 260 + 300 * (r() + 1) / 2, 0.7, gg * 1.3, 0.001, 0.03); } }
/** cauda difusa SEM modos: ruído (semente do canal) modulado pela energia do som seco (seguidor de envelope, liberação ~ rt) — no lugar do reverb de pentes */
function caudaDifusa(x, sr, seed, rt, wet, lp) { const n = x.length, r = rng(seed), nz = biq(biq(ruido(n, r), 'lp', lp, 0.7, sr), 'hp', 70, 0.7, sr); const rel = Math.exp(-6.9 / (rt * sr)), at = Math.exp(-1 / (0.004 * sr)); let e = 0, s = 0; const o = new Float32Array(n);
  let mn = 0; for (let i = 0; i < n; i++) mn += nz[i] * nz[i]; mn = Math.sqrt(mn / n) || 1; for (let i = 0; i < n; i++) { const a = Math.abs(x[i]); e = a > e ? a + (e - a) * at : e * rel; s = s * 0.999 + e * 0.001; o[i] = nz[i] / mn * (0.6 * e + 0.4 * s) * wet; } return o; }
function estereoST(sr, dur, seco, porCanal, cd) { const n = Math.round(dur * sr), C = new Float32Array(n); seco(C); const out = [];
  for (let c = 0; c < 2; c++) { const X = Float32Array.from(C); porCanal(X, c); const W = caudaDifusa(X, sr, cd.seed + c * 101, cd.rt, cd.wet, cd.lp); for (let i = 0; i < n; i++) X[i] += W[i]; out.push(X); } return out; }

/** GRANADA DE CANHÃO no casco do jogador (127 mm de referência): golpe/penetração seca + detonação HE + estilhaços + chapa rasgando + destroços. */
function impCanhaoST(sr) { const r = rng(24101);
  return estereoST(sr, 3.6, (o) => {
    choque(o, sr, 0, 0.0009, 0.75); rajada(o, sr, r, 0, 0.03, 'hp', 3500, 0.7, 0.7, 0.0001, 0.003); /* v1.2.29 Fiscal headroom */
    const t1 = 0.006; choque(o, sr, t1, 0.0055, 1.15); rajada(o, sr, r, t1, 0.25, 'lp', 9000, 0.7, 1.0, 0.0002, 0.018); rajada(o, sr, r, t1, 0.7, 'lp', 1600, 0.7, 0.7, 0.002, 0.12); /* detonação HE: choque + estampido */
    grave(o, sr, r, t1, 1.2, 70, 1.25, 0.002, 0.16); grave(o, sr, r, t1 + 0.01, 1.6, 38, 0.8, 0.012, 0.32); /* grave cheio sem altura */
    graos(o, sr, r, t1 + 0.002, 1.2, 1400, 0.16, 0.42, 1500, 4000); /* estilhaços contra anteparas */ rasgo(o, sr, r, 0.05, 1.1, 650, 1300, 0.42, 0.35); /* chapa rasgando */ destrocos(o, sr, r, 0.35, 2.2, 14, 0.3);
  }, (X, c) => { const r2 = rng(c ? 24111 : 24112); graos(X, sr, r2, 0.01, 1.0, 500, 0.2, 0.22, 2000, 5000); }, { seed: 24120, rt: 0.9, wet: 0.32, lp: 3200 }); }
/** MÍSSIL no casco do jogador: impacto cinético + detonação da ogiva + queima do combustível + estilhaços + estrutura rasgando + destroços. */
function impMissilST(sr) { const r = rng(24201);
  return estereoST(sr, 5.8, (o) => {
    /* v1.2.29 Fiscal: FASE 1 — impacto cinético (~0–90 ms) */ choque(o, sr, 0, 0.0014, 0.95); rajada(o, sr, r, 0, 0.09, 'hp', 2800, 0.7, 0.85, 0.0002, 0.012); rajada(o, sr, r, 0, 0.18, 'bp', 900, 0.6, 0.7, 0.0005, 0.035); grave(o, sr, r, 0, 0.35, 110, 0.55, 0.001, 0.05);
    /* VALE audível ~90–180 ms (quase silêncio entre cinético e ogiva) */
    const t1 = 0.18; /* FASE 2 — detonação da ogiva após vale */ choque(o, sr, t1, 0.01, 1.2); rajada(o, sr, r, t1, 0.5, 'lp', 7500, 0.7, 0.95, 0.0004, 0.055); rajada(o, sr, r, t1, 1.8, 'lp', 1300, 0.7, 0.7, 0.004, 0.38);
    grave(o, sr, r, t1, 2.4, 55, 1.35, 0.005, 0.45); grave(o, sr, r, t1 + 0.025, 2.8, 30, 0.9, 0.025, 0.75);
    { const t2 = t1 + 0.12, n2 = Math.round(5.2 * sr), q = biq(ruido(n2, r), 'lp', 720, 0.6, sr), q2 = biq(biq(ruido(n2, r), 'bp', 190, 0.5, sr), 'lp', 400, 0.7, sr), tb = biq(biq(ruido(n2, r), 'lp', 7, 0.7, sr), 'lp', 7, 0.7, sr);
      let tm = 0; for (let i = 0; i < n2; i++) tm = Math.max(tm, Math.abs(tb[i])); const i2 = Math.round(t2 * sr); for (let i = 0; i < n2 && i2 + i < o.length; i++) { const t = i / sr, env = Math.min(1, t / 0.25) * (t < 1.7 ? 1 : Math.exp(-(t - 1.7) / 0.85)) * fim(t, 5.2), m = 0.55 + 0.45 * tb[i] / (tm || 1); o[i2 + i] += (q[i] * 1.4 + q2[i] * 2.0) * env * m * 0.5; } crepita(o, sr, r, t2, 3.0, 50, 0.2, 1.2, 1800); }
    graos(o, sr, r, t1 + 0.004, 1.6, 1400, 0.22, 0.35, 1400, 3800); rasgo(o, sr, r, t1 + 0.05, 2.2, 480, 1100, 0.45, 0.8); rasgo(o, sr, r, t1 + 0.45, 2.0, 280, 2300, 0.28, 0.9); destrocos(o, sr, r, t1 + 0.25, 3.0, 18, 0.28);
  }, (X, c) => { const r2 = rng(c ? 24211 : 24212); const n = Math.round(5.2 * sr), q = biq(ruido(n, r2), 'bp', 2400, 0.5, sr), i0 = Math.round(0.32 * sr); for (let i = 0; i < n && i0 + i < X.length; i++) { const t = i / sr; X[i0 + i] += q[i] * 0.1 * Math.min(1, t / 0.2) * (t < 1.4 ? 1 : Math.exp(-(t - 1.4) / 0.7)) * fim(t, 5.2); } graos(X, sr, r2, 0.2, 1.3, 400, 0.3, 0.18, 2000, 5000); },
  { seed: 24220, rt: 1.4, wet: 0.28, lp: 2600 }); }
/** GRANADA (lança-granadas/morteiro/foguete) no convés do jogador: detonação seca de alta pressão + chuva de estilhaços + chapa rasgando, grave curto e cheio. */
function impGranadaST(sr) { const r = rng(24301);
  return estereoST(sr, 2.9, (o) => {
    choque(o, sr, 0, 0.0028, 1.1); rajada(o, sr, r, 0, 0.08, 'hp', 2000, 0.7, 0.8, 0.0002, 0.006); /* v1.2.29 Fiscal headroom */ rajada(o, sr, r, 0, 0.3, 'bp', 1200, 0.6, 0.65, 0.0005, 0.035); rajada(o, sr, r, 0.002, 0.6, 'lp', 2500, 0.7, 0.3, 0.002, 0.08);
    grave(o, sr, r, 0, 0.9, 85, 1.2, 0.0015, 0.1); grave(o, sr, r, 0.006, 1.2, 45, 0.7, 0.01, 0.2); /* grave cheio e curto */
    graos(o, sr, r, 0.004, 1.6, 2400, 0.3, 0.5, 1600, 4500); /* centenas de fragmentos batendo no aço (cliques secos) */ rasgo(o, sr, r, 0.03, 0.8, 600, 1600, 0.3, 0.25); destrocos(o, sr, r, 0.25, 1.8, 10, 0.24);
  }, (X, c) => { const r2 = rng(c ? 24311 : 24312); graos(X, sr, r2, 0.006, 1.5, 900, 0.35, 0.3, 2000, 5500); }, { seed: 24320, rt: 0.6, wet: 0.25, lp: 3600 }); }
/** Camada do LOCAL atingido no navio do jogador (granada/míssil) — mesma ideia da zonaImpacto da 1.2.22, só que SEM TOM (ruído moldado). */
function zonaST(z) { return (sr) => { const r = rng(24400 + ZONAS_J.indexOf(z) * 13); const dur = z === 'linha' ? 2.9 : 2.5;
  return estereoST(sr, dur, (o) => { choque(o, sr, 0, 0.0006, 0.6); rajada(o, sr, r, 0, 0.012, 'hp', 6000, 0.7, 0.6, 0.0001, 0.002);
    if (z === 'proa' || z === 'popa') { const f = z === 'proa' ? 1 : 0.85; rasgo(o, sr, r, 0.01, 1.1, 700, 900 * f, 0.55, 0.32); grave(o, sr, r, 0, 0.6, 120 * f, 0.6, 0.002, 0.09); destrocos(o, sr, r, 0.3, 1.6, 8, 0.25); } /* chapa do casco amassando e rasgando */
    else if (z === 'ponte') { graos(o, sr, r, 0.005, 1.2, 2600, 0.22, 0.45, 2600, 6000, 0.0002, 0.006); rajada(o, sr, r, 0, 0.25, 'bp', 1300, 0.7, 0.4, 0.0005, 0.05); destrocos(o, sr, r, 0.2, 1.5, 12, 0.2); } /* vidro estilhaçando + estrutura leve */
    else if (z === 'torre') { choque(o, sr, 0.001, 0.0018, 0.9); rajada(o, sr, r, 0, 0.06, 'hp', 2500, 0.7, 0.8, 0.0001, 0.008); grave(o, sr, r, 0, 0.5, 160, 0.7, 0.001, 0.06); rasgo(o, sr, r, 0.02, 0.6, 500, 2000, 0.3, 0.2); } /* blindagem: golpe duro e seco */
    else if (z === 'linha') { grave(o, sr, r, 0, 1.6, 60, 1.0, 0.003, 0.35); rajada(o, sr, r, 0, 1.3, 'lp', 320, 0.7, 0.5, 0.004, 0.4); rajada(o, sr, r, 0.15, 2.5, 'lp', 650, 0.7, 0.22, 0.2, 1.2); graos(o, sr, r, 0.2, 2.4, 160, 1.2, 0.14, 300, 900, 0.004, 0.02); } /* água entrando (jorro e borbulho em ruído) */
    else if (z === 'mastro') { rasgo(o, sr, r, 0.01, 1.0, 400, 700, 0.4, 0.4); destrocos(o, sr, r, 0.1, 1.6, 14, 0.28); } /* estrutura alta cedendo + peças caindo */
    else if (z === 'maquinas') { grave(o, sr, r, 0, 1.4, 75, 0.9, 0.004, 0.3); rajada(o, sr, r, 0.25, 1.8, 'lp', 420, 0.7, 0.5, 0.05, 0.6); rajada(o, sr, r, 0.3, 1.6, 'bp', 2400, 0.5, 0.12, 0.05, 0.6); destrocos(o, sr, r, 0.1, 1.2, 6, 0.2); } /* pancada abafada + vapor */
    else if (z === 'paiol') { for (let i = 0; i < 12; i++) { const t = 0.25 + Math.pow((r() + 1) / 2, 0.8) * 1.6; choque(o, sr, t, 0.001, 0.3 + 0.3 * (r() + 1) / 2); rajada(o, sr, r, t, 0.05, 'bp', 900 + 2200 * (r() + 1) / 2, 0.6, 0.35, 0.0002, 0.012); } grave(o, sr, r, 0.28, 1.5, 55, 0.9, 0.01, 0.35); } /* munição cozinhando */
  }, () => {}, { seed: 24480 + ZONAS_J.indexOf(z), rt: 0.7, wet: 0.25, lp: 3000 }); }; }
const ZONAS_J = ['proa', 'popa', 'ponte', 'torre', 'linha', 'mastro', 'maquinas', 'paiol'];

export const NOMES_JOGADOR = ['ij:canhao', 'ij:missil', 'ij:torpedo', 'ij:granada', 'lj:missil', 'lj:granada', ...ZONAS_J.map((z) => 'zj:' + z)]; /* v1.2.24: + camadas de LOCAL sem tom do jogador */
const FN = { 'ij:canhao': impCanhaoST, 'ij:missil': impMissilST, 'ij:torpedo': impTorpedoST, 'ij:granada': impGranadaST, 'lj:missil': lancMissil, 'lj:granada': lancGranada, ...Object.fromEntries(ZONAS_J.map((z) => ['zj:' + z, zonaST(z)])) }; /* v1.2.24 item 1: granada/míssil no jogador SEM TOM (impCanhao/impMissil/impGranada da 1.2.23 ficam só como referência) */ void impCanhao; void impMissil; void impGranada; void impTorpedo;
/** gera um som (estéreo [L, R], pico 0,9 sem ceifar) */
export function geraJogador(nome, sr) { let [L, R] = FN[nome](sr); if (/^zj:|^ij:(canhao|missil|granada|torpedo)$/.test(nome)) { L = biq(L, 'lp', 11000, 0.6, sr); R = biq(R, 'lp', 11000, 0.6, sr); } /* v1.2.29 Fiscal: pico ≤ −1 dBFS (0,89) */ return fecha(L, R, sr, 0.89, nome === 'lj:granada' ? 0.15 : 0.3); }
