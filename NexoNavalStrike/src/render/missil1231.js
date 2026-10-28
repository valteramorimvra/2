// v1.2.31 — VISUAL do míssil nuclear de navio (módulo NOVO). Lê n.nm1231.m (posição/pose já interpoláveis: px/py/pz → x/y/z) e anima a escotilha do modelo.
// Tudo sintético (cilindros + sprite de brilho + rastro de pontos) — 3 draw calls no máximo, 1 míssil por navio. Não toca nuclearFx.js.
import * as THREE from 'three';
import { abreEscotilha1231 } from './modelo1231.js';
const NT = 90; /* amostras de rastro */
function texFumaca() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export class Missil1231Fx {
  constructor(cena) { this.cena = cena; this.slots = new Map(); this._tex = texFumaca();
    this._geo = new THREE.CylinderGeometry(0.42, 0.42, 7.4, 12).rotateX(Math.PI / 2); this._geo.translate(0, 0, 0);
    this._nariz = new THREE.ConeGeometry(0.42, 2.2, 12).rotateX(-Math.PI / 2).translate(0, 0, -4.8);
    this._mat = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.4, metalness: 0.5 }); this._matN = new THREE.MeshStandardMaterial({ color: '#2b2f35', roughness: 0.5, metalness: 0.4 });
    this._matChama = new THREE.SpriteMaterial({ map: this._tex, color: '#ffb25a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }); this._matFum = new THREE.PointsMaterial({ map: this._tex, size: 22, sizeAttenuation: true, color: '#e8ecef', transparent: true, opacity: 0.55, depthWrite: false }); }
  _slot(id) { let s = this.slots.get(id); if (s) return s; const g = new THREE.Group(); const c = new THREE.Mesh(this._geo, this._mat); const nz = new THREE.Mesh(this._nariz, this._matN); c.castShadow = true; g.add(c, nz);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const al = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 1.2), this._matN); al.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 3.0); al.rotation.z = a; g.add(al); }
    const ch = new THREE.Sprite(this._matChama.clone()); ch.position.z = 5.4; ch.scale.set(5, 5, 1); g.add(ch);
    const pos = new Float32Array(NT * 3); const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(pg, this._matFum); pts.frustumCulled = false; pg.setDrawRange(0, 0);
    const lz = new THREE.PointLight('#ff9a3c', 0, 400, 2); g.add(lz); g.visible = false; this.cena.add(g, pts); s = { g, ch, pts, pos, n: 0, tAm: 0, lz }; this.slots.set(id, s); return s; }
  /** a = fração de interpolação do passo (0…1); refDe(n) → ref do modelo do navio (para a escotilha) */
  passo(dt, sim, a = 1, refDe = null) { const vistos = new Set();
    sim.navios.forEach((n) => { const k = n.nm1231; const m = k && k.m; if (!n.C || !n.C.missilNuclear) return; const ref = refDe ? refDe(n) : null;
      if (ref) abreEscotilha1231(ref, k.voando && m ? m.esc : 0); /* abre → míssil sai → fecha atrás dele */
      if (!k || !k.voando || !m) return; vistos.add(n.id); const s = this._slot(n.id); const g = s.g; g.visible = m.fase >= 1; const x = m.px + (m.x - m.px) * a, y = m.py + (m.y - m.py) * a, z = m.pz + (m.z - m.pz) * a; g.position.set(x, y, z);
      if (m.fase >= 1) { const vv = Math.hypot(m.vx, m.vy, m.vz) || 1; g.lookAt(x + m.vx / vv, y + m.vy / vv, z + m.vz / vv); g.rotateY(Math.PI); /* nariz em −z local → aponta p/ a velocidade */ g.rotation.set(g.rotation.x, g.rotation.y, g.rotation.z); }
      const d = 1 + 0.15 * Math.sin(sim.t * 40); s.ch.scale.set(5 * d, 5 * d, 1); s.lz.intensity = m.fase >= 1 ? 6e4 : 0;
      s.tAm -= dt; if (s.tAm <= 0 && m.fase >= 1) { s.tAm = 0.08; s.pos.copyWithin(3, 0, (NT - 1) * 3); s.pos[0] = x; s.pos[1] = y; s.pos[2] = z; s.n = Math.min(NT, s.n + 1); s.pts.geometry.attributes.position.needsUpdate = true; s.pts.geometry.setDrawRange(0, s.n); } });
    for (const [id, s] of this.slots) if (!vistos.has(id)) { s.g.visible = false; if (s.n) { s.n = Math.max(0, s.n - 2); s.pts.geometry.setDrawRange(0, s.n); } if (!s.n) { s.lz.intensity = 0; } } }
  dispose() { for (const s of this.slots.values()) { this.cena.remove(s.g, s.pts); s.pts.geometry.dispose(); } this.slots.clear(); this._tex.dispose(); }
}
