// Naval B v1.3.04 — CÓDIGO PRÓPRIO dos caças VTOL do Destróier Amorim (Acauã e Uiraçu), pedido do Valter.
// Não muda nenhuma outra aeronave: tudo aqui só age em helis com modelo 'acaua'/'uiracu' (h.vt). O voo, a câmera base, o canhão
// (arma 'mg' da ficha) e a defesa antiaérea inimiga continuam os do jogo; este módulo acrescenta:
//  · ARMAS POR TIPO e munição FINITA por surtida: AAM / ASM / TORP / NUKE (Acauã 6/4/2/3, Uiraçu 4/4/2/3), intervalo 7 s (míssil e
//    torpedo) e 12 s (nuke); a estação disparada fica VAZIA (o render esconde só aquela peça);
//  · REARME em 15 s pousado no navio; ABATIDO volta pousado e cheio em 20 s;
//  · 2 LASERS (dorsal e ventral) de poder igual e independentes: cada um pega a ameaça mais próxima ao alcance e só atira se a linha
//    não passa pela própria aeronave (dorsal: alvo acima; ventral: alvo abaixo); avaliados a 10 Hz;
//  · NUKE tático (não é a bomba do Urubu-rei): míssil pesado que detona com raio curto; no máx. 2 efeitos ao mesmo tempo (render);
//  · IA dos caças fora da pilotagem: usa as armas por tipo; sem munição volta ao navio, pousa, rearma e retoma;
//  · comando 'vtArma' do HUD (botões somados dos 2 caças): dispara do caça que ainda tem aquela arma.
// Zero alocação por quadro: estados criados uma vez por caça; vetores de trabalho reaproveitados.
import { VTOL_SIM } from './vtolDadosSim.js';
import { EST, REPOE_S } from '../naval5v5/aereo.js';
import { MISSEIS, TORPEDO } from './classes.js';
import { lancaArAr } from '../naval5v5/defesa.js';
import { marcacao, ang } from './util.js';

export const VT = Object.freeze({ intMis: 7, intNuke: 12, rearme: 15, volta: 20, tick: 0.1,
  alcAam: 6000, alcAsm: 9500, alcTorp: 3500, alcNuke: 9000, danoAsm: 26, danoNuke: 60,
  nukeRaio: 450, nukeDano: 650, laser: Object.freeze({ alc: 2600, perm: 1.0, pk: 0.82, rec: 2.6 }) });
export const TIPOS_VT = ['aam', 'asm', 'torp', 'nuke'];
export const ehVtol = (h) => !!h && (h.modelo === 'acaua' || h.modelo === 'uiracu');
const noNavio = (e) => e === EST.HANGAR || e === EST.CONVOO || e === EST.REARMA;
const voando = (e) => e >= EST.DECOLA && e <= EST.POUSO;
const _o = { x: 0, y: 0, z: 0 };

function enche(h) { const M = VTOL_SIM[h.modelo].muni, v = h.vt; v.aam = M.aam; v.asm = M.asm; v.torp = M.torp; v.nuke = M.nuke; }
const cheio = (h) => { const M = VTOL_SIM[h.modelo].muni, v = h.vt; return v.aam >= M.aam && v.asm >= M.asm && v.torp >= M.torp && v.nuke >= M.nuke; };
function instala(sim, n) { n._vtOk = 1; n.reservaAr = Math.max(n.reservaAr || 0, 999); /* abatido sempre volta (pousado e cheio) */
  for (const i of n.helis) { const h = sim.helis[i]; if (!ehVtol(h) || h.vt) continue;
    h.vt = { aam: 0, asm: 0, torp: 0, nuke: 0, tMis: 0, tNuke: 0, tNav: 0, abat: 0, tAb: 0, tSem: 0, tIa: 0,
      las: [{ on: 0, alvo: -1, t: 0, tc: 0, tx: 0, ty: 0, tz: 0 }, { on: 0, alvo: -1, t: 0, tc: 0, tx: 0, ty: 0, tz: 0 }],
      nk: [-1, -1, -1], nkT: [-1, -1, -1], nkP: [0, 0, 0, 0, 0, 0, 0, 0, 0] }; enche(h); } }

/** posição de uma estação/emissor (local do caça: x boreste, y cima, z cauda) no mundo — aproximação por rumo (o mesmo do jogo). */
function ponto(h, p, out) { const c = Math.cos(h.rumo), s = Math.sin(h.rumo); out.x = h.x + p[0] * c - p[2] * s; out.z = h.z + p[0] * s + p[2] * c; out.y = h.y + p[1] - 2.2; return out; }
function estacao(h, tipo) { const D = VTOL_SIM[h.modelo], tot = D.muni[tipo], k = tot - h.vt[tipo]; return D.est[tipo][Math.max(0, Math.min(tot - 1, k))]; }

function inimigoAereo(sim, h, alc) { let best = null, bd = alc; for (let i = 0; i < sim.helis.length; i++) { const e = sim.helis[i]; if (!e.ativo || e.time === h.time || !voando(e.estado)) continue; const d = Math.hypot(e.x - h.x, e.y - h.y, e.z - h.z); if (d < bd) { bd = d; best = e; } } return best; }
function inimigoNavio(sim, h, n, alc) { const a0 = n && n.alvoId >= 0 ? sim.navios[n.alvoId] : null; if (a0 && !a0.morto && a0.time !== h.time && Math.hypot(a0.x - h.x, a0.z - h.z) < alc) return a0;
  let best = null, bd = alc; for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (e.morto || e.time === h.time || (e.C && e.C.civil)) continue; const d = Math.hypot(e.x - h.x, e.z - h.z); if (d < bd) { bd = d; best = e; } } return best; }

function disparaMissil(sim, n, h, a, tipo) { const m = sim.misseis.find((q) => !q.ativo); if (!m) return 0; const nuke = tipo === 'nuke'; ponto(h, estacao(h, tipo), _o); const d = Math.hypot(a.x - h.x, a.z - h.z), v0 = Math.max(130, (h.v || 0) + 15);
  const pf = Object.assign({}, MISSEIS.curto, { nome: nuke ? 'Nuclear tático' : 'Antinavio', v: nuke ? 240 : 270, vt: nuke ? 260 : 300, alc: nuke ? VT.alcNuke : VT.alcAsm, dano: nuke ? VT.danoNuke : VT.danoAsm });
  Object.assign(m, { ouro: 0, heli: 1, ativo: 1, x: _o.x, y: _o.y, z: _o.z, vx: Math.sin(h.rumo) * v0, vy: (h.vy || 0) - 4, vz: -Math.cos(h.rumo) * v0, dono: n.id, time: n.time, alvo: a.id, isca: -1, fase: 3, t: 0, v: v0, perfil: pf, cel: 0, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, dano: pf.dano, pkMul: nuke ? 0.6 : 1, velMul: 1, livre: 0, curto: d < 1500 ? 1 : 0, lat: null, vtNk: nuke ? 1 : 0 });
  if (nuke) { const v = h.vt; for (let k = 0; k < 3; k++) if (v.nk[k] < 0) { v.nk[k] = m.idx; v.nkT[k] = -1; break; } }
  n.stats.misLanc++; sim.evento({ t: 'heliMissil', idx: h.idx, m: m.idx, x: m.x, y: m.y, z: m.z, vt: tipo }); return 1; }
function disparaTorp(sim, n, h, a) { const tp = sim.torpedos.find((q) => !q.ativo); if (!tp) return 0; ponto(h, estacao(h, 'torp'), _o); const b = marcacao(h.x, h.z, a.x, a.z);
  Object.assign(tp, { lancha: 0, ativo: 1, x: _o.x, z: _o.z, rumo: b, rumoAlvo: b, v: 10, dono: n.id, time: n.time, alvo: a.id, corrida: TORPEDO.arma, modo: 'acustico', t: 0, buscando: 0, danoMul: 1, alcMax: TORPEDO.arma + 3200, leve: 1 });
  n.stats.torpLanc++; sim.evento({ t: 'heliTorpedo', idx: h.idx, x: h.x, y: h.y - 1.4, z: h.z, tp: tp.idx }); return 1; }

/** dispara 1 arma do tipo pedido deste caça (alvo automático). true = saiu. */
export function disparaVt(sim, n, h, tipo) { const v = h.vt; if (!v || !voando(h.estado) || v[tipo] <= 0) return false; if (tipo === 'nuke' ? v.tNuke > 0 : v.tMis > 0) return false;
  let ok = 0;
  if (tipo === 'aam') { const e = inimigoAereo(sim, h, VT.alcAam); if (e) ok = lancaArAr(sim, h, e, 'h') ? 1 : 0; }
  else { const a = inimigoNavio(sim, h, n, tipo === 'torp' ? VT.alcTorp : tipo === 'nuke' ? VT.alcNuke : VT.alcAsm); if (a) ok = tipo === 'torp' ? disparaTorp(sim, n, h, a) : disparaMissil(sim, n, h, a, tipo); }
  if (!ok) return false; v[tipo]--; if (tipo === 'nuke') v.tNuke = VT.intNuke; else v.tMis = VT.intMis; return true; }

/** comando do HUD: dispara do caça pilotado se ele tiver a arma; senão do outro caça no ar que tenha. */
export function comandoVtol(sim, n, cmd) { if (!n.helis || TIPOS_VT.indexOf(cmd.tipo) < 0) return; const pil = n.controle >= 0 ? sim.helis[n.helis[n.controle]] : null;
  if (pil && pil.vt && disparaVt(sim, n, pil, cmd.tipo)) return;
  for (const i of n.helis) { const h = sim.helis[i]; if (h !== pil && h.vt && disparaVt(sim, n, h, cmd.tipo)) return; }
  sim.evento({ t: 'vtNegado', id: n.id, tipo: cmd.tipo }); }

function pertoInimigo(sim, n, x, z) { for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (!e.morto && e.time !== n.time && Math.hypot(e.x - x, e.z - z) < e.C.L * 0.5 + 60) return true; } return false; }
function detonaNuke(sim, n, x, y, z) { for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (e.morto || e.time === n.time) continue; const d = Math.hypot(e.x - x, e.z - z); if (d < VT.nukeRaio) sim.dano(e, VT.nukeDano * (1 - d / VT.nukeRaio), n, 'missil'); }
  sim.evento({ t: 'vtNuke', id: n.id, x, y: Math.max(2, y), z }); }

function lasers(sim, n, h, dt) { const D = VTOL_SIM[h.modelo], L = VT.laser;
  for (let j = 0; j < 2; j++) { const E = h.vt.las[j]; if (E.tc > 0) { E.tc -= dt; E.on = 0; continue; } ponto(h, D.lasers[j], _o); let best = null, bd = L.alc;
    for (let i = 0; i < sim.misseis.length; i++) { const m = sim.misseis[i]; if (!m.ativo || m.time === h.time || m.t <= 0) continue; const dx = m.x - _o.x, dy = m.y - _o.y, dz = m.z - _o.z, d = Math.hypot(dx, dy, dz); if (!(d < bd)) continue;
      if (j === 0 ? dy < -0.2 * d : dy > 0.2 * d) continue; /* dorsal só acima, ventral só abaixo: a linha nunca cruza a própria aeronave */ bd = d; best = m; }
    if (!best) { E.on = 0; E.alvo = -1; E.t = 0; continue; }
    if (E.alvo !== best.idx) E.t = 0; E.alvo = best.idx; E.on = 1; E.t += dt; E.tx = best.x; E.ty = best.y; E.tz = best.z;
    if (E.t >= L.perm) { E.t = 0; E.tc = L.rec; E.on = 0; if (sim.rng.next() < L.pk * (best.pkMul || 1)) { best.ativo = 0; n.stats.intercept++; sim.evento({ t: 'missilAbatido', idx: best.idx, x: best.x, y: best.y, z: best.z, por: n.id, mount: -1, arma: 'laser' }); } E.alvo = -1; } } }

function ia(sim, n, h) { const v = h.vt; if (h.ctrl !== 'ia' || !voando(h.estado)) return;
  if (v.aam + v.asm + v.torp + v.nuke <= 0) { if (h.estado === EST.VOO) h.estado = EST.RETORNO; return; } /* sem munição: volta, pousa, rearma e retoma */
  if (v.aam > 0 && disparaVt(sim, n, h, 'aam')) return;
  const nkOk = n.papel !== 'jogador' ? !!sim.nkBotAtomica : false; /* nuke só no comando do jogador; bot só com "Bomba atômica do computador" */
  if (nkOk && v.nuke > 0 && disparaVt(sim, n, h, 'nuke')) return;
  if (v.asm > 0 && disparaVt(sim, n, h, 'asm')) return;
  if (v.torp > 0) disparaVt(sim, n, h, 'torp'); }

/** Passo por tick (chamado pelo mundo). Só faz algo em navios com Acauã/Uiraçu. */
export function passoVtolAmorim(sim, dt) {
  sim._vtAcc = (sim._vtAcc || 0) + dt; const tick = sim._vtAcc >= VT.tick; if (tick) sim._vtAcc = 0;
  for (let ni = 0; ni < sim.navios.length; ni++) { const n = sim.navios[ni]; if (!n.C.destAmorim || !n.helis || !n.helis.length) continue; if (!n._vtOk) instala(sim, n);
    for (const i of n.helis) { const h = sim.helis[i], v = h.vt; if (!v) continue; if (v.tMis > 0) v.tMis -= dt; if (v.tNuke > 0) v.tNuke -= dt;
      if (h.estado === EST.ABATIDO) { if (!v.abat) { v.abat = 1; v.tAb = 0; } v.tAb += dt; if (v.tAb >= VT.volta) { h.terra = 0; if (h.y > -6) h.y = -6; h.tRes = REPOE_S; } } /* volta POUSADO e CHEIO em 20 s contados da queda (o jogo repõe no próximo passo) */
      else if (v.abat) { v.abat = 0; enche(h); }
      if (noNavio(h.estado)) { v.tNav += dt; if (v.tNav >= VT.rearme && !cheio(h)) { enche(h); sim.evento({ t: 'vtRearme', idx: h.idx, id: n.id }); } } else v.tNav = 0;
      for (let k = 0; k < 3; k++) { const mi = v.nk[k]; if (mi < 0) continue; const m = sim.misseis[mi]; if (m.ativo && m.vtNk && m.t >= v.nkT[k]) { v.nkT[k] = m.t; v.nkP[k * 3] = m.x; v.nkP[k * 3 + 1] = m.y; v.nkP[k * 3 + 2] = m.z; } else { if (!m.ativo || m.t < v.nkT[k]) m.vtNk = m.ativo && m.t < v.nkT[k] ? 0 : m.vtNk; /* slot reaproveitado por outro míssil: deixa de ser nuke */ v.nk[k] = -1; if (!m.ativo && m.vtNk) { v.nkP[k * 3] = m.x; v.nkP[k * 3 + 1] = m.y; v.nkP[k * 3 + 2] = m.z; m.vtNk = 0; } /* ponto final do próprio míssil */ if (pertoInimigo(sim, n, v.nkP[k * 3], v.nkP[k * 3 + 2])) detonaNuke(sim, n, v.nkP[k * 3], v.nkP[k * 3 + 1], v.nkP[k * 3 + 2]); } /* abatido no caminho (longe do alvo) não detona */ }
      if (!tick || !voando(h.estado)) { if (!voando(h.estado)) { v.las[0].on = v.las[1].on = 0; } continue; }
      lasers(sim, n, h, VT.tick); ia(sim, n, h);
      if (h.ctrl === 'jog' && v.aam + v.asm + v.torp + v.nuke <= 0) { v.tSem -= VT.tick; if (v.tSem <= 0) { v.tSem = 6; sim.evento({ t: 'vtSemMun', idx: h.idx, id: n.id }); } } } } }

/** Soma da munição dos caças do navio (HUD). Caça abatido sai da soma até voltar. Escreve em out (sem alocar). */
export function somaVt(sim, n, out) { out.aam = out.asm = out.torp = out.nuke = 0; if (!n || !n.helis) return out; for (const i of n.helis) { const h = sim.helis[i]; if (!h.vt || h.estado === EST.ABATIDO) continue; out.aam += h.vt.aam; out.asm += h.vt.asm; out.torp += h.vt.torp; out.nuke += h.vt.nuke; } return out; }
