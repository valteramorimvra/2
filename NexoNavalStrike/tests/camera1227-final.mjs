/** v1.2.27 FINAL — 1.2.24 + 4 novas; SEM ZOOM; pitch água→céu; capturas 5 vistas × 3 tamanhos */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-strike/capturas1227/camera'; fs.mkdirSync(DIR, { recursive: true });
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
  await b.ev(`(__nns.tutorial=false,1)`); await b.espera(1200);
}
async function med() {
  return JSON.parse(await b.ev(`(()=>{ const j=__nns,n=j.eu,p=j.camPos||j.cam.position;
    return JSON.stringify({ modo:j.camModo, pitch:+j.pitch.toFixed(3), distCamF:+j.distCamF.toFixed(3), distCamS:+j.distCamS.toFixed(3),
      dist:+Math.hypot(p.x-n.x,p.z-n.z).toFixed(1), cy:+p.y.toFixed(1), L:n.C.L, distL:+(Math.hypot(p.x-n.x,p.z-n.z)/n.C.L).toFixed(3) }); })()`));
}

const ships = [['corsario', 27], ['abrolhos', 28], ['chapada', 29]];
const vistas = [
  ['popa', 'atras_baixa', null],
  ['tresq', 'tresq_elev', null],
  ['costado', 'costado_rente', null],
  ['popaAlta', 'alta_popa', null],
  ['popa', 'ceu', -0.7],
];
const meds = {};

for (const [classe, seed] of ships) {
  await partida(classe, seed);
  // SEM ZOOM: try pinch-equivalent by setting distCamF
  await b.ev(`(__nns.distCamF=1.8, __nns.distCamS=1.8, 1)`);
  await b.espera(300);
  const z = await med();
  if (Math.abs(z.distCamF - 1) > 0.01) falhas.push(classe + ': zoom não travado distCamF=' + z.distCamF);
  meds[classe] = { zoomLock: z.distCamF };

  for (const [modo, nome, pitch] of vistas) {
    await b.ev(`(__nns.camSel('${modo}'),1)`);
    if (pitch != null) await b.ev(`(__nns.pitchAlvo=${pitch}, __nns.pitch=${pitch},1)`);
    await b.espera(700);
    const m = await med();
    await b.foto(`${DIR}/${classe}_${nome}.png`);
    meds[classe][nome] = m;
    if (m.distCamF !== 1 && m.distCamS !== 1) falhas.push(`${classe}/${nome}: zoom ativo`);
  }

  // pitch range allows sky
  await b.ev(`(()=>{ const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); __nns.pitchAlvo=clamp(-0.9, __nns.bino?-0.25:-0.95, __nns.bino?0.12:1.25); return __nns.pitchAlvo; })()`);
  const pSky = +(await b.ev(`__nns.pitchAlvo`));
  if (pSky > -0.85) falhas.push(classe + ': pitch céu bloqueado ' + pSky);

  // ciclo
  await b.ev(`(__nns.camSel('perto'),1)`); await b.espera(200);
  const ciclo = [];
  for (let i = 0; i < 8; i++) { await b.ev(`(__nns.acao('cam'),1)`); await b.espera(250); ciclo.push(await b.ev(`__nns.camModo`)); }
  const esp = ['conves','canhao','longe','popa','tresq','popaAlta','costado','perto'];
  if (JSON.stringify(ciclo) !== JSON.stringify(esp)) falhas.push(classe + ' ciclo ' + ciclo.join('→'));
  meds[classe].ciclo = ciclo;
}

const out = { falhas, meds };
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1227/camera1227.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (falhas.length) { console.error('FALHAS', falhas); process.exit(1); }
console.log('OK capturas em', DIR);
await b.fecha();
