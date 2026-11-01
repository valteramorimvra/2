// v1.2.15 — som por DISTÂNCIA: nível, corte (agudos), atraso e eco a 0,5 / 3 / 10 km e na câmera do míssil (d≈0). Render offline (OfflineAudioContext) da MESMA cadeia do jogo.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const b = await abre('http://127.0.0.1:4173/?auto', { w: 640, h: 288 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'duelo', classe: 'destroier', seed: 3, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000);
const r = await ev(`(async()=>{ const A=__nns.audio; const out={}; const casos=[['camMissil',0],['0.5km',500],['3km',3000],['10km',10000]];
  for (const [nm,d] of casos) for (const som of ['explosao_grande','canhao','foguete']) { const sr=22050, dur=34; const oc=new OfflineAudioContext(1, sr*dur, sr); const c0=A.ctx, m0=A.mestre, v0=A.vozes, lg=A.ligado, u0=A._ultSom, uc=A._ultCam; A.ctx=oc; A.mestre=oc.createGain(); A.mestre.connect(oc.destination); A.vozes=0; A.ligado=true; A._ultSom={}; A._ultCam={};
      Object.defineProperty(oc,'state',{value:'running'}); if (!A.ruido) {} try { if (som==='explosao_grande') A.toca('explosao_grande',{d,vol:1}); else A.camada(som,{d,vol:1,k:127}); } catch(e){ out.err=String(e); } const rota=A.ultimaRota; A.ctx=c0; A.mestre=m0; A.vozes=v0; A.ligado=lg; A._ultSom=u0; A._ultCam=uc;
      const buf=await oc.startRendering(); const x=buf.getChannelData(0); let pk=0; for (const v of x) pk=Math.max(pk,Math.abs(v)); let on=-1; for (let i=0;i<x.length;i++) if (Math.abs(x[i])>pk*0.05){on=i;break;} let e=0,eh=0; for (let i=1;i<x.length;i++){ e+=x[i]*x[i]; const df=x[i]-x[i-1]; eh+=df*df; }
      out[nm+'/'+som]={ pico_dB:+(20*Math.log10(pk+1e-9)).toFixed(1), rms_dB:+(10*Math.log10(e/x.length+1e-12)).toFixed(1), agudos:+(eh/(e+1e-12)).toFixed(4), atraso_s:+(on/sr).toFixed(2), rota }; }
  return JSON.stringify(out) })()`, 240000);
const o = JSON.parse(r); const L = Object.entries(o).map(([k, v]) => `${k}: ${JSON.stringify(v)}`); console.log(L.join('\n'));
const g = (k) => o[k]; let ok = true; const chk = (c, m) => { if (!c) { ok = false; console.log('FALHA ' + m); } };
for (const s of ['explosao_grande', 'canhao', 'foguete']) { const a = g('camMissil/' + s), p = g('0.5km/' + s), m = g('3km/' + s), l = g('10km/' + s);
  chk(a.rms_dB > p.rms_dB && p.rms_dB > m.rms_dB, s + ' nível não cai com a distância'); chk(a.agudos >= p.agudos * 0.85 && p.agudos > m.agudos && m.agudos > l.agudos, s + ' agudos não caem'); chk(l.rms_dB > -110, s + ' inaudível a 10 km');
  chk(Math.abs(p.atraso_s - a.atraso_s - 500 / 343) < 0.25 && Math.abs(m.atraso_s - a.atraso_s - 3000 / 343) < 0.4 && Math.abs(l.atraso_s - a.atraso_s - 15) < 0.5, s + ' atraso errado'); chk(m.rota.eco > 0 && !(p.rota.eco > 0), s + ' eco'); }
console.log('audio1215', ok ? 'OK' : 'FALHA', 'erros', JSON.stringify(b.erros.slice(0, 3))); fs.writeFileSync('/workspace/audio1215.log', L.join('\n') + '\n' + (ok ? 'OK' : 'FALHA') + '\n'); b.fecha(); process.exit(ok ? 0 : 1);
