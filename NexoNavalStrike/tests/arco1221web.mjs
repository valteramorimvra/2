// v1.2.21 item 14e (navegador) — arco PREVISTO do tiro na mira: aparece com alvo travado e solução de tiro, some sem alvo/no cinema,
// tamanho fixo na tela; NENHUM programa WebGL novo (mesmo shader das partículas) e programas ≤ 1.2.20 no mesmo cenário. Fotos.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1221/arco'; fs.mkdirSync(DIR, { recursive: true }); const falhas = []; const R = {};
const ALVOS = [['depois', 'http://127.0.0.1:4173/?auto'], ['antes', process.env.BASE_URL || 'http://127.0.0.1:4181/?auto']];
const BR = 87 * Math.PI / 180;
for (const [tag, url] of ALVOS) {
  const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; R[tag] = {};
  await b.vai(url); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
  await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); c.classeRival='destroier'; c.seed=7; U.zarpar(c); return 1 })()`);
  for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
  await esp(2500);
  await ev(`(()=>{ const N=__nns, S=N.S.sim; N.mem.revelaTudo=1; S.revelaTudo=1; const a=S.navios.find(q=>q.time!==N.eu.time && !q.C.mercante); window.__ai=S.navios.indexOf(a); const eu=N.eu; eu.x=0; eu.z=0; eu.rumo=${BR}-Math.PI/2; /* alvo pelo través: todas as torres apontam */ eu.v=0; N.__seg=setInterval(()=>{ eu.x=0; eu.z=0; eu.v=0; eu.rumo=${BR}-Math.PI/2; a.v=0; }, 50); N.eu.miraLivre=0; a.x=Math.sin(${BR})*5000; a.z=-Math.cos(${BR})*5000; a.rumo=${BR}+Math.PI/2; a.v=0; return __ai })()`);
  await esp(1500); const pa = await ev(`__nns.R.info.programs.length`);
  const le = `JSON.stringify((()=>{ const N=__nns, A=N._ap, eu=N.eu; if (!A) return { existe:false, alvo:eu.alvoId, sol:!!eu.sol }; const t=A.tam.array, l=A.al.array, p=A.pos.array; let vis=0, tmin=1e9; for (let k=0;k<=A.N;k++) { if (l[k]>0 && p[k*3+1]>-800) { vis++; tmin=Math.min(tmin,t[k]); } } return { existe:true, on:!!A.on, vis, st:A.st, alvo:eu.alvoId, sol:!!eu.sol, tmin, imp:[p[A.N*3],p[A.N*3+1],p[A.N*3+2]].map(v=>Math.round(v)), mira: eu.sol ? [Math.round(eu.sol.px), Math.round(eu.sol.pz)] : null, alvoXZ:[Math.round(N.S.sim.navios[__ai].x), Math.round(N.S.sim.navios[__ai].z)] }; })())`;
  await ev(`(()=>{ const N=__nns; N.__am=N.autoMira; N.autoMira=false; N.S.comando({ t:'travar', alvo:-1 }); N.__solta=setInterval(()=>{ const eu=N.eu; eu.tMiraCmd=0; eu.mira.az=${BR}+Math.PI; if (eu.alvoId>=0) N.S.comando({ t:'travar', alvo:-1 }); eu.alvoId=-1; eu.miraLivre=0; N.miraLivre=false; }, 30); /* sem alvo DE VERDADE: auto-mira desligada e mira apontada para o lado oposto (antes a auto-mira do jogo retravava entre as amostras) */ return 1 })()`); await esp(1500); R[tag].semAlvo = JSON.parse(await ev(le)); await ev(`(clearInterval(__nns.__solta), __nns.autoMira=__nns.__am, 1)`);
  await ev(`(()=>{ const N=__nns, eu=N.eu; N.__trava=setInterval(()=>{ const a=N.S.sim.navios[__ai]; eu.mira.az=Math.atan2(a.x-eu.x, -(a.z-eu.z)); if (eu.alvoId!==__ai) N.S.comando({ t:'travar', alvo:__ai }); }, 250); return 1 })()`); /* trava pelo comando real do jogo (o mesmo do toque no navio) */
  for (let i = 0; i < 20; i++) { await esp(500); const q = JSON.parse(await ev(le)); if (q.on || (!q.existe && q.sol)) break; }
  let melhor = 1e9; for (let i = 0; i < 24; i++) { await esp(500); const q = JSON.parse(await ev(le)); if (q.on && q.mira) { const e = Math.hypot(q.imp[0] - q.mira[0], q.imp[2] - q.mira[1]); melhor = Math.min(melhor, e); if (e < 60) break; } } R[tag].comAlvo = JSON.parse(await ev(le)); R[tag].melhorErro_m = Math.round(melhor); await b.foto(`${DIR}/${tag}-com-alvo.png`);
  await ev(`(__nns.camSel('cinema'),1)`); await esp(2000); R[tag].cinema = JSON.parse(await ev(le)); await ev(`(__nns.cine && __nns.cine.on && __nns.cine.sai(),1)`); await esp(800);
  await ev(`(()=>{ const N=__nns; clearInterval(N.__trava); N.__am=N.autoMira; N.autoMira=false; N.S.comando({ t:'travar', alvo:-1 }); N.__solta=setInterval(()=>{ const eu=N.eu; eu.tMiraCmd=0; eu.mira.az=${BR}+Math.PI; if (eu.alvoId>=0) N.S.comando({ t:'travar', alvo:-1 }); N.miraLivre=false; }, 30); return 1 })()`); await esp(1500); /* destravar de verdade: sem a auto-mira (que retrava o alvo sob a mira, comportamento normal do jogo) */ R[tag].semAlvo2 = JSON.parse(await ev(le)); await ev(`(clearInterval(__nns.__solta), __nns.autoMira=__nns.__am, 1)`);
  const pb = await ev(`__nns.R.info.programs.length`); R[tag].programas = [pa, pb]; R[tag].erros = b.erros || []; b.fecha();
  if (pb !== pa) falhas.push(`${tag}: programas ${pa}→${pb}`); if (R[tag].erros.length) falhas.push(`${tag}: erros ${R[tag].erros.slice(0, 2).join(' | ')}`); }
const D = R.depois;
if (!D.comAlvo.on || D.comAlvo.vis < 10) falhas.push(`arco não apareceu com alvo travado (${JSON.stringify(D.comAlvo)})`);
if (D.semAlvo.on || D.semAlvo.vis) falhas.push('arco visível sem alvo'); if (D.cinema.on || D.cinema.vis) falhas.push('arco visível no cinema'); if (D.semAlvo2.on || D.semAlvo2.vis) falhas.push('arco não sumiu ao destravar');
if (D.comAlvo.on) { D.comAlvo.erroAlvo_m = Math.round(Math.hypot(D.comAlvo.imp[0] - D.comAlvo.alvoXZ[0], D.comAlvo.imp[2] - D.comAlvo.alvoXZ[1])); if (!(D.melhorErro_m <= 150)) falhas.push(`impacto do arco a ${D.melhorErro_m} m do ponto de mira da sim (torres alinhadas)`); /* o arco mostra onde o tiro cairia AGORA (torre real); com as torres alinhadas tem de cair no ponto de mira */ }
if (D.programas[1] > R.antes.programas[1]) falhas.push(`programas ${D.programas[1]} > 1.2.20 (${R.antes.programas[1]})`);
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync('/workspace/arco1221web.json', JSON.stringify(R, null, 1));
console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); process.exit(falhas.length ? 1 : 0);
