/** v1.2.29 — A/B frame time + capturas água/navio vs 1.2.28. Mesma cena/seed. SwiftShader: só relativo vale. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const CAP = '/workspace/nexo-naval-strike/capturas1229';
fs.mkdirSync(`${CAP}/agua`, { recursive: true });
fs.mkdirSync(`${CAP}/fps`, { recursive: true });
const VERS = [
  { tag: '1228', url: 'http://127.0.0.1:4228/?auto' },
  { tag: '1229', url: 'http://127.0.0.1:4229/?auto' },
];
const SEED = 1229, MAPA = 'arquipelago', CLASSE = 'cruzador', Q = 'alta';
const LIM = 18.2; // ms — picos acima a reportar se novos na 1229
const out = { seed: SEED, mapa: MAPA, classe: CLASSE, qualidade: Q, limMs: LIM, versoes: {} };

function stats(FT) {
  const s = [...FT].sort((a, b) => a - b);
  const p = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))] || 0;
  const m = FT.reduce((a, b) => a + b, 0) / Math.max(1, FT.length);
  const over = FT.filter((x) => x > LIM);
  return {
    n: FT.length,
    p50: +p(0.5).toFixed(2),
    p95: +p(0.95).toFixed(2),
    p99: +p(0.99).toFixed(2),
    med: +m.toFixed(2),
    max: +s[s.length - 1].toFixed(2),
    over182: over.length,
    over182_pct: +((100 * over.length) / Math.max(1, FT.length)).toFixed(2),
  };
}

async function boot(b, url) {
  await b.vai(url);
  for (let i = 0; i < 200; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
  await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica(); return 1 })()`);
  await b.ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='${Q}'; await __nnsUI.zarpar({ mapa:'${MAPA}', modo:'frota', classe:'${CLASSE}', seed:${SEED}, hora:'dia', tempo:'limpo', portaAvioes:true }); __nns.tutorial=false; __nns.hud.dica&&__nns.hud.dica(null); __nns.eu.controleIA=1; return 1 })()`, 240000);
  for (let i = 0; i < 200; i++) { if (await b.ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick>40)`)) break; await b.espera(400); }
  await b.espera(4000); // pré-aquecimento shaders
}

async function fixCamNavio(b) {
  await b.ev(`(()=>{ const j=__nns, n=j.eu, c=j.cam;
    j.atualizaCamera=function(){ const yaw=n.rumo+0.55; const d=n.C.L*1.1+40;
      c.position.set(n.x+Math.sin(yaw)*d, n.C.F+n.C.L*0.18+18, n.z-Math.cos(yaw)*d);
      c.lookAt(n.x, n.C.F+4, n.z); c.updateMatrixWorld(); };
    for (const el of document.querySelectorAll('#hud,.hud,#ui,#boot')) if(el) el.style.visibility='hidden';
    return 1 })()`);
  await b.espera(800);
}
async function fixCamAgua(b) {
  await b.ev(`(()=>{ const j=__nns, n=j.eu, c=j.cam;
    j.atualizaCamera=function(){ c.position.set(n.x+80, 12, n.z+140); c.lookAt(n.x+200, 0.5, n.z+60); c.updateMatrixWorld(); };
    for (const el of document.querySelectorAll('#hud,.hud,#ui,#boot')) if(el) el.style.visibility='hidden';
    return 1 })()`);
  await b.espera(800);
}
async function fixCamNuke(b) {
  await b.ev(`(()=>{ const j=__nns, c=j.cam;
    j.atualizaCamera=function(){ c.position.set(6000,35,7500); c.lookAt(6000,900,1000); c.updateMatrixWorld(); };
    for (const el of document.querySelectorAll('#hud,.hud,#ui,#boot')) if(el) el.style.visibility='hidden';
    if (j.nuke) j.nuke.slots.forEach(s=>s.ativo=0);
    return 1 })()`);
  await b.espera(1500);
}

async function mede(b, seg) {
  const raw = await b.ev(`(async()=>{ const j=__nns, R=j.R; const FT=[], DC=[]; const orig=j._laco;
    j._laco=(t)=>{ const a=performance.now(); orig(t); FT.push(performance.now()-a); DC.push(R.info.render.calls); };
    cancelAnimationFrame(j._raf); j._raf=requestAnimationFrame(j._laco);
    await new Promise(r=>setTimeout(r, ${seg}*1000));
    j._laco=orig;
    return JSON.stringify({ FT, dc_med: Math.round(DC.reduce((a,b)=>a+b,0)/Math.max(1,DC.length)), dc_max: Math.max(0,...DC) });
  })()`, seg * 1000 + 90000);
  const o = JSON.parse(raw);
  return { ...stats(o.FT), dc_med: o.dc_med, dc_max: o.dc_max, FT: o.FT };
}

for (const V of VERS) {
  console.log('===', V.tag, V.url);
  const b = await abre(null, { w: 915, h: 412 });
  await boot(b, V.url);
  const R = { tag: V.tag };

  await fixCamNavio(b);
  await b.foto(`${CAP}/agua/${V.tag}_navio.png`);
  R.navio = await mede(b, 8);
  delete R.navio.FT;

  await fixCamAgua(b);
  await b.foto(`${CAP}/agua/${V.tag}_agua.png`);
  R.agua = await mede(b, 8);
  delete R.agua.FT;

  // Nuclear: ensure nuke fx exists
  await fixCamNuke(b);
  await b.ev(`(()=>{ const j=__nns; j.criaNuclear&&j.criaNuclear(true); return !!j.nuke })()`);
  await b.espera(2000);
  R.base_sem_nuke = await mede(b, 6);
  delete R.base_sem_nuke.FT;

  await b.ev(`(()=>{ __nns.nuke.detona(6000, 80, 1000); return 1 })()`);
  // clarão 0-3s
  const n0 = await mede(b, 3);
  R.nuke_0_3s = { ...stats(n0.FT), dc_med: n0.dc_med, dc_max: n0.dc_max };
  await b.foto(`${CAP}/fps/${V.tag}_nuke_t3.png`);
  // mid 8-14
  await b.espera(5000);
  const n1 = await mede(b, 6);
  R.nuke_8_14s = { ...stats(n1.FT), dc_med: n1.dc_med, dc_max: n1.dc_max };
  await b.foto(`${CAP}/fps/${V.tag}_nuke_t14.png`);
  // late 30-36
  await b.espera(16000);
  const n2 = await mede(b, 6);
  R.nuke_30_36s = { ...stats(n2.FT), dc_med: n2.dc_med, dc_max: n2.dc_max };
  await b.foto(`${CAP}/fps/${V.tag}_nuke_t36.png`);

  R.erros = b.erros.slice(0, 6);
  out.versoes[V.tag] = R;
  fs.writeFileSync(`${CAP}/fps/parcial-${V.tag}.json`, JSON.stringify(R, null, 2));
  console.log(JSON.stringify({ tag: V.tag, agua: R.agua, navio: R.navio, base: R.base_sem_nuke, n03: R.nuke_0_3s, n814: R.nuke_8_14s }, null, 2));
  b.fecha();
}

// Compare spikes
const a = out.versoes['1228'], z = out.versoes['1229'];
const cmp = {};
for (const k of ['navio', 'agua', 'base_sem_nuke', 'nuke_0_3s', 'nuke_8_14s', 'nuke_30_36s']) {
  if (!a[k] || !z[k]) continue;
  cmp[k] = {
    p50: [a[k].p50, z[k].p50, +(z[k].p50 - a[k].p50).toFixed(2)],
    p95: [a[k].p95, z[k].p95, +(z[k].p95 - a[k].p95).toFixed(2)],
    p99: [a[k].p99, z[k].p99, +(z[k].p99 - a[k].p99).toFixed(2)],
    over182: [a[k].over182, z[k].over182, z[k].over182 - a[k].over182],
    over182_pct: [a[k].over182_pct, z[k].over182_pct],
    novos_picos_182: z[k].over182 > a[k].over182,
  };
}
out.comparacao = cmp;
out.regra = 'SwiftShader: só Δ relativo. Falha se 1229 introduzir picos >18.2 ms que 1228 não tinha (over182 maior) em cena base/água, ou p95 water/navio +>15%.';
fs.writeFileSync(`${CAP}/fps/ab-fps.json`, JSON.stringify(out, null, 2));
console.log('CMP', JSON.stringify(cmp, null, 2));
console.log('OK', `${CAP}/fps/ab-fps.json`);
process.exit(0);
