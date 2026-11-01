// v1.2.21 item 15 — movimento do casco pela superfície REAL do mar (21 pontos), inércia/amortecimento por classe, sem senoide fixa.
// Parte A (node, sim): amplitudes por classe em mar calmo (bf 2) e médio (bf 5) antes/depois, espectro (pico = resposta às ondas, muda com o rumo/velocidade),
// mar liso → casco parado, período natural e amortecimento (queda livre de 1 m), e ausência de qualquer termo periódico na atitude (mundoInc).
// BASE=1 roda o "antes" (/tmp/base1220). Saída: /workspace/balanco1221-{novo,base}.json. A parte B (fumaça/câmera, navegador) fica em tests/balanco1221web.mjs.
import { writeFileSync } from 'node:fs';
const B = process.env.BASE ? '/tmp/base1220/' : '../src/', base = !!process.env.BASE;
const { criaSessao } = await import(B + 'sim/session.js'); const OC = await import(B + 'sim/ocean.js');
let ok = 0, falha = 0; const L = [], R = { amp: [], espectro: [], natural: [], liso: [] };
const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
const rms = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
const prep = (k, bf, rumo = 0.7) => { const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed: 3 }); const s = S.sim; OC.defineMar(bf); const n = s.navios[S.match.jogadorId]; for (const q of s.navios) if (q !== n) { q.x = 1e9; q.morto = 1; } n.x = 0; n.z = 0; n.rumo = rumo; n.rumoAlvo = rumo; n.flutIni = 0; return { s, n }; };
const corre = (s, n, seg, vel) => { const H = [], P = [], Rr = [], Pi = []; const o = {}; for (let f = 0; f < 60 * seg; f++) { if (vel != null) { n.v = vel; n.w = 0; } s.passo([]); if (f >= 600) { H.push(n.arfagem); P.push(n.caturro); Rr.push(n.balanco); s.mundoInc(n, 0, 0, n.C.L * 0.5, o); const o2 = s.mundoInc(n, 0, 0, -n.C.L * 0.5, {}); Pi.push(Math.atan2(o2.y - o.y, n.C.L)); } } return { H, P, R: Rr, Pi }; };
const pico = (x, fs = 60) => { const N = x.length, m = x.reduce((a, b) => a + b, 0) / N; let best = 0, fb = 0; for (let f = 0.02; f <= 1.5; f += 0.005) { let re = 0, im = 0; for (let i = 0; i < N; i += 2) { const a = 2 * Math.PI * f * i / fs; re += (x[i] - m) * Math.cos(a); im += (x[i] - m) * Math.sin(a); } const p = re * re + im * im; if (p > best) { best = p; fb = f; } } return fb; };
const CL = ['corsario', 'destroier', 'cruzador', 'marcos'];
// (1) amplitudes por classe e estado do mar (pico-a-pico equivalente = 2√2·RMS)
for (const bf of [2, 5]) for (const k of CL) { const { s, n } = prep(k, bf); const r = corre(s, n, 90, n.C.vmax * 0.7);
  R.amp.push({ bf, k, L: n.C.L, arfagem_m: +(rms(r.H) * 2.83).toFixed(3), caturro_graus: +(rms(r.P) * 2.83 * 57.3).toFixed(2), balanco_graus: +(rms(r.R) * 2.83 * 57.3).toFixed(2) }); }
const A = (bf, k) => R.amp.find((q) => q.bf === bf && q.k === k);
if (!base) { for (let i = 1; i < CL.length; i++) chk(A(5, CL[i]).arfagem_m <= A(5, CL[i - 1]).arfagem_m * 1.05, `bf5: ${CL[i]} (L ${A(5, CL[i]).L} m) sobe/desce ${A(5, CL[i]).arfagem_m} m > ${CL[i - 1]} ${A(5, CL[i - 1]).arfagem_m} m (navio maior deve mexer menos)`);
  for (const k of CL) { chk(A(2, k).arfagem_m < 0.05, `bf2 (mar calmo): ${k} arfagem ${A(2, k).arfagem_m} m ≥ 5 cm`); chk(A(2, k).caturro_graus < 0.15 && A(2, k).balanco_graus < 0.3, `bf2: ${k} caturro/balanço altos`); }
  chk(A(5, 'marcos').arfagem_m < 0.1, `bf5: encouraçado de ${A(5, 'marcos').L} m ainda sobe ${A(5, 'marcos').arfagem_m} m`); chk(A(5, 'corsario').arfagem_m > 0.3, 'bf5: corveta quase não se mexe (mar médio deveria movê-la)'); }
// (2) mar liso (bf 0) com o navio a toda: atitude constante → SEM termo periódico (antes: senoide de 0,85 rad/s no caimento)
for (const k of ['destroier', 'cruzador']) { const { s, n } = prep(k, 0); for (const w of OC.ONDAS) w.A = 0; const r0 = corre(s, n, 60, n.C.vmax), r = { Pi: r0.Pi.slice(-1200), H: r0.H.slice(-1200) } /* últimos 20 s (depois do assentamento do caimento de velocidade) */; const pp = (Math.max(...r.Pi) - Math.min(...r.Pi)) * 57.3; R.liso.push({ k, caimentoPP_graus: +pp.toFixed(4), arfagemPP_m: +(Math.max(...r.H) - Math.min(...r.H)).toFixed(4) });
  if (!base) chk(pp < 0.005 && Math.max(...r.H) - Math.min(...r.H) < 0.002, `${k}: mar liso e o casco ainda oscila (caimento ${pp.toFixed(4)}°)`); }
// (3) espectro: o pico tem de vir das ONDAS (frequência de ENCONTRO, muda com o rumo), não de uma frequência fixa
for (const k of ['corsario', 'destroier']) { const f = []; for (const rumo of [0.7 /* contra o mar */, 0.7 + Math.PI /* a favor */]) { const { s, n } = prep(k, 5, rumo); const r = corre(s, n, 70, n.C.vmax * 0.8); f.push(pico(r.Pi)); }
  R.espectro.push({ k, picoContraMar_Hz: +f[0].toFixed(3), picoAFavor_Hz: +f[1].toFixed(3) }); if (!base) chk(f[0] > f[1] * 1.15, `${k}: pico do caturro igual contra/a favor do mar (${f[0].toFixed(3)} × ${f[1].toFixed(3)} Hz) → periódico artificial`); }
// (4) inércia e amortecimento por classe: queda livre de 1 m em mar liso → período amortecido e decaimento
for (const k of CL) { const { s, n } = prep(k, 0); for (const w of OC.ONDAS) w.A = 0; s.passo([]); n.arfagem = 1; n.arfV = 0; const y = []; for (let f = 0; f < 60 * 30; f++) { n.v = 0; s.passo([]); y.push(n.arfagem); }
  const cz = []; for (let i = 1; i < y.length; i++) if (y[i - 1] > 0 && y[i] <= 0 || y[i - 1] < 0 && y[i] >= 0) cz.push(i / 60); const Td = cz.length >= 3 ? (cz[2] - cz[0]) : null; let mn = 0; for (const q of y) mn = Math.min(mn, q);
  const D = OC.dinamicaCasco ? OC.dinamicaCasco(n.C) : null; const Tesp = D ? D.Th / Math.sqrt(1 - D.zH * D.zH) : null;
  R.natural.push({ k, L: n.C.L, calado: n.C.T, periodoArf_s: Td && +Td.toFixed(2), esperado_s: Tesp && +Tesp.toFixed(2), ultrapassagem: +(-mn).toFixed(3), Tbalanco_s: D && +D.Tr.toFixed(1) });
  if (!base) { chk(Td && Math.abs(Td - Tesp) / Tesp < 0.06, `${k}: período de arfagem ${Td} s × ${Tesp && Tesp.toFixed(2)} s`); chk(-mn > 0.25 && -mn < 0.55, `${k}: ultrapassagem ${(-mn).toFixed(2)} fora de ζ≈0,35`); } }
const T = R.natural.map((q) => q.periodoArf_s); if (!base) chk(T.every((q, i) => i === 0 || q >= T[i - 1] - 0.05), 'período natural deveria crescer com o calado/tamanho');
for (const l of L) console.log(l); console.table(R.amp); console.table(R.liso); console.table(R.espectro); console.table(R.natural);
writeFileSync(`/workspace/balanco1221-${base ? 'base' : 'novo'}.json`, JSON.stringify(R, null, 1)); console.log(`balanco1221${base ? ' (BASE 1.2.20)' : ''}: ${ok} ok, ${falha} falhas`); process.exit(base ? 0 : falha ? 1 : 0);
