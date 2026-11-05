// v1.2.19 item 6: 8×8 SEMPRE — conta os cascos por lado (guerra + mercantes + porta-aviões) em todos os caminhos de criação de partida do app
// (frota padrão do botão BATALHA = mercantes:true, com/sem porta-aviões, todos os mapas; personalizada com presets grandes/antigos; duelo).
import { criaSessao } from '../src/sim/session.js'; import { ORDEM_MAPAS } from '../src/sim/maps.js'; import { ORDEM_CLASSES, CLASSES } from '../src/sim/classes.js';
let f = 0, n = 0; const conta = (s) => { const c = { azul: 0, vermelho: 0 }; for (const q of s.sim.navios) c[q.time]++; return c; };
const caso = (nome, opc, max = 8) => { n++; let s; try { s = criaSessao(opc); } catch (e) { f++; console.log('FALHA', nome, e.message); return; } const c = conta(s); if (c.azul > max || c.vermelho > max || c.azul < 1 || c.vermelho < 1) { f++; console.log('FALHA', nome, JSON.stringify(c)); } return c; };
const bons = ORDEM_CLASSES.filter((k) => !CLASSES[k].mercante); const exemplo = {};
for (const mapa of ORDEM_MAPAS) for (const pa of [false, true]) for (const merc of [true, false]) for (const classe of ['destroier', 'capitania', 'trajano', 'horizonte']) { const c = caso(`frota ${mapa} pa=${pa} merc=${merc} ${classe}`, { mapa, modo: 'frota', classe, portaAvioes: pa, mercantes: merc, mista: true, seed: 7 }); if (c && c.azul === 8 && c.vermelho === 8) exemplo.frota = (exemplo.frota || 0) + 1; }
const lista = (k) => Array.from({ length: k }, (_, i) => ({ tipo: bons[(i * 7) % bons.length], perso: 'agressivo' }));
for (const merc of [1, 0]) for (const [na, nv] of [[11, 11], [9, 10], [7, 8], [3, 2], [0, 0]]) caso(`pers azul=${na} verm=${nv} merc=${merc}`, { mapa: 'arquipelago', modo: 'frota', classe: 'destroier', mercantes: !!merc, pers: { azul: lista(na), vermelho: lista(nv), mar: 3, duracao: 10 } });
caso('duelo', { mapa: 'arquipelago', modo: 'duelo', classe: 'destroier', classeRival: 'fragata', mercantes: true }, 2);
console.log(`${n} partidas criadas · ${f} acima de 8 por lado · frota completa 8×8 em ${exemplo.frota || 0}`); console.log(f ? 'RESULTADO: FALHA' : 'RESULTADO: TUDO OK'); process.exit(f ? 1 : 0);
