import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4176/?auto';
const b = await abre(URL, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa: 'arquipelago', modo: 'frota', classe: 'cruzador', seed: 11, hora: 'dia', tempo: 'limpo', portaAvioes: true, mercantes: true }); __nns.tutorial=false; return 1; })()`);
await esp(6000); await b.send('Profiler.enable'); await b.send('Profiler.setSamplingInterval', { interval: 200 }); await b.send('Profiler.start'); await esp(20000);
const _r = await b.send('Profiler.stop'); const profile = (_r.result || _r).profile; const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n])); const dt = profile.timeDeltas; const cnt = new Map();
profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dt[i] || 0)));
for (const [id, t] of cnt) { const n = byId.get(id); const k = n.callFrame.functionName + ' ' + n.callFrame.url.split('/').pop() + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + t); }
const tot = [...self.values()].reduce((a, b) => a + b, 0); const top = [...self].filter(([k]) => !/^\(idle|^\(program/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 40);
console.log(top.map(([k, t]) => (t / 1000).toFixed(0).padStart(6) + ' ms ' + k).join('\n')); b.fecha(); process.exit(0);
