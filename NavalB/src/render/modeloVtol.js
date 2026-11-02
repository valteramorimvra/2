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
  _M = { pisca_estrobo: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.2, metalness: 0.3 }), pisca_anti: new THREE.MeshStandardMaterial({ color: '#ff1a1a', emissive: '#ff1a1a', emissiveIntensity: 0, roughness: 0.2, metalness: 0.3 }), /* v1.3.04: luzes que PISCAM (o render muda só a intensidade) */
    metal: S({ roughness: 0.24, metalness: 0.85, envMapIntensity: 1.4 }), fosco: S({ roughness: 0.8, metalness: 0.1, envMapIntensity: 0.4 }),
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
export const matsPisca = () => { const M = mats(); return { estrobo: M.pisca_estrobo, anti: M.pisca_anti }; };
/** Monta o caça (id 'acaua' | 'uiracu'). userData.estOrd = estações de míssil na ordem de disparo (o render esconde as já usadas). */
export function montaVtol(id) {
  const D = VTOL_GEO[id], g = new THREE.Group(); g.name = 'vtol_' + id; poe(g, D.base);
  const est = {}; for (const [k, L] of Object.entries(D.est)) { const e = new THREE.Group(); e.name = k; poe(e, L); g.add(e); est[k] = e; }
  g.userData.vtol = id; g.userData.estOrd = D.ordem.map((k) => est[k]).filter(Boolean); g.userData.fumacaVtol = D.fumaca; g.userData._munV = -1;
  /* v1.3.10: TREM DE POUSO e portas do trem como peças móveis (pivô e ângulo do META do Valter): recolhe para trás em 4 s; portas fecham */
  const piv = (L, p) => { const pv = new THREE.Group(); pv.position.set(p[0], p[1], p[2]); const e = new THREE.Group(); e.position.set(-p[0], -p[1], -p[2]); poe(e, L); pv.add(e); g.add(pv); return pv; };
  const MOV = D.mov || {}; g.userData.trem = (D.trem || []).filter((t) => MOV[t.g]).map((t) => ({ o: piv(MOV[t.g], t.p), e: t.e, a: t.a })); g.userData.portasTrem = (D.portas || []).filter((t) => MOV[t.g]).map((t) => ({ o: piv(MOV[t.g], t.p), e: t.e, a: t.a })); g.userData.tTrem = D.tTrem || 4; g.userData._kTrem = 0;
  g.userData.estTipo = {}; for (const t of ['aam', 'asm', 'torp', 'nuke']) g.userData.estTipo[t] = (D.ordemTipo[t] || []).map((k) => est[k]).filter(Boolean); g.userData._vtV = [-1, -1, -1, -1]; g.userData.lasersP = D.lasers; /* v1.3.04 */
  return g;
}
/** Esconde as estações já disparadas (mun = munição que resta; total = munição cheia). Só mexe quando o número muda (zero GC). */
/** v1.3.04: estações por TIPO (AAM/ASM/TORP/NUKE) conforme a munição que resta em h.vt — a disparada some (pilone vazio), ao rearmar volta. */
const TIPOS = ['aam', 'asm', 'torp', 'nuke'];
export function estacoesVtPorTipo(g, vt) { const U = g.userData; if (!U.estTipo || !vt) return; for (let t = 0; t < 4; t++) { const k = TIPOS[t], resta = vt[k] | 0; if (U._vtV[t] === resta) continue; U._vtV[t] = resta; const L = U.estTipo[k], usadas = Math.max(0, L.length - resta); for (let i = 0; i < L.length; i++) L[i].visible = i >= usadas; } }
/** v1.3.10: trem de pouso — k = 0 baixado (portas abertas, como no modelo) · 1 recolhido (pernas para trás, portas fechadas). Só mexe quando k muda. */
export function tremVtol(g, k) { const U = g.userData; if (!U.trem || U._kTrem === k) return; U._kTrem = k; for (const t of U.trem) t.o.rotation.set(t.e[0] * t.a * k, t.e[1] * t.a * k, t.e[2] * t.a * k); for (const t of U.portasTrem) t.o.rotation.set(-t.e[0] * t.a * k, -t.e[1] * t.a * k, -t.e[2] * t.a * k); }
export function estacoesVtol(g, mun, total) { const U = g.userData; if (!U.estOrd || U._munV === mun) return; U._munV = mun; const usadas = Math.max(0, Math.min(U.estOrd.length, (total | 0) - (mun | 0))); for (let i = 0; i < U.estOrd.length; i++) U.estOrd[i].visible = i >= usadas; }
