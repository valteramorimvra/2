// v1.2.15 — alvo atrás de montanha/ilha: 0 travas (jogador e IA); sai de trás → trava volta. + métricas de cobertura da IA.
import { criaSessao } from '../src/sim/session.js';
import { alturaTerreno, losTerreno } from '../src/sim/maps.js';
let ok = 0, falha = 0; const L = []; const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
for (const mapa of ['arquipelago', 'fiordes', 'vulcanico']) {
  const S = criaSessao({ mapa, modo: 'duelo', classe: 'destroier', seed: 4 }); const s = S.sim, n = s.navios[S.match.jogadorId]; const a = s.navios.find((q) => q.time !== n.time);
  for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; } s.revelaTudo = 1;
  // acha posição do jogador em água funda e dois pontos do alvo a ~4,5 km: um escondido pela ilha, outro com visada
  let P = null; const T = s.T, fundo = (x, z) => alturaTerreno(T, x, z) < -25;
  busca: for (let x = -5000; x <= 5000; x += 400) for (let z = -5000; z <= 5000; z += 400) { if (!fundo(x, z)) continue; let esc = null, liv = null;
    for (let k = 0; k < 36; k++) { const r = k / 36 * 6.283, bx = x + Math.sin(r) * 4500, bz = z - Math.cos(r) * 4500; if (!fundo(bx, bz)) continue; const v = losTerreno(T, x, z, n.P.mastro, bx, bz, a.P.mastro * 0.85) && losTerreno(T, x, z, 30, bx, bz, 30); const vv = losTerreno(T, x, z, n.P.mastro, bx, bz, a.P.mastro * 0.85);
      if (!vv && !esc) esc = [bx, bz]; if (v && !liv) liv = [bx, bz]; }
    if (esc && liv) { P = { x, z, esc, liv }; break busca; } }
  if (!P) { L.push(mapa + ': sem geometria de teste'); continue; }
  const fix = (q, x, z) => { q.x = x; q.z = z; q.v = 0; q.vida = q.C.vida; q.telAlvo = 0; q.tel = 0; };
  let locks = 0, travou = 0;
  const roda = (seg, pos, cmd) => { for (let f = 0; f < 60 * seg; f++) { fix(n, P.x, P.z); fix(a, pos[0], pos[1]); n.mira.az = Math.atan2(pos[0] - P.x, -(pos[1] - P.z)); n.mira.dist = 4500; s.passo(f % 30 === 0 && cmd ? [{ t: 'travar', id: n.id, alvo: a.id }] : []); for (const e of s.eventos) if (e.t === 'travado' && e.id === n.id) travou++; s.eventos.length = 0; if (n.trava > 0 && n.alvoId === a.id) locks++; } };
  roda(8, P.esc, 1); chk(locks === 0 && travou === 0, `${mapa}: atrás do relevo travou (${locks} quadros, ${travou} eventos)`); const ocultoLocks = locks;
  locks = 0; roda(8, P.liv, 1); chk(travou > 0 && n.trava >= 1, `${mapa}: com visada não travou (trava ${n.trava.toFixed(2)})`);
  const tr0 = n.trava; roda(2, P.esc, 0); chk(n.trava === 0, `${mapa}: não perdeu a trava atrás do relevo (${n.trava})`);
  // IA inimiga: não trava o jogador escondido
  let iaLock = 0; for (let f = 0; f < 60 * 10; f++) { fix(n, P.esc[0], P.esc[1]); fix(a, P.x, P.z); a.papel = 'ataque'; s.passo([]); s.eventos.length = 0; if (a.alvoId === n.id && a.trava > 0) iaLock++; }
  chk(iaLock === 0, `${mapa}: IA travou jogador escondido (${iaLock})`);
  L.push(`${mapa}: escondido locks ${ocultoLocks}, com visada travou (${tr0.toFixed(2)}), saiu da visada → trava ${n.trava}, IA→jogador escondido ${iaLock}`); }
// smoke 8×8: uso de cobertura e manobras evasivas da IA
{ const S = criaSessao({ mapa: 'arquipelago', modo: 'frota', classe: 'cruzador', seed: 11, portaAvioes: true, mercantes: true }); const s = S.sim; let nan = 0; for (let f = 0; f < 60 * 180; f++) { S.avanca(1 / 60); s.eventos.length = 0; if (f % 600 === 0) for (const q of s.navios) if (!Number.isFinite(q.x + q.z + q.rumo + q.v)) nan++; }
  const SI = s.statsIA || {}; L.push(`IA 8x8 180 s: em cobertura ${SI.tCob?.toFixed(0)} s·navio, exposta ${SI.tExp?.toFixed(0)} s·navio, evasivas ${SI.evasivas?.toFixed(0)} s, recuos ${SI.recuos}, reações ${SI.reacoes}, escolta ${SI.escolta?.toFixed(0)} s, NaN ${nan}, afundados ${s.navios.filter((q) => q.morto).length}`);
  chk(nan === 0, 'NaN'); chk((SI.tCob || 0) > 0, 'IA nunca usou cobertura'); }
console.log(L.join('\n')); console.log(`visada1215: ${ok} ok, ${falha} falhas`); process.exit(falha ? 1 : 0);
