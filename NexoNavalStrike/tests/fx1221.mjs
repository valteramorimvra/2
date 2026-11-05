// v1.2.21 — teste objetivo de FX (node, sem WebGL): fumaça preta por arma/dano, traçantes AA (largura/brilho),
// traçante de granada (largura/comprimento/px) e coluna d'água do torpedo sob carga (100% visível).
// Uso: SRC=<dir src> node tests/fx1221.mjs saida.json   (SRC=/tmp/base1220 → 1.2.20; SRC=./src → atual)
import fs from 'node:fs'; import path from 'node:path';
const SRC = path.resolve(process.env.SRC || './src'); const OUT = process.argv[2] || '/tmp/fx1221.json';
let seed = 12345; Math.random = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const ctx2 = new Proxy({}, { get: (t, k) => k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : () => {}, set: () => true });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx2, style: {} }) };
const THREE = await import('three');
const { Efeitos } = await import(SRC + '/render/fx.js'); const AV = await import(SRC + '/render/avarias.js'); const { PARAM } = await import(SRC + '/armasParametros.js');
const R = { src: SRC, fumaca: {}, focos: {}, tracantesAA: {}, tracanteGranada: {}, colunaTorpedo: {} };
const r1 = (v, n = 2) => Math.round(v * 10 ** n) / 10 ** n;
const lum = (hex) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
const novoFx = (nivel = 2) => { const fx = new Efeitos(new THREE.Scene(), nivel); fx.setFator(1); return fx; };
// ---------- 1) fumaça escura por arma e dano ----------
function grava(fx) { const g = { n: 0, sAV: 0, aMax: 0, vMax: 0, carga: 0 }; const P = fx.fumaca, em = P.emite.bind(P);
  P.emite = (x, y, z, vx, vy, vz, cor, a, tam, vida, cresce = 1, ...r) => { if (lum(cor) < 0.33) { g.n++; g.sAV += a * vida; g.aMax = Math.max(g.aMax, a); g.vMax = Math.max(g.vMax, vida); const tf = tam + cresce * vida * 0.5; g.carga += a * vida * tf * tf / 1000; } return em(x, y, z, vx, vy, vz, cor, a, tam, vida, cresce, ...r); }; return g; }
const fumacaPretaBase = (fx, x, y, z, k) => { for (let i = 0; i < Math.round(14 * k); i++) fx.fumaca.emite(x + (Math.random() - 0.5) * 6, y + 2 + Math.random() * 3, z + (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, 3 + Math.random() * 4, (Math.random() - 0.5) * 3, '#151515', 0.85, 6, 7, 3, 0, 0.9); };
const C = [ // cenários: [nome, tipo, cal, dano, vida do alvo, altura do impacto]
  ['granada 30mm (leve)', 'canhao', 30, 40, 9000, 6], ['granada 76mm', 'canhao', 76, 150, 9000, 6], ['granada 127mm', 'canhao', 127, 320, 9000, 6], ['granada 127mm forte', 'canhao', 127, 700, 9000, 6],
  ['granada 155mm', 'canhao', 155, 520, 9000, 6], ['granada 280mm', 'canhao', 280, 1500, 12000, 6], ['granada LG (rbu)', 'rbu', 0, 380, 9000, 6], ['foguete', 'foguete', 0, 220, 9000, 6], ['missil', 'missil', 0, 2300, 9000, 6]];
for (const [nome, tipo, cal, dano, vida, y] of C) { const fx = novoFx(2); const g = grava(fx); const kd = Efeitos.kFumaca ? Efeitos.kFumaca(tipo, cal || 127, dano, vida) : 1;
  if (tipo === 'missil') { fx.impactoMissil(0, y, 0, 1); if (fx.fumacaPretaFx) fx.fumacaPretaFx(0, y, 0, kd); else fumacaPretaBase(fx, 0, y, 0, 1);
    if (fx.secundariaMissil) fx.secundariaMissil(0, y, 0, kd); else { fx.explosao(0, y + 3, 0, 0.45); for (let q = 0; q < 8; q++) fx.fumaca.emite(0, y + 3, 0, 0, 4, 0, '#2e3134', 0.55, 6, 5, 8, -0.3, 0.6); } }
  else fx.impactoCanhao(0, y, 0, cal || 127, kd);
  // foco persistente (registraAvaria forte) — fumaça do incêndio ao longo da vida do foco
  const forte = tipo === 'missil' || (cal || 0) >= 200 || dano >= vida * 0.06; let foco = null;
  if (forte) { const r = { marcas: Array.from({ length: 6 }, () => ({ position: { set() {} }, rotation: { set() {} }, scale: { set() {} } })), marcaK: 0, focos: [] }; const n = { x: 0, z: 0, rumo: 0, arfagem: 0, vida: vida - dano, C: { L: 120, B: 14, F: 8, vida } };
    AV.registraAvaria(r, n, 0, y, 0, true, kd); const f = r.focos[0]; const t0 = f.t; const gF = grava(novoFx(2)); const fx2 = gF; // fumaça do foco
    const fxF = novoFx(2); const gg = grava(fxF); let t = 0; while (f.t > 0) { f.t -= 1 / 30; t += 1 / 30; const k = Math.min(1, f.t / 15); const int = AV.intFoco ? AV.intFoco(n, r, f, k) : Math.min(1, (1 - n.vida / n.C.vida) * 1.1 + 0.15 * r.focos.length) * (0.5 + 0.5 * k); if (Math.random() < 0.95) fxF.incendio(0, 9, 0, int, false, null); }
    foco = { duracao_s: r1(t0, 1), fumacaN: gg.n, aMax: r1(gg.aMax), carga: r1(gg.carga, 0) }; }
  R.fumaca[nome] = { kd: r1(kd), n: g.n, somaAlfaVida: r1(g.sAV, 1), aMax: r1(g.aMax), vidaMax_s: r1(g.vMax, 1), carga: r1(g.carga, 1) }; R.focos[nome] = foco; }
// ---------- 2) traçantes AA ----------
const W = 915, H = 412; const cam = new THREE.PerspectiveCamera(55, W / H, 1, 30000); cam.position.set(0, 10, 0); cam.updateMatrixWorld(); const foc = H / (2 * Math.tan(55 * Math.PI / 360));
for (const red of [false, true]) for (const tipo of [0, 1, 2, 3]) for (const d of [150, 500, 1500]) { const fx = novoFx(2); fx.cam = cam; fx.trReduzido = red; fx.tracante(-40, 10 + d * 0.15, -d, 1, 0, 0, tipo, 1); fx.passoTracantes(1 / 60);
  const M = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color(); fx.tracantes.getMatrixAt(0, M); M.decompose(p, q, s); fx.tracantes.getColorAt(0, c);
  const dd = p.distanceTo(cam.position); R.tracantesAA[`${red ? 'reduzido' : 'normal'}:t${tipo}@${d}m`] = { larg_m: r1(s.x, 3), larg_px: r1(s.x * foc / dd), comp_m: r1(s.z, 1), brilho: r1(Math.max(c.r, c.g, c.b)), rgb: [r1(c.r), r1(c.g), r1(c.b)], verdeSobreVermelho: r1(c.g / c.r) }; }
// ---------- 3) traçante da granada de canhão ----------
const escTela = (d, len, px) => Math.min(8, Math.max(1, px / (len * foc / Math.max(1, d))));
for (const cal of [57, 127, 155, 280]) for (const d of [60, 300, 1200, 4000]) { const vv = 820; let wT, L, px0;
  if (Efeitos.dimTracante) { const o = Efeitos.dimTracante(cal, vv, d, foc); wT = o.w; L = o.l; }
  else { const G2 = PARAM.calibre.tracanteGrossura, lw = PARAM.fx.tracanteLarg * (G2[0] + (G2[1] - G2[0]) * Efeitos.fc(cal)); const kG = escTela(d, lw * 0.6, 2.6); const nF = d < 90 ? Math.max(0.05, (d - 3) / 87) : 1; wT = nF < 1 ? Math.min(lw * kG, cal / 1000 * 0.9 + (lw * kG) * nF) : lw * kG; L = 7 * Math.min(14, Math.max(1, vv * 0.016 / 7)) * Math.min(2, kG) * nF; }
  const diam = wT * 0.42; const cor = new THREE.Color(PARAM.fx.tracante); const km = Efeitos.K_TRACANTE || 2.1;
  R.tracanteGranada[`${cal}mm@${d}m`] = { diam_m: r1(diam, 3), diam_px: r1(diam * foc / d), comp_m: r1(L, 1), comp_px: r1(L * foc / d, 0), borrao60fps_m: r1(vv / 60, 1), brilho: r1(Math.max(cor.r, cor.g, cor.b) * km), verdeSobreVermelho: r1(cor.g / cor.r) }; }
// ---------- 4) coluna d'água do torpedo sob carga ----------
for (const [nv, fat] of [[0, 0.5], [1, 0.8], [2, 1]]) { let ok = 0, minR = 1, soma = 0; const T = 20;
  for (let tr = 0; tr < T; tr++) { const fx = new Efeitos(new THREE.Scene(), nv); fx.setFator(fat); const P0 = fx.fumaca; for (let i = 0; i < P0.n; i++) { P0.fator = 1; P0.emite(500, 20, 500, 0, 1, 0, '#555555', 0.5, 6, 12, 1, 0, 0.5); } fx.passo(1 / 30); // pool cheio → degradação 35%
    const alvo = fx.agua || fx.fumaca; const marca = new Map(); const em = alvo.emite.bind(alvo); let tent = 0; alvo.emite = (...a) => { tent++; const i0 = alvo.i; em(...a); if (alvo.i !== i0) marca.set(i0, alvo.vida0[i0]); };
    fx.colunaTorpedo(0, 0, 1, 10, 0); alvo.emite = em; const nominal = tent; const emitidas = marca.size;
    for (let f = 0; f < 60; f++) { for (let q = 0; q < 25; q++) fx.fumaca.emite(300, 10, 300, 0, 2, 0, '#3a3d40', 0.5, 6, 6, 3, 0, 0.7); /* combate pesado: 750 partículas/s de fumaça */ fx.passo(1 / 30); }
    let vivas = 0; for (const [i, v0] of marca) if (alvo.vida0[i] === v0 && alvo.vida[i] > 0) vivas++; const rz = vivas / nominal; soma += rz; minR = Math.min(minR, rz); if (rz >= 0.6) ok++; }
  R.colunaTorpedo[`nivel${nv}(fator ${fat}) sob carga`] = { ensaios: T, visivel_ge60pct: `${ok}/${T}`, fracaoVivaMedia_2s: r1(soma / T), fracaoVivaMin_2s: r1(minR) }; }
fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R));
