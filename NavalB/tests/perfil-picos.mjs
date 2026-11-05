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


/* PERFIL dos picos: CPU profile (1 ms) + amostragem de alocação, alinhados por marca __marcaPerfil (busy 40 ms) */
const TAGP = process.env.PERFIL_TAG || 'antes';
const { b } = await boot();
await b.send('Profiler.enable'); await b.send('Profiler.setSamplingInterval', { interval: 500 });
await b.send('HeapProfiler.enable'); await b.send('HeapProfiler.startSampling', { samplingInterval: 16384 });
await b.send('Profiler.start');
const raw = await b.ev(`(async()=>{ const j=__nns, sim=j.S.sim; window.__marcaPerfil = function __marcaPerfil(){ const a=performance.now(); while(performance.now()-a<40){} return a; };
 const m0 = __marcaPerfil(); cancelAnimationFrame(j._raf); const rafO=window.requestAnimationFrame; window.requestAnimationFrame=()=>0;
 const mc=new MessageChannel(); let rs=null; mc.port1.onmessage=()=>{const x=rs; rs=null; x&&x();}; const y=()=>new Promise(r=>{rs=r; mc.port2.postMessage(0);});
 let t=performance.now(); const F=[]; const mem=()=>performance.memory.usedJSHeapSize; let gc=0;
 for(let f=0;f<1700;f++){ t+=16.67; const h0=mem(); const a=performance.now(); j.laco(t); const wt=performance.now()-a; const h1=mem(); F.push([+(a-m0).toFixed(2), +wt.toFixed(2), h1-h0]); await y(); }
 window.requestAnimationFrame=rafO; j._raf=requestAnimationFrame(j._laco); return JSON.stringify(F); })()`, 900000);
const prof = (await b.send('Profiler.stop')).result.profile;
const heap = (await b.send('HeapProfiler.stopSampling')).result.profile;
const F = JSON.parse(raw);
// nós
const nodes = new Map(); for (const n of prof.nodes) nodes.set(n.id, n);
const parent = new Map(); for (const n of prof.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
const nome = (n) => { const cf = n.callFrame; return (cf.functionName || '(anon)') + ' ' + (cf.url || '').split('/').pop() + ':' + (cf.lineNumber + 1); };
const pilha = (id) => { const s = []; let x = id; while (x != null && s.length < 12) { const n = nodes.get(x); if (!n) break; s.push(nome(n)); x = parent.get(x); } return s; };
// tempos das amostras
let tt = prof.startTime; const ts = prof.timeDeltas.map((d) => (tt += d));
// marca: amostras com __marcaPerfil no topo
let marcaT = null; for (let i = 0; i < prof.samples.length; i++) { const n = nodes.get(prof.samples[i]); if (n && n.callFrame.functionName === '__marcaPerfil') { marcaT = ts[i]; break; } }
const gcIds = new Set(prof.nodes.filter((n) => n.callFrame.functionName === '(garbage collector)').map((n) => n.id));
const picos = []; const drop = 85;
for (let i = drop; i < F.length; i++) { const [a, wt, dh] = F[i]; if (wt <= 50) continue;
  const t0 = marcaT + a * 1000, t1 = t0 + wt * 1000; const self = new Map(); let gcMs = 0, nS = 0;
  for (let k = 0; k < prof.samples.length; k++) { if (ts[k] < t0 || ts[k] > t1) continue; nS++; const id = prof.samples[k]; const dt = (k + 1 < ts.length ? ts[k + 1] - ts[k] : 500) / 1000; if (gcIds.has(id)) gcMs += dt; const nm = nome(nodes.get(id)); self.set(nm, (self.get(nm) || 0) + dt); }
  const top = [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => [k, +v.toFixed(1)]);
  // pilha mais frequente (não-GC)
  const pc = new Map(); for (let k = 0; k < prof.samples.length; k++) { if (ts[k] < t0 || ts[k] > t1 || gcIds.has(prof.samples[k])) continue; const p = pilha(prof.samples[k]).slice(0, 6).join(' < '); pc.set(p, (pc.get(p) || 0) + 1); }
  picos.push({ i, wt, heapDeltaMB: +(dh / 1e6).toFixed(2), amostras: nS, gcMs: +gcMs.toFixed(1), topSelf: top, pilhaTop: [...pc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 2) }); }
// alocação: top self por função
const alloc = new Map(); const walk = (n) => { const k = nome({ callFrame: n.callFrame }); alloc.set(k, (alloc.get(k) || 0) + n.selfSize); for (const c of n.children || []) walk(c); }; walk(heap.head);
const totA = [...alloc.values()].reduce((x, y) => x + y, 0);
const topAlloc = [...alloc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 25).map(([k, v]) => [k, +(v / 1e6).toFixed(2) + ' MB', +(100 * v / totA).toFixed(1) + '%']);
// gc total no período
let gcTot = 0, tot = 0; for (let k = 0; k < prof.samples.length; k++) { const dt = (k + 1 < ts.length ? ts[k + 1] - ts[k] : 500) / 1000; tot += dt; if (gcIds.has(prof.samples[k])) gcTot += dt; }
const W = F.slice(drop).map((x) => x[1]); const dhs = F.slice(drop).map((x) => x[2]);
const res = { tag: TAGP, when: new Date().toISOString(), marcaOk: marcaT != null, frames: W.length, over50: W.filter((x) => x > 50).length, over100: W.filter((x) => x > 100).length, max: Math.max(...W),
  heapCrescMedioPorQuadroKB: +(dhs.filter((x) => x > 0).reduce((a, c) => a + c, 0) / dhs.length / 1024).toFixed(1), gcTotalMs: +gcTot.toFixed(0), perfilTotalMs: +tot.toFixed(0),
  alocacaoAmostradaMB: +(totA / 1e6).toFixed(1), topAlloc, picos };
fs.writeFileSync(CAP + '/perfil-picos-' + TAGP + '.json', JSON.stringify(res, null, 1));
console.log(JSON.stringify({ ...res, picos: res.picos.slice(0, 8), topAlloc: topAlloc.slice(0, 15) }, null, 1));
b.fecha(); process.exit(0);
