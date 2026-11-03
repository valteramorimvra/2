// Naval B v1.3.08 (v1.3.11: bomba atômica do Pica-pau no LANÇAR; lasers e canhão de volta) — CAÇAS ACAUÃ E UIRAÇU (Destróier Amorim) = SISTEMA ORIGINAL DO URUBU-REI (1.2.99), pedido do Valter:
// "o sistema original do Urubu-rei em todos os aspectos, sem adaptação em nada — exceto os botões".
// O navio usa o modo de AERONAVE INDEPENDENTE que o jogo já tem (n.nkAero → botão DECOLAR/VOAR/PILOTAR; sim/nuclear.js lancaNuclear).
// Tudo do voo é o do Urubu-rei, sem gancho nenhum: corrida e saída do convés, voo manual voaManual com os números do Urubu-rei (165–285 m/s),
// IA, esquadrilha (Acauã líder + Uiraçu ala), regresso e pouso, recarga, câmera nkCam, tela nkPasso, fumaça colorida (trilha), neblina
// nas asas (vórtices), motor, flares, reparo, ejeção e queda. O nuclear.js e o nuclearFx.js não têm nenhuma linha destes caças.
// Só os BOTÕES são destes caças: LANÇAR = NUKE · AR-AR = AAM · MÍSSIL = ASM · TORP, com munição por tipo (Acauã 6/4/2/3, Uiraçu 4/4/2/3)
// cheia a cada decolagem, somada dos 2 caças na tela, 7 s entre mísseis/torpedos e 12 s no nuclear tático (comando 'vtArma').
// Zero alocação por quadro: estados criados uma vez por navio.
import { VTOL_SIM } from './vtolDadosSim.js'; import { bloqueado } from './maps.js';
const visV = (sim, o, e, y) => !bloqueado(sim.T, o.x, o.z, o.y, e.x, e.z, y != null ? y : (e.y || 0)); /* v1.3.26 (Valter): caças só atiram com visada livre do relevo */
import { MISSEIS, TORPEDO, HELIS } from './classes.js';
import { lancaArAr } from '../naval5v5/defesa.js'; import { resistMissil } from '../naval5v5/resistAereo.js';
import { lancaNuclear } from './nuclear.js';
import { marcacao, ang } from './util.js';

export const VT = Object.freeze({ intMis: 7, intNuke: 12, tick: 0.1, alcAam: 6000, alcAsm: 9500, alcTorp: 3500, alcNuke: 9000, danoAsm: 26, danoNuke: 60, nukeRaio: 450, nukeDano: 650,
  laser: Object.freeze({ alc: 2600, perm: 1.0, pk: 0.82, rec: 2.6 }), canhao: Object.freeze({ alc: 1500, cone: 0.22 }) }); /* v1.3.11: lasers e canhão de volta (todo o armamento ativo) */
export const VIDA_VT = 2500; /* v1.3.07 (Valter): vida de cada caça */
export const TIPOS_VT = ['aam', 'asm', 'torp', 'nuke'];
export const IDS_VT = ['acaua', 'uiracu'];
const _o = { x: 0, y: 0, z: 0 };

const novoEst = (id) => ({ id, aam: 0, asm: 0, torp: 0, nuke: 0, tMis: 0, tNuke: 0, q: -1, noAr: 0, abat: 0, tCan: 0, las: [{ on: 0, alvo: -1, t: 0, tc: 0, tx: 0, ty: 0, tz: 0 }, { on: 0, alvo: -1, t: 0, tc: 0, tx: 0, ty: 0, tz: 0 }], nk: [-1, -1, -1], nkT: [-1, -1, -1], nkP: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
function enche(E) { const M = VTOL_SIM[E.id].muni; E.aam = M.aam; E.asm = M.asm; E.torp = M.torp; E.nuke = M.nuke; E.tMis = 0; E.tNuke = 0; }
/** estado dos 2 caças do navio (criado uma vez) */
export function instalaVtol(n) { if (n.vtA) return n.vtA; n.vtA = { acaua: novoEst('acaua'), uiracu: novoEst('uiracu') }; enche(n.vtA.acaua); enche(n.vtA.uiracu); n.nkAero = 'acaua'; return n.vtA; }
const estDe = (sim, q) => { if (q.vtE) return q.vtE; const n = sim.navios[q.dono]; return n && n.vtA && q.vtId ? n.vtA[q.vtId] : null; }; /* v1.3.12: no hangar cada caça leva o seu estado (q.vtE) */

/** ponto local do caça (x boreste, y cima, z cauda) no mundo — pelo rumo */
function ponto(q, p, out) { const c = Math.cos(q.rumo), s = Math.sin(q.rumo); out.x = q.x + p[0] * c - p[2] * s; out.z = q.z + p[0] * s + p[2] * c; out.y = q.y + p[1] - 2.2; return out; }
function estacao(E, tipo) { const D = VTOL_SIM[E.id], tot = D.muni[tipo], k = tot - E[tipo]; return D.est[tipo][Math.max(0, Math.min(tot - 1, k))]; }

/** comando 'nuclear' do Destróier Amorim = DECOLAR (fluxo original da aeronave independente): Acauã líder + Uiraçu ala, munição cheia. */
export function lancaVtol(sim, n, cmd) { const A = instalaVtol(n); n.nkAero = 'acaua'; const bk = sim.nkBotAtomica; if (n.papel !== 'jogador') sim.nkBotAtomica = 1; /* os caças NÃO levam bomba; só libera a decolagem do computador */
  const ok = lancaNuclear(sim, n, cmd); sim.nkBotAtomica = bk; if (!ok) return 0; const bomba = n.papel === 'jogador' || !!bk; const q = sim.nukes[n.nk.noAr]; arma(q, A.acaua, bomba);
  let ala = 0; for (const w of sim.nukes) { if (w.lider !== q.idx || w.ativo || !(w.espDec > 0)) continue; if (!ala) { ala = 1; w.aero = 'uiracu'; w.ala = 2; arma(w, A.uiracu, bomba); } /* v1.3.09: Uiraçu na vaga do ÚLTIMO da fila do Urubu-rei (o meio fica vazio) */ else { w.espDec = 0; w.lider = -1; } } /* o navio tem 2 caças: o Uiraçu é o único ala */
  return 1; }
/** v1.3.12 (Valter): no HANGAR o Acauã e o Uiraçu são INDIVIDUAIS — cada um sai com até 3 aeronaves do mesmo tipo (líder + 2 alas) na
 *  formação do Pica-pau (a câmera fica no último); voo e velocidade do Pica-pau; o armamento, as defesas e a IA são os do caça. */
export const ehVtolInd = (n) => !!(n && !n.C.destAmorim && (n.nkAero === 'acaua' || n.nkAero === 'uiracu'));
export function lancaVtolInd(sim, n, cmd) { const ok = lancaNuclear(sim, n, cmd); if (!ok) return 0; const L = sim.nukes[n.nk.noAr]; armaInd(L); let k = 0;
  for (const w of sim.nukes) { if (w.lider !== L.idx) continue; if (k < 2) { k++; armaInd(w); } else { w.espDec = 0; w.lider = -1; w.ativo = 0; } } return 1; }
function armaInd(q) { const E = q.vtE || (q.vtE = novoEst(q.aero)); E.id = q.aero; enche(E); q.vtInd = 1; q.vtId = q.aero; q.H = HELIS.jato; q.misseis = E.asm; q.misAlc = VT.alcAsm; q.misDano = VT.danoAsm; q.misNome = 'ASM'; q.tMis = 1e6; q.aa = E.aam; q.tAA = 0; }
function arma(q, E, bomba) { enche(E); q.vidaMax = q.vida = VIDA_VT; q.H = HELIS.jato; /* v1.3.12 (Valter): configuração de voo e velocidade do Pica-pau */ q.vtol = 1; q.vtId = E.id; q.semBomba = bomba ? 0 : 1; if (!bomba) q.cargas = 0; /* v1.3.11: a MESMA arma nuclear do Pica-pau — a bomba atômica do sistema no LANÇAR (computador só com a bomba ligada) */ q.misseis = E.asm; q.misAlc = VT.alcAsm; q.misDano = VT.danoAsm; q.misNome = 'ASM'; q.tMis = 1e6; q.aa = E.aam; q.tAA = 0;
  E.q = q.idx; E.noAr = 1; E.abat = 0; }

// ---------------- BOTÕES ----------------
let _tp = '';
function inimigoAereo(sim, q, alc) { let best = null, bd = alc, tp = '';
  for (let i = 0; i < sim.helis.length; i++) { const e = sim.helis[i]; if (!e.ativo || e.time === q.time || e.estado < 2 || e.estado > 5) continue; const d = Math.hypot(e.x - q.x, e.y - q.y, e.z - q.z); if (d < bd && visV(sim, q, e)) { bd = d; best = e; tp = 'h'; } }
  for (let i = 0; i < sim.nukes.length; i++) { const e = sim.nukes[i]; if (!e.ativo || e.time === q.time || e.fase < 2) continue; const d = Math.hypot(e.x - q.x, e.y - q.y, e.z - q.z); if (d < bd && visV(sim, q, e)) { bd = d; best = e; tp = 'q'; } }
  _tp = tp; return best; }
function inimigoNavio(sim, q, n, alc) { const a0 = q.alvo >= 0 ? sim.navios[q.alvo] : n && n.alvoId >= 0 ? sim.navios[n.alvoId] : null; if (a0 && !a0.morto && a0.time !== q.time && Math.hypot(a0.x - q.x, a0.z - q.z) < alc && visV(sim, q, a0, (a0.arfagem || 0) + a0.C.F * 0.7)) return a0;
  let best = null, bd = alc; for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (e.morto || e.time === q.time || (e.C && (e.C.civil || e.C.mercante))) continue; const d = Math.hypot(e.x - q.x, e.z - q.z); if (d < bd && visV(sim, q, e, (e.arfagem || 0) + e.C.F * 0.7)) { bd = d; best = e; } } return best; }
function disparaMissil(sim, n, q, E, a, tipo) { const m = sim.misseis.find((x) => !x.ativo); if (!m) return 0; const nuke = tipo === 'nuke'; ponto(q, estacao(E, tipo), _o); const d = Math.hypot(a.x - q.x, a.z - q.z), v0 = Math.max(130, (q.v || 0) + 15);
  const pf = Object.assign({}, MISSEIS.curto, { nome: nuke ? 'Nuclear tático' : 'Antinavio', v: nuke ? 240 : 270, vt: nuke ? 260 : 300, alc: nuke ? VT.alcNuke : VT.alcAsm, dano: nuke ? VT.danoNuke : VT.danoAsm });
  Object.assign(m, { ouro: 0, heli: 1, ativo: 1, x: _o.x, y: _o.y, z: _o.z, vx: Math.sin(q.rumo) * v0, vy: (q.vy || 0) - 4, vz: -Math.cos(q.rumo) * v0, dono: n.id, time: n.time, alvo: a.id, isca: -1, fase: 3, t: 0, v: v0, perfil: pf, cel: 0, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, dano: pf.dano, pkMul: nuke ? 0.6 : 1, velMul: 1, livre: 0, curto: d < 1500 ? 1 : 0, lat: null, vtNk: nuke ? 1 : 0 });
  resistMissil(m); /* v1.3.10 (Valter): armamento dos caças 5× mais resistente à defesa aérea (CIWS, SAM, laser) — o mesmo fator das armas de aeronave do jogo */
  if (nuke) for (let k = 0; k < 3; k++) if (E.nk[k] < 0) { E.nk[k] = m.idx; E.nkT[k] = -1; break; }
  n.stats.misLanc++; sim.evento({ t: 'heliMissil', idx: q.idx, m: m.idx, x: m.x, y: m.y, z: m.z, vt: tipo }); return 1; }
function disparaTorp(sim, n, q, E, a) { const tp = sim.torpedos.find((x) => !x.ativo); if (!tp) return 0; ponto(q, estacao(E, 'torp'), _o); const b = marcacao(q.x, q.z, a.x, a.z);
  Object.assign(tp, { lancha: 0, ativo: 1, x: _o.x, z: _o.z, rumo: b, rumoAlvo: b, v: 10, dono: n.id, time: n.time, alvo: a.id, corrida: TORPEDO.arma, modo: 'acustico', t: 0, buscando: 0, danoMul: 1, alcMax: TORPEDO.arma + 3200, leve: 1 });
  n.stats.torpLanc++; sim.evento({ t: 'heliTorpedo', idx: q.idx, x: q.x, y: q.y - 1.4, z: q.z, tp: tp.idx }); return 1; }
/** 1 arma do tipo pedido deste caça (alvo travado tem prioridade). true = saiu. */
export function disparaVt(sim, n, q, tipo) { const E = estDe(sim, q); if (!E || !q.ativo || !(q.vtol || q.vtInd) || q.fase !== 2 || E[tipo] <= 0) return false; if (tipo === 'nuke' ? E.tNuke > 0 : E.tMis > 0) return false;
  let ok = 0;
  if (tipo === 'aam') { const e = inimigoAereo(sim, q, VT.alcAam); if (e) ok = lancaArAr(sim, q, e, _tp) ? 1 : 0; }
  else { const a = inimigoNavio(sim, q, n, tipo === 'torp' ? VT.alcTorp : tipo === 'nuke' ? VT.alcNuke : VT.alcAsm); if (a) ok = tipo === 'torp' ? disparaTorp(sim, n, q, E, a) : disparaMissil(sim, n, q, E, a, tipo); }
  if (!ok) return false; E[tipo]--; if (tipo === 'nuke') E.tNuke = VT.intNuke; else E.tMis = VT.intMis; return true; }
/** botão da tela (comando 'vtArma'): dispara do líder se tiver a arma pronta; senão do ala. */
export function comandoVtol(sim, n, cmd) { if (TIPOS_VT.indexOf(cmd.tipo) < 0) return; const L = n.nk && n.nk.noAr >= 0 ? sim.nukes[n.nk.noAr] : null;
  if (L && L.vtInd) { if (disparaVt(sim, n, L, cmd.tipo)) return; for (const w of sim.nukes) if (w.ativo && w.vtInd && w.lider === L.idx && disparaVt(sim, n, w, cmd.tipo)) return; sim.evento({ t: 'vtNegado', id: n.id, tipo: cmd.tipo }); return; } /* hangar: líder, depois as alas */
  if (!n.vtA) return;
  if (L && L.vtol && disparaVt(sim, n, L, cmd.tipo)) return;
  for (const id of IDS_VT) { const E = n.vtA[id], q = E.noAr && E.q >= 0 ? sim.nukes[E.q] : null; if (q && q !== L && q.vtol && q.vtId === id && disparaVt(sim, n, q, cmd.tipo)) return; }
  sim.evento({ t: 'vtNegado', id: n.id, tipo: cmd.tipo }); }

function pertoInimigo(sim, n, x, z) { for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (!e.morto && e.time !== n.time && Math.hypot(e.x - x, e.z - z) < e.C.L * 0.5 + 60) return true; } return false; }
function detonaNuke(sim, n, x, y, z) { for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (e.morto || e.time === n.time) continue; const d = Math.hypot(e.x - x, e.z - z); if (d < VT.nukeRaio) sim.dano(e, VT.nukeDano * (1 - d / VT.nukeRaio), n, 'missil'); }
  sim.evento({ t: 'vtNuke', id: n.id, x, y: Math.max(2, y), z }); }
function rastreiaNukes(sim, n, E) { for (let k = 0; k < 3; k++) { const mi = E.nk[k]; if (mi < 0) continue; const m = sim.misseis[mi];
  if (m.ativo && m.vtNk && m.t >= E.nkT[k]) { E.nkT[k] = m.t; E.nkP[k * 3] = m.x; E.nkP[k * 3 + 1] = m.y; E.nkP[k * 3 + 2] = m.z; continue; }
  if (m.ativo) m.vtNk = 0; /* slot reaproveitado por outro míssil */ else if (m.vtNk) { E.nkP[k * 3] = m.x; E.nkP[k * 3 + 1] = m.y; E.nkP[k * 3 + 2] = m.z; m.vtNk = 0; }
  E.nk[k] = -1; if (pertoInimigo(sim, n, E.nkP[k * 3], E.nkP[k * 3 + 2])) detonaNuke(sim, n, E.nkP[k * 3], E.nkP[k * 3 + 1], E.nkP[k * 3 + 2]); } } /* abatido no caminho (longe do alvo) não detona */
function lasers(sim, n, q, E, dt) { const D = VTOL_SIM[E.id], L = VT.laser;
  for (let j = 0; j < 2; j++) { const S = E.las[j]; if (S.tc > 0) { S.tc -= dt; S.on = 0; continue; } ponto(q, D.lasers[j], _o); let best = null, bd = L.alc;
    for (let i = 0; i < sim.misseis.length; i++) { const m = sim.misseis[i]; if (!m.ativo || m.time === q.time || m.t <= 0) continue; const dx = m.x - _o.x, dy = m.y - _o.y, dz = m.z - _o.z, d = Math.hypot(dx, dy, dz); if (!(d < bd)) continue;
      if (j === 0 ? dy < -0.2 * d : dy > 0.2 * d) continue; /* dorsal só acima, ventral só abaixo: a linha nunca cruza a própria aeronave */ if (!visV(sim, _o, m)) continue; bd = d; best = m; }
    if (!best) { S.on = 0; S.alvo = -1; S.t = 0; continue; }
    if (S.alvo !== best.idx) S.t = 0; S.alvo = best.idx; S.on = 1; S.t += dt; S.tx = best.x; S.ty = best.y; S.tz = best.z;
    if (S.t >= L.perm) { S.t = 0; S.tc = L.rec; S.on = 0; if (sim.rng.next() < L.pk * (best.pkMul || 1)) { best.ativo = 0; n.stats.intercept++; sim.evento({ t: 'missilAbatido', idx: best.idx, x: best.x, y: best.y, z: best.z, por: n.id, mount: -1, arma: 'laser' }); } S.alvo = -1; } } }
/** canhão 25/30 mm: no navio travado, à frente e ao alcance (rajadas curtas) */
function canhao(sim, n, q, E, dt) { if (E.tCan > 0) { E.tCan -= dt; return; } const a = q.alvo >= 0 ? sim.navios[q.alvo] : null; if (!a || a.morto || a.time === q.time) return; const d = Math.hypot(a.x - q.x, a.z - q.z); if (d > VT.canhao.alc || !visV(sim, q, a, (a.arfagem || 0) + a.C.F * 0.7)) return;
  if (Math.abs(ang(marcacao(q.x, q.z, a.x, a.z) - q.rumo)) > VT.canhao.cone) return; const H = HELIS[E.id]; const ap = sim.dano ? sim.dano(a, (H.dano || 3) * 0.45 * 6, n, 'heli', true) : 0; E.tCan = 0.8;
  if (ap > 0) sim.evento({ t: 'impacto', x: a.x, y: (a.arfagem || 0) + (a.C ? a.C.F : 4) + 2, z: a.z, alvo: a.id, dono: n.id, cal: E.id === 'uiracu' ? 30 : 25, tipo: 'mg', ly: 2, dano: Math.max(1, Math.round(ap)) }); }
/** IA (fora da pilotagem): no lugar do míssil do sistema, usa as armas dos botões — o líder ataca, o ala se defende (AAM) */
function ia(sim, n, q, E, lider) { if (q.manual) return; if (E.aam > 0 && disparaVt(sim, n, q, 'aam')) return; if (!lider) return;
  if (E.asm > 0 && disparaVt(sim, n, q, 'asm')) return;
  const trav = q.alvo >= 0 && sim.navios[q.alvo] && !sim.navios[q.alvo].morto; /* v1.3.11: a bomba atômica no alvo travado é a IA do próprio sistema (como o Pica-pau) */
  if (q.fase === 2 && !q.espera && E.asm <= 0 && !((q.cargas | 0) > 0) && trav) { q.fase = 3; q.tEsc = 0; sim.evento({ t: 'nkIa', idx: q.idx, id: q.dono, v: 1, motivo: 'base' }); } } /* atacou: volta ao navio, como o Urubu-rei depois da bomba */
/** HUD: soma da munição dos caças no ar (abatido sai da soma). Escreve em out (sem alocar). */
export function somaVt(n, out) { out.aam = out.asm = out.torp = out.nuke = 0; if (!n || !n.vtA) return out; for (const id of IDS_VT) { const E = n.vtA[id]; if (E.abat) continue; out.aam += E.aam; out.asm += E.asm; out.torp += E.torp; out.nuke += E.nuke; } return out; }
const _S = { aam: 0, asm: 0, torp: 0, nuke: 0 };

/** Passo (chamado pelo mundo). Só age no Destróier Amorim. */
export function passoVtolAmorim(sim, dt) { sim._vtAcc = (sim._vtAcc || 0) + dt; const tick = sim._vtAcc >= VT.tick; if (tick) sim._vtAcc = 0;
  for (let i = 0; i < sim.nukes.length; i++) { const q = sim.nukes[i]; if (!q.ativo || !q.vtInd || !q.vtE) continue; const n = sim.navios[q.dono], E = q.vtE; if (!n) continue; /* v1.3.12: caças do hangar */
    if (E.tMis > 0) E.tMis -= dt; if (E.tNuke > 0) E.tNuke -= dt; q.tMis = 1e6; E.nuke = Math.min(VTOL_SIM[E.id].muni.nuke, q.cargas | 0);
    if (tick && q.fase === 2) { lasers(sim, n, q, E, VT.tick); canhao(sim, n, q, E, VT.tick); ia(sim, n, q, E, !(q.lider >= 0)); } else if (q.fase !== 2) E.las[0].on = E.las[1].on = 0;
    if (!(q.lider >= 0)) { let aa = E.aam, as = E.asm; for (const w of sim.nukes) if (w.ativo && w.vtInd && w.lider === q.idx && w.vtE) { aa += w.vtE.aam; as += w.vtE.asm; } q.aa = aa; q.misseis = as; q.tAA = E.aam > 0 && E.tMis > 0 ? sim.t + E.tMis : 0; } }
  for (let ni = 0; ni < sim.navios.length; ni++) { const n = sim.navios[ni]; if (!n.C.destAmorim) continue; const A = instalaVtol(n); let algum = 0;
    for (let k = 0; k < IDS_VT.length; k++) { const E = A[IDS_VT[k]]; if (E.tMis > 0) E.tMis -= dt; if (E.tNuke > 0) E.tNuke -= dt; rastreiaNukes(sim, n, E);
      if (!E.noAr) continue; const q = E.q >= 0 ? sim.nukes[E.q] : null, meu = q && q.vtol && q.vtId === E.id && q.dono === n.id;
      if (meu && q.ativo) { algum = 1; q.tMis = 1e6; E.nuke = Math.min(VTOL_SIM[E.id].muni.nuke, q.cargas | 0); /* pilones nucleares = bombas a bordo */ if (tick && q.fase === 2) { lasers(sim, n, q, E, VT.tick); canhao(sim, n, q, E, VT.tick); ia(sim, n, q, E, !!(n.nk && n.nk.noAr === q.idx)); } else if (q.fase !== 2) E.las[0].on = E.las[1].on = 0; }
      else if (meu && q.espDec > 0 && q.lider >= 0) algum = 1; /* ala aguardando a vez de decolar */
      else { E.noAr = 0; E.q = -1; E.las[0].on = E.las[1].on = 0; if (q && q.fase === 2) E.abat = 1; /* caiu em combate (o pouso original é na fase 3) */ } }
    if (!algum) { A.acaua.abat = A.uiracu.abat = 0; }
    { const L0 = n.nk && n.nk.noAr >= 0 ? sim.nukes[n.nk.noAr] : null; if (L0 && L0.ativo && !L0.vtol && L0.dono === n.id) { arma(L0, A.acaua, 1); for (const w of sim.nukes) if (w.lider === L0.idx && !w.vtol) { if (w.aero && !(w.vtol)) { if (!A.uiracu.noAr) { w.aero = 'uiracu'; arma(w, A.uiracu, 1); } else { w.ativo = 0; w.espDec = 0; w.lider = -1; } } } } } /* decolagem pela IA nuclear (computador com bomba ligada): mesmos caças, sem bomba */
    /* números da tela (AR-AR e MÍSSIL) = soma dos 2 caças */
    const L = n.nk && n.nk.noAr >= 0 ? sim.nukes[n.nk.noAr] : null; if (L && L.vtol) { somaVt(n, _S); L.aa = _S.aam; L.misseis = _S.asm; const E = A[L.vtId]; L.tAA = E && E.aam > 0 && E.tMis > 0 ? sim.t + E.tMis : 0; }
    /* computador: decola quando há inimigo a até 12 km (depois de 20 s) */
    if (tick && n.papel !== 'jogador' && n.papel !== 'alvo' && !n.morto && sim.t > 20 && n.nk && !(n.nk.noAr >= 0) && !(n.nk.tRec > sim.t)) { let a = null, bd = 12000; for (const e of sim.navios) { if (e.morto || e.time === n.time || (e.C && (e.C.civil || e.C.mercante))) continue; const d = Math.hypot(e.x - n.x, e.z - n.z); if (d < bd) { bd = d; a = e; } } if (a) lancaVtol(sim, n, { alvo: a.id }); } } }
