// v1.2.19 item 5: LINHA DE TIRO LIVRE das antiaéreas — 47 classes (+ mercante), NENHUMA montagem retirada.
// (1) o arquivo pré-calculado src/sim/mascarasLT.js é idêntico às máscaras geradas agora dos triângulos reais dos modelos;
// (2) contagem de montagens = classes.js (nada retirado); (3) toda montagem com ≥ 25% do hemisfério livre; (4) boca fora da estrutura;
// (5) traçador INDEPENDENTE (1 raio, Möller–Trumbore + casco analítico): 0 direções aceitas pela máscara atravessam o navio;
// (6) simulação real: navios sob ataque de drones/helicópteros/mísseis — cada rajada de CIWS/30 mm/laser/secundária disparada
//     é traçada da boca até o alvo contra os triângulos do próprio navio → 0 traçantes atravessando.
import '../tools/shimdoc.mjs';
const donoDe = (P, t, j) => t === 'ciws' ? 'ciws' + j : t === 'a30' ? 'a30_' + j : t === 'sec' ? 'sec_' + ((P.sec[j] && P.sec[j].i) ?? j) : 'laser' + j;
const _l = console.log; console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('THREE')) return; _l(...a); }; console.warn = () => {};
globalThis.__ltGera = 1; globalThis.__cx = 1; globalThis.__cxTri = 1;
const SM = await import('../src/render/shipModels.js'); const { CLASSES } = await import('../src/sim/classes.js'); const LT = await import('../src/sim/linhaTiro.js');
const { MASC_PRE } = await import('../src/sim/mascarasLT.js'); const LY = await import('../src/sim/layout.js');
let falhas = 0; const F = (...a) => { falhas++; if (falhas < 400) _l('FALHA', ...a); };
const T0 = Date.now(); const MODEL = {}; for (const k of Object.keys(CLASSES)) { delete LT.MASC[k]; SM.esqueceModelo(k); SM.criaNavio3D(k, 0); MODEL[k] = LT.MASC[k]; }
_l(`máscaras geradas: ${Object.keys(MODEL).length} classes em ${Date.now() - T0} ms`);
// (1)+(2)
let dif = 0, nMont = 0; for (const k in MODEL) { const C = CLASSES[k], P = LY.layoutDe(C); const esper = { ciws: C.ciws || 0, a30: P.a30.length, sec: (P.sec || []).length, laser: C.laser || 0 };
  if (P.ciws.length !== (C.ciws || 0)) F(k, 'CIWS retirado', P.ciws.length, C.ciws);
  for (const t of ['ciws', 'a30', 'sec', 'laser']) { const m = MODEL[k][t] || []; if (m.length !== esper[t]) F(k, t, 'montagens', m.length, '≠', esper[t]); nMont += m.length;
    m.forEach((x, j) => { const p = MASC_PRE[k] && MASC_PRE[k][t] && MASC_PRE[k][t][j]; if (!p || p !== LT.empacota(x)) { dif++; F(k, t + j, 'mascarasLT.js DESATUALIZADO (rode node tools/geraMascarasLT.mjs)'); } }); } }
_l(`(1) pré-calculado × gerado: ${dif} diferenças · (2) ${nMont} montagens antiaéreas/secundárias conferidas`);
// traçador independente
const tri = (T, ox, oy, oz, dx, dy, dz, tmax) => { for (let i = 0; i < T.length; i += 9) { const e1x = T[i + 3] - T[i], e1y = T[i + 4] - T[i + 1], e1z = T[i + 5] - T[i + 2], e2x = T[i + 6] - T[i], e2y = T[i + 7] - T[i + 1], e2z = T[i + 8] - T[i + 2];
  const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-9) continue; const inv = 1 / det;
  const sx = ox - T[i], sy = oy - T[i + 1], sz = oz - T[i + 2], u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue; const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
  const v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue; const t = (e2x * qx + e2y * qy + e2z * qz) * inv; if (t > 0.05 && t < tmax) return t; } return -1; };
const conta = (T, ox, oy, oz, dx, dy, dz) => { let n = 0; for (let i = 0; i < T.length; i += 9) { const e1x = T[i + 3] - T[i], e1y = T[i + 4] - T[i + 1], e1z = T[i + 5] - T[i + 2], e2x = T[i + 6] - T[i], e2y = T[i + 7] - T[i + 1], e2z = T[i + 8] - T[i + 2];
  const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-9) continue; const inv = 1 / det; const sx = ox - T[i], sy = oy - T[i + 1], sz = oz - T[i + 2], u = (sx * px + sy * py + sz * pz) * inv; if (u < 0 || u > 1) continue;
  const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x, v = (dx * qx + dy * qy + dz * qz) * inv; if (v < 0 || u + v > 1) continue; if ((e2x * qx + e2y * qy + e2z * qz) * inv > 1e-4) n++; } return n; };
const dentroSolido = (T, x, y, z) => conta(T, x, y, z, 0.0013, 1, 0.0007) % 2 === 1 && conta(T, x, y, z, 1, 0.0011, 0.0017) % 2 === 1 && conta(T, x, y, z, -0.0009, 0.0012, 1) % 2 === 1; /* paridade em 3 eixos = ponto dentro do sólido fechado */
const casco = (C, x, y, z) => z > -C.L / 2 + 0.5 && z < C.L / 2 - 0.5 && y < LY.deckY(C, z) - 0.25 && y > -C.T && Math.abs(x) < LY.meiaBoca(C, z) - 0.25;
const atravessa = (k, t, j, dx, dy, dz, dist) => { const R = MODEL[k], P = LY.layoutDe(CLASSES[k]), O = LT.origens(P)[t][j], C = CLASSES[k]; const dono = donoDe(LY.layoutDe(CLASSES[k]), t, j);
  const ox = O[0] + dx * O[3], oy = O[1] + dy * O[3], oz = O[2] + dz * O[3]; const tmax = Math.min(dist, 400);
  for (const c of R.cx) { if (c.dono === dono || !c.tri) continue; const h = tri(c.tri, ox, oy, oz, dx, dy, dz, tmax); if (h > 0) return c.nome || '?'; }
  for (let s = 0.5; s < Math.min(tmax, C.L * 1.2); s += 0.5) if (casco(C, ox + dx * s, oy + dy * s, oz + dz * s)) return 'casco'; return null; };
// (3)+(4)+(5)
let amostras = 0, cruz = 0, minF = 1, minN = ''; const rng = ((s) => () => (s = (s * 16807) % 2147483647) / 2147483647)(1219);
for (const k in MODEL) { const P = LY.layoutDe(CLASSES[k]); const OO = LT.origens(P); for (const t of ['ciws', 'a30', 'sec', 'laser']) (MODEL[k][t] || []).forEach((m, j) => {
  const f = LT.fracaoLivre(m); if (f < minF) { minF = f; minN = k + ' ' + t + j; } if (f < 0.25) F(k, t + j, `só ${(f * 100).toFixed(0)}% livre`);
  const [x, y, z] = OO[t][j]; for (const c of MODEL[k].cx) if (c.dono !== donoDe(LY.layoutDe(CLASSES[k]), t, j) && c.tri && x > c.a[0] && x < c.b[0] && y + 0.6 > c.a[1] && y + 0.6 < c.b[1] && z > c.a[2] && z < c.b[2] && dentroSolido(c.tri, x, y + 0.6, z)) F(k, t + j, 'eixo dos canos (pivô + 0,6 m) DENTRO do sólido', c.nome, c.dono, JSON.stringify([x, y, z].map((v) => +v.toFixed(2))), JSON.stringify(c.a.map((v) => +v.toFixed(2))), JSON.stringify(c.b.map((v) => +v.toFixed(2))));
  const n = { C: { id: k } }; for (let s = 0; s < 90; s++) { const az = (rng() * 2 - 1) * Math.PI, el = -0.5 + rng() * 2.0; if (LT.livre(n, t, j, az, el) !== 1) continue; amostras++;
    const ce = Math.cos(el), dx = Math.sin(az) * ce, dy = Math.sin(el), dz = -Math.cos(az) * ce; const h = atravessa(k, t, j, dx, dy, dz, 400); if (h) { cruz++; F(k, t + j, 'direção aceita atravessa', h, (az / Math.PI * 180).toFixed(0) + '°', (el / Math.PI * 180).toFixed(0) + '°'); } } }); }
_l(`(3) menor fração livre: ${(minF * 100).toFixed(0)}% (${minN}) · (5) ${amostras} direções aceitas traçadas · ${cruz} atravessando o navio`);
// (6) simulação real com as máscaras PRÉ-CALCULADAS (como no app)
globalThis.__ltGera = 0; for (const k in LT.MASC) delete LT.MASC[k];
const { criaSessao } = await import('../src/sim/session.js'); let disparos = 0, viol = 0, bloqueios = 0, sem = 0; const porTipo = { ciws: 0, a30: 0, laser: 0, sec: 0 };
const pesadas = ['kelly', 'klevton', 'colosso', 'rodolfo', 'antonia', 'atlantico', 'horizonte', 'baluarte', 'volkhar', 'tridente', 'monolito', 'destroier', 'fragata', 'capitania'].filter((k) => CLASSES[k]);
for (const [i, cl] of pesadas.entries()) { const S = criaSessao({ mapa: 'arquipelago', modo: 'frota', classe: cl, seed: 40 + i, mista: true, mercantes: false }); const sim = S.sim; const eu = S.jogador; eu.controleIA = 1;
  const local = (n, wx, wy, wz) => { const dx = wx - n.x, dz = wz - n.z, r = n.rumo; return [dx * Math.cos(r) + dz * Math.sin(r), wy, -(dx * Math.sin(r) - dz * Math.cos(r))]; };
  for (let k = 0; k < 60 * 150; k++) { S.avanca(1 / 60); if (sim.fim) break; if (k % 6) continue;
    for (const n of sim.navios) { if (n.morto || !MODEL[n.C.id]) continue; const P = n.P, OO = LT.origens(P);
      const tracos = []; n.ciws.forEach((c, j) => { if (c.fogo) tracos.push(['ciws', j, c.tx, c.ty, c.tz]); }); n.a30.forEach((a, j) => { if (a.fogo) tracos.push(['a30', j, a.tx, a.ty, a.tz]); }); (n.lasers || []).forEach((L, j) => { if (L.on) tracos.push(['laser', j, L.tx, L.ty, L.tz]); });
      (n.sec || []).forEach((st, j) => { if (st.fogo) { const ce = Math.cos(st.el); tracos.push(['sec', j, null, null, null, Math.sin(st.az) * ce, Math.sin(st.el), -Math.cos(st.az) * ce]); } });
      for (const [t, j, tx, ty, tz, ddx, ddy, ddz] of tracos) { const O = OO[t][j]; if (!O) continue; let dx, dy, dz, dist = 400; if (tx != null) { const [lx, ly, lz] = local(n, tx, ty, tz); dx = lx - O[0]; dy = ly - (O[1] + n.y0b || O[1]); dz = lz - O[2]; dy = ly - O[1]; dist = Math.hypot(dx, dy, dz); dx /= dist; dy /= dist; dz /= dist; } else { dx = ddx; dy = ddy; dz = ddz; }
        disparos++; porTipo[t]++; const h = atravessa(n.C.id, t, j, dx, dy, dz, dist); if (h) { viol++; F(n.C.id, t + j, 'TRAÇANTE atravessou', h, 'tick', sim.tick); } } } } }
_l(`(6) simulação: ${disparos} amostras de disparo (${Object.entries(porTipo).map(([a, b]) => a + ' ' + b).join(', ')}) · ${viol} traçantes atravessando o próprio navio`);
_l(falhas ? `RESULTADO: FALHA (${falhas})` : 'RESULTADO: TUDO OK'); process.exit(falhas ? 1 : 0);
