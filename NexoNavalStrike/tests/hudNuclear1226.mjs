// v1.2.26: botão NUCLEAR não cobre nenhum outro controle (retângulos) em 3 tamanhos de tela de celular deitado.
import { abre } from './cdp.mjs';
const URL = process.env.URL || 'http://127.0.0.1:4187/?auto'; const R = [];
for (const [w, h] of [[915, 412], [780, 360], [640, 360]]) { const b = await abre(URL, { w, h }); const ev = b.ev;
  for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(500); }
  await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'atlantico', seed: 11 }); return 1 })()`, 180000); await b.espera(2500);
  await ev(`(()=>{ const n=__nns.eu; n.C=Object.assign(Object.create(Object.getPrototypeOf(n.C)), n.C, { nuclear: { bombas: 1 } }); __nns.criaNuclear(true); return 1 })()`); await b.espera(1500);
  R.push(JSON.parse(await ev(`(()=>{ const k=document.querySelector('[data-a=nuke]'); const a=k.getBoundingClientRect(); const vis=getComputedStyle(k).display!=='none' && a.width>0; const sob=[];
    for (const e of document.querySelectorAll('button,[data-a],.cb,#stick,#manete,.manete,.radar,#radar')) { if (e===k || k.contains(e) || e.contains(k)) continue; const s=getComputedStyle(e); if (s.display==='none'||s.visibility==='hidden') continue; const r=e.getBoundingClientRect(); if (!r.width) continue; const ix=Math.min(a.right,r.right)-Math.max(a.left,r.left), iy=Math.min(a.bottom,r.bottom)-Math.max(a.top,r.top); if (ix>1&&iy>1) sob.push((e.dataset.a||e.id||e.className)+' '+Math.round(ix)+'x'+Math.round(iy)); }
    return JSON.stringify({ tela:'${w}x${h}', visivel:vis, ret:[a.left,a.top,a.width,a.height].map(Math.round), sobreposicoes:sob }) })()`)));
  await b.foto(`/workspace/nexo-naval-strike-mod/nuclear/capturas/hud-${w}x${h}.png`); b.fecha(); }
console.log(JSON.stringify(R, null, 1)); process.exit(R.every((r) => r.visivel && !r.sobreposicoes.length) ? 0 : 1);
