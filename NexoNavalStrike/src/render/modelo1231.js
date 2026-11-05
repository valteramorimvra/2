// v1.2.31 — MODELOS PROCEDURAIS dos 3 navios lendários reais (módulo NOVO; tudo sintetizado, nada importado de foto/modelo).
// Casco por estações (casco1231), casaria por blocos facetados (dados1231.blocos), mastros, radares, armas nas posições do layout1231.
// Mesmo contrato de criaNavio3D: torre{i}(pivo,cano) · ciws{i}(cab,canos) · lg{i}(lgEl) · tampas(InstancedMesh, 1 por célula) · radar · flamula · userData.
// Acréscimo: grupo 'nk1231' (compartimento do míssil nuclear: escotilha dupla animada por abreEscotilha1231).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { prisma, texNumero } from './textures.js';
import { materiais } from './shipModels.js';
import { SPEC, deckY1231, meiaBoca1231, meiaDeck1231, zDe } from '../sim/dados1231.js';
import { layout1231 } from '../sim/layout1231.js';
import { geoCasco1231 } from './casco1231.js';
import { montaSuper1231 } from './super1231.js';
import { Kit } from './geo1231.js';

const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; }; /* v1.2.31: SEM 'det' (sem LOD visual — o mesmo modelo de perto e de longe) */
const cil = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);
const caixa = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const bloco = (w, c, h, enc = 0.84, ch = 0.18) => { const x = w / 2, z = c / 2, a = Math.min(x, z) * ch * 2; return prisma(THREE, [[-x + a, -z], [x - a, -z], [x, -z + a], [x, z - a], [x - a, z], [-x + a, z], [-x, z - a], [-x, -z + a]], h, enc, 0.92); };
const _up = new THREE.Vector3(0, 1, 0);
/** tubo (cilindro) entre dois pontos — para treliças e estais */
const tubo = (a, b, r, mat, g, det = 1) => { const d = new THREE.Vector3().subVectors(b, a), len = d.length(); const m = mesh(cil(r, r, len, 5), mat, det); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(_up, d.normalize()); g.add(m); return m; };
const aponta = (m, dx, dy, dz) => { m.lookAt(m.position.x + dx, m.position.y + dy, m.position.z + dz); return m; };

/* ---------------- peças de arma ---------------- */
/** Torre furtiva de canhão único (127/130 mm): casamata facetada de faces planas + manto + cano. Mesmas medidas de pivô/cano que a sim (torreCanhao). */
function torre(M, cal, dup = 0) {
  const g = new THREE.Group(), s = cal / 127; g.name = 'torre';
  /* casamata facetada (octógono em planta → topo menor): faces PLANAS; todo detalhe (costuras, portas, grades, abertura do canhão) é calculado POR FACE com k.face (base + inclinação), nada flutua */
  const kk = Kit(g, M); const W1 = 1.5 * s + 0.6, W2 = 2.4 * s + 0.6, ZF = -2.2 * s + 0.4, ZM = -0.4 * s + 0.4, ZR = 2.6 * s + 0.9, HC = 2.1 * s + 0.6, ch = 0.55 + 0.25 * s;
  const PA = [[-W1, ZF], [W1, ZF], [W2, ZM], [W2, ZR - ch], [W2 - ch, ZR], [-W2 + ch, ZR], [-W2, ZR - ch], [-W2, ZM]], PB = PA.map(([x, z]) => [x * 0.62, 0.4 + (z - 0.4) * 0.78]);
  kk.loft(PA, PB, 0, HC, M.sup, 0.12); const RG = { A: PA, B: PB, y0: 0, y1: HC, h: HC };
  { const sl = (i) => { const F0 = kk.face(RG, i, 0), F1 = kk.face(RG, i, 1); return F0.p.distanceTo(F1.p); }; const P = (i, f, u, w, h, mat, off) => kk.placa(RG, i, f, u, w, h, mat, { off });
    for (let i = 0; i < 8; i++) { const F = kk.face(RG, i, 0.5), L = sl(i), wTop = Math.hypot(PB[(i + 1) % 8][0] - PB[i][0], PB[(i + 1) % 8][1] - PB[i][1]), w = Math.min(F.len, wTop);
      P(i, 0.5, 0, w * 0.985, 0.03, M.escuro, 0.03); /* junta horizontal na meia-altura da face */
      if (w > 1.6) { P(i, 0.5, -w * 0.25, 0.03, L * 0.97, M.escuro, 0.03); P(i, 0.5, w * 0.25, 0.03, L * 0.97, M.escuro, 0.03); } else P(i, 0.5, 0, 0.03, L * 0.97, M.escuro, 0.03); }
    /* frente (0): abertura do canhão (recesso escuro sob o cano) + aba do manto */
    P(0, 0.62, 0, 1.0 * s + 0.7, 0.62 * s + 0.4, M.escuro, 0.035); P(0, 0.9, 0, 1.5 * s + 0.6, 0.07, M.escuro, 0.035);
    /* laterais (2 e 6): porta de acesso com moldura e dobradiças, grade de ventilação (5 venezianas) */
    for (const i of [2, 6]) { const sg = i === 2 ? 1 : -1; const F = kk.face(RG, i, 0.5), w = Math.min(F.len, Math.hypot(PB[(i + 1) % 8][0] - PB[i][0], PB[(i + 1) % 8][1] - PB[i][1]));
      P(i, 0.4, -sg * w * 0.28, 0.7 * s + 0.2, 1.25 * s + 0.35, M.escuro, 0.035); P(i, 0.4, -sg * w * 0.28, 0.58 * s + 0.12, 1.12 * s + 0.3, M.sup, 0.05); P(i, 0.42, -sg * (w * 0.28 + 0.2), 0.05, 0.22, M.escuro, 0.06);
      for (let v = 0; v < 5; v++) P(i, 0.28 + v * 0.1, sg * w * 0.26, 0.6 * s + 0.15, 0.045, M.escuro, 0.04); }
    /* traseira (4): escotilha de carga grande com tranca + 2 dobradiças; chanfros (3,5): grade pequena */
    P(4, 0.45, 0, 1.4 * s + 0.4, 1.2 * s + 0.4, M.escuro, 0.035); P(4, 0.45, 0, 1.28 * s + 0.3, 1.08 * s + 0.3, M.sup, 0.05); P(4, 0.45, 0.25, 0.05, 0.3, M.escuro, 0.06); P(4, 0.2, -0.5, 0.2, 0.06, M.escuro, 0.06); P(4, 0.7, -0.5, 0.2, 0.06, M.escuro, 0.06);
    for (const i of [3, 5]) for (let v = 0; v < 3; v++) P(i, 0.35 + v * 0.1, 0, 0.4 * s + 0.2, 0.04, M.escuro, 0.04);
    /* chanfros da frente (1 e 7): visor/sensor quadrado */
    for (const i of [1, 7]) P(i, 0.55, 0, 0.35, 0.35, M.escuro, 0.04); }
  const topo = mesh(prisma(THREE, [[-1.1, -1.4], [1.1, -1.4], [1.7, 0.4], [-1.7, 0.4]], 0.5, 0.82, 0.82), M.sup); topo.position.set(0, 2.1 * s + 0.55, 0.9); g.add(topo);
  const piv = new THREE.Group(); piv.name = 'pivo'; piv.position.set(0, 1.9, -1.2 * s); g.add(piv);
  const L = 7.5; const cano = new THREE.Group(); cano.name = 'cano'; piv.add(cano);
  for (const dx of dup ? [-0.55, 0.55] : [0]) { cano.add(mesh(cil(0.1 * s + 0.07, 0.17 * s + 0.08, L, 12).rotateX(-Math.PI / 2).translate(dx, 0, -L / 2), M.escuro));
  cano.add(mesh(cil(0.22 * s + 0.07, 0.22 * s + 0.07, 0.9, 12).rotateX(-Math.PI / 2).translate(dx, 0, -L * 0.45), M.escuro)); }
  const manto = mesh(caixa(1.1 * s + 0.6, 0.9 * s + 0.4, 0.8), M.sup); manto.position.z = -0.1; piv.add(manto);
  /* v1.2.31 (fidelidade): detalhe da torre — costuras de painel, escotilhas, grades de ventilação, extrator de fumaça, freio de boca, contrapeso, véus de sujeira */
  { const H = 2.1 * s + 0.6, XS = 2.4 * s + 0.6, z0 = 0.4 - 0.4 * s, z1 = 0.4 + 2.6 * s + 0.5, zm = (z0 + z1) / 2, lz = z1 - z0;
    const add = (m, x, y, z, rx = 0, ry = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, 0); g.add(m); return m; };
    /* topo: escotilhas de visita (com aro), óptica de pontaria e antena */
    const yT = 2.1 * s + 0.55 + 0.5;
    for (const sx of [-0.6, 0.7]) { add(mesh(caixa(0.7, 0.07, 0.7), M.escuro), sx, yT + 0.04, 1.3); add(mesh(caixa(0.55, 0.06, 0.55), M.sup), sx, yT + 0.1, 1.3); }
    add(mesh(cil(0.12, 0.12, 0.35, 8), M.escuro), 0.0, yT + 0.2, 0.2); add(mesh(cil(0.025, 0.025, 1.6, 4), M.escuro), -1.2, yT + 0.8, 1.55);
    add(mesh(caixa(2.0, 0.08, 0.1), M.escuro), 0, yT + 0.03, 0.6); add(mesh(caixa(2.6 * s, 0.12, 0.08), M.escuro), 0, 0.28, 0.4 - 2.2 * s - 0.01); /* friso na proa da casamata */
    /* canhão: extrator de fumaça, freio de boca, colar do berço e contrapeso */
    for (const dx of dup ? [-0.55, 0.55] : [0]) { cano.add(mesh(cil(0.19 * s + 0.09, 0.19 * s + 0.09, 1.1, 12).rotateX(-Math.PI / 2).translate(dx, 0, -L * 0.52), M.escuro)); cano.add(mesh(cil(0.15 * s + 0.1, 0.15 * s + 0.1, 0.55, 10).rotateX(-Math.PI / 2).translate(dx, 0, -L + 0.2), M.escuro)); cano.add(mesh(cil(0.13 * s + 0.12, 0.13 * s + 0.12, 0.12, 10).rotateX(-Math.PI / 2).translate(dx, 0, -L + 0.5), M.escuro)); cano.add(mesh(cil(0.27 * s + 0.1, 0.27 * s + 0.1, 0.5, 12).rotateX(-Math.PI / 2).translate(dx, 0, -0.9), M.escuro)); }
    piv.add(mesh(caixa(1.2 * s + 0.4, 0.8 * s + 0.2, 0.6), M.sup).translateZ(1.2).translateY(0.1)); piv.add(mesh(caixa(1.3 * s + 0.6, 0.18, 0.5), M.escuro).translateY(0.6 * s + 0.3).translateZ(-0.15)); }
  return g;
}
/** Montagens antiaéreas: 'ciws' (Goalkeeper/Type 1130), 'ram' (21 cél.), 'hhq10' (24 cél.), 'pantsir' (2×30 mm + 12 tubos). Contrato: grupo → 'cab' → 'canos' (−z = direção de tiro). */
function antiaerea(M, tipo) {
  const g = new THREE.Group(); g.name = 'ciws'; const cab = new THREE.Group(); cab.name = 'cab'; const cn = new THREE.Group(); cn.name = 'canos'; cab.add(cn); g.add(cab);
  if (tipo === 'ciws') { const b = mesh(cil(0.95, 1.1, 1.3, 14), M.aa); b.position.y = 0.65; b.userData.estatico = 1; g.add(b); cab.position.y = 1.3; const d = mesh(new THREE.SphereGeometry(0.95, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.4, 1), M.aa); d.position.y = 0.2; cab.add(d); cn.position.set(0, -0.1, -0.6); const n = 7; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; cn.add(mesh(cil(0.05, 0.05, 2.0, 5).rotateX(-Math.PI / 2).translate(Math.cos(a) * 0.17, Math.sin(a) * 0.17, -1.0), M.escuro)); } cab.add(mesh(caixa(0.7, 0.6, 0.8), M.aa).translateY(0.15).translateZ(0.9)); }
  else if (tipo === 'ram' || tipo === 'hhq10') { const nC = tipo === 'ram' ? 21 : 24; const b = mesh(cil(0.9, 1.1, 1.3, 12), M.sup); b.position.y = 0.65; b.userData.estatico = 1; g.add(b); cab.position.y = 1.3; const col = tipo === 'ram' ? 7 : 6, lin = 3 * (tipo === 'ram' ? 1 : 1.33);
    const bx = mesh(caixa(tipo === 'ram' ? 1.9 : 2.2, 1.8, 2.0), M.aa); bx.position.set(0, 0.3, 0); cab.add(bx); cn.position.set(0, 1.0, -1.0); const cols = tipo === 'ram' ? 7 : 6, rows = tipo === 'ram' ? 3 : 4; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) cn.add(mesh(cil(0.12, 0.12, 0.3, 8).rotateX(Math.PI / 2), M.escuro).translateX((i - (cols - 1) / 2) * 0.27).translateY((j - (rows - 1) / 2) * 0.32 - 0.5).translateZ(0.2)); }
  else { /* pantsir */ const b = mesh(cil(1.3, 1.5, 1.8, 12), M.sup); b.position.y = 0.9; b.userData.estatico = 1; g.add(b); cab.position.y = 2.0; const tr = mesh(caixa(2.8, 1.5, 2.6), M.aa); tr.position.y = 0.2; cab.add(tr); cn.position.set(0, 0.4, -1.2);
    for (const sx of [-1, 1]) { cn.add(mesh(cil(0.07, 0.08, 2.2, 6).rotateX(-Math.PI / 2).translate(sx * 0.65, 0.2, -1.0), M.escuro)); for (let k = 0; k < 3; k++) cn.add(mesh(cil(0.11, 0.11, 1.2, 6).rotateX(-Math.PI / 2).translate(sx * 1.55, -0.2 + k * 0.38, -0.2), M.claro)); }
    cab.add(mesh(new THREE.SphereGeometry(0.55, 10, 8), M.claro).translateY(1.15).translateZ(0.4)); }
  return g;
}
/** Lançador antissubmarino de 10 tubos (RBU-12000): pedestal + escudo de sopro + 2 fileiras de 5 tubos em 'lgEl' */
function rbu(M) { const lg = new THREE.Group(); const bs = mesh(cil(1.5, 1.8, 1.0, 14), M.sup); bs.position.y = 0.5; lg.add(bs); const sp = mesh(caixa(3.4, 1.4, 1.6), M.sup); sp.position.y = 1.6; lg.add(sp);
  const fx = new THREE.Group(); fx.position.set(0, 2.3, 0); fx.name = 'lgEl'; for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) fx.add(mesh(cil(0.2, 0.2, 2.6, 8).rotateX(Math.PI / 2), M.escuro).translateX((c - 2) * 0.5).translateY(r * 0.46).translateZ(-0.2)); fx.rotation.x = 0.35; lg.add(fx); return lg; }
/** Quatro canisters SSM (um lançador quádruplo inclinado) */

/** v1.2.31: mapa normal procedural de chapa naval (painéis soldados com chanfro, fileira de rebites, micro-ondulação) — gerado no cliente, sem arquivo/asset externo. */
let PLACA_N = null;
function normalPlaca() { if (PLACA_N) return PLACA_N; const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); const h = new Float32Array(N * N); let sd = 7; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const e = Math.min(i, j, N - 1 - i, N - 1 - j); let v = 0.5 + 0.015 * Math.sin(i * 0.11 + j * 0.05) + 0.02 * Math.sin(j * 0.31) * Math.cos(i * 0.07); if (e < 7) v -= 0.28 * (1 - e / 7) ** 1.5; /* junta soldada */ else if (e < 10) v += 0.05; h[j * N + i] = v; }
  const rv = (cx, cy) => { for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const d = Math.hypot(i, j); if (d < 3) h[(cy + j) * N + cx + i] += 0.14 * (1 - d / 3); } };
  for (let k = 14; k < N - 10; k += 22) { rv(k, 16); rv(k, N - 17); } for (let k = 14; k < N - 10; k += 22) { rv(16, k); rv(N - 17, k); }
  const img = x.createImageData(N, N); const g = (i, j) => h[((j + N) % N) * N + ((i + N) % N)];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = (g(i + 1, j) - g(i - 1, j)) * 5, dy = (g(i, j + 1) - g(i, j - 1)) * 5; const l = Math.hypot(dx, dy, 1); const p = (j * N + i) * 4; img.data[p] = (-dx / l * 0.5 + 0.5) * 255; img.data[p + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[p + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[p + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.NoColorSpace; PLACA_N = t; return t; }

/** textura procedural de painel de radar de arranjo de fase (grade de elementos radiantes) */
let TEX_AESA = null;
function texPainelAesa() { if (TEX_AESA) return TEX_AESA; const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#2a323a'; x.fillRect(0, 0, N, N); const n = 28, p = N / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const cx = (i + 0.5) * p, cy = (j + 0.5) * p; if (Math.hypot(cx - N / 2, cy - N / 2) > N * 0.5) continue; x.fillStyle = (i + j) % 2 ? '#4d5a66' : '#56646f'; x.fillRect(i * p + 1, j * p + 1, p - 2, p - 2); x.fillStyle = '#1a2026'; x.beginPath(); x.arc(cx, cy, p * 0.2, 0, 6.2832); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX_AESA = t; return t; }

let TEX_AESAR = null;
/** painel AESA retangular (Tipo 346B): matriz de módulos até a borda, com moldura e linhas de módulos T/R */
function texPainelAesaR() { if (TEX_AESAR) return TEX_AESAR; const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.fillStyle = '#1b2026'; x.fillRect(0, 0, N, N); const n = 32, p = (N - 16) / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { x.fillStyle = (i + j) % 2 ? '#4d5a66' : '#56646f'; x.fillRect(8 + i * p + 0.8, 8 + j * p + 0.8, p - 1.6, p - 1.6); x.fillStyle = '#1a2026'; x.beginPath(); x.arc(8 + (i + 0.5) * p, 8 + (j + 0.5) * p, p * 0.2, 0, 6.2832); x.fill(); }
  x.fillStyle = '#10141a'; for (const q of [0.25, 0.5, 0.75]) { x.fillRect(8 + q * (N - 16) - 1, 8, 2, N - 16); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEX_AESAR = t; return t; }
/** refletor em grade (antena tipo Top Pair/Top Plate): malha de fios com recorte alfa */
let MAT_REDE = null;
let TEX_MANCHA = null;
/** escorridos de sujeira/ferrugem (alfa suave): uma tira com 3 fios irregulares */
function texMancha() { if (TEX_MANCHA) return TEX_MANCHA; const W = 64, Hh = 128, c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d'); let sd = 17; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  for (let q = 0; q < 3; q++) { const px = 10 + R() * 44, w = 3 + R() * 7, L = Hh * (0.5 + R() * 0.5); const gr = x.createLinearGradient(0, 0, 0, L); const fer = q === 1; gr.addColorStop(0, fer ? 'rgba(120,62,30,.55)' : 'rgba(34,30,26,.5)'); gr.addColorStop(0.6, fer ? 'rgba(110,58,30,.25)' : 'rgba(34,30,26,.22)'); gr.addColorStop(1, 'rgba(30,26,22,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(px - w / 2, 0); x.lineTo(px + w / 2, 0); x.lineTo(px + w * 0.15 + (R() - 0.5) * 3, L); x.lineTo(px - w * 0.15 + (R() - 0.5) * 3, L); x.fill(); }
  TEX_MANCHA = new THREE.CanvasTexture(c); TEX_MANCHA.colorSpace = THREE.SRGBColorSpace; return TEX_MANCHA; }

function matRede() { if (MAT_REDE) return MAT_REDE; const N = 64, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); x.clearRect(0, 0, N, N); x.fillStyle = '#fff'; x.fillRect(0, 0, N, 7); x.fillRect(0, 0, 7, N); x.fillRect(28, 0, 3, N);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 7); t.colorSpace = THREE.SRGBColorSpace; MAT_REDE = new THREE.MeshStandardMaterial({ color: '#9aa3ab', map: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.3 }); return MAT_REDE; }
function ssm(M) { const g = new THREE.Group(); const b = mesh(caixa(1.6, 0.5, 2.6), M.sup); b.position.y = 0.25; g.add(b); const f = new THREE.Group(); f.position.set(0, 0.8, 0); f.rotation.x = -0.6; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) f.add(mesh(caixa(0.55, 0.55, 3.6), M.claro).translateX((i - 0.5) * 0.7).translateY((j - 0.5) * 0.7)); g.add(f); return g; }

/** Compartimento do míssil nuclear: coamo + interior escuro + faixas de aviso + duas abas articuladas nos bordos (abrem para fora). */
function compNuclear(M, w, l, tex) {
  const g = new THREE.Group(); g.name = 'nk1231'; const cm = 0.22;
  g.add(mesh(caixa(w + 0.5, cm * 0.4, l + 0.5), M.escuro).translateY(cm * 0.2)); /* base escura rente */
  /* v1.2.31: sem moldura branca (coamo); só placa escura rente ao convés + faixa de aviso FINA ao redor */
  const fundo = mesh(caixa(w, 0.05, l), new THREE.MeshStandardMaterial({ color: '#07090b', roughness: 0.9, metalness: 0.2 })); fundo.position.y = cm + 0.02; g.add(fundo);
  const faixa = new THREE.Mesh(new THREE.PlaneGeometry(w + 1.5, l + 1.5), tex); faixa.rotation.x = -Math.PI / 2; faixa.position.y = 0.04; faixa.userData.det = 1; g.add(faixa);
  const mk = (sx, nome) => { const p = new THREE.Group(); p.name = nome; p.position.set(sx * w / 2, cm + 0.28, 0); const aba = mesh(caixa(w / 2 + 0.05, 0.16, l), M.sup); aba.position.x = -sx * (w / 4 + 0.02); p.add(aba); const fr = mesh(caixa(w / 2 - 0.3, 0.02, l - 0.3), M.escuro); fr.position.set(-sx * (w / 4 + 0.02), 0.09, 0); p.add(fr); g.add(p); return p; };
  mk(-1, 'nkAbaP'); mk(1, 'nkAbaS'); return g;
}
let TNK = null; function texAviso() { if (TNK) return TNK; const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.clearRect(0, 0, 256, 256); x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 256, 256);
  x.save(); x.beginPath(); x.rect(0, 0, 256, 256); x.rect(26, 26, 204, 204); x.clip('evenodd'); for (let i = -256; i < 512; i += 32) { x.fillStyle = (i / 32) % 2 ? '#e8b923' : '#17191c'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 16, 0); x.lineTo(i + 16 - 256, 256); x.lineTo(i - 256, 256); x.closePath(); x.fill(); } x.restore();
  TNK = new THREE.CanvasTexture(c); TNK.colorSpace = THREE.SRGBColorSpace; TNK.anisotropy = 8; TNK = new THREE.MeshStandardMaterial({ map: TNK, transparent: true, roughness: 0.8, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }); return TNK; }
/** a ∈ [0,1]: 0 fechada, 1 aberta (≈ 105°). Chamada pelo render (e pelo teste). */
export function abreEscotilha1231(ref, a) { const g = ref.g || ref; const p = g.getObjectByName('nkAbaP'), s = g.getObjectByName('nkAbaS'); const t = Math.max(0, Math.min(1, a)), ang = (t * t * (3 - 2 * t)) * 1.83; if (p) p.rotation.z = ang; if (s) s.rotation.z = -ang; }

/* ---------------- mastros e radares por navio ---------------- */
function painelRadar(M, g, x, y, z, yaw, tam, circ, tilt = -0.2) { const m = circ ? new THREE.Mesh(new THREE.CircleGeometry(tam / 2, 8), M.painel) : new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), M.painel); m.position.set(x, y, z); m.rotation.order = 'YXZ'; m.rotation.y = yaw; m.rotation.x = tilt; m.userData.det = 0; g.add(m); const fr = mesh(circ ? cil(tam / 2 + 0.12, tam / 2 + 0.12, 0.14, 8).rotateX(Math.PI / 2) : caixa(tam + 0.25, tam + 0.25, 0.14), M.escuro); fr.position.copy(m.position).addScaledVector(new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), -0.09); fr.rotation.order = 'YXZ'; fr.rotation.y = yaw; fr.rotation.x = tilt; g.add(fr); }
function mastroTrelica(M, g, x, y0, z, H) { /* mastro em treliça afunilado (Sejong) com 2 vergas, domos e antena */
  const b = 1.55, t = 0.38; const P = (s, k, yy) => new THREE.Vector3(x + s * (b + (t - b) * k), y0 + yy, z + (s === 0 ? 0 : 0)); const leg = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of leg) tubo(new THREE.Vector3(x + sx * b, y0, z + sz * b), new THREE.Vector3(x + sx * t, y0 + H, z + sz * t), 0.12, M.sup, g);
  for (let k = 0; k < 6; k++) { const f = k / 5, hh = H * (0.08 + 0.9 * f), w = b + (t - b) * (hh / H); const q = leg.map(([sx, sz]) => new THREE.Vector3(x + sx * w, y0 + hh, z + sz * w)); for (let i = 0; i < 4; i++) tubo(q[i], q[(i + 1) % 4], 0.06, M.sup, g); if (k < 5) { const q2 = leg.map(([sx, sz]) => new THREE.Vector3(x + sx * (b + (t - b) * (H * (0.08 + 0.9 * (k + 1) / 5) / H)), y0 + H * (0.08 + 0.9 * (k + 1) / 5), z + sz * (b + (t - b) * (H * (0.08 + 0.9 * (k + 1) / 5) / H)))); tubo(q[0], q2[1], 0.05, M.sup, g); tubo(q[2], q2[3], 0.05, M.sup, g); } }
  for (const [f, w] of [[0.5, 13], [0.72, 8.5]]) { const v = mesh(caixa(w, 0.28, 0.4), M.sup, 1); v.position.set(x, y0 + H * f, z); g.add(v); for (const sx of [-1, 1]) { const a = mesh(caixa(0.5, 0.9, 0.5), M.claro, 1); a.position.set(x + sx * w / 2, y0 + H * f + 0.5, z); g.add(a); } }
  const dm = mesh(new THREE.SphereGeometry(1.0, 12, 8), M.claro); dm.position.set(x + 2.1, y0 + H * 0.28, z - 1.0); g.add(dm); const pr = mesh(cil(0.9, 0.9, 0.18, 14).rotateX(Math.PI / 2.6), M.claro, 1); pr.position.set(x - 1.0, y0 + H * 0.36, z - 1.9); g.add(pr);
  g.add(mesh(cil(0.05, 0.09, 8, 6), M.claro, 1).translateX(x).translateY(y0 + H + 3.5).translateZ(z));
  const rd = new THREE.Group(); rd.name = 'radar'; rd.position.set(x, y0 + H * 0.88, z); const pl = mesh(caixa(3.6, 0.55, 0.16), M.escuro); pl.position.y = 0.35; rd.add(pl); rd.add(mesh(cil(0.2, 0.25, 0.6, 8), M.escuro)); g.add(rd); return y0 + H + 7.5; }
function mastroPiramide(M, g, x, y0, z, H, bw, bl, enc) { const p = mesh(bloco(bw, bl, H, enc, 0.2), M.sup); p.position.set(x, y0, z); g.add(p); const top = mesh(cil(0.2, 0.36, 7, 8), M.claro, 1); top.position.set(x, y0 + H + 3.4, z); g.add(top);
  const rd = new THREE.Group(); rd.name = 'radar'; rd.position.set(x, y0 + H + 0.1, z); const pl = mesh(caixa(3.2, 0.5, 0.15), M.escuro); pl.position.y = 0.3; rd.add(pl); g.add(rd); return y0 + H + 7; }

/* ---------------- montagem ---------------- */
export function montaModelo1231(C, time) {
  const id = C.id, S = SPEC[id], P = layout1231(C), M = { ...materiais(time) }; M.sup = M.sup.clone(); { const nt = normalPlaca().clone(); nt.repeat.set(2.0, 2.7); nt.needsUpdate = true; M.sup.normalMap = nt; M.sup.normalScale = new THREE.Vector2(0.9, 0.9); /* mapa normal procedural também na casaria */ } M.rede = matRede(); { const vela = (cor, op) => new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); M.velaC = vela('#ffffff', 0.17); M.velaE = vela('#10151a', 0.22); M.mancha = new THREE.MeshBasicMaterial({ map: texMancha(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); } M.pnl = new THREE.MeshStandardMaterial({ color: '#9aa6b2', map: texPainelAesa(), roughness: 0.4, metalness: 0.45 }); M.pnlR = new THREE.MeshStandardMaterial({ color: '#9aa6b2', map: texPainelAesaR(), roughness: 0.4, metalness: 0.45 }); const g = new THREE.Group(); const { L, B } = S; const azul = time === 'azul';
  const dY = (z) => deckY1231(id, z), mDk = (z) => meiaBoca1231(id, z), Z = (zb) => zDe(id, zb);
  const H = geoCasco1231(id); const mc = M.casco.clone(); mc.map = M.casco.map.clone(); mc.map.repeat.set(L / 110, 1); mc.map.needsUpdate = true; mc.normalMap = normalPlaca().clone(); mc.normalMap.repeat.set(9 / 4.2, 9 / 3.1); mc.normalMap.needsUpdate = true; mc.normalScale = new THREE.Vector2(0.9, 0.9);
  g.add(mesh(H.costado, mc)); g.add(mesh(H.bordas, M.sup)); { const kb = S.casco.bulbo; const bb = mesh(new THREE.SphereGeometry(1, 16, 10).scale(B * 0.11 * kb, S.T * 0.30 * Math.pow(kb, 0.5), L * 0.045 * kb), M.escuro); bb.position.set(0, -S.T * 0.36, -L / 2 + L * 0.028); g.add(bb); }
  /* ---- detalhes do costado: escovém, portas de costado, vigias (planos rentes ao casco, acompanhando o flare) ---- */
  { const K = H.secao[0].length - 1; const ponto = (zz, yy) => { let bi = 0, bd = 1e9; H.secao.forEach((S2, i) => { const d = Math.abs(S2[K][2] - zz); if (d < bd) { bd = d; bi = i; } }); const S2 = H.secao[bi]; let bk = 0, by = 1e9; S2.forEach((p, kk) => { const d = Math.abs(p[1] - yy); if (d < by) { by = d; bk = kk; } }); const a = S2[Math.max(0, bk - 1)], b = S2[Math.min(K, bk + 1)]; const dx = b[0] - a[0], dy = Math.max(0.01, b[1] - a[1]); return { x: S2[bk][0], y: S2[bk][1], z: S2[bk][2], sl: dx / dy }; };
    const plano = (zb, fy, w, h, mat, rep = 0) => { const zz = Z(zb), yy = dY(zz) * fy, p = ponto(zz, yy); for (const sd of [-1, 1]) { const gm = new THREE.PlaneGeometry(w, h); if (rep) { const uv = gm.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * rep); } const m = new THREE.Mesh(gm, mat); const n = new THREE.Vector3(sd, -p.sl, 0).normalize(); const bx = new THREE.Vector3(0, 0, -sd).normalize(), by2 = new THREE.Vector3().crossVectors(n, bx).normalize(); m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(bx, by2, n)); m.position.set(sd * (p.x + 0.05) - sd * 0, p.y, zz); m.position.addScaledVector(n, 0.03); g.add(m); } };
    const A = id === 'sejong' ? 14 : id === 'nanchang' ? 17 : 24; plano(A, 0.6, 1.5, 1.7, M.escuro); plano(A, 0.6, 0.9, 0.9, M.claro);
    const portasZ = id === 'sejong' ? [58, 96, 124] : id === 'nanchang' ? [72, 104, 126] : [92, 128, 166, 214]; for (const zb of portasZ) plano(zb, 0.4, 1.1, 2.1, M.porta);
    if (id === 'nakhimov') for (const f of [0.5, 0.7]) plano(110, f, 70, 0.9, M.vigia, 28);
    if (id === 'sejong') plano(70, 0.5, 40, 0.8, M.vigia, 16); }
  const dm = mesh(H.conves, M.conves); dm.position.y = 0.02; g.add(dm); g.add(mesh(H.espelho, mc));
  const meiaReal = (z) => { const u = Math.max(0, Math.min(1, (L / 2 - z) / L)); const i = Math.round(u * (H.secao.length - 1)); return H.secao[Math.min(H.secao.length - 1, i)][16][0]; };
  /* v1.2.31: SEM numeral de casco (instrução do Valter 20:12) */
  [-1, 1].forEach((sx) => { const za = Z(L * 0.09), ya = dY(za) * 0.72; g.add(mesh(caixa(0.14, Math.max(1.1, L * 0.009), Math.max(1.4, L * 0.011)), M.escuro, 1).translateX(sx * (meiaReal(za) * 0.97 + 0.02)).translateY(ya).translateZ(za)); });
  /* ---- casaria: blocos facetados ---- */
  const topoBloco = {}; let yMaxSup = 0; const NOVO = true; let SP = null; if (NOVO) { SP = montaSuper1231({ id, S, M, g, Z, dY, mDk, P }); topoBloco.passadico = SP.passadico; topoBloco.exaustaoB = SP.exaustao; }
  for (const b of (NOVO ? [] : S.blocos)) { const zc = Z((b.z0 + b.z1) / 2), len = b.z1 - b.z0, wid = b.w * 2 * mDk(zc), y = dY(zc) + (b.y || 0); const m = mesh(bloco(wid, len, b.h, b.enc, 0.2), b.mat === 'escuro' ? M.escuro : M.sup); m.position.set(0, y, zc); g.add(m); topoBloco[b.n] = { y: y + b.h, zc, len, wid, y0: y, b }; yMaxSup = Math.max(yMaxSup, y + b.h);
    const lado = (b.n.startsWith('casa') || b.n === 'baseCasaria' || b.n === 'torreMastro' || b.n === 'passadico') && b.mat !== 'escuro';
    if (lado) for (const sx of [-1, 1]) { const hw = wid / 2 * (1 - (1 - b.enc) * 0.45) + 0.04; const gv = new THREE.PlaneGeometry(len * 0.78, Math.min(1.1, b.h * 0.3)); { const uvv = gv.attributes.uv, rep = Math.max(2, Math.round(len * 0.78 / 2.4)); for (let i = 0; i < uvv.count; i++) uvv.setX(i, uvv.getX(i) * rep); } const v = new THREE.Mesh(gv, M.vigia); v.position.set(sx * hw, y + b.h * 0.42, zc); v.rotation.y = sx * Math.PI / 2; v.userData.det = 1; g.add(v); }
    if (b.n.startsWith('passadico') && b.n !== 'passadico2') { const jan = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.8, 1.2), M.janela); jan.position.set(0, y + b.h * 0.58, zc - len / 2 * (1 + 0.0) + len * (1 - b.enc) * 0.12 - 0.05); jan.rotation.order = 'YXZ'; jan.rotation.y = Math.PI; jan.rotation.x = 0.2; jan.userData.det = 1; g.add(jan); }
    if (b.n === 'hangar') { const pr = new THREE.Mesh(new THREE.PlaneGeometry(wid * 0.72, b.h * 0.8), M.hangar); pr.position.set(0, y + b.h * 0.46, zc + len / 2 + 0.05); pr.userData.det = 1; g.add(pr); } }
  /* convés de voo (convoo) com marca do heliponto */
  { const h0 = Z(S.heli.pad ? S.heli.pad[0] : S.heli.zb0), h1 = Z(S.heli.pad ? S.heli.pad[1] : S.heli.zb1), zc = (h0 + h1) / 2, cl = h1 - h0; const pad = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(mDk(zc) * 1.7, cl * 1.25), cl), M.heli); pad.rotation.x = -Math.PI / 2; pad.rotation.z = Math.PI; pad.position.set(0, dY(zc) + 0.07, zc); pad.userData.det = 1; g.add(pad); }
  /* ---- mastro + radares (por navio) ---- */
  const bP = topoBloco.passadico; let yTopo = 0;
  if (NOVO) { yTopo = SP.yTopo; for (const q of S.ssm || []) { const m = ssm(M); const z = Z(q.zb); m.position.set(q.lado * (mDk(z) - 1.9), dY(z), z); m.rotation.y = q.lado > 0 ? -0.35 : 0.35; g.add(m); } }
  else if (id === 'sejong') { const zA = topoBloco.casaA, yy = bP.y; yTopo = mastroTrelica(M, g, 0, yy, Z(S.mastro.zb), S.mastro.topo - yy); /* topo = 50 m sobre a LA */
    /* 4 painéis SPY-1D octogonais nas faces da casaria A, abaixo das janelas */ const yA = dY(zA.zc) + 5.0; const zF = Z(S.blocos[1].z0 + 2.4), zR = Z(S.blocos[1].z1 - 2.4); const xw = zA.wid / 2 * 0.86;
    painelRadar(M, g, xw * 0.78, yA, zF - 1.0, -Math.PI / 4 - 0.1 + Math.PI, 3.7, 1); painelRadar(M, g, -xw * 0.78, yA, zF - 1.0, Math.PI / 4 + 0.1 + Math.PI, 3.7, 1);
    painelRadar(M, g, xw + 0.5, yA, zR, Math.PI / 2 - 0.5, 3.7, 1); painelRadar(M, g, -xw - 0.5, yA, zR, -Math.PI / 2 + 0.5, 3.7, 1);
    for (const [dx, dz] of [[-4.2, 3], [4.2, 3], [-3.6, 11], [3.6, 11]]) { const dmo = mesh(new THREE.SphereGeometry(1.1, 12, 8), M.claro); dmo.position.set(dx, bP.y, Z(S.blocos[2].z0) + dz); g.add(dmo); }
    for (const sx of [-1, 1]) { const ilu = mesh(cil(0.35, 0.4, 0.5, 10), M.claro, 1); ilu.position.set(sx * 3.3, bP.y + 0.3, Z(S.blocos[2].z1 - 2)); g.add(ilu); }
    for (const q of S.ssm) { const m = ssm(M); const z = Z(q.zb); m.position.set(q.lado * (mDk(z) - 1.9), dY(z), z); m.rotation.y = q.lado > 0 ? -0.35 : 0.35; m.traverse((o) => { o.userData.det = 1; }); g.add(m); } }
  else if (id === 'nanchang') { const yy = bP.y; yTopo = mastroPiramide(M, g, 0, yy, Z(S.mastro.zb), S.mastro.topo - yy, 7.4, 11.5, 0.34);
    const yS = dY(bP.zc) + 9.0, hx = bP.wid / 2 * 0.9; /* 4 painéis S-band (Type 346B) nas faces da casaria + 4 painéis X-band menores no mastro */
    painelRadar(M, g, hx * 0.62, yS, Z(66) - 0.2, Math.PI - 0.62, 4.0, 0, -0.12); painelRadar(M, g, -hx * 0.62, yS, Z(66) - 0.2, Math.PI + 0.62, 4.0, 0, -0.12); painelRadar(M, g, hx + 0.1, yS, Z(88), Math.PI / 2 - 0.35, 4.0, 0, -0.12); painelRadar(M, g, -hx - 0.1, yS, Z(88), -Math.PI / 2 + 0.35, 4.0, 0, -0.12);
    const yX = yy + (S.mastro.topo - yy) * 0.62, zm = Z(S.mastro.zb); for (const [yw, ox, oz] of [[Math.PI, 0, -3.0], [0, 0, 3.0], [Math.PI / 2, 2.3, 0], [-Math.PI / 2, -2.3, 0]]) painelRadar(M, g, ox, yX, zm + oz, yw, 2.0, 0, -0.1);
    const cn = topoBloco.casaPopa; for (const sx of [-1, 1]) { const al = mesh(caixa(0.3, 5.2, 0.3), M.claro, 1); al.position.set(sx * 5.5, cn.y, Z(104)); g.add(al); } }
  else { /* Nakhimov: torre-mastro piramidal + radar plano giratório + 2º mastro de ré com domos */ const tm = topoBloco.torreMastro; const yy = tm.y; yTopo = mastroPiramide(M, g, 0, yy, Z(S.mastro.zb), S.mastro.topo - yy - 4, 8.0, 10.5, 0.3);
    const rd = g.getObjectByName('radar'); const big = mesh(caixa(8.0, 3.6, 0.35), M.escuro); big.position.y = 1.9; rd.add(big); rd.position.y += 1.5;
    for (const sx of [-1, 1]) { const dm2 = mesh(new THREE.SphereGeometry(1.2, 12, 8), M.claro); dm2.position.set(sx * 3.2, yy + 3.2, Z(S.mastro.zb) - 6); g.add(dm2); }
    const x2 = 0, z2 = Z(168), y2 = topoBloco.casaPopa.y; const H2 = 26; for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tubo(new THREE.Vector3(x2 + sx * 1.8, y2, z2 + sz * 1.8), new THREE.Vector3(x2 + sx * 0.3, y2 + H2, z2 + sz * 0.3), 0.16, M.sup, g);
    const r2 = new THREE.Group(); r2.name = 'radar2'; r2.position.set(x2, y2 + H2 * 0.75, z2); r2.add(mesh(caixa(5.0, 2.4, 0.3), M.escuro).translateY(1.3)); g.add(r2);
    for (const sx of [-1, 1]) { const bl = mesh(caixa(2.6, 1.4, 1.4), M.claro, 1); bl.position.set(sx * 2.0, y2 + H2 * 0.5, z2); g.add(bl); }
    const gc = mesh(cil(0.4, 0.5, 6, 8), M.escuro, 1); gc.position.set(0, tm.y + 2.5, Z(S.mastro.zb) + 7); g.add(gc); }
  /* ---- armas (posições = layout1231 = sim) ---- */
  P.torres.forEach((t, i) => { const tc = torre(M, C.canhao.cal, id === 'nakhimov' ? 1 : 0); tc.scale.setScalar(t.esc); tc.name = 'torre' + i; tc.position.set(0, t.y, t.z); if (t.frente < 0) tc.rotation.y = Math.PI; g.add(tc); });
  for (const b of P.blocosVls) { if (b.fort) continue; const bs = mesh(caixa(b.col * b.cs + 0.6, 0.26, b.lin * b.cs + 0.6), M.escuro); bs.position.set(b.xc || 0, b.y + 0.1, b.zc); g.add(bs);
    { const W = b.col * b.cs + 0.6, D = b.lin * b.cs + 0.6; const wl = (w, h, d, x, z) => { const m = mesh(caixa(w, h, d), M.sup); m.position.set((b.xc || 0) + x, b.y + 0.13 + h / 2, b.zc + z); g.add(m); }; /* moldura (braçola) elevada em volta do bloco + trilhos de divisão entre módulos */ wl(W + 0.3, 0.42, 0.22, 0, -D / 2 - 0.02); wl(W + 0.3, 0.42, 0.22, 0, D / 2 + 0.02); wl(0.22, 0.42, D, -W / 2 - 0.02, 0); wl(0.22, 0.42, D, W / 2 + 0.02, 0);
      for (const fx of [0.5]) { const m = mesh(caixa(0.16, 0.2, D - 0.2), M.escuro); m.position.set((b.xc || 0) - W / 2 + 0.3 + fx * (W - 0.6), b.y + 0.3, b.zc); g.add(m); const m2 = mesh(caixa(W - 0.2, 0.2, 0.16), M.escuro); m2.position.set(b.xc || 0, b.y + 0.3, b.zc); g.add(m2); } }
    const cb = mesh(caixa(b.col * b.cs + 0.9, 0.12, 0.2), M.claro, 1); for (const sz of [-1, 1]) { const c2 = cb.clone(); c2.position.set(b.xc || 0, b.y + 0.2, b.zc + sz * (b.lin * b.cs / 2 + 0.4)); g.add(c2); } }
  if (S.fort) for (let k = 0; k < 12; k++) { const c0 = P.sam[k * 8]; const zc = P.sam.slice(k * 8, k * 8 + 8).reduce((s, q) => s + q.z, 0) / 8, xc = P.sam.slice(k * 8, k * 8 + 8).reduce((s, q) => s + q.x, 0) / 8; const base = mesh(cil(1.75, 1.85, 0.28, 24), M.escuro); base.position.set(xc, c0.y - 0.12, zc); g.add(base); const ring = mesh(new THREE.TorusGeometry(1.72, 0.1, 6, 24).rotateX(Math.PI / 2), M.claro, 1); ring.position.set(xc, c0.y + 0.08, zc); g.add(ring); }
  if (P.celulas.length) { const tampas = new THREE.InstancedMesh(mergeGeometries([caixa(0.9, 0.07, 0.9), caixa(0.64, 0.05, 0.56).translate(0, 0.055, 0.06), caixa(0.5, 0.04, 0.07).translate(0, 0.045, -0.36), caixa(0.1, 0.05, 0.1).translate(0, 0.05, 0.38)].map((q) => q.toNonIndexed ? (q.index ? q.toNonIndexed() : q) : q)).translate(0.46, 0, 0), M.sup, P.celulas.length); tampas.name = 'tampas'; tampas.castShadow = true; const mt = new THREE.Matrix4(), sc = new THREE.Matrix4(); P.celulas.forEach((c, i) => { const k = (c.w || 0.92) / 0.92; mt.makeTranslation(c.x - 0.46 * k, c.y, c.z); sc.makeScale(k, k, k); mt.multiply(sc); tampas.setMatrixAt(i, mt); { let h = Math.sin(i * 12.9898 + 4.1) * 43758.5453; h -= Math.floor(h); const v = h < 0.08 ? 0.62 : 0.84 + 0.2 * (h - 0.08); tampas.setColorAt(i, new THREE.Color(v, v, v * 1.02)); /* tampas com pintura/desgaste desiguais */ } }); g.add(tampas); }
  for (const tb of P.tubos) { const pt = mesh(caixa(0.1, 0.9, 1.6), M.escuro, 1); pt.position.set(tb.x / 0.9 * 0.99, -0.55, tb.z); g.add(pt); }
  P.ciws.forEach((c, i) => { const m = antiaerea(M, c.tipo); m.name = 'ciws' + i; m.position.set(c.x, c.y - c.piv, c.z); g.add(m); });
  P.granadas.forEach((gm, gi) => { const lg = rbu(M); lg.name = 'lg' + gi; lg.position.set(gm.x, gm.y, gm.z); lg.rotation.y = -gm.centro; lg.traverse((o) => { o.userData.det = 1; }); g.add(lg); });
  /* compartimento nuclear (acréscimo do jogo) */
  { const nk = compNuclear(M, P.nuke.w, P.nuke.l, texAviso()); nk.position.set(P.nuke.x, P.nuke.y, P.nuke.z); g.add(nk); }
  /* corrimãos: linhas finas nas bordas do convés (LineSegments: sem custo de malha) */
  { const seg = []; const rail = (z0, z1, step = 2) => { for (let z = z0; z < z1; z += step) { const za = z, zb2 = Math.min(z + step, z1); for (const sx of [-1, 1]) for (const f of [1, 0.5]) seg.push(sx * (mDk(za) - 0.25), dY(za) + 1.05 * f, za, sx * (mDk(zb2) - 0.25), dY(zb2) + 1.05 * f, zb2); } }; rail(-L / 2 + 2, L / 2 - 1.5);
    const lg2 = new THREE.BufferGeometry(); lg2.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3)); const ls = new THREE.LineSegments(lg2, M.linha); ls.userData.det = 1; g.add(ls); }
  /* pau da bandeira e flâmula */
  { const zp = L / 2 - 1.5, fl = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), new THREE.MeshStandardMaterial({ color: id === 'sejong' ? '#f2f2f2' : id === 'nanchang' ? '#c0201f' : '#e8e8ee', side: THREE.DoubleSide, roughness: 0.8 })); fl.position.set(0, dY(zp) + 3.2, zp + 1.6); fl.rotation.y = Math.PI / 2; fl.userData.det = 1; fl.name = 'flamula'; g.add(fl); g.add(mesh(cil(0.06, 0.08, 4.2, 6), M.claro).translateY(dY(zp) + 2.1).translateZ(zp)); }
  /* chaminés / exaustão: fumaça sai do bloco de exaustão */
  { const ex = topoBloco.exaustaoA || topoBloco.exaustaoB || topoBloco.exaustao; const ex2 = ex || topoBloco.casaPopa; g.userData.chamine = new THREE.Vector3(0, ex2.y + 0.3, ex2.zc); }
  { const h0 = topoBloco.passadico; g.userData.holofote = new THREE.Vector3(0, h0.y + 1.0, h0.zc - h0.len / 2 + 2); }
  { const rL = 0.34, T = new THREE.Vector3(0, yTopo, Z(S.mastro.zb)); const lt = new THREE.Mesh(new THREE.SphereGeometry(rL, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff8e7' })); lt.position.set(T.x, T.y + rL * 0.9, T.z); lt.userData.luz = 1; lt.name = 'luzTopo'; g.add(lt); g.userData.topoMastro = T.clone(); g.userData.luzTopo = lt.position.clone(); g.userData.raioLuz = rL; }
  g.userData.matCasco = mc; g.userData.matSup = M.sup; g.userData.matConves = M.conves; g.userData.m1231 = 1;
  return funde1231(g);
}
let _VCP = null, _VCV = null;
const VC_PLANO = () => _VCP || (_VCP = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.55, metalness: 0.3 }));
const VC_VEU = (m) => _VCV || (_VCV = new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, depthWrite: false, polygonOffset: m.polygonOffset, polygonOffsetFactor: m.polygonOffsetFactor, polygonOffsetUnits: m.polygonOffsetUnits }));
/** Fusão estática por material (como funde() do jogo): peças dinâmicas ficam soltas; o resto vira 1 malha por material (+1 'det' por material). */
function funde1231(root) {
  const DIN = /^(sec_\d+|lg\d|torre\d|ciws\d|a30_\d|radar|radar2|radar3|flamula|tampas|linhas|nomeOuro|nomeOuroPopa|nk1231|luzTopo)$/; root.updateMatrixWorld(true); const grupos = new Map(), remover = [];
  /* v1.2.31 (draws): materiais lisos (sem textura) viram UM material de cor-por-vértice (cor baked = cor do material original) e véus translúcidos viram UM material RGBA; pedestais de CIWS (simétricos) viram parte do casco estático */
  for (const c of root.children.slice()) if (/^ciws\d+$/.test(c.name)) for (const q of c.children.slice()) if (q.isMesh && q.userData.estatico) root.attach(q);
  root.traverse((o) => { if (!o.isMesh || o.isInstancedMesh || o.userData.luz || Array.isArray(o.material)) return; const m = o.material; let alvo = null, rgba = null;
    if (m.isMeshStandardMaterial && !m.map && !m.normalMap && !m.emissiveMap && !m.transparent && !m.vertexColors && m.side === THREE.FrontSide && (!m.emissive || m.emissive.getHex() === 0) && !m.userData.luzMax && !m.roughnessMap && !m.bumpMap) { alvo = VC_PLANO(); rgba = [m.color.r, m.color.g, m.color.b]; }
    else if (m.isMeshBasicMaterial && m.transparent && !m.map && m.opacity < 1 && m.depthWrite === false && m.side === THREE.FrontSide) { alvo = VC_VEU(m); rgba = [m.color.r, m.color.g, m.color.b, m.opacity]; }
    if (!alvo) return; const gg = o.geometry.clone(), nv = gg.attributes.position.count, k = rgba.length, arr = new Float32Array(nv * k); for (let i = 0; i < nv; i++) for (let q = 0; q < k; q++) arr[i * k + q] = rgba[q]; gg.setAttribute('color', new THREE.BufferAttribute(arr, k)); o.geometry = gg; o.material = alvo; });
  const visita = (o) => { for (const c of o.children.slice()) { if (DIN.test(c.name)) continue; if (c.isMesh && !c.isInstancedMesh && !c.userData.luz && !Array.isArray(c.material)) { const k = c.material.uuid + ''; if (!grupos.has(k)) grupos.set(k, { mat: c.material, det: false, geos: [] });
        let gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); gg.applyMatrix4(c.matrixWorld); if (c.matrixWorld.determinant() < 0) { for (const a of Object.values(gg.attributes)) { const v = a.array, n = a.itemSize; for (let i = 0; i + 3 * n <= v.length; i += 3 * n) for (let q = 0; q < n; q++) { const t = v[i + n + q]; v[i + n + q] = v[i + 2 * n + q]; v[i + 2 * n + q] = t; } } }
        const keep = ['position', 'normal', 'uv'].concat(c.material.vertexColors ? ['color'] : []); for (const a of Object.keys(gg.attributes)) if (!keep.includes(a)) gg.deleteAttribute(a); if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); if (!gg.attributes.normal) gg.computeVertexNormals();
        grupos.get(k).geos.push(gg); remover.push(c); } visita(c); } };
  visita(root); for (const c of remover) c.parent.remove(c);
  /* 2ª passada: dentro de cada grupo DINÂMICO (torre/ciws/lg/radar…) funde as malhas-filhas diretas de mesmo material no espaço LOCAL do grupo (a articulação — rotação de pivô/cab/cano — continua nos grupos; só os meshes irmãos viram 1). */
  const fundeLocal = (gr) => { for (const c of gr.children.slice()) if (c.isGroup || c.type === 'Group') fundeLocal(c);
    const por = new Map(); for (const c of gr.children.slice()) { if (!c.isMesh || c.isInstancedMesh || c.userData.luz || Array.isArray(c.material) || DIN.test(c.name) || c.userData.nofunde) continue; c.updateMatrix(); const k = c.material.uuid; if (!por.has(k)) por.set(k, []); por.get(k).push(c); }
    for (const arr of por.values()) { if (arr.length < 2) continue; const geos = []; for (const c of arr) { let gg = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); gg.applyMatrix4(c.matrix); if (c.matrix.determinant() < 0) { for (const a2 of Object.values(gg.attributes)) { const v = a2.array, n = a2.itemSize; for (let i = 0; i + 3 * n <= v.length; i += 3 * n) for (let q = 0; q < n; q++) { const t = v[i + n + q]; v[i + n + q] = v[i + 2 * n + q]; v[i + 2 * n + q] = t; } } }
        const keep = ['position', 'normal', 'uv'].concat(arr[0].material.vertexColors ? ['color'] : []); for (const a2 of Object.keys(gg.attributes)) if (!keep.includes(a2)) gg.deleteAttribute(a2); if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); if (!gg.attributes.normal) gg.computeVertexNormals(); geos.push(gg); }
      const m = mergeGeometries(geos, false); if (!m) continue; const x = new THREE.Mesh(m, arr[0].material); x.castShadow = arr.some((q) => q.castShadow); x.receiveShadow = arr[0].receiveShadow; x.name = arr[0].name; gr.add(x); for (const c of arr) gr.remove(c); geos.forEach((q) => q.dispose()); } };
  for (const c of root.children.slice()) if (DIN.test(c.name) && c.type === 'Group' && !/^(radar|radar2|radar3)$/.test(c.name) || /^(radar|radar2|radar3)$/.test(c.name) && c.type === 'Group') fundeLocal(c);
  const limpa = (o) => { for (const c of o.children.slice()) { limpa(c); if (c.type === 'Group' && !c.children.length && !DIN.test(c.name)) o.remove(c); } }; limpa(root);
  for (const { mat, det, geos } of grupos.values()) { const m = mergeGeometries(geos, false); if (!m) continue; const x = new THREE.Mesh(m, mat); x.castShadow = true; x.receiveShadow = true; x.name = det ? 'det' : 'base'; if (det) x.userData.det = 1; root.add(x); geos.forEach((q) => q.dispose()); }
  return root;
}
