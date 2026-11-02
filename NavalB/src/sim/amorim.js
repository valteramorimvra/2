// Naval B v1.3.00 — SUPER LENDÁRIO "AMORIM" (SL 06), projeto do Valter. Navio jogável independente (não é cópia do Nakhimov).
// Física de movimento/flutuação/dano/colisão = a do jogo (nada aqui mexe nisso). Tudo abaixo usa as funções que o jogo já tem
// (balística de granada, perfis de míssil, torpedo, lança-granadas, LASER, CIWS, míssil nuclear 1231). Novos, só do Amorim:
//   1) REVEZAMENTO das salvas de mísseis: lateral BB (5) → lateral BE (5) → VLS de vante (4) → VLS de ré (4) → volta; pula o que
//      está recarregando/vazio; 0,15 s entre os mísseis de uma salva.
//   2) LANÇADORES LATERAIS INCLINADOS (5 por bordo, eixo real do modelo: 24° para cima, para a proa, aberto 8° para fora): o míssil
//      nasce na boca do tubo, sai RETO sem guiagem (0–0,7 s: 35 m/s + 25 m/s², com gravidade), CURVA para o alvo (≤ 30°/s) até ~2 s
//      e então entra na guiagem normal do jogo. Recarga de cada bordo: 7 s.
//   3) CANHÕES AUTOMÁTICOS ANTINAVIO (4: 2 pretos de ré + 2 novos à vante da casaria): atiram sozinhos no navio inimigo mais próximo
//      a ≤ 3 km, só dentro do arco da peça e com a LINHA DE TIRO LIVRE (raio do cano ao alvo contra as caixas da casaria, torres,
//      chaminés e hangar); 10 tiros/s, 0,6 de dano por projétil, carregador de 20 e RECARGA de 6 s, cada um independente.
// Zero alocação por passo: estados pré-criados em instala; vetores de trabalho reaproveitados.
import { clamp, ang, marcacao, G } from './util.js';
import { MISSEIS } from './classes.js';
import { arrastoCal, solucaoArrasto } from '../naval5v5/balistica.js';
import { PARAM } from '../armasParametros.js';

import { AM, AUTOS, TUBOS_LAT, CAIXAS } from './classesAmorim.js';
export { AM, AUTOS, TUBOS_LAT, adicionaAmorim, META_AMORIM, layoutAmorim } from './classesAmorim.js';

/* ---------- estado ---------- */
export function instalaAmorim(n) { if (!n.C.amorim && !n.C.fragAmorim && !n.C.destAmorim) return;
  /* v1.3.02: configuração POR CLASSE (Amorim = constantes de sempre; Fragata Amorim = as dela) */ const C = n.C, cfg = { autos: C.autos || AUTOS, auto: C.autoCfg || AM.auto, caixas: C.caixasAuto || CAIXAS, tubos: C.tubosLat || TUBOS_LAT, lat: C.latCfg || AM.lat, mis: C.misAuto || null, nCel: C.fragAmorim || C.destAmorim ? (n.P.vls.length || 32) : 50 }; /* v1.3.03: Destróier Amorim usa as 160 células */
  n.am = { cfg, prox: 0, ult: -1, recLat: [0, 0], vlsF: n.C.vls || 100, vlsR: 0, /* v1.3.01: todo o VLS no slot de vante */ autos: cfg.autos.map((a) => ({ az: 0, el: 0, alvo: -1, tBusca: 0, rec: 0, bala: cfg.auto.carregador, recarga: 0, fogo: 0, k: arrastoCal(cfg.auto.cal), sol: { az: 0, el: 0, tv: 0, d: 0, px: 0, pz: 0 } })) }; }

/* ---------- 1+2) mísseis: revezamento e lançadores laterais ---------- */
const _o = { x: 0, y: 0, z: 0 }, _d = { x: 0, y: 0, z: 0 };
/** Substitui lancaMissil do mundo SÓ para o Amorim (mesmas regras de alvo/alcance/prontidão do jogo; muda só de onde e como os mísseis saem). */
export function lancaMissilAmorim(sim, n, alvoId, livre, azLivre, d) {
  const A = n.am; if (!A) return 0; if (A.cfg.mis) return lancaMissilAuto(sim, n, alvoId, livre, azLivre, d, A.cfg.mis); /* v1.3.02: Fragata Amorim escolhe o slot */
  for (let tent = 0; tent < AM.slots; tent++) { const s = (A.prox + tent) % AM.slots;
    if (s < 2) { if (A.recLat[s] > sim.t || n.tVls > 0) continue; const pf = MISSEIS[AM.perfilLat]; if (!livre && d > pf.alc) continue; const k = salvaLateral(sim, n, s, alvoId, livre, azLivre, d); if (k) { A.recLat[s] = sim.t + AM.recLat; A.prox = (s + 1) % AM.slots; n.tVls = Math.max(n.tVls || 0, k * AM.dtSalva + 1.6); /* v1.3.03 (Valter): UMA salva de UM slot por disparo — o próximo slot só depois que esta salva saiu toda */ return k; } }
    else { if (n.tVls > 0 || n.vls <= 0) continue; const frente = s === 2; if ((frente ? A.vlsF : A.vlsR) <= 0) continue; const k = salvaVls(sim, n, frente, alvoId, livre, azLivre, d); if (k) { A.prox = (s + 1) % AM.slots; return k; } } }
  return 0;
}
/** v1.3.02 — FRAGATA AMORIM: a cada lançamento pontua os 3 slots (lateral do bordo do alvo ≫ outro bordo; VLS melhor com alvo pela proa/popa;
 *  o slot da salva anterior perde 'alterna') e dispara a salva do melhor; recarga ÚNICA (cfg.rec) para qualquer slot. Só números (zero GC). */
function lancaMissilAuto(sim, n, alvoId, livre, azLivre, d, cfg) {
  const A = n.am; if (n.tVls > 0) return 0; const al = livre ? null : sim.navios[alvoId]; if (!livre && !al) return 0;
  const brg = livre ? +azLivre : marcacao(n.x, n.z, al.x, al.z), rel = ang(brg - n.rumo), sr = Math.sin(Math.abs(rel)), cr = Math.cos(rel), pfL = MISSEIS[AM.perfilLat];
  let melhor = -1, ms = -1e9;
  for (let s = 0; s < 3; s++) { let sc;
    if (s < 2) { if (A.recLat[s] > sim.t || (!livre && d > pfL.alc)) continue; const bordo = s === 0 ? -1 : 1; sc = rel * bordo > 0 ? 0.15 + 0.85 * sr : 0.05; }
    else { if (A.vlsF <= 0 || n.vls <= 0) continue; sc = 0.15 + 0.85 * cr * cr; }
    if (s === A.ult) sc -= cfg.alterna; if (sc > ms) { ms = sc; melhor = s; } }
  if (melhor < 0) return 0;
  const k = melhor < 2 ? salvaLateral(sim, n, melhor, alvoId, livre, azLivre, d) : salvaVls(sim, n, true, alvoId, livre, azLivre, d);
  if (k) { A.ult = melhor; A.prox = (melhor + 1) % 3; if (melhor < 2) A.recLat[melhor] = sim.t + cfg.rec; n.tVls = cfg.rec; }
  return k;
}
function novoMissil(sim, n, pf, alvoId, livre, azLivre, d, k, campos) {
  const m = sim.misseis.find((q) => !q.ativo); if (!m) return null; const mEf = n.mods.missilEf;
  Object.assign(m, { ativo: 1, reAlvo: 0, dono: n.id, time: n.time, alvo: alvoId, isca: -1, t: -k * AM.dtSalva, perfil: pf, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, samTent: 0, hPit: 0, dT: 0, cont: 0, hCrest: 0, livre: livre ? 1 : 0, azL: livre ? +azLivre : 0, heli: 0, curto: d < 1500 ? 1 : 0,
    ouro: mEf && mEf.dano > 1 ? 1 : 0, dano: pf.dano * (mEf ? mEf.dano : 1) * (n.mods.dano || 1), danoMul: (mEf ? mEf.dano : 1) * (n.mods.dano || 1), velMul: n.mods.misVel || 1, pkMul: mEf ? mEf.pkCiws : 1, lat: null }, campos);
  n.stats.misLanc++; n.tTiro = sim.t; return m;
}
function salvaVls(sim, n, frente, alvoId, livre, azLivre, d) { const A = n.am, pf = MISSEIS[n.C.missil], nC = A.cfg.nCel, i0 = frente ? 0 : nC, nS = A.cfg.mis ? A.cfg.mis.salvaVls : AM.salvaVls; let saiu = 0;
  for (let k = 0; k < nS && (frente ? A.vlsF : A.vlsR) > 0 && n.vls > 0; k++) { let cel = -1; for (let i = i0; i < i0 + nC; i++) if (!n.vlsUsadas[i]) { cel = i; break; } if (cel < 0) { for (let i = i0; i < i0 + nC; i++) n.vlsUsadas[i] = 0; cel = i0; }
    const pc = n.P.vls[cel]; sim.mundo(n, pc.x, pc.y, pc.z, _o); const m = novoMissil(sim, n, pf, alvoId, livre, azLivre, d, k, { x: _o.x, y: _o.y, z: _o.z, vx: 0, vy: 28, vz: 0, v: 28, fase: 1, cel }); if (!m) break;
    n.vlsUsadas[cel] = 1; n.vls--; if (frente) A.vlsF--; else A.vlsR--; saiu++; sim.evento({ t: 'vls', id: n.id, cel, x: _o.x, y: _o.y, z: _o.z, atraso: k * AM.dtSalva }); }
  if (saiu) n.tVls = 2.5; return saiu; }
function salvaLateral(sim, n, s, alvoId, livre, azLivre, d) { const cf = n.am.cfg, T = s === 0 ? cf.tubos.bb : cf.tubos.be, sx = s === 0 ? -1 : 1, pf = MISSEIS[AM.perfilLat], nS = Math.min(T.length, cf.mis ? cf.mis.salvaLat : AM.salvaLat); let saiu = 0;
  for (let k = 0; k < nS; k++) { const tb = T[k]; sim.mundo(n, tb.x, tb.y, tb.z, _o); const m = novoMissil(sim, n, pf, alvoId, livre, azLivre, d, k, { x: _o.x, y: _o.y, z: _o.z, vx: 0, vy: 0, vz: 0, v: cf.lat.v0, fase: 3, cel: -1 }); if (!m) break;
    m.lat = { tubo: k, sx, ux: 0, uy: 0, uz: 0, ok: 0 }; saiu++; sim.evento({ t: 'vls', id: n.id, cel: -1, lat: sx, x: _o.x, y: _o.y, z: _o.z, atraso: k * AM.dtSalva }); /* mesmo som/efeito de lançamento do jogo */ }
  return saiu; }
/** eixo do tubo no mundo: 24° para cima, para a proa, aberto 8° para fora do bordo; ↦ (L.ux, L.uy, L.uz) */
function eixoTubo(n, L) { const LA = (n.am && n.am.cfg.lat) || AM.lat, az = n.rumo + L.sx * LA.fora, ce = Math.cos(LA.elev); L.ux = Math.sin(az) * ce; L.uy = Math.sin(LA.elev); L.uz = -Math.cos(az) * ce; }
/** Passo do míssil lateral. true = já tratado neste quadro (a guiagem normal só assume depois de AM.lat.t2). */
export function passoLateral(sim, m, dt) {
  const L = m.lat, n = sim.navios[m.dono], LA = (n && n.am && n.am.cfg.lat) || AM.lat, TL = (n && n.am && n.am.cfg.tubos) || TUBOS_LAT;
  if (m.t < 0) { if (!n) { m.ativo = 0; return true; } const T = L.sx < 0 ? TL.bb : TL.be, tb = T[L.tubo]; sim.mundo(n, tb.x, tb.y, tb.z, _o); m.x = _o.x; m.y = _o.y; m.z = _o.z; return true; }
  if (!L.ok) { L.ok = 1; eixoTubo(n || { rumo: 0 }, L); const vs = n ? n.v || 0 : 0, rs = n ? n.rumo : 0; m.vx = L.ux * LA.v0 + Math.sin(rs) * vs; m.vy = L.uy * LA.v0; m.vz = L.uz * LA.v0 - Math.cos(rs) * vs; }
  if (m.t < LA.t1) { /* fase 1: reto pelo eixo do tubo, sem guiagem: empuxo 25 m/s² no eixo + gravidade */ m.vx += L.ux * LA.acel * dt; m.vy += (L.uy * LA.acel - G) * dt; m.vz += L.uz * LA.acel * dt; m.v = Math.hypot(m.vx, m.vy, m.vz); m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt; return true; }
  /* fase 2: curva para o alvo (≤ 30°/s) nivelando na altitude de cruzeiro do 'medio'. NUNCA cruza o próprio navio: ao lado do casco o rumo
     não aponta para dentro (segue paralelo e contorna pela proa/popa); a guiagem normal só assume depois de ~2 s E com o caminho até o alvo livre do navio. */
  let tx = m.x + m.vx, tz = m.z + m.vz; const a = m.alvo >= 0 ? sim.navios[m.alvo] : null; if (a && !a.morto) { tx = a.x; tz = a.z; } else if (m.livre) { tx = m.x + Math.sin(m.azL) * 2000; tz = m.z - Math.cos(m.azL) * 2000; }
  let livreN = 1, travaDentro = 0;
  if (n && !n.morto) { const hx = n.C.B / 2 + 15, hz = n.C.L / 2 + 20; paraLocal(n, m.x, m.y, m.z, _l0); paraLocal(n, tx, 0, tz, _l1);
    livreN = !cruzaRet(_l0.x, _l0.z, _l1.x, _l1.z, hx, hz);
    if (!livreN) { if (Math.abs(_l0.z) <= hz) travaDentro = 1; else { const sT = _l1.x < 0 ? -1 : 1; /* à frente/atrás do navio: primeiro passa para o bordo do alvo, longe da proa/popa */ const wx = sT * (hx + 80), wz = _l0.z, c = Math.cos(n.rumo), sn = Math.sin(n.rumo); tx = n.x + wx * c - wz * sn; tz = n.z + wx * sn + wz * c; } } }
  if (m.t >= LA.t2 && (livreN || m.t > 8)) { m.lat = null; m.fase = 3; sim.evento({ t: 'faseMissil', idx: m.idx, fase: 3 }); /* já nivelado: entra na guiagem normal do jogo (cruzeiro → terminal) */ return false; }
  const vh = Math.hypot(m.vx, m.vz) || 1, h0 = Math.atan2(m.vx, -m.vz), h1 = marcacao(m.x, m.z, tx, tz); let hn = h0 + clamp(ang(h1 - h0), -LA.giro * dt, LA.giro * dt);
  if (travaDentro) { const hl = ang(hn - n.rumo), lat = Math.sin(hl) * L.sx; if (lat < 0.05) { const fr = Math.cos(hl) >= 0 ? 1 : -1; hn = n.rumo + Math.atan2(0.05 * L.sx, fr * Math.sqrt(1 - 0.0025)); } }
  const p0 = Math.atan2(m.vy, vh), pAlvo = clamp((8 - m.y) / 120, -0.35, 0.05), pn = p0 + clamp(pAlvo - p0, -LA.giro * dt, LA.giro * dt);
  const v = Math.min(m.perfil.v * (m.velMul || 1), m.v + 90 * dt); m.v = v; const ch = Math.cos(pn); m.vx = Math.sin(hn) * ch * v; m.vy = Math.sin(pn) * v; m.vz = -Math.cos(hn) * ch * v; m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt; return true;
}
/** segmento (x0,z0)→(x1,z1) em coordenadas locais cruza o retângulo |x|<hx, |z|<hz? */
function cruzaRet(x0, z0, x1, z1, hx, hz) { let t0 = 0, t1 = 1; const dx = x1 - x0, dz = z1 - z0;
  if (Math.abs(dx) < 1e-9) { if (Math.abs(x0) >= hx) return false; } else { let a = (-hx - x0) / dx, b = (hx - x0) / dx; if (a > b) { const q = a; a = b; b = q; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false; }
  if (Math.abs(dz) < 1e-9) { if (Math.abs(z0) >= hz) return false; } else { let a = (-hz - z0) / dz, b = (hz - z0) / dz; if (a > b) { const q = a; a = b; b = q; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return false; }
  return true; }

/* ---------- 3) canhões automáticos antinavio ---------- */
const _l0 = { x: 0, y: 0, z: 0 }, _l1 = { x: 0, y: 0, z: 0 };
/** mundo → local do navio (sem adorno/caturro: a linha de tiro usa a planta e a altura) */
function paraLocal(n, x, y, z, out) { const dx = x - n.x, dz = z - n.z, c = Math.cos(n.rumo), s = Math.sin(n.rumo); out.x = dx * c + dz * s; out.z = -dx * s + dz * c; out.y = y; return out; }
/** segmento P0→P1 (locais) cruza alguma caixa da estrutura? (método das lâminas) */
const _dd = new Float64Array(3), _oo = new Float64Array(3);
function bateEstrutura(p0, p1, CX = CAIXAS) { const d = _dd, o = _oo; d[0] = p1.x - p0.x; d[1] = p1.y - p0.y; d[2] = p1.z - p0.z; o[0] = p0.x; o[1] = p0.y; o[2] = p0.z;
  for (let ib = 0; ib < CX.length; ib++) { const b = CX[ib]; let t0 = 0.02, t1 = 1; let fora = false;
    for (let e = 0; e < 3 && !fora; e++) { const mn = b[e * 2], mx = b[e * 2 + 1]; if (Math.abs(d[e]) < 1e-6) { if (o[e] < mn || o[e] > mx) fora = true; continue; } let a = (mn - o[e]) / d[e], c = (mx - o[e]) / d[e]; if (a > c) { const q = a; a = c; c = q; } t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) fora = true; }
    if (!fora) return true; } return false; }
function slotAuto(sim) { const G2 = sim.granadas; for (let i = 150; i < 224 && i < G2.length; i++) if (!G2[i].ativo) return G2[i]; return null; }
export function passoAutosAmorim(sim, n, dt) {
  const A = n.am; if (!A || n.morto) return; const S = A.cfg.auto, AU = A.cfg.autos, PDs = PARAM.dispersao, disp0 = n.dispF || 1; /* v1.3.02: por classe */
  for (let j = 0; j < AU.length; j++) { const pm = AU[j], st = A.autos[j]; st.fogo = 0; if (st.rec > 0) st.rec -= dt; if (st.recarga > 0) { st.recarga -= dt; if (st.recarga <= 0) st.bala = S.carregador; }
    sim.mundo(n, pm.x, pm.y, pm.z, _o); st.tBusca -= dt;
    if (st.tBusca <= 0) { st.tBusca = 0.25; st.alvo = -1; let md = S.alc; paraLocal(n, _o.x, _o.y, _o.z, _l0);
      for (let ie = 0; ie < sim.navios.length; ie++) { const e = sim.navios[ie]; if (e.morto || e.time === n.time || (e.C && e.C.civil)) continue; const de = Math.hypot(e.x - _o.x, e.z - _o.z); if (de >= md) continue;
        const rel = ang(marcacao(_o.x, _o.z, e.x, e.z) - n.rumo); if (Math.abs(ang(rel - pm.centro)) > pm.meio) continue; /* arco de giro da peça */
        paraLocal(n, e.x, (e.C.F || 6) * 0.8, e.z, _l1); if (bateEstrutura(_l0, _l1, A.cfg.caixas)) continue; /* linha de tiro bloqueada pela própria estrutura */ md = de; st.alvo = e.id; } }
    const al = st.alvo >= 0 ? sim.navios[st.alvo] : null; let ok = 0;
    if (al && !al.morto) { const vx = Math.sin(al.rumo) * al.v, vz = -Math.cos(al.rumo) * al.v; const s = solucaoArrasto(_o.x, _o.z, Math.max(0.5, _o.y - al.C.F * 0.7), S.V0, st.k, al.x, al.z, vx, vz, st.sol, al.w || 0); if (s && s.d <= S.alc) ok = 1; }
    const alvoRel = ok ? ang(st.sol.az - n.rumo) : 0, alvoEl = ok ? clamp(st.sol.el, -0.15, 0.9) : 0; st.az += clamp(ang(alvoRel - st.az), -S.giro * dt, S.giro * dt); st.el += clamp(alvoEl - st.el, -S.giro * dt, S.giro * dt);
    if (!ok || st.rec > 0 || st.bala <= 0 || Math.abs(ang(alvoRel - st.az)) > 0.04) continue;
    const g = slotAuto(sim); if (!g) continue; const az = n.rumo + st.az + sim.rng.gauss() * PDs.az * S.disp * disp0 * PDs.calP, el = st.el * (1 + sim.rng.gauss() * PDs.alc * S.disp * disp0 * PDs.calP * 0.5), ce = Math.cos(el);
    const o = sim.mundoInc ? sim.mundoInc(n, pm.x + Math.sin(st.az) * pm.lc, pm.y + Math.sin(st.el) * pm.lc, pm.z - Math.cos(st.az) * pm.lc, sim._o) : _o; const ux = Math.sin(az) * ce, uy = Math.sin(el), uz = -Math.cos(az) * ce;
    if (sim.bocaObstruida && sim.bocaObstruida(o, ux * S.V0, uy * S.V0, uz * S.V0)) { st.rec = 0.3; continue; }
    g.agua = 0; g.ativo = 1; g.x = o.x; g.y = o.y; g.z = o.z; g.vx = ux * S.V0; g.vy = uy * S.V0; g.vz = uz * S.V0; g.dono = n.id; g.time = n.time; g.dano = S.dano * (n.mods.dano || 1); g.cal = S.cal; g.t = 0; g.k = st.k; g.fogo = 0.02; g.ap = 0; g.rbu = 0; g.foguete = 0; g.arcR = 0; g.fim = null; g.livre = 0; g.tracante = 1;
    st.rec = S.cad; st.bala--; if (st.bala <= 0) st.recarga = S.recarga; st.fogo = 1; n.stats.tiros++;
    sim.evento({ t: 'tiro', id: n.id, torre: -20 - j, sec: 1, auto: 1, cano: 0, canos: 1, x: o.x, y: o.y, z: o.z, cal: S.cal, az, el, gi: -1 }); }
}
