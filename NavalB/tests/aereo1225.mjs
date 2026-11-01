// v1.2.25 itens 3/4/5/6 (Node, sem navegador): decolagem de convés (corrida + rotação + subida, espaçamento), drone automático do jogador,
// IA de caças (evasão/quebra/zigue-zague) com RETORNO → pouso enganchado → rearmar → nova decolagem; helicópteros só por LIBERAR (sem 'controle').
import { Sim } from '../src/sim/world.js';
import { criaArena } from '../src/sim/maps.js';
import { EST } from '../src/naval5v5/aereo.js';
const A = criaArena('atois'), P0 = A.plano.centro; const R = {}; const falhas = [];
for (const tipo of (process.env.TIPOS || 'horizonte,atlantico').split(',')) {
  const s = new Sim({ arena: A, seed: 7 }); s.ameacas.ligadas = 0; s.revelaTudo = 1;
  const n = s.adicionaNavio('azul', tipo, P0.x, P0.z, 0.3); const e = s.adicionaNavio('vermelho', 'fragata', P0.x + 7000, P0.z - 3000, 2, 'bot');
  n.v = 6; n.telAlvo = 2; s.aplica({ id: n.id, t: 'radar', v: 1 });
  for (let i = 0; i < 60 * 12; i++) s.passo(); const droneAuto = n.uav >= 0; s.aplica({ id: n.id, t: 'esquadrilha' });
  const dec = [], pous = [], reDec = new Map(); let maxPitchRun = 0, sobeOk = 0, sobeN = 0, saltoMax = 0, evas = 0, quebra = 0; const pos0 = new Map();
  const ult = new Map(); s.evento = ((f) => (ev) => { if (ev.t === 'heliDecola' && ev.id === n.id) dec.push({ t: s.t, idx: ev.idx }); if (ev.t === 'cacaDecolou' && ev.id === n.id) { reDec.set(ev.idx, (reDec.get(ev.idx) || 0) + 1); } if (ev.t === 'heliPousa' && ev.id === n.id) pous.push({ t: s.t, idx: ev.idx }); return f(ev); })(s.evento.bind(s));
  for (let i = 0; i < 60 * 600; i++) { s.passo(); s.eventos.length = 0;
    for (const k of n.helis) { const h = s.helis[k]; const p = ult.get(k); if (p && h.ativo && p.e === h.estado && (h.estado === EST.DECOLA || h.estado === EST.VOO)) { const dd = Math.hypot(h.x - p.x, h.y - p.y, h.z - p.z); saltoMax = Math.max(saltoMax, dd / (1 / 60)); }
      if (h.estado === EST.DECOLA && h.H.aviao) maxPitchRun = Math.max(maxPitchRun, h.pitch || 0); if (h.tSub > 0) { sobeN++; if (h.vy > 0) sobeOk++; } if (h.tQuebra > 0) quebra++; ult.set(k, { x: h.x, y: h.y, z: h.z, e: h.estado }); } }
  const avioes = n.helis.filter((k) => s.helis[k].H.aviao).length; const decA = dec.filter((q) => s.helis[q.idx].H.aviao); const dt = decA.map((q, i) => i ? q.t - decA[i - 1].t : null).filter((x) => x != null); const espMin = dt.length ? Math.min(...dt) : 0;
  const voltaram = [...reDec.values()].filter((v) => v >= 2).length;
  R[tipo] = { aeronaves: n.helis.length, avioes, decolagens: dec.length, espacamentoMinCacas_s: +espMin.toFixed(1), espacamentoMed_s: +(dt.reduce((a, b) => a + b, 0) / Math.max(1, dt.length)).toFixed(1), pitchRotacao_rad: +maxPitchRun.toFixed(3), subidaInicial_vyPositiva: +(sobeOk / Math.max(1, sobeN)).toFixed(3), velMaxAeronave_ms: +saltoMax.toFixed(0), pousos: pous.length, cacasQueRedecolaram: voltaram, quebrasAposDisparo_quadros: quebra, droneAutomatico: droneAuto, controleManual: n.controle };
  console.log(tipo, JSON.stringify(R[tipo]));
  if (!droneAuto) falhas.push(tipo + ': drone não decolou sozinho'); if (espMin < 8) falhas.push(tipo + ': decolagens coladas (' + espMin.toFixed(1) + ' s)'); if (maxPitchRun < 0.1) falhas.push(tipo + ': sem rotação na corrida');
  if (saltoMax > 400) falhas.push(tipo + ': salto/teleporte ' + saltoMax.toFixed(0) + ' m/s'); if (!pous.length) falhas.push(tipo + ': nenhum pouso'); if (!voltaram) falhas.push(tipo + ': nenhum caça voltou, pousou e decolou de novo'); if (n.controle !== -1) falhas.push(tipo + ': controle manual ativo');
}
console.log(falhas.length ? 'FALHOU: ' + falhas.join(' | ') : 'OK'); process.exit(falhas.length ? 1 : 0);
