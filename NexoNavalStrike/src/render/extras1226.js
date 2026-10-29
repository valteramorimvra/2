// v1.2.26 — detalhes 3D dos 8 navios novos. Peças procedurais originais com os MATERIAIS JÁ EXISTENTES do navio.
//  · Porta-aviões gigantes: PARQUE de 100+ aeronaves no convés por INSTANCIAMENTO (1 InstancedMesh por tipo × material,
//    ~18 chamadas para todo o parque; nome 'det' → some no LOD de longe), +1 catapulta de proa a boreste (total 5: 2 de proa + 2 de meia-nau da base 1.2.25 + 1) e +2 cabos de parada.
//  · Canhão eletromagnético (C.canhao.eletro): troca o tubo redondo por um conjunto de trilhos retangulares com anéis de
//    reforço e boca plana, fundido em 2 malhas por torre (custo de chamadas igual ao tubo original de 3 peças).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { bordaPA, PLANO_PA, eixoAngPA, ilhasPA } from '../sim/classes1225.js';
import { geoParque1226, TIPOS_1226 } from './aereo1226.js';
import { VAGAS1226 } from './vagas1226.js'; /* pré-calculadas (tests/geraVagas1226.mjs) */
import { matsAeronave1226, FURTIVO_1226, convesDesgaste1226, ilhaDetalhe1226 } from './realismo1226.js'; /* v1.2.26: realismo PBR */
import '../sim/classes1226.js'; /* registra PLANO_PA/EST/NOMES_OURO dos 8 navios antes do uso */
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
const det = (o) => { o.traverse((c) => { c.userData.det = 1; }); return o; };
/* tipo → [peso no parque, envergadura (m), comprimento (m)] */
/* envergadura com as asas DOBRADAS (parque); helicóptero com as pás rebatidas */
const DIM = { tesourao: [30, 8.6, 18.8], tuiuiu: [24, 9.4, 21.8], marimbondo: [18, 8.8, 11.6], beijaflor: [12, 4.9, 19.6], coruja: [6, 11.2, 20.2], bombardeiroNuclear: [10, 11.8, 27.0] };
/** Vagas do convés (pura geometria, sem THREE): fileiras a bombordo da proa, "rua" de boreste (vante/ré da ilha) e tombadilho,
 *  fora do convés em ângulo (±16 m do eixo), das 6 pistas de catapulta, da ilha e dos helipontos. Retorna [{tipo, x, z, rot}]. */
const _VAGAS = new Map(); /* v1.2.26: vagas por classe calculadas UMA vez (geometria pura, determinística) */
export function vagasParque1226(C) { if (_VAGAS.has(C.id)) return _VAGAS.get(C.id); const pre = VAGAS1226[C.id], r0 = pre ? pre.map(([tipo, x, z, rot]) => ({ tipo, x, z, rot })) : vagas0(C);
  /* v1.2.29: nunca estacionar no eixo da mira nem na proa estreita (tapava visão da câmera de popa) */
  const B = C.B || C.L * 0.12, L = C.L; const r = r0.filter((v) => Math.abs(v.x) > B * 0.12 && !(v.z < -L * 0.28 && Math.abs(v.x) < B * 0.20));
  _VAGAS.set(C.id, r); return r; }
export function vagas0(C) { const L = C.L, PL = PLANO_PA[C.id], ra = Math.atan(PL.ang), zAng0 = -L * 0.14, il = ilhasPA(C), n = C.parque || 100;
  const xc = (z) => eixoAngPA(C, z), cats = catsGiga(C);
  /* v1.2.26: elevadores e faixas de táxi da sim (elevador → faixa da catapulta do mesmo bordo → catapulta) ficam LIVRES — nenhum táxi atravessa estacionadas */
  const zK = -L * 0.2, xK = PL.cat.map((q) => q[0]), els = PL.elev.map(([lado, f]) => { const z = f * L, xb = bordaPA(C, z, lado); return { x: lado === 'be' ? xb - 7.5 : xb + 7.5, z }; });
  const segs = []; for (const e of els) for (const kx of xK) segs.push([e.x, e.z, kx, e.z], [kx, e.z, kx, zK]);
  const dSeg = (px, pz, [ax, az, bx, bz]) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
  const livre = (x, z, meiaW, meiaC, fora = 0) => { for (const dz of [-meiaC, 0, meiaC]) { const zz = z + dz; if (zz < -L * 0.485 || zz > L * 0.49) return false; const bb = bordaPA(C, zz, 'bb'), be = bordaPA(C, zz, 'be'); if (x - meiaW < bb + 2.5 - fora || x + meiaW > be - 2.5 + fora) return false;
      if (zz > zAng0 - 8 && Math.abs(x - xc(zz)) * Math.cos(ra) < 14.6 + meiaW /* faixa de pouso pintada ±13,2 m + folga */) return false;
      for (const [cx, z0, z1] of cats /* v1.2.26: TODAS as pistas de catapulta ficam livres (nada estacionado sobre trilho/defletor) */) if (zz > z0 - 6 && zz < z1 + 10 && Math.abs(x - cx) < 4.2 + meiaW) return false;
      for (const e of els) if (Math.abs(zz - e.z) < 11 + meiaC && Math.abs(x - e.x) < 11 + meiaW) return false; for (const sg of segs) if (dSeg(x, zz, sg) < 7 + Math.max(meiaW, meiaC) * 0.8) return false;
      for (const I of il) if (zz > I.z0 - 7 && zz < I.z1 + 7 && x + meiaW > I.xi - 3) return false;
      for (const f of [0.075, 0.47]) { const zh = f * L, xh = bordaPA(C, zh, 'be') - 11; if (Math.abs(zz - zh) < 9 && Math.abs(x - xh) < 8 + meiaW) return false; } } return true; };
  // ordem de preenchimento: tipos pelo peso, grandes primeiro (precisam de vagas largas)
  const fila = []; const tot = Object.values(DIM).reduce((a, d) => a + d[0], 0); for (const t of TIPOS_1226) { const k = Math.round(n * DIM[t][0] / tot); for (let i = 0; i < k; i++) fila.push(t); }
  while (fila.length < n) fila.push('tesourao'); fila.length = n; { const mix = []; const g2 = {}; for (const t of fila) (g2[t] = g2[t] || []).push(t); while (mix.length < fila.length) for (const t of TIPOS_1226) if (g2[t] && g2[t].length) mix.push(g2[t].pop()); fila.splice(0, fila.length, ...mix); } /* tipos intercalados ao longo das fileiras */
  const ocup = []; const bate = (x, z, w, c) => ocup.some((o) => Math.abs(o.x - x) < (o.w + w) / 2 + 0.6 && Math.abs(o.z - z) < (o.c + c) / 2 + 0.6);
  const out = [];
  // 1) fileiras de borda: nariz para dentro e cauda sobre a água (até 30% do comprimento além da borda), como num convés cheio
  for (const lado of [1, -1]) { let z = -L * 0.47; while (z < L * 0.48 && fila.length) { const t = fila[0], [, w, c] = DIM[t], zc = z + w / 2, e = lado > 0 ? bordaPA(C, zc, 'be') : bordaPA(C, zc, 'bb'), x = e - lado * (c / 2 - c * 0.3);
      if (livre(x, zc, c / 2, w / 2, c * 0.3 + 3.5) && !bate(x, zc, c, w)) { ocup.push({ x, z: zc, w: c, c: w }); out.push({ tipo: t, x, z: zc, rot: lado * Math.PI / 2 }); fila.shift(); z += w + 0.6; } else z += 1.0; } }
  // 2) restante: vagas paralelas ao eixo (nariz para vante) no miolo livre
  const semVaga = new Set(); for (const t of fila.slice()) { if (semVaga.has(t)) continue; /* tipo sem vaga → os demais do mesmo tamanho também não cabem (evita varrer o convés de novo) */ const [, w, c] = DIM[t]; let ok = null;
    for (let z = -L * 0.47 + c / 2; z < L * 0.49 - c / 2 && !ok; z += 1.5) { const be = bordaPA(C, z, 'be'), bb = bordaPA(C, z, 'bb');
      for (const lado of [1, -1]) { if (ok) break; for (let k = 0; k < 70; k++) { const x = lado > 0 ? be - 2.6 - w / 2 - k * 2.2 : bb + 2.6 + w / 2 + k * 1.2; if (x < bb || x > be) break; if (Math.abs(x) > (C.B || L * 0.12) * 0.12 && livre(x, z, w / 2, c / 2 * 0.9) && !bate(x, z, w, c)) { ok = { x, z, lado, w, c, r: lado * 0.06 }; break; } if (Math.abs(x) > (C.B || L * 0.12) * 0.12 && livre(x, z, c / 2, w / 2) && !bate(x, z, c, w)) { ok = { x, z, lado, w: c, c: w, r: lado * Math.PI / 2 }; break; } } } }
    if (!ok) { semVaga.add(t); continue; } ocup.push({ x: ok.x, z: ok.z, w: ok.w, c: ok.c }); out.push({ tipo: t, x: ok.x, z: ok.z, rot: ok.r }); }
  return out; }
/** 6 pistas de catapulta: [x, z0 (ponta de proa), z1 (início)] — 2 de proa originais + 2 de boreste de proa (novas) + 2 de meia-nau (no ângulo). */
export function catsGiga(C) { const L = C.L, PL = PLANO_PA[C.id], z1 = -L * 0.2; return [[PL.cat[0][0], z1 - 92, z1], [PL.cat[1][0], z1 - 92, z1], [PL.cat[1][0] + 12, z1 - 88, z1 + 4]]; }
function parque1226(g, C, P, M) { const yD = P.pa1225.yD + 0.8 /* espessura da placa do convés */, vagas = vagasParque1226(C); const por = {};
  for (const v of vagas) (por[v.tipo] = por[v.tipo] || []).push(v);
  const BASE = { c: { uuid: 'parque1226', color: new THREE.Color('#8b9299') } }, cor = new THREE.Color(), rv = ((k) => () => (k = (k * 1103515245 + 12345) >>> 0) / 4294967296)(C.L | 0), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
  let n = 0; for (const t in por) { const geos = geoParque1226(t); for (const k in geos) { const MAT = matsAeronave1226(BASE, FURTIVO_1226[t] || 0), im = new THREE.InstancedMesh(geos[k], MAT[k], por[t].length); im.name = 'det'; im.userData.det = 1; im.userData.parque = por[t].length; im.castShadow = true; im.receiveShadow = true;
      por[t].forEach((v, i) => { p.set(v.x, yD, v.z); q.setFromEuler(e.set(0, v.rot, 0)); m4.compose(p, q, s); im.setMatrixAt(i, m4); if (k === 'c') { const v = 0.9 + rv() * 0.16; im.setColorAt(i, cor.setRGB(v, v, v * (0.99 + rv() * 0.03))); } /* variação de pintura/desgaste por aeronave */ }); im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); g.add(im); }
    n += por[t].length; }
  P.parque1226 = { n, por: Object.fromEntries(Object.entries(por).map(([k, v]) => [k, v.length])) }; g.userData.parque1226 = P.parque1226; }
/** +1 catapulta (trilho + guias + lançadeira) e +2 cabos de parada; faixas finas no LOD 'det'. */
function convesGiga(g, C, P, M) { const L = C.L, yD = P.pa1225.yD + 0.81, PL = PLANO_PA[C.id], ra = Math.atan(PL.ang), xc = (z) => eixoAngPA(C, z); const esc = [], ama = [];
  const faixa = (arr, w, x, z, comp, rot, h = 0.04) => { const b = new THREE.BoxGeometry(w, h, comp); b.rotateY(rot); b.translate(x, yD + h / 2, z); arr.push(b); };
  for (const [x, z0, z1] of catsGiga(C).slice(2)) { const zm = (z0 + z1) / 2, comp = z1 - z0; faixa(esc, 0.5, x, zm, comp, 0); for (const o of [-1.6, 1.6]) faixa(ama, 0.22, x + o, zm, comp, 0); faixa(esc, 0.7, x, z1 - 2, 1.4, 0, 0.35); }
  for (const f of [0.27, 0.42]) { const z = f * L, x = xc(z); const b = new THREE.CylinderGeometry(0.09, 0.09, 29, 6).rotateZ(Math.PI / 2).rotateY(ra).translate(x, yD + 0.2, z); esc.push(b);
    for (const sx of [-1, 1]) faixa(esc, 0.7, x + sx * 14.6 * Math.cos(ra), z - sx * 14.6 * Math.sin(ra), 0.6, 0, 0.4); }
  for (const [arr, mat] of [[esc, M.escuro], [ama, M.amarelo || M.claro]]) { if (!arr.length) continue; const gm = mergeGeometries(arr.map((x) => x.index ? x.toNonIndexed() : x), false); const m = det(mesh(gm, mat)); g.add(m); } }
/** Canhão eletromagnético: substitui as 3 peças do tubo por trilhos fundidos (escuro) + carenagem facetada (sup). */
function eletro1226(g, C, M) { const s = C.canhao.cal / 127, Lc = 9.6;
  const trilhos = () => { const a = []; const w = 0.34 * s + 0.2; for (const sx of [-1, 1]) a.push(new THREE.BoxGeometry(0.16 * s, w * 1.2, Lc).translate(sx * w * 0.55, 0, -Lc / 2)); a.push(new THREE.BoxGeometry(w * 1.25, 0.12 * s, Lc * 0.98).translate(0, w * 0.62, -Lc / 2), new THREE.BoxGeometry(w * 1.25, 0.12 * s, Lc * 0.98).translate(0, -w * 0.62, -Lc / 2));
    for (let i = 0; i < 6; i++) a.push(new THREE.BoxGeometry(w * 1.55, w * 1.55, 0.32).translate(0, 0, -1.2 - i * (Lc - 1.6) / 5)); a.push(new THREE.BoxGeometry(w * 1.7, w * 1.7, 0.5).translate(0, 0, -Lc + 0.25)); return mergeGeometries(a.map((x) => x.toNonIndexed()), false); };
  const caren = () => new THREE.CylinderGeometry(0.62 * s, 0.78 * s, 3.2, 6).rotateX(-Math.PI / 2).translate(0, 0, -1.6).toNonIndexed();
  for (const o of g.children) { if (!/^torre\d$/.test(o.name)) continue; o.traverse((c) => { if (!/^cano\d?$/.test(c.name)) return; for (const m of c.children.slice()) if (m.isMesh) { c.remove(m); m.geometry.dispose(); }
      const t = mesh(trilhos(), M.escuro); t.name = 'trilhosEM'; c.add(t); const k = mesh(caren(), M.sup); k.name = 'carenEM'; c.add(k); }); } }
export function extras1226(g, C, P, M) { if (C.gigaPA && P.pa1225) { parque1226(g, C, P, M); convesGiga(g, C, P, M); convesDesgaste1226(g, C, P, catsGiga(C)); ilhaDetalhe1226(g, C, P, M); } if (C.canhao && C.canhao.eletro) eletro1226(g, C, M); }
