// v1.2.16: amostragem de ALOCAÇÃO (CDP HeapProfiler) durante a batalha — maiores alocadores por função.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const b = await abre(null, { w: 457, h: 206 }); const ev = b.ev, esp = b.espera;
await b.vai((process.env.URL || 'http://127.0.0.1:4173/') + '?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(5000);
const q0 = await ev(`__nns._nq = 0, (function c(){ __nns._nq++; requestAnimationFrame(c) })(), 1`);
await b.send('HeapProfiler.enable'); await b.send('HeapProfiler.startSampling', { samplingInterval: 4096 }); await esp(15000);
const nq = await ev(`__nns._nq`); const r = (await b.send('HeapProfiler.stopSampling')).result.profile;
const por = new Map(); const anda = (n) => { const f = n.callFrame; const k = `${f.functionName || '(anon)'} ${(f.url || '').split('/').pop()}:${f.lineNumber}:${f.columnNumber}`; por.set(k, (por.get(k) || 0) + n.selfSize); n.children.forEach(anda); }; anda(r.head);
const tot = [...por.values()].reduce((a, b) => a + b, 0); const top = [...por].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${(v / 1024 / nq).toFixed(1)} KB/q  ${k}`);
const out = `${process.env.TAG || ''} quadros ${nq} · total ${(tot / 1024 / nq).toFixed(1)} KB/quadro\n` + top.join('\n'); console.log(out); fs.appendFileSync('/workspace/aloc1216.log', out + '\n\n'); b.fecha(); process.exit(0);
