// v1.2.23 item 4 — MEDIDAS na PARTIDA REAL (Chrome headless, dist servido): grava a saída FINAL (depois do teto) de cada evento do combate no navio
// do JOGADOR — atingido por canhão 127, míssil, granada (RBU) e torpedo; lançamento de míssil (VLS) e de granada — e mede true-peak (dBTP, 4× sinc),
// LUFS-M máx (BS.1770, 400 ms), LUFS-S máx (3 s), energia < 60 Hz (LP 4ª ordem), faixa dinâmica (pico − RMS), correlação L/R, balanço e clipping.
// Uso: URL=http://127.0.0.1:4190/?auto ROT=1.2.22 node --experimental-websocket tests/medidas1223.mjs  (4190 = dist 1.2.22 reconstruída, 4173 = 1.2.23)
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto', ROT = process.env.ROT || '1.2.23', OUT = process.env.OUT || `/workspace/medidas1223_${ROT}.json`;
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; await b.vai(URL);
for (let i = 0; i < 300; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ const A=__nnsUI.audio; try{A.setMusicaOn(false); A.paraMusica();}catch(e){} await A.iniciar(); return 1 })()`, 200000);
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
for (let i = 0; i < 120; i++) { if (await ev(`(()=>{const A=__nns.audio; return A.ctx.state==='running' && !!A.mix && A.mix.ids['cam:impZ:linha:p']!=null && (!A.lancamentoJogador || A.mix.ids['lj:missil']!=null) })()`)) break; await esp(500); }
const SR = await ev(`__nns.audio.ctx.sampleRate`);
/* inimigo longe (sem tiros dele) e jogador sem alvo; TAP por ScriptProcessor depois do teto (nó de TESTE, criado antes das medidas) */
const longe = `(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; for (const q of S.navios) if (q.time!==eu.time) { q.x=eu.x+40000; q.z=eu.z+40000; q.v=0; } eu.vida=eu.C.vida; return 1 })()`;
await ev(longe); await esp(6000);
await ev(`(()=>{ const A=__nns.audio, c=A.ctx; const sp=c.createScriptProcessor(4096,2,2); (A.teto||A.lim).connect(sp); sp.connect(c.destination); window.__rec={on:false,L:[],R:[]}; sp.onaudioprocess=(e)=>{ const o=e.outputBuffer; o.getChannelData(0).fill(0); o.getChannelData(1).fill(0); if(!__rec.on) return; __rec.L.push(new Float32Array(e.inputBuffer.getChannelData(0))); __rec.R.push(new Float32Array(e.inputBuffer.getChannelData(1))); }; window.__sp=sp; return 1 })()`);
const b64 = (a) => { let s = ''; const u = new Uint8Array(a.buffer); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
async function grava(js, seg) { await ev(longe); await ev(`(()=>{ __rec.L=[]; __rec.R=[]; __rec.on=true; ${js}; return 1 })()`); await esp(seg * 1000 + 300);
  const r = JSON.parse(await ev(`(()=>{ __rec.on=false; const j=(a)=>{ let n=0; for (const x of a) n+=x.length; const o=new Float32Array(n); let k=0; for (const x of a){ o.set(x,k); k+=x.length; } return o; }; const ${b64.toString().replace('(a) =>', 'b64=(a)=>')}; return JSON.stringify({L:b64(j(__rec.L)),R:b64(j(__rec.R))}) })()`, 120000));
  const d = (s) => { const u = Buffer.from(s, 'base64'); return new Float32Array(u.buffer, u.byteOffset, u.length >> 2).slice(0, Math.round(seg * SR)); }; return [d(r.L), d(r.R)]; }
const db = (x) => +(20 * Math.log10(Math.max(1e-9, x))).toFixed(1);
function biq(y, b, a) { const o = new Float32Array(y.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < y.length; i++) { const x = y[i], v = b[0] * x + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2; x2 = x1; x1 = x; y2 = y1; y1 = v; o[i] = v; } return o; }
function rbj(tipo, fc, q = 0.707) { const w = 2 * Math.PI * fc / SR, cs = Math.cos(w), al = Math.sin(w) / (2 * q), a0 = 1 + al; return tipo === 'lp' ? [[(1 - cs) / 2 / a0, (1 - cs) / a0, (1 - cs) / 2 / a0], [1, -2 * cs / a0, (1 - al) / a0]] : [[(1 + cs) / 2 / a0, -(1 + cs) / a0, (1 + cs) / 2 / a0], [1, -2 * cs / a0, (1 - al) / a0]]; }
const lp60 = (y) => biq(biq(y, ...rbj('lp', 60)), ...rbj('lp', 60));
/* K-weighting para 48 kHz (BS.1770) recalculado para SR */
function kw(y) { const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, K = Math.tan(Math.PI * f0 / SR), Vh = Math.pow(10, G / 20), Vb = Math.pow(Vh, 0.4996667741545416), a0 = 1 + K / Q + K * K;
  const b1 = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0], a1 = [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0];
  const f1 = 38.13547087602444, Q1 = 0.5003270373238773, K1 = Math.tan(Math.PI * f1 / SR), d = 1 + K1 / Q1 + K1 * K1; const a2 = [1, 2 * (K1 * K1 - 1) / d, (1 - K1 / Q1 + K1 * K1) / d]; return biq(biq(y, b1, a1), [1, -2, 1], a2); }
function lufs(chs, jan) { const K = chs.map(kw), W = Math.round(jan * SR), H = Math.round(0.1 * SR); let mx = -200; for (let i = 0; i + W <= K[0].length; i += H) { let s = 0; for (const k of K) { let q = 0; for (let j = i; j < i + W; j++) q += k[j] * k[j]; s += q / W; } mx = Math.max(mx, -0.691 + 10 * Math.log10(Math.max(1e-12, s))); } return +mx.toFixed(1); }
const pk = (y) => { let p = 0; for (let i = 0; i < y.length; i++) p = Math.max(p, Math.abs(y[i])); return p; };
function truePeak(y) { const L = 4, T = 16; let p = pk(y); const h = []; for (let ph = 1; ph < L; ph++) { const f = []; for (let k = -T; k < T; k++) { const x = k + ph / L; const s = Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); f.push(s * (0.5 + 0.5 * Math.cos(Math.PI * x / T))); } h.push(f); }
  for (let i = T; i < y.length - T; i++) { if (Math.abs(y[i]) < p * 0.5) continue; for (const f of h) { let s = 0; for (let k = -T; k < T; k++) s += y[i - k] * f[k + T]; p = Math.max(p, Math.abs(s)); } } return p; }
const pot = (y, i0 = 0, i1 = y.length) => { let s = 0; for (let i = i0; i < i1; i++) s += y[i] * y[i]; return s / Math.max(1, i1 - i0); };
function mede([L, R], base) { const N2 = Math.round(2 * SR), pL = pot(L), pR = pot(R), lfL = lp60(L), lfR = lp60(R); let c = 0; for (let i = 0; i < L.length; i++) c += L[i] * R[i];
  const lfP = (pot(lfL, 0, N2) + pot(lfR, 0, N2)) / 2, lfB = base ? base.lfP : 0;
  return { truePeak_dBTP: db(Math.max(truePeak(L), truePeak(R))), pico_dBFS: db(Math.max(pk(L), pk(R))), LUFS_M_max: lufs([L, R], 0.4), LUFS_S_max: lufs([L, R], 3), rms_dB: db(Math.sqrt((pL + pR) / 2)),
    sub60Hz_2s_dB: db(Math.sqrt(lfP)), sub60Hz_menos_base_dB: db(Math.sqrt(Math.max(1e-18, lfP - lfB))), sub60Hz_pico_dBFS: db(Math.max(pk(lfL), pk(lfR))),
    faixaDinamica_pico_menos_rms_dB: +(db(Math.max(pk(L), pk(R))) - db(Math.sqrt((pL + pR) / 2))).toFixed(1), correlacaoLR: +(c / Math.sqrt(pL * pR * L.length * L.length)).toFixed(3), balancoLR_dB: +(10 * Math.log10(pL / pR)).toFixed(2),
    clip: L.reduce((a, v) => a + (Math.abs(v) >= 0.999 ? 1 : 0), 0) + R.reduce((a, v) => a + (Math.abs(v) >= 0.999 ? 1 : 0), 0), _lfP: lfP }; }
const R = { versao: ROT, url: URL, sr: SR, dist: await ev(`[...document.scripts].map(s=>s.src).join(' ')`) };
const baseW = await grava('', 3); R.base = mede(baseW); const B = { lfP: R.base._lfP };
const imp = (tipo, cal) => `const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); const n=eu; const c=Math.cos(n.rumo), s=Math.sin(n.rumo); const p={lx:0,ly:1,lz:0.15*n.C.L}; const x=n.x+p.lx*c-p.lz*s, z=n.z+p.lx*s+p.lz*c; S.evento({ t:'impacto', tipo:'${tipo}', cal:${cal}, x, y:p.ly, z, lx:p.lx, ly:p.ly, lz:p.lz, alvo:S.navios.indexOf(n), dono:S.navios.indexOf(al), dano:1, apl:1 })`;
const EVS = { 'atingido_canhao127': imp('canhao', 127), 'atingido_missil': imp('missil', 0), 'atingido_granada_rbu': imp('rbu', 127),
  'atingido_torpedo': `const N=__nns, S=N.S.sim, eu=N.eu; const al=S.navios.find(q=>q.time!==eu.time); S.evento({ t:'torpImpacto', x:eu.x+5, z:eu.z, alvo:S.navios.indexOf(eu), dono:S.navios.indexOf(al), dano:1, apl:1 })`,
  'lancamento_missil_vls': `const N=__nns, S=N.S.sim, eu=N.eu; S.evento({ t:'vls', id:S.navios.indexOf(eu), x:eu.x, y:8, z:eu.z, cel:0, atraso:0.4 })`,
  'lancamento_granada': `const N=__nns, S=N.S.sim, eu=N.eu; S.evento({ t:'tiroRbu', id:S.navios.indexOf(eu), x:eu.x, y:6, z:eu.z, az:0, can:0, gi:-1, mi:0 })` };
R.ev = {}; for (const [k, js] of Object.entries(EVS)) { await esp(7000); const w = await grava(js, 7); R.ev[k] = mede(w, B); delete R.ev[k]._lfP; fs.writeFileSync(`/tmp/med_${ROT}_${k}.f32`, Buffer.from(w[0].buffer)); console.log(ROT, k, JSON.stringify(R.ev[k])); }
delete R.base._lfP; R.erros = b.erros.slice(0, 20); R.diag = await ev(`JSON.stringify({lancJ: __nns.audio.diag && __nns.audio.diag.ev.lancJ, ij: __nns.audio.diag && __nns.audio.diag.ev.ij})`); fs.writeFileSync(OUT, JSON.stringify(R, null, 1)); console.log('base', JSON.stringify(R.base)); console.log('->', OUT); await b.fecha(); process.exit(0);
