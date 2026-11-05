// v1.2.22 item 2 — SOM DO NAVIO ATINGIDO conforme a ARMA e o LOCAL do impacto (todas as camadas SINTETIZADAS e PRÉ-RENDERIZADAS uma vez no
// carregamento → pool do mixer fixo: 0 nós de áudio em combate). Toca POR CIMA do impacto próprio da arma da 1.2.21 (que continua igual).
//  Local (coordenadas locais do navio, mesma regra de módulos da simulação — naval5v5/avarias.moduloExato):
//   proa/popa → chapa do casco · ponte/superestrutura → vidro e estrutura leve · torre → blindagem (clang) · linha d'água/abaixo → baque fundo +
//   borbulho do alagamento · mastro/chaminé → metal oco · máquinas → estrondo secundário abafado · paiol (bloco de células VLS/SAM) → secundária.
//  Peso pela arma: 'l' (calibre pequeno ≤ 57 mm, foguete, granada) = pings e clangs metálicos; 'p' (médio/grande, míssil, torpedo) = aço pesado + estrondo.
//  Depois do golpe: rangido do metal e destroços caindo (convés e água).
import { moduloExato } from '../naval5v5/avarias.js';
export const ZONAS = ['proa', 'popa', 'ponte', 'torre', 'linha', 'mastro', 'maquinas', 'paiol'];
/** Zona atingida. n = navio da simulação (C, P), hit = { lx, ly, lz } locais (x boreste, y acima da linha d'água, z popa), arma. */
export function zonaDe(n, hit, arma) { if (arma === 'torpedo' || arma === 'rbu' && hit.ly < 0) return 'linha'; const C = n.C, P = n.P || {}; let m = { mod: null };
  try { m = moduloExato(n, hit); } catch (e) {}
  if (m.mod === 'agua') return 'linha'; if (m.mod === 'canhao') return 'torre'; if (m.mod === 'radar') return 'mastro'; if (m.mod === 'ponte') return 'ponte';
  const cel = (P.celulas || []).filter((c) => Number.isFinite(c && c.z)); if (cel.length) { let z0 = 1e9, z1 = -1e9; for (const c of cel) { z0 = Math.min(z0, c.z); z1 = Math.max(z1, c.z); } if (hit.lz > z0 - 2 && hit.lz < z1 + 2 && hit.ly > C.F - 0.8) return 'paiol'; }
  if (m.mod === 'motor') return 'maquinas'; const u = (C.L / 2 - hit.lz) / C.L; return u > 0.5 ? 'proa' : 'popa'; }
/** Peso da arma: 'l' leve / 'p' pesado. */
export const pesoArma = (arma, cal) => arma === 'missil' || arma === 'torpedo' ? 'p' : arma === 'canhao' ? ((cal || 127) >= 76 ? 'p' : 'l') : 'l';
/** Ganho da camada de local (navio do jogador ≈ 1). Secundária só em paiol/máquinas com golpe pesado. */
const GZ = { ponte: 1.7, mastro: 1.45, torre: 1.1 }; /* vidro e metal oco são mais finos: um pouco mais de ganho para ficarem tão presentes quanto a chapa */
export const ganhoZona = (arma, cal, zona) => (GZ[zona] || 1) * (arma === 'missil' ? 1.8 : arma === 'torpedo' ? 1.7 : arma === 'canhao' ? 1.2 + 0.7 * Math.max(0, Math.min(1, ((cal || 127) - 20) / 285)) : 1.3);
const rng = (s) => () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/* modos de placa/barra (razões inarmônicas de chapa de aço) */ const PLACA = [1, 1.59, 2.14, 2.65, 3.6], BARRA = [1, 2.76, 5.4, 8.93];
function sino(A, d, q, f0, R, dur, g, sw = 0.985) { R.forEach((r, i) => A._osc(d, q, dur / (1 + i * 0.45), 'sine', f0 * r, f0 * r * sw, g / (1 + i * 0.7))); }
/** Gráfico da camada de LOCAL (z, peso 'l'|'p') no destino d a partir de q. A = NavalAudio (usa _osc/_ruido, como as demais camadas). */
export function grafoZona(A, z, p, d, q) { const P = p === 'p', r = rng(1222 + ZONAS.indexOf(z) * 7 + (P ? 3 : 0));
  /* golpe comum: estalo do aço (todas as zonas) */ A._ruido(d, q, 0.012, 'highpass', 6000, 4000, P ? 0.9 : 0.75, 0.7); if (P) { A._osc(d, q, 0.45, 'sine', 88, 34, 1.0); A._ruido(d, q, 0.5, 'lowpass', 1100, 110, 0.65); }
  if (z === 'proa' || z === 'popa') { const f = z === 'proa' ? 1 : 0.86; /* CHAPA do casco */
    if (P) { sino(A, d, q, 165 * f, PLACA, 1.4, 0.42); sino(A, d, q + 0.01, 820 * f, BARRA, 0.8, 0.22); A._ruido(d, q + 0.02, 0.9, 'bandpass', 600, 180, 0.35, 1.5); }
    else for (let i = 0; i < 3; i++) { const t = q + [0, 0.07, 0.17][i]; sino(A, d, t, (1150 + 380 * i) * f, BARRA, 0.42, 0.34 - 0.07 * i); A._ruido(d, t, 0.035, 'bandpass', 2600 + 500 * i, 1800, 0.35, 2); } }
  else if (z === 'ponte') { /* VIDRO estilhaçando + estrutura leve (alumínio/aço fino) */ const n = P ? 26 : 14; for (let i = 0; i < n; i++) { const t = q + 0.01 + Math.pow(r(), 1.6) * (P ? 0.9 : 0.6); const f = 3200 + r() * 5200; A._ruido(d, t, 0.008 + r() * 0.02, 'bandpass', f, f * 0.9, (0.3 + 0.35 * r()) * (1 - i / (n * 1.3)), 6); if (i % 3 === 0) A._osc(d, t, 0.12 + r() * 0.2, 'sine', 2600 + r() * 3800, 2500 + r() * 3600, 0.05 + 0.05 * r()); }
    A._ruido(d, q, 0.25, 'bandpass', 1300, 700, P ? 0.6 : 0.42, 1.2); sino(A, d, q, 470, PLACA, P ? 0.7 : 0.45, P ? 0.22 : 0.15); }
  else if (z === 'torre') { /* BLINDAGEM: clang duro e longo (sino de aço grosso) */ sino(A, d, q, P ? 240 : 420, BARRA, P ? 1.9 : 1.2, P ? 0.55 : 0.45, 0.995); sino(A, d, q, P ? 610 : 980, PLACA, P ? 1.1 : 0.7, 0.25, 0.99); A._ruido(d, q, 0.02, 'highpass', 4200, 3000, 0.9, 0.7); A._osc(d, q, 0.25, 'sine', 120, 50, P ? 0.8 : 0.45); }
  else if (z === 'linha') { /* LINHA D'ÁGUA/ABAIXO: baque fundo + água entrando (borbulho do alagamento) */ A._osc(d, q, 1.1, 'sine', 58, 27, P ? 1.25 : 0.85); A._ruido(d, q, 1.3, 'lowpass', 320, 55, P ? 0.75 : 0.5); A._osc(d, q + 0.02, 0.9, 'sine', 120, 60, 0.3); A._ruido(d, q + 0.15, 2.4, 'lowpass', 650, 260, P ? 0.22 : 0.15, 0.8); /* água correndo */
    const nb = P ? 34 : 20; for (let i = 0; i < nb; i++) { const t = q + 0.2 + r() * 2.1, f = 260 + r() * 520; A._osc(d, t, 0.03 + r() * 0.05, 'sine', f, f * (1.6 + r() * 0.8), (0.12 + 0.14 * r()) * (1 - (t - q) / 3)); } }
  else if (z === 'mastro') { /* MASTRO/CHAMINÉ: metal OCO (tubo ressoando) + chocalhar */ A._ruido(d, q, 1.0, 'bandpass', 230, 210, P ? 0.55 : 0.4, 9); A._ruido(d, q, 0.8, 'bandpass', 540, 500, 0.35, 9); sino(A, d, q, 330, [1, 2.4, 4.6], P ? 1.3 : 0.9, P ? 0.4 : 0.3, 0.99); for (let i = 0; i < 6; i++) A._ruido(d, q + 0.12 + i * (0.05 + 0.03 * r()), 0.02, 'bandpass', 1800 + r() * 1500, 1500, 0.18 * (1 - i / 7), 3); }
  else if (z === 'maquinas') { /* MÁQUINAS: pancada abafada pelo casco + estrondo secundário (vapor/óleo) */ A._osc(d, q, 0.8, 'sine', 70, 30, 0.9); A._ruido(d, q + 0.25, 1.8, 'lowpass', 420, 50, P ? 0.6 : 0.35); A._ruido(d, q + 0.3, 1.6, 'bandpass', 2400, 1600, P ? 0.12 : 0.07, 0.6); /* vapor escapando */ for (let i = 0; i < 5; i++) sino(A, d, q + 0.05 + i * 0.09 + r() * 0.05, 700 + r() * 900, BARRA, 0.3, 0.12);
    if (P) { A._osc(d, q + 0.35, 1.3, 'sine', 62, 26, 1.0); A._ruido(d, q + 0.35, 1.2, 'lowpass', 1500, 100, 0.75); } }
  else if (z === 'paiol') { /* PAIOL: munição cozinhando (estampidos irregulares) e, no golpe pesado, SECUNDÁRIA */ for (let i = 0; i < (P ? 16 : 9); i++) { const t = q + 0.25 + Math.pow(r(), 0.8) * 1.6; A._ruido(d, t, 0.03 + r() * 0.03, 'bandpass', 900 + r() * 2200, 600, 0.3 + 0.3 * r(), 1.4); A._osc(d, t, 0.08, 'sine', 140, 60, 0.18); }
    if (P) { A._osc(d, q + 0.28, 1.6, 'sine', 55, 24, 1.15); A._ruido(d, q + 0.28, 1.5, 'lowpass', 2000, 90, 0.85); A._ruido(d, q + 0.3, 0.05, 'highpass', 3000, 2000, 0.6); } } }
/** Rangido do metal + destroços caindo (convés e água). forte = 1 golpe pesado. */
export function grafoRangido(A, forte, d, q) { const r = rng(9122 + (forte ? 1 : 0)), t0 = q + 0.35;
  /* rangido (stick-slip: pulsos curtíssimos com altura variando) */ const n = forte ? 70 : 42; for (let i = 0; i < n; i++) { const t = t0 + i * (0.011 + 0.004 * Math.sin(i * 0.37)), f = 520 + 260 * Math.sin(i * 0.11) + 60 * r(); A._ruido(d, t, 0.006, 'bandpass', f, f, 0.16 * Math.sin(Math.PI * i / n) + 0.02, 7); }
  A._osc(d, t0, n * 0.013, 'sawtooth', 88, 64, 0.035); /* gemido grave da estrutura */
  const nd = forte ? 16 : 9; for (let i = 0; i < nd; i++) { const t = q + 0.5 + Math.pow(r(), 0.7) * (forte ? 2.4 : 1.6), dec = 1 - (t - q) / 3.4; if (r() < 0.7) sino(A, d, t, 900 + r() * 2600, BARRA, 0.12 + r() * 0.18, (0.08 + 0.12 * r()) * dec); else A._ruido(d, t, 0.15, 'bandpass', 1300, 500, 0.12 * dec, 1.2); /* metal no convés / respingo na água */ } }
