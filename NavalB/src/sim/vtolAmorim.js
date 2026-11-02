// Naval B v1.3.06 — CAÇAS ACAUÃ E UIRAÇU (Destróier Amorim) NO SISTEMA TOTAL DO URUBU-REI, pedido do Valter:
// "a tela de armamento do Lençóis Maranhenses adaptada ao novo navio: o botão nuclear é a DECOLAGEM; ao liberar a aeronave aparece o
//  sistema total do Urubu-rei (física de voo, fumaça colorida, neblina nas asas, câmera da 1.2.99 adaptados) e os botões adaptados aos caças".
// Como: o navio usa o modo de AERONAVE INDEPENDENTE que o jogo já tem (n.nkAero → botão DECOLAR/VOAR, sim/nuclear.js lancaNuclear):
// os caças são aeronaves do pool do Urubu-rei (sim.nukes) — voo manual = voaManual (ramo das aeronaves independentes), IA, esquadrilha
// (Acauã líder + Uiraçu ala), câmera nkCam, tela nkPasso, fumaça, vórtices de ponta de asa, flares, reparo e ejeção = os do Urubu-rei.
// O Urubu-rei NÃO muda: o nuclear.js só ganhou o gancho `q.vtol` (espelhando `q.rotor`), que chama decolaVtol/pousoVtol daqui.
// Próprio dos caças (este arquivo): decolagem e pouso VERTICAIS no heliponto (z 60,5 / 76,5), armas por tipo com munição finita por
// surtida — AAM / ASM / TORP / NUKE tático (Acauã 6/4/2/3, Uiraçu 4/4/2/3), 7 s (míssil/torpedo) e 12 s (nuke) —, rearme 15 s pousado,
// abatido volta pousado e cheio em 20 s, 2 lasers (dorsal só acima, ventral só abaixo), canhão no alvo travado à frente e a IA.
// Zero alocação por quadro: estados criados uma vez por navio; vetores de trabalho reaproveitados.
import { VTOL_SIM } from './vtolDadosSim.js';
import { MISSEIS, TORPEDO, HELIS } from './classes.js';
import { lancaArAr } from '../naval5v5/defesa.js';
import { lancaNuclear, NUK } from './nuclear.js';
import { marcacao, ang, clamp } from './util.js';

export const VT = Object.freeze({ intMis: 7, intNuke: 12, rearme: 15, volta: 20, tick: 0.1,
  alcAam: 6000, alcAsm: 9500, alcTorp: 3500, alcNuke: 9000, danoAsm: 26, danoNuke: 60, nukeRaio: 450, nukeDano: 650,
  laser: Object.freeze({ alc: 2600, perm: 1.0, pk: 0.82, rec: 2.6 }), canhao: Object.freeze({ alc: 1500, cone: 0.22 }),
  /** heliponto (local do navio: proa −z) e decolagem/pouso verticais */ spot: Object.freeze({ acaua: 60.5, uiracu: 76.5 }), deckY: 8.24, hPaira: 58, tSobe: 5, tTrans: 5, rPouso: 1500 });
export const TIPOS_VT = ['aam', 'asm', 'torp', 'nuke'];
export const IDS_VT = ['acaua', 'uiracu'];
const _o = { x: 0, y: 0, z: 0 };

const novoEst = (id) => ({ id, aam: 0, asm: 0, torp: 0, nuke: 0, tMis: 0, tNuke: 0, tPronto: 0, refil: 0, q: -1, noAr: 0, pousou: 0, abat: 0, voou: 0, tCan: 0, tSem: 0,
  las: [{ on: 0, alvo: -1, t: 0, tc: 0, tx: 0, ty: 0, tz: 0 }, { on: 0, alvo: -1, t: 0, tc: 0, tx: 0, ty: 0, tz: 0 }], nk: [-1, -1, -1], nkT: [-1, -1, -1], nkP: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
function enche(E) { const M = VTOL_SIM[E.id].muni; E.aam = M.aam; E.asm = M.asm; E.torp = M.torp; E.nuke = M.nuke; }
/** estado dos 2 caças do navio (criado uma vez) */
export function instalaVtol(n) { if (n.vtA) return n.vtA; n.vtA = { acaua: novoEst('acaua'), uiracu: novoEst('uiracu') }; enche(n.vtA.acaua); enche(n.vtA.uiracu); n.nkAero = 'acaua'; return n.vtA; }
const estDe = (sim, q) => { const n = sim.navios[q.dono]; return n && n.vtA && q.vtId ? n.vtA[q.vtId] : null; };
const voando = (q) => q && q.ativo && q.vtol && q.fase >= 2;

/** ponto local do caça (x boreste, y cima, z cauda) no mundo — pelo rumo (o mesmo do jogo) */
function ponto(q, p, out) { const c = Math.cos(q.rumo), s = Math.sin(q.rumo); out.x = q.x + p[0] * c - p[2] * s; out.z = q.z + p[0] * s + p[2] * c; out.y = q.y + p[1] - 2.2; return out; }
function estacao(E, tipo) { const D = VTOL_SIM[E.id], tot = D.muni[tipo], k = tot - E[tipo]; return D.est[tipo][Math.max(0, Math.min(tot - 1, k))]; }

// ---------------- DECOLAGEM E POUSO VERTICAIS (gancho q.vtol do nuclear.js, espelho de q.rotor) ----------------
/** fase 1: sobe na vertical do seu ponto do heliponto (5 s), depois transição para o voo à frente (5 s). true = tratado. */
export function decolaVtol(sim, q, n, dt) { if (!n || n.morto) return false; const z = VT.spot[q.vtId] ?? 66, vMin = q.H ? q.H.vmax * 0.36 : NUK.vDecola;
  if (q.t < VT.tSobe) { const u = q.t / VT.tSobe, s = u * u * (3 - 2 * u); sim.mundo(n, 0, VT.deckY + s * VT.hPaira, z, _o); q.x = _o.x; q.y = _o.y; q.z = _o.z; q.rumo = n.rumo; q.v = n.v || 0; q.vx = Math.sin(n.rumo) * q.v; q.vz = -Math.cos(n.rumo) * q.v; q.vy = 0; q.pitch = 0; q.roll = 0; return true; }
  if (q.t < VT.tSobe + VT.tTrans) { q.v = Math.min(vMin, Math.max(q.v, n.v || 0) + (vMin / VT.tTrans) * dt); q.vy = 3; q.vx = Math.sin(q.rumo) * q.v; q.vz = -Math.cos(q.rumo) * q.v; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.pitch = 0.04; q.roll = 0; return true; }
  q.fase = 2; q.v = Math.max(q.v, vMin); q.vy = 3; q.gam = Math.atan2(3, q.v); sim.evento({ t: 'nkNoAr', idx: q.idx, id: q.dono });
  if (q.volta) { q.volta = 0; q.fase = 3; q.tEsc = 0; q.manual = 0; } if (q.manualPend) { q.manualPend = 0; q.manual = 1; q.gam = Math.atan2(3, q.v); q.bank = 0; q.sx = q.sy = 0; sim.evento({ t: 'nkIa', idx: q.idx, id: q.dono, v: 0 }); }
  return false; }
/** fase 3 perto do navio: aproximação, pairado sobre o SEU ponto e pouso vertical (o Urubu-rei "some" a 400 m; o caça pousa). true = tratado. */
export function pousoVtol(sim, q, n, dt) { if (!n || n.morto) return false; const z = VT.spot[q.vtId] ?? 66; sim.mundo(n, 0, VT.deckY, z, _o); const dx = _o.x - q.x, dz = _o.z - q.z, d = Math.hypot(dx, dz);
  if (!q.vtPouso && d > VT.rPouso) return false; if (!q.vtPouso) { q.vtPouso = 1; q.manual = 0; sim.evento({ t: 'vtAproxima', idx: q.idx, id: q.dono }); }
  const perto = d <= 25, alvoY = _o.y + (perto ? 0 : VT.hPaira), vAlvo = perto ? 0 : clamp(d * 0.12, 6, Math.max(60, q.v * 0.98)); q.v += clamp(vAlvo - q.v, -9 * dt, 6 * dt); if (q.v < 0) q.v = 0;
  const br = d > 2 ? Math.atan2(dx, -dz) : n.rumo; q.rumo = ang(q.rumo + clamp(ang(br - q.rumo), -0.7 * dt, 0.7 * dt));
  const nvx = (n.v || 0) * Math.sin(n.rumo), nvz = -(n.v || 0) * Math.cos(n.rumo);
  if (!perto) { q.vx = Math.sin(q.rumo) * q.v; q.vz = -Math.cos(q.rumo) * q.v; } else { const vh = Math.min(d, 6); q.vx = dx / Math.max(d, 1e-3) * vh + nvx; q.vz = dz / Math.max(d, 1e-3) * vh + nvz; }
  q.vy = clamp((alvoY - q.y) * 0.5, perto ? -4 : -12, 8); q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.pitch = perto ? 0 : -0.04; q.roll = 0; q.bank = 0; q.gam = 0;
  if (d <= 3 && q.y <= _o.y + 0.4) { q.ativo = 0; q.vtPouso = 0; const E = estDe(sim, q); if (E) E.pousou = 1; const k = n.nk; if (k && k.noAr === q.idx) k.noAr = -1;
    for (const w of sim.nukes) if (w.lider === q.idx && !w.ativo && w.espDec > 0) { w.espDec = 0; w.lider = -1; } /* ala que nem decolou fica no convés */
    sim.evento({ t: 'nkPousa', idx: q.idx, id: q.dono, comBomba: 0, restam: 'ilimitado' }); sim.evento({ t: 'vtPousou', idx: q.idx, id: q.dono, vt: q.vtId }); }
  return true; }

// ---------------- DECOLAR (botão do navio) ----------------
const pronto = (sim, E) => !E.noAr && sim.t >= E.tPronto;
/** comando 'nuclear' do Destróier Amorim = DECOLAR: o 1º caça disponível sai como LÍDER (você pilota) e o outro como ALA (esquadrilha do Urubu-rei). */
export function lancaVtol(sim, n, cmd) { const A = instalaVtol(n); const ids = IDS_VT.filter((id) => pronto(sim, A[id])); if (!ids.length || n.morto) { sim.evento({ t: 'nkNegado', id: n.id, motivo: n.morto ? 'morto' : 'recarga' }); return 0; }
  if (n.nk && n.nk.noAr >= 0) { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'noAr' }); return 0; }
  n.nkAero = ids[0]; if (n.nk) n.nk.tRec = 0; const bk = sim.nkBotAtomica; if (n.papel !== 'jogador') sim.nkBotAtomica = 1; /* os caças NÃO levam bomba; só libera a decolagem do computador */ const ok = lancaNuclear(sim, n, cmd); sim.nkBotAtomica = bk; if (!ok) return 0; const q = sim.nukes[n.nk.noAr]; arma(n, q, ids[0]);
  let ala = 0; for (const w of sim.nukes) { if (w.lider !== q.idx || w.ativo || !(w.espDec > 0)) continue; if (!ala && ids[1]) { ala = 1; w.aero = ids[1]; w.H = HELIS[ids[1]]; arma(n, w, ids[1]); w.espDec = 2.6; w.ala = 1; } else { w.espDec = 0; w.lider = -1; } } /* só 1 ala (o outro caça) — as outras 3 vagas da esquadrilha independente ficam no pool */
  return 1; }
export const VIDA_VT = 2500; /* v1.3.07 (Valter): vida de cada caça */
function arma(n, q, id) { const E = n.vtA[id]; q.vidaMax = q.vida = VIDA_VT; q.vtol = 1; q.vtId = id; q.vtPouso = 0; q.semBomba = 1; q.cargas = 0; q.misseis = E.asm; q.misAlc = VT.alcAsm; q.misNome = 'ASM'; q.tMis = 1e6; q.aa = E.aam; q.tAA = 0; q.altV = 0;
  E.q = q.idx; E.noAr = 1; E.pousou = 0; E.abat = 0; E.voou = 0; }

// ---------------- ARMAS ----------------
let _tp = '';
function inimigoAereo(sim, q, alc) { let best = null, bd = alc, tp = '';
  for (let i = 0; i < sim.helis.length; i++) { const e = sim.helis[i]; if (!e.ativo || e.time === q.time || e.estado < 2 || e.estado > 5) continue; const d = Math.hypot(e.x - q.x, e.y - q.y, e.z - q.z); if (d < bd) { bd = d; best = e; tp = 'h'; } }
  for (let i = 0; i < sim.nukes.length; i++) { const e = sim.nukes[i]; if (!e.ativo || e.time === q.time || e.fase < 2) continue; const d = Math.hypot(e.x - q.x, e.y - q.y, e.z - q.z); if (d < bd) { bd = d; best = e; tp = 'q'; } }
  _tp = tp; return best; }
function inimigoNavio(sim, q, n, alc) { const a0 = q.alvo >= 0 ? sim.navios[q.alvo] : n && n.alvoId >= 0 ? sim.navios[n.alvoId] : null; if (a0 && !a0.morto && a0.time !== q.time && Math.hypot(a0.x - q.x, a0.z - q.z) < alc) return a0;
  let best = null, bd = alc; for (let i = 0; i < sim.navios.length; i++) { const e = sim.navios[i]; if (e.morto || e.time === q.time || (e.C && (e.C.civil || e.C.mercante))) continue; const d = Math.hypot(e.x - q.x, e.z - q.z); if (d < bd) { bd = d; best = e; } } return best; }
function disparaMissil(sim, n, q, E, a, tipo) { const m = sim.misseis.find((x) => !x.ativo); if (!m) return 0; const nuke = tipo === 'nuke'; ponto(q, estacao(E, tipo), _o); const d = Math.hypot(a.x - q.x, a.z - q.z), v0 = Math.max(130, (q.v || 0) + 15);
  const pf = Object.assign({}, MISSEIS.curto, { nome: nuke ? 'Nuclear tático' : 'Antinavio', v: nuke ? 240 : 270, vt: nuke ? 260 : 300, alc: nuke ? VT.alcNuke : VT.alcAsm, dano: nuke ? VT.danoNuke : VT.danoAsm });
  Object.assign(m, { ouro: 0, heli: 1, ativo: 1, x: _o.x, y: _o.y, z: _o.z, vx: Math.sin(q.rumo) * v0, vy: (q.vy || 0) - 4, vz: -Math.cos(q.rumo) * v0, dono: n.id, time: n.time, alvo: a.id, isca: -1, fase: 3, t: 0, v: v0, perfil: pf, cel: 0, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, dano: pf.dano, pkMul: nuke ? 0.6 : 1, velMul: 1, livre: 0, curto: d < 1500 ? 1 : 0, lat: null, vtNk: nuke ? 1 : 0 });
  if (nuke) for (let k = 0; k < 3; k++) if (E.nk[k] < 0) { E.nk[k] = m.idx; E.nkT[k] = -1; break; }
  n.stats.misLanc++; sim.evento({ t: 'heliMissil', idx: q.idx, m: m.idx, x: m.x, y: m.y, z: m.z, vt: tipo }); return 1; }
function disparaTorp(sim, n, q, E, a) { const tp = sim.torpedos.find((x) => !x.ativo); if (!tp) return 0; ponto(q, estacao(E, 'torp'), _o); const b = marcacao(q.x, q.z, a.x, a.z);
  Object.assign(tp, { lancha: 0, ativo: 1, x: _o.x, z: _o.z, rumo: b, rumoAlvo: b, v: 10, dono: n.id, time: n.time, alvo: a.id, corrida: TORPEDO.arma, modo: 'acustico', t: 0, buscando: 0, danoMul: 1, alcMax: TORPEDO.arma + 3200, leve: 1 });
  n.stats.torpLanc++; sim.evento({ t: 'heliTorpedo', idx: q.idx, x: q.x, y: q.y - 1.4, z: q.z, tp: tp.idx }); return 1; }
/** 1 arma do tipo pedido deste caça (alvo automático; travado tem prioridade). true = saiu. */
export function disparaVt(sim, n, q, tipo) { const E = estDe(sim, q); if (!E || !voando(q) || q.vtPouso || E[tipo] <= 0) return false; if (tipo === 'nuke' ? E.tNuke > 0 : E.tMis > 0) return false;
  let ok = 0;
  if (tipo === 'aam') { const e = inimigoAereo(sim, q, VT.alcAam); if (e) ok = lancaArAr(sim, q, e, _tp) ? 1 : 0; }
  else { const a = inimigoNavio(sim, q, n, tipo === 'torp' ? VT.alcTorp : tipo === 'nuke' ? VT.alcNuke : VT.alcAsm); if (a) ok = tipo === 'torp' ? disparaTorp(sim, n, q, E, a) : disparaMissil(sim, n, q, E, a, tipo); }
  if (!ok) return false; E[tipo]--; if (tipo === 'nuke') E.tNuke = VT.intNuke; else E.tMis = VT.intMis; return true; }
/** botão da tela (comando 'vtArma'): dispara do caça líder se tiver a arma pronta; senão do ala. */
export function comandoVtol(sim, n, cmd) { if (!n.vtA || TIPOS_VT.indexOf(cmd.tipo) < 0) return; const L = n.nk && n.nk.noAr >= 0 ? sim.nukes[n.nk.noAr] : null;
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
      if (j === 0 ? dy < -0.2 * d : dy > 0.2 * d) continue; /* dorsal só acima, ventral só abaixo: a linha nunca cruza a própria aeronave */ bd = d; best = m; }
    if (!best) { S.on = 0; S.alvo = -1; S.t = 0; continue; }
    if (S.alvo !== best.idx) S.t = 0; S.alvo = best.idx; S.on = 1; S.t += dt; S.tx = best.x; S.ty = best.y; S.tz = best.z;
    if (S.t >= L.perm) { S.t = 0; S.tc = L.rec; S.on = 0; if (sim.rng.next() < L.pk * (best.pkMul || 1)) { best.ativo = 0; n.stats.intercept++; sim.evento({ t: 'missilAbatido', idx: best.idx, x: best.x, y: best.y, z: best.z, por: n.id, mount: -1, arma: 'laser' }); } S.alvo = -1; } } }
/** canhão 25/30 mm: só no navio travado, à frente e ao alcance (rajadas curtas) */
function canhao(sim, n, q, E, dt) { if (E.tCan > 0) { E.tCan -= dt; return; } const a = q.alvo >= 0 ? sim.navios[q.alvo] : null; if (!a || a.morto || a.time === q.time) return; const d = Math.hypot(a.x - q.x, a.z - q.z); if (d > VT.canhao.alc) return;
  if (Math.abs(ang(marcacao(q.x, q.z, a.x, a.z) - q.rumo)) > VT.canhao.cone) return; const H = q.H || HELIS[E.id]; const ap = sim.dano ? sim.dano(a, (H.dano || 3) * 0.45 * 6, n, 'heli', true) : 0; E.tCan = 0.8;
  if (ap > 0) sim.evento({ t: 'impacto', x: a.x, y: (a.arfagem || 0) + (a.C ? a.C.F : 4) + 2, z: a.z, alvo: a.id, dono: n.id, cal: E.id === 'uiracu' ? 30 : 25, tipo: 'mg', ly: 2, dano: Math.max(1, Math.round(ap)) }); }
function ia(sim, n, q, E, lider) { if (q.manual || q.vtPouso) return; if (E.aam > 0 && disparaVt(sim, n, q, 'aam')) return; if (!lider) return; /* o ala só se defende; o líder em IA ataca */
  if (n.papel !== 'jogador' ? !!sim.nkBotAtomica : false) { if (E.nuke > 0 && disparaVt(sim, n, q, 'nuke')) return; }
  if (E.asm > 0 && disparaVt(sim, n, q, 'asm')) return; if (E.torp > 0 && q.y < 400) disparaVt(sim, n, q, 'torp');
  if (q.fase === 2 && E.aam + E.asm + E.torp + E.nuke <= 0 && !q.espera) { q.fase = 3; q.tEsc = 0; sim.evento({ t: 'nkIa', idx: q.idx, id: q.dono, v: 1, motivo: 'base' }); } }
/** HUD e IA: soma da munição dos caças (abatido sai da soma até voltar). Escreve em out (sem alocar). */
export function somaVt(n, out) { out.aam = out.asm = out.torp = out.nuke = 0; if (!n || !n.vtA) return out; for (const id of IDS_VT) { const E = n.vtA[id]; if (E.abat) continue; out.aam += E.aam; out.asm += E.asm; out.torp += E.torp; out.nuke += E.nuke; } return out; }
const _S = { aam: 0, asm: 0, torp: 0, nuke: 0 };

/** Passo (chamado pelo mundo). Só age no Destróier Amorim. */
/** gancho do nuclear.js (q.vtol): fase 1 = decolagem vertical; fase 3 perto do navio = pouso vertical */
function ganchoVtol(q, n, dt) { const sim = this; return q.fase === 1 ? decolaVtol(sim, q, n, dt) : q.fase === 3 ? pousoVtol(sim, q, n, dt) : false; }
export function passoVtolAmorim(sim, dt) { if (sim.ganchoVtol !== ganchoVtol) sim.ganchoVtol = ganchoVtol; sim._vtAcc = (sim._vtAcc || 0) + dt; const tick = sim._vtAcc >= VT.tick; if (tick) sim._vtAcc = 0;
  for (let ni = 0; ni < sim.navios.length; ni++) { const n = sim.navios[ni]; if (!n.C.destAmorim) continue; const A = instalaVtol(n);
    for (let k = 0; k < IDS_VT.length; k++) { const E = A[IDS_VT[k]]; if (E.tMis > 0) E.tMis -= dt; if (E.tNuke > 0) E.tNuke -= dt; rastreiaNukes(sim, n, E);
      if (E.noAr) { const q = E.q >= 0 ? sim.nukes[E.q] : null, meu = q && q.vtol && q.vtId === E.id && q.dono === n.id;
        if (meu && q.ativo) { E.voou = 1; q.tMis = 1e6; if (tick && q.fase >= 2) { lasers(sim, n, q, E, VT.tick); canhao(sim, n, q, E, VT.tick); ia(sim, n, q, E, !!(n.nk && n.nk.noAr === q.idx));
            if (q.manual && E.aam + E.asm + E.torp + E.nuke <= 0) { E.tSem -= VT.tick; if (E.tSem <= 0) { E.tSem = 6; sim.evento({ t: 'vtSemMun', idx: q.idx, id: n.id }); } } }
          if (q.vtPouso) for (const w of sim.nukes) if (w.ativo && w.lider === q.idx) { w.lider = -1; if (w.fase >= 2) { w.fase = 3; w.tEsc = 0; w.manual = 0; } } } /* líder pousando: o ala vai para o seu ponto */
        else if (meu && q.espDec > 0 && q.lider >= 0) { /* ala aguardando a vez de decolar */ }
        else { E.noAr = 0; E.q = -1; E.las[0].on = E.las[1].on = 0; if (E.pousou) { E.tPronto = sim.t + VT.rearme; E.refil = 1; } else if (E.voou) { E.abat = 1; E.tPronto = sim.t + VT.volta; E.refil = 1; sim.evento({ t: 'vtAbatido', id: n.id, vt: E.id }); } else E.tPronto = sim.t; E.pousou = 0; E.voou = 0; } }
      else if (E.refil && sim.t >= E.tPronto) { E.refil = 0; const vinha = E.abat; E.abat = 0; enche(E); sim.evento({ t: 'vtRearme', id: n.id, vt: E.id, volta: vinha ? 1 : 0 }); } }
    /* números da tela do Urubu-rei (AR-AR e MÍSSIL) = soma dos 2 caças */
    const L = n.nk && n.nk.noAr >= 0 ? sim.nukes[n.nk.noAr] : null; if (L && L.vtol) { somaVt(n, _S); L.aa = _S.aam; L.misseis = _S.asm; const E = A[L.vtId]; L.tAA = E && E.aam > 0 && E.tMis > 0 ? sim.t + E.tMis : 0; }
    /* botão DECOLAR: recarga = próximo caça pronto; o caça da vez vira o n.nkAero */
    if (n.nk && !(n.nk.noAr >= 0)) { let tp = 1e9, livre = ''; for (const id of IDS_VT) { const E = A[id]; if (!livre && pronto(sim, E)) livre = id; else if (!E.noAr) tp = Math.min(tp, E.tPronto); } n.nk.tRec = livre ? (n.papel === 'jogador' ? 0 : sim.t + 1) /* computador: a IA nuclear nunca decola os caças (só este arquivo) */ : tp < 1e9 ? tp : 0; n.nk.recDur = VT.rearme; if (livre) n.nkAero = livre; }
    /* computador: decola quando há inimigo a até 12 km (depois de 20 s) */
    if (tick && n.papel !== 'jogador' && n.papel !== 'alvo' && !n.morto && sim.t > 20 && !(n.nk && n.nk.noAr >= 0) && (pronto(sim, A.acaua) || pronto(sim, A.uiracu))) { let a = null, bd = 12000; for (const e of sim.navios) { if (e.morto || e.time === n.time || (e.C && (e.C.civil || e.C.mercante))) continue; const d = Math.hypot(e.x - n.x, e.z - n.z); if (d < bd) { bd = d; a = e; } } if (a) lancaVtol(sim, n, { alvo: a.id }); } } }
