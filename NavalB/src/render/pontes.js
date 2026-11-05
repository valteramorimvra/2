// v1.2.19 item 10b — PONTES procedurais originais: pênsil de CORRENTE DE BARRAS DE OLHAL com treliça de enrijecimento
// (estilo da ponte do Estreito de Florianópolis), pênsil de CABOS com torres de pórtico (estilo do estreito de São Francisco)
// e ponte de VIGAS sobre pilares (pontes do Estreito). Tudo fundido por material e dividido em PARTES destrutíveis
// (torres, vão central, vãos laterais, trechos de vigas) — cada parte é um grupo 'destr' que desaba sozinho.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { registraLuz } from './cidade.js';
const MT = {}; const mat = (k, f) => MT[k] || (MT[k] = f());
const aco = (c) => mat('pa' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.55 }));
const conc = () => mat('pc', () => new THREE.MeshStandardMaterial({ color: '#a3a29b', roughness: 0.92, metalness: 0.02 }));
const asf = () => mat('pasf', () => new THREE.MeshStandardMaterial({ color: '#3a3c3f', roughness: 0.9, metalness: 0.05 }));
const lamp = () => mat('plamp', () => registraLuz(new THREE.MeshStandardMaterial({ color: '#332200', emissive: '#ffd58a' }), 3));
const verm = () => mat('pverm', () => registraLuz(new THREE.MeshStandardMaterial({ color: '#330000', emissive: '#ff2a1a' }), 3));
/** Barra (caixa) de p a q com seção a×b (coordenadas locais da ponte). */
function barra(L, p, q, a, b) { const d = new THREE.Vector3().subVectors(q, p), len = d.length(); if (len < 1e-3) return; const g = new THREE.BoxGeometry(a, b, len); const m = new THREE.Matrix4().lookAt(p, q, new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.abs(d.y) > len * 0.99 ? 0.01 : 0)); m.setPosition(p.clone().add(q).multiplyScalar(0.5)); g.applyMatrix4(m); L.push(g); }
function caixa(L, x, y, z, w, h, d) { L.push(new THREE.BoxGeometry(w, h, d).translate(x, y, z)); }
function cil(L, p, q, r, seg = 6) { const d = new THREE.Vector3().subVectors(q, p), len = d.length(); const g = new THREE.CylinderGeometry(r, r, len, seg).rotateX(Math.PI / 2); const m = new THREE.Matrix4().lookAt(p, q, new THREE.Vector3(0, 1, 0)); m.setPosition(p.clone().add(q).multiplyScalar(0.5)); g.applyMatrix4(m); L.push(g); }
function luzes(L, pts, r = 0.7) { for (const p of pts) L.push(new THREE.SphereGeometry(r, 6, 4).translate(p.x, p.y, p.z)); }
/** Monta uma PARTE: { aco: [geos], conc: [geos], asf: [...], luz: [...], verm: [...] } → grupo com 1 malha por material. */
function parte(nome, P, corAco, destr) { const g = new THREE.Group(); g.name = 'destr'; g.userData.destr = destr; g.userData.parteNome = nome;
  for (const [k, m] of [['aco', aco(corAco)], ['conc', conc()], ['asf', asf()], ['luz', lamp()], ['verm', verm()]]) { const L = P[k]; if (!L || !L.length) continue; const gm = mergeGeometries(L.map((q) => (q.index ? q.toNonIndexed() : q)), false); if (!gm) continue; const me = new THREE.Mesh(gm, m); if (k === 'luz' || k === 'verm') me.userData.luzPonte = 1; else { me.castShadow = k !== 'asf'; me.receiveShadow = true; } g.add(me); } return g; }
const V = (x, y, z) => new THREE.Vector3(x, y, z);
/** Ponte PÊNSIL. a, b = margens {x,z}; o: { vao, torreH, deck, larg, cor, estilo: 'barras'|'cabos', painel }. Eixo local: +X de a para b. */
export function pontePensil(a, b, o) { const G = new THREE.Group(); const L = Math.hypot(b.x - a.x, b.z - a.z); const ang = Math.atan2(b.z - a.z, b.x - a.x); G.position.set(a.x, 0, a.z); G.rotation.y = -ang;
  const vao = Math.min(o.vao, L * 0.72), s1 = L / 2 - vao / 2, s2 = L / 2 + vao / 2, H = o.torreH, D = o.deck, W = o.larg, _via = (G.userData.via = { L, larg: o.larg, y: () => o.deck + 0.6 }), /* v1.2.46: pista para os carros */ hw = W / 2, pn = o.painel || 15, barras = o.estilo === 'barras', cor = o.cor;
  const tr = barras ? 9 : 7.6; /* altura da treliça de enrijecimento */
  const yCabo = (s) => { if (s >= s1 && s <= s2) { const u = (s - (s1 + s2) / 2) / (vao / 2); return (barras ? D + 1 : D + 4) + (H - (barras ? D + 1 : D + 4)) * u * u; } const ancor = barras ? D - 2 : D - 6; if (s < s1) { const u = s / s1; return ancor + (H - ancor) * Math.pow(u, 1.35); } const u = (L - s) / (L - s2); return ancor + (H - ancor) * Math.pow(u, 1.35); };
  const partes = []; const novaP = () => ({ aco: [], conc: [], asf: [], luz: [], verm: [] });
  const trecho = (sA, sB, P) => { /* tabuleiro + treliça + cabos/correntes + pendurais entre sA e sB */
    caixa(P.asf, (sA + sB) / 2, D + 0.4, 0, sB - sA, 0.8, W - 2); for (const z of [-hw, hw]) { caixa(P.aco, (sA + sB) / 2, D, z, sB - sA, 1.1, 0.9); caixa(P.aco, (sA + sB) / 2, D - tr, z, sB - sA, 1.1, 0.9); caixa(P.aco, (sA + sB) / 2, D + 1.4, z * 0.94, sB - sA, 1.1, 0.25); } /* corrimão */
    for (let s = sA; s < sB - 0.1; s += pn) { const s2_ = Math.min(sB, s + pn); for (const z of [-hw, hw]) { barra(P.aco, V(s, D - tr, z), V(s, D, z), 0.7, 0.7); barra(P.aco, V(s, D - tr, z), V(s2_, D, z), 0.45, 0.45); } caixa(P.aco, s, D - tr * 0.5, 0, 0.6, 0.8, W); barra(P.aco, V(s, D - tr, -hw), V(s2_, D - tr, hw), 0.35, 0.35); /* contraventamento inferior */
      const yc = yCabo(s); for (const z of [-hw - 0.6, hw + 0.6]) { if (yc > D + 1.5) { if (barras) { barra(P.aco, V(s, D, z), V(s, yc, z), 0.5, 0.5); if (s > s1 && s < s2) barra(P.aco, V(s, D, z), V(s2_, yCabo(s2_), z), 0.4, 0.4); } else cil(P.aco, V(s, D + 1.2, z), V(s, yc, z), 0.18, 4); } /* pendurais / treliça entre corrente e tabuleiro */
        const yc2 = yCabo(s2_); if (barras) { for (const dz of [-0.7, 0.7]) barra(P.aco, V(s, yc, z + dz), V(s2_, yc2, z + dz), 0.35, 1.6); /* corrente: 2 linhas de barras de olhal achatadas */ caixa(P.aco, s, yc, z, 1.6, 1.9, 2.2); /* pino/junta */ } else cil(P.aco, V(s, yc, z), V(s2_, yc2, z), 0.48, 8);
        if (((s / pn) | 0) % 2 === 0) P.luz.push(new THREE.SphereGeometry(barras ? 0.55 : 0.5, 6, 4).translate(s, yc + 1.2, z)); } }
    for (let s = sA + pn * 0.5; s < sB; s += 50) for (const z of [-hw * 0.86, hw * 0.86]) { caixa(P.conc, s, D + 4.5, z, 0.3, 8, 0.3); P.luz.push(new THREE.SphereGeometry(0.45, 6, 4).translate(s, D + 8.6, z)); } /* postes do tabuleiro */ };
  // partes do tabuleiro: viaduto/vão lateral A, metade 1 e 2 do vão central, vão lateral B
  const cortes = [[0, s1, 'lateralA'], [s1, L / 2, 'centralA'], [L / 2, s2, 'centralB'], [s2, L, 'lateralB']];
  for (const [sA, sB, nm] of cortes) { const P = novaP(); trecho(sA, sB, P); if (nm.startsWith('lateral')) { for (let s = sA + 40; s < sB - 20; s += 60) for (const z of [-hw + 1.5, hw - 1.5]) caixa(P.conc, s, (D - tr) / 2 - 10, z, 4, D - tr + 20, 4); } /* pilares de aproximação */
    const g = parte(nm, P, cor, { tipo: 'ponteVao', kHp: (sB - sA) / 200 + 0.6, ponte: o.id, papel: nm, vazado: false, caixaY: [D - tr - 1, tr + 3] }); partes.push(g); G.add(g); }
  // torres
  for (const [s, nm] of [[s1, 'torreA'], [s2, 'torreB']]) { const P = novaP();
    if (barras) { /* torre treliçada de aço: 2 pernas em treliça, contraventadas em X, com sela no topo */ for (const z of [-hw - 0.6, hw + 0.6]) { for (const dx of [-2.4, 2.4]) for (const dz of [-1.4, 1.4]) barra(P.aco, V(s + dx * 1.5, D - tr - 2, z + dz * 1.4), V(s + dx * 0.6, H, z + dz * 0.6), 0.9, 0.9);
        for (let y = D - tr; y < H - 4; y += 8) { barra(P.aco, V(s - 3, y, z), V(s + 3, y + 8, z), 0.4, 0.4); barra(P.aco, V(s + 3, y, z), V(s - 3, y + 8, z), 0.4, 0.4); } caixa(P.aco, s, H + 1, z, 6, 3, 4); P.verm.push(new THREE.SphereGeometry(0.9, 6, 4).translate(s, H + 3.4, z)); }
      for (const y of [D + 6, H - 6, (D + H) / 2]) caixa(P.aco, s, y, 0, 2.2, 2.2, W + 2); for (let y = D + 6; y < H - 8; y += 12) { barra(P.aco, V(s, y, -hw), V(s, y + 12, hw), 0.5, 0.5); barra(P.aco, V(s, y, hw), V(s, y + 12, -hw), 0.5, 0.5); } }
    else { /* torre de pórtico: 2 colunas celulares afinando, 4 travessas art déco acima do tabuleiro */ for (const z of [-hw - 1, hw + 1]) { const n = 4; for (let k = 0; k < n; k++) { const y0 = D - 8 + (H - D + 8) * k / n, y1 = D - 8 + (H - D + 8) * (k + 1) / n, w = 10 - k * 1.2; caixa(P.aco, s, (y0 + y1) / 2, z, w, y1 - y0, 9 - k * 1.4); } P.verm.push(new THREE.SphereGeometry(1.1, 6, 4).translate(s, H + 1.5, z)); }
      for (const y of [D + 20, D + (H - D) * 0.42, D + (H - D) * 0.68, H - 6]) caixa(P.aco, s, y, 0, 6, 7, W + 2); caixa(P.aco, s, D - tr - 4, 0, 10, 8, W + 6); }
    caixa(P.conc, s, (D - tr - 2) / 2 - 12, 0, 22, D - tr - 2 + 24, W + 14); /* pilar/base de concreto até o fundo */
    const g = parte(nm, P, cor, { tipo: 'ponteTorre', kHp: barras ? 1 : 1.6, ponte: o.id, papel: nm }); partes.push(g); G.add(g); }
  G.updateMatrixWorld(true); const pilares = []; for (const s of [s1, s2]) { const v = V(s, 0, 0).applyMatrix4(G.matrixWorld); pilares.push({ x: v.x, z: v.z, r: barras ? 12 : 16 }); }
  for (let s = 40; s < s1 - 20; s += 60) for (const z of [-hw + 1.5, hw - 1.5]) { const v = V(s, 0, z).applyMatrix4(G.matrixWorld); pilares.push({ x: v.x, z: v.z, r: 3 }); } for (let s = s2 + 40; s < L - 20; s += 60) for (const z of [-hw + 1.5, hw - 1.5]) { const v = V(s, 0, z).applyMatrix4(G.matrixWorld); pilares.push({ x: v.x, z: v.z, r: 3 }); }
  G.name = 'ponte'; G.userData.pilares = pilares; G.userData.partes = partes; return G; }
/** Ponte de VIGAS (caixão de concreto) sobre pilares duplos; perfil elevado no meio (gabarito de navegação). */
export function ponteVigas(a, b, o) { const G = new THREE.Group(); const L = Math.hypot(b.x - a.x, b.z - a.z); const ang = Math.atan2(b.z - a.z, b.x - a.x); G.position.set(a.x, 0, a.z); G.rotation.y = -ang;
  const W = o.larg, hw = W / 2, vaoP = o.vaoP || 46, yD = (s) => o.base + (o.alto - o.base) * Math.pow(Math.sin(Math.PI * Math.max(0, Math.min(1, s / L))), 0.6); const pilares = []; G.userData.via = { L, larg: W, y: (s) => yD(s) + 0.6 }; /* v1.2.46 */
  const nT = Math.max(3, Math.round(L / 140)); for (let t = 0; t < nT; t++) { const sA = (L * t) / nT, sB = (L * (t + 1)) / nT; const P = { aco: [], conc: [], asf: [], luz: [], verm: [] };
    for (let s = sA; s < sB - 0.1; s += 10) { const s2 = Math.min(sB, s + 10), y1 = yD(s), y2 = yD(s2); barra(P.conc, V(s, y1 - 1.6, 0), V(s2, y2 - 1.6, 0), W * 0.7, 3.2); barra(P.asf, V(s, y1 + 0.25, 0), V(s2, y2 + 0.25, 0), W, 0.5); for (const z of [-hw + 0.3, hw - 0.3]) barra(P.conc, V(s, y1 + 0.9, z), V(s2, y2 + 0.9, z), 0.4, 1.0); }
    for (let s = sA + vaoP / 2; s < sB; s += vaoP) { const y = yD(s); for (const z of [-W * 0.25, W * 0.25]) caixa(P.conc, s, (y - 3.2) / 2 - 10, z, 2.6, y - 3.2 + 20, 2.6); caixa(P.conc, s, y - 3.6, 0, 3, 1.4, W * 0.8); pilares.push([s, 0]); }
    for (let s = sA + 15; s < sB; s += 40) { const y = yD(s); caixa(P.conc, s, y + 5, 0, 0.3, 9, 0.3); P.luz.push(new THREE.SphereGeometry(0.45, 6, 4).translate(s, y + 9.4, 0)); }
    const g = parte('vigas' + t, P, '#888', { tipo: 'ponteVao', kHp: 0.9, ponte: o.id, papel: 'vigas', caixaY: [yD((sA + sB) / 2) - 4, 6] }); G.add(g); }
  G.updateMatrixWorld(true); G.userData.pilares = pilares.map(([s]) => { const v = V(s, 0, 0).applyMatrix4(G.matrixWorld); return { x: v.x, z: v.z, r: 4 }; }); G.name = 'ponte'; return G; }
/** Procura a travessia d'água mais curta perto de (x,z) com rumo ~ang (± tol): devolve margens a, b (terra firme ≥ 2 m) ou null. */
export function achaTravessia(relevo, T, x, z, ang, tol = 0.35, busca = 700) { let melhor = null;
  for (let dx = -busca; dx <= busca; dx += 50) for (let dz = -busca; dz <= busca; dz += 50) { const px = x + dx, pz = z + dz; if (relevo(T, px, pz) > -2) continue;
    for (let da = -tol; da <= tol + 1e-6; da += 0.07) { const a = ang + da, ux = Math.cos(a), uz = Math.sin(a); let sA = 0, sB = 0; while (sA < 2500 && relevo(T, px - ux * sA, pz - uz * sA) < 2) sA += 10; while (sB < 2500 && relevo(T, px + ux * sB, pz + uz * sB) < 2) sB += 10; const Lt = sA + sB; if (sA >= 2500 || sB >= 2500) continue;
      const pen = Math.hypot(dx, dz) * 0.35 + Math.abs(da) * 200; if (!melhor || Lt + pen < melhor.c) melhor = { c: Lt + pen, a: { x: px - ux * (sA + 25), z: pz - uz * (sA + 25) }, b: { x: px + ux * (sB + 25), z: pz + uz * (sB + 25) }, L: Lt + 50 }; } }
  return melhor; }
