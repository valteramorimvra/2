import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1216'; const TAG = process.env.TAG || 'antes';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36' });
await b.send('Emulation.setDeviceMetricsOverride', { width: 915, height: 412, deviceScaleFactor: 2.625, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'puffin', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; __nns.hud&&__nns.hud.dica&&__nns.hud.dica(null); return 1 })()`, 120000); await esp(7000);
console.log(await ev(`(()=>{ const j=__nns; return 'cam '+j.camSel+' near '+j.cam.near+' fov '+j.cam.fov })()`));
await b.foto(`${dir}/puffin-3perto-${TAG}.png`);
await ev(`(()=>{ const j=__nns, n=j.eu; j.pausado=1; const o={...j.local(n,0,n.C.L*0.17,n.C.L*0.62)}, t={...j.local(n,0,n.C.F*0.8,-n.C.L*0.25)}; j.cam.position.set(o.x,o.y,o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.updateMatrixWorld(); j.atualizaNavios(0, j.S.sim.t); j.R.render(j.cena,j.cam); return 1 })()`); await esp(500); await b.foto(`${dir}/puffin-popa-${TAG}.png`);
console.log(await ev(`(()=>{ const j=__nns, g=j.navios[j.S.sim.navios.indexOf(j.eu)].g; const mats=new Map(); (g||j.cena).traverse(o=>{ if(o.isMesh&&o.material&&!Array.isArray(o.material)){ const m=o.material; const k=m.uuid; if(!mats.has(k)) mats.set(k,{m,n:[]}); mats.get(k).n.push(o.name) } }); const cores=['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff','#ff8000','#8000ff','#ffffff','#000000','#808000','#008080']; const L=[]; let i=0; for(const [k,v] of mats){ if(v.m.type!=='MeshStandardMaterial'||!v.m.color) continue; const c=cores[i%cores.length]; L.push(c+':'+(v.m.roughness)+'/'+v.m.metalness+'/'+(v.m.map&&v.m.map.image?v.m.map.image.width:'-')+'/'+v.n.slice(0,4).join(',')); v.m.userData._c=v.m.color.getHex(); v.m.color.set(c); v.m.map=null; v.m.emissive&&v.m.emissive.set(c).multiplyScalar(0.6); v.m.needsUpdate=true; i++; } j.R.render(j.cena,j.cam); return (g?'grupo ':'cena ')+L.join(' | ') })()`)); await esp(300); await b.foto(`${dir}/puffin-mats-${TAG}.png`);
console.log(await ev(`(()=>{ const j=__nns; j.amb.mar.visible=false; j.R.render(j.cena,j.cam); return 1 })()`)); await esp(300); await b.foto(`${dir}/puffin-semmar-${TAG}.png`);
b.fecha(); process.exit(0);
