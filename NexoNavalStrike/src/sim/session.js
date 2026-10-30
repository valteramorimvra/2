// Sessão de jogo: laço de passo FIXO (60 Hz) independente da taxa de quadros. O render interpola/acompanha.
import { Sim, DT } from './world.js';
import { MatchManager } from './match.js';
import { criaArena, MAPAS } from './maps.js';
import { defineMar } from './ocean.js';
import { LocalBotAdapter } from '../net/NetAdapter.js';

export function criaSessao({ mapa = 'arquipelago', modo = 'frota', classe = 'destroier', hora, tempo, seed = 1234, adapter = null, classeRival = null, jogadorOpc = null, mista = true, portaAvioes = false, mercantes = false, pers = null }) {
  const M = MAPAS[mapa]; const T = criaArena(mapa, pers && (pers.ilhas > 0 || pers.plataformas > 0) ? { ilhas: +pers.ilhas || 0, tam: pers.ilhasTam, pos: pers.ilhasPos, plataformas: +pers.plataformas || 0, seed } : null); /* v1.2.17 item 1 (13a) */ hora = hora || M.hora; tempo = tempo || M.tempo;
  defineMar(modo === 'treino' ? 1 : pers && pers.mar ? +pers.mar : tempo === 'chuva' ? Math.max(M.bf, 4) : M.bf, 0.6 + (seed % 7) * 0.3); /* v1.2.5: teste drive em mar calmo */
  const sim = new Sim({ arena: T, seed, hora, tempo }); sim.nkBotAtomica = pers && pers.nukeBot === 'ligada' ? 1 : 0; /* v1.2.29 (Valter 15:11/15:12): computador sem bomba atômica, salvo na personalizada com a opção ligada */ const match = new MatchManager({ modo, classeJogador: classe, classeRival, jogadorOpc, mista, portaAvioes, mercantes, pers }).monta(sim);
  const net = adapter || new LocalBotAdapter(); net.iniciar(sim);
  return { sim, match, net, T, jogador: sim.navios[match.jogadorId], acc: 0,
    /** avança o tempo real `dt` (s) em passos fixos; no máximo 6 passos por quadro (evita espiral em aparelho lento) */
    avanca(dt) { if (sim.fim) return 0; this.acc = Math.min(this.acc + dt, DT * 6); let k = 0; while (this.acc >= DT && net.pronto(sim.tick + 1)) { const c = net.coletar(sim.tick + 1); if (c == null) break; sim.passo(c); this.acc -= DT; k++; if (sim.fim) break; } return k; },
    comando(c) { const j = this.jogador; if (j && j.apAlvo >= 0 && j.controle < 0 && (c.t === 'leme' || c.t === 'telegrafo' || c.t === 'rumo')) net.enviar({ id: j.id, t: 'engajar', v: 0, alvo: -1 }); /* v1.2.67: o SEU leme/telégrafo/rumo desliga o piloto automático ofensivo (os comandos da IA não passam por aqui) */ net.enviar({ id: j.id, ...c }); } };
}
