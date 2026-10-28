// v1.2.25 — MINIMAPA TÁTICO 7×7 (A–G × 1–7) de cada arena, gerado do MESMO campo de alturas do jogo (criaArena), com as
// vagas de largada (azul = seu time, vermelho = inimigo) e a zona central. Uso: node tools/minimapa.mjs <raiz-do-projeto> <saida> [ids]
import fs from 'node:fs'; import zlib from 'node:zlib';
const RAIZ = process.argv[2] || '/tmp/mapaswork', SAI = process.argv[3] || '/workspace/nexo-naval-strike-mod/mapas/capturas';
const { criaArena, ORDEM_MAPAS, MAPAS } = await import(RAIZ + '/src/sim/maps.js');
const ids = process.argv[4] ? process.argv[4].split(',') : ORDEM_MAPAS; fs.mkdirSync(SAI, { recursive: true });
const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const png = (w, h, rgb) => { const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); } const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));
const F = { '1': '00100,01100,00100,00100,00100,00100,01110', '2': '01110,10001,00001,00110,01000,10000,11111', '3': '11110,00001,00001,01110,00001,00001,11110', '4': '00010,00110,01010,10010,11111,00010,00010', '5': '11111,10000,11110,00001,00001,10001,01110', '6': '00110,01000,10000,11110,10001,10001,01110', '7': '11111,00001,00010,00100,01000,01000,01000', A: '01110,10001,10001,11111,10001,10001,10001', B: '11110,10001,10001,11110,10001,10001,11110', C: '01111,10000,10000,10000,10000,10000,01111', D: '11110,10001,10001,10001,10001,10001,11110', E: '11111,10000,10000,11110,10000,10000,11111', F: '11111,10000,10000,11110,10000,10000,10000', G: '01111,10000,10000,10111,10001,10001,01111' };
for (const id of ids) { const T = criaArena(id), n = T.n, M0 = 34, W = 700, TOT = W + M0; const rgb = Buffer.alloc(TOT * TOT * 3).fill(18);
  const H = (i, j) => T.h[Math.max(0, Math.min(n - 1, j)) * n + Math.max(0, Math.min(n - 1, i))];
  const put = (x, y, c, a = 1) => { if (x < 0 || y < 0 || x >= TOT || y >= TOT) return; const o = (y * TOT + x) * 3; for (let k = 0; k < 3; k++) rgb[o + k] = rgb[o + k] * (1 - a) + c[k] * a; };
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const fi = x / W * n, fj = y / W * n, i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
    const h = (H(i, j) * (1 - u) + H(i + 1, j) * u) * (1 - v) + (H(i, j + 1) * (1 - u) + H(i + 1, j + 1) * u) * v; const dx = (H(i + 1, j) - H(i - 1, j)) / (2 * T.cel), dz = (H(i, j + 1) - H(i, j - 1)) / (2 * T.cel), dec = Math.hypot(dx, dz);
    let c; if (h < 0) { const p = Math.min(1, -h / 60); c = mix([62, 150, 168], [22, 52, 84], Math.sqrt(p)); c = mix(c, [16, 34, 58], Math.min(1, -h / 400) * 0.6); }
    else { const fr = T.def.clima === 'frio'; c = h < 4 ? [196, 182, 140] : mix(fr ? [70, 88, 66] : [74, 104, 56], [58, 82, 48], h / 300); c = mix(c, [128, 122, 112], Math.min(1, dec * 1.3) + Math.max(0, (h - 420) / 300)); if (fr && h > 300) c = mix(c, [232, 236, 240], (h - 300) / 150);
      const sh = Math.max(0.35, Math.min(1.35, 1 + (-dx * 0.7 - dz * 0.7) * 1.6)); c = c.map((q) => q * sh); }
    put(x + M0, y + M0, c.map((q) => Math.min(255, q))); }
  const cel = W / 7; for (let k = 0; k <= 7; k++) for (let t = 0; t < W; t++) { put(M0 + Math.round(k * cel), M0 + t, [235, 240, 245], 0.35); put(M0 + t, M0 + Math.round(k * cel), [235, 240, 245], 0.35); }
  const txt = (s, x0, y0, sc = 3) => { const g = F[s]; if (!g) return; g.split(',').forEach((row, r) => [...row].forEach((b, cI) => { if (b === '1') for (let a = 0; a < sc; a++) for (let b2 = 0; b2 < sc; b2++) put(x0 + cI * sc + a, y0 + r * sc + b2, [230, 236, 242]); })); };
  for (let k = 0; k < 7; k++) { txt(String(k + 1), M0 + Math.round((k + 0.5) * cel) - 7, 6); txt('ABCDEFG'[k], 8, M0 + Math.round((k + 0.5) * cel) - 10); }
  const P = (x, z) => [M0 + (x / T.tam + 0.5) * W, M0 + (z / T.tam + 0.5) * W]; const pl = T.plano;
  const disco = (wx, wz, r, c, a = 1) => { const [px, py] = P(wx, wz); for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) put(Math.round(px + x), Math.round(py + y), c, a); };
  const anel = (wx, wz, R, c) => { const [px, py] = P(wx, wz), r = R / T.tam * W; for (let a = 0; a < 720; a++) { const b = a / 720 * 6.283; put(Math.round(px + Math.cos(b) * r), Math.round(py + Math.sin(b) * r), c); put(Math.round(px + Math.cos(b) * (r + 1)), Math.round(py + Math.sin(b) * (r + 1)), c); } };
  anel(pl.centro.x, pl.centro.z, pl.centro.r, [245, 158, 11]);
  const navio = (v, cor) => { const fx = Math.sin(v.rumo), fz = -Math.cos(v.rumo); for (let t = -9; t <= 9; t++) for (let w = -2; w <= 2; w++) { if (Math.abs(w) > 2 - Math.max(0, t - 6) * 0.7) continue; const [px, py] = P(v.x + fx * t * 14 + fz * w * 14, v.z + fz * t * 14 - fx * w * 14); put(Math.round(px), Math.round(py), cor); } };
  if (pl.vagas) for (const [tm, cor] of [['azul', [34, 230, 140]], ['vermelho', [255, 70, 70]]]) for (const g in pl.vagas[tm]) for (const v of pl.vagas[tm][g]) navio(v, g === 'merc' ? cor.map((q) => q * 0.6 + 80) : cor);
  else { disco(pl.azul.x, pl.azul.z, 6, [34, 230, 140]); disco(pl.vermelho.x, pl.vermelho.z, 6, [255, 70, 70]); }
  fs.writeFileSync(`${SAI}/${id}-minimapa.png`, png(TOT, TOT, rgb)); console.log(id, MAPAS[id].nome, JSON.stringify(pl.cantos || null), JSON.stringify(pl.equilibrio || null)); }
