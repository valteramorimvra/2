/* v1.2.16 (item 15): COLISÃO SÓLIDA entre navios — casco como CÁPSULA (segmento ±0,42 L, raio B/2), massa = deslocamento,
 * impulso normal com restituição baixa (aço + água), alavanca no ponto de contato gera guinada, deriva lateral amortecida pela água,
 * correção posicional suave (sem tremor) e abalroamento com dano só entre times diferentes (aliados 0). Sem alocação por passo. */
const P = { e: 0.15, corr: 0.35, folga: 0.15, kDrift: 0.55, kW: 0.9, vDano: 1.2, cd: 0.9 };
const _a = { x: 0, z: 0 }, _b = { x: 0, z: 0 };
function maisProx(ax, az, bx, bz, cx, cz, dx, dz) { /* pontos mais próximos entre os segmentos AB e CD (2D) → _a, _b */
  const ux = bx - ax, uz = bz - az, vx = dx - cx, vz = dz - cz, wx = ax - cx, wz = az - cz;
  const a = ux * ux + uz * uz, b = ux * vx + uz * vz, c = vx * vx + vz * vz, d = ux * wx + uz * wz, e = vx * wx + vz * wz, D = a * c - b * b;
  let s = D > 1e-6 ? (b * e - c * d) / D : 0; s = s < 0 ? 0 : s > 1 ? 1 : s; let t = c > 1e-6 ? (b * s + e) / c : 0;
  if (t < 0) { t = 0; s = a > 1e-6 ? Math.min(1, Math.max(0, -d / a)) : 0; } else if (t > 1) { t = 1; s = a > 1e-6 ? Math.min(1, Math.max(0, (b - d) / a)) : 0; }
  _a.x = ax + ux * s; _a.z = az + uz * s; _b.x = cx + vx * t; _b.z = cz + vz * t;
}
export function massa(n) { return Math.max(200, (n.C && n.C.desl) || n.C.L * n.C.B * n.C.T * 0.55 || 2000); }
/** par n–o: resolve contato. Retorna força (m/s de aproximação) ou 0. */
export function colidePar(sim, n, o, dt) {
  const Ln = n.C.L, Lo = o.C.L; const dx0 = o.x - n.x, dz0 = o.z - n.z; const lim = (Ln + Lo) * 0.5 + (n.C.B + o.C.B) * 0.5; if (dx0 * dx0 + dz0 * dz0 > lim * lim) return 0;
  const hnx = Math.sin(n.rumo), hnz = -Math.cos(n.rumo), hox = Math.sin(o.rumo), hoz = -Math.cos(o.rumo), sn = Ln * 0.42, so = Lo * 0.42;
  maisProx(n.x - hnx * sn, n.z - hnz * sn, n.x + hnx * sn, n.z + hnz * sn, o.x - hox * so, o.z - hoz * so, o.x + hox * so, o.z + hoz * so);
  const rn = n.C.B * 0.5, ro = o.C.B * 0.5; let nx = _b.x - _a.x, nz = _b.z - _a.z; let d = Math.hypot(nx, nz); const R = rn + ro; if (d >= R) return 0;
  if (d < 1e-4) { nx = -hnz; nz = hnx; d = 1e-4; } else { nx /= d; nz /= d; } const pen = R - d;
  const cx = (_a.x + nx * rn + _b.x - nx * ro) * 0.5, cz = (_a.z + nz * rn + _b.z - nz * ro) * 0.5; /* ponto de contato */
  const mn = massa(n), mo = massa(o), im = 1 / mn + 1 / mo;
  const vnx = hnx * n.v + (n.dX || 0), vnz = hnz * n.v + (n.dZ || 0), vox = hox * o.v + (o.dX || 0), voz = hoz * o.v + (o.dZ || 0);
  const vrel = (vox - vnx) * nx + (voz - vnz) * nz; /* < 0 = aproximando */
  if (vrel < 0) { const j = (-(1 + P.e) * vrel) / im; aplica(n, -j / mn, nx, nz, hnx, hnz, cx, cz); aplica(o, j / mo, nx, nz, hox, hoz, cx, cz); }
  /* correção posicional SUAVE proporcional à massa do outro (o mais pesado quase não sai do lugar) */
  const c = Math.max(0, pen - P.folga) * P.corr * Math.min(1, dt * 60), fn = (1 / mn) / im, fo = (1 / mo) / im;
  n.x -= nx * c * fn; n.z -= nz * c * fn; o.x += nx * c * fo; o.z += nz * c * fo;
  if (pen > R * 0.6) { const h = (pen - R * 0.6); n.x -= nx * h * fn; n.z -= nz * h * fn; o.x += nx * h * fo; o.z += nz * h * fo; } /* nunca atravessa */
  const forca = -Math.min(0, vrel); const t = sim.t || 0;
  if (forca > 0.35 && (!n._tCol || t - n._tCol > P.cd || n._colCom !== o.id)) { n._tCol = t; n._colCom = o.id;
    sim.evento({ t: 'colisao', x: cx, z: cz, a: n.id, b: o.id, forca, raspa: forca < 1.2 ? 1 : 0 });
    if (n.time !== o.time && forca > P.vDano) { /* ABALROAMENTO: energia relativa (massa reduzida) → dano leve; o mais leve sofre mais */
      const mu = 1 / im, E = 0.5 * mu * forca * forca; const base = Math.min(0.09, 0.00002 * Math.sqrt(E));
      sim.dano(n, n.C.vida * base * (mo / (mn + mo)) * 2, o, 'colisao'); sim.dano(o, o.C.vida * base * (mn / (mn + mo)) * 2, n, 'colisao'); } }
  return forca;
}
function aplica(s, k, nx, nz, hx, hz, cx, cz) { /* Δv = k·normal → parte longitudinal em v, lateral em deriva; alavanca → guinada */
  const dvx = nx * k, dvz = nz * k, lon = dvx * hx + dvz * hz; s.v += lon; const lx = dvx - hx * lon, lz = dvz - hz * lon; s.dX = (s.dX || 0) + lx; s.dZ = (s.dZ || 0) + lz;
  const rx = cx - s.x, rz = cz - s.z, L = s.C.L; const tq = rx * dvz - rz * dvx; s.wC = (s.wC || 0) + tq / (L * L / 12) * 0.55;
}
/** por passo: deriva lateral e guinada de colisão amortecidas pela água (atrito lateral forte do casco). */
export function passoDeriva(n, dt) {
  if (n.dX || n.dZ) { n.x += n.dX * dt; n.z += n.dZ * dt; const k = Math.exp(-P.kDrift * dt); n.dX *= k; n.dZ *= k; if (Math.abs(n.dX) + Math.abs(n.dZ) < 0.01) n.dX = n.dZ = 0; }
  if (n.wC) { n.rumo += n.wC * dt; n.wC *= Math.exp(-P.kW * dt); if (Math.abs(n.wC) < 1e-4) n.wC = 0; }
}
export function colideTodos(sim, n, dt) { passoDeriva(n, dt); for (const o of sim.navios) { if (o === n || o.morto || o.id < n.id) continue; colidePar(sim, n, o, dt); } }
