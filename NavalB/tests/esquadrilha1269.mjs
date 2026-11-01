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
/* v1.2.70: helicóptero no sistema do bombardeiro — sobe na vertical, direção pelo manche, coletivo no acelerador, IA até o alvo e mísseis no alcance */
{ const s3 = new Sim({ arena: ARENA, seed: 5 }); s3.ameacas.ligadas = 0; const m = s3.adicionaNavio('azul', 'megabase', P0.x, P0.z + 4000, 0, 'jogador', { aeroPrin: { id: 'beijaflor', heli: 'beijaflor', nk: 1, nkMis: { n: 4, alc: 6000, dano: 22, nome: 'Antinavio leve' } } });
  const e = s3.adicionaNavio('vermelho', 'cruzador', P0.x, P0.z - 9000, 0, 'bot'); e.telAlvo = 0; s3.aplica({ id: m.id, t: 'nuclear', px: m.x, pz: m.z - 9000 }); s3.passo(); const h = s3.nukes[m.nk.noAr];
  const x0 = h.x, z0 = h.z, y0 = h.y; for (let i = 0; i < 60 * 3.5; i++) s3.passo(); const desl = Math.hypot(h.x - x0, h.z - z0);
  ok(h.rotor === 1 && h.y > y0 + 15 && desl < 40, `heli sobe na vertical: +${(h.y - y0).toFixed(0)} m de altura, deslocou ${desl.toFixed(0)} m (o navio anda)`);
  ok(s3.nukes.filter((w) => w.lider === h.idx && (w.ativo || w.espDec > 0)).length === 0, 'heli sai sozinho (sem alas)');
  for (let i = 0; i < 60 * 2; i++) s3.passo(); s3.aplica({ id: m.id, t: 'nkPiloto', v: 1 }); s3.passo(); h.jx = 0; h.jy = 0; h.thr = 4; const yA = h.y; for (let i = 0; i < 60 * 3; i++) s3.passo(); ok(h.y > yA + 8, `coletivo SOBE: +${(h.y - yA).toFixed(0)} m`);
  h.thr = 2; h.jx = 1; h.jy = 0; const r0 = h.rumo; for (let i = 0; i < 60 * 2; i++) s3.passo(); ok(Math.abs(h.rumo - r0) > 0.5 && h.v < 15, `direção: pairando gira ${((h.rumo - r0) * 57.3).toFixed(0)}° no próprio eixo`);
  h.jx = 0; h.jy = 1; for (let i = 0; i < 60 * 12; i++) s3.passo(); ok(h.v > 30 && h.v <= h.H.vmax + 1, `cíclico à frente: ${(h.v * 3.6).toFixed(0)} km/h (máx ${(h.H.vmax * 3.6).toFixed(0)})`);
  const tiros = []; const ev0 = s3.evento.bind(s3); s3.evento = (x) => { if (x.t === 'hdMissil' && x.idx === h.idx) tiros.push(Math.hypot(e.x - h.x, e.z - h.z)); return ev0(x); };
  s3.aplica({ id: m.id, t: 'nkTrava', alvo: e.id }); s3.aplica({ id: m.id, t: 'nkPiloto', v: 0 }); for (let i = 0; i < 60 * 120 && !tiros.length; i++) s3.passo();
  ok(tiros.length > 0 && tiros[0] <= 6000 * 0.9 + 1, `piloto automático levou o heli ao alvo e disparou a ${tiros.length ? (tiros[0] / 1000).toFixed(1) : '—'} km (alcance 6 km)`); }
/* Urubu-rei do PORTA-AVIÕES (Lençóis) intocado: sem vida própria, sem flare automático, sem mísseis, voo e altitude do bombardeiro */
{ const s4 = new Sim({ arena: ARENA, seed: 6 }); s4.ameacas.ligadas = 0; const pa = s4.adicionaNavio('azul', 'lencois', P0.x, P0.z, 0, 'jogador'); for (let i = 0; i < 60 * 16; i++) s4.passo(); s4.aplica({ id: pa.id, t: 'nuclear', px: pa.x, pz: pa.z - 12000 }); s4.passo(); const b = s4.nukes[pa.nk.noAr];
  ok(!!b && !b.aero && !b.vidaMax && !b.misseis && !b.rotor, 'Urubu-rei do porta-aviões: sem vida própria, sem mísseis, modelo original');
  for (let i = 0; i < 60 * 30; i++) s4.passo(); const fl0 = b.fl ?? 6; b.sams.push({ t: s4.t + 1, por: 0 }); s4.passo(); ok((b.fl ?? 6) === fl0, 'Urubu-rei do porta-aviões: sem flare automático (só no botão)');
  ok(Math.abs(b.y - 1253.6) < 0.5, `Urubu-rei do porta-aviões com a MESMA trajetória da 1.2.68: ${b.y.toFixed(1)} m após 30 s (1.2.68: 1253.6 m)`); }
process.exit(falhas ? 1 : 0);
