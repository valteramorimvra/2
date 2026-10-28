// v1.2.5 — capturas: impacto de míssil, torpedo acertando, disparo do canhão, close do casco, ilha, raspando na ilha, VLS PRONTO/FORA,
// teste drive, Estaleiro (frota) e batalha. Uso: node --experimental-websocket tests/cap125.mjs [20x9|16x9] [hud]
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const fmt = process.argv[2] || '20x9'; const soHud = process.argv.includes('hud'); const dir = process.env.DIR || '/workspace/nexo-naval-shots/125'; fs.mkdirSync(dir, { recursive: true });
const [W, H] = fmt === '16x9' ? [733, 412] : [915, 412];
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); const ev = b.ev, esp = b.espera; const log = [];
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const foto = async (n) => { await b.foto(`${dir}/${fmt}-${n}.png`); log.push('foto ' + n); };
const zarpa = async (o) => { await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.camModo='perto'; if (__nns && __nns.rodando) __nns.encerra(); await __nnsUI.zarpar(${JSON.stringify(o)}); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500); };
const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${s}*60;i++){ S.passo([]); if (i%6===5) j.processaEventos(); } j.processaEventos(); return 1 })()`, 120000);
const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis && j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
const cam = (yawExpr, dist, pitch = 0.08) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; j.camModo='perto'; j.bino=0; j.yaw=j.yawAlvo=${yawExpr}; j.pitch=j.pitchAlvo=${pitch}; j.distCamF=j.distCamS=${dist}; j.camPos=null; return 1 })()`);
/* alvo a dist m no través de boreste, parado; demais navios afastados */
const poe = (dist, rel = 1.4) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a = window.__a != null ? S.navios[window.__a] : S.navios.find(e=>e.time!==n.time); window.__a=a.id; for (const e of S.navios) if (e!==a && e!==n && !e._fora) { e.x += (e.time===n.time?-1:1)*30000; e._fora=1; } const br=n.rumo+${rel}; a.x=n.x+Math.sin(br)*${dist}; a.z=n.z-Math.cos(br)*${dist}; a.rumo=n.rumo; a.telAlvo=1; a.v=0; a.vida=a.C.vida; n.telAlvo=1; n.v=0; S.sensores && S.sensores(); return a.id })()`);
const yawA = `Math.atan2(S.navios[window.__a].x-n.x, -(S.navios[window.__a].z-n.z))`;
const mira = () => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; n.alvoId=a.id; n.trava=1; n.mira.az=Math.atan2(a.x-n.x, -(a.z-n.z)); n.tMiraCmd=1; j.marc=null; return 1 })()`);
await zarpa({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' });
if (!soHud) {
  // 1) impacto de míssil (explosões múltiplas + DANOS)
  await poe(380, 0.45); await cam(yawA + ' + 0.22', 0.55, 0.1); await passos(0.5);
  await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; for (let q=0;q<2;q++) S.evento({ t:'impacto', x:a.x+q*12, y:a.C.F*0.8, z:a.z, alvo:a.id, dono:n.id, tipo:'missil', dano:2400+q*350, apl:2400+q*350 }); j.processaEventos(); return 1 })()`); await aquece(0.12); await esp(400); await foto('1-impacto-missil');
  // 2) torpedo acertando
  await passos(3); await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__a]; S.evento({ t:'torpImpacto', x:a.x, z:a.z, alvo:a.id, dono:n.id, dano:3100, apl:3100 }); j.processaEventos(); return 1 })()`); await aquece(0.3); await foto('2-torpedo-acertando'); if (process.argv.includes('imp')) { console.log(log.join('\n')); b.fecha(); process.exit(0); }
  // 3) disparo do canhão (clarão, fumaça, recuo, traçante)
  await mira(); await cam(`n.rumo + 0.5`, 0.55, 0.1); await passos(1); await ev(`(()=>{ const j=__nns, n=j.eu; for (const t of n.torres) t.rec=0; j.acao('fogo'); j.S.sim.passo([]); j.processaEventos(); return 1 })()`); await aquece(0.12); await esp(400); await foto('3-disparo-canhao');
  // 4) close do casco (textura)
  await passos(2); await cam(`n.rumo + Math.PI/2 + 0.35`, 0.32, 0.06); await aquece(0.5); await esp(800); await foto('4-casco-textura');
  // 5) ilha (terra mais próxima)
  const ilha = await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, T=S.T; let best=null, bd=1e9; for (let a=0;a<6.28;a+=0.1) for (let r=300;r<6000;r+=150){ const x=n.x+Math.sin(a)*r, z=n.z-Math.cos(a)*r; if (j.alturaT ? 0 : 0) {} if (window.__h && window.__h(x,z) > 8 && r<bd){ bd=r; best=a; break; } } return JSON.stringify({best,bd}) })()`);
  log.push('ilha ' + ilha);
}
// VLS PRONTO / FORA e HUD
if (!process.argv.includes('semhud')) {
await ev(`(()=>{ const S=__nns.S.sim, n=__nns.eu; const a=S.navios.find(e=>e.time!==n.time && !e.morto && e.id!==window.__a); window.__a=a.id; return a.id })()`); await poe(4000, 0.1); await mira(); await passos(1.2); await mira(); await cam(yawA, 1, 0.08); await aquece(0.3); await esp(900); await foto('8-hud-vls-pronto'); log.push('rotulos-pronto ' + await ev(`JSON.stringify([...document.querySelectorAll('[data-r=q_vls],[data-r=q_torp]')].map(e=>e.textContent))`));
await poe(21000, 0.1); await mira(); await passos(0.6); await mira(); await cam(yawA, 1, 0.08); await esp(900); await foto('9-hud-vls-fora');
log.push('rotulos-fora ' + await ev(`JSON.stringify([...document.querySelectorAll('[data-r=q_vls],[data-r=q_torp]')].map(e=>e.textContent))`));
}
if (!soHud) {
  // 6) raspando numa ilha: põe o navio rumo à costa mais próxima
  const raspa = await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const h=(x,z)=>{ const T=S.T, N=T.n, i=Math.floor((x/T.tam+0.5)*N), k=Math.floor((z/T.tam+0.5)*N); return (i<0||k<0||i>=N||k>=N)?-99:T.h[k*N+i]; }; let best=null, bd=1e9; for (let a=0;a<6.28;a+=0.05) for (let r=200;r<9000;r+=50){ const x=n.x+Math.sin(a)*r, z=n.z-Math.cos(a)*r; if (h(x,z) > -n.C.T){ if (r<bd){ bd=r; best={a,x,z}; } break; } } if (!best) return 'sem costa'; const d=n.C.L*0.6+60; n.x=best.x-Math.sin(best.a)*d; n.z=best.z+Math.cos(best.a)*d; n.rumo=best.a+0.45; n.v=n.C.vmax*0.6; n.telAlvo=3; window.__ilha=best; return JSON.stringify({bd:Math.round(bd)}) })()`);
  await passos(4); const st = await ev(`JSON.stringify({ encalhe: __nns.eu.encalhe, v: +__nns.eu.v.toFixed(1), tRaspa: __nns.eu.tRaspa, vida: Math.round(__nns.eu.vida/__nns.eu.C.vida*100) })`); log.push('raspa ' + raspa + ' ' + st);
  await cam(`Math.atan2(window.__ilha.x-n.x, -(window.__ilha.z-n.z)) + 0.9`, 1.1, 0.16); await aquece(0.6); await esp(900); await foto('6-raspando-ilha');
  await cam(`Math.atan2(window.__ilha.x-n.x, -(window.__ilha.z-n.z))`, 1.4, 0.03); await aquece(0.3); await esp(900); await foto('5-ilha');
  // 10) batalha com a frota nova: 3 inimigos em linha a 1,6 km
  await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; n.x-=Math.sin(n.rumo)*0; let k=0; for (const e of S.navios) if (e.time!==n.time && !e.morto && k<4) { const br=n.rumo+1.2+(k-1.5)*0.12; e.x=n.x+Math.sin(br)*(1500+k*250); e.z=n.z-Math.cos(br)*(1500+k*250); e.rumo=n.rumo; e.telAlvo=2; k++; } return k })()`); await passos(2); await cam(`n.rumo + 1.2`, 1.1, 0.07); await aquece(0.4); await esp(900); await foto('10-batalha-frota');
  // 11) teste drive
  await ev(`(async()=>{ if (__nns.rodando) __nns.encerra(); __nnsUI.testeDrive('destroier'); return 1 })()`); for (let i = 0; i < 60; i++) { if (await ev(`!!(__nns && __nns.rodando)`)) break; await esp(500); } await esp(1500); await ev(`(()=>{ __nns.tutorial=false; __nns.hud.dica(null); const n=__nns.eu; n.telAlvo=4; return 1 })()`); await passos(6); await cam(`n.rumo + 0.6`, 1.2, 0.1); await aquece(0.4); await esp(900); await foto('11-teste-drive');
  log.push('treino ' + await ev(`JSON.stringify({ modo: __nns.S.match.modo, alvos: __nns.S.sim.navios.filter(q=>q.papel==='alvo').length, vls: __nns.eu.vls })`));
  // v1.2.6: óptica com retícula mil e drone (DECOLAR → órbita 100 m)
  if (process.env.DIR) { await zarpa({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 8, hora: 'dia', tempo: 'limpo' });
    await ev(`(()=>{ window.__a=null; return 1 })()`); await ev(`(()=>{ const S=__nns.S.sim, n=__nns.eu; const a=S.navios.find(e=>e.time!==n.time); window.__a=a.id; return 1 })()`); await poe(3000, 0.2); await mira(); await cam(yawA, 1, 0.02);
    await ev(`(()=>{ __nns.acao('bino'); return 1 })()`); await passos(0.5); await esp(1500); await foto('13-optica-mil'); if (process.env.SO_OPT) { console.log(log.join('\n')); b.fecha(); process.exit(0); }
    // navios novos de perto (cada inimigo de través a 330 m)
    const ids = JSON.parse(await ev(`JSON.stringify(__nns.S.sim.navios.filter(e=>e.time!==__nns.eu.time && !e.morto).map(e=>e.id))`));
    await ev(`(()=>{ if (__nns.bino) __nns.acao('bino'); return 1 })()`); await esp(600);
    for (const id of ids.slice(0, 5)) { await ev(`(()=>{ window.__a=${id}; const S=__nns.S.sim; for (const e of S.navios) e._fora=0; return 1 })()`); await poe(240, 1.3); await cam(yawA + ' + 0.42', 0.5, 0.16); await passos(0.3); await aquece(0.3); await esp(1200);
      const nm = await ev(`(()=>{ const a=__nns.S.sim.navios[${id}]; return a.C.id + '-' + a.C.nacao })()`); await foto('15-navio-' + nm); }
    await ev(`(()=>{ if (__nns.bino) __nns.acao('bino'); return 1 })()`); log.push('drone-rot-antes ' + await ev(`(()=>{ const e=document.querySelector('[data-r=q_drone]'); return e && e.textContent })()`));
    await ev(`(()=>{ __nns.acao('drone'); return 1 })()`); await esp(1200); await passos(25); log.push('drone ' + await ev(`(()=>{ const n=__nns.eu, u=__nns.S.sim.uavs[n.uav]; return JSON.stringify(u ? { y: Math.round(u.y), fase: u.fase } : null) })()`));
    await ev(`(()=>{ __nns.acao('drone'); return 1 })()`); await aquece(0.3); await esp(1500); await foto('14-drone-orbita'); }
  // 12) Estaleiro
  await ev(`(()=>{ if (__nns.rodando) __nns.encerra(); __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(2500); await foto('12-estaleiro-frota');
}
log.push('erros: ' + JSON.stringify(b.erros.slice(0, 5)));
console.log(log.join('\n')); fs.writeFileSync(`${dir}/${fmt}-log.txt`, log.join('\n') + '\n'); b.fecha(); process.exit(0);
