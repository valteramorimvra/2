// v1.2.26 (isolado): ala dos gigantes decola, voa, pousa; aeronave perdida é reposta da reserva após REPOE_S; sem NaN
import { criaSessao } from '../src/sim/session.js';
import { EST, REPOE_S } from '../src/naval5v5/aereo.js';
for (const k of ['chapada', 'lencois']) { const S = criaSessao({ mapa: 'florianopolis', modo: 'frota', classe: k, seed: 77, jogadorOpc: { comandante: 'Cap. Amorim' } }); const sim = S.sim, eu = S.jogador;
  S.comando({ t: 'auto', v: 1 }); S.comando({ t: 'telegrafo', v: 2 }); for (const i of eu.helis) sim.helis[i].auto = 1;
  let maxAr = 0, nan = 0, morto = null, tMorte = 0, repos = 0; const tipos = {}; const ev = {}; const r0 = eu.reservaAr;
  for (let j = 0; j < 240 * 60 && !sim.fim && !eu.morto; j++) { sim.passo(S.net.coletar(sim.tick + 1)); for (const e of sim.eventos) { ev[e.t] = (ev[e.t] || 0) + 1; if (e.t === 'reservaAr' && e.id === eu.id) repos++; } sim.eventos.length = 0;
    if (j % 30 === 0) { let ar = 0; for (const i of eu.helis) { const h = sim.helis[i]; if (h.estado >= EST.DECOLA && h.estado <= EST.POUSO) { ar++; tipos[h.modelo] = 1; } if (h.usado && !Number.isFinite(h.x + h.y + h.z)) nan++; } maxAr = Math.max(maxAr, ar);
      if (!morto && sim.t > 60) { const h = eu.helis.map((i) => sim.helis[i]).find((h) => h.estado === EST.VOO); if (h) { h.estado = EST.ABATIDO; h.vida = 0; h.tEst = 0; morto = h; tMorte = sim.t; } } } }
  console.log(k, 't', sim.t.toFixed(0) + 's', 'ala ativa', eu.helis.length, 'reserva', r0, '→', eu.reservaAr, 'repostas', repos, 'máx no ar', maxAr, '(maxAr C', eu.C.maxAr + ')', 'tipos no ar', Object.keys(tipos).join('/'), 'abatida forçada t', tMorte.toFixed(0), 'estado agora', morto ? morto.estado : '-', 'NaN', nan, 'decol', (ev.heliDecola || 0) + (ev.cacaDecolou || 0), 'pousos', ev.heliPousa || 0, 'REPOE_S', REPOE_S);
}
