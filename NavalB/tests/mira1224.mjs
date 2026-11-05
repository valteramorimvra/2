// v1.2.24 itens 3/5/6 (Chrome headless, dist): arco da mira DESLIGADO de fábrica (+ migração), AUTO-MIRA nunca dispara e só escolhe navio VISÍVEL na tela,
// toque no CANHÃO dispara na hora, TRAVA SEGUE O ALVO (retículo acompanha o navio travado com avanço) e as opções salvas no localStorage pela tela de Ajustes.
// Uso: URL=http://127.0.0.1:4173/ node --experimental-websocket tests/mira1224.mjs
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/'; const res = []; let falhas = 0; const R = {};
const ok = (c, m) => { res.push((c ? '✔ ' : '✘ ') + m); if (!c) falhas++; };
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
const pronto = async () => { for (let i = 0; i < 240; i++) { if (await ev(`!!window.__nnsUI && !document.querySelector('#boot')`)) return true; await ev(`(()=>{ const bt=document.querySelector('#boot'); if(bt){ bt.dispatchEvent(new Event('pointerdown')); bt.click(); } return 1 })()`); await esp(500); } return false; };
// 1) padrões de fábrica (save limpo) e migração de save antigo com o arco LIGADO
await b.vai(URL + '?limpa'); await pronto();
R.padrao = await ev(`(()=>{ const a=__nnsUI.save.ajustes; return { arcoPrev:a.arcoPrev, travaSegue:a.travaSegue, autoMira:a.autoMira } })()`);
ok(R.padrao.arcoPrev === false, 'arco da mira DESLIGADO de fábrica (' + R.padrao.arcoPrev + ')'); ok(R.padrao.travaSegue === true, 'TRAVA SEGUE O ALVO ligada de fábrica'); ok(R.padrao.autoMira === false, 'AUTO-MIRA desligada de fábrica');
await ev(`(()=>{ const s=JSON.parse(localStorage.getItem('nns_v1')); s.ajustes.arcoPrev=true; delete s.ajustes.arcoV1224; delete s.ajustes.travaSegue; localStorage.setItem('nns_v1', JSON.stringify(s)); return 1 })()`);
await b.vai(URL); await pronto();
R.migra = await ev(`(()=>{ const a=__nnsUI.save.ajustes, d=JSON.parse(localStorage.getItem('nns_v1')).ajustes; return { arco:a.arcoPrev, segue:a.travaSegue, disco:d.arcoPrev, v:d.arcoV1224 } })()`);
ok(R.migra.arco === false && R.migra.disco === false && R.migra.segue === true && R.migra.v === 1, 'save da 1.2.23 com arco ligado → migra para DESLIGADO (gravado) ' + JSON.stringify(R.migra));
// 2) Ajustes: liga o arco e desliga TRAVA SEGUE pelo checkbox → disco; recarrega → restaurado; volta
await ev(`(()=>{ __nnsUI.TELAS.ajustes(); return 1 })()`); await esp(700);
R.ui = await ev(`(async()=>{ const r={}; for (const [k,v] of [['arcoPrev',true],['travaSegue',false]]) { const i=document.querySelector('input[type=checkbox][data-k='+k+']'); if(!i){ r[k]='FALTA'; continue; } r[k+'_ini']=i.checked; i.checked=v; i.dispatchEvent(new Event('change',{bubbles:true})); } await new Promise(q=>setTimeout(q,300)); const d=JSON.parse(localStorage.getItem('nns_v1')).ajustes; r.disco={arcoPrev:d.arcoPrev, travaSegue:d.travaSegue}; return r })()`);
ok(R.ui.arcoPrev_ini === false && R.ui.travaSegue_ini === true && R.ui.disco.arcoPrev === true && R.ui.disco.travaSegue === false, 'Ajustes: checkboxes do arco e da TRAVA SEGUE gravam no localStorage ' + JSON.stringify(R.ui));
await b.vai(URL); await pronto(); await ev(`(()=>{ __nnsUI.TELAS.ajustes(); return 1 })()`); await esp(700);
R.rest = await ev(`(()=>({ arco: document.querySelector('input[data-k=arcoPrev]').checked, segue: document.querySelector('input[data-k=travaSegue]').checked }))()`);
ok(R.rest.arco === true && R.rest.segue === false, 'restaurado ao reabrir ' + JSON.stringify(R.rest));
await ev(`(()=>{ for (const [k,v] of [['arcoPrev',false],['travaSegue',true]]) { const i=document.querySelector('input[data-k='+k+']'); i.checked=v; i.dispatchEvent(new Event('change',{bubbles:true})); } return 1 })()`); await esp(300);
// 3) partida: inimigo parado a 4,5 km na tela
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='baixa'; await __nnsUI.zarpar({ mapa:'santos', modo:'frota', classe:'destroier', seed: 5, hora:'dia', tempo:'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000); await esp(2000);
ok(await ev(`!__nns.arcoPrev && !(__nns.arco && __nns.arco.visible)`) !== false, 'arco desligado na partida');
await ev(`(()=>{ const j=__nns, n=j.eu, S=j.S.sim; window.__tiros=[]; const ev0=S.evento.bind(S); S.evento=(e)=>{ if (e && (e.t==='tiro'||e.t==='tiroRbu'||e.t==='torpLanc') && e.id===n.id) __tiros.push({t:e.t, ms:performance.now()}); if (e && e.t==='faseMissil' && e.dono===n.id) __tiros.push({t:'missil', ms:performance.now()}); return ev0(e); }; n.v=0; n.telegrafo=0; j.S.comando({t:'telegrafo',v:0}); j.S.comando({t:'travar', alvo:-1}); n.autoFogo=false; const E=S.navios.filter(e=>e.time!==n.time && !e.morto); window.__m=E[0].id; E.forEach((e,i)=>{ const br=n.rumo+0.3+(i?Math.PI+i*0.3:0); e.x=n.x+Math.sin(br)*(i?9000:4500); e.z=n.z-Math.cos(br)*(i?9000:4500); e.v=0; e.telegrafo=0; e.controle=-2; }); window.__br=n.rumo+0.3; j.yawAlvo += (window.__br - j.marc) + 0.09; return 1 })()`);
await esp(1200);
const dif = (a, c) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c)));
// 4) AUTO-MIRA ligada, alvo na tela, AUTO-FOGO desligado → 0 tiros em 10 s e mira vai ao navio
await ev(`(()=>{ const q=document.querySelector('[data-a=automira]'); q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:9})); q.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9})); window.__tiros.length=0; const j=__nns; j.yawAlvo += (__br - j.yawAlvo) + 0.09; window.__e0 = Math.abs(Math.atan2(Math.sin(j.yawAlvo-__br), Math.cos(j.yawAlvo-__br))); return 1 })()`); /* mira deslocada ~5° do navio, ainda na tela */
const e0 = +(await ev('__e0')); await esp(10000);
R.am = JSON.parse(await ev(`JSON.stringify({ on: __nns.autoMira, sel: __nns._amSel, m: __m, tiros: __tiros.length, autoFogo: __nns.eu.autoFogo, err: Math.abs(Math.atan2(Math.sin(__nns.marc-__br), Math.cos(__nns.marc-__br))) })`));
ok(R.am.on === true && R.am.sel === R.am.m, `AUTO-MIRA escolhe o navio visível na tela (sel ${R.am.sel}, inimigo ${R.am.m})`);
ok(R.am.err < 0.02 && e0 > 0.05, `AUTO-MIRA leva o retículo ao navio (erro ${(e0 * 57.3).toFixed(1)}° → ${(R.am.err * 57.3).toFixed(2)}°)`);
ok(R.am.tiros === 0 && !R.am.autoFogo, `AUTO-MIRA NÃO dispara sozinha: ${R.am.tiros} tiro(s) em 10 s`);
// 5) alvo FORA da tela → não escolhe nem puxa a mira
await ev(`(()=>{ const j=__nns; j.yawAlvo += Math.PI*0.75; j.mem.tManual = 4; return 1 })()`); /* o jogador arrastou a mira para longe (como o dedo: tManual) */ await esp(5500); const y0 = +(await ev('__nns.yawAlvo')); await esp(3000); const y1 = +(await ev('__nns.yawAlvo'));
R.fora = { sel: await ev('__nns._amSel'), dy: dif(y0, y1) * 57.3 };
ok(R.fora.sel == null && R.fora.dy < 0.3, `navio FORA da tela: não seleciona nem procura fora do quadro (sel ${R.fora.sel}, Δ ${R.fora.dy.toFixed(2)}°)`);
await ev(`(()=>{ const j=__nns; j.yawAlvo += (__br - j.marc) + 0.03; return 1 })()`); await esp(2000); /* espera as torres chegarem e recarregarem (toque = disparo imediato com arma PRONTA) */ for (let i = 0; i < 40; i++) { if (await ev(`(()=>{ const n=__nns.eu; return n.torres.some(q=>!q.bloqueada && !q.girando && q.rec<=0.05) })()`)) break; await esp(500); } R.prontoAntesToque = await ev(`JSON.stringify(__nns.eu.torres.map(q=>({b:!!q.bloqueada,g:!!q.girando,r:+(q.rec||0).toFixed(2)})))`); console.log('torres antes do toque', R.prontoAntesToque);
// 6) toque no CANHÃO dispara na hora
await ev(`(()=>{ window.__tiros.length=0; const q=document.querySelector('[data-a=fogo]'); window.__t0=performance.now(); window.__s0=__nns.S.sim.t; window.__q0=__nns._nQuadros||0; const S=__nns.S.sim; if (!S.__h2) { S.__h2=1; const f=S.evento.bind(S); S.evento=(e)=>{ if (e && e.t==='tiro' && e.id===__nns.eu.id && window.__s1==null) window.__s1=S.t; return f(e); }; } window.__s1=null; q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:7})); q.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:7})); return 1 })()`); await esp(1500);
R.toque = JSON.parse(await ev(`JSON.stringify({ n: __tiros.filter(t=>t.t==='tiro').length, ms: __tiros.length ? Math.round(__tiros[0].ms-__t0) : null, simMs: window.__s1!=null ? Math.round((window.__s1-window.__s0)*1000) : null })`));
ok(R.toque.n >= 1 && R.toque.simMs != null && R.toque.simMs <= 150, `toque no CANHÃO dispara na hora (${R.toque.n} tiro(s); 1º após ${R.toque.simMs} ms de jogo / ${R.toque.ms} ms de relógio no Chrome headless por software)`);
// 7) TRAVA SEGUE: alvo andando 12 m/s de través; trava; retículo acompanha o avanço (s.px/pz)
await ev(`(()=>{ const q=document.querySelector('[data-a=automira]'); q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:9})); q.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:9})); const S=__nns.S.sim, a=S.navios[__m]; a.rumo=__br+Math.PI/2; a.v=12; a.telegrafo=4; return 1 })()`);
await ev(`(()=>{ __nns.acao('travar'); return 1 })()`);
for (let i = 0; i < 40; i++) { if (await ev(`__nns.eu.trava>=1 && !!(__nns.eu.sol && __nns.eu.sol.travado)`)) break; await esp(500); }
const medeSeg = async (seg) => { const v = []; for (let i = 0; i < seg * 4; i++) { await esp(250); v.push(JSON.parse(await ev(`(()=>{ const j=__nns, n=j.eu, s=n.sol, a=j.S.sim.navios[__m]; const bL = s ? Math.atan2(s.px-n.x, -(s.pz-n.z)) : null, bN=Math.atan2(a.x-n.x, -(a.z-n.z)); return JSON.stringify({ bN, bL, marc: j.marc, trav: n.trava>=1, eL: bL==null?null:Math.abs(Math.atan2(Math.sin(j.marc-bL),Math.cos(j.marc-bL))), eN: Math.abs(Math.atan2(Math.sin(j.marc-bN),Math.cos(j.marc-bN))), av: bL==null?null:Math.abs(Math.atan2(Math.sin(bL-bN),Math.cos(bL-bN))), am: j.autoMira, tiros: __tiros.length }) })()`))); } return v; };
await esp(1500); await ev(`window.__tiros.length=0`);
const S1 = await medeSeg(6); const tr1 = S1.filter((q) => q.trav && q.eL != null);
const bN0 = S1.find((q) => q.trav), bN1 = [...S1].reverse().find((q) => q.trav); R.segue = { bNav0: bN0 && bN0.bN, bNav1: bN1 && bN1.bN, marc0: bN0 && bN0.marc, marc1: bN1 && bN1.marc, amostras: tr1.length, eLmax: Math.max(...tr1.map((q) => q.eL)) * 57.3, avMed: tr1.reduce((s, q) => s + q.av, 0) / Math.max(1, tr1.length) * 57.3, tiros: S1[S1.length - 1].tiros, autoMira: S1[0].am };
R.segue.giroNavio = dif(R.segue.bNav0, R.segue.bNav1) * 57.3; R.segue.giroAvanco = dif(bN0.bL, bN1.bL) * 57.3; R.segue.giroMira = dif(R.segue.marc0, R.segue.marc1) * 57.3;
ok(R.segue.autoMira === false && tr1.length >= 12 && R.segue.eLmax < 0.35 && R.segue.avMed > 0.1 && R.segue.giroAvanco > 0.15 && R.segue.eLmax < 0.3 && R.segue.avMed > 0.1, `TRAVA SEGUE (AUTO-MIRA desligada): retículo acompanha o navio travado com avanço (ponto de avanço girou ${R.segue.giroAvanco.toFixed(2)}°, mira ${R.segue.giroMira.toFixed(2)}°, navio ${R.segue.giroNavio.toFixed(2)}°; erro máx ${R.segue.eLmax.toFixed(2)}° ao ponto de avanço; avanço médio ${R.segue.avMed.toFixed(2)}° à frente do navio; ${tr1.length} amostras)`);
ok(R.segue.tiros === 0, `travado e seguindo: não dispara sozinho (${R.segue.tiros} tiros)`);
// opção desligada → retículo fica parado
await ev(`(()=>{ __nns.travaSegue=false; return 1 })()`); const m0 = +(await ev('__nns.marc')); const S2 = await medeSeg(5); const m1 = +(await ev('__nns.marc'));
R.semSegue = { dMarc: dif(m0, m1) * 57.3, eNfim: S2[S2.length - 1].eN * 57.3, trav: S2[S2.length - 1].trav };
ok(R.semSegue.dMarc < 0.2, `TRAVA SEGUE desligada: retículo não acompanha (Δ ${R.semSegue.dMarc.toFixed(2)}°, navio já a ${R.semSegue.eNfim.toFixed(2)}°)`);
await ev(`(()=>{ __nns.travaSegue=true; return 1 })()`);
R.erros = b.erros.slice(0, 5); ok(!b.erros.length, 'sem exceções (' + b.erros.length + ')');
fs.writeFileSync('/workspace/mira1224.json', JSON.stringify(R, null, 1)); b.fecha(); console.log(res.join('\n')); console.log(`\n${res.length - falhas} passaram, ${falhas} falharam`); process.exit(falhas ? 1 : 0);
