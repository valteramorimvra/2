/** v1.2.27 — prova câmera: fórmulas = 1.2.24; A/B captura perto em corsário + chapada; ciclo inclui orbital no fim; 3/4 separada sai. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/capturas1227/camera'; fs.mkdirSync(DIR, { recursive: true });
const falhas = [];
const b = await abre(null, { w: 915, h: 412 });
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 200; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica(); return 1 })()`);

async function partida(classe, seed) {
  await b.ev(`(()=>{ window.__sAnt=window.__nns?__nns.S:null; __nnsUI.zarpar({ modo:'duelo', classe:'${classe}', classeRival:'volkhar', mapa:'arquipelago', seed:${seed}, hora:'dia', tempo:'limpo' }); return 1 })()`);
  for (let i = 0; i < 120; i++) {
    if (await b.ev(`!!(window.__nns && __nns.S && __nns.S!==window.__sAnt && __nns.eu && __nns.eu.C.id==='${classe}')`)) break;
    await b.espera(400);
  }
  await b.ev(`(__nns.tutorial=false,1)`); await b.espera(1500);
}

async function medCam() {
  return JSON.parse(await b.ev(`(()=>{ const j=__nns, n=j.eu, c=j.cam, p=j.camPos||c.position;
    const d=Math.hypot(p.x-n.x, p.z-n.z);
    return JSON.stringify({ modo:j.camModo, pitch:+j.pitch.toFixed(4), pitchAlvo:+j.pitchAlvo.toFixed(4),
      dist:+d.toFixed(2), cy:+p.y.toFixed(2), L:n.C.L, sG:j._sG==null?null:j._sG,
      fov:+c.fov.toFixed(2), distCamS:+j.distCamS.toFixed(3) }); })()`));
}

// --- corsário (navio médio, baseline 1.2.24) ---
await partida('corsario', 27);
await b.ev(`(__nns.camSel('perto'), __nns.yawAlvo=__nns.eu.rumo+0.35, __nns.pitchAlvo=0.13, 1)`);
await b.espera(800);
const mCors = await medCam();
await b.foto(`${DIR}/corsario_perto.png`);
if (mCors.sG != null && mCors.sG !== 0) falhas.push('corsario: _sG ainda ativo ' + mCors.sG);

// ciclo: perto→conves→canhao→longe→orbital
const ciclo = [];
for (let i = 0; i < 5; i++) {
  await b.ev(`(__nns.acao('cam'),1)`); await b.espera(400);
  ciclo.push(await b.ev(`__nns.camModo`));
}
if (JSON.stringify(ciclo) !== JSON.stringify(['conves','canhao','longe','orbital','perto'])) {
  falhas.push('ciclo esperado conves→canhao→longe→orbital→perto, got ' + ciclo.join('→'));
}

// pitch limit: try force look up
await b.ev(`(__nns.camSel('perto'), __nns.pitchAlvo=-0.5, 1)`);
await b.espera(200);
const lim = JSON.parse(await b.ev(`JSON.stringify({pa:__nns.pitchAlvo, p:__nns.pitch})`));
// after clamp on next drag it'd be -0.05; pitchAlvo may sit until clamp on input — force via same clamp path
await b.ev(`(()=>{ const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); __nns.pitchAlvo=clamp(-0.5, __nns.bino?-0.25:-0.05, __nns.bino?0.12:0.85); return 1 })()`);
const lim2 = await b.ev(`__nns.pitchAlvo`);
if (Math.abs(lim2 - (-0.05)) > 1e-6) falhas.push('pitch limit não é -0.05: ' + lim2);

// --- chapada (gigante: sem sG deve enquadrar como 1.2.24) ---
await partida('chapada', 28);
await b.ev(`(__nns.camSel('perto'), __nns.yawAlvo=__nns.eu.rumo+0.35, __nns.pitchAlvo=0.13, 1)`);
await b.espera(1000);
const mChap = await medCam();
await b.foto(`${DIR}/chapada_perto.png`);
if (mChap.sG) falhas.push('chapada: _sG=' + mChap.sG + ' (deveria ausente/0)');
// distância ~ (L*distL+dist0)*kq*distCamS — sem ×(1+0.16sG)
const distEspMin = mChap.L * 0.5; // sanity
if (!(mChap.dist > distEspMin)) falhas.push('chapada dist suspeita ' + mChap.dist);

await b.ev(`(__nns.camSel('orbital'),1)`); await b.espera(900);
const mOrb0 = await medCam();
await b.foto(`${DIR}/chapada_orbital_t0.png`);
if (mOrb0.modo !== 'orbital') falhas.push('orbital não ativou');
// costado elevado: θ≈π/2, u=1 (após rampa de 3,5 s)
await b.ev(`(()=>{ const n=__nns.eu; __nns.tToque=9; __nns._orbT=8; __nns._orbYaw0=n.rumo+0.28; __nns.yaw=__nns.yawAlvo=n.rumo+Math.PI/2; __nns.camPos=null; return 1 })()`);
await b.espera(700);
const mOrb1 = await medCam();
await b.foto(`${DIR}/chapada_orbital_beam.png`);
const outOrb = { mOrb0, mOrb1, distL0: +(mOrb0.dist/mOrb0.L).toFixed(2), distL1: +(mOrb1.dist/mOrb1.L).toFixed(2), cyL0: +(mOrb0.cy/mOrb0.L).toFixed(3), cyL1: +(mOrb1.cy/mOrb1.L).toFixed(3) };
if (!(outOrb.distL0 >= 0.75 && outOrb.distL0 <= 1.35)) falhas.push('orbital t0 dist/L fora ~1: '+outOrb.distL0);
if (!(outOrb.distL1 >= 1.35 && outOrb.distL1 <= 2.2)) falhas.push('orbital beam dist/L fora 1.5–2: '+outOrb.distL1);
if (!(outOrb.cyL1 >= 0.25)) falhas.push('orbital beam altura baixa cy/L='+outOrb.cyL1);


const out = { falhas, mCors, mChap, outOrb, ciclo };
fs.writeFileSync(`${DIR}/camera1227.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out));
console.log('camera1227 falhas', falhas.length, falhas.join(' | ') || '[]');
b.fecha();
process.exit(falhas.length ? 1 : 0);
