// v1.2.25 item 7 — PASSAGEM de aeronave perto do jogador (Chrome headless, dist, mixer worklet): laço sintetizado rl:jato com Doppler físico,
// posicional (pan), 1/d + absorção do ar; mede: barramento (Ambiente) e slider Ambiente 0 % zera; 0 nós criados; pico da saída final sem clipar;
// taxa (Doppler) aproximando > 1 e afastando < 1; e no JOGO real (porta-aviões, LIBERAR) o render chama o laço 'jato' com o tipo novo.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto'; const falhas = [], R = {};
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__NOS={medindo:false,n:0,t:{}}; (()=>{ const W=window.__NOS, P=BaseAudioContext.prototype; for (const k of Object.getOwnPropertyNames(P)) { if(!/^create/.test(k)||typeof P[k]!=='function'||k==='createPeriodicWave') continue; const o=P[k]; P[k]=function(...a){ if(W.medindo){W.n++;W.t[k]=(W.t[k]||0)+1;} return o.apply(this,a); }; } })();` });
await b.vai(URL); for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ const A=__nnsUI.audio; try{A.setMusicaOn(false); A.paraMusica();}catch(e){} await A.iniciar(); return 1 })()`, 200000);
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'horizonte', modo:'frota', mapa:'atois', hora:'dia', tempo:'limpo', portaAvioes:'sim' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
for (let i = 0; i < 120; i++) { if (await ev(`(()=>{const A=__nns.audio; return A.ctx.state==='running' && !!(A.mixL && A.mixL.ids['rl:jato']!=null) })()`)) break; await esp(500); }
R.mixer = await ev(`(()=>{const A=__nns.audio; return { estado:A.ctx.state, rlJato: !!(A.mixL && A.mixL.ids['rl:jato']!=null), busLaco: A._busDe('rl:jato', true) } })()`);
if (!R.mixer.rlJato) falhas.push('rl:jato não registrado no mixer'); if (R.mixer.busLaco !== 0) falhas.push('rl:jato fora do barramento Ambiente: ' + R.mixer.busLaco);
await ev(`(()=>{ const A=__nns.audio, c=A.ctx, src=A.teto||A.lim; const mk=(n)=>{ const a=c.createAnalyser(); a.fftSize=2048; n.connect(a); return a; }; window.__an={ out: mk(src) }; for (const k of Object.keys(A.bus)) __an[k]=mk(A.bus[k]); window.__pk={max:0,clip:0}; window.__bp={}; const buf=new Float32Array(2048); window.__lePk=setInterval(()=>{ __an.out.getFloatTimeDomainData(buf); for (let i=0;i<buf.length;i++){ const v=Math.abs(buf[i]); if(v>__pk.max) __pk.max=v; if(v>=0.999) __pk.clip++; } for (const k of Object.keys(A.bus)) { __an[k].getFloatTimeDomainData(buf); let m=0; for (let i=0;i<buf.length;i++) m=Math.max(m,Math.abs(buf[i])); __bp[k]=Math.max(__bp[k]||0,m); } }, 15); return 1 })()`);
/* congela o combate, deixa os laços morrerem e mede a base */
await ev(`(()=>{ __nns.pausado=true; return 1 })()`); for (let i = 0; i < 6; i++) { await ev(`(()=>{ __nns.audio.limpaLacos(); return 1 })()`); await esp(800); }
await ev(`(()=>{ window.__bp={}; return 1 })()`); await esp(1200); R.base = JSON.parse(await ev(`JSON.stringify(window.__bp)`));
/* passagem sintética: caça a 200 m/s, 60 m de través, 8 s (−800 → +800 m), pelo MESMO caminho do render (lacoRuido 'jato') */
const passa = `(()=>{ const A=__nns.audio; window.__tx=[]; let t0=performance.now(); const id=setInterval(()=>{ const t=(performance.now()-t0)/1000; const x=-800+200*t, y=60, d=Math.hypot(x,y), vr=200*x/d; const pan=Math.max(-1,Math.min(1,x/(d+30))); A.lacoRuido('jatoTeste','jato',0.55/(1+d/260),pan,343/(343+vr),d); A.limpaLacos(); const L=A.laços.get('jatoTeste'); __tx.push({t:+t.toFixed(2),d:+d.toFixed(0),r:L?+L.r.toFixed(3):null,f:L?Math.round(L.f):null,v:L?+L.v.toFixed(3):null}); if(t>8){ clearInterval(id); A.lacoRuido('jatoTeste','jato',0,0,1,2000); } },16); return 1 })()`;
await ev(`(()=>{ const W=window.__NOS; W.n=0; W.t={}; W.medindo=true; window.__pk.max=0; window.__pk.clip=0; window.__bp={}; return 1 })()`);
await ev(passa); await esp(8600); R.passagem = JSON.parse(await ev(`JSON.stringify(window.__bp)`)); R.nos = JSON.parse(await ev(`JSON.stringify(window.__NOS)`)); R.pico = JSON.parse(await ev(`JSON.stringify(window.__pk)`));
const T = JSON.parse(await ev(`JSON.stringify(window.__tx)`)); const ap = T.filter((q) => q.t < 3 && q.r), af = T.filter((q) => q.t > 5 && q.r); R.doppler = { aproximando: ap.length ? ap[0].r : null, afastando: af.length ? af[af.length - 1].r : null, fcPerto: Math.max(...T.map((q) => q.f || 0)), fcLonge: T[0].f };
await ev(`(()=>{ window.__NOS.medindo=false; return 1 })()`); await esp(1500);
await ev(`(()=>{ __nns.audio.setBus({amb:0}); return 1 })()`); await esp(400); await ev(`(()=>{ window.__bp={}; return 1 })()`); await esp(100); await ev(passa); await esp(8600); R.ambZero = JSON.parse(await ev(`JSON.stringify(window.__bp)`)); await ev(`(()=>{ __nns.audio.setBus({amb:1}); return 1 })()`);
const bs = (k) => (R.base[k] || 0) * 1.5 + 0.01;
if (!(R.passagem.amb > bs('amb') && R.passagem.amb > 0.03)) falhas.push('passagem não soou no Ambiente ' + JSON.stringify(R.passagem) + ' base ' + JSON.stringify(R.base));
for (const k of ['canhao', 'lanc', 'imp']) if ((R.passagem[k] || 0) > bs(k)) falhas.push('passagem vazou para ' + k);
if (!(R.ambZero.amb < 0.002)) falhas.push('Ambiente 0 % não zerou a passagem ' + JSON.stringify(R.ambZero));
if (R.nos.n) falhas.push('nós criados: ' + JSON.stringify(R.nos.t)); if (R.pico.clip || R.pico.max >= 0.999) falhas.push('clipou ' + JSON.stringify(R.pico));
if (!(R.doppler.aproximando > 1.3 && R.doppler.afastando < 0.8)) falhas.push('Doppler ' + JSON.stringify(R.doppler));
/* JOGO real: libera a ala aérea, aproxima a câmera dos caças e confere que o render usa o laço novo */
await ev(`(()=>{ __nns.pausado=false; __nns.acao('heli'); window.__lj=[]; const A=__nns.audio, o=A.lacoRuido.bind(A); A.lacoRuido=(k,t,v,p,dp,d)=>{ if(k==='jato'&&v>0) __lj.push({t,v:+v.toFixed(3),dp:+dp.toFixed(3),d:Math.round(d)}); return o(k,t,v,p,dp,d); }; return 1 })()`);
for (let i = 0; i < 90; i++) { await esp(1000); const n = await ev(`window.__lj.length`); if (n > 30) break; }
const LJ = JSON.parse(await ev(`JSON.stringify(window.__lj.slice(-400))`)); R.jogo = { chamadas: LJ.length, tipos: [...new Set(LJ.map((q) => q.t))], dMin: LJ.length ? Math.min(...LJ.map((q) => q.d)) : null, dopMin: LJ.length ? Math.min(...LJ.map((q) => q.dp)) : null, dopMax: LJ.length ? Math.max(...LJ.map((q) => q.dp)) : null };
if (!R.jogo.chamadas) falhas.push('no jogo nenhum caça soou perto (5 km)'); else if (R.jogo.tipos.join() !== 'jato') falhas.push('jogo usou tipo ' + R.jogo.tipos);
R.falhas = falhas; fs.writeFileSync('/workspace/passagem1225.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log(falhas.length ? 'FALHOU: ' + falhas.join(' | ') : 'OK'); await b.fecha(); process.exit(0);
