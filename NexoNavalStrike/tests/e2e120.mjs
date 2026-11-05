// Teste de navegador v1.2.0 (Chrome headless, WebGL SwiftShader): telas novas, HUD, câmeras, helicóptero, afundamento, iscas,
// sobreposições e console limpo, em 20:9 (915×412) e 16:9 (732×412). Capturas em /workspace/nexo-naval-shots/120/.
// Uso: node --experimental-websocket tests/e2e120.mjs [20x9|16x9] [menus] [hud] [heli] [fx] [noite]
import { abre } from './cdp.mjs'; import fs from 'node:fs';
const D = '/workspace/nexo-naval-shots/120/'; fs.mkdirSync(D, { recursive: true });
const arg = process.argv.slice(2); const fmt = arg.includes('16x9') ? '16x9' : '20x9'; const parte = arg.filter((a) => !/x9$/.test(a)); const faz = (p) => !parte.length || parte.includes(p);
const [W, H] = fmt === '16x9' ? [732, 412] : [915, 412];
const rel = []; const log = (s) => { console.log(s); rel.push(s); };
const b = await abre('http://127.0.0.1:4173/?auto', { w: W, h: H }); await b.espera(1500);
const ev = b.ev, esp = b.espera; const foto = (n) => b.foto(D + fmt + '_' + n + '.png');
const vida = `(()=>{ const g = window.__nns; if (g && g.eu && !g.eu.morto && g.vivo) g.eu.vida = g.eu.C.vida; return 1 })()`;
const tela = async (n, ms = 900) => { await ev(`__nnsUI.TELAS.${n}(); 1`); await esp(ms); };
const AJUDA = `window.__t = { L(n, lx, ly, lz) { const c = Math.cos(n.rumo), s = Math.sin(n.rumo); return [n.x + lx * c - lz * s, ly, n.z + lx * s + lz * c]; },
  poe(e, dist, rel, rumo) { const eu = __nns.eu; const b = eu.rumo + rel; e.x = eu.x + Math.sin(b) * dist; e.z = eu.z - Math.cos(b) * dist; e.rumo = rumo != null ? rumo : eu.rumo; e.v = 0; e.tel = 0; e.vida = e.C.vida; },
  corre(seg) { const g = __nns; for (let i = 0; i < seg * 60; i++) { g.S.avanca(1 / 60); if (i % 6 === 5) g.processaEventos(); } g.processaEventos(); return g.S.sim.tick; },
  inimigo() { return __nns.S.sim.navios.find(n => n.time !== __nns.eu.time && !n.morto); } }; 1`;
// sobreposição: elementos visíveis do HUD não podem se cruzar nem sair da tela; tags não podem cair sobre botões; nada no centro
const SOBRE = `(() => { const vis = (e) => { const r = e.getBoundingClientRect(), st = getComputedStyle(e); return r.width > 1 && r.height > 1 && st.display !== 'none' && st.visibility !== 'hidden' && +st.opacity > 0.05 && !e.closest('[hidden]') ? r : null; };
  const grupos = ['.h-pausa', '.h-painel', '.h-placar', '.h-fita', '.h-feed', '.h-alerta', '.h-radar', '.h-teleg', '.h-leme', '.h-chaves', '.h-armas .cb', '.h-heli .hl-joy', '.h-heli .hl-alt', '.h-heli .hl-bts', '.h-heli .hl-info', '.h-dica'];
  const els = []; for (const s of grupos) document.querySelectorAll(s).forEach((e) => { const r = vis(e); if (r) els.push({ s: s + (e.dataset.a ? '[' + e.dataset.a + ']' : ''), r }); });
  const W = innerWidth, H = innerHeight, out = []; for (const a of els) if (a.r.left < -1 || a.r.top < -1 || a.r.right > W + 1 || a.r.bottom > H + 1) out.push('fora: ' + a.s);
  const cruza = (a, c) => Math.min(a.right, c.right) - Math.max(a.left, c.left) > 1 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 1;
  const circ = (x) => x.s.includes('.cb'); const circCruza = (a, c) => { const ra = a.width / 2, rc = c.width / 2; return Math.hypot(a.left + ra - c.left - rc, a.top + ra - c.top - rc) < ra + rc + 1; };
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) if (circ(els[i]) && circ(els[j]) ? circCruza(els[i].r, els[j].r) : cruza(els[i].r, els[j].r)) out.push(els[i].s + ' × ' + els[j].s);
  document.querySelectorAll('.h-marcas .tag').forEach((t) => { const r = vis(t); if (!r) return; for (const a of els) if (cruza(r, a.r)) { out.push('tag × ' + a.s); break; } });
  document.querySelectorAll('.hud *').forEach((e) => { if (e.children.length || !e.textContent.trim()) return; const r = vis(e); if (!r) return; if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow === 'hidden' && getComputedStyle(e).textOverflow !== 'ellipsis') out.push('cortado: ' + (e.className || e.tagName) + ' "' + e.textContent.trim().slice(0, 20) + '"'); });
  const cx = W / 2, cy = H / 2; document.querySelectorAll('.h-feed, .h-alerta, .h-dica').forEach((e) => { const r = vis(e); if (r && r.left < cx && r.right > cx && r.top < cy + 30 && r.bottom > cy - 30) out.push('texto no centro: ' + e.className); });
  return JSON.stringify({ n: els.length, out: [...new Set(out)] }); })()`;
const NAN = `(() => { const s = __nns.S.sim; const ruins = []; for (const n of s.navios) for (const k of ['x', 'z', 'rumo', 'v', 'vida']) if (!Number.isFinite(n[k])) ruins.push(n.id + '.' + k); for (const h of s.helis || []) for (const k of ['x', 'y', 'z']) if (!Number.isFinite(h[k])) ruins.push('heli.' + k); const c = __nns.cam.position; if (!Number.isFinite(c.x + c.y + c.z)) ruins.push('camera'); return ruins.join(',') || 'ok' })()`;
const zarpa = async (cfg, ms = 3500) => { await ev(`(async()=>{ __nns.save.ajustes.qualidade = 'media'; if (__nns.rodando) __nns.encerra(); await __nnsUI.zarpar(${JSON.stringify(cfg)}); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 120000); await ev(AJUDA); await esp(ms); await ev(vida); };
const tenta = async (nome, f) => { try { await f(); } catch (e) { log(`FALHA em ${nome}: ${e.message}`); try { await ev(`__nns.camTeste = null; __nns.pausado = false; 1`); } catch (e2) {} } };
const espera = async (cond, max = 300, passo = 80) => { for (let k = 0; k < max; k++) { const r = await ev(cond); if (r && r !== '__timeout') return r; await esp(passo); } return null; };
const fps = () => ev(`new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(Math.round(n / ((performance.now() - t0) / 1000) * 10) / 10); }; requestAnimationFrame(f); })`);
const hud = async (nome) => { const r = JSON.parse(await ev(SOBRE)); log(`HUD ${nome}: ${r.n} elementos; ${r.out.length ? 'PROBLEMAS: ' + r.out.join('; ') : 'sem sobreposição'}`); };
const clica = (sel) => ev(`(()=>{ const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return 'sem ' + ${JSON.stringify(sel)}; const o = { bubbles: true, cancelable: true, pointerId: 7, isPrimary: true }; e.dispatchEvent(new PointerEvent('pointerdown', o)); e.dispatchEvent(new PointerEvent('pointerup', o)); window.dispatchEvent(new PointerEvent('pointerup', o)); e.click(); return 1 })()`);

if (faz('menus')) await tenta('menus', async () => {
  await tela('inicio', 1800); await foto('00_menu');
  await tela('estaleiro', 2500); await foto('01_estaleiro');
  log('estaleiro abas: ' + await ev(`[...document.querySelectorAll('[data-aba]')].map(b=>b.dataset.aba).join(',')`));
  await clica('[data-aba=modulos]'); await esp(500); await foto('01b_estaleiro_modulos');
  await clica('[data-aba=pintura]'); await esp(1800); await foto('02_estaleiro_pintura');
  const pins = await ev(`[...document.querySelectorAll('[data-pint]')].map(b=>b.dataset.pint).join(',')`); log('pinturas: ' + pins);
  for (const p of pins.split(',').slice(3, 5).concat(pins.split(',').slice(-1))) { await clica(`[data-pint="${p}"]`); await esp(1500); await foto('02_pintura_' + p); }
  await clica('[data-aba=comandante]'); await esp(500); await foto('01c_estaleiro_comandante');
  await clica('[data-aba=helis]'); await esp(800); await foto('01d_estaleiro_helis');
  await clica('[data-a=porto]'); await esp(3500); await foto('03_estaleiro_porto'); await ev(`__nns.vitrine && (__nns.vitrine.ang = (__nns.vitrine.ang||0) + 1.4); 1`); await esp(1500); await foto('03b_estaleiro_porto_orbita'); await clica('[data-a=porto]'); await esp(1000);
  await ev(`(()=>{ const b=[...document.querySelectorAll('.es-lista button')].find(b=>b.classList.contains('prem')); b && b.click(); return 1 })()`); await esp(1800); await foto('04_estaleiro_premium');
  // revisão: navios nacionais novos, comparação premium (Sapsan), pinturas nacionais/ouro, aba Bandeira com gala
  const sel = async (k, nome, aba = 'navio', ms = 1800) => { await ev(`(()=>{ const b=document.querySelector('.es-lista [data-c="${k}"]'); b && b.scrollIntoView({block:'center'}); b && b.click(); const a=document.querySelector('[data-aba="${aba}"]'); a && a.click(); return 1 })()`); await esp(ms); await foto(nome); };
  for (const k of ['kestrel', 'tianlong', 'sokol', 'thornwood', 'xuanwu', 'monolito', 'zarev', 'trovao']) await sel(k, '04n_' + k);
  await sel('fenghuang', '04p_fenghuang_premium'); await ev(`(()=>{ const c=document.querySelector('.cmp-prem'); c && c.scrollIntoView({block:'center'}); return 1 })()`); await esp(500); await foto('04p_fenghuang_comparacao');
  log('premium na lista: ' + await ev(`[...document.querySelectorAll('.es-lista button.prem')].map(b=>b.querySelector('b').innerText).join(' | ')`));
  await sel('sapsan', '04p_sapsan_comparacao'); log('comparação premium: ' + await ev(`(document.querySelector('.cmp-prem')||{}).innerText||'—'`));
  await sel('redwood', '04q_pintura', 'pintura', 800); for (const p of ['nac_eua', 'nac_uk', 'nac_deu', 'couraca_ouro']) { await clica(`[data-pint="${p}"]`); await ev(`(()=>{ const b=document.querySelector('[data-pint="${p}"]'); b && b.scrollIntoView({block:'center'}); __nns.vitrine && (__nns.vitrine.ang = 1.1); return 1 })()`); await esp(1500); await foto('02n_pintura_' + p); }
  await sel('fragata', '04r_bandeira', 'bandeira', 900); await clica('[data-band="BR-SP"]'); await esp(300); await clica('[data-a=gala]'); await esp(1800); await foto('04s_bandeira_sp_gala');
  await ev(`(()=>{ const b=document.querySelector('[data-band="SIN-A"]'); b && b.scrollIntoView({block:'center'}); return 1 })()`); await esp(400); await foto('04t_bandeira_sinais');
  log('enfeite: ' + await ev(`JSON.stringify(__nns && 0 || (JSON.parse(localStorage.getItem(Object.keys(localStorage)[0])||'{}').economia||{}).enfeite)`));
  await clica('[data-a=gala]'); await clica('[data-band="BRA"]'); await esp(300);
  await tela('batalha', 1000); await foto('05_batalha'); await clica('[data-a=prox]'); await esp(2200); await foto('06_preparo'); await clica('.pp-abas [data-aba=cons]'); await esp(500); await foto('06b_preparo_consumiveis'); await clica('.pp-abas [data-aba=carga]'); await esp(200);
  await tela('comandantes', 1200); await foto('07_comandantes');
  await tela('trofeus', 900); await foto('08_trofeus');
  await tela('ajustes', 600); await foto('09_ajustes'); await tela('comoJogar', 500); await foto('98_como_jogar'); await tela('creditos', 600); await foto('99_creditos');
  log('créditos: ' + await ev(`document.querySelector('#ui section').innerText.replace(/\\n+/g, ' / ').slice(0, 2500)`));
});
if (faz('visual')) await tenta('visual', async () => {
  // revisão visual: estaleiro e partida em 3/4 de cima, ao entardecer e à noite, qualidade ALTA
  await ev(`(()=>{ const E=__nnsUI.eco; for (const k of ['medved','aurora','monolito','fenghuang','sapsan','tianlong']) E.e.possui[k]=1; for (const p of ['neon_tech','nac_eua','areia_verm']) E.e.pinturasPossui[p]=1; E.escolherPintura('medved','neon_tech'); E.escolherPintura('monolito','nac_eua'); E.escolherPintura('tianlong','areia_verm'); E.escolherEnfeite('furtivo',{faixa:true}); E.escolherHeli('fenghuang',0,'coaxial'); E.escolherHeli('aurora',0,'utilitario'); __nns.save.ajustes.qualidade='alta'; return 1 })()`);
  await tela('inicio', 1800); await tela('estaleiro', 2500);
  const vis = async (k, hora, nome, ang = 1.15, elev = 0.32) => { await ev(`(()=>{ const b=document.querySelector('.es-lista [data-c="${k}"]'); b && b.click(); __nnsUI.save.ajustes.portoAuto=false; for (let i=0;i<3 && (__nnsUI.save.ajustes.vitrineHora||'dia')!=='${hora}';i++) document.querySelector('[data-a=hora]').click(); const V=__nns.vitrine; V.auto=false; V.ang=${ang}; V.elev=${elev}; V.tToque=0; return 1 })()`); await esp(2600); await foto(nome); };
  await vis('medved', 'dia', 'v00_estaleiro_neon_dia'); await vis('medved', 'entardecer', 'v01_estaleiro_neon_entardecer'); await vis('medved', 'noite', 'v02_estaleiro_neon_noite', 1.05);
  await vis('aurora', 'noite', 'v03_estaleiro_aurora_noite'); await vis('tianlong', 'entardecer', 'v04_estaleiro_conves_vermelho', 1.2, 0.4);
  await vis('monolito', 'entardecer', 'v05_estaleiro_monolito', 1.1); await vis('fenghuang', 'noite', 'v06_estaleiro_fenghuang_noite', 1.2); await vis('furtivo', 'noite', 'v08_estaleiro_stealth_faixa_noite', 1.0, 0.22); await vis('furtivo', 'entardecer', 'v09_estaleiro_stealth_convoo', 0.2, 0.45);
  await ev(`(()=>{ __nns.setPortoVitrine(true); __nns.vitrine.ang = 1.15; __nns.vitrine.elev = 0.38; return 1 })()`); await esp(3500); await foto('v07_estaleiro_porto_noite'); await ev(`__nns.setPortoVitrine(false); for (let i=0;i<3 && (__nnsUI.save.ajustes.vitrineHora||'dia')!=='dia';i++) document.querySelector('[data-a=hora]').click(); 1`);
  const partida = async (mapa, hora, nome) => { await ev(`(async()=>{ if (__nns.rodando) __nns.encerra(); await __nnsUI.zarpar({ mapa:'${mapa}', modo:'frota', classe:'medved', seed: 11, hora:'${hora}', tempo:'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000); await ev(AJUDA); await esp(2500);
    await ev(`__nns.S.comando({t:'telegrafo',v:3}); 1`); await ev(`__t.corre(25)`, 180000);
    await ev(`(()=>{ const eu=__nns.eu; let porto=null, md=1e9; const v=new __nns.cam.position.constructor(); __nns.cena.traverse(o=>{ if (o.name==='porto') { o.getWorldPosition(v); const d=Math.hypot(v.x-eu.x, v.z-eu.z); if (d<md) { md=d; porto=[v.x,v.z]; } } }); const L=eu.C.L; let dx=Math.sin(eu.rumo+0.9), dz=-Math.cos(eu.rumo+0.9); if (porto) { const px=eu.x-porto[0], pz=eu.z-porto[1], l=Math.hypot(px,pz); dx=px/l*0.8+Math.sin(eu.rumo)*0.3; dz=pz/l*0.8-Math.cos(eu.rumo)*0.3; const l2=Math.hypot(dx,dz); dx/=l2; dz/=l2; } __nns.camTeste={ p:[eu.x+dx*L*1.05, L*0.42, eu.z+dz*L*1.05], a:[eu.x - dx*L*0.1, 6, eu.z - dz*L*0.1], fov: 46 }; return JSON.stringify({porto: md|0}) })()`); await esp(2500); await foto(nome); log(nome + ': ' + await ev(`(()=>{ let n=0; __nns.cena.traverse(o=>{ if (o.name==='skyline') n++; }); return 'skylines ' + n + ', hora ' + __nns.S.sim.hora })()`)); await ev(`__nns.camTeste=null; 1`); };
  await partida('guanabara', 'entardecer', 'v10_partida_entardecer'); await partida('santos', 'noite', 'v11_partida_noite');
  // v1.2.0 rev.2: lança-foguetes ASW LF-12 Martelo do couraçado (rajada laranja em parábola alta)
  await ev(`(async()=>{ if (__nns.rodando) __nns.encerra(); await __nnsUI.zarpar({ mapa:'atois', modo:'frota', classe:'trovao', seed: 5, hora:'entardecer', tempo:'limpo' }); __nns.tutorial=false; __nns.hud.dica(null); return 1 })()`, 180000); await ev(AJUDA); await esp(2500);
  log('RBU: ' + await ev(`(()=>{ const eu=__nns.eu; const S=__nns.S; S.comando({t:'rbu', alvo:-1}); for (let i=0;i<240;i++) S.avanca(1/60); __nns.processaEventos(); const L=eu.C.L; const dx=Math.sin(eu.rumo+2.2), dz=-Math.cos(eu.rumo+2.2); __nns.camTeste={ p:[eu.x+dx*L*2.2, L*0.55, eu.z+dz*L*2.2], a:[eu.x+Math.sin(eu.rumo)*520, 170, eu.z-Math.cos(eu.rumo)*520], fov: 62 }; const fg=S.sim.granadas.filter(g=>g.ativo&&g.rbu); return JSON.stringify({ foguetes: fg.length, alt: Math.max(0,...fg.map(g=>g.y))|0, salvas: eu.rbu, botao: document.querySelector('[data-a=torp] b').textContent }) })()`));
  await esp(1200); await foto('v12_trovao_lancafoguetes'); await ev(`__nns.camTeste=null; 1`);
  await ev(`__nns.encerra(); __nns.save.ajustes.qualidade='media'; 1`);
});
if (faz('hud')) await tenta('hud', async () => {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'destroier', seed: 21, hora: 'dia', tempo: 'limpo' }, 4000);
  await ev(`(()=>{ const e=__t.inimigo(); __t.poe(e, 5200, 0.25); return 1 })()`); await esp(2500); await ev(vida); await foto('10_hud_partida'); await hud('partida'); log('FPS headless (SwiftShader, CPU): ' + await fps());
  await ev(`__nns.S.comando({t:'telegrafo',v:3}); 1`); await esp(2000); await foto('11_mira_manual'); log('NaN: ' + await ev(NAN));
  await clica('[data-a=placar]'); await esp(500); await foto('12_lista_10'); await clica('[data-a=placar]'); await esp(300);
  /* v1.2.1: trava só com a mira sobre o navio — aponta a câmera para o inimigo antes de TRAVAR */ await ev(`(()=>{ const e=__t.inimigo(), n=__nns.eu; __nns.yawAlvo = Math.atan2(e.x-n.x, -(e.z-n.z)); __nns.tToque = 0; return 1 })()`); await esp(2500);
  await clica('[data-a=travar]'); await ev(`__t.corre(3)`, 60000); await clica('[data-a=automira]'); await clica('[data-a=auto]'); await ev(`__t.corre(6)`, 120000); await esp(2500); await ev(vida); await foto('13_auto_mira_fogo'); log('auto: ' + await ev(`JSON.stringify({tiros: __nns.eu.stats.tiros, autoMira: __nns.autoMira, auto: __nns.eu.autoFogo})`)); await clica('[data-a=auto]'); await clica('[data-a=automira]');
  await clica('[data-a=bino]'); await esp(1500); await foto('14_binoculo'); await hud('binóculo'); await clica('[data-a=bino]'); await esp(500);
  await clica('[data-a=cam]'); await esp(1500); await foto('15_camera_longe'); await clica('[data-a=cam]'); await esp(300);
  await clica('[data-a=drone]'); await ev(`__t.corre(8)`, 120000); await esp(1500); await ev(vida); await foto('16_drone_lancado'); await ev(`__nns.camModo = 'perto'; 1`); await clica('[data-a=drone]'); await ev(`__t.corre(1)`, 60000); await esp(2500); await foto('17_camera_drone'); await hud('drone');
  log('cams: ' + await ev(`JSON.stringify({cam: __nns.camModo, uav: __nns.eu.uav})`));
  await ev(`__nns.camModo = 'perto'; 1`); await esp(500);
  await ev(`__nns.editorHud(true); 1`); await esp(700); await foto('18_editor_hud'); await ev(`__nns.editorHud(false); 1`); await esp(300);
  await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; const e=__t.inimigo(); __t.poe(e, 9000, 0.4); e.vls=8; e.tVls=0; s.lancaMissil(e, eu.id, 2); return 1 })()`);
  await espera(`document.querySelector('.h-alerta') && document.querySelector('.h-alerta').offsetWidth ? 1 : 0`, 150, 80); await esp(400); await foto('19_alerta_missil'); await hud('alerta');
  await clica('[data-a=cm]'); await esp(700); await foto('20_flares_chaff');
  log('iscas: ' + await ev(`JSON.stringify({chaff: __nns.eu.chaff, res: __nns.eu.chaffReserva, iscas: __nns.eu.stats.iscas})`));
  await ev(`(()=>{ const s=__nns.S.sim, eu=__nns.eu; s.dano(eu, eu.vida * eu.C.blind * 0.8, null, 'canhao'); return 1 })()`); await ev(`__t.corre(2)`, 60000); await esp(1800); await ev(vida); await foto('12c_casco_critico_fogo_alagamento'); await clica('[data-a=c_controle]'); await esp(150); await clica('[data-a=c_kit]'); await esp(900); await foto('12d_consumiveis_ouro_ativos'); log('consumíveis: ' + await ev(`JSON.stringify(Object.fromEntries(Object.entries(__nns.eu.cons||{}).map(([k,c])=>[k, c.nivel + ' ' + c.usos + '/' + c.usosMax + ' t' + c.t.toFixed(0)])))`) + ' fogo ' + await ev(`__nns.eu.incendio`)); log('crítico: ' + await ev(`JSON.stringify({vida: Math.round(__nns.eu.vida), max: __nns.eu.C.vida, fogo: +__nns.eu.incendio.toFixed(1), alag: +__nns.eu.alagamento.toFixed(1)})`));
  await ev(`__nns.vivo=false; 1`);
});
if (faz('heli')) await tenta('heli', async () => {
  await zarpa({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 7, hora: 'dia', tempo: 'limpo' }, 2500);
  log('helis do navio: ' + await ev(`JSON.stringify((__nns.eu.helis||[]).map(i=>__nns.S.sim.helis[i].estado))`));
  await ev(`(()=>{ const h=__nns.S.sim.helis[__nns.eu.helis[0]]; const eu=__nns.eu; const bx=Math.sin(eu.rumo), bz=-Math.cos(eu.rumo); __nns.camTeste={p:[h.x - bx*28 + bz*14, h.y + 12, h.z - bz*28 - bx*14], a:[h.x, h.y + 1, h.z], fov:50}; return 1 })()`); await esp(1500); await foto('21_heli_convoo'); await ev(`__nns.camTeste=null; 1`);
  await clica('[data-a=heli]'); await ev(`__t.corre(14)`, 120000); await esp(1500); await ev(vida); await foto('22_heli_voo_controle'); await hud('helicóptero');
  log('heli: ' + await ev(`JSON.stringify({ctrl: __nns.eu.controle, est: (__nns.eu.helis||[]).map(i=>[__nns.S.sim.helis[i].estado, Math.round(__nns.S.sim.helis[i].y)])})`));
  await ev(`__nns.hud.joy.x = 0.6; __nns.hud.joy.y = 0.8; 1`); await esp(2500); await ev(`__t.corre(3)`, 120000); await clica('[data-a=heliFogo]'); await esp(1500); await foto('23_heli_manobra_fogo'); await clica('[data-a=heliFlare]'); await esp(700); await foto('23b_heli_flare_hud'); log('heli atitude: ' + await ev(`(()=>{ const h=__nns.heliSob(); return h ? JSON.stringify({pitch: +(h.pitch*57.3).toFixed(1), roll: +(h.roll*57.3).toFixed(1), kmh: Math.round(h.v*3.6), flares: h.flares}) : 'sem heli' })()`)); await ev(`__nns.hud.joy.x = 0; __nns.hud.joy.y = 0; 1`);
  await ev(`(()=>{ const s=__nns.S.sim, h=s.helis[__nns.eu.helis[0]]; __nns.camTeste={p:[h.x+40, h.y+12, h.z+30], a:[h.x, h.y, h.z], fov:45}; return 1 })()`); await esp(1200); await foto('24_heli_voo_externo'); await ev(`__nns.camTeste=null; 1`);
  await clica('[data-a=navio]'); await esp(2500); await foto('25_volta_ao_navio'); log('após voltar: ' + await ev(`JSON.stringify({ctrl: __nns.eu.controle, est: (__nns.eu.helis||[]).map(i=>__nns.S.sim.helis[i].estado)})`));
  log('NaN: ' + await ev(NAN)); await ev(`__nns.vivo=false; 1`);
});
if (faz('fx')) await tenta('fx', async () => {
  await zarpa({ mapa: 'arquipelago', modo: 'frota', classe: 'fragata', seed: 4, hora: 'dia', tempo: 'limpo' }, 2500);
  // afundamento de um bot na frente da câmera
  await ev(`(()=>{ const e=__t.inimigo(); __t.poe(e, 900, 0.5, __nns.eu.rumo+1.2); e.vida = 1; e.alagamento = 1; return e.id })()`); await esp(300);
  await ev(`(()=>{ const s=__nns.S.sim, e=s.navios.find(n=>n.time!==__nns.eu.time && n.vida<=1); if (e) s.dano(e, 1e6, __nns.eu, 'canhao'); return 1 })()`);
  const m = await espera(`(()=>{ const e=__nns.S.sim.navios.find(n=>n.morto && n.time!==__nns.eu.time); if (!e) return 0; __nns.camTeste={p:[e.x+180, 40, e.z+140], a:[e.x, 2, e.z], fov:40}; return e.id })()`, 100, 100);
  log('afundamento alvo: ' + m); await ev(`__t.corre(6)`, 120000); await esp(1500); await foto('26_afundando'); await ev(`__t.corre(20)`, 120000); await esp(1500); await foto('27_afundando_mancha_oleo'); await ev(`__nns.camTeste=null; 1`);
  // farol e porto
  const p = await ev(`(()=>{ let f=null; __nns.cena.traverse(o=>{ if (!f && o.userData && o.userData.feixe) f=o; }); if (!f) return 0; const v=f.getWorldPosition(f.position.clone()); __nns.camTeste={p:[v.x+120, v.y+50, v.z+160], a:[v.x, v.y, v.z], fov:45}; return [Math.round(v.x), Math.round(v.z)].join(',') })()`); log('farol em ' + p); await esp(1500); await foto('28_farol_porto'); await ev(`__nns.camTeste=null; 1`);
  log('NaN: ' + await ev(NAN)); await ev(`__nns.vivo=false; 1`);
});
if (faz('noite')) await tenta('noite', async () => {
  await zarpa({ mapa: 'santos', modo: 'frota', classe: 'capitania', seed: 5, hora: 'noite', tempo: 'limpo' }, 2500); await ev(`__nns.S.comando({t:'telegrafo',v:4}); 1`); await esp(6000); await ev(vida); await foto('29_noite'); await hud('noite');
  await zarpa({ mapa: 'fiordes', modo: 'frota', classe: 'corveta', seed: 6, hora: 'tarde', tempo: 'chuva' }, 2500); await esp(3000); await foto('30_tarde_chuva'); await hud('chuva');
  log('qualidade: ' + await ev(`JSON.stringify({q:__nns.Q.nivel, fps:Math.round(__nns.Q.fps)})`));
});
if (faz('resultado')) await tenta('resultado', async () => {
  await zarpa({ mapa: 'estreito', modo: 'frota', classe: 'destroier', seed: 9, hora: 'dia', tempo: 'limpo' }, 2000);
  const p0 = await ev(`JSON.stringify(__nnsUI.eco.e ? {p: __nnsUI.eco.e.prata, o: __nnsUI.eco.e.ouro} : 0)`);
  await ev(`(()=>{ const s=__nns.S.sim; for (const n of s.navios) if (n.time!==__nns.eu.time) s.dano(n, 1e6, __nns.eu, 'canhao'); return 1 })()`); await ev(`__t.corre(12)`, 120000);
  await espera(`document.querySelector('.rs') ? 1 : 0`, 200, 150); await esp(1200); await foto('31_resultado');
  log('economia antes/depois: ' + p0 + ' → ' + await ev(`JSON.stringify({p: __nnsUI.eco.e.prata, o: __nnsUI.eco.e.ouro})`));
  await tela('trofeus', 800); await foto('32_trofeus_apos');
});
log('ERROS DE CONSOLE: ' + (b.erros.length ? b.erros.join(' | ') : 'nenhum')); log('avisos: ' + (b.avisos.length ? [...new Set(b.avisos)].slice(0, 8).join(' | ') : 'nenhum'));
fs.writeFileSync(`/workspace/nexo-naval-strike/tests/e2e120-resultado-${fmt}-${parte.join('-') || 'tudo'}.txt`, rel.join('\n')); b.fecha(); process.exit(0);
