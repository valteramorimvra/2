// v1.2.21 itens 12 e 13 — (12) sem triângulo de granada chegando (alerta de míssil segue); (13) navio do jogador atingido:
// som característico da arma NO CASCO (impactoArma com d ≤ 30 m), vibração e tremor de tela com intensidade pela arma,
// cada um desligável nos Ajustes (vibrar / tremorAtingido). 0 programas WebGL novos, 0 erros JS.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.URL || 'http://127.0.0.1:4173/?auto'; const falhas = []; const R = {};
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; await b.vai(URL);
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'duelo', mapa:'atois', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await esp(2500); const pa = await ev(`__nns.R.info.programs.length`);
await ev(`(()=>{ const N=__nns, A=N.audio; window.__vib=[]; try { Object.defineProperty(navigator,'vibrate',{ configurable:true, value:(p)=>{ window.__vib.push(p); return true; } }); } catch(e){} Object.defineProperty(navigator,'userActivation',{ configurable:true, value:{ hasBeenActive:true } });
  window.__imp=[]; const io=A.impactoArma.bind(A); A.impactoArma=(arma,cal,d,pan,vol)=>{ window.__imp.push({arma,cal,d:+(+d).toFixed(1),vol:+(+vol).toFixed(2)}); return io(arma,cal,d,pan,vol); }; return 1 })()`);
const CASOS = [['canhao', 76], ['canhao', 127], ['canhao', 305], ['rbu', 0], ['foguete', 0], ['missil', 0], ['torpedo', 0]];
const roda = async (lig) => { const out = {}; await ev(`(()=>{ __nns.save.ajustes.vibrar=${lig}; __nns.save.ajustes.tremorAtingido=${lig}; return 1 })()`);
  for (const [t, cal] of CASOS) { await ev(`(()=>{ const N=__nns, S=N.S.sim, eu=N.eu; eu.vida=eu.C.vida; window.__n0=N._nAtingido||0; N.mem.shake=0; window.__vib.length=0; window.__imp.length=0; const al=S.navios.find(q=>q.time!==eu.time); const id=S.navios.indexOf(eu);
      if ('${t}'==='torpedo') S.evento({ t:'torpImpacto', x:eu.x+5, z:eu.z, alvo:id, dono:S.navios.indexOf(al), dano:1, apl:1 }); else S.evento({ t:'impacto', tipo:'${t}', cal:${cal || 127}, x:eu.x+3, y:eu.y+4, z:eu.z, alvo:id, dono:S.navios.indexOf(al), dano:1, apl:1 }); return 1 })()`);
    for (let w = 0; w < 60; w++) { await esp(100); if (await ev(`(__nns._nAtingido||0) > window.__n0`)) break; } await esp(150); const r = JSON.parse(await ev(`JSON.stringify({ vib: window.__vib.slice(), imp: window.__imp.slice(), ult: __nns._ultAtingido, shake: +(__nns.mem.shake||0).toFixed(3) })`));
    out[t + (cal ? cal : '')] = r; await esp(900); } return out; };
R.ligado = await roda(true); R.desligado = await roda(false);
const sumV = (v) => (v || []).flat().reduce((a, x) => a + (+x || 0), 0) - ((v && Array.isArray(v[0]) && v[0].length > 1) ? 0 : 0);
const intens = (k) => { const u = R.ligado[k].ult || {}; return { vib: Array.isArray(u.vib) ? u.vib.filter((_, i) => i % 2 === 0).reduce((a, x) => a + x, 0) : 0, tremor: u.tremor || 0 }; };
for (const k of Object.keys(R.ligado)) { const r = R.ligado[k], arma = k.replace(/\d+/g, '');
  if (!r.imp.some((q) => q.arma === arma && q.d <= 30)) falhas.push(`${k}: sem som de impacto '${arma}' no casco (${JSON.stringify(r.imp)})`);
  if (!r.vib.length) falhas.push(`${k}: não vibrou`); if (!(r.ult && r.ult.tremor > 0)) falhas.push(`${k}: sem tremor`);
  const d = R.desligado[k]; if (d.vib.length) falhas.push(`${k}: vibrou com a opção desligada`); if (d.ult && d.ult.tremor) falhas.push(`${k}: tremor com a opção desligada`);
  if (!d.imp.some((q) => q.arma === arma)) falhas.push(`${k}: som do casco sumiu com vibração/tremor desligados`); }
const I = Object.fromEntries(Object.keys(R.ligado).map((k) => [k, intens(k)])); R.intensidade = I;
const ordem = (a, b2, campo) => { if (!(I[a][campo] < I[b2][campo])) falhas.push(`intensidade ${campo}: ${a} (${I[a][campo]}) deveria ser < ${b2} (${I[b2][campo]})`); };
for (const c of ['vib', 'tremor']) { ordem('canhao76', 'canhao127', c); ordem('canhao127', 'canhao305', c); ordem('rbu', 'foguete', c); ordem('foguete', 'missil', c); ordem('missil', 'torpedo', c); }
// item 12
R.item12 = JSON.parse(await ev(`(()=>{ const N=__nns, H=N.hud; H.grIndicador(0, 1, 120, 40, 600, 915, 412, []); const gr = H.r.grInd0.hidden; Object.defineProperty(N.eu,'alertaMissil',{ configurable:true, get:()=>1, set:()=>{} }); return JSON.stringify({ grIndOculto: gr }) })()`));
await esp(600); R.item12.alertaMissilVisivel = await ev(`!__nns.hud.r.alerta.hidden`); await ev(`(()=>{ delete __nns.eu.alertaMissil; __nns.eu.alertaMissil = 0; return 1 })()`);
if (!R.item12.grIndOculto) falhas.push('item 12: triângulo de granada ainda aparece'); if (!R.item12.alertaMissilVisivel) falhas.push('item 12: alerta de míssil sumiu');
R.ajustesUI = await ev(`(()=>{ const s=[...document.scripts].length; return !!document.body })()`);
const pb = await ev(`__nns.R.info.programs.length`); R.programas = { antes: pa, depois: pb }; if (pb !== pa) falhas.push(`programas novos ${pa}→${pb}`);
R.erros = b.erros; if (b.erros && b.erros.length) falhas.push('erros JS: ' + b.erros.slice(0, 3).join(' | ')); b.fecha();
// opções salvas/no menu: textos no bundle
const js = fs.readdirSync('dist/assets').filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync('dist/assets/' + f, 'utf8')).join('\n');
R.opcoes = { vibrar: js.includes('Vibrar ao ser atingido'), tremor: js.includes('Tremor da tela ao ser atingido'), padraoSalvo: /tremorAtingido:\s*(!0|true)/.test(js) };
if (!R.opcoes.vibrar || !R.opcoes.tremor || !R.opcoes.padraoSalvo) falhas.push('opções de ajustes ausentes: ' + JSON.stringify(R.opcoes));
R.falhas = falhas; fs.writeFileSync('/workspace/atingido1221.out', JSON.stringify(R, null, 1)); console.log(JSON.stringify(R.intensidade), JSON.stringify(R.item12), JSON.stringify(R.opcoes), JSON.stringify(R.programas));
console.log(falhas.length ? 'FALHAS:\n' + falhas.join('\n') : 'RESULTADO: TUDO OK'); process.exit(falhas.length ? 1 : 0);
