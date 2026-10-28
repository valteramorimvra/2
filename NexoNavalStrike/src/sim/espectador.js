// v1.2.16 item 28: modo ESPECTADOR depois que o navio do jogador afunda.
// Pronto para o online futuro: a "fonte de controle" de cada navio é abstraída (IA hoje; jogador remoto no futuro).
// Nenhuma rede aqui. O espectador só escolhe QUEM observar; não envia comandos.
export const FONTE = Object.freeze({ IA: 'ia', LOCAL: 'local', REMOTO: 'remoto' });
/** Fonte de controle de um navio. Hoje: o navio do jogador é LOCAL; os demais são IA. No online, `n.remoto` (id do par) → REMOTO. */
export function fonteControle(n, eu) { if (n && n.remoto != null) return FONTE.REMOTO; return n === eu ? FONTE.LOCAL : FONTE.IA; }
export const ROTULO_FONTE = { ia: 'IA no comando', local: 'você', remoto: 'jogador remoto' };
export class Espectador {
  constructor(time, eu) { this.time = time; this.eu = eu; this.id = -1; this.trocas = 0; }
  /** Aliados que ainda combatem (mercantes não contam como observáveis). */
  aliados(sim) { const r = []; for (const n of sim.navios) if (n.time === this.time && n !== this.eu && !n.morto && !(n.C && n.C.mercante)) r.push(n); return r; }
  /** Navio observado; se o atual afundou, passa automaticamente para o próximo vivo. */
  alvo(sim) { const n = this.id >= 0 ? sim.navios[this.id] : null; if (n && !n.morto) return n; const l = this.aliados(sim); if (!l.length) return null; const prox = l.find((q) => q.id > this.id) || l[0]; if (this.id !== prox.id) { this.id = prox.id; this.trocas++; } return prox; }
  /** ◀ (dir = -1) / ▶ (dir = +1) entre os aliados vivos. */
  alterna(sim, dir) { const l = this.aliados(sim); if (!l.length) return null; let i = l.findIndex((q) => q.id === this.id); i = i < 0 ? 0 : (i + (dir < 0 ? -1 : 1) + l.length) % l.length; this.id = l[i].id; return l[i]; }
}
