// v1.2.40 — plumagem das aves (camuflagem metálica suave por vértice) + armamento visível sob as asas.
// v1.2.39b — Modelos 3D dos hidroaviões anfíbios com SUPERFÍCIES LISAS (loft), não peças primitivas:
//  • casco-barco contínuo: nariz arredondado, quilha em V com quinas, DEGRAU a ~55% do comprimento, popa que sobe até a cauda;
//  • asas, estabilizador e deriva com PERFIL aerodinâmico (espessura ~12%), afilamento, enflechamento, diedro e ponta arredondada;
//  • naceles torneadas (lathe), cone de escape/spinner, hélices de pás finas e torcidas (grupo 'helice' gira);
//  • pintura em textura (canvas): duas cores, faixa na linha d'água, janelas, portas, linhas de painel, matrícula e logotipo.
// Nariz em −z, metros (L, envergadura e altura das fichas reais em sim/hidroaviao.js).
import * as THREE from 'three';

const sst = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const CACHE = new Map();

/** Textura de pintura do casco (u = comprimento nariz→cauda, v = volta da seção, v=0.25 topo, 0.75 quilha). */
const ESP_MATR = [[-1, 1], [1, -1]]; /* [escalaX, escalaY] da matrícula em boreste e bombordo */
function texCasco(S) { const W = 1024, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  /* v1.2.40: textura NEUTRA de detalhes (branca) — a cor vem da plumagem por vértice; a textura só escurece painéis, rebites, janelas e portas */
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(0,0,0,0.09)'; x.lineWidth = 1; for (let i = 1; i < 40; i++) { const u = i / 40 * W; x.beginPath(); x.moveTo(u, 0); x.lineTo(u, H); x.stroke(); } for (const v of [0.18, 0.32, 0.45, 0.55, 0.68, 0.82]) { x.beginPath(); x.moveTo(0, v * H); x.lineTo(W, v * H); x.stroke(); }
  x.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 420; i++) x.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  /* v1.2.44: costura na quilha → v .25 = boreste, .75 = bombordo (y do canvas = (1 − v)·H) */ const Y = (v) => (1 - v) * H;
  /* linha d'água discreta (desgaste) perto da quilha */ for (const [a, b] of [[0.85, 1], [0, 0.15]]) { const gr = x.createLinearGradient(0, a * H, 0, b * H); gr.addColorStop(a > 0.5 ? 0 : 1, 'rgba(0,0,0,0)'); gr.addColorStop(a > 0.5 ? 1 : 0, 'rgba(40,50,40,0.14)'); x.fillStyle = gr; x.fillRect(0, a * H, W, (b - a) * H); }
  for (const v of [0.31, 0.69]) { const y = Y(v); x.fillStyle = '#0e1a26'; for (let i = 0; i < (S.janelas || 9); i++) { const u = W * (0.24 + i * 0.035); x.beginPath(); x.ellipse(u, y, 5, 7, 0, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1.5; x.strokeRect(W * 0.17, y - 18, 26, 36); x.strokeRect(W * 0.62, y - 16, 30, 32); }
  /* matrícula nos dois costados, sempre legível (um lado desenhado espelhado para compensar o sentido da volta) */ x.fillStyle = 'rgba(0,0,0,0.42)'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; const mt = S.matr || 'NX-' + S.id.toUpperCase();
  for (const [v, esp] of [[0.235, ESP_MATR[0]], [0.765, ESP_MATR[1]]]) { x.save(); x.translate(W * 0.52, Y(v)); x.scale(esp[0], esp[1]); x.fillText(mt, 0, 8); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
/** v1.2.40: PLUMAGEM — camuflagem metálica suave inspirada na ave de cada hidroavião (contra-sombreamento: dorso escuro, ventre claro,
 *  pontas das asas escuras, bico no nariz, leve textura de penas). Cores em gradiente, sem contorno de desenho animado. */
export const AVES = {
  albatroz: { dorso: '#d9dcdc', ventre: '#f4f3ee', asa: '#4b4a4c', asaV: '#eceae4', ponta: '#262628', bico: '#e9c7a8', cauda: '#9a9b9c', pena: 0.05, corte: 0.35 },
  guara:    { dorso: '#b8301f', ventre: '#e1583c', asa: '#c33a24', asaV: '#e66a4c', ponta: '#141416', bico: '#5a3a30', cauda: '#a92a1b', pena: 0.06, corte: 0.5 },
  bigua:    { dorso: '#3d3527', ventre: '#202326', asa: '#2f2c25', asaV: '#2a2c2e', ponta: '#141517', bico: '#e2a53c', cauda: '#1b1d1f', pena: 0.12, corte: 0.5, escama: 1 },
  atoba:    { dorso: '#5a3a22', ventre: '#f2f0e9', asa: '#553722', asaV: '#efece4', ponta: '#3a2716', bico: '#d6d27a', cauda: '#4d3220', pena: 0.05, corte: 0.12 } };
const _c = (h) => new THREE.Color(h);
function pintaAve(g, S) { const A = AVES[S.id] || AVES.albatroz, P = {}; for (const k in A) if (typeof A[k] === 'string') P[k] = _c(A[k]); const L = S.L, E = S.env / 2;
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3(), cor = new THREE.Color(), t1 = new THREE.Color(), t2 = new THREE.Color();
  g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  g.traverse((o) => { if (!o.isMesh || !o.userData.ave) return; const geo = o.geometry, pos = geo.attributes.position, nor = geo.attributes.normal; if (!nor) return; const parte = o.userData.ave;
    const mt = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld); nm.getNormalMatrix(mt); const cols = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mt); n.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
      const up = sst(-A.corte, A.corte, n.y + (parte === 'asa' ? 0.05 : 0)), sp = Math.min(1, Math.abs(v.x) / E), zr = v.z / L;
      if (parte === 'asa' || parte === 'flut') { t1.copy(P.asaV); t2.copy(P.asa); cor.copy(t1).lerp(t2, up); const tip = sst(0.62, 0.98, sp); cor.lerp(P.ponta, tip * (0.55 + 0.45 * up)); if (parte === 'asa') cor.lerp(P.dorso, (1 - sst(0.05, 0.3, sp)) * up * 0.6); }
      else if (parte === 'cauda') { cor.copy(P.ventre).lerp(P.cauda, Math.max(up, sst(0.1, 0.6, v.y / (S.alt || 9)))); }
      else if (parte === 'motor') { cor.copy(P.ventre).lerp(P.asa, up * 0.8); }
      else { cor.copy(P.ventre).lerp(P.dorso, up); const nz = sst(-0.43, -0.5, zr); cor.lerp(P.bico, nz * 0.85); if (A.escama) cor.lerp(P.bico, sst(-0.47, -0.42, zr) * (1 - sst(-0.34, -0.28, zr)) * (1 - up) * 0.7); /* papo amarelo do biguá */ cor.lerp(P.cauda, sst(0.3, 0.5, zr) * up * 0.5); }
      /* textura de penas: escamas suaves (seno cruzado) + ruído fino */ const pe = A.pena * (A.escama ? (0.5 + 0.5 * Math.sin(v.x * 2.1 + Math.sin(v.z * 1.7) * 2) * Math.sin(v.z * 2.3 + v.x * 0.6)) : (0.5 + 0.5 * Math.sin(v.z * 0.9 + v.x * 1.3) * Math.sin(v.x * 0.7 - v.z * 0.4))) * up;
      const f = 1 - pe + ((Math.sin(v.x * 12.9898 + v.z * 78.233 + v.y * 37.7) * 43758.5453) % 1) * 0.025; cols[i * 3] = cor.r * f; cols[i * 3 + 1] = cor.g * f; cols[i * 3 + 2] = cor.b * f; }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }); }
function mats(S) { if (CACHE.has(S.id)) return CACHE.get(S.id);
  const A = AVES[S.id] || AVES.albatroz, met = A.escama ? 0.5 : 0.36; /* v1.2.40: pintura metálica suave (perolada) com cores por vértice */ const m = { casco: new THREE.MeshStandardMaterial({ map: texCasco(S), side: THREE.DoubleSide, vertexColors: true, roughness: 0.3, metalness: met, envMapIntensity: 1.25 }), corpo: new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, vertexColors: true, roughness: 0.32, metalness: met, envMapIntensity: 1.25 }), faixa: new THREE.MeshStandardMaterial({ color: A.ponta, roughness: 0.35, metalness: 0.55 }),
    arma: new THREE.MeshStandardMaterial({ color: '#c9ccc8', roughness: 0.35, metalness: 0.7 }), armaE: new THREE.MeshStandardMaterial({ color: '#3d4a3a', roughness: 0.45, metalness: 0.6 }), ogiva: new THREE.MeshStandardMaterial({ color: '#2a2d30', roughness: 0.25, metalness: 0.5 }),
    escuro: new THREE.MeshStandardMaterial({ color: '#2c3238', roughness: 0.5, metalness: 0.7 }), vidro: new THREE.MeshStandardMaterial({ color: '#0b1724', roughness: 0.05, metalness: 0.95, envMapIntensity: 1.8 }),
    helice: new THREE.MeshStandardMaterial({ color: '#16191c', roughness: 0.55, metalness: 0.4 }), ponta: new THREE.MeshStandardMaterial({ color: '#e9eef2', roughness: 0.4, metalness: 0.2 }),
    luzV: new THREE.MeshBasicMaterial({ color: '#ff3b30' }), luzG: new THREE.MeshBasicMaterial({ color: '#34c759' }), luzB: new THREE.MeshBasicMaterial({ color: '#ffffff' }) };
  CACHE.set(S.id, m); return m; }

/** Malha a partir de anéis (cada anel = lista de [x,y,z] com o mesmo nº de pontos); fecha as pontas com leque. */
export function loft(aneis, fechaIni = true, fechaFim = true, uvU = null) { const n = aneis.length, m = aneis[0].length; const pos = [], uv = [], idx = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const p = aneis[i][j]; pos.push(p[0], p[1], p[2]); uv.push(uvU ? uvU[i] : i / (n - 1), j / (m - 1)); }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < m - 1; j++) { const a = i * m + j, b = a + 1, c = a + m, d = c + 1; idx.push(a, c, b, b, c, d); }
  const tampa = (i, inv) => { const cx = aneis[i].reduce((s, p) => s + p[0], 0) / m, cy = aneis[i].reduce((s, p) => s + p[1], 0) / m, cz = aneis[i].reduce((s, p) => s + p[2], 0) / m; const k = pos.length / 3; pos.push(cx, cy, cz); uv.push(i ? 1 : 0, 0.5); for (let j = 0; j < m - 1; j++) { const a = i * m + j; if (inv) idx.push(k, a + 1, a); else idx.push(k, a, a + 1); } };
  if (fechaIni) tampa(0, false); if (fechaFim) tampa(n - 1, true);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); /* v1.2.43: orienta as faces PARA FORA (volume assinado > 0) — sem isso partes do casco/asa mostravam o lado de dentro */ { let vol = 0; for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3; vol += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]); } if (vol < 0) for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; } }
  g.setIndex(idx); g.computeVertexNormals(); return g; }

/** CASCO-BARCO: seções ao longo do comprimento (s = 0 nariz … 1 cauda). */
function geoCasco(S) { const L = S.L, W = L * (S.larg || 0.052), z0 = -L / 2, NS = 64, NT = 36, aneis = [], us = [];
  const yCauda = S.alt * 0.18;
  for (let i = 0; i < NS; i++) { const s = i / (NS - 1); us.push(s);
    const nar = Math.sqrt(Math.min(1, s / 0.13)); const cauda = 1 - sst(0.6, 1, s) * 0.82; const w = W * nar * cauda * (s < 0.13 ? 0.85 + 0.15 * nar : 1);
    const top = W * 1.08 * (0.62 + 0.38 * sst(0.02, 0.2, s)) * (1 - sst(0.62, 1, s) * 0.55) * Math.max(0.06, nar);
    const deg = s > 0.55 ? 0.72 : 1; const bot = W * 1.18 * Math.max(0.05, nar) * (s < 0.55 ? 1 : deg * (1 - sst(0.56, 0.98, s) * 0.85));
    const cy = W * 1.15 + sst(0.58, 1, s) * yCauda + (s < 0.1 ? (0.1 - s) * W * 1.2 : 0);
    const anel = []; for (let j = 0; j < NT; j++) { const th = -Math.PI / 2 + (j / (NT - 1)) * Math.PI * 2 /* v1.2.44: costura na QUILHA (v: 0 quilha · .25 boreste · .5 topo · .75 bombordo) */, cs = Math.cos(th), sn = Math.sin(th); let x = w * cs, y;
      if (sn >= 0) y = cy + top * Math.pow(sn, 0.8); else { const u = Math.abs(cs); const quina = u > 0.86 ? 1 - (u - 0.86) / 0.14 * 0.18 : 1; y = cy - bot * Math.pow(1 - u, 0.55) * quina; x *= u > 0.86 ? 1 : 0.98 + 0.02 * u; }
      anel.push([x, y, z0 + s * L]); } aneis.push(anel); }
  return loft(aneis, true, true, us); }
/** Perfil aerodinâmico (NACA 00xx simplificado) de corda c e espessura t; devolve pontos [x(corda), y(espessura)] fechados. */
export function perfil(c, t, n = 14) { const sup = [], inf = []; for (let i = 0; i <= n; i++) { const xc = (1 - Math.cos((i / n) * Math.PI)) / 2; const yt = 5 * t * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1036 * xc ** 4); sup.push([xc * c, yt * c]); inf.push([xc * c, -yt * c]); }
  return sup.concat(inf.reverse().slice(1)); }
/** Superfície (asa/estabilizador): da raiz (span 0) à ponta, com corda/espessura/enflechamento/diedro; 'vertical' para deriva. */
export function geoSuperficie({ span, cR, cP, tR = 0.13, tP = 0.1, enf = 0, died = 0, vertical = false, n = 12 }) { const aneis = []; const ps = []; for (let i = 0; i <= n; i++) { const f = i / n, fe = f < 0.92 ? f : 0.92 + (f - 0.92) * 0.5; ps.push(fe); }
  for (let i = 0; i <= n; i++) { const f = ps[i]; const tip = sst(0.9, 1, f); const c = (cR + (cP - cR) * f) * (1 - tip * 0.55), t = tR + (tP - tR) * f, le = enf * f * span + (cR - c) * 0.25 * (tip > 0 ? 1 : 0.3);
    const pr = perfil(c, t); const anel = pr.map(([xc, yc]) => vertical ? [yc, f * span, le + xc] : [f * span, f * span * died + yc, le + xc]); aneis.push(anel); }
  return loft(aneis, true, true); }
/** Nacele torneada (perfil girado) de comprimento l e raio r; abre para −z. */
export function geoNacele(l, r, jato) { const pts = []; const n = 14; for (let i = 0; i <= n; i++) { const f = i / n; const rr = jato ? r * (0.86 + 0.14 * Math.sin(Math.min(1, f * 1.6) * Math.PI / 2)) * (1 - sst(0.8, 1, f) * 0.28) : r * Math.sin(Math.min(1, (f + 0.04) * 1.3) * Math.PI / 2) * (1 - sst(0.55, 1, f) * 0.75); pts.push(new THREE.Vector2(Math.max(0.02, rr), f * l)); }
  pts.unshift(new THREE.Vector2(0, 0)); pts.push(new THREE.Vector2(0, l)); /* v1.2.44: nacele FECHADA nas duas pontas (antes dava para ver o lado de dentro por trás) */
  const g = new THREE.LatheGeometry(pts, 24); g.rotateX(Math.PI / 2); g.translate(0, 0, -l * 0.5); return g; }

/** Monta o hidroavião S (ficha de sim/hidroaviao.js HIDROS). */
export function montaHidro3D(S) { const g = new THREE.Group(); g.name = 'hidro:' + S.id; const M = mats(S); const L = S.L, E = S.env, A = S.alt, W = L * (S.larg || 0.052);
  let parte = 'casco'; const add = (geo, mat, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; if (mat === M.casco || mat === M.corpo) o.userData.ave = parte; g.add(o); return o; };
  add(geoCasco(S), M.casco);
  /* CABINE: para-brisa envidraçado em cunha sobre o nariz */ { const cab = new THREE.SphereGeometry(W * 0.78, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42); cab.scale(1, 0.55, 1.7); add(cab, M.vidro, 0, W * 1.15 + W * 0.62, -L / 2 + L * 0.13); }
  parte = 'asa'; /* ASA ALTA (com carenagem de raiz) */ const yA = W * 1.15 + W * 1.02, zA = -L * (S.zAsa || 0.04), cR = L * (S.motor === 'jato' ? 0.14 : 0.13), cP = cR * (S.afil || 0.48);
  for (const s of [-1, 1]) { const asa = add(geoSuperficie({ span: E / 2 - W * 0.4, cR, cP, enf: S.motor === 'jato' ? 0.12 : 0.03, died: 0.03, tR: 0.15, tP: 0.11 }), M.corpo, s * W * 0.4, yA, zA - cR * 0.3); asa.scale.x = s; if (s < 0) asa.geometry = asa.geometry.clone(); }
  parte = 'casco'; { const car = new THREE.SphereGeometry(1, 20, 10); car.scale(W * 0.85, W * 0.55, cR * 0.75); add(car, M.corpo, 0, yA - W * 0.1, zA + cR * 0.15); }
  parte = 'flut'; /* FLUTUADORES nas pontas (casco em gota + montante perfilado) */ for (const s of [-1, 1]) { const x = s * E * 0.42; const fl = new THREE.SphereGeometry(1, 18, 12); fl.scale(W * 0.2, W * 0.19, L * 0.06); add(fl, M.corpo, x, W * 0.7, zA + cR * 0.1);
    const mt = add(geoSuperficie({ span: yA - W * 0.85, cR: cR * 0.2, cP: cR * 0.16, tR: 0.14, tP: 0.14, vertical: true, n: 3 }), M.corpo, x, W * 0.85, zA - cR * 0.05); }
  parte = 'motor'; /* MOTORES */ g.userData.helices = [];
  if (S.motor === 'jato') { for (const s of [-1, 1]) { const x = s * W * 1.45, y = yA + W * 1.05, zc = zA + cR * 0.35; add(geoNacele(L * 0.17, W * 0.46, true), M.corpo, x, y, zc); add(new THREE.CircleGeometry(W * 0.38, 20).rotateY(Math.PI), M.escuro, x, y, zc - L * 0.085);
      add(new THREE.CylinderGeometry(W * 0.27, W * 0.33, L * 0.03, 16).rotateX(Math.PI / 2), M.escuro, x, y, zc + L * 0.09); add(geoSuperficie({ span: W * 0.75, cR: L * 0.09, cP: L * 0.08, tR: 0.12, tP: 0.12, vertical: true, n: 2 }), M.corpo, x, yA + 0.2, zc - L * 0.03); } }
  else { const xs = S.nMot === 2 ? [-0.21, 0.21] : [-0.36, -0.17, 0.17, 0.36]; const rp = Math.min(E * 0.072, 2.3), nP = S.pas || 4;
    for (const f of xs) { const x = f * E, y = yA + W * 0.18, zc = zA - cR * 0.05 + Math.abs(f) * 0.6; add(geoNacele(L * 0.2, W * 0.36, false), M.corpo, x, y, zc + L * 0.03); const sp = new THREE.SphereGeometry(W * 0.17, 14, 10); sp.scale(1, 1, 1.9); add(sp, M.escuro, x, y, zc - L * 0.07);
      const he = new THREE.Group(); he.position.set(x, y, zc - L * 0.065); he.name = 'helice';
      for (let p = 0; p < nP; p++) { const sh = new THREE.Shape(); sh.moveTo(-0.12, 0); sh.quadraticCurveTo(-0.24, rp * 0.45, -0.07, rp); sh.lineTo(0.05, rp); sh.quadraticCurveTo(0.16, rp * 0.4, 0.12, 0); sh.closePath(); const pg = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }); const pa = new THREE.Mesh(pg, M.helice); pa.rotation.z = (p / nP) * Math.PI * 2; pa.rotation.y = 0.32; he.add(pa); }
      const disco = new THREE.Mesh(new THREE.CircleGeometry(rp, 28), new THREE.MeshBasicMaterial({ color: '#d8dee4', transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide })); he.add(disco); g.add(he); g.userData.helices.push(he); } }
  parte = 'cauda'; /* CAUDA: deriva perfilada enflechada + estabilizador (em T, ou cruciforme no Biguá) */ const zF = L * 0.36, yF = W * 1.15 + A * 0.18 + W * 0.25, hF = A * 0.52;
  add(geoSuperficie({ span: hF, cR: L * 0.17, cP: L * 0.09, enf: 0.55, tR: 0.12, tP: 0.1, vertical: true }), M.corpo, 0, yF - W * 0.2, zF - L * 0.02);
  const yE = S.cauda === 'cruz' ? yF + hF * 0.42 : yF + hF * 0.97, zE = zF + (S.cauda === 'cruz' ? L * 0.05 : hF * 0.55 * (L * 0.17) / L + L * 0.04);
  for (const s of [-1, 1]) { const es = add(geoSuperficie({ span: E * 0.19, cR: L * 0.085, cP: L * 0.045, enf: 0.25, died: S.cauda === 'cruz' ? 0.02 : -0.02, tR: 0.11, tP: 0.09, n: 8 }), M.corpo, 0, yE, zE); es.scale.x = s; }
  add(new THREE.BoxGeometry(0.22, hF * 0.1, L * 0.06), M.faixa, 0, yF + hF * 0.9, zF + hF * 0.5);
  /* antenas e sonda */ add(new THREE.CylinderGeometry(0.03, 0.06, 1.6, 6), M.escuro, 0, W * 1.15 + W * 1.05 + 0.8, -L * 0.18); add(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6).rotateX(Math.PI / 2), M.escuro, W * 0.3, W * 1.4, -L / 2 - 0.4);
  /* luzes de navegação */ const luz = (mat, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat); o.position.set(x, y, z); g.add(o); return o; };
  luz(M.luzV, -E / 2 + 0.2, yA + E * 0.015, zA); luz(M.luzG, E / 2 - 0.2, yA + E * 0.015, zA); g.userData.estrobo = luz(M.luzB, 0, yF + hF + 0.3, zF + hF * 0.5);
  /* v1.2.40: ARMAMENTO visível sob as asas — 8 mísseis ar-superfície em 4 pilones duplos (somem 2 a 2 ao disparar) e 4 torpedos na barriga/raiz da asa */
  { const armas = (g.userData.misseis = []), tps = (g.userData.torps = []); const lM = Math.min(4.6, L * 0.14), rM = 0.17;
    const missil = () => { const mg = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(rM, rM, lM * 0.8, 12).rotateX(Math.PI / 2), M.arma); mg.add(c); const o = new THREE.Mesh(new THREE.ConeGeometry(rM, lM * 0.2, 12).rotateX(-Math.PI / 2), M.ogiva); o.position.z = -lM * 0.5; mg.add(o);
      for (let k = 0; k < 4; k++) { const al = new THREE.Mesh(new THREE.BoxGeometry(0.03, rM * 2.6, lM * 0.12), M.armaE); al.rotation.z = k * Math.PI / 2 + Math.PI / 4; al.position.z = lM * 0.33; mg.add(al); const ca = new THREE.Mesh(new THREE.BoxGeometry(0.02, rM * 1.6, lM * 0.06), M.armaE); ca.rotation.z = al.rotation.z; ca.position.z = -lM * 0.15; mg.add(ca); } return mg; };
    const xs = (S.nMot === 4 ? [0.095, 0.13, 0.235, 0.275] : [0.12, 0.16, 0.27, 0.31]).map((f) => f * E); const ordem = [];
    const nM = Math.min(16, S.misseis || 8), duplo = nM > 8; /* v1.2.43: até 16 mísseis — trilho DUPLO em cada pilone quando passa de 8 */
    for (let i = 3; i >= 0; i--) for (const s of [-1, 1]) { const x = s * xs[i], y = yA + x * Math.sign(x) * 0.03 - 0.55, z = zA - cR * 0.05;
      const pil = new THREE.Mesh(new THREE.BoxGeometry(duplo ? 0.7 : 0.12, 0.42, cR * 0.45), M.escuro); pil.position.set(x, y + 0.22, z + cR * 0.2); g.add(pil); for (const dx of duplo ? [-0.3, 0.3] : [0]) { const ms = missil(); ms.position.set(x + dx, y - 0.05 - (dx ? 0.12 : 0), z + cR * 0.18); g.add(ms); ordem.push(ms); } }
    ordem.splice(nM);
    armas.push(...ordem);
    const lT = Math.min(5.2, L * 0.15), rT = 0.27; for (let i = 0; i < Math.min(10, S.torps || 4); i++) { const tg = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(rT, rT, lT * 0.86, 14).rotateX(Math.PI / 2), M.armaE); tg.add(c); const nz = new THREE.Mesh(new THREE.SphereGeometry(rT, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-Math.PI / 2), M.armaE); nz.position.z = -lT * 0.43; tg.add(nz);
      const pq = new THREE.Mesh(new THREE.CylinderGeometry(rT * 0.95, rT * 0.6, lT * 0.14, 12).rotateX(Math.PI / 2), M.arma); pq.position.z = lT * 0.48; tg.add(pq); /* cone do paraquedas */
      const s = i % 2 ? 1 : -1, k = (i >> 1) % 2, f = i >> 2; tg.position.set(s * (W * 1.3 + k * 0.75), yA - 0.75 - k * 0.1, zA + cR * 0.2 + k * 0.4 + f * lT * 1.05); /* v1.2.43: até 10 torpedos em fileiras */ g.add(tg); tps.push(tg); } }
  pintaAve(g, S);
  g.rotation.order = 'YXZ'; return g; }
