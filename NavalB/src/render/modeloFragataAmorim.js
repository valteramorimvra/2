// Naval B v1.3.02 — MODELO 3D da FRAGATA LENDÁRIA AMORIM (L 09), projeto do Valter (Fragata-Amorim v5.1): forma, cores e peças do OBJ,
// com acabamento metálico (cinza naval escuro com verniz, corrimãos pretos brilhantes). Peças móveis separadas por tools/fragata/gera.py:
// 2 torres de 127 mm (giro + pivô + cano), 2 CIWS, 2 canhões automáticos de 30 mm, 3 radares; bandeiras de popa ('flamula') e de
// proa ('flamulaProa') recebem a bandeira escolhida. Geometria decodificada UMA vez (cache) e compartilhada entre clones; normais do OBJ.
import * as THREE from 'three';
import { FRAGATA_GEO } from './fragataAmorimDados.js';
import { texBandeira } from './camuflagem.js';

let _MAT = null;
function mats() {
  if (_MAT) return _MAT; const S = (o) => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, o));
  _MAT = {
    metal: S({ vertexColors: true, roughness: 0.26, metalness: 0.88, envMapIntensity: 1.4 }),
    fosco: S({ vertexColors: true, roughness: 0.8, metalness: 0.2, envMapIntensity: 0.4 }),
    sinal: S({ vertexColors: true, roughness: 0.35, metalness: 0.3, envMapIntensity: 0.8 }),
    vidro: S({ vertexColors: true, roughness: 0.08, metalness: 0.4, envMapIntensity: 1.3 }),
    laser: S({ color: '#dfe6ea', roughness: 0.25, metalness: 0.3, emissive: '#00e5ff', emissiveIntensity: 0.35 }),
  };
  for (const m of Object.values(_MAT)) m.userData.fragAmorim = 1; return _MAT;
}
function matLuz(hx) { const k = 'luz_' + hx; if (!_MAT[k]) { _MAT[k] = new THREE.MeshStandardMaterial({ color: '#' + hx, emissive: '#' + hx, emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.6 }); } return _MAT[k]; }
const _cor = new THREE.Color();
const _GEO = new WeakMap();
const b64 = (s) => { const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
/** Lista de malhas → [material, geometria] (1 geometria por material/cor). Cache por lista. */
function geometrias(lista) {
  if (_GEO.has(lista)) return _GEO.get(lista); const esc = 1 / FRAGATA_GEO.esc, por = new Map();
  for (const e of lista) { const q = new Int16Array(b64(e.p).buffer), nn = new Int8Array(b64(e.n).buffer), n = q.length / 3; const k = e.m.startsWith('luz_') ? e.m : e.m; if (!por.has(k)) por.set(k, []); por.get(k).push({ q, nn, n, cor: e.c }); }
  const out = [];
  for (const [m, partes] of por) { let N = 0; for (const p of partes) N += p.n; const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), col = new Float32Array(N * 3); let o = 0;
    for (const p of partes) { _cor.set(p.cor); for (let i = 0; i < p.n; i++) { const j = (o + i) * 3; pos[j] = p.q[i * 3] * esc; pos[j + 1] = p.q[i * 3 + 1] * esc; pos[j + 2] = p.q[i * 3 + 2] * esc; nor[j] = p.nn[i * 3] / 127; nor[j + 1] = p.nn[i * 3 + 1] / 127; nor[j + 2] = p.nn[i * 3 + 2] / 127; col[j] = _cor.r; col[j + 1] = _cor.g; col[j + 2] = _cor.b; } o += p.n; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere(); out.push([m, g]); }
  _GEO.set(lista, out); return out;
}
function poeMalhas(grupo, lista) { const M = mats(); for (const [m, g] of geometrias(lista)) { const x = new THREE.Mesh(g, m.startsWith('luz_') ? matLuz(m.slice(4)) : (M[m] || M.metal)); x.castShadow = true; x.receiveShadow = true; grupo.add(x); } return grupo; }

/** POSIÇÕES usadas pela simulação (sim/classesFragAmorim.js) e pelo render. Metros, proa em −z, boreste em +x. */
export const FRAGATA_POS = { radares: Object.entries(FRAGATA_GEO.radares).map(([nm, r]) => [nm, r.w]), chamines: FRAGATA_GEO.chamines };

export function montaModeloFragataAmorim() {
  const G = FRAGATA_GEO, g = new THREE.Group(); g.name = 'fragataAmorim';
  poeMalhas(g, G.base);
  /* torres 127 mm: 'torreI' (giro) → 'pivo' (elevação) → 'cano' (recuo) — contrato de shipModels.criaNavio3D */
  G.torres.forEach((t, i) => { const tr = new THREE.Group(); tr.name = 'torre' + i; tr.position.set(t.pos[0], t.pos[1], t.pos[2]); poeMalhas(tr, t.malhas);
    const pv = new THREE.Group(); pv.name = 'pivo'; pv.position.set(t.piv[0], t.piv[1], t.piv[2]); tr.add(pv); const cn = new THREE.Group(); cn.name = 'cano'; poeMalhas(cn, t.cano); pv.add(cn); g.add(tr); });
  /* radares girando no próprio pedestal */
  for (const [nm, r] of Object.entries(G.radares)) { const rg = new THREE.Group(); rg.name = 'am_' + nm; rg.position.set(r.pos[0], r.pos[1], r.pos[2]); poeMalhas(rg, r.malhas); g.add(rg); }
  /* CIWS ('ciwsI' → 'cab' + 'canos') e canhões automáticos de 30 mm ('amAutoI' → 'cab') */
  for (const [nm, r] of Object.entries(G.giram)) { const rg = new THREE.Group(); rg.position.set(r.pos[0], r.pos[1], r.pos[2]); const cab = new THREE.Group(); cab.name = 'cab'; rg.add(cab); poeMalhas(cab, r.malhas);
    if (nm.startsWith('ciws')) { rg.name = nm; const cn = new THREE.Group(); cn.name = 'canos'; cab.add(cn); } else rg.name = 'amAuto' + nm.slice(-1);
    g.add(rg); }
  /* bandeiras: popa ('flamula') e proa ('flamulaProa') — o jogo troca o material pela bandeira escolhida */
  for (const nm of ['flamula', 'flamulaProa']) { const f = G[nm]; const fl = new THREE.Mesh(new THREE.PlaneGeometry(f.l, f.a), new THREE.MeshStandardMaterial({ map: texBandeira('BRA'), side: THREE.DoubleSide, roughness: 0.8, alphaTest: 0.5 })); fl.position.set(0, f.c[1], f.c[2]); fl.rotation.y = Math.PI / 2; fl.userData.det = 1; fl.name = nm; g.add(fl); }
  g.userData.chamine = new THREE.Vector3(G.chamines[0][0], G.chamines[0][1], G.chamines[0][2]);
  g.userData.chamines = G.chamines.map((c) => new THREE.Vector3(c[0], c[1], c[2]));
  g.userData.holofote = new THREE.Vector3(0, 17, -21); g.userData.topoMastro = new THREE.Vector3(0, 30.85, -15.4); g.userData.luzTopo = g.userData.topoMastro.clone(); g.userData.raioLuz = 0.25;
  /* pintura fixa do modelo: camuflagens não trocam as cores (materiais-fantasma) */
  g.userData.matCasco = new THREE.MeshStandardMaterial(); g.userData.matSup = new THREE.MeshStandardMaterial(); g.userData.matConves = new THREE.MeshStandardMaterial();
  g.userData.fragAmorim = 1;
  return g;
}
