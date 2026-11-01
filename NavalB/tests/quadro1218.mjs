// v1.2.18: TEMPO DE QUADRO e PICOS — 1.2.17 (APK anterior, servido em :4177) × 1.2.18 (dist final em :4173), MESMA partida (8×8, arquipélago, seed fixa),
// MESMA qualidade gráfica (Alta, fixa — sem rebaixar), mesma janela 915×412. Fases: cruzeiro (60 s) e combate (60 s, inimigos revelados e fogo automático).
// Chrome headless com SwiftShader (GPU por software): valores absolutos são de CPU e servem só para COMPARAR as versões.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const VERS = [['1.2.17', 'http://127.0.0.1:4177/index.html?auto'], ['1.2.18', 'http://127.0.0.1:4173/?auto']]; const R = {};
const est = (a) => { const s = [...a].sort((x, y) => x - y), p = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))]; const m = a.reduce((x, y) => x + y, 0) / a.length; return { n: a.length, media: +m.toFixed(2), p50: +p(0.5).toFixed(2), p95: +p(0.95).toFixed(2), p99: +p(0.99).toFixed(2), max: +s[s.length - 1].toFixed(1), q33: a.filter((x) => x > 33.4).length, q50: a.filter((x) => x > 50).length, q100: a.filter((x) => x > 100).length }; };
for (const rodada of [1, 2]) for (const [v, url] of (rodada === 1 ? VERS : [...VERS].reverse())) {
  const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; await b.vai(url);
  for (let i = 0; i < 200; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(()=>{ const s=__nnsUI.save; s.d.ajustes.qualidade='alta'; s.salva(); __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'arquipelago', seed: 11, hora:'dia', tempo:'limpo' }); return 1 })()`);
  for (let i = 0; i < 240; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
  await ev(`(()=>{ __nns.tutorial=false; window.__dq=[]; let t0=performance.now(); const f=(t)=>{ window.__dq.push(t-t0); t0=t; if(window.__dq.length<200000) requestAnimationFrame(f) }; requestAnimationFrame(f); return 1 })()`); await esp(3000);
  const fase = async (nome, ms) => { await ev(`(window.__dq.length=0,1)`); await esp(ms); const d = JSON.parse(await ev(`JSON.stringify(window.__dq.slice(2))`)); const prog = await ev(`(__nns.R && __nns.R.info && __nns.R.info.programs) ? __nns.R.info.programs.length : -1`); return { ...est(d), programas: prog, nivel: await ev(`__nns.Q ? __nns.Q.nivel : -1`) }; };
  const k = `${v}#${rodada}`; R[k] = {}; R[k].cruzeiro = await fase('cruzeiro', 60000);
  await ev(`(()=>{ const sim=__nns.S.sim, eu=__nns.eu; sim.revelaTudo=1; __nns.S.comando({t:'auto', v:1}); __nns.S.comando({t:'telegrafo', v:4}); const e=sim.navios.filter(n=>n.time!==eu.time&&!n.C.mercante); let k=0; for (const n of e) { n.x = eu.x + 2500*Math.cos(k*0.5) ; n.z = eu.z - 3000 - 400*k; k++; } return 1 })()`);
  R[k].combate = await fase('combate', 60000); R[k].erros = b.erros.slice(0, 3); console.log(k, JSON.stringify(R[k])); b.fecha(); await esp(1500); }
const med = (v, f, c) => +(((R[v + '#1'][f][c]) + (R[v + '#2'][f][c])) / 2).toFixed(2);
const T = {}; for (const f of ['cruzeiro', 'combate']) for (const c of ['media', 'p50', 'p95', 'p99', 'max', 'q50', 'q100']) T[`${f}.${c}`] = { '1.2.17': med('1.2.17', f, c), '1.2.18': med('1.2.18', f, c) };
console.log(JSON.stringify(T, null, 1)); fs.writeFileSync('/workspace/nexo-naval-strike/tests/quadro1218-resultado.json', JSON.stringify({ R, T }, null, 1)); process.exit(0);
