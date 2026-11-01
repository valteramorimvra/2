// v1.2.16 itens 31/33/33b: base naval, atracação a contrabordo, órbita cinematográfica da câmera (menu sempre; estaleiro só com giro).
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1216/porto'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI && !!(window.__nns&&__nns.vitrine)`)) break; await esp(500); }
const st = `JSON.stringify((()=>{ const V=__nns.vitrine; return { ang:V.ang, rot:V.navio.g.rotation.y, nx:V.navio.g.position.x, cine:!!V.cine, auto:V.auto!==false, k:V.k, px:V.porto?V.porto.position.x:null, pv:V.porto?V.porto.visible:null, meia: V.caixa?Math.max(Math.abs(V.caixa.min.x),Math.abs(V.caixa.max.x)):null, amarras: V.amarras?V.amarras.children.length:0, cam:V.cam.position.toArray().map(v=>+v.toFixed(1)) } })())`;
await ev(`(()=>{ __nnsUI.TELAS.inicio(); return 1 })()`); await esp(2000);
const m0 = JSON.parse(await ev(st)); await b.foto(DIR + '/menu-orbita-1.png'); await esp(6000); const m1 = JSON.parse(await ev(st)); await b.foto(DIR + '/menu-orbita-2.png'); await esp(6000); await b.foto(DIR + '/menu-orbita-3.png'); const m2 = JSON.parse(await ev(st));
R.menu = { m0, m1, m2 }; if (!m0.cine || !m0.auto) falhas.push('menu sem cine/auto'); if (!(Math.abs(m1.ang - m0.ang) > 0.05 && Math.abs(m2.ang - m1.ang) > 0.05)) falhas.push('menu: órbita parada'); if (Math.abs(m2.rot - m0.rot) > 1e-6) falhas.push('menu: navio girou (deveria ser a câmera)');
// estaleiro: desliga giro e liga porto
await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(1500);
await ev(`(()=>{ const A=__nnsUI.save.ajustes; if (!A.portoVista) document.querySelector('[data-a=porto]').click(); if (A.portoAuto!==false) document.querySelector('[data-a=girar]').click(); return 1 })()`); await esp(9000);
const e0 = JSON.parse(await ev(st)); await esp(4000); const e1 = JSON.parse(await ev(st)); await b.foto(DIR + '/estaleiro-porto-sem-giro.png');
R.semGiro = { e0, e1 }; if (e0.cine || e0.auto) falhas.push('estaleiro: auto sem giro'); if (Math.abs(e1.ang - e0.ang) > 1e-3) falhas.push('estaleiro sem giro: câmera mexeu');
await ev(`(()=>{ document.querySelector('[data-a=girar]').click(); return 1 })()`);
const angs = []; for (let i = 0; i < 8; i++) { await esp(2500); const q = JSON.parse(await ev(st)); angs.push(q); if (i === 2 || i === 6) await b.foto(DIR + `/estaleiro-porto-giro-${i}.png`); }
R.giro = angs.map(q => +q.ang.toFixed(2)); R.giroCam = angs.map(q => q.cam); if (Math.max(...R.giro) - Math.min(...R.giro) < 0.1) falhas.push('giro: câmera parada'); const rel = (a) => Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI)); if (angs.some(q => Math.abs(rel(q.ang)) > 1.26)) falhas.push('giro atravessou o cais'); if (angs.some(q => q.cam[0] > 0)) falhas.push('câmera do lado de terra');
if (angs.some(q => Math.abs(Math.abs(q.rot) - Math.PI) > 0.02)) falhas.push('navio não paralelo ao cais');
// classes: costado encostado nas defensas
R.classes = {}; for (const c of ['corveta', 'destroier', 'capitania', 'leviata', 'aurora']) { await ev(`(()=>{ __nns.mostraVitrine('${c}','azul',-0.24); __nns.setPortoVitrine(true); __nns.vitrine.auto=false; return 1 })()`); await esp(4000); const q = JSON.parse(await ev(st)); const folga = (q.px + 34.25 - 0.75) - q.meia; R.classes[c] = { folga: +folga.toFixed(2), amarras: q.amarras, rot: +q.rot.toFixed(3) }; if (Math.abs(folga) > 0.05) falhas.push(c + ' folga ' + folga); if (q.amarras < 7) falhas.push(c + ' sem espias'); await b.foto(DIR + `/atracado-${c}.png`); }
console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join(' | ')); b.fecha(); process.exit(falhas.length ? 1 : 0);
