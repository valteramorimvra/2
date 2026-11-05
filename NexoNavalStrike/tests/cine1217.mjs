// v1.2.17 itens 29 e 30: CINEMA das armas do navio (IA assume/devolve, planos rasante/canhão/órbita, segue granada de canhão em ALTA RESOLUÇÃO, foguete/RBU e torpedo até o impacto
// com estrondo; câmera NUNCA dentro de casco nem d'água; som 3D relativo à câmera; 0 programas WebGL novos) + RADAR com direção da MIRA (tempo real) e da PROA.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const D = '/workspace/nexo-naval-shots/1217/cinema/'; fs.mkdirSync(D, { recursive: true }); fs.mkdirSync('/workspace/nexo-naval-shots/1217/radar30', { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`window.__erros=[]; window.addEventListener('error', e=>__erros.push(String(e.message))); window.addEventListener('unhandledrejection', e=>__erros.push(String(e.reason))); 1`);
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 7, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 180000); await esp(6000);
// ---- item 30: radar
const rad = []; for (const dg of [0, 70, 160, -110]) { await ev(`(()=>{ const j=__nns; j.yaw = j.yawAlvo = j.eu.rumo + ${dg}*Math.PI/180; return 1 })()`); await esp(600);
  rad.push(JSON.parse(await ev(`(()=>{ const j=__nns, H=j.hud; return JSON.stringify({ yaw:+(j.yaw).toFixed(3), mira: H.radarMiraAz==null?null:+H.radarMiraAz.toFixed(3), rumo:+j.eu.rumo.toFixed(3) }) })()`)));
  await b.foto(`/workspace/nexo-naval-shots/1217/radar30/mira_${dg}.png`); }
R.radar = rad; for (const r of rad) if (r.mira == null || Math.abs(Math.atan2(Math.sin(r.mira - r.yaw), Math.cos(r.mira - r.yaw))) > 0.15) falhas.push('radar: mira não acompanha o giro ' + JSON.stringify(r));
R.prog0 = +(await ev(`__nns.R.info.programs.length`));
// ---- item 29: cinema — inimigo trazido a 4 km para haver tiros/torpedos
await ev(`(()=>{ const j=__nns, sim=j.S.sim, eu=j.eu; const e=sim.navios.find(q=>q.time!==eu.time&&!q.morto); e.x=eu.x+Math.sin(eu.rumo+1.2)*3200; e.z=eu.z-Math.cos(eu.rumo+1.2)*3200; j.camSel('cinema'); return 1 })()`); await esp(2500);
R.iaEntrou = await ev(`__nns.eu.controleIA`); await b.foto(D + 'plano-inicial.png');
const r = JSON.parse(await ev(`(()=>{ const j=__nns, sim=j.S.sim, eu=j.eu, C=j.cine, cam=j.cam; const st={passos:0, dentroCasco:0, abaixoAgua:0, minAlt:1e9, planos:{}, kinds:{}, segueAltaRes:0, impactos:0, tiros:0, torp:0, vls:0, pan:0, paninv:0, maxSeg:0};
  for (let k=0;k<60*150;k++){ sim.passo(); for (const e of sim.eventos){ if(e.id===eu.id){ if(e.t==='tiro')st.tiros++; if(e.t==='torpLanc')st.torp++; if(e.t==='vls')st.vls++; } C.evento(e, eu, sim); } sim.eventos.length=0; if(!C.on) C.entra(false); C.passo(1/60, cam); st.passos++;
    const p=cam.position; st.minAlt=Math.min(st.minAlt, p.y); if (C.plano && !C.corte.tipo) st.planos[C.plano]=(st.planos[C.plano]||0)+1; if (C.corte.tipo==='segue'){ st.kinds[C.corte.kind]=(st.kinds[C.corte.kind]||0)+1; if (C.segueG && C.segueG.ativo) st.segueAltaRes++; } if (C.corte.tipo==='impacto' && C.corte.t<1/59) st.impactos++;
    for (const n of sim.navios){ if(n.afundou) continue; const dx=p.x-n.x, dz=p.z-n.z, c=Math.cos(n.rumo), s=Math.sin(n.rumo), lx=dx*c+dz*s, lz=-dx*s+dz*c; if (Math.abs(lx)<n.C.B*0.5 && Math.abs(lz)<n.C.L*0.5 && p.y-(n.arfagem||0) < n.C.F) st.dentroCasco++; }
    if (p.y < 0.6) st.abaixoAgua++; }
  st.minAlt=+st.minAlt.toFixed(2); st.foraCasco=C.foraCasco||0; st.foraAgua=C.foraAgua||0; st.ia=eu.controleIA; return JSON.stringify(st) })()`, 900000));
R.cine = r;
if (r.dentroCasco) falhas.push('câmera dentro de casco ' + r.dentroCasco); if (r.abaixoAgua) falhas.push("câmera abaixo d'água " + r.abaixoAgua);
if (!r.planos.rasante || !r.planos.canhao) falhas.push('faltam planos rasante/canhão ' + JSON.stringify(r.planos));
if (!r.kinds.granada || !r.segueAltaRes) falhas.push('não seguiu granada de canhão em alta resolução'); if (!r.impactos) falhas.push('sem corte de impacto');
if (R.iaEntrou !== 1 || r.ia !== 1) falhas.push('IA não assumiu no cinema');
// fotos com o laço real (seguindo projétil quando houver)
await ev(`(()=>{ const C=__nns.cine; C.plano=''; C.iPlano=-1; C.corte.tipo=''; return 1 })()`); await esp(2500); await b.foto(D + 'rasante.png');
await ev(`(()=>{ const C=__nns.cine; C.tPlano=0; return 1 })()`); await esp(2500); await b.foto(D + 'canhao.png');
await ev(`(()=>{ const j=__nns, C=j.cine; C._segue('granada'); return 1 })()`); for (let i = 0; i < 12; i++) { if (await ev(`!!(__nns.cine.segueG && __nns.cine.segueG.ativo)`)) break; await esp(800); }
R.fotoSegue = await ev(`!!(__nns.cine.segueG && __nns.cine.segueG.ativo && __nns.fx && 1)`); await b.foto(D + 'segue-projetil.png');
R.pan = JSON.parse(await ev(`(()=>{ const j=__nns, p=j.cam.position, d=j.cam.getWorldDirection(new j.cam.position.constructor()); const rx=p.x+d.z*100, rz=p.z-d.x*100; return JSON.stringify({ direita:+j.pan(p.x - d.z*100, p.z + d.x*100).toFixed(2), frente:+j.pan(p.x+d.x*100,p.z+d.z*100).toFixed(2) }) })()`));
if (Math.abs(R.pan.frente) > 0.1 || Math.abs(R.pan.direita) < 0.9) falhas.push('pan não relativo à câmera ' + JSON.stringify(R.pan));
R.passagens0 = await ev(`__nns.audio.passagens||0`); R.passagens = await ev(`(async()=>{ const A=__nns.audio; if (A.ctx && A.ctx.state!=='running') await A.ctx.resume().catch(()=>{}); A.passagem(25, 0.6, 820, false); A.passagem(40, -0.4, 260, true); return A.passagens||0 })()`); if (!(R.passagens >= R.passagens0 + 2)) falhas.push('passagem 3D não tocou');
R.progFim = +(await ev(`__nns.R.info.programs.length`)); if (R.progFim > R.prog0) falhas.push(`programas WebGL novos: ${R.prog0} → ${R.progFim}`);
await ev(`(()=>{ __nns.cine.sai(); return 1 })()`); await esp(1500); R.iaSaiu = await ev(`__nns.eu.controleIA`); if (R.iaSaiu !== 0) falhas.push('IA não devolveu o controle ao sair do cinema');
R.erros = await ev(`JSON.stringify(__erros)`); if (R.erros !== '[]') falhas.push('erros JS ' + R.erros);
R.falhas = falhas; fs.writeFileSync('/workspace/cine1217.out', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R, null, 1)); b.fecha(); process.exit(0);
