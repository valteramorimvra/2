// v1.2.8 — capturas: míssil em voo, míssil OURO, HUD do leme (regulador + C), aspecto metálico do navio, números de dano
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const fmt = process.argv[2] || '20x9'; const dir = process.env.DIR || '/workspace/nexo-naval-shots/128'; fs.mkdirSync(dir, { recursive: true });
const [W, H] = fmt === '16x9' ? [733, 412] : [915, 412]; const SO_HUD = process.argv.includes('hud');
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); const ev = b.ev, esp = b.espera; const log = [];
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const foto = async (n) => { await b.foto(`${dir}/${fmt}-${n}.png`); log.push('foto ' + n); };
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.camModo='perto'; await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500);
const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${s}*60;i++){ S.passo([]); if (i%3===2) { j.processaEventos(); j.atualizaProjeteis(1/20); j.fx.passo(1/20); } } j.processaEventos(); return 1 })()`, 120000);
const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
const cam = (yawExpr, dist, pitch = 0.08) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; j.camModo='perto'; j.bino=0; j.yaw=j.yawAlvo=${yawExpr}; j.pitch=j.pitchAlvo=${pitch}; j.distCamF=j.distCamS=${dist}; j.camPos=null; return 1 })()`);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time); window.__a=a.id; for (const e of S.navios) if (e!==a && e!==n) e.x += (e.time===n.time?-1:1)*30000; const br=n.rumo+0.35; a.x=n.x+Math.sin(br)*7000; a.z=n.z-Math.cos(br)*7000; a.v=0; a.sam=0; n.v=0; n.telAlvo=0; a.telAlvo=0; n.alvoId=a.id; n.trava=1; n.mira.az=br; n.tMiraCmd=1; S.sensores && S.sensores(); return 1 })()`);
const sobrepoe = () => ev(`(()=>{ const vis=(e)=>{ const r=e.getBoundingClientRect(); const st=getComputedStyle(e); return r.width>1 && r.height>1 && st.display!=='none' && st.visibility!=='hidden' && +st.opacity>0.05 && !e.closest('[hidden]') ? r : null; };
  const info=[...document.querySelectorAll('.h-log .lg, .h-alerta, .h-alvo span, .mr-tv, .h-baixo, .h-danos, .h-vidaD, .h-feed .fd, .dano-alvo, .ac-reg em')]; const bts=[...document.querySelectorAll('.hud button, .hud [data-a]')].filter(b=>!b.closest('.h-pausa-menu'));
  const W=innerWidth, H=innerHeight, cen={left:W*0.42,right:W*0.58,top:H*0.40,bottom:H*0.60}; const ov=[]; const cruza=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
  for (const e of info) { const r=vis(e); if(!r) continue; for (const b of bts) { const q=vis(b); if (q && cruza(r,q) && !b.contains(e) && !e.contains(b)) ov.push((e.className||e.tagName)+' × '+(b.dataset.a||b.className)); } if (!e.classList.contains('mr-tv') && cruza(r,cen)) ov.push((e.className||e.tagName)+' × CENTRO'); }
  return JSON.stringify({ n: info.length, botoes: bts.length, sobreposicoes: ov }) })()`);
if (!SO_HUD) {
  // míssil em voo (normal) — câmera lateral acompanhando
  const lanca = (ouro) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; n.mods.missilEf = ${ouro} ? { dano: 1.25, pkCiws: 0.85 } : { dano: 1, pkCiws: 1 }; n.tVls=0; n.alvoId=a.id; n.trava=1; S.prontidao = S.prontidao || (()=>({ok:1})); const p0=S.prontidao; S.prontidao=()=>({ok:true}); const r=S.lancaMissil(n, a.id, 2); S.prontidao=p0; return r })()`);
  log.push('lanca ' + await lanca(0)); await passos(3.2);
  const camMis = (k) => ev(`(()=>{ const j=__nns, S=j.S.sim; const ms=S.misseis.filter(m=>m.ativo && m.dono===j.eu.id); if (!ms.length) return 'sem'; const m=ms[0]; j.camModo='livreTeste'; j.camTeste={ missil: S.misseis.indexOf(m), atras: 16, cima: 3.5, lado: 9, frente: 4 }; return JSON.stringify({ y: +m.y.toFixed(1), fase: m.fase, v: Math.round(Math.hypot(m.vx,m.vy,m.vz)), ouro: m.ouro }) })()`);
  log.push('missil ' + await camMis()); await aquece(0.25); await esp(900); await foto('1-missil-em-voo');
  await ev(`(()=>{ const j=__nns, S=j.S.sim; for (const m of S.misseis) m.ativo=0; j.camTeste=null; j.camModo='perto'; return 1 })()`); await passos(1.5);
  log.push('lancaOuro ' + await lanca(1)); await passos(3.2); log.push('missilOuro ' + await camMis()); await aquece(0.25); await esp(900); await foto('2-missil-ouro');
  await ev(`(()=>{ const j=__nns, S=j.S.sim; for (const m of S.misseis) m.ativo=0; j.camTeste=null; j.camModo='perto'; return 1 })()`);
  // aspecto metálico do casco
  await cam(`n.rumo + Math.PI/2 + 0.5`, 0.36, 0.1); await aquece(0.5); await esp(1200); await foto('4-navio-metal');
  // números de dano de várias armas
  await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; const br=n.rumo+0.35; a.x=n.x+Math.sin(br)*900; a.z=n.z-Math.cos(br)*900; const L=[['canhao',127,184],['rbu',120,22],['foguete',70,6],['drone',60,12]]; L.forEach(([t,c,d],q)=>S.evento({ t:'impacto', x:a.x+q*8, y:a.C.F*0.8, z:a.z, alvo:a.id, dono:n.id, tipo:t, cal:c, dano:d, apl:d })); j.processaEventos(); return 1 })()`);
  await ev(`(()=>{ const st=document.createElement('style'); st.id='congela'; st.textContent='.dano-f.on{animation:none!important;opacity:1!important}'; document.head.appendChild(st); return 1 })()`); await cam(`n.rumo + 0.35`, 1, 0.06); await aquece(0.15); await esp(500); await foto('5-numeros-dano'); log.push('overlap-dano ' + await sobrepoe()); await ev(`(()=>{ document.getElementById('congela').remove(); return 1 })()`);
}

// HUD do leme: regulador travado a 20° BE
await ev(`(()=>{ const h=__nns.hud; h.lemeTrava=0.57; h.setLeme(0.57); return 1 })()`); await passos(0.5); await cam(`n.rumo + 0.3`, 1, 0.08); await aquece(0.2); await esp(900); await foto('3-hud-leme-regulador'); log.push('overlap ' + await sobrepoe());
log.push('leme ' + await ev(`JSON.stringify({ cmd: __nns.eu.lemeCmd, txt: (document.querySelector('[data-r=regT]')||{}).textContent, reg: !!document.querySelector('.ac-reg'), c: !!document.querySelector('[data-a=lemeC]') })`));
await ev(`(()=>{ document.querySelector('[data-a=lemeC]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); window.dispatchEvent(new PointerEvent('pointerup')); return 1 })()`); await passos(0.2);
log.push('apos C ' + await ev(`JSON.stringify({ cmd: __nns.eu.lemeCmd, trava: __nns.hud.lemeTrava })`));
log.push('erros ' + JSON.stringify(await ev(`JSON.stringify((window.__erros||[]).slice(0,5))`)));
console.log(log.join('\n')); fs.writeFileSync(`${dir}/${fmt}-log.txt`, log.join('\n')); b.fecha(); process.exit(0);
