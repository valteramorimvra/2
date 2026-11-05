// v1.2.21 item 7 — coluna d'água do torpedo SEMPRE: em todos os modos (frota, duelo, reto, treino), em todas as câmeras
// (perto, longe, convés, torpedo, cinema) e na qualidade baixa (fator 0,5) com o pool de fumaça cheio; + torpedos REAIS
// (frota a 2,5 km por 90 s) contando eventos torpImpacto × colunas emitidas. 0 programas WebGL novos, 0 erros JS. Fotos.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1221/torpedo'; fs.mkdirSync(DIR, { recursive: true });
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto'; const falhas = []; const R = { modos: {}, real: null };
const MODOS = (process.env.MODOS || 'frota,duelo,reto,treino').split(','), CAMS = ['perto', 'longe', 'conves', 'torpedo', 'cinema'];
for (const modo of MODOS) { const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; await b.vai(URL);
  for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'${modo}', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
  for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
  await esp(2500); const pa = await ev(`__nns.R.info.programs.length`); const M = R.modos[modo] = { cams: {} };
  await ev(`(()=>{ const N=__nns, S=N.S.sim; window.__nTI=0; if(!S.__evO){ S.__evO=S.evento.bind(S); S.evento=(e)=>{ if(e&&e.t==='torpImpacto') window.__nTI++; return S.__evO(e); }; } return 1 })()`);
  for (const nivel of [2, 0]) for (const cam of CAMS) {
    const r = JSON.parse(await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; N.fx.setFator([0.5,0.8,1][${nivel}]); /* mesmo efeito de aplicaQualidade no fx, sem recriar mar/sombras (isso compila variantes de shader do mar, não do efeito) */ if (N.fx.agua) N.fx.agua.vida.fill(0); try { N.camSel('${cam}'); } catch(e){}
      const P=N.fx.fumaca; for (let i=0;i<P.n;i++){ P.fator=1; P.emite(eu.x+3000,30,eu.z+3000,0,1,0,'#555555',0.5,6,14,1,0,0.5); } N.fx.passo(1/30); /* pool de fumaça cheio → degradação máxima */
      const al = S.navios.find(q=>q.time!==eu.time&&!q.morto) || S.navios.find(q=>q!==eu); const fw=[Math.sin(eu.rumo),-Math.cos(eu.rumo)]; al.x=eu.x+fw[0]*700; al.z=eu.z+fw[1]*700;
      const c0=N.fx.nColunasTorp||0; const n0=window.__nTI; S.evento({ t:'torpImpacto', x:al.x+Math.cos(al.rumo)*al.C.B*0.5, z:al.z+Math.sin(al.rumo)*al.C.B*0.5, alvo:S.navios.indexOf(al), dono:-1, dano:420, apl:420 });
      window.__c0=c0; window.__n0=n0; window.__al=[al.x,al.z]; return JSON.stringify({ fator:+P.fator.toFixed(2), camModo:N.camModo, cinema: !!(N.cine && (N.cine.ativo || N.cine.on)) }) })()`));
    await esp(1800);
    const q = JSON.parse(await ev(`JSON.stringify({ eventos: window.__nTI-window.__n0, colunas: (__nns.fx.nColunasTorp||0)-window.__c0, aguaAtivas: __nns.fx.agua ? __nns.fx.agua.ativas : -1 })`));
    if (cam === 'cinema' || cam === 'longe') { await ev(`(()=>{ const N=__nns; N.__acO=N.__acO||N.atualizaCamera; N.atualizaCamera=function(dt,t){ const cam=N.cam, eu=N.eu; cam.position.set(eu.x+Math.cos(eu.rumo)*260, 25, eu.z+Math.sin(eu.rumo)*260); cam.lookAt(__al[0], 35, __al[1]); cam.fov=50; cam.updateProjectionMatrix(); }; return 1 })()`); await esp(600); await b.foto(`${DIR}/${modo}-${cam}-q${nivel}.png`); await ev(`(()=>{ __nns.atualizaCamera=__nns.__acO; return 1 })()`); }
    const k = `${cam}@q${nivel}`; M.cams[k] = { ...r, ...q }; if (q.eventos !== 1 || q.colunas !== 1 || !(q.aguaAtivas >= 150)) falhas.push(`${modo} ${k}: eventos ${q.eventos}, colunas ${q.colunas}, partículas da coluna vivas ${q.aguaAtivas}`);
    try { await ev(`(()=>{ const N=__nns; if (N.cine && N.camModo==='cinema') N.cine.sai(); N.camSel('perto'); return 1 })()`); } catch (e) {} await esp(400); }
  if (modo === 'frota' && process.env.REAL !== '0') { // torpedos reais da IA
    await ev(`(()=>{ const j=__nns, sim=j.S.sim, eu=j.eu; j.fx.setFator(1); const es=sim.navios.filter(q=>q.time!==eu.time&&!q.morto&&!q.C.mercante); es.forEach((e,i)=>{ const a=eu.rumo+0.6+i*0.4, r=2200+i*300; e.x=eu.x+Math.sin(a)*r; e.z=eu.z-Math.cos(a)*r; }); sim.navios.filter(q=>q.time===eu.time&&q!==eu).forEach((q,i)=>{ q.x=eu.x-Math.sin(eu.rumo)*(400+i*300); q.z=eu.z+Math.cos(eu.rumo)*(400+i*300); }); eu.controleIA=1; window.__r0=window.__nTI; window.__rc0=j.fx.nColunasTorp||0; return 1 })()`);
    let ult = 0; for (let s = 0; s < 18; s++) { await esp(5000); ult = await ev(`window.__nTI-window.__r0`); }
    const rr = JSON.parse(await ev(`JSON.stringify({ torpImpacto: window.__nTI-window.__r0, colunas:(__nns.fx.nColunasTorp||0)-window.__rc0, lancados: __nns.S.sim.torpedos.filter(t=>t.ativo).length })`)); R.real = rr; if (rr.colunas !== rr.torpImpacto) falhas.push(`real: ${rr.torpImpacto} impactos de torpedo × ${rr.colunas} colunas`); }
  await esp(3000); const pb = await ev(`__nns.R.info.programs.length`); M.programas = { antes: pa, depois: pb }; if (pb !== pa) falhas.push(`${modo}: programas novos ${pa}→${pb}`);
  M.erros = b.erros; if (b.erros && b.erros.length) falhas.push(`${modo}: erros JS: ` + b.erros.slice(0, 3).join(' | ')); b.fecha(); }
R.falhas = falhas; fs.writeFileSync('/workspace/torp1221.out', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); process.exit(falhas.length ? 1 : 0);
