// v1.2.17 item 36: confere a cidade de fundo (menu e Visualizar) — densidade, programas WebGL e capturas.
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const URL = process.env.VZ_URL || 'http://127.0.0.1:4173/?auto'; const D = '/workspace/nexo-naval-shots/1217/visualizar36/'; fs.mkdirSync(D, { recursive: true });
const b = await abre(null, { w: 915, h: 412 }); const ev = b.ev, esp = b.espera;
await b.vai(URL); for (let i = 0; i < 160; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`window.__erros=[]; addEventListener('error', e=>__erros.push(String(e.message))); 1`); await esp(6000);
await b.foto(D + 'cidade_menu.png');
const info = await ev(`(()=>{ const V=__nns.vitrine; let n=0; V.cena.traverse(o=>{ if(o.isInstancedMesh && o.parent && o.parent.name==='orla') n=Math.max(n,o.count); }); return JSON.stringify({predios:n, prog:__nns.R.info.programs.length}) })()`);
await ev(`(()=>{ __nnsUI.TELAS.visualizar('marcos'); return 1 })()`); await esp(9000); await b.foto(D + 'cidade_visualizar.png');
const er = await ev(`JSON.stringify(__erros)`); console.log('cidade36', info, 'erros', er); await b.fecha(); process.exit(0);
