// Teste node da FRAGATA LENDÁRIA AMORIM (v1.3.02) sobre a simulação real + regressão do Amorim.
import { CLASSES, LENDARIOS, ORDEM_CLASSES } from '../src/sim/classes.js';
import { criaSessao } from '../src/sim/session.js';
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } else console.log('OK', m); };
const C = CLASSES.fragata_amorim;
ok(C && C.lendario && C.num === 'L 09' && LENDARIOS.includes('fragata_amorim') && ORDEM_CLASSES.includes('fragata_amorim'), 'classe registrada (lendária, L 09)');
ok(C.L === 128 && C.B === 16 && C.canhao.cal === 127 && C.canhao.cad === 5 && C.vls === 32 && C.torp === 6 && C.laser === 2 && C.ciws === 2 && C.sam === 12, 'ficha: 128 m, 127 mm cad 5, 32 VLS, 6 torpedos, 2 lasers, 2 CIWS, 12 SAM');
const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'fragata_amorim', classeRival: 'destroier', seed: 5 }); const sim = S.sim, eu = sim.navios[S.match.jogadorId], ini = sim.navios.find((q) => q.time !== eu.time); sim.revelaTudo = 1;
const evs = []; const e0 = sim.evento.bind(sim); sim.evento = (e) => { evs.push(e); return e0(e); };
ok(eu.am && eu.P.vls.length === 32 && eu.P.tubos.length === 6 && eu.P.sam.length === 12 && eu.am.autos.length === 2, 'estado: 32 VLS, 6 tubos de torpedo, 12 SAM, 2 canhões automáticos');
/* escolha de slot: alvo pelo través de boreste → lateral BE; alvo pela proa → VLS */
const poe = (rel, dist) => { eu.x = 0; eu.z = 0; eu.rumo = 0; eu.v = 0; for (let i = 0; i < 40; i++) { ini.x = Math.sin(rel) * dist; ini.z = -Math.cos(rel) * dist; ini.v = 0; sim.passo([]); } eu.alvoId = ini.id; eu.trava = 1; eu.controleIA = 1; };
poe(Math.PI / 2, 5000); eu.tVls = 0; eu.am.ult = -1; let k = sim.lancaMissil(eu, ini.id, 4); ok(k === 4 && eu.am.ult === 1, `alvo a BORESTE → salva de 4 do lateral BE (slot ${eu.am.ult}, ${k} mísseis)`);
ok(Math.abs(eu.tVls - 5) < 0.05, `recarga de 5 s (tVls ${eu.tVls.toFixed(2)})`);
ok(sim.lancaMissil(eu, ini.id, 4) === 0, 'durante a recarga não sai outra salva');
poe(0, 6000); eu.tVls = 0; eu.am.ult = -1; k = sim.lancaMissil(eu, ini.id, 4); ok(k === 4 && eu.am.ult === 2, `alvo pela PROA → salva de 4 do VLS (slot ${eu.am.ult})`);
poe(-Math.PI / 2, 5000); eu.tVls = 0; eu.am.ult = -1; k = sim.lancaMissil(eu, ini.id, 4); ok(k === 4 && eu.am.ult === 0, `alvo a BOMBORDO → lateral BB (slot ${eu.am.ult})`);
/* torpedos: 1 aperto = 3, recarga 7 s */
poe(Math.PI / 2, 2500); eu.tTorp = 0; const t0 = eu.torp; const nt = sim.lancaTorpedo(eu, ini.id); ok(nt === 3 && t0 - eu.torp === 3, `torpedo: 1 aperto = ${nt} torpedos`); ok(Math.abs(eu.tTorp - 7) < 0.01, `recarga dos torpedos 7 s (${eu.tTorp})`);
/* canhões automáticos 30 mm (recarga 7 s) */
const S2 = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'fragata_amorim', classeRival: 'corveta', seed: 7 }); const s2 = S2.sim, e2 = s2.navios[S2.match.jogadorId], i2 = s2.navios.find((q) => q.time !== e2.time); s2.revelaTudo = 1;
const ev2 = []; const o2 = s2.evento.bind(s2); s2.evento = (e) => { ev2.push(e); return o2(e); }; s2.lancaMissil = () => 0; e2.torp = 0;
e2.x = 0; e2.z = 0; e2.rumo = 0; e2.v = 0; for (let i = 0; i < 30 * 9; i++) { i2.x = 2000; i2.z = -600; i2.v = 0; s2.passo([]); }
const ta = ev2.filter((e) => e.t === 'tiro' && e.auto); const pj = [0, 1].map((j) => ta.filter((e) => e.torre === -20 - j).length); console.log('tiros 30 mm por peça', pj);
ok(pj[1] >= 20 && pj[1] <= 40 && pj[0] === 0, 'canhão 30 mm de boreste atira (carregador 20 + recarga 7 s); o de bombordo não');
/* batalha com a IA: canhões, mísseis, torpedos, RBU, helicóptero */
const S3 = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'fragata_amorim', classeRival: 'destroier', seed: 3 }); const s3 = S3.sim, e3 = s3.navios[S3.match.jogadorId], i3 = s3.navios.find((q) => q.time !== e3.time);
const ev3 = []; const o3 = s3.evento.bind(s3); s3.evento = (e) => { ev3.push(e); return o3(e); }; e3.papel = 'bot'; e3.x = 0; e3.z = 0; i3.x = 3500; i3.z = 0; let erro = null;
try { for (let i = 0; i < 60 * 90; i++) S3.avanca(1 / 60); } catch (e) { erro = e.stack; }
const c3 = {}; for (const e of ev3) if (e.id === e3.id) c3[e.t + (e.t === 'tiro' ? (e.auto ? ':auto' : ':torre' + e.torre) : '')] = (c3[e.t + (e.t === 'tiro' ? (e.auto ? ':auto' : ':torre' + e.torre) : '')] || 0) + 1;
console.log(JSON.stringify(c3)); ok(!erro, 'batalha de 90 s sem erro ' + (erro || '')); ok((c3['tiro:torre0'] || 0) > 0 && (c3['tiro:torre1'] || 0) > 0, '2 canhões de 127 mm atiram'); ok((c3.vls || 0) > 0, 'mísseis lançados');
/* regressão: o Amorim continua igual */
const A = CLASSES.amorim; ok(A.vls === 100 && A.canhao.cad === 2.2 && A.torp === 30 && !A.misAuto && !A.torpSalva, 'Amorim inalterado (100 VLS, cad 2,2, 30 torpedos, sem escolha de slot)');
console.log(falhas ? `FALHAS: ${falhas}` : 'RESULTADO: TUDO OK'); process.exit(falhas ? 1 : 0);
