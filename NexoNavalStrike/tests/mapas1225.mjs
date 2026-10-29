// v1.2.25 itens 10/13 — A/B de CHAMADAS DE DESENHO e TRIÂNGULOS por quadro (mesma build, mesma câmera de perseguição, qualidade alta,
// frota 8×8, seed 11, hora/tempo padrão do mapa) entre os mapas NOVOS e mapas existentes; 0 erros JS; programas novos após aquecimento;
// e capturas "vista do mar" (câmera fixa a 22 m sobre a água, da base azul para o centro; em 'ruinas', para o arco das torres).
// CAMC=1: câmera da vista do mar no centro da zona olhando para a base vermelha.
// Uso: URL=http://127.0.0.1:4197/?auto CAP=<pasta> node --experimental-websocket tests/mapas1225.mjs [ids]
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4197/?auto', CAP = process.env.CAP || '/tmp', SEG = +(process.env.SEG || 6);
const ids = (process.argv[2] || 'ruinas,dalmacia,lofoten,halong,arquipelago,fiordes,atois,cordilheira').split(',');
const out = [];
for (const id of ids) { const b = await abre(URL, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
  for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa: '${id}', modo: 'frota', classe: 'destroier', seed: 11 }); __nns.tutorial=false; __nns.hud.dica&&__nns.hud.dica(null); __nns.eu.controleIA = 1; return 1 })()`, 180000);
  await esp(5000);
  const r = await ev(`(async()=>{ const j=__nns, R=j.R; const p0=(R.info.programs||[]).length; const DC=[], TR=[]; const orig=j._laco; let n=0;
    j._laco=(t)=>{ orig(t); DC.push(R.info.render.calls); TR.push(R.info.render.triangles); n++; }; cancelAnimationFrame(j._raf); j._raf=requestAnimationFrame(j._laco);
    await new Promise(r=>setTimeout(r, ${SEG}*1000)); j._laco=orig; const m=(a)=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
    const P=j.S.sim.T.plano; const ru=j.terra && j.terra.getObjectByName && j.terra.getObjectByName('ruinas');
    return JSON.stringify({ quadros:n, dc_med:Math.round(m(DC)), dc_max:Math.max(...DC), tri_med:Math.round(m(TR)), programas_novos:(R.info.programs||[]).length-p0, cantos:P.cantos||null, ruinas: ru ? { n: ru.userData.n, tri: ru.geometry.attributes.position.count/3 } : null }) })()`, 120000);
  const o = { id, ...JSON.parse(r) };
  // vista do mar: câmera fixa (substitui atualizaCamera só nesta captura)
  await ev(`(()=>{ const j=__nns, P=j.S.sim.T.plano, c=j.cam; const id='${id}'; let px, pz, lx, lz;
    if (id==='ruinas') { px=-2000; pz=-5000; lx=-3900; lz=-7200; } else if (${!!process.env.CAMC}) { px=P.centro.x; pz=P.centro.z; lx=P.vermelho.x; lz=P.vermelho.z; } else { px=P.azul.x+(P.centro.x-P.azul.x)*0.25; pz=P.azul.z+(P.centro.z-P.azul.z)*0.25; lx=P.centro.x; lz=P.centro.z; }
    j.atualizaCamera=function(){ c.position.set(px,22,pz); c.lookAt(lx,60,lz); c.updateMatrixWorld(); }; for (const el of document.querySelectorAll('#hud,.hud,#ui')) el.style.visibility='hidden'; return 1 })()`);
  await esp(2500); await b.foto(`${CAP}/${id}-vista-mar.png`);
  await ev(`(()=>{ for (const el of document.querySelectorAll('#hud,.hud,#ui')) el.style.visibility=''; return 1 })()`);
  o.erros = b.erros.slice(0, 3); out.push(o); console.log(JSON.stringify(o)); b.fecha(); }
fs.writeFileSync(`${CAP}/medicoes-drawcalls.json`, JSON.stringify(out, null, 1)); process.exit(0);
