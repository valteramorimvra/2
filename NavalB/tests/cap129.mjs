// v1.2.9 — auditoria boca do cano 3D × simulação (todas as classes) + capturas: Estaleiro (arsenal com lança-granadas, cores), água, câmera míssil, CONVÉS, impacto de torpedo
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/129'; fs.mkdirSync(dir, { recursive: true }); const log = [];
const so = process.argv[2] || 'tudo';
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(3000);
if (so === 'tudo' || so === 'audit') {
  const r = await ev(`(()=>{ const j=__nns, V=j.vitrine; const ks=[...document.querySelectorAll('[data-c]')].map(e=>e.dataset.c); const out=[]; let max=0, n=0;
    for (const k of ks) { j.mostraVitrine(k); const nv=V.navio, g=nv.g; const P=j._layout(k); g.updateMatrixWorld(true); const inv=g.matrixWorld.clone().invert();
      P.torres.forEach((b,i)=>{ const R=nv.torres[i]; if(!R) return; const az=b.frente>0?0.5:Math.PI-0.5, el=0.3; R.g.rotation.y=b.frente>0?-az:az+Math.PI; R.piv.rotation.x=el; const nc=b.canos||1;
        for (let c=0;c<nc;c++){ const cn=c===2?R.cano3:c===1?R.cano2:R.cano; if(!cn) { out.push(k+' t'+i+' c'+c+' sem cano'); continue; } cn.position.z=0; g.updateMatrixWorld(true); const v=new cn.position.constructor(0,0,-(R.lcLocal||5)); cn.localToWorld(v); v.applyMatrix4(inv);
          const lado=nc>1?(2*c-(nc-1))/(nc-1):0, Lc=b.lc-b.pz, ce=Math.cos(el); const sx=Math.sin(az)*Lc*ce+Math.cos(az)*lado*b.esp, sy=b.y+b.py+Math.sin(el)*b.lc, sz=b.z-Math.cos(az)*Lc*ce+Math.sin(az)*lado*b.esp;
          const e=Math.hypot(v.x-sx,v.y-sy,v.z-sz); n++; if(e>max) max=e; if(e>1) out.push(k+' t'+i+' c'+c+' '+e.toFixed(2)+'m 3d='+[v.x,v.y,v.z].map(q=>q.toFixed(1))+' sim='+[sx,sy,sz].map(q=>q.toFixed(1))+' tz='+b.z.toFixed(1)+' gz='+R.g.position.z.toFixed(1)+' gry='+R.g.rotation.y.toFixed(2)+' par='+(R.g.parent&&R.g.parent.name)); } }); }
    return JSON.stringify({ classes: ks.length, canos: n, maxErro: +max.toFixed(3), acima1m: out.slice(0,20) }) })()`, 120000);
  log.push('auditoria-boca ' + r); }
if (so === 'tudo' || so === 'fotos') {
  await ev(`(()=>{ document.querySelector('[data-c=haiyan]').click(); return 1 })()`); await esp(3000); await ev(`(()=>{ const e=[...document.querySelectorAll('li, div, p, span')].reverse().find(q=>/^Lança-granadas/.test(q.textContent.trim())); if(e) e.scrollIntoView({block:'center'}); return !!e })()`); await esp(600); await b.foto(`${dir}/estaleiro-arsenal-lanca-granadas.png`);
  log.push('arsenal ' + await ev(`JSON.stringify([...document.querySelectorAll('li')].map(e=>e.textContent).filter(t=>/granad/i.test(t)))`));
  await ev(`(()=>{ document.querySelector('[data-c=fragata]').click(); return 1 })()`); await esp(2500); await ev(`(()=>{ const V=__nns.vitrine; V.auto=false; V.ang=2.3; V.zoom=0.7; V.elev=0.15; return 1 })()`); await esp(3500); await b.foto(`${dir}/navio-cores-fragata.png`);
  await ev(`(()=>{ document.querySelector('[data-c=tianlong]').click(); return 1 })()`); await esp(2500); await ev(`(()=>{ const V=__nns.vitrine; V.auto=false; V.ang=2.3; V.zoom=0.7; V.elev=0.15; return 1 })()`); await esp(3500); await b.foto(`${dir}/navio-cores-tianlong.png`);
  await ev(`(async()=>{ __nnsUI.save.ajustes.camModo='perto'; await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500);
  const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${s}*60;i++){ S.passo([]); if (i%3===2) { j.processaEventos(); j.atualizaProjeteis(1/20); j.fx.passo(1/20); } } j.processaEventos(); return 1 })()`, 120000);
  const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
  await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time); window.__a=a.id; for (const e of S.navios) if (e!==a && e!==n) e.x += (e.time===n.time?-1:1)*30000; const br=n.rumo+0.35; a.x=n.x+Math.sin(br)*7000; a.z=n.z-Math.cos(br)*7000; a.v=0; a.sam=0; n.telAlvo=4; n.v=n.C.vmax*0.8; n.alvoId=a.id; n.trava=1; n.mira.az=br; return 1 })()`);
  await passos(3); await ev(`(()=>{ const j=__nns, n=j.eu; j.camModo='perto'; j.yaw=j.yawAlvo=n.rumo+2.4; j.pitch=j.pitchAlvo=0.1; j.distCamF=j.distCamS=0.8; j.camPos=null; return 1 })()`); await aquece(0.5); await esp(1500); await b.foto(`${dir}/agua-natural.png`);
  // câmera MÍSSIL com trajetória
  log.push('lanca ' + await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; n.tVls=0; n.alvoId=a.id; const p0=S.prontidao; S.prontidao=()=>({ok:true}); const r=S.lancaMissil(n, a.id, 1); S.prontidao=p0; j.camModo='missil'; j.mem.trans=0; return r })()`));
  for (let q = 0; q < 6; q++) { await passos(0.5); await esp(400); }
  log.push('missilcam ' + await ev(`JSON.stringify({ modo: __nns.camModo, linha: __nns.fx.linhaMis.userData.n, vis: __nns.fx.linhaMis.visible })`)); await b.foto(`${dir}/camera-missil-trajetoria.png`);
  await ev(`(()=>{ const j=__nns; for (const m of j.S.sim.misseis) m.ativo=0; j.camModo='perto'; return 1 })()`); await passos(1);
  // câmera CONVÉS disparando
  await ev(`(()=>{ const j=__nns, n=j.eu; n.v=0; n.telAlvo=1; j.camModo='conves'; j.mem.trans=0; j.yaw=j.yawAlvo=n.mira.az; j.pitch=j.pitchAlvo=0.02; j.camPos=null; return 1 })()`); await esp(1200);
  await ev(`(()=>{ const j=__nns, n=j.eu; for (const t of n.torres) t.rec=0; j.acao('fogo'); for (let i=0;i<40;i++){ j.S.sim.passo([]); } j.processaEventos(); return 1 })()`); await esp(250); await b.foto(`${dir}/camera-conves-disparo.png`);
  log.push('conves ' + await ev(`JSON.stringify({ modo: __nns.camModo, cam: __nns.cam.position.toArray().map(v=>Math.round(v)) })`)); await ev(`(()=>{ __nns.acao('fogoSolta'); return 1 })()`);
  // impacto de torpedo
  await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; const br=n.rumo+0.5; a.x=n.x+Math.sin(br)*700; a.z=n.z-Math.cos(br)*700; a.rumo=br+Math.PI/2; a.ciws=[]; a.a30=[]; const tp=S.torpedos.find(q=>!q.ativo); Object.assign(tp, { ativo:1, x:a.x-Math.sin(br)*300, y:-2.5, vy:0, sub:1, z:a.z+Math.cos(br)*300, rumo:br, rumoAlvo:br, v:200, dono:n.id, time:n.time, alvo:a.id, corrida:300, modo:'reto', t:5, buscando:0, danoMul:1, alcMax:0, leve:0, lancha:0 }); j.camModo='perto'; j.yaw=j.yawAlvo=br+0.15; j.pitch=j.pitchAlvo=0.05; j.distCamF=j.distCamS=1.3; j.camPos=null; let k=0; while (tp.ativo && k<240) { S.passo([]); k++; } j.processaEventos(); return k })()`);
  await aquece(0.9); await esp(400); await b.foto(`${dir}/torpedo-impacto-coluna.png`);
}
log.push('erros ' + JSON.stringify(b.erros.slice(0, 4))); console.log(log.join('\n')); fs.writeFileSync(`${dir}/log-${so}.txt`, log.join('\n')); b.fecha(); process.exit(0);
