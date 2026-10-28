// v1.2.21 itens 16/16b — placar aberto (SUA FROTA / INIMIGOS) com NOMES COMPLETOS em 8×8 (sem reticências, até 2 linhas), destro e canhoto,
// nas resoluções de teste; e QUALQUER toque (fora, dentro do painel, em cada botão do HUD) fecha o painel em ≤ 1 quadro com o HUD visível.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1221/placar'; fs.mkdirSync(DIR, { recursive: true });
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto';
const TAMS = [['20x9', 915, 412], ['19.5x9', 892, 412], ['18x9', 824, 412], ['16x9', 732, 412], ['4x3', 1024, 768]];
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = { nomes: {}, fecha: {} };
await b.vai(URL); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'atois', portaAvioes:'sim' }); return 1 })()`);
for (let i = 0; i < 200; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 90)`)) break; await esp(500); } await esp(2000);
// nomes longos reais do jogo (pior caso): jogador + comandantes dos bots com os nomes mais longos do gerador
await ev(`(()=>{ const N=__nns, S=N.S.sim; N.mem.revelaTudo=1; S.revelaTudo=1; const longos=['VALTER AMORIM','Alm. Leidevaldo Albuquerque','Cmte. Maria Clara Valadares','Alm. Ananery Bittencourt','Cap. Klevton Nascimento','Cmte. Trajano Vasconcelos']; let k=0; for (const q of S.navios) { if (q===N.eu) q.comandante='VALTER AMORIM'; else if (k<longos.length*2) q.comandante=longos[(k++)%longos.length]; } return S.navios.length })()`);
const tap = async (x, y) => { await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await esp(30); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const abreLista = async () => { const p = JSON.parse(await ev(`(()=>{ const q=document.querySelector('.h-placar').getBoundingClientRect(); return JSON.stringify({x:q.left+q.width/2,y:q.top+q.height/2}) })()`)); await tap(p.x, p.y); await esp(700); return ev(`!document.querySelector('[data-r=lista]').hidden`); };
const medeNomes = `(()=>{ const L=document.querySelector('[data-r=lista]'); const out={n:0, trunc:[], linhas3:[], cobre:[], diff:[]}; const D=__nns.hud._dadosLista; const todos=[...D.azul,...D.vermelho];
  L.querySelectorAll('.ls-l').forEach((l,i)=>{ const q=todos[i]; for (const [sel, txt] of [['b', q.cmd], ['span', q.nome]]) { const e=l.querySelector(sel); out.n++; const cs=getComputedStyle(e); const lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.2;
    if (e.textContent!==txt) out.diff.push(e.textContent+'≠'+txt); if (e.scrollWidth>e.clientWidth+1 || (cs.textOverflow==='ellipsis' && cs.overflow!=='visible')) out.trunc.push(txt); const r=e.getBoundingClientRect(), lr=l.getBoundingClientRect(); if (r.right>lr.right+0.5) out.trunc.push(txt+' (sai da linha)'); if (r.height>lh*2+1.5) out.linhas3.push(txt+' '+Math.round(r.height/lh)+' linhas'); } });
  const lr=L.getBoundingClientRect(); document.querySelectorAll('.hud button, .hud [data-a], .hud .cb').forEach(e=>{ if (e.closest('[hidden], .h-lista, .h-placar')) return; const r=e.getBoundingClientRect(); if (r.width<2||r.height<2) return; if (r.left<lr.right-0.5 && lr.left<r.right-0.5 && r.top<lr.bottom-0.5 && lr.top<r.bottom-0.5) out.cobre.push(e.dataset.a||e.className); }); return JSON.stringify(out) })()`;
const CANS = process.env.CAN ? [process.env.CAN === '1'] : [false, true]; const SUF = process.env.CAN ? '-' + process.env.CAN : '';
for (const can of CANS) for (const [tm, w, h] of TAMS) { const tag = `${can ? 'canhoto' : 'destro'}@${tm}`; await b.tam(w, h); await ev(`(__nns.hud.canhoto(${can}),1)`); await esp(1200);
  if (!(await abreLista())) { falhas.push(`${tag}: toque no placar não abriu a lista`); continue; }
  const r = JSON.parse(await ev(medeNomes)); R.nomes[tag] = { textos: r.n, truncados: r.trunc.length, tresLinhas: r.linhas3.length, cobre: r.cobre.length };
  if (r.trunc.length) falhas.push(`${tag}: truncados ${r.trunc.slice(0, 4).join(' | ')}`); if (r.diff.length) falhas.push(`${tag}: texto ≠ ${r.diff.slice(0, 3).join(' | ')}`); if (r.linhas3.length) falhas.push(`${tag}: > 2 linhas ${r.linhas3.slice(0, 3).join(' | ')}`); if (r.cobre.length) falhas.push(`${tag}: lista cobre ${r.cobre.join(',')}`);
  if (tm === '20x9' || tm === '4x3' || tm === '16x9') await b.foto(`${DIR}/lista-${tag}.png`);
  // 16b — toques que fecham
  const alvos = JSON.parse(await ev(`(()=>{ const o=[]; const L=document.querySelector('[data-r=lista]').getBoundingClientRect(); o.push(['fora-ceu', innerWidth*0.5, Math.min(innerHeight-20, L.bottom+40)]); o.push(['dentro-lista', L.left+L.width*0.5, L.top+Math.min(40,L.height*0.5)]); o.push(['placar', ...(()=>{ const q=document.querySelector('.h-placar').getBoundingClientRect(); return [q.left+q.width/2, q.top+q.height/2] })()]);
    document.querySelectorAll('.hud [data-a], .hud .cb, .hud .h-radar, .hud .h-leme, .hud .h-teleg').forEach(e=>{ if (e.closest('[hidden], .h-lista, .h-placar, .h-cammenu, .h-editor')) return; const a=e.dataset.a||''; if (/^(pausa|sair|desistir|editor)/.test(a)) return; const r=e.getBoundingClientRect(); if (r.width<4||r.height<4) return; const cx=r.left+r.width/2, cy=r.top+r.height/2; const top=document.elementFromPoint(cx,cy); if (!top || !(e.contains(top)||top.contains(e))) return; o.push([(a||e.className.split(' ')[0])+'#'+o.length, cx, cy]); }); return JSON.stringify(o) })()`));
  let ok = 0; const presos = [];
  for (const [nm, x, y] of alvos) { await ev(`(()=>{ const H=__nns.hud; H.camMenu && H.camMenu(false); if (H._lista!==true) H.lista(true, __nns.hudEstado ? undefined : undefined); return 1 })()`); await esp(120);
    const aberto = await ev(`!document.querySelector('[data-r=lista]').hidden`); if (!aberto) { presos.push(nm + ' (não reabriu)'); continue; }
    await ev(`(window.__qf=-1, window.__q0=0, (function f(){ window.__q0++; if (window.__qf<0 && document.querySelector('[data-r=lista]').hidden) window.__qf=window.__q0; if (window.__q0<30) requestAnimationFrame(f); })(), 1)`);
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); const q1 = await ev(`JSON.stringify({ h: document.querySelector('[data-r=lista]').hidden, q: window.__q0 })`); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await esp(250);
    const st = JSON.parse(await ev(`JSON.stringify({ h: document.querySelector('[data-r=lista]').hidden, hud: getComputedStyle(document.querySelector('.hud')).display!=='none' && !document.querySelector('.hud').hidden, pausado: !!__nns.pausado })`));
    const s1 = JSON.parse(q1); if (s1.h && st.h && st.hud) ok++; else presos.push(`${nm}: logo após o toque ${s1.h ? 'fechado' : 'ABERTO'}, depois ${st.h ? 'fechado' : 'ABERTO'}${st.hud ? '' : ', HUD oculto'}`);
    if (st.pausado) { await ev(`(__nnsUI.continuar && __nnsUI.continuar(), 1)`); await esp(400); } await ev(`(()=>{ const N=__nns; if (N.bino) N.acao('bino'); if (N.cine && N.cine.on) N.cine.sai(); N.hud.camMenu && N.hud.camMenu(false); return 1 })()`); await esp(150); }
  R.fecha[tag] = { toques: alvos.length, fechou: ok }; console.error(new Date().toTimeString().slice(0,8), tag, JSON.stringify(R.nomes[tag]), ok + '/' + alvos.length); if (presos.length) falhas.push(`${tag}: painel não fechou em ${presos.slice(0, 5).join(' | ')}`); }
await b.tam(915, 412); await ev(`(__nns.hud.canhoto(false),1)`);
R.erros = b.erros || []; if (R.erros.length) falhas.push('erros JS: ' + R.erros.slice(0, 2).join(' | '));
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync(`/workspace/placar1221${SUF}.json`, JSON.stringify(R, null, 1));
console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); b.fecha(); process.exit(falhas.length ? 1 : 0);
