// v1.2.2 — DETECÇÃO REALISTA (sim determinística: sem rng). Usada pelo jogador E pelos bots (mesmas regras).
// Fontes, da melhor para a pior: visual / sonar / aérea (drone, heli) = CONFIRMADO (modelo, nome e HP de perto);
// radar ATIVO próprio = ponto sem nome (posição boa, classe desconhecida); ESM = o radar ativo DO ALVO o denuncia (só ponto "?").
// Ilhas bloqueiam visão, radar e ESM (o sensor aéreo enxerga por cima). PARAM.deteccao calibra tudo.
import { PARAM } from '../armasParametros.js';

/** Visibilidade da pintura no ambiente (camuflagem do mapa/hora). */
export function camuflagem(sim, e) { const p = String(e.pintura || e.C.pintura || ''); const escuro = sim.hora === 'noite' || sim.hora === 'entardecer'; const cinza = sim.tempo === 'chuva' || sim.tempo === 'nublado';
  if (/dourada|faixas|neon|aurora|ouro/.test(p)) return 1.1; if (/escura|noite/.test(p)) return escuro ? 0.85 : 0.95; if (/artica|cinza/.test(p)) return cinza ? 0.88 : 0.97; return 1; }
/** Alcance visual base do dia/tempo (m). */
export function visBase(sim) { const D = PARAM.deteccao; let v = sim.hora === 'noite' ? D.visNoite : sim.hora === 'entardecer' ? D.visEntardecer : D.visDia; if (sim.tempo === 'chuva') v *= D.chuva; else if (sim.tempo === 'nublado') v *= D.nublado; return v; }
/** Disparou há pouco? (clarão/fumaça do canhão, chama do míssil) */
export const atirouRecente = (sim, e) => e.tTiro != null && sim.t - e.tTiro < PARAM.deteccao.tTiro;
/** Assinatura VISUAL do alvo (1 = destróier de 150 m parado, sem furtividade). */
/** v1.2.14 ASSINATURA POR CLASSE (0 = comum … 1 = muito furtivo): RCS baixo e casco tumblehome = detectado mais tarde/perto em TODOS os sensores. */
export function furtividade(C) { if (C._furt != null) return C._furt; let f = Math.max(0, Math.min(1, (0.8 - (C.rcs ?? 1)) / 0.6)) + (C.casco === 'tumblehome' ? 0.25 : 0) + (C.id === 'furtivo' || C.furtivo ? 0.2 : 0); return (C._furt = Math.max(0, Math.min(1, f))); }
/** multiplicadores por sensor: radar ∝ RCS^0,4 (equação do radar ~ RCS^¼, exagerado p/ jogo), visual −22%, sonar −30%, aéreo −20% no máximo da furtividade */
export const fatorRadar = (C) => Math.pow(Math.max(0.15, C.rcs ?? 1), 0.4) * (1 - 0.15 * furtividade(C));
export const fatorVisual = (C) => 1 - 0.22 * furtividade(C);
export const fatorSonar = (C) => 1 - 0.3 * furtividade(C);
export const fatorAereo = (C) => 1 - 0.2 * furtividade(C);
export function assinaturaVisual(sim, e) { const D = PARAM.deteccao, C = e.C; let a = Math.pow(C.L / D.tamRef, D.tamExp);
  a *= fatorVisual(C); /* v1.2.14: era só a classe 'furtivo' (×0,72) */ a *= camuflagem(sim, e); a *= 1 + D.velMul * Math.min(1, Math.abs(e.v) / C.vmax); if (atirouRecente(sim, e)) a *= sim.hora === 'noite' ? D.tiroMul * 1.25 : D.tiroMul; return Math.max(D.vMin * 0.5, a); }
export const alcVisual = (sim, e) => visBase(sim) * assinaturaVisual(sim, e);
/** Alcance do radar ATIVO de o contra e (seção reta radar rcs; furtivo ainda menor). */
export function alcRadar(o, e) { const D = PARAM.deteccao, C = e.C; return o.C.radar * D.radarMul * fatorRadar(C) * /* v1.2.14: assinatura por classe (antes 0,55+0,45·rcs e só 'furtivo' ×0,75) */ (o.avaria && o.avaria.radar != null ? 0.4 + 0.6 * o.avaria.radar : 1); }
/** Alcance em que o radar ATIVO de e o denuncia (ESM). */
export const alcEsm = (e) => e.C.radar * PARAM.deteccao.radarMul * PARAM.deteccao.esmMul; /* radarMul: horizonte radar contra navios na escala do jogo */
/** Qualidade da fonte: 3 confirmado, 2 radar, 1 ESM. */
export const QUAL = { visual: 3, sonar: 3, uav: 3, heli: 3, radar: 2, esm: 1 };
