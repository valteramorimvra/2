// v1.2.15 (T) — toque REAL (CDP touch) em TODOS os nós da árvore do estaleiro, inclusive os ROXOS lendários: o nó tem de ficar selecionado (.on) e o cabeçalho mostrar o navio
import { abre } from './cdp.mjs';
const W = +(process.env.W || 915), H = +(process.env.H || 412);
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); const ev = b.ev, esp = b.espera; await b.tam(W, H);
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ const S=__nnsUI.save; if (process_FRESH) { S.ajustes.dev=false; __nnsUI.eco.e.ouro=1e6; for (const k of ['volkhar','baluarte','kordao','estrelar','colosso','antonia','rodolfo','marcos']) delete __nnsUI.eco.e.possui[k]; S.salva(); } return 1 })()`.replace('process_FRESH', process.env.FRESH ? 'true' : 'false')); await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(2500);
const ks = await ev(`[...document.querySelectorAll('.es-lista [data-c]')].map(b=>b.dataset.c)`).then(l => process.env.SO_LEND ? l.filter(k => ['volkhar','baluarte','kordao','estrelar','colosso','antonia','rodolfo','marcos'].includes(k)) : l); let ok = 0, falha = [];
for (const k of ks) {
  const r = await ev(`(()=>{ const b=document.querySelector('.es-lista [data-c=${k}]'); b.scrollIntoView({block:'center'}); const q=b.getBoundingClientRect(); return [q.x+q.width/2, q.y+q.height/2, b.classList.contains('lend')] })()`); await esp(250);
  const [x, y, lend] = r; const topo = await ev(`(()=>{ const e=document.elementFromPoint(${x},${y}); const b=e&&e.closest('[data-c]'); return b? b.dataset.c : (e? e.className||e.tagName : 'nada') })()`);
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await esp(400);
  const sel = await ev(`(()=>{ const b=document.querySelector('.es-lista [data-c=${k}]'); return b.classList.contains('on') && document.querySelector('[data-r=corpo] h2') ? 1 : 0 })()`);
  if (sel && lend) { // comprar (ouro) e ESCOLHER por toque real
    for (const a of ['comprar', 'escolher']) { const p = await ev(`(()=>{ const b=document.querySelector('[data-r=acoes] [data-a=${a}]'); if (!b) return null; b.scrollIntoView({block:'center'}); const q=b.getBoundingClientRect(); return [q.x+q.width/2, q.y+q.height/2] })()`); if (!p) continue; await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p[0], y: p[1] }] }); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await esp(900); if (a === 'comprar') { await ev(`(()=>{ const b=document.querySelector('.es-lista [data-c=${k}]'); b.click(); return 1 })()`); await esp(500); } }
    const esc = await ev(`__nnsUI.save.ultimo.classe`); if (esc !== k) falha.push(`${k}(lend) não ficou ESCOLHIDO (${esc})`); else console.log('lendário escolhido', k); }
  if (sel) ok++; else falha.push(`${k}${lend ? '(lend)' : ''} topo=${topo}`);
}
console.log(`arvore ${W}x${H}: ${ok}/${ks.length} selecionáveis; lendários ${ks.length ? (await ev(`document.querySelectorAll('.es-lista .lend').length`)) : 0}; falhas: ${falha.join(', ') || 'nenhuma'}; erros ${JSON.stringify(b.erros)}`);
b.fecha(); process.exit(falha.length ? 1 : 0);
