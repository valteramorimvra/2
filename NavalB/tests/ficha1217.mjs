// v1.2.17 item 25: ficha técnica no estaleiro — símbolo + descrição + números de cada arma, comparação com o navio atual,
// e NADA sobreposto (abas, linhas, painel × lista/botões) em 5 proporções de tela.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1217/ficha'; fs.mkdirSync(DIR, { recursive: true });
const TAMS = [['20x9', 915, 412], ['19.5x9', 892, 412], ['18x9', 824, 412], ['16x9', 732, 412], ['4x3', 1024, 768]];
const NAVIOS = ['destroier', 'cruzador', 'atlantico', 'corveta'];
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = {}; const falhas = [];
await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.save.ultimo.classe='destroier'; return 1 })()`);
const MEDE = `(()=>{ const I=document.querySelector('.es-info'); const ri=I.getBoundingClientRect(); const f=[]; const sob=(a,b)=>{ const x=Math.min(a.right,b.right)-Math.max(a.left,b.left), y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top); return x>0.5&&y>0.5; };
  const abas=[...I.querySelectorAll('.es-abas button')].map(e=>e.getBoundingClientRect()); for(let i=0;i<abas.length;i++){ for(let j=i+1;j<abas.length;j++) if(sob(abas[i],abas[j])) f.push('abas '+i+'×'+j); if(abas[i].right>ri.right+1||abas[i].left<ri.left-1) f.push('aba fora '+i); }
  const corpo=I.querySelector('.es-corpo'); if(corpo.scrollWidth>corpo.clientWidth+1) f.push('corpo rola na horizontal '+corpo.scrollWidth+'>'+corpo.clientWidth); const rc=corpo.getBoundingClientRect();
  for(const e of I.querySelectorAll('.ficha *')){ const r=e.getBoundingClientRect(); if(!r.width) continue; if(r.right>rc.right+1.5||r.left<rc.left-1.5){ f.push('vaza: '+e.className+' '+(e.textContent||'').slice(0,30)); break; } }
  let nl=0; for(const l of I.querySelectorAll('.ft-l')){ nl++; const cs=[...l.children].map(e=>e.getBoundingClientRect()); for(let i=0;i<cs.length;i++) for(let j=i+1;j<cs.length;j++) if(sob(cs[i],cs[j])) f.push('linha '+l.dataset.k+' '+i+'×'+j); for(const c of l.children) if(c.scrollWidth>c.clientWidth+1&&getComputedStyle(c).whiteSpace!=='nowrap') f.push('texto cortado '+l.dataset.k); }
  const ls=[...I.querySelectorAll('.ft-arma')].map(e=>e.getBoundingClientRect()); for(let i=0;i<ls.length;i++) for(let j=i+1;j<ls.length;j++) if(sob(ls[i],ls[j])) f.push('cartões '+i+'×'+j);
  for(const e of document.querySelectorAll('button, .es-lista, .es-vista, .carteira, [data-a]')){ if(I.contains(e)||e.contains(I)) continue; const r=e.getBoundingClientRect(); if(!r.width||getComputedStyle(e).visibility==='hidden') continue; if(sob(r,ri)) f.push('painel cobre '+(e.className||e.tagName)+' '+(e.textContent||'').trim().slice(0,20)); }
  const ic=[...I.querySelectorAll('.ft-ic svg')].length, sec=I.querySelectorAll('.ft-arma').length, nan=/NaN|undefined/.test(I.querySelector('.ficha')?.textContent||'x'), cmp=I.querySelectorAll('.ft-c').length;
  return JSON.stringify({ f, nl, ic, sec, nan, cmp, txtCmp: (I.querySelector('.ft-cmp')||{}).textContent }) })()`;
for (const [tm, w, h] of TAMS) { await b.tam(w, h); for (const k of NAVIOS) {
  await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); const bt=document.querySelector('.es-lista [data-c="${k}"]'); bt&&bt.click(); const a=document.querySelector('.es-abas [data-aba=ficha]'); a&&a.click(); return 1 })()`); await esp(700);
  const r = JSON.parse(await ev(MEDE)); R[k + '@' + tm] = r; for (const x of r.f) falhas.push(`${k}@${tm}: ${x}`);
  if (r.sec < 3 || r.ic < r.sec) falhas.push(`${k}@${tm}: seções ${r.sec}, símbolos ${r.ic}`); if (r.nan) falhas.push(`${k}@${tm}: NaN/undefined`); if (k !== 'destroier' && !r.cmp) falhas.push(`${k}@${tm}: sem comparação`); if (k === 'destroier' && !/navio atual/.test(r.txtCmp || '')) falhas.push('destroier: não indicou navio atual');
  if (tm === '20x9' || tm === '4x3') { await b.foto(`${DIR}/ficha-${k}-${tm}.png`); await ev(`(()=>{ const c=document.querySelector('.es-corpo'); c.scrollTop=c.scrollHeight*0.55; return 1 })()`); await esp(300); await b.foto(`${DIR}/ficha-${k}-${tm}-meio.png`); } } }
console.log(JSON.stringify(R)); const lin = `ficha1217 casos ${Object.keys(R).length} falhas ${falhas.length} ${falhas.slice(0, 12).join(' | ')}`; console.log(lin); fs.writeFileSync('/workspace/ficha1217.out', JSON.stringify(R) + '\n' + lin + '\n'); b.fecha(); process.exit(0);
