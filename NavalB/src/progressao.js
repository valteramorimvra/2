// v1.2.62 — PROGRESSÃO DO PERFIL (1 a 100): de Recruta ao posto mais alto das marinhas do mundo, XP por batalha, prêmio em cada nível,
// totais de carreira (estatísticas do jogador) e CONQUISTAS DE CARREIRA exibíveis na vitrine do perfil. Tudo salvo só no aparelho.
import { pontos } from './navalTrofeus.js';

/* Postos (nível inicial de cada um). Praças → oficiais → oficiais-generais; o topo é o posto honorífico máximo de uma marinha. */
export const POSTOS = [
  [1, 'Recruta'], [3, 'Grumete'], [6, 'Marinheiro'], [10, 'Cabo'], [14, 'Terceiro-Sargento'], [18, 'Segundo-Sargento'], [22, 'Primeiro-Sargento'], [26, 'Suboficial'],
  [31, 'Aspirante'], [35, 'Guarda-Marinha'], [39, 'Segundo-Tenente'], [44, 'Primeiro-Tenente'], [49, 'Capitão-Tenente'], [55, 'Capitão de Corveta'], [61, 'Capitão de Fragata'],
  [67, 'Capitão de Mar e Guerra'], [74, 'Contra-Almirante'], [81, 'Vice-Almirante'], [88, 'Almirante de Esquadra'], [94, 'Almirante'], [98, 'Almirante da Frota'], [100, 'Grande Almirante']];
export const NIVEL_MAX_PERFIL = 100;
const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const postoIdx = (n) => { let i = 0; for (let k = 0; k < POSTOS.length; k++) if (n >= POSTOS[k][0]) i = k; return i; };
/** Nome do nível: posto + grau dentro do posto (ex.: "Cabo II"); o 1º nível de cada posto é a PROMOÇÃO. */
export function nomeNivel(n) { const i = postoIdx(n), ini = POSTOS[i][0], fim = i + 1 < POSTOS.length ? POSTOS[i + 1][0] - 1 : 100; return fim > ini ? `${POSTOS[i][1]} ${ROM[n - ini]}` : POSTOS[i][1]; }
export const promocao = (n) => POSTOS.some((p) => p[0] === n);
/** XP total acumulado para ALCANÇAR o nível n (curva suave: começo rápido, topo exige centenas de batalhas). */
export const xpTotal = (n) => (n <= 1 ? 0 : Math.round(150 * Math.pow(n - 1, 1.55) / 10) * 10);
export const nivelDe = (xp) => { let n = 1; while (n < NIVEL_MAX_PERFIL && xp >= xpTotal(n + 1)) n++; return n; };
/** Prêmio de cada nível (moedas do próprio jogo). Promoção e marcos de 5/10 níveis pagam mais. */
export function premioNivel(n) { if (n <= 1) return null; const p = { prata: 20000 + 4000 * n };
  if (n % 10 === 0) { p.prata = 250000 * (n / 10); p.ouro = 150 * (n / 10); p.nexos = 15 * (n / 10); } else if (n % 5 === 0) p.ouro = 40 + 8 * n;
  if (promocao(n)) { p.ouro = (p.ouro || 0) + 60 + 12 * postoIdx(n); p.nexos = (p.nexos || 0) + 5 + postoIdx(n); }
  if (n === 100) { p.prata = 5000000; p.ouro = 5000; p.nexos = 500; } return p; }

/* ---------- estado salvo (economia) ---------- */
export function estPerfil(eco) { const e = eco.e; if (!e.perfil) { const n0 = 1 + Math.floor((e.batalhas || 0) / 3); e.perfil = { xp: xpTotal(n0), premios: {}, vitrine: [] }; } /* migração: mantém o nível que o menu já mostrava */
  if (!e.tot) e.tot = { semeado: 1, batalhas: e.batalhas || 0, vitorias: e.vitorias || 0, empates: 0, dano: 0, danoRec: 0, tiros: 0, acertos: 0, afundados: 0, aereos: 0, misLanc: 0, misAcertos: 0, torpLanc: 0, torpAcertos: 0, tempo: 0, mvp: 0, detalhadas: 0 };
  return e.perfil; }
/** Semeia os totais detalhados com o histórico das últimas batalhas (uma vez). */
export function semeiaTotais(eco, hist) { const T = eco.e.tot; if (!T || T.semeado !== 1) return; T.semeado = 2; for (const h of hist || []) { const g = h.geral || {}; T.dano += g.dano || 0; T.danoRec += g.danoRec || 0; T.tiros += g.tiros || 0; T.acertos += g.acertos || 0; T.afundados += g.afundados || 0; T.aereos += g.aereos || 0; T.misLanc += g.misLanc || 0; T.misAcertos += g.misAcertos || 0; T.torpLanc += g.torpLanc || 0; T.torpAcertos += g.torpAcertos || 0; T.tempo += h.duracao || 0; if (h.resultado === 'empate') T.empates++; T.detalhadas++; } }
export const nivelPerfil = (eco) => nivelDe(estPerfil(eco).xp);
/** XP ganho numa batalha (personalizada rende 35%, como a prata). */
export function xpBatalha(r, medalhas = []) { const s = r.stats || {}; let x = 120 + (r.vitoria === true ? 180 : r.vitoria == null ? 60 : 0) + Math.min(400, Math.round(pontos(s) / 20)) + 40 * medalhas.length + (r.mvp ? 100 : 0); if (r.pers) x = Math.round(x * 0.35); return x; }
/** Credita XP e totais de carreira; devolve { xp, antes, depois }. */
export function creditaPerfil(eco, r, medalhas) { const P = estPerfil(eco), T = eco.e.tot, s = r.stats || {}; const antes = nivelDe(P.xp), x = xpBatalha(r, medalhas); P.xp += x;
  T.batalhas = eco.e.batalhas; T.vitorias = eco.e.vitorias; if (r.vitoria == null) T.empates++; T.dano += Math.round(s.dano || 0); T.danoRec += Math.round(s.danoRec || 0); T.tiros += s.tiros || 0; T.acertos += s.acertos || 0; T.afundados += s.abates || 0;
  T.aereos += (s.intercept || 0) + (s.menores || 0) + (s.helisAbatidos || 0); T.misLanc += s.misLanc || 0; T.misAcertos += s.misAcertos || 0; T.torpLanc += s.torpLanc || 0; T.torpAcertos += s.torpAcertos || 0; T.tempo += Math.round(r.tempo || 0); if (r.mvp) T.mvp++; T.detalhadas++;
  return { xp: x, antes, depois: nivelDe(P.xp) }; }
export function resgataNivel(eco, n) { const P = estPerfil(eco); if (n > nivelDe(P.xp)) return { ok: false, msg: `Alcance o nível ${n} primeiro` }; if (P.premios[n]) return { ok: false, msg: 'Prêmio já resgatado' }; const p = premioNivel(n); if (!p) return { ok: false, msg: 'Sem prêmio' };
  for (const m of ['prata', 'ouro', 'nexos']) if (p[m]) eco.credita(m, p[m]); P.premios[n] = 1; return { ok: true, msg: `Nível ${n} — prêmio resgatado` }; }
export const pendentes = (eco) => { const P = estPerfil(eco), n = nivelDe(P.xp); let c = 0; for (let i = 2; i <= n; i++) if (!P.premios[i]) c++; return c; };

/* ---------- CONQUISTAS DE CARREIRA (bronze → prata → ouro) ---------- */
export const CARREIRA = [
  ['veterano', 'Veterano', 'Batalhas disputadas', '⚓', (c) => c.T.batalhas, [10, 100, 500]],
  ['vencedor', 'Vencedor', 'Vitórias', '♛', (c) => c.T.vitorias, [5, 50, 250]],
  ['afundador', 'Afundador', 'Navios afundados', '☠', (c) => c.T.afundados, [10, 100, 500]],
  ['artilheiro', 'Artilheiro', 'Acertos de canhão', '◎', (c) => c.T.acertos, [100, 2000, 20000]],
  ['escudo', 'Escudo da Frota', 'Mísseis e aeronaves abatidos', '🛡', (c) => c.T.aereos, [20, 300, 2000]],
  ['missilista', 'Missilista', 'Mísseis no alvo', '➶', (c) => c.T.misAcertos, [10, 150, 1000]],
  ['submarino', 'Lobo do Mar', 'Torpedos no alvo', '≋', (c) => c.T.torpAcertos, [5, 60, 400]],
  ['mvp', 'Destaque', 'Vezes MVP da partida', '★', (c) => c.T.mvp, [1, 15, 100]],
  ['frota', 'Armador', 'Navios na frota', '⛴', (c) => c.navios, [5, 15, 40]],
  ['esquadrilha', 'Esquadrilha', 'Aeronaves no hangar', '✈', (c) => c.aero, [12, 16, 21]],
  ['patente', 'Carreira Naval', 'Nível do perfil', '✪', (c) => c.nivel, [10, 50, 100]],
  ['colecionador', 'Colecionador', 'Medalhas de batalha conquistadas', '❖', (c) => c.medalhas, [10, 100, 500]]];
export const GRAUS = [['Bronze', '#b87333'], ['Prata', '#c0c7cf'], ['Ouro', '#d4af37']];
export function grauCarreira(item, ctx) { const v = item[4](ctx) || 0, lim = item[5]; let g = -1; for (let i = 0; i < 3; i++) if (v >= lim[i]) g = i; return { v, g, prox: g < 2 ? lim[g + 1] : null, ini: g >= 0 ? lim[g] : 0 }; }

/** Insígnia vetorial do posto (divisas de praça, galões de oficial, estrelas de almirante) — desenho original, cores de metal dourado. */
export function insignia(n, cls = '') { const i = postoIdx(n), G = 'url(#ouroIns)'; let c = '';
  const def = '<defs><linearGradient id="ouroIns" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe59a"/><stop offset=".5" stop-color="#d4a72c"/><stop offset="1" stop-color="#8a6410"/></linearGradient></defs>';
  const ancora = '<path d="M32 12v30M24 18h16M18 34c2 8 8 12 14 12s12-4 14-12M18 34l-3 3M46 34l3 3" fill="none" stroke="' + G + '" stroke-width="3.2" stroke-linecap="round"/><circle cx="32" cy="10" r="3.4" fill="none" stroke="' + G + '" stroke-width="2.6"/>';
  const divisa = (k) => Array.from({ length: k }, (_, j) => `<path d="M14 ${22 + j * 9}l18 -10 18 10" fill="none" stroke="${G}" stroke-width="4.6" stroke-linejoin="round"/>`).join('');
  const galao = (k, largo) => Array.from({ length: k }, (_, j) => `<rect x="10" y="${48 - j * 8 - (largo ? 2 : 0)}" width="44" height="${largo ? 7 : 4.2}" rx="1" fill="${G}"/>`).join('') + `<path d="M32 ${40 - k * 8}a5 5 0 1 1 0.1 0" fill="none" stroke="${G}" stroke-width="2.4"/>`;
  const estrela = (x, y, r) => { let d = ''; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.42 : r; d += (k ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1); } return `<path d="${d}Z" fill="${G}"/>`; };
  const estrelas = (k) => { const r = k > 3 ? 6.4 : 8; const xs = Array.from({ length: k }, (_, j) => 32 + (j - (k - 1) / 2) * (r * 2.1)); return xs.map((x) => estrela(x, 26, r)).join('') + `<rect x="10" y="44" width="44" height="7" rx="1" fill="${G}"/>`; };
  if (i <= 2) c = ancora; else if (i <= 6) c = divisa(i - 2); else if (i === 7) c = divisa(3) + `<rect x="18" y="50" width="28" height="4" fill="${G}"/>`;
  else if (i <= 9) c = `<rect x="14" y="40" width="36" height="${i === 8 ? 3 : 5}" rx="1" fill="${G}"/>` + ancora.replace(/stroke-width="3.2"/, 'stroke-width="2.2" opacity=".8"'); else if (i <= 15) c = galao([1, 2, 3, 3, 4, 4][i - 10], i === 15); else if (i <= 19) c = estrelas(i - 14); else if (i === 20) c = estrelas(5); else c = estrelas(5) + `<path d="M8 12l6 6M56 12l-6 6" stroke="${G}" stroke-width="3"/>` + ancora.replace(/stroke-width="3.2"/, 'stroke-width="2" opacity=".55"');
  return `<svg class="ins ${cls}" viewBox="0 0 64 64" aria-hidden="true">${def}${c}</svg>`; }
