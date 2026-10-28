// v1.2.7 — close nítido de cada escola de casco no Estaleiro (janela 1830x824). node --experimental-websocket tests/cap127frota.mjs
import { abre } from './cdp.mjs';
const dir = '/workspace/nexo-naval-shots/127'; const ks = (process.argv[2] || 'monolito,tianlong,sokol,warden,fragata,haiyan').split(',');
const ang = +(process.argv[3] || 2.35);
const b = await abre('http://127.0.0.1:4173/?auto', { w: 1830, h: 824 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.save.ajustes.qualidade='alta'; __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(3000);
for (const k of ks) { await ev(`(()=>{ document.querySelector('[data-c=${k}]').click(); return 1 })()`); await esp(2500);
  await ev(`(()=>{ const V=__nns.vitrine; V.auto=false; V.ang=${ang}; V.zoom=${process.env.ZOOM||1.0}; V.elev=${process.env.ELEV||0.2}; return 1 })()`); await esp(3500);
  await b.foto(`${dir}/casco-${k}.png`); console.log(k); }
console.log('erros', JSON.stringify(b.erros.slice(0, 4))); b.fecha(); process.exit(0);
