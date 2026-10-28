// v1.2.2 — DANO REAL de míssil e torpedo. O dano é uma fração do HP de REFERÊNCIA do tier do alvo
// (a escolta de linha do tier: corveta T1, fragata T2, cruzador T3), aplicado SEM a divisão pela blindagem de canhão
// (a blindagem `blind` vale só para granadas). Faixas pedidas: míssil padrão 18–25%, pesado/ouro 30–40%, torpedo 25–35%.
import { CLASSES } from '../sim/classes.js';
import { PARAM } from '../armasParametros.js';

/** HP de referência por tier: o navio de escolta de linha do tier (PARAM.danoReal.ref — corveta / fragata / cruzador). */
export function hpRef(tier) { const k = PARAM.danoReal.ref[tier] || PARAM.danoReal.ref[2]; return (CLASSES[k] && CLASSES[k].vida) || 700; }
const varia = (sim) => 1 + (sim.rng.next() * 2 - 1) * PARAM.danoReal.var;
/** Fração nominal do míssil m (sem variação). */
export function fracMissil(m) { const P = PARAM.danoReal; if (m.heli) return P.missilHeli; const k = m.perfil && m.perfil.chave; const b = P.missil[k] != null ? P.missil[k] : P.missil.medio; const mul = m.danoMul != null ? m.danoMul : m.ouro ? 1.25 : 1; return b * mul; } /* v1.2.21 item 19: ogiva tandem = +25% EXATOS sobre o míssil do navio (antes trocava pela fração 'ouro' = +50–70%) */
/** Fração nominal do torpedo tp. */
export function fracTorpedo(tp) { const P = PARAM.danoReal; return tp.lancha ? P.torpLancha : tp.leve ? P.torpLeve : P.torpedo * (tp.danoMul > 1 ? tp.danoMul : 1) /* v1.2.21 item 19: sem teto de 1,15 (comandante antissubmarino nível 10 = +25%) */; }
export const danoMissil = (sim, alvo, m) => fracMissil(m) * hpRef(alvo.C.tier || 1) * varia(sim);
export const danoTorpedo = (sim, alvo, tp) => fracTorpedo(tp) * hpRef(alvo.C.tier || 1) * varia(sim);
