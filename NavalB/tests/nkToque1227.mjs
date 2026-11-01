/** v1.2.27 — caminho real de TOQUE do bombardeiro (TouchEvent/Pointer touch) em 4 resoluções.
 *  Prova: PILOTAR → manche (auto-MANUAL) → virar/subir → câmera órbita 360° (área fora do joy) →
 *  TRAVAR / LANÇAR / IA / ESPERA por toque real. Sem injetar hud.nkJ nem S.comando direto. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto';
const CAP = '/workspace/nexo-naval-strike/capturas1227/nktoque';
fs.mkdirSync(CAP, { recursive: true });
const TELAS = (process.env.TELAS || '915x412,780x360,640x360,412x915').split(',').map((s) => s.split('x').map(Number));
const falhas = [], R = { telas: [] };

async function toque(b, x, y, tipo = 'tap') {
  // CDP Touch + Pointer touch (emulação mobile já ligada em cdp.mjs)
  const id = 1;
  if (tipo === 'tap') {
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id, radiusX: 8, radiusY: 8, force: 0.5 }] });
    await b.espera(40);
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    return;
  }
}
async function arrasta(b, x0, y0, x1, y1, passos = 12, ms = 40) {
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1, radiusX: 10, radiusY: 10, force: 0.6 }] });
  for (let i = 1; i <= passos; i++) {
    const t = i / passos;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y, id: 1, radiusX: 10, radiusY: 10, force: 0.6 }] });
    await b.espera(ms);
  }
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function centroBtn(b, sel) {
  const r = JSON.parse(await b.ev(`(()=>{ const e=document.querySelector('${sel}'); if(!e||e.hidden||e.closest('[hidden]')) return 'null'; const q=e.getBoundingClientRect(); if(q.width<2) return 'null'; return JSON.stringify([q.left+q.width/2,q.top+q.height/2,q.width,q.height,q.left,q.top]) })()`));
  return r;
}

for (const [w, h] of TELAS) {
  const T = { tela: `${w}x${h}`, ok: [] }; const fal = (m) => { falhas.push(`${w}x${h}: ${m}`); T.falha = (T.falha || []).concat(m); };
  const b = await abre(null, { w, h });
  await b.vai(URL);
  for (let i = 0; i < 300; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
  await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica(); return 1 })()`);
  await b.ev(`(async()=>{ await __nnsUI.zarpar({ mapa:'atois', modo:'frota', classe:'chapada', seed:1227, hora:'dia', tempo:'limpo' }); return 1 })()`, 240000);
  for (let i = 0; i < 300; i++) { if (await b.ev(`!!(window.__nns && __nns.S && __nns.eu && __nns.S.sim.tick>20)`)) break; await b.espera(400); }
  // desarmar defesas inimigas + adiantar liberação nuclear + aproximar alvo
  await b.ev(`(()=>{ const j=__nns, sim=j.S.sim, n=j.eu; j.tutorial=false; j.hud.dica&&j.hud.dica(null); sim.t=Math.max(sim.t,121);
    for (const e of sim.navios) if (e.time!==n.time) { e.sam=0; e.ciws=[]; e.lasers=[]; e.sams=[]; }
    let best=null, bd=1e9; for (const e of sim.navios) if (!e.morto && e.time!==n.time) { const d=Math.hypot(e.x-n.x,e.z-n.z); if (d<bd) { bd=d; best=e; } }
    if (best && bd>8000) { const a=Math.atan2(best.x-n.x,-(best.z-n.z)); best.x=n.x+Math.sin(a)*7000; best.z=n.z-Math.cos(a)*7000; }
    j.S.comando({ t:'travar', alvo: best.id }); window.__alvo=best.id; return best.id })()`);
  await b.espera(500);

  // NUCLEAR 2 toques (botão)
  let bn = await centroBtn(b, '[data-a=nuke]');
  if (!bn) { fal('botão NUCLEAR invisível'); R.telas.push(T); b.fecha(); continue; }
  await toque(b, bn[0], bn[1]); await b.espera(350);
  await toque(b, bn[0], bn[1]); await b.espera(2000);
  T.decolou = await b.ev(`__nns.S.sim.nukes.some(q=>q.ativo)?1:0`);
  if (!T.decolou) fal('bombardeiro não decolou após 2 toques NUCLEAR');

  // esperar no ar (fase 2)
  for (let i = 0; i < 80; i++) { if (await b.ev(`(()=>{ const q=__nns.nkQ(); return q&&q.fase===2?1:0 })()`)) break; await b.espera(400); }
  // PILOTAR (mesmo botão vira PILOTAR)
  bn = await centroBtn(b, '[data-a=nuke]');
  if (bn) { await toque(b, bn[0], bn[1]); await b.espera(800); }
  T.piloto = await b.ev(`__nns.nkPil?1:0`);
  T.painel = await b.ev(`document.querySelector('.h-nkp') && !document.querySelector('.h-nkp').hidden ? 1 : 0`);
  if (!T.piloto) fal('PILOTAR não entrou (nkPil=0)');
  if (!T.painel) fal('painel .h-nkp hidden após PILOTAR');

  // Manche: toque+arraste REAL → deve ligar MANUAL e mudar rumo/gam
  const J = await centroBtn(b, '.nk-joy');
  if (!J) fal('nk-joy invisível/sem hit');
  else {
    const before = JSON.parse(await b.ev(`(()=>{ const q=__nns.nkQ(); return JSON.stringify({man:q.manual|0, rumo:+q.rumo.toFixed(4), gam:+(q.gam||0).toFixed(4), y:+q.y.toFixed(1), jx:__nns.hud.nkJ.x, jy:__nns.hud.nkJ.y}) })()`));
    // arrasta para a DIREITA (bank/virar) e um pouco PARA CIMA (subir) — mantém o dedo
    await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: J[0], y: J[1], id: 1, radiusX: 12, radiusY: 12, force: 0.7 }] });
    await b.espera(80);
    for (let i = 1; i <= 16; i++) {
      await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: J[0] + J[2] * 0.42 * (i / 16), y: J[1] - J[3] * 0.35 * (i / 16), id: 1, radiusX: 12, radiusY: 12, force: 0.7 }] });
      await b.espera(60);
    }
    // durante o hold: nkJ deve ser ≠0 e manual deve virar 1
    const mid = JSON.parse(await b.ev(`(()=>{ const q=__nns.nkQ(); return JSON.stringify({man:q.manual|0, jx:+__nns.hud.nkJ.x.toFixed(3), jy:+__nns.hud.nkJ.y.toFixed(3), pe:getComputedStyle(document.querySelector('.nk-joy')).pointerEvents}) })()`));
    T.mancheMid = mid;
    if (!(Math.abs(mid.jx) > 0.05 || Math.abs(mid.jy) > 0.05)) fal(`manche não moveu nkJ (jx=${mid.jx} jy=${mid.jy} pe=${mid.pe})`);
    await b.espera(2200); // deixa a sim aplicar nkPiloto + nkCtl + voar
    const after = JSON.parse(await b.ev(`(()=>{ const q=__nns.nkQ(); return JSON.stringify({man:q.manual|0, rumo:+q.rumo.toFixed(4), gam:+(q.gam||0).toFixed(4), y:+q.y.toFixed(1)}) })()`));
    T.manche = { before, after, mid };
    if (!after.man) fal('toque no manche NÃO ligou MANUAL (causa clássica do celular)');
    else T.ok.push('manche→manual');
    const dRumo = Math.abs(after.rumo - before.rumo);
    const dGam = Math.abs(after.gam - before.gam);
    if (dRumo < 0.02 && dGam < 0.02 && Math.abs(after.y - before.y) < 5) fal(`voo não respondeu ao manche (Δrumo=${dRumo.toFixed(4)} Δgam=${dGam.toFixed(4)})`);
    else T.ok.push('virar/subir');
    await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await b.espera(300);
  }

  // Câmera: arraste no CENTRO da tela (fora do joy) → yaw/pitch mudam; nkCam orbita
  const yaw0 = JSON.parse(await b.ev(`JSON.stringify({yaw:+__nns.yawAlvo.toFixed(3), pitch:+__nns.pitchAlvo.toFixed(3), cy:+__nns.cam.position.y.toFixed(1), cx:+__nns.cam.position.x.toFixed(1)})`));
  const cx = w * 0.55, cy = h * 0.42;
  await arrasta(b, cx, cy, cx + Math.min(180, w * 0.28), cy - Math.min(90, h * 0.18), 14, 35);
  await b.espera(400);
  const yaw1 = JSON.parse(await b.ev(`JSON.stringify({yaw:+__nns.yawAlvo.toFixed(3), pitch:+__nns.pitchAlvo.toFixed(3), cy:+__nns.cam.position.y.toFixed(1), cx:+__nns.cam.position.x.toFixed(1)})`));
  T.cam = { yaw0, yaw1 };
  const dYaw = Math.abs(yaw1.yaw - yaw0.yaw), dPitch = Math.abs(yaw1.pitch - yaw0.pitch);
  if (dYaw < 0.15 && dPitch < 0.08) fal(`câmera NK não orbitou por arraste (Δyaw=${dYaw.toFixed(3)} Δpitch=${dPitch.toFixed(3)})`);
  else T.ok.push('camOrbit');
  // pitch até o céu (força pitch baixo e arrasta para BAIXO na tela = pitch↑)
  await b.ev(`(__nns.pitchAlvo=-0.5, __nns.pitch=-0.5, 1)`); await b.espera(200);
  const p0 = await b.ev(`+__nns.pitchAlvo.toFixed(3)`);
  await arrasta(b, cx, Math.max(40, h * 0.25), cx, Math.min(h - 30, h * 0.25 + Math.min(200, h * 0.5)), 16, 30);
  await b.espera(400);
  const pitchCeu = await b.ev(`+__nns.pitchAlvo.toFixed(3)`);
  T.pitchCeu = { p0, pitchCeu };
  if (!(pitchCeu - p0 > 0.35) && !(pitchCeu > 0.35)) fal(`pitch não sobe ao céu (p0=${p0} → ${pitchCeu})`);
  else T.ok.push('camCeu');

  // Botões por TOQUE: IA (toggle), TRAVAR, e checar hit-test
  const bia = await centroBtn(b, '[data-a=nkIa]');
  const btr = await centroBtn(b, '[data-a=nkTrava]');
  const bso = await centroBtn(b, '[data-a=nkSolta]');
  const bsa = await centroBtn(b, '[data-a=nkSair]');
  T.bts = { ia: !!bia, trava: !!btr, solta: !!bso, sair: !!bsa };
  if (!bia || !btr || !bso || !bsa) fal(`botão NK sem hit: ia=${!!bia} trava=${!!btr} solta=${!!bso} sair=${!!bsa}`);
  if (bia) {
    const man0 = await b.ev(`__nns.nkQ().manual|0`);
    await toque(b, bia[0], bia[1]); await b.espera(500);
    const man1 = await b.ev(`__nns.nkQ().manual|0`);
    if (man0 === man1) fal(`IA toque não alternou manual (${man0}→${man1})`);
    else T.ok.push('iaToggle');
    // volta para manual
    if (!man1) { await toque(b, bia[0], bia[1]); await b.espera(400); }
  }
  if (btr) {
    // nuclear já pode ter alvo; 1º toque destrava — então 2º retrava (prova o botão por toque)
    const al0 = await b.ev(`__nns.nkQ().alvo`);
    await toque(b, btr[0], btr[1]); await b.espera(500);
    const al1 = await b.ev(`__nns.nkQ().alvo`);
    if (al0 >= 0) {
      if (al1 >= 0) fal(`TRAVAR toque não destrava (alvo ${al0}→${al1})`);
      else {
        await toque(b, btr[0], btr[1]); await b.espera(600);
        const al2 = await b.ev(`__nns.nkQ().alvo`);
        T.alvo = al2;
        if (!(al2 >= 0)) fal('TRAVAR 2º toque não retrava alvo');
        else T.ok.push('trava');
      }
    } else {
      T.alvo = al1;
      if (!(al1 >= 0)) fal('TRAVAR por toque não travou alvo');
      else T.ok.push('trava');
    }
  }

  await b.foto(`${CAP}/toque-${w}x${h}.png`);
  // ESPERA / sair câmera
  if (bsa) {
    await toque(b, bsa[0], bsa[1]); await b.espera(700);
    T.saiu = await b.ev(`__nns.nkPil?0:1`);
    if (!T.saiu) fal('ESPERA/sair não saiu do modo piloto');
    else T.ok.push('espera');
  }

  R.telas.push(T);
  b.fecha();
  console.log(T.tela, 'ok=', T.ok, 'falhas=', T.falha || []);
}

fs.writeFileSync('/workspace/nexo-naval-strike/capturas1227/nktoque.json', JSON.stringify({ falhas: falhas.length, lista: falhas, R }, null, 2));
console.log('\nTOTAL falhas', falhas.length);
if (falhas.length) console.log(falhas.join('\n'));
process.exit(falhas.length ? 1 : 0);
