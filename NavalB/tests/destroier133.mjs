// Teste node do DESTRÓIER AMORIM D-01 (v1.3.03) + regressão de Amorim e Fragata.
import { CLASSES, HELIS, LENDARIOS } from '../src/sim/classes.js';
import { criaSessao } from '../src/sim/session.js';
import { EST } from '../src/naval5v5/aereo.js';
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } else console.log('OK', m); };
const C = CLASSES.destroier_amorim;
ok(C && C.num === 'D-01' && LENDARIOS.includes('destroier_amorim'), 'classe registrada (D-01)');
ok(C.L === 176 && C.canhao.cal === 155 && C.canhao.canos === 2 && C.canhao.torres === 3 && C.canhao.cad === 5 && C.vls === 160 && C.torp === 18 && C.ciws === 4 && C.laser === 6, 'ficha: 176 m, 3×2 155 mm cad 5, 160 VLS, 18 torpedos, 4 CIWS, 6 lasers');
ok(HELIS.acaua && HELIS.uiracu && C.vtolAmorim.join() === 'acaua,uiracu' && !C.heli, 'caças Acauã e Uiraçu fixos na classe (saem pelo DECOLAR, v1.3.06)');
const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'destroier_amorim', classeRival: 'destroier', seed: 5 }); const sim = S.sim, eu = sim.navios[S.match.jogadorId], ini = sim.navios.find((q) => q.time !== eu.time); sim.revelaTudo = 1;
ok(eu.am && eu.P.vls.length === 160 && eu.P.tubos.length === 18 && eu.am.autos.length === 4 && eu.torres.length === 3, 'estado: 160 VLS, 18 tubos, 4 autos, 3 torres');
ok(!(eu.helis && eu.helis.length), 'sem helicópteros: os caças estão no sistema do Urubu-rei (tests/vtol136.mjs)');
const poe = (rel, dist) => { eu.x = 0; eu.z = 0; eu.rumo = 0; eu.v = 0; for (let i = 0; i < 40; i++) { ini.x = Math.sin(rel) * dist; ini.z = -Math.cos(rel) * dist; ini.v = 0; sim.passo([]); } eu.alvoId = ini.id; eu.trava = 1; eu.controleIA = 1; };
poe(Math.PI / 2, 6000); eu.tVls = 0; eu.am.ult = -1; let k = sim.lancaMissil(eu, ini.id, 6); ok(k === 6 && eu.am.ult === 1, `alvo a BORESTE → salva de 6 do lateral BE (${k})`); ok(Math.abs(eu.tVls - 6) < 0.05, 'recarga 6 s');
poe(0, 8000); eu.tVls = 0; eu.am.ult = -1; k = sim.lancaMissil(eu, ini.id, 6); ok(k === 6 && eu.am.ult === 2, `alvo pela PROA → salva de 6 do VLS (${k})`);
poe(Math.PI / 2, 2500); eu.tTorp = 0; const t0 = eu.torp; const nt = sim.lancaTorpedo(eu, ini.id); const zs = new Set(sim.torpedos.filter((t) => t.ativo && t.dono === eu.id).map((t) => Math.round(t.x * 10) + ':' + Math.round(t.z * 10)));
ok(nt === 9 && t0 - eu.torp === 9, `torpedo: 1 aperto = ${nt}`); ok(Math.abs(eu.tTorp - 10) < 0.01, 'recarga dos torpedos 10 s'); ok(zs.size >= 9, `9 torpedos saem de 9 tubos diferentes (${zs.size} posições)`);
/* batalha com a IA */
const S3 = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'destroier_amorim', classeRival: 'cruzador', seed: 3 }); const s3 = S3.sim, e3 = s3.navios[S3.match.jogadorId], i3 = s3.navios.find((q) => q.time !== e3.time);
const ev3 = []; const o3 = s3.evento.bind(s3); s3.evento = (e) => { ev3.push(e); return o3(e); }; e3.papel = 'bot'; e3.x = 0; e3.z = 0; i3.x = 4000; i3.z = 0; let erro = null, voou = 0;
try { for (let i = 0; i < 60 * 120; i++) { S3.avanca(1 / 60); for (const hi of e3.helis) { const h = s3.helis[hi]; if (h.estado >= EST.DECOLA && h.estado <= EST.POUSO) voou = 1; } } } catch (e) { erro = e.stack; }
const c3 = {}; for (const e of ev3) if (e.id === e3.id) { const kk = e.t + (e.t === 'tiro' ? (e.auto ? ':auto' : ':torre' + e.torre) : ''); c3[kk] = (c3[kk] || 0) + 1; } console.log(JSON.stringify(c3));
ok(!erro, 'batalha de 120 s sem erro ' + (erro || '')); ok([0, 1, 2].every((t) => (c3['tiro:torre' + t] || 0) > 0), '3 torres de 155 mm atiram'); ok((c3.vls || 0) > 0, 'mísseis lançados'); ok(true, 'ok');
ok(!CLASSES.amorim.torpSalva && CLASSES.fragata_amorim.torpSalva === 3 && CLASSES.amorim.vls === 100, 'Amorim e Fragata inalterados');
console.log(falhas ? `FALHAS: ${falhas}` : 'RESULTADO: TUDO OK'); process.exit(falhas ? 1 : 0);
