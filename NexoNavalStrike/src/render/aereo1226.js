// v1.2.26 — 6 aeronaves ORIGINAIS dos porta-aviões gigantes (procedurais; nenhum projeto/marca real copiado).
// Uma única descrição geométrica por tipo serve aos DOIS usos:
//   · modeloAereo1226(tipo, M, ms): modelo EM VOO (convenções de aereo3d.js: nariz em −z, grupos 'rotor'/'rotorCauda'/'disco',
//     luzes de posição BB vermelha / BE verde e estrobo em userData.estrobo; materiais = mats(camo) de aereo3d, sem programa novo).
//   · geoParque1226(tipo): geometrias FUNDIDAS por material ('c' corpo, 'esc' escuro, 'vid' vidro) para o parque INSTANCIADO
//     no convés (render/extras1226.js: 1 InstancedMesh por tipo×material → ~18 chamadas para 100+ aeronaves).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { matsAeronave1226, FURTIVO_1226 } from './realismo1226.js'; /* v1.2.26: materiais PBR das aeronaves */
function chapa(pts, e) { const sh = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z))); return new THREE.ExtrudeGeometry(sh, { depth: e, bevelEnabled: false, curveSegments: 1 }).rotateX(Math.PI / 2); }
const espelha = (m) => m.concat(m.slice().reverse().map(([x, z]) => [-x, z]));
const deriva = (pts, e = 0.14) => chapa(pts, e).rotateZ(Math.PI / 2).translate(e / 2, 0, 0);
const cilZ = (r1, r2, c, n) => new THREE.CylinderGeometry(r1, r2, c, n).rotateX(Math.PI / 2);
const trem = (q, ms, M, pts, h = 1.3) => { for (const [x, z] of pts) { const r = ms(new THREE.CylinderGeometry(0.34, 0.34, 0.28, 8).rotateZ(Math.PI / 2), M.esc); r.position.set(x, 0.34, z); q.add(r); const p = ms(new THREE.CylinderGeometry(0.09, 0.09, h, 5), M.esc); p.position.set(x, 0.34 + h / 2, z); q.add(p); } };
/** Asa dobrável: meia planta (x ≥ 0, da raiz/nariz à cauda) cortada na articulação xF. Em voo = asa inteira; no parque os painéis
 *  externos sobem quase na vertical (dobra de convés), reduzindo a envergadura ocupada. */
function corta(meio, xF, dentro) { const out = [], n = meio.length; const ok = (p) => (dentro ? p[0] <= xF : p[0] >= xF);
  for (let i = 0; i < n; i++) { const a = meio[i], b = meio[(i + 1) % n]; if (ok(a)) out.push(a); if (ok(a) !== ok(b)) { const t = (xF - a[0]) / (b[0] - a[0]); out.push([xF, a[1] + (b[1] - a[1]) * t]); } } return out; }
function asa(g, ms, mat, meio, e, y, xF, voo) { if (voo || !xF) { const w = ms(chapa(espelha(meio), e), mat); w.position.y = y; g.add(w); return; }
  const fe = [[0, Math.min(...meio.map((p) => p[1]))]].concat(corta(meio, xF, true).filter((p) => p[0] > 0)).concat([[0, Math.max(...meio.map((p) => p[1]))]]);
  const wi = ms(chapa(espelha(fe.filter((p, i, a) => i === 0 || i === a.length - 1 || p[0] > 0)), e), mat); wi.position.y = y; g.add(wi);
  const ex = corta(meio, xF, false); if (ex.length < 3) return;
  for (const sx of [-1, 1]) { const pts = ex.map(([x, z]) => [sx * (x - xF), z]); const pg = new THREE.Group(); pg.position.set(sx * xF, y + e / 2, 0); pg.rotation.z = sx * 1.75; const m = ms(chapa(sx > 0 ? pts : pts.slice().reverse(), e), mat); m.position.y = -e / 2; pg.add(m); g.add(pg); } }
/* Cada construtor recebe (M, ms, voo): voo = 1 → modelo em voo (sem trem); 0 → parque (trem baixado, asas/rotores parados). Altura do ventre ≈ 1,3 m no parque. */
const TIPOS = {
  /** Tesourão: caça furtivo sem cauda — asa em lambda com bordos serrilhados, entradas de ar dorsais, bocais achatados. 18,6 × 13,4 m */
  tesourao(M, ms, voo) { const g = new THREE.Group(), y = voo ? 0.2 : 1.3;
    asa(g, ms, M.c2, [[0, -9.3], [0.9, -7.4], [1.7, -3.6], [6.7, 2.7], [6.7, 3.6], [4.9, 4.4], [3.4, 3.3], [2.2, 5.6], [1.1, 5.0], [0, 6.0]], 0.34, y + 0.1, 4.0, voo);
    const sp = ms(chapa(espelha([[0, -8.6], [0.75, -6.8], [1.25, -2.0], [1.3, 3.2], [0.8, 5.2]]), 0.55), M.c2); sp.position.y = y + 0.55; g.add(sp);
    const cp = ms(new THREE.SphereGeometry(0.58, 10, 6).scale(1, 0.62, 3.0), M.vid); cp.position.set(0, y + 0.9, -4.6); g.add(cp);
    for (const sx of [-1, 1]) { const ea = ms(new THREE.BoxGeometry(0.9, 0.42, 2.6).translate(0, 0, 0), M.esc); ea.position.set(sx * 1.05, y + 0.7, -1.4); ea.rotation.y = sx * 0.08; g.add(ea); const bc = ms(new THREE.BoxGeometry(1.0, 0.32, 0.8), M.esc); bc.position.set(sx * 0.75, y + 0.38, 5.1); g.add(bc); }
    if (!voo) trem(g, ms, M, [[0, -6], [-1.9, 1.5], [1.9, 1.5]]); g.userData.luzes = [6.6, y + 0.2, 3.1, y + 0.9, 4.2]; return g; },
  /** Tuiuiú: caça pesado bimotor — fuselagem larga em corpo misturado, canards, asa em delta cortada, 2 derivas inclinadas. 21,5 × 14 m */
  tuiuiu(M, ms, voo) { const g = new THREE.Group(), y = voo ? 0.3 : 1.45;
    const f = ms(chapa(espelha([[0, -10.6], [0.8, -8.6], [1.4, -5.0], [2.3, -1.0], [2.3, 7.6], [1.5, 9.4], [0.5, 9.6]]), 0.9), M.c); f.position.y = y + 0.9; g.add(f);
    asa(g, ms, M.c, [[0, -1.2], [2.0, -1.2], [7.0, 4.8], [7.0, 6.4], [2.2, 6.8], [0, 6.8]], 0.22, y + 0.4, 4.4, voo);
    const cn = ms(chapa(espelha([[1.6, -6.2], [3.6, -4.6], [3.6, -4.0], [1.6, -4.2]]), 0.14), M.c); cn.position.y = y + 0.7; g.add(cn);
    const nz = ms(new THREE.ConeGeometry(0.85, 3.4, 8).scale(1, 0.75, 1).rotateX(-Math.PI / 2), M.c); nz.position.set(0, y + 0.55, -11.6); g.add(nz);
    const cp = ms(new THREE.SphereGeometry(0.62, 10, 6).scale(1, 0.72, 3.2), M.vid); cp.position.set(0, y + 1.25, -6.6); g.add(cp);
    for (const sx of [-1, 1]) { const dv = ms(deriva([[0, 5.0], [0, 8.6], [3.4, 9.6], [3.4, 7.6]]), M.c2); dv.rotation.z = -sx * 0.34; dv.position.set(sx * 1.6, y + 0.9, 0); g.add(dv);
      const bc = ms(cilZ(0.62, 0.55, 1.4, 10), M.esc); bc.position.set(sx * 0.95, y + 0.45, 10.0); g.add(bc); const ea = ms(new THREE.BoxGeometry(1.0, 0.9, 2.2), M.esc); ea.position.set(sx * 1.85, y + 0.25, -3.2); g.add(ea); }
    if (!voo) trem(g, ms, M, [[0, -7.6], [-2.2, 2.4], [2.2, 2.4]], 1.4); g.userData.luzes = [7.0, y + 0.4, 5.6, y + 1.8, 9.4]; return g; },
  /** Coruja: alerta aéreo bijato — asa alta reta, motores sob a asa, PRANCHA DORSAL de radar de painéis planos (sem radome giratório), cauda em H. 20 × 25 m */
  coruja(M, ms, voo) { const g = new THREE.Group(), y = voo ? 0.6 : 1.7;
    const f = ms(new THREE.CapsuleGeometry(1.15, 15.5, 6, 12).rotateX(Math.PI / 2), M.c); f.position.set(0, y + 0.9, 0); g.add(f);
    const cp = ms(new THREE.BoxGeometry(1.6, 0.6, 1.8), M.vid); cp.position.set(0, y + 1.65, -7.4); cp.rotation.x = 0.35; g.add(cp);
    asa(g, ms, M.c, [[0, -1.9], [1.2, -1.9], [12.5, -0.9], [12.5, 0.5], [1.2, 1.4], [0, 1.4]], 0.34, y + 2.15, 5.3, voo);
    for (const sx of [-1, 1]) { const nc = ms(cilZ(0.82, 0.7, 4.6, 10), M.c2); nc.position.set(sx * 4.4, y + 1.35, -0.8); g.add(nc); const bo = ms(cilZ(0.66, 0.66, 0.5, 10), M.esc); bo.position.set(sx * 4.4, y + 1.35, -3.1); g.add(bo); }
    const pr = ms(new THREE.BoxGeometry(1.4, 1.35, 11.5), M.claro); pr.position.set(0, y + 3.2, 0.6); g.add(pr); for (const sx of [-1, 1]) { const pn = ms(new THREE.BoxGeometry(0.08, 1.05, 10.6), M.esc); pn.position.set(sx * 0.74, y + 3.2, 0.6); g.add(pn); }
    for (const z of [-2.8, 3.8]) { const py = ms(new THREE.BoxGeometry(0.4, 0.9, 0.8), M.c); py.position.set(0, y + 2.35, z); g.add(py); }
    const hs = ms(chapa(espelha([[0, 7.4], [4.4, 7.6], [4.4, 9.0], [0, 9.0]]), 0.2), M.c); hs.position.y = y + 1.6; g.add(hs);
    for (const sx of [-1, 1]) { const dv = ms(deriva([[-0.8, 7.4], [-0.8, 9.0], [2.4, 9.3], [2.4, 8.2]]), M.c2); dv.position.set(sx * 4.4, y + 0.8, 0); g.add(dv); }
    if (!voo) trem(g, ms, M, [[0, -6.4], [-2.0, 0.6], [2.0, 0.6]], 1.5); g.userData.luzes = [12.4, y + 2.1, 0, y + 2.6, 9.0]; return g; },
  /** Beija-flor: helicóptero naval de 5 pás — cabine alongada, carenagem de motores, ROTOR DE CAUDA CARENADO (anel), sponsons com 4 mísseis leves. 19,5 m */
  beijaflor(M, ms, voo) { const g = new THREE.Group(), y = voo ? 0 : 0.6;
    const cb = ms(new THREE.CapsuleGeometry(1.35, 5.6, 6, 12).rotateX(Math.PI / 2).scale(1, 1.05, 1), M.c); cb.position.set(0, y + 1.5, -0.6); g.add(cb);
    const gl = ms(new THREE.SphereGeometry(1.2, 10, 8).scale(1, 0.75, 1.1), M.vid); gl.position.set(0, y + 1.9, -3.9); g.add(gl);
    const ca = ms(new THREE.BoxGeometry(1.7, 0.9, 3.6), M.c2); ca.position.set(0, y + 3.0, 0.2); g.add(ca);
    const tb = ms(cilZ(0.62, 0.36, 7.0, 8), M.c); tb.position.set(0, y + 2.25, 5.8); g.add(tb);
    const an = ms(new THREE.TorusGeometry(0.95, 0.24, 6, 16).rotateY(Math.PI / 2), M.c); an.position.set(0, y + 2.8, 9.6); g.add(an); const df = ms(deriva([[0, 8.8], [0, 10.4], [2.6, 10.8], [2.6, 10.0]]), M.c2); df.position.set(0, y + 2.4, 0); g.add(df);
    const hs = ms(new THREE.BoxGeometry(3.0, 0.1, 0.8), M.c); hs.position.set(0, y + 2.3, 8.0); g.add(hs);
    for (const sx of [-1, 1]) { const sp = ms(new THREE.BoxGeometry(0.8, 0.6, 2.4), M.c2); sp.position.set(sx * 1.6, y + 0.9, 0.4); g.add(sp); for (const dz of [-0.4, 0.4]) { const mi = ms(cilZ(0.13, 0.13, 2.0, 6), M.claro); mi.position.set(sx * 2.15, y + 0.75 + dz * 0.3, 0.2 + dz); g.add(mi); } }
    const hb = ms(new THREE.CylinderGeometry(0.32, 0.42, 0.7, 8), M.esc); hb.position.set(0, y + 3.75, 0); g.add(hb);
    const rot = new THREE.Group(); rot.name = 'rotor'; rot.position.set(0, y + 4.1, 0); g.add(rot); for (let i = 0; i < 5; i++) { const p = ms(new THREE.BoxGeometry(0.46, 0.06, 7.4).translate(0, 0, 3.7), M.rotor || M.esc); p.rotation.y = voo ? i * Math.PI * 2 / 5 + 0.3 : Math.PI + (i - 2) * 0.07 /* parque: pás rebatidas para a cauda */; if (!voo) p.position.y = -0.04 * i; rot.add(p); }
    const rc = new THREE.Group(); rc.name = 'rotorCauda'; rc.position.set(0, y + 2.8, 9.6); g.add(rc); for (let i = 0; i < 4; i++) { const p = ms(new THREE.BoxGeometry(0.05, 1.6, 0.18), M.rotor || M.esc); p.rotation.x = i * Math.PI / 4; rc.add(p); }
    if (voo && M.disco) { const d = new THREE.Mesh(new THREE.CircleGeometry(7.4, 28).rotateX(-Math.PI / 2), M.disco); d.name = 'disco'; d.position.y = y + 4.12; g.add(d); }
    if (!voo) for (const [x, z] of [[-1.5, -2.6], [1.5, -2.6], [0, 4.0]]) { const r = ms(new THREE.CylinderGeometry(0.3, 0.3, 0.24, 8).rotateZ(Math.PI / 2), M.esc); r.position.set(x, 0.3, z); g.add(r); }
    g.userData.luzes = [2.2, y + 1.0, 0.4, y + 3.6, 1.8]; g.userData.heli = 1; return g; },
  /** Marimbondo: drone de combate de asa voadora em "pipa dobrada", entrada de ar dorsal, sem cabine. 12,5 × 15 m */
  marimbondo(M, ms, voo) { const g = new THREE.Group(), y = voo ? 0.1 : 1.0;
    asa(g, ms, M.c2, [[0, -6.4], [1.4, -4.6], [4.6, -0.4], [7.5, 2.6], [7.0, 3.3], [4.4, 1.9], [3.0, 3.9], [1.4, 3.0], [0, 4.4]], 0.38, y + 0.1, 4.2, voo);
    const sp = ms(new THREE.SphereGeometry(1.0, 10, 6).scale(1.1, 0.42, 4.2), M.c2); sp.position.set(0, y + 0.42, -1.2); g.add(sp);
    const ea = ms(new THREE.BoxGeometry(1.2, 0.36, 1.6), M.esc); ea.position.set(0, y + 0.78, -2.8); ea.rotation.x = 0.12; g.add(ea);
    const se = ms(new THREE.SphereGeometry(0.3, 8, 6).scale(1, 0.5, 1), M.vid); se.position.set(0, y - 0.05, -4.8); g.add(se); /* janela do sensor eletro-óptico */
    if (!voo) trem(g, ms, M, [[0, -3.8], [-1.6, 0.9], [1.6, 0.9]], 0.9); g.userData.luzes = [7.3, y + 0.15, 2.8, y + 0.7, 3.4]; return g; },
  /** Urubu-rei ('bombardeiroNuclear'): bombardeiro embarcado bimotor — asa alta enflechada, motores dorsais na raiz, baia interna, cauda em V. 26 × 22 m */
  bombardeiroNuclear(M, ms, voo) { const g = new THREE.Group(), y = voo ? 0.4 : 1.55;
    const f = ms(chapa(espelha([[0, -13.0], [0.9, -11.0], [1.6, -7.0], [1.9, 0], [1.6, 9.5], [0.6, 12.4]]), 1.5), M.c); f.position.y = y + 1.5; g.add(f);
    const nz = ms(new THREE.ConeGeometry(0.95, 3.0, 8).scale(1, 0.85, 1).rotateX(-Math.PI / 2), M.c); nz.position.set(0, y + 0.8, -14.3); g.add(nz);
    const cp = ms(new THREE.BoxGeometry(1.7, 0.7, 2.8), M.vid); cp.position.set(0, y + 1.75, -9.6); cp.rotation.x = 0.22; g.add(cp);
    asa(g, ms, M.c2, [[0, -2.4], [1.6, -2.4], [11.0, 4.6], [11.0, 6.0], [1.8, 4.2], [0, 4.2]], 0.34, y + 1.6, 5.6, voo);
    for (const sx of [-1, 1]) { const nc = ms(cilZ(1.05, 0.9, 7.4, 12), M.c2); nc.position.set(sx * 1.75, y + 2.2, 3.4); g.add(nc); const bo = ms(cilZ(0.8, 0.8, 0.5, 12), M.esc); bo.position.set(sx * 1.75, y + 2.2, 7.2); g.add(bo); const ea = ms(new THREE.BoxGeometry(1.3, 1.2, 0.3), M.esc); ea.position.set(sx * 1.75, y + 2.2, -0.35); g.add(ea);
      const dv = ms(deriva([[0, 8.4], [0, 12.2], [4.0, 13.4], [4.0, 11.2]], 0.18), M.c2); dv.rotation.z = -sx * 0.62; dv.position.set(sx * 0.9, y + 1.4, 0); g.add(dv); }
    const bb = ms(new THREE.BoxGeometry(1.9, 0.08, 6.0), M.esc); bb.position.set(0, y - 0.02, -1.0); g.add(bb); /* portas da baia interna */
    if (!voo) trem(g, ms, M, [[0, -9.5], [-2.3, 1.5], [2.3, 1.5], [-2.3, 3.2], [2.3, 3.2]], 1.5); g.userData.luzes = [11.0, y + 1.6, 5.2, y + 3.2, 12.6]; return g; },
};
export const TIPOS_1226 = Object.keys(TIPOS);
/** Modelo em voo (aereo3d.modeloHeli). */
export function modeloAereo1226(tipo, M, ms) { const fn = TIPOS[tipo]; if (!fn) return null; M = matsAeronave1226(M, FURTIVO_1226[tipo] || 0); const g = fn(M, ms, 1);
  for (const nm of ['rotor', 'rotorCauda']) if (!g.getObjectByName(nm)) { const q = new THREE.Group(); q.name = nm; g.add(q); } if (!g.getObjectByName('disco')) { const d = new THREE.Group(); d.name = 'disco'; g.add(d); }
  const [xL, yL, zL, yE, zE] = g.userData.luzes; const lz = (m, x, yy, z) => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 4), m); l.position.set(x, yy, z); g.add(l); return l; };
  lz(M.luzV, -xL, yL, zL); lz(M.luzVd, xL, yL, zL); g.userData.estrobo = lz(M.estrobo, 0, yE, zE); g.rotation.order = 'YXZ'; return g; }
/** Geometrias fundidas por material do modelo de PARQUE (trem baixado, rotores parados). Cache por tipo. */
const _GEO = {};
export function geoParque1226(tipo) { if (_GEO[tipo]) return _GEO[tipo]; const K = { c: 'c', c2: 'c', claro: 'c', esc: 'esc', rotor: 'esc', vid: 'vid' }; const g = TIPOS[tipo](K, (geo, k) => { const m = new THREE.Mesh(geo); m.userData.k = k; return m; }, 0);
  g.updateMatrixWorld(true); const por = {}; g.traverse((o) => { if (!o.isMesh) return; let gg = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); gg.applyMatrix4(o.matrixWorld); for (const a of Object.keys(gg.attributes)) if (a !== 'position' && a !== 'normal' && a !== 'uv') gg.deleteAttribute(a);
    if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2)); (por[o.userData.k] = por[o.userData.k] || []).push(gg); });
  const out = {}; for (const k in por) out[k] = mergeGeometries(por[k], false); return (_GEO[tipo] = out); }
/** Silhuetas laterais (HUD/hangar), formato de ui/silhuetas.js (viewBox 64×26). Mesclar: Object.assign(SILH, SILH_1226). */
const S = (corpo) => `<svg class="silh" viewBox="0 0 64 26" aria-hidden="true"><g fill="currentColor" stroke="currentColor" stroke-linejoin="round">${corpo}</g></svg>`;
export const SILH_1226 = {
  tesourao: S(`<path d="M2 14.5l14-3h26l10-2 9 3.5-9 2.2H16z"/><path d="M14 11.6q4-2.6 9-2.2l2 2.2z"/><path d="M24 15h16l-5 4h-6z" stroke-width=".4"/>`),
  tuiuiu: S(`<path d="M2 14l10-3h30l8-6h4l-1 8 8 1v2.4l-8 .9H12z"/><path d="M15 10.8q4-3 9-2.4l2 2.6z"/><path d="M14 13.6l5-2.4h3l-3 2.4z"/><path d="M47 6l6-3M44 7l5-3" fill="none" stroke-width="1"/>`),
  coruja: S(`<rect x="22" y="3.4" width="20" height="2.6" rx=".6"/><path d="M28 6v3M37 6v3" fill="none" stroke-width="1.1"/><path d="M4 15q1-4 7-4h38l6-3h3l-1 6 3 1v2H9q-5 0-5-2z"/><rect x="21" y="10" width="20" height="1.6"/><ellipse cx="26" cy="14" rx="3.4" ry="1.4"/><path d="M53 8v-4M57 8v-3" fill="none" stroke-width="1.1"/>`),
  beijaflor: S(`<path d="M3 6h48" fill="none" stroke-width="1.2"/><rect x="25" y="6" width="3" height="2.5"/><path d="M12 16q0-6 8-7h14q5 0 6 4l18-1.4v2l-18 3.4H16q-4 0-4-1z"/><circle cx="56" cy="12.4" r="2.6" fill="none" stroke-width="1"/><path d="M17 18v2.4M33 18v2.4M14 20.4h22" fill="none" stroke-width=".9"/>`),
  marimbondo: S(`<path d="M6 14.5l12-2.6h22l14 1.4 4 1.4-4 1H18z"/><path d="M22 12l6-2.6h7l3 2.6z"/><path d="M26 16h12l-4 3h-4z" stroke-width=".4"/>`),
  bombardeiroNuclear: S(`<path d="M2 15.2l10-3.4h34l8-6h3.4l-1.8 8 6 .6v2.4l-6 .8H12z"/><path d="M30 10.2h14v-2.2q-7-1-14 0z"/><path d="M10 12.6q3-2.4 8-2.2l1.6 2z"/><path d="M22 15.6h22l-6 4.4h-10z" stroke-width=".4"/>`),
};
