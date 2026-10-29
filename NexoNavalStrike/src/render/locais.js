// v1.2.19 itens 10/10b — LUGARES REAIS das 5 arenas novas (posições por latitude/longitude, assentados no relevo real):
// bairros (skyline instanciado com janelas, encaixado prédio a prédio no terreno), pontes, faróis, forte, elevador, presídio na ilha.
// Nomes de lugares apenas (nenhuma marca). Tudo criado no carregamento; partes destrutíveis marcadas para a destruição.
import * as THREE from 'three';
import { skyline } from './cidade.js';
import { ARENAS_REAIS } from '../sim/arenasReais.js';
import { pontePensil, ponteVigas, achaTravessia } from './pontes.js';
import { farolGirante, mesclaEstatico, destrutivel, galpao, guindaste, tanque, conteineres } from './props.js';
const MT = {}; const mat = (k, f) => MT[k] || (MT[k] = f()); const M = (c, r = 0.85, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
/** Converte lat/lon em x (leste) / z (sul) da arena. */
export function xzDe(id, lat, lon) { const A = ARENAS_REAIS[id]; return [(lon - A.lon) * 111320 * Math.cos((A.lat * Math.PI) / 180), (A.lat - lat) * 110574]; }
/** Bairro: skyline (mesmo material/programa das cidades) com cada prédio assentado no chão real; prédios sobre a água ou em encosta forte são removidos. */
export function bairro(G, T, relevo, x, z, larg, prof, n, alt, rot = 0, seed = 1, hMin = 1.5) { const im = skyline(n, larg, prof, seed, alt); const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; g.add(im); g.updateMatrixWorld(true);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), w = new THREE.Vector3(); let dyBase = 0, okBase = true;
  for (let k = 0; k < im.count; k++) { im.getMatrixAt(k, m); m.decompose(p, q, s); const torre = p.y > 0.5; w.copy(p).applyMatrix4(g.matrixWorld);
    if (!torre) { const hx = s.x / 2, hz = s.z / 2; let hmin = 1e9, hmax = -1e9; for (const [a, b] of [[0, 0], [hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]]) { const h = relevo(T, w.x + a, w.z + b); hmin = Math.min(hmin, h); hmax = Math.max(hmax, h); } okBase = hmin > hMin && hmax - hmin < Math.max(10, s.y * 0.5); dyBase = hmin - 1.5; if (okBase) { p.y = dyBase; s.y += hmax - hmin + 1.5; } }
    else p.y += dyBase; if (!okBase) s.set(0.001, 0.001, 0.001); m.compose(p, q, s); im.setMatrixAt(k, m); }
  im.instanceMatrix.needsUpdate = true; G.add(g); return g; }
function travessia(relevo, T, id, lat, lon, ang, tol, busca) { const [x, z] = xzDe(id, lat, lon); return achaTravessia(relevo, T, x, z, ang, tol, busca); }
function poeObst(T, P) { (T.obst || (T.obst = [])).push(...P); }
function emTerra(relevo, T, x, z, h0 = 2) { return relevo(T, x, z) > h0; }
/** Torre simples destrutível (elevador/torre de TV/presídio): caixa com faixas de janela emissivas. */
function torreCaixa(w, d, h, cor) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mat('tc' + cor, () => M(cor, 0.8, 0.05)))); for (let y = 6; y < h - 2; y += 6) g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 1.1, d + 0.2).translate(0, y, 0), mat('tcj', () => M('#2b3440', 0.3, 0.4)))); return g; }
function forteCircular(r = 45) { const g = new THREE.Group(); const pedra = mat('ped', () => M('#9b8f7a', 0.95, 0.02)); g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.06, 12, 28).translate(0, 4, 0), pedra)); g.add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.58, 20, 22).translate(0, 8, 0), pedra));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.add(new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 3).translate(Math.cos(a) * r * 0.97, 11, Math.sin(a) * r * 0.97), pedra)); } return g; }
function portoReal(G, T, relevo, x, z, rot, seed) { const g = new THREE.Group(); g.position.set(x, Math.max(1, relevo(T, x, z)) + 0.4, z); g.rotation.y = rot;
  g.add(new THREE.Mesh(new THREE.BoxGeometry(260, 4, 70).translate(0, -1.8, 0), mat('conc2', () => M('#9ca3af', 0.95, 0.02))));
  for (let i = 0; i < 3; i++) { const gd = destrutivel(guindaste(36 + i * 2, ['#d6a21e', '#c2410c', '#1d4ed8'][i]), 'guindaste'); gd.position.set(-80 + i * 70, 0, -24); g.add(gd); }
  for (let i = 0; i < 4; i++) { const gp = destrutivel(galpao(40, 26, 12, ['#8b949c', '#7c8a6e', '#94785a', '#6b7280'][i]), 'galpao'); gp.position.set(-100 + i * 52, 0, 22); g.add(gp); }
  const ct = conteineres(120, 150, 16, seed); ct.position.set(0, 0, -2); g.add(ct); G.add(mesclaEstatico(g)); return g; }
function farolEm(G, T, relevo, id, lat, lon) { const [x, z] = xzDe(id, lat, lon); let h = relevo(T, x, z), bx = x, bz = z; if (h < 2) { for (let r = 20; r < 500 && h < 2; r += 20) for (let a = 0; a < 6.28 && h < 2; a += 0.4) { const hh = relevo(T, x + Math.cos(a) * r, z + Math.sin(a) * r); if (hh > 2) { h = hh; bx = x + Math.cos(a) * r; bz = z + Math.sin(a) * r; } } } if (h < 2) return null; const f = mesclaEstatico(farolGirante(bx, h, bz)); f.userData.destr = { tipo: 'farol' }; G.add(f); (G.userData.feixesExtra || (G.userData.feixesExtra = [])).push(f); return f; }
function pecaEm(G, T, relevo, o, id, lat, lon, tipo, ex, emAgua = false) { const [x, z] = xzDe(id, lat, lon); const h = relevo(T, x, z); if (!emAgua && h < 1) return null; o.position.set(x, emAgua ? 0 : h - 0.5, z); destrutivel(o, tipo, ex); G.add(o); return o; }
/** v1.2.19 item 11b: arenas procedurais também têm o que destruir — vilas costeiras (prédios baixos assentados no terreno) com tanques de combustível, em pontas de terra perto da zona de combate. */
function vilasGenericas(G, T, relevo) { let sd = 911; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); const ach = []; const lim = T.tam * 0.42;
  for (let k = 0; k < 4000 && ach.length < 3; k++) { const r = 900 + rnd() * lim, a = rnd() * 6.283, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) > lim || Math.abs(z) > lim) continue; const h = relevo(T, x, z); const fx = k > 1600; if (h < 3 || h > (fx ? 70 : 26)) continue;
    if (Math.abs(relevo(T, x + 40, z) - h) > (fx ? 16 : 8) || Math.abs(relevo(T, x, z + 40) - h) > (fx ? 16 : 8)) continue; let aw = -1; for (let q = 0; q < 12; q++) { const b = q * 0.5236; if (relevo(T, x + Math.cos(b) * 260, z + Math.sin(b) * 260) < -2) { aw = b; break; } } if (aw < 0) continue;
    if (ach.some(([px, pz]) => Math.hypot(px - x, pz - z) < 2400)) continue; ach.push([x, z, aw]); }
  ach.forEach(([x, z, aw], i) => { const cx = x - Math.cos(aw) * 120, cz = z - Math.sin(aw) * 120; bairro(G, T, relevo, cx, cz, 260, 200, 26, 38, -aw + Math.PI / 2, 31 + i, 2.5);
    for (let j = 0; j < 2; j++) { const tx = x - Math.cos(aw) * 30 + Math.cos(aw + 1.57) * (150 + j * 26), tz = z - Math.sin(aw) * 30 + Math.sin(aw + 1.57) * (150 + j * 26), th = relevo(T, tx, tz); if (th < 2) continue; const t = tanque(11, 13); t.position.set(tx, th - 0.4, tz); destrutivel(t, 'tanque'); G.add(t); } }); }
export function criaLocais(G, T, relevo) { const id = T.id; if (!['florianopolis', 'salvador', 'gibraltar', 'saofrancisco', 'noronha'].includes(id)) { vilasGenericas(G, T, relevo); return; }
  if (id === 'florianopolis') {
    const h = travessia(relevo, T, id, -27.5935, -48.5655, 0, 0.3, 600); if (h) { { const dx = h.b.x - h.a.x, dz = h.b.z - h.a.z, L0 = Math.hypot(dx, dz), ux = dx / L0, uz = dz / L0, ex = Math.max(150, (821 - L0) / 2); h.a = { x: h.a.x - ux * ex, z: h.a.z - uz * ex }; h.b = { x: h.b.x + ux * ex, z: h.b.z + uz * ex }; } /* v1.2.19: comprimento real ≈ 821 m — viadutos de aproximação sobre terra */ const P = pontePensil(h.a, h.b, { id: 1, vao: 339, torreH: 75, deck: 30, larg: 14, cor: '#aeb4b8', estilo: 'barras', painel: 14 }); G.add(P); poeObst(T, P.userData.pilares); }
    for (const [k, lat] of [[2, -27.5978], [3, -27.5986]]) { const v = travessia(relevo, T, id, lat, -48.567, 0, 0.12, 400); if (v && v.L < 2200) { const P = ponteVigas(v.a, v.b, { id: 10 + k, larg: 15, base: 8, alto: 30, vaoP: 46 }); G.add(P); poeObst(T, P.userData.pilares); } }
    for (const [lat, lon, lg, pr, n, al, rot, sd] of [[-27.5955, -48.5525, 900, 700, 120, 70, 0.15, 3], [-27.5855, -48.5455, 1400, 260, 110, 90, -0.6, 5], [-27.5915, -48.5855, 900, 600, 90, 45, 0, 7], [-27.6045, -48.5605, 600, 400, 50, 40, 0.3, 9], [-27.574, -48.556, 700, 300, 50, 50, -0.4, 11]]) { const [x, z] = xzDe(id, lat, lon); bairro(G, T, relevo, x, z, lg, pr, n, al, rot, sd); }
    { const tv = torreCaixa(6, 6, 60, '#c9c9c4'); pecaEm(G, T, relevo, tv, id, -27.5925, -48.5395, 'torre'); } /* torre de transmissão no morro */
  } else if (id === 'salvador') {
    for (const [lat, lon, lg, pr, n, al, rot, sd] of [[-12.9745, -38.5105, 700, 500, 90, 45, -0.3, 3], [-12.9935, -38.5245, 1100, 700, 140, 110, 0.4, 5], [-13.0045, -38.5265, 700, 300, 70, 80, 0, 7], [-12.958, -38.505, 800, 600, 80, 40, -0.6, 9]]) { const [x, z] = xzDe(id, lat, lon); bairro(G, T, relevo, x, z, lg, pr, n, al, rot, sd, 3); }
    { const el = torreCaixa(18, 12, 72, '#e9e2d0'); pecaEm(G, T, relevo, el, id, -12.9743, -38.5136, 'torre', { kHp: 1.3 }); } /* elevador art déco na escarpa */
    { const f = forteCircular(42); const [x, z] = xzDe(id, -12.9726, -38.5175); if (relevo(T, x, z) < 0) { f.position.set(x, 0, z); destrutivel(f, 'forte'); G.add(f); poeObst(T, [{ x, z, r: 46 }]); } } /* forte circular no mar */
    farolEm(G, T, relevo, id, -13.0105, -38.5326); { const [x, z] = xzDe(id, -12.9665, -38.5145); portoReal(G, T, relevo, x, z, 2.0, 4); }
  } else if (id === 'gibraltar') {
    for (const [lat, lon, lg, pr, n, al, rot, sd] of [[36.1405, -5.3525, 500, 1200, 100, 40, 1.5, 3], [36.128, -5.3505, 300, 700, 50, 30, 1.5, 5], [36.131, -5.447, 1000, 800, 110, 45, 1.4, 7], [36.162, -5.348, 800, 400, 60, 35, 0, 9]]) { const [x, z] = xzDe(id, lat, lon); bairro(G, T, relevo, x, z, lg, pr, n, al, rot, sd); }
    farolEm(G, T, relevo, id, 36.1103, -5.3456); { const [x, z] = xzDe(id, 36.1395, -5.4325); portoReal(G, T, relevo, x, z, -1.57, 6); }
    for (let i = 0; i < 6; i++) { const t = tanque(14, 16); const [x, z] = xzDe(id, 36.178 + (i % 3) * 0.0007, -5.418 + ((i / 3) | 0) * 0.0009); if (relevo(T, x, z) > 1) { t.position.set(x, relevo(T, x, z) - 0.3, z); destrutivel(t, 'tanque'); G.add(t); } } /* parque de tanques na baía */
  } else if (id === 'saofrancisco') {
    const h = travessia(relevo, T, id, 37.8199, -122.4783, Math.PI / 2, 0.25, 700); if (h) { const P = pontePensil(h.a, h.b, { id: 1, vao: 1280, torreH: 227, deck: 67, larg: 27, cor: '#c0362c', estilo: 'cabos', painel: 15 }); G.add(P); poeObst(T, P.userData.pilares); }
    for (const [lat, lon, lg, pr, n, al, rot, sd] of [[37.8025, -122.4365, 1300, 600, 130, 40, 0, 3], [37.799, -122.412, 1000, 800, 120, 70, 0, 5], [37.7925, -122.4015, 700, 700, 90, 230, 0.1, 7], [37.857, -122.4835, 700, 400, 50, 22, -0.8, 9], [37.785, -122.445, 1200, 700, 120, 35, 0, 11]]) { const [x, z] = xzDe(id, lat, lon); bairro(G, T, relevo, x, z, lg, pr, n, al, rot, sd); }
    { const pr = torreCaixa(80, 22, 18, '#d8d2c2'); pecaEm(G, T, relevo, pr, id, 37.8267, -122.4229, 'predio', { kHp: 2 }); farolEm(G, T, relevo, id, 37.8262, -122.4222); } /* presídio na ilha + farol */
    farolEm(G, T, relevo, id, 37.8107, -122.4771);
  } else if (id === 'noronha') {
    for (const [lat, lon, lg, pr, n, al, rot, sd] of [[-3.8405, -32.4105, 500, 300, 40, 9, 0.3, 3], [-3.8505, -32.4235, 400, 300, 30, 8, -0.5, 5]]) { const [x, z] = xzDe(id, lat, lon); bairro(G, T, relevo, x, z, lg, pr, n, al, rot, sd, 4); }
    { const [x, z] = xzDe(id, -3.8335, -32.4005); const g = new THREE.Group(); g.position.set(x, Math.max(0.6, relevo(T, x, z)), z); g.add(new THREE.Mesh(new THREE.BoxGeometry(120, 3, 30).translate(0, -1.2, 0), mat('conc2', () => M('#9ca3af', 0.95, 0.02)))); const gp = destrutivel(galpao(26, 16, 8, '#94785a'), 'galpao'); gp.position.set(0, 0, 10); g.add(gp); const tq = destrutivel(tanque(7, 9), 'tanque'); tq.position.set(40, 0, 10); g.add(tq); G.add(mesclaEstatico(g)); }
    farolEm(G, T, relevo, id, -3.8135, -32.3885);
  } }
