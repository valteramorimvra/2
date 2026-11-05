// diagnóstico: qual programa WebGL é compilado DEPOIS do pré-aquecimento no cenário do perf1214
import { abre } from './cdp.mjs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto';
const b = await abre(URL, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa: 'arquipelago', modo: 'frota', classe: 'cruzador', seed: 11, hora: 'dia', tempo: 'limpo', portaAvioes: true, mercantes: true }); __nns.tutorial=false; __nns.hud.dica(null); __nns.eu.controleIA = 1; return 1 })()`, 180000);
await esp(6000);
const lista = `JSON.stringify(__nns.R.info.programs.map(p=>p.name+'|'+p.cacheKey.slice(0,160)))`;
const a = JSON.parse(await ev(lista)); const t0 = Date.now(); const novos = [];
for (let k = 0; k < 16; k++) { await esp(5000); const q = JSON.parse(await ev(lista)); for (const x of q) if (!a.includes(x) && !novos.find(n => n.p === x)) novos.push({ s: Math.round((Date.now() - t0) / 1000), p: x, ev: await ev(`JSON.stringify(__nns.S.sim.eventos.map(e=>e.t).slice(-20))`) }); }
console.log('inicio', a.length, 'novos', JSON.stringify(novos, null, 1), 'erros', b.erros); b.fecha(); process.exit(0);
