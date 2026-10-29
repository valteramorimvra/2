// v1.2.3 — Avarias visíveis: marcas/rombos no casco (pool fixo por navio, criado na carga → nenhum programa novo
// na partida) e focos persistentes de fogo/fumaça nos pontos atingidos.
import * as THREE from 'three';

let _geo = null, _mat = null;
function recursos() {
  if (_geo) return;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const rg = g.createRadialGradient(32, 32, 2, 32, 32, 31); rg.addColorStop(0, 'rgba(5,5,5,1)'); rg.addColorStop(0.35, 'rgba(18,14,12,0.95)'); rg.addColorStop(0.7, 'rgba(40,30,24,0.55)'); rg.addColorStop(1, 'rgba(40,30,24,0)');
  g.fillStyle = rg; g.beginPath(); for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, r = 22 + ((i * 7919) % 9); g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); } g.closePath(); g.fill();
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  _geo = new THREE.PlaneGeometry(1, 1); _geo.userData = { compartilhada: true };
  _mat = new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
}
export const N_MARCAS = 6, N_FOCOS = 4;

/** Cria o pool de marcas (escondidas) como filhas do grupo do navio. */
export function criaAvarias(r) {
  recursos(); r.marcas = []; r.marcaK = 0; r.focos = [];
  for (let i = 0; i < N_MARCAS; i++) { const m = new THREE.Mesh(_geo, _mat); m.userData.compartilhada = true; m.visible = false; m.renderOrder = 2; r.g.add(m); r.marcas.push(m); }
}

/** Registra um impacto no ponto do mundo (x, y, z): marca no costado mais próximo + foco de fogo (só míssil/torpedo/calibre grande). */
export function registraAvaria(r, n, x, y, z, forte, kd = 1) {
  if (!r.marcas) return;
  const c = Math.cos(n.rumo), s = Math.sin(n.rumo), dx = x - n.x, dz = z - n.z;
  const lx = dx * c + dz * s, lz = -dx * s + dz * c; // inverso de local()
  const L = n.C.L, B = n.C.B, F = n.C.F; const lzc = Math.max(-L * 0.44, Math.min(L * 0.44, lz)); const lado = lx >= 0 ? 1 : -1;
  const m = r.marcas[r.marcaK++ % N_MARCAS];
  const tam = (forte ? 0.11 : 0.05) * Math.max(30, Math.min(260, L)) * (0.8 + Math.random() * 0.4);
  m.position.set(lado * B * 0.5 * 1.04, Math.max(F * 0.35, Math.min(F * 0.85, (y - n.arfagem) || F * 0.6)), lzc);  // modelo e sim: +x boreste, +z popa
  m.rotation.set(0, lado * Math.PI / 2, Math.random() * Math.PI); m.scale.set(tam, tam * 0.75, 1); m.visible = true;
  if (forte) { if (r.focos.length >= N_FOCOS) r.focos.shift(); const k = Math.max(0.15, Math.min(1, kd)); r.focos.push({ lx: lado * B * 0.3, ly: F + 1, lz: lzc, t: (16 + 40 * k) + Math.random() * (6 + 14 * k), kd: k }); } /* v1.2.21 item 2: duração do foco ∝ dano/arma (≈22–70 s; antes sempre 50–70 s) */
}
/** v1.2.21 item 2: intensidade do foco (fogo + fumaça) ∝ avaria do navio, nº de focos e força do golpe que o abriu. k = fração final (apaga nos últimos 15 s). */
export function intFoco(n, r, f, k) { return Math.min(1, (1 - n.vida / n.C.vida) * 1.1 + 0.15 * r.focos.length) * (0.5 + 0.5 * k) * (0.45 + 0.55 * (f.kd == null ? 1 : f.kd));
}
