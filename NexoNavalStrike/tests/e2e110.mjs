// Teste de navegador v1.1.0 (Chrome headless, WebGL SwiftShader): console limpo, sobreposição do HUD em várias resoluções,
// compilação dos shaders (3 níveis de qualidade) e capturas das novidades em /workspace/nexo-naval-shots/110/.
// Uso: node --experimental-websocket tests/e2e110.mjs [menus] [hud] [shaders] [agua] [armas] [defesa] [noite]   (servidor: npx vite preview --port 4173)
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const D = '/workspace/nexo-naval-shots/110/'; fs.mkdirSync(D, { recursive: true });
const URL = 'http://127.0.0.1:4173/?auto'; const parte = process.argv.slice(2); const faz = (p) => !parte.length || parte.includes(p);
const rel = []; const log = (s) => { console.log(s); rel.push(s); };
const b = await abre(URL); await b.espera(1500);
const ev0 = b.ev; const ev = (x, ms) => ev0(`(()=>{ try { const g = window.__nns; if (g && g.eu && !g.eu.morto && g.vivo) g.eu.vida = g.eu.C.vida; } catch (e) {} return 0 })()`).then(() => ev0(x, ms)); const esp = b.espera, foto = (n) => b.foto(D + n + '.png');
const tela = (n) => ev(`__nnsUI.TELAS.${n}(); 1`);
const AJUDA = `window.__t = { L(n, lx, ly, lz) { const c = Math.cos(n.rumo), s = Math.sin(n.rumo); return [n.x + lx * c - lz * s, ly + (n.arfagem || 0), n.z + lx * s + lz * c]; },
  congela() { const g = __nns; g.pausado = true; }, solta() { const g = __nns; g.pausado = false; g.camTeste = null; },
  quadro() { const g = __nns; g.atualizaCamera(0.016, g.tJogo); g.R.render(g.cena, g.cam); },
  poe(e, dist, rel, rumo) { const eu = __nns.eu; const b = eu.rumo + rel; e.x = eu.x + Math.sin(b) * dist; e.z = eu.z - Math.cos(b) * dist; e.rumo = rumo != null ? rumo : eu.rumo; e.v = 0; e.tel = 0; e.vida = e.C.vida; } }; 1`;
const SEL = ['.hud-placar', '.hud-fita', '.hud-pausa', '.hud-estado', '.hud-radar canvas', '.rd-modo', '.hud-teleg button', '.lm-leitura', '.lm-linha button', '.lm-trilho', '.lm-centro', '.lm-piv', '.hud-armas .ar', '.hud-dica', '.hud-alerta', '.hud-msg.on'];
const SOBRE = `(() => { const sel = ${JSON.stringify(SEL)};
  const els = []; for (const s of sel) document.querySelectorAll(s).forEach((e) => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); if (r.width < 1 || r.height < 1 || st.display === 'none' || st.visibility === 'hidden' || e.closest('[hidden]')) return; els.push({ s: s + (e.dataset.v != null ? '[' + e.dataset.v + ']' : e.dataset.a ? '[' + e.dataset.a + ']' : ''), r }); });
  const W = innerWidth, H = innerHeight, out = []; for (const a of els) { if (a.r.left < -1 || a.r.top < -1 || a.r.right > W + 1 || a.r.bottom > H + 1) out.push('fora da tela: ' + a.s); }
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { if (els[i].s.startsWith('.hud-estado') && false) continue; const a = els[i].r, c = els[j].r; const ix = Math.min(a.right, c.right) - Math.max(a.left, c.left), iy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top); if (ix > 1 && iy > 1) out.push(els[i].s + ' × ' + els[j].s); }
  // conteúdo interno do painel de estado não pode transbordar (chips das torres, luz AA, munição)
  for (const s of ['.es-torres', '.es-aa', '.hud-estado .es-mun']) document.querySelectorAll(s).forEach((e) => { const r = e.getBoundingClientRect(), p = e.closest('.hud-estado').getBoundingClientRect(); if (r.width > 0 && (r.right > p.right + 1 || r.bottom > p.bottom + 1 || r.left < p.left - 1)) out.push('transborda: ' + s); });
  document.querySelectorAll('.hud-armas .ar').forEach((e) => { if (e.scrollWidth > e.clientWidth + 2) out.push('texto cortado: .ar[' + (e.dataset.a || '') + '] ' + e.textContent.trim().slice(0, 30)); });
  return JSON.stringify({ n: els.length, out }); })()`;
const SHD = `(() => { const g = __nns, R = g.R, gl = R.getContext(); const ps = R.info.programs || []; const ruins = []; for (const p of ps) { if (p.diagnostics && !p.diagnostics.runnable) ruins.push(p.name + ': ' + (p.diagnostics.fragmentShader?.log || p.diagnostics.vertexShader?.log || p.diagnostics.programLog || '').slice(0, 200)); else if (!gl.getProgramParameter(p.program, gl.LINK_STATUS)) ruins.push(p.name + ': LINK falhou'); }
  return JSON.stringify({ programas: ps.length, ruins, glErro: gl.getError(), nivel: g.Q.nivel }); })()`;
const zarpa = async (cfg, ms = 3500) => { await ev(`(async()=>{ __nns.save.ajustes.qualidade = 'media'; if (__nns.rodando) __nns.encerra(); await __nnsUI.zarpar(${JSON.stringify(cfg)}); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await ev(AJUDA); await esp(ms); };
const tenta = async (nome, f) => { try { await f(); } catch (e) { log(`FALHA em ${nome}: ${e.message}`); try { await ev(`__t.solta(); 1`); } catch (e2) {} } };
const espera = async (cond, max = 300, passo = 80) => { for (let k = 0; k < max; k++) { const r = await ev(cond); if (r && r !== '__timeout') return r; await esp(passo); } return null; };

if (faz('menus')) await tenta('menus', async () => {
  await tela('inicio'); await esp(1500); await foto('00_menu');
  for (const [c, nome] of [['destroier', 'tamboril_d52'], ['cruzador', 'atlantico_c60'], ['capitania', 'fortaleza_b90']]) { await ev(`__nnsUI.TELAS.estaleiro(); document.querySelector('[data-c=${c}]').click(); document.querySelector('[data-t=azul]').click(); 1`); await esp(400); await ev(`__nns.vitrine.ang = -1.3; 1`); await esp(2500); await foto('03_estaleiro_' + nome); }
  await ev(`document.querySelector('[data-t=vermelho]').click(); 1`); await esp(1500); await foto('03_estaleiro_fortaleza_b90_vermelha'); await ev(`document.querySelector('[data-t=azul]').click(); 1`);
  await tela('comoJogar'); await esp(400); await foto('98_como_jogar'); await tela('creditos'); await esp(500); await foto('99_creditos');
  log('créditos (texto): ' + await ev(`document.querySelector('#ui section').innerText.replace(/\\n+/g, ' / ')`));
  log('menus ok');
});
if (faz('shaders')) await tenta('shaders', async () => {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'capitania', seed: 3 }, 2500); await ev(`__nns.save.ajustes.qualidade = 'media'; 1`);
  for (const nv of [1, 0, 2, 1]) { await ev(`__nns.Q.nivel = ${nv}; __nns.aplicaQualidade(); 1`); await esp(1800); log(`shaders nível ${nv}: ${await ev(SHD)}`); if (nv === 0) await foto('13_qualidade_baixa_agua_barata'); }
  await ev(`__nns.save.ajustes.qualidade = 'auto'; 1`);
});
if (faz('hud')) await tenta('hud', async () => {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'capitania', seed: 21 }, 2500);
  await ev(`__nns.hud.dica('Toque em AUTO para o fogo automático'); __nns.hud.msg('Teste de mensagem central', 30); __nns.S.comando({t:'auto',v:1}); 1`);
  for (const [w, h] of [[915, 412], [800, 360], [1280, 720], [960, 432], [740, 360], [1600, 720]]) { await b.tam(w, h); await esp(800); const r = JSON.parse(await ev(SOBRE)); log(`HUD ${w}x${h}: ${r.n} elementos, problemas: ${r.out.length ? r.out.join('; ') : 'nenhum'}`); if (w === 740) await foto('12_hud_740x360'); }
  await b.tam(915, 412); await ev(`__nns.save.ajustes.canhoto = true; __nns.hud.canhoto(true); 1`); await esp(700); { const r = JSON.parse(await ev(SOBRE)); log(`HUD canhoto 915x412: ${r.out.length ? r.out.join('; ') : 'nenhum'}`); }
  await ev(`__nns.save.ajustes.canhoto = false; __nns.hud.canhoto(false); __nns.acao('bino'); 1`); await esp(1200); { const r = JSON.parse(await ev(SOBRE)); log(`HUD binóculo: ${r.out.length ? r.out.join('; ') : 'nenhum'}`); } await ev(`__nns.acao('bino'); __nns.hud.msg('', 0); 1`);
});
if (faz('agua')) await tenta('agua', async () => {
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'cruzador', classeRival: 'fragata', seed: 4, hora: 'entardecer', tempo: 'limpo' }, 1500);
  await ev(`__nns.vivo = true; (()=>{ const g=__nns, s=g.S.sim; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 14000, 0.5); return 1 })()`);
  await ev(`__nns.S.comando({t:'telegrafo',v:4}); 1`); await esp(16000);
  // close-up da água (lado do sol baixo: reflexo especular + espuma nas cristas)
  const sol = await ev(`(()=>{ const a=__nns.amb; const d=a.sol.position.clone().sub(a.sol.target.position).normalize(); return [d.x,d.y,d.z] })()`);
  await ev(`(()=>{ const eu=__nns.eu, d=${JSON.stringify(sol)}; const l=Math.hypot(d[0],d[2])||1; __nns.camTeste={p:[eu.x - eu.C.B*3, 7, eu.z + 30], a:[eu.x + d[0]/l*400, -6, eu.z + d[2]/l*400], fov:50}; return 1 })()`); await esp(1500); await foto('01_agua_closeup_reflexo');
  await ev(`(()=>{ const eu=__nns.eu, d=${JSON.stringify(sol)}; const l=Math.hypot(d[0],d[2])||1; __nns.camTeste={p:[eu.x - d[0]/l*60, 14, eu.z - d[2]/l*60], a:[eu.x - d[0]/l*260, -4, eu.z - d[2]/l*260], fov:55}; return 1 })()`); await esp(1200); await foto('01b_agua_closeup_contraluz');
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'cruzador', classeRival: 'fragata', seed: 4, hora: 'dia', tempo: 'limpo' }, 1500);
  await ev(`__nns.vivo = true; (()=>{ const g=__nns, s=g.S.sim; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 14000, 0.5); s.ameacas.ligadas=0; return 1 })()`);
  await ev(`__nns.S.comando({t:'telegrafo',v:4}); 1`); log('velocidade p/ esteira: ' + await espera(`__nns.eu.v > __nns.eu.C.vmax * 0.85 ? String(Math.round(__nns.eu.v * 1.944)) + ' nós' : 0`, 400, 250));
  await ev(`document.querySelector('.hud').style.visibility = 'hidden'; 1`);
  // espuma junto ao casco + borrifo da proa (vista lateral baixa)
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, 85, 12, -L*0.15), a:__t.L(eu, 0, 1, -L*0.3), fov:45}; return 1 })()`); await esp(1500); await foto('02_espuma_casco_proa');
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, 120, 30, L*0.35), a:__t.L(eu, 0, 0, L*0.05), fov:45}; return 1 })()`); await esp(1200); await foto('02b_espuma_casco_costado');
  // esteira das duas hélices (de cima, por trás)
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, 30, 70, L*0.5+40), a:__t.L(eu, 0, 0, L*0.5+130), fov:60}; return 1 })()`); await esp(1500); await foto('04_esteira_helices');
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, 0, 140, L*0.5+420), a:__t.L(eu, 0, 0, -L*0.2), fov:50}; return 1 })()`); await esp(1200); await foto('04b_esteira_longa');
  await ev(`document.querySelector('.hud').style.visibility = ''; __t.solta(); __nns.vivo=false; 1`);
});
if (faz('armas')) await tenta('armas', async () => {
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'capitania', classeRival: 'cruzador', seed: 6, hora: 'dia', tempo: 'limpo' }, 1500);
  const alvo = await ev(`__nns.vivo = true; (()=>{ const g=__nns, s=g.S.sim, eu=g.eu; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 7500, Math.PI/2, eu.rumo); e.tel=0; eu.tel=0; eu.v=0; for (const n of s.navios) { n.samAuto=0; } s.ameacas.ligadas=0; g.S.comando({t:'travar', alvo:e.id}); return e.id })()`);
  // espera a trava do radar e o giro das torres para boreste sem disparar
  for (let k = 0; k < 14; k++) { await ev(`(()=>{ const eu=__nns.eu; eu.trava = Math.max(eu.trava, 1); for (const tr of eu.torres) tr.rec = Math.max(tr.rec, 0.5); return 1 })()`); await esp(900); }
  log('torres (az, bloqueada): ' + await ev(`JSON.stringify(__nns.eu.torres.map(t=>[+t.az.toFixed(2), t.bloqueada]))`));
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, -150, 55, L*0.85), a:__t.L(eu, 80, 12, -L*0.05), fov:55}; for (const tr of eu.torres) tr.rec = 0; __nns.S.comando({t:'canhao'}); return 1 })()`);
  const salva = await espera(`(()=>{ const eu=__nns.eu; const n=eu.torres.filter(t=>t.recuo>0.6).length; if (n >= eu.torres.length) { __t.congela(); return n; } return 0 })()`, 200, 30);
  log('Fortaleza: torres que dispararam juntas = ' + salva); await esp(250); await foto('05_fortaleza_salva_todas_torres');
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, 70, 30, -L*0.55), a:__t.L(eu, 0, 10, L*0.1), fov:55}; __t.quadro(); return 1 })()`); await esp(250); await foto('05b_fortaleza_salva_proa');
  await ev(`__t.solta(); __nns.S.comando({t:'auto',v:1}); 1`); await esp(5000); await foto('06_hud_auto_fogo');
  log('auto: ' + await ev(`JSON.stringify({auto: __nns.eu.autoFogo, tiros: __nns.eu.stats.tiros, chips: [...document.querySelectorAll('.es-torres > *')].map(e=>e.className+':'+e.textContent).join(' ')})`));
  await ev(`__nns.vivo=false; 1`);
});
if (faz('defesa')) await tenta('defesa', async () => {
  // CIWS x míssil (SAM do alvo desligado para o CIWS trabalhar)
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'destroier', classeRival: 'cruzador', seed: 8, hora: 'dia', tempo: 'limpo' }, 1500);
  await ev(`__nns.vivo = true; (()=>{ const g=__nns, s=g.S.sim, eu=g.eu; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 5000, Math.PI/2, eu.rumo); for (const n of s.navios) n.samAuto=0; eu.a30.length && (eu._a30=1); s.ameacas.ligadas=0; return 1 })()`);
  let ok = false; for (let tent = 0; tent < 3 && !ok; tent++) {
    await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const e=s.navios.find(n=>n.time==='vermelho'); e.vls=8; e.tVls=0; s.lancaMissil(e, eu.id, 2); return 1 })()`);
    const r = await espera(`(()=>{ const s=__nns.S.sim; for (const n of s.navios) { if (n.time!=='azul' || n.morto) continue; const c=n.ciws.find(c=>c.fogo && c.tipo==='m'); if (!c) continue; const m=s.misseis[c.alvo]; if (!m || !m.ativo) continue; const d=Math.hypot(m.x-n.x,m.z-n.z); if (d>650) continue; return JSON.stringify([m.x,m.y,m.z,n.x,n.z,Math.round(d)]); } return 0 })()`, 400, 60);
    if (!r) { log('CIWS: sem engajamento na tentativa ' + tent); continue; }
    const [mx, my, mz, ex, ez, d] = JSON.parse(r); const dx = mx - ex, dz = mz - ez, dl = Math.hypot(dx, dz); const px = ex - (dx / dl) * 60 + (dz / dl) * 22, pz = ez - (dz / dl) * 60 - (dx / dl) * 22;
    await ev(`__nns.camTeste = {p:[${px},17,${pz}], a:[${ex + (dx / dl) * 320},${Math.max(12, my * 0.45)},${ez + (dz / dl) * 320}], fov:55}; 1`); await esp(450); await ev(`__t.congela(); __t.quadro(); 1`); await esp(200); await foto('07_ciws_contra_missil'); log(`CIWS x míssil capturado a ${d} m`); ok = true; await ev(`__t.solta(); 1`); }
  // SAM interceptando (cruzador protege o aliado)
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'cruzador', classeRival: 'cruzador', seed: 9, hora: 'dia', tempo: 'limpo' }, 1500);
  await ev(`__nns.vivo = true; (()=>{ const g=__nns, s=g.S.sim, eu=g.eu; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 8000, 0.9, eu.rumo); e.samAuto=0; eu.samAuto=1; s.ameacas.ligadas=0; return 1 })()`);
  let samOk = false; for (let tent = 0; tent < 3 && !samOk; tent++) {
    await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const e=s.navios.find(n=>n.time==='vermelho'); e.vls=8; e.tVls=0; s.lancaMissil(e, eu.id, 2); return 1 })()`);
    const si = await espera(`(()=>{ const s=__nns.S.sim; const i=s.sams.findIndex(q=>q.ativo && q.time==='azul' && q.t>1.2); return i>=0 ? String(i) : 0 })()`, 400, 60);
    if (!si) { log('SAM: nenhum lançamento na tentativa ' + tent); continue; }
    await ev(`__nns.camTeste = {seguir:'sams', idx:${si}, atras:70, cima:12, lado:22, frente:300, olhaY:0}; 1`);
    const r = await espera(`(()=>{ const s=__nns.S.sim, q=s.sams[${si}]; if (!q.ativo) return 'fim'; const m=s.misseis[q.alvo]; if (!m || !m.ativo) return 0; const d=Math.hypot(m.x-q.x,m.y-q.y,m.z-q.z); if (d < 170) { const ux=(m.x-q.x)/d, uy=(m.y-q.y)/d, uz=(m.z-q.z)/d; __nns.camTeste = {p:[q.x - ux*55 - uz*14, q.y - uy*55 + 7, q.z - uz*55 + ux*14], a:[(q.x*0.35+m.x*0.65),(q.y*0.35+m.y*0.65),(q.z*0.35+m.z*0.65)], fov:24}; document.querySelector('.hud').style.visibility='hidden'; __t.quadro(); __t.congela(); __t.quadro(); return String(Math.round(d)); } return 0 })()`, 400, 25);
    if (r && r !== 'fim') { await esp(200); await foto('08_sam_interceptando'); await ev(`document.querySelector('.hud').style.visibility=''; 1`); log('SAM capturado a ' + r + ' m do míssil'); samOk = true; await ev(`__t.solta(); 1`); await esp(1500); }
    else { log('SAM: alvo/sam encerrou antes (' + r + ')'); await ev(`__t.solta(); 1`); } }
  log('estatística SAM: ' + await ev(`JSON.stringify(__nns.eu.stats)`));
  // 30 mm x lancha rápida
  await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 15000, 0.9); const l=s.lanchas.find(l=>!l.ativo); const b=eu.rumo+Math.PI/2; Object.assign(l, { ativo:1, x: eu.x+Math.sin(b)*1350, z: eu.z-Math.cos(b)*1350, rumo: eu.rumo+Math.PI*1.5, v: 18, vida: 40, dono: e.id, time:'vermelho', alvo: eu.id, t:0, torp:0, fogo:0, tTorp:0, orbita:1 }); return l.idx })()`);
  const ar = await espera(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const a=eu.a30.find(a=>a.fogo && a.tipo==='l'); if (!a) return 0; const l=s.lanchas[a.alvo]; return JSON.stringify([l.x,l.z,Math.round(Math.hypot(l.x-eu.x,l.z-eu.z))]) })()`, 300, 60);
  if (ar) { const [lx, lz, d] = JSON.parse(ar); await ev(`(()=>{ const eu=__nns.eu; const dx=${lx}-eu.x, dz=${lz}-eu.z, l=Math.hypot(dx,dz); __nns.camTeste={p:[eu.x - dx/l*110 - dz/l*30, 42, eu.z - dz/l*110 + dx/l*30], a:[${lx}, 2, ${lz}], fov:30}; return 1 })()`); await esp(1300); await ev(`(()=>{ const s=__nns.S.sim; const l=s.lanchas.find(l=>l.ativo); if (l) __nns.camTeste.a=[l.x,2,l.z]; document.querySelector('.hud').style.visibility='hidden'; __t.congela(); __t.quadro(); return 1 })()`); await esp(250); await foto('09_30mm_contra_lancha'); await ev(`document.querySelector('.hud').style.visibility=''; __t.solta(); 1`); log('30 mm x lancha capturado a ' + d + ' m');
    await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const l=s.lanchas.find(l=>l.ativo); if (!l) return 0; __nns.camTeste={p:[l.x - Math.sin(l.rumo)*40 + Math.cos(l.rumo)*25, 12, l.z + Math.cos(l.rumo)*40 + Math.sin(l.rumo)*25], a:[l.x, 1, l.z], fov:50}; return 1 })()`); await esp(1200); await foto('09b_lancha_sob_fogo'); }
  else log('30 mm: não engajou a lancha');
  await ev(`__t.solta(); 1`); await esp(6000); log('lanchas: ' + await ev(`JSON.stringify(__nns.S.sim.lanchas.filter(l=>l.ativo).map(l=>Math.round(l.vida)))`));
  await ev(`__nns.vivo=false; 1`);
});
if (faz('drone')) await tenta('drone', async () => {
  await zarpa({ mapa: 'atois', modo: 'duelo', classe: 'cruzador', classeRival: 'cruzador', seed: 12, hora: 'dia', tempo: 'limpo' }, 1500);
  await ev(`__nns.vivo = true; (()=>{ const g=__nns, s=g.S.sim, eu=g.eu; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 15000, 0.9); s.ameacas.ligadas=0; return 1 })()`);
  // drone kamikaze em aproximação → abatido pela defesa
  const di = await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const e=s.navios.find(n=>n.time==='vermelho'); const q=s.drones.find(q=>!q.ativo); const b=eu.rumo+0.6; Object.assign(q, { ativo:1, x: eu.x+Math.sin(b)*1900, y: 110, z: eu.z-Math.cos(b)*1900, vx: -Math.sin(b)*45, vy: 0, vz: Math.cos(b)*45, dono: e.id, time:'vermelho', alvo: eu.id, t:0, mergulho:0 }); return q.idx })()`);
  await ev(`__nns.camTeste = {seguir:'drones', idx:${di}, atras:28, cima:6, lado:10, frente:200, olhaY:-40}; 1`); await esp(1800); await foto('10_drone_aproximacao');
  const dr = await espera(`(()=>{ const s=__nns.S.sim, eu=__nns.eu, q=s.drones[${di}]; if (!q.ativo) return 'abatido/fim'; const disp = eu.ciws.some(c=>c.fogo && c.tipo==='d') || eu.a30.some(a=>a.fogo && a.tipo==='d'); if (disp && Math.hypot(q.x-eu.x,q.z-eu.z) < 1500) { const dx=q.x-eu.x, dz=q.z-eu.z, l=Math.hypot(dx,dz); __nns.camTeste={p:[eu.x - dx/l*80 + dz/l*35, 30, eu.z - dz/l*80 - dx/l*35], a:[eu.x+dx*0.6, q.y*0.6+8, eu.z+dz*0.6], fov:55}; __t.quadro(); __t.congela(); __t.quadro(); return 'fogo a ' + Math.round(l) + ' m'; } return 0 })()`, 400, 50);
  log('drone: ' + dr + ' · ' + await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu, q=s.drones[${di}]; return JSON.stringify({ativo:q.ativo, d:Math.round(Math.hypot(q.x-eu.x,q.z-eu.z)), y:Math.round(q.y), pausado:__nns.pausado, ciws:eu.ciws.map(c=>c.mun+':'+c.tipo), a30:eu.a30.map(a=>a.tipo)}) })()`)); if (dr && dr.startsWith('fogo')) { await esp(200); await foto('10b_defesa_contra_drone'); } await ev(`__t.solta(); 1`); await esp(4000);
  log('drone final: ' + await ev(`JSON.stringify({ativo: __nns.S.sim.drones[${di}].ativo, menores: __nns.eu.stats.menores || 0})`));
  // alerta de míssil no HUD + luz AA pulsando
  await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const e=s.navios.find(n=>n.time==='vermelho'); __t.poe(e, 9000, -0.4); e.vls=8; e.tVls=0; s.lancaMissil(e, eu.id, 2); return 1 })()`);
  await espera(`document.querySelector('.hud-alerta') && getComputedStyle(document.querySelector('.hud-alerta')).display !== 'none' && document.querySelector('.hud-alerta').offsetWidth > 0 ? 1 : 0`, 200, 80); await esp(300); await foto('11_alerta_missil_defesa_aa');
  log('HUD defesa: ' + JSON.parse(await ev(SOBRE)).out.join('; '));
  await ev(`__nns.vivo=false; 1`);
});
if (faz('noite')) await tenta('noite', async () => {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'capitania', seed: 5, hora: 'noite', tempo: 'limpo' }, 1500); await ev(`__nns.S.comando({t:'telegrafo',v:4}); 1`); await esp(9000); await foto('14_noite');
  await ev(`(()=>{ const eu=__nns.eu, L=eu.C.L; __nns.camTeste={p:__t.L(eu, 60, 25, L*0.2), a:__t.L(eu, 0, 8, -L*0.1), fov:55}; return 1 })()`); await esp(1500); await foto('14b_noite_casco_espuma'); await ev(`__t.solta(); 1`);
  log('noite: ' + await ev(`JSON.stringify({q:__nns.Q.nivel, fps:Math.round(__nns.Q.fps), expo: __nns.R.toneMappingExposure})`));
});
const audio = await ev(`JSON.stringify(__nnsUI.audio.relatorio())`); log('áudio: ' + audio);
log('ERROS DE CONSOLE: ' + (b.erros.length ? b.erros.join(' | ') : 'nenhum')); log('avisos: ' + (b.avisos.length ? b.avisos.slice(0, 8).join(' | ') : 'nenhum'));
fs.writeFileSync('/workspace/nexo-naval-strike/tests/e2e110-resultado-' + (parte.join('-') || 'tudo') + '.txt', rel.join('\n')); b.fecha(); process.exit(0);
