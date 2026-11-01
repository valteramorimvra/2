// v1.2.16 item 5: SOM DOS CANHÕES — latência clarão→som no navio do jogador (sem atraso de 343 m/s), vozes por torre (nenhuma corta a outra),
// pan/pitch por torre, atraso físico só para fontes distantes, limitador na cadeia. Classe colosso (várias torres), salva com TODAS as torres.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = [];
await b.vai((process.env.URL || 'http://127.0.0.1:4173/') + '?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: process_classe, seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`.replace('process_classe', JSON.stringify(process.env.CLASSE || 'colosso')), 120000); await esp(4000);
await ev(`(()=>{ const j=__nns, A=j.audio; try{ A.destrava && A.destrava(); }catch(e){} window.__som={ tiros:[], starts:[], stops:0, rot:[] }; const W=window.__som;
  const ctx=A.ctx; W.ctx=!!ctx; W.estado=ctx&&ctx.state; W.hint=ctx&&ctx.baseLatency; W.out=ctx&&ctx.outputLatency; W.lim=!!A.lim; W.limTh=A.lim&&A.lim.threshold.value;
  const n5=j.n5, t0=n5.tiro.bind(n5); n5.tiro=(e,d,pan)=>{ if(e.id===j.eu.id) W.tiros.push({p:performance.now(), torre:e.torre, cano:e.cano, d, pan}); return t0(e,d,pan); };
  const st=AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start=function(w,...r){ if(this.buffer && this.buffer.duration>0.3 && !this.loop) W.starts.push({meu:!!A._prot, p:performance.now(), dq:(w||0)-ctx.currentTime, rate:this.playbackRate.value, buf:this.buffer.duration}); this.__meu=!!A._prot; return st.call(this,w,...r); };
  const sp=AudioBufferSourceNode.prototype.stop; AudioBufferSourceNode.prototype.stop=function(...a){ if(this.buffer && !this.loop && this.buffer.duration>0.3 && !a.length && this.__meu) W.stops++; return sp.apply(this,a); };
  const T=A.toca.bind(A); A.toca=(nome,o={})=>{ if(nome.startsWith('canhao') && A._prot) W.rot.push({nome, p:performance.now(), atraso:o.atraso, pan:o.pan, rate:o.rate, voz:o.voz, d:o.d}); return T(nome,o); };
  return JSON.stringify({ctx:W.ctx, estado:W.estado}) })()`);
// alvo inimigo à frente, para os arcos ficarem livres; dispara TODAS as torres
for (let k = 0; k < 3; k++) { await ev(`(()=>{ const S=__nns.S; for(const t of __nns.eu.torres) t.rec=0; S.comando({t:'canhao'}); return 1 })()`); await esp(6000); }
const r = JSON.parse(await ev(`(()=>{ const W=window.__som, A=__nns.audio; const rot=W.rot.filter(x=>x.atraso===false); const lat=[]; for(const s of W.starts.filter(x=>x.meu)){ const t=W.tiros.filter(x=>x.p<=s.p+0.01).pop(); if(t && s.p-t.p<50) lat.push(s.p-t.p + Math.max(0,s.dq)*1000); }
  const vozes=new Set(W.rot.map(x=>x.voz)); const pans=new Set(W.rot.map(x=>(+x.pan).toFixed(2))); const rates=new Set(W.rot.map(x=>(+x.rate).toFixed(3)));
  return JSON.stringify({ estado:A.ctx&&A.ctx.state, baseLatency:W.hint, outputLatency:W.out, tirosProprios:W.tiros.length, torres:new Set(W.tiros.map(x=>x.torre)).size, vozesCanhao:W.rot.length, semAtraso:rot.length, comAtraso:W.rot.length-rot.length, vozesDistintas:vozes.size, pansDistintos:pans.size, ratesDistintos:rates.size, latPlataformaMs:+(((W.hint||0)+(W.out||0))*1000).toFixed(1), latMaxMs:lat.length?+Math.max(...lat).toFixed(2):null, latMedMs:lat.length?+(lat.reduce((a,b)=>a+b,0)/lat.length).toFixed(2):null, dqMax:W.starts.some(s=>s.meu)?+Math.max(...W.starts.filter(s=>s.meu).map(s=>s.dq)).toFixed(4):null, cortadasProprias:W.stops, roubadasOutras:A.roubadas||0, descartadas:A.descartadas||0, vozesMax:A.vozesMax||0, limitador:W.lim, limTh:W.limTh }) })()`));
// fonte DISTANTE (inimigo a 3430 m) continua com atraso físico ~10 s
r.distante = JSON.parse(await ev(`(()=>{ const A=__nns.audio, c=A.ctx; let dq=null; const st=AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start=function(w,...x){ dq=(w||0)-c.currentTime; AudioBufferSourceNode.prototype.start=st; return st.call(this,w,...x); }; const qq=A.vozes; A.salvaTorres('canhao_longe',[{d:3430,pan:0.3,cal:127,torre:25,cano:3}],false,1); return JSON.stringify({atrasoS: dq==null?null:+dq.toFixed(2), vozes:qq, ligado:A.ligado, buf:!!A.buf.canhao_longe}) })()`));
console.log(JSON.stringify(r, null, 1));
if (!(r.tirosProprios > 1)) falhas.push('sem tiros próprios');
if (r.comAtraso > 0) falhas.push('tiro próprio com atraso de distância');
if (r.latMaxMs == null || r.latMaxMs > 30) falhas.push('latência > 30 ms: ' + r.latMaxMs);
if (r.vozesCanhao < r.tirosProprios * 0.9) falhas.push(`vozes ${r.vozesCanhao} < tiros ${r.tirosProprios}`);
if (r.cortadasProprias > 0) falhas.push('voz própria cortada');
if (r.torres > 1 && r.pansDistintos < 2) falhas.push('sem pan por torre');
if (r.torres > 1 && r.ratesDistintos < 2) falhas.push('sem variação de pitch');
if (!r.limitador) falhas.push('sem limitador');
if (!(r.distante.atrasoS > 9)) falhas.push('fonte distante sem atraso físico');
console.log('falhas', falhas.length, falhas.join(' | ')); fs.appendFileSync('/workspace/som1216.log', new Date().toISOString() + ' ' + JSON.stringify(r) + ' falhas ' + falhas.length + ' ' + falhas.join('|') + '\n');
b.fecha(); process.exit(falhas.length ? 1 : 0);
