// v1.2.15 — dispersão do canhão ANTES (1.2.14) × DEPOIS a 3/6/10 km: % no casco, σ alcance × σ deriva (elipse), navio estável e mira firmada.
import { criaSessao } from '../src/sim/session.js';
import { PARAM } from '../src/armasParametros.js';
const D0 = { ...PARAM.dispersao }; const ANTES = { az: 0.0048, alc: 0.055, calG: 1, calM: 1, calP: 1, distK: 0 };
const CL = (process.env.CL || 'destroier,cruzador,colosso').split(','); const out = []; let falha = 0;
for (const modo of ['antes', 'depois']) { Object.assign(PARAM.dispersao, modo === 'antes' ? ANTES : D0);
  for (const k of CL) for (const dist of [3000, 6000, 10000]) { const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed: 9 }); const s = S.sim, n = s.navios[S.match.jogadorId]; if (dist > n.C.canhao.alc) continue;
    const a = s.navios.find((q) => q.time !== n.time); for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; } s.revelaTudo = 1; a.papel = 'alvo';
    const fix = () => { n.x = 0; n.z = 0; n.rumo = 0; n.v = 0; n.vida = n.C.vida; Object.assign(a, { x: dist, z: 0, rumo: 0, v: 0, vida: a.C.vida, lista: 0, aguaAbordo: 0, alagamento: 0, incendio: 0 }); };
    let tiros = 0, cas = 0; const pts = [];
    for (let f = 0; f < 60 * 150 && tiros < 160; f++) { fix(); s.passo(f === 3 ? [{ t: 'travar', id: n.id, alvo: a.id }] : f > 360 && f % 20 === 0 ? [{ t: 'canhao', id: n.id }] : []);
      for (const e of s.eventos) { if (e.t === 'tiro' && e.id === n.id && f > 360) tiros++; if ((e.t === 'impacto' || e.t === 'agua') && (e.dono === n.id || e.id === n.id) && f > 360 && e.x != null) { if (e.t === 'impacto') cas++; pts.push([e.x - a.x, e.z - a.z]); } } s.eventos.length = 0; }
    const m = (i) => pts.reduce((q, p) => q + p[i], 0) / Math.max(1, pts.length), sd = (i) => Math.sqrt(pts.reduce((q, p) => q + (p[i] - m(i)) ** 2, 0) / Math.max(1, pts.length));
    const r = { modo, k, km: dist / 1000, tiros, pctCasco: +(100 * cas / Math.max(1, pts.length)).toFixed(1), sAlc: +sd(0).toFixed(0), sDer: +sd(1).toFixed(0) }; out.push(r); console.log(JSON.stringify(r));
    if (modo === 'depois' && dist === 3000 && r.pctCasco <= 50) { falha++; console.log('FALHA <50% a 3 km', k); } } }
for (const k of CL) for (const km of [3, 6, 10]) { const A = out.find((r) => r.modo === 'antes' && r.k === k && r.km === km), B = out.find((r) => r.modo === 'depois' && r.k === k && r.km === km); if (A && B) console.log(`${k} ${km} km: casco ${A.pctCasco}% → ${B.pctCasco}% · σ alcance ${A.sAlc}→${B.sAlc} m · σ deriva ${A.sDer}→${B.sDer} m`); }
console.log('disp1215', falha ? 'FALHA' : 'OK'); process.exit(falha ? 1 : 0);
