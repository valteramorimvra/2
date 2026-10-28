import { abre } from '/workspace/nexo-naval-strike/tests/cdp.mjs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto', PRE = process.env.PRE || '/workspace/capturas1224/mira_depois';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; await b.vai(URL);
for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ const A=__nnsUI.audio; try{A.setMusicaOn(false);}catch(e){} await A.iniciar(); return 1 })()`, 200000);
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); al.x=eu.x+Math.sin(eu.rumo+0.8)*2200; al.z=eu.z-Math.cos(eu.rumo+0.8)*2200; al.v=0; N.yawAlvo=Math.atan2(al.x-eu.x, -(al.z-eu.z)); return 1 })()`);
await esp(2500); await b.foto(PRE + '_semalvo.png');
await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); N.acao && N.acao('travar'); return JSON.stringify({alvo: eu.alvoId, cor: N._corMira}) })()`).then(console.log);
await esp(2500); await b.foto(PRE + '_travado.png'); console.log(await ev(`JSON.stringify({ cls: document.querySelector('.h-alvo')?.className, cor: getComputedStyle(document.querySelector('.h-alvo i')).getPropertyValue('--c'), after: getComputedStyle(document.querySelector('.h-alvo'),'::after').display })`));
await ev(`(()=>{ __nns.travaSegue=false; __nns.yawAlvo += 0.35; return 1 })()`); await esp(2500); await b.foto(PRE + '_foraDoAlvo.png'); console.log(await ev(`JSON.stringify({ cls: document.querySelector('.h-alvo')?.className, cor: getComputedStyle(document.querySelector('.h-alvo i')).getPropertyValue('--c') })`)); console.log(await ev(`JSON.stringify({alvo: __nns.eu.alvoId, cor: __nns._corMira, cls: document.querySelector('.h-mira')?.className})`));
await b.fecha(); process.exit(0);
