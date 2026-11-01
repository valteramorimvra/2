// v1.2.17 itens 3/4 + 1 (13a/13i): DOF no menu/estaleiro (nitidez navio × fundo), texturas em alta resolução, cidade com recuos/coberturas,
// personalizada com ilhas extras + plataformas SÓLIDAS + camuflagem das aeronaves; 0 erros JS; programas WebGL não crescem na partida.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const D = '/workspace/nexo-naval-shots/1217/dof/'; fs.mkdirSync(D, { recursive: true }); const D2 = '/workspace/nexo-naval-shots/1217/personalizada13/'; fs.mkdirSync(D2, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`window.__erros=[]; window.addEventListener('error', e=>__erros.push(String(e.message))); window.addEventListener('unhandledrejection', e=>__erros.push(String(e.reason))); 1`);
await esp(4000);
const ui = (s) => ev(`(()=>{ document.querySelector('#ui').style.visibility='${s}'; return 1 })()`);
await ui('hidden'); await esp(1500); await b.foto(D + 'menu_dof.png');
await ev(`(()=>{ __nnsUI.save.ajustes.dof=false; return 1 })()`); await esp(1500); await b.foto(D + 'menu_semdof.png');
await ev(`(()=>{ __nnsUI.save.ajustes.dof=true; return 1 })()`); await ui('visible');
// estaleiro
await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(3500); await b.foto(D + 'estaleiro_dof.png');
await ev(`(()=>{ __nnsUI.save.ajustes.dof=false; return 1 })()`); await esp(1500); await b.foto(D + 'estaleiro_semdof.png'); await ev(`(()=>{ __nnsUI.save.ajustes.dof=true; return 1 })()`);
// 13i: aba Helis + camuflagem (classe com hangar)
R.camo = await ev(`(async()=>{ const q=[...document.querySelectorAll('[data-c]')].map(b=>b.dataset.c); const k = q.find(c=>__nns.CLASSES[c].heli>0 && !__nns.CLASSES[c].helisPadrao) || q.find(c=>__nns.CLASSES[c].heli>0); document.querySelector('[data-c="'+k+'"]').click(); await new Promise(r=>setTimeout(r,800)); document.querySelector('[data-aba="helis"]').click(); await new Promise(r=>setTimeout(r,800));
  const bs=[...document.querySelectorAll('[data-camaer]')]; if (!bs.length) return 'sem botões'; bs.find(b=>b.dataset.camaer==='oliva').click(); await new Promise(r=>setTimeout(r,1500)); return k+':'+__nnsUI.eco.camoAereoDe(k)+':'+bs.length })()`, 30000);
await esp(2500); await b.foto(D + 'estaleiro_camo_aeronave.png'); if (!/:oliva:6$/.test(R.camo)) falhas.push('camuflagem de aeronave não aplicada ' + R.camo);
// sobreposição de botões na aba Helis
R.sobrepoe = await ev(`(()=>{ const bs=[...document.querySelectorAll('.tela button')].filter(b=>b.offsetParent && b.getBoundingClientRect().width>0).map(b=>b.getBoundingClientRect()); let n=0; for (let i=0;i<bs.length;i++) for (let j=i+1;j<bs.length;j++){ const a=bs[i], c=bs[j]; const ix=Math.min(a.right,c.right)-Math.max(a.left,c.left), iy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top); if (ix>2&&iy>2) n++; } return n })()`);
if (R.sobrepoe) falhas.push('botões sobrepostos no estaleiro/Helis: ' + R.sobrepoe);
// personalizada com ilhas/plataformas/camo
await ev(`(()=>{ __nnsUI.TELAS.personalizada(); return 1 })()`); await esp(1500);
R.pers = await ev(`(async()=>{ const set=(g,v)=>{ const s=document.querySelector('select[data-g="'+g+'"]'); if(!s) return g+'?'; s.value=String(v); s.dispatchEvent(new Event('change',{bubbles:true})); return 'ok' }; const out=[set('ilhas',6),set('ilhasTam','g'),set('ilhasPos','centro'),set('plataformas',3),set('camoAz','noturno'),set('camoVm','areia'),set('mapa','arquipelago')]; await new Promise(r=>setTimeout(r,800)); return out.join(',') })()`);
await b.foto(D2 + 'tela_personalizada.png');
R.sobrepoeP = await ev(`(()=>{ const bs=[...document.querySelectorAll('.tela button, .tela select')].filter(b=>b.offsetParent && b.getBoundingClientRect().width>0).map(b=>b.getBoundingClientRect()); let n=0; for (let i=0;i<bs.length;i++) for (let j=i+1;j<bs.length;j++){ const a=bs[i], c=bs[j]; const ix=Math.min(a.right,c.right)-Math.max(a.left,c.left), iy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top); if (ix>2&&iy>2) n++; } return n })()`);
if (R.sobrepoeP) falhas.push('controles sobrepostos na personalizada: ' + R.sobrepoeP);
await ev(`(()=>{ document.querySelector('[data-a="zarparp"]').click(); return 1 })()`);
for (let i = 0; i < 240; i++) { if (await ev(`!!(window.__nns && __nns.S && __nns.S.sim && __nns.rodando)`)) break; await esp(500); } await esp(8000);
R.arena = JSON.parse(await ev(`(()=>{ const T=__nns.S.sim.T, sim=__nns.S.sim; const pl=(T.plataformas||[]); const camo={}; for(const h of sim.helis) if(h.usado) camo[h.time]=(camo[h.time]||'')+(h.camo||'?')[0]; return JSON.stringify({ ilhas:T.ilhasExtra, plat:pl.length, obst:(T.obst||[]).length, camo }) })()`));
if (!(R.arena.ilhas >= 5)) falhas.push('ilhas extras ' + R.arena.ilhas); if (R.arena.plat !== 3) falhas.push('plataformas ' + R.arena.plat);
// plataforma sólida: navio do jogador posto em rota de colisão
R.colisao = JSON.parse(await ev(`(()=>{ const j=__nns, sim=j.S.sim, T=sim.T, eu=j.eu, p=T.plataformas[0]; eu.x=p.x-300; eu.z=p.z; eu.rumo=Math.PI/2; eu.v=eu.C.vmax*0.6; const S=j.S; S.comando && S.comando({t:'mtr', v:3}); let dmin=1e9; for(let k=0;k<60*40;k++){ sim.passo(); sim.eventos.length=0; dmin=Math.min(dmin, Math.hypot(eu.x-p.x, eu.z-p.z)); } return JSON.stringify({ dmin:+dmin.toFixed(1), vida:eu.vida, r:p.r }) })()`, 300000));
if (R.colisao.dmin < 30) falhas.push('atravessou a plataforma ' + JSON.stringify(R.colisao));
await ev(`(()=>{ const j=__nns, T=j.S.sim.T, p=T.plataformas[1]||T.plataformas[0]; j.camModo='longe'; return 1 })()`); await esp(3000); await b.foto(D2 + 'partida_ilhas.png');
R.prog0 = +(await ev(`__nns.R.info.programs.length`)); await ev(`(()=>{ __nns.camSel('cinema'); return 1 })()`); await esp(6000); await b.foto(D + 'cinema_dof.png'); await ev(`(()=>{ __nns.cine.sai(); return 1 })()`); await esp(1500);
R.prog1 = +(await ev(`__nns.R.info.programs.length`)); if (R.prog1 > R.prog0) falhas.push(`programas WebGL novos com DOF no cinema: ${R.prog0} → ${R.prog1}`);
R.erros = await ev(`JSON.stringify(__erros)`); if (R.erros !== '[]') falhas.push('erros JS ' + R.erros);
R.falhas = falhas; fs.writeFileSync('/workspace/dof1217.out', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log('falhas:', falhas.length, falhas.join(' | ')); b.fecha(); process.exit(0);
