// v1.2.13 — capturas: proa sem água dentro (máscara on/off), projétil saindo, lançamento de míssil; programas WebGL; medição da música
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1213'; fs.mkdirSync(dir, { recursive: true }); const log = [];
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.dev=true; await __nnsUI.zarpar({ mapa: 'fiordes', modo: 'duelo', classe: process_CL, seed: 3, hora: 'dia', tempo: 'chuva' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`.replace('process_CL', JSON.stringify(process.env.CL || 'fenghuang')), 180000); await esp(2500);
const np = () => ev(`(__nns.R.info.programs||[]).length`); const p0 = await np();
const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S; for (let i=0;i<${s}*60;i++){ S.avanca(1/60); if (i%2===1) { j.processaEventos(); j.atualizaNavios(1/30, S.sim.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); S.sim.eventos.length=0; } } return 1 })()`, 180000);
await passos(4);
// câmera externa de PROA (atrás da torre de proa, olhando para a proa e o mar)
const camProa = `(()=>{ const j=__nns, n=j.eu; const t=n.P.torres[0]; const o={...j.local(n, -n.C.B*0.28, n.C.F+5.5, t.z+16)}; const a={...j.local(n, 0, n.C.F-1, -n.C.L*0.5)}; j.camTeste={ p:[o.x,o.y,o.z], a:[a.x,a.y,a.z], fov:62 }; return 1 })()`;
// mar agitado: força caturro de proa para baixo (pior caso)
await ev(camProa); await aquece(0.2); await esp(800);
await ev(`(()=>{ const D=__nns.amb.uM.uDim.value; window.__mk=1; __nns.amb._semMascara=1; for (const d of D) d.w=0; return 1 })()`);
// desliga a máscara só para a foto "antes"
await ev(`(()=>{ const A=__nns.amb; if (!A.__c0) { A.__c0=A.cascos.bind(A); A.cascos=(l,n)=>{ A.__c0(l,n); if (A._semMascara) for (const d of A.uM.uDim.value) d.w=0; }; } return 1 })()`); await aquece(0.1); await esp(900); await b.foto(`${dir}/0-proa-antes-sem-mascara.png`);
await ev(`(()=>{ __nns.amb._semMascara=0; return 1 })()`); await aquece(0.1); await esp(900); await b.foto(`${dir}/1-proa-sem-agua-dentro.png`);
// pixels "de mar" dentro do casco: compara as duas fotos na região do convés (feito fora, em python)
// projétil saindo: trava alvo à frente e dispara
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time && !e.C.mercante); window.__a=a.id; const br=n.rumo+0.35; a.x=n.x+Math.sin(br)*3500; a.z=n.z-Math.cos(br)*3500; a.v=0; j.S.comando({ t:'travar', alvo:a.id }); for (const t of n.torres) t.rec=0; window.__tiros=0; window.__gi=-1; const e0=S.evento.bind(S); S.evento=(x)=>{ if (x.t==='tiro' && x.id===n.id) { window.__tiros++; window.__gi=x.gi; } return e0(x); }; return 1 })()`);
await passos(2.5); await ev(`(()=>{ __nns.acao('fogo'); __nns.acao('fogoSolta'); return 1 })()`);
let ok = 0; for (let k = 0; k < 600 && !ok; k++) ok = await ev(`(()=>{ const j=__nns; j.S.avanca(1/60); j.processaEventos(); j.atualizaNavios(1/60, j.S.sim.t); j.atualizaProjeteis(1/60); j.fx.passo(1/60); j.S.sim.eventos.length=0; const g=j.S.sim.granadas[window.__gi]; return window.__tiros>0 && g && g.ativo && g.t>0.06 ? 1 : 0 })()`);
await ev(`(()=>{ const j=__nns, n=j.eu; const g=j.S.sim.granadas[window.__gi]; const v=Math.hypot(g.vx,g.vz); const ux=g.vx/v, uz=g.vz/v; j.pausado=1; const c=j.cam; c.position.set(g.x - ux*45 + uz*16, g.y+6, g.z - uz*45 - ux*16); c.lookAt(g.x+ux*10, g.y, g.z+uz*10); c.fov=55; c.updateProjectionMatrix(); j.atualizaProjeteis(0); j.R.render(j.cena, c); return 1 })()`); await esp(400); await b.foto(`${dir}/2-projetil-saindo.png`); await ev(`(()=>{ __nns.pausado=0; return 1 })()`); log.push('projétil: tiros ' + await ev('window.__tiros') + ' vivo ' + await ev(`(()=>{ const g=__nns.S.sim.granadas[window.__gi]; return g.ativo + ' t=' + g.t.toFixed(2) })()`));
// lançamento de míssil
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`); await passos(2);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const a=S.navios[window.__a]; const br=n.rumo+1.2; a.x=n.x+Math.sin(br)*6000; a.z=n.z-Math.cos(br)*6000; n.alvoId=a.id; j.S.comando({ t:'travar', alvo:a.id }); return 1 })()`); await ev(`(()=>{ const n=__nns.eu; n.incendio=0; return 1 })()`); await passos(7);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const a=S.navios[window.__a]; n.tVls=0; n.incendio=0; n.vida=n.C.vida; if (n.avaria) for (const k in n.avaria) if (typeof n.avaria[k]==="number") n.avaria[k]=1; n.miraSobre=1; n.mira.az=Math.atan2(a.x-n.x,-(a.z-n.z)); n.mira.dist=6000; n.trava=1; window.__k=S.lancaMissil(n, a.id, 1); window.__pr=JSON.stringify(S.prontidao(n,'vls')); const o={...j.local(n, n.C.B*3.2, n.C.F+14, n.C.L*0.25)}; const c={...j.local(n, 0, n.C.F+10, -n.C.L*0.1)}; j.camTeste={ p:[o.x,o.y,o.z], a:[c.x,c.y,c.z], fov:62 }; return 1 })()`);
for (let k = 0; k < 24; k++) await ev(`(()=>{ const j=__nns; j.S.avanca(1/60); j.processaEventos(); j.atualizaNavios(1/60, j.S.sim.t); j.atualizaProjeteis(1/60); j.fx.passo(1/60); j.S.sim.eventos.length=0; return 1 })()`);
await esp(250); await b.foto(`${dir}/3-lancamento-missil.png`); log.push('míssil lançado ' + await ev('window.__k') + ' ' + await ev('window.__pr'));
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`);
// música: RMS e corte no bus, com combate (duck) — antes (configuração 1.2.12 emulada) e depois
const mus = await ev(`(async()=>{ const A=__nns.audio; if (!A.ctx||!A.musGanho) return 'sem bus'; await A.ctx.resume(); const c=A.ctx; const an=c.createAnalyser(); an.fftSize=4096; A.musGanho.connect(an); const anC=c.createAnalyser(); anC.fftSize=4096; A.comp.connect(anC);
  const med=(x)=>{ const b=new Float32Array(x.fftSize); x.getFloatTimeDomainData(b); let s=0; for (const v of b) s+=v*v; return Math.sqrt(s/b.length); };
  const centro=(x)=>{ const f=new Float32Array(x.frequencyBinCount); x.getFloatFrequencyData(f); let a=0,w=0,tot=0; const p=f.map(v=>Math.pow(10,v/10)); for (let i=0;i<p.length;i++) tot+=p[i]; let acc=0, roll=0; for (let i=0;i<p.length;i++){ acc+=p[i]; if (!roll && acc>=tot*0.85) roll=i*c.sampleRate/x.fftSize; a+=p[i]*i; w+=p[i]; } return [Math.round(a/w*c.sampleRate/x.fftSize), Math.round(roll)]; };
  const amostra=async(seg, comb=1)=>{ let rm=0,rc=0,k=0,cen=[0,0],dmin=1; const t0=performance.now(); while(performance.now()-t0<seg*1000){ if (comb && (k%4===0)) A.camada('explosao',{d:80,vol:1,k:1}); if (comb) A.camada('canhao',{d:0,vol:1,k:130}); await new Promise(r=>setTimeout(r,180)); rm+=med(an)**2; rc+=med(anC)**2; const q=centro(an); cen[0]+=q[0]; cen[1]+=q[1]; dmin=Math.min(dmin, A.musDuck.gain.value); k++; } const db=(v)=>(20*Math.log10(Math.sqrt(v/k)+1e-9)).toFixed(1); return { musica_dB: db(rm), combate_dB: db(rc), centroide_Hz: Math.round(cen[0]/k), rolloff85_Hz: Math.round(cen[1]/k), duck_min_dB: (20*Math.log10(dmin)).toFixed(1), lp_Hz: Math.round(A.musLP.frequency.value) }; };
  const depois = await amostra(6), depoisCalmo = await amostra(4, 0);
  // ANTES (1.2.12): música fora do grafo a 0,6·vol (sem EQ, sem duck) — emulado aqui com EQ plano e ganho 0,6·vol
  const eq=[A.musEntrada, A.musEntrada._p]; const g0=A.musGanho.gain.value; A.musEntrada.gain.value=0; A.musPres.gain.value=0; const pr=A.musEntrada; let n2=null; try { n2 = A.musLP; } catch(e){} A.musGanho.gain.value=A.volMusica*0.6; A._semDuck=A.duck; A.duck=()=>{}; A.musDuck.gain.cancelScheduledValues(c.currentTime); A.musDuck.gain.value=1; const prs=[]; 
  const antes = await amostra(6), antesCalmo = await amostra(4, 0); A.duck=A._semDuck; A.musEntrada.gain.value=-2; A.musPres.gain.value=2.5; A.musGanho.gain.value=g0;
  return JSON.stringify({ depois, depoisCalmo, antes_emulado: antes, antesCalmo, musPaused: A.musica ? A.musica.paused : 'sem musica', wa: A.musica && A.musica._wa }); })()`, 60000);
log.push('música ' + mus);
const p1 = await np(); log.push(`programas WebGL: inicio ${p0} fim ${p1} novos ${p1 - p0}`); log.push('erros ' + JSON.stringify(b.erros.slice(0, 5)));
console.log(log.join('\n')); fs.writeFileSync(`${dir}/log.txt`, log.join('\n')); b.fecha(); process.exit(0);
