import { abre } from './cdp.mjs';
const mapa = process.argv[2] || 'saofrancisco', T = +(process.argv[3] || 60);
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.vai('http://127.0.0.1:4173/?auto'); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ const U=__nnsUI; const c=U.cfgPartida({ classe:'destroier', modo:'frota', mapa:'${mapa}', hora:'dia', tempo:'limpo' }); U.zarpar(c); return 1 })()`);
for (let i = 0; i < 300; i++) { if (await ev(`!!(window.__nns && __nns.eu && __nns.S && __nns.S.sim.tick > 60)`)) break; await esp(500); }
const L = async () => JSON.parse(await ev(`JSON.stringify(__nns.R.info.programs.map(p=>p.name+"|"+p.cacheKey.replace(/\\s+/g,' ').slice(0,160)))`));
let base = await L(); console.log('t0', base.length);
const t0 = Date.now();
while ((Date.now() - t0) / 1000 < T) { await esp(1500); const l = await L(); const nv = l.filter(x => !base.includes(x)); if (nv.length) { const tk = await ev(`__nns.S.sim.tick`); console.log('NOVO t=' + ((Date.now() - t0) / 1000).toFixed(1) + 's tick=' + tk, JSON.stringify(nv)); base = l; } }
console.log('fim', base.length, 'erros', b.erros.length); b.fecha(); process.exit(0);
