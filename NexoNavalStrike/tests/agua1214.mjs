// v1.2.14 — ÁGUA/ESPUMA dentro do navio nas 36 classes: verificação automática por pixels + folha de contato (proa/popa).
// Por classe e câmera: A = quadro normal; B = sem o oceano; silhueta = PRÓPRIO navio acima de 0,75·borda livre (estresse: 0,93·F, convés sob a crista).
// "água/espuma dentro" = pixel da silhueta em que A ≠ B (o oceano/espuma pintou por cima do convés/superestrutura). Meta: 0. Mar agitado + balanço forçado.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const dir = process.env.DIR || '/workspace/nexo-naval-shots/1214/folha'; fs.mkdirSync(dir, { recursive: true });
const { CLASSES } = await import('../src/sim/classes.js'); const ks = (process.env.KS ? process.env.KS.split(',') : Object.keys(CLASSES));
const b = await abre('http://127.0.0.1:4173/?auto', { w: 640, h: 288 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
const res = []; let total = 0;
for (const k of ks) {
  await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='alta'; await __nnsUI.zarpar({ mapa: '${process.env.MAPA || 'fiordes'}', modo: 'duelo', classe: '${k}', seed: 3, hora: 'dia', tempo: 'chuva' }); __nns.tutorial=false; __nns.hud.dica(null); if (${process.env.NOMASK ? 1 : 0}) { const A=__nns.amb; if (!A.__c0) { A.__c0=A.cascos.bind(A); A.cascos=(l,m)=>{ A.__c0(l,m); for (const d of A.uM.uDim.value) d.w=0; }; } } return 1 })()`, 180000); await esp(1200);
  if (process.env.DBG) await ev('window.__dbg=1');
  const r = await ev(`(async()=>{ const j=__nns, S=j.S, n=j.eu, T=window.THREE_ || null; for (let i=0;i<120;i++){ S.avanca(1/60); if (i%2) { j.processaEventos(); j.atualizaNavios(1/30, S.sim.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); S.sim.eventos.length=0; } }
    n.telAlvo=4; for (let i=0;i<240;i++){ S.avanca(1/60); if (i%2) { j.processaEventos(); j.atualizaNavios(1/30, S.sim.t); j.atualizaProjeteis(1/30); j.fx.passo(1/30); S.sim.eventos.length=0; } }
    j.pausado=1; const R=j.R, cena=j.cena, cam=j.cam, C=n.C; const THREE = j.THREE; const W=320, H=144; const rt = j.__rt || (j.__rt = new THREE.WebGLRenderTarget(W, H)); const px = () => { const a = new Uint8Array(W*H*4); R.readRenderTargetPixels(rt, 0, 0, W, H, a); return a; };
    const g = j.navios[n.id].g; const mar = j.amb.mar; const plano = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    const mede = (nome, kc = 0.75) => { cam.updateMatrixWorld(); const asp = cam.aspect; cam.aspect = W/H; cam.updateProjectionMatrix(); R.setRenderTarget(rt);
      R.render(cena, cam); const A = px(); mar.visible=false; R.render(cena, cam); const B = px();
      plano.constant = -(g.position.y + C.F * kc); R.clippingPlanes=[plano]; const om = j.__nm || (j.__nm = new THREE.MeshNormalMaterial()); const ov = cena.overrideMaterial, bg = cena.background, fg = cena.fog; cena.background = null; cena.fog = null; const vis0 = []; cena.traverse((o)=>{ if (o.isMesh || o.isPoints || o.isSprite || o.isInstancedMesh) { let p=o, meu=false; while (p) { if (p===g) { meu=true; break; } p=p.parent; } if (!meu && o.visible) { vis0.push(o); o.visible=false; } } }); R.setClearColor(0x000000, 0); R.render(cena, cam); const Nn = px(); for (const o of vis0) o.visible=true; cena.overrideMaterial = ov; cena.background = bg; cena.fog = fg; R.clippingPlanes=[]; mar.visible=true; R.setRenderTarget(null); cam.aspect = asp; cam.updateProjectionMatrix();
      const M = cam.matrixWorld.elements; let sil=0, ruim=0; for (let i=0;i<A.length;i+=4){ if (Nn[i+3] < 200) continue; { const q=i/4, x=q%W, y=(q/W)|0; if (x<1||y<1||x>=W-1||y>=H-1||Nn[i+3+4]<200||Nn[i+3-4]<200||Nn[i+3+W*4]<200||Nn[i+3-W*4]<200) continue; } /* interior da silhueta (erosão 1 px: borda/balaústre fino deixa ver o mar por trás) */ sil++; /* PRÓPRIO navio acima do plano de corte (kc·borda livre) */ const d = Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]); if (d > 30) ruim++; } if (window.__dbg && nome==='proaOnda') { const enc=(u)=>{ let t=''; for (let i=0;i<u.length;i+=8192) t+=String.fromCharCode.apply(null, u.subarray(i,i+8192)); return btoa(t); }; window.__dbgA=[enc(A),enc(B),enc(Nn)]; } return { nome, sil, ruim }; };
    const out = []; const L=C.L, Bm=C.B; const pos = (p, a, fov=55) => { const o={...j.local(n, p[0], p[1], p[2])}, t={...j.local(n, a[0], a[1], a[2])}; /* local() devolve objeto compartilhado */ cam.position.set(o.x,o.y,o.z); cam.lookAt(t.x,t.y,t.z); cam.fov=fov; cam.updateProjectionMatrix(); };
    n.balanco = 0.09; n.caturro = -0.05; j.atualizaNavios(0, S.sim.t);
    pos([-Bm*1.3, C.F+9, -L*0.66], [0, C.F, -L*0.3]); out.push(mede('proa'));
    pos([Bm*1.3, C.F+9, L*0.66], [0, C.F, L*0.3]); out.push(mede('popa'));
    // CONVÉS DE PROA (câmera do caso real da 1.2.13: atrás da torre de proa olhando a proa e o mar agitado)
    { const t0 = n.P.torres[0] || { z: -L*0.25 }; pos([-Bm*0.28, C.F+5.5, t0.z+16], [0, C.F-1, -L*0.5], 62); out.push(mede('convesProa', 0.75)); pos([Bm*0.28, C.F+5.5, L*0.2], [0, C.F-1, L*0.5], 62); out.push(mede('convesPopa', 0.75)); }
    // câmeras do jogo: EXTERNA (perto) e CANHÃO, como o jogador as vê
    for (const m of ['perto', 'canhao']) { j.pausado=0; j.camSel(m); j.bino=false; for (let i=0;i<40;i++) j.atualizaCamera(1/30, S.sim.t); j.pausado=1; out.push(mede(m)); }
    // ÓPTICA: o próprio navio fica oculto (v1.2.14) → silhueta vazia por construção; mede assim mesmo
    j.bino=true; for (let i=0;i<20;i++) j.atualizaCamera(1/30, S.sim.t); j.atualizaNavios(0, S.sim.t); const vis = g.visible; out.push(Object.assign(mede('optica'), { navioOculto: !vis })); j.bino=false; j.atualizaNavios(0, S.sim.t);
    j.pausado=0; return JSON.stringify(out); })()`, 120000);
  if (process.env.DBG) { const d = JSON.parse(await ev('JSON.stringify(window.__dbgA||[])')); d.forEach((x, i) => fs.writeFileSync(`/workspace/dbg${i}.raw`, Buffer.from(x, 'base64'))); }
  const o = JSON.parse(r); const soma = o.reduce((a, x) => a + x.ruim, 0); total += soma; res.push(`${k}: ` + o.map((x) => `${x.nome} ${x.ruim}/${x.sil}`).join(' ')); console.log(res[res.length - 1]);
  // folha de contato: proa e popa (quadro normal, pausado)
  for (const [nm, p, a] of [['proa', '[-n.C.B*1.6, n.C.F+10, -n.C.L*0.7]', '[0, n.C.F, -n.C.L*0.3]'], ['popa', '[n.C.B*1.6, n.C.F+10, n.C.L*0.7]', '[0, n.C.F, n.C.L*0.3]']]) {
    await ev(`(()=>{ const j=__nns, n=j.eu; j.pausado=1; const p=${p}, a=${a}; const o={...j.local(n,p[0],p[1],p[2])}, t={...j.local(n,a[0],a[1],a[2])}; j.cam.position.set(o.x,o.y,o.z); j.cam.lookAt(t.x,t.y,t.z); j.cam.fov=55; j.cam.aspect=640/288; j.cam.updateProjectionMatrix(); j.raizHud.style.visibility='hidden'; j.R.render(j.cena, j.cam); return 1 })()`); await esp(150); await b.foto(`${dir}/${k}-${nm}.png`); }
  await ev(`(()=>{ __nns.pausado=0; __nns.raizHud.style.visibility=''; return 1 })()`);
}
const linha = `ÁGUA/ESPUMA DENTRO DO NAVIO (${ks.length} classes × proa/popa/externa/canhão/óptica): total ${total} pixels (meta 0)`; console.log(linha, 'erros', JSON.stringify(b.erros.slice(0, 4)));
fs.writeFileSync((process.env.LOG || '/workspace/agua1214.log'), res.join('\n') + '\n' + linha + '\n'); b.fecha(); process.exit(0);
