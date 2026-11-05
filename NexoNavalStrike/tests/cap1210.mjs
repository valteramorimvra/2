// v1.2.9 — auditoria boca do cano 3D × simulação (todas as classes) + capturas: Estaleiro (arsenal com lança-granadas, cores), água, câmera míssil, CONVÉS, impacto de torpedo
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1210'; fs.mkdirSync(dir, { recursive: true }); const log = [];
const so = process.argv[2] || 'tudo';
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(3000);

{
  await ev(`(async()=>{ __nnsUI.save.ajustes.camModo='perto'; await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500);
  const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${s}*60;i++){ S.passo([]); if (i%3===2) { j.processaEventos(); j.atualizaProjeteis(1/20); j.fx.passo(1/20); } } j.processaEventos(); return 1 })()`, 120000);
  const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
  await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time); window.__a=a.id; for (const e of S.navios) if (e!==a && e!==n) e.x += (e.time===n.time?-1:1)*30000; const br=n.rumo+0.35; a.x=n.x+Math.sin(br)*7000; a.z=n.z-Math.cos(br)*7000; a.v=0; a.sam=0; a.ciws=[]; a.a30=[]; n.telAlvo=1; n.v=0; n.alvoId=a.id; n.trava=1; n.mira.az=br; return 1 })()`);
  await passos(2);
  // 1) míssil em ARCO visto de lado
  log.push('lanca ' + await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; n.tVls=0; const p0=S.prontidao; S.prontidao=()=>({ok:true}); const r=S.lancaMissil(n, a.id, 1); S.prontidao=p0; j.camModo='missil'; j.camAnt='perto'; j.camMisObj=S.misseis.find(m=>m.ativo && m.dono===n.id); return r })()`));
  let ap = 0; for (let q = 0; q < 5; q++) { await passos(0.4); ap = Math.max(ap, +(await ev(`Math.max(0,...__nns.S.sim.misseis.filter(m=>m.ativo).map(m=>m.y))`))); }
  log.push('apice ' + ap.toFixed(0));
  await ev(`(()=>{ const j=__nns, n=j.eu, a=j.S.sim.navios[window.__a]; const mx=(n.x+a.x)/2, mz=(n.z+a.z)/2, dx=a.x-n.x, dz=a.z-n.z, L=Math.hypot(dx,dz); const px=-dz/L, pz=dx/L; j.camTeste={ p:[mx+px*2300-dx*0.1, 40, mz+pz*2300-dz*0.1], a:[mx, 190, mz], fov:75 }; return 1 })()`); await aquece(0.1); await esp(1200); await b.foto(`${dir}/missil-arco-trajetoria.png`);
  await passos(3); await ev(`(()=>{ const j=__nns; j.camTeste=null; for (const m of j.S.sim.misseis) m.ativo=0; j.camModo='perto'; return 1 })()`); await passos(0.5);
  // 2) câmera do CANHÃO alinhada ao cano
  await ev(`(()=>{ const j=__nns, n=j.eu; j.camModo='conves'; j.mem.trans=0; j.yaw=j.yawAlvo=n.mira.az; j.pitch=j.pitchAlvo=0.02; j.camPos=null; return 1 })()`); await passos(2); await esp(1500);
  await ev(`(()=>{ const j=__nns, n=j.eu; for (const t of n.torres) t.rec=0; j.acao('fogo'); for (let i=0;i<30;i++){ j.S.sim.passo([]); } j.processaEventos(); return 1 })()`); await esp(300); await b.foto(`${dir}/camera-canhao-cano.png`);
  log.push('canhao ' + await ev(`JSON.stringify({ modo: __nns.camModo, az: +__nns.eu.torres[0].az.toFixed(2), el: +__nns.eu.torres[0].el.toFixed(3) })`)); await ev(`(()=>{ __nns.acao('fogoSolta'); return 1 })()`);
  // 3) HUD: ícones das torres girados (mira a ~50° por boreste)
  await ev(`(()=>{ const j=__nns, n=j.eu; j.camModo='perto'; j.yaw=j.yawAlvo=n.rumo+0.9; j.pitch=j.pitchAlvo=0.1; j.camPos=null; return 1 })()`); await passos(3); await esp(1500);
  log.push('icones ' + await ev(`JSON.stringify([...document.querySelectorAll('.fogo-ico .tg')].map(g=>g.style.transform)) + ' torres ' + JSON.stringify(__nns.eu.torres.map(t=>+(t.az*57.3).toFixed(0)))`)); await b.foto(`${dir}/hud-icones-torre-girando.png`);
  // 4) binóculo no zoom máximo
  await ev(`(()=>{ const j=__nns, n=j.eu; j.acao('bino'); const a=j.S.sim.navios[window.__a]; const br=Math.atan2(a.x-n.x, -(a.z-n.z)), d=Math.hypot(a.x-n.x,a.z-n.z); j.yaw=j.yawAlvo=br; const hc=n.P.mastro-n.C.L*0.09+1; j.pitch=j.pitchAlvo=Math.atan2(hc-a.C.F*0.5, d); j.zoomBino=5.2; return 1 })()`); await aquece(0.5); await esp(1500); await b.foto(`${dir}/binoculo-zoom-max.png`);
  log.push('bino ' + await ev(`JSON.stringify({ fov: +__nns.cam.fov.toFixed(2), zoom: document.querySelector('[data-r=zoom]').textContent })`)); await ev(`(()=>{ __nns.acao('bino'); return 1 })()`);
}
log.push('erros ' + JSON.stringify(b.erros.slice(0, 4))); console.log(log.join('\n')); fs.writeFileSync(`${dir}/log.txt`, log.join('\n')); b.fecha(); process.exit(0);
