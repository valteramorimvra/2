// Teste node dos caças Acauã/Uiraçu (v1.3.04): código próprio (armas por tipo, intervalos, rearme 15 s, volta 20 s, lasers, nuke tático).
import { criaSessao } from '../src/sim/session.js';
import { EST } from '../src/naval5v5/aereo.js';
import { VT, somaVt } from '../src/sim/vtolAmorim.js';
import { HELIS, MISSEIS } from '../src/sim/classes.js';
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } else console.log('OK', m); };
const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'destroier_amorim', classeRival: 'destroier', seed: 7 }); const sim = S.sim, eu = sim.navios[S.match.jogadorId], ini = sim.navios.find((q) => q.time !== eu.time); sim.revelaTudo = 1;
const ev = []; const o = sim.evento.bind(sim); sim.evento = (e) => { ev.push(e); return o(e); };
const passo = (s) => { for (let i = 0; i < Math.round(s * 60); i++) S.avanca(1 / 60); };
passo(1); const A = sim.helis[eu.helis[0]], U = sim.helis[eu.helis[1]];
ok(A.vt && U.vt, 'estado próprio h.vt instalado nos 2 caças');
const s0 = somaVt(sim, eu, {}); console.log('soma inicial', JSON.stringify(s0)); ok(s0.aam === A.vt.aam + U.vt.aam && s0.nuke === 6, 'HUD soma os 2 caças (NUKE 6)');
/* outra aeronave não é tocada */ const outro = sim.helis.find((h) => h.usado && h.dono !== eu.id); ok(!outro || !outro.vt, 'aeronaves dos outros navios sem h.vt');
/* coloca o Acauã em voo perto do inimigo */
const voa = (h, dist) => { h.estado = EST.VOO; h.ativo = 1; h.ctrl = 'jog'; eu.controle = eu.helis.indexOf(h.idx); h.x = ini.x - dist; h.z = ini.z; h.y = 300; h.rumo = Math.PI / 2; h.v = 120; h.vx = 120; h.vz = 0; h.vy = 0; h.alt = 300; h.bank = 0; h.gam = 0; h.sx = h.jx = h.sy = h.jy = 0; h.thr = 0.8; h.pitch = 0; h.roll = 0; };
ini.v = 0; voa(A, 3000); A.vt.tMis = 0; A.vt.tNuke = 0;
const asm0 = A.vt.asm; S.comando({ t: 'vtArma', tipo: 'asm' }); passo(0.6); ok(A.vt.asm === asm0 - 1, `ASM: 1 por clique (${asm0}→${A.vt.asm})`);
const asm1 = A.vt.asm; S.comando({ t: 'vtArma', tipo: 'asm' }); passo(0.6);
ok(A.vt.asm === asm1 || U.vt.asm < 4, 'intervalo 7 s respeitado no mesmo caça'); ok(A.vt.tMis > 5.5 && A.vt.tMis < 7, `tMis ≈ 7 s (${A.vt.tMis.toFixed(2)})`);
ok(ev.some((e) => e.t === 'vtNegado'), 'sem caça pronto → aviso vtNegado (o outro está no navio)');
passo(7.1); voa(A, 2500); const tp0 = A.vt.torp; S.comando({ t: 'vtArma', tipo: 'torp' }); passo(0.6); ok(A.vt.torp === tp0 - 1 && sim.torpedos.some((t) => t.ativo && t.dono === eu.id && t.leve), 'TORP lançado');
passo(0.2); const nk0 = A.vt.nuke; S.comando({ t: 'vtArma', tipo: 'nuke' }); passo(0.6); ok(A.vt.nuke === nk0 - 1 && A.vt.tNuke > 11 && A.vt.tNuke < 12, `NUKE lançado, intervalo 12 s (${A.vt.tNuke.toFixed(2)})`);
const vida0 = ini.vida; let det = null; ini.C = Object.assign({}, ini.C); const nkM = sim.misseis.find((m) => m.ativo && m.vtNk); console.log('nuke em voo', !!nkM); for (let i = 0; i < 60 * 30 && !det; i++) { const px = nkM.x, pz = nkM.z, at = nkM.ativo; S.avanca(1 / 60); if (at && !nkM.ativo) console.log('nuke fim a', Math.hypot(px - ini.x, pz - ini.z).toFixed(0), 'm do alvo; L', ini.C.L, 'nk', JSON.stringify(A.vt.nk), JSON.stringify(A.vt.nkT)); det = ev.find((e) => e.t === 'vtNuke'); }
ok(!det || Math.hypot(det.x - ini.x, det.z - ini.z) < 200, 'nuke abatido longe do alvo NÃO detona (só detona no alvo)');
passo(12.5); console.log('A.x pos 12.5', A.x); voa(A, 3000); console.log('A.x pos voa', A.x, ini.x); A.vt.tNuke = 0; S.comando({ t: 'vtArma', tipo: 'nuke' }); passo(0.6); const nk2 = sim.misseis.find((m) => m.ativo && m.vtNk && m.dono === eu.id); ini.vida = Math.max(ini.vida, 3000); const v1 = ini.vida; if (nk2) { nk2.x = ini.x + 20; nk2.z = ini.z; nk2.y = 5; S.avanca(1 / 60); nk2.ativo = 0; passo(0.2); }
det = ev.find((e) => e.t === 'vtNuke'); ok(!!nk2 && !!det && ini.vida < v1, `nuke tático que chega no alvo detona (vtNuke) e causa dano (${v1.toFixed(0)}→${ini.vida.toFixed(0)})`); console.log('vida do alvo', vida0.toFixed(0), '→', ini.vida.toFixed(0));
/* AAM: alvo aéreo */ const inimH = sim.helis.find((h) => !h.usado); Object.assign(inimH, { usado: 1, ativo: 1, estado: EST.VOO, time: ini.time, dono: ini.id, x: A.x + 2000, y: 300, z: A.z, vida: 100, H: HELIS.leve, modelo: 'leve' });
voa(A, 3000); A.vt.tMis = 0; Object.assign(inimH, { x: A.x + 2000, z: A.z }); const aa0 = A.vt.aam; S.comando({ t: 'vtArma', tipo: 'aam' }); passo(0.6); ok(A.vt.aam === aa0 - 1, `AAM disparado contra aeronave (${aa0}→${A.vt.aam})`); inimH.ativo = 0; inimH.usado = 0; inimH.estado = 0;
/* lasers: míssil inimigo REAL acima e abaixo do caça */ passo(1); const fake = () => { const m = sim.misseis.find((q) => !q.ativo); Object.assign(m, { ouro: 0, heli: 1, ativo: 1, x: A.x + 300, y: A.y, z: A.z, vx: -60, vy: 0, vz: 0, dono: ini.id, time: ini.time, alvo: eu.id, isca: -1, fase: 3, t: 1, v: 200, perfil: Object.assign({}, MISSEIS.curto), cel: 0, iscasVistas: 0, tf: 0, d0: 3000, samAlvo: 0, dano: 10, pkMul: 1, velMul: 1, livre: 0, curto: 0, lat: null, vtNk: 0 }); return m; }; const nm = 1; const m1 = fake(); S.avanca(1/60); console.log('fakeNaN', Object.entries(m1).filter(([k,v])=>typeof v==='number'&&!Number.isFinite(v)).map(e=>e[0]).join(), JSON.stringify(m1.perfil));
const segura = (dy) => { m1.x = A.x + 300; m1.y = A.y + dy; m1.z = A.z; m1.vx = -60; m1.vy = 0; m1.vz = 0; };
A.vt.las[0].tc = A.vt.las[1].tc = 0; let on0 = 0, on0v = 0; for (let i = 0; i < 24; i++) { segura(400); S.avanca(1 / 60); if (A.vt.las[0].on) on0 = 1; if (A.vt.las[1].on) on0v = 1; } ok(!!m1 && on0 && !on0v, `míssil ACIMA → só o laser DORSAL atira (${nm})`);
m1.ativo = 0; A.y = 900; A.alt = 900; const evV = ev.length; const m2 = fake(); const segura2 = (dy) => { m2.x = A.x + 300; m2.y = A.y + dy; m2.z = A.z; m2.vx = -60; m2.vy = 0; m2.vz = 0; }; A.vt.las[0].tc = A.vt.las[1].tc = 0; A.vt.las[0].t = A.vt.las[1].t = 0; A.vt.las[0].on = A.vt.las[1].on = 0; let on1 = 0, on1d = 0; for (let i = 0; i < 24; i++) { segura2(-160); S.avanca(1 / 60); if (A.vt.las[1].on) on1 = 1; if (A.vt.las[0].on) on1d = 1; } ok(on1 && !on1d, 'míssil ABAIXO → só o laser VENTRAL atira');
let abat = 0; for (let i = 0; i < 60 * 4 && m2.ativo; i++) { segura2(-160); S.avanca(1 / 60); } abat = ev.some((e) => e.t === 'missilAbatido' && e.arma === 'laser' && e.por === eu.id); ok(abat, 'laser do caça abate o míssil'); m2.ativo = 0;
/* rearme 15 s no navio */ A.estado = EST.REARMA; A.ativo = 0; A.tEst = 0; const r0 = ev.length; passo(14); const antes = A.vt.asm; passo(1.3); ok(antes < 4 && A.vt.asm === 4 && ev.slice(r0).some((e) => e.t === 'vtRearme'), `rearme em 15 s pousado (${antes}→${A.vt.asm})`);
/* abatido volta em 20 s */ voa(U, 5000); U.vt.asm = 0; U.estado = EST.ABATIDO; U.ativo = 0; U.tEst = 0; let tVolta = -1; for (let i = 0; i < 60 * 30; i++) { S.avanca(1 / 60); if (U.estado !== EST.ABATIDO) { tVolta = i / 60; break; } }
console.log('volta do abatido em', tVolta.toFixed(1), 's, estado', U.estado); ok(tVolta > 18 && tVolta < 22 && U.vt.asm === 4, 'abatido volta pousado e cheio em ~20 s');
/* batalha da IA sem erro */ eu.papel = 'bot'; A.ctrl = U.ctrl = 'ia'; let erro = null; try { passo(120); } catch (e) { erro = e.stack; } ok(!erro, 'IA 120 s sem erro ' + (erro || ''));
const vt = ev.filter((e) => e.t === 'heliMissil' && e.vt).length; console.log('mísseis dos caças', vt);
console.log(falhas ? `FALHAS: ${falhas}` : 'RESULTADO: TUDO OK'); process.exit(falhas ? 1 : 0);
