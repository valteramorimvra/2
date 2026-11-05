// v1.2.19 item 13 — granada com corpo real (ogiva, cinta, traçante) em escala do calibre; detonação de míssil (terra/mar) com estrondo;
// coluna d'água alta do torpedo. Fotos + 0 programas WebGL novos + 0 erros JS. Vale para todos os modos (mesmos eventos/efeitos; cinema incluso).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1221/fx1219'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'frota', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await esp(3000); const pa = await ev(`__nns.R.info.programs.length`);
await ev(`(()=>{ const N=__nns; N.__acOrig=N.atualizaCamera; N.atualizaCamera=function(dt,t){ if (window.__pose) { const S=N.S.sim, eu=N.eu, cam=N.cam; try { window.__pose(cam, S, eu); } catch(e){} cam.updateProjectionMatrix(); return; } return N.__acOrig.call(N,dt,t); }; return 1 })()`);
const foto = async (nome, js) => { await ev(`(window.__pose = (cam, S, eu) => { ${js} }, 1)`); await esp(700); await b.foto(`${DIR}/${nome}.png`); await ev(`(window.__pose=null,1)`); };
// granadas de 4 calibres paradas no ar (v=1 m/s apontando para o través) ao lado da câmera
R.granadas = JSON.parse(await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; for (const q of S.granadas) q.ativo=0; const fw=[Math.sin(eu.rumo),-Math.cos(eu.rumo)], rt=[Math.cos(eu.rumo),Math.sin(eu.rumo)]; const o=[]; [30,76,127,280].forEach((cal,k)=>{ const g=S.slotGranada('canhao'); Object.assign(g,{ativo:1,x:eu.x+rt[0]*60+fw[0]*(k*2.2-3),y:20,z:eu.z+rt[1]*60+fw[1]*(k*2.2-3),vx:-fw[0]*820,vy:4,vz:-fw[1]*820,cal,dono:eu.id,t:1,dano:0,k:0,rbu:0,foguete:0,arcR:0,ap:0,time:eu.time}); o.push(S.granadas.indexOf(g)); }); window.__gs=o; window.__g0=o.map(i=>({...S.granadas[i]})); N.atualizaProjeteis(0); return JSON.stringify({ idx:o, corpos:N.fx.corposG.count }) })()`));
if (!(R.granadas.corpos >= 4)) falhas.push('corpos de granada instanciados: ' + R.granadas.corpos);
const g0 = `__gs.forEach((i,k)=>Object.assign(S.granadas[i], __g0[k])); __nns.atualizaProjeteis(0); const G=__gs.map(i=>S.granadas[i]); const cx=G.reduce((a,g)=>a+g.x,0)/4, cy=G[0].y, cz=G.reduce((a,g)=>a+g.z,0)/4; const rt=[Math.cos(eu.rumo),Math.sin(eu.rumo)];`;
await foto('granadas-perto', `${g0} cam.position.set(cx - rt[0]*7, cy+1.2, cz - rt[1]*7); cam.lookAt(cx, cy, cz); cam.fov=40; __nns.atualizaProjeteis(0)`);
await foto('granadas-280', `${g0} const g=G[3]; cam.position.set(g.x - rt[0]*2.4, g.y+0.5, g.z - rt[1]*2.4); cam.lookAt(g.x, g.y, g.z); cam.fov=40; __nns.atualizaProjeteis(0)`);
await foto('granadas-longe', `${g0} cam.position.set(cx - rt[0]*160, cy+8, cz - rt[1]*160); cam.lookAt(cx, cy, cz); cam.fov=40; __nns.atualizaProjeteis(0)`);
await ev(`(()=>{ for (const i of __gs) __nns.S.sim.granadas[i].ativo=0; return 1 })()`);
// míssil que erra: mar (coluna + bola de fogo) e evento real pelo tratador; torpedo no mar
R.ev = await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const fw=[Math.sin(eu.rumo),-Math.cos(eu.rumo)]; window.__pM=[eu.x+fw[0]*420, eu.z+fw[1]*420]; S.evento({ t:'missilAgua', x:__pM[0], y:0, z:__pM[1] }); return 'ok' })()`);
await esp(2500); await foto('missil-mar', `cam.position.set(eu.x+Math.cos(eu.rumo)*160, 22, eu.z+Math.sin(eu.rumo)*160); cam.lookAt(__pM[0], 10, __pM[1]); cam.fov=45`);
await ev(`(()=>{ const N=__nns, eu=N.eu; const fw=[Math.sin(eu.rumo),-Math.cos(eu.rumo)]; window.__pM=[eu.x+fw[0]*380, eu.z+fw[1]*380]; N.fx.impactoMissil(__pM[0], 4, __pM[1], 1); N.fx.clarao(__pM[0], 4, __pM[1], 0.32); return 1 })()`);
await esp(900); await foto('missil-detonacao', `cam.position.set(eu.x+Math.cos(eu.rumo)*160, 22, eu.z+Math.sin(eu.rumo)*160); cam.lookAt(__pM[0], 10, __pM[1]); cam.fov=40`);
await ev(`(()=>{ const N=__nns, eu=N.eu; const fw=[Math.sin(eu.rumo),-Math.cos(eu.rumo)]; window.__pM=[eu.x+fw[0]*500, eu.z+fw[1]*500]; N.fx.colunaTorpedo(__pM[0], __pM[1], 1.2); N.fx.impactoTorpedo(__pM[0], __pM[1], 1); return 1 })()`);
await esp(2500); await foto('torpedo-coluna-3s', `cam.position.set(eu.x+Math.cos(eu.rumo)*160, 18, eu.z+Math.sin(eu.rumo)*160); cam.lookAt(__pM[0], 30, __pM[1]); cam.fov=50`); await esp(3000); await foto('torpedo-coluna', `cam.position.set(eu.x+Math.cos(eu.rumo)*160, 18, eu.z+Math.sin(eu.rumo)*160); cam.lookAt(__pM[0], 30, __pM[1]); cam.fov=50`);
await ev(`(__nns.S.comando({ t:'telegrafo', v:4 }),1)`); await esp(15000);
const pb = await ev(`__nns.R.info.programs.length`); R.programas = { antes: pa, depois: pb }; if (pb !== pa) falhas.push(`programas novos: ${pa}→${pb}`);
R.erros = b.erros; if (b.erros && b.erros.length) falhas.push('erros JS: ' + b.erros.slice(0, 3).join(' | '));
console.log(JSON.stringify(R, null, 1)); console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); b.fecha(); process.exit(falhas.length ? 1 : 0);
