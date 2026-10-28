// v1.2.14 — casco FECHADO nas 36 classes: arestas de borda (usadas por 1 só triângulo) após soldar costado + convés + espelho; normais para fora.
const SRC = process.env.SRC || '/workspace/nexo-naval-strike/src';
const { CLASSES } = await import(SRC + '/sim/classes.js'); const { geoCasco } = await import(SRC + '/render/shipModels.js');
let ruins = []; const linhas = [];
for (const [k, C] of Object.entries(CLASSES)) { const H = geoCasco(C); const vk = new Map(); const id = (x, y, z) => { const ch = `${Math.round(x * 200)},${Math.round(y * 200)},${Math.round(z * 200)}`; if (!vk.has(ch)) vk.set(ch, vk.size); return vk.get(ch); };
  const ar = new Map(); let tris = 0, fora = 0, deg = 0, vol = 0; const cx = 0;
  for (const g of [H.costado, H.conves, H.espelho]) { const P = g.attributes.position.array, I = g.index.array; for (let t = 0; t < I.length; t += 3) { const v = [I[t], I[t + 1], I[t + 2]].map((i) => id(P[i * 3], P[i * 3 + 1], P[i * 3 + 2])); if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]) { deg++; continue; } tris++; { const q = [I[t], I[t + 1], I[t + 2]].map((i) => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2]]); const [A, B, D] = q; vol += (A[0] * (B[1] * D[2] - B[2] * D[1]) - A[1] * (B[0] * D[2] - B[2] * D[0]) + A[2] * (B[0] * D[1] - B[1] * D[0])) / 6; }
      for (let e = 0; e < 3; e++) { const a = v[e], b = v[(e + 1) % 3]; const ch = a < b ? a + ':' + b : b + ':' + a; ar.set(ch, (ar.get(ch) || 0) + 1); } } }
  let borda = 0; for (const c of ar.values()) if (c === 1) borda++;
  linhas.push(`${k}: borda ${borda} vol ${vol.toFixed(0)}`); if (vol <= 0) ruins.push(k + ':normais para dentro'); if (borda > 0) ruins.push(k + ':' + borda); }
console.log('CASCO FECHADO 36 classes:', ruins.length ? 'ABERTOS ' + ruins.join(' ') : 'todos fechados (0 arestas de borda)', '\n' + linhas.join(' | '));
