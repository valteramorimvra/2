// v1.2.17 item 6: alvos de toque >= 48 dp (área de toque efetiva, incluindo ::after de expansão) sem sobreposição entre alvos;
// botão de pausa visível com HUD oculto. Batalha + binóculo + menus, 5 proporções.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1217/toque'; fs.mkdirSync(DIR, { recursive: true });
const TAMS = [['20x9', 915, 412], ['19.5x9', 892, 412], ['18x9', 824, 412], ['16x9', 732, 412], ['4x3', 1024, 768]];
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = {}; const falhas = [];
const medeSel = (SEL) => `(()=>{ const vis=e=>{ const q=e.getBoundingClientRect(); if(!(q.width>1&&q.height>1)) return false; for(let x=e;x&&x!==document.body;x=x.parentElement){ const c=getComputedStyle(x); if(c.display==='none'||c.visibility==='hidden'||+c.opacity<0.02) return false; } return q.right>0&&q.bottom>0&&q.left<innerWidth&&q.top<innerHeight; };
  const L=[...new Set([...document.querySelectorAll(SEL)])].filter(vis).filter(e=>!e.parentElement.closest('button,[data-a]'));
  const nm=e=>(e.dataset.a||e.dataset.r||e.className||e.tagName).toString().slice(0,18);
  const alvo=e=>{ const q=e.getBoundingClientRect(); const a=getComputedStyle(e,'::after'); let l=q.left,t=q.top,r=q.right,bt=q.bottom; if(a.content&&a.content!=='none'&&a.position==='absolute'&&a.pointerEvents!=='none'){ const px=v=>parseFloat(v)||0, cs=getComputedStyle(e); /* o ::after absoluto é medido a partir da caixa de preenchimento (dentro da borda) */ l=Math.min(l,q.left+px(cs.borderLeftWidth)+px(a.left)); t=Math.min(t,q.top+px(cs.borderTopWidth)+px(a.top)); r=Math.max(r,q.right-px(cs.borderRightWidth)-px(a.right)); bt=Math.max(bt,q.bottom-px(cs.borderBottomWidth)-px(a.bottom)); } return {l,t,r,b:bt}; };
  const pq=[]; const A=L.map(e=>({e,q:alvo(e)})); for(const {e,q} of A){ const w=q.r-q.l,h=q.b-q.t; if(Math.min(w,h)<47.5) pq.push(nm(e)+' '+Math.round(w)+'x'+Math.round(h)); }
  const ov=[]; for(let i=0;i<A.length;i++) for(let j=i+1;j<A.length;j++){ const a=A[i].q,c=A[j].q; if(a.l<c.r-0.5&&c.l<a.r-0.5&&a.t<c.b-0.5&&c.t<a.b-0.5) ov.push(nm(A[i].e)+' × '+nm(A[j].e)); }
  return JSON.stringify({ n:L.length, pq, ov }) })()`.replace('SEL', JSON.stringify(SEL)); const mede = medeSel('.hud button, .hud [data-a], .hud .cb, .hud [role=button], .btn-fantasma');
const checa = async (cena, tm, M = mede) => { const r = JSON.parse(await ev(M)); R[cena + '@' + tm] = r; if (r.pq.length) falhas.push(`${cena}@${tm} <48: ${r.pq.join(' | ')}`); if (r.ov.length) falhas.push(`${cena}@${tm} sobrepõe: ${r.ov.slice(0, 8).join(' | ')}`); };
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const medeE = medeSel('.es-vista button, .btn-fantasma, .es-ver, .btn-voltar'); for (const [tm, w, h] of TAMS) { await b.tam(w, h); await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(1800); await checa('estaleiro', tm, medeE); await b.foto(`${DIR}/estaleiro-${tm}.png`); } await b.tam(915, 412);
await ev(`(()=>{ __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'atois', portaAvioes:'sim' }); return 1 })()`);
for (let i = 0; i < 160; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 90)`)) break; await esp(500); } await esp(2500);
await ev(`(()=>{ __nns.tutorial=false; __nns.hud&&__nns.hud.dica&&__nns.hud.dica(null); return 1 })()`);
for (const [tm, w, h] of TAMS) { await b.tam(w, h); await esp(2200); await checa('batalha', tm); await b.foto(`${DIR}/batalha-${tm}.png`); }
// binóculo
await b.tam(915, 412); await ev(`(()=>{ const x=document.querySelector('[data-a=bino]'); x&&x.click(); return 1 })()`); await esp(2000); await checa('binoculo', '20x9'); await b.foto(`${DIR}/binoculo-20x9.png`); await ev(`(()=>{ const x=document.querySelector('[data-a=bino]'); x&&x.click(); return 1 })()`); await esp(1200);
// HUD oculto: a pausa deve ficar visível (opacidade efetiva >= 0,3) e clicável
await ev(`(()=>{ const f=document.querySelector('.btn-fantasma'); f&&f.click(); return 1 })()`); await esp(1200);
R.fantasma = JSON.parse(await ev(`(()=>{ const p=document.querySelector('.h-pausa'); let o=1; for(let x=p;x;x=x.parentElement){ o*=+getComputedStyle(x).opacity; } const q=p.getBoundingClientRect(); const top=document.elementFromPoint(q.left+q.width/2,q.top+q.height/2); return JSON.stringify({ op:+o.toFixed(3), clic: top===p||p.contains(top), fant: !!document.querySelector('.ui-fantasma') }) })()`));
await b.foto(`${DIR}/fantasma-pausa.png`); if (!R.fantasma.fant) falhas.push('HUD não ocultou'); if (R.fantasma.op < 0.3) falhas.push('pausa invisível no HUD oculto ' + R.fantasma.op); if (!R.fantasma.clic) falhas.push('pausa não clicável no HUD oculto');
await ev(`(()=>{ const f=document.querySelector('.btn-fantasma'); f&&f.click(); return 1 })()`); await esp(600);
console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join('\n')); fs.writeFileSync('/workspace/toque1217.out', JSON.stringify({ R, falhas }, null, 1)); b.fecha(); process.exit(0);
