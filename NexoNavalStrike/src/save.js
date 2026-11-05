// Perfil e ajustes (módulo ISOLADO de persistência). Hoje: localStorage do aparelho. Amanhã: pode sincronizar com um
// servidor sem tocar no resto do jogo (basta trocar Armazem). Nenhum dado sai do aparelho nesta versão.
const CHAVE = 'nns_v1';
const PADRAO = {
  versao: 1,
  ajustes: { dof: true /* v1.2.17 itens 3/4 */, dev: true, vozes: true, numDano: true, lemeRetorno: true, qualidade: 'auto', sens: 1, volSom: 0.9, volMusica: 0.6, volCanhoes: 1, volLanc: 1, volImp: 1, volAmb: 1 /* v1.2.23 item 5: barramentos */, miraLivre: false, avisos: true, avisosNav: true, avisosDet: true, avisosArmas: true, avisosDano: true, avisosDefesa: true, avisosObj: true, avisosVoz: true, /* v1.2.14 item 17 */ volSomRevisto: 0, som: true, efDefesa: 'reduzido', rumoToque: true, zoomCam: 1, canhoto: false, dicas: true, vibrar: true, tremorAtingido: true /* v1.2.21 item 13 */, arcoPrev: false /* v1.2.24 item 3: desligado por padrão (opção nos Ajustes) */, travaSegue: true /* v1.2.24 item 6 */ /* v1.2.21 item 14e */, camAuto: true, autoMira: false, autoMiraV121: 0, camModo: 'perto', hudLayout: null, portoAuto: true },
  perfil: { nome: 'Comandante', partidas: 0, vitorias: 0, derrotas: 0, empates: 0, abates: 0, tiros: 0, acertos: 0, misseis: 0, misAcertos: 0, intercept: 0, tempo: 0, tutorialVisto: false },
  ultimo: { classe: 'destroier', mapa: 'arquipelago', modo: 'frota', hora: 'auto', tempo: 'auto' },
  economia: null,
  pers: null, presets: null, /* v1.2.18 item 10: batalha personalizada e presets (objetos) agora PERSISTEM no save — antes eram descartados ao reabrir o app */
};
const clone = (o) => JSON.parse(JSON.stringify(o));
function mescla(base, o) { for (const k of Object.keys(base)) if (o && k in o) { if (typeof base[k] === 'object' && base[k] && !Array.isArray(base[k])) mescla(base[k], o[k]); else if (typeof o[k] === typeof base[k]) base[k] = o[k]; }
  /* v1.2.16: preferências gravadas que não estão no PADRÃO (musicaOn, portoVista, vitrineHora, …) eram DESCARTADAS ao recarregar — agora preservadas (só valores simples) */
  if (o && typeof o === 'object' && !Array.isArray(o)) for (const k of Object.keys(o)) if (!(k in base) && (o[k] === null || ['boolean', 'number', 'string'].includes(typeof o[k]))) base[k] = o[k];
  return base; }
export const Armazem = {
  ler() { try { return JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { return null; } },
  gravar(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); return true; } catch (e) { return false; } },
};
export class Save {
  constructor(armazem = Armazem) { this.a = armazem; this.d = mescla(clone(PADRAO), this.a.ler()); this.migra121(); this.migra1218(); this.migra1224(); }
    /** v1.2.1: a AUTO-MIRA antiga podia ser ligada/acionada pelo radar — a preferência antiga é DESLIGADA uma única vez; depois vale o que o jogador escolher (salvo). */
  /** v1.2.18 item 6: música de abertura padrão = a ORIGINAL (primeira trilha do jogo, "The Final Battle"). Instalação nova já nasce com 'atual';
   *  quem atualiza volta UMA vez para a original (não há como saber se a escolha anterior foi explícita). Depois disso a escolha nos Ajustes persiste. */
  /** v1.2.24 item 3: arco do tiro previsto passa a vir DESLIGADO (uma única vez; depois vale a escolha do jogador). */
  migra1224() { const a = this.d.ajustes; if (!a.arcoV1224) { a.arcoPrev = false; if (a.travaSegue == null) a.travaSegue = true; a.arcoV1224 = 1; if (this.a.gravar) this.a.gravar(this.d); } }
  migra1218() { const a = this.d.ajustes; if (!a.musicaV1218) { a.musicaEstilo = 'atual'; a.musicaV1218 = 1; if (this.a.gravar) this.a.gravar(this.d); } }
  migra121() { const a = this.d.ajustes; if (!a.autoMiraV121) { a.autoMira = false; a.autoMiraV121 = 1; if (this.a.gravar) this.a.gravar(this.d); } }
  get ajustes() { return this.d.ajustes; } get perfil() { return this.d.perfil; } get ultimo() { return this.d.ultimo; }
  salva() { this.a.gravar(this.d); }
  /** Registra o resultado de uma partida. */
  registraPartida(r) { const p = this.d.perfil; p.partidas++; if (r.vitoria === true) p.vitorias++; else if (r.vitoria === false) p.derrotas++; else p.empates++; for (const k of ['abates', 'tiros', 'acertos', 'misseis', 'misAcertos', 'intercept']) p[k] += r[k] || 0; p.tempo += r.tempo || 0; this.salva(); }
  reinicia() { this.d = clone(PADRAO); this.salva(); }
}
