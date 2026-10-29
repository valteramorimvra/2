// v1.2.16 itens 24/25 + 21: telêmetro (km) no binóculo só para navios detectados; regulador de zoom 2×–20×; contador do VLS.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1216/binoculo'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'atois', hora:'dia', tempo:'limpo', seed: 5 }); return 1 })()`);
for (let i = 0; i < 240; i++) { if (await ev(`!!(window.__nns && __nns.S && __nns.rodando && __nns.eu)`)) break; await esp(500); }
await ev(`(()=>{ __nns.tutorial=false; return 1 })()`); await esp(3000);
R.vls = JSON.parse(await ev(`(()=>{ const e=document.querySelector('[data-r=n_vls]'), b=document.querySelector('[data-a=vls]'); const r=e.getBoundingClientRect(), q=b.getBoundingClientRect(); return JSON.stringify({ txt:e.textContent, real:__nns.eu.vls, dentro: r.left>=q.left-1&&r.right<=q.right+1&&r.top>=q.top-1&&r.bottom<=q.bottom+1, torp:document.querySelector('[data-r=n_torp]').textContent }) })()`));
if (R.vls.txt !== String(R.vls.real) || !R.vls.dentro) falhas.push('contador VLS ' + JSON.stringify(R.vls));
await ev(`(()=>{ const j=__nns, sim=j.S.sim, eu=j.eu; sim.navios.forEach((n,i)=>{ if(n!==eu&&!n.morto&&n.time===eu.time){ } }); const al=sim.navios.filter(n=>n!==eu&&n.time===eu.time&&!n.morto&&!n.C.mercante)[0]; al.x=eu.x+Math.sin(eu.rumo+0.3)*3200; al.z=eu.z-Math.cos(eu.rumo+0.3)*3200; const ini=sim.navios.find(n=>n.time!==eu.time&&!n.morto&&!n.C.mercante); ini.x=eu.x+Math.sin(eu.rumo-0.25)*5200; ini.z=eu.z-Math.cos(eu.rumo-0.25)*5200; __nns.acao('bino'); j.yawAlvo=j.yaw=eu.rumo; return 1 })()`); await esp(2500);
const conta = `(()=>{ const j=__nns, sim=j.S.sim, eu=j.eu; const L=[...document.querySelectorAll('.bn-dist')].filter(e=>!e.hidden); const det=sim.navios.filter((n,i)=>n!==eu&&!n.morto&&(n.time===eu.time||j.navios[i].visto)).length; const ini=sim.navios.find(n=>n.time!==eu.time&&!n.morto&&!n.C.mercante); const iv=j.navios[ini.id].visto; return JSON.stringify({ rotulos:L.map(e=>e.textContent+(e.classList.contains('al')?'(al)':'')), detectados:det, inimigoVisto:!!iv, zoom:document.querySelector('[data-r=bzV]').textContent, bz:!document.querySelector('[data-r=bzoom]').hidden }) })()`;
R.a = JSON.parse(await ev(conta)); await b.foto(DIR + '/binoculo-telemetro.png');
if (!R.a.bz) falhas.push('regulador oculto no binóculo'); if (!R.a.rotulos.length) falhas.push('sem rótulo de distância'); if (!R.a.inimigoVisto && R.a.rotulos.some(t => !t.includes('(al)'))) falhas.push('mostrou não detectado');
// regulador: arrasta até o topo (20×) e até a base (2×)
R.z = JSON.parse(await ev(`(async()=>{ const t=document.querySelector('[data-r=bzT]'), z=document.querySelector('[data-r=bzoom]'); const q=t.getBoundingClientRect(); const pe=(ty,y)=>z.dispatchEvent(new PointerEvent(ty,{bubbles:true,pointerId:9,clientX:q.left+1,clientY:y})); pe('pointerdown',q.top+q.height/2); pe('pointermove',q.top-20); const top=+(__nns.zoomBino*55/6.5).toFixed(2); await new Promise(r=>setTimeout(r,2500)); const fovTop=__nns.cam.fov; pe('pointermove',q.bottom+20); const base=+(__nns.zoomBino*55/6.5).toFixed(2); pe('pointerup',q.bottom); const tiroAntes=__nns.eu.stats?__nns.eu.stats.tiros:0; return JSON.stringify({ top, base, fovTop:+fovTop.toFixed(2), tiros: tiroAntes }) })()`));
if (Math.abs(R.z.top - 20) > 0.01 || Math.abs(R.z.base - 2) > 0.01) falhas.push('faixa do zoom ' + JSON.stringify(R.z));
await esp(2500); R.b = JSON.parse(await ev(conta)); await b.foto(DIR + '/binoculo-zoom-2x.png');
await ev(`(()=>{ __nns.zoomBino=20*6.5/55; return 1 })()`); await esp(3000); await b.foto(DIR + '/binoculo-zoom-20x.png');
// óptica com inimigo detectado (revela para a captura)
await ev(`(()=>{ __nns.mem.revelaTudo=1; __nns.zoomBino=8*6.5/55; return 1 })()`); await esp(2500); R.c = JSON.parse(await ev(conta)); await b.foto(DIR + '/binoculo-inimigo-detectado.png'); await ev(`(()=>{ __nns.mem.revelaTudo=0; return 1 })()`);
await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await esp(800); R.sai = await ev(`document.querySelector('[data-r=bzoom]').hidden && ![...document.querySelectorAll('.bn-dist')].some(e=>!e.hidden)`); if (!R.sai) falhas.push('regulador/rótulos não somem ao sair');
R.prog = await ev(`__nns.R.info.programs.length`);
console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join(' | ')); await b.fecha(); process.exit(falhas.length ? 1 : 0);
