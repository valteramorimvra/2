// v1.2.17 item 9 — música de combate com INTENSIDADE DINÂMICA: sobe em combate, desce na calmaria, respeita música desligada e o estilo (atual/ação)
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ document.body.dispatchEvent(new PointerEvent('pointerup',{bubbles:true})); document.body.click(); return 1 })()`);
await ev(`(()=>{ __nnsUI.zarpar({ modo:'duelo', classe:'destroier', mapa:'atois', seed: 5 }); return 1 })()`);
for (let i = 0; i < 160; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await ev(`(()=>{ __nns.tutorial=false; const A=__nnsUI.audio; if (A.ctx && A.ctx.state!=='running') A.ctx.resume(); return 1 })()`); await esp(1500);
const est = `JSON.stringify({ i: +__nnsUI.audio.intens.toFixed(3), g: __nnsUI.audio.musCam ? +__nnsUI.audio.musCam.gain.value.toFixed(3) : -1, pres: __nnsUI.audio.musPres ? +__nnsUI.audio.musPres.gain.value.toFixed(2) : -1, faixa: __nnsUI.audio.faixa, tocando: !!(__nnsUI.audio.musica && !__nnsUI.audio.musica.paused), ctx: __nnsUI.audio.ctx && __nnsUI.audio.ctx.state, on: __nnsUI.audio.musicaOn, estilo: __nnsUI.audio.estiloMus, bat: __nnsUI.audio._bat||0 })`;
// calmaria: inimigos longe
await ev(`(()=>{ const s=__nns.S.sim, e=__nns.eu; for (const o of s.navios) if (o.time!==e.time) { o.x=e.x+30000; o.z=e.z; o.v=0; } return 1 })()`); await esp(12000); R.calmo = JSON.parse(await ev(est));
// combate: inimigo a 3 km, alerta de míssil e dano sofrido
await ev(`(()=>{ const s=__nns.S.sim, e=__nns.eu; const o=s.navios.find(o=>o.time!==e.time&&!o.morto); o.x=e.x+3000; o.z=e.z; window.__al=setInterval(()=>{ e.alertaMissil=1; },100); e.vida-=50; return 1 })()`); await esp(9000); R.combate = JSON.parse(await ev(est));
if (!(R.combate.i > R.calmo.i + 0.3)) falhas.push('intensidade não subiu'); if (!(R.combate.g > 0.05)) falhas.push('camada sem ganho'); if (!(R.combate.bat > 4)) falhas.push('sem batidas');
// estilo AÇÃO
await ev(`(()=>{ __nnsUI.audio.setEstiloMusica('acao'); return 1 })()`); await esp(4000); R.acao = JSON.parse(await ev(est)); if (R.acao.estilo !== 'acao' || !(R.acao.g > 0.05)) falhas.push('estilo ação ' + JSON.stringify(R.acao));
// v1.2.17 itens 28/28b: cada estilo toca o SEU arquivo (antes 'Ação' caía no arquivo atual) e ele carrega de fato
R.arq = {}; for (const [st, f] of [['epica', 'epica_batalha'], ['acao', 'acao_batalha'], ['atual', 'musica_batalha']]) { await ev(`(()=>{ __nnsUI.audio.setEstiloMusica('${st}'); return 1 })()`); await esp(5000);
  const r = JSON.parse(await ev(`(()=>{ const m=__nnsUI.audio.musica; return JSON.stringify({ src: m ? m.src.split('/').pop() : null, rs: m ? m.readyState : -1, err: m && m.error ? m.error.code : 0, dur: m ? +(m.duration||0).toFixed(1) : 0, loop: m ? m.loop : null }) })()`)); R.arq[st] = r;
  if (!r.src || !r.src.startsWith(f) || r.err || r.rs < 1) falhas.push(`estilo ${st} não carregou ${f}: ` + JSON.stringify(r)); }
await ev(`(()=>{ __nnsUI.audio.setEstiloMusica('atual'); return 1 })()`);
// música DESLIGADA: camada a 0 mesmo em combate
await ev(`(()=>{ __nnsUI.audio.setMusicaOn(false); return 1 })()`); await esp(4000); R.desligada = JSON.parse(await ev(est)); const bd = R.desligada.bat; await esp(3000); const bd2 = JSON.parse(await ev(est)).bat;
if (!(R.desligada.g < 0.02) || R.desligada.tocando || bd2 !== bd) falhas.push('tocou com música desligada ' + JSON.stringify(R.desligada) + ' ' + bd2);
await ev(`(()=>{ __nnsUI.audio.setMusicaOn(true); clearInterval(window.__al); return 1 })()`); await esp(3000); R.religada = JSON.parse(await ev(est));
// calmaria de novo: desce
await ev(`(()=>{ const s=__nns.S.sim, e=__nns.eu; e.alertaMissil=0; for (const o of s.navios) if (o.time!==e.time) { o.x=e.x+30000; o.z=e.z; } return __nns.S.sim.T })()`).then(async (T0) => { R.T0 = T0; for (let i = 0; i < 90; i++) { await esp(2000); if (await ev(`__nns.S.sim.T`) > T0 + 30) break; } R.T1 = await ev(`__nns.S.sim.T`); }); /* espera 30 s de TEMPO DE JOGO (headless roda ~2 qps) */ R.desce = JSON.parse(await ev(est)); if (!(R.desce.i < Math.max(R.combate.i, R.religada.i) - 0.35)) falhas.push('não desceu ' + JSON.stringify({ T0: R.T0, T1: R.T1, i: R.desce.i }));
R.erros = b.erros.slice(0, 3); console.log(JSON.stringify(R)); const lin = `musica1217 falhas ${falhas.length} ${falhas.join(' | ')}`; console.log(lin); fs.writeFileSync('/workspace/musica1217.out', JSON.stringify(R) + '\n' + lin + '\n'); b.fecha(); process.exit(0);
