// v1.2.31 — casco por estações dos 3 navios lendários (módulo NOVO; mesma técnica de geoCasco, parâmetros reais de dados1231).
import * as THREE from 'three';
import { SPEC, bordaLivre1231, meiaDeck1231 } from '../sim/dados1231.js';
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function geoCasco1231(id) {
  const S = SPEC[id], c = S.casco, { L, B, T } = S, EC = c.esc; const NS = 96, K1 = 12, K = 21; /* K1 linhas abaixo da LA + 9 acima: LA→0,2 m (vermelho), 0,22→1,3 m (preto), resto branco/cinza; as linhas duplicadas dão faixas nítidas */
  const us = []; for (let i = 0; i <= NS; i++) { const s = i / NS; us.push(s < 0.5 ? s * 0.98 : 0.49 + (1 - Math.pow(1 - (s - 0.5) * 2, 1.6)) * 0.51); } us[NS] = 1;
  const bDeck = (u) => meiaDeck1231(id, u) / (B / 2);
  const bWl = (u) => bDeck(u) * (u < 0.52 ? 0.985 : 1 - c.flare * sstep(0.52, 1, u)) * (u < 0.06 ? 0.93 : 1);
  const Tu = (u) => T * (u < 0.12 ? 0.62 + 0.38 * sstep(0, 0.12, u) : u > 0.82 ? 1 - 0.72 * sstep(0.82, 1, u) : 1);
  const fino = (u) => (u < 0.08 ? 0.55 : u < 0.6 ? 1 : 1 - sstep(0.6, 0.97, u)) * c.fino;
  const secao = [];
  for (let i = 0; i <= NS; i++) { const u = us[i]; const z0 = L / 2 - u * L; const T0 = Tu(u), F0 = bordaLivre1231(id, u), bw = bWl(u) * B / 2, f = fino(u), bd = meiaDeck1231(id, u); const Sx = [];
    for (let k = 0; k <= K; k++) { let y, w;
      if (k <= K1) { const e = k / K1; y = -T0 + T0 * e; const U = Math.pow(1 - Math.pow(1 - e, 5), 0.2), V = Math.pow(e, 0.85); w = bw * (f * U + (1 - f) * V); }
      else { const j = k - K1; const yk = (EC === 'rus' ? 0.55 : 0.4) * F0; /* linhas duplicadas = vinco nítido (faixas e quina de proa) */ y = j === 1 ? 0.95 : j === 2 ? 0.97 : j === 3 ? 1.9 : j === 4 ? 1.92 : j === 5 ? 1.92 + (yk - 1.92) * 0.5 : j === 6 || j === 7 ? yk : j === 8 ? yk + (F0 - yk) * 0.5 : F0; const e = y / F0;
        if (EC === 'rus') { const kn = 0.55; w = e < kn ? bw + (bd * 1.03 - bw) * (e / kn) : bd * 1.03 - bd * 0.06 * ((e - kn) / (1 - kn)); /* quina (knuckle) e costado recolhido acima dela */ }
        else { const pf = u > 0.6 ? 0.9 + 1.1 * sstep(0.6, 0.95, u) : 0.9; const kn = sstep(0.7, 0.92, u), g0 = Math.pow(e, pf), g1 = e < 0.4 ? 0.22 * (e / 0.4) : 0.22 + 0.78 * Math.pow((e - 0.4) / 0.6, 0.85); /* quina (knuckle) na proa */ w = bw + (bd - bw) * (g0 * (1 - kn) + g1 * kn); if (e > 0.86 && EC !== 'chn') w -= bd * 0.04 * (e - 0.86) / 0.14; } }
      const zr = z0 + 0.14 * (y + T0) * sstep(0.05, 0, u) - c.rake * L * sstep(0.8, 1, u) * Math.pow((y + T0) / (T0 + F0), 1.7) - (L > 100 ? 0.015 * L * sstep(0.9, 1, u) * Math.max(0, 1 - Math.abs(y + T0 * 0.7) / (T0 * 0.35)) : 0);
      Sx.push([Math.max(0, w), y, zr]); }
    secao.push(Sx); }
  const pos = [], cor = [], uv = [], idx = []; const nV = K + 1;
  const CA = new THREE.Color(EC === 'eua' ? '#a2362c' : EC === 'chn' ? '#b83a2e' : '#b3342a'), CB = new THREE.Color(EC === 'eua' ? '#2b3036' : '#15181c'), CT = new THREE.Color('#ffffff'), cc = new THREE.Color();
  for (let i = 0; i <= NS; i++) for (const lado of [1, -1]) for (let k = 0; k <= K; k++) { const [x, y, z] = secao[i][k]; pos.push(x * lado, y, z); uv.push((L / 2 - z) / 9, (y + T) / 9); cc.copy(y < 0.96 ? CA : y < 1.91 ? CB : CT); { const pc = Math.floor((L / 2 - z) / 4.2), pr = Math.floor((y + T) / 3.1); const hh = Math.sin(pc * 12.9898 + pr * 78.233 + lado * 3.1) * 43758.5453; const vv = 0.93 + 0.14 * (hh - Math.floor(hh)); if (y >= 1.91) { cc.multiplyScalar(vv); cc.r *= 0.78; cc.g *= 0.80; cc.b *= 0.85; /* casco mais escuro e frio que a casaria (contraste) */ } } cor.push(cc.r, cc.g, cc.b); }
  const gid = (i, lado, k) => (i * 2 + (lado > 0 ? 0 : 1)) * nV + k;
  for (let i = 0; i < NS; i++) for (let k = 0; k < K; k++) { const a = gid(i, 1, k), b = gid(i + 1, 1, k), cI = gid(i + 1, 1, k + 1), d = gid(i, 1, k + 1); idx.push(a, b, cI, a, cI, d); const a2 = gid(i, -1, k), b2 = gid(i + 1, -1, k), c2 = gid(i + 1, -1, k + 1), d2 = gid(i, -1, k + 1); idx.push(a2, c2, b2, a2, d2, c2); }
  const costado = new THREE.BufferGeometry(); costado.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); costado.setAttribute('color', new THREE.Float32BufferAttribute(cor, 3)); costado.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); costado.setIndex(idx); costado.computeVertexNormals();
  const dp = [], di = [], du = []; for (let i = 0; i <= NS; i++) { const [x, y, z] = secao[i][K]; dp.push(x, y, z, -x, y, z); du.push(x / 5, (L / 2 - z) / 5, -x / 5, (L / 2 - z) / 5); }
  for (let i = 0; i < NS; i++) { const a = i * 2, b = i * 2 + 1, cI = i * 2 + 2, d = i * 2 + 3; di.push(a, cI, b, b, cI, d); }
  const conves = new THREE.BufferGeometry(); conves.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); conves.setAttribute('uv', new THREE.Float32BufferAttribute(du, 2)); conves.setIndex(di); conves.computeVertexNormals();
  const ep = [], ei = [], ec = [], eu = []; const S0 = secao[0]; S0.forEach(([x, y, z]) => ep.push(x, y, z)); S0.forEach(([x, y, z]) => ep.push(-x, y, z));
  for (let k = 0; k < K; k++) { const a = k, b = k + 1, cI = nV + k, d = nV + k + 1; ei.push(a, b, d, a, d, cI); }
  for (let i = 0; i < ep.length; i += 3) { const y = ep[i + 1]; (y < 0.96 ? CA : y < 1.91 ? CB : CT).toArray(ec, ec.length); if (y >= 1.91) { ec[ec.length - 3] *= 0.78; ec[ec.length - 2] *= 0.8; ec[ec.length - 1] *= 0.85; } eu.push(ep[i] / 12 + 0.5, (y + 4) / 12); }
  const espelho = new THREE.BufferGeometry(); espelho.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); espelho.setAttribute('color', new THREE.Float32BufferAttribute(ec, 3)); espelho.setAttribute('uv', new THREE.Float32BufferAttribute(eu, 2)); espelho.setIndex(ei); espelho.computeVertexNormals();
  /* borda-falsa (bulwark) a partir do trecho de proa: placa fina (externa, interna e topo) ao longo da linha do convés */
  const bp = [], bu = []; const q = (a, b, c2, d) => { for (const p of [a, b, c2, a, c2, d]) { bp.push(p[0], p[1], p[2]); bu.push(p[2] / 6, p[1] / 6); } };
  for (const lado of [1, -1]) for (let i = 0; i < NS; i++) { const u0 = us[i], u1 = us[i + 1]; const hb = (u) => 1.15 * sstep(0.42, 0.9, u) * (u > 0.995 ? 0.5 : 1); if (hb(u0) < 0.05 && hb(u1) < 0.05) continue; const P0 = secao[i][K], P1 = secao[i + 1][K]; const th = 0.14;
    const o0 = [P0[0] * lado, P0[1], P0[2]], o1 = [P1[0] * lado, P1[1], P1[2]], i0 = [(P0[0] - th) * lado, P0[1], P0[2]], i1 = [(P1[0] - th) * lado, P1[1], P1[2]]; const t0 = [o0[0], o0[1] + hb(u0), o0[2]], t1 = [o1[0], o1[1] + hb(u1), o1[2]], j0 = [i0[0], i0[1] + hb(u0), i0[2]], j1 = [i1[0], i1[1] + hb(u1), i1[2]];
    if (lado > 0) { q(o0, o1, t1, t0); q(i1, i0, j0, j1); q(t0, t1, j1, j0); } else { q(o1, o0, t0, t1); q(i0, i1, j1, j0); q(t1, t0, j0, j1); } }
  const bordas = new THREE.BufferGeometry(); bordas.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bordas.setAttribute('uv', new THREE.Float32BufferAttribute(bu, 2)); bordas.computeVertexNormals();
  return { costado, conves, espelho, secao, bordas };
}
