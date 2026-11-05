// v1.2.16 item 29: histórico das últimas 25 batalhas (2 partidas curtas + limite 25 + telas sem sobreposição).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1216/historico'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ localStorage.removeItem('nns_historico_v1'); __nnsUI.TELAS.historico(); return 1 })()`); await esp(500); R.vazio = await ev(`!!document.querySelector('.hi-vazio')`); await b.foto(DIR + '/historico-vazio.png');
const partida = async (cfg, venc) => { await ev(`(()=>{ __nnsUI.zarpar(${JSON.stringify(cfg)}); return 1 })()`);
  for (let i = 0; i < 160; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 120)`)) break; await esp(500); }
  await ev(`(()=>{ const s=__nns.S.sim; const v=s.navios.find(q=>q.time==='vermelho'&&!q.C.mercante); s.dano(v,1e7,__nns.eu,'missil',true); __nns.eu.stats.tiros=(__nns.eu.stats.tiros||0)+4; __nns.eu.stats.acertos=(__nns.eu.stats.acertos||0)+3; s.fim={vencedor:'${venc}',motivo:'Teste de histórico',tempo:s.t}; return 1 })()`);
  for (let i = 0; i < 80; i++) { if (await ev(`!!document.querySelector('.rs')`)) break; await esp(500); } await esp(800); };
await partida({ modo: 'frota', classe: 'destroier', mapa: 'atois' }, 'azul');
R.n1 = JSON.parse(await ev(`JSON.stringify(JSON.parse(localStorage.getItem('nns_historico_v1')||'[]').map(h=>({res:h.resultado, n:h.navios.length, mapa:h.mapa, camo:h.navios[0].camo, eu:h.navios.filter(q=>q.eu).length, ger:h.geral})))`));
if (R.n1.length !== 1 || R.n1[0].res !== 'vitoria' || R.n1[0].n < 16 || !R.n1[0].camo || R.n1[0].eu !== 1 || R.n1[0].ger.afundados < 1) falhas.push('partida 1 ' + JSON.stringify(R.n1));
await ev(`(()=>{ const a=JSON.parse(localStorage.getItem('nns_historico_v1')); const b0=a[0]; for(let i=0;i<24;i++) a.push(Object.assign({},b0,{id:'fake'+i, quando:b0.quando-(i+1)*3600e3, resultado:i%3?'derrota':'empate'})); localStorage.setItem('nns_historico_v1', JSON.stringify(a)); return a.length })()`);
await partida({ modo: 'frota', classe: 'fragata', mapa: 'estreito' }, 'vermelho');
R.n2 = JSON.parse(await ev(`(()=>{ const a=JSON.parse(localStorage.getItem('nns_historico_v1')); return JSON.stringify({ n:a.length, primeiro:a[0].resultado, navio:a[0].navio, ultimoId:a[a.length-1].id, temFake23: a.some(h=>h.id==='fake23') }) })()`));
if (R.n2.n !== 25 || R.n2.primeiro !== 'derrota' || R.n2.temFake23) falhas.push('limite 25 ' + JSON.stringify(R.n2));
const sobre = `(()=>{ const L=[...document.querySelectorAll('#ui button, #ui [data-ir], #ui [data-a]')].filter(e=>{const q=e.getBoundingClientRect(); return q.width>0&&q.height>0&&e.offsetParent}); const o=[]; for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ if (L[i].contains(L[j])||L[j].contains(L[i])) continue; const a=L[i].getBoundingClientRect(), c=L[j].getBoundingClientRect(); if(a.left<c.right-0.5&&c.left<a.right-0.5&&a.top<c.bottom-0.5&&c.top<a.bottom-0.5) o.push(L[i].textContent.trim().slice(0,12)+'×'+L[j].textContent.trim().slice(0,12)); } return JSON.stringify(o) })()`;
await ev(`(()=>{ document.querySelector('[data-a=menu]').click(); return 1 })()`); await esp(1500); R.btnMenu = await ev(`!!document.querySelector('[data-ir=historico]')`); R.sobreInicio = JSON.parse(await ev(sobre)); await b.foto(DIR + '/menu-historico.png');
await ev(`(()=>{ document.querySelector('[data-ir=historico]').click(); return 1 })()`); await esp(800); R.itens = await ev(`document.querySelectorAll('.hi-it').length`); R.sobreLista = JSON.parse(await ev(sobre)); await b.foto(DIR + '/historico-lista.png');
await ev(`(()=>{ document.querySelector('.hi-it[data-i="1"]').click(); return 1 })()`); await esp(800); await b.foto(DIR + '/historico-detalhe.png');
R.det = JSON.parse(await ev(`JSON.stringify({ linhas: document.querySelectorAll('.hi-tab tr').length, geral: document.querySelectorAll('.hi-geral div').length, mvp: document.querySelectorAll('.hi-tab .mvp').length, camos: [...document.querySelectorAll('.hi-tab td:nth-child(2)')].slice(0,3).map(e=>e.textContent) })`)); R.sobreDet = JSON.parse(await ev(sobre));
await ev(`(()=>{ document.querySelector('.tela-historico').scrollTop=9999; return 1 })()`); await esp(500); await b.foto(DIR + '/historico-detalhe-rolado.png');
if (!R.vazio) falhas.push('tela vazia'); if (!R.btnMenu) falhas.push('sem botão no menu'); if (R.itens !== 25) falhas.push('itens ' + R.itens); if (R.det.linhas < 18 || R.det.geral < 9 || R.det.mvp !== 1) falhas.push('detalhe ' + JSON.stringify(R.det));
for (const k of ['sobreInicio', 'sobreLista', 'sobreDet']) if (R[k].length) falhas.push(k + ' ' + R[k].join(','));
console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join(' | ')); b.fecha(); process.exit(falhas.length ? 1 : 0);
