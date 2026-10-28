// v1.2.17 item 1 (13i): camuflagens das AERONAVES (helicópteros, caças VTOL, aviões) — esquemas de pintura reais genéricos de aviação naval,
// em dois tons (superior/inferior); escolhidas no estaleiro (aba Helicópteros) e na Batalha Personalizada. Sem custo, puramente visual.
export const CAMO_AEREO = {
  padrao: { nome: 'Cinza naval', c: '#5d6870', c2: '#47525a' },
  baixa: { nome: 'Baixa visibilidade', c: '#8d969d', c2: '#727b83' },
  oceano: { nome: 'Azul oceânico', c: '#3e5468', c2: '#2d3e4f' },
  oliva: { nome: 'Verde-oliva', c: '#4b5740', c2: '#39432f' },
  areia: { nome: 'Areia', c: '#a1906f', c2: '#817257' },
  noturno: { nome: 'Noturno', c: '#2c3138', c2: '#1f2329' },
};
export const ORDEM_CAMO_AEREO = Object.keys(CAMO_AEREO);
