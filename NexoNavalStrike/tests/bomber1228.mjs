/** v1.2.28 — multi-bomba, thr, miraSolo, paiol/recarga. */
import { Sim } from '../src/sim/world.js';
import { criaArena } from '../src/sim/maps.js';
import { NUK } from '../src/sim/nuclear.js';
import fs from 'node:fs';

const falhas = [];
const A = criaArena('atois');
const s = new Sim({ arena: A, seed: 1228 });
s.revelaTudo = 1; if (s.ameacas) s.ameacas.ligadas = 0;
const X = 6000, Z = 1000;
const pa = s.adicionaNavio('azul', 'chapada', X, Z + 6000, 0, 'jogador');
const alvo = s.adicionaNavio('vermelho', 'volkhar', X, Z, 0, 'bot');
for (const n of s.navios) { n.telAlvo = 0; n.v = 0; if (n !== pa) { n.papel = 'alvo'; n.sam = 0; n.ciws = []; } }
s.t = NUK.liberaApos;
s.aplica({ id: pa.id, t: 'nuclear', alvo: alvo.id });
const q = s.nukes && s.nukes.find((x) => x.ativo);
if (!q) falhas.push('não decolou');
else {
  if ((q.cargas | 0) < 2) falhas.push('cargas surtida < 2: ' + q.cargas);
  for (let i = 0; i < 90 * 60 && q.fase < 2; i++) s.passo();
  if (q.fase !== 2) falhas.push('não entrou em voo fase2: ' + q.fase);
  // MANUAL para thr ter efeito
  s.aplica({ id: pa.id, t: 'nkPiloto', v: 1 });
  for (let i = 0; i < 10; i++) s.passo();
  if (!q.manual) falhas.push('manual não ligou');
  s.aplica({ id: pa.id, t: 'nkThr', v: 4 });
  for (let i = 0; i < 20 * 60; i++) s.passo();
  if ((q.thr | 0) !== 4) falhas.push('thr≠4: ' + q.thr);
  if (q.v < 250) falhas.push('thr4 não acelerou: v=' + q.v.toFixed(1));
  s.aplica({ id: pa.id, t: 'nkThr', v: 0 });
  for (let i = 0; i < 25 * 60; i++) s.passo();
  if ((q.thr | 0) !== 0) falhas.push('thr≠0: ' + q.thr);
  if (q.v < (NUK.thrMin || 165) - 0.5) falhas.push('estol v=' + q.v);
  if (q.v > (NUK.thrMin || 165) + 8) falhas.push('thr0 não desacelerou perto do mín: v=' + q.v);
  const px = q.x + 500, pz = q.z;
  s.aplica({ id: pa.id, t: 'nkMiraSolo', px, pz });
  if (!q.miraSolo || Math.abs(q.ax - px) > 1) falhas.push('miraSolo falhou ax=' + q.ax);
  // sobe e solta 2×
  q.y = Math.max(q.y, 1200); q.vy = 0;
  const c0 = q.cargas | 0;
  s.aplica({ id: pa.id, t: 'nkSolta' });
  for (let i = 0; i < 5; i++) s.passo();
  const c1 = q.cargas | 0;
  if (c1 !== c0 - 1) falhas.push(`solta1 ${c0}→${c1}`);
  if (c1 > 0 && q.fase === 3) falhas.push('regressou cedo com cargas');
  // espera bomba cair
  for (let i = 0; i < 900 && q.b && q.b.ativo; i++) s.passo();
  if (q.b) q.b.ativo = 0; /* garante slot livre p/ 2ª */
  if (c1 > 0 && q.fase === 2) {
    q.y = Math.max(q.y, 1200); q.vy = 0;
    s.aplica({ id: pa.id, t: 'nkSolta' });
    for (let i = 0; i < 5; i++) s.passo();
    if ((q.cargas | 0) !== c1 - 1) falhas.push(`solta2 ${c1}→${q.cargas}`);
  }
}
const out = {
  falhas, thrNiveis: NUK.thrNiveis, bombasSurtida: NUK.bombasSurtida,
  paiolAposDecola: pa.nk && pa.nk.bombas, cargas: q && q.cargas, thr: q && q.thr, v: q && +q.v.toFixed(1), miraSolo: q && q.miraSolo, nkCam: 58,
};
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/bomber.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
process.exit(falhas.length ? 1 : 0);
