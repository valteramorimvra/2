/** v1.2.28 — A/B câmeras externas vs 1.2.27 + medição costado ~95%. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-strike/capturas1228/camera';
fs.mkdirSync(DIR, { recursive: true });
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
  return JSON.parse(await b.ev(`(()=>{ const j=__nns,n=j.eu,p=j.camPos||j.cam.position,c=j.cam;
    const d=Math.hypot(p.x-n.x,p.z-n.z);
    /* fração: comprimento projetado na largura da tela (broadside approx) */
    const asp=c.aspect|| (915/412); const vfov=c.fov*Math.PI/180; const hfov=2*Math.atan(Math.tan(vfov/2)*asp);
    const fillApprox=n.C.L/(2*d*Math.tan(hfov/2));
    return JSON.stringify({ modo:j.camModo, pitch:+j.pitch.toFixed(3), distCamF:+j.distCamF.toFixed(3), distCamS:+j.distCamS.toFixed(3),
      dist:+d.toFixed(1), cy:+p.y.toFixed(1), L:n.C.L, distL:+(d/n.C.L).toFixed(3), fillApprox:+fillApprox.toFixed(3), fov:+c.fov.toFixed(1), asp:+asp.toFixed(3) }); })()`));
}

const ships = [['corsario', 28], ['volkhar', 28], ['abrolhos', 28], ['chapada', 29]];
const vistas = [
  ['costado', 'costado', null],
  ['popa', 'popa', null],
  ['tresq', 'tresq', null],
  ['popaAlta', 'popaAlta', null],
  ['perto', 'perto', null],
  ['longe', 'longe', null],
  ['canhao', 'canhao_interno', null],
  ['conves', 'conves_interno', null],
];
const meds = {};
const OLD = { costado: 1.22, popa: 1.00, tresq: 1.70, popaAlta: 1.15 };

for (const [classe, seed] of ships) {
  await partida(classe, seed);
  await b.ev(`(__nns.distCamF=1.8, __nns.distCamS=1.8, 1)`);
  await b.espera(300);
  const z = await med();
  if (Math.abs(z.distCamF - 1) > 0.01) falhas.push(classe + ': zoom não travado distCamF=' + z.distCamF);
  meds[classe] = { zoomLock: z.distCamF };

  for (const [modo, nome, pitch] of vistas) {
    await b.ev(`(__nns.camSel('${modo}'),1)`);
    if (modo === 'costado') await b.ev(`(()=>{ const n=__nns.eu; __nns.yawAlvo=n.rumo+Math.PI/2; __nns.yaw=n.rumo+Math.PI/2; __nns.pitchAlvo=0.08; __nns.pitch=0.08; __nns.camPos=null; return 1 })()`);
    if (pitch != null) await b.ev(`(__nns.pitchAlvo=${pitch}, __nns.pitch=${pitch},1)`);
    await b.espera(800);
    const m = await med();
    await b.foto(`${DIR}/${classe}_${nome}.png`);
    meds[classe][nome] = m;
    if (m.distCamF !== 1 && m.distCamS !== 1 && modo !== 'canhao' && modo !== 'conves') falhas.push(`${classe}/${nome}: zoom ativo`);
    // externas mais perto que 1.2.27
    if (OLD[modo] && m.distL > OLD[modo] * 0.95) falhas.push(`${classe}/${nome}: distL ${m.distL} não mais perto que 1.2.27 (${OLD[modo]})`);
  }
  // costado ~95%
  const c = meds[classe].costado;
  if (c && !(c.fillApprox >= 0.85 && c.fillApprox <= 1.15)) falhas.push(`${classe}/costado fill ${c.fillApprox} fora ~95%`);
  // internas: canhao/conves não devem usar P.d (distL muito diferente)
  const can = meds[classe].canhao_interno, conv = meds[classe].conves_interno;
  /* internas: distância absoluta pequena (torre/passadiço), independente de L */
  if (can && can.dist > 55) falhas.push(`${classe}/canhao dist abs ${can.dist} (deveria ~torre)`);
  if (conv && conv.dist > 55) falhas.push(`${classe}/conves dist abs ${conv.dist}`);
}

const out = { falhas, meds, vs1227: OLD };
fs.writeFileSync('/workspace/nexo-naval-strike/capturas1228/camera1228.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ falhas, resumo: Object.fromEntries(Object.entries(meds).map(([k,v]) => [k, { costado: v.costado, popa: v.popa && { distL: v.popa.distL }, perto: v.perto && { distL: v.perto.distL }, canhao: v.canhao_interno && { distL: v.canhao_interno.distL } }])) }, null, 2));
if (falhas.length) { console.error('FALHAS', falhas); process.exit(1); }
console.log('OK capturas em', DIR);
await b.fecha();
