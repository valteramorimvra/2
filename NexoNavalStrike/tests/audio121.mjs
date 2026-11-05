// v1.2.1 — teste headless do ÁUDIO como no aparelho: dist/ servido com base './' (igual ao https://localhost do Capacitor),
// Chrome com política de autoplay EXIGINDO gesto (como o WebView Android). Confere: arquivos no dist, fetch + decodeAudioData
// de TODOS os .ogg, contexto suspenso antes do toque e 'running' depois de um TOQUE real (touchStart/touchEnd), música tocando,
// retomada após "background" e botão Testar som. Uso: node --experimental-websocket tests/audio121.mjs
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const arquivos = fs.readdirSync(new URL('../dist/audio/', import.meta.url)).filter((f) => f.endsWith('.ogg')).sort();
const b = await abre('http://127.0.0.1:4173/', { autoplay: 'user-gesture-required' }); const ev = b.ev, esp = b.espera; const out = []; let falhas = 0;
const ok = (c, m) => { out.push((c ? '✔ ' : '✘ ') + m); if (!c) falhas++; };
for (let i = 0; i < 120; i++) { if (await ev(`!!document.querySelector('#boot.pronto')`)) break; await esp(500); }
const dec = JSON.parse(await ev(`(async()=>{ const L=${JSON.stringify(arquivos)}; const oc = new OfflineAudioContext(2, 44100, 44100); const r={}; for (const f of L) { try { const res = await fetch('./audio/'+f); if(!res.ok) throw new Error('http '+res.status); const ab = await res.arrayBuffer(); const bf = await oc.decodeAudioData(ab); r[f] = bf.duration.toFixed(2)+'s'; } catch(e) { r[f] = 'ERRO '+e.message; } } return JSON.stringify(r); })()`, 120000));
const ruins = Object.entries(dec).filter(([, v]) => v.startsWith('ERRO')); ok(arquivos.length >= 29 && !ruins.length, `${arquivos.length} arquivos .ogg em dist/audio, todos baixados e decodificados (${ruins.map((r) => r.join(': ')).join('; ') || 'sem erros'})`);
const antes = await ev(`(()=>{ const a=__nnsUI.audio; return a.ctx ? a.ctx.state : 'sem contexto' })()`); ok(antes !== 'running', `antes do toque: contexto "${antes}" (WebView exige gesto)`);
const toque = async (x, y) => { await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await esp(60); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
await toque(450, 200); await esp(1500);
let st; for (let i = 0; i < 40; i++) { st = JSON.parse(await ev(`JSON.stringify(__nnsUI.audio.estado())`)); if (st.decodificados === st.total && st.ctx === 'running') break; await esp(500); }
ok(st.ctx === 'running', `depois de 1 toque: contexto "${st.ctx}" (${st.taxa} Hz)`); ok(st.decodificados === st.total, `jogo decodificou ${st.decodificados}/${st.total} sons (erros: ${JSON.stringify(st.erros)})`);
ok(st.musica === 'tocando', `música do menu: ${st.musica}`); ok(st.volSom > 0.02 && st.ligado, `volume efeitos ${st.volSom}, som ligado ${st.ligado}`);
await ev(`(()=>{ __nnsUI.audio.pausa(true, true); return 1 })()`); await esp(500); const sus = await ev(`__nnsUI.audio.ctx.state`);
await ev(`(()=>{ __nnsUI.audio.retoma(); return 1 })()`); await esp(800); let vol = await ev(`__nnsUI.audio.ctx.state`); if (vol !== 'running') { await toque(450, 200); await esp(800); vol = await ev(`__nnsUI.audio.ctx.state`); }
ok(sus === 'suspended' && vol === 'running', `background → "${sus}", volta → "${vol}"`);
const t = JSON.parse(await ev(`(()=>{ __nnsUI.TELAS.ajustes ? __nnsUI.TELAS.ajustes() : 0; return 1 })()`) ? await ev(`(async()=>{ await new Promise(r=>setTimeout(r,600)); const bt=document.querySelector('[data-a=testaSom]'); if(!bt) return JSON.stringify({erro:'sem botão'}); bt.click(); await new Promise(r=>setTimeout(r,300)); return JSON.stringify({ txt: document.querySelector('[data-r=somEst]').textContent }) })()`) : '{}');
ok(t.txt && /running/.test(t.txt) && /decodificados/.test(t.txt), `botão "Testar som" em Ajustes: ${t.txt || t.erro}`);
ok(!b.erros.length, 'console sem erros' + (b.erros.length ? ': ' + b.erros.join(' | ').slice(0, 300) : ''));
const txt = out.join('\n') + `\n\n${out.length - falhas} passaram, ${falhas} falharam\n` + Object.entries(dec).map(([k, v]) => `  ${k}: ${v}`).join('\n');
console.log(txt); fs.writeFileSync(new URL('./audio121-resultado.txt', import.meta.url), txt + '\n'); b.fecha(); process.exit(falhas ? 1 : 0);
