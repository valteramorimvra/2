// Naval B v1.3.00 — MODELO 3D do super lendário AMORIM (SL 06): o modelo final do Valter (Navio-Amorim.html), exatamente
// como está (forma, cores, peças), com acabamento METÁLICO BRILHANTE dos arquivos. Peças móveis separadas por tools/amorim/gera.py:
// 2 torres de 3 canos (giro + pivô de elevação + recuo de cada cano), 3 radares (giro lento, cada um na sua velocidade, em torno do
// pedestal), 2 CIWS do teto do hangar, 2 canhões automáticos pretos de ré e os 2 canhões automáticos novos à vante da casaria.
// Desempenho: casco fixo = 1 malha por material (8 materiais); geometria decodificada UMA vez e compartilhada entre clones.
import * as THREE from 'three';
import { AMORIM_GEO } from './amorimDados.js';
import { texBandeira } from './camuflagem.js';

let _MAT = null;
function mats() {
  if (_MAT) return _MAT; const S = (o) => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide }, o));
  _MAT = {
    metal: S({ vertexColors: true, roughness: 0.2, metalness: 0.9, envMapIntensity: 1.3 }),
    fosco: S({ vertexColors: true, roughness: 0.8, metalness: 0.25, envMapIntensity: 0.4 }),
    ouro: S({ color: '#d4af37', roughness: 0.25, metalness: 1, envMapIntensity: 1.3 }),
    sinal: S({ vertexColors: true, roughness: 0.15, metalness: 0.95, envMapIntensity: 1.3 }),
    vidro: S({ vertexColors: true, roughness: 0.08, metalness: 0.4, envMapIntensity: 1.3 }),
    vra: S({ color: '#ffd400', roughness: 0.35, metalness: 0.35 }),
    laser: S({ color: '#dfe6ea', roughness: 0.25, metalness: 0.3, emissive: '#00e5ff', emissiveIntensity: 0.35 }),
    luz_ff1a1a: S({ color: '#ff1a1a', emissive: '#ff1a1a', emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.9 }),
    luz_1aff4a: S({ color: '#1aff4a', emissive: '#1aff4a', emissiveIntensity: 1.4, roughness: 0.2, metalness: 0.9 }),
    luz_fffbe8: S({ color: '#fffbe8', emissive: '#fffbe8', emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.9 }),
  };
  for (const m of Object.values(_MAT)) m.userData.amorim = 1; return _MAT;
}
const _cor = new THREE.Color();
/** Lista de malhas (base64 Int16, passo 1/esc m) → 1 geometria por material, com cor por vértice onde o material usa. Cache por lista. */
const _GEO = new WeakMap();
function geometrias(lista) {
  if (_GEO.has(lista)) return _GEO.get(lista); const esc = 1 / AMORIM_GEO.esc, por = new Map();
  for (const e of lista) { const s = atob(e.p), u8 = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i); const q = new Int16Array(u8.buffer), n = q.length / 3;
    if (!por.has(e.m)) por.set(e.m, []); por.get(e.m).push({ q, n, cor: e.c }); }
  const out = [];
  for (const [m, partes] of por) { let N = 0; for (const p of partes) N += p.n; const pos = new Float32Array(N * 3), col = new Float32Array(N * 3); let o = 0;
    for (const p of partes) { _cor.set(p.cor); for (let i = 0; i < p.n; i++) { pos[(o + i) * 3] = p.q[i * 3] * esc; pos[(o + i) * 3 + 1] = p.q[i * 3 + 1] * esc; pos[(o + i) * 3 + 2] = p.q[i * 3 + 2] * esc; col[(o + i) * 3] = _cor.r; col[(o + i) * 3 + 1] = _cor.g; col[(o + i) * 3 + 2] = _cor.b; } o += p.n; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); g.computeBoundingSphere(); out.push([m, g]); }
  _GEO.set(lista, out); return out;
}
function poeMalhas(grupo, lista, sombra = true) { const M = mats(); for (const [m, g] of geometrias(lista)) { const x = new THREE.Mesh(g, M[m] || M.metal); x.castShadow = sombra; x.receiveShadow = true; grupo.add(x); } return grupo; }

/** Canhão automático NOVO (projeto do Valter, armas-novas.js): pedestal cinza, domo branco e cano. Fica à vante da casaria, um por bordo. */
function canhaoNovo() { const g = new THREE.Group(), cab = new THREE.Group(); cab.name = 'cab'; g.add(cab);
  const M = (c, r, m) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, envMapIntensity: 1.3 });
  const cinza = M('#7b8890', 0.45, 0.5), esc = M('#1e2328', 0.5, 0.55), dom = M('#f2f4f5', 0.28, 0.1);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.0, 20), cinza); ped.position.y = 0.5; g.add(ped);
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), dom); d.position.y = 1.4; d.scale.y = 1.4; cab.add(d);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.4, 12), esc); c.rotation.x = Math.PI / 2; c.position.set(0, 1.3, -1.6); cab.add(c);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }

/** Nome AMORIM no casco (amarelo do modelo), acima da faixa amarela, nos dois bordos. Sem número de casco. */
let _texNome = null;
function texNome() { if (_texNome || typeof document === 'undefined') return _texNome; const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const x = c.getContext('2d');
  x.clearRect(0, 0, 1024, 192); x.font = '900 150px Arial Black, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffd400'; x.fillText('AMORIM', 512, 100);
  _texNome = new THREE.CanvasTexture(c); _texNome.colorSpace = THREE.SRGBColorSpace; _texNome.anisotropy = 4; return _texNome; }

/** POSIÇÕES de armas e peças (as mesmas que a simulação usa — sim/amorim.js importa daqui). Metros, proa em −z, boreste em +x. */
export const AMORIM_POS = {
  torres: AMORIM_GEO.torres.map((t) => ({ x: 0, y: t.pos[1], z: t.pos[2], py: t.piv[1], pz: t.piv[2] })),
  radares: [['radar1', 0.45], ['radar2', -0.58], ['radar3', 0.7]],
  autosNovos: [{ x: -7.6, y: 6.4, z: -34 }, { x: 7.6, y: 6.4, z: -34 }],
  chamines: [{ x: -2.1, y: 22.6, z: 24.3 }, { x: 2.1, y: 22.6, z: 24.3 }],
};

export function montaModeloAmorim() {
  const G = AMORIM_GEO, g = new THREE.Group(); g.name = 'amorim';
  poeMalhas(g, G.base);
  /* torres: grupo 'torreI' (giro) → 'pivo' (elevação) → 'cano'/'cano2'/'cano3' (recuo) — contrato do jogo (shipModels.criaNavio3D) */
  G.torres.forEach((t, i) => { const tr = new THREE.Group(); tr.name = 'torre' + i; tr.position.set(t.pos[0], t.pos[1], t.pos[2]); poeMalhas(tr, t.malhas);
    const pv = new THREE.Group(); pv.name = 'pivo'; pv.position.set(t.piv[0], t.piv[1], t.piv[2]); tr.add(pv);
    for (const nm of ['cano', 'cano2', 'cano3']) { const cg = new THREE.Group(); cg.name = nm; if (t.canos[nm]) poeMalhas(cg, t.canos[nm]); pv.add(cg); }
    g.add(tr); });
  /* radares (pretos), cada um girando no seu pedestal */
  for (const [nm, r] of Object.entries(G.radares)) { const rg = new THREE.Group(); rg.name = 'am_' + nm; rg.position.set(r.pos[0], r.pos[1], r.pos[2]); poeMalhas(rg, r.malhas); g.add(rg); }
  /* CIWS do hangar e canhões automáticos pretos de ré: grupo + 'cab' que gira */
  for (const [nm, r] of Object.entries(G.giram)) { const rg = new THREE.Group(); rg.position.set(r.pos[0], r.pos[1], r.pos[2]); const cab = new THREE.Group(); cab.name = 'cab'; rg.add(cab); poeMalhas(cab, r.malhas); if (nm.startsWith('ciws')) { const cn = new THREE.Group(); cn.name = 'canos'; cab.add(cn); }
    rg.name = nm.startsWith('ciws') ? nm : 'amAuto' + nm.slice(-1); g.add(rg); }
  AMORIM_POS.autosNovos.forEach((p, i) => { const c = canhaoNovo(); c.name = 'amAuto' + (2 + i); c.position.set(p.x, p.y, p.z); c.rotation.y = p.x < 0 ? 0.5 : -0.5; g.add(c); });
  /* nome no casco */
  { const t = texNome(); if (t) { const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.4, roughness: 0.35, metalness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
      for (const sx of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.7), m); pl.position.set(sx * 9.47, 5.55, -44); pl.rotation.y = sx * Math.PI / 2; pl.name = 'nomeAmorim'; g.add(pl); } } }
  /* v1.3.01: pau da bandeira na popa + bandeira 'flamula' (a bandeira escolhida pelo jogador troca o material dela, como nos outros navios) */
  { const pau = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 5.2, 8), new THREE.MeshStandardMaterial({ color: '#c9ced3', roughness: 0.25, metalness: 0.9, envMapIntensity: 1.3 })); pau.position.set(0, 5.6 + 2.6, 70.9); pau.castShadow = true; g.add(pau);
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ map: texBandeira('BRA'), side: THREE.DoubleSide, roughness: 0.8, alphaTest: 0.5 })); fl.position.set(0, 5.6 + 4.3, 70.9 + 1.25); fl.rotation.y = Math.PI / 2; fl.userData.det = 1; fl.name = 'flamula'; g.add(fl); }
  /* pontos usados pelo jogo: chaminé (fumaça), holofote, topo do mastro */
  g.userData.chamine = new THREE.Vector3(AMORIM_POS.chamines[0].x, AMORIM_POS.chamines[0].y, AMORIM_POS.chamines[0].z);
  g.userData.chamines = AMORIM_POS.chamines.map((c) => new THREE.Vector3(c.x, c.y, c.z));
  g.userData.holofote = new THREE.Vector3(0, 26, -12); g.userData.topoMastro = new THREE.Vector3(0, 46.2, -5.4); g.userData.luzTopo = g.userData.topoMastro.clone(); g.userData.raioLuz = 0.3;
  /* pintura fixa do modelo: as camuflagens do jogo NÃO trocam as cores do Amorim (materiais-fantasma) */
  g.userData.matCasco = new THREE.MeshStandardMaterial(); g.userData.matSup = new THREE.MeshStandardMaterial(); g.userData.matConves = new THREE.MeshStandardMaterial();
  g.userData.amorim = 1;
  return g;
}
