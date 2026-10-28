// v1.2.3 — capturas de revisão: água, curva com adernamento e esteira, lançamento VLS, míssil em voo (câmera MÍSSIL), torpedo,
// impacto com número, inimigo em chamas e adernando, close do inimigo, resumo de fim de partida e Sala dos Troféus.
// Uso: node --experimental-websocket tests/cap123.mjs [20x9|16x9] [saida=/workspace/nexo-naval-shots/123]
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const fmt = process.argv[2] || '20x9'; const dir = process.argv[3] || '/workspace/nexo-naval-shots/123'; fs.mkdirSync(dir, { recursive: true });
const [W, H] = fmt === '16x9' ? [733, 412] : [915, 412];
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); const ev = b.ev, esp = b.espera; const log = [];
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const foto = async (n) => { await b.foto(`${dir}/${fmt}-${n}.png`); log.push('foto ' + n); };
const zarpa = async (o) => { await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.camModo='perto'; if (__nns && __nns.rodando) __nns.encerra(); await __nnsUI.zarpar(${JSON.stringify(o)}); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500); };
const corre = (s) => ev(`(()=>{ const g=__nns; for (let i=0;i<${s}*60;i++){ g.S.avanca(1/60); if (i%6===5) g.processaEventos(); } g.processaEventos(); return 1 })()`, 120000);
const congela = `(()=>{ const S=__nns.S; if (!S._av) { S._av = S.avanca; S.avanca = ()=>{}; } return 1 })()`, solta = `(()=>{ const S=__nns.S; if (S._av) { S.avanca = S._av; S._av = null; } for (const e of document.querySelectorAll('.dano-f')) e.style.animationPlayState=''; return 1 })()`;
const esperaNum = async () => { for (let i = 0; i < 40; i++) { const o = +(await ev(`Math.max(0, ...[...document.querySelectorAll('.dano-f')].filter(e=>e.textContent).map(e=>+getComputedStyle(e).opacity))`)); if (o > 0.85) { await ev(`(()=>{ for (const e of document.querySelectorAll('.dano-f')) e.style.animationPlayState='paused'; return 1 })()`); return o; } await esp(60); } return 0; };
const prep = (dist, rel) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo = 1; j.mem.revelaTudo = 1; const alvo = S.navios.find(e=>e.time!==n.time && !e.morto && e.C.tier===n.C.tier) || S.navios.find(e=>e.time!==n.time); for (const e of S.navios) if (e!==alvo && e!==n) { e.x += (e.time===n.time? -1 : 1) * 30000; } const br = n.rumo + ${rel}; alvo.x = n.x + Math.sin(br)*${dist}; alvo.z = n.z - Math.cos(br)*${dist}; alvo.telAlvo = 1; alvo.ciws = []; alvo.a30 = []; alvo.sam = 0; alvo.chaff = 0; alvo.papel='bot'; for (let k=0;k<30;k++) S.passo(); j.S.comando({t:'travar', alvo: alvo.id}); n.trava = 1; window.__alvo = alvo.id; j.yaw=j.yawAlvo=br + 0.25; j.pitch=j.pitchAlvo=0.1; return alvo.id })()`);
// 1) água (sol de fim de tarde, câmera ampla baixa)
await zarpa({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 5, hora: 'entardecer', tempo: 'limpo' });
await ev(`(()=>{ const j=__nns, n=j.eu; j.camModo='longe'; j.yaw=j.yawAlvo=n.rumo+2.3; j.pitch=j.pitchAlvo=0.08; return 1 })()`); await esp(1800); await foto('1-agua');
// 2) curva a toda força: adernamento + esteira + espuma de proa
await zarpa({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 5, hora: 'dia', tempo: 'limpo' });
await ev(`(()=>{ __nns.S.comando({t:'telegrafo',v:4}); return 1 })()`); await corre(25); await ev(`(()=>{ const n=__nns.eu; n.lemeCmd = 1; return 1 })()`); await corre(9);
const g2 = await ev(`(()=>{ const j=__nns, n=j.eu; j.camModo='perto'; j.yaw=j.yawAlvo=n.rumo+Math.PI*0.8; j.pitch=j.pitchAlvo=0.16; return JSON.stringify({ nos: +(Math.abs(n.v)*1.944).toFixed(1), adorno: +((n.adorno||0)*57.3).toFixed(1), deriva: +((n.deriva||0)*57.3).toFixed(1) }) })()`); log.push('2 curva ' + g2); await esp(1500); await foto('2-curva-adorno-esteira');
// 3) VLS + 4) míssil em voo (câmera MÍSSIL)
await zarpa({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }); await prep(7000, 1.2); await esp(1500);
const m3 = await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.ameacas.ligadas=0; n.alvoId=window.__alvo; n.trava=1; n.tVls=0; n.vls=Math.max(n.vls,4); n.avaria.vls=1; const ok = S.lancaMissil(n, window.__alvo, 1); j.yaw=j.yawAlvo=n.rumo+Math.PI*0.75; j.pitch=j.pitchAlvo=0.05; return ok ? 1 : 0 })()`); log.push('3 lançou ' + m3);
await corre(0.9); await esp(700); await foto('3-lancamento-vls');
await corre(4); await ev(`(()=>{ __nns.camModo='missil'; __nns.mem.trans=0; return 1 })()`); await esp(1500); await foto('4-missil-em-voo');
// 5) impacto com número grande
const m5 = await ev(`(()=>{ const j=__nns, S=j.S.sim; let imp=null; for (let k=0;k<60*60 && !imp;k++){ S.passo(); const e=S.eventos.find(e=>e.t==='impacto' && e.alvo===window.__alvo); if (e) imp=e; j.processaEventos(); } j.camModo='perto'; const a=S.navios[window.__alvo], n=j.eu; j.yaw=j.yawAlvo=Math.atan2(a.x-n.x, -(a.z-n.z)); j.pitch=j.pitchAlvo=0.04; j.atualizaCamera(1/60, S.t); return JSON.stringify(imp ? { dano: imp.dano } : null) })()`); await ev(congela); await esperaNum(); log.push('5 impacto ' + m5); await foto('5-impacto-numero'); await ev(solta);
// 6) torpedo na água
await prep(2200, 1.4); await esp(800);
await ev(`(()=>{ const j=__nns, n=j.eu; n.torp=Math.max(n.torp||0,2); n.tTorp=0; j.S.comando({t:'torpedo', alvo: window.__alvo}); return 1 })()`); await corre(5);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const tp=S.torpedos.find(t=>t.ativo); if (tp) { j.yaw=j.yawAlvo=Math.atan2(tp.x-n.x, -(tp.z-n.z)); j.pitch=j.pitchAlvo=0.22; } return 1 })()`); await esp(1300); await foto('6-torpedo');
// 7) inimigo em chamas e adernando + 8) close do inimigo (o alvo vem para 650 m)
const a7 = await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__alvo]; const br=n.rumo+1.4; a.x=n.x+Math.sin(br)*650; a.z=n.z-Math.cos(br)*650; a.telAlvo=0; a.v=0; a.vida=a.C.vida*0.3; a.incendio=40; a.alagamento=30; a.alagSide=1; a.aguaAbordo=0.8; a.lista=0.12;
  for (let q=0;q<4;q++) { const lz=(q-1.5)*a.C.L*0.22; const c=Math.cos(a.rumo), s=Math.sin(a.rumo); j.processaEventos.call(j); S.evento({ t:'impacto', x:a.x + (a.C.B*0.5)*c - lz*s, y:a.C.F*0.6, z:a.z + (a.C.B*0.5)*s + lz*c, alvo:a.id, dono:n.id, tipo:'missil', dano: 900 }); } j.processaEventos();
  for (let k=0;k<60*6;k++){ S.passo(); if (k%6===0) j.processaEventos(); } j.camModo='perto'; j.yaw=j.yawAlvo=br; j.pitch=j.pitchAlvo=0.05; return JSON.stringify({ lista: +(a.lista*57.3).toFixed(1), focos: j.navios[a.id].focos.length, marcas: j.navios[a.id].marcas.filter(m=>m.visible).length }) })()`);
log.push('7 inimigo avariado ' + a7); await esp(2500); await foto('7-inimigo-chamas-adernando');
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__alvo]; a.incendio=0; a.alagamento=0; a.lista=0; a.vida=a.C.vida; j.navios[a.id].focos.length=0; for (const m of j.navios[a.id].marcas) m.visible=false; const br=Math.atan2(a.x-n.x,-(a.z-n.z)); j.yaw=j.yawAlvo=br; j.pitch=j.pitchAlvo=0.03; j.bino=0; return 1 })()`); await esp(400); await ev(`(()=>{ __nns.acao && __nns.acao('bino'); return 1 })()`); await esp(2200); await foto('8-inimigo-close'); await ev(`(()=>{ if (__nns.bino) __nns.acao('bino'); return 1 })()`);
// 9) resumo de fim de partida
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=0; j.mem.revelaTudo=0; for (const e of S.navios) if (e.time!==n.time) S.dano(e, 1e6, n, Math.random()<0.5?'missil':'canhao'); S.dano(n, n.C.vida*0.2, S.navios.find(e=>e.time!==n.time), 'missil'); return 1 })()`); await corre(12);
for (let i = 0; i < 60; i++) { if (await ev(`document.querySelector('.rs') ? 1 : 0`)) break; await esp(200); } await esp(1200);
log.push('9 combate: ' + await ev(`(document.querySelector('.rs-combate')||{}).innerText||'sem caixa'`)); await foto('9-resumo-fim');
// 10) Sala dos Troféus
await ev(`__nnsUI.TELAS.trofeus(); 1`); await esp(1200); log.push('10 troféus: ' + await ev(`JSON.stringify([...document.querySelectorAll('.tf-grade b, .tf-grade h4, .tf-grade strong')].map(e=>e.textContent).slice(0,14))`)); await foto('10-sala-trofeus');
log.push('erros: ' + JSON.stringify(b.erros.slice(0, 5)));
console.log(log.join('\n')); fs.writeFileSync(`${dir}/${fmt}-log.txt`, log.join('\n') + '\n'); b.fecha(); process.exit(0);
