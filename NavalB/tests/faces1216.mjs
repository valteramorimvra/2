// v1.2.16: varredura de FACES INTERNAS — todas as classes × 12 azimutes × (cima 35°, baixo −20°): face traseira visível (gl_FrontFacing falso) = vermelho.
// Material de teste DoubleSide no lugar de todos; o mar fica fora (casco é testado isolado). Mede fração de pixels vermelhos sobre os pixels do navio.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = process.env.DIR || '/workspace/nexo-naval-shots/1216/faces'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 640, h: 360 }); const ev = b.ev, esp = b.espera;
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'puffin', seed: 5, hora: 'dia', tempo: 'limpo' }); return 1 })()`, 120000); await esp(4000);
if (process.env.DUMP) await ev(`window.__DUMP=${JSON.stringify(process.env.DUMP.split(','))}; 1`);
const out = await ev(`(()=>{ const j=__nns, T=j.THREE, R=j.R; j.pausado=1; const W=320,H=200; const rt=new T.WebGLRenderTarget(W,H); const px=new Uint8Array(W*H*4);
  const mat=new T.ShaderMaterial({ side:T.DoubleSide, vertexShader:'void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader:'void main(){ gl_FragColor = gl_FrontFacing ? vec4(0.5,0.5,0.5,1.0) : vec4(1.0,0.0,0.0,1.0); }' });
  const cena=new T.Scene(); cena.overrideMaterial=mat; const cam=new T.PerspectiveCamera(40,W/H,0.5,5000); const L=[]; const pior=[];
  for (const k of Object.keys(j.CLASSES)) { const C=j.CLASSES[k]; const r=j.criaNavio3D(k,'azul'); cena.add(r.g); r.g.updateMatrixWorld(true);
    /* planos finos de propósito (bandeira, linhas, heliponto/faixas/nomes decalcados) são excluídos: só sólidos */
    const ocult=[]; r.g.traverse(o=>{ if(o.isMesh && (/flamula|linhas|bandeira|nome|enfeite|faixa/i.test(o.name) || o.userData.luz || o.material.isMeshBasicMaterial || o.material.blending===2)) { ocult.push(o); o.visible=false; } if (o.isLine||o.isLineSegments||o.isSprite||o.isPoints) { o.visible=false; } });
    let maxF=0, maxA=''; for (const el of [35,-20]) for (let a=0;a<12;a++){ const az=a*Math.PI/6, d=C.L*1.25; cam.position.set(Math.sin(az)*Math.cos(el*Math.PI/180)*d, Math.sin(el*Math.PI/180)*d + (el<0? -2:0), Math.cos(az)*Math.cos(el*Math.PI/180)*d); cam.lookAt(0, el<0? -1 : C.F*0.6, 0); cam.updateMatrixWorld();
      R.setRenderTarget(rt); R.setClearColor(0x000000,1); R.clear(); R.render(cena,cam); R.readRenderTargetPixels(rt,0,0,W,H,px); R.setRenderTarget(null);
      if (window.__DUMP && window.__DUMP.includes(k) && (a===6||a===0||a===3||a===9) ) { const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); const id=x.createImageData(W,H); for(let y=0;y<H;y++) id.data.set(px.subarray((H-1-y)*W*4,(H-y)*W*4), y*W*4); x.putImageData(id,0,0); (window.__IMGS=window.__IMGS||{})[k+'_'+(el>0?'cima':'baixo')+'_'+a*30]=c.toDataURL(); }
      let red=0, tot=0; for(let i=0;i<W*H;i++){ const p=i*4; if(px[p]|px[p+1]|px[p+2]){ tot++; if(px[p]>200&&px[p+1]<40) red++; } } const f=tot?red/tot:0; if(f>maxF){maxF=f; maxA=(el>0?'cima':'baixo')+' '+(a*30)+'°';} }
    L.push(k+' '+(maxF*100).toFixed(2)+'% @'+maxA); cena.remove(r.g); }
  rt.dispose(); return L.join('\\n') })()`, 600000);
console.log(out); if (process.env.DUMP) { const im = await ev(`JSON.stringify(window.__IMGS||{})`); for (const [n,u] of Object.entries(JSON.parse(im))) fs.writeFileSync(`${DIR}/${n}.png`, Buffer.from(u.split(',')[1],'base64')); } fs.writeFileSync(process.env.LOG || '/workspace/faces1216.log', out + '\n');
b.fecha(); process.exit(0);
