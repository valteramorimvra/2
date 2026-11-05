// v1.2.25 item 11 — câmera 3/4 LATERAL-ELEVADA: no ciclo do botão CÂMERA, navio do jogador ocupando 70–90 % da largura, elevação 15–25°, órbita e zoom.
// + item 1: foto dos canos ELEVADOS vistos de fora (mira acima do horizonte, depois troca para a 3/4). Paisagem e retrato.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto'; const R = { paisagem: {}, retrato: {} }, falhas = [];
for (const [nome, w, h] of [['paisagem', 915, 412], ['retrato', 412, 915]]) {
  const b = await abre(null, { w, h }); const ev = b.ev, esp = b.espera; const Q = R[nome];
  await b.vai(URL); for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
  for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
  /* ciclo do botão: perto → tresq */ const ciclo = []; for (let k = 0; k < 5; k++) { await ev(`(()=>{ __nns.acao('cam'); return 1 })()`); await esp(400); ciclo.push(await ev(`__nns.camModo`)); } Q.ciclo = ciclo;
  while ((await ev(`__nns.camModo`)) !== 'tresq') { await ev(`(()=>{ __nns.acao('cam'); return 1 })()`); await esp(300); }
  const medir = async (arq) => { /* espera 3 s de TEMPO DE JOGO (headless roda a ~3 fps: 5 s reais ≈ 1,5 s de jogo) */ const t0 = await ev(`__nns.S.sim.t`); for (let i = 0; i < 120; i++) { await esp(500); if ((await ev(`__nns.S.sim.t`)) - t0 >= 3) break; } const m = JSON.parse(await ev(`(()=>{ const j=__nns, n=j.eu, c=j.cam; const f=j.fracaoNavio(n); const dx=c.position.x-n.x, dz=c.position.z-n.z, dy=c.position.y-(n.arfagem+n.C.F*0.9); return JSON.stringify({ fracao:+f.toFixed(3), elev:+(Math.atan2(dy,Math.hypot(dx,dz))*57.3).toFixed(1), rel:+(((j.yaw-n.rumo)*57.3)%360).toFixed(0), dist:Math.round(Math.hypot(dx,dy,dz)) }) })()`)); await b.foto(`/workspace/capturas1225/tresq_${arq}_${nome}.png`); return m; };
  Q.padrao = await medir('padrao');
  await ev(`(()=>{ const j=__nns; j.yawAlvo=j.eu.rumo+Math.PI/2; j.pitchAlvo=0.3; return 1 })()`); Q.traves = await medir('traves');
  await ev(`(()=>{ const j=__nns; j.yawAlvo=j.eu.rumo+2.4; j.pitchAlvo=0.42; return 1 })()`); Q.orbita = await medir('orbita');
  await ev(`(()=>{ const j=__nns; j.distCamF=1.5; return 1 })()`); Q.zoomFora = await medir('zoom'); await ev(`(()=>{ __nns.distCamF=1; return 1 })()`);
  /* item 1: canos elevados — mira no céu na câmera do canhão e volta para a 3/4 (a mira mantém a última pontaria) */
  await ev(`(()=>{ const j=__nns; j.camSel('canhao'); j.yawAlvo=j.eu.rumo+1.2; j.pitchAlvo=-0.28; return 1 })()`); await esp(6000); Q.elCano = await ev(`+(__nns.eu.torres[0].el*57.3).toFixed(1)`);
  await ev(`(()=>{ const j=__nns; j.camSel('tresq'); j.yawAlvo=j.eu.rumo+1.6; j.pitchAlvo=0.3; return 1 })()`); Q.canosElevados = await medir('canos_elevados'); Q.elCanoDepois = await ev(`+(__nns.eu.torres[0].el*57.3).toFixed(1)`);
  for (const k of ['padrao', 'traves', 'orbita']) { const m = Q[k]; if (!(m.fracao >= 0.7 && m.fracao <= 0.9)) falhas.push(`${nome}/${k} fração ${m.fracao}`); if (!(m.elev >= 14.5 && m.elev <= 25.5)) falhas.push(`${nome}/${k} elevação ${m.elev}`); }
  if (!(Q.zoomFora.fracao < Q.padrao.fracao)) falhas.push(nome + ' zoom não afastou'); if (!ciclo.includes('tresq')) falhas.push(nome + ' tresq fora do ciclo'); if (!(Q.elCanoDepois > 10)) falhas.push(nome + ' canos não elevados ' + Q.elCanoDepois);
  await b.fecha(); }
R.falhas = falhas; fs.writeFileSync('/workspace/tresq1225.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log(falhas.length ? 'FALHOU: ' + falhas.join(' | ') : 'OK'); process.exit(0);
