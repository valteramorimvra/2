// v1.2.17 item 13: nome no casco PARALELO à borda do convés (segue o tosado) e à face do costado; o balanço vem do grupo do navio (o nome gira junto).
// Mede no próprio modelo: raio vertical sobre a borda do convés nas duas pontas do nome → inclinação real da borda; compara com a linha de base das letras.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1217/tosado'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
await b.vai(process.env.VZ_URL || 'http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
for (const tipo of (process.env.CLASSES || 'corveta,fragata,destroier,furtivo,cruzador,capitania,atlantico,colosso').split(',')) {
  await ev(`(()=>{ __nns.mostraVitrine(${JSON.stringify(tipo)},'azul',-0.24); return 1 })()`); await esp(1500);
  const r = JSON.parse(await ev(`(()=>{ const T=__nns.THREE, g=__nns.vitrine.navio.g; g.updateMatrixWorld(true); const nomes=[], corpo=[]; g.traverse(o=>{ if(!o.isMesh) return; if(o.name==='nomeOuro') nomes.push(o); else if(o.name!=='nomeOuroPopa' && o.visible) corpo.push(o); });
    const inv=new T.Matrix4().copy(g.matrixWorld).invert(), rc=new T.Raycaster(); const out=[];
    const mc=g.userData.matCasco; const vs=[]; g.traverse(o=>{ if(!o.isMesh||o.isInstancedMesh||!o.visible) return; if(o.name!=='base') return; /* malha estática fundida (casco+convés+superestrutura); o filtro externo/altura isola a borda */ const pa=o.geometry.attributes.position, M=new T.Matrix4().copy(o.matrixWorld).premultiply(inv), w=new T.Vector3(); for(let i=0;i<pa.count;i++){ w.fromBufferAttribute(pa,i).applyMatrix4(M); vs.push(w.x,w.y,w.z); } });
    /* BORDA (linha do tosado) = vértice mais alto do COSTADO na estação z, entre os vértices mais externos (|x| ≥ 85% da meia-boca local) — independe de torres/superestrutura */
    const topo1=(x,z,J)=>{ let mx=0; for(let i=0;i<vs.length;i+=3) if(Math.abs(vs[i+2]-z)<J && Math.sign(vs[i])===Math.sign(x) && vs[i+1]>yRef && vs[i+1]<yRef+hRef*1.6+1) mx=Math.max(mx,Math.abs(vs[i])); /* meia-boca ACIMA das letras (tumblehome estreita para cima) */ if(!mx) return null; let y=null, zy=0; for(let i=0;i<vs.length;i+=3) if(Math.abs(vs[i+2]-z)<J && Math.sign(vs[i])===Math.sign(x) && Math.abs(vs[i])>=mx*0.85 && vs[i+1]>yRef && vs[i+1]<yRef+hRef*1.6+1 && (y==null||vs[i+1]>y)) { y=vs[i+1]; zy=vs[i+2]; } return y==null?null:[y,zy]; };
    const topo=(x,z)=>{ for (const J of [1.6,3,5,8]) { const r=topo1(x,z,J); if (r) return r; } return null; }; /* estações do casco podem ser esparsas nos navios grandes: janela cresce; usa o z REAL do vértice achado */ let hRef=2; let yRef=0; /* a BORDA do convés é a 1ª superfície acima das letras (torres, superestrutura e corrimãos ficam acima dela) */
    for(const m of nomes){ const P=new T.Vector3(), Q=new T.Quaternion(); m.getWorldPosition(P); P.applyMatrix4(inv); Q.copy(m.getWorldQuaternion(new T.Quaternion())).premultiply(new T.Quaternion().setFromRotationMatrix(inv));
      const u=new T.Vector3(1,0,0).applyQuaternion(Q), v=new T.Vector3(0,1,0).applyQuaternion(Q); m.geometry.computeBoundingBox(); const w=(m.geometry.boundingBox.max.x-m.geometry.boundingBox.min.x)*m.scale.x;
      yRef=P.y; m.geometry.computeBoundingBox(); hRef=(m.geometry.boundingBox.max.y-m.geometry.boundingBox.min.y)*m.scale.y; const s=Math.sign(P.x), xi=P.x*0.85, z1=P.z-w*0.5, z2=P.z+w*0.5; const y1=topo(xi,z1), y2=topo(xi,z2);
      const borda = (y1!=null && y2!=null && Math.abs(y2[1]-y1[1])>1) ? Math.atan2(y2[0]-y1[0], y2[1]-y1[1]) : null, base = Math.atan2(u.y, u.z);
      out.push({ lado:s, w:+w.toFixed(1), base:+(base*57.3).toFixed(2), borda: borda==null?null:+(borda*57.3).toFixed(2), dif: borda==null?null:+(Math.abs(Math.atan(Math.tan(base-borda)))*57.3).toFixed(2) /* reta: compara módulo 180° (no boreste o texto corre de proa p/ popa) */, vUp:+v.y.toFixed(3), uLat:+u.x.toFixed(3) }); }
    return JSON.stringify(out) })()`));
  R[tipo] = r; if (!r.length) falhas.push(tipo + ': sem nome no casco');
  for (const q of r) { if (q.borda == null) falhas.push(`${tipo} lado ${q.lado}: borda não medida`); else if (q.dif > 1.0) falhas.push(`${tipo} lado ${q.lado}: base ${q.base}° vs borda ${q.borda}° (dif ${q.dif}°)`);
    if (Math.abs(q.uLat) > 0.02) falhas.push(`${tipo}: texto girado para fora do costado (${q.uLat})`); if (q.vUp < 0.95) falhas.push(`${tipo}: letras não ficam em pé (${q.vUp})`); }
  await b.foto(`${DIR}/${tipo}.png`); }
// balanço: em partida, o nome acompanha o casco (filho do grupo do navio)
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa:'atois', modo:'frota', classe:'colosso', seed:3, hora:'dia', tempo:'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(5000);
R.balanco = JSON.parse(await ev(`(()=>{ const vs=__nns.vis||__nns.visuais; let n=0, filho=0; (__nns.cena).traverse(o=>{ if(o.name==='nomeOuro'){ n++; let p=o.parent, ok=0; while(p){ if(p.userData && (p.userData.navioId!=null || p.userData.tipo)) { ok=1; break; } p=p.parent; } filho+=ok; } }); return JSON.stringify({ n, filho }) })()`));
if (!(R.balanco.n > 0)) falhas.push('partida: nenhum nome no casco');
R.falhas = falhas; fs.writeFileSync('/workspace/tosado1217.out', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); console.log('tosado1217 falhas', falhas.length, falhas.join(' | ')); b.fecha(); process.exit(0);
