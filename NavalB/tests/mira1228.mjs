/** v1.2.28 — mira em todas cams: sem lado errado; torre converge. */
import { criaSessao } from '../src/sim/session.js';
import { ang, marcacao } from '../src/sim/util.js';
import { PARAM } from '../src/armasParametros.js';
import fs from 'node:fs';

function miraDeCam(eu, camPos, ray) {
  let dMira = eu.C.canhao.alc, ax, az;
  if (ray.y < -0.0005) {
    const k = -camPos.y / ray.y;
    ax = camPos.x + ray.x * k; az = camPos.z + ray.z * k;
    dMira = Math.hypot(ax - eu.x, az - eu.z);
  } else { ax = eu.x + ray.x * 1e4; az = eu.z + ray.z * 1e4; }
  const lh = Math.hypot(ray.x, ray.z);
  let corrigiu = false;
  if (lh > 1e-6) {
    const hx = ray.x / lh, hz = ray.z / lh;
    const dCN = Math.hypot(camPos.x - eu.x, camPos.z - eu.z);
    const dot = (ax - eu.x) * hx + (az - eu.z) * hz;
    if (dot < 0 || dMira < dCN * 0.55) {
      const dAim = Math.max(800, Math.min(eu.C.canhao.alc, Math.max(dCN + 900, dMira)));
      ax = eu.x + hx * dAim; az = eu.z + hz * dAim; dMira = dAim; corrigiu = true;
    }
  }
  return { marc: marcacao(eu.x, eu.z, ax, az), dMira, ax, az, corrigiu };
}

const S = criaSessao({ mapa: 'arquipelago', modo: 'duelo', classe: 'corsario', classeRival: 'volkhar', seed: 1228 });
const eu = S.jogador;
const L = eu.C.L, PC = PARAM.cam;
const modos = [
  { nome: 'perto', d: (L * PC.distL + PC.dist0), a0: L * PC.altL + PC.alt0, lookAtShip: false, lado: L * PC.lado },
  { nome: 'longe', d: L * 1.45 + 55, a0: L * 0.18 + 10, lookAtShip: false, lado: 0 },
  { nome: 'popa', d: L * 0.65, a0: L * 0.08, lookAtShip: true, lado: 0 },
  { nome: 'tresq', d: L * 0.95, a0: L * 0.26, lookAtShip: true, lado: 0 },
  { nome: 'popaAlta', d: L * 0.72, a0: L * 0.45, lookAtShip: true, lado: 0 },
  { nome: 'costado', d: L * 0.48, a0: L * 0.065, lookAtShip: true, lado: 0 },
];
const yaws = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((o) => eu.rumo + o);
const pitches = [0.12, 0.55, -0.35];
const out = { casos: [], falhas: [], ok: 0, fail: 0, corrigidos: 0 };

for (const m of modos) {
  for (const yaw of yaws) {
    for (const pitch of pitches) {
      const ch = Math.cos(pitch), dir = { x: Math.sin(yaw) * ch, y: -Math.sin(pitch), z: -Math.cos(yaw) * ch };
      let camPos, ray;
      if (m.lookAtShip) {
        const el = Math.max(0.02, pitch);
        const hCam = Math.max(m.a0, m.d * Math.sin(el) + L * 0.06);
        const distH = m.d * Math.cos(Math.min(1.2, el));
        const hx = Math.sin(yaw), hz = -Math.cos(yaw);
        camPos = { x: eu.x - hx * distH, y: hCam, z: eu.z - hz * distH };
        if (pitch < 0) {
          const tx = eu.x + hx * 80, ty = L * 0.05 - pitch * m.d * 1.8, tz = eu.z + hz * 80;
          const Lr = Math.hypot(tx - camPos.x, ty - camPos.y, tz - camPos.z) || 1;
          ray = { x: (tx - camPos.x) / Lr, y: (ty - camPos.y) / Lr, z: (tz - camPos.z) / Lr };
        } else {
          const dx = eu.x - camPos.x, dy = L * 0.05 - camPos.y, dz = eu.z - camPos.z;
          const Lr = Math.hypot(dx, dy, dz) || 1;
          ray = { x: dx / Lr, y: dy / Lr, z: dz / Lr };
        }
      } else {
        camPos = { x: eu.x - dir.x * m.d + Math.cos(yaw) * m.lado, y: m.a0, z: eu.z - dir.z * m.d + Math.sin(yaw) * m.lado };
        ray = dir;
      }
      const r = miraDeCam(eu, camPos, ray);
      if (r.corrigiu) out.corrigidos++;
      S.comando({ t: 'mira', az: r.marc, dist: Math.min(r.dMira, eu.C.canhao.alc) });
      for (let i = 0; i < 120; i++) S.avanca(0.05); // 6 s settle
      const tr = eu.torres[0];
      const azTorre = eu.rumo + tr.az;
      const errYaw = Math.abs(ang(r.marc - yaw));
      const errTorre = Math.abs(ang(azTorre - r.marc));
      const ladoErrado = errYaw > Math.PI / 2;
      // céu (pitch<0): ray sobe — aceita; senão torre deve alinhar <25° (arco/obstrução ok)
      const ok = !ladoErrado && (pitch < 0 || errTorre < 0.44);
      const caso = { modo: m.nome, yawOff: +ang(yaw - eu.rumo).toFixed(2), pitch, errYawDeg: +(errYaw * 57.3).toFixed(1), errTorreDeg: +(errTorre * 57.3).toFixed(1), ladoErrado, corrigiu: r.corrigiu, ok };
      out.casos.push(caso);
      if (ok) out.ok++; else { out.fail++; out.falhas.push(caso); }
    }
  }
}
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/mira-teste.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ok: out.ok, fail: out.fail, corrigidos: out.corrigidos, falhas: out.falhas.slice(0, 12) }, null, 2));
process.exit(out.fail ? 1 : 0);
