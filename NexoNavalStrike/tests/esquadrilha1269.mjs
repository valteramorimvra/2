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
process.exit(falhas ? 1 : 0);
