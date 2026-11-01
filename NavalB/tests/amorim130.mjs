// Teste node (sem Chrome) do super lendário AMORIM (v1.3.00) sobre a simulação REAL.
// uso: node tests/amorim130.mjs
import { CLASSES, SUPER_LENDARIOS, ORDEM_CLASSES } from '../src/sim/classes.js';
import { criaSessao } from '../src/sim/session.js';
import { NUK } from '../src/sim/nuclear.js';
import { lancaMissilNuclear1231 } from '../src/sim/missilNuclear1231.js';
import { TUBOS_LAT } from '../src/sim/amorim.js';
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } else console.log('OK', m); };
const C = CLASSES.amorim;
ok(C && C.superLend && C.num === 'SL 06' && SUPER_LENDARIOS.includes('amorim') && ORDEM_CLASSES.includes('amorim'), 'classe registrada SL 06 / super lendário');
ok(C.canhao.cal === 152 && Math.abs(C.canhao.V0 / 900 - 3.28) < 0.01 /* V0 900 × escala global do jogo */ && C.canhao.cad === 2.2 && C.canhao.dano === 30 && C.canhao.alc === 16000, 'canhões 152 mm V0 900 cad 2,2 dano 30 alc 16 km');
ok(C.vls === 100 && C.torp === 30 && C.laser === 7 && C.ciws === 2 && C.rbu.foguetes === 12, 'VLS 100, 30 torpedos, 7 lasers, 2 CIWS, LG-12');

const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'amorim', classeRival: 'destroier', seed: 5 }); const sim = S.sim, eu = sim.navios[S.match.jogadorId]; const ini = sim.navios.find((q) => q.time !== eu.time); sim.revelaTudo = 1;
const evs = []; const ev0 = sim.evento.bind(sim); sim.evento = (e) => { evs.push(e); return ev0(e); };
ok(eu.am && eu.P.vls.length === 100 && eu.P.laser.length === 7, 'estado e layout do Amorim');
const passo = (s) => { for (let i = 0; i < s * 30; i++) sim.passo([]); };
/* ---- revezamento de salvas ---- */
eu.x = -4000; eu.z = 0; eu.rumo = 0; ini.x = 4000; ini.z = 0; ini.v = 0; eu.v = 0; eu.alvoId = ini.id; eu.trava = 1; eu.controleIA = 1;
for (let i = 0; i < 60; i++) { ini.x = 4000; ini.z = 0; ini.v = 0; sim.passo([]); } eu.alvoId = ini.id; const seq = [];
for (let k = 0; k < 4; k++) { eu.tVls = 0; const a = eu.am.prox; const q = sim.lancaMissil(eu, ini.id, 4); seq.push([a, q]); for (let i = 0; i < 3; i++) sim.passo([]); }
console.log('salvas', JSON.stringify(seq));
ok(seq.map((s) => s[0]).join() === '0,1,2,3' && seq.map((s) => s[1]).join() === '5,5,4,4', 'ordem BB 5 → BE 5 → VLS vante 4 → VLS ré 4');
ok(eu.am.vlsF === 46 && eu.am.vlsR === 46 && eu.vls === 92, 'VLS: 46 + 46 restantes');
/* ---- lançador lateral: sai reto, curva, não cruza o navio, entra na guiagem ---- */
const lat = sim.misseis.filter((m) => m.ativo && m.dono === eu.id && m.lat);
ok(lat.length === 10, '10 mísseis laterais no ar');
let cruza = 0, minY = 1e9, guiou = 0; const bb = lat.filter((m) => m.lat.sx < 0), be = lat.filter((m) => m.lat.sx > 0);
const larg = (m) => { const dx = m.x - eu.x, dz = m.z - eu.z, c = Math.cos(eu.rumo), s = Math.sin(eu.rumo); return dx * c + dz * s; };
const lado = new Map(lat.map((m) => [m, m.lat.sx])); const loc = (m) => { const dx = m.x - eu.x, dz = m.z - eu.z, c = Math.cos(eu.rumo), s = Math.sin(eu.rumo); return [dx * c + dz * s, -dx * s + dz * c]; };
for (let i = 0; i < 30 * 8; i++) { sim.passo([]); for (const m of lat) { if (!m.ativo || m.dono !== eu.id) continue; const [x, z] = loc(m); if (m.t > 0.05 && m.t < 8 && m.y < 50 && Math.abs(z) < eu.C.L / 2 + 5 && lado.get(m) * x < 7.0) cruza++; if (m.t > 0.05 && m.t < 2) minY = Math.min(minY, m.y); if (!m.lat && m.fase >= 3) guiou++; } }
ok(cruza === 0, `nenhum míssil lateral cruza o navio (amostras dentro do casco: ${cruza})`);
ok(guiou > 0, 'mísseis laterais entram na guiagem normal depois de ~2 s');
ok(minY > 2, `não mergulham no mar na curva (y mín ${minY.toFixed(1)} m)`);
ok(eu.am.recLat[0] > sim.t - 3 && TUBOS_LAT.bb.length === 5, 'recarga lateral de 7 s registrada');
passo(20); ok(ini.vida < ini.C.vida || ini.morto, `alvo atingido pelos mísseis (vida ${ini.vida}/${ini.C.vida})`);
/* ---- canhões automáticos antinavio ---- */
const S2 = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'amorim', classeRival: 'corveta', seed: 7 }); const s2 = S2.sim, e2 = s2.navios[S2.match.jogadorId], i2 = s2.navios.find((q) => q.time !== e2.time); s2.revelaTudo = 1;
const ev2 = []; const o2 = s2.evento.bind(s2); s2.evento = (e) => { ev2.push(e); return o2(e); };
e2.x = 0; e2.z = 0; e2.rumo = 0; e2.v = 0; i2.x = 2000; i2.z = 0; i2.v = 0;
s2.lancaMissil = () => 0; e2.torp = 0; const v0 = i2.vida;
for (let i = 0; i < 30 * 8; i++) { i2.x = 2000; i2.z = 0; i2.v = 0; s2.passo([]); }
const tA = ev2.filter((e) => e.t === 'tiro' && e.auto); const porJ = [0, 1, 2, 3].map((j) => tA.filter((e) => e.torre === -20 - j).length);
console.log('tiros automáticos por peça (boreste alvo)', porJ);
ok(porJ[1] > 0 && porJ[3] > 0, 'canhões de BORESTE atiram no inimigo a 2 km');
ok(porJ[0] === 0 && porJ[2] === 0, 'canhões de BOMBORDO não atiram (fora do arco)');
ok(porJ[1] <= 40 && porJ[1] >= 20, `carregador de 20 + recarga 6 s (${porJ[1]} tiros em 8 s)`);
ok(i2.vida < v0, `projéteis de 30 mm causam dano (${v0}→${i2.vida})`);
/* ---- laser das esferas contra míssil ---- */
const S3 = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'amorim', classeRival: 'destroier', seed: 9 }); const s3 = S3.sim, e3 = s3.navios[S3.match.jogadorId], i3 = s3.navios.find((q) => q.time !== e3.time); s3.revelaTudo = 1;
const ev3 = []; const o3 = s3.evento.bind(s3); s3.evento = (e) => { ev3.push(e); return o3(e); };
e3.x = 0; e3.z = 0; e3.v = 0; i3.x = 9000; i3.z = 0; i3.v = 0; for (let i = 0; i < 60; i++) { i3.x = 9000; i3.z = 0; s3.passo([]); } i3.alvoId = e3.id; i3.trava = 1;
const esf = new Set(); for (let w = 0; w < 6; w++) { i3.tVls = 0; i3.alvoId = e3.id; i3.controleIA = 1; s3.lancaMissil(i3, e3.id, 4); for (let i = 0; i < 30 * 6; i++) { s3.passo([]); e3.lasers.forEach((L, j) => { if (L.on && j >= 4) esf.add(j); }); } }
console.log('esferas que dispararam (4..6):', [...esf]);
const tiposL = [...new Set(ev3.map((e) => e.t))].filter((t) => /laser|ciws|sam|abat/i.test(t)); console.log('eventos de defesa', tiposL.join(','));
const las = ev3.filter((e) => e.t === 'missilAbatido' && e.por === e3.id && e.arma === 'laser'); const mont = [...new Set(las.map((e) => e.mount))]; let ligou = 0; 
console.log('laser: disparos', las.length, 'montagens', JSON.stringify(mont), las[0] ? JSON.stringify(las[0]) : '');
console.log(`abates por laser: ${las.length} (o LASER do jogo precisa de 1,5 s de feixe no alvo; míssil do jogo a ~1,8 km/s cruza os 2,6 km em ~1,4 s)`); ok(esf.size === 3, 'as 3 esferas do topo disparam o feixe');
/* ---- nuclear do slot dourado ---- */
eu.controleIA = 0; sim.t = Math.max(sim.t, NUK.liberaApos + 1); eu.alvoId = ini.id; console.log('motivo nuclear:', (await import('../src/sim/missilNuclear1231.js')).motivoMissil1231(sim, eu), eu.papel, sim.t); const nk = lancaMissilNuclear1231(sim, eu, { px: 4000, pz: 0 }); ok(nk === 1, 'míssil nuclear lança do slot dourado');
const ne = evs.filter((e) => e.t === 'nkMissilEscotilha').pop(); if (ne) { const dx = ne.x - eu.x, dz = ne.z - eu.z, c = Math.cos(eu.rumo), s = Math.sin(eu.rumo), lz = -dx * s + dz * c; ok(Math.abs(lz - 35.34) < 3, `posição do lançamento nuclear z local ${lz.toFixed(1)} (grade dourada 29,8–41)`); }
ok(Math.abs(eu.nm1231.tRec - sim.t - 8) < 0.1, 'próximo nuclear pronto 8 s após lançar');
console.log(falhas ? `FALHAS: ${falhas}` : 'RESULTADO: TUDO OK'); process.exit(falhas ? 1 : 0);
