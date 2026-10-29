// v1.2.17 item 27d: TESTE DE PICOS DE ÁUDIO — os sons nunca travam o jogo. Em partida real: (1) todos os sons pré-carregados (decodificados antes da largada);
// (2) rajadas extremas (até 80 sons por quadro: gravações + camadas sintetizadas + salvas) medem o custo de CPU de cada rajada, os quadros com e sem rajada,
// o relógio do áudio (não pode parar) e os pools (24 vozes gravadas · ≤ 96 sintetizadas); (3) nenhum download/decodificação durante as rajadas.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1217/picos'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {}; let __mix = true;
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(4000);
await ev(`(async()=>{ const A=__nns.audio; try{ A.destrava&&A.destrava(); await (A.ctx&&A.ctx.resume()); }catch(e){} for(let i=0;i<300 && (!A.ctx||A.ctx.state!=='running'||(window.AudioWorkletNode&&!A.mixPrepMs&&!A.mixErro));i++) await new Promise(r=>setTimeout(r,200)); return 1 })()`, 70000); await esp(3000);
R.pre = JSON.parse(await ev(`JSON.stringify(__nns.audio.estado())`));
if (R.pre.ctx !== 'running') falhas.push('contexto de áudio não rodando: ' + R.pre.ctx);
if (!(R.pre.decodificados >= R.pre.total) || R.pre.total < 15) falhas.push(`pré-carga incompleta ${R.pre.decodificados}/${R.pre.total} ${JSON.stringify(R.pre.erros)}`);
// instrumentação: quadros (rAF), downloads/decodificações durante o teste
await ev(`(()=>{ const W=window.__pk={ q:[], f:0, dec:0, audios:0 }; let ul=performance.now(); const loop=(t)=>{ W.q.push(t-ul); ul=t; if(W.on) requestAnimationFrame(loop); }; W.on=1; requestAnimationFrame(loop);
  const F=window.fetch; window.fetch=function(...a){ if(W.medindo) W.f++; return F.apply(this,a); }; const X=XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open=function(...a){ if(W.medindo) W.f++; return X.apply(this,a); };
  const D=BaseAudioContext.prototype.decodeAudioData; BaseAudioContext.prototype.decodeAudioData=function(...a){ if(W.medindo) W.dec++; return D.apply(this,a); }; const AU=window.Audio; window.Audio=function(...a){ if(W.medindo) W.audios++; return new AU(...a); }; return 1 })()`);
const fase = async (nome, seg, rajada) => ev(`(async()=>{ const A=__nns.audio, W=window.__pk, c=A.ctx; W.q.length=0; W.f=0; W.dec=0; W.audios=0; W.medindo=1; const t0=performance.now(), a0=c.currentTime; const custo=[]; let vMax=0, sMax=0, n=0;
  const SONS=['canhao_grande','canhao_medio','canhao_rapido','canhao_longe','explosao_perto','explosao_media','explosao_grande','explosao_longe','respingo','respingo_grande','impacto_metal','vls_lancamento','ciws','torpedo_corrida'];
  const CAM=['canhao','ciws','explosao','foguete','lancador','missil','missilImpacto','missilPassagem','missilRugido','missilTerminal','missilVarredura','torpImpacto','torpedo','boosterSep'];
  while(performance.now()-t0 < ${seg}*1000){ await new Promise(r=>requestAnimationFrame(r)); if(${rajada}){ const p0=performance.now();
      for(let k=0;k<${rajada};k++){ const d=Math.random()*9000, pan=Math.random()*2-1; if(k%3===0) A.toca(SONS[(n+k)%SONS.length],{d,pan,vol:0.4+Math.random()*0.6,voz:k}); else if(k%3===1) A.camada(CAM[(n+k)%CAM.length],{d,pan,vol:0.3+Math.random()*0.7}); else A.salva&&A.salva('canhao_medio',3,d,pan); }
      custo.push(performance.now()-p0); n++; } vMax=Math.max(vMax,A.vozesAtivas?A.vozesAtivas():(A.vozes||0)); sMax=Math.max(sMax,A.vozesSint||0); }
  W.medindo=0; const q=W.q.slice(2).sort((a,b)=>a-b); const pct=(p)=>q.length?q[Math.min(q.length-1,Math.floor(p*q.length))]:0; custo.sort((a,b)=>a-b);
  return JSON.stringify({ nome:'${nome}', quadros:q.length, q50:+pct(0.5).toFixed(1), q95:+pct(0.95).toFixed(1), qMax:+(q[q.length-1]||0).toFixed(1), rajadas:n, sonsPorRajada:${rajada},
    custoMed:+(custo[Math.floor(custo.length/2)]||0).toFixed(2), custo95:+(custo[Math.floor(custo.length*0.95)]||0).toFixed(2), custoMax:+(custo[custo.length-1]||0).toFixed(2),
    relogio:+((c.currentTime-a0)/((performance.now()-t0)/1000)).toFixed(3), vozesMax:vMax, sintMax:sMax, downloads:W.f, decodificacoes:W.dec, novosAudio:W.audios, descartadas:A.descartadas||0, roubadas:A.roubadas||0, sintDescartadas:A.sintDescartadas||0, estado:c.state }) })()`, (seg + 60) * 1000);
R.base = JSON.parse(await fase('base', 20, 0)); await b.foto(DIR + '/base.png');
R.r20 = JSON.parse(await fase('rajada20', 20, 20));
R.r80 = JSON.parse(await fase('rajada80', 20, 80)); await b.foto(DIR + '/rajada80.png');
R.pos = JSON.parse(await fase('depois', 15, 0));
for (const k of ['r20', 'r80']) { const F = R[k];
  if (F.custoMax > 25) falhas.push(`${k}: rajada custou ${F.custoMax} ms (máx 25)`); if (F.custo95 > 12) falhas.push(`${k}: p95 da rajada ${F.custo95} ms`);
  if (F.q95 > R.base.q95 * 1.3 + 20) falhas.push(`${k}: quadros p95 ${F.q95} ms vs base ${R.base.q95}`);
  if (F.vozesMax > (__mix ? 64 : 24)) falhas.push(`${k}: pool de vozes estourou ${F.vozesMax}`); if (F.sintMax > 96 + 8) falhas.push(`${k}: pool sintetizado estourou ${F.sintMax}`);
  if (F.downloads || F.decodificacoes) falhas.push(`${k}: download/decodificação durante a rajada (${F.downloads}/${F.decodificacoes})`);
  if (F.relogio < 0.9) falhas.push(`${k}: relógio do áudio parou/atrasou (${F.relogio})`); if (F.estado !== 'running') falhas.push(`${k}: contexto ${F.estado}`); }
if (R.pos.q95 > R.base.q95 * 1.3 + 20) falhas.push(`depois das rajadas os quadros não voltaram ao normal (${R.pos.q95} vs ${R.base.q95})`);
R.falhas = falhas; fs.writeFileSync('/workspace/picos1217.out', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log('picos1217 falhas', falhas.length, falhas.join(' | ')); await b.fecha(); process.exit(0);
