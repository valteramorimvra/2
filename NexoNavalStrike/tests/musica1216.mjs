// v1.2.16 item 26: Música ligada/desligada (Ajustes e Pausa), separada do volume, para de fato e fica salva.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const DIR = '/workspace/nexo-naval-shots/1216/musica'; fs.mkdirSync(DIR, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const falhas = []; const R = {};
const pronto = async () => { for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); } };
const est = `JSON.stringify({ on: __nnsUI.audio.musicaOn, tocando: !!(__nnsUI.audio.musica && !__nnsUI.audio.musica.paused), elem: !!__nnsUI.audio.musica, faixa: __nnsUI.audio.faixaDes, salvo: __nnsUI.save.ajustes.musicaOn, vol: __nnsUI.audio.volMusica })`;
await b.vai('http://127.0.0.1:4173/?auto'); await pronto(); await esp(1500);
R.inicio = JSON.parse(await ev(est));
await ev(`(()=>{ __nnsUI.TELAS.ajustes(); return 1 })()`); await esp(800);
await ev(`(()=>{ document.querySelector('[data-g=musicaOn] button[data-v="0"]').click(); return 1 })()`); await esp(500); await b.foto(DIR + '/ajustes-desligada.png');
R.ajDes = JSON.parse(await ev(est)); if (R.ajDes.elem || R.ajDes.on !== false || R.ajDes.salvo !== false) falhas.push('ajustes desligar ' + JSON.stringify(R.ajDes));
if (R.ajDes.vol !== R.inicio.vol) falhas.push('mexeu no volume');
await b.vai('http://127.0.0.1:4173/?auto'); await pronto(); await esp(1500);
R.recarga = JSON.parse(await ev(est)); if (R.recarga.on !== false || R.recarga.elem) falhas.push('não persistiu ' + JSON.stringify(R.recarga));
await ev(`(()=>{ __nnsUI.TELAS.ajustes(); document.querySelector('[data-g=musicaOn] button[data-v="1"]').click(); return 1 })()`); await esp(800);
R.ajLig = JSON.parse(await ev(est)); if (!R.ajLig.elem || R.ajLig.on !== true || R.ajLig.salvo !== true) falhas.push('ajustes ligar ' + JSON.stringify(R.ajLig));
await ev(`(()=>{ __nnsUI.zarpar({ modo:'frota', classe:'destroier', mapa:'atois' }); return 1 })()`);
for (let i = 0; i < 120; i++) { if (await ev(`!!(window.__nns && __nns.rodando && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.pausar(); return 1 })()`); await esp(800);
R.pausaTxt0 = await ev(`(document.querySelector('[data-a=mus]')||{}).textContent||''`);
await ev(`(()=>{ document.querySelector('[data-a=mus]').click(); return 1 })()`); await esp(500); await b.foto(DIR + '/pausa-desligada.png');
R.pDes = JSON.parse(await ev(est)); R.pausaTxt1 = await ev(`document.querySelector('[data-a=mus]').textContent`);
if (R.pDes.elem || R.pDes.on || R.pDes.salvo !== false || !/DESLIG/.test(R.pausaTxt1)) falhas.push('pausa desligar ' + JSON.stringify(R.pDes) + R.pausaTxt1);
await ev(`(()=>{ __nnsUI.continuar(); return 1 })()`); await esp(2500); R.jogoDes = JSON.parse(await ev(est)); if (R.jogoDes.elem) falhas.push('voltou a tocar com música desligada');
await ev(`(()=>{ __nnsUI.pausar(); document.querySelector('[data-a=mus]').click(); return 1 })()`); await esp(600); await b.foto(DIR + '/pausa-ligada.png');
R.pLig = JSON.parse(await ev(est)); if (!R.pLig.elem || !R.pLig.on || R.pLig.salvo !== true) falhas.push('pausa ligar ' + JSON.stringify(R.pLig));
console.log(JSON.stringify(R, null, 1)); console.log('falhas', falhas.length, falhas.join(' | ')); b.fecha(); process.exit(falhas.length ? 1 : 0);
