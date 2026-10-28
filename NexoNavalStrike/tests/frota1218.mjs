// v1.2.18 item 8: modo ORIGINAL (frota padrão, não personalizado) = exatamente 8 COMBATENTES por lado (você + 7 × 8), em todas as arenas,
// com/sem porta-aviões, composição mista ou fixa, com mercantes (não combatentes, comboio) — e nunca surge navio novo durante a partida.
import { criaSessao } from '../src/sim/session.js';
import { ORDEM_MAPAS } from '../src/sim/maps.js';
const falhas = []; let n = 0; const linhas = [];
for (const mapa of ORDEM_MAPAS) for (const [classe, seed, pa, mista] of [['destroier', 3, false, true], ['fragata', 7, true, true], ['cruzador', 11, false, false], ['corveta', 19, true, false]]) {
  const S = criaSessao({ mapa, modo: 'frota', classe, seed, portaAvioes: pa, mista, mercantes: true }); const sim = S.sim;
  const conta = () => { const c = { azul: 0, vermelho: 0, mAzul: 0, mVerm: 0 }; for (const q of sim.navios) { if (q.C.mercante) q.time === 'azul' ? c.mAzul++ : c.mVerm++; else c[q.time]++; } return c; };
  const c0 = conta(), N0 = sim.navios.length; for (let k = 0; k < 60 * 30; k++) sim.passo([]); const c1 = conta(); n++;
  linhas.push(`${mapa.padEnd(12)} ${classe.padEnd(9)} PA=${pa ? 1 : 0} mista=${mista ? 1 : 0}  combatentes ${c0.azul}×${c0.vermelho} (após 60 s: ${c1.azul}×${c1.vermelho}; navios ${N0}→${sim.navios.length})  mercantes ${c0.mAzul}+${c0.mVerm} (não combatentes)`);
  if (c0.azul !== 8 || c0.vermelho !== 8) falhas.push(`${mapa}/${classe}/PA${pa}: ${c0.azul}×${c0.vermelho}`); if (sim.navios.length !== N0) falhas.push(`${mapa}: navios surgiram durante a partida ${N0}→${sim.navios.length}`);
  if (!sim.navios.some((q) => q.papel === 'jogador' && q.time === 'azul')) falhas.push(mapa + ': sem jogador no lado azul'); }
console.log(linhas.join('\n')); console.log(falhas.length ? 'FALHAS:\n - ' + falhas.join('\n - ') : `OK frota1218: ${n} partidas em ${ORDEM_MAPAS.length} arenas, 8×8 combatentes sempre`);
process.exit(falhas.length ? 1 : 0);
