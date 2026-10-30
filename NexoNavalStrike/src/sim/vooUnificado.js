// v1.2.68 (Valter) — CONTROLADOR DE VOO ÚNICO para toda aeronave pilotada pelo jogador (caças, drone, helicópteros).
// É o MESMO motor do bombardeiro (nuclear.js · voaManual): manche com suavização exponencial por dt (sx/sy), rolagem e arfagem com
// TAXA limitada, curva coordenada (ω = g·tan φ / v), acelerador de 5 posições (RÉ/MIN · DEVAGAR · MEIA · FORTE · MÁX), teto e piso de
// altitude com recuperação suave e colisão com o relevo. Diferenças só nos números do perfil:
//   • CAÇA/drone: mesmos ganhos do bombardeiro ×1,15–1,4 (mais ágil) e velocidades do próprio avião (acima das do bombardeiro).
//   • HELICÓPTERO: mesma suavização do manche; o eixo vertical do manche comanda o CÍCLICO (avança/recua/paira), o horizontal a
//     guinada/curva coordenada, e o ACELERADOR vira o COLETIVO (desce rápido · desce · mantém · sobe · sobe rápido) — pairado estável.
// Hidroaviões e bombardeiros continuam no voaManual original (já validado). Nada é alocado por quadro: só números no próprio objeto.
import { clamp, ang, G } from './util.js';
import { colideAereoTerreno } from './colisaoTerreno.js';
import { alturaTerreno } from './maps.js';
import { alturaMar } from './ocean.js';
import { PARAM } from '../armasParametros.js';

/** Bombardeiro (referência, nuclear.js NUK) — os perfis abaixo derivam destes ganhos. */
const BASE = { manBank: 1, manTaxaRol: 0.9, manPitch: 0.5, manTaxaPitch: 0.6, manFatorCurva: 6, manCurvaMax: 0.36 };
export const ROTULOS_THR = ['RÉ/MIN', 'DEVAGAR', 'MEIA', 'FORTE', 'MÁX'];
export const ROTULOS_COLETIVO = ['DESCE+', 'DESCE', 'PAIRA', 'SOBE', 'SOBE+'];
const PERFIS = new WeakMap();
/** Perfil de voo da aeronave (cacheado por H). */
export function perfilVoo(H) { let P = PERFIS.get(H); if (P) return P; const v = H.vmax;
  if (H.aviao) P = { asa: 1, manBank: BASE.manBank * 1.15, manTaxaRol: BASE.manTaxaRol * 1.4, manPitch: BASE.manPitch * 1.2, manTaxaPitch: BASE.manTaxaPitch * 1.35, manFatorCurva: BASE.manFatorCurva * 1.25, manCurvaMax: BASE.manCurvaMax * (H.bombardeiro ? 1 : 1.35),
    thrNiveis: [0.42, 0.56, 0.7, 0.85, 1].map((k) => k * v), thrMin: 0.36 * v, thrMax: v, altMin: 35, altMax: 9000, faixaPiso: 70 };
  else { const vc = Math.min(v, PARAM.heli.vCruzKmh / 3.6); /* cruzeiro real do projeto: 160 km/h */ P = { asa: 0, vFrente: vc, vRe: vc * 0.28, acel: 7.5, freio: 20, /* deriva ~2 s ao soltar o cíclico */ guinada: 0.8, manBank: 0.55, coletivo: [-8, -3.5, 0, 3.5, 8], altMin: 6, altMax: 1500 }; }
  PERFIS.set(H, P); return P; }

/** Um passo de voo manual. Entrada: h.jx/h.jy (manche, −1…1) e h.thr (0…4). Atualiza x/y/z, vx/vy/vz, v, rumo, pitch, roll. */
export function voaUnificado(h, dt, sim) { const P = perfilVoo(h.H); if (h.thr == null) h.thr = 2;
  if (h._ultJog !== sim.tick - 1) { h.bank = h.roll || 0; /* v1.2.69: roll das aeronaves de navio = +bank (asa direita baixa na curva à direita) */ h.gam = h.pitch || 0; h.w = 0; h.v = Math.max(P.asa ? P.thrMin : 0, Math.hypot(h.vx || 0, h.vz || 0)); } h._ultJog = sim.tick; /* assumiu agora (da IA, decolagem ou automático): continua da atitude/velocidade atuais, sem tranco */
  h.sx = (h.sx || 0) + ((h.jx || 0) - (h.sx || 0)) * Math.min(1, 2.6 * dt); h.sy = (h.sy || 0) + ((h.jy || 0) - (h.sy || 0)) * Math.min(1, 3 * dt); /* manche suavizado exatamente como no bombardeiro */
  if (P.asa) voaAsa(h, P, dt, sim); else voaRotor(h, P, dt, sim);
  const lim = sim.T.tam * 0.47; if (Math.abs(h.x) > lim || Math.abs(h.z) > lim) { h.x = clamp(h.x, -lim, lim); h.z = clamp(h.z, -lim, lim); } }

/** Asa fixa: transplante do voaManual do bombardeiro (bank/γ com taxa limitada, curva coordenada, acelerador-telégrafo, piso/teto). */
function voaAsa(h, P, dt, sim) {
  h.bank += clamp((h.sx * P.manBank - h.bank) * 2.6 * dt, -P.manTaxaRol * dt, P.manTaxaRol * dt); let gA = h.sy * P.manPitch;
  const chao = Math.max(alturaMar(h.x, h.z, sim.t), alturaTerreno(sim.T, h.x, h.z)); if (h.y < chao + P.altMin + P.faixaPiso) gA = Math.max(gA, (chao + P.altMin + P.faixaPiso - h.y) / 160); if (h.y > P.altMax - 200) gA = Math.min(gA, -(h.y - P.altMax + 200) / 800);
  h.gam += clamp((gA - h.gam) * 4 * dt, -P.manTaxaPitch * dt, P.manTaxaPitch * dt); const v = Math.max(1, h.v);
  h.w = (h.w || 0) + (clamp(G * Math.tan(h.bank) / v * P.manFatorCurva, -P.manCurvaMax, P.manCurvaMax) - (h.w || 0)) * Math.min(1, 3 * dt); h.rumo = ang(h.rumo + h.w * dt); h.roll = h.bank; /* v1.2.69 (Valter: "ao contrário"): o render das aeronaves de navio usa −roll; o do bombardeiro usa +roll → aqui o sinal é o oposto do nuclear.js */
  const thr = P.thrNiveis[Math.max(0, Math.min(4, h.thr | 0))]; h.v = clamp(h.v - G * Math.sin(h.gam) * 0.6 * dt + clamp(thr - h.v, -6 * dt * (1 + P.thrMax / 400), 7 * dt * (1 + P.thrMax / 400)), P.thrMin, P.thrMax); h.pitch = h.gam;
  h.vy = h.v * Math.sin(h.gam); const vh = h.v * Math.cos(h.gam); h.vx = Math.sin(h.rumo) * vh; h.vz = -Math.cos(h.rumo) * vh; h.x += h.vx * dt; h.y = Math.max(chao + 6, h.y + h.vy * dt); h.z += h.vz * dt; }

/** Rotor: mesmo manche suavizado; cíclico (sy) = velocidade à frente/ré com inércia, guinada (sx) com curva coordenada em
 *  velocidade e giro no próprio eixo pairando; coletivo (acelerador) = razão de subida. Atitude: nariz baixo acelerando, alto freando. */
function voaRotor(h, P, dt, sim) { const vAlvo = h.sy >= 0 ? h.sy * P.vFrente : h.sy * P.vRe; const v0 = h.v || 0, dv = clamp(vAlvo - v0, -P.freio * dt, P.acel * dt); h.v = v0 + dv;
  const vEf = Math.max(8, Math.abs(h.v)), wCoord = G * Math.tan(h.sx * P.manBank) / vEf, wPair = h.sx * P.guinada, mix = clamp(Math.abs(h.v) / 25, 0, 1);
  h.w = (h.w || 0) + ((wPair * (1 - mix) + clamp(wCoord, -P.guinada, P.guinada) * mix) - (h.w || 0)) * Math.min(1, 3 * dt); h.rumo = ang(h.rumo + h.w * dt);
  const vy = P.coletivo[Math.max(0, Math.min(4, h.thr | 0))]; h.vy = (h.vy || 0) + clamp(vy - (h.vy || 0), -6 * dt, 6 * dt);
  const chao = Math.max(alturaMar(h.x, h.z, sim.t), alturaTerreno(sim.T, h.x, h.z)); h.x += Math.sin(h.rumo) * h.v * dt; h.z -= Math.cos(h.rumo) * h.v * dt; h.vx = Math.sin(h.rumo) * h.v; h.vz = -Math.cos(h.rumo) * h.v;
  h.y = clamp(h.y + h.vy * dt, chao + P.altMin, P.altMax); if (h.y <= chao + P.altMin + 0.01 && h.vy < 0) h.vy = 0;
  const pAlvo = clamp(-dv / Math.max(dt, 1e-3) / 9, -0.5, 0.25) - h.v / P.vFrente * 0.12; h.pitch = (h.pitch || 0) + (pAlvo - (h.pitch || 0)) * Math.min(1, 3.2 * dt);
  h.roll = (h.roll || 0) + (clamp(h.w * Math.max(4, Math.abs(h.v)) / G, -0.66, 0.66) - (h.roll || 0)) * Math.min(1, 3.2 * dt); } /* v1.2.69: inclina PARA DENTRO da curva */

/** Colisão com o relevo após o passo manual (mesma regra do bombardeiro manual). */
export const bateuRelevo = (h, dt, sim) => colideAereoTerreno(sim, h, dt, { manual: 1, margem: 3 });
