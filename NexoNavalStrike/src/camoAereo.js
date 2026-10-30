// v1.2.17 item 1 (13i): camuflagens das AERONAVES (helicópteros, caças VTOL, aviões) — esquemas de pintura reais genéricos de aviação naval,
// em dois tons (superior/inferior); escolhidas no estaleiro (aba Helicópteros) e na Batalha Personalizada. Sem custo, puramente visual.
// v1.2.69 (Valter): padrões de verdade (p: manchas · fragmentos · digital · ondas) com 3 cores (c, c3, c2) e ventre claro (cv), para TODAS
// as aeronaves — caças, helicópteros, drones, bombardeiros e hidroaviões (aba PINTURA do hangar). Continuam sem bônus: só visual.
export const CAMO_AEREO = {
  padrao: { nome: 'Cinza naval', c: '#5d6870', c2: '#47525a' },
  baixa: { nome: 'Baixa visibilidade', c: '#8d969d', c2: '#727b83' },
  oceano: { nome: 'Azul oceânico', c: '#3e5468', c2: '#2d3e4f' },
  oliva: { nome: 'Verde-oliva', c: '#4b5740', c2: '#39432f' },
  areia: { nome: 'Areia', c: '#a1906f', c2: '#817257' },
  noturno: { nome: 'Noturno', c: '#2c3138', c2: '#1f2329' },
  atlantico: { nome: 'Ondas do Atlântico', p: 'ondas', c: '#4f6f8f', c3: '#6f8fae', c2: '#2f4a66', cv: '#b9c7d3' },
  fragmentos: { nome: 'Fragmentos navais', p: 'fragmentos', c: '#5b6670', c3: '#7d8890', c2: '#3f4850', cv: '#a9b2b9' },
  digital: { nome: 'Digital marítimo', p: 'digital', c: '#56636e', c3: '#76828c', c2: '#3a444d', cv: '#a3adb5' },
  selva: { nome: 'Selva tropical', p: 'manchas', c: '#4a5a3a', c3: '#6b5a3e', c2: '#2f3a28', cv: '#9aa58f' },
  deserto: { nome: 'Deserto tricolor', p: 'manchas', c: '#b09a74', c3: '#8c7452', c2: '#cdb98f', cv: '#d8d0bd' },
  artico: { nome: 'Ártico', p: 'fragmentos', c: '#d9dee2', c3: '#a9b2ba', c2: '#7c8790', cv: '#e6eaed' },
  agressor: { nome: 'Agressor azul', p: 'fragmentos', c: '#8aa0b8', c3: '#5d7891', c2: '#c3cfdb', cv: '#d4dce4' },
};
export const ORDEM_CAMO_AEREO = Object.keys(CAMO_AEREO);
