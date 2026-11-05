// v1.2.5 — bancada de acerto: 200 mísseis e 100 torpedos (simulação real) contra bots que se movem, desviam (IA SquadAI) e usam iscas.
// Cada arma lançada é seguida até sumir; o desfecho é classificado: acerto | defesa (CIWS/SAM/30 mm) | isca | ilha | ERRO (não explicado).
// Uso: node tests/acerto125.mjs [nMis=200] [nTorp=100]
import { Sim } from '../src/sim/world.js';
import { criaArena, alturaTerreno } from '../src/sim/maps.js';
import { SquadAI } from '../src/sim/ai.js';
const NM = +(process.argv[2] || 200), NT = +(process.argv[3] || 100);
const A = criaArena('atois'); const P0 = A.plano.centro; const CL = ['fragata', 'destroier', 'corveta', 'furtivo', 'cruzador', 'tempestade'];
function arena(seed, dist) { const s = new Sim({ arena: A, seed }); s.revelaTudo = 1; let br = (seed * 0.61) % 6.28;
  for (let t = 0; t < 60; t++) { let ok = 1; for (let f = -0.3; f <= 1.3; f += 0.04) if (alturaTerreno(A, P0.x + Math.sin(br) * dist * f, P0.z - Math.cos(br) * dist * f) > -14) ok = 0; if (ok) break; br += 0.37; }
  const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, br + Math.PI / 2); const e = s.adicionaNavio('vermelho', CL[seed % CL.length], P0.x + Math.sin(br) * dist, P0.z - Math.cos(br) * dist, (seed * 1.7) % 6.28, 'ataque');
  n.vida = 1e9; e.vida = 1e9; n.vls = 999; n.torp = 999; const ia = new SquadAI('vermelho'); return { s, n, e, ia }; }
const R = { missil: { acerto: 0, defesa: 0, isca: 0, ilha: 0, erro: 0 }, torpedo: { acerto: 0, defesa: 0, isca: 0, ilha: 0, erro: 0 } }; const erros = []; let explosoes = 0, impactos = 0;
function segue(ctx, pool, tipo, lanca, nLanc, intervalo, tMax) { const { s, n, e, ia } = ctx; const vivos = new Map(); let lancados = 0, tProx = 0;
  for (let i = 0; i < 60 * tMax; i++) { if (lancados < nLanc && s.t >= tProx) { const antes = new Set(pool.filter((q) => q.ativo).map((q) => q.idx)); n.trava = 1; n.alvoId = e.id; n.mira.az = Math.atan2(e.x - n.x, -(e.z - n.z)); if (lanca()) { for (const q of pool) if (q.ativo && !antes.has(q.idx)) { vivos.set(q.idx, { x: q.x, y: q.y || 0, z: q.z }); lancados++; } } tProx = s.t + intervalo; }
    s.eventos.length = 0; s.passo(ia.pensa(s)); const ev = s.eventos.slice(); for (const q of ev) if ((q.t === 'impacto' && q.tipo === 'missil' && q.dono === n.id) || q.t === 'torpImpacto') impactos++;
    for (const [idx, p] of vivos) { const q = pool[idx]; if (q.ativo && q.dono === n.id) { p.x = q.x; p.y = q.y || 0; p.z = q.z; p.alvo = q.alvo; p.isca = q.isca; continue; }
      let melhor = null, md = 1e9; for (const v of ev) { if (v._u || v.x == null || v.t === 'vls' || v.t === 'tiro' || v.t === 'samLanc') continue; /* v1.2.10: lançamentos não são desfecho */ const d = Math.hypot(v.x - p.x, v.z - p.z); if (d < md) { md = d; melhor = v; } }
      let k = 'erro'; if (melhor && md < 1500) { melhor._u = 1; const t = melhor.t;
        if ((t === 'impacto' && melhor.dono === n.id) || (t === 'torpImpacto' && melhor.dono === n.id)) k = 'acerto';
        else if (t === 'missilAbatido' || t === 'samAbate' || t === 'torpAbatido') k = 'defesa';
        else if (t === 'missilIsca' || (p.isca >= 0 && p.isca != null)) k = 'isca';
        else if ((t === 'missilAgua' || t === 'torpFim') && melhor.terra) k = 'ilha'; }
      R[tipo][k]++; if (k === 'erro') erros.push({ tipo, ev: melhor ? { ...melhor, _u: undefined } : null, md: Math.round(md), alvo: e.C.nome || e.tipo, dAlvo: Math.round(Math.hypot(e.x - p.x, e.z - p.z)), v: +e.v.toFixed(1) }); vivos.delete(idx); }
    if (lancados >= nLanc && !vivos.size) break; }
  for (const [, p] of vivos) { R[tipo].erro++; erros.push({ tipo, pendente: 1, dAlvo: Math.round(Math.hypot(e.x - p.x, e.z - p.z)) }); } return lancados; }
let seed = 11, nm = 0; while (nm < NM) { const dist = 3000 + (seed * 997) % 6000; const ctx = arena(seed++, dist); for (let i = 0; i < 60 * 4; i++) ctx.s.passo(ctx.ia.pensa(ctx.s));
  nm += segue(ctx, ctx.s.misseis, 'missil', () => ctx.s.lancaMissil(ctx.n, ctx.e.id, Math.min(2, NM - nm)), 4, 9, 90); }
let nt = 0; while (nt < NT) { const dist = 1500 + (seed * 761) % 3500; const ctx = arena(seed++, dist); for (let i = 0; i < 60 * 4; i++) ctx.s.passo(ctx.ia.pensa(ctx.s));
  nt += segue(ctx, ctx.s.torpedos, 'torpedo', () => { ctx.n.tTorp = 0; return ctx.s.lancaTorpedo(ctx.n, ctx.e.id); }, Math.min(4, NT - nt), 3, 400); }
const pct = (o) => { const t = Object.values(o).reduce((a, b) => a + b, 0); return `${t} lançados: ${o.acerto} acertos (${(100 * o.acerto / t).toFixed(1)}%), CIWS/SAM ${o.defesa}, isca ${o.isca}, ilha ${o.ilha}, ERRO não explicado ${o.erro}`; };
console.log('MÍSSEIS  ' + pct(R.missil)); console.log('TORPEDOS ' + pct(R.torpedo)); console.log(`impactos com evento de explosão: ${impactos}`);
const tm = R.missil, tt = R.torpedo; const okM = tm.acerto / (NM) >= 0.75 && tm.erro === 0, okT = tt.acerto / NT >= 0.75 && tt.erro === 0;
if (erros.length) console.log('erros (até 12):\n' + erros.slice(0, 12).map((x) => JSON.stringify(x)).join('\n'));
console.log(okM && okT ? 'PASSOU' : 'FALHOU'); process.exitCode = okM && okT ? 0 : 1;
