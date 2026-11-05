// v1.2.11 — capturas (lendários no estaleiro e em jogo, câmera de projétil/foguete, menu de câmeras, mapa novo, batalha 8×8 com porta-aviões/mercantes),
// contagem de programas WebGL (qualidade fixa 'alta') durante todas as câmeras novas, caças, laser, e tempo de quadro com 8×8.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1211'; fs.mkdirSync(dir, { recursive: true }); const log = [];
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
// 1) estaleiro com a categoria LENDÁRIO
await ev(`(()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.dev=true; __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(2500);
await ev(`(()=>{ const b=document.querySelector('[data-c=colosso]'); b.scrollIntoView({block:'center'}); b.click(); return 1 })()`); await esp(4000); await b.foto(`${dir}/1-estaleiro-lendario-colosso.png`);
log.push('lendarios na lista: ' + await ev(`[...document.querySelectorAll('.es-lista .lend')].map(e=>e.dataset.c).join(',')`));
// 2) partida 8×8 no mapa novo, jogador no Colosso, com porta-aviões e mercantes
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'cordilheira', modo: 'frota', classe: 'colosso', seed: 8, hora: 'dia', tempo: 'limpo', portaAvioes: true, mercantes: true }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000); await esp(2500);
log.push('navios: ' + await ev(`JSON.stringify({ n: __nns.S.sim.navios.length, merc: __nns.S.sim.navios.filter(n=>n.C.mercante).length, pa: __nns.S.sim.navios.filter(n=>n.C.porta).map(n=>n.time+':'+n.C.id), lend: __nns.eu.C.id })`));
const np = () => ev(`(__nns.R.info.programs||[]).length`); const p0 = await np();
const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${s}*60;i++){ S.passo([]); if (i%3===2) { j.processaEventos(); j.atualizaProjeteis(1/20); j.fx.passo(1/20); } } j.processaEventos(); return 1 })()`, 180000);
const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
// 3) o lendário de perto (pintura metálica)
await ev(`(()=>{ const j=__nns, n=j.eu; const o={...j.local(n, n.C.B*2.2, n.C.F+28, -n.C.L*0.15)}; const a={...j.local(n, 0, n.C.F+6, 0)}; j.camTeste={ p:[o.x,o.y,o.z], a:[a.x,a.y,a.z], fov:55 }; return 1 })()`); await aquece(0.2); await esp(1500); await b.foto(`${dir}/2-lendario-colosso-em-jogo.png`);
// 4) porta-aviões com caças (depois de 25 s de partida)
await passos(25);
await ev(`(()=>{ const j=__nns, S=j.S.sim; const pa=S.navios.find(n=>n.C.porta==='pa' && n.time===j.eu.time) || S.navios.find(n=>n.C.porta); const o={...j.local(pa, -pa.C.B*3.2, pa.C.F+45, pa.C.L*0.55)}; const a={...j.local(pa, 0, pa.C.F+8, 0)}; j.camTeste={ p:[o.x,o.y,o.z], a:[a.x,a.y,a.z], fov:55 }; window.__pa=pa.id; return 1 })()`); await aquece(0.2); await esp(1500); await b.foto(`${dir}/3-porta-avioes-cacas.png`);
log.push('cacas em voo: ' + await ev(`__nns.S.sim.helis.filter(h=>h.ativo && h.H.aviao).length`));
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`);
// 5) menu de câmeras aberto + câmera de PROJÉTIL
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time && !e.C.mercante && !e.morto); window.__a=a.id; const br=n.rumo+0.4; a.x=n.x+Math.sin(br)*5200; a.z=n.z-Math.cos(br)*5200; a.v=0; n.alvoId=a.id; n.trava=1; n.mira.az=br; j.yaw=j.yawAlvo=br; j.camSel('perto'); j.hud.camMenu(true); return 1 })()`); await passos(0.5); await esp(1500); await b.foto(`${dir}/4-menu-cameras.png`);
log.push('menu cam: ' + await ev(`[...document.querySelectorAll('.h-cammenu .cm-i')].length + ' icones'`)); await ev(`(()=>{ __nns.hud.camMenu(false); return 1 })()`);
await ev(`(()=>{ const j=__nns, n=j.eu; j.camSel('projetil'); for (const t of n.torres) t.rec=0; j.acao('fogo'); return 1 })()`); await passos(0.15); await ev(`(()=>{ __nns.acao('fogoSolta'); return 1 })()`); await passos(0.9); await aquece(0.05); await esp(1200); await b.foto(`${dir}/5-camera-projetil.png`);
log.push('dbg ' + await ev(`(()=>{ const j=__nns, cp=j.cam.position; const out=[]; j.cena.traverse(o=>{ if(!o.visible||!(o.isMesh||o.isPoints||o.isSprite)) return; const p=cp.clone(); o.getWorldPosition(p); const d=p.distanceTo(cp); if (d<100 && o.name!=='oceano' && !(o.scale.x>1000)) out.push([o.name||o.type, j.fx.granadas.indexOf(o), Math.round(d), o.material&&o.material.color?o.material.color.getHexString():'', o.parent&&o.parent.name, o.scale.x.toFixed(1)+','+o.scale.z.toFixed(1)]); }); return JSON.stringify({ gi: j.S.sim.granadas.indexOf(j.camProj), out: out.slice(0,30)}) })()`));
log.push('cam projetil: ' + await ev(`JSON.stringify({ modo: __nns.camModo, proj: !!(__nns.camProj && __nns.camProj.ativo) })`));
await passos(8);
// 6) foguete, míssil, canhão, convés, drone, binóculo (contagem de programas)
for (const m of ['foguete', 'missil', 'canhao', 'conves', 'longe']) { await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const p0=S.prontidao; S.prontidao=()=>({ok:true}); if ('${m}'==='missil') { n.tVls=0; S.lancaMissil(n, window.__a, 2); } if ('${m}'==='foguete') { j.acao('gran'); } S.prontidao=p0; j.camSel('${m}'); return 1 })()`); await passos(3); await aquece(0.1); await esp(600); }
await ev(`(()=>{ const j=__nns, n=j.eu; if (n.lasers && n.lasers[0]) { const L=n.lasers[0]; L.on=1; L.tx=n.x+300; L.ty=200; L.tz=n.z+300; } j.acao('drone'); return 1 })()`); await passos(1); await aquece(0.1); await esp(800);
await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await aquece(0.1); await esp(800); await ev(`(()=>{ __nns.acao('bino'); __nns.camSel('perto'); return 1 })()`);
// 7) batalha 8×8: visão alta das duas frotas
await passos(20); await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const viv=S.navios.filter(q=>!q.morto); const cx=viv.reduce((p,q)=>p+q.x,0)/viv.length, cz=viv.reduce((p,q)=>p+q.z,0)/viv.length; j.camTeste={ p:[n.x - Math.sin(n.rumo)*900, 520, n.z + Math.cos(n.rumo)*900], a:[cx, 0, cz], fov:62 }; return 1 })()`); await aquece(0.2); await esp(1500); await b.foto(`${dir}/6-batalha-8x8-cordilheira.png`);
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`);
const p1 = await np(); log.push(`programas WebGL: inicio ${p0} fim ${p1} novos ${p1 - p0} (qualidade fixa alta)`);
// 8) tempo de quadro real (loop do jogo) com 22 navios (SwiftShader/CPU — não representa GPU de celular)
const perf = await ev(`new Promise((ok)=>{ const j=__nns; let n=0, t0=performance.now(), mx=0, ult=t0; const f=()=>{ const t=performance.now(); mx=Math.max(mx,t-ult); ult=t; if (++n<120) requestAnimationFrame(f); else ok(JSON.stringify({ quadros:n, msMedio: +((t-t0)/n).toFixed(1), msMax: +mx.toFixed(1), navios: j.S.sim.navios.filter(q=>!q.morto).length, aereos: j.S.sim.helis.filter(h=>h.ativo).length, chamadas: j.R.info.render.calls, tris: j.R.info.render.triangles, qual: j.Q && j.Q.nivel })); }; requestAnimationFrame(f); })`, 120000);
log.push('perf ' + perf);
for (const nv of [1, 0]) log.push('qualidade ' + nv + ' ' + await ev(`new Promise((ok)=>{ const j=__nns; j.Q.nivel=${nv}; j.aplicaQualidade(); let k=0; const f=()=>{ if (++k<20) return requestAnimationFrame(f); ok(JSON.stringify({ chamadas: j.R.info.render.calls, tris: j.R.info.render.triangles, programas: (j.R.info.programs||[]).length })); }; requestAnimationFrame(f); })`, 120000));
const simMs = await ev(`(()=>{ const S=__nns.S.sim; const t0=performance.now(); for (let i=0;i<300;i++) S.passo([]); return +((performance.now()-t0)/300).toFixed(3) })()`, 120000); log.push('sim ms/passo (22 navios): ' + simMs);
log.push('erros ' + JSON.stringify(b.erros.slice(0, 5))); console.log(log.join('\n')); fs.writeFileSync(`${dir}/log.txt`, log.join('\n')); b.fecha(); process.exit(0);
