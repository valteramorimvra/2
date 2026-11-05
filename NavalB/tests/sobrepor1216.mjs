// v1.2.16 item 30b: NENHUM elemento clicável cobre outro (nem parcialmente) — menus, estaleiro, batalha, binóculo, cinema, espectador;
// em 20:9, 19.5:9, 18:9, 16:9 e tablet 4:3. Também tira as capturas do item 30 (TAG=antes|depois).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const TAG = process.env.TAG || 'depois'; const DIR = '/workspace/nexo-naval-shots/1216/botoes-' + TAG; fs.mkdirSync(DIR, { recursive: true });
const TAMS = [['20x9', 915, 412], ['19.5x9', 892, 412], ['18x9', 824, 412], ['16x9', 732, 412], ['4x3', 1024, 768]];
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = {}; const falhas = [];
const sobre = `(()=>{ const vis=e=>{ const q=e.getBoundingClientRect(); if(!(q.width>1&&q.height>1)) return false; if(e.closest('[hidden]')) return false; for(let x=e;x&&x!==document.body;x=x.parentElement){ const c=getComputedStyle(x); if(c.display==='none'||c.visibility==='hidden'||+c.opacity<0.02) return false; } return q.right>0&&q.bottom>0&&q.left<innerWidth&&q.top<innerHeight; };
  const L=[...document.querySelectorAll('button, [data-a], [data-ir], input, select, .cb, [role=button]')].filter(vis); const U=[...new Set(L)]; const o=[]; const nm=e=>(e.dataset.a||e.dataset.ir||e.dataset.r||e.className||e.tagName).toString().slice(0,16)+':'+(e.textContent||'').trim().slice(0,8);
  const vr=e=>{ let q=e.getBoundingClientRect(); let l=q.left,t=q.top,r=q.right,bt=q.bottom; for(let x=e.parentElement;x&&x!==document.body;x=x.parentElement){ const c=getComputedStyle(x); if(c.overflow!=='visible'||c.overflowX!=='visible'||c.overflowY!=='visible'){ const p=x.getBoundingClientRect(); l=Math.max(l,p.left); t=Math.max(t,p.top); r=Math.min(r,p.right); bt=Math.min(bt,p.bottom); } } return {left:l,top:t,right:r,bottom:bt}; }; /* área VISÍVEL (recortada por contêineres com rolagem) */
  for(let i=0;i<U.length;i++) for(let j=i+1;j<U.length;j++){ if (U[i].contains(U[j])||U[j].contains(U[i])) continue; const a=vr(U[i]), c=vr(U[j]); if(a.right-a.left<1||a.bottom-a.top<1||c.right-c.left<1||c.bottom-c.top<1) continue; if(a.left<c.right-0.5&&c.left<a.right-0.5&&a.top<c.bottom-0.5&&c.top<a.bottom-0.5) o.push(nm(U[i])+' × '+nm(U[j])); } return JSON.stringify({ n:U.length, o }) })()`;
const checa = async (cena, tm) => { const r = JSON.parse(await ev(sobre)); R[cena + '@' + tm] = r.n; if (r.o.length) falhas.push(`${cena}@${tm}: ${r.o.slice(0, 6).join(' | ')}${r.o.length > 6 ? ' …+' + (r.o.length - 6) : ''}`); };
await b.vai((process.env.VZ_URL || 'http://127.0.0.1:4173') + '/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
for (const tela of ['inicio', 'estaleiro', 'ajustes', 'historico', 'batalha', 'personalizada', 'comandantes', 'trofeus', 'comoJogar', 'creditos']) for (const [tm, w, h] of TAMS) {
  await b.tam(w, h); await ev(`(()=>{ __nnsUI.TELAS.${tela}(); return 1 })()`); await esp(tela === 'estaleiro' ? 1500 : 500); await checa(tela, tm); if (tela === 'inicio' || tela === 'estaleiro' || tela === 'batalha') await b.foto(`${DIR}/${tela}-${tm}.png`); }
await b.tam(915, 412); await ev(`(()=>{ __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'atois', portaAvioes:'sim' }); return 1 })()`);
for (let i = 0; i < 160; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 90)`)) break; await esp(500); } await esp(2500);
for (const [tm, w, h] of TAMS) { await b.tam(w, h); await esp(2000); await checa('combate', tm); await b.foto(`${DIR}/combate-${tm}.png`);
  await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await esp(1500); await checa('binoculo', tm); if (tm === '20x9' || tm === '16x9') await b.foto(`${DIR}/binoculo-${tm}.png`); await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await esp(600);
  await ev(`(()=>{ __nns.camSel('cinema'); return 1 })()`); await esp(1500); await checa('cinema', tm); await ev(`(()=>{ __nns.cine.on && __nns.cine.sai(); return 1 })()`); await esp(600); }
await b.tam(915, 412); await ev(`(()=>{ __nns.S.sim.dano(__nns.eu, 1e7, null, 'missil', true); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('[data-r=convite]').hidden || !!document.querySelector('.rs')`)) break; await esp(500); }
await checa('convite', '20x9'); await ev(`(()=>{ const c=document.querySelector('[data-r=cv_sim]'); c&&c.click(); return 1 })()`); await esp(2000);
for (const [tm, w, h] of TAMS) { await b.tam(w, h); await esp(1500); await checa('espectador', tm); if (tm === '20x9' || tm === '4x3') await b.foto(`${DIR}/espectador-${tm}.png`); }
console.log(JSON.stringify(R)); console.log('falhas', falhas.length); for (const f of falhas) console.log(' - ' + f); b.fecha(); process.exit(falhas.length ? 1 : 0);
