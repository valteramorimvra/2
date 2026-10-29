/** v1.2.27 — varredura dos 14 navios novos como JOGADOR (sim headless). */
import { criaSessao } from '../src/sim/session.js';
import { CLASSES, ORDEM_CLASSES } from '../src/sim/classes.js';
import { IDS_1226 } from '../src/sim/classes1226.js';
import { IDS_1225 } from '../src/sim/classes1225.js';
import { layoutDe } from '../src/sim/layout.js';
import { PRECO, TIPO_NAVIO, LISTA_NAVIOS } from '../src/navalTechTreeEconomy.js';
import fs from 'node:fs';

const IDS = [...IDS_1225, ...IDS_1226];
const GIGANTES_NK = ['chapada', 'lencois'];
const falhas = [];
const porNavio = {};

console.log('=== VARREDURA 1.2.27 —', IDS.length, 'navios ===');

for (const k of IDS) {
  const R = porNavio[k] = { id: k, falhas: [] };
  const push = (m) => { R.falhas.push(m); falhas.push(k + ': ' + m); };
  if (!CLASSES[k]) { push('sem CLASSES'); continue; }
  if (!ORDEM_CLASSES.includes(k)) push('fora de ORDEM_CLASSES');
  if (!LISTA_NAVIOS.includes(k)) push('fora de LISTA_NAVIOS');
  if (!TIPO_NAVIO[k]) push('sem TIPO_NAVIO');
  if (!PRECO[k]) push('sem PRECO');
  const C = CLASSES[k];
  if (!(C.L > 10 && C.B > 2 && C.vida > 0 && C.vmax > 0)) push(`stats inválidos`);
  if (!C.canhao) push('sem canhão');
  try {
    const P = layoutDe(C);
    if (!P?.torres?.length) push('layout sem torres');
    R.layout = { torres: P.torres.length, ciws: (P.ciws || []).length, a30: (P.a30 || []).length };
  } catch (e) { push('layoutDe: ' + e.message); }
}

for (let i = 0; i < IDS.length; i++) {
  const k = IDS[i];
  const R = porNavio[k];
  const push = (m) => { R.falhas.push(m); falhas.push(k + ': ' + m); };
  let S;
  try {
    S = criaSessao({ mapa: 'arquipelago', modo: 'duelo', classe: k, classeRival: 'volkhar', seed: 2700 + i * 17 });
  } catch (e) { push('criaSessao: ' + e.message); continue; }
  const sim = S.sim, eu = S.jogador;
  if (!eu || eu.C.id !== k) { push('jogador id errado'); continue; }

  const ini = sim.navios.find((n) => n.time !== eu.time);
  const place = (d, angOff = 1.2) => {
    if (!ini) return;
    ini.x = eu.x + Math.sin(eu.rumo + angOff) * d;
    ini.z = eu.z - Math.cos(eu.rumo + angOff) * d;
    ini.vx = ini.vz = ini.v = 0;
  };
  place(2800);

  let nan = 0, ex = 0;
  const ev = {};
  const step = (n) => {
    for (let j = 0; j < n; j++) {
      try {
        sim.passo(S.net.coletar(sim.tick + 1));
        for (const e of sim.eventos) ev[e.t] = (ev[e.t] || 0) + 1;
        sim.eventos.length = 0;
        if (!Number.isFinite(eu.x + eu.z + eu.v + eu.rumo + eu.vida)) nan++;
      } catch (e) { ex++; if (ex <= 2) push('exceção: ' + e.message); }
    }
  };

  // mover
  S.comando({ t: 'telegrafo', v: 4 });
  S.comando({ t: 'leme', v: 1 });
  step(60);
  const x0 = eu.x, z0 = eu.z, r0 = eu.rumo;
  // grandes: mais tempo de leme (até 12 s)
  const tLeme = eu.C.L > 300 ? 720 : eu.C.L > 200 ? 480 : 240;
  step(tLeme);
  const moveu = Math.hypot(eu.x - x0, eu.z - z0) > 8;
  const dRumo = Math.abs(Math.atan2(Math.sin(eu.rumo - r0), Math.cos(eu.rumo - r0)));
  if (!moveu) push('não se moveu');
  if (dRumo < 0.015) {
    // tenta pivô parado
    S.comando({ t: 'telegrafo', v: 0 }); S.comando({ t: 'pivo', v: 1 });
    step(300);
    const d2 = Math.abs(Math.atan2(Math.sin(eu.rumo - r0), Math.cos(eu.rumo - r0)));
    S.comando({ t: 'pivo', v: 0 }); S.comando({ t: 'telegrafo', v: 3 });
    if (d2 < 0.015) push('não virou (leme+pivô)');
  }

  // trava + armas
  place(2500);
  const az = Math.atan2(ini.x - eu.x, -(ini.z - eu.z));
  const dist = Math.hypot(ini.x - eu.x, ini.z - eu.z);
  S.comando({ t: 'mira', az, dist });
  S.comando({ t: 'travar', alvo: ini.id });
  step(90); // trava fecha
  // canhão: vários toques
  for (let q = 0; q < 8; q++) { S.comando({ t: 'canhao', modo: 'um' }); step(20); S.comando({ t: 'canhaoSolta' }); step(10); }
  S.comando({ t: 'canhao', seg: 1 }); step(120); S.comando({ t: 'canhaoSolta' });

  // VLS / míssil — espera trava de míssil (travandoMis)
  if ((eu.C.vls || 0) > 0) {
    place(4000); // PA/gigantes precisam ~4 km e travaMis
    if (ini.morto) { ini.morto = 0; ini.vida = ini.C.vida; }
    sim.revelaTudo = 1; // isola arma (ilhas do mapa não bloqueiam o teste)
    if (sim.oculto) { const _o = sim.oculto.bind(sim); sim.oculto = () => false; }
    S.comando({ t: 'mira', az: Math.atan2(ini.x - eu.x, -(ini.z - eu.z)), dist: Math.hypot(ini.x - eu.x, ini.z - eu.z) });
    S.comando({ t: 'travar', alvo: ini.id });
    for (let w = 0; w < 480; w++) { // até ~8 s
      step(1);
      const pr = sim.prontidao ? sim.prontidao(eu, 'vls') : { ok: 1 };
      if (pr.ok) break;
    }
    // se ainda sem detecção (ilhas), revela para isolar arma
    if (!(sim.prontidao(eu, 'vls') || {}).ok) { sim.revelaTudo = 1; S.comando({ t: 'travar', alvo: ini.id }); step(120); }
    S.comando({ t: 'missil', alvo: ini.id, n: Math.min(eu.vls || eu.C.vls, eu.C.salva || 2) });
    step(240);
    // se ainda não saiu, força mais uma tentativa com trava completa
    if ((eu.vlsUsadas || []).filter(Boolean).length < 1) {
      eu.trava = 1; eu.alvoId = ini.id; eu.tTravaMis = 0;
      S.comando({ t: 'missil', alvo: ini.id, n: Math.min(eu.vls || eu.C.vls, 2) });
      step(180);
    }
  }
  // torpedo — aproxima e dispara quando pronto
  if ((eu.C.torp || 0) > 0) {
    place(1100);
    if (ini.morto) { ini.morto = 0; ini.vida = ini.C.vida; }
    S.comando({ t: 'mira', az: Math.atan2(ini.x - eu.x, -(ini.z - eu.z)), dist: 1100 });
    S.comando({ t: 'travar', alvo: ini.id });
    step(90);
    for (let w = 0; w < 3; w++) {
      S.comando({ t: 'torpedo', alvo: ini.id });
      step(90);
      if ((eu.C.torp || 0) - (eu.torp || 0) > 0) break;
    }
  }
  // rbu
  if (eu.C.rbu) { S.comando({ t: 'rbu', alvo: ini.id }); step(90); }

  // laser/CIWS: cria míssil inimigo ameaça se possível — ou só confere montagens
  R.defesa = { laser: eu.C.laser || 0, ciws: (eu.ciws || []).length, a30: (eu.a30 || []).length, sam: eu.C.sam || 0 };

  const st = eu.stats || {};
  const tiros = st.tiros || 0;
  const vlsU = (eu.vlsUsadas || []).filter(Boolean).length;
  const misEv = (ev.missil || 0) + (ev.missilLan || 0) + (ev.vls || 0);
  const torpU = (eu.C.torp || 0) - (eu.torp || 0);
  R.combate = { tiros, vlsU, misEv, torpU, alvoId: eu.alvoId, ev: { ...ev } };

  if (eu.C.canhao && tiros < 1) push('canhão não disparou (tiros=0)');
  if ((eu.C.vls || 0) > 0 && vlsU < 1 && misEv < 1) {
    // diagnóstico prontidão
    const pr = sim.prontidao ? sim.prontidao(eu, 'vls') : { ok: '?', motivo: 'n/a' };
    push(`VLS/míssil não disparou (pront=${JSON.stringify(pr)} alvo=${eu.alvoId})`);
  }
  if ((eu.C.torp || 0) > 0 && torpU < 1) {
    const pr = sim.prontidao ? sim.prontidao(eu, 'torp') : {};
    push(`torpedo não lançou (pront=${JSON.stringify(pr)})`);
  }

  // aeronaves
  if ((eu.C.heli || 0) > 0 || (eu.C.alaTotal || 0) > 0) {
    S.comando({ t: 'esquadrilha' });
    step(eu.C.alaTotal ? 900 : 480);
    let noAr = 0, decol = 0;
    for (const h of sim.helis || []) if (h.dono === eu.id && h.ativo && (h.estado || 0) >= 1) noAr++;
    for (const key of Object.keys(ev)) if (/decol/i.test(key)) decol += ev[key];
    R.aereo = { noAr, decol, helis: (eu.helis || []).length, reserva: eu.reservaAr };
    if (noAr < 1 && decol < 1) push('aeronave não decolou');
  }

  // nuclear
  if (GIGANTES_NK.includes(k)) {
    if (!eu.C.nuclear) push('sem C.nuclear');
    const falta = Math.max(0, 122 - sim.t);
    step(Math.ceil(falta * 60) + 60);
    const bombas0 = eu.nuclearBombas != null ? eu.nuclearBombas : (eu.C.nuclear && eu.C.nuclear.bombas);
    S.comando({ t: 'nuclear' });
    step(30);
    S.comando({ t: 'nuclear' });
    step(180);
    R.nuclear = { t: +sim.t.toFixed(1), bombas0, evN: Object.fromEntries(Object.entries(ev).filter(([a]) => /nuk|bomb|nuclear|decol/i.test(a))) };
  }

  if (nan) push('NaN (' + nan + ')');
  if (ex) push('exceções (' + ex + ')');
  R.ok = R.falhas.length === 0;
  console.log(k, R.ok ? 'OK' : 'FALHAS', R.falhas.join(' | ') || '-', 'tiros', tiros, 'vls', vlsU, 'torp', torpU, 'aereo', JSON.stringify(R.aereo || null));
}

fs.mkdirSync('/workspace/capturas1227', { recursive: true });
fs.writeFileSync('/workspace/capturas1227/navios-scan.json', JSON.stringify({ falhas: falhas.length, lista: falhas, porNavio }, null, 2));
console.log('\nTOTAL falhas', falhas.length);
if (falhas.length) console.log(falhas.join('\n'));
process.exit(falhas.length ? 1 : 0);
