// 3.8.8: texturas e geometrias PROCEDURAIS para os jogos 3D (nada baixado, nada com copyright).
// Pintura naval cinza com sujeira/ferrugem leves, normal map de chapas soldadas, rugosidade, números de casco,
// heliponto, camuflagem de tanque. Tudo gerado em <canvas> no aparelho.
let R = 1; const rnd = () => ((R = (R * 16807) % 2147483647) / 2147483647);
export const semente = (s) => { R = Math.max(1, Math.floor(s) % 2147483646); };
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
/** v1.2.17 item 3: ALTA RESOLUÇÃO — desenha nas mesmas coordenadas lógicas numa tela k× maior (traços, letras e marcas nítidas no estaleiro/menu e no binóculo). */
function cvK(w, h, k) { const c = document.createElement('canvas'); c.width = w * k; c.height = h * k; const x = c.getContext('2d'); x.scale(k, k); return [c, x]; }
/** Grão fino na resolução nativa (micro-variação de pintura/desgaste) — determinístico. */
export function grao(c, amt = 6, s = 5) { const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); const img = x.getImageData(0, 0, c.width, c.height), d = img.data; let q = s * 2654435761 >>> 0; for (let i = 0; i < d.length; i += 4) { q = (q * 1664525 + 1013904223) >>> 0; const v = ((q >>> 24) / 255 - 0.5) * amt; d[i] += v; d[i + 1] += v; d[i + 2] += v; } x.putImageData(img, 0, 0); }
const hiRes = (t) => { t.anisotropy = 8; return t; };
// ruído de valor 2D (para manchas)
function ruido(w, h, oit = 4, s = 1) { semente(s * 7919 + 13); const out = new Float32Array(w * h); let amp = 1, tot = 0;
  for (let o = 0; o < oit; o++) { const g = 4 << o, G = new Float32Array((g + 1) * (g + 1)); for (let i = 0; i < G.length; i++) G[i] = rnd();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const fx = x / w * g, fy = y / h * g, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy; const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = G[iy * (g + 1) + ix], b = G[iy * (g + 1) + ix + 1], c = G[(iy + 1) * (g + 1) + ix], d = G[(iy + 1) * (g + 1) + ix + 1]; out[y * w + x] += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy); }
    tot += amp; amp *= 0.5; }
  for (let i = 0; i < out.length; i++) out[i] /= tot; return out; }
/** Pintura naval: cinza com escorridos de sujeira e ferrugem nos embornais. */
export function texPintura(THREE, { base = '#7c8792', sujeira = 0.5, ferrugem = 0.35, w = 1024, h = 512, s = 1 } = {}) { /* v1.2.15: 2× resolução (casco/camuflagem nítidos no binóculo) */
  const [c, x] = cv(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h); const N = ruido(w >> 1, h >> 1, 4, s); const img = x.getImageData(0, 0, w, h);
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const n = N[(y >> 1) * (w >> 1) + (i >> 1)]; const k = (y * w + i) * 4; const f = 1 + (n - 0.5) * 0.18 * (1 + sujeira); img.data[k] *= f; img.data[k + 1] *= f; img.data[k + 2] *= f * 1.01; }
  x.putImageData(img, 0, 0); semente(s * 31 + 5);
  // escorridos verticais (sujeira) e ferrugem leve partindo de pontos (embornais, escovéns)
  for (let i = 0; i < 70 * sujeira; i++) { const px = rnd() * w, py = rnd() * h * 0.6, L = 20 + rnd() * 90; const g = x.createLinearGradient(px, py, px, py + L); g.addColorStop(0, 'rgba(40,38,34,.22)'); g.addColorStop(1, 'rgba(40,38,34,0)'); x.fillStyle = g; x.fillRect(px, py, 1 + rnd() * 3, L); }
  for (let i = 0; i < 26 * ferrugem; i++) { const px = rnd() * w, py = rnd() * h * 0.5, L = 12 + rnd() * 50; const g = x.createLinearGradient(px, py, px, py + L); g.addColorStop(0, 'rgba(126,64,28,.52)'); g.addColorStop(1, 'rgba(122,62,28,0)'); x.fillStyle = g; x.fillRect(px, py, 1 + rnd() * 2, L); x.fillStyle = 'rgba(110,55,25,.5)'; x.fillRect(px - 1, py - 1, 3, 3); }
  /* v1.2.5: chapas do costado (juntas soldadas com sombra/realce), cordões de solda, pontos de ferrugem leve e marcas de água horizontais */
  { const cw = w / 4, ch = h / 3; x.lineWidth = 1.2; for (let gy = 0; gy <= 3; gy++) { const yy = Math.round(gy * ch) + 0.5; x.strokeStyle = 'rgba(20,22,26,.32)'; x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.10)'; x.beginPath(); x.moveTo(0, yy + 1.5); x.lineTo(w, yy + 1.5); x.stroke(); }
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx <= 4; gx++) { const xx = Math.round(gx * cw + (gy % 2) * cw * 0.5) % w + 0.5; x.strokeStyle = 'rgba(20,22,26,.28)'; x.beginPath(); x.moveTo(xx, gy * ch); x.lineTo(xx, (gy + 1) * ch); x.stroke(); }
    for (let i = 0; i < 160 * ferrugem; i++) { const px = rnd() * w, py = rnd() * h, r = 0.6 + rnd() * 2.2; x.fillStyle = `rgba(${110 + rnd() * 30 | 0},${52 + rnd() * 20 | 0},24,${0.18 + rnd() * 0.25})`; x.beginPath(); x.arc(px, py, r, 0, 6.3); x.fill(); }
    for (let i = 0; i < 10; i++) { const py = rnd() * h; x.fillStyle = `rgba(230,236,240,${0.03 + rnd() * 0.04})`; x.fillRect(0, py, w, 1 + rnd() * 2); x.fillStyle = 'rgba(30,36,40,.05)'; x.fillRect(0, py + 3, w, 1); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8) /* v1.2.15: anisotropia máx. suportada */; return t; }
/** Normal map de chapas soldadas (costuras horizontais/verticais + leve ondulação entre cavernas). */
export function texChapas(THREE, { w = 512, h = 512, /* v1.2.15: alta resolução */ cx = 4, cy = 3, s = 2 } = {}) {
  const [c, x] = cv(w, h); const H = new Float32Array(w * h); const N = ruido(w >> 1, h >> 1, 3, s);
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const u = (i / w) * cx, v = (y / h) * cy; const du = Math.abs(u - Math.round(u)) * w / cx, dv = Math.abs(v - Math.round(v)) * h / cy; let e = 0; if (du < 1.5) e -= 1; if (dv < 1.5) e -= 1;
    const amass = Math.sin((u % 1) * Math.PI) * 0.35; H[y * w + i] = e * 0.6 + amass + (N[(y >> 1) * (w >> 1) + (i >> 1)] - 0.5) * 0.25; }
  const img = x.createImageData(w, h); for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { const a = H[y * w + ((i + 1) % w)] - H[y * w + ((i - 1 + w) % w)], b = H[((y + 1) % h) * w + i] - H[((y - 1 + h) % h) * w + i]; const nx = -a * 1.6, ny = -b * 1.6, nz = 1, L = Math.hypot(nx, ny, nz); const k = (y * w + i) * 4; img.data[k] = (nx / L * 0.5 + 0.5) * 255; img.data[k + 1] = (ny / L * 0.5 + 0.5) * 255; img.data[k + 2] = (nz / L * 0.5 + 0.5) * 255; img.data[k + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
/** Rugosidade com variação (tinta gasta). */
export function texRugo(THREE, { w = 512, h = 512, /* v1.2.15 */ base = 0.62, s = 3 } = {}) { const [c, x] = cv(w, h); const N = ruido(w, h, 4, s); const img = x.createImageData(w, h); for (let i = 0; i < w * h; i++) { const v = Math.max(0, Math.min(1, base + (N[i] - 0.5) * 0.35)) * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; } x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
/** Número de casco (pintado, com sombra), fundo transparente. */
export function texNumero(THREE, txt, cor = '#f1f5f9') { const [c, x] = cvK(256, 128, 2); x.font = '900 104px "Arial Narrow",system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(0,0,0,.35)'; x.fillText(txt, 131, 68); x.fillStyle = cor; x.fillText(txt, 128, 64); x.strokeStyle = 'rgba(15,23,42,.55)'; x.lineWidth = 3; x.strokeText(txt, 128, 64); const t = hiRes(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t; }
/** Convés de voo: antiderrapante escuro, círculo de toque e linhas. */
export function texHeliponto(THREE) { const [c, x] = cvK(256, 256, 2); x.fillStyle = '#3b4148'; x.fillRect(0, 0, 256, 256); semente(77); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},.05)`; x.fillRect(rnd() * 256, rnd() * 256, 2, 2); }
  x.strokeStyle = '#f8fafc'; x.lineWidth = 6; x.strokeRect(10, 10, 236, 236); x.strokeStyle = '#facc15'; x.lineWidth = 7; x.beginPath(); x.arc(128, 128, 78, 0, 6.3); x.stroke(); x.strokeStyle = '#f8fafc'; x.lineWidth = 4; x.beginPath(); x.moveTo(128, 0); x.lineTo(128, 256); x.stroke(); x.fillStyle = '#f8fafc'; x.font = '900 70px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', 128, 132); grao(c, 7, 11);
  const t = hiRes(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t; }
/** Camuflagem para tanques (verde/terra em manchas). */
export function texCamuflagem(THREE, { cores = ['#4b5a32', '#6b6a3f', '#3a3f28', '#7a6a4a'], s = 9 } = {}) { const w = 256; const [c, x] = cv(w, w); const N = ruido(w, w, 3, s), M = ruido(w, w, 3, s + 11); const img = x.createImageData(w, w);
  const rgb = cores.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let i = 0; i < w * w; i++) { const k = N[i] > 0.56 ? 1 : M[i] > 0.58 ? 2 : N[i] < 0.38 ? 3 : 0; const f = 0.92 + (N[(i * 7) % (w * w)] - 0.5) * 0.15; img.data[i * 4] = rgb[k][0] * f; img.data[i * 4 + 1] = rgb[k][1] * f; img.data[i * 4 + 2] = rgb[k][2] * f; img.data[i * 4 + 3] = 255; }
  x.putImageData(img, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; }
/** Prisma facetado (seção poligonal que afina no topo): superestrutura furtiva com paredes inclinadas. */
export function prisma(THREE, pts, h, enc = 0.85, encZ = enc) { // pts: [[x,z],...] base (anti-horário visto de cima)
  let ar = 0; for (let i = 0; i < pts.length; i++) { const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length]; ar += x1 * z2 - x2 * z1; } if (ar < 0) pts = pts.slice().reverse();
  const n = pts.length, pos = [], idx = []; const cx = pts.reduce((s, p) => s + p[0], 0) / n, cz = pts.reduce((s, p) => s + p[1], 0) / n;
  pts.forEach(([x, z]) => pos.push(x, 0, z)); pts.forEach(([x, z]) => pos.push(cx + (x - cx) * enc, h, cz + (z - cz) * encZ));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, n + j, j, i, n + i, n + j); }
  for (let i = 1; i < n - 1; i++) idx.push(n, n + i + 1, n + i); // tampa (leque)
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); const g2 = g.toNonIndexed(); g2.computeVertexNormals();
  // UV planar simples
  const p = g2.attributes.position, uv = []; for (let i = 0; i < p.count; i++) uv.push((p.getX(i) + p.getZ(i)) * 0.08, p.getY(i) * 0.08); g2.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g2; }
/** Janelas da ponte: vidros escuros com reflexo de céu e caixilhos. */
export function texJanelas(THREE, n = 8) { const [c, x] = cv(512, 64); x.fillStyle = '#9aa3ab'; x.fillRect(0, 0, 512, 64); const w = 512 / n;
  for (let i = 0; i < n; i++) { const g = x.createLinearGradient(0, 6, 0, 58); g.addColorStop(0, '#5d7489'); g.addColorStop(0.45, '#13202c'); g.addColorStop(1, '#0a1118'); x.fillStyle = g; x.fillRect(i * w + 4, 6, w - 8, 52); x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.moveTo(i * w + 8, 8); x.lineTo(i * w + w * 0.45, 8); x.lineTo(i * w + 10, 40); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8) /* v1.2.15: anisotropia máx. suportada */; return t; }
/** Porta estanque com dobradiças e volante, ou grade de ventilação. */
export function texPorta(THREE, grade = false) { const [c, x] = cvK(64, 128, 4); x.fillStyle = '#808a93'; x.fillRect(0, 0, 64, 128); x.strokeStyle = '#2b3036'; x.lineWidth = 3;
  if (grade) { x.fillStyle = '#2b3036'; for (let y = 8; y < 120; y += 9) x.fillRect(6, y, 52, 4); x.strokeRect(4, 4, 56, 120); }
  else { x.beginPath(); x.roundRect ? x.roundRect(8, 6, 48, 116, 14) : x.rect(8, 6, 48, 116); x.stroke(); x.fillStyle = '#2b3036'; x.fillRect(4, 26, 6, 12); x.fillRect(4, 90, 6, 12); x.beginPath(); x.arc(42, 64, 6, 0, 6.3); x.stroke(); } grao(c, 5, 3);
  const t = hiRes(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t; }
/** Porta de hangar em lamelas. */
export function texHangar(THREE) { const [c, x] = cvK(128, 128, 4); x.fillStyle = '#7d878f'; x.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 8) { x.fillStyle = '#5f676e'; x.fillRect(0, y, 128, 2); x.fillStyle = '#939ca4'; x.fillRect(0, y + 2, 128, 1); } x.strokeStyle = '#2b3036'; x.lineWidth = 4; x.strokeRect(2, 2, 124, 124); grao(c, 6, 4); const t = hiRes(new THREE.CanvasTexture(c)); t.colorSpace = THREE.SRGBColorSpace; return t; }
