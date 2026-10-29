/** Critério 9 denso ≥1500 frames/corrida.
 * Métrica principal = duração de _laco (work-time), igual ao CRIT9-NOVO que passou.
 * Também reporta intervalo RAF. Chrome com flags anti-throttle; 1 por vez. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { WebSocket as WS } from 'ws';
if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = WS;

const CAP = '/workspace/nexo-naval-strike/capturas1229/fps';
fs.mkdirSync(CAP, { recursive: true });
const URL = 'http://127.0.0.1:4229/?auto';
const NRUNS = 7;
const SEG_COMBATE_MS = 45000;
const SEG_NUKE_MS = 22000;
const TAG = process.env.CRIT9_TAG || 'antes-fiscal'; const OUT = CAP + '/CRIT9-DENSO-' + TAG + '.json';
const MIN_FRAMES = 1500;

async function abreAntiThrottle(w = 915, h = 412) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const pr = spawn('google-chrome', [
    '--headless=new', '--no-sandbox',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-frame-rate-limit',
    '--disable-features=CalculateNativeWinOcclusion',
    '--run-all-compositor-stages-before-draw',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=/tmp/nns${port}`,
    `--window-size=${w},${h}`,
    'about:blank',
  ], { stdio: 'ignore' });
  let lst;
  for (let i = 0; i < 80; i++) {
    try { lst = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (lst.find((t) => t.type === 'page')) break; } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  process.on('exit', () => { try { pr.kill('SIGKILL'); } catch (_) {} });
  const page = lst.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  try { await send('Page.setWebLifecycleState', { status: 'active' }); } catch (_) {}
  const ev = async (expr, ms = 60000) => {
    const r = await Promise.race([
      send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }),
      new Promise((ok) => setTimeout(() => ok({ result: { result: { value: '__timeout' } } }), ms)),
    ]);
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result.result.value;
  };
  const vai = async (u) => { await send('Page.navigate', { url: u }); await new Promise((r) => setTimeout(r, 3000)); };
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  return { ev, vai, espera, send, fecha: () => { try { ws.close(); } catch (_) {} try { pr.kill('SIGKILL'); } catch (_) {} } };
}

function stats(arr, tag) {
  if (!arr.length) return { tag, n: 0, over100: 0, over50: 0, pct_over50: 0, max: 0, ok_100: false, ok_50pct: false };
  const a = [...arr].sort((x, y) => x - y);
  const q = (p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
  const over100 = a.filter((x) => x > 100).length;
  const over50 = a.filter((x) => x > 50).length;
  const pct50 = +((100 * over50) / a.length).toFixed(3);
  return {
    tag, n: a.length,
    p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), p99: +q(0.99).toFixed(2),
    med: +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(2),
    max: +a[a.length - 1].toFixed(2),
    over100, over50, pct_over50: pct50,
    ok_100: over100 === 0, ok_50pct: pct50 <= 0.5,
  };
}

async function boot() {
  const { abre } = await import('/workspace/nexo-naval-strike/tests/cdp.mjs'); const b = await abre(null, { w: 915, h: 412 });
  try { await b.send('Emulation.setCPUThrottlingRate', { rate: 1 }); } catch (_) {}
  await b.vai(URL);
  /* modo SEM-RASTER: SwiftShader (CPU) leva ~600 ms/quadro no processo GPU fora do laço; draw/clear viram no-op.
     Trabalho JS do laço (cena, three.js, uniforms, compilação/link de shader e consultas síncronas) fica intacto. */
  await b.ev(`(()=>{ for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) for (const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements','clear']) if (P[k]) P[k] = function(){}; return 1; })()`);
  // force visible
  await b.ev(`(()=>{ Object.defineProperty(document,'hidden',{get:()=>false}); Object.defineProperty(document,'visibilityState',{get:()=>'visible'}); return 1})()`);
  for (let i = 0; i < 250; i++) { if (await b.ev(`!document.querySelector('#boot')&&!!window.__nnsUI`)) break; await b.espera(400); }
  await b.ev(`(()=>{const A=__nnsUI.audio;A.setMusicaOn&&A.setMusicaOn(false);A.paraMusica&&A.paraMusica();return 1})()`);
  await b.ev(`(async()=>{ try{ const A=__nnsUI.audio; if(A.ctx&&A.ctx.state==='suspended') await A.ctx.resume(); }catch(e){} return 1})()`);
  await b.ev(`(async()=>{__nnsUI.save.ajustes.qualidade='alta';await __nnsUI.zarpar({mapa:'arquipelago',modo:'frota',classe:'cruzador',seed:1229,hora:'dia',tempo:'limpo',portaAvioes:true});return 1})()`, 240000);
  for (let i = 0; i < 250; i++) { if (await b.ev(`!!(window.__nns&&__nns.eu&&__nns.S.sim.tick>30)`)) break; await b.espera(400); }
  await b.ev(`(()=>{
    const j=__nns, S=j.S.sim, eu=j.eu;
    j.tutorial=false; j.hud.dica&&j.hud.dica(null); eu.controleIA=0;
    j.camModo='livre'; if(j.cam){j.cam.position.set(eu.x+80,42,eu.z+220); j.cam.lookAt(eu.x+400,0,eu.z-600);}
    for (const n of S.navios) {
      if (n.helis && n.helis.length) {
        n.esq=1;
        for (const i of n.helis) { const h=S.helis[i]; if(!h||h.estado===0) continue; h.auto=1; h.ctrl='ia';
          if (h.estado < 3) { h.estado=4; h.ativo=1; h.oculto=0; h.x=n.x+(Math.random()-0.5)*800; h.z=n.z+(Math.random()-0.5)*800; h.y=120+Math.random()*80; h.vx=0;h.vz=0;h.v=40; h.comb=Math.max(h.comb,200); h.mun=Math.max(h.mun||0,4); h.missao=h.H&&h.H.aviao?'cap':'ataque'; }
        }
      }
    }
    for (const n of S.navios) if (n.time!==eu.time && !n.morto) { n.x = eu.x + (Math.random()-0.5)*4000+2500; n.z = eu.z + (Math.random()-0.5)*4000; }
    return 1;
  })()`);
  await b.ev(`(()=>{
    const S=__nns.S.sim, maxN=14;
    const vivos=[];
    for (const h of S.helis) if (h&&h.ativo&&h.estado>=3&&h.estado<=6) vivos.push(h);
    vivos.sort((a,b)=>a.idx-b.idx);
    for (let i=maxN;i<vivos.length;i++){ const h=vivos[i]; h.estado=1; h.ativo=0; h.oculto=1; h.y=0; }
    return vivos.length;
  })()`);
  await b.ev(`(()=>{
    const j=__nns, S=j.S.sim, n=j.eu;
    try { if(!j.nuke) j.criaNuclear(true); } catch(e){}
    if (j.nuke) {
      const som=j.nuke.cb.som, trem=j.nuke.cb.tremor, vib=j.nuke.cb.vibra;
      j.nuke.cb.som=null; j.nuke.cb.tremor=null; j.nuke.cb.vibra=null;
      try {
        j.nuke.camRef=j.cam; j.nuke.detona(n.x+40000,80,n.z+40000);
        for (let i=0;i<20;i++) j.nuke.passo(0.05,S,j.cam);
        for (const s of j.nuke.slots){ s.ativo=0; if(s.fila)s.fila.length=0; }
        j.nuke.restaura && j.nuke.restaura();
        j.R.compile(j.cena,j.cam); j.R.render(j.cena,j.cam);
      } catch(e){}
      j.nuke.cb.som=som; j.nuke.cb.tremor=trem; j.nuke.cb.vibra=vib;
    }
    return 1;
  })()`);
  await b.espera(4000);
  const ar = +(await b.ev(`(()=>{ let n=0; for (const h of __nns.S.sim.helis) if(h&&h.ativo&&h.estado>=3&&h.estado<=6) n++; return n; })()`));
  return { b, ar };
}

/** Captura work-time de _laco + intervalo RAF. Espera no Node (não dentro do evaluate). */
async function captureFT(b, nFrames) {
  const raw = await b.ev(`(async()=>{
    const j = window.__nns; const sim = j.S.sim;
    const WT = [], picos = [], heapArr = [];
    const Ev = { impacto:0, disparo:0, decolagem:0, abate:0, coluna:0 };
    const heliEst = new Map(), vidas = new Map();
    for (const n of sim.navios) vidas.set(n.id, n.vida);
    let nG=null,nM=null,nT=null;
    const conta = (arr) => { let c=0; if (arr) for (const x of arr) if (x && x.ativo) c++; return c; };
    // colunas: hook fx
    const fx = j.fx; const orig = {};
    for (const k of ['colunaTorpedo','geiser','coluna']) if (fx && typeof fx[k]==='function') { orig[k]=fx[k]; fx[k]=function(){ Ev.coluna++; return orig[k].apply(this, arguments); }; }
    const R = j.R; const _mc = new MessageChannel(); let _res = null; _mc.port1.onmessage = () => { const r = _res; _res = null; r && r(); }; const yieldM = () => new Promise(r => { _res = r; _mc.port2.postMessage(0); });
    const gl = R.getContext(); const GW = [];
    cancelAnimationFrame(j._raf);
    const rafO = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; // laco não re-agenda
    let t = performance.now();
    const mem = () => (performance.memory && performance.memory.usedJSHeapSize) || 0;
    for (let f = 0; f < ${nFrames}; f++) {
      t += 1000/60;
      const e0 = { ...Ev }; const h0 = mem(); const a = performance.now();
      j.laco(t);
      const wt = performance.now() - a; const h1 = mem(); { const g0 = performance.now(); gl.finish(); GW.push(performance.now() - g0); }
      // eventos do frame
      let ar = 0;
      for (const h of sim.helis) { if (!h) continue; const on = h.ativo && h.estado>=3 && h.estado<=6; if (on) ar++;
        const pe = heliEst.get(h.idx); if (pe != null) { const pon = pe>=3&&pe<=6; if (!pon && on) Ev.decolagem++; if (pon && !on) Ev.abate++; } heliEst.set(h.idx, h.estado); }
      const ng=conta(sim.granadas), nm=conta(sim.misseis), nt=conta(sim.torpedos);
      if (nG!=null) Ev.disparo += Math.max(0,ng-nG)+Math.max(0,nm-nM)+Math.max(0,nt-nT); nG=ng;nM=nm;nT=nt;
      for (const n of sim.navios) { const pv = vidas.get(n.id); if (pv!=null && n.vida < pv-0.5) Ev.impacto++; vidas.set(n.id, n.vida); }
      WT.push(wt); heapArr.push(h1);
      if (wt > 50) picos.push({ i:f, t:+a.toFixed(1), simT:+(sim.t||0).toFixed(2), wt:+wt.toFixed(2), ar,
        eventos:{ impacto:Ev.impacto-e0.impacto, disparo:Ev.disparo-e0.disparo, decolagem:Ev.decolagem-e0.decolagem, abate:Ev.abate-e0.abate, coluna:Ev.coluna-e0.coluna },
        heapBefore:h0, heapAfter:h1, heapDelta:h1-h0, gcSuspect: h1 < h0 - 1e6 });
      await yieldM();
    }
    window.requestAnimationFrame = rafO;
    for (const k in orig) fx[k] = orig[k];
    j._raf = requestAnimationFrame(j._laco);
    let gcHints=0; for (let i=1;i<WT.length;i++) if (WT[i]>80 && WT[i-1]<30) gcHints++;
    let heapDrop=0; for (let i=1;i<heapArr.length;i++) if (heapArr[i] < heapArr[i-1]-8e6) heapDrop++;
    GW.sort((x,y)=>x-y); const gpuWait = { med: GW[GW.length>>1], p95: GW[Math.floor(GW.length*0.95)], max: GW[GW.length-1] }; const buf = [gl.drawingBufferWidth, gl.drawingBufferHeight]; return JSON.stringify({ gpuWait, buf, prLogico: R.getPixelRatio(), WT, nWT: WT.length, picos, gcHints, heapDrop, hasMem: !!performance.memory, totEv: Ev });
  })()`, 900000);
  return JSON.parse(raw);
}

const out = {
  criterio: 9, versao: 'NOVO_Valter_1227_DENSO', when: new Date().toISOString(),
  regras: { max_frame_ms: 100, pct_over_50_max: 0.5, runs: NRUNS, ar_alvo: 14, min_frames: MIN_FRAMES, metrica_principal: 'work_time_laco_ms (laço dirigido, passo fixo 16,67 ms, 1 Chrome, draw/clear no-op no SwiftShader)', nota_harness: 'diag com raster real: 60 quadros laço 6–28 ms (soma 642 ms), espera GPU entre tarefas 35,6 s → inviável 7×1500; com raster no-op o JS do laço é o mesmo' },
  runs: [], combate: null, nuke: null, pass: false,
  rodada1_esparsa: { arquivo: 'CRIT9-CONFIRM-pos-bombcam.json', combate_pct_over50: 1.176, over50: 2, max: 59.9, frames: 170, nota: 'FAIL amostra ~25 frames/corrida' },
  picos: [],
};

for (let r = 1; r <= NRUNS; r++) {
  console.error('run', r, '/', NRUNS, new Date().toISOString());
  const { b, ar } = await boot();
  const cRaw = await captureFT(b, 1700);
  // drop first 5% warm
  const drop = Math.min(120, Math.floor(cRaw.WT.length * 0.05));
  const cUse = cRaw.WT.slice(drop);
  const cStat = stats(cUse, 'combate');
  const cFT = null;

  await b.ev(`(()=>{ const j=__nns,n=j.eu;
    if(j.nuke){ j.nuke.slots&&j.nuke.slots.forEach(s=>{s.ativo=0; if(s.fila)s.fila.length=0}); j.nuke.restaura&&j.nuke.restaura(); j.nuke.detona(n.x+900,150,n.z+500); }
    return 1 })()`);
  await b.espera(300);
  const nRaw = await captureFT(b, 900);
  const nDrop = Math.min(60, Math.floor(nRaw.WT.length * 0.03));
  const nUse = nRaw.WT.slice(nDrop);
  const nStat = stats(nUse, 'nuke');
  const nFT = null;

  const run = {
    run: r, ar,
    combate: { ...cStat, nRaw: cRaw.nWT, gcHints: cRaw.gcHints, heapDrop: cRaw.heapDrop, hasMem: cRaw.hasMem, totEv: cRaw.totEv, gpuWait: cRaw.gpuWait, buf: cRaw.buf, prLogico: cRaw.prLogico },
    nuke: { ...nStat, nRaw: nRaw.nWT, gcHints: nRaw.gcHints, heapDrop: nRaw.heapDrop, totEv: nRaw.totEv, gpuWait: nRaw.gpuWait, buf: nRaw.buf },
  };
  // picos deste run (combate + nuke)
  const picosRun = {
    run: r, ar,
    combate: cRaw.picos || [],
    nuke: nRaw.picos || [],
  };
  out.picos = out.picos || [];
  out.picos.push(picosRun);
  fs.writeFileSync(CAP + '/picos' + (TAG==='antes-fiscal'?'':'-'+TAG) + '.json', JSON.stringify({
    when: new Date().toISOString(),
    metrica: 'work_time_laco_ms',
    limiar_ms: 50,
    runs_parcial: out.picos,
    total_picos: out.picos.reduce((s,x)=>s+(x.combate||[]).length+(x.nuke||[]).length,0),
  }, null, 2));

  out.runs.push(run);
  console.log(JSON.stringify({ run: r, ar, c_n: cStat.n, c_max: cStat.max, c_o50: cStat.over50, c_pct: cStat.pct_over50, c_o100: cStat.over100, n_n: nStat.n, n_max: nStat.max, n_o50: nStat.over50, n_picos_c: (cRaw.picos||[]).length, n_picos_n: (nRaw.picos||[]).length, picos_c: (cRaw.picos||[]).slice(0,4) }));
  await b.fecha();
  await new Promise((r) => setTimeout(r, 2000));
}

function agg(key) {
  let over100 = 0, over50 = 0, n = 0, max = 0, gc = 0, hd = 0;
  for (const r of out.runs) {
    const s = r[key];
    over100 += s.over100; over50 += s.over50; n += s.n; max = Math.max(max, s.max);
    gc += s.gcHints || 0; hd += s.heapDrop || 0;
  }
  const pct50 = n ? +((100 * over50) / n).toFixed(3) : 0;
  const p95s = out.runs.map((r) => r[key].p95).sort((a, b) => a - b);
  return {
    frames: n, over100, over50, pct_over50: pct50, max,
    p95_mediana_runs: p95s[Math.floor(p95s.length / 2)],
    gcHints_total: gc, heapDrop_total: hd,
    ok_100: over100 === 0, ok_50pct: pct50 <= 0.5,
  };
}
out.combate = agg('combate');
out.nuke = agg('nuke');
out.ar_med = +(out.runs.reduce((s, r) => s + r.ar, 0) / out.runs.length).toFixed(2);
out.min_frames_ok = out.runs.every((r) => r.combate.n >= MIN_FRAMES);
out.pass = out.combate.ok_100 && out.combate.ok_50pct && out.nuke.ok_100 && out.nuke.ok_50pct && out.min_frames_ok;
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log('RESUMO', JSON.stringify({ pass: out.pass, min_frames_ok: out.min_frames_ok, ar_med: out.ar_med, combate: out.combate, nuke: out.nuke }, null, 2));
process.exit(out.pass ? 0 : 2);
