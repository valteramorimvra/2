// v1.2.0 — Cenário do arquipélago e do porto (peças procedurais originais): faróis com feixe GIRANTE, galpões,
// guindastes de pórtico, pilhas de contêineres (InstancedMesh), cais de concreto, postes de luz, dique seco.
import * as THREE from 'three';
import { orla, boia } from './cidade.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
/** v1.2.14 FLUIDEZ: funde as malhas ESTÁTICAS de um grupo por material (mesma aparência, 1 chamada de desenho por material). Ignora luzes, malhas instanciadas e grupos animados (nome). */
const PULA0 = new Set(['feixe', 'destr']);
export function mesclaEstatico(g, pular = PULA0) { g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(); const grupos = new Map(), rem = [];
  g.traverse((o) => { if (o === g || !o.isMesh || o.isInstancedMesh || o.userData.luz || !o.geometry || !o.visible || Array.isArray(o.material) || o.material.vertexColors || o.morphTargetInfluences) return; if (g.userData.estrobo === o) return; for (let p = o.parent; p && p !== g; p = p.parent) if (pular.has(p.name)) return; if (pular.has(o.name)) return;
    const ge = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); if (!ge.attributes.uv || !ge.attributes.normal) return; /* v1.2.15: mantém TODOS os atributos (uv1/uv2 de AO, tangente, cor) — a fusão só junta geometrias de mesma assinatura */ ge.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const k = o.material.uuid + (o.castShadow ? 's' : '') + (o.receiveShadow ? 'r' : '') + '|' + Object.keys(ge.attributes).sort().join(','); o.userData._kM = k; if (!grupos.has(k)) grupos.set(k, { m: o.material, cs: o.castShadow, rs: o.receiveShadow, gs: [] }); grupos.get(k).gs.push(ge); rem.push(o); });
  let n0 = rem.length, n1 = 0; const ok = new Set();
  for (const { m, cs, rs, gs } of grupos.values()) { if (gs.length < 2) continue; const mg = mergeGeometries(gs, false); if (!mg) continue; const x = new THREE.Mesh(mg, m); x.castShadow = cs; x.receiveShadow = rs; x.name = 'mesclado'; g.add(x); n1++; for (const q of gs) ok.add(q); }
  let tirou = 0; for (const o of rem) { /* só remove as que entraram numa fusão */ const k = o.userData._kM; const G = grupos.get(k); if (G && G.gs.length >= 2) { o.parent.remove(o); tirou++; } }
  g.userData.mescla = [tirou, n1]; return g; }
const M = (c, r = 0.8, m = 0.1, e) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, e ? { emissive: e, emissiveIntensity: 1.6 } : {}));
const MAT = {}; const mat = (k, f) => MAT[k] || (MAT[k] = f());
const sombra = (o) => { o.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); return o; };
/** v1.2.19 item 11: marca um grupo como DESTRUTÍVEL (fica fora da fusão do porto, mas fundido por dentro: 1 malha por material). */
export function destrutivel(o, tipo, ex = {}) { mesclaEstatico(o, new Set(['feixe'])); o.name = 'destr'; o.userData.destr = Object.assign({ tipo }, ex); return o; }
/** v1.2.19: tanque cilíndrico de combustível (teto cônico baixo, escada helicoidal sugerida por anel). */
export function tanque(r = 10, h = 12) { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20).translate(0, h / 2, 0), mat('tq', () => M('#d9dcd8', 0.6, 0.35))); g.add(c); const t = new THREE.Mesh(new THREE.ConeGeometry(r * 1.01, r * 0.22, 20).translate(0, h + r * 0.11, 0), mat('tqt', () => M('#b9bcb8', 0.6, 0.35))); g.add(t);
  for (const y of [h * 0.33, h * 0.66]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.015, r * 1.015, 0.35, 20).translate(0, y, 0), mat('tqa', () => M('#9ca09c', 0.6, 0.4))); g.add(a); } const d = new THREE.Mesh(new THREE.CylinderGeometry(r + 3, r + 3, 1.4, 20).translate(0, 0.2, 0), mat('conc', () => M('#9ca3af', 0.95, 0.02))); g.add(d); return sombra(g); }
/* v1.2.65 (Valter: "nada de lego"): texturas procedurais pequenas e reaproveitadas — chapa ondulada com escorridos, portão de enrolar,
   faixa de janelas e concreto com juntas/manchas. Geradas uma vez (canvas) e compartilhadas por todos os galpões/cais. */
const TEX = {};
function texCanvas(k, w, h, desenha, rep = true) { if (TEX[k]) return TEX[k]; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; desenha(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return (TEX[k] = t); }
let _sd = 7; const rnd0 = () => ((_sd = (_sd * 16807) % 2147483647) / 2147483647);
/** Chapa ondulada (trapezoidal) vertical: sombreamento de onda a cada 1/16 da textura + escorridos de ferrugem/sujeira. */
export const texOndulada = () => texCanvas('ondulada', 128, 128, (c, w, h) => { for (let x = 0; x < w; x++) { const f = (x % 8) / 8, v = f < 0.25 ? 236 : f < 0.5 ? 214 : f < 0.75 ? 192 : 222; c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(x, 0, 1, h); }
  for (let i = 0; i < 26; i++) { const x = rnd0() * w, l = 20 + rnd0() * 90, a = 0.05 + rnd0() * 0.12; const g = c.createLinearGradient(0, 0, 0, l); g.addColorStop(0, `rgba(70,52,38,${a})`); g.addColorStop(1, 'rgba(70,52,38,0)'); c.fillStyle = g; c.fillRect(x, 0, 1 + rnd0() * 2, l); }
  const g2 = c.createLinearGradient(0, h * 0.82, 0, h); g2.addColorStop(0, 'rgba(40,36,30,0)'); g2.addColorStop(1, 'rgba(40,36,30,.22)'); c.fillStyle = g2; c.fillRect(0, 0, w, h); });
const texPortao = () => texCanvas('portao', 64, 128, (c, w, h) => { for (let y = 0; y < h; y++) { const f = (y % 6) / 6, v = f < 0.5 ? 200 : 168; c.fillStyle = `rgb(${v},${v + 4},${v + 8})`; c.fillRect(0, y, w, 1); } c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, 3, h); c.fillRect(w - 3, 0, 3, h); c.fillStyle = '#e1b12c'; for (let x = 0; x < w; x += 12) { c.fillRect(x, h - 8, 6, 8); } c.fillStyle = '#20252b'; for (let x = 6; x < w; x += 12) c.fillRect(x, h - 8, 6, 8); });
const texJanelas = () => texCanvas('janelas', 128, 32, (c, w, h) => { c.fillStyle = '#c9ced3'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5d7486'); g.addColorStop(0.55, '#26333e'); g.addColorStop(1, '#3a4a57'); c.fillStyle = g; c.fillRect(x + 2, 3, 12, h - 6); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 3, 4, 4, h - 10); c.fillStyle = '#c9ced3'; c.fillRect(x + 7.5, 3, 1, h - 6); } });
/** Concreto de cais: grão, manchas de óleo/umidade e juntas de dilatação a cada 1/4 da textura. */
export const texConcreto = () => texCanvas('concreto', 256, 256, (c, w, h) => { c.fillStyle = '#9a9c9a'; c.fillRect(0, 0, w, h); const im = c.getImageData(0, 0, w, h), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (rnd0() - 0.5) * 26; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(im, 0, 0);
  for (let i = 0; i < 14; i++) { const x = rnd0() * w, y = rnd0() * h, r = 6 + rnd0() * 28, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(48,46,42,${0.12 + rnd0() * 0.16})`); g.addColorStop(1, 'rgba(48,46,42,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  c.fillStyle = 'rgba(30,30,30,.55)'; for (let k = 0; k < 4; k++) { c.fillRect(0, k * 64, w, 1.5); c.fillRect(k * 64, 0, 1.5, h); } });
/** Armazém portuário: paredes de chapa ondulada, cumeeira e calhas, portões de enrolar com faixa de advertência, porta de pessoal,
 *  faixa de janelas nas laterais longas e rodapé de concreto. w = largura (fachada do portão, eixo x), d = profundidade (z), h = pé-direito. */
export function galpao(w, d, h, cor = '#8b949c') { const g = new THREE.Group();
  const parede = mat('gw' + cor + w + 'x' + h + 'x' + d, () => { const t = texOndulada().clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, (w + d) / 9), 1); return new THREE.MeshStandardMaterial({ color: cor, map: t, roughness: 0.68, metalness: 0.35 }); });
  const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), parede); g.add(p);
  const rod = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 1.1, d + 0.3).translate(0, 0.55, 0), mat('rodape', () => M('#8d8f8c', 0.95, 0.02))); g.add(rod);
  const tel = new THREE.Shape(); tel.moveTo(-w / 2 - 0.6, 0); tel.lineTo(0, w * 0.16); tel.lineTo(w / 2 + 0.6, 0); tel.lineTo(-w / 2 - 0.6, 0); const tg = new THREE.ExtrudeGeometry(tel, { depth: d + 1.2, bevelEnabled: false }).translate(0, h, -d / 2 - 0.6);
  g.add(new THREE.Mesh(tg, mat('telha2', () => { const t = texOndulada().clone(); t.needsUpdate = true; t.rotation = Math.PI / 2; t.repeat.set(6, 6); return new THREE.MeshStandardMaterial({ color: '#7b8590', map: t, roughness: 0.55, metalness: 0.45 }); })));
  const cum = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, d + 1.4).translate(0, h + w * 0.16 + 0.1, 0), mat('cumeeira', () => M('#5d666f', 0.5, 0.55))); g.add(cum);
  for (const sx of [-1, 1]) { const ca = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, d + 1.4).translate(sx * (w / 2 + 0.75), h - 0.15, 0), mat('calha', () => M('#b4bac0', 0.45, 0.6))); g.add(ca);
    for (const sz of [-1, 1]) { const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, h - 0.4, 6).translate(sx * (w / 2 + 0.3), (h - 0.4) / 2, sz * (d / 2 - 0.6)), mat('calha', () => M('#b4bac0', 0.45, 0.6))); g.add(tb); }
    const jan = new THREE.Mesh(new THREE.PlaneGeometry(d * 0.86, 1.6), mat('jan' + d, () => { const t = texJanelas().clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, d / 8), 1); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.25, metalness: 0.3 }); }));
    jan.position.set(sx * (w / 2 + 0.06), h * 0.78, 0); jan.rotation.y = sx * Math.PI / 2; g.add(jan); }
  const nP = w > 30 ? 2 : 1, pw = Math.min(w * 0.36, 11), ph = Math.min(h * 0.72, 9); for (let i = 0; i < nP; i++) { const x = nP === 1 ? 0 : (i ? 1 : -1) * w * 0.24;
    const moldura = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.8, ph + 0.5, 0.3).translate(x, (ph + 0.5) / 2, d / 2 + 0.1), mat('moldura', () => M('#3a4148', 0.55, 0.5))); g.add(moldura);
    const porta = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat('portao', () => new THREE.MeshStandardMaterial({ map: texPortao(), roughness: 0.5, metalness: 0.55 }))); porta.position.set(x, ph / 2, d / 2 + 0.27); g.add(porta);
    const caixa = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.4, 0.9, 0.8).translate(x, ph + 0.75, d / 2 + 0.45), mat('moldura', () => M('#3a4148', 0.55, 0.5))); g.add(caixa); }
  const pp = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), mat('porta', () => M('#2f5d8a', 0.5, 0.4))); pp.position.set(w / 2 - 2.2, 1.1 + 0.55, d / 2 + 0.06); g.add(pp);
  const marq = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.1).translate(w / 2 - 2.2, 3.1, d / 2 + 0.6), mat('calha', () => M('#b4bac0', 0.45, 0.6))); g.add(marq);
  return sombra(g); }
/** Barra prismática entre dois pontos (perfil de aço) — base das treliças. */
const _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _qB = new THREE.Quaternion();
function barra(g, m, ax, ay, az, bx, by, bz, e = 0.45) { _va.set(ax, ay, az); _vb.set(bx, by, bz); const L = _va.distanceTo(_vb); if (L < 0.01) return; const b = new THREE.Mesh(new THREE.BoxGeometry(e, L, e), m);
  b.position.copy(_va).add(_vb).multiplyScalar(0.5); _qB.setFromUnitVectors(_up, _vb.sub(_va).normalize()); b.quaternion.copy(_qB); g.add(b); return b; }
/** Guindaste de pórtico de cais (tipo STS): 4 pernas com contraventamento em X, truques de rodas sobre trilhos, vigas de portal,
 *  lança em TRELIÇA projetada sobre a água (−z local), torre em A com estais, casa de máquinas, cabine do operador no carro,
 *  cabos de içamento e spreader suspenso, escada, luzes de obstáculo. h = altura do portal (m). */
export function guindaste(h = 34, cor = '#d6a21e') { const g = new THREE.Group(); const m = mat('gd' + cor, () => M(cor, 0.5, 0.55)), mf = mat('gdf' + cor, () => M(new THREE.Color(cor).multiplyScalar(0.72).getStyle(), 0.55, 0.5));
  const X = 9, Z = 8, hp = h - 2, alc = h * 1.15, tras = 20, hb = 2.6, xb = 2.3;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { barra(g, m, sx * X, 1.2, sz * Z, sx * X, hp, sz * Z, 1.3);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 1.8).translate(sx * X, 0.6, sz * Z), mat('truque', () => M('#2c3137', 0.6, 0.6))); g.add(tr); }
  for (const sz of [-1, 1]) { barra(g, m, -X, 1.6, sz * Z, X, 1.6, sz * Z, 1.1); barra(g, m, -X, h * 0.52, sz * Z, X, h * 0.52, sz * Z, 1.0); barra(g, m, -X, hp, sz * Z, X, hp, sz * Z, 1.4);
    barra(g, mf, -X, 2, sz * Z, X, h * 0.5, sz * Z, 0.5); barra(g, mf, X, 2, sz * Z, -X, h * 0.5, sz * Z, 0.5); barra(g, mf, -X, h * 0.54, sz * Z, X, hp - 0.6, sz * Z, 0.5); barra(g, mf, X, h * 0.54, sz * Z, -X, hp - 0.6, sz * Z, 0.5); }
  for (const sx of [-1, 1]) { barra(g, m, sx * X, h * 0.52, -Z, sx * X, h * 0.52, Z, 0.9); barra(g, m, sx * X, hp, -Z, sx * X, hp, Z, 1.2); barra(g, mf, sx * X, h * 0.54, -Z, sx * X, hp - 0.6, Z, 0.45); }
  /* lança em treliça: banzos superior/inferior nos dois lados (x = ±xb), montantes e diagonais a cada 4 m */
  const z0 = tras, z1 = -alc, yb = h, yt = h + hb; for (const sx of [-1, 1]) { barra(g, m, sx * xb, yb, z0, sx * xb, yb, z1, 0.75); barra(g, m, sx * xb, yt, z0, sx * xb, yt, z1 + 3, 0.6);
    let k = 0; for (let z = z0; z > z1 + 3; z -= 4, k++) { barra(g, mf, sx * xb, yb, z, sx * xb, yt, z, 0.32); barra(g, mf, sx * xb, yb, z, sx * xb, yt, Math.max(z1 + 3, z - 4), 0.28); } barra(g, m, sx * xb, yt, z1 + 3, sx * xb, yb, z1, 0.5); }
  for (let z = z0; z > z1; z -= 8) { barra(g, mf, -xb, yt, z, xb, yt, z, 0.28); barra(g, mf, -xb, yb, z, xb, yb, z, 0.32); }
  /* torre em A + estais da lança (tirantes) */ const ya = h + 16, za = 5; for (const sx of [-1, 1]) { barra(g, m, sx * 3.2, yt, za + 4, sx * 0.5, ya, za, 0.8); barra(g, m, sx * 3.2, yt, za - 4, sx * 0.5, ya, za, 0.8); }
  const cabT = mat('cabo', () => M('#1f2328', 0.4, 0.8)); for (const sx of [-1, 1]) { barra(g, cabT, sx * 0.4, ya, za, sx * xb, yt, z1 + 4, 0.14); barra(g, cabT, sx * 0.4, ya, za, sx * xb, yt, -alc * 0.42, 0.12); barra(g, cabT, sx * 0.4, ya, za, sx * xb, yt, z0, 0.14); }
  const casa = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.6, 9).translate(0, yt + 2.3, tras - 6), mat('casaMaq', () => M('#e7e9eb', 0.6, 0.25))); g.add(casa);
  const grade = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.2), mat('grelha', () => M('#5b6168', 0.7, 0.4))); grade.position.set(3.77, yt + 2.6, tras - 6); grade.rotation.y = Math.PI / 2; g.add(grade);
  /* carro (trolley) + cabine do operador envidraçada pendurada + cabos + spreader */ const zc = -alc * 0.62; const carro = new THREE.Mesh(new THREE.BoxGeometry(xb * 2 + 0.8, 1.4, 4.2).translate(0, yb - 0.4, zc), mat('carro', () => M('#2f353c', 0.55, 0.6))); g.add(carro);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.8).translate(1.4, yb - 2.6, zc + 2.4), mat('cab', () => M('#e5e7eb', 0.5, 0.2))); g.add(cab);
  const vid = new THREE.Mesh(new THREE.BoxGeometry(2.66, 1.3, 2.86).translate(1.4, yb - 2.3, zc + 2.4), mat('vidroCab', () => new THREE.MeshStandardMaterial({ color: '#203040', roughness: 0.08, metalness: 0.9, envMapIntensity: 1.4 }))); g.add(vid);
  const ys = h * 0.38; for (const [cx, cz] of [[-1.1, -1.4], [1.1, -1.4], [-1.1, 1.4], [1.1, 1.4]]) barra(g, cabT, cx, yb - 1.1, zc + cz, cx * 3.5, ys + 0.6, zc + cz * 0.9, 0.09);
  const spr = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.7, 2.5).translate(0, ys, zc), mat('spreader', () => M('#e0a81c', 0.55, 0.4))); g.add(spr);
  for (let i = 0; i < 9; i++) { const y = 2 + i * (hp - 4) / 9; barra(g, mat('escada', () => M('#9aa1a8', 0.5, 0.6)), X + 1.2, y, Z - 1, X + 1.2, y + (hp - 4) / 9, Z - 3.6, 0.3); }
  for (const [lx, ly, lz] of [[0, ya + 0.6, za], [xb, yt + 0.4, z1 + 3], [-xb, yt + 0.4, z1 + 3]]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat('lampVerm', () => new THREE.MeshBasicMaterial({ color: '#ff3020' }))); l.position.set(lx, ly, lz); l.userData.luz = 1; g.add(l); }
  return sombra(g); }
export function conteineres(n, larg, prof, seed = 1) { let sd = seed * 9301 + 49297; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); const geo = new THREE.BoxGeometry(12, 2.6, 2.45).translate(0, 1.3, 0);
  const im = new THREE.InstancedMesh(geo, mat('cont', () => M('#ffffff', 0.7, 0.35)), n); const mt = new THREE.Matrix4(), c = new THREE.Color(); const cores = ['#b91c1c', '#1d4ed8', '#047857', '#c2410c', '#6b7280', '#a16207', '#0e7490', '#7c2d12'];
  let k = 0; for (let i = 0; i < n * 3 && k < n; i++) { const col = Math.floor(rnd() * (larg / 12.6)), lin = Math.floor(rnd() * (prof / 2.6)), nv = Math.floor(rnd() * 4); mt.makeTranslation(col * 12.6 - larg / 2, nv * 2.62, lin * 2.6 - prof / 2); im.setMatrixAt(k, mt); im.setColorAt(k, c.set(cores[Math.floor(rnd() * cores.length)])); k++; }
  im.count = k; im.castShadow = true; im.receiveShadow = true; return im; }
export function poste(h = 14) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, h, 6).translate(0, h / 2, 0), mat('poste', () => M('#4b5563', 0.6, 0.5))));
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 6), mat('lamp', () => new THREE.MeshBasicMaterial({ color: '#ffe8b0' }))); l.position.y = h + 0.3; l.userData.luz = 1; g.add(l); return g; }
/** Farol listrado com lanterna e FEIXE girante (cone aditivo). */
export function farolGirante(x, y, z) { const g = new THREE.Group(); const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const c = cv.getContext('2d'); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#c81e1e' : '#f4f4f4'; c.fillRect(0, i * 8, 8, 8); } const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 24, 14), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 })); t.position.y = 12; t.castShadow = true; g.add(t);
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.6, 12), new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a8', emissiveIntensity: 1.5 })); lan.position.y = 25.3; g.add(lan); const tp = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2, 12), new THREE.MeshStandardMaterial({ color: '#333' })); tp.position.y = 27.6; g.add(tp);
  const casa = galpao(9, 7, 4, '#e5e7eb'); casa.position.set(7, 0, 3); g.add(casa);
  const fm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0.18 } }, vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: 'uniform float uA; varying vec2 vU; void main(){ gl_FragColor = vec4(1.0, 0.95, 0.8, uA * pow(vU.y, 2.0)); }' });
  const feixe = new THREE.Group(); feixe.position.y = 25.3; feixe.name = 'feixe'; for (const s of [1, -1]) { const cn = new THREE.Mesh(new THREE.ConeGeometry(9, 260, 14, 1, true).translate(0, -130, 0).rotateZ(s * Math.PI / 2), fm); feixe.add(cn); } g.add(feixe); g.userData.feixe = feixe; g.userData.fm = fm;
  g.position.set(x, y, z); g.name = 'farol'; return g; }
/** Pequeno porto costeiro: cais, galpões, 2 guindastes, contêineres e postes. rot = direção do mar. */
export function portoCosteiro(x, y, z, rot, seed = 1, escala = 1) { const g = new THREE.Group(); const cais = new THREE.Mesh(new THREE.BoxGeometry(150, 3, 60).translate(0, -1.2, 0), mat('conc', () => M('#9ca3af', 0.95, 0.02))); cais.receiveShadow = true; g.add(cais);
  for (let i = 0; i < 3; i++) { const gp = destrutivel(galpao(34, 22, 11, ['#8b949c', '#7c8a6e', '#94785a'][i % 3]), 'galpao'); gp.position.set(-48 + i * 40, 0, 16); g.add(gp); }
  for (let i = 0; i < 2; i++) { const gd = destrutivel(guindaste(30 + i * 4, i ? '#c2410c' : '#d6a21e'), 'guindaste'); gd.position.set(-25 + i * 52, 0, -18); g.add(gd); }
  for (let i = 0; i < 3; i++) { const tq = destrutivel(tanque(9 + (i % 2) * 3, 12), 'tanque'); tq.position.set(96 + (i % 2) * 24, 0, -6 + i * 15); g.add(tq); } /* v1.2.19 item 11: parque de tanques de combustível (explodem) */
  const ct = conteineres(60, 70, 14, seed); ct.position.set(10, 0, -3); g.add(ct); for (let i = 0; i < 5; i++) { const p = poste(); p.position.set(-66 + i * 33, 0, -27); g.add(p); }
  const cid = orla(520, 120, seed + 11, 46); cid.position.set(0, -0.4, 110); g.add(cid); // cidade costeira iluminada atrás do porto
  for (let i = 0; i < 4; i++) { const b = boia(i % 2 ? '#16a34a' : '#dc2626'); b.position.set(-90 + i * 60, -0.6, -70 - (i % 2) * 20); g.add(b); }
  g.position.set(x, y, z); g.rotation.y = rot; g.scale.setScalar(escala); g.name = 'porto'; return g; }
/** Distribui faróis girantes e portos costeiros em pontos planos da costa (longe das áreas de largada). */
export function criaProps(G, T, relevo) { const feixes = []; const pl = T.plano; let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (const ref of [pl.azul, pl.vermelho]) { let melhor = null, md = 1e9; for (let a = 0; a < 6.28; a += 0.2) for (let r = 300; r < 3000; r += 100) { const x = ref.x + Math.cos(a) * r, z = ref.z + Math.sin(a) * r, h = relevo(T, x, z); if (h > 4 && h < 60 && relevo(T, x + 120, z) < 0 && r < md) { md = r; melhor = [x, z, h]; } } if (melhor) { const f = mesclaEstatico(farolGirante(melhor[0], melhor[2], melhor[1])); f.userData.destr = { tipo: 'farol' }; /* v1.2.14: feixe girante fica separado */ G.add(f); feixes.push(f); } }
  const portos = []; for (let k = 0; k < 900 && portos.length < 3; k++) { const x = (rnd() - 0.5) * T.tam * 0.85, z = (rnd() - 0.5) * T.tam * 0.85; const h = relevo(T, x, z); if (h < 2.5 || h > 14) continue;
    let plano = true; for (const [dx, dz] of [[60, 0], [-60, 0], [0, 40], [0, -40], [45, 30], [-45, -30]]) { const hh = relevo(T, x + dx, z + dz); if (Math.abs(hh - h) > 4 || hh < 1) { plano = false; break; } } if (!plano) continue;
    let rot = null; for (let a = 0; a < 6.28; a += 0.4) if (relevo(T, x + Math.sin(a) * 110, z - Math.cos(a) * 110) < -3) { rot = a; break; } if (rot == null) continue;
    if (portos.some((p) => Math.hypot(p[0] - x, p[1] - z) < 1800) || [pl.azul, pl.vermelho].some((r) => Math.hypot(r.x - x, r.z - z) < 900)) continue;
    portos.push([x, z]); G.add(mesclaEstatico(portoCosteiro(x, h + 0.6, z, -rot + Math.PI, k))); } /* v1.2.14: porto fundido por material */
  cenario125(G, T, relevo, rnd); /* v1.2.5: rochas, recifes, boias, plataformas, mercantes ao fundo e aves */
  G.userData.feixes = feixes; return feixes; }

/** v1.2.5 — Cenário mais rico (tudo instanciado/agrupado e criado no carregamento: nenhum programa WebGL novo durante a partida).
 * Rochas na costa e recifes rasos, boias de canal, plataformas pequenas, navios mercantes ao fundo (andando devagar) e bandos de aves. */
export function cenario125(G, T, relevo, rnd) { const pl = T.plano; const longeLargada = (x, z, d) => [pl.azul, pl.vermelho].every((r) => Math.hypot(r.x - x, r.z - z) > d);
  // rochas e recifes
  { const N = 420; const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), mat('rocha', () => M('#ffffff', 0.95, 0.02)), N); const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), po = new THREE.Vector3(), c = new THREE.Color(); let k = 0;
    for (let i = 0; i < N * 40 && k < N; i++) { const x = (rnd() - 0.5) * T.tam * 0.9, z = (rnd() - 0.5) * T.tam * 0.9, h = relevo(T, x, z); if (h < -5 || h > 5) continue; const recife = h < -1;
      const s = recife ? 3 + rnd() * 6 : 2 + rnd() * 9; e.set(rnd() * 3, rnd() * 3, rnd() * 3); q.setFromEuler(e); sc.set(s * (0.8 + rnd() * 0.7), s * (recife ? 0.35 : 0.5 + rnd() * 0.6), s * (0.8 + rnd() * 0.7)); po.set(x, recife ? -0.6 : h - s * 0.2, z); mt.compose(po, q, sc); im.setMatrixAt(k, mt);
      c.setHSL(0.08 + rnd() * 0.05, 0.08 + rnd() * 0.1, recife ? 0.2 + rnd() * 0.08 : 0.28 + rnd() * 0.14); im.setColorAt(k, c); k++; }
    im.count = k; im.castShadow = true; im.receiveShadow = true; im.name = 'rochas'; G.add(im); }
  // boias de canal
  { let k = 0; for (let i = 0; i < 400 && k < 12; i++) { const x = (rnd() - 0.5) * T.tam * 0.8, z = (rnd() - 0.5) * T.tam * 0.8, h = relevo(T, x, z); if (h > -12 || h < -60 || !longeLargada(x, z, 700)) continue; const b = mesclaEstatico(boia(k % 2 ? '#16a34a' : '#dc2626')); b.position.set(x, -0.6, z); b.name = 'boia'; G.add(b); k++; } }
  // plataformas pequenas
  { let k = 0; for (let i = 0; i < 600 && k < 2; i++) { const x = (rnd() - 0.5) * T.tam * 0.75, z = (rnd() - 0.5) * T.tam * 0.75, h = relevo(T, x, z); if (h > -40 || !longeLargada(x, z, 2500) || Math.hypot(x - pl.centro.x, z - pl.centro.z) < 1500) continue; G.add(mesclaEstatico(plataforma(x, z))); (T.obst || (T.obst = [])).push({ x, z, r: 42 }); /* v1.2.17: plataforma de cenário também é SÓLIDA */ k++; /* v1.2.14 */ } }
  if (T.plataformas) for (const q of T.plataformas) G.add(mesclaEstatico(plataforma(q.x, q.z))); /* v1.2.17 item 1 (13a): plataformas escolhidas na personalizada */
  // mercantes ao fundo (perto das bordas), animados em criaAnim
  const merc = []; { let k = 0; for (let i = 0; i < 800 && k < 3; i++) { const a = rnd() * 6.28, r = T.tam * (0.38 + rnd() * 0.06), x = Math.cos(a) * r, z = Math.sin(a) * r; if (relevo(T, x, z) > -30) continue; const m = mesclaEstatico(mercante(k)); /* v1.2.14: navio de fundo fundido (move como grupo) */ m.position.set(x, 0, z); m.rotation.y = -(a + Math.PI / 2); m.userData.base = { x, z, a: a + Math.PI / 2, v: 5 + rnd() * 3 }; G.add(m); merc.push(m); k++; } }
  // aves: 3 bandos de 14 (V achatado, cor escura)
  const NA = 42; const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.3, -1.6, 0.35, -0.2, 0, 0, -0.3, 0, 0, 0.3, 0, 0, -0.3, 1.6, 0.35, -0.2], 3)); ag.computeVertexNormals();
  const aves = new THREE.InstancedMesh(ag, mat('ave', () => new THREE.MeshBasicMaterial({ color: '#2b2f33', side: THREE.DoubleSide })), NA); aves.frustumCulled = false; aves.name = 'aves';
  const bandos = []; for (let b = 0; b < 3; b++) { let x = 0, z = 0; for (let i = 0; i < 300; i++) { x = (rnd() - 0.5) * T.tam * 0.7; z = (rnd() - 0.5) * T.tam * 0.7; const h = relevo(T, x, z); if (h > 2 && h < 60) break; } bandos.push({ x, z, r: 60 + rnd() * 80, h: 35 + rnd() * 30, f: 0.12 + rnd() * 0.08 }); }
  aves.userData.bandos = bandos; aves.userData.fase = Array.from({ length: NA }, () => [rnd() * 6.28, (rnd() - 0.5) * 30, (rnd() - 0.5) * 10, 0.8 + rnd() * 0.4]); G.add(aves);
  G.userData.anim125 = { merc, aves }; }
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
/** Atualiza aves e mercantes (barato: 42 matrizes + 3 grupos por quadro). */
export function animaCenario(G, t) { const A = G && G.userData.anim125; if (!A) return;
  for (const m of A.merc) { const b = m.userData.base; const d = Math.sin(t * 0.004 * b.v) * 900; m.position.set(b.x + Math.cos(b.a) * d, Math.sin(t * 0.6 + b.x) * 0.25, b.z + Math.sin(b.a) * d); }
  const av = A.aves, B = av.userData.bandos, F = av.userData.fase; for (let i = 0; i < F.length; i++) { const bd = B[i % B.length], f = F[i]; const a = t * bd.f * f[3] + f[0]; const x = bd.x + Math.cos(a) * (bd.r + f[1]), z = bd.z + Math.sin(a) * (bd.r + f[1]), y = bd.h + f[2] + Math.sin(t * 0.7 + f[0]) * 3;
    _e.set(0, -a, Math.sin(t * 9 * f[3] + f[0]) * 0.5); _q.setFromEuler(_e); _v.set(x, y, z); const s = 1.1; _s.set(s, s * (0.6 + 0.4 * Math.abs(Math.sin(t * 9 * f[3] + f[0]))), s); _m4.compose(_v, _q, _s); av.setMatrixAt(i, _m4); } av.instanceMatrix.needsUpdate = true; }
/** Plataforma pequena: convés em pernas, módulo, guindaste e heliponto simples. */
export function plataforma(x, z) { const g = new THREE.Group(); const aco = mat('plat', () => M('#9aa1a8', 0.6, 0.5)), am = mat('platA', () => M('#d6a21e', 0.6, 0.3));
  for (const [a, b] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 30, 8).translate(0, 5, 0), aco); p.position.set(a, 0, b); g.add(p); }
  const d = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 40).translate(0, 21, 0), aco); g.add(d); const mo = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 14).translate(-6, 27.5, -6), am); g.add(mo);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(2, 24, 2).translate(12, 34, 10), aco); g.add(tr); g.position.set(x, 0, z); g.name = 'plataforma'; return sombra(g); }
/** Navio mercante genérico (casco, castelo de popa, contêineres) — sem nome, sem marca. */
export function mercante(k) { const g = new THREE.Group(); const cores = ['#7f1d1d', '#1e3a5f', '#14532d']; const casco = new THREE.Mesh(new THREE.BoxGeometry(26, 10, 160).translate(0, 2, 0), mat('mc' + k, () => M(cores[k % 3], 0.7, 0.3))); g.add(casco);
  const cast = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 20).translate(0, 15, 62), mat('mcC', () => M('#e5e7eb', 0.6, 0.2))); g.add(cast); const ch = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5).translate(0, 27, 66), mat('mcCh', () => M('#374151', 0.6, 0.3))); g.add(ch);
  const ct = conteineres(70, 120, 22, 30 + k); ct.rotation.y = Math.PI / 2; ct.position.set(0, 7, -8); g.add(ct); g.name = 'mercante'; return sombra(g); }
