// Diagnóstico das travadas de SOM (thread principal). Não entra no APK.
// Prova, com o código real: nós criados em batalha, decodificação, IndexedDB,
// cópia Float32→AudioBuffer e automação por quadro.
import { pathToFileURL } from 'url';

const criados = [];
let batalha = false;
let idbOps = [];
const automacao = { setTarget: 0, cancel: 0, ramp: 0 };
function quem() {
  const s = (new Error().stack || '').split('\n').slice(2, 6).map((l) => l.trim()).join(' | ');
  return s.replace(/\/workspace\/nexo-src\/NexoNavalStrike\//g, '');
}
function reg(tipo) { criados.push({ tipo, batalha, quem: quem() }); }

class Param {
  constructor(v = 0) { this.value = v; this.ev = []; }
  setValueAtTime(v) { this.value = v; this.ev.push(v); return this; }
  setTargetAtTime(v) { automacao.setTarget++; this.value = v; this.ev.push(v); if (this.ev.length > 8) this.ev.shift(); return this; }
  linearRampToValueAtTime(v) { automacao.ramp++; this.value = v; return this; }
  exponentialRampToValueAtTime(v) { automacao.ramp++; this.value = Math.max(1e-4, v); return this; }
  cancelScheduledValues() { automacao.cancel++; return this; }
}
function no(tipo) {
  reg(tipo);
  const n = { _t: tipo, connect() { return n; }, disconnect() {}, start() {}, stop() {}, addEventListener() {} };
  n.gain = new Param(1); n.frequency = new Param(440); n.Q = new Param(1); n.pan = new Param(0);
  n.delayTime = new Param(0); n.playbackRate = new Param(1);
  return n;
}
class Buf {
  constructor(ch, len, sr) {
    reg('createBuffer');
    this.numberOfChannels = ch; this.length = len; this.sampleRate = sr; this.duration = len / sr;
    this._ch = []; for (let i = 0; i < ch; i++) this._ch.push(new Float32Array(len));
  }
  getChannelData(i) { return this._ch[i]; }
  copyToChannel(a, i) { this._ch[i].set(a.subarray(0, this.length)); }
}
class Ctx {
  constructor() {
    this.sampleRate = 48000; this.currentTime = 1; this.state = 'running';
    this.destination = no('destination'); this.baseLatency = 0.01; this.outputLatency = 0.02;
    this.audioWorklet = { addModule: async () => { throw new Error('sem worklet neste diagnóstico'); } };
    this.listener = {};
  }
  createGain() { return no('Gain'); }
  createBiquadFilter() { return no('Biquad'); }
  createBufferSource() { const s = no('BufferSource'); s.buffer = null; s.loop = false; return s; }
  createOscillator() { const o = no('Osc'); o.type = 'sine'; return o; }
  createStereoPanner() { return no('Panner'); }
  createDynamicsCompressor() { const c = no('Compressor'); c.threshold = new Param(-24); c.knee = new Param(0); c.ratio = new Param(1); c.attack = new Param(0); c.release = new Param(0); return c; }
  createWaveShaper() { const w = no('Shaper'); w.curve = null; w.oversample = 'none'; return w; }
  createDelay() { return no('Delay'); }
  createBuffer(c, n, sr) { return new Buf(c, n, sr); }
  createScriptProcessor() { reg('ScriptProcessor'); return null; }
  createMediaElementSource() { return no('Media'); }
  decodeAudioData(ab) { reg('decodeAudioData'); return Promise.resolve(new Buf(1, 4800, 48000)); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
  addEventListener() {}
}
const store = new Map();
function idbFake() {
  return {
    open() {
      const req = {};
      queueMicrotask(() => { req.result = {
        transaction() { return { objectStore() { return {
          get(k) { idbOps.push(['get', batalha, k]); const r = {}; queueMicrotask(() => r.onsuccess && r.onsuccess()); r.result = store.get(k) || null; return r; },
          put(v, k) { idbOps.push(['put', batalha, k, v && JSON.stringify(v).length]); store.set(k, v); },
          delete(k) { idbOps.push(['delete', batalha, k]); store.delete(k); },
          clear() { idbOps.push(['clear', batalha]); store.clear(); },
          getAllKeys() { const r = {}; r.result = [...store.keys()]; queueMicrotask(() => r.onsuccess && r.onsuccess()); return r; },
        }; }, objectStore() { return this.objectStore(); } }; },
        createObjectStore() {},
      }; req.onsuccess && req.onsuccess(); });
      return req;
    },
  };
}
globalThis.window = globalThis;
globalThis.AudioContext = Ctx;
globalThis.webkitAudioContext = Ctx;
globalThis.indexedDB = idbFake();
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'diag' }, configurable: true }); } catch (e) {}
globalThis.localStorage = { setItem() {}, getItem() { return null; } };
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, hidden: false };
globalThis.performance = globalThis.performance || { now: () => Date.now() };

const { NavalAudioManager } = await import(pathToFileURL(new URL('../src/NavalAudioManager.js', import.meta.url).pathname).href);

function resumo(tag) {
  const em = criados.filter((c) => c.batalha);
  const por = {};
  for (const c of em) por[c.tipo] = (por[c.tipo] || 0) + 1;
  const quem = {};
  for (const c of em) { const k = c.tipo + ' @ ' + (c.quem.split('|')[0] || '').slice(0, 140); quem[k] = (quem[k] || 0) + 1; }
  console.log('\n== ' + tag + ' ==');
  console.log('nos em batalha', em.length, por);
  const top = Object.entries(quem).sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [k, n] of top) console.log(' ', n, k);
}

const a = new NavalAudioManager();
a.criaContexto();
// buffers de laço curtos (o jogo real decodifica no carregamento)
for (const n of ['heli_rotor_loop', 'heli_turbina_loop', 'heli_pas_loop', 'incendio_loop', 'alagamento_loop', 'bolhas_loop', 'motor_diesel_loop', 'turbina_loop', 'canhao_grande', 'canhao_medio', 'explosao_grande', 'flares', 'ciws']) {
  a.buf[n] = new Buf(1, 48000, 48000); a.real[n] = 1;
}
a.diag = { ev: {}, log: [] };
a.mix = null; a.mixL = null;

const antesCarga = criados.length;
batalha = false;
const tM = performance.now();
a.iniciaMotor({ L: 140, desl: 5000 });
a._preparaLacosNativos();
const msMotor = performance.now() - tM;
const nosCarga = criados.length - antesCarga;
console.log('CARGA iniciaMotor+laços', msMotor.toFixed(1), 'ms, nós', nosCarga);

criados.length = 0;
batalha = true;
a.marcaBatalha(true);
a.iniciaMotor({ L: 180, desl: 8000 });

// 14 aeronaves: rotor+turbina+pás, 1º quadro (criação) e 2º (só atualização)
let t0 = performance.now();
for (let i = 0; i < 14; i++) a.rotor('h' + i, 200 + i * 80, (i - 7) / 7, i % 2 ? 40 : -30, 0);
const msR1 = performance.now() - t0;
const nosR1 = criados.filter((c) => c.batalha).length;
t0 = performance.now();
for (let i = 0; i < 14; i++) a.rotor('h' + i, 180 + i * 70, (i - 7) / 8, 20, 0);
const msR2 = performance.now() - t0;
// 8 mísseis em voo (laço de ruído — o 1º cria o buffer de 2 s na thread principal)
t0 = performance.now();
for (let i = 0; i < 8; i++) a.lacoRuido('m' + i, 'missil', 0.4, (i - 4) / 4, 1.1, 300 + i * 100);
const msMis = performance.now() - t0;
// salva de 6 canhões + camadas + nuclear, sem mixer (caminho que cria nó por disparo)
t0 = performance.now();
try {
  for (let k = 0; k < 6; k++) {
    a.toca('canhao_grande', { d: 40, pan: (k - 2.5) / 6, vol: 1, voz: k });
    a.camada('canhao', { d: 40, pan: 0, vol: 1, k: 127 });
  }
  a.nuclear && a.nuclear('estalo', 800, 0.2, 1);
  a.flares(100, 0);
} catch (e) { console.log('ERRO salva', e && e.message); }
const msSalva = performance.now() - t0;
// 180 quadros de motor + 14 rotores (automação)
const st0 = automacao.setTarget;
t0 = performance.now();
for (let f = 0; f < 180; f++) {
  a.ctx.currentTime += 1 / 60;
  a.atualizaMotor(0.6 + 0.01 * (f % 5), 0.2, 0, f % 40 === 0 ? 1 : 0, 1 / 60, 1, 0.1, 0.4);
  for (let i = 0; i < 14; i++) a.rotor('h' + i, 200 + ((f + i) % 9) * 30, Math.sin(f / 10 + i) * 0.8, 10 + (f % 3), 0);
  a.limpaLacos && a.limpaLacos();
}
const msQuadros = performance.now() - t0;
const setAlvo = automacao.setTarget - st0;
const st1 = automacao.setTarget;
t0 = performance.now();
for (let f = 0; f < 180; f++) {
  a.ctx.currentTime += 1 / 60;
  a.atualizaMotor(0.62, 0.05, 0, 0, 1 / 60, 1, 0, 0.62);
  for (let i = 0; i < 14; i++) a.rotor('h' + i, 400, 0.1, 0, 0);
  a.limpaLacos && a.limpaLacos();
}
const setEstavel = automacao.setTarget - st1;
resumo('NATIVO — batalha (grafo já nascido na carga)');
console.log({ msMotor: +msMotor.toFixed(1), nosCarga, msR1: +msR1.toFixed(1), msR2: +msR2.toFixed(1), msMis: +msMis.toFixed(1), msSalva: +msSalva.toFixed(1), msQuadros: +msQuadros.toFixed(1), setTargetEm180q: setAlvo, setPorQuadro: +(setAlvo / 180).toFixed(1), setPorQuadroEstavel: +(setEstavel / 180).toFixed(1), nosR1 });

// caminho do mixer: 0 nós por disparo, mas agrupa < 30 ms (soma de potência)
criados.length = 0;
batalha = true;
const mx = { ids: {}, dur: {}, n: 0, sl: Array.from({ length: 64 }, () => ({ fim: 0, at: 0, prot: false, nome: '', cat: '', t0: 0, d: 0 })), node: { port: { postMessage() {} } } };
for (const n of ['canhao_grande', 'cam:canhao:3', 'nk:estalo', 'flaresSint', 'sint:canhao_grande']) { mx.ids[n] = mx.n++; mx.dur[n] = 1.2; }
a.mix = mx; a.mixStats = { tocados: 0, agrupados: 0, roubados: 0, descartados: 0, porCat: {} };
a.ctx.currentTime += 1;
let tocadas = 0;
for (let k = 0; k < 6; k++) { a.ctx.currentTime += 0.005; if (a.toca('canhao_grande', { d: 30, pan: 0, vol: 1, voz: k })) tocadas++; }
const g0 = mx.sl.find((v) => v.nome === 'canhao_grande');
console.log('\n== MIXER salva 6 canos em 30 ms ==');
console.log({ agrupados: a.mixStats.agrupados, tocados: a.mixStats.tocados, ganhoVoz: g0 && +g0.at.toFixed(3), nos: criados.filter((c) => c.batalha).length });
a.ctx.currentTime += 1;
a.mixStats.agrupados = 0; a.mixStats.tocados = 0;
for (let k = 0; k < 6; k++) { a.ctx.currentTime += 0.008; a.toca('canhao_grande', { d: 30, pan: 0, vol: 1, voz: k }); }
console.log('== MIXER salva 6 canos em 48 ms (passa de 40: cada cano é voz) ==', { agrupados: a.mixStats.agrupados, tocados: a.mixStats.tocados });

const { sinteseSons, cacheEmCombateAgora } = await import(pathToFileURL(new URL('../src/audio/cacheSom.js', import.meta.url).pathname).href);
const idbAntes = idbOps.length;
const sint = await sinteseSons(48000, 'diag');
console.log('IndexedDB em combate', { flag: cacheEmCombateAgora(), sint, opsNovas: idbOps.length - idbAntes });

// pico da conversão Float32 → AudioBuffer (o que o worker devolve na 1ª abertura)
console.log('\n== CÓPIA na thread principal (tamanho real de um estrondo de 12 s estéreo) ==');
{
  const sr = 48000, n = sr * 12, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i += 64) L[i] = 0.2;
  const t = performance.now();
  const b = a.ctx.createBuffer(2, n, sr); b.copyToChannel(L, 0); b.copyToChannel(R, 1);
  console.log({ ms: +(performance.now() - t).toFixed(1), amostras: n * 2 });
}
console.log('idb ops', idbOps.length);
