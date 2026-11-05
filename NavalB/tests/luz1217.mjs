// v1.2.17 item 31 — luz de TOPO ancorada no topo real do mastro em TODAS as classes (estaleiro/menu e batalha), perto (det) e longe (LOD), com balanço.
import { abre } from '/workspace/nexo-naval-strike/tests/cdp.mjs';
import fs from 'fs';
const b = await abre(null, { w: 960, h: 540 }); const ev = b.ev, esp = b.espera;
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const r = await ev(`(()=>{ const j=__nns, T=j.THREE; const out=[]; let falhas=0; const ray=new T.Raycaster(); const dn=new T.Vector3();
  const mede=(g, lt, rL)=>{ g.updateMatrixWorld(true); const alvo=[]; g.traverse(o=>{ if(o.isMesh && !o.userData.luz && o.visible!==false && o.name!=='luzVitrine' && !/^(radar|radar2|radar3|flamula)$/.test(o.name) && !(o.parent && /^(radar|radar2|radar3)$/.test(o.parent.name))) { let v=true, p=o; while(p){ if(p.visible===false) v=false; p=p.parent; } if(v) alvo.push(o); } });
    const c=new T.Vector3(); lt.getWorldPosition(c); dn.set(0,-1,0).applyQuaternion(g.quaternion).normalize(); ray.set(c, dn); ray.far=50; const h=ray.intersectObjects(alvo,false); return h.length? h[0].distance - rL : 99; };
  for (const k of Object.keys(j.CLASSES)) { const C=j.CLASSES[k]; let ref; try { ref=j.criaNavio3D(k,'azul'); } catch(e){ out.push(k+' ERRO '+e.message); falhas++; continue; } const g=ref.g; const lt=g.getObjectByName('luzTopo'); if(!lt){ out.push(k+' SEM luzTopo'); falhas++; continue; }
    const rL=lt.geometry.parameters.radius; const perto=mede(g,lt,rL); const det=[]; g.traverse(o=>{ if(o.name==='det'||o.userData.det) det.push(o); }); det.forEach(o=>o.visible=false); const longe=mede(g,lt,rL); det.forEach(o=>o.visible=true);
    g.rotation.order='YXZ'; g.rotation.z=0.18; g.rotation.x=0.05; const bal=mede(g,lt,rL); g.rotation.set(0,0,0);
    let pai=lt.parent, filho=false; while(pai){ if(pai===g) filho=true; pai=pai.parent; }
    const prop = rL/C.L; const ok = perto<=0.3 && perto>=-rL && longe<=0.3 && longe>=-rL && bal<=0.3 && bal>=-rL && filho && rL>=0.18 && rL<=0.4;
    if(!ok) falhas++; out.push((ok?'OK   ':'FALHA ')+k.padEnd(12)+' L='+C.L+' r='+rL.toFixed(2)+' folga perto '+perto.toFixed(3)+' m · LOD longe '+longe.toFixed(3)+' m · balanço 10° '+bal.toFixed(3)+' m'+(g.getObjectByName('mastareu')?' · mastaréu':'')); }
  return JSON.stringify({falhas, out}); })()`, 600000);
const R = JSON.parse(r); let txt = 'BATALHA/MODELO (todas as classes):\n' + R.out.join('\n') + '\n';
// estaleiro/menu (vitrine): lanternas da vitrine coincidem com a do modelo
const keys = JSON.parse(await ev(`JSON.stringify(Object.keys(__nns.CLASSES))`)); let fv = 0;
for (const k of keys) { const s = await ev(`(async()=>{ const j=__nns; j.mostraVitrine('${k}'); for(let i=0;i<3;i++){ j.extrasVitrine && j.vitrine.caixa && j.extrasVitrine(0.016); await new Promise(r=>setTimeout(r,30)); } const V=j.vitrine; const a=V.luzTopoV, bq=V.navio.luzTopo; if(!a||!bq) return 'SEM '+(!!a)+' '+(!!bq); const lv=V.extras && V.extras.children.filter(o=>o.name==='luzVitrine'); return (Math.hypot(a.x-bq.x,a.y-bq.y,a.z-bq.z)).toFixed(3)+' n='+(lv?lv.length:0); })()`, 60000);
  const ok = /^0\.0/.test(s); if (!ok) fv++; txt += `vitrine ${k.padEnd(12)} desvio luz vitrine × topo do mastro: ${s} ${ok ? 'OK' : 'FALHA'}\n`; }
txt += `\nRESULTADO: ${R.falhas + fv} falhas (modelo ${R.falhas}, vitrine ${fv})\n`;
fs.writeFileSync('/workspace/luz1217.out', txt); console.log(txt);
// capturas: 3 classes na vitrine ao anoitecer
fs.mkdirSync('/workspace/nexo-naval-shots/1217', { recursive: true });
b.fecha(); process.exit(0);
