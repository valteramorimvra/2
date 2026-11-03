// Naval B v1.3.11 — FORMAÇÃO MILITAR DE INÍCIO (pedido do Valter, estilo da largada do Modern Warships), só na batalha NORMAL:
//  · cada time = 1 porta-aviões grande, 1 couraçado/capitânia, 1 destróier, 1 cruzador e 1 corveta OU fragata (a mesma escolha nos 2 times);
//    o navio do jogador ocupa a vaga do seu tipo; o lado vermelho recebe, vaga a vaga, o navio do MESMO tipo com poder mais próximo (equilíbrio);
//  · o porta-aviões fica no fundo da formação (vaga de porta-aviões), em posição oposta ao do outro time;
//  · os times começam mais perto (as duas formações se aproximam da zona central igualmente);
//  · nos mapas com ilhas, cada navio procura, perto da sua vaga, um ponto abrigado POR TRÁS de uma ilha em relação ao inimigo (sorteado);
//  · os bots largam em velocidade máxima para chegar ao combate mais cedo (igual nos dois lados).
// Determinístico pela semente (usa o rng da simulação). Não muda duelo, treino, teste de combate nem a batalha personalizada.
import { CLASSES } from './classes.js';
import { poder } from './esquadra.js';
import { alturaTerreno, distTerra } from './maps.js';
import { TIPO_NAVIO } from '../navalTechTreeEconomy.js';

export const FORM_MIL = Object.freeze({ aproxima: 0.3, abrigoMin: 250, abrigoMax: 1200, carrier: 'horizonte' });
/** tipo do navio (mesma regra da árvore tecnológica) */
export function tipoNavio(k) { const C = CLASSES[k]; if (!C) return 'fragata'; if (C.civil || C.mercante) return 'apoio'; if (C.porta || C.superPA) return 'porta'; if (TIPO_NAVIO[k]) return TIPO_NAVIO[k]; if (C.couracado) return 'capitania'; const L = C.L || 100; return L < 105 ? 'corveta' : L < 140 ? 'fragata' : L < 175 ? 'destroier' : L < 235 ? 'cruzador' : 'capitania'; }
const PAPEL = { porta: 'capitania', capitania: 'capitania', destroier: 'batedor', cruzador: 'ataque', corveta: 'batedor', fragata: 'batedor' };

/** monta as 2 frotas. pools = POOL_PAPEL (navios de bot). Devolve { azul (sem o jogador), vermelho, slotJog } no formato [papel, tipo, undefined, funcao]. */
export function formacaoMilitar(rng, pools, classeJog) {
  const todos = [...new Set(Object.values(pools).flat())].filter((k) => CLASSES[k] && !CLASSES[k].mercante && !CLASSES[k].civil && !CLASSES[k].lendario && !CLASSES[k].porta && !CLASSES[k].base);
  const cand = (t) => { const a = todos.filter((k) => tipoNavio(k) === t); return a.length ? a : todos; };
  const tj = tipoNavio(classeJog), pequeno = tj === 'corveta' || tj === 'fragata' ? tj : (rng.next() < 0.5 ? 'corveta' : 'fragata');
  const slots = ['porta', 'capitania', 'destroier', 'cruzador', pequeno]; let slotJog = slots.indexOf(tj); if (slotJog < 0) slotJog = 4;
  const usA = new Set([classeJog]), usV = new Set(), azul = [], vermelho = [];
  const par = (t, kA) => { if (t === 'porta') return CLASSES[kA] && CLASSES[kA].porta && !CLASSES[kA].base ? kA : FORM_MIL.carrier; const P0 = poder(kA); let c = cand(t).filter((k) => !usV.has(k)); if (!c.length) c = cand(t); if (!c.includes(kA) && CLASSES[kA] && !CLASSES[kA].lendario) c = c.concat([kA]);
    const ds = c.map((k) => Math.abs(poder(k) - P0)), m = Math.min(...ds), ok = c.filter((k, i) => ds[i] <= m + Math.max(0.12, P0 * 0.04)); const kV = ok[Math.floor(rng.next() * ok.length)] || c[0]; usV.add(kV); return kV; };
  slots.forEach((t, i) => { const funcao = t === 'porta' ? 'pa' : t === 'capitania' ? 'linha' : t === 'cruzador' ? 'aa' : 'asw';
    if (i === slotJog) { vermelho.push([PAPEL[t], par(t, classeJog), undefined, funcao]); return; }
    let kA; if (t === 'porta') kA = FORM_MIL.carrier; else { let c = cand(t).filter((k) => !usA.has(k)); if (!c.length) c = cand(t); kA = c[Math.floor(rng.next() * c.length)]; } usA.add(kA);
    azul.push([PAPEL[t], kA, undefined, funcao]); vermelho.push([PAPEL[t], par(t, kA), undefined, funcao]); });
  return { azul, vermelho, slotJog, funcaoJog: slots[slotJog] === 'porta' ? 'pa' : undefined }; }

/** a linha (x,z) → (ex,ez) passa por terra (ilha) no primeiro trecho? */
function cobertoPorIlha(T, x, z, ex, ez) { const d = Math.hypot(ex - x, ez - z); for (let u = 120; u < Math.min(d * 0.7, 4500); u += 60) { const f = u / d; if (alturaTerreno(T, x + (ex - x) * f, z + (ez - z) * f) > 2) return true; } return false; }
/** mapas com ilhas: cada navio do time vai para um ponto abrigado por trás de uma ilha (em relação à base inimiga), sorteado perto da sua vaga. */
export function abrigaAtrasDeIlhas(sim, time, base, alvo) { const T = sim.T, rng = sim.rng, lim = T.tam * 0.43; let terra = 0; for (let i = 0; i < 40 && !terra; i++) { const x = (rng.next() - 0.5) * T.tam * 0.8, z = (rng.next() - 0.5) * T.tam * 0.8; if (alturaTerreno(T, x, z) > 2) terra = 1; } if (!terra) return 0;
  let mov = 0; const ocup = sim.navios.filter((q) => q.time === time);
  for (const n of ocup) { const C = n.C; if (C.mercante || C.base || C.aerodromo) continue; const cands = [];
    for (let r = FORM_MIL.abrigoMin; r <= FORM_MIL.abrigoMax; r += 190) for (let a = 0; a < 20; a++) { const b = a / 20 * Math.PI * 2, x = n.x + Math.cos(b) * r, z = n.z + Math.sin(b) * r;
      if (Math.abs(x) > lim || Math.abs(z) > lim || alturaTerreno(T, x, z) > -(C.T + 2.5) || distTerra(T, x, z) < Math.max(C.L * 0.6, 160)) continue;
      if (Math.hypot(x - alvo.x, z - alvo.z) < Math.hypot(n.x - alvo.x, n.z - alvo.z) - 900) continue; /* não avança demais para o inimigo */
      if (ocup.some((q) => q !== n && Math.hypot(q.x - x, q.z - z) < 220)) continue; if (!cobertoPorIlha(T, x, z, alvo.x, alvo.z)) continue; cands.push(x, z); }
    if (!cands.length || cobertoPorIlha(T, n.x, n.z, alvo.x, alvo.z)) continue; const k = Math.floor(rng.next() * (cands.length / 2)) * 2; n.x = cands[k]; n.z = cands[k + 1]; n.rumo = n.rumoAlvo = Math.atan2(alvo.x - n.x, -(alvo.z - n.z)); if (n.rumoAlvo != null) n.rumoAlvo = null; mov++; }
  return mov; }
