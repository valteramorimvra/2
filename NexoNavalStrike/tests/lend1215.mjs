// v1.2.15 (U) — camuflagens LENDÁRIAS: 3, nomes originais, ouro > qualquer outra pintura, +50% em TODOS os atributos, nunca nos bots, efeito no sim
import { PINTURAS, PINTURAS_COMPRAVEIS, modsDe, pinturaBot } from '../src/navalTechTreeEconomy.js';
import { CLASSES, ORDEM_CLASSES } from '../src/sim/classes.js';
import { criaSessao } from '../src/sim/session.js';
let f = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FALHA ') + m); if (!c) f++; };
const L = Object.keys(PINTURAS).filter((p) => PINTURAS[p].lendaria);
ok(L.length >= 3 && L.filter((p) => PINTURAS[p].nacional).length >= 5, `lendárias (${L.length}, 5 nacionais v1.2.19): ${L.map((p) => PINTURAS[p].nome).join(' / ')}`);
const maxOutra = Math.max(...Object.keys(PINTURAS).filter((p) => !PINTURAS[p].lendaria).map((p) => PINTURAS[p].ouro || 0));
ok(L.every((p) => PINTURAS[p].ouro > maxOutra), `ouro mín. lendária ${Math.min(...L.map((p) => PINTURAS[p].ouro))} > máx. outra ${maxOutra}`);
ok(L.every((p) => PINTURAS_COMPRAVEIS.includes(p)), 'compráveis no estaleiro');
const b = modsDe('destroier', {}), m = modsDe('destroier', { pintura: L[0] });
const maior = ['radar', 'trava', 'vmax', 'acel', 'giro', 'misVel', 'torpDano', 'ciwsTaxa', 'samPk', 'heliFuel'], menor = ['cad', 'disp', 'rcs', 'avarias'];
ok(maior.every((a) => Math.abs(m[a] / b[a] - 1.5) < 1e-9) && Math.abs((m.vida || 1) - 1.5) < 1e-9 && Math.abs(m.dano - 1.5) < 1e-9, '+50%: ' + maior.concat(['vida', 'dano']).join(','));
ok(menor.every((a) => Math.abs(b[a] / m[a] - 1.5) < 1e-9), '+50% (menor é melhor ÷1,5): ' + menor.join(','));
let usados = 0; for (let s = 0; s < 400; s++) for (let i = 0; i < 16; i++) for (const k of ORDEM_CLASSES.slice(0, 6)) if (PINTURAS[pinturaBot(s, i, k)].lendaria) usados++;
ok(usados === 0, `bots nunca recebem lendária (${usados} em 38.400 sorteios)`);
// efeito real no sim: vida e cadência
const S0 = criaSessao({ modo: 'duelo', mapa: 'atois', classe: 'destroier', seed: 3 }), S1 = criaSessao({ modo: 'duelo', mapa: 'atois', classe: 'destroier', seed: 3, jogadorOpc: { mods: m, pintura: L[0] } });
const n0 = S0.jogador, n1 = S1.jogador;
ok(n1.mods && n1.mods.lendaria === 1, 'mods chegam ao navio do jogador');
ok(Math.abs(n1.C.vida / n0.C.vida - 1.5) < 0.02, `vida máx. ${n0.C.vida} → ${n1.C.vida}; vmax ${n0.C.vmax.toFixed(1)} → ${n1.C.vmax.toFixed(1)}; recarga ${n0.C.canhao.cad.toFixed(2)} → ${n1.C.canhao.cad.toFixed(2)} s`);
const bots = S1.sim.navios.filter((q) => q !== n1); ok(bots.every((q) => !(q.mods && q.mods.lendaria)), 'IAs sem lendária');
console.log(f ? `FALHAS ${f}` : 'TUDO OK'); process.exit(f ? 1 : 0);
