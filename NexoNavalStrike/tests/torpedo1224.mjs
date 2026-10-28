// v1.2.24 item 2: torpedo detona NO CONTATO com o casco. Mede a distância do ponto de detonação (evento torpImpacto) à borda da planta do casco do alvo,
// no instante da detonação, para várias classes, ângulos de aproximação (aspecto), velocidades do alvo e modos (filoguiado travado, acústico, reto).
// Uso: node tests/torpedo1224.mjs   (Node, sem navegador)
import { Sim } from '../src/sim/world.js';
import { criaArena, alturaTerreno } from '../src/sim/maps.js';
const A = criaArena('atois'), P0 = A.plano.centro;
const CLS = ['corveta', 'strizh', 'puffin', 'fragata', 'destroier', 'furtivo', 'cruzador', 'capitania', 'colosso', 'atlantico'];
const ASP = [0, 30, 60, 90, 120, 150, 180, 225, 270, 315];
const res = []; let falhas = [], nT = 0;
for (const [ci, cls] of CLS.entries()) for (const [ai, aspG] of ASP.entries()) { const modo = ['reto', 'acustico'][(ci + ai) % 2], vAlvo = [0, 6, 12][(ci * 3 + ai) % 3];
  const s = new Sim({ arena: A, seed: 100 + ci * 17 + ai }); s.ameacas.ligadas = 0; s.revelaTudo = 1;
  let br = (ci * 0.71 + ai * 0.37) % 6.28; const d = 1400; for (let tent = 0; tent < 60; tent++) { let livre = true; for (let f = 0; f <= 1.15; f += 0.05) for (const o of [-300, 0, 300]) if (alturaTerreno(A, P0.x + Math.sin(br) * d * f + Math.cos(br) * o, P0.z - Math.cos(br) * d * f + Math.sin(br) * o) > -12) livre = false; if (livre) break; br += 0.29; }
  const ex = P0.x + Math.sin(br) * d, ez = P0.z - Math.cos(br) * d; const rumoAlvo = br + Math.PI + (aspG * Math.PI) / 180; /* aspecto: 0° = proa para o atirador, 90° = través */
  const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, br); const e = s.adicionaNavio('vermelho', cls, ex, ez, rumoAlvo);
  for (const q of [n, e]) { q.ciws = []; q.a30 = []; q.samAuto = 0; q.chaff = 0; q.chaffReserva = 0; q.C = Object.assign({}, q.C, { sam: 0 }); } e.v = vAlvo; e.telAlvo = vAlvo ? 2 : 0; e.lemeAlvo = 0;
  s.aplica({ id: n.id, t: 'radar', v: 1 }); for (let i = 0; i < 120; i++) s.passo(); n.torpModo = modo;
  s.aplica({ id: n.id, t: 'travar', alvo: e.id }); for (let i = 0; i < 180; i++) s.passo(); /* torpedo só sai com alvo travado (v1.2.5) */
  n.torp = 4; n.tTorp = 0; const ok = s.lancaTorpedo(n, e.id); nT++; if (!ok) { falhas.push(`${cls}/${aspG}°: não lançou`); continue; }
  let det = null; const ev0 = s.evento.bind(s); s.evento = (ev) => { if (ev.t === 'torpImpacto' && ev.dono === n.id && !det) { const alvo = s.navios[ev.alvo]; det = { alvo: ev.alvo, d: s.distCasco(alvo, ev.x, ev.z) }; if (process.env.DBG && Math.abs(det.d) > 0.25) { const tp = s.torpedos.find((q) => q.dono === n.id && q.idx === ev.idx) || {}; const c = Math.cos(alvo.rumo), sn = Math.sin(alvo.rumo), dx = ev.x - alvo.x, dz = ev.z - alvo.z; console.log("DBG", cls, aspG, JSON.stringify({ lx: dx * c + dz * sn, lz: -dx * sn + dz * c, B: alvo.C.B, L: alvo.C.L, rumoRel: tp.rumo - alvo.rumo, v: tp.v })); } } ev0(ev); };
  let fim = 0, dMin = 1e9; for (let i = 0; i < 60 * 200 && !det && !fim; i++) { s.passo(); { const tp = s.torpedos.find((q) => q.ativo && q.dono === n.id); if (tp) dMin = Math.min(dMin, s.distCasco(e, tp.x, tp.z)); } for (const ev of s.eventos) if (ev.t === 'torpFim' && ev.dono == null) fim = 1; s.eventos.length = 0; if (!s.torpedos.some((q) => q.ativo && q.dono === n.id) && !det) fim = 1; }
  if (!det) { falhas.push(`${cls}/${aspG}°/${modo}: sem impacto — passou a ${dMin.toFixed(1)} m do costado (errou)`); continue; } res.push({ cls, aspG, modo, vAlvo, d: det.d, alvoCerto: det.alvo === e.id }); }
const ds = res.map((r) => Math.abs(r.d)), max = Math.max(...ds), med = ds.reduce((a, b) => a + b, 0) / Math.max(1, ds.length);
for (const r of res) console.log(`${r.cls.padEnd(10)} aspecto ${String(r.aspG).padStart(3)}°  ${r.modo.padEnd(8)} alvo ${String(r.vAlvo).padStart(2)} m/s → detonação a ${r.d.toFixed(3)} m do costado${r.alvoCerto ? '' : ' (OUTRO navio)'}`);
console.log(`\n${res.length}/${nT} impactos; |distância ao casco|: média ${med.toFixed(3)} m, máx ${max.toFixed(3)} m`); if (falhas.length) console.log('sem impacto/falhas: ' + falhas.join(' | '));
const okT = res.length >= nT * 0.9 && max <= 0.25; console.log(okT ? 'OK: torpedo detona no contato (≤ 0,25 m do costado)' : 'FALHOU'); process.exit(okT ? 0 : 1);
