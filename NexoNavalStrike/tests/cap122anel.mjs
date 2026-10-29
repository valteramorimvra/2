// v1.2.2 — capturas do ANEL de dispersão na mira: navio estável (> 3 s, anel fechado) e guinando a toda força (anel aberto).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const fmt = process.argv[2] || '20x9'; const dir = process.argv[3] || '/workspace/nexo-naval-shots/122'; fs.mkdirSync(dir, { recursive: true });
const [W, H] = fmt === '16x9' ? [733, 412] : [915, 412];
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); const ev = b.ev, esp = b.espera; const log = [];
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.camModo='perto'; await __nnsUI.zarpar({ mapa:'atois', modo:'frota', classe:'destroier', seed: 8, hora:'dia', tempo:'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500);
const anel = () => ev(`(()=>{ const e=document.querySelector('[data-r=dispA]'); const r=e&&e.getBoundingClientRect(); return JSON.stringify({ px: r? Math.round(r.width):null, visivel: !!(e && getComputedStyle(e).display!=='none' && r.width>0), dispF: +(__nns.eu.dispF||0).toFixed(2), tEstavel: +(__nns.eu.tEstavel||0).toFixed(1), w: +(__nns.eu.w||0).toFixed(3), nos: +(Math.abs(__nns.eu.v)*1.943844).toFixed(1) }) })()`);
// estável: parado, sem leme, > 3 s
await ev(`(()=>{ const j=__nns, n=j.eu; j.S.comando({t:'telegrafo',v:1}); j.S.comando({t:'leme',v:0}); for (let k=0;k<60*8;k++) j.S.avanca(1/60); j.processaEventos(); j.yaw=j.yawAlvo=n.rumo+0.4; j.pitch=j.pitchAlvo=0.12; return 1 })()`);
await esp(2500); log.push('estável: ' + await anel()); await b.foto(`${dir}/${fmt}-7a-anel-dispersao-estavel.png`);
// guinando a toda força: anel abre
await ev(`(()=>{ const j=__nns, n=j.eu; j.S.comando({t:'telegrafo',v:4}); for (let k=0;k<60*25;k++) { j.S.comando({t:'leme',v:1}); j.S.avanca(1/60); } j.processaEventos(); return 1 })()`);
for (let i = 0; i < 6; i++) { await ev(`(()=>{ __nns.S.comando({t:'leme',v:1}); return 1 })()`); await esp(400); }
log.push('guinando a toda força: ' + await anel()); await b.foto(`${dir}/${fmt}-7b-anel-dispersao-guinando.png`);
log.push('erros: ' + JSON.stringify(b.erros.slice(0, 5)));
console.log(log.join('\n')); fs.writeFileSync(`${dir}/${fmt}-anel-log.txt`, log.join('\n') + '\n'); b.fecha(); process.exit(0);
