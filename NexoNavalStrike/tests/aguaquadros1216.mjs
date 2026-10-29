// v1.2.16: TRAVADAS DA ÁGUA — tempo de quadro (média, desvio-padrão, picos), passo do uniform uT por quadro e posição do plano do mar,
// alocação de heap por quadro (performance.memory) e sequência de quadros da água (mesma câmera presa ao navio em movimento).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const TAG = process.env.TAG || 'depois'; const DIR = process.env.DIR || '/workspace/nexo-naval-shots/1216/agua-seq'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.send('Emulation.setDeviceMetricsOverride', { width: 915, height: 412, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
await b.vai((process.env.URL || 'http://127.0.0.1:4173/') + '?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(5000);
await ev(`(()=>{ const S=__nns.S; S.comando({t:'vel', v:1}); S.comando({t:'acel', v:1}); try{ __nns.eu.velAlvo = __nns.eu.C.vmax; }catch(e){} return 1 })()`); await esp(4000);
const r = await ev(`new Promise(ok=>{ const j=__nns; const dts=[], dT=[], snaps=[]; let t0=performance.now(), u0=j.amb.uM.uT.value, mx=j.amb.mar.position.x, mz=j.amb.mar.position.z; const m0=performance.memory?performance.memory.usedJSHeapSize:0; let gcs=0, mPrev=m0, aloc=0;
  const f=()=>{ const t=performance.now(); dts.push(t-t0); t0=t; const u=j.amb.uM.uT.value; dT.push(u-u0); u0=u; const p=j.amb.mar.position; snaps.push(Math.hypot(p.x-mx,p.z-mz)); mx=p.x; mz=p.z; if (performance.memory){ const m=performance.memory.usedJSHeapSize; if (m<mPrev) gcs++; else aloc+=m-mPrev; mPrev=m; } if (dts.length<150) requestAnimationFrame(f); else { const st=(a)=>{ const n=a.length, me=a.reduce((x,y)=>x+y,0)/n, sd=Math.sqrt(a.reduce((x,y)=>x+(y-me)**2,0)/n); const s=[...a].sort((x,y)=>x-y); return { me:+me.toFixed(2), sd:+sd.toFixed(2), p99:+s[Math.floor(n*0.99)].toFixed(2), max:+s[n-1].toFixed(2) }; };
    const rz=dT.map((d,i)=>d/(dts[i]/1000||1)); ok(JSON.stringify({ quadro: st(dts.slice(5)), uTporQuadro: st(dT.slice(5)), uTzeros: dT.slice(5).filter(d=>d===0).length, razaoUTsobreDt: st(rz.slice(5)), saltoPlanoMax: +Math.max(...snaps.slice(5)).toFixed(2), saltosPlano: snaps.slice(5).filter(d=>d>0.5).length, heapKBporQuadro: +(aloc/dts.length/1024).toFixed(1), gcs })); } }; requestAnimationFrame(f); })`, 200000);
console.log(TAG, r); fs.appendFileSync('/workspace/aguaquadros1216.log', TAG + ' ' + r + '\n');
for (let i = 0; i < 6; i++) { await b.foto(`${DIR}/${TAG}-${i}.png`); await esp(120); }
b.fecha(); process.exit(0);
