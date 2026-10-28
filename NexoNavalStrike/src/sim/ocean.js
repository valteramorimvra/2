// Oceano: ondas de Gerstner. Os MESMOS parâmetros alimentam o shader (GPU) e a flutuabilidade (JS).
import { G, clamp } from './util.js';
import { alturaGerstner, deslocaGerstner, NW } from '../naval5v5/gerstner.js';

// Escala Beaufort → [amplitude base (m), comprimento de onda base (m)]
const BF = [[0.03, 8], [0.08, 12], [0.22, 20], [0.45, 30], [0.8, 42], [1.25, 55], [1.9, 70]];
export const ONDAS = []; // { dx, dz, A, k, c, Q }
export const MAR = { bf: 3, vento: 0.6 };
/** v1.2.30 nuke1230 item 9: anéis de onda de superfície da detonação. Vazio = custo zero.
 *  { x, z, t0, A0, c, k, rMax, vivo } — amplitude ~ A0/r (água profunda, cilindrico ≈1/r), fase k(r−c·τ). */
export const NUKE_ONDAS = [];

export function defineMar(bf = 3, vento = 0.6) {
  bf = clamp(Math.round(bf), 0, BF.length - 1); MAR.bf = bf; MAR.vento = vento; const [A, L] = BF[bf]; ONDAS.length = 0;
  // 4 trens de onda: principal + 3 secundários em ângulos diferentes (cristas cruzadas, nada de "ondulado de lençol")
  // v1.2.3: + 2 marolas curtas cruzadas (quebram a regularidade e dão textura de mar aberto)
  [[0, 1, 1], [0.55, 0.55, 0.61], [-0.75, 0.38, 0.43], [1.35, 0.2, 0.26], [2.15, 0.1, 0.15], [-1.95, 0.075, 0.11]].slice(0, NW).forEach(([da, fa, fl]) => {
    const a = vento + da, Lw = L * fl, k = (2 * Math.PI) / Lw, Aw = A * fa;
    // v1.1.0: cristas mais agudas — Σ Q·k·A ≈ 0,84 (cúspide sem laçar a malha)
    ONDAS.push({ dx: Math.sin(a), dz: Math.cos(a), A: Aw, k, c: Math.sqrt(G / k), Q: 1 });
  });
  // v1.2.3: Σ Q·k·A ≈ 0,84 repartido entre os trens; trens que saturam em Q = 1 passam a sobra aos demais
  { let livres = ONDAS.slice(), alvo = 0.84; for (let it = 0; it < 4 && livres.length; it++) { const q = alvo / livres.length; const sat = livres.filter((w) => q / (w.k * w.A + 1e-9) >= 1); if (!sat.length) { for (const w of livres) w.Q = q / (w.k * w.A + 1e-9); break; } for (const w of sat) { w.Q = 1; alvo -= w.k * w.A; } livres = livres.filter((w) => !sat.includes(w)); } }
  return bf;
}
defineMar(3);

/** Altura do anel nuclear em (x,z,t). 0 se NUKE_ONDAS vazio (ramo barato).
 *  Envelope usa c_grupo = c_fase/2 (água profunda); fase do cos usa c_fase. */
export function alturaNuke(x, z, t) {
  const Q = NUKE_ONDAS; if (!Q.length) return 0;
  let h = 0;
  for (let i = Q.length - 1; i >= 0; i--) {
    const o = Q[i]; const tau = t - o.t0; if (tau < 0) continue;
    const cg = o.cg != null ? o.cg : o.c * 0.5;
    const r = Math.hypot(x - o.x, z - o.z); if (r > o.rMax || r < 8) { if (tau * cg > o.rMax + 800) { Q.splice(i, 1); } continue; }
    const front = cg * tau; const w = Math.max(40, 2.2 * Math.PI / o.k); // largura do pacote ~ 2,2 λ
    const u = (r - front) / w; if (u < -2.5 || u > 2.2) continue;
    // cilindrico ~1/r; piso em r≈λ
    const Amp = o.A0 / Math.max(r, 2 * Math.PI / o.k) * Math.exp(-0.5 * u * u) * Math.exp(-tau / 55);
    const ph = o.k * (r - o.c * tau); // fase com c_fase
    h += Amp * Math.cos(ph);
  }
  return h;
}
/** Altura EXATA da superfície que o shader desenha (Gerstner + anel nuclear se ativo). */
export function alturaMar(x, z, t) { return alturaGerstner(ONDAS, x, z, t) + alturaNuke(x, z, t); }
/** Empurra um anel. A0~6e3 → Amp≈6–8 m @500 m (REVISAO #1). c=fase, cg=grupo=c/2. */
export function emiteOndaNuclear(x, z, t0, A0 = 6e3, lambda = 280) {
  const k = (2 * Math.PI) / lambda, c = Math.sqrt(G / k), cg = 0.5 * c;
  NUKE_ONDAS.push({ x, z, t0, A0, c, cg, k, rMax: 14000, vivo: 1 });
  if (NUKE_ONDAS.length > 2) NUKE_ONDAS.shift();
  return NUKE_ONDAS[NUKE_ONDAS.length - 1];
}

/**
 * Flutuabilidade em 4 pontos (proa, popa, bombordo, boreste) → { arfagem (heave), caturro (pitch, + = proa sobe),
 * balanco (roll, + = adorna para boreste) }. O navio é longo: ondas curtas se cancelam e ele quase não balança,
 * como um navio de verdade; ondas longas o fazem caturrar.
 */
export function flutuacao(x, z, rumo, L, B, t, out) {
  const fx = Math.sin(rumo), fz = -Math.cos(rumo), sx = Math.cos(rumo), sz = Math.sin(rumo); // proa e boreste
  const hl = L * 0.42, hb = B * 0.5;
  const hP = alturaMar(x + fx * hl, z + fz * hl, t), hR = alturaMar(x - fx * hl, z - fz * hl, t);
  const hBe = alturaMar(x + sx * hb, z + sz * hb, t), hBb = alturaMar(x - sx * hb, z - sz * hb, t);
  out.arfagem = (hP + hR + hBe + hBb) * 0.25 * 0.8;
  out.caturro = Math.atan2(hP - hR, 2 * hl) * 0.85;
  out.balanco = Math.atan2(hBb - hBe, 2 * hb) * 0.35; // água mais alta a bombordo → adorna para boreste
  return out;
}

/**
 * v1.2.21 item 15: flutuabilidade do CASCO pela superfície real — a elevação de CADA trem de onda (a mesma fase Gerstner que o shader desenha) é
 * INTEGRADA sobre todo o plano de flutuação (retângulo equivalente 0,92·L × 0,85·B, = infinitos pontos de amostragem, sem aliasing):
 *   arfagem = Σ A·sinc(aL)·sinc(aB)·S·sin f      (S = e^(−k·calado/2), efeito Smith: a pressão da onda cai com a profundidade)
 *   caturro = atan Σ A·κL·G(aL)·sinc(aB)·S·cos f  (inclinação por mínimos quadrados ao longo do casco; G(a) = 3(sin a − a cos a)/a³)
 *   balanço = −atan Σ A·κB·G(aB)·sinc(aL)·S·cos f
 * Ondas curtas (λ ≪ L) se cancelam sozinhas; o navio responde ao que é do tamanho dele ou maior. Sem fatores arbitrários.
 */
const sinc = (a) => (Math.abs(a) < 1e-4 ? 1 - a * a / 6 : Math.sin(a) / a), Gm = (a) => (Math.abs(a) < 1e-3 ? 1 - a * a / 10 : 3 * (Math.sin(a) - a * Math.cos(a)) / (a * a * a));
const _dC = { x: 0, y: 0, z: 0, crista: 0 };
export function flutuacaoCasco(x, z, rumo, L, B, t, out, calado = 0) {
  const fx = Math.sin(rumo), fz = -Math.cos(rumo), sx = Math.cos(rumo), sz = Math.sin(rumo), hl = 0.46 * L, hb = 0.425 * B;
  let px = x, pz = z; for (let it = 0; it < 4; it++) { deslocaGerstner(ONDAS, px, pz, t, _dC); px = x - _dC.x; pz = z - _dC.z; } /* ponto de referência da malha sob o centro do casco (mesma inversão de alturaMar) */
  let h = 0, sL = 0, sB = 0;
  for (let i = 0; i < ONDAS.length; i++) { const w = ONDAS[i], f = w.k * (w.dx * px + w.dz * pz - w.c * t), kL = w.k * (w.dx * fx + w.dz * fz), kB = w.k * (w.dx * sx + w.dz * sz), aL = kL * hl, aB = kB * hb, S = Math.exp(-w.k * calado * 0.5) * w.A;
    const sf = Math.sin(f), cf = Math.cos(f), zL = sinc(aL), zB = sinc(aB); h += S * zL * zB * sf; sL += S * kL * Gm(aL) * zB * cf; sB += S * kB * Gm(aB) * zL * cf; }
  /* v1.2.30 item 9: anel nuclear — amostragem 4 pts (proa/popa/Bb/Be); heave + pitch + roll; custo 0 se NUKE_ONDAS vazio */
  if (NUKE_ONDAS.length) {
    const cl = (v) => clamp(v, -8, 8); /* REVISAO #3: clamp heave nuclear */
    const nP = cl(alturaNuke(px + fx * hl, pz + fz * hl, t)), nR = cl(alturaNuke(px - fx * hl, pz - fz * hl, t));
    const nBe = cl(alturaNuke(px + sx * hb, pz + sz * hb, t)), nBb = cl(alturaNuke(px - sx * hb, pz - sz * hb, t));
    h += (nP + nR + nBe + nBb) * 0.25; sL += (nP - nR) / Math.max(1, 2 * hl); sB += (nBb - nBe) / Math.max(1, 2 * hb);
  }
  out.arfagem = h; out.caturro = Math.atan(sL); out.balanco = -Math.atan(sB); return out; /* + caturro = proa sobe; + balanço = adorna p/ boreste (água mais alta a bombordo) */
}
/** v1.2.21 item 15: períodos naturais e amortecimento por CLASSE (arquitetura naval):
 *  arfagem T = 2π·√(calado·(Cb/Cwp)·(1+a)/g) com a ≈ 1 (massa adicional); caturro ≈ 0,95·T arfagem;
 *  balanço T = 0,78·B/√GM com GM ≈ 0,075·B (navio de guerra) → 9–18 s; ζ: arfagem 0,35, caturro 0,40 (radiação de ondas + viscoso), balanço 0,09 (quilhas de bojo). */
export function dinamicaCasco(C) { const Tc = Math.max(2, C.T || C.B * 0.36), Th = 2 * Math.PI * Math.sqrt(Tc * 0.67 * 2 / G), Tp = Th * 0.95, GM = 0.075 * C.B, Tr = 0.78 * C.B / Math.sqrt(GM);
  return { wH: 2 * Math.PI / Th, wP: 2 * Math.PI / Tp, wR: 2 * Math.PI / Tr, zH: 0.35, zP: 0.4, zR: 0.09, Th, Tp, Tr }; }
