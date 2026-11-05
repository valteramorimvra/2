// v1.2.98 — rastro de condensação nas pontas das asas. Geometria única, pré-alocada.
// Nenhum new/push no quadro: os vértices só são deslocados.
import * as THREE from 'three';

const N = 12, S = 14, VP = (S + 1) * 2;

export class Vortices {
  constructor(cena) {
    this.ids = new Int32Array(N);
    this.uso = new Uint8Array(N);
    this.cx = new Float32Array(N * (S + 1));
    this.cy = new Float32Array(N * (S + 1));
    this.cz = new Float32Array(N * (S + 1));
    this.pos = new Float32Array(N * VP * 3);
    this.cor = new Float32Array(N * VP * 4);
    const idx = new Uint16Array(N * S * 6);
    let p = 0;
    for (let r = 0; r < N; r++) {
      const base = r * VP;
      for (let i = 0; i < S; i++) {
        const a = base + i * 2, c = a + 2;
        idx[p++] = a; idx[p++] = c; idx[p++] = a + 1;
        idx[p++] = a + 1; idx[p++] = c; idx[p++] = c + 1;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('cor', new THREE.BufferAttribute(this.cor, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: 'attribute vec4 cor; varying vec4 vC; void main(){ vC = cor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec4 vC; void main(){ gl_FragColor = vC; }',
    });
    this.geo = geo; this.sujo = 0;
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 2; this.mesh.name = 'vorticeAsa';
    cena.add(this.mesh);
  }
  inicio() { this.uso.fill(0); }
  ponta(x, y, z, id) {
    let s = -1, livre = -1;
    for (let i = 0; i < N; i++) { if (this.ids[i] === id) { s = i; break; } if (livre < 0 && this.ids[i] === 0) livre = i; }
    if (s < 0) s = livre; if (s < 0) return;
    const b = s * (S + 1);
    if (this.ids[s] !== id) {
      this.ids[s] = id;
      for (let i = 0; i <= S; i++) { this.cx[b + i] = x; this.cy[b + i] = y; this.cz[b + i] = z; }
    } else {
      for (let i = S; i > 0; i--) { this.cx[b + i] = this.cx[b + i - 1]; this.cy[b + i] = this.cy[b + i - 1]; this.cz[b + i] = this.cz[b + i - 1]; }
      this.cx[b] = x; this.cy[b] = y; this.cz[b] = z;
    }
    this.uso[s] = 1;
    const vb = s * VP;
    for (let i = 0; i <= S; i++) {
      const j = i < S ? i + 1 : i - 1;
      let dx = this.cx[b + i] - this.cx[b + j], dz = this.cz[b + i] - this.cz[b + j];
      const len = Math.hypot(dx, dz) || 1; dx /= len; dz /= len;
      const w = 0.28 + (i / S) * 2.6, px = -dz * w, pz = dx * w, a = Math.pow(1 - i / S, 2) * 0.18;
      const o = (vb + i * 2) * 3, c0 = (vb + i * 2) * 4;
      const y0 = this.cy[b + i], x0 = this.cx[b + i], z0 = this.cz[b + i];
      this.pos[o] = x0 + px; this.pos[o + 1] = y0; this.pos[o + 2] = z0 + pz;
      this.pos[o + 3] = x0 - px; this.pos[o + 4] = y0; this.pos[o + 5] = z0 - pz;
      this.cor[c0] = this.cor[c0 + 1] = this.cor[c0 + 2] = 0.82;
      this.cor[c0 + 3] = a;
      this.cor[c0 + 4] = this.cor[c0 + 5] = this.cor[c0 + 6] = 0.78;
      this.cor[c0 + 7] = a * 0.85;
    }
    this.sujo = 1;
  }
  fecha() {
    for (let s = 0; s < N; s++) {
      if (this.uso[s] || !this.ids[s]) continue;
      this.ids[s] = 0;
      const c0 = s * VP * 4;
      for (let v = 0; v < VP; v++) this.cor[c0 + v * 4 + 3] = 0;
      this.sujo = 1;
    }
    if (!this.sujo) return;
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.cor.needsUpdate = true;
    this.sujo = 0;
  }
}
