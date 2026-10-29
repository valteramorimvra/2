// v1.2.19 itens 10/10b/11/11b — 5 ARENAS REAIS NOVAS + DESTRUIÇÃO: carrega cada arena, conta estruturas destrutíveis,
// fotografa os marcos (pontes, cidades) e destrói (míssil/canhão) prédio, porto e ponte; 0 programas WebGL novos e 0 erros JS.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1219/mapas'; fs.mkdirSync(DIR, { recursive: true });
const MAPAS = (process.argv[2] || 'florianopolis,salvador,gibraltar,saofrancisco,noronha,guanabara,arquipelago').split(',');
const falhas = []; const R = {};
for (const mapa of MAPAS) { const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const r = (R[mapa] = {});
  await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'frota', mapa:'${mapa}', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
  for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
  await esp(3000); const pa = await ev(`__nns.R.info.programs.length`);
  await ev(`(()=>{ const N=__nns; N.__acOrig=N.atualizaCamera; N.atualizaCamera=function(dt,t){ if (window.__pose) { const cam=N.cam; try { window.__pose(cam); } catch(e){ window.__perr=String(e) } cam.updateProjectionMatrix(); return; } return N.__acOrig.call(N,dt,t); }; window.__nns.S.sim.navios.forEach(n=>{ n.controleIA=0; }); return 1 })()`);
  const foto = async (nome, js, t = 900) => { await ev(`(window.__pose = (cam) => { const D=__nns.terra.userData.destr, L=D.R.lista; ${js} }, 1)`); await esp(t); await b.foto(`${DIR}/${mapa}-${nome}.png`); };
  r.estr = JSON.parse(await ev(`(()=>{ const D=__nns.terra.userData.destr; const c={}; for (const e of D.R.lista) c[e.tipo]=(c[e.tipo]||0)+1; return JSON.stringify({ n:D.R.lista.length, tipos:c, pontes:(()=>{ let k=0; __nns.terra.traverse(o=>{ if (o.name==='ponte') k++ }); return k })(), obst:(__nns.S.T.obst||[]).length }) })()`));
  if (!(r.estr.n > 0)) falhas.push(mapa + ': nenhuma estrutura destrutível');
  // marco: ponte (se houver) ou a maior estrutura
  await ev(`(()=>{ const D=__nns.terra.userData.destr, L=D.R.lista; let alvo=null; for (const e of L) if (e.tipo==='ponteVao' && e.papel==='centralA') { alvo=e; break; } if (!alvo) for (const e of L) if (e.tipo==='ponteVao') { alvo=e; break; } if (!alvo) { let m=0; for (const e of L) { const v=e.hw*e.hd*e.h; if (v>m && e.tipo==='predio') { m=v; alvo=e; } } } if (!alvo) alvo=L[0]; window.__alvo=alvo.i; return 1 })()`);
  const vista = (dist, alt, ang = 0.6) => `const e=L[__alvo]; const a=e.rot+Math.PI/2+${ang}; cam.position.set(e.x+Math.cos(a)*${dist}, ${alt}, e.z-Math.sin(a)*${dist}); cam.lookAt(e.x, e.y0+e.h*0.6, e.z); cam.fov=50`;
  await foto('marco', vista(900, 160, 0)); await foto('marco-perto', vista(260, 25, 0.9));
  // cidade: prédio mais alto perto do alvo
  await ev(`(()=>{ const L=__nns.terra.userData.destr.R.lista, a=L[__alvo]; let best=null, bd=1e9; for (const e of L) if (e.tipo==='predio' && e.h>20) { const d=Math.hypot(e.x-a.x,e.z-a.z); if (d<bd) { bd=d; best=e; } } window.__pred = best ? best.i : -1; return 1 })()`);
  const temPred = await ev(`__pred >= 0`);
  if (temPred) { await foto('cidade', `const e=L[__pred]; cam.position.set(e.x+420, e.y0+70, e.z+420); cam.lookAt(e.x, e.y0+20, e.z); cam.fov=55`);
    await ev(`(()=>{ const D=__nns.terra.userData.destr, L=D.R.lista, e=L[__pred]; D.explode(e.x, e.y0+e.h*0.5, e.z, 'canhao', 127, e.i); D.explode(e.x, e.y0+e.h*0.5, e.z, 'canhao', 127, e.i); window.__est1 = e.est; return 1 })()`);
    await foto('predio-canhao', `const e=L[__pred]; cam.position.set(e.x+260, e.y0+50, e.z+260); cam.lookAt(e.x, e.y0+e.h*0.5, e.z); cam.fov=45`, 2500);
    await ev(`(()=>{ const D=__nns.terra.userData.destr, L=D.R.lista, e=L[__pred]; __nns.S.sim.evento({ t:'missilAgua', x:e.x, y:e.y0+e.h*0.4, z:e.z, estr:e.i }); __nns.S.sim.evento({ t:'missilAgua', x:e.x+5, y:e.y0+e.h*0.3, z:e.z, estr:e.i }); return 1 })()`);
    await foto('predio-missil-1s', `const e=L[__pred]; cam.position.set(e.x+260, e.y0+50, e.z+260); cam.lookAt(e.x, e.y0+e.h*0.4, e.z); cam.fov=45`, 1200);
    await foto('predio-desabou-6s', `const e=L[__pred]; cam.position.set(e.x+260, e.y0+50, e.z+260); cam.lookAt(e.x, e.y0+e.h*0.3, e.z); cam.fov=45`, 5000);
    r.predio = JSON.parse(await ev(`JSON.stringify((()=>{ const e=__nns.terra.userData.destr.R.lista[__pred]; return { est1: __est1, est: e.est, hp: +e.hp.toFixed(1), hp0: +e.hp0.toFixed(1), tipo: e.tipo } })())`)); if (r.predio.est < 3) falhas.push(mapa + ': prédio não desabou com 2 mísseis'); }
  // porto/guindaste/tanque
  const temG = await ev(`(()=>{ const L=__nns.terra.userData.destr.R.lista; const g=L.find(e=>e.tipo==='guindaste'); window.__gd = g ? g.i : -1; return !!g })()`);
  if (temG) { await ev(`(()=>{ const D=__nns.terra.userData.destr, L=D.R.lista, e=L[__gd]; D.explode(e.x, e.y0+5, e.z, 'missil', 0, e.i); D.explode(e.x, e.y0+5, e.z, 'canhao', 280, e.i); return 1 })()`);
    await foto('porto-atingido', `const e=L[__gd]; cam.position.set(e.x+180, e.y0+45, e.z+200); cam.lookAt(e.x, e.y0+12, e.z); cam.fov=50`, 4500); r.porto = await ev(`JSON.stringify(__nns.terra.userData.destr.R.lista.filter(e=>e.est>0&&e.tipo!=='predio').map(e=>e.tipo+':'+e.est))`); }
  // ponte: míssil no vão central → desaba
  const temP = await ev(`(()=>{ const L=__nns.terra.userData.destr.R.lista; return !!L.find(e=>e.tipo==='ponteVao') })()`);
  if (temP) { await ev(`(()=>{ const D=__nns.terra.userData.destr, L=D.R.lista, e=L[__alvo]; for (let k=0;k<3;k++) __nns.S.sim.evento({ t:'missilAgua', x:e.x, y:e.y0+e.h*0.6, z:e.z, estr:e.i }); return 1 })()`);
    await foto('ponte-1s', vista(800, 140, 0), 1200); await foto('ponte-desabou-6s', vista(800, 140, 0), 5000);
    r.ponte = await ev(`JSON.stringify(__nns.terra.userData.destr.R.lista.filter(e=>e.ponte!=null).map(e=>e.papel+':'+e.est))`); if (!/central[AB]:3/.test(r.ponte)) falhas.push(mapa + ': vão central não desabou'); }
  await ev(`(window.__pose=null,1)`); await esp(4000); await b.foto(`${DIR}/${mapa}-partida.png`);
  r.fps = await ev(`new Promise(res=>{ let n=0; const t0=performance.now(); const f=()=>{ n++; if (performance.now()-t0<3000) requestAnimationFrame(f); else res(+(n/3).toFixed(1)); }; requestAnimationFrame(f); })`);
  const pb = await ev(`__nns.R.info.programs.length`); r.programas = [pa, pb]; if (pb !== pa) falhas.push(`${mapa}: programas novos ${pa}→${pb}`);
  r.erros = b.erros.slice(0, 3); if (b.erros.length) falhas.push(mapa + ': erros JS: ' + b.erros.slice(0, 2).join(' | ')); r.perr = await ev(`window.__perr||''`);
  console.log(mapa, JSON.stringify(r)); b.fecha(); }
console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); process.exit(falhas.length ? 1 : 0);
