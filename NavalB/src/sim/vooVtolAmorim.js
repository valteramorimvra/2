// Naval B v1.3.05 — FÍSICA DE VOO PILOTADO do Acauã e do Uiraçu (Destróier Amorim), pedido do Valter:
// "a física de voo, a câmera e o controle são os do Urubu-rei do Lençóis Maranhenses — o mesmo sistema, adaptado".
// É uma CÓPIA do voaManual do Urubu-rei (sim/nuclear.js), lendo os MESMOS ganhos (NUK: manBank, manTaxaRol, manPitch, manTaxaPitch,
// manFatorCurva, manCurvaMax, manAltMin, manAltMax) — o Urubu-rei NÃO foi alterado em nada; só é lido.
// Adaptações (as mesmas que o próprio nuclear.js já faz para as outras aeronaves que voam no sistema do Urubu-rei — ramo `Hq`):
//   · acelerador de 5 posições na faixa DA PRÓPRIA aeronave (vmax × 0,42 · 0,56 · 0,70 · 0,85 · 1; mínimo 0,36 × vmax);
//   · piso/teto contados a partir do mar/terreno sob o caça (o Urubu-rei usa o nível do mar); sem "salto" de altitude ao assumir
//     logo após a decolagem vertical (o piso só empurra para cima pela mesma curva de recuperação do Urubu-rei);
//   · VTOL: saindo do pairado, acelera até a velocidade mínima pela mesma taxa do Urubu-rei (sem pulo de velocidade) e a curva de
//     recuperação de altitude só entra quando já tem velocidade de voo;
//   · sinal do roll do render das aeronaves de navio (o render do Urubu-rei usa o sinal oposto);
//   · limite do mapa e colisão com relevo pelo mesmo caminho das aeronaves de navio (aereo.js → bateuRelevo).
// Entradas iguais às do Urubu-rei: manche jx/jy (já com a mesma zona morta e curva no HUD) e acelerador thr 0–4. Zero alocação.
import { clamp, ang, G } from './util.js';
import { NUK } from './nuclear.js';
import { alturaTerreno } from './maps.js';
import { alturaMar } from './ocean.js';

const THR_ASA = [0.42, 0.56, 0.7, 0.85, 1]; /* nuclear.js THR_ASA (mesmos números) */

/** Um passo de voo manual do Acauã/Uiraçu = voaManual do Urubu-rei adaptado. */
export function voaVtolAmorim(h, dt, sim) { const P = NUK, H = h.H, vmax = H.vmax, vMin = vmax * 0.36;
  if (h._ultJog !== sim.tick - 1) { /* assumiu agora: igual ao nkPiloto do Urubu-rei — continua da atitude e velocidade atuais, sem tranco */
    h.bank = clamp(h.roll || 0, -P.manBank, P.manBank); h.gam = Math.atan2(h.vy || 0, Math.max(1, Math.hypot(h.vx || 0, h.vz || 0))); h.sx = h.bank / P.manBank; h.sy = 0; h.w = 0;
    h.v = Math.min(vmax, Math.hypot(h.vx || 0, h.vy || 0, h.vz || 0)); /* VTOL: pode assumir ainda em transição (abaixo do mínimo) */ if (h.thr == null) h.thr = 2; }
  h._ultJog = sim.tick;
  /* manche suavizado — idêntico ao Urubu-rei */
  h.sx = (h.sx || 0) + ((h.jx || 0) - (h.sx || 0)) * Math.min(1, 2.6 * dt); h.sy = (h.sy || 0) + ((h.jy || 0) - (h.sy || 0)) * Math.min(1, 3 * dt);
  h.bank += clamp((h.sx * P.manBank - h.bank) * 2.6 * dt, -P.manTaxaRol * dt, P.manTaxaRol * dt); let gA = h.sy * P.manPitch;
  const chao = Math.max(alturaMar(h.x, h.z, sim.t), alturaTerreno(sim.T, h.x, h.z));
  if (h.v >= vMin && h.y < chao + P.manAltMin + 160) gA = Math.max(gA, (chao + P.manAltMin + 160 - h.y) / 300); /* VTOL: a recuperação de altitude do Urubu-rei vale com velocidade de voo; saindo do pairado o nariz fica no manche (o piso de 6 m segura) */ if (h.y > P.manAltMax - 200) gA = Math.min(gA, -(h.y - P.manAltMax + 200) / 800);
  h.gam += clamp((gA - h.gam) * 4 * dt, -P.manTaxaPitch * dt, P.manTaxaPitch * dt); const v = Math.max(1, h.v);
  h.w = (h.w || 0) + (clamp(G * Math.tan(h.bank) / v * P.manFatorCurva, -P.manCurvaMax, P.manCurvaMax) - (h.w || 0)) * Math.min(1, 3 * dt); h.rumo = ang(h.rumo + h.w * dt); h.roll = h.bank; /* render das aeronaves de navio: +bank */
  { const iT = Math.max(0, Math.min(4, h.thr | 0)), thr = vmax * THR_ASA[iT]; h.v = clamp(h.v - G * Math.sin(h.gam) * 0.6 * dt + clamp(thr - h.v, -6 * dt, 7 * dt), Math.min(vMin, h.v), vmax); /* acima do mínimo, exatamente o Urubu-rei; saindo do pairado (VTOL) acelera até ele pela mesma taxa de 7 m/s² */ h._estolAviso = h.v <= vMin + 2 && iT === 0 ? 1 : 0; } h.pitch = h.gam;
  h.vy = h.v * Math.sin(h.gam); const vh = h.v * Math.cos(h.gam); h.vx = Math.sin(h.rumo) * vh; h.vz = -Math.cos(h.rumo) * vh; h.x += h.vx * dt; h.y = Math.max(chao + 6, h.y + h.vy * dt); h.z += h.vz * dt;
  const lim = sim.T.tam * 0.47; if (Math.abs(h.x) > lim || Math.abs(h.z) > lim) { h.x = clamp(h.x, -lim, lim); h.z = clamp(h.z, -lim, lim); } }
