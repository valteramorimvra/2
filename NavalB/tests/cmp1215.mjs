// v1.2.15 — capturas comparativas nas MESMAS cenas (mesma seed/passos): proa, popa+esteira em velocidade, curva, ao longe, mar agitado
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto', TAG = process.env.TAG || '1215', dir = process.env.DIR || '/workspace/nexo-naval-shots/1215/cmp'; fs.mkdirSync(dir, { recursive: true });
const W = 960, H = 432; const b = await abre(URL, { w: W, h: H }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const CL = process.env.CL || 'destroier';
const SO = process.env.SO; let cenas = [
  ['proa', 'limpo', 4, 0, '[-n.C.B*1.8, n.C.F+7, -n.C.L*0.75]', '[0, 0, -n.C.L*0.35]', 50],
  ['popa-esteira', 'limpo', 4, 0, '[n.C.B*2.2, n.C.F+16, n.C.L*1.1]', '[0, 0, n.C.L*1.6]', 55],
  ['curva', 'limpo', 4, 1, '[n.C.B*3, n.C.F+30, n.C.L*1.4]', '[0, 0, n.C.L*0.6]', 55],
  ['longe', 'limpo', 3, 0, '[n.C.B*10, 25, -n.C.L*25]', '[0, n.C.F, 0]', 30],
  ['mar-agitado', 'chuva', 4, 0, '[-n.C.B*2.4, n.C.F+9, -n.C.L*0.2]', '[0, 0, -n.C.L*0.6]', 55]];
if (SO) cenas = cenas.filter((c) => SO.split(',').includes(c[0])); const tempos = []; for (const [nm, tempo, tel, leme, p, a, fov] of cenas) {
  await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa: 'atois', modo: 'duelo', classe: '${CL}', seed: 5, hora: 'dia', tempo: '${tempo}' }); __nns.tutorial=false; __nns.hud&&__nns.hud.dica&&__nns.hud.dica(null); return 1 })()`, 120000);
  await ev(`(()=>{ const j=__nns, S=j.S, n=j.eu; const s=S.sim; for (const q of s.navios) if (q!==n) { q.x=1e7; } n.telAlvo=${tel}; n.tel=${tel}; n.v=n.C.vmax*0.95; if (${leme}) { n.lemeAlvo=1; n.leme=1; } for (let i=0;i<60*14;i++){ if (${leme}) { n.lemeAlvo=1; n.leme=1; } S.avanca(1/60); if (i%2) { j.processaEventos(); j.atualizaNavios(1/30, s.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); s.eventos.length=0; } } return 1 })()`, 180000);
  await ev(`(()=>{ const j=__nns, n=j.eu; j.pausado=1; const p=${p}, a=${a}; const o={...j.local(n,p[0],p[1],p[2])}, t={...j.local(n,a[0],a[1],a[2])}; j.cam.position.set(o.x,Math.max(2,o.y),o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.fov=${fov}; j.cam.aspect=${W}/${H}; j.cam.updateProjectionMatrix(); j.raizHud.style.visibility='hidden'; const HID='${process.env.HIDE||''}'; if (HID.includes('fumaca')) j.fx.fumaca.pts.visible=false; if (HID.includes('mar')) j.amb.mar.visible=false; if (HID.includes('esteira')) j.fx.esteiras.forEach(e=>e.m.visible=false); for (let k=0;k<3;k++) j.R.render(j.cena, j.cam); return 1 })()`);
  await esp(250); await b.foto(`${dir}/${TAG}-${nm}.png`);
  const ms = await ev(`(()=>{ const j=__nns; const t0=performance.now(); for (let k=0;k<10;k++) j.R.render(j.cena,j.cam); j.R.getContext().finish(); return ((performance.now()-t0)/10).toFixed(1) + ' ms/quadro, draws ' + j.R.info.render.calls + ', programas ' + j.R.info.programs.length })()`);
  tempos.push(`${nm}: ${ms}`); await ev(`(()=>{ __nns.pausado=0; __nns.raizHud.style.visibility=''; return 1 })()`); }
console.log(TAG, tempos.join(' | '), 'erros', JSON.stringify(b.erros.slice(0, 3))); b.fecha(); process.exit(0);
