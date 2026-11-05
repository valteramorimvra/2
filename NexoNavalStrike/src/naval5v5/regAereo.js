// v1.2.30 item 15 — REGISTRO DE DANO DAS AERONAVES (jogador e bots). Só CONTA; não altera dano, AA nem cadência.
// n.stats.danoAereo = HP EFETIVAMENTE aplicado (retorno de sim.dano(): já depois da blindagem, do teto de HP restante e do fogo amigo = 0)
// por míssil, torpedo, foguete e canhão/MG de aeronave. n.stats.aereo[modelo] = { lanc, ac, int, dano, afund } por tipo de aeronave.
//  lanc  = mísseis/torpedos lançados e foguetes disparados (MG: não conta "lançados", é fogo contínuo)
//  ac    = acertos em navio INIMIGO (fogo amigo não conta)   int = armas da aeronave interceptadas por CIWS/laser/30 mm/SAM
//  dano  = HP aplicado    afund = navios inimigos que ESSA arma levou a 0 de HP
import { HELIS } from '../sim/classes.js';
import { resistMissil } from './resistAereo.js'; /* v1.2.30 item 15b */

const vazio = () => ({ lanc: 0, ac: 0, int: 0, dano: 0, afund: 0 });
export function regTipo(n, modelo) { const S = n.stats; const A = S.aereo || (S.aereo = {}); return A[modelo] || (A[modelo] = vazio()); }
const d2 = (a, b) => (a.x - b.x) * (a.x - b.x) + (a.z - b.z) * (a.z - b.z);

/** Envolve dispara(): conta lançamentos e marca o projétil criado com o modelo da aeronave (hm). Mesmo critério de escolha da célula do pool que o dispara(). */
export function regAereoDispara(sim, h, n, a, f) {
  const arma = h.H.arma; let m0 = null, t0 = null, g0 = null;
  if (arma === 'missil') m0 = sim.misseis.find((q) => !q.ativo); else if (arma === 'torpedo') t0 = sim.torpedos.find((q) => !q.ativo);
  else if (arma === 'foguete') { g0 = []; for (let gi = 288; gi < sim.granadas.length && g0.length < 4; gi++) if (!sim.granadas[gi].ativo) g0.push(sim.granadas[gi]); }
  sim._hAr = h; let r; try { r = f(sim, h, n, a); } finally { sim._hAr = null; }
  if (r > 0 && arma !== 'mg') { const t = regTipo(n, h.modelo);
    if (m0) { m0.hm = h.modelo; resistMissil(m0); t.lanc++; } else if (t0) { t0.hm = h.modelo; t.lanc++; } else if (g0) { for (let i = 0; i < r && i < g0.length; i++) g0[i].hm = h.modelo; t.lanc += r; } }
  return r;
}

/** Descobre qual projétil de aeronave causou o dano agora (o do dono mais próximo do navio atingido; ainda ativo durante sim.dano()). */
function fonte(sim, n, dono, como) {
  if (como === 'heli') { const h = sim._hAr; return h && h.dono === dono.id ? h.modelo : null; }
  let b = null, bd = 1e30;
  if (como === 'missil') { for (const m of sim.misseis) { if (!m.ativo || m.dono !== dono.id) continue; const d = d2(m, n); if (d < bd) { bd = d; b = m; } } return b && b.heli ? b.hm || null : null; }
  if (como === 'torpedo') { for (const t of sim.torpedos) { if (!t.ativo || t.dono !== dono.id) continue; const d = d2(t, n); if (d < bd) { bd = d; b = t; } } return b && b.leve ? b.hm || null : null; }
  if (como === 'canhao') { for (const g of sim.granadas) { if (!g.ativo || g.dono !== dono.id) continue; const d = d2(g, n); if (d < bd) { bd = d; b = g; } } return b && b.foguete ? b.hm || null : null; }
  return null;
}
/** Chamado logo APÓS sim.dano(): apl = HP efetivamente aplicado. */
export function regAereoDano(sim, n, dono, como, apl, jaMorto) {
  if (jaMorto || !dono || dono === n || dono.time === n.time) return; /* fogo amigo: 0 e não conta */
  if (como !== 'missil' && como !== 'torpedo' && como !== 'canhao' && como !== 'heli') return;
  const mod = fonte(sim, n, dono, como); if (!mod) return; const t = regTipo(dono, mod); const v = apl || 0;
  t.ac++; t.dano += v; dono.stats.danoAereo = (dono.stats.danoAereo || 0) + v; if (n.morto && v > 0) t.afund++;
}
/** Chamado quando CIWS/laser/30 mm/SAM derruba um míssil (tipo 'm') ou torpedo (tipo 't') em voo. */
export function regAereoInterc(sim, n, tipo, alvo, arma) {
  if (!((tipo === 'm' && alvo.heli) || (tipo === 't' && alvo.leve)) || !alvo.hm) return; const d = sim.navios[alvo.dono]; if (d) regTipo(d, alvo.hm).int++;
  { const s = (n.stats.aereoSis || (n.stats.aereoSis = {})), k = (arma || '?') + ':' + tipo; s[k] = (s[k] || 0) + 1; } /* por sistema de defesa do navio que interceptou (ciws/laser/30mm/sam) */
}
/** Instala o contador em sim.dano (instância) — chamado por instalaAereo. */
export function regAereoInstala(sim) {
  const D0 = sim.dano; if (D0.__regAr) return;
  sim.dano = function (n, d, dono, como, sil) { const jaMorto = !!n.morto; const r = D0.call(this, n, d, dono, como, sil); if (dono) regAereoDano(this, n, dono, como, r, jaMorto); return r; };
  sim.dano.__regAr = 1;
}
/** Soma do dano aéreo por lado (HUD). */
export function danoAereoLado(sim, time) { let a = 0, i = 0; for (const n of sim.navios) { const v = n.stats.danoAereo || 0; if (n.time === time) a += v; else i += v; } return { a, i }; }
/** Tabela do fim da partida: por lado e por tipo de aeronave. */
export function tabelaAereo(sim) {
  const out = { azul: [], vermelho: [] };
  for (const lado of ['azul', 'vermelho']) { const M = {};
    for (const n of sim.navios) { if (n.time !== lado || !n.stats.aereo) continue; for (const k in n.stats.aereo) { const s = n.stats.aereo[k], t = M[k] || (M[k] = Object.assign({ id: k, nome: (HELIS[k] && HELIS[k].nome) || k, arma: (HELIS[k] && HELIS[k].arma) || '' }, vazio())); t.lanc += s.lanc; t.ac += s.ac; t.int += s.int; t.dano += s.dano; t.afund += s.afund; } }
    out[lado] = Object.values(M).filter((t) => t.lanc || t.dano || t.ac).map((t) => Object.assign(t, { dano: Math.round(t.dano) })).sort((x, y) => y.dano - x.dano); }
  return out;
}
