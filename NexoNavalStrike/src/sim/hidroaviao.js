// v1.2.39 — HIDROAVIÕES anfíbios pilotáveis (Albatroz/Be-200ES, Guará/US-2, Biguá/CL-515, Atobá/AG600).
// Usam um lugar do pool sim.nukes (mesma pose/câmera/HUD/comandos do bombardeiro: manche, acelerador, TRAVAR, IA, ESPERA, bomba atômica)
// com q.hidro = id do modelo. Diferenças: corrida NA ÁGUA ao lado do navio para decolar, voo baixo/médio, VIDA real (a antiaérea
// derruba: ~2,5 min contra 1 navio, ~50 s contra 3), flares/chaff, mísseis ar-superfície (de 2 em 2), torpedo aéreo com paraquedas
// e pouso na água ao voltar. Determinístico (usa sim.rng), sem alocação no passo.
import { clamp, ang, marcacao, G } from './util.js';
import { alturaMar } from './ocean.js';
import { colideAereoTerreno } from './colisaoTerreno.js';
import { MISSEIS, TORPEDO } from './classes.js';
import { NUK, impactoNuclear, soltaBomba, nuclearLiberado } from './nuclear.js';

/** Fichas (dados públicos dos aviões reais; armas e vida do jogo). v: m/s. */
export const HIDROS = {
  albatroz: { id: 'albatroz', nome: 'Albatroz', base: 'Beriev Be-200ES (Rússia)', L: 32, env: 32.8, alt: 8.9, mtowPista: 41, mtowAgua: 37.9, vMax: 147, vCruz: 125, vMin: 62, vDecola: 55, teto: 8100, alcance: 3050, motor: 'jato', nMot: 2, empuxo: '2 × 73,5 kN', vida: 5670, misseis: 8, torps: 4, flares: 12, cor: '#e6eaee', cor2: '#1f4e8c', fundo: '#2b3b52', giro: 1, larg: 0.05, zAsa: 0.02, afil: 0.42, cauda: 'T', janelas: 9, matr: 'NX-200 ALBATROZ' },
  guara: { id: 'guara', nome: 'Guará', base: 'ShinMaywa US-2 (Japão)', L: 33.5, env: 33.2, alt: 9.8, mtowPista: 47.7, mtowAgua: 43, vMax: 155, vCruz: 130, vMin: 50, vDecola: 48, teto: 7195, alcance: 4700, motor: 'helice', nMot: 4, empuxo: '4 × 3.400 kW (turboélice)', vida: 5300, misseis: 6, torps: 6, flares: 12, cor: '#aab4be', cor2: '#b91c1c', fundo: '#3a434c', giro: 0.95, larg: 0.056, zAsa: 0.03, afil: 0.55, cauda: 'T', pas: 6, janelas: 7, matr: 'NX-02 GUARÁ' },
  bigua: { id: 'bigua', nome: 'Biguá', base: 'De Havilland Canada DHC-515 / CL-515 (Canadá)', L: 19.8, env: 28.6, alt: 8.9, mtowPista: 21.4, mtowAgua: 19.9, vMax: 106, vCruz: 92, vMin: 40, vDecola: 38, teto: 6100, alcance: 2400, motor: 'helice', nMot: 2, empuxo: '2 × 1.775 kW (turboélice)', vida: 3900, misseis: 4, torps: 6, flares: 12, cor: '#f4c430', cor2: '#c2410c', fundo: '#c2410c', giro: 1.25, larg: 0.07, zAsa: 0.02, afil: 0.85, cauda: 'cruz', pas: 4, janelas: 5, matr: 'NX-515 BIGUÁ' },
  atoba: { id: 'atoba', nome: 'Atobá', base: 'AVIC AG600 Kunlong (China)', L: 39.6, env: 38.8, alt: 12.1, mtowPista: 53.5, mtowAgua: 53.5, vMax: 155, vCruz: 128, vMin: 60, vDecola: 58, teto: 6000, alcance: 4500, motor: 'helice', nMot: 4, empuxo: '4 × 3.805 kW (turboélice)', vida: 7300, misseis: 10, torps: 4, flares: 12, cor: '#eef1f3', cor2: '#0f766e', fundo: '#24504c', giro: 0.85, larg: 0.055, zAsa: 0.03, afil: 0.5, cauda: 'T', pas: 6, janelas: 10, matr: 'NX-600 ATOBÁ' },
};
export const ORDEM_HIDROS = ['albatroz', 'guara', 'bigua', 'atoba'];
/** Regras do jogo (iguais para os 4). */
export const HD = Object.freeze({
  liberaApos: 15,       // s de partida até o 1º voo
  recarga: 25,          // s após pousar ou ser derrubado
  recBomba: 25,         // s entre bombas atômicas no ar
  altCruz: 600, altMin: 40, altTeto: 3000, // m (teto do jogo; o real vai a 6–8 km)
  autonomia: 480,       // s de missão; depois volta e pousa sozinho
  dpsNavio: 37.8,       // vida/s que UM navio inimigo tira em alcance pleno (≈ 2,5 min p/ 5.670)
  alcAA: 4000, alcPleno: 1600, // m: alcance da antiaérea sobre o hidroavião / alcance de dano pleno
  flareDur: 3.5, flareCorte: 0.5, flareCad: 9, // s / fator / s entre flares automáticos sob fogo
  missilAlc: 9000, missilCad: 4, missilDano: 30, // m / s entre pares / dano
  torpAlc: 3000, torpCad: 6, torpQueda: 2.2, // m / s entre torpedos / s de paraquedas até a água
  thrFr: [0.55, 0.68, 0.8, 0.9, 1], // fração de vMax por nível do acelerador
});

const _o = { x: 0, y: 0, z: 0 }, _imp = {};
export const temHidro = (n) => !!(n && n.papel === 'jogador');
export function estadoHidro(n) { return n.hd || (n.hd = { tipo: n.hidroTipo || 'albatroz', noAr: -1, tRec: 0, pil: 0, perdidos: 0, voos: 0 }); }
/** Por que não pode decolar agora? ('' = pode) */
export function motivoHidro(sim, n) { if (!temHidro(n) && !(sim && sim.nkBotAtomica)) return 'sem'; if (n.morto) return 'morto'; const k = estadoHidro(n); if (k.noAr >= 0) return 'noAr'; if (k.tRec && sim.t < k.tRec) return 'recarga'; if (sim.t < HD.liberaApos) return 'cedo'; return ''; }
export function hidroDe(sim, n) { const k = n && n.hd; if (!k || k.noAr < 0 || !sim.nukes) return null; const q = sim.nukes[k.noAr]; return q && q.ativo && q.hidro && q.dono === n.id ? q : null; }

/** Comando { t:'hidro' } — decola (corrida na água ao lado do navio). */
export function lancaHidro(sim, n) { const mot = motivoHidro(sim, n); if (mot) { sim.evento({ t: 'hdNegado', id: n.id, motivo: mot }); return 0; }
  const k = estadoHidro(n), S = HIDROS[k.tipo] || HIDROS.albatroz; const q = sim.nukes.find((x) => !x.ativo && !x.b.ativo && !(x.espDec > 0)); if (!q) { sim.evento({ t: 'hdNegado', id: n.id, motivo: 'pool' }); return 0; }
  const lado = (n.C.B * 0.5 + S.env * 0.5 + 18); sim.mundo(n, lado, 0, -n.C.L * 0.1, _o);
  Object.assign(q, { ativo: 1, hidro: S.id, fase: 1, dono: n.id, time: n.time, t: 0, alvo: n.alvoId >= 0 ? n.alvoId : -1, ax: _o.x, az: _o.z, tSam: 0, deck: 0, v: Math.max(0, n.v || 0), manual: 0, manualPend: 0, tMan: 0, espera: 0, devolve: 0, cargas: 99, thr: 3, miraSolo: 0,
    jx: 0, jy: 0, sx: 0, sy: 0, w: 0, bank: 0, gam: 0, tAssume: 0, nSoltas: 0, tPrep: 0, auto: n.alvoId >= 0 ? 1 : 0, lider: -1, ala: 0, pontoFixo: 0, soltaEm: 0,
    vida: S.vida, vidaMax: S.vida, misseis: S.misseis, torps: S.torps, flares: S.flares, tFlare: 0, tFlareCad: 0, tMis: 0, tTorp: 0, pend: q.pend || [], sobFogo: 0, pousando: 0, fuga: 0 });
  q.pend.length = 0; q.sams.length = 0;
  q.x = q.px = _o.x; q.z = q.pz = _o.z; q.y = q.py = alturaMar(_o.x, _o.z, sim.t) + 1.2; q.rumo = q.prumo = n.rumo; q.vx = q.vy = q.vz = 0; q.pitch = q.ppitch = 0; q.roll = q.proll = 0;
  k.noAr = q.idx; k.pil = 1; k.voos++; sim.evento({ t: 'hdDecola', id: n.id, idx: q.idx, tipo: S.id, x: q.x, y: q.y, z: q.z }); return 1; }

/** Comandos próprios do hidroavião (os de voo/bomba usam os do bombardeiro: nkPiloto, nkCtl, nkThr, nkTrava, nkSolta, nkEspera, nkMiraSolo). */
export function comandoHidro(sim, n, cmd) { const k = estadoHidro(n);
  if (cmd.t === 'hidro') { const q = hidroDe(sim, n); if (q) { k.pil = 1; sim.evento({ t: 'hdPil', id: n.id, v: 1 }); return; } if (cmd.tipo && HIDROS[cmd.tipo]) k.tipo = cmd.tipo; lancaHidro(sim, n); return; }
  if (cmd.t === 'hdPil') { k.pil = cmd.v ? 1 : 0; sim.evento({ t: 'hdPil', id: n.id, v: k.pil }); return; }
  const q = hidroDe(sim, n); if (!q) return;
  if (cmd.t === 'hdMissil') disparaMisseis(sim, q, n);
  else if (cmd.t === 'hdTorp') lancaTorpedo(sim, q, n);
  else if (cmd.t === 'hdFlare') soltaFlare(sim, q);
  else if (cmd.t === 'hdVolta') { if (q.fase === 2) { q.manual = 0; q.espera = 0; q.fase = 3; sim.evento({ t: 'hdVolta', idx: q.idx, id: q.dono, motivo: 'ordem' }); } }
  else if (cmd.t === 'nkSolta') soltaBombaHidro(sim, q); }

function alvoDe(sim, q) { const a = q.alvo >= 0 ? sim.navios[q.alvo] : null; return a && !a.morto && a.time !== q.time ? a : null; }
function disparaMisseis(sim, q, n) { if (q.fase !== 2 || q.misseis <= 0 || q.tMis > 0) { sim.evento({ t: 'hdNegado', id: n.id, motivo: q.misseis <= 0 ? 'semMissil' : 'missilRec' }); return 0; }
  const a = alvoDe(sim, q); if (!a) { sim.evento({ t: 'hdNegado', id: n.id, motivo: 'semAlvo' }); return 0; } const d = Math.hypot(a.x - q.x, a.z - q.z); if (d > HD.missilAlc) { sim.evento({ t: 'hdNegado', id: n.id, motivo: 'alcance' }); return 0; }
  let k = 0; for (let i = 0; i < 2 && q.misseis > 0; i++) { const m = sim.misseis.find((x) => !x.ativo); if (!m) break; const lado = i ? 1 : -1, c = Math.cos(q.rumo), s = Math.sin(q.rumo), ox = q.x + c * lado * 5 - s * 2, oz = q.z + s * lado * 5 + c * 2;
    const pf = Object.assign({}, MISSEIS.curto, { nome: 'AN-A Gavião', v: 270, vt: 310, alc: HD.missilAlc, dano: HD.missilDano }); const v0 = Math.max(130, q.v + 10);
    Object.assign(m, { ouro: 0, heli: 1, ativo: 1, x: ox, y: q.y - 1.5, z: oz, vx: Math.sin(q.rumo) * v0, vy: (q.vy || 0) - 5, vz: -Math.cos(q.rumo) * v0, dono: n.id, time: n.time, alvo: a.id, isca: -1, fase: 3, t: 0, v: v0, perfil: pf, cel: 0, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, dano: HD.missilDano, pkMul: 1, velMul: 1 });
    q.misseis--; k++; n.stats.misLanc = (n.stats.misLanc || 0) + 1; sim.evento({ t: 'hdMissil', idx: q.idx, id: n.id, m: m.idx, x: m.x, y: m.y, z: m.z }); }
  q.tMis = HD.missilCad; return k; }
function lancaTorpedo(sim, q, n) { if (q.fase !== 2 || q.torps <= 0 || q.tTorp > 0) { sim.evento({ t: 'hdNegado', id: n.id, motivo: q.torps <= 0 ? 'semTorp' : 'torpRec' }); return 0; }
  const a = alvoDe(sim, q); if (!a) { sim.evento({ t: 'hdNegado', id: n.id, motivo: 'semAlvo' }); return 0; } const d = Math.hypot(a.x - q.x, a.z - q.z); if (d > HD.torpAlc + 2000) { sim.evento({ t: 'hdNegado', id: n.id, motivo: 'alcance' }); return 0; }
  /* cai de paraquedas: chega na água HD.torpQueda s depois, à frente do avião (deriva com a velocidade freada pelo paraquedas) */
  const deriva = Math.min(q.v, 80) * HD.torpQueda * 0.45; q.pend.push({ t: sim.t + HD.torpQueda, x: q.x + Math.sin(q.rumo) * deriva, z: q.z - Math.cos(q.rumo) * deriva, alvo: a.id });
  q.torps--; q.tTorp = HD.torpCad; n.stats.torpLanc = (n.stats.torpLanc || 0) + 1; sim.evento({ t: 'hdTorpedo', idx: q.idx, id: n.id, x: q.x, y: q.y - 2, z: q.z, vx: q.vx * 0.3, vz: q.vz * 0.3, tq: HD.torpQueda }); return 1; }
function entraTorpedo(sim, q, p) { const n = sim.navios[q.dono]; const tp = sim.torpedos.find((x) => !x.ativo); if (!tp || !n) return; const a = sim.navios[p.alvo]; const b = a && !a.morto ? marcacao(p.x, p.z, a.x, a.z) : q.rumo;
  Object.assign(tp, { lancha: 0, ativo: 1, x: p.x, z: p.z, rumo: b, rumoAlvo: b, v: 10, dono: n.id, time: n.time, alvo: a ? a.id : -1, corrida: TORPEDO.arma, modo: 'acustico', t: 0, buscando: 0, danoMul: 1.1, alcMax: TORPEDO.arma + 3200, leve: 1 });
  sim.evento({ t: 'hdTorpAgua', idx: q.idx, x: p.x, z: p.z, tp: tp.idx }); }
function soltaFlare(sim, q) { if (q.flares <= 0 || q.tFlare > 0) return 0; q.flares--; q.tFlare = HD.flareDur; q.tFlareCad = HD.flareCad; sim.evento({ t: 'hdFlare', idx: q.idx, id: q.dono, x: q.x, y: q.y, z: q.z }); return 1; }

/** Voo MANUAL — mesma lógica do bombardeiro (manche suavizado, curva coordenada, nivelamento automático), com os limites do hidroavião. */
function voaManualH(q, S, dt) { q.sx += (q.jx - q.sx) * Math.min(1, 5 * dt); q.sy += (q.jy - q.sy) * Math.min(1, 6 * dt);
  const bankMax = 0.9 * S.giro; if (Math.abs(q.jx) < 0.05) q.sx *= 1 - Math.min(1, 1.6 * dt); /* nivelamento automático */ q.bank += clamp((q.sx * bankMax - q.bank) * 2.6 * dt, -0.9 * dt, 0.9 * dt);
  let gA = q.sy * 0.42; if (q.y < HD.altMin + 60) gA = Math.max(gA, (HD.altMin + 60 - q.y) / 200); if (q.y > HD.altTeto - 150) gA = Math.min(gA, -(q.y - HD.altTeto + 150) / 600); if (Math.abs(q.jy) < 0.05) gA *= 0.5;
  q.gam += clamp((gA - q.gam) * 4 * dt, -0.6 * dt, 0.6 * dt); const v = Math.max(1, q.v); q.w = (q.w || 0) + (clamp(G * Math.tan(q.bank) / v * 4.5, -0.42 * S.giro, 0.42 * S.giro) - (q.w || 0)) * Math.min(1, 3 * dt);
  q.rumo = ang(q.rumo + q.w * dt); q.roll = -q.bank; const alvoV = S.vMax * HD.thrFr[Math.max(0, Math.min(4, q.thr | 0))]; q.v = clamp(q.v - G * Math.sin(q.gam) * 0.6 * dt + clamp(alvoV - q.v, -5 * dt, 6 * dt), S.vMin, S.vMax); q.pitch = q.gam;
  q.vy = q.v * Math.sin(q.gam); const vh = q.v * Math.cos(q.gam); q.vx = Math.sin(q.rumo) * vh; q.vz = -Math.cos(q.rumo) * vh; q.x += q.vx * dt; q.y = Math.max(HD.altMin * 0.6, q.y + q.vy * dt); q.z += q.vz * dt; }
/** Voo automático suave até (rx, rz) na altitude alt. */
function voaAuto(q, S, rx, rz, alt, v, dt) { const e = ang(marcacao(q.x, q.z, rx, rz) - q.rumo); let w = clamp(e * 0.8, -0.3 * S.giro, 0.3 * S.giro), vy = clamp((alt - q.y) * 0.3, -18, 22);
  w = (q.w || 0) + clamp(w - (q.w || 0), -0.35 * dt, 0.35 * dt); vy = (q.vy || 0) + clamp(vy - (q.vy || 0), -10 * dt, 10 * dt); q.roll = (q.roll || 0) + clamp(clamp(-w * 2.4, -0.8, 0.8) - (q.roll || 0), -0.7 * dt, 0.7 * dt);
  q.w = w; q.rumo = ang(q.rumo + w * dt); q.v += clamp(v - q.v, -6 * dt, 6 * dt); q.pitch = Math.atan2(vy, q.v); q.gam = q.pitch; q.bank = -q.roll; q.vx = Math.sin(q.rumo) * q.v; q.vz = -Math.cos(q.rumo) * q.v; q.vy = vy; q.x += q.vx * dt; q.y += vy * dt; q.z += q.vz * dt; }

function guardaPose(q) { q.px = q.x; q.py = q.y; q.pz = q.z; q.prumo = q.rumo; q.ppitch = q.pitch || 0; q.proll = q.roll || 0; }
function termina(sim, q, motivo) { const n = sim.navios[q.dono], k = n && n.hd; q.ativo = 0; q.hidro = null; if (k && k.noAr === q.idx) { k.noAr = -1; k.pil = 0; k.tRec = sim.t + HD.recarga; if (motivo !== 'pouso') k.perdidos++; } sim.evento({ t: motivo === 'pouso' ? 'hdPousa' : 'hdAbatido', idx: q.idx, id: q.dono, x: q.x, y: q.y, z: q.z, vx: q.vx, vy: q.vy, vz: q.vz }); }

/** Dano da antiaérea inimiga (vida real) + flares automáticos sob fogo. */
function antiaerea(sim, q, S, dt) { let dps = 0; const corte = q.tFlare > 0 ? HD.flareCorte : 1;
  for (const e of sim.navios) { if (e.morto || e.time === q.time || e.C.mercante) continue; const d = Math.hypot(q.x - e.x, q.y - e.C.F, q.z - e.z); if (d > HD.alcAA) continue;
    const f = d < HD.alcPleno ? 1 : 1 - (d - HD.alcPleno) / (HD.alcAA - HD.alcPleno); const forca = Math.min(1.6, 0.55 + 0.12 * (e.ciws ? e.ciws.length : 0) + (e.sam > 0 ? 0.25 : 0) + (e.C.antiAereo ? 0.2 : 0)); dps += HD.dpsNavio * f * forca; }
  q.sobFogo = dps > 0 ? 1 : 0; if (dps <= 0) return; if (q.tFlareCad <= 0 && q.flares > 0) soltaFlare(sim, q);
  q.vida -= dps * corte * dt; if (q.vida <= 0) { q.vida = 0; termina(sim, q, 'abatido'); } }

/** Passo de todos os hidroaviões (chamar depois de passoNuclear). */
export function passoHidros(sim, dt) { if (!sim.nukes) return;
  for (const n of sim.navios) { const k = n.hd; if (!k || k.noAr < 0) continue; const q = sim.nukes[k.noAr]; if (!q || !q.ativo || !q.hidro || q.dono !== n.id) { k.noAr = -1; k.pil = 0; k.tRec = Math.max(k.tRec || 0, sim.t + HD.recarga); } }
  for (const q of sim.nukes) if (q.ativo && q.hidro) passoHidro(sim, q, dt); }

function passoHidro(sim, q, dt) { const S = HIDROS[q.hidro] || HIDROS.albatroz, n = sim.navios[q.dono]; guardaPose(q); q.t += dt;
  if (q.tPrep > 0) q.tPrep = Math.max(0, q.tPrep - dt); if (q.tMis > 0) q.tMis -= dt; if (q.tTorp > 0) q.tTorp -= dt; if (q.tFlare > 0) q.tFlare -= dt; if (q.tFlareCad > 0) q.tFlareCad -= dt;
  for (let i = q.pend.length - 1; i >= 0; i--) if (sim.t >= q.pend[i].t) { entraTorpedo(sim, q, q.pend[i]); q.pend.splice(i, 1); }
  if (!n || n.morto) { if (q.fase === 1) { termina(sim, q, 'pouso'); return; } }
  if (q.manual) q.auto = 0; else if (q.alvo >= 0 && !alvoDe(sim, q)) q.alvo = -1;
  /* 1) CORRIDA NA ÁGUA: acelera sobre as ondas até a velocidade de decolagem, depois sobe */
  if (q.fase === 1) { q.v = Math.min(S.vDecola * 1.05, q.v + 4.2 * dt); q.vx = Math.sin(q.rumo) * q.v; q.vz = -Math.cos(q.rumo) * q.v; q.x += q.vx * dt; q.z += q.vz * dt; q.y = alturaMar(q.x, q.z, sim.t) + 1.2; q.pitch = -0.04 + 0.1 * (q.v / S.vDecola); q.roll = 0;
    if (q.v >= S.vDecola) { q.fase = 2; q.vy = 6; q.gam = 0.12; sim.evento({ t: 'hdNoAr', idx: q.idx, id: q.dono }); } return; }
  /* 4) POUSO NA ÁGUA: plana até tocar, freia na água e é recolhido pelo navio */
  if (q.fase === 4) { const h = alturaMar(q.x, q.z, sim.t) + 1.2; if (q.y > h + 0.5) { q.vy = clamp(-(q.y - h) * 0.5, -6, -1); q.y += q.vy * dt; q.v = Math.max(S.vDecola * 0.9, q.v - 2 * dt); } else { q.y = h; q.vy = 0; q.v = Math.max(0, q.v - 9 * dt); }
    q.pitch = q.y > h + 0.5 ? 0.05 : 0.02; q.roll *= 1 - Math.min(1, 2 * dt); q.vx = Math.sin(q.rumo) * q.v; q.vz = -Math.cos(q.rumo) * q.v; q.x += q.vx * dt; q.z += q.vz * dt; if (q.v < 3) termina(sim, q, 'pouso'); return; }
  if (q.fase === 2 && q.t > HD.autonomia) { q.manual = 0; q.espera = 0; q.fase = 3; sim.evento({ t: 'hdVolta', idx: q.idx, id: q.dono, motivo: 'combustivel' }); }
  if (q.manual && q.fase === 2) voaManualH(q, S, dt);
  else if (q.fase === 3) { /* REGRESSO: aproxima pela popa do navio, desce e pousa na água */ const m = n && !n.morto ? n : null; if (!m) { voaAuto(q, S, q.x + Math.sin(q.rumo) * 4000, q.z - Math.cos(q.rumo) * 4000, 300, S.vCruz, dt); }
    else { const tx = m.x - Math.sin(m.rumo) * 900 + Math.cos(m.rumo) * (m.C.B + 40), tz = m.z + Math.cos(m.rumo) * 900 + Math.sin(m.rumo) * (m.C.B + 40); const d = Math.hypot(tx - q.x, tz - q.z); voaAuto(q, S, tx, tz, d > 2500 ? 300 : Math.max(8, d * 0.08), d > 2500 ? S.vCruz : S.vDecola * 1.15, dt); if (d < 260 && q.y < 25) { q.fase = 4; sim.evento({ t: 'hdPouso', idx: q.idx, id: q.dono }); } } }
  else if (q.espera) { const cx = n && !n.morto ? n.x : q.x, cz = n && !n.morto ? n.z : q.z, R = 2600, a = Math.atan2(q.x - cx, -(q.z - cz)) + 0.5; voaAuto(q, S, cx + Math.sin(a) * R, cz - Math.cos(a) * R, HD.altCruz, S.vCruz * 0.85, dt); }
  else { /* IA / AUTO: vai ao alvo travado e usa as armas; sem alvo, patrulha à frente do navio */ const a = alvoDe(sim, q);
    if (a) { /* ataque com STAND-OFF: aproxima, dispara, ESCAPA para fora da antiaérea (> 5,5 km) e volta quando a arma recarrega */
      const d = Math.hypot(a.x - q.x, a.z - q.z), brg = marcacao(q.x, q.z, a.x, a.z), alin = Math.abs(ang(brg - q.rumo)) < 0.25; const fogeX = a.x - Math.sin(brg) * 6500, fogeZ = a.z + Math.cos(brg) * 6500;
      if (q.fuga > 0) { q.fuga -= dt; voaAuto(q, S, fogeX + Math.cos(brg) * 1500, fogeZ + Math.sin(brg) * 1500, HD.altCruz, S.vMax, dt); }
      else if (q.misseis > 0) { voaAuto(q, S, a.x, a.z, HD.altCruz, S.vMax * 0.92, dt); if (q.auto && alin && d < HD.missilAlc * 0.9 && q.tMis <= 0 && disparaMisseis(sim, q, n)) q.fuga = 9; }
      else if (q.torps > 0) { voaAuto(q, S, a.x, a.z, d < 7000 ? 60 : HD.altCruz, S.vMax * 0.9, dt); if (q.auto && alin && d < HD.torpAlc * 0.95 && q.tTorp <= 0 && q.y < 160 && lancaTorpedo(sim, q, n)) q.fuga = 10; }
      else { const R = 6800, ang0 = Math.atan2(q.x - a.x, -(q.z - a.z)) + 0.45; voaAuto(q, S, a.x + Math.sin(ang0) * R, a.z - Math.cos(ang0) * R, HD.altCruz, S.vCruz, dt); } }
    else { const fx = n && !n.morto ? n.x + Math.sin(n.rumo) * 3500 : q.x + Math.sin(q.rumo) * 3000, fz = n && !n.morto ? n.z - Math.cos(n.rumo) * 3500 : q.z - Math.cos(q.rumo) * 3000; voaAuto(q, S, fx + Math.cos(sim.t * 0.07 + q.idx) * 1800, fz + Math.sin(sim.t * 0.07 + q.idx) * 1800, HD.altCruz, S.vCruz, dt); } }
  if (q.fase >= 2 && q.y < alturaMar(q.x, q.z, sim.t) + 1 && q.fase !== 4) { termina(sim, q, 'abatido'); return; }
  if (q.fase >= 2 && colideAereoTerreno(sim, q, dt, { manual: q.manual ? 1 : 0, margem: 3 })) { termina(sim, q, 'abatido'); return; }
  antiaerea(sim, q, S, dt); }

/** Bomba atômica do hidroavião: a mesma do bombardeiro (detonação, raios, regras), com recarga de 25 s no ar. */
export function soltaBombaHidro(sim, q) { if (q.fase !== 2 || q.b.ativo || q.tPrep > 0 || !nuclearLiberado(sim, sim.navios[q.dono])) return 0; if (sim.t < HD.liberaApos) return 0; const I = impactoNuclear(q, _imp); if (!I.ok) return 0; soltaBomba(sim, q); q.tPrep = HD.recBomba; q.cargas = 99; q.fase = 2; q.bombaAuto = 0; return 1; }
