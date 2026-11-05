// v1.2.16 item 34: VISUALIZAR na árvore (todos os nós), cenário cinematográfico, Voltar ao mesmo ponto, nome fictício + número no casco.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1216/visualizar'; fs.mkdirSync(DIR, { recursive: true });
const falhas = []; const R = {};
for (const [w, h] of [[915, 412], [732, 412]]) {
  const b = await abre(null, { w, h }); const ev = b.ev, esp = b.espera;
  await b.vai('http://127.0.0.1:4173/?auto');
  for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI && !!(window.__nns&&__nns.vitrine)`)) break; await esp(500); }
  await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(1500);
  const c = JSON.parse(await ev(`JSON.stringify({ bt: document.querySelectorAll('.es-lista button[data-c]').length, ver: document.querySelectorAll('.es-lista button[data-c] .es-ver').length })`)); R['nos' + w] = c; if (!c.bt || c.bt !== c.ver) falhas.push(w + ' nós sem Visualizar ' + JSON.stringify(c));
  // sobreposição ícone × texto do nó
  const ov = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('.es-lista button[data-c]')].filter(bt=>{ const v=bt.querySelector('.es-ver').getBoundingClientRect(); return [...bt.querySelectorAll('b,small,em')].some(t=>{ const r=t.getBoundingClientRect(); const rr=Math.min(r.right, r.left + (t.scrollWidth||r.width)); return r.width>0 && rr>v.left+0.5 && r.left<v.right && r.top<v.bottom && v.top<r.bottom; }) }).map(bt=>bt.dataset.c))`)); if (ov.length) falhas.push(w + ' ícone sobre texto ' + ov.join(','));
  await ev(`(()=>{ const l=document.querySelector('.es-lista'); l.scrollTo({top:400, behavior:'instant'}); return 1 })()`); await esp(400); const sc0 = await ev(`document.querySelector('.es-lista').scrollTop`);
  const alvo = await ev(`(()=>{ const b=[...document.querySelectorAll('.es-lista button[data-c]')].find(b=>b.classList.contains('st-bloq')) || document.querySelector('.es-lista button[data-c="volkhar"]'); const v=b.querySelector('.es-ver'); b.scrollIntoView({block:'center', behavior:'instant'}); const r=v.getBoundingClientRect(); return JSON.stringify({c:b.dataset.c, x:r.left+r.width/2, y:r.top+r.height/2}) })()`).then(JSON.parse);
  const sc1 = await ev(`document.querySelector('.es-lista').scrollTop`); await b.ev(`(()=>{ const e=document.elementFromPoint(${alvo.x},${alvo.y}); e.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); return e.tagName + ' ' + (e.closest('[data-ver]') ? 'ver' : 'X') })()`).then(r => console.log('clique', alvo, r)); await esp(4000); console.log('tela', await ev(`document.querySelector('#ui section') && document.querySelector('#ui section').className`));
  const v = JSON.parse(await ev(`JSON.stringify({ tela: !!document.querySelector('.tela-visualizar'), tipo: __nns.vitrine.tipo, cine: !!__nns.vitrine.cine, auto: __nns.vitrine.auto!==false, voltar: (()=>{ const r=document.querySelector('.vz-voltar').getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom] })(), ficha: (()=>{ const r=document.querySelector('.vz-ficha').getBoundingClientRect(); return [r.left,r.top,r.right,r.bottom] })(), nome: (()=>{ let n=0; __nns.vitrine.navio.g.traverse(o=>{ if(o.name==='nomeOuro'||o.name==='nomeOuroPopa') n++; }); return n })(), ang0: __nns.vitrine.ang })`));
  await b.foto(DIR + `/visualizar-${alvo.c}-${w}.png`); await esp(5000); const ang1 = await ev(`__nns.vitrine.ang`); await b.foto(DIR + `/visualizar-${alvo.c}-${w}-b.png`);
  R['viz' + w] = { alvo: alvo.c, ...v, ang1 };
  if (!v.tela || v.tipo !== alvo.c || !v.cine || !v.auto) falhas.push(w + ' visualizar ' + JSON.stringify(v)); if (Math.abs(ang1 - v.ang0) < 0.05) falhas.push(w + ' câmera parada');
  if (v.nome < 3) falhas.push(w + ' sem nome no casco (' + v.nome + ')');
  const [a, c2] = [v.voltar, v.ficha]; if (a[0] < c2[2] && c2[0] < a[2] && a[1] < c2[3] && c2[1] < a[3]) falhas.push(w + ' voltar×ficha'); if (a[2] > w || a[1] < 0 || c2[3] > h) falhas.push(w + ' fora da tela');
  await ev(`(()=>{ document.querySelector('.vz-voltar').click(); return 1 })()`); await esp(1500);
  const back = JSON.parse(await ev(`JSON.stringify({ est: !!document.querySelector('.tela-estaleiro'), sc: document.querySelector('.es-lista') ? document.querySelector('.es-lista').scrollTop : -1, cine: !!__nns.vitrine.cine })`)); R['volta' + w] = { ...back, sc0: sc1, el: alvo.c };
  if (!back.est || Math.abs(back.sc - sc1) > 2 || back.cine) falhas.push(w + ' voltar ' + JSON.stringify(back) + ' sc0 ' + sc0);
  // nome fictício num navio normal (fragata)
  const nf = await ev(`(()=>{ __nns.mostraVitrine('fragata','azul',-0.24); let n=0; __nns.vitrine.navio.g.traverse(o=>{ if(o.name==='nomeOuro'||o.name==='nomeOuroPopa') n++; }); return n })()`); R['fragata' + w] = nf; if (nf < 3) falhas.push('fragata sem nome');
  b.fecha();
}
console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join(' | ')); process.exit(falhas.length ? 1 : 0);
