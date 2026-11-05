// v1.2.25 item 1 (navegador): arrastar a mira para CIMA eleva os canos do MODELO 3D; a granada sai pelo eixo do cano do modelo (< 0,5°). Fotos antes/depois.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto'; const R = {}, falhas = [];
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.vai(URL); for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await ev(`(()=>{ const j=__nns; j.camSel('canhao'); j.yawAlvo=j.eu.rumo+0.9; j.pitchAlvo=0.02; return 1 })()`); await esp(5000);
R.antes = JSON.parse(await ev(`JSON.stringify({ el: __nns.eu.torres[0].el*57.3, elD: __nns.eu.mira.elD })`)); await b.foto('/workspace/capturas1225/elevacao_antes.png');
await ev(`(()=>{ const j=__nns; j.pitchAlvo=-0.28; return 1 })()`); await esp(7000);
R.depois = JSON.parse(await ev(`JSON.stringify({ el: __nns.eu.torres[0].el*57.3, elD: __nns.eu.mira.elD, pitch: __nns.pitch })`)); await b.foto('/workspace/capturas1225/elevacao_depois.png');
await ev(`(()=>{ const j=__nns, s=j.S.sim, n=j.eu, T=j.THREE; window.__cap=[]; const ev0=s.evento.bind(s); s.evento=(e)=>{ if(e.t==='tiro'&&e.id===n.id&&e.gi>=0&&__cap.length<12){ const g=s.granadas[e.gi], lado=e.canos>1?(2*e.cano-(e.canos-1))/(e.canos-1):0; const L={...s.P_(n,e.torre,lado)}; const VB=s.velBoca(n,L,{}); const r=j.navios[n.id], G=r.g; G.rotation.set(n.caturro+(n.trimDano||0)+(n.morto?0:(Math.abs(n.v)/n.C.vmax)*0.006), -n.rumo, -(n.adorno+n.balanco+(n.lista||0))); const tr=n.torres[e.torre], RT=r.torres[e.torre]; RT.g.rotation.y = n.P.torres[e.torre] && n.P.torres[e.torre].frente<0 ? tr.az+Math.PI : -tr.az; RT.piv.rotation.x=tr.el; G.updateMatrixWorld(true); const d=new T.Vector3(); RT.cano.getWorldDirection(d); d.multiplyScalar(-1); const v=new T.Vector3(g.vx-VB.x,g.vy-VB.y,g.vz-VB.z).normalize(); __cap.push({ erro: Math.acos(Math.min(1,d.dot(v)))*57.2958, elCano: Math.asin(d.y)*57.2958, elTiro: Math.asin(v.y)*57.2958, direto: !!(n.sol&&n.sol.direto) }); } return ev0(e); }; return 1 })()`);
for (let k = 0; k < 8; k++) { await ev(`(()=>{ __nns.acao('fogo'); return 1 })()`); await esp(1500); }
const C = JSON.parse(await ev(`JSON.stringify(window.__cap)`)); R.tiros = C; R.erroMax = C.length ? Math.max(...C.map((c) => c.erro)) : null; await b.foto('/workspace/capturas1225/elevacao_tiro.png');
if (!(R.depois.el > R.antes.el + 5)) falhas.push('cano não subiu ' + JSON.stringify([R.antes, R.depois])); if (!(C.length >= 2 && R.erroMax < 0.5)) falhas.push('saída × cano ' + R.erroMax + ' n=' + C.length);
R.falhas = falhas; fs.writeFileSync('/workspace/elev1225b.json', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log(falhas.length ? 'FALHOU: ' + falhas.join(' | ') : 'OK'); await b.fecha(); process.exit(0);
