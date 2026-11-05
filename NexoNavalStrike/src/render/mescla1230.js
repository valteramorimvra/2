// v1.2.30 — FPS (crit. 9): menos chamadas de desenho SEM mudar o visual. Funde malhas-folha IRMÃS (mesmo pai ⇒ mesmo referencial rígido) de mesmo
// material em 1 malha (geometria assada na matriz local), e junta esferas de luz de cores diferentes numa só malha com cor por vértice.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** Inverte o sentido (winding) de uma geometria NÃO indexada (peça espelhada: o three inverte a face da malha com det<0; assada na fusão tem de inverter). */
function inverteTri(g) { for (const a of Object.values(g.attributes)) { const v = a.array, n = a.itemSize; for (let i = 0; i + 3 * n <= v.length; i += 3 * n) for (let c = 0; c < n; c++) { const t = v[i + n + c]; v[i + n + c] = v[i + 2 * n + c]; v[i + 2 * n + c] = t; } a.needsUpdate = true; } }
/** Funde, em cada grupo p com aceita(p) verdadeiro, os filhos-folha SEM nome/userData de mesmo material e flags (sombra, ordem). Mantém os demais filhos. Retorna [removidas, criadas]. */
export function mesclaFilhos(raiz, aceita) {
  const alvo = []; raiz.traverse((p) => { if (aceita(p)) alvo.push(p); }); let tirou = 0, criou = 0;
  for (const p of alvo) { const grupos = new Map(), rem = [];
    for (const c of p.children) {
      if (!c.isMesh || c.isInstancedMesh || c.isSkinnedMesh || c.children.length || c.name || !c.visible || !c.geometry || Array.isArray(c.material) || c.material.vertexColors || c.morphTargetInfluences || Object.keys(c.userData).length) continue;
      const g0 = c.geometry; if (!g0.attributes.uv || !g0.attributes.normal) continue; /* grupos de geometria só importam com material em array; aqui é material único */ c.updateMatrix();
      const ge = g0.index ? g0.toNonIndexed() : g0.clone(); ge.applyMatrix4(c.matrix); if (c.matrix.determinant() < 0) inverteTri(ge);
      const k = c.material.uuid + '|' + (c.castShadow ? 's' : '') + (c.receiveShadow ? 'r' : '') + '|' + c.renderOrder + '|' + c.frustumCulled + '|' + Object.keys(ge.attributes).sort().join(',');
      if (!grupos.has(k)) grupos.set(k, { m: c.material, c, gs: [], os: [] }); const G = grupos.get(k); G.gs.push(ge); G.os.push(c); }
    for (const G of grupos.values()) { if (G.gs.length < 2) continue; const mg = mergeGeometries(G.gs, false); if (!mg) continue; const x = new THREE.Mesh(mg, G.m); x.castShadow = G.c.castShadow; x.receiveShadow = G.c.receiveShadow; x.renderOrder = G.c.renderOrder; x.frustumCulled = G.c.frustumCulled; x.name = 'mescladoR'; p.add(x); criou++;
      for (const o of G.os) { p.remove(o); tirou++; } }
  }
  return [tirou, criou];
}
let MAT_LUZ = null;
/** Junta num só desenho as esferas de luz (MeshBasic opaco, filhas diretas de raiz) escolhidas por pega(c); a cor do material vai para o atributo 'color' (já em espaço linear — mesmo resultado). */
export function mesclaLuzes(raiz, pega) {
  const gs = [], os = []; for (const c of raiz.children) { if (!c.isMesh || c.isInstancedMesh || c.children.length || !c.visible || Array.isArray(c.material) || !c.material.isMeshBasicMaterial || c.material.transparent || c.material.map || c.material.vertexColors || !c.geometry || !pega(c)) continue;
    c.updateMatrix(); const ge = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone(); ge.applyMatrix4(c.matrix); if (c.matrix.determinant() < 0) inverteTri(ge); for (const a of Object.keys(ge.attributes)) if (a !== 'position') ge.deleteAttribute(a);
    const n = ge.attributes.position.count, col = new Float32Array(n * 3), k = c.material.color; for (let i = 0; i < n; i++) { col[i * 3] = k.r; col[i * 3 + 1] = k.g; col[i * 3 + 2] = k.b; } ge.setAttribute('color', new THREE.BufferAttribute(col, 3)); gs.push(ge); os.push(c); }
  if (gs.length < 2) return [0, 0]; const mg = mergeGeometries(gs, false); if (!mg) return [0, 0]; if (!MAT_LUZ) MAT_LUZ = new THREE.MeshBasicMaterial({ vertexColors: true }); const x = new THREE.Mesh(mg, MAT_LUZ); x.name = 'luzesMescla'; x.castShadow = false; x.receiveShadow = false; raiz.add(x); for (const o of os) raiz.remove(o); return [os.length, 1];
}
