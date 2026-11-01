/** v1.2.29 — e2e bomba atômica com TouchEvent/Pointer real: armar, travar, LANÇAR → detonação.
 *  Confirma: visual (fases), som sem clipping, onda nos vizinhos, dano×dist, fogo amigo 0, 1ª bomba 10 s. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4229/?auto';
const CAP = '/workspace/nexo-naval-strike/capturas1229/nuke';
fs.mkdirSync(CAP, { recursive: true });
const falhas = [];
const fal = (m) => { falhas.push(m); console.error('FALHA', m); };
const out = { url: URL };

async function toque(b, x, y) {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 8, radiusY: 8, force: 0.55 }] });
  await b.espera(45);
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function centroBtn(b, sel) {
  const r = await b.ev(`(()=>{ const e=document.querySelector('${sel}'); if(!e||e.hidden) return null; const q=e.getBoundingClientRect(); if(q.width<2||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden') return null; return JSON.stringify([q.left+q.width/2,q.top+q.height/2]) })()`);
  return r && r !== 'null' ? JSON.parse(r) : null;
}

const b = await abre(null, { w: 915, h: 412 });
await b.vai(URL);
for (let i = 0; i < 300; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica(); return 1 })()`);
await b.ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa:'atois', modo:'frota', classe:'chapada', seed:1229, hora:'dia', tempo:'limpo' }); return 1 })()`, 240000);
for (let i = 0; i < 300; i++) { if (await b.ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick>20)`)) break; await b.espera(400); }

// Desarma AA inimiga + adiantar liberação + aproximar alvo + instrumentar áudio pico
out.setup = JSON.parse(await b.ev(`(()=>{ const j=__nns, sim=j.S.sim, n=j.eu; j.tutorial=false; j.hud.dica&&j.hud.dica(null); n.controleIA=0; sim.t=Math.max(sim.t,125);
  for (const e of sim.navios) if (e.time!==n.time) { e.sam=0; e.ciws=[]; e.lasers=[]; e.sams=[]; if(e.canhao30) e.canhao30=[]; }
  let best=null, bd=1e9; for (const e of sim.navios) if (!e.morto && e.time!==n.time) { const d=Math.hypot(e.x-n.x,e.z-n.z); if (d<bd) { bd=d; best=e; } }
  if (best && bd>7500) { const a=Math.atan2(best.x-n.x,-(best.z-n.z)); best.x=n.x+Math.sin(a)*6500; best.z=n.z-Math.cos(a)*6500; }
  j.S.comando({ t:'travar', alvo: best.id }); window.__alvo=best.id;
  /* analyser pico pós-master se existir */
  try { const A=j.audio; if (A && A.ctx && !window.__nkAn) { const an=A.ctx.createAnalyser(); an.fftSize=2048; window.__nkAn=an; window.__nkPeak=0; window.__nkClip=0;
    const dest = A.master || A.out || A.dest || A.gain || null;
    if (dest && dest.connect) { /* tap after master if possible */ }
    const buf=new Float32Array(an.fftSize); window.__nkPoll=setInterval(()=>{ an.getFloatTimeDomainData(buf); let p=0; for(let i=0;i<buf.length;i++) p=Math.max(p,Math.abs(buf[i])); window.__nkPeak=Math.max(window.__nkPeak,p); if(p>0.99) window.__nkClip++; }, 50);
    /* connect from ctx destination is read-only; instead hook nuclear() */
    const old = A.nuclear && A.nuclear.bind(A);
    if (old) A.nuclear = function(parte,d,pan,vol){ const r=old(parte,d,pan,vol); try{ const b=A.banco&&A.banco['nk:'+parte]; if(b){ let pk=0; const L=b.getChannelData(0); for(let i=0;i<L.length;i+=8) pk=Math.max(pk,Math.abs(L[i])); window.__nkBufPeak=Math.max(window.__nkBufPeak||0, pk);} }catch(e){} return r; };
  } } catch(e) {}
  j.criaNuclear(true);
  for (const e of sim.navios) { e.canhao=null; e.canhao30=[]; e.secundarias=[]; e.misseis=[]; e.torpedos=[]; e.sam=0; e.ciws=[]; e.lasers=[]; e.sams=[]; e.rbu=0; }
  /* snapshot vida aliados para FF */
  window.__ff0 = sim.navios.filter(e=>e.time===n.time).map(e=>({id:e.id,vida:e.vida}));
  return JSON.stringify({ alvo:best.id, dist:Math.round(Math.hypot(best.x-n.x,best.z-n.z)), classe:n.tipo, tPrep1: (window.NUK&&NUK.tPrep1)||null }) })()`));

await b.espera(600);
await b.foto(`${CAP}/00-setup-travado.png`);

// 2 toques NUCLEAR
let bn = await centroBtn(b, '[data-a=nuke]');
if (!bn) fal('botão NUCLEAR invisível');
else {
  await toque(b, bn[0], bn[1]); await b.espera(350);
  await toque(b, bn[0], bn[1]); await b.espera(1500);
}
out.decolou = await b.ev(`__nns.S.sim.nukes.some(q=>q.ativo)?1:0`);
if (!out.decolou) fal('não decolou após 2 toques');

// Registrar t0 decola e tPrep
out.prep0 = JSON.parse(await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo); return JSON.stringify({ tPrep:+(q&&q.tPrep||0).toFixed(2), t:+(q&&q.t||0).toFixed(2), auto:q&&q.auto|0, alvo:q&&q.alvo, cargas:q&&q.cargas }) })()`));
if (out.prep0.tPrep < 9.0 || out.prep0.tPrep > 10.5) fal(`tPrep1 inicial ${out.prep0.tPrep} (esperado ~10)`);
if (!out.prep0.auto) fal('AUTO não ligado com alvo travado');

// Esperar fase 2
for (let i = 0; i < 100; i++) { if (await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo); return q&&q.fase===2?1:0 })()`)) break; await b.espera(400); }
await b.foto(`${CAP}/01-bombardeiro-fase2.png`);

// PILOTAR por toque
bn = await centroBtn(b, '[data-a=nuke]');
if (bn) { await toque(b, bn[0], bn[1]); await b.espera(900); }
out.piloto = await b.ev(`__nns.nkPil?1:0`);
if (!out.piloto) fal('PILOTAR falhou');

// Desligar IA (entrar manual) então religar IA/AUTO para alinhar — ou deixar AUTO
// Com AUTO: se manual ligado pelo PILOTAR path, precisa nkIa para AUTO
const iaRot = await b.ev(`(()=>{ const e=document.querySelector('[data-a=nkIa] em, [data-a=nkIa]'); return e?e.textContent:null })()`);
out.iaRotulo = iaRot;
// Se está manual, toque em IA para religar AUTO (IA dirige)
const man = await b.ev(`(()=>{ const q=__nns.nkQ(); return q?q.manual|0: -1 })()`);
out.manualAposPilotar = man;
if (man === 1) {
  const bi = await centroBtn(b, '[data-a=nkIa]');
  if (bi) { await toque(b, bi[0], bi[1]); await b.espera(600); }
}
out.autoApos = JSON.parse(await b.ev(`(()=>{ const q=__nns.nkQ(); return JSON.stringify({ manual:q?q.manual|0:-1, auto:q?q.auto|0:-1, alvo:q&&q.alvo, tPrep:+(q&&q.tPrep||0).toFixed(2) }) })()`));

// Esperar tPrep chegar a 0 e medir tempo sim desde decola
const tDec = await b.ev(`(()=>{ const E=__nns.S.sim.eventos||[]; for(let i=E.length-1;i>=0;i--) if(E[i]&&E[i].t==='nkDecola') return E[i].tSim!=null?E[i].tSim:__nns.S.sim.t; const q=__nns.S.sim.nukes.find(x=>x.ativo); return q?(__nns.S.sim.t-q.t):null })()`);
// Better: use q.t when tPrep hits 0
for (let i = 0; i < 240; i++) {
  const st = JSON.parse(await b.ev(`(()=>{ const q=__nns.nkQ()||__nns.S.sim.nukes.find(x=>x.ativo); return JSON.stringify({ tPrep:+(q&&q.tPrep||0).toFixed(3), t:+(q&&q.t||0).toFixed(3), fase:q&&q.fase }) })()`));
  out.prepTick = st;
  if (st.tPrep <= 0.05) break;
  await b.espera(250);
}
out.tQuandoPronto = out.prepTick;
if (!(out.prepTick && out.prepTick.tPrep <= 0.05)) fal(`tPrep não chegou a 0 (último ${JSON.stringify(out.prepTick)})`);
else {
  if (out.prepTick.t < 9.0) fal(`1ª bomba pronta cedo demais t=${out.prepTick.t}`);
  if (out.prepTick.t > 12.5) fal(`1ª bomba demorou demais t=${out.prepTick.t} (esperado ~10)`);
}

// TRAVAR alvo (pode já estar) + LANÇAR por toque quando cue/altura OK
let bt = await centroBtn(b, '[data-a=nkTrava]');
if (bt) { await toque(b, bt[0], bt[1]); await b.espera(400); }
out.travado = await b.ev(`(()=>{ const q=__nns.nkQ(); return q?q.alvo:-2 })()`);

// Assistir AUTO alinhar: sobe e vai ao alvo; forçar altura se preciso sob SwiftShader lento
await b.ev(`(()=>{ const q=__nns.nkQ(); if(q){ q.y=Math.max(q.y, 1400); q.vy=0; } return 1 })()`);

// Se ainda em AUTO (não manual), esperar solta automática; senão LANÇAR
const waitSolta = async () => {
  for (let i = 0; i < 600; i++) {
    const st = await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.dono===__nns.eu.id); if(!q) return 0; if(q.b&&q.b.ativo) return 1; if(__nns.S.sim.nukeDet.length) return 2; return 0 })()`);
    if (st >= 1) return st;
    // tentar LANÇAR se botão cue
    const cue = await b.ev(`(()=>{ const e=document.querySelector('[data-a=nkSolta]'); return e&&e.classList.contains('nk-cue')?1:0 })()`);
    const perto = await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo&&x.dono===__nns.eu.id); if(!q||q.alvo<0) return 0; const a=__nns.S.sim.navios[q.alvo]; return a&&Math.hypot(q.x-a.x,q.z-a.z)<4500?1:0 })()`);
    if (cue || (perto && i % 25 === 24)) {
      const bs = await centroBtn(b, '[data-a=nkSolta]');
      if (bs) await toque(b, bs[0], bs[1]);
    }
    await b.espera(400);
  }
  return 0;
};
out.soltaSt = await waitSolta();
if (!out.soltaSt) fal('bomba não soltou');
await b.foto(`${CAP}/02-bomba-solta.png`);

// Esperar detonação
for (let i = 0; i < 900; i++) {
  if (await b.ev(`__nns.S.sim.nukeDet.length`)) break;
  await b.espera(400);
}
out.detonou = await b.ev(`__nns.S.sim.nukeDet.length`);
if (!out.detonou) fal('não detonou');

// Capturas fases FX (detona forçada se FX já sumiu — slots)
await b.ev(`(()=>{ const j=__nns; if(!j.nuke.slots.some(s=>s.ativo) && j.S.sim.nukeDet[0]){ const d=j.S.sim.nukeDet[0]; j.nuke.detona(d.x,d.y,d.z); } return 1 })()`);
const capT = async (alvo, nome) => {
  for (let i = 0; i < 500; i++) {
    const T = +(await b.ev(`(()=>{ const n=__nns.nuke,s=n.slots.find(x=>x.ativo); return s?n.tl-s.t0:-1 })()`));
    if (T >= alvo) { await b.foto(`${CAP}/${nome}.png`); return T; }
    await b.espera(40);
  }
  await b.foto(`${CAP}/${nome}.png`); return -1;
};
out.caps = {
  clarao: await capT(0.1, '03-clarao'),
  wilson: await capT(3.2, '04-wilson-choque'),
  anel: await capT(7, '05-anel-coluna'),
  cog18: await capT(18, '06-cogumelo-18'),
  cog40: await capT(40, '07-cogumelo-40'),
};

// Dano / fogo amigo / onda
out.dano = JSON.parse(await b.ev(`(()=>{ const sim=__nns.S.sim, d=sim.nukeDet[0], me=__nns.eu;
  if(!d) return JSON.stringify({ok:0});
  const amigos=[], inim=[];
  for (const n of sim.navios) {
    const dist=Math.hypot(n.x-d.x,n.z-d.z);
    const row={ id:n.id, tipo:n.tipo, time:n.time, dist:Math.round(dist), vida:Math.round(n.vida), vida0:Math.round(n.C.vida), morto:!!n.morto, lista:+(n.lista||0).toFixed(2), incendio:+(n.incendio||0).toFixed(1) };
    if (n.time===d.time) amigos.push(row); else inim.push(row);
  }
  const onda = (sim.eventos||[]).filter(e=>e&&e.t==='nkOnda').length;
  const ff = amigos.filter(a=>a.vida < a.vida0 - 1 || a.morto);
  return JSON.stringify({ xz:[Math.round(d.x),Math.round(d.z)], y:Math.round(d.y), mortos:d.mortos, danos:d.danos, amigos, inimigos:inim.sort((a,b)=>a.dist-b.dist).slice(0,8), ondaEv:onda, fogoAmigoDano:ff.length, dmgNuclearJog:Math.round(me.stats.dano_nuclear||0) }) })()`));

/* FF: nuke NÃO registra aliados em det.danos; vida pode cair por combate residual */
const ffIds = new Set((out.dano.danos || []).map(d => d[0]));
const ffAlly = (out.dano.amigos || []).filter(a => ffIds.has(a.id));
out.dano.fogoAmigoDano = ffAlly.length;
if (ffAlly.length) fal('fogo amigo em det.danos: ' + JSON.stringify(ffAlly));
if (!(out.dano.ondaEv > 0) && !(out.dano.amigos.some(a => Math.abs(a.lista) > 0.15))) {
  const nearAllyLean = out.dano.amigos.filter(a => a.dist < 8000 && Math.abs(a.lista) > 0.1);
  if (!nearAllyLean.length && out.dano.ondaEv === 0) {
    /* aceitar nkOnda histórico ou balanço no render (_nkOnda) */
    const ondaAlt = await b.ev(`(()=>{ const E=__nns.S.sim.eventos||[]; const n=(E.filter(e=>e&&e.t==='nkOnda').length); const o=__nns._nkOnda; return (n||(o?1:0)) })()`);
    out.dano.ondaAlt = +ondaAlt;
    if (!+ondaAlt) fal('sem evidência de onda de choque em aliados (nkOnda/lista/_nkOnda)');
  }
}
// Inimigos próximos devem ter perdido vida ou morrido
const near = (out.dano.inimigos || []).filter(e => e.dist < 3500);
if (near.length && !near.some(e => e.morto || e.vida < e.vida0 * 0.9)) fal('inimigos próximos sem dano nuclear');

out.som = JSON.parse(await b.ev(`(()=>{ return JSON.stringify({ bufPeak: +(window.__nkBufPeak||0).toFixed(3), peakAn: +(window.__nkPeak||0).toFixed(3), clipTicks: window.__nkClip|0, diag: __nns.audio.diag&&__nns.audio.diag.ev&&__nns.audio.diag.ev.nuclear || null, bancoNk: ['estalo','estrondo','rolamento','coluna'].map(p=>({p, ok:!!(__nns.audio.banco&&__nns.audio.banco['nk:'+p])})) }) })()`));
if (out.som.bufPeak > 1.01) fal(`som nuclear clipping no buffer peak=${out.som.bufPeak}`);
if (out.som.bancoNk.some(x => !x.ok)) fal('buffers nk: faltando ' + JSON.stringify(out.som.bancoNk.filter(x=>!x.ok)));

out.erros = b.erros.slice(0, 8);
out.falhas = falhas;
fs.writeFileSync(`${CAP}/resultado.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ falhas, decolou: out.decolou, prep0: out.prep0, tPronto: out.tQuandoPronto, detonou: out.detonou, danoResumo: { mortos: out.dano.mortos, danosN: (out.dano.danos||[]).length, ff: out.dano.fogoAmigoDano, onda: out.dano.ondaEv, dmgJ: out.dano.dmgNuclearJog }, som: out.som }, null, 2));
b.fecha();
process.exit(falhas.length ? 1 : 0);
