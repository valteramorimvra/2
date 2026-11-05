// v1.3.56 (Valter) — ROTAS DO PILOTO AUTOMÁTICO traçadas no mapa tático.
// O jogador escolhe o inimigo, marca pontos no mapa e confirma: o navio (ou a aeronave que ele pode pilotar) segue os pontos
// e, no fim, ataca o alvo. Navio: a rota só é aceita se nenhum trecho cruzar ilha/baixio (segBloqueado). Aeronave: qualquer rota
// (a IA de voo desvia do relevo sozinha) e com altura escolhida. Mexer na direção PAUSA a rota; retomar recalcula a partir de onde está
// (navio: caminho por água em grade se o trecho até o próximo ponto estiver bloqueado).
import { alturaTerreno } from './maps.js';
import { clamp } from './util.js';

export const ROTA = { maxPts: 24, prof: -7, passo: 60, chegaNavio: 320, chegaAr: 450, altMin: 80, altMax: 3000, grade: 150 };

/** Primeiro ponto de terra/baixio no segmento (amostras a cada 60 m), ou null se o segmento é navegável. */
export function segBloqueado(T, x0, z0, x1, z1) {
  const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.ceil(d / ROTA.passo));
  for (let i = 1; i <= n; i++) { const f = i / n, x = x0 + (x1 - x0) * f, z = z0 + (z1 - z0) * f; if (alturaTerreno(T, x, z) > ROTA.prof) return { x, z, f }; }
  return null;
}
/** Índice do primeiro trecho bloqueado de uma rota que sai de (x0, z0), ou −1 se toda a rota é navegável. */
export function rotaBloqueada(T, x0, z0, pts) { let ax = x0, az = z0; for (let i = 0; i < pts.length; i++) { if (segBloqueado(T, ax, az, pts[i].x, pts[i].z)) return i; ax = pts[i].x; az = pts[i].z; } return -1; }

/** Grade de água (1 = navegável), calculada uma vez por arena e guardada no terreno. */
function agua(T) { if (T._aguaR) return T._aguaR; const c = ROTA.grade, N = Math.ceil(T.tam / c) + 1, o = T.tam / 2, A = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) A[j * N + i] = alturaTerreno(T, i * c - o, j * c - o) < ROTA.prof ? 1 : 0;
  return (T._aguaR = { c, N, o, A }); }
/** Caminho por água (BFS 8-vizinhos) de (x0, z0) até (x1, z1), simplificado por linha de visada. Devolve os pontos (sem a origem) ou null. */
export function caminhoAgua(T, x0, z0, x1, z1) {
  const G = agua(T), { c, N, o, A } = G, ci = (x) => clamp(Math.round((x + o) / c), 0, N - 1);
  const s = ci(z0) * N + ci(x0), g = ci(z1) * N + ci(x1); if (!A[g]) return null;
  const P = new Int32Array(N * N).fill(-1), Q = new Int32Array(N * N); let h = 0, t = 0; P[s] = s; Q[t++] = s;
  while (h < t) { const k = Q[h++]; if (k === g) break; const i = k % N, j = (k / N) | 0;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; const q = jj * N + ii; if (P[q] >= 0 || !A[q]) continue; P[q] = k; Q[t++] = q; } }
  if (P[g] < 0) return null; const cel = []; for (let k = g; k !== s; k = P[k]) cel.push(k); cel.reverse();
  const pts = cel.map((k) => ({ x: (k % N) * c - o, z: ((k / N) | 0) * c - o })); pts[pts.length - 1] = { x: x1, z: z1 };
  const out = []; let ax = x0, az = z0, i = 0; while (i < pts.length) { let j = pts.length - 1; while (j > i && segBloqueado(T, ax, az, pts[j].x, pts[j].z)) j--; out.push(pts[j]); ax = pts[j].x; az = pts[j].z; i = j + 1; }
  return out;
}

/** Comando 'rota' (u: 'n' navio, 'q' Urubu-rei/caça do navio, 'h' aeronave do navio k; p: [x0,z0,x1,z1,…]; alvo; alt) e 'rotaRetoma'. */
export function comandoRota(sim, n, cmd, nkDe) {
  const T = sim.T, lim = T.tam * 0.47, p = Array.isArray(cmd.p) ? cmd.p : [], pts = [];
  for (let i = 0; i + 1 < p.length && pts.length < ROTA.maxPts; i += 2) { const x = +p[i], z = +p[i + 1]; if (Number.isFinite(x) && Number.isFinite(z)) pts.push({ x: clamp(x, -lim, lim), z: clamp(z, -lim, lim) }); }
  const a = cmd.alvo != null && cmd.alvo >= 0 ? sim.navios[cmd.alvo | 0] : null, alvo = a && !a.morto && a.time !== n.time ? a.id : -1;
  const u = cmd.u === 'q' ? nkDe(sim, n) : cmd.u === 'h' ? sim.helis[cmd.k | 0] : n; if (!u || (cmd.u === 'h' && u.dono !== n.id)) return;
  if (cmd.t === 'rotaRetoma') { const R = u.rotaJ; if (!R) return; R.pausa = 0; ativa(sim, n, cmd.u, u, R, true); sim.evento({ t: 'rotaRetoma', id: n.id, u: cmd.u }); return; }
  if (cmd.t === 'rotaPausa') { const R = u.rotaJ; if (!R || R.pausa) return; pausa(sim, n, cmd.u, u); return; }
  if (!pts.length || cmd.v === 0) { u.rotaJ = null; if (cmd.u === 'n') { n.controleIA = n.controle >= 0 ? 1 : 0; } sim.evento({ t: 'rotaFim', id: n.id, u: cmd.u, motivo: 'cancelada' }); return; }
  if (cmd.u === 'n' && rotaBloqueada(T, n.x, n.z, pts) >= 0) { sim.evento({ t: 'rotaNegada', id: n.id, u: 'n' }); return; } /* a validação também roda na simulação (rede) */
  const R = { pts, i: 0, alvo, alt: clamp(+cmd.alt || 600, ROTA.altMin, ROTA.altMax), pausa: 0 }; u.rotaJ = R; ativa(sim, n, cmd.u, u, R, false);
  sim.evento({ t: 'rotaIni', id: n.id, u: cmd.u, n: pts.length, alvo });
}
function ativa(sim, n, tipo, u, R, retoma) {
  if (tipo === 'n') { n.controleIA = 1; n.apAlvo = -1; n.apGraca = sim.t + 1.8; if (retoma && R.i < R.pts.length && segBloqueado(sim.T, n.x, n.z, R.pts[R.i].x, R.pts[R.i].z)) { const c = caminhoAgua(sim.T, n.x, n.z, R.pts[R.i].x, R.pts[R.i].z); if (c && c.length) { c.pop(); R.pts.splice(R.i, 0, ...c); } } }
  else if (tipo === 'q') { u.manual = 0; u.manualPend = 0; u.espera = 0; u.miraSolo = 0; u.pontoFixo = 0; u.ctlRu = u.ctlAl = null; }
  else { u.ctrl = 'ia'; u.apEng = 0; u.apAlvo = -1; u.ctlRu = u.ctlAl = null; }
}
/** Pausa a rota (o jogador mexeu na direção): a unidade volta para a mão dele; o piloto automático mostra PAUSADA. */
export function pausa(sim, n, tipo, u) { const R = u && u.rotaJ; if (!R || R.pausa) return; R.pausa = 1; if (tipo === 'n') { n.controleIA = n.controle >= 0 ? 1 : 0; } else if (tipo === 'q') u.manual = 1; else if (n.controle >= 0 && n.helis && n.helis[n.controle] === u.idx) u.ctrl = 'jog'; sim.evento({ t: 'rotaPausa', id: n.id, u: tipo }); }
/** Rota concluída: entrega o alvo ao ataque normal da IA. */
export function conclui(sim, n, tipo, u) { const R = u.rotaJ; u.rotaJ = null; const a = R && R.alvo >= 0 ? sim.navios[R.alvo] : null, ok = a && !a.morto;
  if (tipo === 'n') { if (ok) { n.apAlvo = a.id; n.alvoId = a.id; n.controleIA = 1; n.rotaFeita = 1; n.apGraca = sim.t + 1.8; } else n.controleIA = n.controle >= 0 ? 1 : 0; }
  else if (tipo === 'q') { if (ok) { u.alvo = a.id; u.ax = a.x; u.az = a.z; u.auto = 1; u.espera = 0; } }
  else if (ok) { u.apAlvo = a.id; u.apEng = 1; u.ctrl = 'ia'; u.missao = 'ataque'; }
  sim.evento({ t: 'rotaFim', id: n.id, u: tipo, motivo: ok ? 'ataque' : 'chegou' }); }
/** Próximo ponto da rota da unidade (avança quando chega). Devolve o ponto, ou null quando a rota terminou (já concluída). */
export function pontoRota(sim, n, tipo, u, raio) { const R = u.rotaJ; if (!R || R.pausa) return null; let w = R.pts[R.i];
  while (w && Math.hypot(w.x - u.x, w.z - u.z) < raio) { R.i++; w = R.pts[R.i]; }
  if (!w) { conclui(sim, n, tipo, u); return null; } return w; }
