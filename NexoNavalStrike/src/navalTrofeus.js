// v1.2.0 — Medalhas por batalha + SALA DE TROFÉUS (progresso acumulado bronze → prata → ouro). Perfil local.
export const MEDALHAS = {
  primeiro_sangue: { nome: 'Primeiro Dano', desc: 'Primeiro acerto de dano da partida', icone: '💥', cor: '#ef4444', teste: (s) => s.primeiroDano },
  muralha: { nome: 'Muralha', desc: '5+ mísseis/drones abatidos por CIWS/SAM numa batalha', icone: '🛡', cor: '#38bdf8', teste: (s) => (s.intercept || 0) + (s.menores || 0) >= 5 },
  cacador_submersos: { nome: 'Caçador de Submersos', desc: '2+ acertos de torpedo numa batalha', icone: '≋', cor: '#22c55e', teste: (s) => (s.torpAcertos || 0) >= 2 },
  sobrevivente: { nome: 'Sobrevivente', desc: 'Vencer com menos de 20% do casco', icone: '⚓', cor: '#f59e0b', teste: (s, r) => r.vitoria === true && r.vidaFinal > 0 && r.vidaFinal < 0.2 },
  artilheiro_elite: { nome: 'Artilheiro de Elite', desc: '20+ acertos de canhão com 30%+ de precisão', icone: '◎', cor: '#f59e0b', teste: (s) => (s.acertos || 0) >= 20 && s.acertos / Math.max(1, s.tiros) >= 0.3 },
  ceifador: { nome: 'Almirante da Frota', desc: '3+ navios afundados numa batalha', icone: '♛', cor: '#d4af37', teste: (s) => (s.abates || 0) >= 3 },
  casco_aco: { nome: 'Casco de Aço', desc: 'Vencer perdendo menos de 25% do casco', icone: '▣', cor: '#94a3b8', teste: (s, r) => r.vitoria === true && r.vidaFinal >= 0.75 },
  ilusionista: { nome: 'Mestre das Iscas', desc: '3+ mísseis seduzidos por iscas', icone: '✶', cor: '#a78bfa', teste: (s) => (s.seduzidos || 0) >= 3 },
  olho_do_ceu: { nome: 'Vigia Aéreo', desc: '3+ inimigos revelados por helicóptero/VANT', icone: '◉', cor: '#38bdf8', teste: (s) => (s.avistAereo || 0) >= 3 },
  asa_rotativa: { nome: 'Asa Rotativa', desc: 'Helicóptero acerta míssil/torpedo/foguetes ou derruba aeronave', icone: '✈', cor: '#22c55e', teste: (s) => (s.heliAcertos || 0) >= 1 || (s.helisAbatidos || 0) >= 1 },
  bombeiro: { nome: 'Bombeiro do Mar', desc: '2 reparos de emergência e sobreviveu', icone: '✚', cor: '#ef4444', teste: (s, r) => (s.reparos || 0) >= 2 && r.vidaFinal > 0 },
  bloqueio: { nome: 'Bloqueio Naval', desc: 'Afundou um navio mercante inimigo', icone: '⛴', cor: '#a855f7', teste: (s) => (s.mercantes || 0) >= 1 }, /* v1.2.11 */
  /* v1.2.62: novas medalhas de batalha */
  terror: { nome: 'Terror dos Mares', desc: '5+ navios afundados numa batalha', icone: '☠', cor: '#dc2626', teste: (s) => (s.abates || 0) >= 5 },
  as_aereo: { nome: 'Ás da Defesa Aérea', desc: '3+ aeronaves inimigas derrubadas numa batalha', icone: '✈', cor: '#0ea5e9', teste: (s) => (s.helisAbatidos || 0) >= 3 },
  guarda_chuva: { nome: 'Guarda-Chuva de Aço', desc: '12+ mísseis/drones interceptados numa batalha', icone: '☂', cor: '#38bdf8', teste: (s) => (s.intercept || 0) + (s.menores || 0) >= 12 },
  mestre_misseis: { nome: 'Mestre dos Mísseis', desc: '4+ mísseis no alvo com 60%+ de aproveitamento', icone: '➶', cor: '#f97316', teste: (s) => (s.misAcertos || 0) >= 4 && s.misAcertos / Math.max(1, s.misLanc) >= 0.6 },
  lobo_mar: { nome: 'Lobo do Mar', desc: '4+ acertos de torpedo numa batalha', icone: '≋', cor: '#16a34a', teste: (s) => (s.torpAcertos || 0) >= 4 },
  tempestade: { nome: 'Tempestade de Aço', desc: '150+ disparos de canhão numa batalha', icone: '⁂', cor: '#a3a3a3', teste: (s) => (s.tiros || 0) >= 150 },
  intocavel: { nome: 'Intocável', desc: 'Vencer sem sofrer nenhum dano', icone: '◇', cor: '#e5e7eb', teste: (s, r) => r.vitoria === true && !(s.danoRec > 0) },
  relampago: { nome: 'Vitória Relâmpago', desc: 'Vencer em menos de 5 minutos', icone: 'ϟ', cor: '#facc15', teste: (s, r) => r.vitoria === true && r.tempo > 0 && r.tempo < 300 },
  as_aviacao: { nome: 'Ás da Aviação Naval', desc: '4+ acertos das suas aeronaves numa batalha', icone: '✪', cor: '#22c55e', teste: (s) => (s.heliAcertos || 0) >= 4 },
  corsario: { nome: 'Corsário', desc: '3+ mercantes inimigos afundados numa batalha', icone: '⚑', cor: '#7c3aed', teste: (s) => (s.mercantes || 0) >= 3 },
  mvp: { nome: 'MVP', desc: 'Melhor pontuação dos 16 navios', icone: '★', cor: '#d4af37', teste: (s, r) => r.mvp },
};
export const ORDEM_MEDALHAS = Object.keys(MEDALHAS);
export const NIVEIS_TROFEU = [{ n: 1, nome: 'Bronze', cor: '#b87333' }, { n: 10, nome: 'Prata', cor: '#c0c7cf' }, { n: 50, nome: 'Ouro', cor: '#d4af37' }];
/** Pontuação de MVP (mesma fórmula para os 10 navios). */
export const pontos = (s) => Math.round((s.dano || 0) * 10 + (s.abates || 0) * 600 + (s.intercept || 0) * 120 + (s.menores || 0) * 80 + (s.misAcertos || 0) * 50 + (s.torpAcertos || 0) * 80 + (s.mercantes || 0) * 400);
export function medalhasDe(stats, r) { return ORDEM_MEDALHAS.filter((k) => { try { return !!MEDALHAS[k].teste(stats, r); } catch { return false; } }); }
export function nivelTrofeu(qtd) { let atual = null, prox = NIVEIS_TROFEU[0]; for (const t of NIVEIS_TROFEU) { if (qtd >= t.n) atual = t; else { prox = t; break; } } if (atual && atual === NIVEIS_TROFEU[NIVEIS_TROFEU.length - 1]) prox = null; return { atual, prox }; }
