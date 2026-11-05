// v1.2.78 — nave Carcará: armas na altura do casco, míssil rasante passa por baixo, areia baixa não encalha.
import { Sim } from '../src/sim/world.js';
import { criaArena, alturaTerreno } from '../src/sim/maps.js';
import { alturaVoo } from '../src/sim/classes1275.js';
import { respondeNavioTerreno } from '../src/sim/colisaoTerreno.js';

const A = criaArena('atois');
const P = A.plano.centro;
let falhas = 0;
const assert = (c, m) => { if (!c) { falhas++; console.error('✘', m); } else console.log('✔', m); };

const s = new Sim({ arena: A, seed: 3 });
s.revelaTudo = 1;
const n = s.adicionaNavio('azul', 'caracara', P.x, P.z, 0);
const fr = s.adicionaNavio('vermelho', 'fragata', P.x + 500, P.z, Math.PI);
n.arfagem = 0; fr.arfagem = 0; n.v = 0;
const parado = s.mundo(n, 0, 0, 0, {});
assert(Math.abs(parado.y - 4) < 0.05, `parada nasce a 4 m (y=${parado.y.toFixed(2)})`);
n.v = n.C.vmax;
const voo = alturaVoo(n);
assert(voo > 9.5 && voo <= 10, `a toda força sobe ~10 m (${voo.toFixed(2)})`);
const boca = s.mundo(n, 0, 2, 0, {});
assert(Math.abs(boca.y - (2 + voo)) < 0.05, `VLS/canhão saem do casco no ar (y=${boca.y.toFixed(2)})`);
const of = s.mundo(fr, 0, 3, 0, {});
assert(Math.abs(of.y - 3) < 0.05, `fragata não ganha altura (y=${of.y.toFixed(2)})`);

assert(!s.acertaNavio(n.x, 1, n.z, -1), 'tiro na água não acerta a nave rápida');
assert(!!s.acertaNavio(n.x, voo + 1.2, n.z, -1), 'tiro na altura do casco acerta');
assert(!s.proxSegmento(n, n.x - 40, 4.5, n.z, n.x + 40, 4.5, n.z, 15), 'míssil rasante passa por baixo');
assert(!!s.proxSegmento(n, n.x - 40, voo + 2, n.z, n.x + 40, voo + 2, n.z, 15), 'míssil que sobe acerta o casco');
assert(!!s.proxSegmento(fr, fr.x - 50, 4.5, fr.z, fr.x + 50, 4.5, fr.z, 15), 'fragata continua vulnerável ao rasante');
assert(!s.contatoTorpedo(n.x, n.z, -1), 'torpedo não pega a nave no ar');

function hCasco(C, x, z) {
  const E = [0.5, 0.375, 0.25, 0.125, 0, -0.125, -0.25, -0.375, -0.5], B = [0, 0.5, -0.5]; let m = -1e9;
  for (const ea of E) for (const eb of B) m = Math.max(m, alturaTerreno(A, x + eb * C.B, z - ea * C.L));
  return m;
}
let praia = null;
const tam = A.tam;
for (let z = -tam * 0.4; z < tam * 0.4 && !praia; z += 60) for (let x = -tam * 0.4; x < tam * 0.4 && !praia; x += 60) {
  const hc = hCasco(n.C, x, z), hf = hCasco(fr.C, x, z);
  if (hc > 1.2 && hc < 6 && hf > 1.2) praia = [x, z, hc];
}
if (!praia) console.log('– sem praia baixa nesta arena; pulando encalhe');
else {
  const [x, z, mx] = praia;
  n.x = x; n.z = z; n.v = n.C.vmax; n.rumo = 0; n.telAlvo = 4; n.encalhe = 0;
  const x0 = n.x, z0 = n.z;
  const r = respondeNavioTerreno(s, n, x0, z0, 1 / 60, 0);
  assert(r === 0 && n.encalhe === 0 && n.x === x0, `nave rápida não encalha em praia de ${mx.toFixed(1)} m`);
  fr.x = x; fr.z = z; fr.v = 8; fr.rumo = 0; fr.telAlvo = 4; fr.encalhe = 0;
  const r2 = respondeNavioTerreno(s, fr, x, z, 1 / 60, 0);
  assert(r2 === 1 || fr.encalhe === 1, 'fragata no mesmo ponto encalha');
}

// Guia: o míssil sobe até o casco em vez de estourar na água.
{
  const s2 = new Sim({ arena: A, seed: 9 }); s2.revelaTudo = 1;
  const a = s2.adicionaNavio('azul', 'fragata', P.x, P.z, 0);
  const b = s2.adicionaNavio('vermelho', 'caracara', P.x + 2800, P.z, Math.PI);
  b.sam = 0; b.samAuto = 0; b.chaff = 0; if (b.a30) b.a30.length = 0; b.ciws.forEach((c) => { c.mun = 0; });
  b.telAlvo = 4; a.telAlvo = 1; a.alvoId = b.id; a.trava = 1; a.travaMis = 1;
  s2.sensores();
  a.mira.az = Math.atan2(b.x - a.x, -(b.z - a.z));
  const lancou = s2.lancaMissil(a, b.id, 1);
  assert(lancou === 1, 'lançou um míssil contra a nave');
  const m = s2.misseis.find((q) => q.ativo);
  let hitY = null, vida0 = b.vida;
  for (let i = 0; i < 60 * 45 && m && m.ativo; i++) { b.v = b.C.vmax; s2.passo(); for (const e of s2.eventos) if (e.t === 'impacto' && e.tipo === 'missil' && e.alvo === b.id) hitY = e.y; s2.eventos.length = 0; }
  assert(hitY != null && b.vida < vida0, `míssil atingiu a nave (y=${hitY})`);
  assert(hitY != null && hitY > 7, `explosão no casco, não na água (y=${hitY == null ? '—' : hitY.toFixed(1)})`);
}

if (falhas) { console.error(falhas + ' falha(s)'); process.exit(1); }
console.log('voo1278 ok');
