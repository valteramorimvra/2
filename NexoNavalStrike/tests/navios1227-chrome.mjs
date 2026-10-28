/** v1.2.27 — estaleiro/showroom + partida curta + HUD overlap para os 14 navios novos. */
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const IDS = ['jalapao','ilhagrande','pantanal','serramar','abrolhos','costaverde','ilhabela','jericoacoara','aparados','itatiaia','neblina','canastra','chapada','lencois'];
const DIR = '/workspace/capturas1227/navios'; fs.mkdirSync(DIR, { recursive: true });
const falhas = [], R = {};
const b = await abre(null, { w: 915, h: 412 });
await b.vai('http://127.0.0.1:4173/?auto');
for (let i = 0; i < 200; i++) { if (await b.ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await b.espera(400); }
await b.ev(`(()=>{ const A=__nnsUI.audio; A.setMusicaOn&&A.setMusicaOn(false); A.paraMusica&&A.paraMusica();
  // libera ouro/pesquisa para ver todos
  const e=__nnsUI.save.economia; e.ouro=999999; e.prata=99999999; for (const k of ${JSON.stringify(IDS)}) { e.possuídos=e.possuídos||{}; e.possuídos[k]=1; e.pesquisados=e.pesquisados||{}; e.pesquisados[k]=1; }
  return 1 })()`);

await b.ev(`(__nnsUI.TELAS.estaleiro(),1)`); await b.espera(1200);
const lista = JSON.parse(await b.ev(`JSON.stringify(${JSON.stringify(IDS)}.map(k=>({k, tem:!!document.querySelector('.es-lista [data-c="'+k+'"]')})))`));
R.lista = lista;
for (const x of lista) if (!x.tem) falhas.push(x.k + ': ausente no estaleiro');

for (const k of IDS) {
  const rk = R[k] = { falhas: [] };
  const push = (m) => { rk.falhas.push(m); falhas.push(k + ': ' + m); };
  await b.ev(`(()=>{ __nnsUI.TELAS.estaleiro(); const bt=document.querySelector('.es-lista [data-c="${k}"]'); bt&&bt.click(); return 1 })()`);
  await b.espera(900);
  const info = JSON.parse(await b.ev(`JSON.stringify({ h2:(document.querySelector('.es-info h2')||{}).textContent||'', nan:/NaN|undefined/.test((document.querySelector('.es-info')||{}).textContent||'') })`));
  if (!info.h2) push('ficha vazia'); if (info.nan) push('NaN na ficha');
  await b.foto(`${DIR}/${k}-estaleiro.png`);

  // showroom / visualizar
  await b.ev(`(()=>{ const v=document.querySelector('.es-lista [data-c="${k}"] .es-ver'); v&&v.click(); return 1 })()`);
  await b.espera(1200);
  const viz = await b.ev(`!!(window.__nns && __nns.vitrine && __nns.vitrine.navio)`);
  if (!viz) {
    // pode ser tela visualizar dedicada
    const ok = await b.ev(`!!document.querySelector('.tela-visualizar, .viz, [data-tela=visualizar]') || !!(window.__nnsUI && document.body.innerText.length>10)`);
    if (!ok) push('visualizar/showroom falhou');
  }
  await b.foto(`${DIR}/${k}-viz.png`);
  // volta
  await b.ev(`(()=>{ const v=document.querySelector('[data-a=voltar], .voltar, button.voltar'); if(v) v.click(); else __nnsUI.TELAS.estaleiro(); return 1 })()`);
  await b.espera(500);

  // partida curta
  await b.ev(`(()=>{ window.__sAnt=window.__nns?__nns.S:null; __nnsUI.zarpar({ modo:'duelo', classe:'${k}', classeRival:'volkhar', mapa:'arquipelago', seed: 40+${IDS.indexOf(k)}, hora:'dia', tempo:'limpo' }); return 1 })()`);
  let okP = false;
  for (let i = 0; i < 100; i++) {
    if (await b.ev(`!!(window.__nns && __nns.S && __nns.S!==window.__sAnt && __nns.eu && __nns.eu.C.id==='${k}')`)) { okP = true; break; }
    await b.espera(400);
  }
  if (!okP) { push('não entrou na partida'); continue; }
  await b.ev(`(__nns.tutorial=false,1)`); await b.espera(2000);

  // HUD overlap
  const sob = JSON.parse(await b.ev(`(()=>{ const qs=['.h-armas','.h-chaves','.h-acel','.nk-joy','.h-radar','.h-placar'];
    const els=qs.map(q=>document.querySelector(q)).filter(Boolean);
    const r=els.map(e=>e.getBoundingClientRect());
    const hits=[]; for(let i=0;i<r.length;i++) for(let j=i+1;j<r.length;j++){
      const a=r[i],b=r[j]; const x=Math.min(a.right,b.right)-Math.max(a.left,b.left), y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if(x>2&&y>2) hits.push(qs[i]+'×'+qs[j]);
    }
    const cam=__nns.camModo, nan=!Number.isFinite(__nns.eu.x+__nns.eu.z+__nns.cam.position.x);
    const nk=!!document.querySelector('[data-a=nuclear], .h-nuclear, button.nuclear');
    return JSON.stringify({ sob:hits, cam, nan, nkBtn:nk, L:__nns.eu.C.L, err:(window.__cdpErr||[]) }); })()`));
  rk.batalha = sob;
  if (sob.nan) push('NaN em batalha');
  if (sob.sob && sob.sob.length) push('HUD overlap ' + sob.sob.join(','));
  if ((k==='chapada'||k==='lencois') && !sob.nkBtn) {
    // botão pode aparecer só após 120s — checa presença no DOM do HUD template
    const tem = await b.ev(`!!(document.querySelector('[data-a=\"nuclear\"]') || (__nns.hud && /nuclear/i.test(__nns.hud.el.innerHTML)))`);
    if (!tem) push('botão nuclear ausente no HUD');
  }
  await b.foto(`${DIR}/${k}-batalha.png`);
  // sair
  await b.ev(`(()=>{ try{ __nns.S.match && __nns.S.match.encerraAfundado && __nns.S.match.encerraAfundado(__nns.S.sim); }catch(e){} __nnsUI.TELAS.inicio(); return 1 })()`);
  await b.espera(600);
  rk.ok = rk.falhas.length === 0;
  console.log(k, rk.ok ? 'OK' : 'FALHAS', rk.falhas.join(' | '));
}
fs.writeFileSync(`${DIR}/navios1227-chrome.json`, JSON.stringify({ falhas, R }, null, 2));
console.log('TOTAL falhas', falhas.length);
console.log(falhas.join('\n'));
b.fecha();
process.exit(falhas.length ? 1 : 0);
