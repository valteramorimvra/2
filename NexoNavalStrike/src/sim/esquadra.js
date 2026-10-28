// v1.2.25 item 9 — EQUILÍBRIO DE TIMES: cada lado é uma ESQUADRA com funções (linha de canhões + capitania, escolta AA, ASW/torpedo, apoio;
// o porta-aviões ocupa a vaga da capitania quando ligado). As vagas dos dois lados são sorteadas AOS PARES: o lado vermelho recebe, para cada vaga,
// o navio do mesmo papel/função com PODER mais próximo do navio azul (e o do jogador é espelhado da mesma forma). Determinístico pela semente.
import { CLASSES } from './classes.js';
/** papel de IA (batedor/ataque/capitania) + função de esquadra, na ordem de montagem (a capitania por último: o porta-aviões a substitui). */
export const ESQUADRA8 = [['batedor', 'apoio'], ['batedor', 'asw'], ['ataque', 'aa'], ['ataque', 'linha'], ['ataque', 'asw'], ['batedor', 'aa'], ['ataque', 'apoio'], ['capitania', 'linha']];
const dps = (C) => (C.canhao ? C.canhao.dano / Math.max(0.3, C.canhao.cad) : 0);
/** poder de combate aproximado (vida, artilharia, mísseis, defesa AA, torpedos, aeronaves). */
export function poder(k) { const C = CLASSES[k]; if (!C) return 0; return C.vida / 1000 + dps(C) * 0.12 + (C.vls || 0) / 16 + (C.sam || 0) / 16 + (C.torp || 0) / 12 + (C.heli || 0) * 0.12; }
/** a classe serve para a função? */
export function serve(k, f) { const C = CLASSES[k]; if (!C) return false; const cal = C.canhao ? C.canhao.cal : 0;
  if (f === 'linha') return cal >= 127; if (f === 'aa') return (C.sam || 0) >= 12; if (f === 'asw') return (C.torp || 0) >= 6 && (C.heli || 0) >= 1; return true; }
/** melhor função de uma classe (para encaixar o navio do jogador): AA > ASW > linha > apoio conforme o perfil. */
export function funcaoDe(k, papel) { const C = CLASSES[k] || {}; const cand = ESQUADRA8.filter(([p]) => p === papel).map(([, f]) => f); const nota = { aa: (C.sam || 0) / 12, asw: ((C.torp || 0) >= 6 && (C.heli || 0) >= 1 ? 0.8 : 0) + (C.rbu ? 0.3 : 0), linha: C.canhao && C.canhao.cal >= 127 ? dps(C) / 8 : 0, apoio: 0.5 };
  let best = cand[0] || 'apoio', bn = -1; for (const f of cand) if (serve(k, f) && nota[f] > bn) { bn = nota[f]; best = f; } return best; }
/** monta as duas esquadras. pools = POOL_PAPEL; meu = papel do jogador; classe = classe do jogador. Devolve { azul: [[papel,tipo,undefined,funcao]…] (sem o jogador), vermelho, slotJog, funcaoJog }. */
export function esquadras(rng, pools, meu, classe, op = {}) {
  const pool = (p, f) => { const a = (pools[p] || []).filter((k) => serve(k, f)); return a.length ? a : pools[p] || []; };
  const funcaoJog = funcaoDe(classe, meu); let slotJog = ESQUADRA8.findIndex(([p, f]) => p === meu && f === funcaoJog); if (slotJog < 0) slotJog = Math.max(0, ESQUADRA8.findIndex(([p]) => p === meu));
  const usA = new Set([classe]), usV = new Set(), azul = [], vermelho = [];
  const par = (pA, f, kA) => { const P0 = poder(kA); let c = pool(pA, f).filter((k) => !usV.has(k)); if (!c.length) c = pool(pA, f); if (!c.includes(kA) && !usV.has(kA) && CLASSES[kA] && !CLASSES[kA].lendario && !CLASSES[kA].porta) c = c.concat([kA]); /* o espelho pode ser a MESMA classe quando ela é a mais próxima */
    const ds = c.map((k) => Math.abs(poder(k) - P0)); const m = Math.min(...ds); const ok = c.filter((k, i) => ds[i] <= m + Math.max(0.12, P0 * 0.04)); const kV = ok[Math.floor(rng.next() * ok.length)] || c[0]; usV.add(kV); return kV; };
  const fora = new Set(); if (op.pa) fora.add(slotJog === 7 ? 6 : 7); if (op.merc) { for (const i of [6, 4, 2, 3]) if (i !== slotJog && !fora.has(i)) { fora.add(i); break; } } /* porta-aviões no lugar da capitania; mercante no lugar de um 'ataque' — dos DOIS lados */
  ESQUADRA8.forEach(([p, f], i) => { if (fora.has(i)) return; if (i === slotJog) { vermelho.push(Object.assign([p, par(p, f, classe), undefined, f], { slot: i })); return; }
    let c = pool(p, f).filter((k) => !usA.has(k)); if (!c.length) c = pool(p, f); const kA = c[Math.floor(rng.next() * c.length)]; usA.add(kA); azul.push([p, kA, undefined, f]); vermelho.push(Object.assign([p, par(p, f, kA), undefined, f], { slot: i })); });
  if (op.troca) { let ia = 0; ESQUADRA8.forEach((_, i) => { if (fora.has(i)) return; const iv = vermelho.findIndex((q) => q.slot === i); if (i !== slotJog) { const t = azul[ia][1]; azul[ia][1] = vermelho[iv][1]; vermelho[iv][1] = t; ia++; } }); } /* só teste de espelho: troca as classes entre os lados (menos a vaga do jogador) */
  for (const q of vermelho) delete q.slot; return { azul, vermelho, slotJog, funcaoJog }; }
export const poderLista = (L) => L.reduce((a, q) => a + poder(q[1]), 0);
