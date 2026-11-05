// v1.2.1 item 9 — AUTO-MIRA só do jogador: o radar (ATIVO/detecção/toque) nunca liga nem puxa a mira; ligada, só ajusta o navio sob/perto do retículo (cone pequeno).
// Uso: node --experimental-websocket tests/mira121.mjs   (precisa do `vite preview` em 127.0.0.1:4173)
import { abre } from './cdp.mjs';
const b = await abre('http://127.0.0.1:4173/?auto', { w: 915, h: 412 }); const ev = b.ev, esp = b.espera; const res = []; let falhas = 0;
const ok = (c, m) => { res.push((c ? '✔ ' : '✘ ') + m); if (!c) falhas++; };
for (let i = 0; i < 120; i++) { if (await ev(`!document.querySelector('#boot') && !!window.__nnsUI`)) break; await esp(500); }
await ev(`(async()=>{ __nnsUI.save.ajustes.qualidade='baixa'; await __nnsUI.zarpar({ mapa:'santos', modo:'frota', classe:'destroier', seed: 5, hora:'dia', tempo:'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000);
await esp(2000);
const prep = `(()=>{ const j=__nns, n=j.eu, S=j.S.sim; n.v=0; n.telegrafo=0; j.S.comando({t:'telegrafo',v:0}); j.S.comando({t:'travar', alvo:-1}); const E = S.navios.filter(e=>e.time!==n.time && !e.morto); const m = E[0]; window.__m = m.id; E.forEach((e,i)=>{ const br = n.rumo + 0.3 + (i ? Math.PI + i*0.3 : 0); e.x = n.x + Math.sin(br)*(i?9000:4500); e.z = n.z - Math.cos(br)*(i?9000:4500); e.v=0; }); window.__br = n.rumo + 0.3; return 1 })()`;
await ev(prep);
ok(await ev(`__nns.autoMira === false && __nnsUI.save.ajustes.autoMira === false`), 'AUTO-MIRA desligada por padrão');
ok(await ev(`!!document.querySelector('[data-a=automira]')`), 'botão AUTO-MIRA presente no HUD');
// radar: ATIVO e toque no radar não ligam a AUTO-MIRA nem escolhem alvo
await ev(`(()=>{ __nns.acao('radar'); return 1 })()`); await esp(1500); await ev(`(()=>{ __nns.yawAlvo = window.__br + 0.8; __nns.toqueRadar(0.2, -0.4); return 1 })()`); await esp(1500);
ok(await ev(`__nns.autoMira === false`), 'radar ATIVO / detecção / toque no radar não ligam a AUTO-MIRA');
ok(await ev(`__nns.eu.alvoId < 0`), 'toque no radar não seleciona alvo (alvo ' + await ev(`__nns.eu.alvoId`) + ')');
// desligada: mira fora do alvo fica parada
const yaw = async () => +(await ev(`__nns.yawAlvo`)); const dif = (a, c) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c)));
await ev(`(()=>{ __nns.yawAlvo = window.__br + 0.25; __nns.S.comando({t:'rumo', v:-99}); return 1 })()`); await esp(1500); await ev(`(()=>{ __nns.yawAlvo += (window.__br - __nns.marc) + 0.25; return 1 })()`); await esp(300); let y0 = await yaw(); await esp(3000); let y1 = await yaw();
ok(dif(y0, y1) < 0.01, `AUTO-MIRA desligada: mira manual não se move (Δ ${(dif(y0, y1) * 57.3).toFixed(2)}°)`);
// liga pelo botão → estado visível e salvo
await ev(`(()=>{ const q = document.querySelector('[data-a=automira]'); q.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })); q.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9 })); return 1 })()`); await esp(500);
ok(await ev(`__nns.autoMira === true && document.querySelector('[data-a=automira]').classList.contains('on')`), 'botão liga a AUTO-MIRA com estado visível');
ok(await ev(`JSON.parse(localStorage.getItem('nns_v1')||'{}').ajustes?.autoMira === true`), 'estado da AUTO-MIRA salvo');
// ligada, alvo FORA do cone (14°): não pula para o inimigo do radar
y0 = await yaw(); await esp(3000); y1 = await yaw();
ok(dif(y0, y1) < 0.01, `AUTO-MIRA ligada, inimigo a ${(0.25 * 57.3).toFixed(0)}° da mira: não pula (Δ ${(dif(y0, y1) * 57.3).toFixed(2)}°)`);
// ligada, alvo DENTRO do cone pequeno: corrige até o avanço
await ev(`(()=>{ __nns.yawAlvo += (window.__br - __nns.marc) + 0.035; return 1 })()`); await esp(250); /* v1.2.2: mede o erro logo após o deslocamento (a correção agora é mais rápida) */ const e0 = dif(+(await ev('__nns.marc')), +(await ev('window.__br'))); await esp(4000); const e1 = dif(+(await ev('__nns.marc')), +(await ev('window.__br')));
ok(e0 > 0.015 && e1 < 0.012, `AUTO-MIRA ligada, navio perto do retículo: ajusta até o navio (erro ${(e0 * 57.3).toFixed(2)}° → ${(e1 * 57.3).toFixed(2)}°)`);
ok(await ev(`__nns.autoMira === true`), 'a AUTO-MIRA não liga/desliga sozinha');
await b.fecha?.(); console.log(res.join('\n')); console.log(`\n${res.length - falhas} passaram, ${falhas} falharam`); process.exit(falhas ? 1 : 0);
