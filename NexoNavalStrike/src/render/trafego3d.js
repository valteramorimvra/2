// Nexo Naval Strike v1.2.46 — modelos 3D do TRÁFEGO CIVIL (porta-contêineres, petroleiro, graneleiro, rebocador) com pintura das
// empresas fictícias, nome no costado, contêineres corrugados (instanciados), tubulação, guindastes, casaria com janelas,
// e o estado da simulação: rumo, banda (adorno), afundamento, incêndio (fogo + fumaça preta), esteira e borrifo de proa.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const MATS = new Map(); const mat = (c, r = 0.6, m = 0.25, extra = {}) => { const k = c + r + m + JSON.stringify(Object.keys(extra)); if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, extra))); return MATS.get(k); };
const rbox = (w, h, d, r = 0.6) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.2, h / 2.2, d / 2.2));
let TEXC = null; function texCont() { if (TEXC) return TEXC; const W = 128, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < W; i += 4) { const g = x.createLinearGradient(i, 0, i + 4, 0); g.addColorStop(0, 'rgba(0,0,0,.2)'); g.addColorStop(0.5, 'rgba(255,255,255,.15)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); x.fillStyle = g; x.fillRect(i, 3, 4, H - 6); }
  x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 0, W, 3); x.fillRect(0, H - 3, W, 3); TEXC = new THREE.CanvasTexture(c); TEXC.colorSpace = THREE.SRGBColorSpace; return TEXC; }
let TEXJ = null; function texJanelas() { if (TEXJ) return TEXJ; const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#f2f4f5'; x.fillRect(0, 0, 128, 32); x.fillStyle = '#16222e'; for (let i = 0; i < 8; i++) x.fillRect(4 + i * 16, 10, 11, 12); TEXJ = new THREE.CanvasTexture(c); TEXJ.wrapS = THREE.RepeatWrapping; TEXJ.colorSpace = THREE.SRGBColorSpace; return TEXJ; }
function texNome(txt, cor = '#ffffff') { const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d'); x.fillStyle = cor; x.font = 'bold 44px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 256, 34); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

/** Casco: perfil de planta (proa afilada, popa arredondada) extrudado; parte de baixo (obras vivas) na cor de fundo, de cima na cor do armador. */
function casco(F, lb) { const L = F.L, B = F.B, g = new THREE.Group(); const sh = new THREE.Shape(); const hb = B / 2, zP = -L / 2, zR = L / 2;
  sh.moveTo(0, zP); sh.bezierCurveTo(hb * 0.55, zP + L * 0.02, hb, zP + L * 0.14, hb, zP + L * 0.24); sh.lineTo(hb, zR - L * 0.06); sh.quadraticCurveTo(hb, zR, hb * 0.6, zR); sh.lineTo(-hb * 0.6, zR); sh.quadraticCurveTo(-hb, zR, -hb, zR - L * 0.06); sh.lineTo(-hb, zP + L * 0.24); sh.bezierCurveTo(-hb, zP + L * 0.14, -hb * 0.55, zP + L * 0.02, 0, zP);
  const ext = (y0, h, m) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: 0.4, bevelSize: 0.4, bevelSegments: 2, curveSegments: 10 }); geo.rotateX(Math.PI / 2); geo.translate(0, y0 + h, 0); const o = new THREE.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  ext(-F.T, F.T + 0.8, mat(lb.fundo, 0.7, 0.2)); ext(0.8, F.F - 0.8, mat(lb.casco, 0.45, 0.35)); ext(F.F - 1.6, 0.8, mat(lb.faixa, 0.5, 0.3));
  const dk = new THREE.Mesh(new THREE.ShapeGeometry(sh, 10).rotateX(Math.PI / 2), mat('#5b6066', 0.9, 0.1, { side: THREE.DoubleSide })); dk.position.y = F.F + 0.42; dk.scale.set(0.97, 1, 0.98); g.add(dk);
  if (L > 60) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(L * 0.32, 64), 7), new THREE.MeshBasicMaterial({ map: texNome(lb.nome, lb.faixa === '#ffffff' ? '#ffffff' : lb.faixa), transparent: true, depthWrite: false })); p.position.set(s * (hb + 0.5), F.F * 0.62, L * 0.05); p.rotation.y = s * Math.PI / 2; g.add(p); }
  return g; }
function casaria(g, F, lb, z, w, nPav, hp = 2.8) { const sup = mat(lb.sup, 0.5, 0.2), jan = mat('#ffffff', 0.4, 0.2, { map: texJanelas() }); let y = F.F + 0.4;
  for (let i = 0; i < nPav; i++) { const ww = w * (1 - i * 0.02), dd = Math.max(8, F.L * 0.07 - i * 0.4); const b = new THREE.Mesh(rbox(ww, hp, dd, 0.4), sup); b.position.set(0, y + hp / 2, z); b.castShadow = true; g.add(b);
    const tj = texJanelas().clone(); tj.needsUpdate = true; tj.repeat.set(ww / 14, 1); const jf = new THREE.Mesh(new THREE.PlaneGeometry(ww * 0.9, hp * 0.5), new THREE.MeshStandardMaterial({ map: tj, roughness: 0.35, metalness: 0.2 })); jf.position.set(0, y + hp * 0.55, z - dd / 2 - 0.05); jf.rotation.y = Math.PI; g.add(jf); void jan; y += hp; }
  const asa = new THREE.Mesh(rbox(F.B * 1.02, 0.6, 3, 0.2), sup); asa.position.set(0, y - 0.4, z - 2); g.add(asa);
  const ch = new THREE.Mesh(rbox(w * 0.32, hp * 2.4, F.L * 0.035, 0.6), mat(lb.casco, 0.45, 0.35)); ch.position.set(0, y + hp * 1.0, z + F.L * 0.04); g.add(ch);
  const ct = new THREE.Mesh(rbox(w * 0.33, 0.9, F.L * 0.036, 0.3), mat('#1b1d21')); ct.position.set(0, y + hp * 2.2, z + F.L * 0.04); g.add(ct);
  const mst = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), mat('#1b1d21')); mst.position.set(0, y + 4, z - 1); g.add(mst); const rd = new THREE.Mesh(rbox(5, 0.25, 0.4, 0.1), mat('#1b1d21')); rd.position.set(0, y + 6.5, z - 1.4); rd.name = 'radarCiv'; g.add(rd);
  return y; }

export function montaCivil(c) { const F = c.F, lb = c.libre, g = new THREE.Group(); g.add(casco(F, lb)); const L = F.L, B = F.B, dk = F.F + 0.4;
  if (c.tipo === 'conteineiro') { casaria(g, F, lb, L * 0.36, B * 0.7, 7);
    const nB = Math.floor((L * 0.7) / 6.6), nR = Math.floor((B - 2) / 2.5), tc = texCont(); const im = new THREE.InstancedMesh(new THREE.BoxGeometry(2.42, 2.55, 6.0), new THREE.MeshStandardMaterial({ map: tc, roughness: 0.7, metalness: 0.3 }), nB * nR * 5); const m4 = new THREE.Matrix4(), col = new THREE.Color(); let n = 0; const CORES = ['#3c8a3a', '#e0752a', '#eceeec', '#8f989f', '#1e5aa6', '#b3261e', '#e9c033', lb.casco, '#5b3a22'];
    for (let b = 0; b < nB; b++) { const z = -L * 0.38 + b * 6.6 + 3; if (z > L * 0.3) break; const af = Math.min(1, (z + L / 2) / (L * 0.2)); const rr = Math.max(2, Math.floor(nR * (0.55 + 0.45 * af))); for (let r = 0; r < rr; r++) { const alt = 2 + ((b * 7 + r * 3 + c.id) % 4); for (let h = 0; h < alt; h++) { m4.makeTranslation((r - (rr - 1) / 2) * 2.5, dk + 1.3 + h * 2.6, z); im.setMatrixAt(n, m4); col.set(CORES[(b * 5 + r * 7 + h * 3 + c.id) % CORES.length]); im.setColorAt(n, col); n++; } } }
    im.count = n; im.castShadow = true; g.add(im); }
  else if (c.tipo === 'petroleiro') { casaria(g, F, lb, L * 0.38, B * 0.7, 6); const dkm = mat('#7a2b23', 0.85, 0.1); const d2 = new THREE.Mesh(new THREE.BoxGeometry(B * 0.92, 0.15, L * 0.72), dkm); d2.position.set(0, dk + 0.1, -L * 0.04); g.add(d2);
    const tubo = mat('#c9ccc8', 0.4, 0.6); for (const x of [-2.2, -1.1, 0, 1.1, 2.2]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, L * 0.7, 8).rotateX(Math.PI / 2), tubo); t.position.set(x, dk + 1.0, -L * 0.04); g.add(t); }
    const cw = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, L * 0.7), mat('#d7dbdf', 0.5, 0.4)); cw.position.set(0, dk + 2.4, -L * 0.04); g.add(cw);
    for (const z of [-L * 0.1, L * 0.02]) { const mf = new THREE.Mesh(new THREE.BoxGeometry(B * 0.8, 1.6, 3), tubo); mf.position.set(0, dk + 1.3, z); g.add(mf); const gu = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 9, 8), mat('#e3b02a')); gu.position.set(B * 0.3, dk + 4.5, z + 3); g.add(gu); } }
  else if (c.tipo === 'graneleiro') { casaria(g, F, lb, L * 0.37, B * 0.72, 6); const tampa = mat(lb.casco === '#2b2f35' ? '#8e1b1b' : '#2f5d8a', 0.6, 0.3);
    for (let k = 0; k < 7; k++) { const z = -L * 0.36 + k * L * 0.088; const h = new THREE.Mesh(rbox(B * 0.62, 1.8, L * 0.068, 0.3), tampa); h.position.set(0, dk + 0.9, z); g.add(h);
      if (k % 2 === 1 && k < 7) { const pe = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 9, 12), mat('#e3b02a')); pe.position.set(0, dk + 4.5, z + L * 0.044); g.add(pe); const bo = new THREE.Mesh(rbox(0.9, 0.9, 26, 0.2), mat('#e3b02a')); bo.position.set(B * 0.18, dk + 13, z + L * 0.044 - 10); bo.rotation.x = 0.55; bo.rotation.y = 0.6; g.add(bo); } } }
  else { /* rebocador (ASD tug): casaria baixa à vante, passadiço envidraçado alto, defensas de borracha, guincho de reboque à ré */ const sup = mat(lb.sup, 0.5, 0.2), bor = mat('#151515', 0.95, 0);
    const cs = new THREE.Mesh(rbox(B * 0.56, 2.2, L * 0.34, 0.35), sup); cs.position.set(0, dk + 1.1, -L * 0.12); g.add(cs);
    const ps = new THREE.Mesh(rbox(B * 0.5, 2.1, L * 0.16, 0.3), sup); ps.position.set(0, dk + 3.25, -L * 0.17); g.add(ps);
    const jf = new THREE.Mesh(new THREE.BoxGeometry(B * 0.505, 0.85, L * 0.165), mat('#16222e', 0.1, 0.8)); jf.position.set(0, dk + 3.55, -L * 0.17); g.add(jf);
    const tt = new THREE.Mesh(rbox(B * 0.54, 0.22, L * 0.18, 0.08), sup); tt.position.set(0, dk + 4.35, -L * 0.17); g.add(tt);
    for (const s of [-1, 1]) { const fe = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, L * 0.62, 10).rotateX(Math.PI / 2), bor); fe.position.set(s * (B / 2 + 0.1), F.F * 0.7, L * 0.04); g.add(fe); }
    const pr = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, B * 0.7, 12).rotateZ(Math.PI / 2), bor); pr.position.set(0, F.F * 0.8, -L * 0.47); g.add(pr); /* defensa de proa */
    for (const s of [-1, 1]) { const ch = new THREE.Mesh(rbox(0.9, 2.6, 1.2, 0.25), mat(lb.casco, 0.45, 0.35)); ch.position.set(s * 1.6, dk + 3.0, L * 0.02); g.add(ch); const tp = new THREE.Mesh(rbox(0.92, 0.35, 1.22, 0.1), mat('#1b1d21')); tp.position.set(s * 1.6, dk + 4.4, L * 0.02); g.add(tp); }
    const gu = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.2, 14).rotateZ(Math.PI / 2), mat('#2b2f35')); gu.position.set(0, dk + 0.9, L * 0.2); g.add(gu);
    const ms = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.5, 6), mat('#1b1d21')); ms.position.set(0, dk + 6.6, -L * 0.17); g.add(ms); const rd = new THREE.Mesh(rbox(2.4, 0.18, 0.3, 0.06), mat('#1b1d21')); rd.position.set(0, dk + 6.0, -L * 0.17); rd.name = 'radarCiv'; g.add(rd);
    const mo = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.7, 8), mat('#c0392b')); mo.position.set(0, dk + 4.8, -L * 0.22); g.add(mo); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.rotation.order = 'YXZ'; return g; }

export class Trafego3D {
  constructor(cena, fx) { this.cena = cena; this.fx = fx; this.mod = new Map(); this.tl = 0; }
  /** v1.2.46: CARROS nas pontes — 2 faixas em cada sentido, carros/caminhões/ônibus instanciados nas coordenadas locais da ponte. */
  carros() { this._carros = []; const vias = []; this.cena.traverse((o) => { if (o.userData && o.userData.via) vias.push(o); });
    for (const P of vias) { const V = P.userData.via, nF = 4, porF = Math.max(3, Math.floor(V.L / 55)), N = nF * porF; const geo = new RoundedBoxGeometry(1.9, 1.5, 4.4, 2, 0.35); const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 }), N); const CORES = ['#e5e7eb', '#111827', '#9ca3af', '#b91c1c', '#1d4ed8', '#f59e0b', '#065f46', '#f8fafc'];
      const cs = []; const col = new THREE.Color(); for (let i = 0; i < N; i++) { const f = i % nF, sentido = f < 2 ? 1 : -1, faixa = (f % 2 ? 1.75 : 5.25) * (sentido > 0 ? -1 : 1) * Math.min(1, V.larg / 16); const grande = (i * 7) % 11 === 0; cs.push({ s: (Math.floor(i / nF) / porF) * V.L + (i * 13) % 37, v: (grande ? 18 : 22 + ((i * 5) % 9)) * sentido, x: faixa, esc: grande ? [1.3, 1.9, 2.6] : [1, 1, 1] }); col.set(grande ? '#f4f4f2' : CORES[(i * 3) % CORES.length]); im.setColorAt(i, col); }
      im.frustumCulled = false; P.add(im); this._carros.push({ P, V, im, cs }); } }
  passoCarros(dt) { if (!this._carros) this.carros(); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    for (const C of this._carros) { const { V, im, cs } = C; for (let i = 0; i < cs.length; i++) { const c = cs[i]; c.s += c.v * dt; if (c.s > V.L) c.s -= V.L; if (c.s < 0) c.s += V.L; pv.set(c.s, V.y(c.s) + 0.75 * c.esc[1], c.x); q.setFromAxisAngle(Y, c.v > 0 ? Math.PI / 2 : -Math.PI / 2); sc.set(c.esc[0], c.esc[1], c.esc[2]); m.compose(pv, q, sc); im.setMatrixAt(i, m); } im.instanceMatrix.needsUpdate = true; } }
  passo(tr, dt, cam) { this.tl += dt; const fx = this.fx; this.passoCarros(dt);
    for (const c of tr.civis) { let m = this.mod.get(c.id); if (!m) { m = montaCivil(c); this.mod.set(c.id, m); this.cena.add(m); }
      const vis = !c.morto; m.visible = vis; if (!vis) continue; const af = c.afunda, F = c.F;
      m.position.set(c.x, Math.sin(this.tl * 0.6 + c.id) * 0.25 - af * (F.F + F.T + 4), c.z); m.rotation.set(-af * 0.08 + Math.sin(this.tl * 0.45 + c.id) * 0.004, -c.rumo, c.adorno + Math.sin(this.tl * 0.5 + c.id * 2) * 0.008);
      const rd = m.getObjectByName('radarCiv'); if (rd) rd.rotation.y = this.tl * 1.4;
      if (!fx) continue; const cp = cam && cam.position, d = cp ? Math.hypot(c.x - cp.x, c.z - cp.z) : 0; if (d > 9000) continue;
      if (c.v > 2 && !c.afundando && ((this._k = (this._k || 0) + 1) % 3 === 0)) { const s = Math.sin(c.rumo), co = Math.cos(c.rumo); const bx = c.x + s * F.L * 0.48, bz = c.z - co * F.L * 0.48; for (const l of [-1, 1]) fx.agua.emite(bx + co * l * F.B * 0.3, 0.4, bz + s * l * F.B * 0.3, co * l * 2.5 - s * c.v * 0.2, 1 + c.v * 0.25, s * l * 2.5 + co * c.v * 0.2, '#eef4f7', 0.45, 2 + F.B * 0.06, 1.0, 1.6, 9.8); }
      if (c.fogo > 0 || c.afundando) { const s = Math.sin(c.rumo), co = Math.cos(c.rumo); const off = ((c.id * 37) % 7 - 3) / 8 * F.L; const fxp = c.x + s * off, fzp = c.z - co * off, yb = F.F * (1 - af) + 1; for (const k of [-0.18, 0, 0.2]) fx.incendio(fxp + s * F.L * k, yb + 2, fzp - co * F.L * k, 1, d > 3000); if (Math.random() < 0.5) fx.fumaca.emite(fxp, yb + 6, fzp, (Math.random() - 0.5) * 2, 8 + Math.random() * 5, (Math.random() - 0.5) * 2, '#1a1a1a', 0.75, 10 + F.B * 0.4, 14, 3.5, 0, 0.4); /* coluna de fumaça preta */
        if (c.afundando && Math.random() < 0.3) fx.agua.emite(c.x + (Math.random() - 0.5) * F.B, 0.3, c.z + (Math.random() - 0.5) * F.L * 0.5, 0, 2 + Math.random() * 3, 0, '#e8eef2', 0.5, 2.5, 1.2, 1.8, 9.8); } } }
  dispose() { for (const m of this.mod.values()) this.cena.remove(m); this.mod.clear(); }
}
