import { abre } from './cdp.mjs';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 200; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const k = process.env.K || 'kelly';
await ev(`(()=>{ __nnsUI.zarpar({ modo:'duelo', classe:'${k}', classeRival:'volkhar', mapa:'arquipelago', seed: 21, hora:'dia', tempo:'limpo' }); return 1 })()`);
for (let i = 0; i < 120; i++) { if (await ev(`!!(window.__nns && __nns.S && __nns.eu && __nns.eu.C.id === '${k}')`)) break; await esp(500); } await ev(`(__nns.tutorial=false,1)`); await esp(2500);
await ev(`(()=>{ const S=__nns.S.sim, eu=__nns.eu; const ini=S.navios.find(n=>n.time!==eu.time); ini.x=eu.x+Math.sin(eu.rumo+1.35)*1500; ini.z=eu.z-Math.cos(eu.rumo+1.35)*1500; ini.vx=0; ini.vz=0; eu.controleIA=1; return 1 })()`);
for (let s = 0; s < 14; s++) { await esp(1000); console.log(await ev(`(()=>{ const S=__nns.S.sim, eu=__nns.eu; const ini=S.navios.find(n=>n.time!==eu.time); return JSON.stringify({ t:S.t|0, ia:eu.controleIA, ctl:eu.controle, papel:eu.papel, alvo:eu.alvoId, trava:+(eu.trava||0).toFixed(2), travaMis:eu.travaMis, vls:eu.vls, torp:eu.torp, det: S.detectado? !!S.detectado(eu.time, ini.id):'?', ini:ini.id, auto: eu.autoFogo, ems: eu.emcon, radar: eu.radarAtivo }) })()`)); }
process.exit(0);
