// Naval B v1.3.03 — MODELO 3D dos caças VTOL do Destróier Amorim (projeto do Valter, LOD de jogo ≤ 8000 tris):
// Acauã (verde-bandeira metálico) e Uiraçu (azul-bandeira metálico). Forma, cores e peças do OBJ: cabine com vidro fumê dourado e piloto
// (viseira em espelho dourado), bandeira do Brasil nas derivas, faixa verde/amarela nas asas, luzes de navegação emissivas.
// Cada ESTAÇÃO de arma é um grupo 'estNN': o render esconde as estações já disparadas (pilone vazio) e mostra de novo ao rearmar.
// Geometria decodificada UMA vez por caça (cache) e compartilhada entre todos os clones (navio e voo).
import * as THREE from 'three';
import { VTOL_GEO } from './vtolDados.js';

let _M = null;
function mats() {
  if (_M) return _M; const S = (o) => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide, vertexColors: true }, o));
  _M = { metal: S({ roughness: 0.24, metalness: 0.85, envMapIntensity: 1.4 }), fosco: S({ roughness: 0.8, metalness: 0.1, envMapIntensity: 0.4 }),
    vidro: S({ roughness: 0.08, metalness: 0.4, envMapIntensity: 1.3 }), vidroFume: S({ roughness: 0.05, metalness: 0.3, envMapIntensity: 1.5, transparent: true, opacity: 0.4, depthWrite: false }),
    ouro: S({ roughness: 0.06, metalness: 1, envMapIntensity: 1.8 }), laser: S({ roughness: 0.2, metalness: 0.3, emissive: '#40f0ff', emissiveIntensity: 0.6 }) };
  return _M;
}
const _LUZ = new Map(); const matLuz = (hx) => { if (!_LUZ.has(hx)) _LUZ.set(hx, new THREE.MeshStandardMaterial({ color: '#' + hx, emissive: '#' + hx, emissiveIntensity: 1.6, roughness: 0.2, metalness: 0.3 })); return _LUZ.get(hx); };
const _cor = new THREE.Color(); const _GEO = new WeakMap();
const b64 = (s) => { const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };
function geometrias(lista) {
  if (_GEO.has(lista)) return _GEO.get(lista); const esc = 1 / VTOL_GEO.esc, por = new Map();
  for (const e of lista) { const q = new Int16Array(b64(e.p).buffer), nn = new Int8Array(b64(e.n).buffer); if (!por.has(e.m)) por.set(e.m, []); por.get(e.m).push({ q, nn, n: q.length / 3, cor: e.c }); }
  const out = [];
  for (const [m, P] of por) { let N = 0; for (const p of P) N += p.n; const pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), col = new Float32Array(N * 3); let o = 0;
    for (const p of P) { _cor.set(p.cor); for (let i = 0; i < p.n; i++) { const j = (o + i) * 3; pos[j] = p.q[i * 3] * esc; pos[j + 1] = p.q[i * 3 + 1] * esc; pos[j + 2] = p.q[i * 3 + 2] * esc; nor[j] = p.nn[i * 3] / 127; nor[j + 1] = p.nn[i * 3 + 1] / 127; nor[j + 2] = p.nn[i * 3 + 2] / 127; col[j] = _cor.r; col[j + 1] = _cor.g; col[j + 2] = _cor.b; } o += p.n; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeBoundingSphere(); out.push([m, g]); }
  _GEO.set(lista, out); return out;
}
function poe(grupo, lista) { const M = mats(); for (const [m, g] of geometrias(lista)) { const x = new THREE.Mesh(g, m.startsWith('luz_') ? matLuz(m.slice(4)) : M[m] || M.metal); x.castShadow = true; x.receiveShadow = true; if (m === 'vidroFume') x.renderOrder = 2; grupo.add(x); } return grupo; }

export const ehVtolAmorim = (id) => id === 'acaua' || id === 'uiracu';
/** Monta o caça (id 'acaua' | 'uiracu'). userData.estOrd = estações de míssil na ordem de disparo (o render esconde as já usadas). */
export function montaVtol(id) {
  const D = VTOL_GEO[id], g = new THREE.Group(); g.name = 'vtol_' + id; poe(g, D.base);
  const est = {}; for (const [k, L] of Object.entries(D.est)) { const e = new THREE.Group(); e.name = k; poe(e, L); g.add(e); est[k] = e; }
  g.userData.vtol = id; g.userData.estOrd = D.ordem.map((k) => est[k]).filter(Boolean); g.userData.fumacaVtol = D.fumaca; g.userData._munV = -1;
  return g;
}
/** Esconde as estações já disparadas (mun = munição que resta; total = munição cheia). Só mexe quando o número muda (zero GC). */
export function estacoesVtol(g, mun, total) { const U = g.userData; if (!U.estOrd || U._munV === mun) return; U._munV = mun; const usadas = Math.max(0, Math.min(U.estOrd.length, (total | 0) - (mun | 0))); for (let i = 0; i < U.estOrd.length; i++) U.estOrd[i].visible = i >= usadas; }
