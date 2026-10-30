// v1.2.26 — REALISMO dos 8 navios novos (pedido do Valter 18:40): materiais PBR das aeronaves (pintura com painéis/rebites/sujeira,
// cúpula com película dourada, compósito fosco, revestimento furtivo), convés dos gigantes com DESGASTE em decalque único
// (chapas soldadas, marcas de pneu na área de pouso, fuligem dos defletores de jato, óleo/combustível brilhante, ferrugem nas bordas,
// pintura gasta) e ilha detalhada (mastro treliçado, antenas, domos, corrimãos). Tudo procedural (sem assets externos), determinístico.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bordaPA, PLANO_PA, eixoAngPA, ilhasPA } from '../sim/classes1225.js';
import { aplicaPele, matCupula } from './peleAero1269.js'; /* v1.2.69 */

const rnd0 = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const aniso = () => globalThis.__nnsAniso || 8;
const cv = (w, h) => { const c = typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* ---------- aeronaves: pintura PBR ---------- */
let TAER = null;
function texAeronave() { if (TAER) return TAER; const W = 512, c = cv(W, W), x = c.getContext('2d', { willReadFrequently: true }) /* v1.2.26: raster na CPU (o 2D acelerado adiava ~13 mil operações para o upload da textura → travada) */, r = cv(W, W), y = r.getContext('2d', { willReadFrequently: true }) /* v1.2.26: raster na CPU (o 2D acelerado adiava ~13 mil operações para o upload da textura → travada) */, rnd = rnd0(1226);
  x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, W, W); y.fillStyle = '#8c8c8c'; y.fillRect(0, 0, W, W); /* roughness ~0.55 */
  // manchas grandes (retoques de pintura em tons levemente diferentes — típico de aeronave embarcada)
  for (let i = 0; i < 22; i++) { const px = rnd() * W, py = rnd() * W, w = 30 + rnd() * 120, h = 20 + rnd() * 80, v = 185 + rnd() * 40 | 0; x.fillStyle = `rgba(${v},${v},${v + 3},0.35)`; x.fillRect(px, py, w, h); y.fillStyle = `rgba(${110 + rnd() * 60 | 0},0,0,0.4)`; y.fillRect(px, py, w, h); }
  // painéis (linhas de junta escuras + realce) e rebites
  x.lineWidth = 1.2; for (let i = 0; i < 9; i++) { const p = (i + 0.3 + rnd() * 0.4) * W / 9; x.strokeStyle = 'rgba(40,44,48,0.55)'; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, W); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.moveTo(p + 1.3, 0); x.lineTo(p + 1.3, W); x.stroke(); }
  for (let i = 0; i < 7; i++) { const p = (i + 0.5) * W / 7 + (rnd() - 0.5) * 16; x.strokeStyle = 'rgba(40,44,48,0.5)'; x.beginPath(); x.moveTo(0, p); x.lineTo(W, p); x.stroke(); for (let k = 0; k < W; k += 7) { x.fillStyle = 'rgba(60,64,68,0.45)'; x.fillRect(k, p + 3, 1.2, 1.2); } }
  // escorridos de fluido hidráulico/fuligem a partir das juntas (sentido do fluxo de ar) e desgaste nas bordas de ataque
  for (let i = 0; i < 60; i++) { const px = rnd() * W, py = rnd() * W, L = 20 + rnd() * 90; const g = x.createLinearGradient(px, py, px + L, py); g.addColorStop(0, 'rgba(48,46,42,0.32)'); g.addColorStop(1, 'rgba(48,46,42,0)'); x.fillStyle = g; x.fillRect(px, py, L, 1.5 + rnd() * 3); y.fillStyle = 'rgba(70,0,0,0.25)'; y.fillRect(px, py, L * 0.6, 2); }
  for (let i = 0; i < 2600; i++) { const v = rnd() * 60 + 150 | 0; x.fillStyle = `rgba(${v},${v},${v},0.25)`; x.fillRect(rnd() * W, rnd() * W, 1, 1); }
  const t = new THREE.CanvasTexture(c), tr = new THREE.CanvasTexture(r); for (const q of [t, tr]) { q.wrapS = q.wrapT = THREE.RepeatWrapping; q.anisotropy = aniso(); } t.colorSpace = THREE.SRGBColorSpace; return (TAER = { t, tr }); }
const CACHE = new Map();
/** Converte os materiais simples da aeronave em PBR (mantém a cor/camuflagem base). furtivo → revestimento absorvente mais fosco e escuro. */
export function matsAeronave1226(M, furtivo = 0) { const key = (M.c && M.c.uuid) + ':' + furtivo + ':' + (M.camo || 'padrao'); if (CACHE.has(key)) return CACHE.get(key); const T = texAeronave();
  const base = M.c && M.c.color ? M.c.color.clone() : new THREE.Color('#858c93'); if (furtivo) base.multiplyScalar(0.78);
  const c = new THREE.MeshStandardMaterial({ color: base, map: T.t, roughnessMap: T.tr, roughness: furtivo ? 0.95 : 0.72, metalness: furtivo ? 0.12 : 0.32, envMapIntensity: 0.85 });
  const esc = new THREE.MeshStandardMaterial({ color: '#2b2f33', map: T.t, roughnessMap: T.tr, roughness: 0.8, metalness: 0.25, envMapIntensity: 0.6 }); /* bocais, radomes, trem, compósito */
  aplicaPele(c, M.camo, 1); const vid = matCupula(furtivo); /* v1.2.69: camuflagem com padrão + painéis/rebites no espaço do modelo; cúpula de vidro transparente */
  const out = Object.assign({}, M, { c, c2: c, claro: c, esc, vid }); CACHE.set(key, out); return out; }
export const FURTIVO_1226 = { tesourao: 1, marimbondo: 1, bombardeiroNuclear: 1 };

/* ---------- convés: decalque de desgaste ---------- */
/** Um único plano transparente sobre todo o convés de voo do gigante (+1 chamada de desenho). */
const DESG = new Map(); /* cache por navio: a textura é gerada UMA vez por sessão (showroom/partida reaproveitam) */
export function convesDesgaste1226(g, C, P, catsGiga) { const hit = DESG.get(C.id); if (hit) { const me = new THREE.Mesh(hit.geo, hit.m); me.name = 'desgaste1226'; me.receiveShadow = true; me.renderOrder = 1; g.add(me); return me; } const t0 = typeof performance !== 'undefined' ? performance.now() : 0; const L = C.L, PL = PLANO_PA[C.id], yD = P.pa1225.yD + 0.8, ra = Math.atan(PL.ang), xc = (z) => eixoAngPA(C, z), il = ilhasPA(C);
  let xMin = 0, xMax = 0; for (let i = 0; i <= 200; i++) { const z = -L / 2 + L * i / 200; xMin = Math.min(xMin, bordaPA(C, z, 'bb')); xMax = Math.max(xMax, bordaPA(C, z, 'be')); }
  const W = 512, H = 2048, sx = W / (xMax - xMin), sz = H / L, X = (x) => (x - xMin) * sx, Z = (z) => (z + L / 2) * sz, rnd = rnd0(C.L * 7 | 0);
  const c = cv(W, H), x = c.getContext('2d', { willReadFrequently: true }) /* v1.2.26: raster na CPU (o 2D acelerado adiava ~13 mil operações para o upload da textura → travada) */, r = cv(W, H), y = r.getContext('2d', { willReadFrequently: true }) /* v1.2.26: raster na CPU (o 2D acelerado adiava ~13 mil operações para o upload da textura → travada) */;
  // máscara da planta do convés
  const planta = (ctx) => { ctx.beginPath(); for (let i = 0; i <= 200; i++) { const z = -L / 2 + L * i / 200; ctx[i ? 'lineTo' : 'moveTo'](X(bordaPA(C, z, 'be')), Z(z)); } for (let i = 200; i >= 0; i--) { const z = -L / 2 + L * i / 200; ctx.lineTo(X(bordaPA(C, z, 'bb')), Z(z)); } ctx.closePath(); };
  x.clearRect(0, 0, W, H); y.fillStyle = 'rgb(232,232,232)'; y.fillRect(0, 0, W, H); /* rugosidade alta (antiderrapante) */
  x.save(); planta(x); x.clip(); y.save(); planta(y); y.clip();
  // 1) sujeira de baixa frequência (variação do antiderrapante, lavagem irregular)
  for (let i = 0; i < 420; i++) { const px = rnd() * W, py = rnd() * H, rr = 12 + rnd() * 60, d = rnd() < 0.5; const gr = x.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, d ? 'rgba(20,20,18,0.16)' : 'rgba(150,150,140,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(px - rr, py - rr, rr * 2, rr * 2); }
  // 2) chapas soldadas: juntas longitudinais (2,4 m) e transversais (9,6 m, desencontradas)
  x.lineWidth = 1; for (let xx = Math.ceil(xMin / 2.4) * 2.4; xx < xMax; xx += 2.4) { x.strokeStyle = 'rgba(14,14,14,0.22)'; x.beginPath(); x.moveTo(X(xx), 0); x.lineTo(X(xx), H); x.stroke(); }
  for (let xx = Math.ceil(xMin / 2.4) * 2.4, k = 0; xx < xMax; xx += 2.4, k++) for (let zz = -L / 2 + (k % 2) * 4.8; zz < L / 2; zz += 9.6) { x.strokeStyle = 'rgba(14,14,14,0.2)'; x.beginPath(); x.moveTo(X(xx), Z(zz)); x.lineTo(X(xx + 2.4), Z(zz)); x.stroke(); }
  // 3) marcas de pneu na área de pouso (do toque ~0,38L até o fim da corrida ~0,22L), mais densas no toque
  const zT = L * 0.38; for (let i = 0; i < 520; i++) { const u = Math.pow(rnd(), 0.7), z0 = zT + (rnd() - 0.3) * 40 - u * 30, len = 14 + rnd() * 55, off = (rnd() - 0.5) * 9.5, gear = [-2.6, 0, 2.6][i % 3];
    const p0 = xc(z0) + (off + gear) / Math.cos(ra), z1 = z0 - len; x.strokeStyle = `rgba(8,8,8,${0.07 + rnd() * 0.16})`; x.lineWidth = 0.35 * sx + rnd() * 0.3 * sx; x.beginPath(); x.moveTo(X(p0), Z(z0)); x.quadraticCurveTo(X(p0 + (rnd() - 0.5) * 1.6 - ra * len * 0.5), Z(z0 - len / 2), X(p0 - Math.tan(ra) * len), Z(z1)); x.stroke(); }
  for (let i = 0; i < 40; i++) { const z0 = zT - rnd() * 70, p0 = xc(z0) + (rnd() - 0.5) * 6, gr = x.createRadialGradient(X(p0), Z(z0), 0, X(p0), Z(z0), 14 + rnd() * 24); gr.addColorStop(0, 'rgba(10,10,10,0.18)'); gr.addColorStop(1, 'rgba(10,10,10,0)'); x.fillStyle = gr; x.fillRect(X(p0) - 40, Z(z0) - 40, 80, 80); }
  // 4) fuligem atrás do defletor de jato de cada catapulta (jato aponta para ré, +z)
  for (const [cx, , z1] of catsGiga) for (let i = 0; i < 18; i++) { const zz = z1 + 4 + rnd() * 26, xx = cx + (rnd() - 0.5) * 7, rr = (5 + rnd() * 8) * sx; const gr = x.createRadialGradient(X(xx), Z(zz), 0, X(xx), Z(zz), rr); gr.addColorStop(0, 'rgba(6,5,4,0.22)'); gr.addColorStop(1, 'rgba(6,5,4,0)'); x.fillStyle = gr; x.fillRect(X(xx) - rr, Z(zz) - rr, rr * 2, rr * 2); }
  // 5) manchas de óleo/combustível (escuras e BRILHANTES na rugosidade), mais nos parques das bordas e ao redor das ilhas
  for (let i = 0; i < 260; i++) { let zz = (rnd() - 0.5) * L * 0.96, edge = rnd() < 0.7, xx; if (edge) { const lado = rnd() < 0.55 ? 'be' : 'bb', b = bordaPA(C, zz, lado); xx = b - Math.sign(b) * (3 + rnd() * 16); } else xx = xMin + rnd() * (xMax - xMin);
    if (rnd() < 0.12 && il.length) { const I = il[i % il.length]; zz = I.z0 + rnd() * I.c; xx = I.xi - 2 - rnd() * 8; }
    const rr = (0.4 + rnd() * 1.6) * sx, ex = 0.6 + rnd() * 0.9; x.save(); x.translate(X(xx), Z(zz)); x.scale(1, ex); const gr = x.createRadialGradient(0, 0, 0, 0, 0, rr); gr.addColorStop(0, 'rgba(12,10,8,0.5)'); gr.addColorStop(0.7, 'rgba(18,16,12,0.3)'); gr.addColorStop(1, 'rgba(18,16,12,0)'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, rr, 0, 7); x.fill(); x.restore();
    y.save(); y.translate(X(xx), Z(zz)); y.scale(1, ex); y.fillStyle = 'rgba(70,70,70,0.75)'; y.beginPath(); y.arc(0, 0, rr * 0.75, 0, 7); y.fill(); y.restore(); }
  // 6) ferrugem: faixa irregular nas bordas (água parada nos embornais), escorridos para dentro e pontos
  for (let i = 0; i < 900; i++) { const zz = (rnd() - 0.5) * L, lado = rnd() < 0.5 ? 'be' : 'bb', b = bordaPA(C, zz, lado), d = Math.pow(rnd(), 2) * 2.2, xx = b - Math.sign(b) * d, rr = (0.1 + rnd() * 0.35) * sx;
    x.fillStyle = `rgba(${78 + rnd() * 30 | 0},${46 + rnd() * 16 | 0},${26 + rnd() * 10 | 0},${0.1 + rnd() * 0.22})`; x.beginPath(); x.arc(X(xx), Z(zz), rr, 0, 7); x.fill(); y.fillStyle = 'rgba(250,250,250,0.6)'; y.beginPath(); y.arc(X(xx), Z(zz), rr, 0, 7); y.fill(); }
  for (let i = 0; i < 90; i++) { const zz = (rnd() - 0.5) * L, lado = rnd() < 0.5 ? 'be' : 'bb', b = bordaPA(C, zz, lado), len = (1 + rnd() * 3.5) * sx, x0 = X(b - Math.sign(b) * 0.3), dir = -Math.sign(b); const gr = x.createLinearGradient(x0, 0, x0 + dir * len, 0); gr.addColorStop(0, 'rgba(120,58,24,0.5)'); gr.addColorStop(1, 'rgba(120,58,24,0)'); x.fillStyle = gr; x.fillRect(Math.min(x0, x0 + dir * len), Z(zz), len, 1 + rnd() * 2); }
  // 7) pintura gasta: marcas brancas/amarelas raspadas (pontos claros de desgaste ao longo das faixas e do eixo da pista)
  for (let i = 0; i < 1600; i++) { const zz = -L * 0.14 + rnd() * L * 0.63, xx = xc(zz) + (rnd() - 0.5) * 30; x.fillStyle = `rgba(${40 + rnd() * 30 | 0},${40 + rnd() * 30 | 0},${40 + rnd() * 30 | 0},${0.12 + rnd() * 0.2})`; x.fillRect(X(xx), Z(zz), 1 + rnd() * 3, 1 + rnd() * 2); }
  for (let i = 0; i < 9000; i++) { const v = rnd() * 70 | 0; x.fillStyle = `rgba(${v},${v},${v},0.13)`; x.fillRect(rnd() * W, rnd() * H, 1, 1); }
  x.restore(); y.restore();
  const t = new THREE.CanvasTexture(c), tr = new THREE.CanvasTexture(r); for (const q of [t, tr]) { q.anisotropy = aniso(); q.generateMipmaps = true; } t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughnessMap: tr, roughness: 1, metalness: 0.05, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, envMapIntensity: 0.8 });
  const geo = new THREE.PlaneGeometry(xMax - xMin, L).rotateX(-Math.PI / 2).translate((xMin + xMax) / 2, yD + 0.07, 0); /* uv: u→x, v→−z (topo da textura = proa) */
  DESG.set(C.id, { geo, m, ms: (typeof performance !== 'undefined' ? performance.now() : 0) - t0 }); globalThis.__desg1226 = Object.fromEntries([...DESG].map(([k, v]) => [k, Math.round(v.ms)])); const me = new THREE.Mesh(geo, m); me.name = 'desgaste1226'; me.receiveShadow = true; me.renderOrder = 1; g.add(me); return me; }

/* ---------- ilha: mastro treliçado, antenas, domos, corrimãos ---------- */
export function ilhaDetalhe1226(g, C, P, M) { const yD = P.pa1225.yD, il = ilhasPA(C), G = { esc: [], sup: [], claro: [] };
  const box = (k, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) => { const b = new THREE.BoxGeometry(w, h, d); if (rz) b.rotateZ(rz); if (rx) b.rotateX(rx); if (ry) b.rotateY(ry); b.translate(x, y, z); G[k].push(b); };
  const cil = (k, r1, r2, h, x, y, z, seg = 8) => { const b = new THREE.CylinderGeometry(r1, r2, h, seg); b.translate(x, y, z); G[k].push(b); };
  const barra = (k, a, b, r = 0.06) => { const d = new THREE.Vector3().subVectors(b, a), len = d.length(); const geo = new THREE.CylinderGeometry(r, r, len, 5); geo.translate(0, len / 2, 0); geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); geo.translate(a.x, a.y, a.z); G[k].push(geo); };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const corrimao = (cx, y, zc, w, c) => { const hw = w / 2 + 0.05, hc = c / 2 + 0.05; for (const [x0, z0, x1, z1] of [[-hw, -hc, hw, -hc], [hw, -hc, hw, hc], [hw, hc, -hw, hc], [-hw, hc, -hw, -hc]]) { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(len / 1.4));
      for (const yy of [0.55, 1.05]) box('esc', Math.abs(x1 - x0) || 0.05, 0.05, Math.abs(z1 - z0) || 0.05, cx + (x0 + x1) / 2, y + yy, zc + (z0 + z1) / 2);
      for (let i = 0; i <= n; i++) { const u = i / n; box('esc', 0.05, 1.1, 0.05, cx + x0 + (x1 - x0) * u, y + 0.55, zc + z0 + (z1 - z0) * u); } } };
  il.forEach((I) => { const nav = I.tipo !== 'ar', zc = (I.z0 + I.z1) / 2, cx = I.xc, w = I.w, c = I.c;
    // corrimãos nos tetos de cada nível e passadiço externo da ponte
    const lv = nav ? [3.6, 3.3] : [3.4]; let y = yD; for (const hh of lv) { y += hh; corrimao(cx, y, zc, w * 0.96, c * 0.9); }
    const yR = yD + (nav ? 11.8 : 7.2), yt = yR + (nav ? 9.5 : 6.5), zm = zc + c * 0.12;
    // mastro treliçado sobre o topo do mastro integrado: 4 pernas afuniladas + travamento em X + 2 plataformas + vergas
    const hM = nav ? 9 : 6, b0 = nav ? 1.5 : 1.1, b1 = 0.35, y0 = yt + 1.7; for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) barra('esc', V(cx + px * b0, y0, zm + pz * b0), V(cx + px * b1, y0 + hM, zm + pz * b1), 0.09);
    for (let k = 0; k < 4; k++) { const u0 = k / 4, u1 = (k + 1) / 4, s0 = b0 + (b1 - b0) * u0, s1 = b0 + (b1 - b0) * u1, ya = y0 + hM * u0, yb = y0 + hM * u1;
      for (const [ax, az, bx, bz] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { barra('esc', V(cx + ax * s0, ya, zm + az * s0), V(cx + bx * s1, yb, zm + bz * s1), 0.04); barra('esc', V(cx + bx * s0, ya, zm + bz * s0), V(cx + ax * s1, yb, zm + az * s1), 0.04); } }
    for (const u of [0.45, 0.82]) { const s = b0 + (b1 - b0) * u + 0.5, yy = y0 + hM * u; box('esc', s * 2, 0.12, s * 2, cx, yy, zm); box('esc', w * (u < 0.5 ? 1.3 : 0.9), 0.14, 0.14, cx, yy + 0.3, zm - 0.2); for (const sx of [-1, 1]) { cil('esc', 0.03, 0.05, 3.2, cx + sx * w * (u < 0.5 ? 0.62 : 0.42), yy + 1.9, zm - 0.2, 5); cil('sup', 0.22, 0.22, 0.5, cx + sx * s, yy + 0.4, zm + s * 0.7, 10); } }
    cil('esc', 0.05, 0.11, 4.5, cx, y0 + hM + 2.2, zm, 6); cil('sup', 0.28, 0.28, 0.45, cx, y0 + hM + 0.4, zm, 10); /* antena de topo + luz de mastro */
    // ESM: anel de antenas em volta do mastro integrado; satcom (domos) em plataformas laterais; chicotes de HF na borda da ilha
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; box('sup', 0.5, 0.9, 0.12, cx + Math.sin(a) * (w * 0.32), yt - 0.8, zm + Math.cos(a) * (c * 0.13), a); }
    for (const sz of [-1, 1]) { const zz = zc + sz * c * 0.3, xx = I.xe + 0.9; box('esc', 2.2, 0.15, 2.4, xx, yR - 1.5, zz); cil('esc', 0.12, 0.18, 1.2, xx, yR - 0.85, zz); const d = new THREE.SphereGeometry(0.85, 14, 10); d.translate(xx, yR + 0.1, zz); G.sup.push(d); }
    for (const [dx, dz] of [[I.xe + 0.2, I.z0 + 1], [I.xe + 0.2, I.z1 - 1], [I.xi - 0.2, I.z1 - 1.5]]) cil('esc', 0.035, 0.08, nav ? 10 : 7, dx, yD + (nav ? 6.9 : 3.4) + (nav ? 5 : 3.5), dz, 5);
    // holofotes do convés e escotilhas/portas estanques na base da ilha
    for (let k = 0; k < 4; k++) { const zz = I.z0 + c * (0.15 + k * 0.23); cil('esc', 0.25, 0.3, 0.45, I.xi - 0.25, yD + (nav ? 6.9 : 3.4) - 0.4, zz, 10); box('esc', 0.08, 1.9, 0.9, I.xi - 0.03, yD + 0.8 + 0.95, zz); }
  });
  // antenas de borda (rebatíveis) e redes de segurança com balaústres ao longo das bordas do convés
  const L = C.L; for (let i = 0; i < 10; i++) { const z = -L * 0.4 + i * L * 0.085, lado = i % 2 ? 'be' : 'bb', b = bordaPA(C, z, lado), sx = Math.sign(b); barra('esc', V(b + sx * 0.4, yD + 0.6, z), V(b + sx * 2.6, yD + 0.9, z), 0.06); }
  const MM = { esc: M.escuro, sup: M.sup, claro: M.claro }; for (const k in G) if (G[k].length) { const geo = mergeGeometries(G[k].map((q) => q.index ? q.toNonIndexed() : q), false); 
    const me = new THREE.Mesh(geo, MM[k]); me.name = 'det'; me.userData.det = 1; me.castShadow = true; me.receiveShadow = true; g.add(me); } }
