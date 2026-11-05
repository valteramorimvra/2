// v1.2.21 itens 20/20b — navio distante NÍTIDO: LOD por tamanho em PIXELS na tela (zoom incluso), armas com silhueta real (não somem/viram pontos),
// cano com espessura mínima na tela. Capturas 2/5/10 km sem e com zoom, ANTES (1.2.20 :4181) × DEPOIS (:4173). Programas iguais, 0 erros.
import { abre } from './cdp.mjs'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const DIR = '/workspace/nexo-naval-shots/1221/lod'; fs.mkdirSync(DIR, { recursive: true }); const falhas = []; const R = {}; const avisoSil = [];
const ALVOS = [['depois', 'http://127.0.0.1:4173/?auto'], ['antes', process.env.BASE_URL || 'http://127.0.0.1:4181/?auto']];
/* v1.2.21 (16:1x): DUAS passadas de cada build (depois, antes, depois2, antes2) e a comparação de pixels usa a MÉDIA das duas — a base 1.2.20 não é determinística no quadro congelado (a 10 km com zoom variou 139–184 px entre rodadas; a 1.2.21 ficou em 142–157), então uma passada só da base reprovava/aprovava por sorteio. Mesmo critério (≥ 90%) nos dois lados. */
ALVOS.push(['depois2', ALVOS[0][1]], ['antes2', ALVOS[1][1]]);
const BR = 87 * Math.PI / 180; /* marcação com 11,5 km de água aberta a partir do centro do mapa atóis (calculada pelo terreno da sim) */
for (const [tag, url] of ALVOS) {
  const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; R[tag] = {};
  await b.vai(url); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); c.classeRival='destroier'; c.seed=7; U.zarpar(c); return 1 })()`);
  for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
  await esp(2500);
  await ev(`(()=>{ const N=__nns, S=N.S.sim; N.mem.revelaTudo=1; S.revelaTudo=1; const a=S.navios.find(q=>q.time!==N.eu.time && !q.C.mercante); window.__ai=S.navios.indexOf(a); for (const q of S.navios) if (q!==a && q!==N.eu) { q.x=1e7; } const h=document.querySelector('.hud'); if (h) h.style.visibility='hidden';
    /* v1.2.21 DETERMINISMO: (1) qualidade automática desligada no teste — o governador baixava a resolução (pixelRatio 1→0,9) no meio da rodada conforme a carga da máquina; (2) tempo do mar/arfagem CONGELADO em fases fixas — a crista da onda entre a câmera (16 m) e o alvo mudava a cada rodada */ N.save.ajustes.qualidade='teste_fixa'; N.trocaNivel(); window.__TF=null; N.__anOrig=N.atualizaNavios; N.atualizaNavios=function(dt,t){ return N.__anOrig.call(N, dt, window.__TF!=null ? window.__TF : t); }; N.__amOrig=N.amb.atualiza; N.amb.atualiza=function(t,...r){ return N.__amOrig.call(N.amb, window.__TF!=null ? window.__TF : t, ...r); };
    N.__acOrig=N.atualizaCamera; N.atualizaCamera=function(dt,t){ if (window.__pose) { const cam=N.cam; try { window.__pose(cam, N.S.sim); } catch(e){} cam.updateProjectionMatrix(); return; } return N.__acOrig.call(N,dt,t); }; return __ai })()`);
  const pa = await ev(`__nns.R.info.programs.length`);
  for (const dk of [2, 5, 10]) for (const [zn, fov] of [['sem-zoom', 55], ['zoom', 6]]) {
    const d = dk * 1000;
    await ev(`(window.__pose=(cam,S)=>{ const N=__nns, a=S.navios[__ai], eu=N.eu; eu.x=-Math.sin(${BR})*60; eu.z=Math.cos(${BR})*60; eu.v=0; a.x=Math.sin(${BR})*${d}; a.z=-Math.cos(${BR})*${d}; a.v=0; a.rumo=${BR}+Math.PI/2; a.vida=a.C.vida; a.morto=0; cam.fov=${fov}; cam.position.set(0, 16, 0); cam.lookAt(a.x, 6, a.z); }, 1)`);
    const T0 = 500 + dk * 10 + (zn === 'zoom' ? 3 : 0), FASES = [0, 0.7, 1.4]; /* mesmas 3 fases do mar nas duas builds e em toda rodada */
    await esp(1600); await ev(`(window.__TF=${T0},1)`); await esp(1200);
    const m = JSON.parse(await ev(`(()=>{ const N=__nns, S=N.S.sim, a=S.navios[__ai], r=N.navios[__ai]; const v=new N.THREE.Vector3(a.x, 7, a.z).project(N.cam); const vis=(L)=>(L||[]).filter(c=>c&&c.g&&c.g.visible).length, tot=(L)=>(L||[]).filter(c=>c&&c.g).length;
      const k=r.torres&&r.torres[0]&&r.torres[0].cano ? r.torres[0].cano.scale.x : 1; return JSON.stringify({ sx:(v.x+1)/2*innerWidth, sy:(1-v.y)/2*innerHeight, det: r.det.length ? r.det[0].visible : null, armasVis: (r.armasLOD && r.armasLOD.visible) ? tot(r.ciws)+tot(r.a30)+tot(r.sec)+tot(r.lg) : vis(r.ciws)+vis(r.a30)+vis(r.sec)+vis(r.lg), proxyArmas: !!(r.armasLOD && r.armasLOD.visible), /* v1.2.21: na faixa 10–26 px as armas são desenhadas pelo proxy fundido (mesmas malhas) */ armasTot: tot(r.ciws)+tot(r.a30)+tot(r.sec)+tot(r.lg), radar2: r.radar2 ? (r.radar2.visible || !!(r.armasLOD && r.armasLOD.visible)) : null, pxL: r.pxL ?? null, esc: r.g.scale.x, kCano: k, pr: N.R.getPixelRatio(), focF: N._focF ?? null, L: a.C.L, cal: a.C.canhao ? a.C.canhao.cal : 0 }) })()`));
    /* v1.2.21: 3 amostras por pose (0,7 s entre elas) e MEDIANA — a mesma build variava ±25% entre rodadas (arfagem/balanço do alvo e a crista da onda cobrindo o casco a 5–10 km com a câmera a 16 m) */
    const amostras = []; const rep = []; for (let q = 0; q < 3; q++) { if (q) { await ev(`(window.__TF=${T0 + FASES[q]},1)`); await esp(1200); }
    await ev(`(__nns.pausado=true,(()=>{ /* v1.2.21 (16:0x): partículas (fumaça de chaminé/impacto, borrifo) FORA da medida — são Points do cenário, não LOD do navio; a quantidade no quadro congelado depende do histórico de emissão (quadros reais da máquina), então variava entre builds/rodadas e cobria o navio de 14 px a 10 km */ window.__ptsOff=[]; __nns.cena.traverse(o=>{ if(o.isPoints&&o.visible){ o.visible=false; __ptsOff.push(o); } }); })(),1)`); await esp(150); await ev(`(__nns.R.render(__nns.cena,__nns.cam),1)`); await esp(150); /* quadro CONGELADO: foto, máscara e repetição sobre o mesmo estado */
    const f = `${DIR}/${tag}-${dk}km-${zn}` + (q ? `-q${q}` : '') + '.png'; await b.foto(f);
    /* v1.2.21 (métrica robusta): mesma pose com o navio OCULTO → diferença só dentro da caixa projetada do navio (onda/névoa fora da caixa não contam) */
    const bb = JSON.parse(await ev(`(()=>{ const N=__nns, r=N.navios[__ai]; const B=new N.THREE.Box3().setFromObject(r.g); const V=new N.THREE.Vector3(); let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for (let i=0;i<8;i++){ V.set(i&1?B.max.x:B.min.x, i&2?B.max.y:B.min.y, i&4?B.max.z:B.min.z).project(N.cam); const x=(V.x+1)/2*innerWidth, y=(1-V.y)/2*innerHeight; x0=Math.min(x0,x); x1=Math.max(x1,x); y0=Math.min(y0,y); y1=Math.max(y1,y); } window.__mask=[]; r.g.traverse(o=>{ __mask.push([o,o.layers.mask]); o.layers.set(30); }); return JSON.stringify([x0-3,y0-3,x1+3,y1+3]) })()`));
    await ev(`(__nns.R.render(__nns.cena,__nns.cam),1)`); await esp(150); const f0 = f.replace('.png', '-sem-navio.png'); await b.foto(f0); await ev(`(__mask.forEach(([o,m])=>o.layers.mask=m),__nns.R.render(__nns.cena,__nns.cam),1)`); await esp(150); const fr = f.replace('.png', '-rep.png'); await b.foto(fr); try { rep.push(Number(execFileSync('python3', ['-c', 'import sys\nfrom PIL import Image, ImageChops\na=Image.open(sys.argv[1]).convert("L"); b=Image.open(sys.argv[2]).convert("L"); print(sum(ImageChops.difference(a,b).histogram()[6:]))', f, fr]).toString())); } catch (e) { rep.push(-1); } await ev(`(__nns.pausado=false,1)`);
    try { amostras.push(JSON.parse(execFileSync('python3', ['-c', `
import json,sys
from PIL import Image, ImageChops
a=Image.open(sys.argv[1]).convert('L'); b=Image.open(sys.argv[2]).convert('L'); W,H=a.size
x0,y0,x1,y1=[float(v) for v in sys.argv[3].split(',')]; x0=max(0,int(x0)); y0=max(0,int(y0)); x1=min(W,int(x1)+1); y1=min(H,int(y1)+1)
d=ImageChops.difference(a.crop((x0,y0,x1,y1)), b.crop((x0,y0,x1,y1))); h=d.histogram()
print(json.dumps({'navio_px':sum(h[6:]),'forte_px':sum(h[30:]),'caixa':[x0,y0,x1,y1]}))`, f, f0, bb.join(',')]).toString())); } catch (e) { amostras.push({ erro: String(e).slice(0, 120) }); }
    }
    await ev(`((window.__ptsOff||[]).forEach(o=>o.visible=true),window.__ptsOff=[],1)`); m.repetibilidade = rep; /* px que mudam ao renderizar o MESMO estado de novo (0 = determinístico) */ await ev(`(window.__TF=null,1)`);
    { const ok = amostras.filter((x) => x && x.navio_px != null).sort((x, y) => x.navio_px - y.navio_px); m.dif = ok.length ? Object.assign({}, ok[Math.floor(ok.length / 2)], { amostras: ok.map((x) => x.navio_px), fases: amostras.map((x) => x && x.navio_px) }) : amostras[0]; }
    // pixels da silhueta: recorte em volta do navio, pixels que diferem do mar/céu da borda do recorte
    try { m.px = JSON.parse(execFileSync('python3', ['-c', `
import json,sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB'); W,H=im.size; sx,sy=float(sys.argv[2])*W/915,float(sys.argv[3])*H/412
w,h=int(W*0.30),int(H*0.30); x0,y0=max(0,int(sx-w/2)),max(0,int(sy-h/2)); c=im.crop((x0,y0,min(W,x0+w),min(H,y0+h))); c.save(sys.argv[1].replace('.png','-recorte.png'))
px=c.load(); cw,ch=c.size; import statistics
bd=[px[i,0] for i in range(cw)]+[px[i,ch-1] for i in range(cw)]
def lum(p): return 0.2126*p[0]+0.7152*p[1]+0.0722*p[2]
rows={}
n=0; nf=0
for y in range(ch):
  ref=lum(px[0,y]); ref2=lum(px[cw-1,y]); r=(ref+ref2)/2
  for x in range(cw):
    dl=abs(lum(px[x,y])-r)
    if dl>14: n+=1
    if dl>40: nf+=1
print(json.dumps({'silhueta':n,'forte':nf,'W':W,'H':H}))`, `${DIR}/${tag}-${dk}km-${zn}.png`, String(m.sx), String(m.sy)]).toString()); } catch (e) { m.px = { erro: String(e).slice(0, 120) }; }
    R[tag][`${dk}km-${zn}`] = m; }
  await ev(`(window.__pose=null,1)`); await esp(1500); const pb = await ev(`__nns.R.info.programs.length`); R[tag].programas = [pa, pb]; R[tag].erros = b.erros || [];
  if (/^depois/.test(tag)) { if (pa !== pb) falhas.push(`programas ${pa}→${pb}`); if ((b.erros || []).length) falhas.push('erros JS: ' + b.erros.slice(0, 2).join(' | ')); }
  b.fecha(); }
const A = R.antes, D = R.depois;
for (const k of Object.keys(D).filter((q) => /km/.test(q))) { const d = D[k], a = A[k] || {};
  if (d.armasTot && d.armasVis !== d.armasTot) falhas.push(`${k}: armas visíveis ${d.armasVis}/${d.armasTot}`);
  if (/zoom$/.test(k) && !/sem/.test(k) && d.det === false) falhas.push(`${k}: detalhe (LOD alto) desligado com zoom`);
  if (d.pxL != null && d.pxL >= 40) { const esp = d.cal * 0.0034 * d.kCano * d.esc * d.focF / (parseInt(k) * 1000); if (esp < 1.0) falhas.push(`${k}: cano com ${esp.toFixed(2)} px`); }
  { /* v1.2.21 (determinístico): mesmas 3 fases congeladas do mar nas duas builds → compara a SOMA fase a fase; cada quadro tem de se repetir igual (≤3 px) */ const sm = (q) => q && q.fases ? q.fases.reduce((x, y) => x + (y || 0), 0) : 0; const a2 = (R.antes2 || {})[k] || a, d2 = (R.depois2 || {})[k] || d; const pa = (sm(a.dif) + sm(a2.dif)) / 2, pd = (sm(d.dif) + sm(d2.dif)) / 2; if (a.dif && d.dif && pa > 0 && pd < pa * 0.9) falhas.push(`${k}: pixels do navio (3 fases congeladas) ${pa}→${pd} [${a.dif.fases}]→[${d.dif.fases}]`); for (const [t, q] of [['antes', a], ['depois', d]]) if ((q.repetibilidade || []).some((x) => x < 0 || x > 3)) falhas.push(`${k}: quadro não determinístico (${t}) [${q.repetibilidade}]`); } if (a.px && d.px) avisoSil.push(`${k}: contagem antiga por borda ${a.px.silhueta}→${d.px.silhueta} (informativo, sensível a onda/névoa); navio por diferença ${a.dif && a.dif.navio_px}→${d.dif && d.dif.navio_px}`); }
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync('/workspace/lod1221.json', JSON.stringify(R, null, 1));
if (avisoSil.length) console.log('AVISO (informativo):\n' + avisoSil.join('\n'));
console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); process.exit(falhas.length ? 1 : 0);
