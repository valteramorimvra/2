// Teste node (sem Chrome) do míssil nuclear 1.2.31 sobre a simulação REAL (copia do projeto + módulos novos; nuclear.js intacto).
// uso (na cópia /tmp/nav1231): node tests/missil1231.mjs
import { CLASSES } from '../src/sim/classes.js';
import { adiciona1231 } from '../src/sim/classes1231.js';
import { criaSessao } from '../src/sim/session.js';
import { NUK } from '../src/sim/nuclear.js';
import { passoMissil1231, lancaMissilNuclear1231, motivoMissil1231, MISS } from '../src/sim/missilNuclear1231.js';
const VIDA = (v) => Math.round(v * 3.2 * 1.5), D = (base, id, o) => { const B0 = CLASSES[base]; return Object.assign({}, B0, o, { id, canhao: Object.assign({}, B0.canhao, o.canhao || {}) }); }, CAN = (o) => Object.assign({ V0: 800, rajada: 1, som: 'grande', disp: 0.8 }, o);
adiciona1231(CLASSES, { D, CAN, VIDA });
let falhas = 0; const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA', m); } else console.log('OK', m); };
for (const id of ['sejong', 'nanchang', 'nakhimov']) {
  console.log('=== ' + id);
  const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: id, classeRival: 'destroier', seed: 5 }); const sim = S.sim, eu = sim.navios[S.match.jogadorId]; const ini = sim.navios.find((q) => q.time !== eu.time); sim.revelaTudo = 1;
  const evs = []; const ev0 = sim.evento.bind(sim); sim.evento = (e) => { evs.push(e); return ev0(e); };
  eu.x = -3000; eu.z = 0; ini.x = 3000; ini.z = 0; ini.v = 0; ini.vmax = 0; eu.v = 0; const vida0 = ini.vida;
  ok(motivoMissil1231(sim, eu) === 'cedo', 'antes de 15 s: "cedo"'); eu.alvoId = ini.id;
  const passo = (s) => { const dt = 1 / 30; for (let i = 0; i < s / dt; i++) { sim.passo([]); } };
  const temPasso = typeof sim.passo === 'function' ? 'passo' : 'step'; sim.t = NUK.liberaApos + 0.1; /* simula a passagem dos 15 s */
  ok(motivoMissil1231(sim, eu) === '', 'após 15 s: liberado (jogador)');
  ok(lancaMissilNuclear1231(sim, eu, { alvo: ini.id }) === 1, 'lançou'); ok(motivoMissil1231(sim, eu) === 'noAr', 'um por vez: segundo lançamento negado (noAr)'); ok(lancaMissilNuclear1231(sim, eu, { alvo: ini.id }) === 0, 'duplo negado');
  const k = eu.nm1231; ok(k.ilimitado === 1 && Number.isFinite(k.bombas), 'estoque ilimitado por FLAG (sem Infinity)');
  let tDet = -1, tLanca = -1, maxY = 0; for (let i = 0; i < 30 * 90; i++) { sim.passo([]); if (k.m) maxY = Math.max(maxY, k.m.y); if (tLanca < 0 && evs.some((e) => e.t === 'nkMissilLanca')) tLanca = sim.t; if (evs.some((e) => e.t === 'nkDetona')) { tDet = sim.t; break; } }
  ok(tDet > 0, `detonou (${tDet.toFixed(1)} s sim; voo ${(tDet - tLanca).toFixed(1)} s; apogeu ${maxY.toFixed(0)} m)`);
  const det = evs.find((e) => e.t === 'nkDetona'); ok(det && Math.hypot(det.x - ini.x, det.z - ini.z) < 120, `detonou sobre o alvo (erro ${det ? Math.hypot(det.x - ini.x, det.z - ini.z).toFixed(0) : '?'} m)`);
  for (let i = 0; i < 30 * 12; i++) sim.passo([]);
  ok(ini.vida < vida0 || ini.morto, `alvo a 6 km sofreu dano/foi destruído (vida ${vida0}→${ini.vida})`);
  const tFim = k.tRec; ok(Math.abs(tFim - (tDet + NUK.tRecargaPouso)) < 2, `recarga ≈ ${NUK.tRecargaPouso} s após a detonação (tRec=${tFim.toFixed(1)})`);
  ok(motivoMissil1231(sim, eu) === 'recarga', 'durante recarga: negado');
  sim.t = tFim + 0.1; ok(motivoMissil1231(sim, eu) === '', 'pós-recarga: pronto de novo (ilimitado)');
  /* bot: sem opção nunca dispara */ ini.C = ini.C; const bot = eu; bot.papel = 'bot'; sim.nkBotAtomica = 0; ok(motivoMissil1231(sim, bot) === 'semBombardeiro', 'bot sem a opção: bloqueado'); sim.nkBotAtomica = 1; ok(motivoMissil1231(sim, bot) === '', 'bot com a opção ligada: liberado');
}
console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK'); process.exit(falhas ? 1 : 0);
