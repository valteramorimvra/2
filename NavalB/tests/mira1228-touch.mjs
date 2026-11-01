/** v1.2.28 — TouchEvent: órbita em cada cam + mira sem lado errado. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const falhas = [];
const b = await abre(null, { w: 915, h: 412 });
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 200; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica(); return 1 })()`);
await b.ev(`(()=>{ window.__sAnt=window.__nns?__nns.S:null; __nnsUI.zarpar({ modo:'duelo', classe:'corsario', classeRival:'volkhar', mapa:'arquipelago', seed:1228, hora:'dia', tempo:'limpo' }); return 1 })()`);
for (let i = 0; i < 120; i++) {
  if (await b.ev(`!!(window.__nns && __nns.S && __nns.S!==window.__sAnt && __nns.eu)`)) break;
  await b.espera(400);
}
await b.ev(`(__nns.tutorial=false,1)`); await b.espera(1000);

async function arrasta(x0, y0, x1, y1, passos = 10) {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1, radiusX: 10, radiusY: 10, force: 0.6 }] });
  for (let i = 1; i <= passos; i++) {
    const t = i / passos;
    await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, id: 1, radiusX: 10, radiusY: 10, force: 0.6 }] });
    await b.espera(30);
  }
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

const modos = ['perto', 'longe', 'popa', 'tresq', 'popaAlta', 'costado'];
const casos = [];
for (const modo of modos) {
  await b.ev(`(__nns.camSel('${modo}'),1)`); await b.espera(350);
  // órbita por arraste touch (área central, longe dos botões)
  await arrasta(520, 180, 280, 180, 12);
  await b.espera(600);
  // força ângulo + pitch baixo (água entre cam e navio — cenário do bug)
  await b.ev(`(()=>{ const n=__nns.eu; __nns.yawAlvo=n.rumo+1.2; __nns.yaw=n.rumo+1.2; __nns.pitchAlvo=0.15; __nns.pitch=0.15; __nns.camPos=null; return 1 })()`);
  await b.espera(5500);
  const r = JSON.parse(await b.ev(`(()=>{ const j=__nns,n=j.eu,tr=n.torres[0];
    const azTorre=n.rumo+tr.az; const marc=j.marc;
    const wrap=(a)=>{ let x=a; while(x>Math.PI)x-=Math.PI*2; while(x<-Math.PI)x+=Math.PI*2; return Math.abs(x); };
    const errTorre=wrap(azTorre-marc), errLook=wrap(marc-j.yaw);
    return JSON.stringify({ modo:j.camModo, marc:+marc.toFixed(3), azTorre:+azTorre.toFixed(3), yaw:+j.yaw.toFixed(3),
      errTorreDeg:+(errTorre*57.3).toFixed(1), errLookDeg:+(errLook*57.3).toFixed(1), ladoErrado: errLook>Math.PI/2 }); })()`));
  casos.push(r);
  if (r.ladoErrado) falhas.push(`${modo}: lado errado errLook=${r.errLookDeg}`);
  if (r.errLookDeg > 25) falhas.push(`${modo}: mira≠cam ${r.errLookDeg}°`);
  // torre: só falha se LADO ERRADO (slew lento ok em 5,5 s)
  await b.foto(`/workspace/nexo-naval-strike/capturas1228/mira_${modo}.png`);
}
// also yaw 180 relative
await b.ev(`(__nns.camSel('costado'),1)`);
await b.ev(`(()=>{ const n=__nns.eu; __nns.yawAlvo=n.rumo+Math.PI; __nns.yaw=n.rumo+Math.PI; __nns.pitch=0.1; __nns.pitchAlvo=0.1; return 1 })()`);
await b.espera(5500);
const r180 = JSON.parse(await b.ev(`(()=>{ const j=__nns,n=j.eu,tr=n.torres[0];
  const wrap=(a)=>{ let x=a; while(x>Math.PI)x-=Math.PI*2; while(x<-Math.PI)x+=Math.PI*2; return Math.abs(x); };
  const errLook=wrap(j.marc-j.yaw); return JSON.stringify({ errLookDeg:+(errLook*57.3).toFixed(1), ladoErrado: errLook>Math.PI/2, errTorreDeg:+(wrap(n.rumo+tr.az-j.marc)*57.3).toFixed(1) }); })()`));
casos.push({ modo: 'costado_yaw180', ...r180 });
if (r180.ladoErrado) falhas.push('costado_yaw180 lado errado');

const out = { falhas, casos };
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/mira-touch.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await b.fecha();
process.exit(falhas.length ? 1 : 0);
