// v1.2.12 — capturas (leque, mercante no mapa/minimapa, navio novo disparando, explosão na câmera de míssil, torpedo) + programas WebGL (qualidade fixa) + erros
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1212'; fs.mkdirSync(dir, { recursive: true }); const log = [];
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.dev=true; await __nnsUI.zarpar({ mapa: 'cordilheira', modo: 'frota', classe: 'colosso', seed: 8, hora: 'dia', tempo: 'limpo', portaAvioes: true }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000); await esp(2500);
log.push('navios ' + await ev(`JSON.stringify({ n: __nns.S.sim.navios.length, merc: __nns.S.sim.navios.filter(n=>n.C.mercante).map(n=>n.time).join(',') })`));
const np = () => ev(`(__nns.R.info.programs||[]).length`); const p0 = await np(); await ev(`(()=>{ window.__pk0=new Set((__nns.R.info.programs||[]).map(p=>p.cacheKey)); return 1 })()`); const novos = async (et) => log.push('novos@' + et + ' ' + await ev(`(__nns.R.info.programs||[]).filter(p=>!window.__pk0.has(p.cacheKey)).map(p=>p.name+':'+(p.cacheKey||'').slice(0,120)).join(' || ') || '-'`));
const passos = (s) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${s}*60;i++){ S.passo([]); if (i%3===2) { j.processaEventos(); j.atualizaProjeteis(1/20); j.fx.passo(1/20); } } j.processaEventos(); return 1 })()`, 180000);
const passosA = (s) => ev(`(()=>{ const j=__nns, S=j.S; for (let i=0;i<${s}*60;i++){ S.avanca(1/60); if (i%3===2) { j.processaEventos(); j.atualizaProjeteis(1/20); j.fx.passo(1/20); S.sim.eventos.length=0; } } j.processaEventos(); return 1 })()`, 180000);
const aquece = (seg) => ev(`(()=>{ const j=__nns, S=j.S.sim; for (let i=0;i<${seg}*30;i++){ j.atualizaNavios(1/30, S.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); } return 1 })()`, 120000);
// 1) mercante aliado de perto + minimapa (alcance do radar no mercante)
await passos(6);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const m=S.navios.find(q=>q.C.mercante && q.time===n.time && !q.morto); window.__m=m.id; n.x=m.x - Math.sin(m.rumo+1.2)*900; n.z=m.z + Math.cos(m.rumo+1.2)*900; const o={...j.local(m, -m.C.B*4.5, m.C.F+42, m.C.L*0.2)}; const a={...j.local(m, 0, m.C.F+6, -m.C.L*0.1)}; j.camTeste={ p:[o.x,o.y,o.z], a:[a.x,a.y,a.z], fov:55 }; return 1 })()`); await aquece(0.3); await esp(1800); await b.foto(`${dir}/2-mercante-minimapa.png`);
log.push('rotulo mercante ' + await ev(`[...document.querySelectorAll('.tag.merc')].filter(e=>!e.hidden).map(e=>e.querySelector('b').textContent).join(',') || 'nenhum'`));
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`);
// 2) Colosso disparando (toque único no CANHÃO; câmera lateral)
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time && !e.C.mercante && !e.morto); window.__a=a.id; const br=n.rumo+1.25; a.x=n.x+Math.sin(br)*6000; a.z=n.z-Math.cos(br)*6000; a.v=0; S.comando ? 0 : 0; j.S.comando({ t: 'travar', alvo: a.id }); return 1 })()`); await passos(2);
await ev(`(()=>{ const j=__nns, n=j.eu; for (const t of n.torres) t.rec=0; window.__tiros=0; const ev0=j.S.sim.evento.bind(j.S.sim); j.S.sim.evento=(x)=>{ if (x.t==='tiro' && x.id===n.id) window.__tiros++; return ev0(x); }; j.acao('fogo'); j.acao('fogoSolta'); return 1 })()`);
await passosA(9); log.push('tiros do Colosso com 1 toque (fila da sessão) ' + await ev(`window.__tiros`));
await ev(`(()=>{ const j=__nns, n=j.eu; for (const t of n.torres) t.rec=0; j.acao('fogo'); j.acao('fogoSolta'); return 1 })()`);
for (let k = 0; k < 400; k++) { const ok = await ev(`(()=>{ const j=__nns; j.S.avanca(1/60); j.processaEventos(); j.atualizaProjeteis(1/60); j.fx.passo(1/60); j.S.sim.eventos.length=0; return j.eu.torres.filter(t=>t.recuo>0.5).length>=2 ? 1 : 0 })()`); if (ok) { log.push('salva visível após ' + k + ' quadros'); break; } }
await ev(`(()=>{ const j=__nns, n=j.eu; const o={...j.local(n, n.C.B*5.5, n.C.F+30, -n.C.L*0.45)}; const a={...j.local(n, 0, n.C.F+8, -n.C.L*0.05)}; j.camTeste={ p:[o.x,o.y,o.z], a:[a.x,a.y,a.z], fov:58 }; return 1 })()`); await aquece(0.12); await esp(1200); await b.foto(`${dir}/3-colosso-disparando.png`);
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`); await passos(8);
// 3) câmera de MÍSSIL: explosão no impacto
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const a=S.navios.filter(e=>e.time!==n.time && !e.C.mercante && !e.morto).sort((p,q)=>q.C.L-p.C.L)[0]; window.__a=a.id; n.alvoId=a.id; n.trava=1; a.vida=a.C.vida; const br=n.rumo+1.25; a.x=n.x+Math.sin(br)*4200; a.z=n.z-Math.cos(br)*4200; a.sam=0; a.chaff=0; a.lasers=null; n.mods=n.mods||{}; n.mods.missilEf={ dano: 1, pkCiws: 0 }; n.tVls=0; const p0=S.prontidao; S.prontidao=()=>({ok:true}); S.lancaMissil(n, a.id, 3); S.prontidao=p0; j.camSel('missil'); return 1 })()`);
let foto4 = false;
for (let k = 0; k < 1500 && !foto4; k++) { const r = await ev(`(()=>{ const S=__nns.S.sim, j=__nns; let hit=null; for (let i=0;i<2 && !hit;i++){ const vel={}; for (const m of S.misseis) if (m.ativo && m.dono===j.eu.id) vel[m.idx]=[m.vx,m.vy,m.vz]; S.passo([]); for (const e of S.eventos) if (e.t==='impacto' && e.tipo==='missil' && e.dono===j.eu.id) { const v=vel[e.idx]||[1,0,0]; const L=Math.hypot(...v)||1; hit={x:e.x,y:e.y,z:e.z,ux:v[0]/L,uy:v[1]/L,uz:v[2]/L}; } j.processaEventos(); j.atualizaProjeteis(1/60); j.fx.passo(1/60); S.eventos.length=0; } if (hit) { j.camTeste={ p:[hit.x-hit.ux*170+hit.uz*60, Math.max(30,hit.y+38), hit.z-hit.uz*170-hit.ux*60], a:[hit.x, hit.y+8, hit.z], fov:50 }; return 1 } return 0 })()`); if (r) { await aquece(0.35); await esp(700); await b.foto(`${dir}/4-camera-missil-explosao.png`); foto4 = true; await ev(`(()=>{ __nns.camTeste=null; return 1 })()`); } }
await novos('missil'); log.push('explosão capturada ' + foto4 + ' cam ' + await ev(`__nns.camModo`));
await passos(3);
await novos('antes-duelo');
// 4) torpedo: partida de duelo com destróier (tubos garantidos)
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'duelo', classe: 'destroier', seed: 4, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000); await esp(2000);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo=1; const a=S.navios.find(e=>e.time!==n.time && !e.C.mercante); window.__a=a.id; const br=n.rumo+1.3; a.x=n.x+Math.sin(br)*1800; a.z=n.z-Math.cos(br)*1800; a.v=0; a.telAlvo=0; a.chaff=0; j.S.comando({ t: 'travar', alvo: a.id }); return 1 })()`); await passosA(6);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const a=S.navios[window.__a]; n.tTorp=0; n.miraSobre=1; n.mira.az=Math.atan2(a.x-n.x,-(a.z-n.z)); const L=S.lancaTorpedo(n, a.id); window.__L=L+':'+JSON.stringify(S.eventos.filter(e=>e.t==='naoPronto')); return 1 })()`); await passos(2.2);
log.push('torpedos ativos ' + await ev(`__nns.S.sim.torpedos.filter(t=>t.ativo).length + ' ' + window.__L`));
await ev(`(()=>{ const j=__nns, S=j.S.sim; const tp=S.torpedos.find(t=>t.ativo); if (!tp) return 0; j.camTeste={ p:[tp.x - Math.sin(tp.rumo)*14 + Math.cos(tp.rumo)*8, 4, tp.z + Math.cos(tp.rumo)*14 + Math.sin(tp.rumo)*8], a:[tp.x + Math.sin(tp.rumo)*6, 0, tp.z - Math.cos(tp.rumo)*6], fov:50 }; return 1 })()`); await aquece(0.1); await esp(900); await b.foto(`${dir}/5-torpedo.png`);
await ev(`(()=>{ __nns.camTeste=null; return 1 })()`);
let torpHit = 0; for (let k = 0; k < 40 && !torpHit; k++) torpHit = await ev(`(()=>{ const S=__nns.S.sim, j=__nns; let h=0; for (let i=0;i<10;i++){ S.passo([]); for (const e of S.eventos) if (e.t==='torpImpacto') h=1; j.processaEventos(); j.atualizaProjeteis(1/60); j.fx.passo(1/60); S.eventos.length=0; } return h })()`);
if (torpHit) { await ev(`(()=>{ const j=__nns, S=j.S.sim; const a=S.navios[window.__a]; j.camTeste={ p:[a.x+230, 60, a.z+230], a:[a.x, 14, a.z], fov:50 }; return 1 })()`); await aquece(0.3); await esp(700); await b.foto(`${dir}/6-torpedo-impacto.png`); await ev(`(()=>{ __nns.camTeste=null; return 1 })()`); }
log.push('torpedo acertou ' + !!torpHit); await novos('torpedo');
// 5) leque aberto na partida (programas) e anônimos
await ev(`(()=>{ __nns.hud.camMenu(true); return 1 })()`); await esp(600); await ev(`(()=>{ __nns.hud.camMenu(false); return 1 })()`);
const p1 = await np(); log.push(`programas WebGL: inicio ${p0} fim ${p1} novos ${p1 - p0} (qualidade fixa alta)`);
log.push('erros ' + JSON.stringify(b.erros.slice(0, 5))); console.log(log.join('\n')); fs.writeFileSync(`${dir}/log.txt`, log.join('\n')); b.fecha(); process.exit(0);
