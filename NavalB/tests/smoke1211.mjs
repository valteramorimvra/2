// v1.2.11: partida 8×8 com porta-aviões + mercantes, jogador em cada lendário — sem NaN, caças voam, laser engaja, mercantes afundáveis
import { criaSessao } from '../src/sim/session.js';
import { LENDARIOS } from '../src/sim/classes.js';
const out = []; const SEG = +(process.argv[2] || 240);
for (const [i, k] of [...LENDARIOS, 'horizonte'].entries()) { const S = criaSessao({ mapa: ['arquipelago', 'estreito', 'atois', 'fiordes', 'guanabara', 'santos'][i % 6], modo: 'frota', classe: k, seed: 7 + i, portaAvioes: true, mercantes: true }); const s = S.sim;
  s.navios[S.match.jogadorId].controleIA = 1; const ev = {}; let jatos = 0, laser = 0, nan = 0; const t0 = Date.now();
  for (let f = 0; f < 60 * SEG && !s.fim; f++) { S.avanca(1 / 60); for (const e of s.eventos) ev[e.t] = (ev[e.t] || 0) + 1; s.eventos.length = 0;
    if (f % 60 === 0) { for (const h of s.helis) if (h.ativo && h.H.aviao && h.estado === 3) jatos++; for (const n of s.navios) { if (n.lasers) for (const L of n.lasers) if (L.on) laser++; if (!Number.isFinite(n.x + n.z + n.vida)) nan++; } } }
  const merc = s.navios.filter((n) => n.C.mercante); out.push(`${k}: ${s.navios.length} navios (${merc.length} mercantes, ${s.navios.filter((n) => n.C.porta).length} porta-aviões), ${((Date.now() - t0) / 1000).toFixed(1)} s CPU p/ ${s.t.toFixed(0)} s; jato-voo·s ${jatos}; laser·s ${laser}; mercantes afundados ${ev.mercanteAfundado || 0}; aeronaves abatidas ${ev.heliAbatido || 0}; mísseis abatidos ${ev.missilAbatido || 0}; afunda ${ev.afunda || 0}; NaN ${nan}${s.fim ? ' · fim: ' + s.fim.motivo : ''}`);
  if (nan) process.exitCode = 1; }
console.log(out.join('\n'));
