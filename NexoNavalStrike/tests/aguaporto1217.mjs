// v1.2.17 item 10b: ÁGUA/ESPUMA dentro do casco NO PORTO (vitrine do menu/estaleiro/Visualizar). Mesmo método do agua1214:
// r2 (05:2x BRT): 2 px em fragata/popa = mar visto através do disco translúcido do rotor do helicóptero (MAT.rotor, opacidade 0,85) → silhueta agora exclui material translúcido do próprio navio.
// A = quadro normal; B = sem o oceano; silhueta = PRÓPRIO navio acima de 0,75·borda livre; "água dentro" = pixel da silhueta com A ≠ B. Meta 0.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.VZ_URL || 'http://127.0.0.1:4173/?auto'; const D = '/workspace/nexo-naval-shots/1217/porto10b/'; fs.mkdirSync(D, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.vai(URL); let pronto = false; const t0 = Date.now(); for (let i = 0; i < 600 && !pronto; i++) { pronto = await ev(`!document.querySelector('#boot') && !!window.__nnsUI && !!(window.__nns&&__nns.vitrine)`) === true; if (!pronto) await esp(500); }
/* r2: com a máquina carregada (load ~7, swiftshader) o boot passou dos ~80 s do laço antigo e o teste seguia sem __nnsUI → ReferenceError. Agora espera até 5 min e falha com mensagem clara. */
if (!pronto) { console.log('aguaporto1217 ERRO: jogo não ficou pronto em', ((Date.now() - t0) / 1000).toFixed(0), 's'); b.fecha(); process.exit(2); } console.log('boot pronto em', ((Date.now() - t0) / 1000).toFixed(0), 's');
const ks = (process.env.KS || 'corveta,fragata,destroier,furtivo,cruzador,capitania,atlantico,colosso,marcos').split(','); let total = 0; const res = [];
for (const k of ks) {
  await ev(`(()=>{ __nnsUI.TELAS.visualizar('${k}'); return 1 })()`); await esp(3500);
  const r = await ev(`(()=>{ const j=__nns, V=j.vitrine, T=j.THREE, R=j.R, cena=V.cena, cam=V.cam, g=V.navio.g, C=j.CLASSES[V.tipo||'${k}'];
    let mar=(V.amb&&V.amb.mar)||null; if(!mar) cena.traverse(o=>{ if(!mar && o.isMesh && /mar|ocean/i.test(o.name||'')) mar=o; }); if(!mar) return JSON.stringify({erro:'sem mar'});
    const W=320,H=144; const rt=j.__rtP||(j.__rtP=new T.WebGLRenderTarget(W,H)); const px=()=>{ const a=new Uint8Array(W*H*4); R.readRenderTargetPixels(rt,0,0,W,H,a); return a; };
    const plano=new T.Plane(new T.Vector3(0,1,0),0); const out=[];
    const mede=(nome)=>{ g.updateMatrixWorld(true); cam.updateMatrixWorld(); const asp=cam.aspect; cam.aspect=W/H; cam.updateProjectionMatrix(); R.setRenderTarget(rt); R.render(cena,cam); const A=px(); mar.visible=false; R.render(cena,cam); const B=px(); mar.visible=true;
      plano.constant=-(g.position.y+C.F*0.75); R.clippingPlanes=[plano]; const bg=cena.background, fg=cena.fog; cena.background=null; cena.fog=null; const vis0=[]; cena.traverse(o=>{ if(o.isMesh||o.isPoints||o.isSprite||o.isInstancedMesh){ let p=o,meu=false; while(p){ if(p===g){meu=true;break;} p=p.parent; } const translucido=meu&&o.material&&(o.material.transparent&&(o.material.opacity??1)<0.95); /* rotor girando do helicóptero no convés (opacidade 0,85): o mar aparece através dele de verdade — não é água dentro do casco */ if((!meu||translucido)&&o.visible){ vis0.push(o); o.visible=false; } } }); R.setClearColor(0x000000,0); R.render(cena,cam); const N=px(); for(const o of vis0) o.visible=true; cena.background=bg; cena.fog=fg; R.clippingPlanes=[]; R.setRenderTarget(null); cam.aspect=asp; cam.updateProjectionMatrix();
      let sil=0,ruim=0,tot=0; for(let i=0;i<A.length;i+=4){ if(Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2])>30) tot++; } for(let i=0;i<A.length;i+=4){ if(N[i+3]<200) continue; const q=i/4,x=q%W,y=(q/W)|0; if(x<1||y<1||x>=W-1||y>=H-1||N[i+7]<200||N[i-1]<200||N[i+3+W*4]<200||N[i+3-W*4]<200) continue; sil++; const d=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]); if(d>30) ruim++; } return {nome,sil,ruim,tot}; };
    const P0=cam.position.clone(); const loc=(x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(g.matrixWorld);
    for (const [nm,p,a] of [['proa',[-C.B*1.3,C.F+9,-C.L*0.66],[0,C.F,-C.L*0.3]],['popa',[C.B*1.3,C.F+9,C.L*0.66],[0,C.F,C.L*0.3]],['rasante',[C.B*2.2,C.F*0.9+2,0],[0,C.F*0.8,0]]]) { cam.position.copy(loc(...p)); cam.lookAt(loc(...a)); out.push(mede(nm)); }
    cam.position.copy(P0); out.push(mede('vitrine')); return JSON.stringify(out); })()`, 120000);
  const o = JSON.parse(r); if (o.erro) { res.push(k + ': ' + o.erro); total += 1e6; continue; } const s = o.reduce((a, x) => a + x.ruim, 0); total += s; res.push(`${k}: ` + o.map(x => `${x.nome} ${x.ruim}/${x.sil} (mar≠ ${x.tot})`).join(' ')); console.log(res[res.length - 1]);
  await esp(800); await b.foto(D + k + '.png');
}
const lin = `aguaporto1217 total ${total} px (meta 0) falhas ${total > 0 ? 1 : 0} erros ${JSON.stringify(b.erros.slice(0, 3))}`; console.log(lin); fs.writeFileSync('/workspace/aguaporto1217.out', res.join('\n') + '\n' + lin + '\n'); b.fecha(); process.exit(0);
