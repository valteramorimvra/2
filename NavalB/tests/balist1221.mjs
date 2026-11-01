// v1.2.21 item 14 — balística/física do canhão (jogador e bots, mesma sim):
// (1) alcance × elevação (sim: semi-implícito, passo fixo 1/60) = integração de REFERÊNCIA RK4 (dt 0,5 ms) < 1%;
// (2) independência de FPS: quadros de 30/60/120 Hz → mesmo impacto (< 1%); (3) saída na BOCA ±0,05 m e no eixo do cano;
// (4) previsão (prevTiro, usada no arco da mira) = impacto real ±1% do alcance, com o navio andando e balançando;
// (5) compensação da velocidade do próprio navio (mira livre num ponto do mar); (6) ramo ALTO (tiro em arco) e limite mecânico;
// (7) recuo mola-amortecedor (pico ~1 e retorno amortecido sem oscilar).
import { criaSessao } from '../src/sim/session.js'; import { CLASSES } from '../src/sim/classes.js';
import { trajetoria, elevacaoArrasto, alcanceMax } from '../src/naval5v5/balistica.js'; import { PARAM, elMaxCal } from '../src/armasParametros.js';
import { G } from '../src/sim/util.js'; import fs from 'node:fs';
let ok = 0, falha = 0; const L = [], R = { ref: [], fps: [], boca: [], prev: [], comp: [], alto: [], recuo: [] };
const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
const rk4 = (el, h0, V0, k) => { const h = 2e-3; let S = [0, h0, V0 * Math.cos(el), V0 * Math.sin(el)]; const f = (s) => { const v = Math.hypot(s[2], s[3]); return [s[2], s[3], -k * v * s[2], -G - k * v * s[3]]; }; const ad = (s, d, c) => s.map((q, i) => q + d[i] * c);
  for (let i = 0; i < 2e6; i++) { const a1 = f(S), a2 = f(ad(S, a1, h / 2)), a3 = f(ad(S, a2, h / 2)), a4 = f(ad(S, a3, h)); const N = S.map((q, j) => q + h / 6 * (a1[j] + 2 * a2[j] + 2 * a3[j] + a4[j])); if (N[1] <= 0) return S[0] + (N[0] - S[0]) * (S[1] / (S[1] - N[1])); S = N; } return S[0]; }; /* RK4 clássico no estado (x, y, vx, vy) */
const prep = (k, seed = 4) => { const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed }); const s = S.sim, n = s.navios[S.match.jogadorId]; s.revelaTudo = 1; for (const q of s.navios) if (q !== n) { q.x = 1e9; q.morto = 1; } return { S, s, n }; };
// (1) referência
for (const k of ['corsario', 'destroier', 'cruzador', 'tridente', 'trovao']) { const { s, n } = prep(k); const A = n.C.canhao, kA = s.kArrasto(n); const em = elMaxCal(A.cal);
  for (const g of [1, 5, 15, 30, 45, 60, 75]) { const el = g * Math.PI / 180; if (el > em + 1e-6) continue; const a = trajetoria(el, 10, A.V0, kA).x, b = rk4(el, 10, A.V0, kA), e = Math.abs(a - b) / b; R.ref.push({ k, cal: A.cal, graus: g, sim: +a.toFixed(1), rk4: +b.toFixed(1), erroPct: +(e * 100).toFixed(3) }); chk(e < 0.01, `${k} ${g}°: alcance ${a.toFixed(0)} × RK4 ${b.toFixed(0)} (${(e * 100).toFixed(2)}%)`); } }
// cenário de tiro determinístico (sem dispersão), navio andando a 70% e com mar
const semDisp = () => { const D = PARAM.dispersao, sv = { ...D }; D.az = 0; D.alc = 0; D.vies = 0; return () => Object.assign(D, sv); };
const tiroReal = (s, n, i, sol) => { const ev0 = s.eventos.length; s.disparaCanhao(n, i, sol); const e = s.eventos.slice(ev0).find((q) => q.t === 'tiro'); if (!e) return null; const g = s.granadas[e.gi]; const ini = { x: g.x, y: g.y, z: g.z, vx: g.vx, vy: g.vy, vz: g.vz };
  for (let f = 0; f < 60 * 160 && g.ativo; f++) s.passo([]); return { ini, fim: { x: g.x, y: g.y, z: g.z }, e }; };
const volta = semDisp();
for (const k of ['corsario', 'destroier', 'cruzador', 'tridente', 'trovao']) for (const fps of [30, 60, 120]) { const { S, s, n } = prep(k, 7); n.mods.disp = 0; n.v = n.C.vmax * 0.7; n.telegrafo = 3;
  n.miraLivre = 1; const ang = n.rumo + Math.PI / 2; const d = Math.min(9000, n.C.canhao.alc * 0.7); n.mira.px = n.x + Math.sin(ang) * d; n.mira.pz = n.z - Math.cos(ang) * d; n.mira.h = 0;
  { let acc = 0; for (let t = 0; t < 14; t += 1 / fps) { acc += 1 / fps; while (acc >= 1 / 60 - 1e-9) { s.passo([]); acc -= 1 / 60; } } } // quadros de 'fps' Hz → acumulador de passo fixo (o mesmo de session.avanca)
  const sol = s.pontaria(n); const i = n.torres.findIndex((t, j) => !t.bloqueada); const pts = new Float32Array(3 * 32), pv = s.prevTiro(n, i, sol, pts, {}), pv0 = s.prevTiro(n, i, sol, null, {}, 1);
  const nc = n.torres[i].canos || 1, lado = nc > 1 ? -1 : 0; const L0 = { ...s.P_(n, i, lado) }, bo = s.mundoInc(n, L0.x, L0.y, L0.z, {}); const VB = { ...s.velBoca(n, L0, {}) }; const tr = n.torres[i], az = n.rumo + tr.az; const r = tiroReal(s, n, i, sol); if (!r || !pv) { chk(0, `${k}@${fps}: sem tiro/previsão`); continue; }
  const dB = Math.hypot(r.ini.x - bo.x, r.ini.y - bo.y, r.ini.z - bo.z); R.boca.push({ k, fps, erroBoca_m: +dB.toFixed(4) }); chk(dB <= 0.05, `${k}@${fps}: saída a ${dB.toFixed(3)} m da boca`);
  const wx = r.ini.vx - VB.x, wy = r.ini.vy - VB.y, wz = r.ini.vz - VB.z, wm = Math.hypot(wx, wy, wz); const eixo = Math.abs(Math.atan2(wx, -wz) - az) % (2 * Math.PI); chk(Math.min(eixo, 2 * Math.PI - eixo) < 0.004 && Math.abs(wm - n.C.canhao.V0) < 1, `${k}@${fps}: projétil fora do eixo do cano (${eixo.toFixed(4)} rad, |v0| ${wm.toFixed(1)})`);
  const rng = Math.hypot(pv.x - r.ini.x, pv.z - r.ini.z), ep = Math.hypot(pv.x - r.fim.x, pv.z - r.fim.z) / Math.max(1, rng); R.prev.push({ k, fps, alcance: +rng.toFixed(0), erroPrevPct: +(ep * 100).toFixed(3), vBoca: [+VB.x.toFixed(2), +VB.y.toFixed(2), +VB.z.toFixed(2)] }); chk(ep < 0.01, `${k}@${fps}: previsão × impacto ${(ep * 100).toFixed(2)}%`);
  const pp = s.prevTiro(n, i, sol, null, {}, 1) /* já após o tiro: só para a pontaria, no plano do mar sem ondas */; const ec = pp ? Math.hypot(pv0.x - n.mira.px, pv0.z - n.mira.pz) / d : 1; R.comp.push({ k, fps, erroMiraPct: +(ec * 100).toFixed(2), v: +n.v.toFixed(1) }); chk(ec < 0.005, `${k}@${fps}: com o navio a ${n.v.toFixed(1)} m/s a pontaria (plano do mar) cai a ${(ec * 100).toFixed(2)}% do ponto visado`);
  R.fps.push({ k, fps, x: r.fim.x, z: r.fim.z, rng }); }
for (const k of ['corsario', 'destroier', 'cruzador', 'tridente', 'trovao']) { const F = R.fps.filter((q) => q.k === k); const b = F.find((q) => q.fps === 60); for (const q of F) { const e = Math.hypot(q.x - b.x, q.z - b.z) / b.rng; chk(e < 0.01, `${k}: FPS ${q.fps} × 60 → ${(e * 100).toFixed(2)}%`); q.difPct = +(e * 100).toFixed(4); } }
volta();
// (6) ramo alto + limite mecânico
for (const k of ['corsario', 'destroier', 'cruzador', 'tridente', 'trovao']) { const { s, n } = prep(k); const A = n.C.canhao, kA = s.kArrasto(n), em = elMaxCal(A.cal); const d = A.alc * 0.5; const lo = elevacaoArrasto(d, 10, A.V0, kA, {});
  n.miraLivre = 1; const ang = n.rumo + Math.PI / 2; n.mira.px = n.x + Math.sin(ang) * d; n.mira.pz = n.z - Math.cos(ang) * d; n.mira.h = 0; const hi = { ...s._pont(n, 1) }; const V0c = A.V0 * (hi.carga || 1);
  const ok2 = hi.alto && hi.el > lo.el && hi.carga < 1; const xr = ok2 ? trajetoria(hi.el, Math.max(0.5, n._h0), V0c, kA).x : 0; R.alto.push({ k, cal: A.cal, elMaxGraus: +(em * 180 / Math.PI).toFixed(0), d: +hi.d.toFixed(0), baixoGraus: +(lo.el * 180 / Math.PI).toFixed(2), altoGraus: +(hi.el * 180 / Math.PI).toFixed(1), carga: hi.carga, V0arco: +V0c.toFixed(0), tvAlto: +hi.tv.toFixed(1), ymax: +(hi.ymax || 0).toFixed(0), permitido: !!(ok2 && hi.el <= em) });
  chk(ok2 && Math.abs(xr - hi.d) / hi.d < 0.01 && hi.el <= em + 1e-9, `${k}: ramo alto (carga ${hi.carga}) não bate (${xr.toFixed(0)} × ${hi.d.toFixed(0)}, el ${hi.el.toFixed(3)} ≤ ${em.toFixed(3)})`);
  n.miraLivre = 0; n.alvoId = -1; n.mira.az = n.rumo + Math.PI / 2; n.mira.dist = A.alc; let mxEl = 0; n._alto = 1; for (let f = 0; f < 600; f++) { s.passo([]); for (const t of n.torres) mxEl = Math.max(mxEl, t.el); } chk(mxEl <= em + 1e-6, `${k}: elevação ${mxEl.toFixed(3)} > limite ${em.toFixed(3)}`); }
// (7) recuo
for (const k of ['corsario', 'destroier', 'trovao']) { const { s, n } = prep(k); for (let f = 0; f < 600; f++) s.passo([]); const tr = n.torres[0]; tr.rec = 0; const sol = s.pontaria(n); s.disparaCanhao(n, 0, sol); let pk = 0, tp = 0, neg = 0, tRet = null; for (let f = 1; f <= 240; f++) { s.passo([]); if (tr.recuo > pk) { pk = tr.recuo; tp = f / 60; } if (tr.recuo < -1e-3) neg = 1; if (tRet == null && f / 60 > tp + 0.02 && tr.recuo < 0.05 * pk) tRet = f / 60; }
  R.recuo.push({ k, cal: n.C.canhao.cal, pico: +pk.toFixed(2), tPico_s: +tp.toFixed(3), retorno_s: tRet }); chk(pk > 0.85 && pk <= 1.2 && tp < 0.2 && tRet && tRet < 2 && !neg, `${k}: recuo pico ${pk.toFixed(2)} em ${tp.toFixed(2)} s, retorno ${tRet}`); }
fs.writeFileSync('/workspace/balist1221.out', JSON.stringify(R, null, 1)); console.log(L.join('\n'));
console.log(JSON.stringify({ refMaxPct: Math.max(...R.ref.map((q) => q.erroPct)), fpsMaxPct: Math.max(...R.fps.map((q) => q.difPct || 0)), bocaMax_m: Math.max(...R.boca.map((q) => q.erroBoca_m)), prevMaxPct: Math.max(...R.prev.map((q) => q.erroPrevPct)), compMaxPct: Math.max(...R.comp.map((q) => q.erroMiraPct)) }));
console.table(R.alto); console.table(R.recuo); console.log(`balist1221: ${ok} ok, ${falha} falhas`); process.exit(falha ? 1 : 0);
