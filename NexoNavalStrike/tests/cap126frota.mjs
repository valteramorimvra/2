// v1.2.6 — vitrine da frota no Estaleiro: node --experimental-websocket tests/cap126frota.mjs [classes...]
import { abre } from './cdp.mjs';
const dir = '/workspace/nexo-naval-shots/126'; const ks = process.argv.slice(2).length ? process.argv.slice(2) : ['monolito', 'dragao', 'sokol', 'warden', 'fragata', 'corveta'];
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(()=>{ __nnsUI.TELAS.estaleiro(); return 1 })()`); await esp(2500);
for (const k of ks) { const ok = await ev(`(()=>{ const e=document.querySelector('[data-c=${k}]'); if (!e) return 0; e.click(); return 1 })()`); await esp(3500); await b.foto(`${dir}/frota-${k}.png`); console.log(k, ok); }
console.log('erros', JSON.stringify(b.erros.slice(0, 4))); b.fecha(); process.exit(0);
