// v1.2.15 (W) — aeronaves: a arma DISPARA de onde está (pilone/casulo/porta), o projétil herda a velocidade, ACERTA o alvo,
// e o caça VTOL voa como AVIÃO (sem derrapagem, curva coordenada pela rolagem, taxa ≤ g·tan60°/v, rolagem com taxa limitada).
import { criaSessao } from '../src/sim/session.js'; import { HELIS, ORDEM_HELIS } from '../src/sim/classes.js'; import { EST } from '../src/naval5v5/aereo.js';
let f = 0; const ok = (c, m) => { console.log((c ? 'OK  ' : 'FALHA ') + m); if (!c) f++; };
for (const mod of ORDEM_HELIS) {
  const S = criaSessao({ modo: 'duelo', mapa: 'atois', classe: 'fragata', classeRival: 'fragata', seed: 11, jogadorOpc: { helis: [mod] } }); const s = S.sim, n = S.jogador, a = s.navios.find((q) => q.time !== n.time);
  a.x = n.x + 2600; a.z = n.z - 600; a.papel = 'alvo'; a.sam = 0; a.a30 = []; for (const c of a.ciws) c.mun = 0; /* alvo sem defesa antiaérea: mede só a pontaria da aeronave */ s.revelaTudo = 1; n.alvoId = a.id; const v0 = a.vida;
  const bloq = () => { for (const tr of n.torres) tr.rec = 99; n.vls = 0; n.torp = 0; }; for (let i = 0; i < 60 * 14; i++) { bloq(); S.avanca(1 / 60); s.eventos.length = 0; } // espera t > 12
  S.comando({ t: 'controle', k: 0 }); for (let i = 0; i < 3; i++) { S.avanca(1 / 60); s.eventos.length = 0; } const h = s.helis[n.helis[0]]; h.ctrl = 'ia'; n.controle = -1;
  let lanc = 0, dMax = 0, vErr = 0, imp = 0, slip = 0, rr = 0, wExc = 0, nS = 0, rAnt = null;
  for (let i = 0; i < 60 * 110; i++) { a.vida = Math.max(a.vida, v0 * 0.5); a.morto = 0; n.alvoId = a.id; for (const q of s.navios) if (q !== n && q !== a) q.x = 1e7; for (const tr of n.torres) tr.rec = 99; n.vls = 0; n.torp = 0; for (const tr of a.torres) tr.rec = 99; a.vls = 0; a.torp = 0; a.sam = 0; a.lasers = []; a.a30 = []; for (const c of a.ciws) c.mun = 0; /* só a aeronave ataca; alvo sem armas */
    const hx = h.x, hy = h.y, hz = h.z, hvx = h.vx || 0, hvz = h.vz || 0, rumo0 = h.rumo; S.avanca(1 / 60); if (h.fogoMg) (globalThis.TP ||= {}).fogoMg = (TP.fogoMg || 0) + 1; (globalThis.TP ||= {}).dmin = Math.min(TP.dmin ?? 1e9, Math.round(Math.hypot(a.x - h.x, a.z - h.z))); (globalThis.TP).est = h.estado;
    for (const e of s.eventos) { if ((e.t === 'heliMissil' || e.t === 'heliFoguete' || e.t === 'heliTorpedo') && e.idx === h.idx) { lanc++; dMax = Math.max(dMax, Math.hypot(e.x - hx, e.y - hy, e.z - hz)); if (e.t === 'heliMissil') { const m = s.misseis[e.m]; const vm = Math.hypot(m.vx, m.vz), vh = Math.hypot(hvx, hvz); if (vm + 1 < vh) vErr++; } }
      if (e.t === 'heliMissil' && e.idx === h.idx) { (globalThis.TP ||= {}).mis = (TP.mis||'') + ` t${s.t.toFixed(0)} d${Math.round(Math.hypot(a.x-h.x,a.z-h.z))}`; (globalThis.MS ||= []).push({ m: s.misseis[e.m], dmin: 1e9 }); }
      if (e.t !== 'heliMissil' && /issil|Missil|intercept|Abate|abate/.test(e.t) ) (globalThis.TP ||= {})['ev_'+e.t] = (TP['ev_'+e.t]||0)+1;
      if (e.t === 'impacto' && e.alvo === a.id) (globalThis.TP ||= {})['i_'+e.tipo+'_'+e.dono] = 1;
      if (e.t === 'heliAbatido' && e.idx === h.idx) (globalThis.TP ||= {}).abat = `t${s.t.toFixed(0)} por ${e.por} comb ${h.comb.toFixed(0)}`;
      if ((e.t === 'impacto' && ['mg', 'foguete', 'missil'].includes(e.tipo) || e.t === 'torpImpacto' && e.leve) && e.alvo === a.id && e.dono === n.id) { imp++; (globalThis.TP ||= {})[e.tipo] = (TP[e.tipo] || 0) + 1; } } s.eventos.length = 0;
    for (const q of (globalThis.MS || [])) if (q.m.ativo) { q.dmin = Math.min(q.dmin, Math.hypot(q.m.x - a.x, q.m.z - a.z)); q.y = q.m.y; q.f = q.m.fase; }
    if (h.H.aviao && h.estado === EST.VOO) { nS++; const vh = Math.hypot(h.vx, h.vz); if (vh > 5) slip = Math.max(slip, Math.abs(Math.atan2(Math.sin(Math.atan2(h.vx, -h.vz) - h.rumo), Math.cos(Math.atan2(h.vx, -h.vz) - h.rumo)))); if (rAnt != null) rr = Math.max(rr, Math.abs(h.roll - rAnt) * 60); rAnt = h.roll;
      const w = Math.abs(Math.atan2(Math.sin(h.rumo - rumo0), Math.cos(h.rumo - rumo0))) * 60; if (w > 9.81 * Math.tan(1.05) / Math.max(25, h.v) * 1.02 + 1e-3) wExc++; } }
  const dano = Math.round(v0 - a.vida + 0); console.log(mod, JSON.stringify(globalThis.TP), (globalThis.MS||[]).map(q=>`dmin ${q.dmin.toFixed(0)} y ${q.y?.toFixed(1)} f ${q.f}`).join(' | ')); globalThis.TP = {}; globalThis.MS = [];
  const arma = HELIS[mod].arma; ok(lanc > 0 || arma === 'mg', `${mod} (${arma}): ${lanc} disparos, origem ≤ ${dMax.toFixed(1)} m da aeronave${arma === 'missil' ? `, míssil mais lento que a aeronave: ${vErr}` : ''}`);
  ok(dMax <= 4.5 && vErr === 0, `${mod}: projétil nasce na arma e herda a velocidade`);
  ok(imp > 0, `${mod}: acertou o alvo (${imp} impactos, dano ≥ ${dano})`);
  if (h.H.aviao) ok(nS > 250 && slip < 0.02 && rr <= 1.66 && wExc === 0, `${mod}: voa como avião — derrapagem máx ${(slip * 57.3).toFixed(2)}°, rolagem máx ${(rr * 57.3).toFixed(0)}°/s, curvas acima do limite g·tanφ/v: ${wExc} (${nS} amostras)`);
}
console.log(f ? `FALHAS ${f}` : 'TUDO OK'); process.exit(f ? 1 : 0);
