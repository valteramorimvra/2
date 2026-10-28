// v1.2.26 item C (Node): sequência de convés — 0 aeronaves surgindo no ar, sem teleporte, decolagens 1 a 1 por catapulta, 0 colisões no convés,
// fila de espera funcionando (quem circulou pousou depois). Todos os porta-aviões + navios com hangar.
import { Sim } from '../src/sim/world.js';
import { criaArena } from '../src/sim/maps.js';
import { CLASSES } from '../src/sim/classes.js';
import { EST } from '../src/naval5v5/aereo.js';
import { planoConves } from '../src/naval5v5/convoo1226.js';
const A = criaArena('atois'), P0 = A.plano.centro; const R = {}; const falhas = [];
const pas = Object.values(CLASSES).filter((c) => c.porta === 'pa').map((c) => c.id);
const tipos = (process.env.TIPOS || [...pas, 'kordao', 'cruzador', 'fragata'].join(',')).split(',');
const DUR = +(process.env.DUR || 600);
for (const tipo of tipos) {
  const s = new Sim({ arena: A, seed: 11 }); s.ameacas.ligadas = 0; s.revelaTudo = 1;
  const n = s.adicionaNavio('azul', tipo, P0.x, P0.z, 0.3); s.adicionaNavio('vermelho', 'fragata', P0.x + 9000, P0.z - 4000, 2, 'bot');
  n.v = 6; n.telAlvo = 2; const pc = planoConves(n);
  for (let i = 0; i < 60 * 3; i++) s.passo(); s.aplica({ id: n.id, t: 'esquadrilha' });
  const loc = (h) => { const c = Math.cos(n.rumo), sn = Math.sin(n.rumo), dx = h.x - n.x, dz = h.z - n.z; return { x: dx * c + dz * sn, z: -dx * sn + dz * c, y: h.y - n.arfagem - n.P.convoo.y }; };
  const vis = (h) => h.usado && h.estado >= EST.CONVOO && h.estado <= EST.REARMA && !h.oculto;
  const noConves = (h, l) => vis(h) && l.y < 3 && l.y > -1.5 && Math.abs(l.x) < n.C.B && Math.abs(l.z) < n.C.L / 2 + 10;
  const ant = new Map(); let surgiuAr = 0, surgiuForaPonto = 0, aparicoes = 0, saltoConves = 0, saltoMax = 0, colis = 0, dMin = 1e9; const catT = {}, intCat = []; const esperou = new Set(), pousou = new Set(); let simult = 0;
  const pontos = pc.pa ? pc.el : [pc.hang];
  for (let i = 0; i < 60 * DUR; i++) { const nx = n.x, nz = n.z; s.passo();
    for (const ev of s.eventos) if (ev.id === n.id) { if (ev.t === 'cacaDecolou') { const h = s.helis[ev.idx]; const k = h._catTeste ?? 0; if (catT[k] != null) intCat.push(s.t - catT[k]); catT[k] = s.t; } if (ev.t === 'heliPousa') pousou.add(ev.idx + ':' + Math.floor(s.t)); }
    s.eventos.length = 0; const dk = []; let subindo = 0;
    for (const k of n.helis) { const h = s.helis[k]; if (h.estado === EST.DECOLA && h.dkC >= 0) h._catTeste = h.dkC; if (h.tEspera > 0 && h.estado === EST.RETORNO) esperou.add(k); const l = loc(h), p = ant.get(k), v = vis(h);
      if (v && (!p || !p.v)) { aparicoes++; if (l.y > 3) surgiuAr++; if (!pontos.some((q) => Math.hypot(q.x - l.x, q.z - l.z) < 3) && !(p == null && h.estado === EST.CONVOO)) surgiuForaPonto++; }
      if (v && p && p.v) { const dd = Math.hypot(h.x - p.x - (n.x - nx), h.y - p.y, h.z - p.z - (n.z - nz)) * 60; saltoMax = Math.max(saltoMax, dd); if (noConves(h, l) && p.c && dd > 80) { saltoConves++; if (process.env.DBG && saltoConves < 6) console.log("salto", k, h.modelo, p.e, h.estado, h.dk && h.dk.f, Math.round(dd), JSON.stringify(l)); } if (process.env.DBG && dd > 420) console.log("SALTO", k, h.modelo, p.e, h.estado, h.dk && h.dk.f, Math.round(dd), JSON.stringify(l), h.sRel, h.lzP, s.t); }
      if (noConves(h, l)) dk.push({ ...l, k, e: h.estado, f: h.dk && h.dk.f, m: h.modelo }); if (h.estado === EST.DECOLA && !h.H.aviao || h.estado === EST.DECOLA && h.H.id === 'jato') subindo++;
      ant.set(k, { x: h.x, y: h.y, z: h.z, v, c: noConves(h, l), e: h.estado }); }
    simult = Math.max(simult, subindo);
    for (let a = 0; a < dk.length; a++) for (let b = a + 1; b < dk.length; b++) { const d = Math.hypot(dk[a].x - dk[b].x, dk[a].z - dk[b].z); dMin = Math.min(dMin, d); if (d < 11) { colis++; if (process.env.DBG && colis < 4) console.log("COL", JSON.stringify(dk[a]), JSON.stringify(dk[b]), s.t); } } }
  const pousaramDepois = [...esperou].filter((k) => [...pousou].some((q) => +q.split(':')[0] === k)).length;
  const espMinCat = intCat.length ? Math.min(...intCat) : null;
  R[tipo] = { aeronaves: n.helis.length, elevadores: pc.el.length, catapultas: pc.cats.length, aparicoes, surgiuNoAr: surgiuAr, surgiuForaDoElevadorHangar: surgiuForaPonto, saltoNoConves: saltoConves, velMaxRel_ms: Math.round(saltoMax),
    colisoesConves_quadros: colis, distMinConves_m: dMin < 1e9 ? +dMin.toFixed(1) : null, decolagensPista: intCat.length + Object.keys(catT).length, intervaloMinPorCatapulta_s: espMinCat != null ? +espMinCat.toFixed(1) : null, verticaisSimultaneas: simult,
    pousos: pousou.size, emEspera: esperou.size, esperaramEPousaram: pousaramDepois, arremetidas: s.stConves.arremetidas, abatidos: n.helis.filter((k) => s.helis[k].estado === EST.ABATIDO).length, semCombustivel: n.helis.filter((k) => s.helis[k].estado === EST.ABATIDO && s.helis[k].comb <= -29).length };
  console.log(tipo, JSON.stringify(R[tipo]));
  const f = (m) => falhas.push(tipo + ': ' + m);
  if (surgiuAr) f(surgiuAr + ' aeronave(s) surgiram no ar'); if (surgiuForaPonto) f(surgiuForaPonto + ' surgiram fora do elevador/hangar'); if (saltoConves) f('teleporte no convés ×' + saltoConves); if (saltoMax > 420) f('salto ' + Math.round(saltoMax) + ' m/s');
  if (colis) f('colisão no convés (' + colis + ' quadros, dMin ' + dMin.toFixed(1) + ' m)'); if (espMinCat != null && espMinCat < 8) f('decolagens coladas na mesma catapulta: ' + espMinCat.toFixed(1) + ' s'); if (!pousou.size) f('nenhum pouso');
  if (esperou.size && !pousaramDepois) f('ninguém que esperou pousou');
}
const tem = Object.values(R).some((r) => r.emEspera > 0); if (!tem) falhas.push('nenhuma fila de espera exercitada');
console.log(JSON.stringify({ falhas }, null, 1)); process.exit(falhas.length ? 1 : 0);
