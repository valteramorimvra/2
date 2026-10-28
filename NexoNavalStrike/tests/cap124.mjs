// v1.2.4 — capturas: míssil em voo, torpedo e inimigo em chamas, cada um de PERTO e de LONGE.
// Uso: node --experimental-websocket tests/cap124.mjs [20x9|16x9] [saida=/workspace/nexo-naval-shots/124]
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const fmt = process.argv[2] || '20x9'; const dir = process.argv[3] || '/workspace/nexo-naval-shots/124'; fs.mkdirSync(dir, { recursive: true });
const [W, H] = fmt === '16x9' ? [733, 412] : [915, 412];
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); const ev = b.ev, esp = b.espera; const log = [];
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const foto = async (n) => { await b.foto(`${dir}/${fmt}-${n}.png`); log.push('foto ' + n); };
const zarpa = async (o) => { await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.save.ajustes.camModo='perto'; if (__nns && __nns.rodando) __nns.encerra(); await __nnsUI.zarpar(${JSON.stringify(o)}); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await esp(1500); };
const corre = (s) => ev(`(()=>{ const g=__nns; for (let i=0;i<${s}*60;i++){ g.S.avanca(1/60); if (i%6===5) g.processaEventos(); } g.processaEventos(); return 1 })()`, 120000);
const congela = `(()=>{ const S=__nns.S; if (!S._av) { S._av = S.avanca; S.avanca = ()=>{}; } return 1 })()`, solta = `(()=>{ const S=__nns.S; if (S._av) { S.avanca = S._av; S._av = null; } for (const e of document.querySelectorAll('.dano-f')) e.style.animationPlayState=''; return 1 })()`;
const esperaNum = async () => { for (let i = 0; i < 40; i++) { const o = +(await ev(`Math.max(0, ...[...document.querySelectorAll('.dano-f')].filter(e=>e.textContent).map(e=>+getComputedStyle(e).opacity))`)); if (o > 0.85) { await ev(`(()=>{ for (const e of document.querySelectorAll('.dano-f')) e.style.animationPlayState='paused'; return 1 })()`); return o; } await esp(60); } return 0; };
const prep = (dist, rel) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.revelaTudo = 1; j.mem.revelaTudo = 1; const alvo = S.navios.find(e=>e.time!==n.time && !e.morto && e.C.tier===n.C.tier) || S.navios.find(e=>e.time!==n.time); for (const e of S.navios) if (e!==alvo && e!==n) { e.x += (e.time===n.time? -1 : 1) * 30000; } const br = n.rumo + ${rel}; alvo.x = n.x + Math.sin(br)*${dist}; alvo.z = n.z - Math.cos(br)*${dist}; alvo.telAlvo = 1; alvo.ciws = []; alvo.a30 = []; alvo.sam = 0; alvo.chaff = 0; alvo.papel='bot'; for (let k=0;k<30;k++) S.passo(); j.S.comando({t:'travar', alvo: alvo.id}); n.trava = 1; window.__alvo = alvo.id; j.yaw=j.yawAlvo=br + 0.25; j.pitch=j.pitchAlvo=0.1; return alvo.id })()`);

const olha = (expr, dist, pitch = 0.08, dy = 0) => ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; const p=${expr}; if (!p) return 0; j.camModo='perto'; j.bino=0; j.yaw=j.yawAlvo=Math.atan2(p.x-n.x, -(p.z-n.z)) + ${dy}; j.pitch=j.pitchAlvo=${pitch}; j.distCamF=j.distCamS=${dist}; return 1 })()`);
await zarpa({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }); await prep(9000, 1.2); await esp(1200);
await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu; S.ameacas.ligadas=0; n.alvoId=window.__alvo; n.trava=1; n.tVls=0; n.vls=Math.max(n.vls,4); n.avaria.vls=1; S.lancaMissil(n, window.__alvo, 1); return 1 })()`);
await corre(2.2); await ev(`(()=>{ __nns.camModo='longe'; return 1 })()`); await olha(`S.misseis.find(m=>m.ativo && m.t>=0)`, 1.6, 0.03, 0.3); await esp(1200);
log.push('míssil longe: ' + await ev(`(()=>{ const j=__nns, m=j.S.sim.misseis.find(m=>m.ativo); if(!m) return 'sem míssil'; const c=j.cam.position; return 'dist câmera ' + Math.round(Math.hypot(m.x-c.x,m.y-c.y,m.z-c.z)) + ' m, escala ' + j.escTela(m.x,m.y,m.z,6,14).toFixed(2) })()`)); await foto('2-missil-longe');
await corre(1.5); await ev(`(()=>{ __nns.camModo='missil'; return 1 })()`); await esp(1800); await foto('1-missil-perto');
await corre(25);
await prep(2600, 1.4); await esp(600); await ev(`(()=>{ const j=__nns, n=j.eu; n.torp=Math.max(n.torp||0,2); n.tTorp=0; j.S.comando({t:'torpedo', alvo: window.__alvo}); return 1 })()`); await corre(4);
await olha(`S.torpedos.find(t=>t.ativo)`, 0.45, 0.32); await esp(1500); await foto('3-torpedo-perto');
await ev(`(()=>{ __nns.camModo='longe'; return 1 })()`); await corre(2); await olha(`S.torpedos.find(t=>t.ativo)`, 1.4, 0.18); await ev(`(()=>{ __nns.camModo='longe'; return 1 })()`); await esp(1500);
log.push('torpedo longe: ' + await ev(`(()=>{ const j=__nns, t=j.S.sim.torpedos.find(t=>t.ativo); if(!t) return 'sem torpedo'; const c=j.cam.position; return 'dist câmera ' + Math.round(Math.hypot(t.x-c.x,t.z-c.z)) + ' m, escala ' + j.escTela(t.x,0,t.z,6,12).toFixed(2) })()`)); await foto('4-torpedo-longe');
const fogo = async (dist, nome) => { const r = await ev(`(()=>{ const j=__nns, S=j.S.sim, n=j.eu, a=S.navios[window.__alvo]; for (const t of S.torpedos) t.ativo=0; for (const m of S.misseis) m.ativo=0; const br=n.rumo+1.4; a.x=n.x+Math.sin(br)*${dist}; a.z=n.z-Math.cos(br)*${dist}; a.telAlvo=0; a.v=0; a.vida=a.C.vida*0.3; a.incendio=40; a.lista=0.08;
  const rr=j.navios[a.id]; rr.focos.length=0; for (let q=0;q<3;q++) { const lz=(q-1)*a.C.L*0.25; const c=Math.cos(a.rumo), s=Math.sin(a.rumo); S.evento({ t:'impacto', x:a.x + (a.C.B*0.5)*c - lz*s, y:a.C.F*0.6, z:a.z + (a.C.B*0.5)*s + lz*c, alvo:a.id, dono:n.id, tipo:'missil', dano: 900 }); } j.processaEventos(); for (let k=0;k<30;k++) S.passo(); return JSON.stringify({ focos: rr.focos.length, dano: +(1-a.vida/a.C.vida).toFixed(2) }) })()`);
  await olha(`S.navios[window.__alvo]`, 1, 0.04); await esp(4500); log.push(nome + ' ' + r); await foto(nome); };
await fogo(700, '5-inimigo-chamas-perto'); await fogo(5500, '6-inimigo-chamas-longe');
log.push('erros: ' + JSON.stringify(b.erros.slice(0, 5)));
console.log(log.join('\n')); fs.writeFileSync(`${dir}/${fmt}-log.txt`, log.join('\n') + '\n'); b.fecha(); process.exit(0);
