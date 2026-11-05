// v1.2.16 item 16: PICO DE QUADRO ao disparar FOGUETES (1º disparo e salvas). Mede: programas WebGL antes/depois, geometrias/texturas novas,
// maior quadro nos 4 s após cada disparo vs base, e tempo máximo por subsistema (render, Sim, eventos, fx, áudio).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const TAG = process.env.TAG || 'antes'; const CL = process.env.CLASSE || 'marcos';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = { tag: TAG, classe: CL };
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'duelo', classe: '${CL}', classeRival: 'destroier', seed: 4, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 180000); await esp(7000);
await ev(`(()=>{ const j=__nns, P=window.__perf={max:{}, quadros:[], marca:[]}; const W=(o,k,nome)=>{ const f=o[k].bind(o); o[k]=function(...a){ const t=performance.now(); const r=f(...a); const d=performance.now()-t; if(!(P.max[nome]>=d)) P.max[nome]=d; P.cur&&(P.cur[nome]=(P.cur[nome]||0)+d); return r; }; };
  W(j.R,'render','render'); W(j.S,'avanca','sim'); W(j,'processaEventos','eventos'); W(j.fx,'passo','fx'); W(j,'atualizaProjeteis','proj'); W(j,'atualizaNavios','navios'); W(j.audio,'camada','audioCamada'); W(j.audio,'toca','audioToca'); W(j.R,'compile','compile');
  let a=performance.now(); const loop=()=>{ const t=performance.now(); P.quadros.push([t, t-a]); a=t; requestAnimationFrame(loop); }; requestAnimationFrame(loop); return 1 })()`);
const info = () => ev(`JSON.stringify({ prog: __nns.R.info.programs.length, geo: __nns.R.info.memory.geometries, tex: __nns.R.info.memory.textures })`).then(JSON.parse);
R.antes = await info(); await esp(3000);
const base = JSON.parse(await ev(`(()=>{ const q=__perf.quadros.slice(-90).map(x=>x[1]).sort((a,b)=>a-b); return JSON.stringify({med:q[q.length>>1], max:q[q.length-1]}) })()`)); R.base = base;
R.disparos = [];
for (let k = 0; k < 4; k++) {
  const t0 = +(await ev(`(()=>{ const j=__nns, sim=j.S.sim; const e=sim.navios.find(n=>n.time!==j.eu.time&&!n.morto); j.eu.alvoId=e.id; j.eu.trava=1; j.S.comando({t:'alvo', id:e.id}); const F=j.eu.fgC||j.eu; F.tRbu=0; F.rbuFila=0; if (F.rbu<=0) F.rbu=6; j.eu.tRbu=0; j.eu.rbuFila=0; j.S.comando({t:'rbu', alvo:e.id}); return performance.now() })()`));
  await esp(4000);
  const r = JSON.parse(await ev(`(()=>{ const q=__perf.quadros.filter(x=>x[0]>${t0}); const d=q.map(x=>x[1]); const s=d.slice().sort((a,b)=>a-b); return JSON.stringify({ max:+s[s.length-1].toFixed(1), p95:+s[Math.floor(s.length*0.95)].toFixed(1), med:+s[s.length>>1].toFixed(1), quadros:d.length, fog: __nns.S.sim.granadas.filter(g=>g.ativo&&(g.rbu||g.foguete)).length, evRbu: 0 }) })()`));
  r.info = await info(); r.subMax = JSON.parse(await ev(`JSON.stringify(Object.fromEntries(Object.entries(__perf.max).map(([k,v])=>[k,+v.toFixed(1)])))`)); await ev(`(()=>{ __perf.max={}; return 1 })()`);
  R.disparos.push(r); if (k === 0) await b.foto(`/workspace/nexo-naval-shots/1216/foguetes/${TAG}-disparo.png`);
}
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync(`/workspace/foguete1216-${TAG}.json`, JSON.stringify(R, null, 1)); await b.fecha(); process.exit(0);
