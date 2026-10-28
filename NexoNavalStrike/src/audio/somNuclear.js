// Nexo Naval Strike v1.2.26 — SOM DA DETONAÇÃO NUCLEAR, sintetizado em JS puro (determinístico, sem assets, sem nós de áudio).
// Renderizado UMA vez no carregamento → buffers estéreo enviados ao mixer (ou pool nativo). Nada é criado em combate.
//  nk:estalo    (0,9 s) — CRACK supersônico da frente de choque: onda N de subida quase instantânea + chiado de banda larga + crepitar.
//  nk:estrondo  (7 s)   — BOOM: fase positiva LONGA de Friedlander (0,3 s) + sub-grave 38→22 Hz (o que “empurra o peito”) + harmônicos 50–180 Hz
//                         (saturação suave) para o grave existir também em alto-falante de celular, que não reproduz < 80 Hz.
//  nk:rolamento (14 s)  — CAUDA rolante: trovão grave modulado (ar quente subindo, reflexões em ilhas/nuvem) + ecos discretos + reverberação longa.
// O jogo toca os 3 em sequência com o atraso de propagação d/343 (o estalo chega junto com a frente de choque; o boom logo depois).
const TAU = Math.PI * 2;
function rng(s) { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 2147483648 - 1; }; }
function biq(y, tipo, fc, q, sr) { const w = TAU * Math.min(fc, sr * 0.45) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al; let b0, b1, b2;
  if (tipo === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (tipo === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
  b0 /= a0; b1 /= a0; b2 /= a0; const a1 = -2 * cs / a0, a2 = (1 - al) / a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < y.length; i++) { const x = y[i], v = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = v; y[i] = v; } return y; }
const ruido = (n, r) => { const y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = r(); return y; };
function marrom(n, r) { const y = new Float32Array(n); let a = 0; for (let i = 0; i < n; i++) { a = (a + 0.02 * r()) * 0.998; y[i] = a * 8; } return y; }
/** reverberação Schroeder (4 pentes amortecidos + 2 passa-tudo) */
function reverb(x, sr, rt, amort, esp) { const n = x.length, o = new Float32Array(n); const D = [1557, 1617, 1491, 1422].map((d) => Math.round(d * esp * sr / 44100));
  for (const d of D) { const g = Math.pow(10, -3 * d / sr / rt), b = new Float32Array(d); let k = 0, lp = 0; for (let i = 0; i < n; i++) { const y = b[k]; lp = y * (1 - amort) + lp * amort; b[k] = x[i] + lp * g; k = (k + 1) % d; o[i] += y * 0.25; } }
  for (const d0 of [225, 556]) { const d = Math.round(d0 * esp * sr / 44100), b = new Float32Array(d); let k = 0; for (let i = 0; i < n; i++) { const bv = b[k], v = -0.5 * o[i] + bv; b[k] = o[i] + 0.5 * bv; o[i] = v; k = (k + 1) % d; } } return o; }
const sat = (x, k) => Math.tanh(k * x) / Math.tanh(k);
function normaliza(L, R, pico) { let m = 0; for (let i = 0; i < L.length; i++) { m = Math.max(m, Math.abs(L[i]), Math.abs(R[i])); } const g = m > 0 ? pico / m : 0; for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; } }
/** pedido 02:45 item 6: compressão suave (tanh) com o PICO mantido → mais energia sustentada (grave/rumble) por pico, sem clipping (pico final = o do normaliza). */
function compacta(L, R, drive) { let m = 0; for (let i = 0; i < L.length; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i])); if (!(m > 0)) return; const k = m / Math.tanh(drive); for (let i = 0; i < L.length; i++) { L[i] = Math.tanh(drive * L[i] / m) * k; R[i] = Math.tanh(drive * R[i] / m) * k; } }
function rampas(y, sr, ini = 0.0005, fim = 0.25) { const a = Math.round(ini * sr), b = Math.round(fim * sr), n = y.length; for (let i = 0; i < a && i < n; i++) y[i] *= i / a; for (let i = 0; i < b && i < n; i++) y[n - 1 - i] *= 0.5 - 0.5 * Math.cos(Math.PI * i / b); }

function estalo(sr, s) { const n = Math.round(0.9 * sr), O = [];
  for (let c = 0; c < 2; c++) { const r = rng(s + c * 97), y = new Float32Array(n), hi = biq(ruido(n, r), 'hp', 1800, 0.7, sr);
    for (let i = 0; i < n; i++) { const t = i / sr, x = t / 0.012; const N = t < 0.024 ? (1 - x) : 0; // onda N (+ → −) de 24 ms
      y[i] = 0.9 * N * Math.min(1, t / 0.00012) + hi[i] * 0.55 * Math.exp(-t / 0.05) + hi[i] * 0.12 * Math.exp(-t / 0.35); }
    let k = 0; while (k < n) { k += Math.round(sr * (0.004 + 0.03 * (r() + 1) / 2) * (1 + 6 * k / n)); if (k >= n) break; const g = 0.5 * Math.exp(-k / sr / 0.25) * (0.4 + 0.6 * Math.abs(r())); for (let j = 0; j < 30 && k + j < n; j++) y[k + j] += g * r() * Math.exp(-j / 6); }
    rampas(y, sr, 0.0001, 0.2); O.push(y); }
  const d = Math.round(0.0006 * sr); for (let i = n - 1; i >= d; i--) O[1][i] = 0.85 * O[1][i] + 0.15 * O[1][i - d]; normaliza(O[0], O[1], 0.89); return O; }

function estrondo(sr, s) { const n = Math.round(7 * sr), O = [];
  for (let c = 0; c < 2; c++) { const r = rng(s + 31 + c * 13), y = new Float32Array(n); let p = 0, p2 = 0;
    const rum = biq(biq(ruido(n, r), 'lp', 180, 0.7, sr), 'hp', 40, 0.7, sr), surdo = biq(ruido(n, r), 'lp', 32, 0.9, sr), med = biq(ruido(n, r), 'bp', 420, 0.6, sr);
    for (let i = 0; i < n; i++) { const t = i / sr; const x = t / 0.3; const F = t < 1.8 ? (1 - x) * Math.exp(-1.6 * x) : 0; // Friedlander: positiva 0,3 s + fase negativa (sucção)
      const f = 22 + 16 * Math.exp(-t / 0.9); p += TAU * f / sr; p2 += TAU * (f * 2.6) / sr;
      const env = Math.min(1, t / 0.02) * Math.exp(-t / 2.3);
      y[i] = 0.75 * F * Math.min(1, t / 0.002) + 1.05 * env * Math.sin(p + c * 0.3) + 0.34 * env * Math.sin(p2) + 5.0 * surdo[i] * Math.exp(-t / 3.2) * Math.min(1, t / 0.05)
        + 3.8 * rum[i] * Math.min(1, t / 0.06) * Math.exp(-t / 2.3) + 0.5 * med[i] * Math.exp(-t / 0.35); } /* pedido 02:45 item 6: + sub-grave (0,7→1,05), surdo (3,2→5,0), rumble 40–180 Hz (2,4→3,8) e caudas mais longas */
    // saturação suave: gera harmônicos 2.ª/3.ª do sub-grave (o ouvido reconstrói o fundamental — celular sem graves ainda "sente" o boom)
    let m = 0; for (let i = 0; i < n; i++) m = Math.max(m, Math.abs(y[i])); for (let i = 0; i < n; i++) y[i] = sat(y[i] / m, 2.6); /* item 6: saturação mais densa (antes 1.8) → mais corpo/harmônicos de grave por pico */
    rampas(y, sr, 0.0005, 0.8); O.push(y); }
  compacta(O[0], O[1], 3.0); normaliza(O[0], O[1], 0.89); return O; }

function rolamento(sr, s) { const n = Math.round(14 * sr), O = [];
  for (let c = 0; c < 2; c++) { const r = rng(s + 71 + c * 29), y = new Float32Array(n), b = biq(biq(marrom(n, r), 'lp', 260, 0.7, sr), 'hp', 45, 0.7, sr), g = biq(biq(ruido(n, r), 'lp', 55, 0.8, sr), 'hp', 22, 0.7, sr);
    // modulação lenta "rolando": soma de 3 senoides lentas + rajadas aleatórias (trovão)
    const ph = [r() * 6, r() * 6, r() * 6]; let raj = 0, alvo = 0;
    for (let i = 0; i < n; i++) { const t = i / sr; if (i % 2048 === 0) alvo = Math.max(0, r()) * (r() > 0.6 ? 1.6 : 0.6); raj += (alvo - raj) * 0.0006;
      const mod = 0.55 + 0.25 * Math.sin(TAU * 0.31 * t + ph[0]) + 0.15 * Math.sin(TAU * 0.73 * t + ph[1]) + 0.1 * Math.sin(TAU * 1.7 * t + ph[2]) + 0.5 * raj;
      const env = Math.min(1, t / 0.6) * Math.exp(-t / 5.2); y[i] = env * mod * (3.6 * b[i] + 3.4 * g[i]); } /* item 6: rolamento/trovão mais forte (2,5/2,2 → 3,6/3,4) */
    // ecos discretos (ilhas/costa/base da nuvem): 1,4 s, 2,9 s, 4,7 s, 7,1 s
    for (const [dt, a] of [[1.4, 0.45], [2.9, 0.33], [4.7, 0.24], [7.1, 0.16]]) { const d = Math.round((dt + 0.07 * c) * sr); for (let i = n - 1; i >= d; i--) y[i] += a * y[i - d] * 0.6; }
    const rv = reverb(y, sr, 4.5, 0.55, 1.6); for (let i = 0; i < n; i++) y[i] = 0.6 * y[i] + 0.8 * rv[i]; rampas(y, sr, 0.05, 2.5); O.push(y); }
  compacta(O[0], O[1], 2.6); normaliza(O[0], O[1], 0.85); return O; }

/** nk:coluna (14 s; tempo 0 = início da coluna d'água, ~0,6 s após a rajada): JORRO — rugido de spray subindo (ruído 250–3000 Hz crescendo 0–4 s, com
 *  turbulência), depois DESABAMENTO (8–13 s): milhões de toneladas de água caindo = chuva pesadíssima (crepitar denso de gotas 2–8 kHz) + baque grave da massa
 *  batendo no mar (< 120 Hz) + chiado da base surge que passa. */
function coluna(sr, s) { const n = Math.round(14 * sr), O = [];
  for (let c = 0; c < 2; c++) { const r = rng(s + 5 + c * 41), y = new Float32Array(n); const sp = biq(biq(ruido(n, r), 'hp', 250, 0.7, sr), 'lp', 3000, 0.7, sr), ch = biq(ruido(n, r), 'hp', 2000, 0.7, sr), gr = biq(biq(ruido(n, r), 'lp', 120, 0.8, sr), 'hp', 25, 0.7, sr);
    let tb = 0, alvo = 0; for (let i = 0; i < n; i++) { const t = i / sr; if (i % 1024 === 0) alvo = 0.6 + 0.4 * Math.abs(r()); tb += (alvo - tb) * 0.002;
      const subida = Math.min(1, t / 3.5) * Math.exp(-Math.max(0, t - 4) / 2.5), queda = Math.max(0, Math.min(1, (t - 7.5) / 1.2)) * Math.exp(-Math.max(0, t - 10) / 2.2), surge = Math.max(0, Math.min(1, (t - 3) / 3)) * Math.exp(-Math.max(0, t - 6) / 4);
      y[i] = sp[i] * (0.9 * subida * tb + 0.35 * surge) + ch[i] * (0.55 * queda + 0.12 * subida) + gr[i] * (6 * queda + 2 * subida); }
    let k = Math.round(7.6 * sr); while (k < n) { k += Math.round(sr * (0.0008 + 0.004 * Math.abs(r())) * (1 + 2 * Math.max(0, (k / sr - 10) / 4))); if (k >= n) break; const t = k / sr, e = Math.max(0, Math.min(1, (t - 7.6) / 1)) * Math.exp(-Math.max(0, t - 10) / 2), g = 0.35 * e * (0.3 + 0.7 * Math.abs(r())), f = 1500 + 5000 * Math.abs(r()); let p = 0; for (let j = 0; j < 90 && k + j < n; j++) { p += TAU * f / sr; y[k + j] += g * Math.sin(p) * Math.exp(-j / 18); } }
    const rv = reverb(y, sr, 2.2, 0.4, 1.2); for (let i = 0; i < n; i++) y[i] = 0.75 * y[i] + 0.5 * rv[i]; rampas(y, sr, 0.3, 1.5); O.push(y); }
  normaliza(O[0], O[1], 0.8); return O; }

export const NOMES_NUCLEAR = ['nk:estalo', 'nk:estrondo', 'nk:rolamento', 'nk:coluna'];
/** Gera um som nuclear estéreo [L, R] na taxa sr (pico ≤ 0,89 → sem clipping mesmo somando os 3 com o ganho de distância ≤ 1). */
export function geraNuclear(nome, sr) { if (nome === 'nk:estalo') return estalo(sr, 1226); if (nome === 'nk:estrondo') return estrondo(sr, 2612); if (nome === 'nk:rolamento') return rolamento(sr, 6221); if (nome === 'nk:coluna') return coluna(sr, 1500); throw new Error('som nuclear desconhecido ' + nome); }
