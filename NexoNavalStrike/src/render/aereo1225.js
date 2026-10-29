// v1.2.25 item 12 — modelos 3D em voo das 2 aeronaves novas dos super porta-aviões (procedurais, originais, sem marcas reais).
// Mesmas convenções de aereo3d.js: nariz em −z, grupos vazios 'rotor'/'rotorCauda'/'disco' (o laço de animação os procura),
// luzes de posição (BB vermelha, BE verde) e estrobo em userData.estrobo; materiais = mats(camo) de aereo3d (sem programa novo).
import * as THREE from 'three';
function chapa(pts, e) { const sh = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z))); return new THREE.ExtrudeGeometry(sh, { depth: e, bevelEnabled: false, curveSegments: 1 }).rotateX(Math.PI / 2); }
const espelha = (m) => m.concat(m.slice().reverse().map(([x, z]) => [-x, z]));
const deriva = (pts, e = 0.14) => chapa(pts, e).rotateZ(Math.PI / 2).translate(e / 2, 0, 0);
function fim(g, M, ms, xL, yL, zL, yE, zE) { for (const nm of ['rotor', 'rotorCauda']) { const q = new THREE.Group(); q.name = nm; g.add(q); } const d = new THREE.Group(); d.name = 'disco'; g.add(d);
  const lz = (m, x, y, z) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), m); l.position.set(x, y, z); g.add(l); return l; }; lz(M.luzV, -xL, yL, zL); lz(M.luzVd, xL, yL, zL); g.userData.estrobo = lz(M.estrobo, 0, yE, zE); g.rotation.order = 'YXZ'; return g; }
/** Raio: caça furtivo monomotor de catapulta — corpo-asa facetado em diamante, derivas em V inclinadas, baia interna (sem armas externas). */
function modeloRaio(M, ms) { const g = new THREE.Group();
  const w = ms(chapa(espelha([[0, -8.2], [0.95, -5.6], [1.35, -2.2], [5.5, 2.5], [5.5, 3.9], [1.7, 4.5], [1.3, 7.3]]), 0.3), M.c2); w.position.y = 1.35; g.add(w);
  const sh = (() => { const x = 1.15, z = 6.25, a = 0.7; const s = new THREE.Shape(); [[-x + a, -z], [x - a, -z], [x, -z + a], [x, z - a], [x - a, z], [-x + a, z], [-x, z - a], [-x, -z + a]].forEach(([px, pz], i) => (i ? s.lineTo(px, pz) : s.moveTo(px, pz))); return s; })();
  const sp = ms(new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, 1.0, 0.3), M.c2); sp.position.y = 1.3; g.add(sp);
  const nz = ms(new THREE.ConeGeometry(0.95, 3.2, 4).rotateY(Math.PI / 4).scale(1, 0.55, 1).rotateX(-Math.PI / 2), M.c2); nz.position.set(0, 1.55, -7.3); g.add(nz);
  const cp = ms(new THREE.SphereGeometry(0.55, 10, 6).scale(1, 0.7, 2.8), M.vid); cp.position.set(0, 2.25, -3.9); g.add(cp);
  const ht = ms(chapa(espelha([[0.9, 5.2], [3.7, 6.3], [3.7, 7.8], [1.0, 7.7]]), 0.16), M.c2); ht.position.y = 1.3; g.add(ht);
  for (const sx of [-1, 1]) { const dv = ms(deriva([[0, 3.6], [0, 6.6], [2.7, 7.4], [2.7, 5.7]]), M.c2); dv.rotation.z = -sx * 0.5; dv.position.set(sx * 1.15, 1.75, 0); g.add(dv); }
  const bc = ms(new THREE.CylinderGeometry(0.62, 0.58, 1.0, 10).rotateX(Math.PI / 2), M.esc); bc.position.set(0, 1.4, 7.2); g.add(bc);
  const gc = ms(new THREE.BoxGeometry(0.1, 0.1, 2.0), M.esc); gc.position.set(0, 0.7, 6.2); gc.rotation.x = 0.35; g.add(gc); /* gancho de parada */
  g.scale.setScalar(1.12); return fim(g, M, ms, 5.4, 1.3, 3.2, 2.9, 6.6); }
/** Vigia: bimotor turboélice de alerta aéreo antecipado — asa alta reta, radome giratório sobre a fuselagem, empenagem com 4 derivas. */
function modeloVigia(M, ms) { const g = new THREE.Group();
  const f = ms(new THREE.CapsuleGeometry(1.05, 12.5, 6, 12).rotateX(Math.PI / 2), M.c); f.position.set(0, 1.8, 0); g.add(f); const tc = ms(new THREE.CylinderGeometry(1.0, 0.35, 3.5, 10).rotateX(Math.PI / 2), M.c); tc.position.set(0, 2.0, 8.3); g.add(tc);
  const cp = ms(new THREE.BoxGeometry(1.5, 0.6, 1.6), M.vid); cp.position.set(0, 2.6, -6.2); cp.rotation.x = 0.35; g.add(cp);
  const w = ms(chapa(espelha([[0, -1.7], [1.2, -1.7], [12.3, -0.7], [12.3, 0.6], [1.2, 1.3], [0, 1.3]]), 0.32), M.c); w.position.y = 3.15; g.add(w);
  for (const sx of [-1, 1]) { const nc = ms(new THREE.CylinderGeometry(0.8, 0.65, 6.2, 10).rotateX(Math.PI / 2), M.c); nc.position.set(sx * 4.3, 2.6, -0.6); g.add(nc);
    const sp = ms(new THREE.ConeGeometry(0.42, 1.0, 10).rotateX(-Math.PI / 2), M.claro); sp.position.set(sx * 4.3, 2.6, -4.1); g.add(sp); const dh = new THREE.Mesh(new THREE.CircleGeometry(2.05, 24), M.disco); dh.position.set(sx * 4.3, 2.6, -3.8); g.add(dh); /* hélice girando (disco borrado) */ }
  const rd = ms(new THREE.CylinderGeometry(3.65, 3.65, 0.75, 28), M.claro); rd.position.set(0, 5.15, 1.2); g.add(rd); const rb = ms(new THREE.CylinderGeometry(3.68, 3.68, 0.22, 28), M.esc); rb.position.set(0, 5.15, 1.2); g.add(rb);
  for (const z of [0.2, 2.2]) { const py = ms(new THREE.BoxGeometry(0.4, 1.6, 0.9), M.c); py.position.set(0, 4.0, z); g.add(py); }
  const hs = ms(chapa(espelha([[0, 7.6], [4.3, 7.6], [4.3, 9.0], [0, 9.0]]), 0.2), M.c); hs.position.y = 2.8; g.add(hs);
  for (const x of [-4.2, -1.4, 1.4, 4.2]) { const dv = ms(deriva([[-1.2, 7.4], [-1.2, 9.0], [1.6, 9.2], [1.6, 8.0]]), M.c2); dv.position.set(x, 2.7, 0); g.add(dv); }
  return fim(g, M, ms, 12.2, 3.0, 0, 3.6, 9.0); }
export function modeloAereo1225(tipo, M, ms) { return tipo === 'raio' ? modeloRaio(M, ms) : tipo === 'vigia' ? modeloVigia(M, ms) : null; }
/** Silhuetas laterais (HUD/hangar) no mesmo formato de ui/silhuetas.js (viewBox 64×26). Mesclar: Object.assign(SILH, SILH_1225). */
const S = (corpo) => `<svg class="silh" viewBox="0 0 64 26" aria-hidden="true"><g fill="currentColor" stroke="currentColor" stroke-linejoin="round">${corpo}</g></svg>`;
export const SILH_1225 = {
  // Raio: perfil baixo e facetado, nariz em cunha, derivas em V inclinadas, sem armas externas
  raio: S(`<path d="M3 14l12-3.5h22l9-4.5h5l-1.5 7.5 8 .8v2l-8 1.2H15z"/><path d="M24 14.5h14l-6 5h-4z" stroke-width=".4"/><path d="M15 10.8q4-3 9-2.6l2 2.4z"/><path d="M47 7l6-3" fill="none" stroke-width="1"/>`),
  // Vigia: asa alta, radome em disco sobre a fuselagem, hélices, empenagem com várias derivas
  vigia: S(`<ellipse cx="34" cy="5" rx="12" ry="1.8"/><path d="M33 7v3M37 7v3" fill="none" stroke-width="1.2"/><path d="M4 15q1-4 7-4h38l6-4h3l-1 7 3 1v2H9q-5 0-5-2z"/><rect x="20" y="10" width="20" height="1.6"/><path d="M22 9v5M22 9v-1" fill="none" stroke-width="1"/><ellipse cx="22" cy="12.5" rx=".8" ry="3.6"/><path d="M52 9v-4M56 9v-3" fill="none" stroke-width="1.1"/>`),
};
