// Valter 10:14 BRT — HUD = velocidade REAL do casco; encalhado + motor máx → < 0,5 nó; ré sai e HUD sobe.
import { criaSessao } from '../src/sim/session.js';
import { alturaTerreno } from '../src/sim/maps.js';
import { NOS } from '../src/sim/util.js';

const S = criaSessao({ mapa: 'estreito', modo: 'frota', classe: 'chapada', seed: 42, portaAvioes: true });
const s = S.sim; s.ameacas.ligadas = 0; s.revelaTudo = 1;
const n = s.navios.find((x) => x.papel === 'jogador') || s.navios[0];
n.controleIA = 0;

// achar terra seca alta
let bx = 0, bz = 0, bh = -1e9;
for (let k = 0; k < 96; k++) {
  const a = (k / 96) * Math.PI * 2, r = 800 + (k % 5) * 400;
  const x = Math.sin(a) * r, z = -Math.cos(a) * r;
  const h = alturaTerreno(s.T, x, z);
  if (h > bh) { bh = h; bx = x; bz = z; }
}
if (bh < 3) {
  // fallback: scan grid
  for (let i = -40; i <= 40; i++) for (let j = -40; j <= 40; j++) {
    const x = i * 120, z = j * 120, h = alturaTerreno(s.T, x, z);
    if (h > bh) { bh = h; bx = x; bz = z; }
  }
}
console.log(JSON.stringify({ pico: +bh.toFixed(1), bx: +bx.toFixed(0), bz: +bz.toFixed(0) }));

// coloca o navio colado na costa, proa para a terra, motor toda força
const rumo = Math.atan2(bx - 0, -(bz - 0));
// ponto na água perto da costa (procura do pico para fora)
let px = bx, pz = bz;
for (let d = 50; d < 900; d += 25) {
  const x = bx - Math.sin(rumo) * d, z = bz + Math.cos(rumo) * d;
  if (alturaTerreno(s.T, x, z) < -n.C.T) { px = x; pz = z; break; }
}
n.x = px; n.z = pz;
n.rumo = Math.atan2(bx - n.x, -(bz - n.z));
n.v = 8; n.tel = 4; n.telAlvo = 4; n.lemeCmd = 0; n.rumoAlvo = null; n.vHud = 8;

// empurra até encostar (~8 s)
for (let i = 0; i < 8 * 60; i++) s.passo();
const knPush = Math.abs((n.vHud != null ? n.vHud : n.v) * NOS);
console.log(JSON.stringify({ fase: 'empurra', knHud: +knPush.toFixed(2), v: +n.v.toFixed(2), vHud: +(n.vHud||0).toFixed(3), encalhe: !!n.encalhe, encalheDuro: !!n.encalheDuro, x: +n.x.toFixed(1), z: +n.z.toFixed(1) }));

// motor no máximo contra a terra por 5 s
n.telAlvo = 4; n.tel = 4; n.lemeCmd = 0;
const x0 = n.x, z0 = n.z;
let maxKn = 0, sumKn = 0, samples = 0;
for (let i = 0; i < 5 * 60; i++) {
  s.passo();
  const kn = Math.abs((n.vHud != null ? n.vHud : n.v) * NOS);
  maxKn = Math.max(maxKn, kn); sumKn += kn; samples++;
}
const drift = Math.hypot(n.x - x0, n.z - z0);
const knStuck = sumKn / samples;
const okStuck = knStuck < 0.5 && maxKn < 0.8 && drift < 8;
console.log(JSON.stringify({ fase: 'travado_avante', knMed: +knStuck.toFixed(3), knMax: +maxKn.toFixed(3), drift: +drift.toFixed(2), nV: +n.v.toFixed(3), ok: okStuck }));

// ré — deve afastar e HUD subir de forma coerente
n.telAlvo = 0; n.tel = 0;
const x1 = n.x, z1 = n.z;
const serie = [];
for (let i = 0; i < 12 * 60; i++) {
  s.passo();
  if (i % 30 === 0) {
    const kn = (n.vHud != null ? n.vHud : n.v) * NOS;
    serie.push({ t: +(i / 60).toFixed(1), kn: +kn.toFixed(2), d: +Math.hypot(n.x - x1, n.z - z1).toFixed(1) });
  }
}
const afastou = Math.hypot(n.x - x1, n.z - z1);
const knRe = (n.vHud != null ? n.vHud : n.v) * NOS;
const okRe = afastou > 15 && Math.abs(knRe) > 0.8;
console.log(JSON.stringify({ fase: 're', afastou: +afastou.toFixed(1), knHud: +knRe.toFixed(2), serie, ok: okRe }));

const pass = okStuck && okRe;
console.log(JSON.stringify({ PASS: pass, okStuck, okRe }));
if (!pass) process.exit(1);
