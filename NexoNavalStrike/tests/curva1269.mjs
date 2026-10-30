// v1.2.69 — manche à direita: a aeronave pilotada vira à DIREITA (rumo cresce) com a asa direita BAIXA (render: rotation.z = −roll < 0).
import { Sim } from '../src/sim/world.js';
import { criaArena, ORDEM_MAPAS } from '../src/sim/maps.js';
import { EST } from '../src/naval5v5/aereo.js';
import { HELIS } from '../src/sim/classes.js';
const ARENA = criaArena(ORDEM_MAPAS[0]); const P0 = ARENA.plano.centro; let falhas = 0;
for (const mod of ['caca', 'ataque']) { const s = new Sim({ arena: ARENA, seed: 5 }); s.revelaTudo = 1; s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const h = s.helis[n.helis[0]];
  Object.assign(h, { modelo: mod, H: HELIS[mod], estado: EST.VOO, ativo: 1, ctrl: 'jog', y: 400, alt: 400, comb: 1e5, rumo: 0, roll: 0, pitch: 0, vx: 0, vz: HELIS[mod].aviao ? -150 : -30, v: HELIS[mod].aviao ? 150 : 30, jx: 1, jy: HELIS[mod].aviao ? 0 : 1, thr: 2 }); n.controle = 0;
  let r0 = h.rumo, zMin = 0; for (let i = 0; i < 60 * 3; i++) { s.passo(); zMin = Math.min(zMin, -(h.roll || 0)); }
  const dr = ((h.rumo - r0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI, ok = dr > 0.05 && zMin < -0.1; if (!ok) falhas++;
  console.log(`${ok ? 'OK ' : 'FALHA'} ${mod}: rumo +${(dr * 57.3).toFixed(0)}° · rotação z do modelo ${(zMin * 57.3).toFixed(0)}° (negativa = asa direita baixa)`); }
/* vida própria considerável (×3) e REPARO da aeronave do jogador (2 usos, cura 45%, recarga 30 s) */
{ const s = new Sim({ arena: ARENA, seed: 7 }); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const h = s.helis[n.helis[0]]; const base = HELIS[h.modelo].vida;
  Object.assign(h, { estado: EST.VOO, ativo: 1, ctrl: 'jog', y: 300, alt: 300, comb: 1e5 }); n.controle = 0; const vMax = h.H.vida; h.vida = vMax * 0.3;
  s.aplica({ id: n.id, t: 'aeroReparo', k: 0 }); s.passo(); const v1 = h.vida; s.aplica({ id: n.id, t: 'aeroReparo', k: 0 }); s.passo(); const v2 = h.vida; /* recarregando: não cura */
  const ok = vMax === base * 5 && Math.abs(v1 - vMax * 0.75) < 1 && v2 === v1 && h.rep === 1; if (!ok) falhas++;
  console.log(`${ok ? 'OK ' : 'FALHA'} vida ${base} → ${vMax}; reparo 30% → ${Math.round(v1 / vMax * 100)}%; 2º toque na recarga sem efeito; restam ${h.rep}`); }
process.exit(falhas ? 1 : 0);
