// v1.2.16 itens 9 e 13: CINEMA (órbita, corte de evento com câmera lenta, cinema de míssil VLS→perseguição→impacto, X/toque para sair, resolução restaurada)
// + SUPER PORTA-AVIÕES ATLÂNTICO jogável com LANÇAR ESQUADRILHA (decolagem em sequência, limite no ar) — 0 programas WebGL novos, sem erros.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const D = '/workspace/nexo-naval-shots/1216/'; const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await ev(`window.__erros=[]; window.addEventListener('error', e=>__erros.push(String(e.message))); 1`).catch(()=>{});
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`window.__erros=[]; window.addEventListener('error', e=>__erros.push(String(e.message))); window.addEventListener('unhandledrejection', e=>__erros.push(String(e.reason))); 1`);
const fq = (s) => ev(`(async()=>{ const t=[]; let a=performance.now(); for(let i=0;i<${s};i++){ await new Promise(r=>requestAnimationFrame(r)); const b=performance.now(); t.push(b-a); a=b; } t.sort((x,y)=>x-y); return JSON.stringify({med:+t[t.length>>1].toFixed(1), p95:+t[Math.floor(t.length*0.95)].toFixed(1)}) })()`, 120000).then(JSON.parse);
// ---- Atlântico + esquadrilha
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'atlantico', seed: 9, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 180000); await esp(6000);
R.atl = JSON.parse(await ev(`(()=>{ const j=__nns, n=j.eu; return JSON.stringify({ classe:n.tipo, aeronaves:n.helis.length, modelos:[...new Set(n.helis.map(i=>j.S.sim.helis[i].modelo))], rot:document.querySelector('[data-a=heli] b').textContent, q:document.querySelector('[data-r=q_heli]').textContent, prog:j.R.info.programs.length }) })()`));
await b.foto(D + 'aviacao/atlantico-hud.png');
await ev(`(()=>{ __nns.acao('heli'); return 1 })()`); await esp(1500); await b.foto(D + 'aviacao/esquadrilha-lancada.png');
await esp(1500); /* SwiftShader roda a ~2 qps: avança a simulação 120 s direto (mesmo código do jogo) para medir a fila do convoo */ let maxAr = +(await ev(`(()=>{ const j=__nns, sim=j.S.sim; let mx=0; for (let k=0;k<120*60;k++){ sim.passo(); sim.eventos.length=0; if(k%30===0){ const a=j.eu.helis.filter(i=>{ const e=sim.helis[i].estado; return e>=2&&e<=5 }).length; mx=Math.max(mx,a); } } return mx })()`, 180000)); await esp(1500); await b.foto(D + 'aviacao/esquadrilha-no-ar.png');
R.atl.maxNoAr = maxAr; R.atl.q2 = await ev(`document.querySelector('[data-r=q_heli]').textContent`); R.atl.helisHud = await ev(`document.querySelector('[data-r=helis]') ? document.querySelector('[data-r=helis]').innerText : ''`);
await ev(`(()=>{ const j=__nns, sim=j.S.sim; const h=j.eu.helis.map(i=>sim.helis[i]).find(q=>q.estado===3); if(h){ j.cam.position.set(h.x-40,h.y+8,h.z+30); } return 1 })()`);
await ev(`(()=>{ __nns.camSel('cinema'); return 1 })()`); await esp(2500); await b.foto(D + 'cinema/orbita-atlantico.png');
await ev(`(()=>{ const j=__nns, sim=j.S.sim; const h=j.eu.helis.map(i=>sim.helis[i]).find(q=>q.estado===3); if(h) j.cine.corta('aereo', h.x, h.y, h.z, 3, 1.4); return !!h })()`); await esp(1200); await b.foto(D + 'cinema/corte-aereo.png');
R.atl.progFim = +(await ev(`__nns.R.info.programs.length`)); await ev(`(()=>{ __nns.cine.sai(); return 1 })()`);
// ---- Colosso: cinema manual, corte de afundamento (lento), míssil VLS, saída e resolução
await ev(`(()=>{ __nns.encerra(); return 1 })()`); await esp(800);
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'colosso', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 180000); await esp(6000);
const p0 = +(await ev(`__nns.R.info.programs.length`)); R.prNormal = +(await ev(`__nns.R.getPixelRatio()`)); R.fqNormal = await fq(90);
await ev(`(()=>{ __nns.camSel('cinema'); return 1 })()`); await esp(2500);
R.cineOn = JSON.parse(await ev(`JSON.stringify({ on:__nns.cine.on, hudOculto: getComputedStyle(document.querySelector('[data-a=cam]')).visibility, x: !!document.querySelector('.cine-x') && getComputedStyle(document.querySelector('.cine-x')).visibility, pr: __nns.R.getPixelRatio(), dpr: devicePixelRatio, camY: __nns.cam.position.y })`));
await b.foto(D + 'cinema/orbita-colosso.png'); R.fqCine = await fq(90);
await ev(`(()=>{ const j=__nns, sim=j.S.sim; const e=sim.navios.filter(n=>n.time!==j.eu.time&&!n.morto).sort((a,b)=>Math.hypot(a.x-j.eu.x,a.z-j.eu.z)-Math.hypot(b.x-j.eu.x,b.z-j.eu.z))[0]; j.cine.corta('afunda', e.x, e.C.F*0.5, e.z, 4.2, 1.8, e.id); window.__tA=sim.t; window.__pA=performance.now(); return 1 })()`);
await esp(900); await b.foto(D + 'cinema/corte-evento-lento.png'); R.lento = JSON.parse(await ev(`JSON.stringify({ escala: __nns.cine.escala(), dtSim: __nns.S.sim.t-__tA, dtReal:(performance.now()-__pA)/1000 })`));
await esp(4000);
// míssil: trava o inimigo mais próximo e dispara VLS
const mis = JSON.parse(await ev(`(async()=>{ const j=__nns, sim=j.S.sim; const e=sim.navios.filter(n=>n.time!==j.eu.time&&!n.morto).sort((a,b)=>Math.hypot(a.x-j.eu.x,a.z-j.eu.z)-Math.hypot(b.x-j.eu.x,b.z-j.eu.z))[0];
  j.eu.alvoId=e.id; j.eu.trava=1; j.S.comando({t:'alvo', id:e.id}); j.eu.tVls=0; j.S.comando({t:'mira', az:Math.atan2(e.x-j.eu.x,-(e.z-j.eu.z)), dist:Math.hypot(e.x-j.eu.x,e.z-j.eu.z)}); if (j.eu.mira) j.eu.mira.az=Math.atan2(e.x-j.eu.x,-(e.z-j.eu.z)); const pr=sim.prontidao(j.eu,'vls'); j.acao('vls'); return JSON.stringify({pr, d:Math.hypot(e.x-j.eu.x,e.z-j.eu.z)|0}) })()`));
R.missil = { pronto: mis }; const fases = []; for (let i = 0; i < 40; i++) { await esp(700); const f = JSON.parse(await ev(`JSON.stringify({tipo:__nns.cine.corte.tipo, fase:__nns.cine.corte.fase, mis: !!__nns.cine.corte.mis})`)); fases.push(f.tipo + f.fase); if (i === 3) await b.foto(D + 'cinema/missil-lancamento.png'); if (i === 7) await b.foto(D + 'cinema/missil-perseguicao.png'); if (f.tipo === 'impacto') { await esp(500); await b.foto(D + 'cinema/missil-impacto.png'); break; } }
R.missil.fases = [...new Set(fases)];
await ev(`(()=>{ document.querySelector('.cine-x').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); return 1 })()`); await esp(1500);
R.sai = JSON.parse(await ev(`JSON.stringify({ on:__nns.cine.on, hud:getComputedStyle(document.querySelector('[data-a=cam]')).visibility, pr: __nns.R.getPixelRatio(), prEsperado: Math.min(devicePixelRatio||1, [0.9,1.4,2][__nns.Q.nivel]), nivel: __nns.Q.nivel, prog: __nns.R.info.programs.length })`)); R.fqDepois = await fq(60);
await b.foto(D + 'cinema/depois-saida.png');
R.p0 = p0; R.erros = JSON.parse(await ev(`JSON.stringify(__erros.slice(0,6))`));
console.log(JSON.stringify(R, null, 1));
if (R.atl.aeronaves !== 24) falhas.push('Atlântico sem 24 aeronaves'); if (R.atl.rot !== 'ESQUADRILHA') falhas.push('botão não é ESQUADRILHA'); if (!(R.atl.maxNoAr >= 4)) falhas.push('esquadrilha não decolou: ' + R.atl.maxNoAr); if (R.atl.maxNoAr > 14) falhas.push('mais de 14 no ar');
if (!R.cineOn.on || R.cineOn.hudOculto !== 'hidden' || R.cineOn.x !== 'visible') falhas.push('cinema/HUD ' + JSON.stringify(R.cineOn));
if (R.lento.escala !== 0.5) falhas.push('sem câmera lenta'); if (R.sai.on || R.sai.hud !== 'visible' || Math.abs(R.sai.pr - R.sai.prEsperado) > 1e-6) falhas.push('saída ' + JSON.stringify(R.sai));
if (R.sai.prog > p0) falhas.push(`programas novos ${p0}→${R.sai.prog}`); if (R.atl.progFim > R.atl.prog) falhas.push(`programas novos (Atlântico) ${R.atl.prog}→${R.atl.progFim}`);
if (R.erros.length) falhas.push('erros JS ' + R.erros.join(';'));
console.log('falhas', falhas.length, falhas.join(' | ')); await b.fecha(); process.exit(falhas.length ? 1 : 0);
