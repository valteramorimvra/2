import { abre } from '/workspace/nexo-naval-strike/tests/cdp.mjs';
const b = await abre(null, { w: 640, h: 360 }); const ev = b.ev, esp = b.espera;
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'frota', classe: 'puffin', seed: 5, hora: 'dia', tempo: 'limpo' }); return 1 })()`, 120000); await esp(3000);
console.log(await ev(`(()=>{ const j=__nns, T=j.THREE, R=j.R; j.pausado=1; const W=320,H=200; const rt=new T.WebGLRenderTarget(W,H); const px=new Uint8Array(W*H*4);
  const mat=new T.ShaderMaterial({ side:T.DoubleSide, vertexShader:'void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader:'void main(){ gl_FragColor = gl_FrontFacing ? vec4(0.5,0.5,0.5,1.0) : vec4(1.0,0.0,0.0,1.0); }' });
  const cena=new T.Scene(); cena.overrideMaterial=mat; const cam=new T.PerspectiveCamera(40,W/H,0.5,5000); const out=[];
  for (const k of ['puffin','strizh','corveta']) { const C=j.CLASSES[k]; const r=j.criaNavio3D(k,'azul'); cena.add(r.g); r.g.updateMatrixWorld(true); const ms=[]; r.g.traverse(o=>{ if(o.isMesh) ms.push(o); if(o.isLine||o.isLineSegments||/flamula|linhas|nome|enfeite|faixa/.test(o.name)) o.visible=false; });
    const conta=()=>{ let red=0; for (const [el,a] of [[35,6],[35,0],[35,3],[-20,3]]) { const az=a*Math.PI/6, d=C.L*1.25; cam.position.set(Math.sin(az)*Math.cos(el*Math.PI/180)*d, Math.sin(el*Math.PI/180)*d, Math.cos(az)*Math.cos(el*Math.PI/180)*d); cam.lookAt(0,C.F*0.6,0); cam.updateMatrixWorld(); R.setRenderTarget(rt); R.setClearColor(0,1); R.clear(); R.render(cena,cam); R.readRenderTargetPixels(rt,0,0,W,H,px); R.setRenderTarget(null); for(let i=0;i<W*H;i++){ const p=i*4; if(px[p]>200&&px[p+1]<40) red++; } } return red; };
    const base=conta(); const sus=[]; for (const m of ms) { if(!m.visible) continue; m.visible=false; const c=conta(); m.visible=true; if (base-c>15) sus.push(m.name+'['+m.geometry.attributes.position.count+'v, mat '+(m.material.name||m.material.color&&m.material.color.getHexString())+', sc '+m.scale.toArray().map(v=>v.toFixed(2))+'] -'+(base-c)); }
    out.push(k+' base '+base+' :: '+sus.join(' ; ')); cena.remove(r.g); }
  return out.join('\\n') })()`, 600000));
b.fecha(); process.exit(0);
