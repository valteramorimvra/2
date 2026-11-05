// v1.2.15 (V) — MINIATURAS REAIS das arenas: geradas a partir do MESMO campo de alturas que o jogo usa (criaArena), com
// batimetria (azul profundo → turquesa no raso), praia, vegetação/rocha por altitude e declive, e sombreamento de relevo.
import { criaArena, ORDEM_MAPAS } from '../src/sim/maps.js'; import fs from 'node:fs'; import zlib from 'node:zlib';
const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const png = (w, h, rgb) => { const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; rgb.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));
for (const id of ORDEM_MAPAS) { const T = criaArena(id), n = T.n, S = 2, W = n * S; const rgb = Buffer.alloc(W * W * 3);
  const H = (i, j) => T.h[Math.max(0, Math.min(n - 1, j)) * n + Math.max(0, Math.min(n - 1, i))];
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const fi = x / S, fj = y / S, i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j;
    const h = (H(i, j) * (1 - u) + H(i + 1, j) * u) * (1 - v) + (H(i, j + 1) * (1 - u) + H(i + 1, j + 1) * u) * v;
    const dx = (H(i + 1, j) - H(i - 1, j)) / (2 * T.cel), dz = (H(i, j + 1) - H(i, j - 1)) / (2 * T.cel); const dec = Math.hypot(dx, dz);
    let c; if (h < 0) { const p = Math.min(1, -h / 60); c = mix([62, 170, 178], [10, 44, 78], Math.sqrt(p)); c = mix(c, [16, 34, 58], Math.min(1, -h / 400) * 0.6); }
    else { c = h < 4 ? [196, 182, 140] : mix([74, 104, 56], [58, 82, 48], h / 300); c = mix(c, [118, 112, 104], Math.min(1, dec * 1.6) + Math.max(0, (h - 420) / 300)); if (h > 900) c = mix(c, [232, 236, 240], (h - 900) / 250);
      const sh = Math.max(0.35, Math.min(1.35, 1 + (-dx * 0.7 - dz * 0.7) * 2.2)); c = c.map((q) => q * sh); }
    const o = (y * W + x) * 3; rgb[o] = Math.min(255, c[0]); rgb[o + 1] = Math.min(255, c[1]); rgb[o + 2] = Math.min(255, c[2]); }
  fs.writeFileSync(`public/mapas/${id}.png`, png(W, W, rgb)); console.log(id, W, fs.statSync(`public/mapas/${id}.png`).size); }
