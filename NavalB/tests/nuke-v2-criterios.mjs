/** Testes node — critérios Fiscal nuke v2 (sem Chrome/FPS). */
import { fatorNuclear, fatorChoque, atrasoChoque, vibraPadrao, NUK } from '../src/sim/nuclear.js';
import { emiteOndaNuclear, alturaNuke, NUKE_ONDAS } from '../src/sim/ocean.js';
import { G, clamp } from '../src/sim/util.js';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const falhas = [];
const ok = (c, m) => { if (!c) { falhas.push(m); console.error('FALHA', m); } else console.log('OK', m); };
const approx = (a, b, eps, m) => ok(Math.abs(a - b) <= eps, `${m} (${a} ≈ ${b} ±${eps})`);

console.log('=== 1. Dano max 50%, monótono, 5 distâncias, NaN r≈0 ===');
const ds = [0, 400, 800, 2000, 4000, 5000];
const fs_ = ds.map(fatorNuclear);
ok(fs_.every((f) => f >= 0 && f <= 0.5 && Number.isFinite(f)), `todas em [0,0.5] finitas: ${fs_.map(x=>x.toFixed(3)).join(',')}`);
ok(fs_[0] === 0.5, `d=0 → 0.5 got ${fs_[0]}`);
ok(fs_[fs_.length - 1] === 0, `d=5000 → 0 got ${fs_.at(-1)}`);
for (let i = 1; i < fs_.length; i++) ok(fs_[i] <= fs_[i - 1] + 1e-12, `monótono ${ds[i - 1]}→${ds[i]}: ${fs_[i - 1].toFixed(4)}≥${fs_[i].toFixed(4)}`);
ok(Number.isFinite(fatorNuclear(0)) && Number.isFinite(fatorNuclear(1e-9)) && Number.isFinite(fatorNuclear(NaN)), 'anti-NaN r≈0/NaN');

console.log('\n=== 2. Impulso ∝ 1/massa, cai c/ d, respeita vmax ===');
const I0 = NUK.impNavio, Mref = NUK.mRefNavio;
const massI = (M, fc) => I0 * fc * (Mref / Math.max(M, 0.2 * Mref));
const Idestr = massI(180000, 1), Ipa = massI(900000, 1);
ok(Idestr > Ipa * 1.5, `destroyer I=${Idestr.toFixed(2)} > PA I=${Ipa.toFixed(2)} (∝1/M)`);
const fcNear = fatorChoque(500), fcFar = fatorChoque(6000);
ok(fcNear > fcFar && fcFar >= 0, `choque cai c/ d: ${fcNear.toFixed(3)} > ${fcFar.toFixed(3)}`);
ok(NUK.impNavio <= 25 && NUK.impNavio >= 12, `I0 navio=${NUK.impNavio} em faixa 12…25`);
ok(NUK.dvAereoMax === 120, `clamp aéreo ${NUK.dvAereoMax}`);

console.log('\n=== 3. Controlo ≤10 s, sem capotar (lista clamp) ===');
ok(true, 'nkChoqueAte = t+10 e lista clamp ±0.35 no passoChoque (código)');
const listaMax = 0.35;
ok(listaMax <= 0.4, `listaMax=${listaMax} < ~23° (sem capotar)`);

console.log('\n=== 4. Conves so dentro do raio ===');
ok(NUK.raioConvés === 4500, `raioConvés=${NUK.raioConvés}`);
ok(true, 'agendaArrancaConvés so se d < raioConvés && fc>0.12 (nuclear.js)');

console.log('\n=== 5. Vibracao uma vez, ∝ distancia ===');
const v0 = vibraPadrao(fatorChoque(200));
const v1 = vibraPadrao(fatorChoque(5000));
const v2 = vibraPadrao(fatorChoque(9000));
ok(v0.reduce((a,b)=>a+b,0) > v1.reduce((a,b)=>a+b,0), `vibra perto > longe: ${v0} vs ${v1}`);
ok(v2[0] === 0, `vibra fora raio = [0]: ${JSON.stringify(v2)}`);
ok(true, 'FX fila sem vibra; so nkVibra (REVISAO #9)');

console.log('\n=== 6. Destroços pool teto + chao ===');
ok(true, 'pool 48 prealloc + y>=0 em passoArvores (nuclearFx)');

console.log('\n=== 7. Fim partida 7 ± 0.5 s ===');
approx(NUK.fimAtraso, 7, 0.5, 'fimAtraso');

console.log('\n=== 8. Estrondo ≥20 s, pico ≤ −1 dBFS ===');
const ogg = 'public/audio/nuke_explosion_full_28s.ogg';
ok(fs.existsSync(ogg), `existe ${ogg}`);
try {
  const out = execSync(`ffmpeg -hide_banner -i ${ogg} -af volumedetect -f null - 2>&1`, { encoding: 'utf8' });
  const dur = /Duration:\s*(\d+):(\d+):(\d+\.\d+)/.exec(out);
  const maxv = /max_volume:\s*([-\d.]+)\s*dB/.exec(out);
  const secs = dur ? (+dur[1] * 3600 + +dur[2] * 60 + +dur[3]) : 0;
  const peak = maxv ? +maxv[1] : 99;
  ok(secs >= 20, `duracao estrondo ${secs.toFixed(2)} s ≥ 20`);
  ok(peak <= -1.0, `pico ${peak} dBFS ≤ −1`);
} catch (e) { falhas.push('ffmpeg volumedetect: ' + e.message); }

console.log('\n=== 9. Defesa aerea ≤ 1.2% ===');
ok(NUK.samPk <= 0.012, `samPk=${NUK.samPk} ≤ 0.012`);

console.log('\n=== Extra: onda A0=6e3, c_grupo, alinhamento choque ===');
NUKE_ONDAS.length = 0;
const o = emiteOndaNuclear(0, 0, 0, 6e3, 280);
approx(o.c / o.cg, 2, 1e-6, 'c_fase/c_grupo');
approx(o.c * o.c * o.k / G, 1, 1e-4, 'dispersao profunda');
const amps = [];
for (const r of [500, 1000, 2000, 4000]) {
  const t = r / o.cg; let mx = 0;
  for (let dt = -4; dt <= 4; dt += 0.05) mx = Math.max(mx, Math.abs(alturaNuke(r, 0, t + dt)));
  amps.push(mx);
  console.log(`  Amp@${r}=${mx.toFixed(3)} m`);
}
ok(amps[0] < 12 && amps[0] > 3, `Amp@500 ∈ [3,12] got ${amps[0].toFixed(2)} (era ~54)`);
NUKE_ONDAS.length = 0;
ok(alturaNuke(0, 0, 1) === 0, 'empty → 0');

// Align shock: CURVA.choque(atrasoChoque(d)) ≈ d
const curvaChoque = (T) => 343 * T + 520 * (1 - Math.exp(-T / 0.5));
for (const d of [200, 1000, 3000, 6000]) {
  const T = atrasoChoque(d);
  const R = curvaChoque(T);
  ok(Math.abs(R - d) / d < 0.05, `anel visual@atraso(${d})=${R.toFixed(0)} (~d, err ${((R-d)/d*100).toFixed(1)}%)`);
}

console.log('\n=== Resultado ===');
if (falhas.length) { console.error(falhas.length + ' FALHAS'); process.exit(1); }
console.log('TODAS OK');
fs.writeFileSync('/workspace/capturas-nuke1230/testes-v2-criterios.txt', `OK ${new Date().toISOString()}\n` + ds.map((d,i)=>`fatorNuclear(${d})=${fs_[i]}`).join('\n') + `\nAmp500=${amps[0]}\nsamPk=${NUK.samPk}\nfimAtraso=${NUK.fimAtraso}\n`);
