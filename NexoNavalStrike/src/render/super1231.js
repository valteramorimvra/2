// v1.2.31 — CASARIA/MASTROS de alto detalhe dos 3 navios (procedural; formas conferidas contra as fotos de referência só para checagem, nada importado).
import * as THREE from 'three';
import { V, Kit } from './geo1231.js';

/** ctx: { id, S, M, g, Z(zb), dY(z), mDk(z), P(layout) } → { exaustao:{y,zc}, passadico:{y,zc,len}, yTopo, zTopo } */
export function montaSuper1231(ctx) {
  const k = Kit(ctx.g, ctx.M); const r = ctx.id === 'sejong' ? sejong(k, ctx) : ctx.id === 'nanchang' ? nanchang(k, ctx) : nakhimov(k, ctx); k.reg.forEach((b, i) => k.facetar(b, i + 1)); microAntenas(k); detalheConves(k, ctx); k.railsFim(); return r;
}

/** micro-detalhe de topo: chicotes (VHF/UHF), caixas de acoplamento, luzes de navegação e holofotes nos cantos do teto de cada bloco da casaria */
function microAntenas(k) { const { M } = k; let sd = 17; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  k.reg.forEach((b) => { const n = b.B.length; for (const i of [1, 7, 3, 5]) { if (R() < 0.35) continue; const p = b.B[i], cx = b.B.reduce((a, q) => a + q[0], 0) / n, cz = b.B.reduce((a, q) => a + q[1], 0) / n; const x = p[0] + (cx - p[0]) * 0.18, z = p[1] + (cz - p[1]) * 0.18; const h = 2.5 + R() * 5;
      k.cx(x, b.y1, z, 0.35, 0.3, 0.35, M.escuro); k.antena(x, b.y1 + 0.3, z, h, 0.022); if (R() < 0.5) k.cv(x + 0.5, b.y1, z, 0.12, 0.12, 1.1 + R(), M.escuro, 6); if (R() < 0.4) { k.cv(x - 0.6, b.y1, z, 0.25, 0.3, 0.5, M.escuro, 8); k.domo(x - 0.6, b.y1 + 0.5, z, 0.28); } } }); }
/** equipamento de convés nas bordas (cabeços, ventilações, casulos de balsa, armários, guinchos), fora de qualquer casaria, arma, heliponto ou zona de CIWS */
function detalheConves(k, c) {
  const { M, Z, dY, mDk, S } = c; const L = S.L; const ex = []; for (const b of S.blocos) ex.push([b.z0 - 2, b.z1 + 2]);
  for (const q of S.ciws || []) ex.push([q.zb - 4.5, q.zb + 4.5]); for (const zb of S.canhao.zb) ex.push([zb - 5, zb + 5]); if (S.heli) ex.push([S.heli.zb0 - 3, L]); ex.push([0, 9], [L - 6, L]);
  if (S.vls) for (const v of S.vls) ex.push([v.zb - 1, v.zb + (v.n / (v.col || 8)) * (v.cs || 1.2) + 2]);
  let sd = 5; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  for (let zb = 10; zb < L - 8; zb += 5.2 + R() * 3.4) { if (ex.some(([a, b]) => zb > a && zb < b)) continue; const z = Z(zb); const y = dY(z); const hw = mDk(z);
    for (const sg of [-1, 1]) { const x = sg * (hw - 1.15 - R() * 0.5), t = Math.floor(R() * 6);
      if (t === 0) { k.cv(x, y, z, 0.2, 0.26, 0.5, M.escuro, 8); k.cv(x, y + 0.5, z, 0.3, 0.2, 0.12, M.escuro, 8); k.cv(x, y, z + 1.4, 0.2, 0.26, 0.5, M.escuro, 8); k.cv(x, y + 0.5, z + 1.4, 0.3, 0.2, 0.12, M.escuro, 8); }
      else if (t === 1) { k.cv(x, y, z, 0.3, 0.34, 1.0, M.sup, 8); k.cv(x, y + 1.0, z, 0.55, 0.3, 0.3, M.sup, 8); k.cx(x, y + 0.3, z, 0.1, 0.5, 0.5, M.escuro); }
      else if (t === 2) { k.cv(x, y + 0.2, z, 0.3, 0.3, 1.2, M.claro, 10); k.cx(x, y, z, 0.7, 0.2, 1.9, M.escuro); k.cx(x, y + 0.2, z - 0.55, 0.1, 0.4, 0.1, M.escuro); }
      else if (t === 3) { k.cx(x, y, z, 1.3, 1.1, 1.0, M.sup); k.placa && 0; k.cx(x - sg * 0.66, y + 0.2, z, 0.04, 0.7, 0.6, M.escuro); }
      else if (t === 4) { k.cv(x, y, z, 0.55, 0.6, 0.4, M.escuro, 10); k.cv(x, y + 0.4, z, 0.2, 0.2, 0.6, M.sup, 8); k.cx(x, y + 0.45, z, 0.9, 0.1, 0.12, M.escuro); }
      else { k.cx(x, y, z, 1.6, 0.35, 1.0, M.escuro); k.cx(x, y + 0.35, z, 1.2, 0.8, 0.7, M.claro); } } }
}
const yBase = (c, z0, z1) => Math.min(c.dY(c.Z(z0)), c.dY(c.Z(z1))) - 0.25;

/** janelas em faixa (textura de vidraça) em uma face, com moldura escura fina acima e abaixo */
function faixaJanelas(k, b, i, f, w, h) { k.placa(b, i, f, 0, w, h, k.M.janela); }
/** fileira de vigias redondas (textura repetida) */
function vigias(k, b, i, f, w, h = 0.9) { const rep = Math.max(2, Math.round(w / 2.4)); k.placa(b, i, f, 0, w, h, k.M.vigia, { rep }); }
function portas(k, b, i, f, us, h = 2.0, w = 1.0) { for (const u of us) k.placa(b, i, f, u, w, h, k.M.porta); }

/* ===================================================================================== SEJONG */
function sejong(k, c) {
  const { M, Z, dY, mDk } = c; const out = {};
  const hw = (zb, f) => mDk(Z(zb)) * f;
  /* ---- casaria avante (passadiço + SPY-1D): 3 degraus ---- */
  const y1 = yBase(c, 49, 91), zc1 = Z(70);
  const T1 = k.bloco({ y: y1, h: 8.4, hw: hw(70, 0.9), thw: hw(70, 0.82), z0: Z(49), z1: Z(91), tz0: Z(51.6), tz1: Z(89), c: 3.0, tc: 2.4 });
  const T2 = k.bloco({ y: T1.y1, h: 6.0, hw: hw(70, 0.74), thw: hw(70, 0.64), z0: Z(53), z1: Z(84), tz0: Z(55), tz1: Z(82.2), c: 2.2, tc: 1.8 });
  const BR = k.bloco({ y: T2.y1, h: 2.7, hw: hw(70, 0.7), thw: hw(70, 0.6), z0: Z(53.4), z1: Z(70.5), tz0: Z(56), tz1: Z(69), c: 2.0, tc: 1.6 });
  /* teto do passadiço com beiral */ k.bloco({ y: BR.y1, h: 0.22, hw: hw(70, 0.62), z0: Z(54.6), z1: Z(69.8), c: 1.8, mat: M.escuro });
  /* caixa de exaustão preta (ICS) no teto do T2 */ const EX1 = k.bloco({ y: T2.y1, h: 3.0, hw: hw(78, 0.34), thw: hw(78, 0.30), z0: Z(72.5), z1: Z(83.2), tz0: Z(73.2), tz1: Z(82.4), c: 1.0, mat: M.escuro });
  for (const i of [2, 6]) k.placa(EX1, i, 0.55, 0, 7.5, 1.6, M.grade);
  /* janelas do passadiço: proa e laterais + vigias dos conveses */
  faixaJanelas(k, BR, 0, 0.5, hw(70, 0.6) * 2 * 0.75, 1.35); faixaJanelas(k, BR, 1, 0.5, 3.0, 1.35); faixaJanelas(k, BR, 7, 0.5, 3.0, 1.35); faixaJanelas(k, BR, 2, 0.5, 9.5, 1.35); faixaJanelas(k, BR, 6, 0.5, 9.5, 1.35);
  vigias(k, T2, 0, 0.55, 12, 0.9); vigias(k, T2, 2, 0.55, 18, 0.9); vigias(k, T2, 6, 0.55, 18, 0.9); vigias(k, T1, 2, 0.34, 22, 0.9); vigias(k, T1, 6, 0.34, 22, 0.9);
  portas(k, T1, 2, 0.28, [-14, -6, 11], 2.0); portas(k, T1, 6, 0.28, [-14, -6, 11], 2.0); portas(k, T2, 2, 0.3, [-9, 7], 1.9); portas(k, T2, 6, 0.3, [-9, 7], 1.9);
  /* 4 painéis SPY-1D octogonais (placas planas) nos cantos/faces do bloco T1 */
  const R = 4.2; for (const i of [1, 7, 3, 5]) k.painelFace(T1, i, 0.58, 0, R, true, M.pnl);
  escadasExt(k, [[T1, [12, -12]], [T2, [8, -8]], [BR, [4, -4]]], 6);
  /* escadas externas e corrimãos */
  k.escada(hw(60, 0.9) + 0.1, y1, Z(51.6) + 1, 3.3, 0); k.escada(-hw(60, 0.9) - 0.1, y1, Z(51.6) + 1, 3.3, 0);
  for (const s of [-1, 1]) { k.rail([[s * hw(70, 0.8), Z(52)], [s * hw(70, 0.8), Z(90)]], T1.y1 - 0.05, 1.05); k.rail([[s * hw(70, 0.64), Z(55)], [s * hw(70, 0.64), Z(82)]], T2.y1 - 0.05, 1.05); }
  k.rail([[-hw(70, 0.8), Z(52)], [hw(70, 0.8), Z(52)]], T1.y1 - 0.05, 1.05);
  /* asas do passadiço e holofotes/ópticas */
  for (const s of [-1, 1]) { k.cx(s * hw(70, 0.7), BR.y0 + 0.2, Z(62), 3.4, 0.28, 8.5, M.sup); k.cv(s * hw(70, 0.78), BR.y1 + 0.35, Z(55.5), 0.32, 0.32, 0.8, M.escuro, 8); }
  /* mastro principal: torre piramidal facetada + treliça + vergas (≈50 m sobre a linha d'água) */
  const zm = Z(c.S.mastro.zb), yM = BR.y1 + 0.35; const TW = k.bloco({ y: yM, h: 7.5, hw: 2.1, thw: 1.45, z0: zm - 2.9, z1: zm + 2.9, tz0: zm - 1.5, tz1: zm + 1.5, c: 0.9, tc: 0.6, mat: M.sup });
  vigias(k, TW, 0, 0.35, 2.6, 0.6); k.painelFace(TW, 4, 0.55, 0, 1.6, true, M.claro);
  const yP = TW.y1; k.cx(0, yP, zm, 4.6, 0.28, 4.6, M.sup); k.rail([[-2.3, zm - 2.3], [2.3, zm - 2.3], [2.3, zm + 2.3], [-2.3, zm + 2.3], [-2.3, zm - 2.3]], yP + 0.28, 1.0);
  const yTop = 44; const H = 44 - yP; k.mastroTreliça({ y0: yP + 0.28, z: zm, H, b0: 1.4, b1: 0.5, niveis: 9, r: 0.13, plat: [[0.2, 5.2, 12], [0.4, 4.4, 11], [0.58, 3.8, 9], [0.74, 3.2, 8], [0.88, 2.4, 5]], vergas: [[0.33, 13], [0.5, 9.5], [0.66, 6.5]], topo: 7, seed: 11 });
  /* radar de busca giratório (contrato 'radar') no alto do mastro */
  { const rd = k.radarBarra('radar', 0, yP + 0.28 + H * 0.88 + 0.2, zm, 4.2, 1.1); estruturaRadar(k, rd, 4.2, 1.1); }
  /* antenas de chicote do T2 */
  for (const [zb, x] of [[80, 3.0], [80, -3.0], [75, 4.6], [75, -4.6]]) k.antena(x, T2.y1, Z(zb), 14 + (zb % 7), 0.05);
  /* ---- casaria à ré (hangar baixo + bloco alto com Goalkeeper) ---- */
  const y2 = yBase(c, 88, 114);
  const A1 = k.bloco({ y: y2, h: 7.4, hw: hw(101, 0.9), thw: hw(101, 0.84), z0: Z(88), z1: Z(114), tz0: Z(89.5), tz1: Z(112.4), c: 2.6, tc: 2.2 });
  const A2 = k.bloco({ y: A1.y1, h: 5.2, hw: hw(101, 0.7), thw: hw(101, 0.6), z0: Z(91), z1: Z(109.5), tz0: Z(93), tz1: Z(107.5), c: 2.0, tc: 1.6 });
  const EX2 = k.bloco({ y: A2.y1, h: 2.6, hw: hw(96, 0.34), thw: hw(96, 0.3), z0: Z(91.5), z1: Z(101.5), tz0: Z(92.2), tz1: Z(100.8), c: 1.0, mat: M.escuro });
  for (const i of [2, 6]) k.placa(EX2, i, 0.55, 0, 6.5, 1.4, M.grade);
  vigias(k, A2, 2, 0.5, 11, 0.9); vigias(k, A2, 6, 0.5, 11, 0.9); vigias(k, A1, 2, 0.4, 16, 0.9); vigias(k, A1, 6, 0.4, 16, 0.9); portas(k, A1, 2, 0.3, [-7, 0, 7], 2.0); portas(k, A1, 6, 0.3, [-7, 0, 7], 2.0);
  for (const s of [-1, 1]) { k.rail([[s * hw(101, 0.6), Z(93)], [s * hw(101, 0.6), Z(108)]], A2.y1 - 0.05, 1.05); k.rail([[s * hw(101, 0.84), Z(90)], [s * hw(101, 0.84), Z(112)]], A1.y1 - 0.05, 1.05); }
  /* mastro de ré (poste curto em treliça com antenas) + chicotes */
  { const zr = Z(106), yr = A2.y1; k.trelica(0, yr, zr, 9, 0.6, 0.22, 4, 0.07); k.cx(0, yr + 5.5, zr, 4.4, 0.18, 0.3, M.sup); k.cx(0, yr + 9.0, zr, 0.5, 0.5, 0.5, M.claro); k.antena(-1.8, yr, Z(94), 16, 0.05); k.antena(1.8, yr, Z(94), 19, 0.05);
    for (const s of [-1, 1]) { k.cv(s * 3.6, yr, Z(105), 0.4, 0.4, 0.9, M.aa, 8); k.domo(s * 3.6, yr + 0.9, Z(105), 0.4); } }
  /* ---- hangar duplo + convés de voo ---- */
  const y3 = yBase(c, 114, 144);
  const HG = k.bloco({ y: y3, h: 4.3, hw: hw(129, 0.94), thw: hw(129, 0.9), z0: Z(114), z1: Z(144), tz0: Z(114.8), tz1: Z(143.6), c: 2.2, tc: 2.0 });
  const hwH = hw(143.6, 0.9); for (const s of [-1, 1]) { k.placa(HG, 4, 0.46, s * hwH * 0.46, hwH * 0.86, 3.3, M.hangar); }
  k.placa(HG, 4, 0.05, 0, 0.3, 4.2, M.escuro); vigias(k, HG, 2, 0.6, 16, 0.8); vigias(k, HG, 6, 0.6, 16, 0.8); portas(k, HG, 2, 0.4, [-9, 10], 1.9); portas(k, HG, 6, 0.4, [-9, 10], 1.9);
  for (const s of [-1, 1]) k.rail([[s * hw(129, 0.9), Z(116)], [s * hw(129, 0.9), Z(144)]], HG.y1 - 0.05, 1.05);
  /* guarda-corpos do convés de voo + rede de segurança */
  for (const s of [-1, 1]) k.rail([[s * (hw(150, 0.97) - 0.2), Z(144)], [s * (hw(166, 0.97) - 0.2), Z(166)]], dY(Z(155)), 1.0);
  /* botes salva-vidas/RHIB ao lado do T1/A1 e balsas */
  for (const s of [-1, 1]) { k.bote(s * (hw(96, 0.78)), A1.y0 + 0.1 + 0.0, Z(97), 0, 0.9); k.cv(s * (hw(85, 0.97) - 0.2), dY(Z(85)), Z(85), 0.35, 0.35, 1.0, M.bote, 8); }
  k.guindaste(hw(100, 0.97) - 0.4, dY(Z(100)), Z(100), 0, 3.4, 6);
  /* proa: âncora/escovém, cabrestante, apara-mar, cabo de reboque */
  k.cv(0, dY(Z(12)), Z(12), 0.75, 0.9, 1.3, M.escuro, 12); k.cv(0, dY(Z(18)), Z(18), 0.6, 0.7, 1.0, M.escuro, 10); for (const s of [-1, 1]) k.cx(s * hw(6, 0.7), dY(Z(6)), Z(6), 0.9, 0.2, 1.3, M.escuro);
  for (const s of [-1, 1]) k.rail([[s * (hw(2, 0.98) - 0.2), Z(2)], [s * (hw(30, 0.98) - 0.2), Z(30)], [s * (hw(60, 0.98) - 0.2), Z(49)]], dY(Z(20)), 1.0);
  /* mastro de popa do convés: pau-de-bandeira fica no modelo base */
  Object.assign(out, { exaustao: { y: EX2.y1, zc: (EX2.A[0][1] + EX2.A[4][1]) / 2 }, passadico: { y: BR.y1, zc: Z(61.7), len: 17 }, yTopo: yTop + 8.0, topoMasts: yTop + 8.0 });
  return out;
}

/* ===================================================================================== NANCHANG (Tipo 055) */
function nanchang(k, c) {
  const { M, Z, dY, mDk } = c; const hw = (zb, f) => mDk(Z(zb)) * f;
  const y1 = yBase(c, 63, 112);
  const B1 = k.bloco({ y: y1, h: 7.2, hw: hw(88, 0.9), thw: hw(88, 0.8), z0: Z(63), z1: Z(112), tz0: Z(66.5), tz1: Z(109.5), c: 4.2, tc: 3.6 });
  const B2 = k.bloco({ y: B1.y1, h: 6.4, hw: hw(78, 0.66), thw: hw(78, 0.46), z0: Z(67), z1: Z(90), tz0: Z(72), tz1: Z(86.5), c: 3.0, tc: 2.4 });
  const B3 = k.bloco({ y: B2.y1, h: 3.8, hw: hw(78, 0.44), thw: hw(78, 0.34), z0: Z(71.5), z1: Z(87), tz0: Z(75), tz1: Z(84.5), c: 2.2, tc: 1.8 });
  const B4 = k.bloco({ y: B1.y1, h: 4.6, hw: hw(101, 0.62), thw: hw(101, 0.5), z0: Z(91), z1: Z(110), tz0: Z(93), tz1: Z(108), c: 2.6, tc: 2.2 });
  /* torre integrada do mastro (pirâmide facetada) + plataforma + mastro de topo */
  const zm = Z(c.S.mastro.zb); const TW = k.bloco({ y: B3.y1, h: 9.0, hw: 3.4, thw: 1.7, z0: zm - 4.4, z1: zm + 4.4, tz0: zm - 2.4, tz1: zm + 2.4, c: 1.6, tc: 1.0 });
  const yT = TW.y1; k.cx(0, yT, zm, 3.4, 0.25, 3.4, M.sup); const Hm = (42 - yT) - 5.0; k.trelica(0, yT + 0.25, zm, Hm, 0.55, 0.22, 5, 0.07);
  const yA = yT + 0.25 + Hm; k.cv(0, yA, zm, 0.08, 0.16, 7.5, M.claro, 6); k.cx(0, yA + 2.6, zm, 2.2, 0.22, 0.4, M.claro); k.cx(0, yA + 5.2, zm, 1.2, 0.2, 0.3, M.claro);
  /* painéis AESA planos: 4 grandes (faces chanfradas do 2º degrau) e 4 menores na torre */
  for (const i of [1, 7, 3, 5]) k.painelFace(B2, i, 0.5, 0, 4.8, false, M.pnlR, { alt: 4.1 });
  for (const i of [0, 2, 4, 6]) k.painelFace(TW, i, 0.42, 0, 3.3, false, M.pnlR, { alt: 3.6 });
  for (const i of [1, 3, 5, 7]) k.painelFace(B3, i, 0.5, 0, 2.2, false, M.painel, { alt: 1.8 });
  /* janelas de ponte, vigias e portas */
  k.placa(B3, 0, 0.5, 0, 7.8, 1.4, M.janela); k.placa(B3, 2, 0.5, 0, 6.5, 1.3, M.janela); k.placa(B3, 6, 0.5, 0, 6.5, 1.3, M.janela); k.placa(B3, 1, 0.5, 0, 3.0, 1.3, M.janela); k.placa(B3, 7, 0.5, 0, 3.0, 1.3, M.janela);
  vigias(k, B1, 2, 0.45, 26, 0.9); vigias(k, B1, 6, 0.45, 26, 0.9); portas(k, B1, 2, 0.3, [-15, -5, 9, 16], 2.0); portas(k, B1, 6, 0.3, [-15, -5, 9, 16], 2.0);
  vigias(k, B4, 2, 0.5, 14, 0.9); vigias(k, B4, 6, 0.5, 14, 0.9);
  /* 2 exaustões furtivas (caixas escuras com grelha) */
  for (const [a, b] of [[91.5, 97.5], [103.5, 109]]) { const EX = k.bloco({ y: B4.y1, h: 1.9, hw: hw(100, 0.4), thw: hw(100, 0.36), z0: Z(a), z1: Z(b), tz0: Z(a + 0.5), tz1: Z(b - 0.5), c: 1.0, mat: M.escuro }); for (const i of [2, 6]) k.placa(EX, i, 0.5, 0, (b - a) - 1.5, 1.0, M.grade); out0.ex = EX; }
  /* antenas, ESM, domos */
  for (const [zb, x] of [[97, 5], [97, -5], [108, 4.5], [108, -4.5]]) k.antena(x, B4.y1, Z(zb), 9 + (zb % 5), 0.045);
  k.domo(hw(84, 0.4), B3.y1 + 0.1, Z(84), 0.8); k.domo(-hw(84, 0.4), B3.y1 + 0.1, Z(84), 0.8);
  { const rd = k.radarBarra('radar', 0, yT + 0.25 + Hm * 0.5, zm + 2.8, 3.0, 0.8); estruturaRadar(k, rd, 3.0, 0.8); }
  escadasExt(k, [[B1, [14, -14]], [B2, [6, -6]], [B4, [5, -5]]], 6);
  /* hangar duplo à ré */
  const y3 = yBase(c, 128, 153); const HG = k.bloco({ y: y3, h: 6.6, hw: hw(140, 0.92), thw: hw(140, 0.86), z0: Z(128), z1: Z(153), tz0: Z(129.5), tz1: Z(152.6), c: 3.4, tc: 3.0 });
  const HU = k.bloco({ y: HG.y1, h: 1.6, hw: hw(146, 0.5), thw: hw(146, 0.42), z0: Z(141), z1: Z(151), tz0: Z(142), tz1: Z(150), c: 1.6 });
  const hwH = hw(152.6, 0.86); for (const s of [-1, 1]) k.placa(HG, 4, 0.42, s * hwH * 0.46, hwH * 0.86, 4.6, M.hangar); k.placa(HG, 4, 0.05, 0, 0.3, 6.4, M.escuro);
  vigias(k, HG, 2, 0.55, 14, 0.8); vigias(k, HG, 6, 0.55, 14, 0.8); portas(k, HG, 2, 0.4, [-7, 7], 2.0); portas(k, HG, 6, 0.4, [-7, 7], 2.0);
  k.cv(hw(135, 0.55), HG.y1, Z(131), 0.5, 0.5, 1.2, M.claro, 8); k.domo(hw(135, 0.55), HG.y1 + 1.2, Z(131), 1.1); k.cv(-hw(135, 0.55), HG.y1, Z(131), 0.5, 0.5, 1.2, M.claro, 8); k.domo(-hw(135, 0.55), HG.y1 + 1.2, Z(131), 1.1);
  k.antena(hw(146, 0.4), HU.y1, Z(148), 7, 0.04); k.antena(-hw(146, 0.4), HU.y1, Z(148), 8, 0.04);
  /* corrimãos */
  for (const s of [-1, 1]) { k.rail([[s * hw(88, 0.8), Z(67)], [s * hw(88, 0.8), Z(109)]], B1.y1 - 0.05); k.rail([[s * hw(101, 0.5), Z(94)], [s * hw(101, 0.5), Z(108)]], B4.y1 - 0.05); k.rail([[s * hw(140, 0.86), Z(130)], [s * hw(140, 0.86), Z(152)]], HG.y1 - 0.05); k.rail([[s * (hw(165, 0.97) - 0.2), Z(153)], [s * (hw(179, 0.97) - 0.2), Z(179)]], dY(Z(165)), 1.0); k.rail([[s * (hw(2, 0.98) - 0.2), Z(2)], [s * (hw(30, 0.98) - 0.2), Z(30)], [s * (hw(60, 0.98) - 0.2), Z(62)]], dY(Z(20)), 1.0); }
  /* botes, balsas, âncora, cabrestante */
  for (const s of [-1, 1]) { k.bote(s * hw(118, 0.84), dY(Z(118)) + 0.1, Z(118), 0, 0.9); k.cv(s * (hw(66, 0.97) - 0.3), dY(Z(66)), Z(66), 0.35, 0.35, 1.0, M.bote, 8); }
  k.cv(0, dY(Z(13)), Z(13), 0.7, 0.85, 1.2, M.escuro, 12); k.cv(0, dY(Z(19)), Z(19), 0.6, 0.7, 1.0, M.escuro, 10);
  return { exaustao: { y: B4.y1 + 1.9, zc: Z(100) }, passadico: { y: B3.y1, zc: Z(79), len: 15 }, yTopo: yA + 7.5 };
}
/** escadas externas de quebra-peito nos recuos: pé no chão do bloco, na face lateral i (2 BE / 6 BB), deslocadas u m ao longo da face — só onde a face é praticamente vertical */
function escadasExt(k, lista, alt = 6.5) { for (const [b, us] of lista) for (const i of [2, 6]) for (const u of us) { const Fp = k.face(b, i, 0.0), top = k.face(b, i, 1.0); if (Math.abs(top.p.x - Fp.p.x) > 0.5) continue; const sg = i === 2 ? 1 : -1; k.escada(Fp.p.x + sg * 0.12, b.y0 + 0.1, Fp.p.z + (i === 2 ? -u : u), Math.min(b.h - 0.4, alt), sg > 0 ? Math.PI / 2 : -Math.PI / 2, 0.6); } }
/** fachadas do Nakhimov: portas nas faces de proa/popa, faixas de janelas dos conveses, escadas externas de quebra-peito nos recuos (tudo calculado por face) */
function fachadasNakhimov(k, B) { const { NA, NB, N1, N2, N3, NT, NT2, NT3, NU } = B; const F = k.M;
  for (const [b, f, w, us] of [[NT, 0.14, 1.0, [-7, -3, 3, 7]], [NT2, 0.14, 1.0, [-5, 0, 5]], [NT3, 0.14, 1.0, [-3, 3]], [NA, 0.14, 1.0, [-6, 6]], [NB, 0.14, 1.0, [-5, 5]]]) { for (const i of [0, 4]) portas(k, b, i, f, us, 1.9, w); }
  for (const [b, w] of [[NT2, 14], [NT3, 10]]) for (const i of [0, 4]) { faixaJanelas(k, b, i, 0.55, w, 1.2); faixaJanelas(k, b, i, 0.82, w, 1.0); }
  for (const [b, w] of [[N1, 11], [N2, 11]]) { faixaJanelas(k, b, 0, 0.5, w, 1.2); faixaJanelas(k, b, 4, 0.5, w, 1.2); }
  /* escadas externas entre conveses (pés na base de cada bloco, no recuo) */
  escadasExt(k, [[NT, [7, -7]], [NT2, [5, -5]], [NT3, [4, -4]], [NA, [9, -9]], [NB, [6, -6]], [N1, [4, -4]], [N2, [4, -4]]]);
}
/** estrutura de radar de refletor: moldura (4 barras com profundidade), nervuras traseiras, colunas de apoio, caixa de alimentação — dá espessura e estrutura reais (tudo filhos diretos do grupo 'radar*' → fundidos por material) */
function estruturaRadar(k, rd, larg, alt, zs = [0], y0 = 0.7) { const { M } = k; const add = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.sup); m.position.set(x, y, z); m.castShadow = true; rd.add(m); return m; };
  for (const z of zs) { add(larg + 0.2, 0.2, 0.42, 0, y0 + alt + 0.1, z + 0.12); add(larg + 0.2, 0.2, 0.42, 0, y0 + 0.1, z + 0.12); for (const sx of [-1, 1]) add(0.2, alt, 0.42, sx * (larg / 2 + 0.05), y0 + alt / 2, z + 0.12); }
  const zb = Math.max(...zs) + 0.42; for (let q = 1; q <= 3; q++) add(larg, 0.1, 0.14, 0, y0 + alt * q / 4, zb); for (const q of [-1, -0.33, 0.33, 1]) add(0.1, alt, 0.14, q * larg * 0.45, y0 + alt / 2, zb);
  add(0.5, 0.6, 0.6, 0, y0 + alt * 0.5, zb + 0.35); add(0.18, alt * 0.9, 0.18, 0, y0 + alt * 0.5, zb + 0.15); }
const out0 = {};

/* ===================================================================================== NAKHIMOV (Kirov modernizado) */
function nakhimov(k, c) {
  const { M, Z, dY, mDk } = c; const hw = (zb, f) => mDk(Z(zb)) * f;
  const y1 = yBase(c, 102, 131);
  const NA = k.bloco({ y: y1, h: 4.6, hw: hw(116, 0.84), thw: hw(116, 0.8), z0: Z(102), z1: Z(131), tz0: Z(103), tz1: Z(130), c: 3.0, tc: 2.8 });
  const NB = k.bloco({ y: NA.y1, h: 4.4, hw: hw(116, 0.7), thw: hw(116, 0.66), z0: Z(104.5), z1: Z(129), tz0: Z(105.5), tz1: Z(128), c: 2.8, tc: 2.4 });
  const N1 = k.bloco({ y: NB.y1, h: 4.2, hw: hw(116, 0.58), thw: hw(116, 0.52), z0: Z(106.5), z1: Z(127.5), tz0: Z(107.5), tz1: Z(126.5), c: 2.4, tc: 2.0 });
  /* conveses-passarela nos recuos (borda de ~0.9 m com corrimão) */
  for (const [b0, b1, f, za, zb2] of [[NA, NB, 0.84, 102, 131], [NB, N1, 0.7, 104.5, 129]]) { const w = 2 * hw(116, f) - 0.2, d = (zb2 - za) - 0.4; k.cx(0, b0.y1 - 0.12, Z((za + zb2) / 2), w, 0.16, d, M.sup); for (const sd of [-1, 1]) { k.rail([[sd * (w / 2 - 0.1), Z(za + 0.4)], [sd * (w / 2 - 0.1), Z(zb2 - 0.4)]], b0.y1 + 0.04, 1.0); } k.rail([[-(w / 2 - 0.1), Z(za + 0.4)], [w / 2 - 0.1, Z(za + 0.4)]], b0.y1 + 0.04, 1.0); k.rail([[-(w / 2 - 0.1), Z(zb2 - 0.4)], [w / 2 - 0.1, Z(zb2 - 0.4)]], b0.y1 + 0.04, 1.0); }
  vigias(k, NA, 2, 0.5, 26, 0.9); vigias(k, NA, 6, 0.5, 26, 0.9); vigias(k, NB, 2, 0.5, 22, 0.9); vigias(k, NB, 6, 0.5, 22, 0.9); portas(k, NB, 2, 0.12, [-8, 2, 8], 2.0); portas(k, NB, 6, 0.12, [-8, 2, 8], 2.0);
  const N2 = k.bloco({ y: N1.y1, h: 7.2, hw: hw(116, 0.62), thw: hw(116, 0.52), z0: Z(106), z1: Z(126), tz0: Z(108), tz1: Z(124.5), c: 2.4, tc: 2.0 });
  const N3 = k.bloco({ y: N2.y1, h: 3.6, hw: hw(116, 0.42), thw: hw(116, 0.34), z0: Z(109), z1: Z(122), tz0: Z(110.5), tz1: Z(121), c: 1.8, tc: 1.6 });
  k.bloco({ y: N3.y1, h: 0.3, hw: hw(116, 0.44), z0: Z(108.4), z1: Z(122.6), c: 1.8, mat: M.escuro });
  /* torre central em 4 PATAMARES com recuo (sem pirâmide lisa): cada patamar tem convés-passarela com corrimão no recuo */
  const NT = k.bloco({ y: y1, h: 9, hw: hw(140, 0.66), thw: hw(140, 0.65), z0: Z(127), z1: Z(153), tz0: Z(127.6), tz1: Z(152.4), c: 3.4, tc: 3.2 });
  const NT2 = k.bloco({ y: NT.y1, h: 7.5, hw: hw(140, 0.55), thw: hw(140, 0.54), z0: Z(130), z1: Z(150.5), tz0: Z(130.5), tz1: Z(150), c: 3.0, tc: 2.8 });
  const NT3 = k.bloco({ y: NT2.y1, h: 7.0, hw: hw(140, 0.44), thw: hw(140, 0.43), z0: Z(132.5), z1: Z(148), tz0: Z(133), tz1: Z(147.5), c: 2.6, tc: 2.4 });
  const NU = k.bloco({ y: NT3.y1, h: 7.5, hw: hw(140, 0.32), thw: hw(140, 0.31), z0: Z(135), z1: Z(145), tz0: Z(135.4), tz1: Z(144.6), c: 2.0, tc: 1.9 });
  for (const [b0, f, za, zb2] of [[NT, 0.66, 127, 153], [NT2, 0.55, 130, 150.5], [NT3, 0.44, 132.5, 148]]) { const w = 2 * hw(140, f) - 0.2, d = (zb2 - za) - 0.4; k.cx(0, b0.y1 - 0.12, Z((za + zb2) / 2), w, 0.16, d, M.sup); for (const sd of [-1, 1]) k.rail([[sd * (w / 2 - 0.1), Z(za + 0.4)], [sd * (w / 2 - 0.1), Z(zb2 - 0.4)]], b0.y1 + 0.04, 1.0); k.rail([[-(w / 2 - 0.1), Z(za + 0.4)], [w / 2 - 0.1, Z(za + 0.4)]], b0.y1 + 0.04, 1.0); k.rail([[-(w / 2 - 0.1), Z(zb2 - 0.4)], [w / 2 - 0.1, Z(zb2 - 0.4)]], b0.y1 + 0.04, 1.0); }
  for (const [b0, ff] of [[NT, 0.3], [NT2, 0.45], [NT3, 0.5]]) for (const i of [2, 6]) { portas(k, b0, i, 0.14, [-5, 4], 1.9); k.placa(b0, i, 0.64, 6, 3.0, 1.1, M.grade); }
  for (const i of [1, 7]) { k.domoFace(NT2, i, 0.55, 0, 1.15); k.domoFace(N1, i, 0.7, 0, 0.9); } for (const i of [3, 5]) k.domoFace(NT3, i, 0.55, 0, 1.0); for (const i of [2, 6]) { k.domoFace(NU, i, 0.5, 0, 0.8); k.domoFace(N2, i, 0.55, 3, 0.7); k.domoFace(NT3, i, 0.5, -5, 0.8); }
  /* janelas de ponte e conveses (3 fileiras de vigias nas laterais, como a casaria soviética) */
  k.placa(N3, 0, 0.5, 0, 9.5, 1.5, M.janela); k.placa(N3, 2, 0.5, 0, 9.5, 1.4, M.janela); k.placa(N3, 6, 0.5, 0, 9.5, 1.4, M.janela); k.placa(N3, 1, 0.5, 0, 3.4, 1.4, M.janela); k.placa(N3, 7, 0.5, 0, 3.4, 1.4, M.janela);
  for (const f of [0.35, 0.7]) { vigias(k, N1, 2, f, 20, 0.9); vigias(k, N1, 6, f, 20, 0.9); } vigias(k, N2, 2, 0.5, 15, 0.9); vigias(k, N2, 6, 0.5, 15, 0.9); vigias(k, N2, 0, 0.5, 13, 0.9);
  for (const [bb, wv] of [[NT, 20], [NT2, 18], [NT3, 13]]) for (const f of [0.38, 0.72]) { vigias(k, bb, 2, f, wv, 0.9); vigias(k, bb, 6, f, wv, 0.9); } vigias(k, NU, 2, 0.5, 8, 0.9); vigias(k, NU, 6, 0.5, 8, 0.9); k.placa(NU, 0, 0.55, 0, 6, 1.3, M.janela);
  portas(k, NA, 2, 0.14, [-9, 3, 9], 2.0); portas(k, NA, 6, 0.14, [-9, 3, 9], 2.0);
  /* asas do passadiço e conveses abertos */
  for (const s of [-1, 1]) { k.cx(s * hw(116, 0.52), N2.y1 - 0.2, Z(114), 3.8, 0.3, 11, M.sup); k.rail([[s * (hw(116, 0.52) + 1.9), Z(108.5)], [s * (hw(116, 0.52) + 1.9), Z(119.5)], [s * hw(116, 0.44), Z(119.5)]], N2.y1 + 0.1);
    }
  /* mastro principal: topo da torre piramidal + treliça alta + vergas + radar de busca 2 faces (Top Pair) */
  const zm = Z(c.S.mastro.zb); const yM = NU.y1; k.cx(0, yM, zm, 5.4, 0.3, 4.4, M.sup); const Hm = 62 - yM - 4;
  k.mastroTreliça({ y0: yM + 0.3, z: zm, H: Hm, b0: 1.6, b1: 0.55, niveis: 8, r: 0.13, plat: [[0.18, 6.0, 14], [0.36, 5.0, 12], [0.54, 4.2, 10], [0.9, 3.0, 6]], vergas: [[0.28, 14], [0.46, 10], [0.64, 7]], topo: 7, seed: 23 });
  { const yy = yM + 0.3 + Hm * 0.42; for (const s of [-1, 1]) k.esfera(s * 3.0, yy + 1.0, zm - 1.5, 1.0); }
  { const rd = k.radarBarra('radar', 0, yM + 0.3 + Hm * 0.78, zm, 9.0, 4.2); { const b2 = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.2, 0.16), M.rede || M.escuro); b2.position.set(0, 0.7 + 2.1, 0.62); rd.add(b2); const sp = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.16, 0.7), M.sup); sp.position.set(0, 0.7 + 4.2 + 0.08, 0.3); rd.add(sp); }  for (const x of [-4.5, 4.5, 0]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.14, 4.2, 0.45), M.sup); b.position.set(x, 2.8, 0.15); rd.add(b); } estruturaRadar(k, rd, 9.0, 4.2, [0, 0.62]); }
  const yTop = yM + 0.3 + Hm + 7;
  fachadasNakhimov(k, { NA, NB, N1, N2, N3, NT, NT2, NT3, NU });
  /* mastro de vante do passadiço: treliça curta + radar Top Plate (plataforma giratória 'radar3') + vergas e sensores */
  { const zf = Z(116), yf = N3.y1 + 0.3; k.cx(0, N3.y1, zf, 3.2, 0.3, 3.2, M.sup); const Hf = 15; k.mastroTreliça({ y0: yf, z: zf, H: Hf, b0: 1.1, b1: 0.4, niveis: 5, r: 0.11, plat: [[0.3, 3.6, 8], [0.6, 3.0, 7]], vergas: [[0.45, 8]], topo: 4, seed: 31 });
    const rp = k.radarBarra('radar3', 0, yf + Hf * 0.84, zf, 3.6, 1.3); estruturaRadar(k, rp, 3.6, 1.3); const bk = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.6, 0.1), M.painel); bk.position.set(0, 0.7 + 1.3, 0.3); }
  /* casaria de ré, funil integrado e 2ª torre piramidal */
  const y2 = yBase(c, 150, 178); const NP = k.bloco({ y: y2, h: 9, hw: hw(164, 0.7), thw: hw(164, 0.6), z0: Z(150), z1: Z(178), tz0: Z(152), tz1: Z(176), c: 3.0, tc: 2.6 });
  for (const f of [0.35, 0.7]) { vigias(k, NP, 2, f, 22, 0.9); vigias(k, NP, 6, f, 22, 0.9); } portas(k, NP, 2, 0.12, [-8, 8], 2.0); portas(k, NP, 6, 0.12, [-8, 8], 2.0);
  const EX = k.bloco({ y: NP.y1, h: 2.6, hw: hw(160, 0.44), thw: hw(160, 0.4), z0: Z(155), z1: Z(163), tz0: Z(155.5), tz1: Z(162.5), c: 1.6, mat: M.escuro }); for (const i of [2, 6, 0, 4]) k.placa(EX, i, 0.5, 0, 5.5, 1.5, M.grade);
  const T2 = k.bloco({ y: NP.y1, h: 5.5, hw: hw(170, 0.4), thw: hw(170, 0.39), z0: Z(164), z1: Z(176.5), tz0: Z(164.5), tz1: Z(176), c: 2.2, tc: 2.0 }); const T2b = k.bloco({ y: T2.y1, h: 5.0, hw: hw(170, 0.28), thw: hw(170, 0.27), z0: Z(166.5), z1: Z(174.5), tz0: Z(167), tz1: Z(174), c: 1.6, tc: 1.5 });
  vigias(k, T2, 2, 0.45, 10, 0.9); vigias(k, T2, 6, 0.45, 10, 0.9); vigias(k, T2b, 2, 0.5, 6, 0.9); vigias(k, T2b, 6, 0.5, 6, 0.9); portas(k, T2, 2, 0.15, [-2, 3], 1.9); portas(k, T2, 6, 0.15, [-2, 3], 1.9);
  { const w = 2 * hw(170, 0.4) - 0.2; k.cx(0, T2.y1 - 0.12, Z(170.2), w, 0.16, 11.5, M.sup); for (const sd of [-1, 1]) k.rail([[sd * (w / 2 - 0.1), Z(164.4)], [sd * (w / 2 - 0.1), Z(176)]], T2.y1 + 0.04, 1.0); }
  /* mastro de ré: treliça alta (≈ 20 m) com Top Plate / Fregat ('radar2'), vergas e sensores */
  { const z2 = Z(170.5), y2t = T2b.y1; k.cx(0, y2t, z2, 4.0, 0.25, 4.0, M.sup); const H2 = 20; k.mastroTreliça({ y0: y2t + 0.25, z: z2, H: H2, b0: 1.4, b1: 0.5, niveis: 7, r: 0.12, plat: [[0.3, 4.4, 9], [0.55, 3.6, 8], [0.8, 3.0, 6]], vergas: [[0.42, 9], [0.68, 6]], topo: 5, seed: 41 });
    const r2 = k.radarBarra('radar2', 0, y2t + 0.25 + H2 * 0.7, z2, 7.0, 3.0); estruturaRadar(k, r2, 7.0, 3.0); for (const s of [-1, 1]) { k.cx(s * 2.6, y2t + 3.0, z2, 1.8, 1.0, 1.0, M.claro); k.esfera(s * 3.8, y2t + 0.9, z2 - 1.0, 1.0); } }
  /* hangar sob o heliponto (porta com elevador de aeronaves) */
  const y3 = yBase(c, 190, 206); const HG = k.bloco({ y: y3, h: 5.4, hw: hw(198, 0.8), thw: hw(198, 0.76), z0: Z(190), z1: Z(206), tz0: Z(191), tz1: Z(205.5), c: 2.0, tc: 1.8 });
  const hwH = hw(205.5, 0.76); for (const s of [-1, 1]) k.placa(HG, 4, 0.46, s * hwH * 0.46, hwH * 0.86, 4.0, M.hangar); k.placa(HG, 4, 0.05, 0, 0.3, 5.2, M.escuro); vigias(k, HG, 2, 0.55, 10, 0.8); vigias(k, HG, 6, 0.55, 10, 0.8);
  for (const s of [-1, 1]) { k.rail([[s * hw(198, 0.76), Z(191)], [s * hw(198, 0.76), Z(205)]], HG.y1 - 0.05); k.rail([[s * (hw(228, 0.97) - 0.2), Z(207)], [s * (hw(249, 0.97) - 0.2), Z(250)]], dY(Z(228)), 1.0); k.rail([[s * (hw(2, 0.98) - 0.2), Z(2)], [s * (hw(30, 0.98) - 0.2), Z(30)], [s * (hw(80, 0.98) - 0.2), Z(100)]], dY(Z(20)), 1.05); }
  /* guindastes, botes, balsas, âncoras, cabrestante */
  for (const s of [-1, 1]) { k.bote(s * hw(160, 0.9), dY(Z(120)) - 0.0, Z(140), 0, 1.0); k.guindaste(s * (hw(185, 0.97) - 0.5), dY(Z(185)), Z(185), 0, 5.0, 8); k.cv(s * (hw(100, 0.97) - 0.3), dY(Z(100)), Z(100), 0.4, 0.4, 1.1, M.bote, 8); }
  k.cv(0, dY(Z(8)), Z(8), 0.9, 1.0, 1.5, M.escuro, 12); k.cv(0, dY(Z(16)), Z(16), 0.7, 0.8, 1.1, M.escuro, 10);
  /* moldura do elevador no heliponto (apenas desenho no convés) */
  { const zc = Z(213), m = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), M.hangar); m.rotation.x = -Math.PI / 2; m.position.set(0, dY(zc) + 0.1, zc); m.visible = false; }
  return { exaustao: { y: EX.y1, zc: Z(159) }, passadico: { y: N3.y1, zc: Z(115.5), len: 13 }, yTopo: yTop + 4.5 };
}
