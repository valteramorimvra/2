// NetAdapter: de onde vêm os comandos de cada tick. Hoje: LocalBotAdapter (jogador local + bots SquadAI, offline).
// Futuro: RemoteAdapter (lockstep determinístico por servidor de retransmissão; só comandos trafegam, nunca o estado).
import { valida } from './commands.js';
import { SquadAI } from '../sim/ai.js';

/** Interface (documentação): todo adaptador implementa estes métodos. */
export class NetAdapter {
  /** @param {import('../sim/world.js').Sim} sim */ iniciar(sim) { this.sim = sim; }
  /** Comando do jogador local; será aplicado no tick `tick` (com atraso de entrada no online). */ enviar(cmd) { throw new Error('abstrato'); }
  /** Todos os comandos (locais + bots + remotos) que valem para o tick. Lockstep: devolve null se faltar alguém. */ coletar(tick) { throw new Error('abstrato'); }
  /** true se o tick pode avançar (online: todos os pares confirmaram o tick). */ pronto(tick) { return true; }
  fechar() {}
}

export class LocalBotAdapter extends NetAdapter {
  iniciar(sim) { super.iniciar(sim); this.fila = []; this.ias = { azul: new SquadAI('azul'), vermelho: new SquadAI('vermelho') }; this.log = []; this.gravar = false; }
  enviar(cmd) { const c = valida(cmd); if (c) this.fila.push(c); }
  coletar(tick) { const out = this.fila; this.fila = []; if (tick & 1) out.push(...this.ias.vermelho.pensa(this.sim), ...this.ias.azul.pensa(this.sim)); else out.push(...this.ias.azul.pensa(this.sim), ...this.ias.vermelho.pensa(this.sim)); /* v1.2.20: ordem de decisão das IAs alterna a cada tick (nenhum time decide sempre por último) */ if (this.gravar && out.length) this.log.push([tick, out.map((c) => ({ ...c }))]); return out; }
}

/**
 * RemoteAdapter (ESBOÇO, desativado nesta versão offline — o app não tem permissão de internet).
 * Plano: cada par envia seus comandos com atraso de entrada ATRASO ticks; o tick N só roda quando os comandos de todos os
 * pares para N chegaram; a cada 60 ticks trocam sim.hashEstado() para detectar dessincronia. Bots continuam locais e
 * determinísticos (mesma semente em todos os aparelhos).
 */
export class RemoteAdapter extends NetAdapter {
  static ATRASO = 4;
  constructor(transporte = null) { super(); this.transporte = transporte; this.pendentes = new Map(); }
  iniciar(sim) { super.iniciar(sim); if (!this.transporte) throw new Error('Modo online ainda não disponível nesta versão (offline).'); }
  enviar() { throw new Error('Modo online ainda não disponível.'); }
  coletar() { return null; }
  pronto() { return false; }
}
