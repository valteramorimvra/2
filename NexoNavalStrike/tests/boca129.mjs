// v1.2.9: auditoria automática — boca do cano no MODELO 3D (em jogo) × ponto de saída da simulação, todas as classes/torres/canos (tolerância 1 m)
import { abre } from '/workspace/nexo-naval-strike/tests/cdp.mjs';
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const out = [];
const { ORDEM_CLASSES } = await import('/workspace/nexo-naval-strike/src/sim/classes.js'); for (const cls of (process.argv[2] ? process.argv[2].split(',') : ORDEM_CLASSES)) {
await ev(`(async()=>{ if (__nns && __nns.rodando) __nns.encerra(); await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: '${cls}', seed: 8, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(800);
out.push(cls + ' ' + await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const r=[]; n.torres.forEach((tr,i)=>{ const b=n.P.torres[i]; tr.az = b.frente>0 ? 0.5 : Math.PI-0.5; tr.el=0.3; tr.recuo=0; }); j.atualizaNavios(0.0001, S.t); n.torres.forEach((tr,i)=>{ const nc=tr.canos||1; for (let c=0;c<nc;c++){ const L=S.P_(n,i,nc>1?(2*c-(nc-1))/(nc-1):0); const o=S.mundo(n,L.x,L.y,L.z,{}); const p=j.bocaCano(n.id,i,c); r.push('t'+i+'c'+c+':'+Math.hypot(p.x-o.x,p.y-o.y,p.z-o.z).toFixed(2)); } }); return r.join(' ') })()`));
}
const mx = Math.max(...out.join(' ').match(/:[0-9.]+/g).map((q) => +q.slice(1))); console.log(out.join('\n')); console.log('MAX', mx.toFixed(2), mx < 1 ? 'OK' : 'FALHOU'); b.fecha(); process.exit(0);
