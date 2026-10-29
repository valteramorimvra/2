// v1.2.21 item 17 — míssil NÃO interceptado nem iludido sempre atinge o CASCO (jogador e bots, mesma física).
// Cenários: alvo parado, a toda em linha reta e manobrando (leme todo alternado + velocidade máxima); 2,5–14 km; mar bf 2 e bf 5.
// Sem defesa (SAM/CIWS/AA/iscas desligados) → 100% no casco. Com defesa → acerto + abatido + iludido = total e 0 "na água sem motivo".
import { writeFileSync } from 'node:fs';
const B = process.env.BASE ? '/tmp/base1220/' : '../src/', base = !!process.env.BASE;
const { criaSessao } = await import(B + 'sim/session.js'); const OC = await import(B + 'sim/ocean.js');
let ok = 0, falha = 0; const L = [], R = [];
const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
const { Sim } = await import(B + 'sim/world.js'); const { criaArena, alturaTerreno } = await import(B + 'sim/maps.js'); const A0 = criaArena('atois'); const P0 = A0.plano.centro;
const cenario = (atk, alvoC, d, mov, bf, defesa, seed, bot) => { const s = new Sim({ arena: A0, seed }); s.revelaTudo = 1; OC.defineMar(bf); let br = (seed * 0.61) % 6.28;
  for (let t = 0; t < 80; t++) { let ok = 1; for (let f = -0.3; f <= 1.4; f += 0.03) if (alturaTerreno(A0, P0.x + Math.sin(br) * d * f, P0.z - Math.cos(br) * d * f) > -14) ok = 0; if (ok) break; br += 0.37; }
  const n = bot ? s.adicionaNavio('azul', atk, P0.x, P0.z, br + Math.PI / 2, 'ataque') : s.adicionaNavio('azul', atk, P0.x, P0.z, br + Math.PI / 2); const e = s.adicionaNavio('vermelho', alvoC, P0.x + Math.sin(br) * d, P0.z - Math.cos(br) * d, br + 1.9, 'ataque');
  e.v = mov ? e.C.vmax : 0; n.vida = e.vida = 1e9; n.vls = 999; n.alvoId = e.id;
  if (!defesa) { e.sam = 0; e.ciws = []; e.a30 = []; e.lasers = []; e.chaff = 0; e.chaffReserva = 0; e.samAuto = 0; }
  const NM = 4; e.heli = 0; let lanc = 0; const fins = { acerto: 0, abatido: 0, isca: 0, agua: 0, ilha: 0 }; const agua = [];
  for (let f = 0; f < 60 * 140; f++) { s.eventos.length = 0; if (lanc < NM && f % 150 === 10) { n.alvoId = e.id; n.trava = 1; n.mira.az = Math.atan2(e.x - n.x, -(e.z - n.z)); n.tVls = 0; s.lancaMissil(n, e.id, 1); }
    if (mov === 2) { e.lemeCmd = Math.sin(s.t * 0.25) > 0 ? 1 : -1; e.telAlvo = 4; } else if (mov === 1) { e.lemeCmd = 0; e.telAlvo = 4; } else { e.telAlvo = 1; e.v = 0; }
    s.passo([]); const meu = (v) => { if (v.dono != null) return v.dono === n.id; const mm = s.misseis.find((q) => q.idx === v.idx); return !!mm && mm.dono === n.id; };
    for (const v of s.eventos) { if (v.t === 'vls' && v.id === n.id) lanc++; else if (v.t === 'impacto' && v.tipo === 'missil' && v.dono === n.id) fins.acerto++; else if ((v.t === 'missilAbatido' || v.t === 'samAbate') && meu(v)) { fins.abatido++; if (process.env.DBG) console.log('AB', atk, alvoC, d, mov, bf, JSON.stringify(v)); } else if (v.t === 'missilIsca' && meu(v)) fins.isca++; else if (v.t === 'missilAgua' && meu(v)) { if (v.terra || v.estr != null) fins.ilha++; else { fins.agua++; agua.push(v); } } }
    if (lanc >= NM && !s.misseis.some((m) => m.ativo)) break; }
  return { lanc, ...fins, aguaL: agua }; };
const CEN = []; const { MISSEIS, CLASSES } = await import(B + 'sim/classes.js'); const RAP = !!process.env.RAPIDO;
for (const atk of ['corsario', 'destroier', 'cruzador', 'baluarte', 'kordao']) for (const alvoC of ['corsario', 'destroier', 'marcos']) for (const fd of (RAP ? [0.6] : [0.3, 0.6, 0.93])) for (const mov of [0, 1, 2]) for (const bf of (RAP ? [5] : [2, 6]))
  CEN.push({ atk, alvoC, d: Math.round(MISSEIS[CLASSES[atk].missil].alc * fd), mov, bf, defesa: 0 });
for (const bot of [0, 1]) for (const bf of [3, 6]) for (const alvoC of ['destroier', 'cruzador', 'marcos']) for (const mov of [0, 2]) CEN.push({ atk: 'cruzador', alvoC, d: 8000, mov, bf, defesa: 1, bot });
for (const atk of ['corsario', 'destroier', 'baluarte']) for (const mov of [0, 2]) CEN.push({ atk, alvoC: 'destroier', d: Math.round(MISSEIS[CLASSES[atk].missil].alc * 0.6), mov, bf: 6, defesa: 0, bot: 1 });
let seed = 11; for (const c of CEN) { const r = cenario(c.atk, c.alvoC, c.d, c.mov, c.bf, c.defesa, seed++, c.bot); const tot = r.acerto + r.abatido + r.isca + r.agua + r.ilha;
  R.push({ bot: c.bot ? 1 : 0, atk: c.atk, alvoC: c.alvoC, d: c.d, alvo: ['parado', 'reto', 'zigue'][c.mov], bf: c.bf, def: c.defesa, lanc: r.lanc, acerto: r.acerto, abatido: r.abatido, iludido: r.isca, agua: r.agua, ilha: r.ilha, aguaFase: r.aguaL.map((v) => v.fase + '@' + v.dAlvo + 'm').join(' ') });
  if (!base) { chk(tot === r.lanc, `${c.atk} ${c.d} m mov${c.mov} bf${c.bf}: desfechos ${tot} ≠ lançados ${r.lanc}`); chk(r.agua === 0, `${c.atk} ${c.d} m mov${c.mov} bf${c.bf} def${c.defesa}: ${r.agua} na ÁGUA sem abate/isca (${r.aguaL.map((v) => 'fase ' + v.fase + ' a ' + v.dAlvo + ' m').join(', ')})`);
    if (!c.defesa) chk(r.acerto === r.lanc - r.ilha, `${c.atk} ${c.d} m mov${c.mov}: ${r.acerto}/${r.lanc} no casco sem defesa`); } }
for (const l of L) console.log(l); console.table(R.filter((q) => q.acerto + q.ilha !== q.lanc || q.def)); const T = R.reduce((a, q) => { a.l += q.lanc; a.a += q.acerto; a.w += q.agua; return a; }, { l: 0, a: 0, w: 0 });
console.log(`total: ${T.l} lançados, ${T.a} no casco, ${T.w} na água sem motivo`); writeFileSync(`/workspace/missil1221-${base ? 'base' : 'novo'}.json`, JSON.stringify({ R, T }, null, 1));
console.log(`missil1221${base ? ' (BASE)' : ''}: ${ok} ok, ${falha} falhas`); process.exit(base ? 0 : falha ? 1 : 0);
