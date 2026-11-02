// Naval B v1.3.05 — CÂMERA do Acauã e do Uiraçu = câmera do Urubu-rei (modernNavalCombat3D.nkCam), copiada e adaptada.
// O nkCam do Urubu-rei NÃO foi alterado. Mesmo comportamento: SEM ZOOM; órbita livre 360° pelo toque; em pilotagem, depois de 2,2 s
// sem tocar, volta devagar para trás do avião (yaw = rumo, pitch = 0,15 − 0,8·γ); distância 49 m e +4 m; câmera PRESA ao avião com
// só o deslocamento suavizado (sem tremer); nunca dentro da fuselagem (14 m), do mar (8 m), do convés/hangar do navio; tela não rola;
// FOV 55°; tremor só da onda nuclear (se ligado). Adaptado: pose interpolada do caça (px→x) e centro do modelo do caça.
import * as THREE from 'three';
import { clamp, ang } from '../sim/util.js';

const DIST = 49, ALT = 4, CENTRO = 1.6; /* centro geométrico do modelo do caça acima da origem (m) */
export function camVtolAmorim(j, h, dt) { const cam = j.cam; if (!h || !cam) return false;
  j.distCamF = 1; j.distCamS = 1; /* SEM ZOOM */
  if (h.ctrl === 'jog' && j.tToque > 2.2) { const kf = Math.min(1, dt * 0.8); j.yawAlvo += ang(h.rumo - j.yawAlvo) * kf; j.pitchAlvo += (clamp(0.15 - (h.pitch || 0) * 0.8, -0.35, 0.7) - j.pitchAlvo) * kf; }
  const ks = Math.min(1, dt * 12); j.yaw += ang(j.yawAlvo - j.yaw) * ks; j.pitch += (j.pitchAlvo - j.pitch) * ks;
  const ch = Math.cos(j.pitch), dirX = Math.sin(j.yaw) * ch, dirY = -Math.sin(j.pitch), dirZ = -Math.cos(j.yaw) * ch;
  const S = j.S, a = Math.min(1, Math.max(0, (S && S.acc != null ? S.acc : 0) * 60)); const px = h.px != null ? h.px : h.x, py = h.py != null ? h.py : h.y, pz = h.pz != null ? h.pz : h.z;
  const ax = px + (h.x - px) * a, ay = py + (h.y - py) * a + CENTRO, az = pz + (h.z - pz) * a;
  let tx = ax - dirX * DIST, ty = ay - dirY * DIST + ALT, tz = az - dirZ * DIST; ty = Math.max(ty, 8);
  { const sm = S && S.sim; let mY = 8; if (sm) for (let k = 0; k < sm.navios.length; k++) { const nn = sm.navios[k]; if (nn.morto || !(nn.C.porta || nn.C.base || nn.C.aerodromo || nn.id === h.dono)) continue; const dx = tx - nn.x, dz = tz - nn.z, c = Math.cos(nn.rumo), sn = Math.sin(nn.rumo), lx = dx * c + dz * sn, lz = -dx * sn + dz * c; if (Math.abs(lx) < nn.C.B * 0.5 + 14 && Math.abs(lz) < nn.C.L * 0.5 + 16) mY = Math.max(mY, (nn.P.deckV ? nn.P.deckV.y : nn.C.F) + (nn.arfagem || 0) + 18); }
    j._vtMinY = j._vtMinY == null ? mY : j._vtMinY + (mY - j._vtMinY) * Math.min(1, dt * 2.5); if (ty < j._vtMinY) ty = j._vtMinY; }
  { const dx = tx - ax, dy = ty - ay, dz = tz - az, d = Math.hypot(dx, dy, dz) || 1; if (d < 14) { const s = 14 / d; tx = ax + dx * s; ty = Math.max(8, ay + dy * s); tz = az + dz * s; } }
  const tS = S && S.sim ? S.sim.t : 0, novo = !j._vtCP || j._vtH !== h || !(tS - (j._vtT || -9) < 0.5); j._vtT = tS; /* voltou a esta câmera: parte da posição atual (como o nkEntra) */
  if (novo) { j._vtH = h; j._vtCP = j._vtCP || new THREE.Vector3(); j._vtOf = j._vtOf || new THREE.Vector3(); j._vtCP.copy(cam.position); j._vtOf.set(cam.position.x - ax, cam.position.y - ay, cam.position.z - az); }
  const c = j._vtCP, of = j._vtOf, k = 1 - Math.exp(-dt * (j.mem.trans > 0 ? 3.0 : 8)); of.x += (tx - ax - of.x) * k; of.y += (ty - ay - of.y) * k; of.z += (tz - az - of.z) * k; c.x = ax + of.x; c.y = Math.max(8, ay + of.y); c.z = az + of.z;
  if (!Number.isFinite(c.x + c.y + c.z)) { c.set(ax, ay + 20, az + 40); if (!Number.isFinite(c.x + c.y + c.z)) return false; }
  const aj = j.save && j.save.ajustes; if (aj && aj.tremorAtingido !== false && (j.mem.shakeNuke || 0) > 0) { j.mem.shakeNuke = Math.max(0, j.mem.shakeNuke - dt * 1.15); const sh = Math.min(j.mem.shakeNuke, 0.55); c.x += (Math.random() - 0.5) * sh * 1.4; c.y += (Math.random() - 0.5) * sh * 0.9; }
  cam.position.copy(c); cam.lookAt(ax, ay, az); cam.fov += (55 - cam.fov) * Math.min(1, dt * 5); cam.updateProjectionMatrix(); j.camPos.copy(c); return true; }
