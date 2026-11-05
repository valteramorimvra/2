/** v1.2.29 — e2e AUTO bombardeiro + jitter câmera vs 1.2.28. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const CAP = '/workspace/nexo-naval-strike/capturas1229/auto';
fs.mkdirSync(CAP, { recursive: true });
const falhas = [];
const fal = (m) => { falhas.push(m); console.error('FALHA', m); };
const out = { versoes: {} };

async function toque(b, x, y) {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 8, radiusY: 8, force: 0.55 }] });
  await b.espera(40);
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function centroBtn(b, sel) {
  const r = await b.ev(`(()=>{ const e=document.querySelector('${sel}'); if(!e||e.hidden) return null; const q=e.getBoundingClientRect(); if(q.width<2) return null; return JSON.stringify([q.left+q.width/2,q.top+q.height/2,q.width,q.height]) })()`);
  return r && r !== 'null' ? JSON.parse(r) : null;
}

async function setupPartida(b, url, tag) {
  await b.vai(url);
  for (let i = 0; i < 250; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
  await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica(); return 1 })()`);
  await b.ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa:'atois', modo:'frota', classe:'chapada', seed:1229, hora:'dia', tempo:'limpo' }); return 1 })()`, 240000);
  for (let i = 0; i < 250; i++) { if (await b.ev(`!!(window.__nns && __nns.eu && __nns.S.sim.tick>20)`)) break; await b.espera(400); }
  await b.ev(`(()=>{ const j=__nns, sim=j.S.sim, n=j.eu; j.tutorial=false; j.hud.dica&&j.hud.dica(null); n.controleIA=0; sim.t=Math.max(sim.t,125);
    for (const e of sim.navios) if (e.time!==n.time) { e.sam=0; e.ciws=[]; e.lasers=[]; e.sams=[]; }
    let best=null, bd=1e9; for (const e of sim.navios) if (!e.morto && e.time!==n.time) { const d=Math.hypot(e.x-n.x,e.z-n.z); if (d<bd) { bd=d; best=e; } }
    if (best && bd>8000) { const a=Math.atan2(best.x-n.x,-(best.z-n.z)); best.x=n.x+Math.sin(a)*7000; best.z=n.z-Math.cos(a)*7000; }
    j.S.comando({ t:'travar', alvo: best.id }); window.__alvo=best.id; j.criaNuclear&&j.criaNuclear(true); return best.id })()`);
}

async function decolaToque(b) {
  let bn = await centroBtn(b, '[data-a=nuke]');
  if (!bn) return 0;
  await toque(b, bn[0], bn[1]); await b.espera(350);
  await toque(b, bn[0], bn[1]); await b.espera(1200);
  return await b.ev(`__nns.S.sim.nukes.some(q=>q.ativo)?1:0`);
}

async function medirJitter(b, seg = 4) {
  // Amostra posição câmera a cada quadro durante piloting + shake inducido
  const raw = await b.ev(`(async()=>{ const j=__nns; j.mem.shake=Math.max(j.mem.shake||0, 0.55);
    const P=[]; const orig=j._laco;
    j._laco=(t)=>{ orig(t); const p=j.cam.position; P.push([p.x,p.y,p.z]); };
    cancelAnimationFrame(j._raf); j._raf=requestAnimationFrame(j._laco);
    await new Promise(r=>setTimeout(r, ${seg}*1000));
    j._laco=orig;
    let sum=0, max=0; for (let i=1;i<P.length;i++){ const dx=P[i][0]-P[i-1][0], dy=P[i][1]-P[i-1][1], dz=P[i][2]-P[i-1][2]; const d=Math.hypot(dx,dy,dz); sum+=d; max=Math.max(max,d); }
    const med=sum/Math.max(1,P.length-1);
    const ds=[]; for (let i=1;i<P.length;i++){ const dx=P[i][0]-P[i-1][0], dy=P[i][1]-P[i-1][1], dz=P[i][2]-P[i-1][2]; ds.push(Math.hypot(dx,dy,dz)); }
    ds.sort((a,b)=>a-b); const p95=ds[Math.floor(ds.length*0.95)]||0;
    return JSON.stringify({ n:P.length, jitter_med:+med.toFixed(4), jitter_p95:+p95.toFixed(4), jitter_max:+max.toFixed(4), shakeCap: j.nkPil ? 0.22 : 1 });
  })()`, seg * 1000 + 60000);
  return JSON.parse(raw);
}

// --- 1.2.29 AUTO path ---
{
  const b = await abre(null, { w: 915, h: 412 });
  await setupPartida(b, 'http://127.0.0.1:4229/?auto', '1229');
  const R = { tag: '1229' };
  R.decolou = await decolaToque(b);
  if (!R.decolou) fal('1229: não decolou');
  R.autoIni = JSON.parse(await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo); return JSON.stringify({ auto:q&&q.auto|0, alvo:q&&q.alvo, tPrep:+(q&&q.tPrep||0).toFixed(2) }) })()`));
  if (!R.autoIni.auto) fal('1229: AUTO não setado com alvo travado');

  for (let i = 0; i < 80; i++) { if (await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo); return q&&q.fase===2?1:0 })()`)) break; await b.espera(400); }

  // NÃO pilotar ainda — AUTO (IA) deve dirigir ao alvo
  const before = JSON.parse(await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo); const a=__nns.S.sim.navios[q.alvo];
    return JSON.stringify({ x:q.x,z:q.z,y:q.y,rumo:q.rumo, ax:q.ax,az:q.az, d:Math.hypot(q.x-a.x,q.z-a.z), errRumo:Math.atan2(Math.sin(Math.atan2(a.x-q.x,-(a.z-q.z))-q.rumo),Math.cos(Math.atan2(a.x-q.x,-(a.z-q.z))-q.rumo)) }) })()`));
  await b.espera(12000); // 12 s simulado real (SwiftShader lento → menos passos)
  // Acelerar sim um pouco via vários passos se tick lento? Rely on game loop.
  // Force some sim progress by waiting more and also bump
  for (let i = 0; i < 30; i++) await b.espera(500);
  const after = JSON.parse(await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo&&x.dono===__nns.eu.id); if(!q) return '{"gone":1}'; const a=__nns.S.sim.navios[q.alvo];
    return JSON.stringify({ x:q.x,z:q.z,y:q.y,rumo:q.rumo, d:Math.hypot(q.x-a.x,q.z-a.z), errRumo:Math.atan2(Math.sin(Math.atan2(a.x-q.x,-(a.z-q.z))-q.rumo),Math.cos(Math.atan2(a.x-q.x,-(a.z-q.z))-q.rumo)), fase:q.fase, manual:q.manual|0, auto:q.auto|0, t:+q.t.toFixed(1) }) })()`));
  R.autoVoo = { before, after };
  if (!after.gone) {
    const closed = after.d < before.d - 200 || Math.abs(after.errRumo) < Math.abs(before.errRumo) - 0.05 || after.y > before.y + 80;
    R.autoDirigiu = !!closed;
    if (!closed && after.t > 8) fal(`1229 AUTO não dirigiu/alinhou: d ${before.d.toFixed(0)}→${after.d.toFixed(0)} err ${before.errRumo.toFixed(3)}→${after.errRumo.toFixed(3)} y ${before.y.toFixed(0)}→${after.y.toFixed(0)}`);
  } else fal('1229: bombardeiro sumiu durante AUTO');
  await b.foto(`${CAP}/1229-auto-em-voo.png`);

  // PILOTAR + stick reassume
  let bn = await centroBtn(b, '[data-a=nuke]');
  if (bn) { await toque(b, bn[0], bn[1]); await b.espera(800); }
  R.pil = await b.ev(`__nns.nkPil?1:0`);
  // Se ainda não manual, stick deve ligar
  const J = await centroBtn(b, '.nk-joy');
  if (J) {
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: J[0], y: J[1], id: 1, radiusX: 12, radiusY: 12, force: 0.7 }] });
    for (let i = 1; i <= 14; i++) {
      await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: J[0] + J[2] * 0.4 * (i / 14), y: J[1] - J[3] * 0.3 * (i / 14), id: 1, radiusX: 12, radiusY: 12, force: 0.7 }] });
      await b.espera(50);
    }
    await b.espera(400);
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  R.reassumiu = JSON.parse(await b.ev(`(()=>{ const q=__nns.nkQ(); return JSON.stringify({ manual:q?q.manual|0:-1, auto:q?q.auto|0:-1, jx:+(__nns.hud.nkJ.x||0).toFixed(2) }) })()`));
  if (R.reassumiu.manual !== 1) fal('1229: stick não reassumiu MANUAL');
  if (R.reassumiu.auto !== 0) fal('1229: AUTO não cancelou ao reassumir');

  R.jitter = await medirJitter(b, 4);
  await b.foto(`${CAP}/1229-manual-stick.png`);
  out.versoes['1229'] = R;
  b.fecha();
}

// --- 1.2.28 jitter baseline (mesmo setup; sem AUTO flag) ---
{
  const b = await abre(null, { w: 915, h: 412 });
  await setupPartida(b, 'http://127.0.0.1:4228/?auto', '1228');
  const R = { tag: '1228' };
  R.decolou = await decolaToque(b);
  for (let i = 0; i < 80; i++) { if (await b.ev(`(()=>{ const q=__nns.S.sim.nukes.find(x=>x.ativo); return q&&q.fase===2?1:0 })()`)) break; await b.espera(400); }
  let bn = await centroBtn(b, '[data-a=nuke]');
  if (bn) { await toque(b, bn[0], bn[1]); await b.espera(800); }
  // force manual if needed
  await b.ev(`(()=>{ const q=__nns.nkQ&&__nns.nkQ(); if(q&&!q.manual){ __nns.S.comando({t:'nkPiloto',v:1}); } return 1 })()`);
  await b.espera(500);
  R.jitter = await medirJitter(b, 4);
  out.versoes['1228'] = R;
  b.fecha();
}

const j28 = out.versoes['1228'] && out.versoes['1228'].jitter;
const j29 = out.versoes['1229'] && out.versoes['1229'].jitter;
out.jitterCmp = j28 && j29 ? {
  med: [j28.jitter_med, j29.jitter_med, +(j29.jitter_med - j28.jitter_med).toFixed(4)],
  p95: [j28.jitter_p95, j29.jitter_p95, +(j29.jitter_p95 - j28.jitter_p95).toFixed(4)],
  max: [j28.jitter_max, j29.jitter_max, +(j29.jitter_max - j28.jitter_max).toFixed(4)],
  melhorou: j29.jitter_p95 <= j28.jitter_p95 * 1.05, // 1229 não pior; preferível menor
} : null;
if (out.jitterCmp && j29.jitter_p95 > j28.jitter_p95 * 1.15) fal(`jitter p95 piorou: ${j28.jitter_p95} → ${j29.jitter_p95}`);

out.falhas = falhas;
fs.writeFileSync(`${CAP}/resultado.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ falhas, auto: out.versoes['1229'] && { autoIni: out.versoes['1229'].autoIni, autoDirigiu: out.versoes['1229'].autoDirigiu, reassumiu: out.versoes['1229'].reassumiu, autoVoo: out.versoes['1229'].autoVoo }, jitterCmp: out.jitterCmp }, null, 2));
process.exit(falhas.length ? 1 : 0);
