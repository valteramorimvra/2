/** v1.2.28 — diagnóstico: mira/torre vs câmera orbitada (causa do canhão pro lado errado). */
import { criaSessao } from '../src/sim/session.js';
import { ang, marcacao } from '../src/sim/util.js';
import fs from 'node:fs';

// Simula a matemática da mira SEM WebGL: mesma fórmula de atualizaCamera
function miraDeCam(eu, camPos, yaw, pitch, lookAtShip) {
  // dir from yaw/pitch (mesmo que modernNavalCombat3D)
  const ch = Math.cos(pitch), dir = { x: Math.sin(yaw) * ch, y: -Math.sin(pitch), z: -Math.cos(yaw) * ch };
  let ray;
  if (lookAtShip) {
    // lookAt ship center → world dir from cam to ship
    const dx = eu.x - camPos.x, dy = (eu.arfagem || 0) + eu.C.F * 0.55 - camPos.y, dz = eu.z - camPos.z;
    const L = Math.hypot(dx, dy, dz) || 1;
    ray = { x: dx / L, y: dy / L, z: dz / L };
  } else {
    ray = dir;
  }
  let dMira = eu.C.canhao.alc, ax, az;
  if (ray.y < -0.0005) {
    const k = -camPos.y / ray.y;
    ax = camPos.x + ray.x * k; az = camPos.z + ray.z * k;
    dMira = Math.hypot(ax - eu.x, az - eu.z);
  } else {
    ax = eu.x + ray.x * 1e4; az = eu.z + ray.z * 1e4;
  }
  const marc = marcacao(eu.x, eu.z, ax, az);
  return { marc, dMira, ax, az, rayY: ray.y };
}

const S = criaSessao({ mapa: 'arquipelago', modo: 'duelo', classe: 'corsario', classeRival: 'volkhar', seed: 1228 });
const eu = S.jogador, ini = S.sim.navios.find((n) => n.time !== eu.time);
ini.x = eu.x + 2500; ini.z = eu.z - 800; // alvo ~à direita/frente
const azAlvo = marcacao(eu.x, eu.z, ini.x, ini.z);
const L = eu.C.L, F = eu.C.F;
const out = { azAlvo, casos: [], falhas: [] };

const modos = [
  { nome: 'perto', d: L * 0.62 + 18, a0: L * 0.1 + 4, lookAtShip: false, miraOn: true },
  { nome: 'longe', d: L * 2.2 + 120, a0: L * 0.3 + 18, lookAtShip: false, miraOn: true },
  { nome: 'popa', d: L * 1.0, a0: L * 0.10, lookAtShip: true, miraOn: false },
  { nome: 'tresq', d: L * 1.70, a0: L * 0.42, lookAtShip: true, miraOn: false },
  { nome: 'popaAlta', d: L * 1.15, a0: L * 0.85, lookAtShip: true, miraOn: false },
  { nome: 'costado', d: L * 1.22, a0: L * 0.12, lookAtShip: true, miraOn: false },
];
const yaws = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map((o) => eu.rumo + o);
const pitches = [0.12, 0.55, -0.4];

for (const m of modos) {
  for (const yaw of yaws) {
    for (const pitch of pitches) {
      const el = Math.max(0.02, pitch);
      const hCam = Math.max(m.a0, m.d * Math.sin(el) + L * 0.06);
      const distH = m.d * Math.cos(Math.min(1.2, el));
      const hx = Math.sin(yaw), hz = -Math.cos(yaw);
      const camPos = { x: eu.x - hx * distH, y: (eu.arfagem || 0) + hCam, z: eu.z - hz * distH };
      // perto/longe usam dir offset differently — approx same orbit math for diag
      const r = miraDeCam(eu, camPos, yaw, pitch, m.lookAtShip);
      const errAlvo = Math.abs(ang(r.marc - azAlvo));
      const errYaw = Math.abs(ang(r.marc - yaw));
      // "lado errado": mira aponta >90° longe do yaw da câmera (oposto ao olhar)
      const ladoErrado = errYaw > Math.PI / 2;
      const caso = { modo: m.nome, miraOn: m.miraOn, yawOff: +ang(yaw - eu.rumo).toFixed(2), pitch, marc: +r.marc.toFixed(3), errYawDeg: +(errYaw * 57.3).toFixed(1), errAlvoDeg: +(errAlvo * 57.3).toFixed(1), dMira: +r.dMira.toFixed(0), ladoErrado, rayY: +r.rayY.toFixed(3) };
      out.casos.push(caso);
      if (ladoErrado) out.falhas.push(`${m.nome} yaw=${caso.yawOff} pitch=${pitch}: marc ${caso.errYawDeg}° do yaw (LADO ERRADO); miraOn=${m.miraOn}`);
    }
  }
}

// Confirma bloqueio de comando mira nas cams novas (código atual)
out.bloqueioCodigo = 'popa|tresq|popaAlta|costado: comando mira NÃO enviado (linha ~507)';
out.resumo = {
  ladoErradoLookAtShip: out.casos.filter((c) => c.ladoErrado && ['popa', 'tresq', 'popaAlta', 'costado'].includes(c.modo)).length,
  ladoErradoPertoLonge: out.casos.filter((c) => c.ladoErrado && (c.modo === 'perto' || c.modo === 'longe')).length,
  miraDesligadaNovas: out.casos.filter((c) => !c.miraOn).length,
};

fs.mkdirSync('/workspace/nexo-naval-strike/capturas1228', { recursive: true });
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/mira-diag.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.resumo, null, 2));
console.log('lado-errado samples:', out.falhas.slice(0, 12).join('\n'));
console.log('TOTAL ladoErrado', out.falhas.length);
