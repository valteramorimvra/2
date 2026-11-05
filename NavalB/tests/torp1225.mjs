// v1.2.25 item 2 — coluna d'água de contato do torpedo: A/B de custo de quadro (rAF, tempo de R.render), draw calls, programas WebGL e nós de áudio,
// janela de controle (sem coluna) × janela com 3 colunas seguidas; fotos das fases (só na build nova). URL=… ROT=rótulo.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto', ROT = process.env.ROT || '1.2.25', FOTOS = !!process.env.FOTOS; const R = { rot: ROT };
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__NOS={medindo:false,n:0}; (()=>{ const W=window.__NOS, P=BaseAudioContext.prototype; for (const k of Object.getOwnPropertyNames(P)) { if(!/^create/.test(k)||typeof P[k]!=='function'||k==='createPeriodicWave') continue; const o=P[k]; P[k]=function(...a){ if(W.medindo) W.n++; return o.apply(this,a); }; } })();` });
await b.vai(URL); for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ const A=__nnsUI.audio; try{A.setMusicaOn(false); A.paraMusica();}catch(e){} await A.iniciar(); return 1 })()`, 200000);
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await esp(3000);
await ev(`(()=>{ const j=__nns, R=j.R, o=R.render.bind(R); window.__m={on:false,fr:[],rt:[],calls:0,ult:0}; R.render=(a,b)=>{ const t=performance.now(); o(a,b); if(__m.on){ __m.rt.push(performance.now()-t); __m.calls=Math.max(__m.calls,R.info.render.calls); } }; const f=(t)=>{ if(__m.on&&__m.ult) __m.fr.push(t-__m.ult); __m.ult=t; requestAnimationFrame(f); }; requestAnimationFrame(f); return 1 })()`);
const janela = async (cols) => { await ev(`(()=>{ __m.fr=[]; __m.rt=[]; __m.calls=0; __m.on=true; window.__NOS.n=0; window.__NOS.medindo=true; const j=__nns, eu=j.eu, c=j.cam, d=new j.THREE.Vector3(); c.getWorldDirection(d); const h=Math.hypot(d.x,d.z)||1; window.__pt={x:c.position.x+d.x/h*320, z:c.position.z+d.z/h*320}; return 1 })()`);
  for (let k = 0; k < cols; k++) { await ev(`(()=>{ __nns.fx.colunaTorpedo(__pt.x+${k * 30}, __pt.z, 1.2, null, null); return 1 })()`); await esp(2000); }
  await esp(10000 - cols * 2000);
  const r = JSON.parse(await ev(`(()=>{ __m.on=false; window.__NOS.medindo=false; const s=(a)=>a.slice().sort((x,y)=>x-y), m=(a)=>a.reduce((p,q)=>p+q,0)/Math.max(1,a.length), F=s(__m.fr), T=s(__m.rt); return JSON.stringify({ quadros:F.length, frMed:+m(F).toFixed(2), frP95:+(F[Math.floor(F.length*0.95)]||0).toFixed(2), renderMed:+m(T).toFixed(2), renderP95:+(T[Math.floor(T.length*0.95)]||0).toFixed(2), callsMax:__m.calls, programas:(__nns.R.info.programs||[]).length, nos:window.__NOS.n, aguaAtivas: __nns.fx.agua.ativas }) })()`));
  return r; };
R.controle = await janela(0); R.colunas = await janela(3); R.controle2 = await janela(0);
if (FOTOS) { await ev(`(()=>{ const j=__nns, c=j.cam, d=new j.THREE.Vector3(); c.getWorldDirection(d); const h=Math.hypot(d.x,d.z)||1; window.__pt={x:c.position.x+d.x/h*380, z:c.position.z+d.z/h*380}; j.fx.colunaTorpedo(__pt.x, __pt.z, 1.2, null, null); return 1 })()`); const t0 = Date.now();
  for (const t of [0.25, 0.8, 1.8, 3.0, 4.4, 7.5]) { const w = t * 1000 - (Date.now() - t0); if (w > 0) await esp(w); await b.foto(`/workspace/capturas1225/torpedo_${String(t).replace('.', '_')}s.png`); } }
R.stTorp = await ev(`JSON.stringify(__nns.fx.stTorp||null)`); fs.writeFileSync(`/workspace/torp1225_${ROT}.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.fecha(); process.exit(0);
