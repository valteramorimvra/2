// Teste de navegador (Chrome headless, WebGL SwiftShader): sem erros de console, telas, sobreposição do HUD e capturas.
// Uso: node --experimental-websocket tests/e2e.mjs [menus] [hud] [jogo] [mapas]   (servidor: npx vite preview --port 4173)
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const D = '/workspace/nexo-naval-shots/'; fs.mkdirSync(D, { recursive: true });
const URL = 'http://127.0.0.1:4173/?auto'; const parte = process.argv.slice(2); const faz = (p) => !parte.length || parte.includes(p);
const rel = []; const log = (s) => { console.log(s); rel.push(s); };
const b = await abre(URL); await b.espera(1500);
const ev0 = b.ev; const ev = (x, ms) => ev0(`(()=>{ try { const g = window.__nns; if (g && g.eu && !g.eu.morto && g.vivo) g.eu.vida = g.eu.C.vida; } catch (e) {} return 0 })()`).then(() => ev0(x, ms)); const esp = b.espera, foto = (n, clip) => b.foto(D + n + '.png', clip);
const tela = (n) => ev(`__nnsUI.TELAS.${n}(); 1`);
const SOBRE = `(() => { const sel = ['.hud-placar', '.hud-fita', '.hud-pausa', '.hud-estado', '.hud-radar canvas', '.rd-modo', '.hud-teleg button', '.lm-leitura', '.lm-linha button', '.lm-trilho', '.lm-centro', '.hud-armas .ar', '.hud-dica', '.hud-alerta', '.hud-msg.on'];
  const els = []; for (const s of sel) document.querySelectorAll(s).forEach((e) => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); if (r.width < 1 || r.height < 1 || st.display === 'none' || st.visibility === 'hidden' || e.closest('[hidden]')) return; els.push({ s: s + (e.dataset.v != null ? '[' + e.dataset.v + ']' : e.dataset.a ? '[' + e.dataset.a + ']' : ''), r }); });
  const W = innerWidth, H = innerHeight, out = []; for (const a of els) { if (a.r.left < -1 || a.r.top < -1 || a.r.right > W + 1 || a.r.bottom > H + 1) out.push('fora da tela: ' + a.s); }
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i].r, c = els[j].r; const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 1 && iy > 1) out.push(els[i].s + ' × ' + els[j].s); }
  return JSON.stringify({ n: els.length, out }); })()`;
const zarpa = async (cfg, ms = 3500) => { await ev(`(async()=>{ if (__nns.rodando) __nns.encerra(); await __nnsUI.zarpar(${JSON.stringify(cfg)}); return 1 })()`, 120000); await esp(ms); };

if (faz('menus')) {
  await tela('inicio'); await esp(1500); await foto('01_menu');
  for (const c of ['corveta', 'fragata', 'destroier', 'furtivo', 'cruzador', 'capitania']) { await ev(`__nnsUI.TELAS.estaleiro(); document.querySelector('[data-c=${c}]').click(); document.querySelector('[data-t=azul]').click(); 1`); await esp(1600); await foto('02_estaleiro_' + c); }
  await ev(`document.querySelector('[data-t=vermelho]').click(); 1`); await esp(1500); await foto('02_estaleiro_capitania_frota_vermelha');
  await ev(`document.querySelector('[data-c=furtivo]').click(); 1`); await esp(1500); await foto('02_estaleiro_furtivo_frota_vermelha'); await ev(`document.querySelector('[data-t=azul]').click(); document.querySelector('[data-c=destroier]').click(); document.querySelector('[data-a=escolher]').click(); 1`);
  await tela('batalha'); await esp(500); await foto('03_batalha'); await tela('ajustes'); await esp(400); await foto('04_ajustes'); await tela('comoJogar'); await esp(400); await foto('05_como_jogar'); await tela('creditos'); await esp(400); await foto('06_creditos');
  log('menus ok');
}
if (faz('hud')) {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'cruzador', seed: 21 }, 2500);
  for (const [w, h] of [[915, 412], [800, 360], [1280, 720], [960, 432], [740, 360]]) { await b.tam(w, h); await esp(700); const r = JSON.parse(await ev(SOBRE)); log(`HUD ${w}x${h}: ${r.n} elementos, sobreposições/fora: ${r.out.length ? r.out.join('; ') : 'nenhuma'}`); }
  await b.tam(915, 412); await ev(`__nns.save.ajustes.canhoto = true; __nns.hud.canhoto(true); 1`); await esp(600); { const r = JSON.parse(await ev(SOBRE)); log(`HUD canhoto 915x412: ${r.out.length ? r.out.join('; ') : 'nenhuma'}`); } await foto('21_hud_canhoto');
  await ev(`__nns.save.ajustes.canhoto = false; __nns.hud.canhoto(false); __nns.acao('bino'); 1`); await esp(1200); { const r = JSON.parse(await ev(SOBRE)); log(`HUD binóculo: ${r.out.length ? r.out.join('; ') : 'nenhuma'}`); } await ev(`__nns.acao('bino'); 1`);
}
if (faz('jogo')) {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'destroier', seed: 77 }, 1500);
  await ev(`__nns.S.comando({t:'telegrafo',v:4}); 1`); await esp(9000); await foto('10_jogo_arquipelago');
  await foto('12_radar_ppi', { x: 915 - 8 - 150 - 10, y: 0, width: 168, height: 196 });
  await ev(`__nns.hud.setLeme(-1); 1`); await esp(7000); await foto('11_curva_bombordo'); await ev(`__nns.hud.setLeme(0); 1`);
  // aproxima um inimigo para os testes de armas (gancho de teste: posição só)
  const prep = `(()=>{ const g=__nns, s=g.S.sim, eu=g.eu; const e=s.navios.find(n=>n.time==='vermelho' && n.tipo==='fragata'); const fx=Math.sin(eu.rumo), fz=-Math.cos(eu.rumo); e.x=eu.x+fx*5200; e.z=eu.z+fz*5200; e.rumo=eu.rumo+1.2; s.sensores(); g.S.comando({t:'travar', alvo:e.id}); g.yaw = eu.rumo; g.pitch=0.1; return e.id })()`;
  await ev(`__nns.vivo = true; 1`); const alvo = await ev(prep); await esp(2500);
  await ev(`__nns.acao('fogo'); setTimeout(()=>__nns.acao('fogoSolta'), 300); 1`); await esp(700); await foto('22_canhao_disparo'); await esp(4500); await foto('22b_canhao_impacto_previsto');
  await ev(`__nns.acao('bino'); 1`); await esp(1800); await foto('13_binoculo_telemetro'); await ev(`__nns.acao('bino'); 1`);
  // míssil 4 fases
  await ev(`(()=>{ const g=__nns; g.eu.trava=1; g.eu.tVls=0; g.acao('vls'); return 1 })()`); await esp(300); const idx = await ev(`__nns.S.sim.misseis.findIndex(m=>m.ativo && m.dono===__nns.eu.id)`);
  log('míssil idx ' + idx);
  const vigia = async (fase, cam, nome, extra = 0) => { for (let k = 0; k < 120; k++) { const f = await ev(`__nns.S.sim.misseis[${idx}].ativo ? __nns.S.sim.misseis[${idx}].fase : -1`); if (f === -1) { log('míssil terminou antes da fase ' + fase); return; } if (f >= fase) break; await esp(100); } await ev(`__nns.camTeste = Object.assign({missil:${idx}}, ${JSON.stringify(cam)}); 1`); await esp(250 + extra); await foto(nome); };
  const pl = await ev(`(()=>{ const n=__nns.eu; return [n.x + Math.cos(n.rumo)*170 + Math.sin(n.rumo)*60, 22, n.z + Math.sin(n.rumo)*170 - Math.cos(n.rumo)*60] })()`);
  await vigia(1, { fixo: true, p: pl, olhaY: 4 }, '14_missil_fase1_ejecao', 250);
  await vigia(2, { atras: 50, cima: 12, lado: 40, frente: 20 }, '14_missil_fase2_pitchover', 200);
  await vigia(3, { atras: 26, cima: 4, lado: 9, frente: 60 }, '14_missil_fase3_rasante_6m', 1200);
  await vigia(4, { atras: 60, cima: 20, lado: -30, frente: 120 }, '14_missil_fase4_terminal', 600);
  await esp(2500); await ev(`__nns.camTeste = null; 1`);
  log('estado antes CIWS: ' + await ev(`JSON.stringify({eu: __nns.eu.morto, vida: __nns.eu.vida, e: __nns.S.sim.navios[${alvo}].morto, d: Math.round(Math.hypot(__nns.eu.x-__nns.S.sim.navios[${alvo}].x, __nns.eu.z-__nns.S.sim.navios[${alvo}].z)), torp: __nns.eu.torp, alvoId: __nns.eu.alvoId, esp: __nns.mem.espectador})`));
  // CIWS: inimigo dispara salva contra o jogador; câmera ao lado do navio olhando a ameaça
  await ev(`(()=>{ const g=__nns, s=g.S.sim, eu=g.eu; const e=s.navios[${alvo}]; e.vls=8; e.tVls=0; e.vida=e.C.vida; s.lancaMissil(e, eu.id, 3); return 1 })()`);
  let achou = false; for (let k = 0; k < 400; k++) { const r = await ev(`(()=>{ for (const eu of __nns.S.sim.navios) { if (eu.time!=='azul' || eu.morto) continue; const c=eu.ciws.findIndex(c=>c.fogo); if (c<0) continue; const m=__nns.S.sim.misseis[eu.ciws[c].alvo]; return [m.x,m.y,m.z, eu.x, eu.z, eu.rumo]; } return null })()`); if (r) { const [mx, my, mz, ex, ez, ru] = r; const dx = mx - ex, dz = mz - ez, dl = Math.hypot(dx, dz); const px = ex - (dx / dl) * 60 + (dz / dl) * 25, pz = ez - (dz / dl) * 60 - (dx / dl) * 25; await ev(`__nns.camTeste = {p:[${px},26,${pz}], a:[${ex + dx * 0.6},${my * 0.6 + 6},${ez + dz * 0.6}]}; 1`); await esp(350); await foto('15_ciws_intercepta'); achou = true; break; } await esp(100); }
  log('CIWS em ação capturado: ' + achou); await esp(1500); await foto('15b_ciws_resultado'); await ev(`__nns.camTeste = null; 1`);
  // torpedo
  let ti = -1; for (let k = 0; k < 6 && ti < 0; k++) { log('torp estado ' + await ev(`(()=>{ const g=__nns; g.eu.tTorp=0; g.acao('torp'); return JSON.stringify({livres: g.S.sim.torpedos.filter(t=>!t.ativo).length, torp: g.eu.torp, morto: g.eu.morto, esp: g.mem.espectador}) })()`)); await esp(400); ti = await ev(`__nns.S.sim.torpedos.findIndex(t=>t.ativo && t.dono===__nns.eu.id)`); if (ti < 0) await esp(1200); } log('torpedo idx ' + ti);
  if (ti >= 0) { await ev(`__nns.S.comando({t:"telegrafo",v:1}); 1`); await esp(13000); await ev(`__nns.camTeste = {missil:${ti}, torp:true, atras:70, cima:30, lado:0, frente:30}; 1`); await esp(600); await foto('16_torpedo_rastro_bolhas'); await ev(`__nns.camTeste = null; 1`); }
  await ev(`__nnsUI.pausar(); 1`); await esp(600); await foto('17_pausa'); await ev(`__nnsUI.continuar(); 1`);
  await ev(`__nns.vivo = false; 1`);
  // avança a partida até o fim (simulação de passo fixo, mesmo código) → resultados
  await ev(`(()=>{ const S=__nns.S; for (let i=0;i<60*600 && !S.sim.fim;i++){ S.sim.passo(S.net.coletar(S.sim.tick+1)); if (S.sim.eventos.length>300) S.sim.eventos.length=0; } return S.sim.fim && S.sim.fim.motivo })()`, 120000).then((m) => log('fim: ' + m));
  await esp(1200); await foto('18a_placar_5x5_fim'); await esp(3500); await foto('18_resultados_5x5');
}
if (faz('mapas')) {
  for (const [m, hora, tempo] of [['arquipelago'], ['estreito'], ['atois'], ['fiordes'], ['guanabara'], ['santos'], ['arquipelago', 'noite', 'limpo'], ['estreito', 'dia', 'chuva']]) {
    await zarpa({ mapa: m, modo: 'frota', classe: 'furtivo', seed: 5, hora: hora || null, tempo: tempo || null }, 1000); await ev(`__nns.S.comando({t:'telegrafo',v:4}); __nns.tutorial=false; __nns.hud.dica(null); 1`); await esp(5000);
    const st = await ev(`JSON.stringify({q:__nns.Q.nivel, fps:Math.round(__nns.Q.fps)})`); await foto(`20_mapa_${m}${hora ? '_' + hora : ''}${tempo ? '_' + tempo : ''}`); log(`mapa ${m} ${hora || ''} ${tempo || ''}: ${st}`); }
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'corveta', seed: 9, classeRival: 'capitania' }, 4000); await foto('19_duelo_1x1');
}
const audio = await ev(`JSON.stringify(__nnsUI.audio.relatorio())`); log('áudio: ' + audio);
log('ERROS DE CONSOLE: ' + (b.erros.length ? b.erros.join(' | ') : 'nenhum')); log('avisos: ' + (b.avisos.length ? b.avisos.slice(0, 8).join(' | ') : 'nenhum'));
fs.writeFileSync('/workspace/nexo-naval-strike/tests/e2e-resultado-' + (parte.join('-') || 'tudo') + '.txt', rel.join('\n')); b.fecha(); process.exit(0);
