// v1.2.17 item 23: ao abrir o estaleiro (árvore tecnológica), a lista já está rolada e CENTRADA no navio selecionado — em vários navios e proporções.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1217/arvore'; fs.mkdirSync(DIR, { recursive: true });
const TAMS = [['20x9', 915, 412], ['16x9', 732, 412], ['4x3', 1024, 768]];
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = {}; const falhas = [];
await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const lista = JSON.parse(await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return JSON.stringify([...document.querySelectorAll('.es-lista [data-c]')].map(e=>e.dataset.c)) })()`)); await esp(800);
const alvos = [lista[0], lista[Math.floor(lista.length * 0.35)], lista[Math.floor(lista.length * 0.7)], lista[lista.length - 1], 'atlantico'].filter((k, i, a) => k && a.indexOf(k) === i);
for (const [tm, w, h] of TAMS) { await b.tam(w, h); for (const k of alvos) {
  await ev(`(()=>{ __nnsUI.TELAS.inicio(); return 1 })()`); await esp(300);
  await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); const bt=document.querySelector('.es-lista [data-c="${k}"]'); if(bt) bt.click(); __nnsUI.TELAS.inicio(); return 1 })()`); await esp(300);
  await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(900);
  const r = JSON.parse(await ev(`(()=>{ const li=document.querySelector('.es-lista'), n=li.querySelector('[data-c="${k}"]'); const q=li.getBoundingClientRect(), g=n.getBoundingClientRect(); const c=(g.top+g.height/2)-(q.top+q.height/2); const ext=li.scrollHeight-li.clientHeight; const sel=document.querySelector('.es-lista .on'); return JSON.stringify({ desvio: Math.round(c), visivel: g.top>=q.top-1&&g.bottom<=q.bottom+1, scroll: Math.round(li.scrollTop), ext, sel: sel?sel.dataset.c:null }) })()`));
  R[k + '@' + tm] = r; const podeCentrar = r.scroll > 1 && r.scroll < r.ext - 1; if (!r.visivel) falhas.push(`${k}@${tm}: fora da vista`); else if (podeCentrar && Math.abs(r.desvio) > 40) falhas.push(`${k}@${tm}: não centrado (${r.desvio}px)`); if (r.sel !== k) falhas.push(`${k}@${tm}: selecionado ${r.sel}`);
  if (tm === '20x9') await b.foto(`${DIR}/arvore-${k}-${tm}.png`); } }
console.log(JSON.stringify(R)); const lin = `arvore1217 casos ${Object.keys(R).length} falhas ${falhas.length} ${falhas.join(' | ')}`; console.log(lin); fs.writeFileSync('/workspace/arvore1217.out', JSON.stringify(R) + '\n' + lin + '\n'); b.fecha(); process.exit(0);
