// v1.2.19 item 12 — CAMUFLAGENS LENDÁRIAS NACIONAIS: fotos no estaleiro (Visualizar) de cada nação em 2 instantes (animação),
// TODAS as nacionais num só programa WebGL, e numa PARTIDA real com a nacional: 0 programas novos durante o combate.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1219/camo'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = { fotos: [] };
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 400; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI && !!(window.__nns&&__nns.vitrine)`) === true) break; await esp(500); }
const lista = (process.env.PINTS || 'lend_nac_bra,lend_nac_eua,lend_nac_deu,lend_nac_uk,lend_nac_chn').split(',');
const K = process.env.K || 'destroier';
await ev(`(()=>{ __nnsUI.eco.escolherPintura('${K}','cinza_naval'); __nnsUI.TELAS.visualizar('${K}'); return 1 })()`); await esp(4000); const p0 = await ev(`__nns.R.info.programs.length`); await ev(`(window.__k0=new Set(__nns.R.info.programs.map(p=>p.cacheKey)),1)`);
for (const p of lista) {
  await ev(`(()=>{ const e=__nnsUI.eco; e.e.pinturasPossui['${p}']=1; e.e.possui && (e.e.possui['${K}']=1); e.escolherPintura('${K}','${p}'); __nnsUI.TELAS.visualizar('${K}'); return 1 })()`); await esp(4000);
  for (const [lado, tt] of [[1, 'a'], [1, 'b'], [-1, 'c']]) {
    await esp(tt === 'b' ? 2600 : 900);
    const url = await ev(`(()=>{ const j=__nns, V=j.vitrine, T=j.THREE, R=j.R, cam=V.cam.clone(), g=V.navio.g, C=j.CLASSES['${K}']; g.updateMatrixWorld(true); const loc=(x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(g.matrixWorld);
      cam.position.copy(loc(${lado}*C.L*0.34, C.F+2.5, -C.L*0.1)); cam.lookAt(loc(0, C.F*0.6, -C.L*0.1)); cam.updateMatrixWorld(); R.setRenderTarget(null); R.render(V.cena, cam); return R.domElement.toDataURL('image/png') })()`);
    const f = `${DIR}/${p}-${K}-${tt}.png`; fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); R.fotos.push(f); }
}
R.programasVitrine = { antes: p0, depois: await ev(`__nns.R.info.programs.length`), camoNovos: JSON.parse(await ev(`JSON.stringify(__nns.R.info.programs.filter(q=>!__k0.has(q.cacheKey) && q.cacheKey.includes('camo')).map(q=>{ const k=q.cacheKey, i=k.indexOf('camo'); return k.slice(i, i+7) }))`)) };
const cn = R.programasVitrine.camoNovos; if (cn.some((k) => !k.startsWith('camo24')) || cn.length > 3) falhas.push('as 5 nacionais não compartilham o MESMO programa (tipo 24, ≤ 3 variantes como qualquer pintura): ' + JSON.stringify(cn));
// partida real com a nacional do Brasil
await ev(`(()=>{ const e=__nnsUI.eco; e.escolherPintura('${K}','lend_nac_bra'); const U=__nnsUI; const c=U.cfgPartida({ classe:'${K}', modo:'frota', mapa:'arquipelago', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
R.pinturaEu = await ev(`__nns.eu && __nns.eu.pintura || (__nns.eu.mods && __nns.eu.mods.pintura) || ''`);
const pa = await ev(`__nns.R.info.programs.length`); await ev(`(__nns.S.comando({ t:'telegrafo', v:4 }),1)`); await esp(25000); const pb = await ev(`__nns.R.info.programs.length`);
R.programasCombate = { antes: pa, depois: pb, tiros: await ev(`__nns.S.sim.tick`) }; if (pb !== pa) falhas.push(`programas novos em combate: ${pa}→${pb}`);
await b.foto(`${DIR}/partida-bra.png`);
R.erros = b.erros; if (b.erros && b.erros.length) falhas.push('erros JS: ' + b.erros.slice(0, 3).join(' | '));
console.log(JSON.stringify(R, null, 1)); console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); b.fecha(); process.exit(falhas.length ? 1 : 0);
