// v1.2.26 NUCLEAR — teste no Chrome headless (SwiftShader: só A/B vale). Partida frota em 'atois', navio 'atlantico' com C.nuclear injetado.
// Fase 1: caminho integrado (botão NUCLEAR 2 toques → comando → decola → solta → detona) + 0 exceções.
// Fase 2: câmera FIXA a 6,5 km; A/B de tempo de quadro (média, p95, p99, máx = picos/travadas) e draw calls: 6 s SEM efeito vs. janelas do efeito; programas novos; nós de áudio criados.
// Uso: URL=http://127.0.0.1:4187/?auto CAP=<pasta> node --experimental-websocket tests/nuclear1226-chrome.mjs
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4187/?auto', CAP = process.env.CAP || '/tmp', Q = process.env.Q || 'alta';
const b = await abre(URL, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const out = { qualidade: Q };
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
// contador de nós de áudio criados (prova de 0 nós em combate)
await ev(`(()=>{ window.__nos = 0; const P = (window.AudioContext||window.webkitAudioContext).prototype, B = BaseAudioContext.prototype; for (const k of Object.getOwnPropertyNames(B)) if (/^create/.test(k) && typeof B[k]==='function') { const o = B[k]; B[k] = function(...a){ window.__nos++; return o.apply(this, a); }; } void P; return 1 })()`);
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='${Q}'; await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'atlantico', seed: 11 }); __nns.tutorial=false; __nns.hud.dica&&__nns.hud.dica(null); return 1 })()`, 180000);
await esp(3000);
out.inj = await ev(`(()=>{ const j=__nns, n=j.eu; n.C = Object.assign(Object.create(Object.getPrototypeOf(n.C)), n.C, { nuclear: { bombas: 1 } }); j.criaNuclear(true); j.S.sim.t = Math.max(j.S.sim.t, 121); return JSON.stringify({ classe: n.tipo, nk: !!j.nuke }) })()`);
await esp(1500); await b.foto(`${CAP}/hud-botao-nuclear.png`);
// FASE 1: botão (2 toques) contra o inimigo mais próximo travado
const vigia = (async () => { for (let i = 0; i < 1200; i++) { await esp(500); try { if (await ev('window.__fotoBomb === 1')) { await b.foto(`${CAP}/0-bombardeiro-em-voo.png`); await ev('(window.__fotoBomb = 2, 1)'); return; } } catch { return; } } })();
out.fase1 = await ev(`(async()=>{ const j=__nns, S=j.S, sim=S.sim, n=j.eu; let best=null, bd=1e9; for (const e of sim.navios) if (!e.morto && e.time!==n.time) { const d=Math.hypot(e.x-n.x,e.z-n.z); if (d<bd) { bd=d; best=e; } }
  S.comando({ t:'travar', alvo: best.id }); await new Promise(r=>setTimeout(r,400)); const btn=document.querySelector('[data-a=nuke]'); const vis = btn && !btn.hidden && getComputedStyle(btn).display!=='none'; const q1 = btn && btn.querySelector('em') && btn.querySelector('em').textContent;
  j.acao ? 0 : 0; const tap = () => { btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles:true, pointerId:1, pointerType:'touch' })); btn.dispatchEvent(new PointerEvent('pointerup', { bubbles:true, pointerId:1, pointerType:'touch' })); btn.click && 0; };
  tap(); await new Promise(r=>setTimeout(r,300)); const q2 = btn.querySelector('em').textContent; tap(); await new Promise(r=>setTimeout(r,600)); await new Promise(r=>setTimeout(r,2500)); const ev0 = { decolou: sim.nukes.some(q=>q.ativo) }; let foto = 0, fim = '';
  const t0 = performance.now(); while (performance.now()-t0 < 600000) { if (sim.nukeDet.length) { fim = 'detonou'; break; } if (!sim.nukes.some(q=>q.ativo || q.b.ativo)) { fim = 'sem bombardeiro/bomba ativos (abatido/interceptado)'; break; }
    const q = sim.nukes.find(q=>q.ativo && q.fase===2); if (!foto && q && q.y > 400) { foto = 1; const c=j.cam, ac=j.atualizaCamera; j.atualizaCamera=function(){ const qq=sim.nukes[q.idx]; c.position.set(qq.x+38, qq.y+9, qq.z+26); c.lookAt(qq.x, qq.y, qq.z); c.updateMatrixWorld(); }; for (const el of document.querySelectorAll('#hud,.hud,#ui')) el.style.visibility='hidden'; await new Promise(r=>setTimeout(r,2500)); window.__fotoBomb = 1; while (window.__fotoBomb === 1) await new Promise(r=>setTimeout(r,200)); j.atualizaCamera=ac; for (const el of document.querySelectorAll('#hud,.hud,#ui')) el.style.visibility=''; }
    await new Promise(r=>setTimeout(r,500)); }
  return JSON.stringify({ botaoVisivel: vis, rotulo1: q1, rotulo2: q2, ...ev0, distAlvo: Math.round(bd), detonou: sim.nukeDet.length, det: sim.nukeDet[0] ? { mortos: sim.nukeDet[0].mortos.length, danos: sim.nukeDet[0].danos.length, y: Math.round(sim.nukeDet[0].y) } : null, fim, segReais: Math.round((performance.now()-t0)/1000), simT: Math.round(sim.t), shake: j.mem.shake, somNuclear: j.audio.diag && j.audio.diag.ev && j.audio.diag.ev.nuclear || null }) })()`, 700000);
console.log('fase1', out.fase1); await esp(4000);
// FASE 2: câmera fixa; A/B
await ev(`(()=>{ const j=__nns, c=j.cam; j.atualizaCamera=function(){ c.position.set(6000,30,7500); c.lookAt(6000,1300,1000); c.updateMatrixWorld(); }; for (const el of document.querySelectorAll('#hud,.hud,#ui')) el.style.visibility='hidden'; j.nuke.slots.forEach(s=>s.ativo=0); return 1 })()`);
await esp(20000); // deixa o 1º efeito terminar de sumir de vista (ele ficou ativo; ver acima) e estabiliza
const mede = (seg, tag) => ev(`(async()=>{ const j=__nns, R=j.R; const p0=(R.info.programs||[]).length, n0=window.__nos; const DC=[], FT=[], NK=[]; const orig=j._laco; let ult=0; const np=j.nuke.passo.bind(j.nuke); j.nuke.passo=(...a)=>{ const t=performance.now(); np(...a); NK.push(performance.now()-t); };
  j._laco=(t)=>{ const a=performance.now(); orig(t); FT.push(performance.now()-a); DC.push(R.info.render.calls); }; cancelAnimationFrame(j._raf); j._raf=requestAnimationFrame(j._laco);
  await new Promise(r=>setTimeout(r, ${seg}*1000)); j._laco=orig; j.nuke.passo=np; const s=[...FT].sort((a,b)=>a-b), m=(a)=>a.reduce((x,y)=>x+y,0)/Math.max(1,a.length), pc=(p)=>s[Math.min(s.length-1, Math.floor(p*s.length))];
  const sl = j.nuke.slots.find(x=>x.ativo); return JSON.stringify({ tag:'${tag}', T: sl ? +(j.nuke.tl-sl.t0).toFixed(1) : null, quadros: FT.length, ms_med:+m(FT).toFixed(2), ms_p95:+pc(0.95).toFixed(2), ms_p99:+pc(0.99).toFixed(2), ms_max:+s[s.length-1].toFixed(2), dc_med:Math.round(m(DC)), dc_max:Math.max(...DC), nuke_cpu_ms_med:+m(NK).toFixed(3), nuke_cpu_ms_max:+Math.max(0,...NK).toFixed(3), puffs: j.nuke.st.puffs||0, programas_novos:(R.info.programs||[]).length-p0, nos_audio_criados: window.__nos-n0 }) })()`, seg * 1000 + 60000);
const A = []; A.push(JSON.parse(await mede(10, 'SEM efeito (base)')));
await ev(`(()=>{ __nns.nuke.detona(6000, 150, 1000); return 1 })()`);
// capturas em T alvo (tempo de efeito = nuke.tl - t0)
const T = async () => +(await ev(`(()=>{ const n=__nns.nuke, s=n.slots.find(x=>x.ativo); return s ? n.tl - s.t0 : -1 })()`));
const capT = async (alvo, nome) => { for (let i = 0; i < 400; i++) { if ((await T()) >= alvo) break; await esp(40); } await b.foto(`${CAP}/${nome}.png`); return +(await T()).toFixed(2); };
out.capturas = {}; out.capturas.flash = await capT(0.08, '1-clarao');
A.push(JSON.parse(await mede(3, 'clarão + bola de fogo + choque (T 0–3 s)')));
out.capturas.choque_wilson = await capT(3.4, '2-onda-choque-wilson');
out.capturas.coluna_anel = await capT(7, '3-anel-agua-coluna');
A.push(JSON.parse(await mede(6, 'coluna/surge + capa subindo (T ~7–13 s)')));
out.capturas.cogumelo_jovem = await capT(18, '4-cogumelo-18s');
A.push(JSON.parse(await mede(6, 'cogumelo crescendo (T ~18–24 s)')));
out.capturas.cogumelo = await capT(40, '5-cogumelo-40s');
A.push(JSON.parse(await mede(6, 'cogumelo maduro + céu escuro (T ~40–46 s)')));
out.capturas.cogumelo_tardio = await capT(75, '6-cogumelo-75s');
out.ab = A; out.erros = b.erros.slice(0, 8); out.avisos = b.avisos.filter((x) => /nuclear|nk|three/i.test(x)).slice(0, 5);
console.log(JSON.stringify(out, null, 1)); fs.writeFileSync(`${CAP}/../medicoes-chrome-${Q}.json`, JSON.stringify(out, null, 1)); b.fecha(); process.exit(0);
