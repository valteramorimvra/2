// v1.2.17 item 17: a trava do MÍSSIL leva tempo (~2,2 s radar ativo / ~3,4 s passivo, depois da trava do radar); o progresso aparece no botão VLS
// (anel interno âmbar crescendo + "TRAVANDO n%"), o estado TRAVADO é distinto (anel vermelho cheio + cadeado), e o míssil não sai antes da trava completa.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1217/trava'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const R = {}; const falhas = [];
await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa:'atois', modo:'duelo', classe:'destroier', seed: 5, hora:'dia', tempo:'limpo' }); __nns.tutorial=false; return 1 })()`, 120000);
for (let i = 0; i < 160; i++) { if (await ev(`!!(window.__nns && __nns.S && __nns.S.sim && __nns.eu)`)) break; await esp(500); }
await ev(`(()=>{ __nns.tutorial=false; return 1 })()`); await esp(800);
for (const modo of ['ativo', 'passivo']) {
  await ev(`(()=>{ const s=__nns.S.sim, n=__nns.eu; s.revelaTudo=1; const a=s.navios.find(o=>o.time!==n.time&&!o.morto); a.x=n.x+Math.sin(n.rumo+0.4)*9000; a.z=n.z-Math.cos(n.rumo+0.4)*9000; a.v=0; a.lemeCmd=0; a.telAlvo=0; n.alvoId=-1; n.trava=0; n.travaMis=0; n.radarAtivo=${modo === 'ativo' ? 1 : 0};
    window.__T={ t0:s.t, tr:null, tm:null, motivos:{}, lancouAntes:0, a:a.id }; const ps=s.passo.bind(s); if(!s.__orig) s.__orig=s.passo; s.passo=function(){ n.alvoId=a.id; n.mira.az=Math.atan2(a.x-n.x,-(a.z-n.z)); n.radarAtivo=${modo === 'ativo' ? 1 : 0}; s.__orig.call(s); const T=window.__T; if(T.tr==null&&n.trava>=1) T.tr=s.t; if(T.tm==null&&(n.travaMis||0)>=1) T.tm=s.t; const p=s.prontidao(n,'vls'); T.motivos[p.motivo]=(T.motivos[p.motivo]||0)+1; if(T.tm==null&&n.trava>=1&&!T.tenta){ T.tenta=1; const v0=n.vls; s.lancaMissil(n,a.id,1); if(n.vls<v0) T.lancouAntes=1; } }; return 1 })()`);
  let meio = null; for (let i = 0; i < 80; i++) { const q = JSON.parse(await ev(`(()=>{ const n=__nns.eu, bt=document.querySelector('[data-a=vls]'); const tv=bt&&bt.querySelector('.cb-tv'); return JSON.stringify({ tm: window.__T.tm, tr: window.__T.tr, f: +(n.travaMis||0).toFixed(2), cls: bt?bt.className:'', off: tv?getComputedStyle(tv).strokeDashoffset:'', op: tv?+getComputedStyle(tv).opacity:0, txt: (document.querySelector('[data-r=q_vls]')||{}).textContent }) })()`));
    if (!meio && q.f > 0.2 && q.f < 0.8) { meio = q; await b.foto(`${DIR}/vls-travando-${modo}.png`); } if (q.tm != null) { await esp(600); break; } await esp(250); }
  const fim = JSON.parse(await ev(`(()=>{ const bt=document.querySelector('[data-a=vls]'); const tv=bt.querySelector('.cb-tv'), lk=bt.querySelector('.cb-trv'); return JSON.stringify({ T: window.__T, cls: bt.className, stroke: getComputedStyle(tv).stroke, op: +getComputedStyle(tv).opacity, cad: +getComputedStyle(lk).opacity, txt: (document.querySelector('[data-r=q_vls]')||{}).textContent }) })()`));
  await b.foto(`${DIR}/vls-travado-${modo}.png`);
  const dt = fim.T.tm != null && fim.T.tr != null ? fim.T.tm - fim.T.tr : null; R[modo] = { dt, meio, fim }; const alvoT = modo === 'ativo' ? 2.2 : 3.4;
  if (dt == null) falhas.push(modo + ': não travou'); else if (Math.abs(dt - alvoT) > 0.35) falhas.push(`${modo}: tempo de trava ${dt.toFixed(2)} s (esperado ~${alvoT})`);
  if (!meio || !/travandoMis/.test(meio.cls) || !(meio.op > 0.5) || !/TRAVANDO \d+%/.test(meio.txt || '')) falhas.push(modo + ': progresso não visível ' + JSON.stringify(meio));
  if (!/travadoMis/.test(fim.cls) || !(fim.cad > 0.5) || /travandoMis/.test(fim.cls)) falhas.push(modo + ': estado TRAVADO não distinto ' + fim.cls);
  if (fim.T.lancouAntes) falhas.push(modo + ': míssil saiu antes da trava'); if (!fim.T.motivos.travandoMis) falhas.push(modo + ': prontidão não reportou travandoMis');
  await ev(`(()=>{ const s=__nns.S.sim; s.passo=s.__orig; return 1 })()`);
}
R.erros = b.erros.slice(0, 3); console.log(JSON.stringify(R)); const lin = `trava1217 falhas ${falhas.length} ${falhas.join(' | ')}`; console.log(lin); fs.writeFileSync('/workspace/trava1217.out', JSON.stringify(R) + '\n' + lin + '\n'); b.fecha(); process.exit(0);
