// v1.2.16 — NOMES DOURADOS como no CELULAR: UA Android, tela 915×412 com DPR 2.625, qualidade AUTOMÁTICA (padrão), câmeras PADRÃO
// (vitrine do estaleiro e câmera de batalha), camuflagem padrão e lendária. Mede pixels do nome: captura com nome × sem nome (diferença).
import { abre } from './cdp.mjs'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const dir = process.env.DIR || '/workspace/nexo-naval-shots/1216'; const TAG = process.env.TAG || '1216'; fs.mkdirSync(dir, { recursive: true });
const DPR = +(process.env.DPR || 2.625), W = 915, H = 412, URL = process.env.URL || 'http://127.0.0.1:4173/';
const b = await abre(null, { w: W, h: H }); const ev = b.ev, esp = b.espera;
await b.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.100 Mobile Safari/537.36', platform: 'Linux armv8l' });
await b.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
await b.vai(URL + '?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const info = await ev(`(()=>{ const R=__nns.R, gl=R.getContext(); return JSON.stringify({ webgl2: R.capabilities.isWebGL2!==false && (typeof WebGL2RenderingContext!=='undefined' && gl instanceof WebGL2RenderingContext), dpr: devicePixelRatio, ua: navigator.userAgent.slice(0,40), qual: __nnsUI.save.ajustes.qualidade, nivel: __nns.nivelInicial(), maxTex: R.capabilities.maxTextureSize, aniso: R.capabilities.getMaxAnisotropy(), depth: gl.getParameter(gl.DEPTH_BITS) }) })()`);
console.log('ambiente', info);
const res = []; const pix = (a, c) => { const out = execFileSync('python3', ['-c', `
from PIL import Image, ImageChops
a=Image.open('${a}').convert('RGB'); c=Image.open('${c}').convert('RGB'); d=ImageChops.difference(a,c).convert('L').point(lambda v:255 if v>18 else 0)
print(sum(1 for v in d.getdata() if v))`]).toString().trim(); return +out; };
const nomeVis = (on) => ev(`(()=>{ const ms=[]; const vis=(o)=>{ o.traverse(m=>{ if (m.isMesh && m.material && m.material.userData && m.material.userData.nomeOuro) ms.push(m); if (m.isMesh && m.material && m.material.metalness===0.92 && m.material.map) ms.push(m); }); }; if (__nns.vitrine) vis(__nns.vitrine.cena); if (__nns.cena) vis(__nns.cena); ms.forEach(m=>m.visible=${on}); return ms.length })()`);
const mede = () => ev(`(()=>{ const j=__nns, R=j.R, T=j.THREE; const V=j.vitrine; const emV = V && V.ativo && !j.rodando; const cena = emV ? V.cena : j.cena, cam = emV ? V.cam : j.cam; const ms=[]; cena.traverse(m=>{ if (m.isMesh && m.material && m.material.userData && m.material.userData.nomeOuro) ms.push(m); });
  const sz=R.getDrawingBufferSize(new T.Vector2()); const w=sz.x|0, h=sz.y|0; const rt=new T.WebGLRenderTarget(w,h,{samples:0}); const a=new Uint8Array(w*h*4), c=new Uint8Array(w*h*4);
  const rend=(buf)=>{ R.setRenderTarget(rt); R.render(cena,cam); R.readRenderTargetPixels(rt,0,0,w,h,buf); R.setRenderTarget(null); };
  rend(a); ms.forEach(m=>m.visible=false); rend(c); ms.forEach(m=>m.visible=true); rt.dispose(); let n=0, lado=0; for(let i=0;i<w*h;i++){ const p=i*4; if (Math.abs(a[p]-c[p])+Math.abs(a[p+1]-c[p+1])+Math.abs(a[p+2]-c[p+2])>30) n++; }
  return JSON.stringify({ px: n, malhas: ms.length, vis: ms.filter(m=>{ let o=m; while(o){ if(!o.visible) return false; o=o.parent; } return true; }).length, tela: w+'x'+h }) })()`);
async function par(nome, fixa) { await fixa(); await esp(900); await b.foto(`${dir}/${nome}.png`); const r = JSON.parse(await mede()); res.push(`${nome}: ${r.px} px do nome (malhas ${r.vis}/${r.malhas}, ${r.tela})`); console.log(res.at(-1)); return r.px; }
let falhas = 0;
for (const [k, pint] of [['colosso', null], ['baluarte', null], ['colosso', 'lend_brasa'], ['baluarte', 'lend_relampago']]) {
  // ESTALEIRO (vitrine, câmera padrão parada no ângulo inicial)
  await ev(`(()=>{ const U=__nnsUI; U.save.ajustes.dev=true; if (${JSON.stringify(pint)}) { const e=U.eco; e.e.ouro=1e6; try{ e.comprarPintura(${JSON.stringify(pint)}); }catch(x){} e.escolherPintura('${k}', ${JSON.stringify(pint)}); } else { U.eco.e.pintura['${k}'] = undefined; delete U.eco.e.pintura['${k}']; } U.TELAS.estaleiro(); const bt=document.querySelector('button[data-c="${k}"]'); if (bt) bt.click(); const V=__nns.vitrine; V.auto=false; V.ang=0.6; V.elev=0.34; V.tToque=0; return 1 })()`); await esp(2500);
  const pE = await par(`estaleiro-${k}-${pint || 'padrao'}`, () => ev(`(()=>{ const V=__nns.vitrine; V.ang=0.6; V.tToque=0; return 1 })()`)); if (pE < 150) falhas++;
  await par(`estaleiro-zoom-${k}-${pint || 'padrao'}`, () => ev(`(()=>{ const V=__nns.vitrine; V.zoom=0.45; V.ang=0.9; V.tToque=0; return 1 })()`)); await ev(`(()=>{ __nns.vitrine.zoom=1; return 1 })()`);
  // BATALHA (câmera padrão de perseguição, após alguns segundos de jogo)
  await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'duelo', classe: '${k}', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; __nns.hud&&__nns.hud.dica&&__nns.hud.dica(null); return 1 })()`, 120000); await esp(6000);
  const pB = await par(`batalha-${k}-${pint || 'padrao'}`, async () => { await ev(`(()=>{ __nns.pausado=true; return 1 })()`); }); if (pB < 60) falhas++;
  const pL = await par(`batalha-lado-${k}-${pint || 'padrao'}`, () => ev(`(()=>{ const j=__nns, n=j.eu; const o={...j.local(n, n.C.B*0.5+n.C.L*0.55, 22, -n.C.L*0.45)}, t={...j.local(n, 0, 6, -n.C.L*0.12)}; j.cam.position.set(o.x,o.y,o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.updateMatrixWorld(); j.atualizaNavios(0, j.S.sim.t); j.R.render(j.cena,j.cam); return 1 })()`)); if (pL < 400) falhas++;
  // distância média (~900 m, mesma câmera padrão recuada)
  const pM = await par(`batalha-900m-${k}-${pint || 'padrao'}`, () => ev(`(()=>{ const j=__nns, n=j.eu; const o={...j.local(n, n.C.B*1.2+700, 90, -n.C.L*0.25-520)}, t={...j.local(n, 0, 8, -n.C.L*0.19)}; j.cam.position.set(o.x,o.y,o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.fov=55; j.cam.updateProjectionMatrix(); j.cam.updateMatrixWorld(); j.atualizaNavios(0, j.S.sim.t); j.R.render(j.cena,j.cam); return 1 })()`)); if (pM < 8) falhas++;
  await ev(`(()=>{ __nns.pausado=false; __nns.encerra && __nns.encerra(); return 1 })()`); await esp(1000);
}
const lin = `${TAG} ${info} → ${res.join(' · ')} · falhas ${falhas} · erros ${JSON.stringify(b.erros.slice(0, 3))}`; console.log(lin); fs.appendFileSync('/workspace/nome1216.log', lin + '\n'); b.fecha(); process.exit(0);
