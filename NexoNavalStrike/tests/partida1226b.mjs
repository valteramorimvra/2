import { criaSessao } from '../src/sim/session.js';
import { ORDEM_MAPAS } from '../src/sim/maps.js';
import { IDS_1226 } from '../src/sim/classes1226.js';
const t0 = Date.now();
(process.argv[2] ? process.argv[2].split(',') : IDS_1226).forEach((k, i) => { const mapa = ORDEM_MAPAS[(i * 3) % ORDEM_MAPAS.length]; const S = criaSessao({ mapa, modo: 'frota', classe: k, seed: 900 + i * 13, jogadorOpc: { comandante: 'Cap. Amorim' } }); const sim = S.sim, eu = S.jogador; let nan = 0, ff = 0; const ev = {}; const tipos = {}; let maxAr = 0;
  S.comando({ t: 'auto', v: 1 }); S.comando({ t: 'telegrafo', v: 3 }); S.comando({ t: 'sam', v: 1 });
  const vida0 = new Map(sim.navios.map((n) => [n, n.vida]));
  for (let j = 0; j < 300 * 60 && !sim.fim; j++) { sim.passo(S.net.coletar(sim.tick + 1)); for (const e of sim.eventos) { ev[e.t] = (ev[e.t] || 0) + 1; } sim.eventos.length = 0;
    if (j % 60 === 0) { let ar = 0; for (const i of eu.helis || []) { const h = sim.helis[i]; if (h.estado >= 1) { ar++; tipos[h.modelo] = (tipos[h.modelo] || 0) + 1; } } maxAr = Math.max(maxAr, ar); for (const n of sim.navios) if (!Number.isFinite(n.x + n.z + n.v + n.vida)) nan++; for (const h of sim.helis) if (h.ativo && !Number.isFinite(h.x + h.y + h.z)) nan++; } }
  console.log(k, mapa, 'fim', sim.fim ? 'sim' : 'não', 't', (sim.tick / 60).toFixed(0) + 's', 'NaN', nan, 'helis', (eu.helis || []).length, 'maxNoAr', maxAr, 'tipos', Object.keys(tipos).join('/'), 'reserva', eu.reservaAr ?? '-', 'vida', eu.vida.toFixed(0), 'ev', JSON.stringify(Object.fromEntries(Object.entries(ev).filter(([a]) => /tiro|missil|ciws|sam|reservaAr|afund|abat|decol|pous/i.test(a)))));
});
console.log('ms', Date.now() - t0);
