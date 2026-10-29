// v1.2.18 item 10: PRESETS da batalha personalizada numa lista PRÓPRIA do jogo — fluxo REAL de toque (CDP Input.dispatchTouchEvent):
// migração dos presets antigos (localStorage) para o save, salvar, carregar (toque no nome), renomear, excluir com confirmação (cancelar e confirmar),
// persistência após recarregar a página, nenhum botão cobrindo outro, ZARPAR com o preset carregado; item 11: ZARPAR bloqueado sem inimigo válido.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1218/presets'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {}; const ok = (c, m) => { if (!c) falhas.push(m); };
const carrega = async () => { await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); } };
const pos = async (sel, txt) => JSON.parse(await ev(`(()=>{ const L=[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>${txt ? `(e.closest('.pb-pr')||e).textContent.includes(${JSON.stringify(txt)})` : 'true'}); const e=L[0]; if(!e) return 'null'; e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); const x=r.left+r.width/2, y=r.top+r.height/2; const t=document.elementFromPoint(x,y); return JSON.stringify({x,y,coberto: !(t===e||e.contains(t))}) })()`));
const toca = async (sel, txt) => { const p = await pos(sel, txt); if (!p) { falhas.push(`toque: ${sel} ${txt || ''} não encontrado`); return false; } if (p.coberto) falhas.push(`toque: ${sel} ${txt || ''} coberto por outro elemento`);
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y, id: 1 }] }); await esp(70); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await esp(450); return true; };
const digita = async (sel, txt) => { await toca(sel); await ev(`(()=>{ const e=document.querySelector(${JSON.stringify(sel)}); e.focus(); e.select && e.select(); return 1 })()`); await b.send('Input.insertText', { text: txt }); await esp(150); };
const nomes = async () => JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('.pb-pr-nome b')].map(e=>e.textContent))`));
const salvos = async () => JSON.parse(await ev(`JSON.stringify(Object.keys(__nnsUI.save.d.presets||{}))`));
const sobre = `(()=>{ const vis=e=>{ const q=e.getBoundingClientRect(); return q.width>1&&q.height>1&&!e.closest('[hidden]') }; const L=[...document.querySelectorAll('.tela-personalizada button, .tela-personalizada select, .tela-personalizada input')].filter(vis); const o=[]; for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ if(L[i].contains(L[j])||L[j].contains(L[i])) continue; const a=L[i].getBoundingClientRect(), c=L[j].getBoundingClientRect(); if(a.left<c.right-0.5&&c.left<a.right-0.5&&a.top<c.bottom-0.5&&c.top<a.bottom-0.5) o.push((L[i].dataset.a||L[i].dataset.g||L[i].tagName)+'×'+(L[j].dataset.a||L[j].dataset.g||L[j].tagName)); } const fora=L.filter(e=>{ const q=e.getBoundingClientRect(); return q.right>innerWidth+0.5||q.left<-0.5 }).length; return JSON.stringify({n:L.length,o,fora}) })()`;
const PA = `{ azul:[{tipo:'fragata',pintura:'',perso:'agressivo'},{tipo:'cruzador',pintura:'',perso:'equilibrado'}], vermelho:[{tipo:'destroier',pintura:'',perso:'equilibrado'},{tipo:'corveta',pintura:'',perso:'cauteloso'},{tipo:'sentinela',pintura:'',perso:'agressivo'}], jogador:'destroier', mapa:'atois', hora:'dia', tempo:'limpo', mar:2, duracao:300 }`;
const PB = `{ azul:[], vermelho:[{tipo:'horizonte',pintura:'',perso:'equilibrado'}], jogador:'colosso', mapa:'santos', hora:'entardecer', tempo:'nublado', mar:5, duracao:600 }`;
await carrega();
// 1) migração: preset antigo só no localStorage (1.2.16–1.2.17) aparece na lista nova e passa para o save
await ev(`(()=>{ const s=__nnsUI.save; delete s.d.presets; s.salva(); localStorage.setItem('nns.pers.presets.v1', JSON.stringify({ 'Legado': ${PB} })); s.d.pers=${PA}; s.salva(); __nnsUI.TELAS.personalizada(); return 1 })()`); await esp(700);
R.migracao = { lista: await nomes(), save: await salvos(), select: await ev(`document.querySelectorAll('.tela-personalizada select[data-a=preset]').length`) };
ok(R.migracao.lista.includes('Legado') && R.migracao.save.includes('Legado'), 'migração do preset antigo falhou'); ok(R.migracao.select === 0, 'select nativo de presets ainda existe');
// 2) salvar "Alfa" (config A) e "Bravo" (config B) por toque
await digita('[data-a=nomep]', 'Alfa'); await toca('[data-a=salvap]');
await ev(`(()=>{ __nnsUI.save.d.pers=${PB}; __nnsUI.save.salva(); __nnsUI.TELAS.personalizada(); return 1 })()`); await esp(500); await digita('[data-a=nomep]', 'Bravo'); await toca('[data-a=salvap]');
R.salvos = await salvos(); ok(['Legado', 'Alfa', 'Bravo'].every((n) => R.salvos.includes(n)), 'salvar por toque falhou: ' + R.salvos);
await b.foto(DIR + '/lista-915x412.png');
// 3) carregar por toque
await toca('.pb-pr-nome', 'Alfa'); R.carregaAlfa = JSON.parse(await ev(`JSON.stringify({mapa:__nnsUI.save.d.pers.mapa, az:__nnsUI.save.d.pers.azul.length, vm:__nnsUI.save.d.pers.vermelho.length, mar:__nnsUI.save.d.pers.mar, ativo:(document.querySelector('.pb-pr.ativo b')||{}).textContent, telaMapa:document.querySelector('[data-g=mapa]').value})`));
ok(R.carregaAlfa.mapa === 'atois' && R.carregaAlfa.az === 2 && R.carregaAlfa.vm === 3 && R.carregaAlfa.mar === 2 && R.carregaAlfa.telaMapa === 'atois' && R.carregaAlfa.ativo === 'Alfa', 'carregar Alfa por toque falhou ' + JSON.stringify(R.carregaAlfa));
await toca('.pb-pr-nome', 'Bravo'); R.carregaBravo = JSON.parse(await ev(`JSON.stringify({mapa:__nnsUI.save.d.pers.mapa, vm:__nnsUI.save.d.pers.vermelho.map(b=>b.tipo), jog:__nnsUI.save.d.pers.jogador})`));
ok(R.carregaBravo.mapa === 'santos' && R.carregaBravo.jog === 'colosso', 'carregar Bravo por toque falhou ' + JSON.stringify(R.carregaBravo));
// 4) renomear Bravo → Bravo 2
await toca('[data-a=renomeiap]', 'Bravo'); await ev(`(()=>{ const e=document.querySelector('[data-a=novonome]'); e.focus(); e.select(); return 1 })()`); await b.send('Input.insertText', { text: 'Bravo 2' }); await toca('[data-a=renok]');
R.renomeia = await salvos(); ok(R.renomeia.includes('Bravo 2') && !R.renomeia.includes('Bravo'), 'renomear falhou ' + R.renomeia);
// 5) excluir com confirmação: cancelar mantém; confirmar apaga
await toca('[data-a=excluip]', 'Legado'); R.confirmaVisivel = await ev(`!!document.querySelector('.pb-pr.conf [data-a=excluisim]')`); await b.foto(DIR + '/confirma-exclusao.png'); ok(R.confirmaVisivel, 'sem confirmação de exclusão');
await toca('[data-a=excluinao]'); ok((await salvos()).includes('Legado'), 'cancelar excluiu o preset');
await toca('[data-a=excluip]', 'Legado'); await toca('[data-a=excluisim]'); R.aposExcluir = await salvos(); ok(!R.aposExcluir.includes('Legado'), 'excluir com confirmação falhou');
// 6) persistência após recarregar o app
await carrega(); await ev(`(__nnsUI.TELAS.personalizada(),1)`); await esp(600); R.aposRecarregar = await nomes(); ok(JSON.stringify(R.aposRecarregar) === JSON.stringify(['Alfa', 'Bravo 2']), 'presets não persistiram no save: ' + R.aposRecarregar);
ok(!(await ev(`localStorage.getItem('nns.pers.presets.v1')`)), 'chave antiga não foi limpa');
// 7) nenhum botão cobrindo outro, em várias proporções
R.sobreposicao = {}; for (const [tm, w, h] of [['21x9', 961, 412], ['20x9', 915, 412], ['16x9', 732, 412], ['4x3', 1024, 768]]) { await b.tam(w, h); await esp(500); const s = JSON.parse(await ev(sobre)); R.sobreposicao[tm] = s; if (s.o.length || s.fora) falhas.push(`${tm}: sobreposição ${s.o.slice(0, 3).join(', ')} fora ${s.fora}`); await ev(`(()=>{ const e=document.querySelector('.pb-presets'); e && e.scrollIntoView({block:'center'}); return 1 })()`); await b.foto(`${DIR}/lista-${tm}.png`); }
await b.tam(915, 412); await esp(400);
// 8) item 11: inimigo inválido → ZARPAR bloqueado com aviso
await ev(`(()=>{ __nnsUI.save.d.pers.vermelho=[{tipo:'naoexiste',pintura:'',perso:'equilibrado'}]; __nnsUI.TELAS.personalizada(); return 1 })()`); await esp(400); await toca('[data-a=zarparp]');
R.bloqueio = JSON.parse(await ev(`JSON.stringify({ toast:[...document.querySelectorAll('.toast')].map(e=>e.textContent), jogo: !!(window.__nns && __nns.rodando) })`)); ok(!R.bloqueio.jogo && R.bloqueio.toast.some((t) => /inimigo/.test(t)), 'ZARPAR sem inimigo válido não foi bloqueado ' + JSON.stringify(R.bloqueio));
await b.foto(DIR + '/zarpar-bloqueado.png');
// 9) carregar Alfa por toque e ZARPAR por toque → a partida usa o preset; inimigo identificado já na largada
await toca('.pb-pr-nome', 'Alfa'); await toca('[data-a=zarparp]');
for (let i = 0; i < 240; i++) { if (await ev(`!!(window.__nns && __nns.S && __nns.rodando && __nns.eu && __nns.S.sim.tick > 30)`)) break; await esp(500); }
R.posZarpar = await ev(`JSON.stringify({ nns: !!window.__nns, S: !!(window.__nns&&__nns.S), rod: !!(window.__nns&&__nns.rodando), tela: document.querySelector('.tela-personalizada')?'pers':(document.querySelector('.cg-barra')?'carregando':'?'), toast:[...document.querySelectorAll('.toast')].map(e=>e.textContent), erros: ${JSON.stringify(JSON.stringify(b.erros.slice(0,3)))} })`); console.log('posZarpar', R.posZarpar); if (!(await ev(`!!(window.__nns&&__nns.S)`))) { falhas.push('ZARPAR por toque não iniciou a partida'); console.log(JSON.stringify(R)); console.log(falhas.join('\n')); process.exit(1); }
R.partida = JSON.parse(await ev(`(()=>{ const sim=__nns.S.sim, eu=__nns.eu; const ini=sim.navios.filter(n=>n.time!==eu.time&&!n.C.mercante); return JSON.stringify({ mapa:__nns.S.T.id||__nns.S.T.nome, eu:eu.tipo, az:sim.navios.filter(n=>n.time===eu.time&&!n.C.mercante).map(n=>n.tipo), vm:ini.map(n=>n.tipo), vistos:ini.filter(n=>sim.vistos&&sim.vistos[eu.time].has(n.id)).length, contatos:ini.filter(n=>sim.contatos[eu.time].has(n.id)).length }) })()`));
ok(R.partida.eu === 'destroier' && R.partida.vm.length === 3 && R.partida.az.length === 3, 'partida não usou o preset Alfa ' + JSON.stringify(R.partida)); ok(R.partida.vistos >= 1, 'nenhum inimigo identificado na largada');
await esp(1500); await b.foto(DIR + '/partida-alfa.png');
ok(!b.erros.length, 'erros JS: ' + b.erros.slice(0, 3).join(' | '));
console.log(JSON.stringify(R, null, 0)); console.log(falhas.length ? `FALHAS(${falhas.length}):\n - ` + falhas.join('\n - ') : 'OK preset1218');
fs.writeFileSync('/workspace/nexo-naval-strike/tests/preset1218-resultado.json', JSON.stringify({ R, falhas }, null, 1)); b.fecha(); process.exit(falhas.length ? 1 : 0);
