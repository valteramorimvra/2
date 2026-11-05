// v1.2.16 item 27: afundamento realista do navio do jogador -> cinema -> tela de resultado. 0 programas novos.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1216/afundamento'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = { amostras: [] };
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'atois' }); return 1 })()`);
for (let i = 0; i < 120; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 90)`)) break; await esp(500); }
await esp(3000); R.prog0 = await ev(`__nns.R.info.programs.length`);
await ev(`(()=>{ const J=__nns, s=J.S.sim; J._secQ=[]; const o=s.passo.bind(s); s.passo=function(...a){ const r=o(...a); for(const e of s.eventos) if(e.t==='secundaria'&&e.id===J.eu.id) J._secQ.push(e.peq?'p':'G'); return r; }; s.dano(J.eu, 1e7, null, 'missil', true); return 1 })()`);
const fotos = [[1.5, 'a-explosao'], [4.5, 'b-fogo-adorno'], [8, 'c-casco-cobrindo'], [11.5, 'd-bolhas-oleo']]; let fi = 0;
for (let i = 0; i < 400; i++) {
  const a = JSON.parse(await ev(`(()=>{ const J=__nns, n=J.eu; return JSON.stringify({ t:+(n.tMorto||0).toFixed(1), prof:+((n.afunda&&n.afunda.prof)||0).toFixed(1), F:n.C&&n.C.F, lista:+(n.lista||0).toFixed(2), trim:+(n.trimDano||0).toFixed(2), cine:!!(J.cine&&J.cine.on), corte:J.cine&&J.cine.corte&&J.cine.corte.tipo||'', sec:J._secQ.join(''), res:!!document.querySelector('.rs'), conv:!document.querySelector('[data-r=convite]').hidden, motivo:(document.querySelector('.rs')||{}).textContent?.slice(0,140)||'' }) })()`));
  R.amostras.push(a); if (fi < fotos.length && a.t >= fotos[fi][0]) { await b.foto(DIR + '/' + fotos[fi][1] + '.png'); fi++; }
  if (a.conv && !R.espec) { await b.foto(DIR + '/e-convite-espectador.png'); R.tConvite = a.t; R.espec = {};
    await ev(`(()=>{ document.querySelector('[data-r=cv_sim]').click(); return 1 })()`); await esp(2500); await b.foto(DIR + '/f-espectador.png');
    const est = `JSON.stringify({ modo: __nns.mem.espectador, alvo: __nns.alvoCamera().id, eu: __nns.eu.id, timeOk: __nns.alvoCamera().time === __nns.eu.time, nome: document.querySelector('[data-r=es_nome]').textContent, info: document.querySelector('[data-r=es_info]').textContent, armasOcultas: getComputedStyle(document.querySelector('.h-armas')).display === 'none', barra: !document.querySelector('[data-r=espec]').hidden })`;
    R.espec.a = JSON.parse(await ev(est)); await ev(`(()=>{ document.querySelector('[data-r=es_prox]').click(); return 1 })()`); await esp(1500); R.espec.b = JSON.parse(await ev(est));
    await ev(`(()=>{ document.querySelector('[data-r=es_ant]').click(); return 1 })()`); await esp(800); R.espec.c = JSON.parse(await ev(est));
    await ev(`(()=>{ document.querySelector('[data-r=ec_bino]').click(); return 1 })()`); await esp(2500); await b.foto(DIR + '/g-espectador-optica.png'); R.espec.bino = await ev(`__nns.bino`); await ev(`(()=>{ document.querySelector('[data-r=ec_bino]').click(); document.querySelector('[data-r=ec_cine]').click(); return 1 })()`); await esp(2500); R.espec.cine = await ev(`__nns.cine.on`); await b.foto(DIR + '/h-espectador-cinema.png'); await ev(`(()=>{ document.querySelector('[data-r=ec_cine]').click(); return 1 })()`);
    await ev(`(()=>{ const J=__nns; const n=J.alvoCamera(); J._mortoObs=n.id; J.S.sim.dano(n, 1e7, null, 'missil', true); return 1 })()`); await esp(3000); R.espec.d = JSON.parse(await ev(est)); R.espec.mortoObs = await ev(`__nns._mortoObs`);
    R.espec.sobre = JSON.parse(await ev(`(()=>{ const L=[...document.querySelectorAll('.hud button, .hud [data-a]')].filter(e=>{const q=e.getBoundingClientRect(); const cs=getComputedStyle(e); return q.width>0&&q.height>0&&cs.visibility!=='hidden'&&!e.closest('[hidden]')&&e.offsetParent}); const o=[]; for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ if (L[i].contains(L[j])||L[j].contains(L[i])) continue; const a=L[i].getBoundingClientRect(), c=L[j].getBoundingClientRect(); if(a.left<c.right-0.5&&c.left<a.right-0.5&&a.top<c.bottom-0.5&&c.top<a.bottom-0.5) o.push((L[i].dataset.r||L[i].dataset.a||L[i].textContent.trim().slice(0,10))+'×'+(L[j].dataset.r||L[j].dataset.a||L[j].textContent.trim().slice(0,10))); } return JSON.stringify(o) })()`));
    await ev(`(()=>{ document.querySelector('[data-r=ec_sair]').click(); return 1 })()`); }
  if (a.res) { await esp(1500); await b.foto(DIR + '/i-resultado.png'); break; } await esp(400);
}
R.prog1 = await ev(`__nns.R ? __nns.R.info.programs.length : -1`).catch(() => -1);
const am = R.amostras, ul = am[am.length - 1], pre = am.filter(x => !x.res).pop() || ul;
R.resumo = { cortes:[...new Set(am.map(x=>x.corte))].join(','), secundarias: ul.sec, profMax: pre.prof, F: pre.F, listaMax: Math.max(...am.map(x => Math.abs(x.lista))), trimMax: Math.max(...am.map(x => Math.abs(x.trim))), cineAlgum: am.some(x => x.cine), tResultado: pre.t, resultado: ul.res, motivo: ul.motivo };
if (!/p/.test(ul.sec)) falhas.push('sem pequenas explosões secundárias'); if (!R.resumo.cineAlgum) falhas.push('câmera cinema não entrou');
if (!(pre.prof > (pre.F || 5))) falhas.push('água não cobriu o casco: prof ' + pre.prof); if (R.resumo.listaMax < 0.08) falhas.push('sem adorno');
if (!ul.res) falhas.push('tela de resultado não apareceu'); else if (!/afund/i.test(ul.motivo)) falhas.push('motivo sem afundamento: ' + ul.motivo);
if (!R.tConvite || R.tConvite < 8 || R.tConvite > 16) falhas.push('convite fora de 8–15 s: ' + R.tConvite);
const E2 = R.espec || {}; if (!E2.a || E2.a.modo !== 2 || E2.a.alvo === E2.a.eu || !E2.a.timeOk || !E2.a.barra || !E2.a.armasOcultas || !E2.a.nome) falhas.push('espectador ' + JSON.stringify(E2.a));
if (!E2.b || E2.b.alvo === E2.a.alvo) falhas.push('▶ não trocou'); if (!E2.c || E2.c.alvo !== E2.a.alvo) falhas.push('◀ não voltou'); if (!E2.bino) falhas.push('óptica no espectador'); if (!E2.cine) falhas.push('cinema no espectador');
if (!E2.d || E2.d.alvo === E2.mortoObs || !E2.d.timeOk) falhas.push('não trocou sozinho após afundar o observado'); if ((E2.sobre || []).length) falhas.push('sobreposição ' + E2.sobre.join(','));
if (R.prog1 > R.prog0 && R.prog1 !== -1) falhas.push(`programas novos: ${R.prog0}->${R.prog1}`);
delete R.amostras; R.amostrasN = am.length; console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join(' | ')); await b.fecha(); process.exit(falhas.length ? 1 : 0);
