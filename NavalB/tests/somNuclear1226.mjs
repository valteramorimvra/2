// v1.2.26 — teste isolado (Node) dos buffers nucleares: duração, pico (sem clipping), NaN, energia < 40 Hz no boom, tempo de geração. Grava WAVs para escuta.
import { geraNuclear, NOMES_NUCLEAR } from '../src/audio/somNuclear.js'; import fs from 'node:fs';
const sr = +(process.env.SR || 48000), dir = process.env.WAV || ''; let fal = 0; const R = {};
function wav(f, L, Rr) { const n = L.length, b = Buffer.alloc(44 + n * 4); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(Math.round(L[i] * 32767), 44 + i * 4); b.writeInt16LE(Math.round(Rr[i] * 32767), 46 + i * 4); } fs.writeFileSync(f, b); }
/** fração da energia abaixo de fc (passa-baixa 1-polo duplo — estimativa) */
function fracGrave(y, fc) { const a = Math.exp(-2 * Math.PI * fc / sr); let s1 = 0, s2 = 0, e = 0, eb = 0; for (let i = 0; i < y.length; i++) { s1 = (1 - a) * y[i] + a * s1; s2 = (1 - a) * s1 + a * s2; e += y[i] * y[i]; eb += s2 * s2; } return eb / e; }
let tot = 0; for (const n of NOMES_NUCLEAR) { const t0 = performance.now(); const [L, Rr] = geraNuclear(n, sr); const ms = performance.now() - t0; tot += ms; let pk = 0, nan = 0; for (let i = 0; i < L.length; i++) { if (!Number.isFinite(L[i]) || !Number.isFinite(Rr[i])) nan++; pk = Math.max(pk, Math.abs(L[i]), Math.abs(Rr[i])); }
  let rms = 0; for (let i = 0; i < L.length; i++) rms += L[i] * L[i]; rms = Math.sqrt(rms / L.length);
  R[n] = { s: +(L.length / sr).toFixed(2), pico: +pk.toFixed(3), picoDbFS: +(20 * Math.log10(pk)).toFixed(2), rmsDbFS: +(20 * Math.log10(rms)).toFixed(1), fracEnergia_lt40Hz: +fracGrave(L, 40).toFixed(3), fracEnergia_lt100Hz: +fracGrave(L, 100).toFixed(3), nan, msGerar: Math.round(ms), MB: +(L.length * 8 / 1e6).toFixed(1) };
  if (pk > 0.9 || nan) { fal++; console.log('✘', n, 'pico/NaN'); } if (dir) wav(`${dir}/${n.replace(':', '_')}.wav`, L, Rr); }
if (R['nk:estrondo'].fracEnergia_lt40Hz < 0.25) { fal++; console.log('✘ boom sem sub-grave'); }
console.log(JSON.stringify({ sr, total_ms: Math.round(tot), sons: R }, null, 1)); process.exit(fal ? 1 : 0);
