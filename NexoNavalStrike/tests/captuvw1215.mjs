// v1.2.15 — capturas T/U/V/W: estaleiro (lendários roxos), camuflagens lendárias (prévia 3D + lista com bônus), aba Helis com silhuetas,
// seleção de arena com miniaturas reais, camuflagem lendária em jogo, heli atirando (foguetes/metralhadora) e caça VTOL em curva
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1215'; fs.mkdirSync(dir, { recursive: true });
const b = await abre('http://127.0.0.1:4173/?auto', { w: 960, h: 432 }); const ev = b.ev, esp = b.espera; const log = [];
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.TELAS.batalha(); return 1 })()`); await esp(1500); await b.foto(`${dir}/arena-miniaturas.png`);
log.push('miniaturas ' + await ev(`[...document.querySelectorAll('.mapa.mini')].map(b=>getComputedStyle(b).backgroundImage.includes('mapas/')).filter(Boolean).length`));
await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(2500);
await ev(`(()=>{ const b=document.querySelector('[data-c=colosso]'); b.scrollIntoView({block:'center'}); b.click(); return 1 })()`); await esp(2500); await b.foto(`${dir}/arvore-lendarios.png`);
await ev(`(()=>{ document.querySelector('[data-aba=pintura]').click(); return 1 })()`); await esp(800);
for (const p of ['lend_relampago', 'lend_obsidiana', 'lend_brasa']) { await ev(`(()=>{ const b=document.querySelector('[data-pint=${p}]'); b.scrollIntoView({block:'center'}); b.click(); return 1 })()`); await esp(3500); await b.foto(`${dir}/camo-${p}.png`); }
log.push('bonus visível ' + await ev(`document.body.innerText.includes('TODOS os atributos')`));
await ev(`(()=>{ const b=document.querySelector('[data-c=destroier]'); b.scrollIntoView({block:'center'}); b.click(); document.querySelector('[data-aba=helis]').click(); return 1 })()`); await esp(2000); await b.foto(`${dir}/helis-silhuetas.png`);
log.push('silhuetas ' + await ev(`document.querySelectorAll('.sws.hl .silh').length`));
// em jogo: camuflagem lendária de perto
await ev(`(()=>{ const e=__nnsUI.eco; e.e.pinturasPossui.lend_brasa=1; e.escolherPintura('colosso','lend_brasa'); return 1 })()`);
const zarpa = async (o) => { await ev(`(async()=>{ await __nnsUI.zarpar(${JSON.stringify(o)}); __nns.tutorial=false; const j=__nns, s=j.S.sim, n=j.eu; for (const q of s.navios) if (q!==n && q.time===n.time) q.x=1e7; return 1 })()`, 120000); };
const passa = (seg, extra = '') => ev(`(()=>{ const j=__nns, S=j.S, s=S.sim; for (let i=0;i<60*${seg};i++){ ${extra} S.avanca(1/60); j.processaEventos(); s.eventos.length=0; if (i%2) { j.atualizaNavios(1/30, s.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); j.aereo3d && j.aereo3d.passo && 0; j.atualizaCamera && j.atualizaCamera(1/30, s.t); } } return 1 })()`, 180000);
const camW = (p, a, fov = 40) => ev(`(()=>{ const j=__nns; j.pausado=1; j.cam.position.set(${p}); j.cam.lookAt(${a}); j.cam.fov=${fov}; j.cam.updateProjectionMatrix(); j.cam.updateMatrixWorld(); j.atualizaNavios(0, j.S.sim.t); j.raizHud.style.visibility='hidden'; j.R.render(j.cena,j.cam); return 1 })()`);
await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'colosso', seed: 5, hora: 'entardecer', tempo: 'limpo' }); await passa(2);
log.push('pintura em jogo ' + await ev(`__nns.eu.pintura`));
await ev(`(()=>{ const j=__nns, n=j.eu; const o={...j.local(n, n.C.B*2.4, n.C.F+6, -n.C.L*0.1)}, t={...j.local(n,0,n.C.F*0.6,-n.C.L*0.05)}; j.pausado=1; j.cam.position.set(o.x,o.y,o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.fov=50; j.cam.updateProjectionMatrix(); j.cam.updateMatrixWorld(); j.atualizaNavios(0, j.S.sim.t); j.raizHud.style.visibility='hidden'; j.R.render(j.cena,j.cam); return 1 })()`); await esp(300); await b.foto(`${dir}/camo-lendaria-jogo.png`);
await ev(`(()=>{ __nns.pausado=0; __nns.raizHud.style.visibility=''; return 1 })()`);
// heli de ataque disparando foguetes e jato em curva
for (const mod of ['ataque', 'leve', 'jato']) {
  await ev(`(()=>{ const e=__nnsUI.eco; e.escolherHeli('destroier', 0, '${mod}'); return 1 })()`);
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'destroier', seed: 9, hora: 'dia', tempo: 'limpo' });
  await ev(`(()=>{ const j=__nns, s=j.S.sim, n=j.eu, a=s.navios.find(q=>q.time!==n.time); a.x=n.x+2200; a.z=n.z-500; s.revelaTudo=1; n.alvoId=a.id; return 1 })()`);
  const blq = "{ const s=__nns.S.sim, n=__nns.eu, a=s.navios.find(q=>q.time!==n.time); for (const tr of a.torres) tr.rec=99; a.vls=0; a.sam=0; a.lasers=[]; a.a30=[]; for (const c of a.ciws) c.mun=0; n.alvoId=a.id; a.vida=Math.max(a.vida, a.C.vida*0.6); }";
  await passa(13, blq); await ev(`(()=>{ const j=__nns; j.S.comando({t:'controle', k:0}); return 1 })()`); await passa(0.2, blq); await ev(`(()=>{ const j=__nns, s=j.S.sim, h=s.helis[j.eu.helis[0]]; h.ctrl='ia'; j.eu.controle=-1; return 1 })()`);
  let ok = 0; for (let k = 0; k < 90 && !ok; k++) { await passa(1, blq); ok = await ev(`(()=>{ const j=__nns, s=j.S.sim, h=s.helis[j.eu.helis[0]]; return ${mod === 'jato' ? 'Math.abs(h.roll||0) > 0.5 && h.estado===4' : mod === 'leve' ? 'h.fogoMg' : '(h.tArma > 2.6 && h.tArma < 3.2)'} ? 1 : 0 })()`); }
  if (mod !== 'jato') await passa(0.25, blq);
  await ev(`(()=>{ const j=__nns, s=j.S.sim, h=s.helis[j.eu.helis[0]]; const a=s.navios.find(q=>q.time!==j.eu.time); const sR=Math.sin(h.rumo), cR=Math.cos(h.rumo); const dx=${mod === 'jato' ? 50 : 26}; j.pausado=1; j.cam.position.set(h.x - sR*dx + cR*dx*0.6, h.y + 6, h.z + cR*dx + sR*dx*0.6); j.cam.lookAt(${mod === 'jato' ? 'h.x, h.y, h.z' : '(h.x*2+a.x)/3, (h.y*2)/3, (h.z*2+a.z)/3'}); j.cam.fov=${mod === 'jato' ? 40 : 55}; j.cam.updateProjectionMatrix(); j.cam.updateMatrixWorld(); j.atualizaNavios(0, s.t); j.raizHud.style.visibility='hidden'; j.R.render(j.cena,j.cam); return 1 })()`); await esp(300);
  await b.foto(`${dir}/aereo-${mod}.png`); log.push(`aereo ${mod} ${ok}`); await ev(`(()=>{ __nns.pausado=0; __nns.raizHud.style.visibility=''; return 1 })()`); }
console.log(log.join('\n')); console.log('erros', JSON.stringify(b.erros)); b.fecha(); process.exit(0);
