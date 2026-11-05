// v1.2.17 item 7 — SAM do super porta-aviões Atlântico: capturas do estaleiro e da batalha nos dois patrocínios + lançamento real em partida
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = '/workspace/nexo-naval-shots/1217/sam'; fs.mkdirSync(dir, { recursive: true });
const b = await abre(null, { w: 1280, h: 720 }); const ev = b.ev, esp = b.espera;
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ const U=__nnsUI; U.save.ajustes.dev=true; U.TELAS.estaleiro(); const bt=document.querySelector('button[data-c="atlantico"]'); if (bt) bt.click(); return 1 })()`); await esp(3000);
for (const [nome, ang, el, z] of [['est-bb', 2.2, 0.25, 0.55], ['est-be', -0.9, 0.25, 0.55], ['est-geral', 0.6, 0.34, 1]]) { await ev(`(()=>{ const V=__nns.vitrine; V.auto=false; V.ang=${ang}; V.elev=${el}; V.zoom=${z}; V.tToque=0; return 1 })()`); await esp(2500); await b.foto(`${dir}/${nome}.png`); }
await ev(`(async()=>{ await __nnsUI.zarpar({ mapa: 'atois', modo: 'duelo', classe: 'atlantico', seed: 5, hora: 'dia', tempo: 'limpo' }); __nns.tutorial=false; return 1 })()`, 120000); await esp(5000);
const info = await ev(`(()=>{ const j=__nns, n=j.eu; return JSON.stringify({ classe: n.C.id, sam: n.sam, cel: n.P && n.P.sam ? n.P.sam.length : -1 }) })()`); console.log('navio', info);
for (const [nome, lx, ly, lz, tx, ty, tz] of [['bat-bb', -90, 30, 0.12, -0.7, 10, 0.12], ['bat-be', 90, 30, 0.4, 0.5, 10, 0.4]]) {
  await ev(`(()=>{ const j=__nns, n=j.eu, L=n.C.L, B=n.C.B; j.pausado=true; const o={...j.local(n, ${lx}, ${ly}, L*${lz}+40)}, t={...j.local(n, B*${tx}, ${ty}, L*${tz})}; j.cam.position.set(o.x,o.y,o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.fov=40; j.cam.updateProjectionMatrix(); j.cam.updateMatrixWorld(); j.atualizaNavios(0, j.S.sim.t); j.R.render(j.cena,j.cam); return 1 })()`); await esp(800); await b.foto(`${dir}/${nome}.png`);
}
// lançamento real: míssil inimigo contra o Atlântico, CIWS/laser silenciados para forçar o SAM
const r = await ev(`(()=>{ const j=__nns, s=j.S.sim, n=j.eu; j.pausado=false; const inim=s.navios.find(q=>q.time!==n.time&&q.vida>0); if(!inim) return 'sem inimigo'; for (const c of n.ciws) { c.mun=-1e9; c.t=-1e9; } n.a30.length=0; n.laser=0; inim.x=n.x+9000; inim.z=n.z; s.sensores(); inim.alvoId=n.id; inim.trava=1; s.lancaMissil(inim, n.id, 1); window.__samL=0; const ps=s.passo.bind(s); s.passo=function(){ ps(); for (const e of s.eventos) if (e.t==='samLanc' && e.id===n.id) window.__samL++; }; return 'ok' })()`); console.log('lança', r);
for (let i = 0; i < 90; i++) { if (await ev(`window.__samL>0`)) break; await esp(1000); }
const nL = await ev(`window.__samL`); console.log('samLanc', nL); await b.foto(`${dir}/bat-lancamento.png`);
const lin = `sam1217 ${info} lançamentos ${nL} erros ${JSON.stringify(b.erros.slice(0, 3))}`; console.log(lin); fs.writeFileSync('/workspace/sam1217.out', lin + '\n'); b.fecha(); process.exit(0);
