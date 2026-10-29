// v1.2.25 item 10 — RUÍNAS DE CIDADE SUBMERSA no horizonte (arena 'ruinas'): prédios de concreto partidos, torres altas com
// recuos e mastro de antena, tocos de pilares; manchas de maré/algas na linha d'água, fachadas com janelas (vidro escuro e vãos
// quebrados) e topos irregulares. TUDO numa malha só (1 chamada de desenho, 1 material, textura gerada 1× — sem assets externos).
// Ficam fora da área navegável (sempre além de ±0,47 × lado), em 4 bairros num arco NO–N–NE: silhuetas na neblina do entardecer, sem colisão.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ruinasDe } from '../sim/mapasNovos.js';

let _TX = null;
/** Fachada 512² = 8 pavimentos × 8 vãos (3,6 m × 4 m por janela → ladrilho de 32 × 28,8 m): concreto manchado, janelas escuras com reflexo frio, vãos quebrados (pretos), escorrimentos. */
function texFachada() { if (_TX) return _TX; const N = 512, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'); let sd = 41; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  c.fillStyle = '#8d8a84'; c.fillRect(0, 0, N, N); for (let i = 0; i < 2600; i++) { const g = 110 + r() * 60 | 0; c.fillStyle = `rgba(${g},${g - 3},${g - 8},${0.08 + r() * 0.12})`; c.fillRect(r() * N, r() * N, 2 + r() * 14, 2 + r() * 10); } /* grão do concreto */
  const cw = N / 8, ch = N / 8; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const x = i * cw + cw * 0.14, y = j * ch + ch * 0.2, w = cw * 0.72, h = ch * 0.58; const q = r();
    if (q < 0.18) { c.fillStyle = '#0d0e10'; c.fillRect(x, y, w, h); /* vão sem vidro */ c.fillStyle = 'rgba(40,38,36,.8)'; for (let k = 0; k < 3; k++) c.fillRect(x + r() * w, y + h - 3, 2 + r() * 6, 3); }
    else { const gr = c.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, q < 0.6 ? '#2c3a44' : '#3b4650'); gr.addColorStop(1, '#161c22'); c.fillStyle = gr; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(160,175,185,.12)'; c.fillRect(x, y, w * 0.3, h); if (q > 0.85) { c.strokeStyle = 'rgba(200,210,215,.35)'; c.beginPath(); c.moveTo(x + r() * w, y); c.lineTo(x + r() * w, y + h); c.stroke(); } /* vidro trincado */ }
    c.fillStyle = 'rgba(70,66,60,.55)'; c.fillRect(j % 2 ? i * cw : i * cw + 1, j * ch + ch * 0.86, cw, ch * 0.06); } /* laje aparente entre pavimentos */
  for (let i = 0; i < 70; i++) { const x = r() * N, y = r() * N, L = 20 + r() * 120; const g = c.createLinearGradient(x, y, x, y + L); g.addColorStop(0, 'rgba(45,40,34,.32)'); g.addColorStop(1, 'rgba(45,40,34,0)'); c.fillStyle = g; c.fillRect(x, y, 2 + r() * 5, L); } /* escorrimentos de ferrugem/fuligem */
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8); _TX = t; return t; }

/** Caixa de prédio com topo PARTIDO (vértices do anel superior rebaixados de forma irregular) e UV em metros (fachada contínua). */
function predio(w, d, h, rnd, quebra) { const sw = Math.max(2, Math.round(w / 6)), sd = Math.max(2, Math.round(d / 6)), sh = Math.max(3, Math.round(h / 7)); const g = new THREE.BoxGeometry(w, h + 22, d, sw, sh, sd); g.translate(0, (h + 22) / 2 - 22, 0); /* 22 m abaixo d'água */
  const p = g.attributes.position, uv = g.attributes.uv, nr = g.attributes.normal; const corte = new Map();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > h - 0.01 && quebra > 0) { const k = Math.round(x * 10) + ',' + Math.round(z * 10); if (!corte.has(k)) corte.set(k, rnd() < 0.35 ? rnd() * quebra : rnd() * quebra * 0.25); p.setY(i, y - corte.get(k)); }
    const ax = Math.abs(nr.getX(i)), az = Math.abs(nr.getZ(i)); const yy = p.getY(i); if (ax > 0.5) uv.setXY(i, z / 32, yy / 28.8); else if (az > 0.5) uv.setXY(i, x / 32, yy / 28.8); else uv.setXY(i, x / 32, z / 32); }
  g.computeVertexNormals(); return g.toNonIndexed(); }
/** Cor por vértice: faixa escura de maré/algas (0–7 m), umidade subindo, concreto envelhecido variando por prédio. */
function pinta(g, base, rnd) { const p = g.attributes.position, cor = new Float32Array(p.count * 3), c = new THREE.Color(), alga = new THREE.Color('#2f3a2c'), sujo = new THREE.Color('#4a4740');
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); c.copy(base); if (y < 11) c.lerp(alga, 0.88 * (1 - Math.max(0, y) / 11) + (y < 0 ? 0.3 : 0)); else if (y < 40) c.lerp(sujo, 0.48 * (1 - (y - 11) / 29)); /* v1.2.26 I: maré/algas e concreto mais gastos */ cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cor, 3)); return g; }

export function criaRuinas(T) { const L = ruinasDe(T.id); if (!L.length) return null; let sd = 977; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647); const gs = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (const [x, z, w, d, alt, inc, rumo, tipo] of L) { const base = new THREE.Color().setHSL(0.08 + rnd() * 0.04, 0.04 + rnd() * 0.05, 0.26 + rnd() * 0.12); const partes = [];
    if (tipo === 1) { /* torre alta com 3 recuos e mastro de antena (sem formas simbólicas) */ const h1 = alt * 0.55, h2 = alt * 0.3, h3 = alt * 0.15; partes.push(predio(w, d, h1, rnd, 0)); const g2 = predio(w * 0.78, d * 0.78, h2, rnd, 0); g2.translate(0, h1, 0); partes.push(g2); const g3 = predio(w * 0.55, d * 0.55, h3, rnd, h3 * 0.5); g3.translate(0, h1 + h2, 0); partes.push(g3);
      const ant = new THREE.CylinderGeometry(0.5, 1.1, alt * 0.22, 6, 1).toNonIndexed(); ant.translate(0, h1 + h2 + h3 * 0.7 + alt * 0.11, 0); ant.rotateZ(rnd() * 0.18 - 0.09); /* mastro torto */ partes.push(ant); }
    else partes.push(predio(w, d, alt, rnd, tipo === 2 ? alt * 0.6 : alt * (0.12 + rnd() * 0.3)));
    for (const g of partes) { if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); pinta(g, base, rnd);
      e.set(inc, rumo, inc * 0.4); q.setFromEuler(e); m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 1, 1)); g.applyMatrix4(m); gs.push(g); } }
  const geo = mergeGeometries(gs, false); gs.forEach((g) => g.dispose());
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texFachada(), vertexColors: true, roughness: 0.96, metalness: 0.02 }) /* v1.2.26 I: concreto fosco gasto */); mesh.name = 'ruinas'; mesh.castShadow = false; mesh.receiveShadow = false; /* longe da cascata de sombra (±170 m) */
  mesh.userData.n = L.length; return mesh; }
