// v1.2.22 itens 1+2 — PARTIDA REAL (Chrome headless, dist): (a) ao ser atingido toca a camada de LOCAL certa para cada zona (proa, popa, ponte, torre,
// linha d'água, mastro/chaminé, máquinas, paiol) e arma (canhão 40/155, foguete, míssil, torpedo), no navio do jogador e num inimigo;
// (b) 0 nós de áudio criados durante o combate (impactos + disparos por calibre); (c) saída REAL do mestre (depois do teto) sem clipar.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto'; const falhas = [], R = {};
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__NOS={medindo:false,n:0,t:{}}; (()=>{ const W=window.__NOS, P=BaseAudioContext.prototype; for (const k of Object.getOwnPropertyNames(P)) { if(!/^create/.test(k)||typeof P[k]!=='function'||k==='createPeriodicWave') continue; const o=P[k]; P[k]=function(...a){ if(W.medindo){W.n++;W.t[k]=(W.t[k]||0)+1;} return o.apply(this,a); }; } for (const C of ['AudioBufferSourceNode','GainNode','BiquadFilterNode','StereoPannerNode','PannerNode','OscillatorNode','AudioWorkletNode','ConvolverNode','DynamicsCompressorNode','WaveShaperNode']) { const O=window[C]; if(!O) continue; window[C]=new Proxy(O,{construct(t,a){ if(W.medindo){W.n++;W.t[C]=(W.t[C]||0)+1;} return Reflect.construct(t,a); }}); } })();` });
await b.vai(URL);
for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ const A=__nnsUI.audio; try{A.setMusicaOn(false); A.paraMusica();}catch(e){} await A.iniciar(); return 1 })()`, 200000);
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
for (let i = 0; i < 80; i++) { if (await ev(`(()=>{const A=__nns.audio; return !!A.mix && !!A.mix.ids && A.mix.ids['cam:impZ:linha:p']!=null && A.ctx.state==='running'})()`)) break; await esp(500); }
R.mixOk = await ev(`(()=>{const A=__nns.audio; return { estado: A.ctx.state, caminho: A.diag && A.diag.caminho, zonasNoPool: Object.keys(A.mix.ids||{}).filter(k=>k.startsWith('cam:impZ:')||k.startsWith('cam:impRang')).length } })()`);
if (!(R.mixOk.zonasNoPool >= 18)) falhas.push('pool sem as 18 camadas de local/rangido: ' + JSON.stringify(R.mixOk));
await esp(2500);
/* TAP na saída final (depois do teto): pico real por bloco */
await ev(`(()=>{ const A=__nns.audio, c=A.ctx, src=A.teto||A.lim; const sp=c.createScriptProcessor(2048,2,1); src.connect(sp); sp.connect(c.destination); window.__pk={max:0,clip:0}; sp.onaudioprocess=(e)=>{ for(let k=0;k<2;k++){ const a=e.inputBuffer.getChannelData(k); for(let i=0;i<a.length;i++){ const v=Math.abs(a[i]); if(v>__pk.max) __pk.max=v; if(v>=0.999) __pk.clip++; } } }; window.__sp=sp; return 1 })()`);
await ev(`(()=>{ const N=__nns, A=N.audio; window.__z=[]; const o=A.atingidoLocal.bind(A); A.atingidoLocal=(arma,cal,zona,d,pan,proprio,vol)=>{ const r=o(arma,cal,zona,d,pan,proprio,vol); window.__z.push({arma,cal,zona,d:+(+d).toFixed(0),proprio:!!proprio,nome:r,at:A.ultZona&&A.ultZona.at}); return r; }; return 1 })()`);
await ev(`(()=>{ const NOS=window.__NOS; NOS.n=0; NOS.t={}; NOS.medindo=true; window.__pk.max=0; window.__pk.clip=0; return 1 })()`);
/* varredura de pontos locais (x boreste, y acima d'água, z popa) até achar todas as zonas, no navio do JOGADOR e no INIMIGO (a ~1 km) */
const ARMAS = [['canhao', 40], ['canhao', 155], ['foguete', 0], ['missil', 0]];
for (const alvo of ['eu', 'ini']) { await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); al.x=eu.x+900; al.z=eu.z; al.v=0; return 1 })()`);
  const pts = JSON.parse(await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); const n=${alvo === 'eu' ? 'eu' : 'al'}; const C=n.C, P=n.P||{}; const out=[]; for (const fz of [-0.45,-0.3,-0.15,-0.05,0.05,0.15,0.3,0.45]) for (const ly of [-1, 1, 3, (C.F||6)+1, (C.F||6)+4, (C.F||6)+9, (C.F||6)+15]) out.push({ lx: 0, ly, lz: fz*C.L }); (P.celulas||[]).slice(0,1).forEach(c=>out.push({lx:c.x||0, ly:(C.F||6)+0.5, lz:c.z})); (n.torres||[]).slice(0,1).forEach(t=>{ if (Number.isFinite(t.z)) out.push({lx:t.x||0, ly:(C.F||6)+1.5, lz:t.z}); }); return JSON.stringify(out) })()`));
  for (const [arma, cal] of ARMAS) for (const p of pts) { await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); const n=${alvo === 'eu' ? 'eu' : 'al'}; n.vida=n.C.vida; const c=Math.cos(n.rumo), s=Math.sin(n.rumo); const p=${JSON.stringify(p)}; const x=n.x+p.lx*c-p.lz*s, z=n.z+p.lx*s+p.lz*c;
      S.evento({ t:'impacto', tipo:'${arma}', cal:${cal || 127}, x, y:p.ly, z, lx:p.lx, ly:p.ly, lz:p.lz, alvo:S.navios.indexOf(n), dono:S.navios.indexOf(${alvo === 'eu' ? 'al' : 'eu'}), dano:1, apl:1 }); return 1 })()`); await esp(60); }
  await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); const n=${alvo === 'eu' ? 'eu' : 'al'}; n.vida=n.C.vida; S.evento({ t:'torpImpacto', x:n.x+5, z:n.z, alvo:S.navios.indexOf(n), dono:S.navios.indexOf(${alvo === 'eu' ? 'al' : 'eu'}), dano:1, apl:1 }); return 1 })()`); await esp(1500); }
/* disparos do jogador por calibre (salva + camada), no mesmo período de medição de nós */
await ev(`(()=>{ const A=__nns.audio; window.__cal=[]; for (const [i,k] of [20,40,76,127,155,203,305].entries()) setTimeout(()=>{ A.camada('canhao',{d:40,pan:0,vol:1.15,k}); if (A.salvaTorres) try{ A.salvaTorres(k>100?'canhao_grande':'canhao_medio', [{d:40,pan:0,cal:k,torre:0,cano:0},{d:41,pan:0,cal:k,torre:1,cano:0}], true, 1.4); }catch(e){ window.__cal.push(String(e)); } }, i*700); return 1 })()`);
await esp(7000); for (let i = 0; i < 10; i++) { await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; eu.vida=eu.C.vida; return 1 })()`); await esp(500); }
R.nos = JSON.parse(await ev(`JSON.stringify(window.__NOS)`)); await ev(`(window.__NOS.medindo=false,1)`);
R.pico = JSON.parse(await ev(`JSON.stringify(window.__pk)`)); R.erroSalva = JSON.parse(await ev(`JSON.stringify(window.__cal)`));
const Z = JSON.parse(await ev(`JSON.stringify(window.__z)`)); R.n = Z.length; R.porZona = {};
for (const q of Z) { const k = (q.proprio ? 'eu' : 'ini') + '|' + q.zona; const r = R.porZona[k] || (R.porZona[k] = { n: 0, armas: {}, tocou: 0, atMax: 0 }); r.n++; r.armas[q.arma + (q.cal || '')] = (r.armas[q.arma + (q.cal || '')] || 0) + 1; if (q.nome) r.tocou++; r.atMax = Math.max(r.atMax, q.at || 0); }
for (const alvo of ['eu', 'ini']) for (const z of ['proa', 'popa', 'ponte', 'torre', 'linha', 'mastro', 'maquinas', 'paiol']) { const r = R.porZona[alvo + '|' + z]; if (!r) falhas.push(`${alvo}: zona ${z} nunca atingida`); else if (!r.tocou) falhas.push(`${alvo}: zona ${z} sem som (${JSON.stringify(r)})`); }
if (!(R.porZona['eu|linha'] && R.porZona['eu|linha'].armas.torpedo)) falhas.push('torpedo no jogador não caiu na linha dagua');
const nosCombate = R.nos.n - (R.nos.t.createScriptProcessor || 0); if (nosCombate) falhas.push('nós de áudio criados em combate: ' + JSON.stringify(R.nos.t));
if (R.pico.clip) falhas.push('saída real clipou: ' + JSON.stringify(R.pico)); R.pico.max_dBFS = +(20 * Math.log10(R.pico.max + 1e-9)).toFixed(2);
if (R.erroSalva.length) falhas.push('erro na salva: ' + R.erroSalva[0]);
R.erros = b.erros; if (b.erros && b.erros.length) falhas.push('erros JS: ' + b.erros.slice(0, 3).join(' | ')); b.fecha();
R.falhas = falhas; fs.writeFileSync('/workspace/atingido1222.json', JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.mixOk)); console.log('impactos', R.n, 'nós', JSON.stringify(R.nos.t), 'pico', JSON.stringify(R.pico)); for (const [k, v] of Object.entries(R.porZona)) console.log(k, JSON.stringify(v));
console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); process.exit(falhas.length ? 1 : 0);
