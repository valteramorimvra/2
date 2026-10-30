// v1.2.0 — Meios aéreos embarcados: HELICÓPTEROS (1–2 hangares por navio, 4 modelos genéricos) e o VANT de reconhecimento
// (botão LANÇAR DRONE). Determinístico (sim.rng), pools fixos. O jogador pode ASSUMIR um helicóptero (a IA assume o navio)
// e voltar ao navio (a IA assume o helicóptero: patrulha, ataca, volta para pousar e rearmar). Podem ser abatidos por
// CIWS, 30 mm e SAM inimigos. Sensores elevados enxergam por cima das ilhas e plotam no radar da frota (data-link).
import { bonusNivel, perfilArma } from '../aeronaves.js';
import { voaUnificado, bateuRelevo } from '../sim/vooUnificado.js'; /* v1.2.68: controle único (motor do bombardeiro) */
import { clamp, ang, marcacao, G } from '../sim/util.js';
import { HELIS, UAV, MISSEIS, TORPEDO } from '../sim/classes.js';
import { alturaMar } from '../sim/ocean.js';
import { alturaTerreno, bloqueado } from '../sim/maps.js';
import { desviaTerreno, colideAereoTerreno } from '../sim/colisaoTerreno.js';
import { PARAM } from '../armasParametros.js';
import { fatorAereo } from '../sim/deteccao.js';
import { planoConves, caminho, DK } from './convoo1226.js';

export const POOL_AEREO = { helis: 124, uavs: 20 }; /* v1.2.26: + alas ativas de 40 dos 2 porta-aviões gigantes (80 → 124 células) */ /* v1.2.16: ala aérea do super porta-aviões (24) + porta-aviões de escolta (8) */ /* v1.2.11: 8×8 + porta-aviões */
/** v1.2.30 item 13b: intervalo (s) entre disparos de aeronave por arma (míssil/torpedo/foguete; mg/canhão são contínuos). Única fonte: dispara() e a barra de recarga do HUD. */
export const INTERVALO_ARMA = { missil: 1.4, torpedo: 2.4, foguete: 1 }; /* v1.2.33: aeronaves mais agressivas (era 2 / 3 / 1,5) */
/** v1.2.30 item 13b: fração de recarga restante (1 = acabou de disparar, 0 = pronto) da aeronave h, para o anel do HUD. */
export const recargaHud = (h) => { const iv = INTERVALO_ARMA[h.H && h.H.arma]; return h.tArma > 0 && iv ? Math.min(1, h.tArma / iv) : 0; };
export const REPOE_S = 40; /* v1.2.26: s entre a perda de uma aeronave e a pronta da reserva no hangar */
export const EST = { HANGAR: 0, CONVOO: 1, DECOLA: 2, VOO: 3, RETORNO: 4, POUSO: 5, REARMA: 6, ABATIDO: 7 };
export const NOME_EST = ['no hangar', 'no convoo', 'decolando', 'em voo', 'retornando', 'pousando', 'rearmando', 'abatido'];
const REARMA = 25, DECOLA = 4.5, ALT_IA = 70;
import { regAereoDispara, regAereoInstala, danoAereoLado } from './regAereo.js'; /* v1.2.30 item 15 */
/** v1.2.29 item 13 — equilíbrio documentado (medido em sims 300 s). */
export const EQ_AR = {
  maxArLado: 36,          /* teto absoluto no ar por lado (aviões+heli+UAV) */
  maxArPorPA: 14,         /* típico gigante (C.maxAr); escolta menor via C.maxAr */
  maxArBotPA: 10,         /* bot PA: teto efetivo no ar (≤ C.maxAr) — evita swarm */
  rearmeS: REARMA,        /* hangar: rearme+reabastecimento */
  reservaS: 40,           /* REPOE_S: reserva prepara outra após perda */
  decolaS: DECOLA,        /* VTOL/pad vertical */
  botDanoMulJog: 1,       /* míssil/foguete de aeronave BOT → jogador. v1.2.30 item 13b (decisão Valter 20:21): era 0.48; 1 = dano IGUAL nos dois sentidos (só aeronave usa este fator; armas de navio não) */
  botMaxMisJog: 3,        /* mísseis de aeronave bot ativos mirando o jogador */
  a2aAlc: 1700,           /* dogfight canhão (v1.2.33: era 1400) */
  a2aCone: 0.75,          /* ±rad no nariz (v1.2.33: era 0,70) */
  a2aDpsAviao: 18,        /* vida/s (v1.2.33: era 14) */
  a2aDpsHeli: 9.5,        /* v1.2.33: era 7 */
};
function pool(n, f) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = Object.assign({ ativo: 0, idx: i }, f()); return a; }
const _o = { x: 0, y: 0, z: 0 };

export function instalaAereo(sim) {
  sim.helis = pool(POOL_AEREO.helis, () => ({ usado: 0, estado: 0, slot: 0, dono: -1, time: '', modelo: 'leve', H: HELIS.leve, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rumo: 0, v: 0, comb: 0, mun: 0, vida: 0,
    ctrl: 'ia', jx: 0, jy: 0, alt: ALT_IA, fogo: 0, alvo: -1, tArma: 0, tEst: 0, samAlvo: 0, auto: 0, fogoMg: 0 }));
  sim.uavs = pool(POOL_AEREO.uavs, () => ({ dono: -1, time: '', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, cx: 0, cz: 0, fase: 0, ang: 0, samAlvo: 0 }));
  regAereoInstala(sim); /* v1.2.30 item 15: registro de dano das aeronaves (só conta) */
}
/** Instala os helicópteros escolhidos no hangar do navio (até C.heli). */
/** v1.2.66 (Valter): o jogador ENTRA na batalha pilotando a aeronave do slot 0 da megabase.
 *  'pista' / 'heliponto': já no convés com pedido de decolagem (convés ágil) e controle manual — caças pela catapulta, helicópteros direto do ponto;
 *  'ar' (Air Start): já em voo tático 1,6 km à frente da base, na proa, a 70% da velocidade máxima e altitude de cruzeiro do tipo. */
function inicioAeroPrin(sim, n, h, ini) { if (!h) return; n.controle = 0; n.controleIA = 1; n.libVel = 2; h.ctrl = 'jog'; h.auto = 1; h.thr = ini === 'ar' ? 3 : 2;
  if (ini !== 'ar') { h.lancar = 1; return; }
  const d = 1600, alt = h.H.aviao ? 420 : 140; soltaPonto(n, h); if (n.dk && h.dkC >= 0 && n.dk.cats) { if (n.dk.cats[h.dkC] === h.idx) n.dk.cats[h.dkC] = -1; h.dkC = -1; }
  h.x = n.x + Math.sin(n.rumo) * d; h.z = n.z - Math.cos(n.rumo) * d; h.y = alt; h.rumo = n.rumo; h.v = h.H.vmax * 0.7; h.vx = Math.sin(h.rumo) * h.v; h.vz = -Math.cos(h.rumo) * h.v; h.vy = 0;
  h.estado = EST.VOO; h.tEst = 0; h.ativo = 1; h.oculto = 0; h.lancar = 0; h.alt = alt; h.pitch = 0; h.roll = 0; }
export function instalaHelisNavio(sim, n, modelos) {
  n.helis = []; n.tUav = 0; n.uav = -1; n.controle = -1; /* −1 = navio; k = helicóptero k */ n.controleIA = 0; const nh = n.Cb.heli || 0; if (!nh || !n.P.convoo) return;
  const lista = (n.aeroPrin && n.aeroPrin.heli ? [n.aeroPrin.heli, ...(n.C.helisPadrao || []).slice(1)] : n.forcaHelis && modelos && modelos.length ? modelos : n.C.helisPadrao ? n.C.helisPadrao : modelos && modelos.length ? modelos : ['multi', 'asw']).slice(0, nh); /* v1.2.11: porta-aviões usam a ala aérea própria (caças VTOL) */
  lista.forEach((mod, k) => { const h = sim.helis.find((q) => !q.usado); if (!h) return; let H = HELIS[mod] || HELIS.leve; const nvA = n.aeroNv && n.aeroNv[H.id]; if (nvA > 1) { const b = bonusNivel(nvA); H = Object.assign({}, H, { vmax: H.vmax * b.vel, vida: Math.round(H.vida * b.vida), recarga: H.recarga ? H.recarga * b.recarga : H.recarga }); } /* v1.2.61: evolução do hangar */ if (n.papel === 'jogador') H = Object.assign({}, H, { vida: Math.round(H.vida * VIDA_JOG) }); /* v1.2.69 (Valter): aeronave do jogador com vida considerável */ const nmA = n.aeroArma && n.aeroArma[H.id], PA = nmA ? perfilArma(nmA, H) : null; if (PA) H = Object.assign({}, H, PA.arma ? { arma: PA.arma, mun: PA.mun, alc: PA.alc, dano: PA.dano } : {}, { a2a: PA.a2a || 1, a2aAlc: PA.a2aAlc || 1, armaNome: nmA }); /* v1.2.65: arma principal escolhida no hangar */ const fu = n.mods.heliFuel || 1;
    Object.assign(h, { usado: 1, ativo: 0, estado: k === 0 ? EST.CONVOO : EST.HANGAR, slot: k, dono: n.id, time: n.time, modelo: H.id, camo: (n.camoPorAero && n.camoPorAero[H.id]) || n.camoAereo || 'padrao' /* v1.2.17 13i · v1.2.69: escolha do hangar por aeronave vence */, H, comb: H.comb * fu, combMax: H.comb * fu, mun: Math.round(H.mun * (n.mods.heliMun || 1)), munMax: Math.round(H.mun * (n.mods.heliMun || 1)), vida: H.vida, ctrl: 'ia', alt: ALT_IA, alvo: -1, tArma: 0, tEst: 0, rep: n.papel === 'jogador' ? REP_AERO.usos : 0, tRep: 0 /* v1.2.69: reparo próprio da aeronave */, auto: n.papel !== 'jogador' ? 1 : 0, rumo: n.rumo, v: 0 });
    h.lancar = 0; h.oculto = 1; h.dkE = -1; h.dkC = -1; h.esp = 0; h.tEspera = 0; n.helis.push(h.idx); iniConves(sim, n, h, k); });
  if (n.aeroPrin && n.aeroPrin.heli && !n.aeroPrin.nk && n.helis.length) inicioAeroPrin(sim, n, sim.helis[n.helis[0]], n.aeroPrin.ini);
  n.reservaAr = n.C.alaTotal ? Math.max(0, n.C.alaTotal - n.helis.length) : 0; /* v1.2.26: aeronaves de reserva no hangar dos gigantes (repõem abatidas) */
}
export function pad(sim, n, h) { const c = n.P.convoo; sim.mundo(n, c.x || 0, c.y + 0.6, c.z, _o); h.x = h.px = _o.x; h.y = h.py = _o.y; h.z = h.pz = _o.z; h.vx = Math.sin(n.rumo) * n.v; h.vz = -Math.cos(n.rumo) * n.v; h.vy = 0; h.rumo = n.rumo; }
/** v1.2.16 (item 20-corrigido): limite SEGURO DE DESEMPENHO de aeronaves NO AR por lado (aviões + helicópteros + drones): 24 por lado (48 no total;
 *  pool de 80 células) em todos os modos; o excedente espera no hangar/convoo e decola quando outra pousa ou cai. */
export const MAX_AR_LADO = 36, MAX_AR_PERS = 36; /* v1.2.27: teto de lado sobe p/ gigantes (≥18) + escoltas */
export const limiteArLado = (sim) => (sim.match && sim.match.pers ? Math.min(MAX_AR_PERS, sim.match.pers.maxAr || MAX_AR_PERS) : MAX_AR_LADO);
export function noArLado(sim, time) { let c = 0; for (const h of sim.helis) { if (h.estado >= EST.DECOLA && h.estado <= EST.POUSO) { const d = sim.navios[h.dono]; if (d && d.time === time) c++; } } for (const u of sim.uavs || []) if (u.ativo && u.time === time) c++; return c; }
const cabeLado = (sim, n) => noArLado(sim, n.time) < limiteArLado(sim) + (n.libMax ? 80 : 0); /* v1.2.32: LIBERAR ½/TODAS ignora o teto do lado */
const noAr = (sim, n) => { let c = 0; for (const i of n.helis) { const e = sim.helis[i].estado; if (e >= EST.DECOLA && e <= EST.POUSO) c++; } return c; };
/** Bot: conta também CONVOO (já comprometidos a decolar) — evita estouro do teto na catapulta. */
const noArCap = (sim, n) => { let c = 0; for (const i of n.helis) { const e = sim.helis[i].estado; if (e >= EST.CONVOO && e <= EST.POUSO) c++; } return c; };
const maxArNavio = (n) => { if (n.pistaFora) return 0; /* v1.2.60: pista da base destruída */ const m = n.C.maxAr || 16; return (n.papel === 'jogador') ? Math.max(m, n.libMax || 0) : Math.min(m, EQ_AR.maxArBotPA); };
/** Contagem global no ar por time do jogador (amigo) vs inimigo — HUD. */
export function contagemAr(sim, timeJog) {
  let amigo = 0, inimigo = 0;
  for (const h of sim.helis) {
    if (!h.usado || h.estado < EST.DECOLA || h.estado > EST.POUSO) continue;
    if (h.time === timeJog) amigo++; else inimigo++;
  }
  for (const u of sim.uavs || []) {
    if (!u.ativo) continue;
    if (u.time === timeJog) amigo++; else inimigo++;
  }
  const dn = danoAereoLado(sim, timeJog); /* v1.2.30 item 15: dano aéreo acumulado (HUD '✈ dano') */
  return { amigo, inimigo, danoA: dn.a, danoI: dn.i };
}

/** v1.2.69 (Valter): a aeronave do jogador é independente — vida própria considerável e consumível de REPARO (cura 45%, apaga o fogo). */
export const VIDA_JOG = 5; /* v1.2.69 (Valter): ×5 */ export const REP_AERO = Object.freeze({ usos: 2, cura: 0.45, recarga: 30 });
/** Comandos de helicóptero/VANT (aplicados pelo Sim). */
export function comandoAereo(sim, n, cmd) {
  const h = cmd.k != null && n.helis ? sim.helis[n.helis[cmd.k | 0]] : null;
  switch (cmd.t) {
    case 'heliLanca': if (h && h.estado === EST.CONVOO && cabeLado(sim, n)) { h.lancar = 1; h.auto = 1; } break; /* v1.2.26 item C: pedido de lançamento — decola quando chegar à catapulta/ao ponto (sem teleporte) */
    case 'aeroReparo': if (h && h.rep > 0 && !(h.tRep > sim.t) && h.estado !== EST.ABATIDO && h.vida < h.H.vida) { h.vida = Math.min(h.H.vida, h.vida + h.H.vida * REP_AERO.cura); h.fogo = 0; h.rep--; h.tRep = sim.t + REP_AERO.recarga; sim.evento({ t: 'aeroReparo', id: n.id, idx: h.idx, rep: h.rep }); } break; /* v1.2.69 */
    case 'heliCtrl': if (h) { h.jx = clamp(+cmd.jx || 0, -1, 1); h.jy = clamp(+cmd.jy || 0, -1, 1); h.alt = clamp(+cmd.alt || ALT_IA, PARAM.heli.altMin, Math.max(PARAM.heli.altMax, 15)); } break;
    case 'heliFlare': if (h && h.estado >= EST.DECOLA && h.estado <= EST.POUSO && (h.flares ?? PARAM.heli.flares) > 0 && !(h.tFlare > 0)) { h.flares = (h.flares ?? PARAM.heli.flares) - 1; h.tFlare = PARAM.heli.flareDur; sim.evento({ t: 'heliFlare', idx: h.idx, id: n.id, x: h.x, y: h.y, z: h.z }); } break;
    case 'heliFogo': if (h) h.fogo = 0.4; break;
    case 'heliThr': if (h) h.thr = Math.max(0, Math.min(4, cmd.v | 0)); break; /* v1.2.68: acelerador (asa) / coletivo (rotor) — 5 posições como no bombardeiro */
    case 'engajar': { const k = n.controle; const q = k >= 0 && n.helis ? sim.helis[n.helis[k]] : null; const alvo = cmd.v && cmd.alvo >= 0 && sim.navios[cmd.alvo] && !sim.navios[cmd.alvo].morto ? cmd.alvo | 0 : -1; /* v1.2.67: PILOTO AUTOMÁTICO OFENSIVO */
      if (q && q.estado >= EST.DECOLA && q.estado <= EST.RETORNO) { q.apAlvo = alvo; q.apEng = alvo >= 0 ? 1 : 0; q.ctrl = alvo >= 0 ? 'ia' : 'jog'; if (alvo >= 0) { q.missao = 'ataque'; if (q.estado === EST.RETORNO && q.comb > q.combMax * 0.15) q.estado = EST.VOO; } }
      else if (k < 0) { n.apAlvo = alvo; n.controleIA = alvo >= 0 ? 1 : 0; if (alvo >= 0) { n.alvoId = alvo; } }
      sim.evento({ t: alvo >= 0 ? 'apIni' : 'apFim', id: n.id, alvo, motivo: 'jogador' }); break; }
    case 'heliVolta': if (h && (h.estado === EST.VOO)) { h.estado = EST.RETORNO; } break;
    case 'controle': { const k = cmd.k == null || cmd.k < 0 ? -1 : cmd.k | 0; for (const i of n.helis || []) { const q = sim.helis[i]; if (q.ctrl === 'jog') q.ctrl = 'ia'; }
      if (k >= 0 && n.helis && n.helis[k] != null) { const q = sim.helis[n.helis[k]]; if (q.estado === EST.CONVOO && cabeLado(sim, n)) { q.lancar = 1; q.auto = 1; }
        if (q.estado !== EST.ABATIDO && q.estado !== EST.HANGAR && q.estado !== EST.REARMA) { q.ctrl = 'jog'; q.alt = Math.max(40, q.y); q.bank = q.roll || 0; /* v1.2.69: mesma convenção do voaUnificado */ q.gam = q.pitch || 0; q.sx = q.jx = 0; q.sy = q.jy = 0; if (q.thr == null) q.thr = q.H.aviao ? 2 : 2; n.controle = k; n.controleIA = 1; break; } }
      n.controle = -1; n.controleIA = 0; break; }
    case 'esquadrilha': if (n.helis && n.helis.length) { n.esq = 1; if (cmd.m === 1) { n.libMax = Math.ceil(n.helis.length / 2); n.libVel = 1.5; } else if (cmd.m === 2) { n.libMax = n.helis.length; n.libVel = 2; } /* v1.2.32: metade / todas, convés mais rápido */ for (const i of n.helis) { const q = sim.helis[i]; if (q.estado !== EST.ABATIDO) q.auto = 1; } sim.evento({ t: 'esquadrilha', id: n.id, n: n.helis.length }); } break; /* v1.2.16 item 13b: LANÇAR ESQUADRILHA — todos decolam em sequência (intervalo de convoo) e atacam */
    case 'uav': lancaUav(sim, n); break;
    case 'iaNavio': if (n.controle < 0) n.controleIA = cmd.v ? 1 : 0; break; // câmera do drone: a IA pilota o navio
  }
}
export function lancaUav(sim, n) {
  if (n.tUav > 0 || n.uav >= 0 || !cabeLado(sim, n)) return 0; /* v1.2.16 item 20 */ const u = sim.uavs.find((q) => !q.ativo); if (!u) return 0; sim.mundo(n, 0, n.C.F + 3, n.C.L * 0.44, _o);
  // centro da órbita: 2,5 km na direção do alvo travado / contato mais próximo / à frente
  let b = n.rumo; const a = n.alvoId >= 0 ? sim.navios[n.alvoId] : null; if (a && !a.morto) b = marcacao(n.x, n.z, a.x, a.z); else { let md = 1e12; for (const [id, c] of sim.contatos[n.time]) { const d = (c.x - n.x) ** 2 + (c.z - n.z) ** 2; if (d < md) { md = d; b = marcacao(n.x, n.z, c.x, c.z); } } }
  Object.assign(u, { ativo: 1, dono: n.id, time: n.time, x: _o.x, y: _o.y, z: _o.z, vx: Math.sin(n.rumo) * n.v, vy: 6, vz: -Math.cos(n.rumo) * n.v, t: 0, cx: n.x + Math.sin(b) * 2500, cz: n.z - Math.cos(b) * 2500, fase: 0, ang: 0, samAlvo: 0 });
  n.uav = u.idx; sim.evento({ t: 'uavLanc', id: n.id, idx: u.idx, x: _o.x, y: _o.y, z: _o.z }); return 1;
}
export function derrubaAereo(sim, tipo, q, por) {
  if (tipo === 'u') { q.ativo = 0; const d = sim.navios[q.dono]; if (d) { d.uav = -1; d.tUav = UAV.recarga; } sim.evento({ t: 'uavAbatido', x: q.x, y: q.y, z: q.z, idx: q.idx, por: por ? por.id : -1 }); return; }
  q.ativo = 0; q.estado = EST.ABATIDO; q.ctrl = 'ia'; const d = sim.navios[q.dono]; if (d && d.controle >= 0 && d.helis[d.controle] === q.idx) { d.controle = -1; d.controleIA = 0; }
  if (por) por.stats.menores = (por.stats.menores || 0) + 1; if (por) por.stats.helisAbatidos = (por.stats.helisAbatidos || 0) + 1;
  sim.evento({ t: 'heliAbatido', x: q.x, y: q.y, z: q.z, idx: q.idx, dono: q.dono, por: por ? por.id : -1 });
}
/** v1.2.30 item 12: aeronave no convés VISÍVEL (mesmo critério de contagemConves → c.conves). As ocultas (h.oculto) ficam no hangar e são protegidas. */
export function noConvesVisivel(h) { return !!h.usado && (h.estado === EST.CONVOO || ((h.estado === EST.HANGAR || h.estado === EST.REARMA) && !h.oculto)); }
/** v1.2.30 item 12: a onda de choque ARRANCA a aeronave do convés → corpo físico (ramo ABATIDO: gravidade, splash na água, colisão com terreno). Nada some: continua em sim.helis/n.helis e o contador ✈ a conta em perdidas. */
/** v1.2.30 item 12: queda de aeronave abatida/arrancada. Terreno: varredura do ponto anterior ao atual (sem atravessar). Splash na água. */
function caiAbatida(sim, h, dt) {
  if (h.caiu && !h.terra) { /* v1.2.50: destroço NA ÁGUA — o mar freia o impacto (arrasto ~1,8/s), flutua alguns segundos queimando na superfície e afunda devagar; antes seguia em queda livre e a fumaça/fogo saíam debaixo d'água */
    h.tAgua = (h.tAgua || 0) + dt; h.vx *= 1 - Math.min(1, dt * 1.8); h.vz *= 1 - Math.min(1, dt * 1.8); h.x += h.vx * dt; h.z += h.vz * dt; h.vy = 0;
    h.y = alturaMar(h.x, h.z, sim.t) - (h.tAgua < 7 ? 0.7 + h.tAgua * 0.12 : 1.54 + (h.tAgua - 7) * 0.9); return; }
  const ax = h.x, ay = h.y, az = h.z; h.vy -= G * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.z += h.vz * dt; h.vx *= 1 - dt * 0.3; h.vz *= 1 - dt * 0.3;
  { const ex = h.x - ax, ey = h.y - ay, ez = h.z - az, ns = Math.max(1, Math.ceil(Math.hypot(ex, ey, ez) / 1.5));
    for (let k = 1; k <= ns; k++) { const f = k / ns, qx = ax + ex * f, qy = ay + ey * f, qz = az + ez * f, ht = alturaTerreno(sim.T, qx, qz); if (ht > 0 && qy <= ht) { h.x = qx; h.z = qz; h.y = ht + 0.4; h.vx = h.vy = h.vz = 0; h.v = 0; h.terra = 1; h.tTerra = 0; h.caiu = 1; sim.evento({ t: 'terra', x: h.x, y: h.y, z: h.z, cal: 120, dono: -1 }); break; } } }
  if (!h.terra && h.y <= alturaMar(h.x, h.z, sim.t) && !h.caiu) { const vq = Math.hypot(h.vx, h.vy, h.vz); h.caiu = 1; h.tAgua = 0; h.y = alturaMar(h.x, h.z, sim.t) - 0.7; h.vx *= 0.3; h.vz *= 0.3; h.vy = 0; sim.evento({ t: 'agua', x: h.x, y: 0, z: h.z, cal: 120, dono: -1, aero: 1, vq, vx: h.vx, vz: h.vz }); } /* v1.2.50: impacto de aeronave no mar (vq = velocidade de impacto → tamanho do borrifo) */
}
const CORR_TICK = 0.3; const REST_CASCO = 0.2, ATRITO_CASCO = 0.4;
/** v1.2.30 item 12: contato FÍSICO da aeronave arrancada com o volume de um navio (casco = planta afinada do acertaNavio até o convés/convoo; superestrutura = caixa z0-2…z1+2 até C.F+h·2,6).
 *  Penetração pelo eixo de menor profundidade (lateral / extremos / topo); a posição só é corrigida pela penetração REAL (sem salto fixo); componente normal da velocidade relativa ao navio refletida com restituição 0,2; tangencial com atrito (Coulomb 0,4). */
function contatoCasco(sim, h) {
  if (h.caiu) return;
  for (const n of sim.navios) { if (n.morto || !n.C) continue; const C = n.C, dx = h.x - n.x, dz = h.z - n.z; if (dx * dx + dz * dz > (C.L * 0.55) ** 2) continue;
    const c = Math.cos(n.rumo), s = Math.sin(n.rumo), lx = dx * c + dz * s, lz = -dx * s + dz * c, ly = h.y - (n.arfagem || 0), hm = C.L / 2; if (Math.abs(lz) >= hm) continue;
    const u = (hm - lz) / C.L, afina = u > 0.6 ? Math.max(0.08, 1 - (u - 0.6) / 0.4) : u < 0.06 ? 0.85 : 1, W = (C.B / 2) * afina * 1.05; if (Math.abs(lx) >= W) continue;
    const sp = n.P && n.P.sup, deck = Math.max(C.F * 1.15, n.P && n.P.convoo ? n.P.convoo.y + 0.2 : 0); let inSup = !!sp && lz > sp.z0 - 2 && lz < sp.z1 + 2, topo = Math.max(deck, inSup ? C.F + sp.h * 2.6 : 0);
    if (h.dsup) { if (inSup && ly < topo) { inSup = false; topo = deck; } else h.dsup = 0; } /* nasceu DENTRO do volume da superestrutura (aeronave estacionada na zona dela): só vira sólido depois de sair uma vez */
    if (inSup && ly < deck - 0.15) { inSup = false; topo = deck; } /* abaixo do plano do convés é CASCO (sobe no máx. até o convés), não o telhado da superestrutura */
    if (!(ly > -C.T && ly < topo)) continue;
    let pen = W - Math.abs(lx), nx = lx >= 0 ? 1 : -1, ny = 0, nz = 0; /* lateral */
    if (topo - ly < pen) { pen = topo - ly; nx = 0; ny = 1; }
    const faceSup = inSup, pe = faceSup ? Math.min(lz - (sp.z0 - 2), sp.z1 + 2 - lz) : hm - Math.abs(lz), ez = faceSup ? (lz - (sp.z0 - 2) < sp.z1 + 2 - lz ? -1 : 1) : (lz >= 0 ? 1 : -1);
    if (pe < pen) { pen = pe; nx = 0; ny = 0; nz = ez; }
    const wx = nx * c - nz * s, wz = nx * s + nz * c; /* normal em coordenadas de mundo */
    h.penMax = Math.max(h.penMax || 0, pen); if (h._cT !== sim.t) { h._cT = sim.t; h._cA = 0; } const pa = Math.min(pen, Math.max(0, CORR_TICK - h._cA)); h._cA += pa; /* correção ≤ penetração real E ≤ CORR_TICK por tick: casco que se move de repente (balanço de navio afundando) empurra aos poucos, sem salto */
    h.x += wx * pa; h.z += wz * pa; h.y += ny * pa; h.corrMax = Math.max(h.corrMax || 0, pa); h.casco = (h.casco || 0) + 1; if (ny) h.cTopo = (h.cTopo || 0) + 1;
    const vsx = Math.sin(n.rumo) * n.v - (n.w || 0) * dz, vsz = -Math.cos(n.rumo) * n.v + (n.w || 0) * dx /* + giro do casco (n.w) */; let rx = h.vx - vsx, ry = h.vy, rz = h.vz - vsz; const vn = rx * wx + ry * ny + rz * wz;
    if (vn < 0) { const jn = -(1 + REST_CASCO) * vn; rx += wx * jn; ry += ny * jn; rz += wz * jn; const tx = rx - wx * (rx * wx + ry * ny + rz * wz), ty = ry - ny * (rx * wx + ry * ny + rz * wz), tz = rz - wz * (rx * wx + ry * ny + rz * wz), tm = Math.hypot(tx, ty, tz);
      if (tm > 1e-6) { const k = Math.max(0, tm - ATRITO_CASCO * jn) / tm - 1; rx += tx * k; ry += ty * k; rz += tz * k; }
      if (-vn >= 2 && sim.t - (h.tCasco ?? -9) > 0.25) { h.tCasco = sim.t; sim.evento({ t: 'cascoAereo', idx: h.idx, id: n.id, x: h.x, y: h.y, z: h.z, vn: -vn, topo: ny ? 1 : 0 }); } }
    if (ny) { const ox = lx >= 0 ? 1 : -1, ov = (rx * c + rz * s) * ox; if (ov < 2.5) { rx += (2.5 - ov) * ox * c; rz += (2.5 - ov) * ox * s; } } /* pousou no convés (raro): escorrega pelo bordo (balanço do navio) em vez de ficar parada */
    h.vx = vsx + rx; h.vy = ry; h.vz = vsz + rz; return; }
}
/** item 12: arrancada = subpassos ≤ 0,25 m (só as arrancadas, no máx. 8 por tick) com contato físico em cada um; as demais abatidas seguem o passo único de antes. */
function passoAbatida(sim, h, dt) {
  if (!h.arrancado) { caiAbatida(sim, h, dt); return; }
  const ns = Math.min(8, Math.max(1, Math.ceil(Math.hypot(h.vx, h.vy, h.vz) * dt / 0.25))), sdt = dt / ns;
  for (let k = 0; k < ns; k++) { caiAbatida(sim, h, sdt); if (h.terra || h.y <= -5) break; contatoCasco(sim, h); }
}
export function arrancaDoConves(sim, h, vx, vy, vz, por) { const n = sim.navios[h.dono]; if (n) { soltaTok(n, h); soltaPonto(n, h); if (n.controle >= 0 && n.helis[n.controle] === h.idx) { n.controle = -1; n.controleIA = 0; } }
  if (n && n.C) { /* v1.2.30 item 12: NUNCA cai no próprio casco — impulso lateral p/ fora do bordo mais próximo, suficiente p/ passar do costado antes de voltar à altura do convés (conta o arrasto horizontal 0,3/s do ramo ABATIDO e a velocidade do navio) */
    const c = Math.cos(n.rumo), s = Math.sin(n.rumo), lx = (h.x - n.x) * c + (h.z - n.z) * s, lado = lx >= 0 ? 1 : -1, vsx = Math.sin(n.rumo) * n.v, vsz = -Math.cos(n.rumo) * n.v;
    const tC = Math.max(1.2, 2 * Math.max(vy, 6) / G), dist = Math.max(0, n.C.B * 0.5 * 1.05 + 5 - Math.abs(lx)) , need = dist * 0.3 / (1 - Math.exp(-0.3 * tC)) + 2; /* m/s lateral RELATIVO ao navio */
    const rl = ((vx - vsx) * c + (vz - vsz) * s) * lado; if (rl < need) { vx += (need - rl) * lado * c; vz += (need - rl) * lado * s; } }
  h.estado = EST.ABATIDO; h.ativo = 1; h.oculto = 0; h.dk = null; h.ctrl = 'ia'; h.arrancado = 1; h.casco = 0; h.corrMax = 0; h.dsup = 1; h.tCasco = -9; h.caiu = 0; h.tAgua = 0; h.terra = 0; h.tTerra = 0; h.tRes = 0; h.vx = vx; h.vy = vy; h.vz = vz; h.v = Math.hypot(vx, vz);
  if (por && por.time !== h.time) { por.stats.menores = (por.stats.menores || 0) + 1; por.stats.helisAbatidos = (por.stats.helisAbatidos || 0) + 1; } /* crédito só por aeronave INIMIGA */ }

function alvoHeli(sim, h, n) { // alvo: o travado pelo navio (se jogador) ou o contato mais próximo do helicóptero
  if (h.apAlvo >= 0) { const f = sim.navios[h.apAlvo]; if (f && !f.morto) return f; h.apAlvo = -1; if (h.apEng) { h.apEng = 0; h.ctrl = 'jog'; sim.evento({ t: 'apFim', id: n.id, idx: h.idx, motivo: 'alvo' }); } } /* v1.2.67: alvo do piloto automático ofensivo */
  if (h.ctrl === 'jog' || n.papel === 'jogador') { const a = sim.navios[n.alvoId]; if (a && !a.morto) return a; }
  const ref = n.papel === 'jogador' ? n : h; /* v1.2.25 item 6: apoio de combate — a aeronave do jogador ataca a ameaça mais próxima do NAVIO-MÃE */ let b = null, bd = 1e12; for (const [id, c] of sim.contatos[h.time]) { const e = sim.navios[id]; if (!e || e.morto) continue; const d = (c.x - ref.x) ** 2 + (c.z - ref.z) ** 2; if (d < bd) { bd = d; b = e; } } return b; }
/** Dinâmica do helicóptero (PARAM.heli): vetor velocidade com INÉRCIA (deriva ~1,5–2 s ao soltar), aceleração limitada,
 * nariz baixo 25–30° acelerando / alto 10–15° freando, rolagem 35–40° nas curvas fechadas e guinada suave. Atitude no estado (determinística). */
function voa(h, rumoAlvo, vAlvo, altAlvo, dt, sim) { const H = h.H, P = PARAM.heli; if (H.aviao) return voaAviao(h, rumoAlvo, vAlvo, altAlvo, dt, sim); /* v1.2.29: IA/autopilot desvia de terreno (sobe ou lado curto) */ if (sim && h.ctrl !== 'jog') { const d = desviaTerreno(sim.T, h.x, h.y, h.z, h.rumo, rumoAlvo, Math.hypot(h.vx||0,h.vz||0)||vAlvo, altAlvo, { folga: 22, pitchMax: 0.38, gMax: 3.2, look: clamp(Math.abs(vAlvo)*3+280, 320, 1400) }); rumoAlvo = d.rumo; altAlvo = d.alt; vAlvo *= d.vMul; } const vmax = H.aviao ? H.vmax : Math.min(H.vmax, P.vCruzKmh / 3.6); vAlvo = H.aviao ? clamp(vAlvo, h.estado === EST.RETORNO ? 25 : 75, vmax) : clamp(vAlvo, -vmax * 0.3, vmax); /* v1.2.11: caça VTOL não paira em combate (≥ 75 m/s) */
  /* v1.2.17 item 27c: guinada com TAXA de giro em estado e aceleração angular limitada (pedais/rotor de cauda reais não giram de 0 ao máximo num quadro) — curva entra e sai suave, sem tranco */ const eR = ang(rumoAlvo - h.rumo), wD = clamp(eR * 1.6, -P.guinada, P.guinada), aW = P.guinada * 2.2; h.wr = (h.wr || 0) + clamp(wD - (h.wr || 0), -aW * dt, aW * dt); if (Math.abs(eR) < Math.abs(h.wr * dt) && Math.abs(h.wr) < aW * dt * 1.5) h.wr = eR / dt; const dr = h.wr * dt; h.rumo = ang(h.rumo + dr); const wr = h.wr;
  const sx = Math.sin(h.rumo), cz = -Math.cos(h.rumo); const fAnt = (h.vx || 0) * sx + (h.vz || 0) * cz;
  let ax = (sx * vAlvo - (h.vx || 0)) / P.inercia, az = (cz * vAlvo - (h.vz || 0)) / P.inercia; const am = Math.hypot(ax, az), freia = ax * (h.vx || 0) + az * (h.vz || 0) < 0, cap = freia ? P.acelFreio : P.acelMax; if (am > cap) { ax *= cap / am; az *= cap / am; }
  h.vx = (h.vx || 0) + ax * dt; h.vz = (h.vz || 0) + az * dt; h.v = h.vx * sx + h.vz * cz; const af = (h.v - fAnt) / dt; const R = Math.PI / 180;
  const pAlvo = (af > 0 ? -P.pitchAcel * Math.min(1, af / P.acelMax) : P.pitchFreio * Math.min(1, -af / (P.acelFreio * 0.8))) * R - P.pitchCruz * R * clamp(h.v / vmax, 0, 1) * (1 - Math.min(1, Math.abs(af) / P.acelMax));
  const rAlvo = clamp(Math.atan2(wr * Math.max(0, h.v), G), -P.rollMax * R, P.rollMax * R); const k = Math.min(1, dt * P.taxaAtitude);
  h.pitch = (h.pitch || 0) + (pAlvo - (h.pitch || 0)) * k; h.roll = (h.roll || 0) + (rAlvo - (h.roll || 0)) * k;
  const chao = Math.max(alturaMar(h.x, h.z, sim.t), alturaTerreno(sim.T, h.x + Math.sin(h.rumo) * 300, h.z - Math.cos(h.rumo) * 300), alturaTerreno(sim.T, h.x, h.z)) + 18; const yA = Math.max(altAlvo, chao);
  h.vy += clamp((yA - h.y) * 0.8 - h.vy, -8 * dt, 8 * dt); if (H.aviao) { h.pitch = clamp(Math.atan2(h.vy, Math.max(20, Math.abs(h.v))), -0.5, 0.5); h.roll = clamp(Math.atan2(wr * Math.max(0, h.v), G), -1.05, 1.05); } h.x += h.vx * dt; h.y += h.vy * dt; h.z += h.vz * dt; const lim = sim.T.tam * 0.47; h.x = clamp(h.x, -lim, lim); h.z = clamp(h.z, -lim, lim); if (sim && colideAereoTerreno(sim, h, dt, { manual: h.ctrl === 'jog' })) { derrubaAereo(sim, 'h', h, null); sim.evento({ t: 'heliTerreno', idx: h.idx, x: h.x, y: h.y, z: h.z }); } }
/** v1.2.15 (W) VOO DE AVIÃO (caça VTOL em combate): sem derrapagem — a velocidade fica SEMPRE no eixo do nariz; a curva é
 * COORDENADA: primeiro rola (taxa limitada ~95°/s), e a taxa de curva vem da inclinação (ω = g·tanφ/v, φ ≤ 60° ≈ 2 g);
 * aceleração/frenagem limitadas, subida/descida com ângulo de trajetória limitado e arfagem = ângulo da trajetória. */
function voaAviao(h, rumoAlvo, vAlvo, altAlvo, dt, sim) { const H = h.H, vmax = H.vmax; /* v1.2.29: caça IA desvia montanha */ if (sim && h.ctrl !== 'jog') { const d = desviaTerreno(sim.T, h.x, h.y, h.z, h.rumo, rumoAlvo, Math.max(h.v||0, vAlvo), altAlvo, { folga: 30, pitchMax: 0.48, gMax: 3.8, look: clamp(Math.abs(vAlvo)*3.5+400, 500, 2400) }); rumoAlvo = d.rumo; altAlvo = d.alt; vAlvo *= d.vMul; } vAlvo = clamp(vAlvo, h.estado === EST.RETORNO ? 25 : 75, vmax);
  let v = Math.max(h.v || 0, Math.hypot(h.vx || 0, h.vz || 0)); v += clamp(vAlvo - v, -16 * dt, 11 * dt); const vEf = Math.max(25, v);
  const erro = ang(rumoAlvo - h.rumo), wDes = clamp(erro * 0.9, -1, 1) * G * Math.tan(1.05) / vEf; const rDes = clamp(Math.atan2(wDes * vEf, G), -1.05, 1.05);
  /* v1.2.17 item 27c: TAXA de rolagem em estado (p) com aceleração limitada ~4 rad/s² e aproximação proporcional — rolagem entra e sai suave, sem degrau */ const pD = clamp((rDes - (h.roll || 0)) * 3, -1.65, 1.65); h.p = (h.p || 0) + clamp(pD - (h.p || 0), -4 * dt, 4 * dt); h.roll = clamp((h.roll || 0) + h.p * dt, -1.05, 1.05); let w = G * Math.tan(h.roll) / vEf; if (Math.abs(erro) < Math.abs(w * dt)) w = erro / dt; h.rumo = ang(h.rumo + w * dt);
  const chao = Math.max(alturaMar(h.x, h.z, sim.t), alturaTerreno(sim.T, h.x + Math.sin(h.rumo) * 600, h.z - Math.cos(h.rumo) * 600), alturaTerreno(sim.T, h.x, h.z)) + 25; const yA = Math.max(altAlvo, chao);
  const vyDes = clamp((yA - h.y) * 0.5, -0.3 * vEf, 0.35 * vEf); h.vy = (h.vy || 0) + clamp(vyDes - (h.vy || 0), -9 * dt, 9 * dt); h.pitch = (h.pitch || 0) + (Math.atan2(h.vy, vEf) - (h.pitch || 0)) * Math.min(1, dt * 4); /* v1.2.17 item 27c: arfagem segue a trajetória com atraso (~0,25 s) */
  h.v = v; h.vx = Math.sin(h.rumo) * v; h.vz = -Math.cos(h.rumo) * v; h.x += h.vx * dt; h.y += h.vy * dt; h.z += h.vz * dt; const lim = sim.T.tam * 0.47;
  if (Math.abs(h.x) > lim || Math.abs(h.z) > lim) { h.x = clamp(h.x, -lim, lim); h.z = clamp(h.z, -lim, lim); } if (sim && colideAereoTerreno(sim, h, dt, { manual: h.ctrl === 'jog' })) { derrubaAereo(sim, 'h', h, null); sim.evento({ t: 'heliTerreno', idx: h.idx, x: h.x, y: h.y, z: h.z }); } }
/** v1.2.15 (W): ponto da ARMA no mundo (avante/lateral/abaixo do centro, girado pelo rumo) — projéteis, clarão e som saem daqui. */
const _pa = { x: 0, y: 0, z: 0 }; function pontoArma(h, avante, lado, baixo) { const s = Math.sin(h.rumo), c = Math.cos(h.rumo); _pa.x = h.x + s * avante + c * lado; _pa.z = h.z - c * avante + s * lado; _pa.y = h.y - baixo; return _pa; }
/** v1.2.29 item 13: dogfight — canhão no envelope à frente; 0 fogo amigo (time filtrado pelo chamador). */
function disparaA2A(sim, h, ae, dt) {
  if (!ae || !ae.ativo || ae.time === h.time || ae.estado === EST.ABATIDO) return 0;
  const d = Math.hypot(ae.x - h.x, ae.z - h.z, (ae.y || 0) - (h.y || 0));
  if (d > EQ_AR.a2aAlc * ((h.H && h.H.a2aAlc) || 1)) return 0; /* v1.2.65: AR-AR longo do hangar estende o alcance */
  const b = marcacao(h.x, h.z, ae.x, ae.z);
  const off = Math.abs(ang(b - h.rumo));
  if (d > 500 && off > EQ_AR.a2aCone) return 0; /* ≤500 m: snap shot qualquer aspecto */
  if (d <= 500 && off > 2.2) return 0;
  h.fogoMg = 1; h.alvoMg = -1;
  const dps = (h.H && h.H.aviao ? EQ_AR.a2aDpsAviao : EQ_AR.a2aDpsHeli) * (h.H && h.H.a2a ? h.H.a2a : h.H && h.H.arma === 'mg' ? 1.15 : 1); /* v1.2.65: AR-AR escolhido no hangar */
  const hit = dps * dt; ae.vida -= hit;
  if (!h._a2aAcc) h._a2aAcc = 0; h._a2aAcc += hit;
  if (h._a2aAcc >= 4) { sim.evento({ t: 'a2aHit', idx: h.idx, vitima: ae.idx, x: ae.x, y: ae.y, z: ae.z, dps: +dps.toFixed(1) }); h._a2aAcc = 0; }
  if (ae.vida <= 0) {
    const dono = sim.navios[h.dono];
    derrubaAereo(sim, 'h', ae, dono || null);
    sim.evento({ t: 'a2aAbate', idx: h.idx, vitima: ae.idx, x: ae.x, y: ae.y, z: ae.z, por: h.dono });
  }
  return 1;
}
/** v1.2.30 item 15: registra lançamentos e marca o projétil com o modelo (hm); o disparo em si é o disparaIn() original. */
function dispara(sim, h, n, a) { return regAereoDispara(sim, h, n, a, disparaIn); }
function disparaIn(sim, h, n, a) {
  const H = h.H; if (h.mun <= 0 || h.tArma > 0 || !a) return 0; const d = Math.hypot(a.x - h.x, a.z - h.z); if (d > H.alc) return 0;
  if (H.arma === 'missil' || H.arma === 'foguete') { const off = Math.abs(ang(marcacao(h.x, h.z, a.x, a.z) - h.rumo)); if (off > (H.arma === 'foguete' ? 0.12 : 0.6)) return 0; } /* v1.2.15 (W): míssil/foguete de trilho fixo só sai com o alvo À FRENTE do nariz (±34° míssil, ±7° foguete) — antes saía para trás no flanco da órbita e se perdia */
  if (H.arma === 'missil') { const m = sim.misseis.find((q) => !q.ativo); if (!m) return 0; const pf = Object.assign({}, MISSEIS.curto, { nome: 'AN-L Dardo', v: 250, vt: 290, alc: 7500, dano: H.dano });
    const asa = (h.mun % 2 ? 1 : -1) * (H.aviao ? 2.6 : 1.8); const o = pontoArma(h, H.aviao ? -0.5 : 0.6, asa, H.aviao ? 0.9 : 1.2); const v0 = Math.max(120, (h.v || 0) + 15); /* v1.2.15: sai do PILONE com a velocidade da aeronave (+ ejeção) */ let danoM = H.dano; if (n.papel !== 'jogador' && a.papel === 'jogador') { /* equilíbrio: PA bot não solo-kill */ let nMis = 0; for (const q of sim.misseis) if (q.ativo && q.heli && q.time === n.time && q.alvo === a.id) nMis++; if (nMis >= EQ_AR.botMaxMisJog) return 0; danoM = H.dano * EQ_AR.botDanoMulJog; /* v1.2.30 item 13b: removido pkMul 0.85 de bot→jogador (AA intercepta pelo próprio poder, igual nos dois sentidos) */ }
    Object.assign(m, { ouro: 0, heli: 1, ativo: 1, x: o.x, y: o.y, z: o.z, vx: Math.sin(h.rumo) * v0, vy: (h.vy || 0) - 4, vz: -Math.cos(h.rumo) * v0, dono: n.id, time: n.time, alvo: a.id, isca: -1, fase: 3, t: 0, v: v0, perfil: pf, cel: 0, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, dano: danoM, pkMul: 1, heli: 1, velMul: 1 });
    h.mun--; h.tArma = INTERVALO_ARMA.missil; n.stats.misLanc++; sim.evento({ t: 'heliMissil', idx: h.idx, m: m.idx, x: m.x, y: m.y, z: m.z }); return 1; }
  if (H.arma === 'torpedo') { const tp = sim.torpedos.find((q) => !q.ativo); if (!tp) return 0; const b = marcacao(h.x, h.z, a.x, a.z);
    Object.assign(tp, { lancha: 0, ativo: 1, x: h.x, z: h.z, rumo: b, rumoAlvo: b, v: 10, dono: n.id, time: n.time, alvo: a.id, corrida: TORPEDO.arma, modo: 'acustico', t: 0, buscando: 0, danoMul: H.dano / TORPEDO.dano, alcMax: TORPEDO.arma + 3200, leve: 1 });
    h.mun--; h.tArma = INTERVALO_ARMA.torpedo; n.stats.torpLanc++; sim.evento({ t: 'heliTorpedo', idx: h.idx, x: h.x, y: h.y - 1.4, z: h.z, tp: tp.idx }); return 1; }
  if (H.arma === 'foguete') { let k = 0; const vx = Math.sin(a.rumo) * a.v, vz = -Math.cos(a.rumo) * a.v; const V = 820, t = d / V, px = a.x + vx * t, pz = a.z + vz * t; const dd = Math.hypot(px - h.x, pz - h.z) || 1;
    for (let gi = 288; gi < sim.granadas.length; gi++) { const g = sim.granadas[gi]; if (g.ativo) continue; const sp = (k - 1.5) * 0.004; /* v1.2.14: pool próprio dos foguetes de heli */ const ux = (px - h.x) / dd, uz = (pz - h.z) / dd; const cx = ux * Math.cos(sp) - uz * Math.sin(sp), cz = ux * Math.sin(sp) + uz * Math.cos(sp);
      const o = pontoArma(h, 0.8, (k % 2 ? 1 : -1) * 1.7, 1.3); /* v1.2.15: sai dos CASULOS das asas curtas, com a velocidade do heli */ Object.assign(g, { ativo: 1, x: o.x, y: o.y, z: o.z, vx: cx * V + (h.vx || 0), vz: cz * V + (h.vz || 0), vy: ((a.arfagem + a.C.F) - h.y) / t + G * t / 2, dono: n.id, time: n.time, dano: H.dano * (n.papel !== 'jogador' && a.papel === 'jogador' ? EQ_AR.botDanoMulJog : 1), cal: 70, t: 0, k: 0, fogo: 0.25, ap: 0, foguete: 1, rbu: 0, arcR: 0, fim: null }); /* v1.2.13 */ k++; if (k >= 4) break; }
    h.mun -= k; h.tArma = INTERVALO_ARMA.foguete; { const o = pontoArma(h, 0.8, 0, 1.3); sim.evento({ t: 'heliFoguete', idx: h.idx, x: o.x, y: o.y, z: o.z, n: k }); } return k; }
  // metralhadora 12,7 mm (fogo contínuo enquanto houver alvo no alcance)
  h.fogoMg = 1; h.alvoMg = a.id; h.mun -= PARAM.heli.canhaoTps * (1 / 60); h.tArma = 0; /* v1.2.15 (W): fração de tiros que ACERTA o casco (dispersão ~4 mrad + movimento do heli vs tamanho do alvo); o render desenha exatamente essa fração acertando */ h.mgP = clamp((a.C.L * 0.5 + a.C.F * 4) / (a.C.L * 0.5 + a.C.F * 4 + d * (0.004 + Math.abs(h.v || 0) * 0.00004) * 18), 0.12, 0.92); { const ap = sim.dano(a, H.dano / 60 * h.mgP / 0.7, n, 'heli', true); h.mgAcc = (h.mgAcc || 0) + (ap || 0); h.mgT = (h.mgT || 0) + 1 / 60; if (h.mgT >= 0.6 && h.mgAcc > 0) { sim.evento({ t: 'impacto', x: a.x, y: a.arfagem + a.C.F + 2, z: a.z, alvo: a.id, dono: n.id, cal: 13, tipo: 'mg', ly: 2, dano: Math.max(1, Math.round(h.mgAcc)) }); h.mgAcc = 0; h.mgT = 0; } } return 1; /* v1.2.8: número de dano da metralhadora a cada 0,6 s */
}
/* ===== v1.2.25 itens 3/5/6 — decolagem de convés, aproximação/pouso enganchado e IA tática ===== */
/** caça (asa fixa) em navio com convés corrido (porta-aviões): decola correndo pela pista; VTOL de cruzador e helicópteros seguem verticais */
const pista = (n, h) => !!(h.H.aviao && h.H.id !== 'jato' /* v1.2.26 item C: VTOL decola/pousa na VERTICAL (cada um do seu elevador) */ && n.C.porta === 'pa' && n.P.convoo && n.P.deckV);
const CAT = { tensao: 1.6, vCaca: 72, vVtol: 58, rot: 0.22, subida: 14 }; /* v1.2.29: rotação/subida mais íngreme */
function decolaPista(sim, n, h, dt) { const dk = dkN(n), K = dk.pc.cats[Math.max(0, h.dkC)] || dk.pc.cats[0], c = { x: K.x, y: n.P.convoo.y, z: K.z }, L = n.C.L, z0 = c.z, zF = K.zF, run = Math.max(60, z0 - zF), vT = h.H.id === 'jato' ? CAT.vVtol : CAT.vCaca, ac = (vT * vT) / (2 * run);
  if (h.tEst >= CAT.tensao && h.tEst - dt < CAT.tensao) sim.evento({ t: 'aeroSom', s: catEM(n) ? 'catEM' : 'catVapor', id: n.id, idx: h.idx }); /* v1.2.26 item B: curso da catapulta */
  const t = Math.max(0, h.tEst - CAT.tensao), sRun = 0.5 * ac * t * t, vRel = ac * t; const fx = Math.sin(n.rumo), fz = -Math.cos(n.rumo);
  if (sRun < run) { const u = sRun / run; const yG = c.y + 1.2 + (u > 0.78 ? (u - 0.78) / 0.22 * 4.5 : 0); /* v1.2.29: sobe mais cedo/íngua — não cruza câmera */ sim.mundo(n, c.x || 0, yG, z0 - sRun, _o); h.x = _o.x; h.y = _o.y; h.z = _o.z; h.rumo = n.rumo; h.roll = 0;
    h.pitch = u > 0.75 ? CAT.rot * 1.4 * Math.min(1, (u - 0.75) / 0.25) : 0; h.vx = fx * (n.v + vRel); h.vz = fz * (n.v + vRel); h.vy = u > 0.78 ? 8 + (u - 0.78) * 40 : 0; h.v = n.v + vRel; h.catV = vRel; return; } /* tensão da catapulta → corrida (≈ 3 g caça / ≈ 1,5 g VTOL em corrida curta) → rotação nos últimos 20% */
  if (h.dkC >= 0 && dk.cats[h.dkC] === h.idx) dk.cats[h.dkC] = -1; h.dkC = -1; h.estado = EST.VOO; h.tEst = 0; h.tSub = CAT.subida; h.rSub = n.rumo; h.v = n.v + vT; h.vx = fx * h.v; h.vz = fz * h.v; h.vy = vT * Math.sin(CAT.rot) * 0.6; h.pitch = CAT.rot; sim.evento({ t: 'cacaDecolou', id: n.id, idx: h.idx }); sim.evento({ t: 'aeroSom', s: 'catFim', id: n.id, idx: h.idx }); }
/** v1.2.25 item 5: combustível (s) para o recolhimento: trânsito ao ponto de espera (3,8 km à ré) a 0,85 vmax + curva + perna até o portão + final de 2,4 km a ~67 m/s + 20 s de reserva. */
function bingoConves(n, h) { const zTD = n.C.L * 0.38, fx = Math.sin(n.rumo), fz = -Math.cos(n.rumo), mx = n.x - fx * (zTD + 3800), mz = n.z - fz * (zTD + 3800); return Math.hypot(h.x - mx, h.z - mz) / (h.H.vmax * 0.85) + 30 + 1400 / Math.min(h.H.vmax * 0.55, n.v + 80) + 2400 / (n.v + 62) + 20 + 60 * filaPista(n) + 45 * aFrente(n, h); } /* v1.2.26 item C: + fila de pouso (um por vez no convés) */
function aproxima(sim, n, h, dt) { const c = n.P.convoo, L = n.C.L, zTD = L * 0.38, fx = Math.sin(n.rumo), fz = -Math.cos(n.rumo); h.tQuebra = 0; h.tSub = 0; 
  h.esp = 0; if (!h.ap) { if (!h.apM) { sim.mundo(n, c.x || 0, 0, zTD + 3800, _o); const dM = Math.hypot(_o.x - h.x, _o.z - h.z);
      if (dM < 2600 && (outroNaFinal(sim, n, h, 3400) || maisUrgente(sim, n, h))) { espera(sim, n, h, _o.x, _o.z, 800, 300, dt); return; } /* v1.2.26 item C: já há um avião na final → circula no ponto de espera (pilha de altitudes) */ /* 0) ponto de espera 3,8 km à ré: o avião chega ao portão ALINHADO com o rumo do navio (antes podia orbitar o portão sem nunca alinhar e ficar sem combustível) */
      const rx = h.x - n.x, rz = h.z - n.z, atras = -(rx * fx + rz * fz), lat = Math.abs(rx * fz - rz * fx); if (dM < 900 || (atras > zTD + 2700 && lat < 900 && Math.abs(ang(h.rumo - n.rumo)) < 1.2) || (atras > zTD + 3600 && lat < 1600)) h.apM = 1; else { voa(h, marcacao(h.x, h.z, _o.x, _o.z), h.H.vmax * (dM > 3000 ? 0.85 : 0.55), 220, dt, sim); return; } } /* já à ré do ponto de espera (avião rápido com raio de curva grande) também vale */
    { const rx = h.x - n.x, rz = h.z - n.z, atras = -(rx * fx + rz * fz), lat = rx * fz - rz * fx; sim.mundo(n, c.x || 0, 0, Math.max(zTD + 300, atras - 1800), _o); const trilha = outroNaFinal(sim, n, h); voa(h, marcacao(h.x, h.z, _o.x, _o.z), trilha ? Math.max(h.H.vmax * 0.3, n.v + 48) : Math.min(h.H.vmax * 0.55, n.v + 80), 170, dt, sim); /* v1.2.26: em trilha atrás do que está na final → reduz para manter a separação */ /* 1) perna final: persegue um ponto 1,8 km à frente (velocidade de configuração de pouso) na linha de centro estendida → converge para o eixo e para o rumo do navio */
      if (trilha && atras > zTD + 2300 && !maisUrgente(sim, n, h)) return; if ((trilha || maisUrgente(sim, n, h))) { h.apM = 0; return; } if (atras < zTD + 2600 && Math.abs(lat) < 350 && Math.abs(ang(h.rumo - n.rumo)) < 0.9) h.ap = 1; else if (atras < zTD + 1500) h.apM = 0; return; } } /* desalinhado perto demais → volta ao ponto de espera */
  sim.mundo(n, c.x || 0, c.y, zTD, _o); const dx = _o.x - h.x, dz = _o.z - h.z, d = Math.hypot(dx, dz), al = dx * fx + dz * fz; /* ao longo do rumo (>0 = ainda atrás do ponto de toque) */
  if (Math.abs(ang(h.rumo - n.rumo)) > 1.1 || al < -40 || d > 4000) { h.ap = 0; h.apM = 0; soltaTok(n, h); soltaPonto(n, h); return; } /* arremetida */
  { /* v1.2.30 (07c): a perna FINAL seguia a rampa 3,5° até o navio SEM olhar o relevo — com o navio perto de morro/ilha o avião atravessava o terreno (halong: 10 penetrações, até 6,5 m; arquipélago 2) em RETORNO/ap. Terreno à frente abaixo da trajetória prevista (+folga) → arremetida: sobe com a evitação de relevo do voo normal. */
    const vv = Math.max(40, h.v || 60), sx = Math.sin(h.rumo), sz = -Math.cos(h.rumo), lim = Math.min(Math.max(0, d - 60), 1500); let bate = alturaTerreno(sim.T, h.x, h.z) + 30 > h.y;
    for (let k = 150; !bate && k <= lim; k += 150) if (alturaTerreno(sim.T, h.x + sx * k, h.z + sz * k) + 30 > h.y + (h.vy || 0) * k / vv) bate = true;
    if (bate) { h.ap = 0; h.apM = 0; soltaTok(n, h); soltaPonto(n, h); sim.stConves && sim.stConves.arremetidas++; voa(h, h.rumo, Math.max(vv, 90), Math.max(h.y, alturaTerreno(sim.T, h.x + sx * 600, h.z + sz * 600) + 90), dt, sim); return; } }
  { const dk = dkN(n); if (dk.tok !== h.idx && al < 1100) { if (convesLivre(sim, n, h)) { dk.tok = h.idx; const e = elevLivre(n); if (e >= 0) { dk.el[e] = h.idx; h.dkE = e; } } else { h.ap = 0; h.apM = 0; sim.stConves && sim.stConves.arremetidas++; return; } } } /* v1.2.26 item C: a 1,1 km do toque o convés tem de estar LIVRE (sem catapulta ocupada na área de pouso, sem táxi, elevador livre); senão arremete */
  const br = marcacao(h.x, h.z, _o.x, _o.z), e = ang(br - h.rumo), w = clamp(e * 0.8, -0.25, 0.25); h.rumo = ang(h.rumo + w * dt); h.roll = clamp(-w * 1.6, -0.35, 0.35) * -1;
  const vg = n.v + 62; h.v = vg; h.vx = Math.sin(h.rumo) * vg; h.vz = -Math.cos(h.rumo) * vg; const yT = _o.y + 0.6 + Math.max(0, al) * Math.tan(0.061); const y0 = h.y; h.y += (yT - h.y) * Math.min(1, dt * 1.6); h.vy = (h.y - y0) / Math.max(dt, 1e-3); h.pitch = 0.09; /* rampa de 3,5°, nariz alto de aproximação */
  h.x += h.vx * dt; h.z += h.vz * dt; if (colideAereoTerreno(sim, h, dt, {})) { derrubaAereo(sim, 'h', h, null); sim.evento({ t: 'heliTerreno', idx: h.idx, x: h.x, y: h.y, z: h.z }); return; } /* 07c: rede de segurança */ if (al < 18 && d < 40 && Math.abs(h.y - yT) < 6) { h.estado = EST.POUSO; h.tEst = 0; h.ap = 0; h.apM = 0; { const q = paraLocal(n, h); h.lzP = q.z; h.lxP = q.x; h.lyP = h.y - n.arfagem; } h.sRel = 62; /* v1.2.26: toque a partir da posição REAL (sem salto para o eixo) */ sim.evento({ t: 'cacaToque', id: n.id, idx: h.idx }); } }
function pousoPista(sim, n, h, dt) { const c = n.P.convoo, dk = dkN(n); if (dk.tok !== h.idx && dk.tok < 0) dk.tok = h.idx; if (h.sRel > 0) { h.sRel = Math.max(0, h.sRel - 30 * dt); h.lzP -= h.sRel * dt; h.tTaxi = 0;
    const kx = Math.min(1, dt * 4); h.lxP = (h.lxP ?? (c.x || 0)) + ((c.x || 0) - (h.lxP ?? (c.x || 0))) * kx; h.lyP = (h.lyP ?? c.y + 1.2) + (c.y + 1.2 - (h.lyP ?? c.y + 1.2)) * Math.min(1, dt * 6);
    sim.mundo(n, h.lxP, h.lyP, h.lzP, _o); h.x = _o.x; h.y = _o.y; h.z = _o.z; h.rumo = n.rumo; h.pitch = (h.pitch || 0) * Math.max(0, 1 - dt * 2); h.roll = 0; h.v = n.v + (h.sRel || 0); h.vx = Math.sin(n.rumo) * h.v; h.vz = -Math.cos(n.rumo) * h.v; h.vy = 0; return; } /* cabo de parada: ~3 g, ≈ 65 m */
  /* v1.2.26 item C: solta o cabo e TAXIA até um elevador livre (pela linha central), depois desce ao hangar */
  if (!h.dk || h.dk.f !== 'tp') { if (h.dkE < 0) { const e = elevLivre(n); if (e >= 0) { dk.el[e] = h.idx; h.dkE = e; } } h.dk = { f: 'tp', x: h.lxP ?? (c.x || 0), z: h.lzP, y: 0.6, r: 0, p: [], vx: 0, vz: 0 }; if (h.dkE >= 0) { const E = dk.pc.el[h.dkE]; h.dk.p = caminho(h.dk.x, h.dk.z, E.x, E.z, c.x || 0); } }
  if (h.dkE < 0) { const e = elevLivre(n); if (e >= 0) { dk.el[e] = h.idx; h.dkE = e; const E = dk.pc.el[e]; h.dk.p = caminho(h.dk.x, h.dk.z, E.x, E.z, c.x || 0); } }
  h.pitch = (h.pitch || 0) * Math.max(0, 1 - dt * 2); const fim = h.dkE >= 0 && anda(h.dk, dt); poe(sim, n, h); if (dk.tok === h.idx && h.dk.z < dk.pc.zRoll - 25) soltaTok(n, h); /* v1.2.26: à frente da área de pouso libera o convés para o próximo */ h.tTaxi = (h.tTaxi || 0) + dt;
  if (fim) { soltaTok(n, h); h.estado = EST.REARMA; h.tEst = 0; h.ativo = 0; h.dk.f = 'desce'; sim.evento({ t: 'heliPousa', id: n.id, idx: h.idx }); } }
/** IA tática comum (caças e helicópteros da IA): retorna true quando a manobra assumiu o voo neste passo. */
/** v1.2.27: missão por slot — CAP / ataque / ASW / escolta (bombardeiro). */
function missaoSlot(n, h) { const k = h.slot | 0, H = h.H; if (h.escortNk != null && h.escortNk >= 0) return 'escolta';
  if (H && H.arma === 'torpedo') return 'asw'; if (H && H.aviao) return (k % 3 === 0) ? 'cap' : 'ataque'; return (k % 2) ? 'asw' : 'ataque'; }
function iaTatica(sim, n, h, a, dt) { const H = h.H;
  if (h.vida < H.vida * 0.4 && h.estado === EST.VOO) { h.estado = EST.RETORNO; return true; } /* avariado → volta para pousar (reparo + rearmar) */
  let sam = null; for (const q of sim.sams) if (q.ativo && q.tipoAlvo === 'h' && q.alvo === h.idx && q.t > 0.3) { sam = q; break; }
  if (sam) { const bM = marcacao(sam.x, sam.z, h.x, h.z), lado = ang(h.rumo - bM) > 0 ? 1 : -1; voa(h, ang(bM + lado * Math.PI / 2), H.vmax, H.aviao ? 35 : 14, dt, sim); return true; } /* evasão: vira para o través do míssil (nega o Doppler) e mergulha rente ao mar; flares saem pela regra existente */
  if (h.tSub > 0) { h.tSub -= dt; voa(h, h.rSub ?? n.rumo, H.vmax * 0.8, 320, dt, sim); return true; } /* subida inicial reta após a catapulta (sem curva colada ao convés) */
  if (h.tQuebra > 0) { h.tQuebra -= dt; voa(h, h.bQuebra, H.vmax, 240, dt, sim); return true; } /* quebra e sobe após o disparo */
  return false; }
/** v1.2.53: aeronave em voo atingida pela frente de choque — STALL temporário: perde sustentação (cai), rola e guina sem controle; o controle volta suave no fim. Perto do mar = queda. */
export function passoTurbulencia(sim, dt) { for (const h of sim.helis) { if (!h.usado || (h.estado !== EST.VOO && h.estado !== EST.RETORNO)) continue; const vivo = h.nkTurb > sim.t; if (!vivo && !h._nkR) continue;
    const u = vivo ? Math.min(1, (h.nkTurb - sim.t) / 3) : 0, av = !!(h.H && h.H.aviao); /* deslocamentos de atitude somados POR CIMA do piloto (avião: atitude absoluta a cada tick; helicóptero: atitude suavizada → desconta a anterior) */
    h.nkAR = (h.nkAR || 0) + (vivo ? h.nkP * u : -(h.nkAR || 0) * 1.2) * dt; h.nkAQ = (h.nkAQ || 0) + (vivo ? h.nkQ * u : -(h.nkAQ || 0) * 1.2) * dt; h.nkP = (h.nkP || 0) * (1 - dt * 0.3);
    const offR = h.nkAR, offQ = clamp(h.nkAQ, -0.9, 0.5); if (av) { h.roll = (h.roll || 0) + offR; h.pitch = (h.pitch || 0) + offQ; } else { h.roll = (h.roll || 0) - (h._nkR || 0) + offR; h.pitch = (h.pitch || 0) - (h._nkQ || 0) + offQ; }
    h._nkR = Math.abs(offR) > 1e-3 || vivo ? offR : 0; h._nkQ = offQ; if (!h._nkR) { h.nkAR = 0; h.nkAQ = 0; }
    if (vivo) { h.rumo = ang(h.rumo + h.nkY * u * dt); h.y -= (6 + 16 * u) * u * dt; /* STALL: perde sustentação */ if (h.y < alturaMar(h.x, h.z, sim.t) + 4) { h.nkTurb = 0; h._nkR = 0; derrubaAereo(sim, 'h', h, null); } } } }
export function passoAereo(sim, dt) { POOL_REF.s = sim; if (!sim.stConves) sim.stConves = { arremetidas: 0 }; for (const n of sim.navios) if (n.dk) validaDk(sim, n);
  /* v1.2.27: porta-aviões (Abrolhos/Costa Verde/Chapada/Lençóis e demais PA) — ondas contínuas até maxAr, jogador e bots */
  for (const n of sim.navios) { if (n.morto || !n.helis || !n.helis.length || !(n.C.porta === 'pa' || n.C.maxAr >= 8)) continue;
    if (sim.t > 8 && !n.esq) { n.esq = 1; for (const i of n.helis) { const q = sim.helis[i]; if (q && q.estado !== EST.ABATIDO) { q.auto = 1; if (!q.missao) q.missao = missaoSlot(n, q); } } sim.evento({ t: 'esquadrilha', id: n.id, n: n.helis.length, auto: 1 }); }
    else if (n.esq) { for (const i of n.helis) { const q = sim.helis[i]; if (!q || q.estado === EST.ABATIDO) continue; if (!q.auto) q.auto = 1; if (!q.missao) q.missao = missaoSlot(n, q); } } }

  for (const h of sim.helis) { if (!h.usado) continue; h.px = h.x; h.py = h.y; h.pz = h.z; h.prumo = h.rumo; h.ppitch = h.pitch || 0; h.proll = h.roll || 0; /* v1.2.29: pose anterior p/ lerp câmera/mesh */ const n = sim.navios[h.dono]; h.fogoMg = 0; if (h.tArma > 0) h.tArma -= dt; if (h.tFlare > 0) h.tFlare -= dt; if (h.fogo > 0) h.fogo -= dt; h.tEst += dt;
    if (h.estado === EST.ABATIDO) { if (h.terra) { h.vx = h.vy = h.vz = 0; if ((h.tTerra += dt) > 30) { h.terra = 0; h.y = -6; } /* item 12: destroço parado na montanha 30 s; depois entra na reposição como o que afunda */ } else if (h.y > -5) passoAbatida(sim, h, dt); /* item 12: queda (terreno/água) + contato físico com cascos */
      else if (n && n.reservaAr > 0 && !n.morto && n.P.convoo) { h.tRes = (h.tRes || 0) + dt; if (h.tRes > REPOE_S) { n.reservaAr--; const H = h.H, fu = n.mods.heliFuel || 1; /* v1.2.26: reserva do gigante prepara outra aeronave do mesmo tipo no hangar */
        Object.assign(h, { ativo: 0, estado: EST.HANGAR, caiu: 0, tAgua: 0, arrancado: 0, casco: 0, terra: 0, tTerra: 0, tRes: 0, fogo: 0, comb: H.comb * fu, combMax: H.comb * fu, mun: h.munMax, vida: H.vida, ctrl: 'ia', alt: ALT_IA, alvo: -1, tArma: 0, tEst: 0, v: 0, lancar: 0, oculto: 1, dk: null, dkE: -1, dkC: -1, esp: 0, ap: 0, apM: 0 }); pad(sim, n, h); sim.evento({ t: 'reservaAr', id: n.id, resta: n.reservaAr }); } }
      continue; }
    if (n.morto && h.estado !== EST.VOO && h.estado !== EST.RETORNO) { h.ativo = 0; h.estado = EST.HANGAR; h.usado = 0; continue; } // afundou com o navio
    if (h.estado === EST.HANGAR) { h.ativo = 0; escondido(sim, n, h); if (h.comb > 0 && h.tEst > (pista(n, h) ? 6 : n.esq ? 3 : 8) && (n.papel === 'jogador' ? noAr(sim, n) : noArCap(sim, n)) < maxArNavio(n) && cabeLado(sim, n) && !(dkN(n).pc.pa && recolhendo(sim, n) && !n.libMax)) sobeConves(sim, n, h); /* ciclo de recolhimento tem prioridade: ninguém sobe enquanto há aeronave aguardando pouso */ continue; } /* v1.2.26 item C: só sai do hangar com elevador/convoo LIVRE */
    if (h.estado === EST.CONVOO) { h.ativo = 0; passoConves(sim, n, h, dt); continue; }
    if (h.estado === EST.REARMA) { h.ativo = 0; recolhe(sim, n, h, dt); if (h.tEst > REARMA && h.oculto) { h.comb = h.combMax; h.mun = h.munMax; h.estado = EST.HANGAR; h.tEst = 0; } continue; }
    h.ativo = 1; h.oculto = 0;
    if (h.estado === EST.DECOLA && pista(n, h)) { decolaPista(sim, n, h, dt); continue; } /* v1.2.25 item 3: corrida de convés com catapulta, rotação e subida */
    if (h.estado === EST.DECOLA && h.H.aviao) h.pitch = 0, h.roll = 0;
    if (h.estado === EST.DECOLA) { const c = n.P.convoo, q = h.dk || { x: c.x || 0, z: c.z, r: 0 }; sim.mundo(n, q.x, c.y + 0.6 + Math.min(55, h.tEst * h.tEst * 4.5), q.z, _o); /* v1.2.29: sobe mais rápido — não cruza câmera popa */ h.vx = (_o.x - h.x) / dt; h.vz = (_o.z - h.z) / dt; h.vy = (_o.y - h.y) / dt; h.x = _o.x; h.y = _o.y; h.z = _o.z; h.rumo = ang(n.rumo + (q.r || 0)); h.v = n.v; /* v1.2.26 item C: sobe na vertical do SEU ponto (elevador/convoo) */
      if (h.tEst > DECOLA) { h.estado = EST.VOO; h.tEst = 0; soltaPonto(n, h); } continue; }
    h.comb -= h.esp ? dt * 0.5 : dt; /* v1.2.26 item C: em espera (circuito) voa em regime de autonomia máxima */ if (h.comb <= 0 && h.estado === EST.VOO) h.estado = EST.RETORNO;
    if (h.estado === EST.VOO && h.ctrl === 'ia' && (h.comb < (pista(n, h) ? bingoConves(n, h) : Math.max(h.combMax * 0.22, Math.hypot(h.x - n.x, h.z - n.z) / (Math.min(h.H.vmax, PARAM.heli.vCruzKmh / 3.6) * 0.7) + 40 + (dkN(n).pc.pa ? 45 : 15))) || /* v1.2.25 item 5: avião de convés — bingo pelo CAMINHO real de recolhimento (ver bingoConves) */ (h.mun <= 0 && h.H.arma !== 'mg'))) h.estado = EST.RETORNO;
    if (h.estado === EST.VOO && h.ctrl === 'jog' && h.comb < h.combMax * 0.08) { h.estado = EST.RETORNO; sim.evento({ t: 'heliBingo', idx: h.idx, id: n.id }); }
    if ((h.comb <= -30 || n.morto && h.comb <= 0) && h.estado !== EST.POUSO && !(h.ap && n.dk && n.dk.tok === h.idx)) { derrubaAereo(sim, 'h', h, null); continue; } /* v1.2.25: já no convés (cabo/taxi) não cai por combustível */
    if (h.ctrl === 'ia' && !(h.tFlare > 0) && (h.flares ?? PARAM.heli.flares) > 0 && sim.sams.some((s) => s.ativo && s.tipoAlvo === 'h' && s.alvo === h.idx && s.t > 0.8)) { h.flares = (h.flares ?? PARAM.heli.flares) - 1; h.tFlare = PARAM.heli.flareDur; sim.evento({ t: 'heliFlare', idx: h.idx, id: n.id, x: h.x, y: h.y, z: h.z }); }
    if (h.estado === EST.VOO) { const a = alvoHeli(sim, h, n);
      if (h.ctrl === 'jog') { voaUnificado(h, dt, sim); /* v1.2.68: pilotagem antiga (voa com rumo/alt) SUBSTITUÍDA pelo controlador do bombardeiro */ if (bateuRelevo(h, dt, sim)) { derrubaAereo(sim, 'h', h, null); sim.evento({ t: 'heliTerreno', idx: h.idx, x: h.x, y: h.y, z: h.z }); continue; } if (h.fogo > 0 || (h.H.arma === 'mg' && h.fogo > 0)) dispara(sim, h, n, a); }
      else if ((() => { /* v1.2.29 item 13: dogfight — prioridade sobre CAP/ataque se inimigo no envelope; busca stagger 3 ticks (FPS) */
        let ae = h._ae, ad = h._ad != null ? h._ad : 9e6;
        if ((sim.tick + h.idx) % 3 === 0 || !ae || !ae.ativo) { ae = null; ad = 9e6; for (const q of sim.helis) { if (!q.ativo || q.time === h.time || q.estado < EST.DECOLA || q.estado > EST.RETORNO) continue; const d2 = (q.x - h.x) ** 2 + (q.z - h.z) ** 2; if (d2 < ad) { ad = d2; ae = q; } } h._ae = ae; h._ad = ad; }
        const ra = EQ_AR.a2aAlc * (h.H.a2aAlc || 1); if (!(ae && ad < ra * ra * 1.6)) return false;
        if (!iaTatica(sim, n, h, a, dt)) voa(h, marcacao(h.x, h.z, ae.x, ae.z), h.H.vmax, Math.max(60, ae.y || 80), dt, sim);
        disparaA2A(sim, h, ae, dt); return true;
      })()) { /* dogfight */ }
      else if (iaTatica(sim, n, h, a, dt)) { /* v1.2.25 itens 5/6: manobra tática (subida após decolagem, evasão de míssil, quebra após disparo, retorno com avaria) */ }
      else { let rA, vA = h.H.vmax * 0.95 /* v1.2.33: era 0,85 */, alt = ALT_IA; const mis = h.missao || 'ataque';
        /* v1.2.27: escolta do bombardeiro nuclear — voa em formação até soltar/pousar */
        if (mis === 'escolta' && h.escortNk != null && sim.nukes) { const nk = sim.nukes[h.escortNk]; if (nk && nk.ativo) { const ox = nk.x + Math.cos(sim.t * 0.5 + h.idx) * 400, oz = nk.z + Math.sin(sim.t * 0.5 + h.idx) * 400; voa(h, marcacao(h.x, h.z, ox, oz), h.H.vmax * 0.95, Math.max(200, (nk.y || 800) - 80), dt, sim); continue; } h.missao = 'cap'; h.escortNk = -1; }
        /* CAP: intercepta aeronave inimiga a ≤ 3 km, senão patrulha e ataca navio se entrar no envelope */
        if (mis === 'cap' && h.H.aviao) { let ae = null, ad = 9e6; for (const q of sim.helis) { if (!q.ativo || q.time === h.time || q.estado !== EST.VOO) continue; const d2 = (q.x - h.x) ** 2 + (q.z - h.z) ** 2; if (d2 < ad) { ad = d2; ae = q; } }
          if (ae) { voa(h, marcacao(h.x, h.z, ae.x, ae.z), h.H.vmax, Math.max(80, ae.y), dt, sim); disparaA2A(sim, h, ae, dt); continue; }
          if (a && Math.hypot(a.x - h.x, a.z - h.z) < h.H.alc * 1.4 && h.mun > 0) { dispara(sim, h, n, a); voa(h, marcacao(h.x, h.z, a.x, a.z), h.H.vmax, 200, dt, sim); continue; } /* v1.2.33: mais agressivo */
          const t = sim.t * 0.08 + h.idx; const ox = n.x + Math.sin(n.rumo) * 3200 + Math.cos(t) * 2000, oz = n.z - Math.cos(n.rumo) * 3200 + Math.sin(t) * 2000; voa(h, marcacao(h.x, h.z, ox, oz), vA, 320, dt, sim); continue; }
        if (h.H.aviao) { let ae = null, ad = 9e6; for (const q of sim.helis) { if (!q.ativo || q.time === h.time || q.estado !== EST.VOO) continue; const d2 = (q.x - h.x) ** 2 + (q.z - h.z) ** 2; if (d2 < ad) { ad = d2; ae = q; } }
          if (ae && ad < 3200 * 3200) { /* v1.2.33: caça de mais longe */ voa(h, marcacao(h.x, h.z, ae.x, ae.z), h.H.vmax, Math.max(80, ae.y), dt, sim); disparaA2A(sim, h, ae, dt); continue; } }
        if (a && mis !== 'asw') { const d = Math.hypot(a.x - h.x, a.z - h.z), b = marcacao(h.x, h.z, a.x, a.z); const corrida = h.H.arma === 'mg' && ((sim.t + h.idx * 13) % 40) < 15; const fica = h.H.arma === 'mg' ? (corrida ? h.H.alc * 0.7 : 2400) : Math.max(700, h.H.alc * 0.65); /* v1.2.33: ataque mais perto */
          const pronto = h.mun > 0 && !(h.tArma > 0) && d < h.H.alc && (h.H.arma === 'missil' || h.H.arma === 'foguete'); rA = d > fica + 300 || pronto ? b : ang(b + Math.PI / 2 * (h.slot ? -1 : 1)); alt = h.H.aviao ? (d > fica + 2500 ? 260 : 60) : h.H.arma === 'missil' ? 40 : h.H.arma === 'torpedo' ? 25 : h.H.arma === 'foguete' ? 28 : 120; if (d < fica + 400 && (h.H.arma !== 'mg' || corrida)) { const m0 = h.mun; dispara(sim, h, n, a); if (h.mun < m0 && h.H.aviao) { h.tQuebra = 3; h.bQuebra = ang(b + (h.slot % 2 ? 2.2 : -2.2)); } } if (h.H.aviao && d < 9000) rA = ang(rA + 0.2 * Math.sin(sim.t * 0.7 + h.idx * 1.7)); }
        else if (mis === 'asw') { const t = sim.t * 0.06 + h.idx; const ox = n.x + Math.sin(n.rumo) * 1800 + Math.cos(t) * 1400, oz = n.z - Math.cos(n.rumo) * 1800 + Math.sin(t) * 1400; rA = marcacao(h.x, h.z, ox, oz); alt = 40; vA = Math.min(h.H.vmax * 0.7, 55); if (a) { const d = Math.hypot(a.x - h.x, a.z - h.z); if (d < h.H.alc && h.mun > 0) dispara(sim, h, n, a); } }
        else { const t = sim.t * 0.08 + h.idx; const ox = n.x + Math.sin(n.rumo) * 2200 + Math.cos(t) * 900, oz = n.z - Math.cos(n.rumo) * 2200 + Math.sin(t) * 900; rA = marcacao(h.x, h.z, ox, oz); alt = h.H.aviao ? 180 : 110; }
        voa(h, rA, vA, alt, dt, sim); } }
    else if (h.estado === EST.RETORNO && pista(n, h)) aproxima(sim, n, h, dt); /* v1.2.25 item 5: aproximação no rumo do navio, rampa de 3,5° e pouso enganchado */
    else if (h.estado === EST.POUSO && pista(n, h)) pousoPista(sim, n, h, dt);
    else if (h.estado === EST.RETORNO) { const c = n.P.convoo, T = pontoPouso(sim, n, h); h.esp = 0; if (!T) { espera(sim, n, h, n.x, n.z, 320 + 45 * (h.slot % 6), 70, dt); continue; } /* v1.2.26 item C: convés/convoo ocupado → circuito de espera ao redor do navio */
      sim.mundo(n, T.x, c.y, T.z, _o); const d = Math.hypot(_o.x - h.x, _o.z - h.z); voa(h, marcacao(h.x, h.z, _o.x, _o.z), Math.min(h.H.vmax, Math.max(n.v + 3, d * (d > 1500 ? 0.25 : 0.08))), Math.max(45, c.y + 22), dt, sim); /* v1.2.26: desacelera perto (saindo do circuito não orbita o ponto) */
      if (d < 50 && T.meu) { h.estado = EST.POUSO; h.tEst = 0; h.dk = { f: 'pv', x: T.x, z: T.z, y: 0, r: 0, p: [], vx: 0, vz: 0 }; if (h.ctrl === 'jog') { h.ctrl = 'ia'; n.controle = -1; n.controleIA = 0; sim.evento({ t: 'controleVolta', id: n.id }); } } }
    else if (h.estado === EST.POUSO) { const c = n.P.convoo, q = h.dk || { x: c.x || 0, z: c.z }; if (q.lx == null) { const L0 = paraLocal(n, h); q.lx = L0.x; q.lz = L0.z; q.ly = h.y - n.arfagem - c.y - 0.6; } let lx = q.lx, lz = q.lz, ly = q.ly; const dH = Math.hypot(q.x - lx, q.z - lz);
      const hh = Math.max(0, 35 * (1 - h.tEst / 5), Math.min(35, dH * 1.5)), k = Math.min(1, dt * 2.5); /* v1.2.26: aproximação no referencial do NAVIO (sem atraso) e só desce sobre o PRÓPRIO ponto */
      { let mx = (q.x - lx) * k, mz = (q.z - lz) * k; const mh = Math.hypot(mx, mz), cap = 10 * dt; if (mh > cap) { mx *= cap / mh; mz *= cap / mh; } lx += mx; lz += mz; ly += clamp((hh - ly) * k, -8 * dt, 8 * dt); q.lx = lx; q.lz = lz; q.ly = ly; } /* integrado no referencial do navio (o navio anda depois deste passo) */
      const x0 = h.x, y0 = h.y, z0 = h.z; sim.mundo(n, lx, c.y + 0.6 + ly, lz, _o); h.x = _o.x; h.y = _o.y; h.z = _o.z; h.vx = (h.x - x0) / dt; h.vy = (h.y - y0) / dt; h.vz = (h.z - z0) / dt; h.rumo += ang(n.rumo - h.rumo) * k;
      if (h.tEst > 5.5 && Math.hypot(q.x - lx, q.z - lz) < 0.6 && ly < 0.35) { h.estado = EST.REARMA; h.tEst = 0; h.ativo = 0; h.dk.f = dkN(n).pc.pa ? 'desce' : 'rec'; h.dk.r = ang(h.rumo - n.rumo); h.dk.t = 0; { const L0 = paraLocal(n, h); h.dk.x = L0.x; h.dk.z = L0.z; h.dk.y = h.y - n.arfagem - n.P.convoo.y - 0.6; } sim.evento({ t: 'heliPousa', id: n.id, idx: h.idx }); } }
  }
  // VANT: sobe a 100 m, voa até o centro e orbita (raio 600 m); depois some (recolhido) e recarrega
  for (const u of sim.uavs) { if (!u.ativo) continue; u.t += dt; const n = sim.navios[u.dono]; const dx = u.cx - u.x, dz = u.cz - u.z, d = Math.hypot(dx, dz);
    let tx, tz; if (d > UAV.raio + 40 && u.fase === 0) { tx = dx / d; tz = dz / d; } else { u.fase = 1; u.ang += (UAV.v / UAV.raio) * dt; const ox = u.cx + Math.cos(u.ang) * UAV.raio, oz = u.cz + Math.sin(u.ang) * UAV.raio; const L = Math.hypot(ox - u.x, oz - u.z) || 1; tx = (ox - u.x) / L; tz = (oz - u.z) / L; }
    const k = Math.min(1, dt * 1.5); u.vx += (tx * UAV.v - u.vx) * k; u.vz += (tz * UAV.v - u.vz) * k; u.vy += ((UAV.alt - u.y) * 0.5 - u.vy) * k; u.x += u.vx * dt; u.y += u.vy * dt; u.z += u.vz * dt;
    { const ht = alturaTerreno(sim.T, u.x, u.z); if (u.y < ht + 18) { u.y = ht + 22; u.vy = Math.max(u.vy, 8); } if (u.y + 1 < ht) { derrubaAereo(sim, 'u', u, null); continue; } } /* v1.2.29 drone × terreno */
    if (u.t > UAV.dur || !n || n.morto) { u.ativo = 0; if (n) { n.uav = -1; n.tUav = UAV.recarga; } sim.evento({ t: 'uavFim', idx: u.idx }); } }
  for (const n of sim.navios) { if (n.tUav > 0 && n.uav < 0) n.tUav -= dt; else if (n.papel === 'jogador' && !n.morto && n.uav < 0 && n.tUav <= 0 && sim.t > 10 && (sim.tick + n.id) % 30 === 0) lancaUav(sim, n); } /* v1.2.25 item 4: drone do jogador AUTOMÁTICO — decola sozinho (10 s após o início e a cada recarga), orbita o alvo travado/contato mais próximo e plota no radar */
}
/** Sensor aéreo (helicóptero em voo ou VANT) do time vê o navio e? Elevado: enxerga atrás das ilhas. */
export function sensorAereo(sim, time, e) { const hE = e.C.F + 10; const fa = fatorAereo(e.C); /* v1.2.14: assinatura por classe */
  for (const u of sim.uavs) if (u.ativo && u.time === time && Math.hypot(e.x - u.x, e.z - u.z) < UAV.sensor * fa && !bloqueado(sim.T, u.x, u.z, u.y, e.x, e.z, hE)) { sim._aereoDono = u.dono; return 'uav'; }
  for (const h of sim.helis) if (h.ativo && h.time === time && h.estado >= EST.DECOLA && h.estado <= EST.RETORNO && Math.hypot(e.x - h.x, e.z - h.z) < h.H.sensor * fa && !bloqueado(sim.T, h.x, h.z, h.y, e.x, e.z, hE)) { sim._aereoDono = h.dono; return 'heli'; }
  return null; }

// ---------------------------------------------------------------------------------------------------------------------------------
// v1.2.26 item C — SEQUÊNCIA REALISTA DE CONVÉS: nenhuma aeronave surge do nada. Porta-aviões: sobe pelo elevador (visível), taxia pela
// linha central até a catapulta livre e decola UMA A UMA por catapulta; VTOL/helicópteros decolam na vertical do próprio elevador (juntos,
// cada um no seu). Pouso: um avião por vez na final; a 1,1 km o convés tem de estar livre, senão arremete; os demais circulam em espera.
// Navios com hangar: reboque do hangar ao convoo e de volta. Recursos (token de táxi/pouso, catapultas, elevadores, convoo) reservados e
// validados a cada passo (abatido/afundado libera).
// ---------------------------------------------------------------------------------------------------------------------------------
const VAZIO = []; const ehHeli = (h) => !h.H.aviao;
export const catEM = (n) => n.C.catEM ?? n.C.L >= 320; /* catapulta eletromagnética nos super porta-aviões; vapor no de escolta */
function dkN(n) { const pc = planoConves(n); if (!n.dk || n.dk.pc !== pc) n.dk = { pc, tok: -1, tx: -1, cats: pc.cats.map(() => -1), fila: pc.cats.map(() => -1), el: pc.el.map(() => -1), pad: -1 }; return n.dk; }
function aFrente(n, h) { if (!n.helis || !POOL_REF.s) return 0; let k = 0; for (const i of n.helis) { const q = POOL_REF.s.helis[i]; if (q && q !== h && q.estado === EST.VOO && q.H.aviao && q.H.id !== 'jato' && q.comb < h.comb) k++; } return k; } /* v1.2.26: quem vai pousar antes (menos combustível) também entra na conta */
function filaPista(n) { if (!n.helis || !POOL_REF.s) return 0; let k = 0; for (const i of n.helis) { const q = POOL_REF.s.helis[i]; if (q && q.estado === EST.RETORNO && q.H.aviao && q.H.id !== 'jato') k++; } return k; }
const POOL_REF = { s: null };
function maisUrgente(sim, n, h) { for (const i of n.helis) { const q = sim.helis[i]; if (q !== h && q.estado === EST.RETORNO && !q.ap && (q.esp || q.apM || q.tEspera > 0) && pista(n, q) && q.comb < h.comb - 10 && Math.hypot(q.x - n.x, q.z - n.z) < 6000) return true; } return false; } /* v1.2.26: fila de pouso por COMBUSTÍVEL (menor primeiro) */
function distFinal(n, q, zTD) { return paraLocal(n, q).z - zTD; } /* v1.2.26: distância (m) do avião na final ao ponto de toque — o próximo entra na perna quando o anterior está a < 700 m (intervalo real de recolhimento) */
function outroNaFinal(sim, n, h, lim = 1500) { const zTD = n.C.L * 0.38; for (const i of n.helis) { const q = sim.helis[i]; if (q !== h && q.estado === EST.RETORNO && q.ap && distFinal(n, q, zTD) > (h.estado === EST.RETORNO ? lim : -1)) return true; if (q !== h && q.estado === EST.POUSO && q.H.aviao && q.H.id !== 'jato' && q.sRel > 0) return true; } return false; }
function elevLivre(n) { const dk = n.dk; for (let e = 0; e < dk.el.length; e++) if (dk.el[e] < 0) return e; return -1; }
function convesLivre(sim, n, h) { const dk = dkN(n); if (dk.tok >= 0 && dk.tok !== h.idx) return false; if (dk.pc.catNaPista && dk.cats.some((k) => k >= 0)) return false; return true; } /* v1.2.26: elevador ocupado não impede o pouso — o avião espera no fim da corrida (convés reservado) até o elevador liberar */
/** v1.2.26: a faixa até a catapulta K está livre? — ninguém taxiando que precise cruzar o caminho lateral deste (do elevador até a faixa K.x) na mesma altura do convés. */
/** v1.2.26: ponto de espera atrás do defletor da catapulta K, longe dos elevadores (≥ 20 m) e fora da área de pouso; null = sem espaço (não faz fila). */
function holdPt(pc, K) { if (pc._hp && pc._hp.has(K)) return pc._hp.get(K); const M = pc._hp || (pc._hp = new Map()); let r = null; for (const dz of [30, 42, 54, 66]) { const z = K.z + dz; if (z > pc.zRoll - 30) break; if (pc.el.some((e) => Math.hypot(e.x - K.x, e.z - z) < 20)) continue; if (pc.cats.some((c) => c !== K && Math.hypot(c.x - K.x, c.z - z) < 20)) continue; r = { x: K.x, z }; break; } M.set(K, r); return r; }
function laneLivre(sim, n, h, K, q) { const x0 = Math.min(q.x, K.x) - 9, x1 = Math.max(q.x, K.x) + 9; for (const k of n.helis) { const o = sim.helis[k]; if (o === h || !o.dk || o.estado !== EST.CONVOO || o.dk.f !== 'taxi') continue; const p = o.dk; if (p.x > x0 && p.x < x1 && Math.abs(p.z - q.z) < 30) return false; const L = p.p && p.p.length ? p.p[p.p.length - 1] : null; if (L && Math.abs(L[0] - K.x) > 0.5 && Math.min(p.x, L[0]) < x1 && Math.max(p.x, L[0]) > x0 && Math.abs(p.z - q.z) < 60) return false; } return true; }
function taxiando(sim, n) { const dk = n.dk; if (!dk || dk.tok < 0) return false; for (const k of n.helis) { const q = sim.helis[k]; if (q.idx === dk.tok) return q.dkC < 0 && (q.estado === EST.CONVOO || q.estado === EST.REARMA || q.estado === EST.POUSO); /* quem taxia para catapulta não conta */ } return false; }
function soltaTok(n, h) { if (n.dk && n.dk.tok === h.idx) n.dk.tok = -1; if (n.dk && n.dk.tx === h.idx) n.dk.tx = -1; }
function soltaPonto(n, h) { const dk = n.dk; if (!dk) return; if (h.dkE >= 0 && dk.el[h.dkE] === h.idx) dk.el[h.dkE] = -1; h.dkE = -1; if (dk.pad === h.idx) dk.pad = -1; }
/** Posição/velocidade a partir do estado local de convés h.dk (x, y acima do convés, z, rumo local r, velocidade local vx/vz). */
function poe(sim, n, h) { const q = h.dk, c = Math.cos(n.rumo), s = Math.sin(n.rumo); sim.mundo(n, q.x, n.P.convoo.y + 0.6 + (q.y || 0), q.z, _o); h.x = _o.x; h.y = _o.y; h.z = _o.z; h.rumo = ang(n.rumo + (q.r || 0)); h.roll = 0;
  const vs = n.v, vx = q.vx || 0, vz = q.vz || 0; h.vx = Math.sin(n.rumo) * vs + vx * c - vz * s; h.vz = -Math.cos(n.rumo) * vs + vx * s + vz * c; h.vy = q.vy || 0; h.v = n.v; }
/** Anda no caminho q.p (gira no lugar quando precisa mudar de direção). true = chegou. */
function anda(q, dt) { q.vx = 0; q.vz = 0; q.vy = 0; if (!q.p.length) return true; const [tx, tz] = q.p[0], dx = tx - q.x, dz = tz - q.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { q.p.shift(); return !q.p.length; } const rA = Math.atan2(dx, -dz), e = ang(rA - q.r); if (Math.abs(e) > 0.12) { q.r = ang(q.r + clamp(e, -DK.giro * dt, DK.giro * dt)); return false; }
  const st = Math.min(d, DK.taxi * dt); q.x += dx / d * st; q.z += dz / d * st; q.vx = dx / d * DK.taxi; q.vz = dz / d * DK.taxi; if (d - st < 0.05) { q.x = tx; q.z = tz; q.p.shift(); } return !q.p.length; }
function escondido(sim, n, h) { const pc = dkN(n).pc; h.oculto = 1; if (h.dk && h.dk.f === 'h') { poe(sim, n, h); return; } const E = pc.pa ? pc.el[0] : pc.hang; h.dk = { f: 'h', x: E.x, z: E.z, y: pc.pa ? -8 : 0, r: 0, p: VAZIO, vx: 0, vz: 0 }; poe(sim, n, h); }
function iniConves(sim, n, h, k) { const dk = dkN(n), pc = dk.pc; POOL_REF.s = sim; if (k !== 0) { escondido(sim, n, h); return; } h.oculto = 0;
  if (pc.pa) { dk.el[0] = h.idx; h.dkE = 0; h.dk = { f: pista(n, h) ? 'elev' : 'pronto', x: pc.el[0].x, z: pc.el[0].z, y: 0, r: 0, p: [], vx: 0, vz: 0 }; }
  else { dk.pad = h.idx; h.dk = { f: 'pronto', x: pc.pad.x, z: pc.pad.z, y: 0, r: 0, p: [], vx: 0, vz: 0 }; } poe(sim, n, h); }
function sobeConves(sim, n, h) { const dk = dkN(n), pc = dk.pc; if (pc.pa) { const e = elevLivre(n); if (e < 0) return; dk.el[e] = h.idx; h.dkE = e; h.dk = { f: 'sobe', x: pc.el[e].x, z: pc.el[e].z, y: -6.5, r: 0, p: [], vx: 0, vz: 0 }; }
  else { if (dk.pad >= 0) return; dk.pad = h.idx; h.dk = { f: 'reb', x: pc.hang.x, z: pc.hang.z, y: 0, r: 0, p: [], vx: 0, vz: 0, t: 0 }; }
  h.estado = EST.CONVOO; h.tEst = 0; h.oculto = 0; h.lancar = h.lancar || 0; poe(sim, n, h); }
function quer(sim, n, h) { return !n.morto && cabeLado(sim, n) && ((n.papel === 'jogador' ? noAr(sim, n) : noArCap(sim, n)) < maxArNavio(n)) /* v1.2.29 item 13: teto bot conta CONVOO */ && (h.lancar || h.auto && h.ctrl === 'ia' && h.tEst > (pista(n, h) ? 5 : n.esq ? 2.5 : 6) && (n.papel !== 'jogador' || h.auto === 1) && sim.t > 12); }
function passoConves(sim, n, h, dt) { dt *= n.libVel || 1; /* v1.2.32 */ const dk = dkN(n), pc = dk.pc, q = h.dk; q.vx = q.vz = q.vy = 0;
  if (q.f === 'sobe') { q.y = Math.min(0, q.y + 6.5 / DK.sobe * dt); q.vy = 6.5 / DK.sobe; if (q.y >= 0) { q.f = pista(n, h) ? 'elev' : 'pronto'; h.tEst = 0; if (q.f === 'pronto' && ehHeli(h)) sim.evento({ t: 'aeroSom', s: 'rotorParte', id: n.id, idx: h.idx }); } }
  else if (q.f === 'reb') { q.t = (q.t || 0) + dt; const u = Math.min(1, q.t / DK.reboque), w = u * u * (3 - 2 * u); q.z = pc.hang.z + (pc.pad.z - pc.hang.z) * w; q.x = pc.hang.x + (pc.pad.x - pc.hang.x) * w; q.vz = (pc.pad.z - pc.hang.z) * 6 * u * (1 - u) / DK.reboque; if (u >= 1) { q.f = 'pronto'; h.tEst = 0; if (ehHeli(h)) sim.evento({ t: 'aeroSom', s: 'rotorParte', id: n.id, idx: h.idx }); } }
  else if (q.f === 'elev' && h.tEst > 20 && dk.tok < 0 && recolhendo(sim, n)) { h.estado = EST.REARMA; h.tEst = 1e4; h.ativo = 0; q.f = 'desce'; q.t = 0; } /* v1.2.26: libera o elevador para o recolhimento (volta ao hangar abastecido) */
  else if (q.f === 'elev' && !n.C.gigaPA) { if (quer(sim, n, h) && dk.tok < 0 && !outroNaFinal(sim, n, h) && !(pc.catNaPista && filaPista(n) > 0 && !h.lancar && algumEspera(sim, n))) { let k = -1; for (let i = 0; i < dk.cats.length; i++) if (dk.cats[i] < 0) { k = i; break; }
      if (k >= 0) { const K = pc.cats[k]; dk.cats[k] = h.idx; h.dkC = k; dk.tok = h.idx; soltaPonto(n, h); q.f = 'taxi'; q.p = caminhoCat(q.x, q.z, K, pc.xL); } } } /* v1.2.26: porta-aviões até 343 m mantêm o táxi serializado da 1.2.25 (convés estreito: faixas paralelas colidiriam) */
  else if (q.f === 'elev') { /* gigantes (gigaPA): faixas por catapulta + fila de espera */ const cruza = q.z > pc.zRoll - 30 || pc.catNaPista; /* v1.2.26: só o táxi que CRUZA a área de pouso/corrida disputa o convés com quem pousa; os demais usam a faixa de táxi da proa (um por vez) */
    if (quer(sim, n, h) && (cruza ? dk.tok < 0 && !outroNaFinal(sim, n, h) : (dk.tok < 0 || dk.tok === h.idx || !taxiando(sim, n))) /* v1.2.26: avião na final tem prioridade sobre o táxi que cruza a pista */ && !(pc.catNaPista && filaPista(n) > 0 && !h.lancar && algumEspera(sim, n))) { let k = -1, kd = 1e9; let fi = 0; for (let i = 0; i < dk.cats.length; i++) { const Ki = pc.cats[i], longe = Math.abs(q.z - Ki.z) + Math.abs(q.x - Ki.x) > 90, hp = holdPt(pc, Ki), fl = !!hp && (dk.cats[i] >= 0 || longe) && dk.fila[i] < 0 && q.z > hp.z + 10; if (dk.cats[i] < 0 && longe && !fl) continue; /* v1.2.26: catapulta ocupada → o próximo taxia até o ponto de ESPERA atrás do defletor (fila de 1 por catapulta) */ if ((dk.cats[i] < 0 && (dk.fila[i] < 0 || fl) || fl) && laneLivre(sim, n, h, pc.cats[i], q)) { const dd = Math.abs(pc.cats[i].x - q.x) + (fl ? 60 : 0); if (dd < kd) { kd = dd; k = i; fi = fl ? 1 : 0; } } } /* v1.2.26: cada catapulta tem a sua faixa de táxi; escolhe a do MESMO bordo do elevador (não cruza a outra faixa) */
      if (k >= 0) { const K = pc.cats[k]; if (fi) { const hp = holdPt(pc, K); dk.fila[k] = h.idx; q.hold = 1; q.p = caminho(q.x, q.z, K.x, hp.z, K.x); } else { dk.cats[k] = h.idx; q.p = caminhoCat(q.x, q.z, K, K.x); } h.dkC = k; if (cruza) dk.tok = h.idx; soltaPonto(n, h); q.f = 'taxi'; } } }
  else if (q.f === 'hold') { if (dk.cats[h.dkC] < 0) { const K = pc.cats[h.dkC]; dk.cats[h.dkC] = h.idx; dk.fila[h.dkC] = -1; q.hold = 0; q.p = [[K.x, K.z]]; q.f = 'taxi'; } } /* v1.2.26: avança do ponto de espera para a catapulta assim que ela libera */
  else if (q.f === 'taxi') { if (anda(q, dt)) { soltaTok(n, h); if (q.hold) { q.f = 'hold'; return; } q.f = 'cat'; h.tEst = 0; sim.evento({ t: 'aeroSom', s: 'potencia', id: n.id, idx: h.idx }); } }
  else if (q.f === 'cat') { const e = ang(0 - q.r); q.r = ang(q.r + clamp(e, -DK.giro * dt, DK.giro * dt)); if (h.tEst > DK.prepCat && Math.abs(e) < 0.02) { q.r = 0; h.estado = EST.DECOLA; h.tEst = 0; h.lancar = 0; sim.evento({ t: 'heliDecola', id: n.id, idx: h.idx }); } }
  else if (q.f === 'pronto') { if (quer(sim, n, h)) { h.estado = EST.DECOLA; h.tEst = 0; h.lancar = 0; sim.evento({ t: 'heliDecola', id: n.id, idx: h.idx }); if (h.H.aviao) sim.evento({ t: 'aeroSom', s: 'potencia', id: n.id, idx: h.idx }); } }
  poe(sim, n, h); }
function recolhendo(sim, n) { for (const i of n.helis) { const q = sim.helis[i]; if (q.estado === EST.RETORNO && (q.esp || q.ap || q.apM)) return true; } return false; }
function algumEspera(sim, n) { for (const i of n.helis) { const q = sim.helis[i]; if (q.estado === EST.RETORNO && q.H.aviao && q.H.id !== 'jato' && (q.esp || q.apM || q.ap)) return true; } return false; }
function recolhe(sim, n, h, dt) { const dk = dkN(n), pc = dk.pc, q = h.dk; if (!q || q.f === 'h' || h.oculto) { escondido(sim, n, h); return; } q.vx = q.vz = q.vy = 0;
  if (q.f === 'desce') { q.y = (q.y || 0) - 6.5 / DK.desce * dt; q.vy = -6.5 / DK.desce; if (q.y <= -6.5) { soltaPonto(n, h); escondido(sim, n, h); return; } }
  else if (q.f === 'rec') { q.t = (q.t || 0) + dt; const u = Math.min(1, q.t / DK.reboque), w = u * u * (3 - 2 * u); q.z = pc.pad.z + (pc.hang.z - pc.pad.z) * w; q.x = pc.pad.x + (pc.hang.x - pc.pad.x) * w; if (u >= 1) { soltaPonto(n, h); escondido(sim, n, h); return; } }
  else { soltaPonto(n, h); escondido(sim, n, h); return; } h.oculto = 0; poe(sim, n, h); }
/** Ponto de pouso vertical (helicóptero/VTOL): elevador (porta-aviões) ou convoo; reserva a 2,5 km. null = ocupado → espera. */
function pontoPouso(sim, n, h) { const dk = dkN(n), pc = dk.pc, d = Math.hypot(n.x - h.x, n.z - h.z);
  if (pc.pa) { if (h.dkE >= 0 && dk.el[h.dkE] === h.idx) return { x: pc.el[h.dkE].x, z: pc.el[h.dkE].z, meu: 1 }; if (d > 900) return { x: pc.el[0].x, z: pc.el[0].z, meu: 0 }; /* v1.2.26: reserva o elevador só na aproximação final (não segura o convés por minutos) */ const e = elevLivre(n); if (e < 0) return null; dk.el[e] = h.idx; h.dkE = e; return { x: pc.el[e].x, z: pc.el[e].z, meu: 1 }; }
  if (dk.pad === h.idx) return { x: pc.pad.x, z: pc.pad.z, meu: 1 }; if (d > 2500) return { x: pc.pad.x, z: pc.pad.z, meu: 0 }; if (dk.pad >= 0) return null; dk.pad = h.idx; return { x: pc.pad.x, z: pc.pad.z, meu: 1 }; }
/** Circuito de espera: órbita (horária) de raio R ao redor de (cx,cz), altitude escalonada por aeronave (sem conflito no ar). */
function espera(sim, n, h, cx, cz, R, alt0, dt) { const a = marcacao(cx, cz, h.x, h.z) + Math.min(0.6, 60 / R * 4); const tx = cx + Math.sin(a) * R, tz = cz - Math.cos(a) * R;
  voa(h, marcacao(h.x, h.z, tx, tz), h.H.aviao ? Math.max(70, h.H.vmax * 0.5) : Math.max(25, h.H.vmax * 0.6), alt0 + (h.H.aviao ? 90 : 18) * (h.slot % 7), dt, sim); h.esp = 1; h.tEspera = (h.tEspera || 0) + dt; }
function validaDk(sim, n) { const dk = n.dk, H = sim.helis, ok = (i, f) => { const q = H[i]; return q && q.usado && q.dono === n.id && f(q); };
  if (dk.tok >= 0 && !ok(dk.tok, (q) => q.estado === EST.RETORNO && q.ap || q.estado === EST.POUSO || q.estado === EST.CONVOO && q.dk && q.dk.f === 'taxi')) dk.tok = -1;
  for (let k = 0; k < dk.cats.length; k++) if (dk.cats[k] >= 0 && !ok(dk.cats[k], (q) => q.dkC === k && (q.estado === EST.CONVOO || q.estado === EST.DECOLA))) dk.cats[k] = -1;
  for (let e = 0; e < dk.el.length; e++) if (dk.el[e] >= 0 && !ok(dk.el[e], (q) => q.dkE === e && (q.estado >= EST.CONVOO && q.estado <= EST.POUSO || q.estado === EST.REARMA && !q.oculto))) dk.el[e] = -1;
  if (dk.pad >= 0 && !ok(dk.pad, (q) => q.estado >= EST.CONVOO && q.estado <= EST.POUSO || q.estado === EST.REARMA && !q.oculto)) dk.pad = -1; }
function paraLocal(n, h) { const c = Math.cos(n.rumo), s = Math.sin(n.rumo), dx = h.x - n.x, dz = h.z - n.z; return { x: dx * c + dz * s, z: -dx * s + dz * c }; }
/** Táxi até a catapulta K pela linha central xT; vindo de ré, entra de lado 12 m atrás do ponto de engate (folga das catapultas vizinhas e dos elevadores). */
function caminhoCat(x0, z0, K, xT) { if (z0 < K.z) return caminho(x0, z0, K.x, K.z, Math.abs(K.x - xT) < 0.5 ? xT : K.x); const p = caminho(x0, z0, xT, K.z + 12, xT); if (Math.abs(K.x - xT) > 0.5) p.push([K.x, K.z + 12]); p.push([K.x, K.z]); return p; }
