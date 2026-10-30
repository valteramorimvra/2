// v1.2.69 — caça como veículo principal sai da megabase pelo sistema do bombardeiro: na pista, esquadrilha de 3, mesmo voo.
import { Sim } from '../src/sim/world.js';
import { criaArena } from '../src/sim/maps.js';
const ARENA = criaArena('atois'); const P0 = ARENA.plano.centro; let falhas = 0; const ok = (c, m) => { if (!c) falhas++; console.log((c ? 'OK   ' : 'FALHA ') + m); };
const s = new Sim({ arena: ARENA, seed: 3 }); s.ameacas.ligadas = 0;
const n = s.adicionaNavio('azul', 'megabase', P0.x, P0.z, 0, 'jogador', { aeroPrin: { id: 'tesourao', heli: 'tesourao', nk: 1, ini: 'pista' } });
ok(n.nkAero === 'tesourao', 'megabase com caça principal no sistema do bombardeiro');
for (let i = 0; i < 40; i++) s.passo(); s.aplica({ id: n.id, t: 'nuclear', px: n.x, pz: n.z - 9000 }); s.passo();
const q = s.nukes[n.nk ? n.nk.noAr : -1]; ok(!!q && q.ativo && q.aero === 'tesourao', 'líder decolou com o modelo do caça');
const y0 = q && q.y; let fases = new Set(), maxAlas = 0; for (let i = 0; i < 60 * 25; i++) { s.passo(); if (q) fases.add(q.fase); maxAlas = Math.max(maxAlas, s.nukes.filter((w) => w.ativo && q && w.lider === q.idx).length); }
ok(q && q.y > y0 + 100, `subiu: ${y0 && y0.toFixed(1)} m → ${q && q.y.toFixed(0)} m; fases ${[...fases].join(',')}`); ok(maxAlas === 2, `esquadrilha de 3 (alas no ar: ${maxAlas})`);
ok(s.nukes.filter((w) => w.lider === (q && q.idx)).every((w) => w.aero === 'tesourao'), 'alas com o mesmo caça');
ok(q && q.vidaMax > 0 && q.vida === q.vidaMax, `vida própria ${q && q.vida}/${q && q.vidaMax}`);
/* IA com alvo travado: mísseis só dentro do alcance real (90% de 9 km), com o alvo à frente */
{ const s2 = new Sim({ arena: ARENA, seed: 4 }); s2.ameacas.ligadas = 0; const m = s2.adicionaNavio('azul', 'megabase', P0.x, P0.z + 4000, 0, 'jogador', { aeroPrin: { id: 'caca', heli: 'caca', nk: 1, nkMis: { n: 4, alc: 9000, dano: 20, nome: 'Antinavio leve' } } });
  const e = s2.adicionaNavio('vermelho', 'cruzador', P0.x, P0.z - 16000, 0, 'bot'); e.telAlvo = 0; for (let i = 0; i < 30; i++) s2.passo(); s2.aplica({ id: m.id, t: 'nuclear', alvo: e.id }); s2.passo(); const q2 = s2.nukes[m.nk.noAr]; const tiros = []; const ev0 = s2.evento.bind(s2);
  s2.evento = (x) => { if (x.t === 'hdMissil' && x.idx === q2.idx) tiros.push(Math.hypot(e.x - q2.x, e.z - q2.z)); return ev0(x); }; for (let i = 0; i < 60 * 70 && tiros.length < 4; i++) s2.passo();
  ok(tiros.length >= 2 && tiros.every((d) => d <= 9000 * 0.9 + 1), `IA disparou ${tiros.length} mísseis a ${tiros.map((d) => (d / 1000).toFixed(1)).join(', ')} km (alcance 9 km)`); }
/* FLARE automático: SAM a 1,5 s do impacto → solta isca sozinho */
if (q) { const fl0 = q.fl ?? 6; q.tFlareCd = 0; q.tFlareAte = 0; q.sams.push({ t: s.t + 1.5, por: 0 }); s.passo(); ok((q.fl ?? 6) === fl0 - 1 && q.tFlareAte > s.t, `flare automático com míssil chegando (${fl0} → ${q.fl})`); }
process.exit(falhas ? 1 : 0);
