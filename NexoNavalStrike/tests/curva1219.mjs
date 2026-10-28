// v1.2.19 itens 3, 4, 6, 7 no FLUXO REAL do celular (menu BATALHA → cfgPartida → zarpar, mercantes ligados + porta-aviões):
// 8 cascos por lado; todos os inimigos de guerra já em contato no início; foto do rastro com leme todo a boreste (deve curvar);
// 0 programas WebGL novos durante a guinada.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1219/curva'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
R.cfg = await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'frota', mapa:'arquipelago', portaAvioes:'sim', hora:'auto', tempo:'auto' }); window.__cfg=c; U.zarpar(c); return JSON.stringify({ mercantes:c.mercantes, pa:c.portaAvioes, modo:c.modo }) })()`);
for (let i = 0; i < 200; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 30)`)) break; await esp(500); }
R.inicio = JSON.parse(await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const c={azul:0,vermelho:0}, g={azul:0,vermelho:0}; for(const n of s.navios){ c[n.time]++; if(!n.C.mercante) g[n.time]++; } const ini = eu.time==='azul'?'vermelho':'azul'; let vis=0; for(const n of s.navios) if(n.time===ini && !n.C.mercante && s.contatos[eu.time].has(n.id)) vis++; let dm=1e9; for(const n of s.navios) if(n.time===ini) dm=Math.min(dm, Math.hypot(n.x-eu.x,n.z-eu.z)); return JSON.stringify({ tick:s.tick, t:+(s.tick/60).toFixed(2), cascos:c, guerra:g, inimigosEmContato:vis, inimigosGuerra:g[ini], dMinKm:+(dm/1000).toFixed(2) }) })()`));
if (R.inicio.cascos.azul !== 8 || R.inicio.cascos.vermelho !== 8) falhas.push('não é 8×8: ' + JSON.stringify(R.inicio.cascos));
if (R.inicio.inimigosEmContato < R.inicio.inimigosGuerra) falhas.push(`só ${R.inicio.inimigosEmContato}/${R.inicio.inimigosGuerra} inimigos visíveis no início`);
await b.foto(DIR + '/a-inicio.png');
R.prog0 = await ev(`__nns.R.info.programs.length`);
await ev(`(()=>{ const J=__nns; J.S.comando({ t:'telegrafo', v:4 }); J.eu.controleIA=0; return 1 })()`);
await esp(14000); await ev(`(()=>{ __nns.S.comando({ t:'leme', v:1 }); return 1 })()`);
R.guinada = []; for (let k = 0; k < 10; k++) { await esp(3000); R.guinada.push(JSON.parse(await ev(`(()=>{ const n=__nns.eu; return JSON.stringify({ v:+(n.v||0).toFixed(1), w:+(n.w||0).toFixed(4), kE:+(n._kE||0).toFixed(4), t:+(__nns.S.sim.tick/60).toFixed(1) }) })()`))); if (k === 4) await b.foto(DIR + '/b-guinada-rastro.png'); }
await b.foto(DIR + '/c-guinada-rastro2.png');
R.prog1 = await ev(`__nns.R.info.programs.length`); if (R.prog1 !== R.prog0) falhas.push(`programas novos na guinada: ${R.prog0}→${R.prog1}`);
const g = R.guinada.filter((q) => Math.abs(q.w) > 0.004); if (!g.length) falhas.push('o navio não guinou'); else if (!g.some((q) => Math.abs(q.kE) > 0.0008)) falhas.push('curvatura do rastro (uCurv) não acompanhou a guinada');
R.erros = b.erros; if (b.erros && b.erros.length) falhas.push('erros JS: ' + b.erros.slice(0, 3).join(' | '));
console.log(JSON.stringify(R, null, 1)); console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); b.fecha(); process.exit(falhas.length ? 1 : 0);
