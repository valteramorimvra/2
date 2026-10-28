// v1.2.25 item 8 — toque na ZONA CENTRAL (placar: relógio + ZONA) → lista SUA FROTA / INIMIGOS. Mede: lista abre, nº de linhas = nº de navios,
// todas as linhas INTEIRAS dentro da tela sem rolar (scrollHeight ≤ clientHeight), sem botão sobre a lista, sem texto cortado. Paisagem e retrato.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto', ROT = process.env.ROT || 'novo', DIR = '/workspace/capturas1225'; fs.mkdirSync(DIR, { recursive: true });
const MODO = process.env.MODOP || 'frota';
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = { rot: ROT, modo: MODO, med: {} }; const falhas = [];
await b.vai(URL); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.zarpar({ modo:'${MODO}', classe:'destroier', mapa:'atois', portaAvioes:'sim' }); return 1 })()`);
for (let i = 0; i < 200; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 90)`)) break; await esp(500); } await esp(2500);
await ev(`(()=>{ const N=__nns; N.mem.revelaTudo=1; return 1 })()`);
const tap = async (x, y) => { await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await esp(30); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const mede = `(()=>{ const L=document.querySelector('[data-r=lista]'); const S=__nns.S.sim; const vw=innerWidth, vh=innerHeight; const r=L.getBoundingClientRect(); const rows=[...L.querySelectorAll('.ls-l')];
  const fora=rows.filter(e=>{ const q=e.getBoundingClientRect(); return q.bottom>r.bottom+1 || q.top<r.top-1 || q.bottom>vh+1 || q.right>vw+1 }).length;
  const cort=[]; L.querySelectorAll('.ls-l b, .ls-l span, .ls-l em, .ls-l small').forEach(e=>{ if (e.scrollWidth>e.clientWidth+1) cort.push(e.textContent) });
  const bts=[]; document.querySelectorAll('.hud button, .hud .cb').forEach(e=>{ if (e.closest('[hidden], .h-lista')) return; if (getComputedStyle(e).visibility==='hidden') return; const q=e.getBoundingClientRect(); if (q.width<2) return; const ix=Math.min(q.right,r.right)-Math.max(q.left,r.left), iy=Math.min(q.bottom,r.bottom)-Math.max(q.top,r.top); if (ix>1&&iy>1) bts.push((e.dataset.a||e.className)+'') });
  const D=__nns.hud._dadosLista||{azul:[],vermelho:[]};
  return JSON.stringify({ aberta: !L.hidden, navios: S.navios.length, naviosNaoAlvo: S.navios.filter(q=>q.papel!=='alvo').length, dados: D.azul.length+D.vermelho.length, linhas: rows.length, sh: L.scrollHeight, ch: L.clientHeight, precisaRolar: L.scrollHeight>L.clientHeight+1, linhasForaDaVista: fora, cortados: cort.slice(0,6), botoesSobre: bts, caixa:[r.left,r.top,r.width,r.height].map(Math.round), maxH: L.style.maxHeight, cls: L.className, vw, vh });
})()`;
for (const [nome, w, h] of [['paisagem', 915, 412], ['retrato', 412, 915]]) {
  await b.tam(w, h); await esp(1500);
  await ev(`(()=>{ __nns.hud.lista(false); return 1 })()`); await esp(300);
  const p = JSON.parse(await ev(`(()=>{ const q=document.querySelector('.h-placar').getBoundingClientRect(); return JSON.stringify({x:q.left+q.width/2,y:q.top+q.height/2}) })()`)); await tap(p.x, p.y); await esp(900);
  const m = JSON.parse(await ev(mede)); R.med[nome] = m; await b.foto(`${DIR}/lista_${ROT}_${nome}.png`); console.log(nome, JSON.stringify(m));
  if (!m.aberta) falhas.push(nome + ': lista não abriu'); if (m.linhas !== m.dados) falhas.push(nome + ': linhas ' + m.linhas + ' ≠ dados ' + m.dados);
  if (m.precisaRolar || m.linhasForaDaVista) falhas.push(nome + `: lista incompleta na tela (${m.linhasForaDaVista} linhas fora da vista; scroll ${m.sh}>${m.ch})`);
  if (m.cortados.length) falhas.push(nome + ': texto cortado ' + JSON.stringify(m.cortados)); if (m.botoesSobre.length) falhas.push(nome + ': botão sobre a lista ' + m.botoesSobre.join(','));
}
R.falhas = falhas; fs.writeFileSync(`/workspace/placar1225_${ROT}_${MODO}.json`, JSON.stringify(R, null, 1)); console.log(falhas.length ? 'FALHOU: ' + falhas.join(' | ') : 'OK'); await b.fecha(); process.exit(0);
