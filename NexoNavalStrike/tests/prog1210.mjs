// v1.2.10: 0 programas WebGL novos durante a partida (míssil em arco, canhão, torpedo 300 m/s, câmeras CANHÃO/MÍSSIL, binóculo)
import { abre } from './cdp.mjs';
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(3000);
const np = () => ev(`(__nns.R.info.programs||[]).length`); const nomes = () => ev(`JSON.stringify((__nns.R.info.programs||[]).map(p=>p.id+"|"+p.name+"|"+(p.cacheKey||"").slice(0,40)+"|"+(p.cacheKey||"").length+"|"+(p.cacheKey||"").slice(-80)))`);
const p0 = await np(); const n0 = JSON.parse(await nomes());
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time); const br=n.rumo+0.35; a.x=n.x+Math.sin(br)*6000; a.z=n.z-Math.cos(br)*6000; n.alvoId=a.id; n.trava=1; n.mira.az=br; window.__a=a.id; const p0=S.prontidao; S.prontidao=()=>({ok:true}); n.tVls=0; S.lancaMissil(n,a.id,2); n.tTorp=0; S.lancaTorpedo(n,a.id); S.prontidao=p0; for (const t of n.torres) t.rec=0; j.acao('fogo'); j.camModo='missil'; j.camMisObj=S.misseis.find(m=>m.ativo); return 1 })()`);
for (let q = 0; q < 8; q++) await esp(1000);
await ev(`(()=>{ const j=__nns; j.acao('fogoSolta'); j.camModo='conves'; return 1 })()`); await esp(2500); await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await esp(2500); await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await esp(1500);
const p1 = await np(); const n1 = JSON.parse(await nomes()); console.log(n1.filter(x=>!n0.includes(x)).join("\n")); console.log(JSON.stringify({ programasInicio: p0, programasFim: p1, novos: p1 - p0, erros: b.erros.slice(0, 3) })); b.fecha(); process.exit(0);
