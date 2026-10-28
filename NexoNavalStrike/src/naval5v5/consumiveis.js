// v1.2.0 (revisão) — CONSUMÍVEIS DE RECUPERAÇÃO (prata/ouro), comprados no pré-batalha.
// Navio: kit de reparo (cura ao longo do tempo), controle de avarias (fogo/alagamento/módulos; ouro: instantâneo + imunidade),
// bomba de esgoto (tira água, restaura flutuação e trim). Helicóptero: reparo no ar (ouro rearma) e reabastecimento rápido no convoo.
// Determinístico (sem Math.random). O comandante de Controle de avarias (mods.avarias < 1) melhora recarga e efeito.
export const CONS = {
  kit: { nome: 'Kit de reparo', icone: '✚', prata: { custo: { prata: 20_000 }, usos: 2, recarga: 60, cura: 0.15, dur: 6 }, ouro: { custo: { ouro: 30 }, usos: 3, recarga: 40, cura: 0.30, dur: 4 } },
  controle: { nome: 'Controle de avarias', icone: '⛑', prata: { custo: { prata: 15_000 }, usos: 2, recarga: 45, atraso: 2 }, ouro: { custo: { ouro: 25 }, usos: 3, recarga: 25, atraso: 0, imune: 8 } },
  bomba: { nome: 'Bomba de esgoto', icone: '⇡', prata: { custo: { prata: 10_000 }, usos: 2, recarga: 50, taxa: 0.12, dur: 8 }, ouro: { custo: { ouro: 20 }, usos: 3, recarga: 35, taxa: 0.35, dur: 5 } },
  reparoHeli: { nome: 'Reparo de helicóptero', icone: '✈', heli: 1, prata: { custo: { prata: 12_000 }, usos: 2, recarga: 40, cura: 0.40 }, ouro: { custo: { ouro: 20 }, usos: 3, recarga: 30, cura: 0.70, rearma: 1 } },
  abastece: { nome: 'Reabastecimento rápido', icone: '⛽', heli: 1, prata: { custo: { prata: 8_000 }, usos: 3, recarga: 20, fator: 0.75 }, ouro: { custo: { ouro: 15 }, usos: 4, recarga: 15, fator: 0.5 } },
};
export const ORDEM_CONS = ['kit', 'controle', 'bomba', 'reparoHeli', 'abastece'];
const REARMA = 25;
/** sel: { kit: 'prata'|'ouro'|null, ... } */
export function instalaCons(n, sel = {}) { n.cons = {}; n.curaHot = null; n.bombaT = 0; n.imune = 0; n.ctlT = -1;
  for (const k of ORDEM_CONS) { const nv = sel[k]; if (!nv || !CONS[k][nv]) continue; if (CONS[k].heli && !(n.C.heli > 0)) continue; const P = CONS[k][nv]; n.cons[k] = { k, nivel: nv, usos: P.usos, usosMax: P.usos, t: 0, recarga: P.recarga, P }; } }
const fAv = (n) => (n.mods && n.mods.consRec) || 1; // v1.2.21 item 19c: só o comandante de Controle de avarias (−25%·f recarga); antes o módulo e a pintura lendária também aceleravam/curavam sem constar na descrição
const cCura = (n) => (n.mods && n.mods.consCura) || 0;
/** Usa o consumível k (retorna 1 se usou). */
export function usaCons(sim, n, k) { const c = n.cons && n.cons[k]; if (!c || n.morto || c.usos <= 0 || c.t > 0) return 0; const P = c.P, fa = fAv(n);
  if (k === 'kit') { if (n.vida >= n.C.vida) return 0; n.curaHot = { taxa: (n.C.vida * (P.cura + cCura(n))) / P.dur, t: P.dur }; }
  else if (k === 'controle') { n.ctlT = P.atraso; if (P.imune) n.imune = P.imune; if (!P.atraso) aplicaControle(n); }
  else if (k === 'bomba') { n.bombaT = P.dur; n.bombaTaxa = P.taxa; }
  else if (k === 'reparoHeli') { let ok = 0; for (const i of n.helis || []) { const h = sim.helis[i]; if (!h || h.estado === 7 || !h.usado) continue; const vm = h.H.vida; if (h.vida < vm || P.rearma) { h.vida = Math.min(vm, h.vida + vm * P.cura); if (P.rearma) { h.mun = h.munMax; h.comb = h.combMax; } ok = 1; } } if (!ok) return 0; }
  else if (k === 'abastece') { let ok = 0; for (const i of n.helis || []) { const h = sim.helis[i]; if (!h || !h.usado) continue; if (h.estado === 6) { h.tEst = Math.max(h.tEst, REARMA * (1 - P.fator)); ok = 1; } else if (h.estado === 1) { h.comb = h.combMax; h.mun = h.munMax; ok = 1; } } if (!ok) return 0; }
  c.usos--; c.t = c.recarga * fa; n.stats.cons = n.stats.cons || {}; n.stats.cons[k] = (n.stats.cons[k] || 0) + 1; sim.evento({ t: 'consumivel', id: n.id, k, nivel: c.nivel, x: n.x, y: n.C.F + 2, z: n.z }); return 1; }
function aplicaControle(n) { n.incendio = 0; n.alagamento = 0; for (const m in n.avaria) n.avaria[m] = 1; }
export function passoCons(sim, n, dt) { if (!n.cons || n.morto) return; for (const k in n.cons) { const c = n.cons[k]; if (c.t > 0) c.t = Math.max(0, c.t - dt); }
  if (n.curaHot) { const h = n.curaHot; const d = Math.min(dt, h.t); n.vida = Math.min(n.C.vida, n.vida + h.taxa * d); h.t -= dt; if (h.t <= 0) n.curaHot = null; }
  if (n.ctlT > 0) { n.ctlT -= dt; if (n.ctlT <= 0) { n.ctlT = -1; aplicaControle(n); } }
  if (n.imune > 0) { n.imune -= dt; n.incendio = 0; n.alagamento = 0; }
  if (n.bombaT > 0) { n.bombaT -= dt; const r = n.bombaTaxa * dt; n.aguaAbordo = Math.max(0, (n.aguaAbordo || 0) - r); n.lista *= Math.max(0, 1 - r * 2.5); n.trimDano *= Math.max(0, 1 - r * 2.5); if (n.alagamento > 0) n.alagamento = Math.max(0, n.alagamento - r * 40); } }
/** IA: usa consumíveis com regras simples (chamado pela ai.js com tempo de reação já tratado). */
export function querCons(sim, n) { const c = n.cons || {}; const pr = (k) => c[k] && c[k].usos > 0 && c[k].t <= 0;
  if (pr('controle') && (n.incendio > 0 || n.alagamento > 0) && (n.incendio > 0 && n.alagamento > 0 || n.vida < n.C.vida * 0.5)) return 'controle';
  if (pr('kit') && n.vida < n.C.vida * 0.55 && !n.curaHot) return 'kit';
  if (pr('bomba') && (n.aguaAbordo > 0.25 || Math.abs(n.lista || 0) > 0.06)) return 'bomba';
  if (pr('reparoHeli')) for (const i of n.helis || []) { const h = sim.helis[i]; if (h && h.usado && h.estado >= 2 && h.estado <= 5 && h.vida < h.H.vida * 0.5) return 'reparoHeli'; }
  if (pr('abastece')) for (const i of n.helis || []) { const h = sim.helis[i]; if (h && h.usado && h.estado === 6 && h.tEst < 5) return 'abastece'; }
  return null; }
