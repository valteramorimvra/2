// v1.2.99 — camuflagens de navio também nas aeronaves (não remove as de avião).
import { CAMO_AEREO, ORDEM_CAMO_AEREO } from './camoAereo.js';
import { PINTURAS } from './navalTechTreeEconomy.js';

const PAD = { 1: 'fragmentos', 2: 'ondas', 3: 'digital', 4: 'manchas' };
for (const k of Object.keys(PINTURAS)) {
  const id = 'nv_' + k;
  if (CAMO_AEREO[id]) continue;
  const P = PINTURAS[k], cores = P.cores || [];
  const c0 = cores[0] || '#7b8084', c1 = cores[1] || c0, c2 = cores[2] || c0;
  CAMO_AEREO[id] = { nome: P.nome, p: PAD[P.tipo] || 'ondas', c: c0, c2: c1, c3: c2, cv: c2, navio: 1 };
  ORDEM_CAMO_AEREO.push(id);
}
