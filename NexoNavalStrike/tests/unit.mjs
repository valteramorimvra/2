// Testes unitários (Node, sem navegador): leme/rumo/adorno, mísseis 4 fases, CIWS, torpedo, iscas, pools, fim de
// partida, determinismo, comandos e save. Uso: node tests/unit.mjs
import * as THREE from 'three';
import { Sim, POOL, FASE, CIWS_ALC, DT } from '../src/sim/world.js';
import { criaArena, MAPAS, ORDEM_MAPAS, alturaTerreno, bloqueado } from '../src/sim/maps.js';
import { lancaUav } from '../src/naval5v5/aereo.js';
import { criaSessao } from '../src/sim/session.js';
import { CLASSES, ORDEM_CLASSES } from '../src/sim/classes.js';
import { fatorSonar } from '../src/sim/deteccao.js';
import { ang } from '../src/sim/util.js';
import { valida, serializa, desserializa } from '../src/net/commands.js';
import { RemoteAdapter, LocalBotAdapter } from '../src/net/NetAdapter.js';
import { Save } from '../src/save.js';
import { ONDAS, defineMar, alturaMar } from '../src/sim/ocean.js';
import { layoutDe, meiaBoca } from '../src/sim/layout.js';
import { bordaPA } from '../src/sim/classes1225.js'; /* v1.2.25 */
import { fatorNuclear } from '../src/sim/nuclear.js'; /* v1.2.29 */
import { MISSEIS, GRANADAS, TORPEDO } from '../src/sim/classes.js';
import { RBU_DISP } from '../src/sim/world.js';
import { solucaoTiro } from '../src/sim/world.js';
import { deslocaGerstner, GLSL_GERSTNER, esbeltez, arrasto, raioGiro, raioMin, torreCobre, CIWS, A30, POOL5, probCiws, pA30 } from '../src/modernNaval5v5.js';
import { shadersAgua } from '../src/naval5v5/agua.js';
import { lancaSam, ciwsCego } from '../src/naval5v5/defesa.js';
import { taxaTorre } from '../src/naval5v5/armas.js';
import { disp as bancaDisp } from './lib-dispersao.mjs';
import { PARAM } from '../src/armasParametros.js';
const PARAM_T = PARAM.trava;
import { G as GRAV } from '../src/sim/util.js';

/* v1.2.5: nos testes de ARMAS que chamam lancaMissil/lancaTorpedo direto, a "mira" do jogador é posta sobre o alvo (a regra da mira tem teste próprio) */
{ const aim = (s, n, alvo) => { const a = alvo >= 0 ? s.navios[alvo] : null; if (a && n.mira && !s._semAutoMira) n.mira.az = Math.atan2(a.x - n.x, -(a.z - n.z)); if (a && n.alvoId !== alvo) { n.alvoId = alvo; } };
  const lm = Sim.prototype.lancaMissil, lt = Sim.prototype.lancaTorpedo; Sim.prototype.lancaMissil = function (n, alvo, ...r) { aim(this, n, alvo); return lm.call(this, n, alvo, ...r); }; Sim.prototype.lancaTorpedo = function (n, alvo, ...r) { aim(this, n, alvo); return lt.call(this, n, alvo, ...r); }; }
let ok = 0, falhas = 0; const res = [];
function t(nome, f) { if (process.env.UNIT_FILTRO && !process.env.UNIT_FILTRO.split('|').some((f) => nome.includes(f))) return; process.stderr.write('› ' + nome + '\n'); const t0=Date.now(); try { const r = f(); ok++; res.push(`✔ ${nome}${r ? ' — ' + r : ''}`); process.stderr.write('  ok ' + (Date.now()-t0) + 'ms\n'); } catch (e) { falhas++; res.push(`✘ ${nome}: ${e.message}`); process.stderr.write('  FAIL ' + (Date.now()-t0) + 'ms ' + e.message + '\n'); } }
const assert = (c, m) => { if (!c) throw new Error(m); };
const ARENA = criaArena('atois');
function simLivre(seed = 5) { const s = new Sim({ arena: ARENA, seed }); s.revelaTudo = 1; /* testes de ARMAS isolados; a detecção tem testes próprios (v1.2.2) */ return s; }
/** v1.2.1: AUTO-FOGO exige a mira (manual) do jogador sobre o alvo — o teste "segura" a mira no alvo travado */
const segura = (s, a) => { const b = s.navios[a.alvoId]; if (b && s.tick % 6 === 0) s.aplica({ id: a.id, t: 'mira', az: Math.atan2(b.x - a.x, -(b.z - a.z)), dist: Math.hypot(b.x - a.x, b.z - a.z) }); };
const roda = (s, seg, f) => { for (let i = 0; i < seg * 60; i++) { s.passo(); if (f) f(s, i); } };
const P0 = ARENA.plano.centro;

t('Leme BE (boreste) vira à DIREITA: rumo aumenta; BB (bombordo) vira à ESQUERDA', () => {
  const out = [];
  for (const lado of [1, -1]) { const s = simLivre(); const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); n.telAlvo = 4; roda(s, 30); const r0 = n.rumo; n.lemeCmd = lado; roda(s, 6); const d = ang(n.rumo - r0); assert(Math.sign(d) === lado, `lado ${lado}: variação ${d}`); out.push(`${lado > 0 ? 'BE' : 'BB'} ${(d * 57.3).toFixed(1)}°`); }
  return out.join(', ');
});
t('Proa do modelo 3D e deslocamento coincidem com o rumo', () => {
  const s = simLivre(); const n = s.adicionaNavio('azul', 'fragata', P0.x, P0.z, 1.1); n.telAlvo = 4; n.lemeCmd = 0.6; roda(s, 25); const x0 = n.x, z0 = n.z; s.passo(); const dx = n.x - x0, dz = n.z - z0;
  const o = new THREE.Object3D(); o.rotation.order = 'YXZ'; o.rotation.y = -n.rumo; o.updateMatrixWorld(); const proa = new THREE.Vector3(0, 0, -1).applyQuaternion(o.quaternion);
  const L = Math.hypot(dx, dz); const cosP = (proa.x * dx + proa.z * dz) / L; const b = n.deriva || 0; const vx = Math.sin(n.rumo) + Math.cos(n.rumo) * Math.tan(b), vz = -Math.cos(n.rumo) + Math.sin(n.rumo) * Math.tan(b), lv = Math.hypot(vx, vz); const cos = (vx * dx + vz * dz) / (lv * L);
  assert(cos > 0.9999, 'cos=' + cos); assert(Math.abs(cosP - Math.cos(b)) < 2e-3, 'proa vs deriva ' + cosP); /* v1.2.3: na curva o movimento = proa girada pela DERIVA (popa escorrega para fora) */ return `cos(proa+deriva, movimento) = ${cos.toFixed(6)}; deriva ${(b * 57.3).toFixed(1)}° em curva com 60% de leme`;
});
t('Adorno: em curva a toda força o navio adorna para FORA da curva e volta ao prumo', () => {
  const s = simLivre(); const n = s.adicionaNavio('azul', 'corveta', P0.x, P0.z, 0); n.telAlvo = 4; roda(s, 40); n.lemeCmd = 1; let ad = 0; roda(s, 12, () => (ad = n.adorno));
  assert(ad < -0.01, 'curva a BE deveria adornar a BB (negativo): ' + ad); n.lemeCmd = 0; roda(s, 30); assert(Math.abs(n.adorno) < Math.abs(ad) * 0.35, 'não recuperou: ' + n.adorno);
  const s2 = simLivre(); const m = s2.adicionaNavio('azul', 'corveta', P0.x, P0.z, 0); m.telAlvo = 4; roda(s2, 40); m.lemeCmd = -1; let ad2 = 0; roda(s2, 12, () => (ad2 = m.adorno)); assert(ad2 > 0.01, 'curva a BB deveria adornar a BE: ' + ad2);
  return `BE ${(ad * 57.3).toFixed(1)}°, BB +${(ad2 * 57.3).toFixed(1)}°, recupera para ${(n.adorno * 57.3).toFixed(2)}°`;
});
t('Telégrafo: aceleração progressiva, um degrau por vez, ré negativa', () => {
  const s = simLivre(); const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); n.telAlvo = 4; roda(s, 0.4); assert(n.tel === 2, 'tel ' + n.tel); roda(s, 5); const v5 = n.v; roda(s, 60); assert(v5 < n.v * 0.75 /* v1.2.8: aceleração mais viva */ && n.v > n.C.vmax * 0.95, `v5=${v5} v=${n.v}`); /* revisão: 0→vmax em ~12–18 s */ n.telAlvo = 0; roda(s, 90); assert(n.v < -0.5, 'ré ' + n.v);
  return `5 s: ${(v5 * 1.944).toFixed(1)} nós, 65 s: ${(CLASSES.destroier.vmax * 1.944).toFixed(1)} nós máx.`;
});

function duelo(seed, dist = 8000, ciwsAlvo = true) { const s = simLivre(seed); const a = s.adicionaNavio('azul', 'cruzador', P0.x - dist / 2, P0.z, Math.PI / 2); const b = s.adicionaNavio('vermelho', 'destroier', P0.x + dist / 2, P0.z, -Math.PI / 2); a.telAlvo = b.telAlvo = 1; if (!ciwsAlvo) { for (const c of b.ciws) { c.mun = -1e9; c.t = -1e9; } b.a30.length = 0; b.samAuto = 0; } s.sensores(); a.alvoId = b.id; a.trava = 1; a.travaMis = 1; a._tmAlvo = b.id; /* v1.2.17 item 17: trava de MÍSSIL completa (o jogador precisa dela para o VLS) */ return { s, a, b }; }
t('Míssil VLS: 4 fases na ordem (ejeção → pitch-over → rasante ~6 m → terminal) e acerta', () => {
  const { s, a, b } = duelo(3, 8000, false); b.chaff = 0; assert(s.lancaMissil(a, b.id, 1) === 1, 'não lançou'); const m = s.misseis.find((q) => q.ativo); const fases = [m.fase]; const alt3 = []; let hit = false;
  for (let i = 0; i < 60 * 60 && m.ativo; i++) { s.passo(); if (fases[fases.length - 1] !== m.fase && m.ativo) fases.push(m.fase); if (m.fase === FASE.CRUZEIRO && Math.abs(m.y - 6) < 40) alt3.push(m.y); if (m.ativo) { m._apice = Math.max(m._apice || 0, m.y); if (m.fase === FASE.TERMINAL && m._yTerm == null) m._yTerm = m.y; } for (const e of s.eventos) if (e.t === 'impacto' && e.tipo === 'missil') hit = true; s.eventos.length = 0; }
  assert(fases.join() === '1,2,3,4', 'fases ' + fases.join()); assert(hit, 'não acertou'); if (PARAM.missil.arco) { assert(m._apice > 150, 'arco baixo ' + m._apice); assert(m._yTerm < 40, 'entrada no terminal alta ' + m._yTerm); return `v1.2.10 ARCO: ápice ${Math.round(m._apice)} m, entra no terminal a ${Math.round(m._yTerm)} m`; } const tail = alt3.slice(Math.floor(alt3.length * 0.4)); const med = tail.reduce((p, c) => p + c, 0) / tail.length; assert(Math.abs(med - 6) < 2.5, 'altitude média de cruzeiro ' + med);
  return `fases ${fases.join('→')}, cruzeiro médio ${med.toFixed(1)} m, acerto ✓`;
});
t('CIWS: só atira dentro de ~1200 m, segue o míssil e abate com probabilidade (nem 0% nem 100%)', () => {
  let abat = 0, N = 30, maxD = 0;
  for (let k = 0; k < N; k++) { const { s, a, b } = duelo(100 + k, 8000, true); b.chaff = 0; b.rumo = -Math.PI / 2 + 1.0; /* v1.2.19 item 5: o único CIWS do destróier tem linha de tiro real (proa e popa obstruídas pela estrutura); o míssil chega a 57° da proa */ s.lancaMissil(a, b.id, 1); const m = s.misseis.find((q) => q.ativo);
    for (let i = 0; i < 60 * 60 && m.ativo; i++) { s.passo(); for (const [j, c] of b.ciws.entries()) if (c.fogo) { const pc = b.P.ciws[j], o = s.mundo(b, pc.x, pc.y, pc.z, {}); maxD = Math.max(maxD, Math.hypot(m.x - o.x, m.y - o.y, m.z - o.z)); const az = Math.atan2(m.x - o.x, -(m.z - o.z)) - b.rumo; assert(Math.abs(ang(az - c.az)) < 0.08, 'CIWS atirando sem apontar'); } for (const e of s.eventos) if (e.t === 'missilAbatido') abat++; s.eventos.length = 0; } }
  const taxa = abat / N; assert(maxD <= CIWS_ALC + 20, 'atirou a ' + maxD); assert(taxa > 0.02 && taxa < 0.6, 'taxa ' + taxa); /* v1.2.5: defesa com chance limitada */ return `${abat}/${N} abatidos (${Math.round(taxa * 100)}%), disparo máximo a ${Math.round(maxD)} m (limite ${CIWS_ALC})`;
});
t('v1.2 Contramedidas: míssil travado é seduzido com a probabilidade das stats (85% padrão / 95% isca ouro); sem isca, o míssil guiado NUNCA erra', () => { const res = {};
  for (const [nome, p] of [['padrao', 0.85], ['ouro', 0.95]]) { let sed = 0, acertoSem = 0, N = 60; for (let k = 0; k < N; k++) { const { s, a, b } = duelo(300 + k, 8000, false); b.ciws.length = 0; b.sam = 0; b.a30.length = 0; b.pIsca = p; s.lancaMissil(a, b.id, 1); const m = s.misseis.find((q) => q.ativo); let usou = 0, foi = 0, hit = 0;
      for (let i = 0; i < 60 * 60 && m.ativo; i++) { s.passo(); if (!usou && m.fase >= FASE.CRUZEIRO && Math.hypot(m.x - b.x, m.z - b.z) < 3500) { usou = 1; s.lancaIsca(b); } for (const e of s.eventos) { if (e.t === 'seduzido') foi = 1; if (e.t === 'impacto' && e.tipo === 'missil') hit = 1; } s.eventos.length = 0; }
      sed += foi; if (!foi) { assert(hit, 'míssil não seduzido errou (semente ' + (300 + k) + ')'); acertoSem++; } }
    res[nome] = sed / N; assert(Math.abs(sed / N - p) < 0.12, nome + ' ' + sed + '/' + N); }
  // sem contramedida: 30 mísseis, 30 acertos (falha aleatória proibida)
  let ok = 0; for (let k = 0; k < 30; k++) { const { s, a, b } = duelo(500 + k, 7000, false); b.ciws.length = 0; b.sam = 0; b.a30.length = 0; b.telAlvo = 4; b.lemeCmd = k % 2 ? 1 : -1; s.lancaMissil(a, b.id, 1); const m = s.misseis.find((q) => q.ativo); for (let i = 0; i < 60 * 60 && m.ativo; i++) { s.passo(); for (const e of s.eventos) if (e.t === 'impacto' && e.tipo === 'missil') ok++; s.eventos.length = 0; } }
  assert(ok === 30, 'acertos sem defesa ' + ok + '/30'); return `seduzidos: padrão ${(res.padrao * 100).toFixed(0)}%, ouro ${(res.ouro * 100).toFixed(0)}%; sem defesa e manobrando a toda força: 30/30 acertos`; });
t('Torpedo acústico: corre, busca e acerta um alvo parado; deixa de existir depois', () => { const { s, a, b } = duelo(9, 3000, false); assert(s.lancaTorpedo(a, b.id) === 1, 'não lançou'); const tp = s.torpedos.find((q) => q.ativo); let hit = 0; for (let i = 0; i < 60 * 200 && tp.ativo; i++) { s.passo(); for (const e of s.eventos) if (e.t === 'torpImpacto') hit = 1; s.eventos.length = 0; } assert(hit, 'não acertou'); return 'acerto ✓'; });
t('Canhão: solução de tiro com elevação automática cresce com a distância (1–10 km)', () => { const els = []; for (const d of [1000, 4000, 8000, 9800]) { const { s, a, b } = duelo(4, d, true); s.sensores(); const sol = s.pontaria(a); assert(sol && sol.travado, 'sem solução a ' + d); els.push(sol.el); } for (let i = 1; i < els.length; i++) assert(els[i] > els[i - 1], 'elevação não cresce'); return els.map((e) => (e * 57.3).toFixed(1) + '°').join(' / '); });

t('Pools fixos: 5x5 completo de 600 s nunca passa dos limites nem cria objetos novos', () => { const S = criaSessao({ mapa: 'arquipelago', modo: 'frota', classe: 'destroier', seed: 42 }); const sim = S.sim; const refs = [sim.granadas, sim.misseis, sim.torpedos, sim.iscas]; const ini = refs.map((r) => r.slice()); let pico = [0, 0, 0, 0];
  for (let i = 0; i < 600 * 60 && !sim.fim; i++) { sim.passo(S.net.coletar(sim.tick + 1)); sim.eventos.length = 0; if (i % 10 === 0) refs.forEach((r, k) => (pico[k] = Math.max(pico[k], r.filter((q) => q.ativo).length))); }
  const lim = [POOL.granadas, POOL.misseis, POOL.torpedos, POOL.iscas]; refs.forEach((r, k) => { assert(r.length === lim[k], 'tamanho mudou'); assert(r.every((q, i) => q === ini[k][i]), 'objeto trocado'); assert(pico[k] <= lim[k], 'pico'); });
  return `pico ativo granadas ${pico[0]}/${POOL.granadas}, mísseis ${pico[1]}/32, torpedos ${pico[2]}/16, iscas ${pico[3]}/12; fim: ${sim.fim ? sim.fim.motivo : 'sem fim'}`; });
t('Fim de partida: aniquilação', () => { const S = criaSessao({ mapa: 'atois', modo: 'frota', seed: 2 }); for (const n of S.sim.navios) if (n.time === 'vermelho') S.sim.dano(n, 1e9, S.jogador, 'teste'); S.sim.passo([]); assert(S.sim.fim && S.sim.fim.vencedor === 'azul' && /Aniquila/.test(S.sim.fim.motivo), JSON.stringify(S.sim.fim)); return S.sim.fim.motivo; });
t('Fim de partida: controle da zona central (75 s sem contestação)', () => { const S = criaSessao({ mapa: 'atois', modo: 'duelo', seed: 2 }); const sim = S.sim, c = S.match.centro; const eu = S.jogador; const ini = sim.navios.find((n) => n.time === 'vermelho'); let k = 0;
  for (; k < 60 * 120 && !sim.fim; k++) { eu.x = c.x; eu.z = c.z; eu.v = 0; eu.telAlvo = 1; ini.x = c.x + 4000; ini.z = c.z + 4000; ini.vida = ini.C.vida; eu.vida = eu.C.vida; sim.passo([]); sim.eventos.length = 0; }
  assert(sim.fim && sim.fim.vencedor === 'azul' && /zona/.test(sim.fim.motivo), JSON.stringify(sim.fim)); return `${sim.fim.motivo} em ${(k / 60).toFixed(1)} s`; });
t('Fim de partida: tempo esgotado decide por frota + zona', () => { const S = criaSessao({ mapa: 'atois', modo: 'duelo', seed: 2 }); const sim = S.sim; const ini = sim.navios.find((n) => n.time === 'vermelho'); ini.vida = ini.C.vida * 0.5; S.match.tempo = S.match.duracao - 0.01; sim.passo([]); assert(sim.fim && /Tempo/.test(sim.fim.motivo) && sim.fim.vencedor === 'azul', JSON.stringify(sim.fim)); return sim.fim.motivo; });
t('Determinismo: mesma semente + mesmos comandos → mesmo hash; semente diferente → outro', () => { const h = (seed) => { const S = criaSessao({ mapa: 'estreito', modo: 'frota', classe: 'fragata', seed }); for (let i = 0; i < 90 * 60; i++) { if (i === 30) S.comando({ t: 'telegrafo', v: 4 }); if (i === 600) S.comando({ t: 'leme', v: 0.5 }); S.sim.passo(S.net.coletar(S.sim.tick + 1)); S.sim.eventos.length = 0; } return S.sim.hashEstado(); }; const a = h(7), b = h(7), c = h(8); assert(a === b, `${a} != ${b}`); assert(a !== c, 'sementes diferentes iguais'); return `hash ${a}`; });
t('Comandos: validação/serialização rejeita lixo; RemoteAdapter é stub offline', () => { assert(valida({ t: 'xx', id: 0 }) === null, 'tipo inválido'); assert(valida({ t: 'leme', id: -1, v: 1 }) === null, 'id inválido'); const c = valida({ t: 'mira', id: 1, az: 1.2, dist: 'x'.repeat(40), lixo: 3 }); assert(c && c.az === 1.2 && !('dist' in c) && !('lixo' in c), JSON.stringify(c)); const d = desserializa(serializa(5, [{ t: 'canhao', id: 0 }, { t: 'bad', id: 0 }])); assert(d.tick === 5 && d.cmds.length === 1, 'desserializa'); let erro = ''; try { new RemoteAdapter().iniciar({}); } catch (e) { erro = e.message; } assert(/online/.test(erro), 'remote'); return 'ok'; });
t('v1.2 Comandos do JOGADOR passam pela validação (reparo, VANT, helicópteros, controle)', () => { for (const c of [{ t: 'reparo' }, { t: 'uav' }, { t: 'heliLanca', k: 0 }, { t: 'heliCtrl', k: 0, jx: 0.5, jy: -1, alt: 120 }, { t: 'heliFogo', k: 1 }, { t: 'heliVolta', k: 0 }, { t: 'controle', k: -1 }]) { const v = valida({ id: 2, ...c }); assert(v && v.t === c.t, 'rejeitou ' + c.t); for (const k of Object.keys(c)) assert(k === 't' || v[k] === c[k], c.t + '.' + k); } return 'ok'; });
t('Save: ajustes/perfil isolados, mescla com padrão e registra partida', () => { let mem = null; const arm = { ler: () => mem, gravar: (d) => (mem = JSON.parse(JSON.stringify(d))) }; const s = new Save(arm); s.ajustes.sens = 1.7; s.registraPartida({ vitoria: true, abates: 3, tiros: 10, acertos: 4, tempo: 300 }); const s2 = new Save(arm); assert(s2.ajustes.sens === 1.7 && s2.perfil.vitorias === 1 && s2.perfil.abates === 3, JSON.stringify(s2.perfil)); return 'ok'; });
t('Todos os mapas e classes montam partidas válidas (spawns em água, v1.2.19: 4–12 km entre bases — contato imediato, caminho por água)', () => { const out = []; for (const m of ORDEM_MAPAS) { const S = criaSessao({ mapa: m, modo: 'frota', classe: 'cruzador', seed: 1 }); const P = S.T.plano; const d = Math.hypot(P.azul.x - P.vermelho.x, P.azul.z - P.vermelho.z); assert(d >= 3900 && d <= 12100, m + ' dist ' + d); for (const n of S.sim.navios) assert(alturaTerreno(S.T, n.x, n.z) < -n.C.T, m + ' navio em terra'); assert(S.sim.navios.length === 16, 'frota 8x8: ' + S.sim.navios.length); const cen = (t) => { const a = S.sim.navios.filter((n) => n.time === t); return [a.reduce((p, n) => p + n.x, 0) / a.length, a.reduce((p, n) => p + n.z, 0) / a.length]; }; const A = cen('azul'), V = cen('vermelho'); const df = Math.hypot(A[0] - V[0], A[1] - V[1]); assert(df > 3500, m + ' frotas a ' + df); out.push(m + ' ' + Math.round(df) + ' m'); } for (const k of ORDEM_CLASSES) criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed: 3 }); return out.length + ' mapas, ' + ORDEM_CLASSES.length + ' classes'; });

// ======================= v1.1.0 — núcleo modern naval 5v5 =======================
t('v1.1 Gerstner: altura da física = superfície desenhada pelo shader (mesmo GLSL, deslocamento horizontal invertido)', () => {
  const sh = shadersAgua('', 1), sb = shadersAgua('', 0); assert(sh.vs.includes(GLSL_GERSTNER) && sh.fs.includes(GLSL_GERSTNER) && sb.vs.includes(GLSL_GERSTNER), 'shader não usa o GLSL compartilhado');
  let pior = 0, ingenua = 0; const d = { x: 0, y: 0, z: 0, crista: 0 };
  for (const bf of [2, 4, 6]) { defineMar(bf, 0.6); for (let i = 0; i < 400; i++) { const px = (i * 37.3) % 900 - 450, pz = (i * 91.7) % 900 - 450, tt = i * 0.37; deslocaGerstner(ONDAS, px, pz, tt, d); const X = px + d.x, Z = pz + d.z;
      pior = Math.max(pior, Math.abs(alturaMar(X, Z, tt) - d.y)); let y0 = 0; for (const w of ONDAS) y0 += w.A * Math.sin(w.k * (w.dx * X + w.dz * Z - w.c * tt)); ingenua = Math.max(ingenua, Math.abs(y0 - d.y)); }
    const e = esbeltez(ONDAS); assert(e <= 1.0001 && (e > 0.8 || ONDAS.every((w) => w.Q >= 0.999)), 'esbeltez ' + e); }
  defineMar(3, 0.6); assert(pior < 0.005, 'erro ' + pior); return `erro máx ${(pior * 1000).toFixed(2)} mm (aproximação 1.0.0 errava ${(ingenua * 100).toFixed(0)} cm); Σ Q·k·A = ${esbeltez(ONDAS).toFixed(2)} (cristas agudas)`;
});
t('v1.1 Arrasto quadrático + inércia por deslocamento: regime = u·vmax, pesado acelera mais devagar', () => {
  const C = CLASSES.destroier; const r = arrasto(C, 8) / arrasto(C, 4); assert(r > 3.6 && r < 4.01, 'razão ' + r);
  const vReg = (tipo, tel, seg = 240) => { const s = simLivre(); const n = s.adicionaNavio('azul', tipo, P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.telAlvo = tel; let t80 = -1; roda(s, seg, (ss, i) => { if (t80 < 0 && n.v > n.C.vmax * 0.8) t80 = i / 60; }); return { v: n.v, t80, n }; };
  const a = vReg('destroier', 4, 90), b = vReg('destroier', 2, 220), f = vReg('capitania', 4, 120);
  assert(Math.abs(a.v / CLASSES.destroier.vmax - 1) < 0.01, 'toda força ' + a.v); assert(Math.abs(b.v / (CLASSES.destroier.vmax / 3) - 1) < 0.08, '1/3 ' + b.v); assert(f.t80 > a.t80, `Fortaleza ${f.t80}s vs Tamboril ${a.t80}s`);
  return `Tamboril ${(a.v * 1.944).toFixed(1)} nós (80% em ${a.t80.toFixed(0)} s), 1/3 = ${(b.v * 1.944).toFixed(1)} nós; Fortaleza 80% em ${f.t80.toFixed(0)} s; arrasto(8)/arrasto(4) = ${r.toFixed(2)}`;
});
t('v1.1 Raio de giro cresce com a velocidade; leme fraco em baixa velocidade', () => {
  const raio = (tel) => { const s = simLivre(); const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.telAlvo = tel; roda(s, 60); n.lemeCmd = 1; roda(s, 40); return Math.abs(n.v / n.w); }; /* revisão: acelera em 12–18 s; 150 s em linha reta levava o navio às ilhas */
  const r3 = raio(2), r4 = raio(4); assert(r4 > r3 * 1.15, `R(toda) ${r4} vs R(1/3) ${r3}`); /* v1.2.1: giro ≈ ∝ velocidade — o raio cresce pouco (kR 0,4) */ assert(r3 >= raioMin(CLASSES.cruzador) * 0.98, 'abaixo do mínimo');
  const s = simLivre(); const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.telAlvo = 1; n.lemeCmd = 1; roda(s, 20); { const gs = Math.abs(n.rumo) * 57.3 / 20; assert(gs > 0.2 && gs < 3, 'giro parado (item 18: thruster de proa) fora de 0,2–3°/s: ' + gs); } /* v1.2.16 item 18: parado gira devagar pelo thruster, não pelo leme */
  return `R(1/3) = ${r3.toFixed(0)} m, R(toda força) = ${r4.toFixed(0)} m (teórico ${raioGiro(CLASSES.cruzador, CLASSES.cruzador.vmax).toFixed(0)}); parado com leme 35°: ${(n.rumo * 57.3).toFixed(1)}° em 20 s`;
});
t('v1.1 Pivô (contra-rotação): gira o navio quase no lugar quando lento', () => {
  const s = simLivre(); const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.telAlvo = 1; s.passo([{ id: 0, t: 'pivo', v: 1 }]); const x0 = n.x, z0 = n.z; roda(s, 20);
  const giro = ang(n.rumo) * 57.3, desl = Math.hypot(n.x - x0, n.z - z0); assert(giro > 20, 'giro ' + giro); assert(desl < n.C.L * 0.3, 'deslocou ' + desl);
  const s2 = simLivre(); const m = s2.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); s2.ameacas.ligadas = 0; s2.passo([{ id: 0, t: 'pivo', v: -1 }]); roda(s2, 10); assert(ang(m.rumo) < -0.1, 'BB deveria girar à esquerda');
  return `+${giro.toFixed(0)}° em 20 s deslocando só ${desl.toFixed(0)} m (L = ${n.C.L} m); pivô BB gira à esquerda`;
});
t('v1.1 Adorno centrífugo suave (lerp, sem saltos) e recuperação gradual; flutuação sem tremor', () => {
  const s = simLivre(); const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.telAlvo = 4; roda(s, 60); let ant = n.adorno, maxD = 0, pico = 0;
  n.lemeCmd = 1; roda(s, 25, () => { maxD = Math.max(maxD, Math.abs(n.adorno - ant)); ant = n.adorno; pico = Math.min(pico, n.adorno); }); const emCurva = n.adorno;
  n.lemeCmd = 0; let troca = 0; const a3 = []; roda(s, 25, (ss, i) => { maxD = Math.max(maxD, Math.abs(n.adorno - ant)); if (Math.sign(n.adorno) !== Math.sign(emCurva) && Math.abs(n.adorno) > 0.002) troca = 1; ant = n.adorno; if (i === 180) a3.push(n.adorno); });
  assert(pico < -0.02 && pico > -0.18, 'pico ' + pico); assert(maxD < 0.0015, 'salto ' + maxD); assert(!troca, 'oscilou para o outro bordo'); assert(Math.abs(a3[0]) > Math.abs(emCurva) * 0.2, 'recuperou rápido demais'); assert(Math.abs(n.adorno) < Math.abs(emCurva) * 0.15, 'não recuperou ' + n.adorno);
  defineMar(5, 0.6); const s2 = simLivre(); const m = s2.adicionaNavio('azul', 'corveta', P0.x, P0.z, 0.4); s2.ameacas.ligadas = 0; m.telAlvo = 3; const h = []; roda(s2, 30, () => h.push(m.caturro, m.balanco)); defineMar(3, 0.6);
  let d2 = 0; for (let i = 4; i < h.length; i += 2) { d2 = Math.max(d2, Math.abs(h[i] - 2 * h[i - 2] + h[i - 4]), Math.abs(h[i + 1] - 2 * h[i - 1] + h[i - 3])); } assert(d2 < 2e-4, 'tremor ' + d2);
  return `pico ${(pico * 57.3).toFixed(1)}° p/ fora, Δ máx/passo ${(maxD * 57.3).toFixed(3)}°, recupera monotônico; mar BF5: Δ² máx ${(d2 * 57.3).toFixed(4)}°/passo²`;
});
function dueloFixo(tipoA, tipoB, dist, rel = Math.PI / 2) { const s = simLivre(11); s.ameacas.ligadas = 0; const a = s.adicionaNavio('azul', tipoA, P0.x, P0.z, 0); const b = s.adicionaNavio('vermelho', tipoB, P0.x + Math.sin(rel) * dist, P0.z - Math.cos(rel) * dist, 0);
  a.telAlvo = b.telAlvo = 1; b.vida = 1e9; b.C = Object.assign({}, b.C, { vida: 1e9 }); s.sensores(); a.alvoId = b.id; a.trava = 1; a.radarAtivo = 1; for (const c of b.ciws) { c.mun = -1e9; c.t = -1e9; } b.a30.length = 0; b.samAuto = 0; return { s, a, b }; }
t('v1.1/1.2.17 AUTO-FOGO liga/desliga: canhões em intervalos no alvo travado; VLS e torpedos só manuais (item 26)', () => {
  const { s, a } = dueloFixo('cruzador', 'destroier', 4500); let ev = { tiro: 0, vls: 0, torpLanc: 0 }; const conta = () => { for (const e of s.eventos) if (e.t in ev && e.id === a.id) ev[e.t]++; s.eventos.length = 0; };
  roda(s, 10, conta); const manual = { ...ev }; assert(manual.tiro === 0 && manual.vls === 0, 'MANUAL disparou sozinho ' + JSON.stringify(manual));
  s.passo([{ id: a.id, t: 'auto', v: 1 }]); ev = { tiro: 0, vls: 0, torpLanc: 0 }; roda(s, 30, (ss, i) => { segura(ss, a); conta(); }); const auto = { ...ev }; assert(auto.tiro >= 10 && auto.vls === 0 && auto.torpLanc === 0, 'AUTO ' + JSON.stringify(auto)); /* v1.2.17 item 26: no navio do usuário o AUTO-FOGO é só dos CANHÕES — VLS e torpedos nunca saem sozinhos */
  s.passo([{ id: a.id, t: 'auto', v: 0 }]); ev = { tiro: 0, vls: 0, torpLanc: 0 }; roda(s, 12, conta); assert(ev.tiro === 0 && ev.vls === 0 && ev.torpLanc === 0, 'voltou ao manual mas disparou ' + JSON.stringify(ev));
  return `MANUAL 10 s: 0 disparos; AUTO 30 s: ${auto.tiro} granadas, ${auto.vls} mísseis, ${auto.torpLanc} torpedo(s); MANUAL de novo: 0`;
});
t('v1.1 Avanço preditivo: granada cai no alvo em movimento (erro pequeno vs sem avanço)', () => {
  const V0 = 800, h0 = 9, out = []; for (const [d, vt] of [[4000, 12], [7000, 15], [9000, 16]]) { const tx = 0, tz = -d, tvx = vt, tvz = 0; const sol = solucaoTiro(0, 0, h0, V0, tx, tz, tvx, tvz);
    let x = 0, y = h0, z = 0, vx = Math.sin(sol.az) * Math.cos(sol.el) * V0, vy = Math.sin(sol.el) * V0, vz = -Math.cos(sol.az) * Math.cos(sol.el) * V0, t = 0; const dt = 1 / 600; while (y > 0 || vy > 0) { vy -= GRAV * dt; x += vx * dt; y += vy * dt; z += vz * dt; t += dt; }
    const erro = Math.hypot(x - (tx + tvx * t), z - (tz + tvz * t)), semAvanco = vt * t; assert(erro < 12, `erro ${erro} a ${d} m`); assert(semAvanco > 60, 'cenário fraco'); out.push(`${d / 1000} km/${vt} m/s: ${erro.toFixed(1)} m (sem avanço ${semAvanco.toFixed(0)} m)`); }
  return out.join('; ');
});
t('v1.1 Torres independentes com arcos bloqueados pela superestrutura (Fortaleza B90)', () => {
  const s = simLivre(); const n = s.adicionaNavio('azul', 'capitania', P0.x, P0.z, 0); const cob = (az) => n.torres.map((_, i) => torreCobre(n, i, az) ? 1 : 0).join('');
  assert(cob(Math.PI) === '001', 'popa ' + cob(Math.PI)); assert(cob(0) === '110', 'proa ' + cob(0)); assert(cob(Math.PI / 2) === '111' && cob(-Math.PI / 2) === '111', 'través');
  const P = layoutDe(CLASSES.capitania); assert(P.torres.length === 3 && P.torres.every((t) => t.canos === 2) && P.torres[1].y > P.torres[0].y + 2, 'layout'); assert(P.torres[1].arco < P.torres[0].arco, 'torre 2 (mais perto da superestrutura) deveria ter arco menor');
  const { s: s2, a } = dueloFixo('capitania', 'destroier', 6000); s2.passo([{ id: a.id, t: 'auto', v: 1 }]); const porTorre = [0, 0, 0]; roda(s2, 20, (ss) => { segura(ss, a); for (const e of ss.eventos) if (e.t === 'tiro' && e.id === a.id) porTorre[e.torre]++; ss.eventos.length = 0; });
  assert(porTorre.every((k) => k >= 2), 'nem todas as torres dispararam ' + porTorre);
  return `arcos ${P.torres.map((t) => (t.arco * 57.3).toFixed(0) + '°').join('/')} (meio-arco); proa ${cob(0)}, popa ${cob(Math.PI)}, través ${cob(Math.PI / 2)}; alvo no través: granadas por torre ${porTorre.join('/')}`;
});
t('v1.1 Classes: Tamboril D52 / Atlântico C60 / Fortaleza B90 com o armamento pedido', () => {
  const T = CLASSES.destroier, A = CLASSES.cruzador, F = CLASSES.capitania; const kn = (C) => Math.round((C.vmax0 || C.vmax) * 1.9438); /* v1.2.8: nós NOMINAIS da ficha (a velocidade de jogo é ×1,17) */
  assert(T.classe === 'Classe Tamboril' && T.num === 'D 52' && kn(T) === 32 && T.canhao.cal === 76 && T.canhao.torres === 1 && T.vls === 4 && layoutDe(T).tubos.length === 2 && T.ciws === 1, 'Tamboril');
  const PA = layoutDe(A); assert(A.classe === 'Classe Atlântico' && A.num === 'C 60' && kn(A) === 28 && A.canhao.torres === 2 && A.vls + A.sam === 16 && PA.tubos.length === 4 && PA.tubos.filter((q) => q.lado < 0).length === 2 && A.ciws === 2 && PA.ciws[1].z > PA.ciws[0].z, 'Atlântico');
  assert(F.classe === 'Classe Fortaleza' && F.num === 'B 90' && kn(F) === 22 && F.canhao.cal === 152 && F.canhao.torres === 3 && F.canhao.canos === 2 && F.salva >= 4 && F.ciws === 4 && F.blind > 1.5, 'Fortaleza');
  return `${kn(T)}/${kn(A)}/${kn(F)} nós; Tamboril 76 mm + 4 VLS + 2 tubos + 1 CIWS; Atlântico 2×127 + 8 VLS + 8 SAM + 4 tubos + 2 CIWS; Fortaleza 3×2×152 + salva ${F.salva} + 4 CIWS`;
});
t('v1.2 CIWS: esfera de 1200 m, 4500 tpm, abate depende da distância e do tempo de engajamento', () => {
  assert(CIWS.alc === 1200 && CIWS.rpm === 4500 && CIWS_ALC === 1200, 'parâmetros'); assert(probCiws('m', 300, 1) > probCiws('m', 1100, 1) && probCiws('m', 500, 1) > probCiws('m', 500, 0.3), 'curva');
  const s = simLivre(); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); n.a30.length = 0; const q = s.drones[0]; Object.assign(q, { ativo: 1, x: P0.x + 1500 * Math.sin(1.0), y: 110, z: P0.z - 1500 * Math.cos(1.0), vx: -52 * Math.sin(1.0), vz: 52 * Math.cos(1.0), /* v1.2.19 item 5: setor livre da máscara (57° da proa) */ vy: 0, dono: -1, time: 'vermelho', alvo: n.id, t: 0, mergulho: 0 });
  const m0 = n.ciws[0].mun; let primeiro = 0; roda(s, 30, () => { if (!primeiro && n.ciws[0].fogo) { const pc = n.P.ciws[0], o = s.mundo(n, pc.x, pc.y, pc.z, {}); primeiro = Math.hypot(q.x - o.x, q.y - o.y, q.z - o.z); } /* v1.2.19: medido do pivô do CIWS */ }); const gasto = m0 - n.ciws[0].mun;
  assert(primeiro > 0 && primeiro <= 1205, 'abriu fogo a ' + primeiro); assert(!q.ativo, 'drone não abatido'); 
  const s2 = simLivre(); const n2 = s2.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const c = n2.ciws[0]; c.fogo = 0; const m1 = c.mun; for (let i = 0; i < 60; i++) { c.fogo = 1; c.mun -= (CIWS.rpm / 60) * DT; } assert(Math.abs(m1 - c.mun - 75) < 0.5, 'cadência');
  return `abriu fogo no drone a ${primeiro.toFixed(0)} m, abateu; ${gasto.toFixed(0)} tiros gastos; 75 tiros/s; P(abate) 300 m ≫ 900 m`;
});
t('v1.1 SAM de defesa de frota: lança só com o míssil a ≤ 3 km, intercepta com probabilidade e protege aliados a ≤ 1500 m', () => {
  let lanc = 0, abates = 0, dLanc = 0; const N = 24;
  for (let k = 0; k < N; k++) { const s = simLivre(100 + k); s.ameacas.ligadas = 0; const def = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const atk = s.adicionaNavio('vermelho', 'destroier', P0.x + 9000, P0.z, 0); for (const c of def.ciws) { c.mun = -1e9; c.t = -1e9; } def.a30.length = 0; atk.samAuto = 0; atk.chaff = 0;
    s.sensores(); atk.alvoId = def.id; atk.trava = 1; atk.travaMis = 1; atk._tmAlvo = def.id; /* v1.2.17 item 17 */ s.lancaMissil(atk, def.id, 1); let ok = 0; roda(s, 50, (ss) => { for (const e of ss.eventos) { if (e.t === 'samLanc' && !ok) { ok = 1; lanc++; const m = ss.misseis.find((q) => q.ativo); if (m) dLanc = Math.max(dLanc, Math.hypot(m.x - def.x, m.y, m.z - def.z)); } if (e.t === 'samAbate') abates++; } ss.eventos.length = 0; }); }
  const p = abates / N; assert(lanc === N, 'lançou ' + lanc); assert(dLanc <= 3000 * 1.7 + 50, 'lançou a ' + dLanc); /* v1.2.5: engaja míssil a até 5,1 km */ assert(p > 0.05 && p < 0.6, 'P(intercepto) ' + p); /* v1.2.5: pk do SAM ×0,3 contra míssil */
  const prot = (dist) => { const s = simLivre(7); s.ameacas.ligadas = 0; const esc = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const ali = s.adicionaNavio('azul', 'corveta', P0.x, P0.z + dist, 0); const atk = s.adicionaNavio('vermelho', 'destroier', P0.x + 8000, P0.z + dist, 0); for (const c of [...esc.ciws, ...ali.ciws]) { c.mun = -1e9; c.t = -1e9; } esc.a30.length = 0; ali.a30.length = 0; atk.samAuto = 0;
    s.sensores(); atk.alvoId = ali.id; atk.trava = 1; atk.travaMis = 1; atk._tmAlvo = ali.id; /* v1.2.17 item 17 */ s.lancaMissil(atk, ali.id, 1); let l = 0; roda(s, 40, (ss) => { for (const e of ss.eventos) if (e.t === 'samLanc' && e.id === esc.id) l = 1; ss.eventos.length = 0; }); return l; };
  assert(prot(1000) === 1, 'não protegeu aliado a 1 km'); assert(prot(2600) === 0, 'protegeu aliado a 2,6 km');
  return `${lanc}/${N} lançamentos (míssil a ≤ ${dLanc.toFixed(0)} m), ${abates}/${N} interceptados (${Math.round(p * 100)}%); protege aliado a 1 km, não a 2,6 km`;
});
t('v1.1 30 mm: engaja lanchas e torpedos até 1500 m (não além), afunda a lancha', () => {
  const caso = (dist, tipo) => { const s = simLivre(3); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'capitania', P0.x, P0.z, 0); for (const c of n.ciws) { c.mun = -1e9; c.t = -1e9; } let alvo;
    if (tipo === 'l') { alvo = s.lanchas[0]; Object.assign(alvo, { ativo: 1, x: P0.x + dist, z: P0.z, rumo: 0, v: 0, vida: 40, dono: -1, time: 'vermelho', alvo: -1, t: 0, torp: 0, fogo: 0, tTorp: 0, orbita: 1 }); }
    else { alvo = s.torpedos[0]; Object.assign(alvo, { ativo: 1, x: P0.x + dist, z: P0.z, rumo: -Math.PI / 2, rumoAlvo: -Math.PI / 2, v: 0, dono: 0, time: 'vermelho', alvo: -1, corrida: 0, modo: 'reto', t: 0, buscando: 0 }); }
    let fogo = 0; for (let i = 0; i < 60 * 25; i++) { if (alvo.ativo) { if (tipo === 'l') { alvo.v = 0; alvo.x = P0.x + dist; alvo.z = P0.z; } else { alvo.v = 0; alvo.corrida = 0; alvo.x = P0.x + dist; alvo.z = P0.z; } } s.passo(); s.eventos.length = 0; if (n.a30.some((a) => a.fogo)) fogo = 1; } return { fogo, morto: !alvo.ativo }; };
  const l1 = caso(1300, 'l'), l2 = caso(1750, 'l'), t1 = caso(1200, 't'), t2 = caso(1700, 't'); assert(l1.fogo && l1.morto, 'lancha a 1,3 km'); assert(!l2.fogo, 'atirou a 1,75 km'); assert(t1.fogo, 'não atirou no torpedo a 1,2 km'); assert(!t2.fogo, 'atirou em torpedo a 1,7 km');
  assert(pA30('t', 400, 5) > pA30('t', 1300, 5), 'curva');
  return `lancha a 1,3 km afundada; 1,75 km ignorada; torpedo a 1,2 km engajado (P em 5 s: ${(pA30('t', 1200, 5) * 100).toFixed(0)}% a 1,2 km, ${(pA30('t', 400, 5) * 100).toFixed(0)}% a 400 m)`;
});
t('v1.1 Pools estáticos (granadas, mísseis, torpedos, iscas, SAMs, drones, lanchas) nunca excedidos em 5x5 de 400 s', () => {
  const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'capitania', seed: 77 }); const sim = S.sim; sim.passo([{ id: S.jogador.id, t: 'auto', v: 1 }]);
  const nomes = ['granadas', 'misseis', 'torpedos', 'iscas', 'sams', 'drones', 'lanchas']; const refs = nomes.map((k) => sim[k]); const ini = refs.map((r) => r.slice()); const pico = nomes.map(() => 0); const vistos = new Set();
  for (let i = 0; i < 400 * 60 && !sim.fim; i++) { sim.passo(S.net.coletar(sim.tick + 1)); for (const e of sim.eventos) vistos.add(e.t); sim.eventos.length = 0; if (i % 10 === 0) refs.forEach((r, k) => { let a = 0; for (const q of r) if (q.ativo) a++; pico[k] = Math.max(pico[k], a); }); }
  refs.forEach((r, k) => { assert(r.length === POOL[nomes[k]], 'tamanho ' + nomes[k]); assert(r.every((q, i) => q === ini[k][i]), 'objeto trocado ' + nomes[k]); });
  for (const e of ['samLanc', 'droneLanc', 'lanchaLanc', 'salva']) assert(vistos.has(e), 'não aconteceu: ' + e);
  return nomes.map((k, i) => `${k} ${pico[i]}/${POOL[k]}`).join(', ');
});

// ======================= v1.2.0 =======================
import { trajetoria, alcanceMax, arrastoCal, solucaoArrasto } from '../src/naval5v5/balistica.js';
import { EST } from '../src/naval5v5/aereo.js';
import { Economia, modsDe, recompensa, DEV_ECONOMY, PRECO } from '../src/navalTechTreeEconomy.js';
/* v1.2.11: o MODO DESENVOLVEDOR (todos os navios liberados) vem ligado no app; os testes de economia rodam com ele desligado, e um teste próprio verifica o modo */
const _devOrig = Economia.prototype.dev; Economia.prototype.dev = function () { return globalThis.__DEV_TESTE ? _devOrig.call(this) : false; };
t('v1.2.11 Comandantes: removíveis; 1 por navio; o mesmo comandante nunca em 2 navios', () => { const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] || null, setItem: (k, v) => (mem[k] = v), removeItem: (k) => delete mem[k] }; const E = new Economia(new Save());
  E.e.comandantes = { a: { id: 'a', nivel: 1, xp: 0 }, b: { id: 'b', nivel: 1, xp: 0 } }; E.e.cmdNavio = {}; E.designar('fragata', 'a'); E.designar('cruzador', 'a'); assert(!E.comandanteDe('fragata') && E.comandanteDe('cruzador').id === 'a', 'transferência');
  E.designar('cruzador', 'b'); assert(E.comandanteDe('cruzador').id === 'b' && E.navioDoComandante('a') === null, '1 por navio'); E.designar('fragata', 'a'); E.designar('cruzador', ''); assert(!E.comandanteDe('cruzador') && E.comandanteDe('fragata').id === 'a', 'remoção');
  const vals = Object.values(E.e.cmdNavio); assert(new Set(vals).size === vals.length, 'duplicado'); return 'transferir, trocar e remover ok'; });
t('v1.2.11 Modo desenvolvedor: todos os navios (inclusive lendários e porta-aviões) liberados; desligado volta ao normal', () => { const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] || null, setItem: (k, v) => (mem[k] = v), removeItem: (k) => delete mem[k] }; const sv = new Save(); globalThis.__DEV_TESTE = 1; const E = new Economia(sv);
  assert(sv.ajustes.dev === true, 'padrão'); const tot = ORDEM_CLASSES.filter((k) => E.possui(k)).length; assert(tot === ORDEM_CLASSES.length, 'liberados ' + tot); sv.ajustes.dev = false; const tf = ORDEM_CLASSES.filter((k) => E.possui(k)).length; assert(tf < 10, 'desligado ' + tf); globalThis.__DEV_TESTE = 0; return `${tot}/${ORDEM_CLASSES.length} liberados; desligado: ${tf}`; });
import { COMANDANTES, xpPara } from '../src/navalComandantes.js';
t('v1.2 Balística com arrasto: tempo de voo maior que no vácuo, alcance máximo cobre o alcance de jogo, solução preditiva acerta o alvo móvel', () => {
  const out = []; for (const id of ['corveta', 'destroier', 'tridente', 'capitania']) { const A = CLASSES[id].canhao, k = arrastoCal(A.cal); assert(alcanceMax(A.V0, k) > A.alc, id + ' alcance');
    const sol = solucaoArrasto(0, 0, 10, A.V0, k, 0, -6000, 12, 0, {}); const r = trajetoria(sol.el, 10, A.V0, k); const tv0 = 6000 / (A.V0 * Math.cos(sol.el)); assert(r.vf < A.V0 * 0.995, id + ' sem arrasto perceptível (' + Math.round(r.vf) + '/' + A.V0 + ')'); // v1.2.0 revisão: velocidade de jogo alta (armasParametros), arrasto pequeno mas presente
    // integra no Sim e mede o erro do ponto de queda contra o alvo móvel
    out.push(`${A.cal} mm: ${r.t.toFixed(1)} s a 6 km (vácuo ${tv0.toFixed(1)} s), vel. final ${Math.round(r.vf)} m/s`); }
  const s = simLivre(3); s.ameacas.ligadas = 0; const a = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, Math.PI / 2); const b = s.adicionaNavio('vermelho', 'fragata', P0.x + 5000, P0.z, 0); b.telAlvo = 4; a.ciws.length = 0; b.ciws.length = 0;
  roda(s, 40); s.sensores(); s.aplica({ id: a.id, t: 'travar', alvo: b.id }); roda(s, 2); const sol = s.pontaria(a); const g = s.granadas[0]; Object.assign(g, { ativo: 1, x: a._o.x, y: Math.max(2, a._o.y), z: a._o.z, vx: Math.sin(sol.az) * Math.cos(sol.el) * a.C.canhao.V0, vy: Math.sin(sol.el) * a.C.canhao.V0, vz: -Math.cos(sol.az) * Math.cos(sol.el) * a.C.canhao.V0, dono: a.id, time: 'azul', dano: 0, cal: 127, t: 0, k: s.kArrasto(a) });
  let fim = null; for (let i = 0; i < 60 * 40 && g.ativo; i++) { s.passo(); for (const e of s.eventos) if ((e.t === 'impacto' || e.t === 'agua') && !fim) fim = e; s.eventos.length = 0; }
  const err = fim ? Math.hypot(fim.x - b.x, fim.z - b.z) : 1e9; const lat = fim ? Math.abs(fim.z - b.z) : 1e9; /* trajetória quase plana (v1.2 vídeo): o avanço (lateral) é o que a solução preditiva garante; o longitudinal varia com a arfagem */ assert(lat < b.C.L * 0.6 && err < 450, 'erro ' + err.toFixed(0) + ' lateral ' + lat.toFixed(0)); out.push(`queda a ${err.toFixed(0)} m do centro do alvo a 5 km/30 nós (${fim.t})`); return out.join('; '); });
t('v1.2 Avarias: torpedo alaga e aderna, fogo é dano contínuo, reparo apaga/estanca, módulo inoperante se recupera', () => {
  const s = simLivre(8); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const v0 = n.vida;
  s.dano(n, 40, null, 'teste'); const hit = { lx: n.C.B / 2, ly: -3, lz: 0 }; s.rng.next = () => 0.01; /* força os sorteios */
  const R = s.rng; R.gauss = () => 0; import('../src/naval5v5/avarias.js'); n.alagamento = 30; n.aguaAbordo = 0.5; n.alagSide = 1; n.incendio = 20; const v1 = n.vida; roda(s, 10); assert(n.vida < v1 - 5, 'DoT'); assert(n.lista > 0.02, 'lista ' + n.lista);
  n.avaria.motor = 0; roda(s, 1); const vm = n.C.vmax; assert(vm < n.Cb.vmax * 0.6, 'motor'); s.aplica({ id: n.id, t: 'reparo' }); roda(s, 0.1); assert(n.incendio <= 0 && n.alagamento <= 0 && n.avaria.motor >= 0.6, 'reparo'); assert(n.reparo.usos === n.reparo.usosMax - 1, 'usos');
  return `lista ${(n.lista * 57.3).toFixed(1)}° com água a bordo; motor fora → vmax ${(vm / n.Cb.vmax * 100).toFixed(0)}%; reparo: fogo/alagamento 0, motor ${(n.avaria.motor * 100).toFixed(0)}%`; });
t('v1.2 Afundamento: explosão secundária, adernamento/caimento progressivos e o navio some sob a água', () => {
  const out = []; for (const [lx, lz, modo] of [[8, 0, 'adorno'], [0, -60, 'proa'], [0, 70, 'popa']]) { const s = simLivre(9); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); n.ultHit = { lx, lz, como: 'canhao' }; s.dano(n, 1e9, null, 'teste');
    let sec = 0, modoE = ''; const perfil = []; for (let i = 0; i < 60 * 60 && !n.submerso; i++) { s.passo(); for (const e of s.eventos) { if (e.t === 'secundaria') sec = s.t; if (e.t === 'afundaModo') modoE = e.modo; } s.eventos.length = 0; if (i % 600 === 0) perfil.push(n.arfagem.toFixed(1)); }
    assert(sec > 0 && n.submerso && modoE === modo, `${modo}: sec ${sec} sub ${n.submerso} modo ${modoE}`); out.push(`${modo} (secundária ${sec.toFixed(1)} s, submerso em ${n.tMorto.toFixed(0)} s, lista ${(n.lista * 57.3).toFixed(0)}°, caimento ${(n.trimDano * 57.3).toFixed(0)}°)`); }
  return out.join('; '); });
t('v1.2 Helicóptero: decola, IA patrulha e ataca, volta, pousa e rearma; jogador assume (IA assume o navio) e devolve', () => {
  const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 21, jogadorOpc: { helis: ['multi', 'asw'] } }); const sim = S.sim; const eu = S.jogador; assert(eu.helis.length === 2, 'hangares');
  const h = sim.helis[eu.helis[0]]; assert(h.estado === EST.CONVOO, 'convoo'); sim.aplica({ id: eu.id, t: 'controle', k: 0 }); assert(eu.controleIA === 1 && h.ctrl === 'jog', 'assumir'); const estados = new Set();
  for (let i = 0; i < 60 * 16; i++) { sim.aplica({ id: eu.id, t: 'heliCtrl', k: 0, jx: 0, jy: 1, alt: 80 }); sim.passo(S.net.coletar(sim.tick + 1)); sim.eventos.length = 0; estados.add(h.estado); }
  assert(h.y > 40 && Math.hypot(h.x - eu.x, h.z - eu.z) > 100, 'não voou'); sim.aplica({ id: eu.id, t: 'controle', k: -1 }); assert(eu.controleIA === 0 && h.ctrl === 'ia', 'devolver');
  const ev = {}; for (let i = 0; i < 60 * 400 && !sim.fim; i++) { sim.passo(S.net.coletar(sim.tick + 1)); for (const e of sim.eventos) ev[e.t] = (ev[e.t] || 0) + 1; sim.eventos.length = 0; estados.add(h.estado); }
  assert(estados.has(EST.RETORNO) || estados.has(EST.ABATIDO), 'não voltou/abatido'); assert(ev.heliDecola >= 2, 'bots não usam helicóptero');
  return `estados: ${[...estados].sort().join(',')}; decolagens ${ev.heliDecola}, pousos ${ev.heliPousa || 0}, mísseis ${ev.heliMissil || 0}, torpedos ${ev.heliTorpedo || 0}, foguetes ${ev.heliFoguete || 0}, abatidos ${ev.heliAbatido || 0}`; });
t('v1.2 VANT: sobe a ~100 m, orbita e revela navio escondido atrás de ilha (data-link no radar da frota)', () => {
  const T = criaArena('fiordes'); const s = new Sim({ arena: T, seed: 3 }); s.ameacas.ligadas = 0; let par = null;
  for (let k = 0; k < 4000 && !par; k++) { const x = (s.rng.next() - 0.5) * T.tam * 0.7, z = (s.rng.next() - 0.5) * T.tam * 0.7, a = s.rng.next() * 6.28, d = 2500 + s.rng.next() * 2000; const x2 = x + Math.sin(a) * d, z2 = z - Math.cos(a) * d;
    if (alturaTerreno(T, x, z) < -15 && alturaTerreno(T, x2, z2) < -15) { let alto = 0; for (let f = 0.2; f < 0.8; f += 0.05) alto = Math.max(alto, alturaTerreno(T, x + (x2 - x) * f, z + (z2 - z) * f)); if (alto > 120 && alto < 300) par = [x, z, x2, z2, a]; } }
  assert(par, 'sem geometria de teste'); s.visual = 9000; const a = s.adicionaNavio('azul', 'fragata', par[0], par[1], par[4]); const b = s.adicionaNavio('vermelho', 'fragata', par[2], par[3], 0); a.radarAtivo = 1; b.radarAtivo = 0; s.sensores(); assert(!s.contatoAtual('azul', b.id), 'já via');
  s.aplica({ id: a.id, t: 'uav' }); let visto = 0, ymax = 0; for (let i = 0; i < 60 * 120 && !visto; i++) { s.passo(); s.eventos.length = 0; const u = s.uavs[a.uav]; if (u) ymax = Math.max(ymax, u.y); if (s.contatoAtual('azul', b.id)) visto = s.t; }
  assert(visto, 'VANT não revelou'); return `revelado em ${visto.toFixed(0)} s (ilha entre os navios), altitude ${ymax.toFixed(0)} m`; });
t('v1.2 Economia: DEV_ECONOMY, pesquisa→compra em prata, premium em ouro, saldo nunca negativo, lotes abastecidos e devolvidos ao paiol', () => {
  const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] || null, setItem: (k, v) => (mem[k] = v), removeItem: (k) => delete mem[k] }; const sv = new Save(); const E = new Economia(sv);
  assert(E.prata === DEV_ECONOMY.prata && E.ouro === DEV_ECONOMY.ouro, 'reserva'); assert(!E.comprar('tridente').ok, 'comprou sem pesquisar'); assert(E.converterPesquisa(200000), 'conv');
  for (const k of ['sentinela', 'tempestade', 'tridente', 'cruzador']) { if (!E.pesquisado(k)) { const r = E.pesquisar(k); assert(r.ok || E.pesquisado(k), 'pesquisar ' + k + ' ' + r.motivo); } }
  const p0 = E.prata; assert(E.comprar('tridente').ok && E.prata === p0 - PRECO.tridente.prata, 'compra prata'); const o0 = E.ouro; assert(E.comprar('aurora').ok && E.ouro === o0 - PRECO.aurora.ouro, 'compra ouro');
  assert(E.contratar('c04').ok && E.designar('tridente', 'c04'), 'comandante'); E.e.loadout = { municao: 'ap', missil: 'tandem', isca: 'ouro', consumivel: 'reparo_ouro' }; const oL = E.ouro; const m = E.prepararPartida('tridente'); assert(m.municao === 'ap' && m.iscaEf.pIsca === 0.95 && m.vlsMais >= 1, 'loadout'); assert(E.ouro < oL, 'não cobrou lotes');
  const g = E.creditar({ vitoria: false, vidaFinal: 0, stats: { dano: 0, abates: 0 }, devolver: ['tandem'] }, 'tridente'); assert(E.e.lotes.tandem === 1, 'devolução'); assert(E.prata >= 0, 'negativo');
  E.e.prata = 10; E.creditar({ vitoria: false, vidaFinal: 0, stats: {} }, 'capitania'); assert(E.prata >= 0, 'saldo negativo após reparo');
  const c = E.comandanteDe('tridente'); c.xp = xpPara(1) - 1; E.creditar({ vitoria: true, vidaFinal: 0.5, stats: { dano: 300, abates: 2 } }, 'tridente'); assert(c.nivel >= 2, 'XP/nível');
  const rc = recompensa({ vitoria: true, stats: { dano: 100, abates: 1 } }, 'corveta').prata, rf = recompensa({ vitoria: true, stats: { dano: 100, abates: 1 } }, 'fragata').prata, rd = recompensa({ vitoria: true, stats: { dano: 100, abates: 1 } }, 'destroier').prata, rcr = recompensa({ vitoria: true, stats: { dano: 100, abates: 1 } }, 'cruzador').prata, rp = recompensa({ vitoria: true, stats: { dano: 100, abates: 1 } }, 'aurora').prata;
  assert(rc < rf && rf < rd && rd < rcr && rcr < rp, 'ganho por tipo'); return `prata por batalha: corveta ${rc} < fragata ${rf} < contratorpedeiro ${rd} < cruzador ${rcr} < premium ${rp}; comandante nível ${c.nivel}; lote devolvido`; });
t('v1.2 Partidas completas headless em todos os mapas (5x5 até o fim): sem NaN, pools ok, afundamentos, helicópteros e VANT', () => { const out = [];
  for (const mapa of ORDEM_MAPAS) { const S = criaSessao({ mapa, modo: 'frota', classe: ORDEM_CLASSES[(mapa.length * 3) % ORDEM_CLASSES.length], seed: 77 + mapa.length }); const sim = S.sim; const ev = {}; let nan = 0;
    for (let i = 0; i < 620 * 60 && !sim.fim; i++) { sim.passo(S.net.coletar(sim.tick + 1)); for (const e of sim.eventos) ev[e.t] = (ev[e.t] || 0) + 1; sim.eventos.length = 0; if (i % 120 === 0) for (const n of sim.navios) if (!Number.isFinite(n.x + n.z + n.v + n.vida + n.arfagem + n.lista + n.trimDano)) nan++; }
    assert(!nan, mapa + ' NaN'); assert(sim.fim, mapa + ' sem fim'); assert((ev.afunda || 0) >= 1 && (ev.heliDecola || 0) >= 1, mapa + ' eventos ' + JSON.stringify(ev)); out.push(`${mapa} ${Math.round(sim.t)} s, ${ev.afunda} afundados`); }
  return out.join('; '); });
t('v1.2 Partida completa com CADA navio jogável (todas as classes × mapas em rodízio): sem NaN, economia consistente (nunca negativa, lotes devolvidos), helicópteros/VANT e afundamentos', () => { const out = []; const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] || null, setItem: (k, v) => (mem[k] = v), removeItem: (k) => delete mem[k] }; const E = new Economia(new Save());
  ORDEM_CLASSES.forEach((k, i) => { const mapa = ORDEM_MAPAS[i % ORDEM_MAPAS.length]; const mods = E.prepararPartida(k); const S = criaSessao({ mapa, modo: 'frota', classe: k, seed: 300 + i * 17, jogadorOpc: { comandante: 'Cap. Amorim', mods } }); const sim = S.sim, eu = S.jogador; let nan = 0; const ev = {};
    S.comando({ t: 'auto', v: 1 }); S.comando({ t: 'telegrafo', v: 3 }); S.comando({ t: 'sam', v: 1 }); S.comando({ t: 'uav' }); if (eu.helis && eu.helis.length) S.comando({ t: 'controle', k: 0 });
    for (let j = 0; j < 620 * 60 && !sim.fim; j++) { if (j === 600 && eu.helis && eu.helis.length) S.comando({ t: 'controle', k: -1 }); sim.passo(S.net.coletar(sim.tick + 1)); for (const e of sim.eventos) ev[e.t] = (ev[e.t] || 0) + 1; sim.eventos.length = 0; if (j % 120 === 0) { for (const n of sim.navios) if (!Number.isFinite(n.x + n.z + n.v + n.vida + n.arfagem + n.lista + n.trimDano)) nan++; for (const h of sim.helis) if (h.ativo && !Number.isFinite(h.x + h.y + h.z)) nan++; } }
    assert(!nan, k + ' NaN'); assert(sim.fim, k + ' sem fim'); const p0 = E.prata, o0 = E.ouro;
    const g = E.creditar({ vitoria: sim.fim.vencedor == null ? null : sim.fim.vencedor === eu.time, vidaFinal: eu.vida / eu.C.vida, stats: eu.stats, devolver: eu.stats.tiros ? [] : ['ap'], lotesUsados: mods.lotesUsados || [] }, k);
    assert(E.prata >= 0 && E.ouro >= 0 && Number.isFinite(E.prata + E.ouro), k + ' saldo'); assert(g.prata >= 0 && g.prata < 3e6 && Number.isFinite(g.liquido), k + ' ganho ' + g.prata); assert(E.prata === p0 + g.liquido || E.prata === 0, k + ' contabilidade ' + p0 + '+' + g.liquido + '≠' + E.prata);
    out.push(`${k}@${mapa} ${Math.round(sim.t)}s ${sim.fim.vencedor || 'empate'} +${g.liquido} prata, ${ev.afunda || 0} afund., heli ${ev.heliDecola || 0}, vant ${ev.uavLanc || 0}`); });
  return out.join('; '); });
// ---------- revisão 1.2.0 ----------
const { REF_PREMIUM, razaoPoder, POR_NACAO } = await import('../src/sim/classes.js');
const { PINTURAS, LOTE_CAP } = await import('../src/navalTechTreeEconomy.js');
const { desenhaBandeira, TODAS, ESTADOS, SINAIS } = await import('../src/render/bandeiras.js');
const memLS = () => { const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] || null, setItem: (k, v) => (mem[k] = v), removeItem: (k) => delete mem[k] }; return mem; };
t('Revisão: DEV_ECONOMY 100.000.000 prata / 1.000.000 ouro; save antigo com devAplicado sobe ao novo mínimo; "Recarregar saldo (dev)" volta exatamente a esses valores', () => {
  assert(DEV_ECONOMY.prata === 100_000_000 && DEV_ECONOMY.ouro === 1_000_000, 'valores DEV');
  memLS(); const sv = new Save(); sv.d.economia = { prata: 10_000_000, ouro: 100_000, devAplicado: 1 }; const E = new Economia(sv); assert(E.prata === 100_000_000 && E.ouro === 1_000_000, `migração ${E.prata}/${E.ouro}`);
  E.e.prata = 123; E.e.ouro = 4; assert(E.recarregarDev() && E.prata === 100_000_000 && E.ouro === 1_000_000, 'recarga');
  const sv2 = new Save(); sv2.d.economia = { prata: 250_000_000, ouro: 2_000_000, devAplicado: 1, devVersao: 2 }; const E2 = new Economia(sv2); assert(E2.prata === 250_000_000, 'não reduz saldo maior');
  return 'save 10M/100k → 100M/1M; recarga 123/4 → 100M/1M'; });
t('Revisão: 5+ projetos por nação (EUA, CHN, RUS, UK, BRA), cada um com bandeira, nome original, preço e caminho na árvore; bots usam todos', () => {
  const P = POR_NACAO(); const out = [];
  for (const n of ['EUA', 'CHN', 'RUS', 'UK', 'BRA']) { assert((P[n] || []).length >= 5, n + ' tem ' + (P[n] || []).length); for (const k of P[n]) { const C = CLASSES[k]; assert(C.nomeOriginal && C.nacao === n && PRECO[k], k + ' incompleto'); } out.push(`${n} ${P[n].length}`); }
  return out.join(', ') + ' — ex.: ' + ['kestrel', 'tianlong', 'sokol', 'thornwood'].map((k) => CLASSES[k].nomeOriginal).join(' · '); });
t('Revisão: razão de poder premium ÷ equivalente de prata entre 1,15 e 1,25 (mesmo tier) (índice de poder: casco, fogo/min, mísseis, defesa, velocidade)', () => {
  const out = []; for (const k of ORDEM_CLASSES.filter((q) => CLASSES[q].premium && !CLASSES[q].lendario)) { const ref = REF_PREMIUM[k]; /* v1.2.11: lendários ficam FORA da faixa +15–25% (ultra-poderosos de propósito) */ assert(ref && CLASSES[ref].tier === CLASSES[k].tier, k + ' sem referência'); const r = razaoPoder(CLASSES[k], CLASSES[ref]); assert(!CLASSES[ref].premium && PRECO[ref].prata != null, `${k}: referência ${ref} não é navio de prata`); assert(r >= 1.15 && r <= 1.25, `${k} razão ${r}`); out.push(`${k} vs ${ref} razão ${r.toFixed(3)} +${Math.round((r - 1) * 100)}%`); }
  return out.join('; '); });
t('Revisão: premium em OURO em todos os tiers (I, II, III) e nas 5 nações, com destróier/cruzador premium de hangar duplo, e bots usando premium às vezes', () => {
  const P = ORDEM_CLASSES.filter((k) => CLASSES[k].premium); const tiers = new Set(P.map((k) => CLASSES[k].tier)), nac = new Set(P.map((k) => CLASSES[k].nacao));
  assert([1, 2, 3].every((t2) => tiers.has(t2)), 'tiers ' + [...tiers]); assert(['EUA', 'CHN', 'RUS', 'UK', 'BRA'].every((n) => nac.has(n)), 'nações ' + [...nac]);
  assert(P.every((k) => PRECO[k].ouro > 0 && !PRECO[k].prata), 'premium sem preço em ouro'); const h2 = P.filter((k) => CLASSES[k].heli >= 2 && CLASSES[k].tier === 3); assert(h2.length >= 1, 'sem premium com 2 helis');
  let bots = 0, prem = 0; for (let seed = 1; seed <= 30; seed++) { const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed }); for (const n of S.sim.navios) if (n !== S.jogador) { bots++; if (n.C.premium) prem++; } }
  assert(prem > 0 && prem < bots * 0.5, `bots premium ${prem}/${bots}`);
  return `${P.length} premium: ${P.map((k) => `${CLASSES[k].nome} (${CLASSES[k].nacao} T${CLASSES[k].tier}${CLASSES[k].heli ? `, ${CLASSES[k].heli} heli` : ''}, ${PRECO[k].ouro} ouro)`).join('; ')} · bots premium em 30 partidas: ${prem}/${bots}`; });
t('Revisão: camuflagens nacionais (BRA, DEU, RUS, EUA, UK, CHN) e camuflagens ouro aumentam o HP real do navio na simulação', () => {
  for (const n of ['BRA', 'DEU', 'RUS', 'EUA', 'UK', 'CHN']) assert(Object.values(PINTURAS).some((P) => P.nac === n && !P.fabrica), 'sem nacional ' + n);
  const ouros = Object.entries(PINTURAS).filter(([, P]) => P.ouro && !P.lendaria && !P.heroica) /* v1.2.16: heroicas +25% todos; v1.2.15: lendárias têm bônus próprio (+50% todos) */; assert(ouros.every(([, P]) => P.hp > 0), 'ouro sem hp');
  const m = modsDe('fragata', { pintura: 'couraca_ouro' }); const s = simLivre(); const a = s.adicionaNavio('azul', 'fragata', 0, 0, 0, 'jogador', { mods: m }); const b = s.adicionaNavio('azul', 'fragata', 300, 0, 0);
  assert(a.C.vida === Math.round(b.C.vida * 1.12) && a.vida === a.C.vida, `vida ${a.C.vida} vs ${b.C.vida}`);
  return ouros.map(([k, P]) => `${k} +${Math.round(P.hp * 100)}%`).join(', ') + `; fragata ${b.C.vida} → ${a.C.vida} HP`; });
t('Pinturas: bônus de HP por faixa (comuns +3–5%, nacionais +6–8%, ouro +10–12%) chega ao HP da partida', () => {
  const faixa = { comum: [], nac: [], ouro: [] };
  for (const [k, P] of Object.entries(PINTURAS)) { if (P.fabrica || k === 'cinza_naval') { assert(!P.hp, k + ' (padrão/fábrica) não deveria ter hp'); continue; } if (P.heroica) { const m0 = modsDe('fragata', {}), m1 = modsDe('fragata', { pintura: k }); assert(Math.abs(m1.vida / (m0.vida || 1) - 1.25) < 0.02, k + ' heroica não dá +25%: ' + m1.vida / (m0.vida || 1)); continue; } if (P.lendaria) { const m0 = modsDe('fragata', {}), m1 = modsDe('fragata', { pintura: k }); assert(Math.abs(m1.vida / (m0.vida || 1) - 1.5) < 1e-6 && Math.abs(m1.vmax / m0.vmax - 1.5) < 1e-6 && m1.lendaria === 1, k + ' lendária não dá +50%'); continue; }
    const f = P.ouro ? 'ouro' : /^nac_/.test(k) ? 'nac' : 'comum'; const [a, b] = { comum: [0.03, 0.05], nac: [0.06, 0.08], ouro: [0.10, 0.12] }[f]; assert(P.hp >= a - 1e-9 && P.hp <= b + 1e-9, `${k} hp ${P.hp} fora de ${a}–${b}`); faixa[f].push(k); }
  assert(PINTURAS.aurora_ouro.hp >= 0.10 && PINTURAS.neon_tech.hp >= 0.10, 'aurora/neon < 10%');
  memLS(); const sv = new Save(); const E = new Economia(sv); const det = [];
  for (const p of ['dazzle', 'nac_eua', 'neon_tech']) { E.e.pinturasPossui[p] = 1; E.escolherPintura('fragata', p); E.e.possui.fragata = 1; const mods = E.prepararPartida('fragata');
    const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 7, jogadorOpc: { comandante: 'Cap. Amorim', mods } }); const eu = S.jogador; const base = CLASSES.fragata.vida; const esperado = Math.round(base * (1 + PINTURAS[p].hp));
    assert(eu.C.vida === esperado && eu.vida === esperado, `${p}: HP ${eu.C.vida} ≠ ${esperado}`); det.push(`${p} ${base}→${eu.C.vida}`); }
  return `comuns ${faixa.comum.length}, nacionais ${faixa.nac.length}, ouro ${faixa.ouro.length}; ` + det.join(', '); });
t('v1.2 rev.2: lança-foguetes ASW LF-12 Martelo do couraçado — rajada de 12 foguetes em parábola alta, cai no alvo a 2 km e causa dano', () => {
  const s = simLivre(9); const a = s.adicionaNavio('azul', 'trovao', 0, 0, 0, 'jogador'); const b = s.adicionaNavio('vermelho', 'fragata', 0, -2000, Math.PI / 2); b.tel = 0; b.telAlvo = 0;
  assert(a.C.rbu && a.rbu === a.C.rbu.salvas, 'sem RBU'); a.mira.az = 0; a.mira.dist = 2000; /* v1.2.7: o lança-foguetes atira no ponto da MIRA */ const v0 = b.vida; s.aplica({ id: a.id, t: 'rbu', alvo: b.id }); assert(a.rbu === a.C.rbu.salvas - 1 && a.tRbu > 0, 'não disparou');
  s.aplica({ id: a.id, t: 'rbu', alvo: b.id }); assert(a.rbu === a.C.rbu.salvas - 1, 'disparou durante a recarga');
  let apice = 0, n = 0; const vistos = new Set(); roda(s, 32, () => { for (const g of s.granadas) if (g.ativo && g.rbu) { apice = Math.max(apice, g.y); vistos.add(g); } });
  n = vistos.size; assert(n === 12, n + ' foguetes'); assert(apice > (PARAM.rbuArco ? 150 : 500), 'ápice baixo ' + apice.toFixed(0)); assert(b.vida < v0, 'sem dano');
  return `${n} foguetes, ápice ${apice.toFixed(0)} m, dano ${(v0 - b.vida).toFixed(0)} HP (bruto) na fragata a 2 km`; });
t('Revisão: fogo e alagamento SEMPRE antes de afundar (casco < 25% → incêndio + alagamento)', () => {
  const s = simLivre(); const a = s.adicionaNavio('azul', 'destroier', 0, 0, 0); const b = s.adicionaNavio('vermelho', 'destroier', 3000, 0, 0);
  s.dano(b, b.C.vida * b.C.blind * 0.8, a, 'canhao'); assert(b.incendio > 0 && b.alagamento > 0 && !b.morto, 'sem fogo/alagamento no crítico'); const ev = s.eventos.filter((e) => e.t === 'critico').length; assert(ev === 1, 'evento crítico');
  let tm = 0; for (let i = 0; i < 60 * 200 && !b.morto; i++) { s.passo(); s.eventos.length = 0; if (b.incendio > 0 && b.alagamento > 0) tm = s.t; } if (!b.morto) s.dano(b, 1e6, a, 'canhao');
  assert(b.morto && tm > 0, 'não afundou com fogo/alagamento'); return `crítico (< 25% do casco): fogo ${b.incendio.toFixed(0)} s + alagamento; dano contínuo até afundar`; });
t('Revisão: munição prata (SAP) e ouro (AP) carregada antes da batalha com custo; lote intacto volta ao paiol e lote parcial é reembolsado', () => {
  memLS(); const sv = new Save(); const E = new Economia(sv); E.e.lotes.sap = 0; E.e.loadout = { municao: 'sap', missil: 'tandem', isca: 'padrao', consumivel: 'reparo' }; const p0 = E.prata, o0 = E.ouro; const m = E.prepararPartida('fragata');
  assert(m.municao === 'sap' && m.lotesUsados.includes('sap') && E.prata < p0, 'não cobrou' /* v1.2.8: AP e tandem (ouro) pagos com PRATA */); const g = E.creditar({ vitoria: true, vidaFinal: 1, stats: { tiros: 20, misLanc: 0 }, devolver: ['tandem'], lotesUsados: m.lotesUsados }, 'fragata');
  assert(E.e.lotes.tandem >= 1, 'tandem não voltou'); assert(g.reembolso.prata > 0, 'sem reembolso SAP'); return `SAP ${LOTE_CAP.sap} tiros/lote: 20 usados → reembolso ${g.reembolso.prata} prata; tandem intacto voltou ao paiol`; });
t('Revisão: bandeiras — 6 países, 27 estados brasileiros e 26 sinais náuticos desenhados (canvas, domínio público)', () => {
  let ops = 0; const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => { ops++; return ctx; }), set: (o, k, v) => ((o[k] = v), true) });
  for (const [k] of TODAS) { if (['BRA', 'EUA', 'CHN', 'RUS', 'UK'].includes(k)) continue; assert(desenhaBandeira(ctx, k, 192, 128), 'não desenha ' + k); }
  assert(ESTADOS.length === 27 && SINAIS.length === 26, 'contagem'); return `${TODAS.length} bandeiras (${ops} operações de desenho)`; });
import { CONS, ORDEM_CONS, querCons } from '../src/naval5v5/consumiveis.js';
import { loteCons, custoLote } from '../src/navalTechTreeEconomy.js';
t('v1.2 Consumíveis: débito no início (paiol vazio → compra), devolução do não usado (lote volta), reembolso proporcional do parcialmente usado, saldo nunca negativo', () => {
  memLS(); const sv = new Save(); const E = new Economia(sv); const e = E.e; for (const k of ORDEM_CONS) for (const nv of ['prata', 'ouro']) e.lotes[loteCons(k, nv)] = 0;
  e.prata = 1_000_000; e.ouro = 1_000; e.loadout.cons = { kit: 'ouro', controle: 'prata', bomba: 'ouro', reparoHeli: 'prata', abastece: 'ouro' };
  const p0 = e.prata, o0 = e.ouro; const m = E.prepararPartida('cruzador');
  const dp = p0 - e.prata, dO = o0 - e.ouro; const espP = CONS.controle.prata.custo.prata + CONS.reparoHeli.prata.custo.prata, espO = CONS.kit.ouro.custo.ouro + CONS.bomba.ouro.custo.ouro + CONS.abastece.ouro.custo.ouro;
  assert(dO === espO, `débito ouro ${dO} ≠ ${espO}`); assert(dp >= espP, `débito prata ${dp}`); assert(m.cons.kit === 'ouro' && m.cons.controle === 'prata', 'cons no mods');
  // partida: kit usado 1 de 3 (reembolso 2/3), controle não usado (lote volta), bomba usada toda (nada volta)
  const r = { vitoria: true, stats: { dano: 0, abates: 0, cons: { kit: 1, bomba: 3 } }, lotesUsados: m.lotesUsados };
  const o1 = e.ouro; const g = E.creditar(r, 'cruzador'); const itKit = g.reembolso.itens.find((q) => q.t === loteCons('kit', 'ouro'));
  assert(itKit && Math.abs(itKit.frac - 2 / 3) < 1e-9 && itKit.v === Math.floor(30 * 2 / 3), 'reembolso kit ' + JSON.stringify(itKit));
  assert(e.lotes[loteCons('controle', 'prata')] === 1, 'controle não usado volta ao paiol'); assert(!g.reembolso.itens.find((q) => q.t === loteCons('bomba', 'ouro')), 'bomba gasta não reembolsa');
  // sem saldo: não leva e não fica negativo
  for (const k of ORDEM_CONS) for (const nv of ['prata', 'ouro']) e.lotes[loteCons(k, nv)] = 0; e.prata = 0; e.ouro = 0; const m2 = E.prepararPartida('cruzador'); assert(e.prata >= 0 && e.ouro >= 0, 'negativo'); assert(Object.keys(m2.cons).length === 0, 'sem saldo levou ' + JSON.stringify(m2.cons));
  return `ouro −${dO}, prata −${dp}; kit 1/3 usado → reembolso ${itKit.v} ouro; controle intacto → lote ao paiol; sem saldo → ${JSON.stringify(m2.cons)}`; });
t('v1.2 Consumíveis: conta dev tem tudo comprado em quantidade', () => { memLS(); const sv = new Save(); const E = new Economia(sv); for (const k of ORDEM_CONS) for (const nv of ['prata', 'ouro']) assert(E.e.lotes[loteCons(k, nv)] >= 99, 'dev ' + k + nv);
  const p0 = E.e.prata, o0 = E.e.ouro; const m = E.prepararPartida('cruzador'); assert(Object.keys(m.cons).length === 5, 'leva os 5'); assert(E.e.ouro === o0, 'paiol dev não debita ouro'); return `paiol dev ≥ 99 de cada; leva ${Object.entries(m.cons).map(([k, v]) => k + ':' + v).join(', ')}`; });
t('v1.2 Consumíveis: efeitos (kit prata 15%/6 s e ouro 30%/4 s, recargas 60/40 s, controle ouro instantâneo + imunidade 8 s, prata em 2 s, bomba tira água, heli reparo/rearma, comandante de avarias melhora, IA usa)', () => {
  const s = simLivre(11); s.ameacas.ligadas = 0; const out = [];
  const a = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0, 'bot', { cons: { kit: 'prata', controle: 'prata', bomba: 'prata', reparoHeli: 'prata' } });
  const b = s.adicionaNavio('azul', 'cruzador', P0.x + 3000, P0.z, 0, 'bot', { cons: { kit: 'ouro', controle: 'ouro', bomba: 'ouro', reparoHeli: 'ouro' } });
  for (const n of [a, b]) n.vida = n.C.vida * 0.5;
  s.aplica({ id: a.id, t: 'cons', k: 'kit' }); s.aplica({ id: b.id, t: 'cons', k: 'kit' }); roda(s, 3); const ga3 = a.vida / a.C.vida - 0.5, gb3 = b.vida / b.C.vida - 0.5; roda(s, 4);
  const ga = a.vida / a.C.vida - 0.5, gb = b.vida / b.C.vida - 0.5; assert(Math.abs(ga - 0.15) < 0.02 && Math.abs(gb - 0.30) < 0.02, `cura ${ga.toFixed(3)} / ${gb.toFixed(3)}`); assert(ga3 < 0.15 * 0.6 && gb3 > 0.2, 'ao longo do tempo');
  assert(Math.abs(a.cons.kit.t - 53) < 0.2 && Math.abs(b.cons.kit.t - 33) < 0.2, `recarga ${a.cons.kit.t.toFixed(1)} ${b.cons.kit.t.toFixed(1)}`); s.aplica({ id: a.id, t: 'cons', k: 'kit' }); assert(a.cons.kit.usos === 1, 'recarregando não usa');
  out.push(`kit +${(ga * 100).toFixed(0)}%/+${(gb * 100).toFixed(0)}%`);
  for (const n of [a, b]) { n.incendio = 20; n.alagamento = 20; n.avaria.motor = 0.1; }
  s.aplica({ id: a.id, t: 'cons', k: 'controle' }); s.aplica({ id: b.id, t: 'cons', k: 'controle' }); assert(b.incendio === 0 && b.alagamento === 0 && b.avaria.motor === 1, 'ouro instantâneo'); assert(a.incendio > 0, 'prata não é instantâneo');
  roda(s, 2.2); assert(a.incendio === 0 && a.alagamento === 0 && a.avaria.motor === 1, 'prata em 2 s'); b.incendio = 15; roda(s, 0.1); assert(b.incendio === 0, 'imunidade'); roda(s, 8); b.incendio = 15; roda(s, 0.05); assert(b.incendio > 0, 'imunidade acaba');
  out.push('controle ok'); b.incendio = 0;
  for (const n of [a, b]) { n.aguaAbordo = 0.6; n.lista = 0.1; } s.aplica({ id: a.id, t: 'cons', k: 'bomba' }); s.aplica({ id: b.id, t: 'cons', k: 'bomba' }); roda(s, 2); assert(b.aguaAbordo < a.aguaAbordo && a.aguaAbordo < 0.6, `bomba ${a.aguaAbordo.toFixed(2)} ${b.aguaAbordo.toFixed(2)}`); out.push(`bomba 2 s: água ${a.aguaAbordo.toFixed(2)} (prata) / ${b.aguaAbordo.toFixed(2)} (ouro)`);
  const h = s.helis[b.helis[0]]; h.vida = h.H.vida * 0.2; h.mun = 0; h.estado = EST.VOO; s.aplica({ id: b.id, t: 'cons', k: 'reparoHeli' }); assert(Math.abs(h.vida / h.H.vida - 0.9) < 0.01 && h.mun === h.munMax, 'heli ouro');
  // comandante de avarias: recarga menor
  const c = s.adicionaNavio('azul', 'cruzador', P0.x - 3000, P0.z, 0, 'bot', { cons: { kit: 'prata' }, mods: Object.assign(modsDe('cruzador', { comandante: { esp: 'avarias', nivel: 10 } }), {}) }); c.vida = c.C.vida * 0.5; s.aplica({ id: c.id, t: 'cons', k: 'kit' }); roda(s, 7);
  assert(c.cons.kit.t < 53 && c.vida / c.C.vida - 0.5 > 0.15, `comandante ${c.cons.kit.t.toFixed(1)} ${(c.vida / c.C.vida - 0.5).toFixed(3)}`); out.push(`comandante: recarga ${c.cons.kit.t.toFixed(0)} s, +${((c.vida / c.C.vida - 0.5) * 100).toFixed(0)}%`);
  c.incendio = 10; c.alagamento = 10; c.vida = c.C.vida * 0.3; assert(querCons(s, c) === 'controle' || querCons(s, c) === null, 'IA decide'); return out.join('; '); });
t('v1.2 Consumíveis: bots levam consumíveis e usam na partida; premium às vezes de ouro', () => { const out = {}; let usos = 0, ouro = 0;
  for (let sd = 1; sd <= 4; sd++) { const S = criaSessao({ mapa: ORDEM_MAPAS[sd % ORDEM_MAPAS.length], modo: 'frota', classe: 'cruzador', seed: sd }); for (const n of S.sim.navios) { if (n.papel === 'jogador') continue; assert(n.cons && n.cons.kit, 'bot sem kit'); if (n.C.premium && n.cons.kit.nivel === 'ouro') ouro++; }
    for (let i = 0; i < 150 * 10 && !S.sim.fim; i++) S.avanca(0.1); for (const n of S.sim.navios) for (const k in (n.stats.cons || {})) usos += n.stats.cons[k]; }
  assert(usos > 0, 'IA nunca usou consumível'); return `usos pela IA em 4 partidas de 150 s: ${usos}; bots premium com ouro: ${ouro}`; });
t('v1.2 Movimento: helicóptero acelera com nariz baixo 25–30°, freia com nariz alto 10–15°, cruzeiro ≤ 160 km/h, rolagem 35–40° na curva, deriva 1,5–2 s ao soltar; navio inclina 3–6° conforme o tamanho e acelera 0→vmax em 12–18 s', () => {
  const s = simLivre(5); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const h = s.helis[n.helis[0]]; Object.assign(h, { estado: EST.VOO, ativo: 1, ctrl: 'jog', y: 70, alt: 70, comb: 1e5, vx: 0, vz: 0, v: 0, jx: 0, jy: 1 }); n.controle = 0;
  const D = 180 / Math.PI; let pMin = 0, vMax = 0; roda(s, 1.5, () => { pMin = Math.min(pMin, h.pitch * D); }); roda(s, 12, () => { vMax = Math.max(vMax, h.v); });
  assert(pMin <= -24 && pMin >= -36, 'nariz baixo ' + pMin.toFixed(1)); assert(vMax * 3.6 <= 161 && vMax * 3.6 > 140, 'cruzeiro ' + (vMax * 3.6).toFixed(0));
  h.jx = 1; let rMax = 0; roda(s, 4, () => { rMax = Math.max(rMax, Math.abs(h.roll * D)); }); assert(rMax >= 33 && rMax <= 40.5, 'rolagem ' + rMax.toFixed(1)); h.jx = 0; roda(s, 3);
  h.jy = 0; let pMax = 0, tDer = 0; const v0 = h.v; roda(s, 4, (q, i) => { pMax = Math.max(pMax, h.pitch * D); if (h.v > v0 * 0.1) tDer = i / 60; }); assert(pMax >= 9 && pMax <= 16, 'nariz alto ' + pMax.toFixed(1)); assert(tDer >= 1.4 && tDer <= 2.6, 'deriva ' + tDer.toFixed(2));
  const banda = (tipo) => { const q = simLivre(6); q.ameacas.ligadas = 0; const m = q.adicionaNavio('azul', tipo, P0.x, P0.z, 0); m.telAlvo = 4; roda(q, 60); m.lemeCmd = 1; let mx = 0; roda(q, 40, () => { mx = Math.max(mx, Math.abs(m.adorno) * D); }); return mx; };
  const bp = banda('strizh'), bg = banda('trovao'); assert(bp <= 6.2 && bp >= 3.5 && bg >= 2.5 && bg <= 4.5 && bp > bg, `banda ${bp.toFixed(1)}° / ${bg.toFixed(1)}°`);
  return `nariz −${(-pMin).toFixed(0)}° acelerando, +${pMax.toFixed(0)}° freando; ${(vMax * 3.6).toFixed(0)} km/h; rolagem ${rMax.toFixed(0)}°; deriva ${tDer.toFixed(1)} s; banda ${bp.toFixed(1)}° (82 m) / ${bg.toFixed(1)}° (250 m)`; });
t('v1.2 Heli: flare reduz o SAM contra o helicóptero, cargas limitadas; míssil de asa sai reto e depois guia', () => { const s = simLivre(9); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'cruzador', P0.x, P0.z, 0); const h = s.helis[n.helis[0]]; Object.assign(h, { estado: EST.VOO, ativo: 1, ctrl: 'jog', y: 70, alt: 70, comb: 1e5 });
  for (let i = 0; i < 5; i++) { s.aplica({ id: n.id, t: 'heliFlare', k: 0 }); h.tFlare = 0; } assert(h.flares === 0, 'cargas ' + h.flares); return `${PARAM.heli.flares} flares; SAM ×${PARAM.heli.flareSam} durante ${PARAM.heli.flareDur} s`; });
import { solucaoArrasto as solA2, arrastoCal as kCal2 } from '../src/naval5v5/balistica.js';
t('v1.2 Balística do vídeo: tempo de voo a 1,2 km e 3 km por calibre (76/127–130/305 mm), quase plana até 3 km, arco só longe; dispersão em LINHA horizontal no alvo', () => { const out = [];
  for (const id of ['corveta', 'tridente', 'sokol', 'trovao']) { const A = CLASSES[id].canhao, k = kCal2(A.cal); const s12 = solA2(0, 0, 10, A.V0, k, 0, -1200, 12, 0, {}), s3 = solA2(0, 0, 10, A.V0, k, 0, -3000, 12, 0, {}), s9 = solA2(0, 0, 10, A.V0, k, 0, -9000, 12, 0, {});
    assert(s12.tv > 0.25 && s12.tv < 0.6, id + ' 1,2 km ' + s12.tv); assert(s3.tv > 0.75 && s3.tv < (A.cal >= 300 ? 1.3 : 1.15), id + ' 3 km ' + s3.tv); assert(Math.abs(s3.el) < 0.006, id + ' arco a 3 km'); assert(s9.el > s3.el + 0.002, id + ' arco longe');
    out.push(`${A.cal} mm: ${s12.tv.toFixed(2)} s @1,2 km · ${s3.tv.toFixed(2)} s @3 km · el ${(s9.el * 57.3).toFixed(2)}° @9 km`); }
  const s = simLivre(4); s.ameacas.ligadas = 0; const a = s.adicionaNavio('azul', 'trovao', P0.x, P0.z, Math.PI / 2, 'bot'); const b = s.adicionaNavio('vermelho', 'cruzador', P0.x + 3400, P0.z, 0, 'bot'); b.vida = 1e9; b.C = Object.assign({}, b.C, { vida: 1e9 }); a.ciws.length = 0; b.ciws.length = 0;
  roda(s, 2); s.sensores(); s.aplica({ id: a.id, t: 'travar', alvo: b.id }); const pl = [], ant = new Map(); let salvas = 0;
  for (let i = 0; i < 60 * 40; i++) { if (i % 30 === 0) s.aplica({ id: a.id, t: 'canhao' }); s.passo(); for (const e of s.eventos) { if (e.t === 'impacto' && e.dono === a.id) pl.push([e.z - b.z, e.y]); if (e.t === 'tiro' && e.id === a.id) salvas++; }
    for (const g of s.granadas) { if (!g.ativo || g.dono !== a.id) { ant.delete(g); continue; } const px = ant.get(g); if (px !== undefined && px < b.x && g.x >= b.x) pl.push([g.z - b.z, g.y]); ant.set(g, g.x); } s.eventos.length = 0; }
  const sd = (v) => { const m = v.reduce((p, q) => p + q, 0) / v.length; return Math.sqrt(v.reduce((p, q) => p + (q - m) ** 2, 0) / v.length); }; const sl = sd(pl.map((p) => p[0])), sv = sd(pl.map((p) => p[1]));
  assert(pl.length >= 12, 'amostras ' + pl.length); assert(sl > 2 * sv && sl > 4 && sl < 70, `dispersão lateral ${sl.toFixed(1)} m × vertical ${sv.toFixed(1)} m`);
  out.push(`couraçado a 3,4 km: ${pl.length} projéteis no plano do alvo, dispersão lateral σ ${sl.toFixed(1)} m × vertical σ ${sv.toFixed(1)} m (linha horizontal)`); return out.join('; '); });
t('v1.2 Troca de controle: no heli a IA pilota o NAVIO (mantém velocidade/rumo na troca, manobra, atira); de volta ao navio a IA assume o heli e segue lutando ou pousa; drone também passa o navio à IA', () => {
  const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 7 }); const sim = S.sim, n = S.jogador; sim.aplica({ id: n.id, t: 'telegrafo', v: 3 }); for (let i = 0; i < 300; i++) S.avanca(0.1);
  const v0 = n.v, r0 = n.rumo, tiros0 = n.stats.tiros || 0; sim.aplica({ id: n.id, t: 'controle', k: 0 }); assert(n.controle === 0 && n.controleIA === 1, 'assumiu heli');
  for (let i = 0; i < 20; i++) S.avanca(0.1); assert(n.v > v0 * 0.9, `perdeu velocidade ${v0.toFixed(1)} → ${n.v.toFixed(1)}`); assert(Math.abs(ang(n.rumo - r0)) < 0.15, 'rumo mudou na troca');
  let lemeMax = 0; for (let i = 0; i < 900; i++) { S.avanca(0.1); lemeMax = Math.max(lemeMax, Math.abs(n.lemeCmd || 0)); if (n.controle < 0) break; }
  const tirosIA = (n.stats.tiros || 0) - tiros0; assert(lemeMax > 0.05, 'IA não manobrou'); assert(tirosIA > 0 || (n.stats.misLanc || 0) > 0, 'IA do navio não atirou');
  if (n.controle >= 0) sim.aplica({ id: n.id, t: 'controle', k: -1 }); assert(n.controleIA === 0, 'navio de volta ao jogador'); const h = sim.helis[n.helis[0]]; assert(h.ctrl === 'ia', 'heli sob IA');
  for (let i = 0; i < 50; i++) S.avanca(0.1); const est = h.estado; sim.aplica({ id: n.id, t: 'uav' }); for (let i = 0; i < 5; i++) S.avanca(0.1); sim.aplica({ id: n.id, t: 'iaNavio', v: 1 }); assert(n.controleIA === 1, 'drone: IA no navio'); sim.aplica({ id: n.id, t: 'iaNavio', v: 0 });
  return `troca a ${(v0 * 1.944).toFixed(1)} nós → ${(n.v * 1.944).toFixed(1)} nós; IA: leme até ${lemeMax.toFixed(2)}, ${tirosIA} tiros e ${n.stats.misLanc || 0} mísseis; heli após voltar: estado ${est} (IA)`; });
t('v1.2.1 Governo: contratorpedeiro a 30 nós faz 180° em 25–35 s, leme responde em ~1 s, BB vira à esquerda / BE à direita, proa = rumo, piloto automático', () => {
  const giro = (tipo, cmd) => { const s = simLivre(); const n = s.adicionaNavio('azul', tipo, P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.telAlvo = 4; const v30 = Math.min(30, n.C.vmax * 1.943844) / 1.943844;
    roda(s, 40, () => { n.v = v30; }); s.aplica({ id: n.id, t: 'leme', v: cmd }); let acc = 0, prev = n.rumo, t = 0, resp = -1, dir = 0; const x0 = n.x, z0 = n.z;
    while (Math.abs(acc) < Math.PI && t < 200) { s.passo(); n.v = v30; let d = ang(n.rumo - prev); acc += d; prev = n.rumo; t += 1 / 60; if (resp < 0 && Math.abs(n.leme) >= 0.6) resp = t; if (t > 3 && t < 3.02) dir = Math.sign(d); }
    return { t, resp, dir, n }; };
  const a = giro('destroier', 1), b = giro('destroier', -1), c = giro('capitania', 1), d = giro('corveta', 1);
  assert(a.t >= 21 && a.t <= 35 /* v1.2.8: +17% de velocidade */, '180° em ' + a.t.toFixed(1) + ' s'); assert(a.resp > 0.6 && a.resp < 1.4, 'leme em ' + a.resp.toFixed(2) + ' s');
  assert(a.dir > 0 && b.dir < 0, 'BE deve aumentar o rumo (direita) e BB diminuir (esquerda)'); assert(c.t > a.t && d.t < a.t, 'maior gira mais devagar');
  // proa = direção do deslocamento (o modelo usa rotation.y = −rumo com a proa em −z)
  const s = simLivre(); const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0.7); s.ameacas.ligadas = 0; n.telAlvo = 4; roda(s, 30); const x0 = n.x, z0 = n.z; roda(s, 1); const mov = Math.atan2(n.x - x0, -(n.z - z0));
  const proa = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, -n.rumo, 0)); assert(Math.abs(ang(mov - n.rumo)) < 0.02 && Math.abs(ang(Math.atan2(proa.x, -proa.z) - n.rumo)) < 1e-6, 'proa não acompanha o rumo');
  // velocidade × nós: TF ≈ vmax; m/s × 1,944 = nós exibidos
  assert(Math.abs(n.v * 1.943844 - n.C.vmax * 1.943844) < 1.5, 'nós ' + n.v * 1.943844);
  // piloto automático: rumo 90° à direita, chega e segura sem oscilar
  s.aplica({ id: n.id, t: 'rumo', v: ang(0.7 + Math.PI / 2) }); let maxErr = 0; roda(s, 60, (ss, i) => { if (i > 45 * 60) maxErr = Math.max(maxErr, Math.abs(ang(n.rumo - n.rumoAlvo))); });
  assert(maxErr < 0.035, 'piloto automático erro ' + (maxErr * 57.3).toFixed(1) + '°'); s.aplica({ id: n.id, t: 'leme', v: 0 }); assert(n.rumoAlvo == null, 'leme manual não desligou o piloto');
  return `contratorpedeiro 30 nós: 180° em ${a.t.toFixed(1)} s (leme 35° em ${a.resp.toFixed(2)} s); Fortaleza ${c.t.toFixed(1)} s; corveta ${d.t.toFixed(1)} s; piloto automático: erro final ${(maxErr * 57.3).toFixed(2)}°`; });
t('v1.2.1 Torres giram até a mira em tempo real (15–40°/s por calibre), só disparam alinhadas; CIWS só ≤ 1,2 km e respeita setor cego', () => {
  assert(Math.abs(taxaTorre(76) * 57.3 - 40) < 0.5 && Math.abs(taxaTorre(127) * 57.3 - 25) < 0.5 && Math.abs(taxaTorre(305) * 57.3 - 15) < 0.5, 'taxas por calibre');
  const giro = (tipo) => { const s = simLivre(); const n = s.adicionaNavio('azul', tipo, P0.x, P0.z, 0); s.ameacas.ligadas = 0; n.mira.az = 1.75; n.mira.dist = 5000; n.gatilho = 99; const a0 = n.torres[0].az; let t = 0, t60 = -1, tiro = -1, girandoVisto = 0; const t0 = n.stats.tiros || 0;
    while (t < 8) { s.passo(); t += 1 / 60; if (n.torres[0].girando) girandoVisto = 1; if (t60 < 0 && Math.abs(n.torres[0].az - a0) >= 60 / 57.3) t60 = t; if (tiro < 0 && (n.stats.tiros || 0) > t0) tiro = t; }
    return { taxa: 60 / t60, tiro, girandoVisto, n }; };
  const a = giro('destroier'), c = giro('capitania'); const cal = (x) => x.n.C.canhao.cal;
  { const ok = (x) => x.taxa <= taxaTorre(cal(x)) * 57.3 + 1 && x.taxa >= taxaTorre(cal(x)) * 57.3 * 0.8; assert(ok(a) && ok(c), `giro ${a.taxa} / ${c.taxa}`); } /* v1.2.15 (J): giro com ACELERAÇÃO por calibre — a média em 60° fica entre 80% e 100% da taxa máxima */ assert(a.girandoVisto, 'HUD girando');
  assert(a.tiro > 1.75 / taxaTorre(cal(a)) * 0.9, 'atirou antes de alinhar: ' + a.tiro); assert(c.tiro > a.tiro, 'calibre grande gira mais devagar');
  // CIWS: setor cego e alcance
  assert(ciwsCego({ x: 6, y: 8, z: 0 }, -1.4, 0.05) && !ciwsCego({ x: 6, y: 8, z: 0 }, 1.4, 0.05) && !ciwsCego({ x: 6, y: 8, z: 0 }, -1.4, 0.6), 'cego lateral');
  assert(ciwsCego({ x: 0, y: 9, z: -30 }, Math.PI, 0.05) && !ciwsCego({ x: 0, y: 9, z: -30 }, 0.3, 0.05), 'cego de proa');
  const s = simLivre(); const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const e = s.adicionaNavio('vermelho', 'destroier', P0.x, P0.z - 9000, Math.PI); s.ameacas.ligadas = 0; e.vls = 8; s.lancaMissil(e, n.id, 1);
  let dMax = -1; roda(s, 60, () => { if (!n.ciws.some((c) => c.fogo)) return; for (const m of s.misseis) if (m.ativo && m.alvo === n.id) dMax = Math.max(dMax, Math.min(...n.P.ciws.map((pc) => { const o = s.mundo(n, pc.x, pc.y, pc.z, {}); return Math.hypot(m.x - o.x, m.y - o.y, m.z - o.z); }))); });
  assert(dMax <= 1200, 'CIWS atirou a ' + dMax.toFixed(0) + ' m');
  return `torre ${cal(a)} mm ${a.taxa.toFixed(1)}°/s (1º tiro alinhado em ${a.tiro.toFixed(2)} s), ${cal(c)} mm ${c.taxa.toFixed(1)}°/s; CIWS abriu fogo no máximo a ${dMax < 0 ? '— (míssil não chegou)' : dMax.toFixed(0) + ' m'}`; });
const A_ = ARENA;
function bateriaTravada(N = 100, tipo = 'missil', seed = 3) { let acertos = 0, falhas = [], danoTot = 0;
  for (let k = 0; k < N; k++) { const s = new Sim({ arena: A_, seed: seed + k }); s.ameacas.ligadas = 0; s.revelaTudo = 1; const cls = ['destroier', 'corveta', 'capitania', 'fragata'][k % 4];
    const d = tipo === 'missil' ? 3500 + (k % 5) * 900 : 1500 + (k % 4) * 400; let br = (k * 0.7) % 6.28; for (let tent = 0; tent < 80; tent++) { let livre = true; const lim = tipo === 'missil' ? -25 : -12; /* v1.2.29: corredor mais fundo p/ rasante (~5–28 m) não bater em banco/ilha */ for (let f = 0; f <= 1.25; f += 0.04) for (const o of [-500, -250, 0, 250, 500]) { const x = P0.x + Math.sin(br) * d * f + Math.cos(br) * o, z = P0.z - Math.cos(br) * d * f + Math.sin(br) * o; const h = alturaTerreno(A_, x, z); if (h > lim || (tipo === 'missil' && h > 2)) livre = false; } if (livre) break; br += 0.31; } /* rota sem terreno: falha por ilha é regra válida, aqui medimos só a espoleta */
    const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const e = s.adicionaNavio('vermelho', cls, P0.x + Math.sin(br) * d, P0.z - Math.cos(br) * d, (k * 1.3) % 6.28);
    for (const q of [n, e]) { q.ciws = []; q.a30 = []; q.samAuto = 0; q.chaff = 0; q.chaffReserva = 0; } e.C = Object.assign({}, e.C, { sam: 0, vida: 1e7 }); e.vida = 1e7; e.telAlvo = tipo === 'missil' ? [1, 2, 3, 4][k % 4] : [1, 2, 1, 2][k % 4]; e.lemeCmd = tipo === 'missil' ? [0, 1, -1, 0.5][k % 4] : [0, 0.2, -0.2, 0][k % 4]; if (k % 5 === 0) { e.lista = 0.12; e.trimDano = 0.03; }
    n.radarAtivo = 1; s.aplica({ id: n.id, t: 'radar', v: 1 }); for (let i = 0; i < 60 * 3; i++) s.passo(); s.aplica({ id: n.id, t: 'travar', alvo: e.id }); for (let i = 0; i < 60 * 3; i++) s.passo();
    if (k % 7 === 3) e.arfagem -= 2.5; /* afundando */ s.eventos.length = 0; const v0 = e.vida; let ok = 0;
    if (tipo === 'missil') { n.vls = 10; n.tVls = 0; ok = s.lancaMissil(n, e.id, 1); } else { n.torp = 4; n.tTorp = 0; ok = s.lancaTorpedo(n, e.id); }
    if (!ok) { falhas.push(`${k}: não lançou (trava ${n.trava.toFixed(2)})`); continue; } let hit = 0, motivo = '';
    for (let i = 0; i < 60 * 320 && !hit; i++) { s.passo(); if (k % 7 === 3) e.arfagem = Math.min(e.arfagem, -2.5); for (const ev of s.eventos) { if ((ev.t === 'impacto' && ev.tipo === 'missil' && ev.alvo === e.id) || (ev.t === 'torpImpacto' && ev.alvo === e.id)) hit = 1; if (ev.t === 'missilAgua' || ev.t === 'torpFim') motivo = JSON.stringify(ev); } s.eventos.length = 0; if (motivo) break; }
    if (hit && e.vida < v0) { acertos++; danoTot += v0 - e.vida; } else falhas.push(`${k} ${cls} d=${d}: ${motivo || 'sem impacto'}`); }
  return { acertos, falhas, danoTot }; }
t('v1.2.1 Trava automática: 100 mísseis e 100 torpedos travados, sem defesa (sem CIWS/SAM/isca), em alvos manobrando, adernados e afundando → 100% com dano aplicado', () => {
  const m = bateriaTravada(100, 'missil'), tp = bateriaTravada(100, 'torpedo'); assert(m.acertos === 100, 'mísseis: ' + m.acertos + ' — ' + m.falhas.slice(0, 3).join(' | ')); assert(tp.acertos === 100, 'torpedos: ' + tp.acertos + ' — ' + tp.falhas.slice(0, 3).join(' | '));
  return `mísseis 100/100 (dano total ${Math.round(m.danoTot)}), torpedos 100/100 (dano total ${Math.round(tp.danoTot)})`; });
t('v1.2.1 Trava automática por tempo: trava em 0,5–1 s com a mira sobre o navio, mantém ≤ 2 s fora da mira, destrava depois, troca de alvo com a mira parada em outro', () => {
  const s = simLivre(); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const b1 = 0.5, b2 = -0.6; const e1 = s.adicionaNavio('vermelho', 'destroier', P0.x + Math.sin(b1) * 5000, P0.z - Math.cos(b1) * 5000, 0); const e2 = s.adicionaNavio('vermelho', 'fragata', P0.x + Math.sin(b2) * 5000, P0.z - Math.cos(b2) * 5000, 0);
  s.aplica({ id: n.id, t: 'radar', v: 1 }); roda(s, 3); const mira = (az, seg) => { let tT = -1, t = 0; for (let i = 0; i < seg * 60; i++) { if (i % 6 === 0) s.aplica({ id: n.id, t: 'mira', az, dist: 5000 }); s.passo(); t += 1 / 60; if (tT < 0 && n.trava >= 1) tT = t; } return tT; };
  const tTrava = mira(b1, 1.5); assert(n.alvoId === e1.id && tTrava >= 0.5 && tTrava <= 1.05, `trava ${tTrava} s alvo ${n.alvoId}`);
  mira(2.2, 1.6); assert(n.alvoId === e1.id && n.trava >= 1, 'perdeu a trava antes de 2 s'); mira(2.2, 0.6); assert(n.alvoId === -1, 'não destravou depois de 2 s');
  mira(b1, 1.2); assert(n.alvoId === e1.id, 'retrava'); mira(b2, 0.3); assert(n.alvoId === e1.id, 'trocou rápido demais'); mira(b2, 0.6); assert(n.alvoId === e2.id, 'não trocou para o navio sob a mira');
  return `trava em ${tTrava.toFixed(2)} s (radar ativo); mantém 1,6 s fora; destrava após 2 s; troca após ${PARAM_T.tTroca} s sobre outro navio`; });
t('v1.2.1 Mira manual: save antigo com AUTO-MIRA ligada é migrado para DESLIGADA uma vez e depois a escolha do jogador fica salva; AUTO-FOGO só com a mira sobre o alvo; VLS sem trava só adquire no cone da mira', () => {
  let mem = { ajustes: { autoMira: true } }; const arm = { ler: () => mem, gravar: (d) => (mem = JSON.parse(JSON.stringify(d))) };
  const s1 = new Save(arm); assert(s1.ajustes.autoMira === false && mem.ajustes.autoMiraV121 === 1, 'migração não desligou'); s1.ajustes.autoMira = true; s1.salva(); const s2 = new Save(arm); assert(s2.ajustes.autoMira === true, 'preferência do jogador não ficou salva');
  // AUTO-FOGO: travado mas mira FORA do alvo → não atira; mira sobre o alvo → atira
  const s = simLivre(); s.ameacas.ligadas = 0; const n = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const b1 = 0.4; const e = s.adicionaNavio('vermelho', 'destroier', P0.x + Math.sin(b1) * 6000, P0.z - Math.cos(b1) * 6000, 0); e.vida = e.C.vida = 1e7;
  s.aplica({ id: n.id, t: 'radar', v: 1 }); roda(s, 2); s.aplica({ id: n.id, t: 'travar', alvo: e.id }); s.aplica({ id: n.id, t: 'auto', v: 1 }); n.autoFogo = 1; const mira = (az, seg) => { for (let i = 0; i < seg * 60; i++) { if (i % 6 === 0) s.aplica({ id: n.id, t: 'mira', az, dist: 6000 }); s.passo(); } };
  mira(b1 + 1.2, 1.5); const t0 = n.stats.tiros || 0; mira(b1 + 1.2, 1.5); const foraTiros = (n.stats.tiros || 0) - t0; mira(b1, 6); const sobreTiros = (n.stats.tiros || 0) - t0 - foraTiros;
  assert(foraTiros === 0, 'AUTO-FOGO atirou com a mira fora do alvo: ' + foraTiros); assert(sobreTiros > 0, 'AUTO-FOGO não atirou com a mira sobre o alvo');
  // VLS livre: na direção da mira; não adquire navio fora do cone estreito, adquire dentro
  const livre = (azOff) => { const s3 = simLivre(); s3.ameacas.ligadas = 0; const a = s3.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const br = 0.5; const x = s3.adicionaNavio('vermelho', 'fragata', P0.x + Math.sin(br) * 5000, P0.z - Math.cos(br) * 5000, 0); x.ciws = []; x.a30 = []; x.samAuto = 0; x.chaff = 0; x.vida = x.C.vida = 1e7;
    a.vls = 4; a.tVls = 0; const k = s3.lancaMissil(a, -1, 1, br + azOff); let hit = 0; for (let i = 0; i < 60 * 40 && !hit; i++) { s3.passo(); for (const ev of s3.eventos) if (ev.t === 'impacto' && ev.tipo === 'missil') hit = 1; s3.eventos.length = 0; } return { k, hit }; };
  const dentro = livre(0.01), fora = livre(0.35); assert(dentro.k === 0 && fora.k === 0, 'v1.2.5: VLS sem alvo válido não pode sair');
  return `migração ok; AUTO-FOGO: ${foraTiros} tiros com a mira fora, ${sobreTiros} com a mira sobre o alvo; VLS sem alvo válido: não dispara (v1.2.5)`; });
/** v1.2.2: bateria de DANO REAL — atirador e alvo de MESMO tier (alvo = escolta de referência do tier), com uma 2ª escolta inimiga ~500 m atrás do alvo; mede a queda de HP no impacto. */
function bateriaDano(N, tipo, seed = 11) { const res = { pcts: [], erradas: 0, falhas: [], semDano: 0 }; const TIPOS = [['corveta', 'corveta', 1], ['destroier', 'fragata', 2], ['cruzador', 'cruzador', 3]];
  for (let k = 0; k < N; k++) { const [atir, alvoC] = TIPOS[k % 3]; const s = new Sim({ arena: A_, seed: seed + k }); s.ameacas.ligadas = 0; s.revelaTudo = 1;
    const d = tipo === 'torpedo' ? 1500 + (k % 3) * 300 : 3800 + (k % 4) * 700; let br = (k * 0.9) % 6.28; for (let tent = 0; tent < 40; tent++) { let livre = true; for (let f = 0; f <= 1.2; f += 0.05) for (const o of [-500, 0, 500]) if (alturaTerreno(A_, P0.x + Math.sin(br) * d * f + Math.cos(br) * o, P0.z - Math.cos(br) * d * f + Math.sin(br) * o) > -12) livre = false; if (livre) break; br += 0.37; }
    const n = s.adicionaNavio('azul', atir, P0.x, P0.z, 0); const e = s.adicionaNavio('vermelho', alvoC, P0.x + Math.sin(br) * d, P0.z - Math.cos(br) * d, (k * 1.3) % 6.28); const esc = s.adicionaNavio('vermelho', 'fragata', e.x + Math.sin(br) * 450 + Math.cos(br) * 250, e.z - Math.cos(br) * 450 + Math.sin(br) * 250, e.rumo); /* escolta logo atrás/ao lado do alvo */
    for (const q of [n, e, esc]) { q.ciws = []; q.a30 = []; q.samAuto = 0; q.chaff = 0; q.chaffReserva = 0; q.C = Object.assign({}, q.C, { sam: 0 }); } e.telAlvo = 1 + (k % 2);
    if (tipo === 'ouro') n.mods.missilEf = { dano: 1.25, pkCiws: 0.85 };
    s.aplica({ id: n.id, t: 'radar', v: 1 }); for (let i = 0; i < 60 * 3; i++) s.passo(); s.aplica({ id: n.id, t: 'travar', alvo: e.id }); for (let i = 0; i < 60 * 3; i++) s.passo();
    const vEsc = esc.vida; let ok = tipo === 'torpedo' ? (n.torp = 4, n.tTorp = 0, s.lancaTorpedo(n, e.id)) : (n.vls = 10, n.tVls = 0, s.lancaMissil(n, e.id, 1)); if (!ok) { res.falhas.push(k + ': não lançou'); continue; }
    s.eventos.length = 0; let hit = null, fim = 0;
    for (let i = 0; i < 60 * 200 && !hit && !fim; i++) { const v0 = e.vida; s.passo(); for (const ev of s.eventos) { if (((ev.t === 'impacto' && ev.tipo === 'missil') || ev.t === 'torpImpacto') && ev.dono === n.id) hit = { ev, queda: v0 - e.vida }; if (ev.t === 'missilAgua' || ev.t === 'torpFim') fim = 1; } s.eventos.length = 0; }
    if (!hit) { res.falhas.push(`${k}: sem impacto`); continue; } if (hit.ev.alvo !== e.id || esc.vida < vEsc) res.erradas++; const pct = hit.queda / e.C.vida; if (!(hit.queda > 0)) res.semDano++; res.pcts.push(pct); if (tipo === 'torpedo' && !(e.alagamento > 0)) res.falhas.push(k + ': torpedo sem alagamento ' + JSON.stringify({ al: e.alagamento, ev: hit.ev, morto: e.morto, im: e.imune })); }
  const med = res.pcts.reduce((a, b) => a + b, 0) / Math.max(1, res.pcts.length); return Object.assign(res, { med, min: Math.min(...res.pcts), max: Math.max(...res.pcts) }); }
t('v1.2.2 DANO REAL: míssil padrão 18–25%, ouro/tandem = padrão +25% (v1.2.21), torpedo 25–35% (com alagamento) do HP de um alvo do mesmo tier; 100% dos acertos com dano no alvo certo, 0 abaixo de 10%', () => {
  const F = (x) => (x * 100).toFixed(1) + '%'; const out = [];
  const R_ = {}; /* v1.2.21 item 19/19c: a ogiva tandem (ouro) vale +25% EXATOS sobre o míssil do navio, como a loja descreve — antes trocava pela fração fixa 'ouro' 35% (+50–70%). Faixa ouro = faixa padrão × 1,25 e razão ouro/padrão 1,25 ± 0,04. */
  for (const [tipo, lo, hi] of [['missil', 0.18, 0.25], ['ouro', 0.18 * 1.25, 0.25 * 1.25], ['torpedo', 0.25, 0.35]]) { const r = bateriaDano(30, tipo); R_[tipo] = r;
    assert(r.falhas.length === 0, tipo + ': ' + r.falhas.slice(0, 3).join(' | ')); assert(r.erradas === 0, tipo + ': dano foi para outro navio'); assert(r.semDano === 0, tipo + ': acerto sem dano');
    assert(r.med >= lo && r.med <= hi, `${tipo}: média ${F(r.med)} fora de ${F(lo)}–${F(hi)}`); assert(r.min >= 0.10, `${tipo}: acerto abaixo de 10% (${F(r.min)})`); assert(r.min >= lo - 0.02 && r.max <= hi + 0.02, `${tipo}: faixa ${F(r.min)}–${F(r.max)}`);
    out.push(`${tipo} ${r.pcts.length}/30 média ${F(r.med)} (${F(r.min)}–${F(r.max)})`); }
  { const q = R_.ouro.med / R_.missil.med; assert(Math.abs(q - 1.25) <= 0.04, `ouro/padrão ${q.toFixed(3)} ≠ 1,25`); out.push(`ouro/padrão ${q.toFixed(3)}`); }
  return out.join('; ') + '; escolta a ~500 m intacta'; });
t('v1.2.2 DISPERSÃO do canhão (1000 tiros simulados por calibre e distância, destróier-alvo em rumo aleatório, mira travada com lead)', () => {
  const linhas = [], F = (x) => (x * 100).toFixed(1) + '%'; const tab = {};
  for (const [cls, dists] of [['corveta', [3000, 5000, 7500]], ['destroier', [3000, 5000, 8000]], ['cruzador', [3000, 5000, 8000]], ['trovao', [3000, 5000, 8000]]]) { const cal = CLASSES[cls].canhao.cal + ' mm (' + CLASSES[cls].nome + ')';
    for (const d of dists) { const r = bancaDisp(cls, d, 1000); tab[cls + d] = r; linhas.push(`${cal} ${d / 1000} km ${F(r.pct)} (σlat ${r.sdLat.toFixed(0)} m, viés lat ${r.medLat.toFixed(1)} m)`);
      assert(Math.abs(r.medLat) < Math.max(3, r.sdLat * 0.2), `${cls} ${d}: viés lateral ${r.medLat.toFixed(1)} m`); } }
  assert(tab.destroier3000.pct >= 0.6, 'destróier 3 km < 60%'); assert(tab.destroier8000.pct >= 0.3, 'destróier 8 km < 30%');
  for (const k of ['cruzador3000', 'trovao3000', 'corveta3000']) assert(tab[k].pct >= 0.6, k + ' < 60%: ' + F(tab[k].pct)); for (const k of ['cruzador8000', 'trovao8000']) assert(tab[k].pct >= 0.3, k + ' < 30%: ' + F(tab[k].pct));
  const base = bancaDisp('destroier', 5000, 600), inst = bancaDisp('destroier', 5000, 600, { instavel: 1 }), mov = bancaDisp('destroier', 5000, 600, { vel: 1, giro: 1 });
  assert(inst.pct < base.pct && mov.pct < inst.pct, `estável ${F(base.pct)} > instável ${F(inst.pct)} > em guinada a toda força ${F(mov.pct)}`);
  return linhas.join('; ') + `; 5 km: estável >3 s ${F(base.pct)}, recém-manobrado ${F(inst.pct)}, toda força + guinada ${F(mov.pct)}`; });

t('v1.2.4 ALCANCE do couraçado 305 mm: erro médio de alcance < 30 m a 3/5/8 km (1000 tiros, medido no plano do alvo, sem o casco parar as granadas)', () => {
  const out = []; for (const d of [3000, 5000, 8000]) { const r = bancaDisp('trovao', d, 1000, { semCasco: 1 }); out.push(`${d / 1000} km ${r.erroAlcance >= 0 ? '+' : ''}${r.erroAlcance.toFixed(1)} m (lat ${r.medLat.toFixed(1)} m, σlat ${r.sdLat.toFixed(0)} m)`);
    assert(Math.abs(r.erroAlcance) < 30, `${d}: erro de alcance ${r.erroAlcance.toFixed(1)} m`); assert(Math.abs(r.medLat) < Math.max(3, r.sdLat * 0.2) * 0.6, `${d}: viés lateral ${r.medLat.toFixed(1)} m sem folga`); }
  return out.join('; '); });

// ---------- v1.2.2: DETECÇÃO ----------
const { bloqueado: bloqT } = await import('../src/sim/maps.js');
const DIR_LIVRE = (() => { let best = 0, bd = 0; for (let k = 0; k < 72; k++) { const a = k * Math.PI / 36; let d = 0; for (let r = 250; r <= 14000; r += 250) { const x = P0.x + Math.sin(a) * r, z = P0.z - Math.cos(a) * r; if (alturaTerreno(ARENA, x, z) > -12 || bloqT(ARENA, P0.x, P0.z, 30, x, z, 30)) break; d = r; } if (d > bd) { bd = d; best = a; } } return { a: best, d: bd }; })();
/** Alcance (m) em que o time azul passa a ter contato de qualidade ≥ q com o alvo, nas condições dadas. */
function alcDet(obs, alvo, { hora = 'dia', tempo = 'limpo', radarObs = 0, radarAlvo = 0, v = 0, tiro = 0, q = 3 } = {}) { let ult = 0;
  for (let d = 500; d <= DIR_LIVRE.d; d += 250) { const s = new Sim({ arena: ARENA, seed: 3 }); s.ameacas.ligadas = 0; s.hora = hora; s.tempo = tempo; const a = s.adicionaNavio('azul', obs, P0.x, P0.z, 0); const x = P0.x + Math.sin(DIR_LIVRE.a) * d, z = P0.z - Math.cos(DIR_LIVRE.a) * d; const b = s.adicionaNavio('vermelho', alvo, x, z, 1.2, 'bot');
    a.radarAtivo = radarObs; b.radarAtivo = radarAlvo; b.v = v * b.C.vmax; if (tiro) b.tTiro = 0; s.t = 1; s.sensores(); const c = s.contatos.azul.get(b.id); if (c && c.q >= q) ult = d; else if (ult) break; }
  return ult; }
t('v1.2.2 DETECÇÃO por classe e condição (dia/entardecer/noite/chuva, furtivo, velocidade, tiro recente, radar ativo, ESM, sonar): mesmas regras para jogador e bots', () => { const out = []; assert(DIR_LIVRE.d >= 9000, 'sem água livre para o teste ' + DIR_LIVRE.d);
  const L = {}; for (const k of ['corveta', 'destroier', 'furtivo', 'cruzador', 'trovao']) { L[k] = { dia: alcDet('destroier', k), noite: alcDet('destroier', k, { hora: 'noite' }), chuva: alcDet('destroier', k, { tempo: 'chuva' }), rad: alcDet('destroier', k, { radarObs: 1, q: 2, hora: 'noite' }) }; out.push(`${CLASSES[k].nome}: dia ${L[k].dia} · noite ${L[k].noite} · chuva ${L[k].chuva} · radar ativo ${L[k].rad} m`); }
  for (const k in L) { assert(L[k].noite < L[k].dia * 0.5 && L[k].chuva < L[k].dia * 0.75, k + ' noite/chuva não reduzem'); assert(L[k].rad > L[k].noite, k + ' radar ativo não alcança mais que a visão noturna'); assert(L[k].dia < 12000, k + ' visto a ' + L[k].dia + ' (encontro deve ser gradual)'); }
  assert(L.furtivo.dia < L.destroier.dia && L.furtivo.rad < L.destroier.rad, 'furtivo não reduz assinatura'); assert(L.corveta.dia < L.cruzador.dia && L.cruzador.dia <= L.trovao.dia, 'tamanho não conta');
  const vel = alcDet('destroier', 'destroier', { v: 1 }), tiro = alcDet('destroier', 'destroier', { tiro: 1, hora: 'noite' }); assert(vel > L.destroier.dia, 'velocidade não aumenta assinatura'); assert(tiro > L.destroier.noite * 1.4, 'tiro à noite não revela');
  const esm = alcDet('destroier', 'destroier', { radarAlvo: 1, q: 1, hora: 'noite' }), radQ = alcDet('destroier', 'destroier', { radarObs: 1, q: 3, hora: 'noite' }); assert(esm > L.destroier.rad * 0.9, 'ESM: radar ativo do alvo não o denuncia ' + esm); assert(radQ < L.destroier.rad, 'radar sozinho não pode CONFIRMAR (nome/HP)');
  const son = alcDet('destroier', 'destroier', { hora: 'noite', tempo: 'chuva' }); { const esp = PARAM.deteccao.sonar * fatorSonar(CLASSES.destroier); assert(son >= esp - 250 && son <= esp + 250, 'sonar curto ' + son + ' esperado ' + esp.toFixed(0)); } /* v1.2.14: sonar −30% p/ furtivos (destroier f=0,75) */
  out.push(`destróier a toda velocidade ${vel} m; atirando à noite ${tiro} m; ESM (alvo com radar ativo) ${esm} m; sonar (noite+chuva) ${son} m`); return out.join(' | '); });
t('v1.2.2 DETECÇÃO: ilha bloqueia radar/visão; contato perdido vira fantasma por 10–15 s; trava e solução de tiro exigem alvo detectado (bots também)', () => { const out = [];
  // ilha: procura dois pontos de água funda a ~3 km com terra no meio
  const AQ = criaArena('arquipelago'); let par = null; for (let i = 0; i < 4000 && !par; i++) { const x1 = (i * 977 % 15000) - 7500, z1 = (i * 613 % 15000) - 7500; for (let k = 0; k < 16 && !par; k++) { const a = k * Math.PI / 8, x2 = x1 + Math.sin(a) * 3000, z2 = z1 - Math.cos(a) * 3000; if (alturaTerreno(AQ, x1, z1) < -20 && alturaTerreno(AQ, x2, z2) < -20 && bloqT(AQ, x1, z1, 60, x2, z2, 60)) par = [x1, z1, x2, z2]; } }
  assert(par, 'sem par com ilha');
  { const s = new Sim({ arena: AQ, seed: 4 }); s.ameacas.ligadas = 0; const a = s.adicionaNavio('azul', 'destroier', par[0], par[1], 0), b = s.adicionaNavio('vermelho', 'destroier', par[2], par[3], 0, 'bot'); a.radarAtivo = 1; b.radarAtivo = 1; s.t = 1; s.sensores(); assert(!s.contatos.azul.get(b.id), 'viu através da ilha'); out.push('ilha a 3 km bloqueia visão, radar e ESM'); }
  // fantasma
  { const s = new Sim({ arena: ARENA, seed: 4 }); s.ameacas.ligadas = 0; const a = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const x = P0.x + Math.sin(DIR_LIVRE.a) * 3000, z = P0.z - Math.cos(DIR_LIVRE.a) * 3000; const b = s.adicionaNavio('vermelho', 'destroier', x, z, 0, 'bot');
    s.t = 1; s.sensores(); assert(s.detectado('azul', b.id) && s.confirmado('azul', b.id), 'não detectou a 3 km'); b.x = P0.x + Math.sin(DIR_LIVRE.a) * 9500; b.z = P0.z - Math.cos(DIR_LIVRE.a) * 9500; b.radarAtivo = 0; let tPerda = null;
    for (let tt = 1.25; tt < 30; tt += 0.25) { s.t = tt; s.sensores(); const c = s.contatos.azul.get(b.id); if (!c) { tPerda = tt - 1; break; } assert(!s.detectado('azul', b.id) || tt < 2.2, 'continua "detectado" sem sensor'); }
    assert(tPerda >= 10 && tPerda <= 15, 'fantasma durou ' + tPerda); out.push(`fantasma "?" some ${tPerda.toFixed(1)} s depois do último contato`); }
  // trava exige detecção
  { const s = new Sim({ arena: ARENA, seed: 4 }); s.ameacas.ligadas = 0; s.hora = 'noite'; const a = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0); const x = P0.x + Math.sin(DIR_LIVRE.a) * 6000, z = P0.z - Math.cos(DIR_LIVRE.a) * 6000; const b = s.adicionaNavio('vermelho', 'destroier', x, z, 0, 'bot'); a.radarAtivo = 0; b.radarAtivo = 0;
    s.aplica({ id: a.id, t: 'travar', alvo: b.id }); for (let i = 0; i < 600; i++) { s.aplica({ id: a.id, t: 'mira', az: Math.atan2(b.x - a.x, -(b.z - a.z)), dist: 6000 }); s.passo(); } const tr0 = a.trava;
    s.aplica({ id: a.id, t: 'radar', v: 1 }); for (let i = 0; i < 900; i++) { s.aplica({ id: a.id, t: 'mira', az: Math.atan2(b.x - a.x, -(b.z - a.z)), dist: Math.hypot(b.x - a.x, b.z - a.z) }); s.passo(); }
    assert(tr0 < 0.05, 'travou sem detectar: ' + tr0); assert(a.trava > 0.5, 'radar ativo deveria permitir travar: ' + a.trava); out.push(`trava sem detecção ${tr0.toFixed(2)} → com radar ativo ${a.trava.toFixed(2)}`); }
  // bots: sem contato não atiram
  { const s = new Sim({ arena: ARENA, seed: 4 }); s.ameacas.ligadas = 0; s.hora = 'noite'; const a = s.adicionaNavio('azul', 'destroier', P0.x, P0.z, 0, 'bot'); const x = P0.x + Math.sin(DIR_LIVRE.a) * 6500, z = P0.z - Math.cos(DIR_LIVRE.a) * 6500; const b = s.adicionaNavio('vermelho', 'destroier', x, z, 0, 'jogador'); let tiros = 0; for (let i = 0; i < 1200; i++) { b.radarAtivo = 0; b.telAlvo = 0; s.passo(); for (const e of s.eventos) if ((e.t === 'tiro' || e.t === 'vls') && e.id === a.id) tiros++; s.eventos.length = 0; }
    const ca = s.contatos.azul.get(b.id); assert(!tiros, 'bot atirou sem detectar: ' + tiros + ' ' + JSON.stringify(ca)); out.push('bot sem contato (noite, alvo passivo a 6,5 km): 0 tiros'); }
  return out.join('; '); });
t('v1.2.6 Drone (DECOLAR, órbita a 100 m): data-link revela alvo atrás de ilha', () => {
  const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 3 }); const sim = S.sim, n = S.jogador, e = sim.navios.find((q) => q.time !== n.time); const T = sim.T;
  for (const q of sim.navios) if (q !== n && q !== e) { q.x = 1e9; q.morto = 1; }
  let par = null; const agua = (x, z) => alturaTerreno(T, x, z) < -12;
  for (let k = 0; k < 4000 && !par; k++) { const x = (Math.random() - 0.5) * T.tam * 0.8, z = (Math.random() - 0.5) * T.tam * 0.8; if (alturaTerreno(T, x, z) < 25) continue; const a = Math.random() * 6.28;
    const ex = x + Math.sin(a) * 1500, ez = z - Math.cos(a) * 1500, px = x - Math.sin(a) * 2500, pz = z + Math.cos(a) * 2500; if (agua(ex, ez) && agua(px, pz) && bloqueado(T, px, pz, 40, ex, ez, e.C.F + 10)) par = { ex, ez, px, pz, a }; }
  assert(par, 'não achou ilha entre os navios');
  Object.assign(e, { x: par.ex, z: par.ez, v: 0, telAlvo: 0 }); Object.assign(n, { x: par.px, z: par.pz, v: 0, telAlvo: 0, radarAtivo: 0 }); e.radarAtivo = 0; n.alvoId = -1; Object.assign(e, { sam: 0, vls: 0, torp: 0, papel: 'alvo' });
  for (let i = 0; i < 120; i++) { n.x = par.px; n.z = par.pz; e.x = par.ex; e.z = par.ez; sim.passo([]); } const antes = !!sim.detectado(n.time, e.id);
  sim.comando ? 0 : 0; const _ev = sim.evento.bind(sim); sim._evDbg = []; sim.evento = (x) => { if (/uav/i.test(x.t)) sim._evDbg.push(x.t + '@' + sim.t.toFixed(1) + ':' + (x.por ?? '')); return _ev(x); }; const okL = lancaUav(sim, n); assert(okL, 'drone não decolou'); const u = sim.uavs[n.uav]; u.cx = par.ex; u.cz = par.ez; /* órbita sobre o contato provável */
  let alt = 0, viu = null; for (let i = 0; i < 60 * 140; i++) { n.x = par.px; n.z = par.pz; e.x = par.ex; e.z = par.ez; sim.passo([]); alt = Math.max(alt, u.y); if (u.ativo && sim.detectado(n.time, e.id)) { viu = sim.detectado(n.time, e.id); break; } }
  if (viu) for (let i = 0; i < 60 * 40 && u.ativo; i++) { n.x = par.px; n.z = par.pz; e.x = par.ex; e.z = par.ez; sim.passo([]); alt = Math.max(alt, u.y); } /* v1.2.11: a revelação pode ocorrer ainda na subida — mede a órbita depois */
  const depois = viu; if (!depois) console.error('DBG', JSON.stringify({ ev: (sim._evDbg || []).slice(-3), at: u.ativo, y: u.y, fase: u.fase, d: Math.hypot(u.x - e.x, u.z - e.z), bl: bloqueado(T, u.x, u.z, u.y, e.x, e.z, e.C.F + 10), hT: alturaTerreno(T, u.x, u.z), uav: n.uav })); assert(!antes, 'já via o alvo atrás da ilha sem drone'); assert(depois, 'drone não revelou o alvo'); assert(alt > 70 && alt < 140, 'altitude da órbita ' + alt);
  return `sem drone: oculto; com drone (órbita ${Math.round(alt)} m): revelado via ${depois.fonte}`; });
t('v1.2.8 Toda arma causa DANO > 0 no acerto e gera número de dano (canhão 30/127/305 mm, LG-4, LF-12, foguete de heli, míssil, ouro, torpedo, drone, metralhadora)', () => {
  const casos = ['can30', 'can127', 'can305', 'lg4', 'lf12', 'heliFog', 'missil', 'missilOuro', 'torpedo', 'drone', 'mg']; const res = [];
  for (const c of casos) { const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 5 }); const sim = S.sim, n = S.jogador, e = sim.navios.find((q) => q.time !== n.time);
    for (const q of sim.navios) if (q !== n && q !== e) { q.x = 1e9; q.morto = 1; }
    let px = 0, pz = 0; outer: for (let r = 0; r < 6000; r += 400) for (let k = 0; k < 16; k++) { const x = Math.cos(k) * r, z = Math.sin(k) * r; if (alturaTerreno(sim.T, x, z) < -20 && alturaTerreno(sim.T, x, z - 1500) < -20 && alturaTerreno(sim.T, x, z - 750) < -20) { px = x; pz = z; break outer; } }
    Object.assign(n, { x: px, z: pz, v: 0, rumo: 0 }); Object.assign(e, { x: px, z: pz - 1500, v: 0, rumo: Math.PI / 2, sam: 0, vls: 0, torp: 0, papel: 'alvo', rbu: 0 }); for (const q of [n, e]) { q.ciws = []; q.a30 = []; }
    const evs = []; const _ev = sim.evento.bind(sim); sim.evento = (x) => { if ((x.t === 'impacto' || x.t === 'torpImpacto') && x.alvo === e.id && x.dono === n.id) evs.push(x); return _ev(x); };
    const v0 = e.vida; const livre = (pool) => pool.find((q) => !q.ativo); const ey = e.arfagem + e.C.F * 0.5;
    const granada = (cal, extra) => Object.assign(livre(sim.granadas), { ativo: 1, x: e.x, y: ey + 0.5, z: e.z + 250, vx: 0, vy: 0, vz: -900, dono: n.id, time: n.time, dano: 10, cal, t: 0, k: 0, fogo: 0, ap: 0, foguete: 0, rbu: 0 }, extra);
    if (c === 'can30') granada(30, { dano: 1.2 }); else if (c === 'can127') granada(127, { dano: 10 }); else if (c === 'can305') granada(305, { dano: 60, ap: 1 });
    else if (c === 'lg4') granada(120, { dano: GRANADAS.dano, rbu: 1 }); else if (c === 'heliFog') granada(70, { dano: 5, foguete: 1, vz: -820 });
    else if (c === 'lf12') Object.assign(livre(sim.granadas), { ativo: 1, x: e.x, y: 3, z: e.z + e.C.B / 2 + 8, vx: 0, vy: -40, vz: 0, dono: n.id, time: n.time, dano: 15, cal: 120, t: 0, k: 0, fogo: 0, ap: 0, foguete: 0, rbu: 1 });
    else if (c === 'missil' || c === 'missilOuro') { const pf = MISSEIS.medio; Object.assign(livre(sim.misseis), { ativo: 1, x: e.x, y: 20, z: e.z + 500, vx: 0, vy: 0, vz: -pf.v, dono: n.id, time: n.time, alvo: e.id, isca: -1, fase: FASE.TERMINAL, t: 5, v: pf.v, perfil: pf, cel: 0, iscasVistas: 0, tf: 0, d0: 1500, samAlvo: 0, samTent: 0, livre: 0, azL: 0, heli: 0, ouro: c === 'missilOuro' ? 1 : 0, dano: pf.dano * (c === 'missilOuro' ? 1.25 : 1), pkMul: 1 }); }
    else if (c === 'torpedo') Object.assign(livre(sim.torpedos), { ativo: 1, x: e.x, y: -2.5, vy: 0, sub: 1, z: e.z + 400, rumo: 0, rumoAlvo: 0, v: 40, dono: n.id, time: n.time, alvo: e.id, corrida: 300, modo: 'reto', t: 5, buscando: 0, danoMul: 1, alcMax: 0, leve: 0, lancha: 0 });
    else if (c === 'drone') Object.assign(livre(sim.drones), { ativo: 1, x: e.x, y: e.arfagem + e.C.F + 2, z: e.z + 60, vx: 0, vy: 0, vz: -30, dono: n.id, time: n.time, alvo: e.id, t: 0, mergulho: 1 });
    else if (c === 'mg') { const ap = sim.dano(e, 2, n, 'heli', true); assert(ap > 0, 'metralhadora sem dano'); res.push('mg ' + ap.toFixed(1)); continue; }
    for (let i = 0; i < 60 * 25 && !evs.length; i++) { e.x = px; e.z = pz - 1500; e.v = 0; sim.passo([]); }
    assert(e.vida < v0, c + ': sem dano no casco'); assert(evs.length && evs[0].dano > 0, c + ': sem número de dano (evento ' + JSON.stringify(evs[0] || null) + ')'); res.push(`${c} ${evs[0].dano}`); }
  return res.join(' · '); });
t('v1.2.8 Canhões: granada sai da BOCA de cada cano (≤ 1 m), torre de ré não atira para vante bloqueada pela superestrutura, fogo amigo = 0 de dano', () => {
  const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'cruzador', seed: 6 }); const sim = S.sim, n = S.jogador; for (const q of sim.navios) if (q !== n) { q.x = 1e9; q.morto = 1; }
  n.x = 0; n.z = 0; n.rumo = 0.3; n.v = 0; let maxE = 0, nt = 0; const evs = []; const _ev = sim.evento.bind(sim); sim.evento = (x) => { if (x.t === 'tiro') evs.push(x); return _ev(x); };
  for (let i = 0; i < n.torres.length; i++) { const tr = n.torres[i], b = n.P.torres[i]; tr.az = b.frente > 0 ? 0.4 : Math.PI - 0.4; tr.el = 0.1; tr.rec = 0; evs.length = 0; sim.disparaCanhao(n, i, null); const nc = tr.canos || 1;
    for (const e of evs) { const lado = nc > 1 ? (2 * e.cano - (nc - 1)) / (nc - 1) : 0; const Lc = b.lc - b.pz, ce = Math.cos(tr.el); const lx = Math.sin(tr.az) * Lc * ce + Math.cos(tr.az) * lado * b.esp, ly = b.y + b.py + Math.sin(tr.el) * b.lc, lz = b.z - Math.cos(tr.az) * Lc * ce + Math.sin(tr.az) * lado * b.esp;
      const c = Math.cos(n.rumo), sn = Math.sin(n.rumo); const wx = n.x + lx * c - lz * sn, wz = n.z + lx * sn + lz * c; const err = Math.hypot(e.x - wx, e.z - wz, e.y - (ly + n.arfagem)); maxE = Math.max(maxE, err); nt++;
      const g = sim.granadas.find((q) => q.ativo && Math.abs(q.x - e.x) < 1e-6 && Math.abs(q.z - e.z) < 1e-6); assert(g, 'granada não nasceu na boca'); } }
  assert(nt > 0 && maxE <= 1, 'boca a ' + maxE.toFixed(2) + ' m');
  /* torre de ré: alvo bem à proa → fica no limite do arco e NÃO dispara */
  const ir = n.P.torres.findIndex((b) => b.frente <= 0); assert(ir >= 0, 'sem torre de ré'); const tr = n.torres[ir]; n.mira.az = n.rumo; n.mira.dist = 5000; n.alvoId = -1; n.gatilho = 2; let tiros = 0; evs.length = 0;
  for (let i = 0; i < 60 * 8; i++) { n.x = 0; n.z = 0; n.gatilho = 2; sim.passo([]); } tiros = evs.filter((e) => e.torre === ir).length; const lim = Math.abs(ang(tr.az - Math.PI));
  assert(tiros === 0, 'torre de ré disparou ' + tiros + 'x para vante'); assert(tr.bloqueada === 1 && Math.abs(lim - n.P.torres[ir].arco) < 0.05, 'torre não parou no limite do arco');
  const vante = evs.filter((e) => n.P.torres[e.torre].frente > 0).length; assert(vante > 0, 'torres de vante não dispararam');
  /* fogo amigo */ const S2 = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 6 }); const s2 = S2.sim, j = S2.jogador, al = s2.navios.find((q) => q !== j && q.time === j.time); const v0 = al.vida;
  const ap = s2.dano(al, 50, j, 'canhao') + s2.dano(al, 300, j, 'missil') + s2.dano(al, 300, j, 'torpedo'); assert(ap === 0 && al.vida === v0, 'aliado levou dano ' + (v0 - al.vida));
  const ini = s2.navios.find((q) => q.time !== j.time); assert(s2.dano(ini, 50, j, 'canhao') > 0, 'inimigo sem dano');
  return `${nt} canos: erro máx. ${maxE.toFixed(3)} m da boca · torre de ré ${ir} parou a ${(lim * 57.3).toFixed(0)}° da popa (arco ${(n.P.torres[ir].arco * 57.3).toFixed(0)}°), 0 tiros para vante, vante ${vante} tiros · fogo amigo 0 HP`; });
t('v1.2.9 Lança-granadas: salva mais AGRUPADA — a 2,5 km contra fragata parada a maioria dos foguetes acerta', () => {
  const roda1 = (disp, D = 2500) => { const bak = Object.assign({}, RBU_DISP); Object.assign(RBU_DISP, disp); let acertos = 0, tot = 0; const pts = [];
    for (let k = 0; k < 4; k++) { const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 20 + k }); const sim = S.sim, n = S.jogador; const e = sim.navios.find((q) => q.time !== n.time && q.C.id === 'fragata') || sim.navios.find((q) => q.time !== n.time);
      for (const q of sim.navios) if (q !== n && q !== e) { q.x = 1e9; q.morto = 1; } let px = 0, pz = 0; outer: for (let r = 0; r < 6000; r += 300) for (let a = 0; a < 16; a++) { const x = Math.cos(a) * r, z = Math.sin(a) * r; let ok = 1; for (let f = 0; f <= 1; f += 0.25) if (alturaTerreno(sim.T, x, z - D * f) > -15) ok = 0; if (ok) { px = x; pz = z; break outer; } }
      Object.assign(n, { x: px, z: pz, v: 0, rumo: 0, telAlvo: 1 }); Object.assign(e, { x: px, z: pz - D, v: 0, rumo: Math.PI / 2, telAlvo: 1, sam: 0, vls: 0, torp: 0, rbu: 0, papel: 'alvo' }); e.vida = 1e9; n.alvoId = e.id; n.trava = 1; n.mira.az = 0; n.mira.dist = D;
      const evs = []; const _ev = sim.evento.bind(sim); sim.evento = (x) => { if (x.t === 'impacto' && x.alvo === e.id && x.tipo === 'rbu') evs.push(x); if ((x.t === 'agua' || x.t === 'impacto') && x.cal === 120 && x.dono === n.id) pts.push([x.x - e.x, x.z - e.z]); return _ev(x); };
      for (let i = 0; i < 90; i++) { n.x = px; n.z = pz; sim.passo([]); } n.tRbu = 0; n.rbuFila = 0; n.rbu = 5; const ok = sim.lancaRbu(n, e.id); assert(ok, 'não lançou');
      const vis = new Set(); for (let i = 0; i < 60 * 25; i++) { n.x = px; n.z = pz; e.x = px; e.z = pz - D; sim.passo([]); sim.granadas.forEach((g, gi) => { if (g.ativo && g.rbu) vis.add(gi); }); }
      tot += vis.size; acertos += new Set(evs.filter((x) => x.ly > -2).map((x) => Math.round(x.x) + ',' + Math.round(x.z))).size; }
    Object.assign(RBU_DISP, bak); const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length; const raio = Math.sqrt(pts.reduce((a, p) => a + (p[0] - cx) ** 2 + (p[1] - cz) ** 2, 0) / pts.length); return { frac: acertos / Math.max(1, tot), raio, tot }; };
  const ant = roda1({ v: 0.01, el: 0.012, az: 0.02 }), nov = roda1({}), max = roda1({}, GRANADAS.alc - 100);
  assert(PARAM.rbuArco || nov.raio < ant.raio * 0.65, `raio ${nov.raio.toFixed(0)} vs ${ant.raio.toFixed(0)} m`); assert(nov.frac > 0.5, 'acertos ' + (nov.frac * 100).toFixed(0) + '% (antes ' + (ant.frac * 100).toFixed(0) + '%), raio ' + nov.raio.toFixed(0) + ' vs ' + ant.raio.toFixed(0) + ' m, cx ' + JSON.stringify(nov));
  return `${PARAM.rbuArco ? 'v1.2.11 ARCO semiguiado · ' : ''}raio RMS da salva a 2,5 km: 1.2.8 ${ant.raio.toFixed(0)} m → atual ${nov.raio.toFixed(0)} m · acertos diretos ${(ant.frac * 100).toFixed(0)}% → ${(nov.frac * 100).toFixed(0)}% (${nov.tot} foguetes) · no alcance máx. ${((GRANADAS.alc - 100) / 1000).toFixed(1)} km: raio ${max.raio.toFixed(0)} m, acertos ${(max.frac * 100).toFixed(0)}% (${max.tot} foguetes)`; });
t('v1.2.9 Torpedo a 200 m/s não atravessa cascos (colisão varrida) e acerta alvo travado', () => {
  let hits = 0, N = 0; const res = [];
  for (const [cls, k] of [['corveta', 0], ['fragata', 1], ['cruzador', 2]]) for (let j = 0; j < 6; j++) { const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'fragata', seed: 30 + j + k * 7 }); const sim = S.sim, n = S.jogador; const e = sim.navios.find((q) => q.time !== n.time);
    for (const q of sim.navios) if (q !== n && q !== e) { q.x = 1e9; q.morto = 1; } let px = 0, pz = 0; outer: for (let r = 0; r < 6000; r += 300) for (let a = 0; a < 16; a++) { const x = Math.cos(a) * r, z = Math.sin(a) * r; let ok = 1; for (let f = 0; f <= 1; f += 0.2) if (alturaTerreno(sim.T, x, z - 2000 * f) > -15) ok = 0; if (ok) { px = x; pz = z; break outer; } }
    Object.assign(n, { x: px, z: pz, v: 0, rumo: 0 }); Object.assign(e, { x: px + (j - 2.5) * e.C.L * 0.12, z: pz - 2000, v: 0, rumo: Math.PI / 2, sam: 0, vls: 0, torp: 0, papel: 'alvo', ciws: [], a30: [] }); e.chaff = 0;
    const evs = []; const _ev = sim.evento.bind(sim); sim.evento = (x) => { if (x.t === 'torpImpacto' && x.alvo === e.id) evs.push(x); return _ev(x); };
    const tp = sim.torpedos.find((q) => !q.ativo); Object.assign(tp, { ativo: 1, x: px, y: -2.5, vy: 0, sub: 1, z: pz - 50, rumo: 0, rumoAlvo: 0, v: TORPEDO.v, dono: n.id, time: n.time, alvo: j % 2 ? e.id : -1, corrida: 0, modo: 'reto', t: 0, buscando: 0, danoMul: 1, alcMax: 0, leve: 0, lancha: 0 });
    let passou = 0; for (let i = 0; i < 60 * 12 && tp.ativo; i++) { e.x = px + (j - 2.5) * e.C.L * 0.12; e.z = pz - 2000; sim.passo([]); if (tp.ativo && tp.z < e.z - 30) passou = 1; }
    N++; if (evs.length) hits++; else res.push(`${cls}#${j}${passou ? ' ATRAVESSOU' : ''}`); }
  assert(hits === N, `acertos ${hits}/${N}: ${res.join(', ')}`); return `${hits}/${N} acertos de través a ${TORPEDO.v} m/s (amostras a cada 2 m) — nenhum atravessou`; });
t('v1.2.7 Montagens de armas (LG-4, CIWS, 30 mm, tubos, VLS, torres) dentro da boca em TODOS os navios', () => {
  let n = 0; const fora = []; const R = { ciws: 1.0, a30: 0.8, tubos: 1.0, granadas: 1.9, celulas: 0.5 };
  for (const k of ORDEM_CLASSES) { const C = CLASSES[k]; const P = layoutDe(C); const spon = (P.blocosVls || []).filter((b) => b.tipo === 'samPa'); const chk = (tipo, m, r) => { n++; const sp = tipo === 'celulas' && spon.find((b) => Math.abs(m.z - b.zc) <= (b.lin * b.cs + 0.6) / 2 + 0.01 && Math.abs((m.x || 0) - b.xc) <= (b.col * b.cs + 0.6) / 2 + 0.01); if (sp) return; if (m.spon && C.superPA && Math.abs(m.z) <= C.L / 2 && Math.abs(m.x || 0) + r <= Math.abs(bordaPA(C, m.z, m.spon)) + 3.2) return; /* v1.2.25: CIWS/30 mm em PATROCÍNIO do super porta-aviões (além do costado, sob a borda do convés de voo) — conferidos dentro do patrocínio */ /* v1.2.17 item 7: células SAM em PATROCÍNIO (sponson) do porta-aviões ficam de propósito além do costado — conferidas dentro do próprio patrocínio */ const mb = meiaBoca(C, m.z); if (Math.abs(m.z) > C.L / 2 || Math.abs(m.x || 0) + r > mb + 0.15) fora.push(`${k}.${tipo} x=${(m.x || 0).toFixed(1)}+${r} > ${mb.toFixed(1)} @z=${m.z.toFixed(0)}`); };
    for (const tipo of Object.keys(R)) for (const m of P[tipo] || []) chk(tipo, m, m.sub ? 0.3 : m.r || R[tipo]);
    for (const t of P.torres) chk('torre', { x: 0, z: t.z }, 2.6 * (C.canhao.cal / 127) * (t.esc || 1));
    for (const g of P.granadas || []) { for (const b of P.blocosVls || []) { const hw = (b.col * b.cs + 0.6) / 2, hl = (b.lin * b.cs + 0.6) / 2; if (Math.abs(g.z - b.zc) < hl + g.r && Math.abs(g.x) - g.r < hw) fora.push(k + '.LG-4 sobre o VLS'); }
      if (!g.re && g.z > P.sup.z0 - 0.5) fora.push(k + '.LG-4 dentro da superestrutura'); if (g.re && (!C.heli || g.z + g.r > C.L * 0.28 + 2 || g.z - g.r < C.L * 0.16 + 2)) fora.push(k + '.LG-4 de ré fora do teto do hangar/sobre o convoo'); for (const t of P.torres) if (Math.abs(g.z - t.z) < g.r + 3.5 && Math.abs(g.x) < g.r + 3.5) fora.push(k + '.LG-4 na torre'); } }
  assert(!fora.length, fora.slice(0, 6).join('; ')); return `${n} montagens em ${ORDEM_CLASSES.length} navios, todas dentro do casco`; });
t('v1.2.7 Lança-granadas: montagens giram e os foguetes saem na direção da MIRA; fora do setor não dispara', () => {
  const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed: 4 }); const sim = S.sim, n = S.jogador; for (const q of sim.navios) if (q !== n) { q.x = 1e9; q.morto = 1; }
  n.x = 0; n.z = 0; n.rumo = 0; n.v = 0; n.telAlvo = 0; n.alvoId = -1; const azs = []; const res = [];
  for (const alvoAz of [0.6, -1.2, Math.PI]) { n.tRbu = 0; n.rbuFila = 0; n.rbu = 5; n.mira.az = alvoAz; n.mira.dist = 2500; for (let i = 0; i < 60; i++) { n.x = 0; n.z = 0; n.rumo = 0; sim.passo([]); }
    const g0 = new Set(sim.granadas.filter((g) => g.ativo).map((g) => g.idx ?? sim.granadas.indexOf(g))); const ok = sim.lancaRbu(n, -1); assert(ok, 'não lançou para az ' + alvoAz);
    const vis = new Set(); for (let i = 0; i < 60 * 8; i++) { n.x = 0; n.z = 0; n.rumo = 0; sim.passo([]); sim.granadas.forEach((g, k) => { if (g.ativo && g.rbu && !g0.has(k) && !vis.has(k) && g.t < 0.1) { vis.add(k); azs.push(Math.atan2(g.vx, -g.vz)); const e = Math.abs(ang(Math.atan2(g.vx, -g.vz) - alvoAz)); assert(e < 0.12, `foguete a ${e.toFixed(3)} rad da mira (az ${alvoAz})`); } }); if (n.rbuFila <= 0 && i > 30) break; }
    assert(vis.size >= 4, 'poucos foguetes ' + vis.size + ' az ' + alvoAz); res.push(`${alvoAz.toFixed(1)} rad: ${vis.size} foguetes`); }
  /* navio só com o par de vante (corveta): mira pela popa → recusa */ const S2 = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'corveta', seed: 4 }); const m = S2.jogador; m.rumo = 0; m.mira.az = Math.PI; m.mira.dist = 2000; m.alvoId = -1;
  assert(S2.sim.montRbu(m, Math.PI).length === 0, 'corveta tem montagem cobrindo a popa'); assert(!S2.sim.lancaRbu(m, -1), 'disparou fora do setor');
  return res.join(' · ') + ' · popa sem montagem: recusado'; });
t('v1.2.29 fatorNuclear contínua (sem degraus em R0=800 m e Rp=2500 m) e pontos-chave', () => { const f = fatorNuclear, R = [800, 2500], res = [];
  for (const r of R) for (const e of [-0.5, 0.5]) { const dd = Math.abs(f(r + e) - f(r)); assert(dd < 0.005, `salto em ${r}${e > 0 ? '+' : ''}${e}: ${dd}`); res.push(`|f(${r}${e > 0 ? '+' : ''}${e})−f(${r})|=${dd.toExponential(2)}`); }
  const pts = [[0, 0.5], [800, 0.425], [2500, 0.18], [5000, 0]]; for (const [d, v] of pts) assert(Math.abs(f(d) - v) < 1e-9, `f(${d})=${f(d)} ≠ ${v}`);
  assert(f(6000) === 0, 'f(6000) ≠ 0'); return res.join(' · ') + ' · ' + pts.map(([d]) => `f(${d})=${+f(d).toFixed(4)}`).join(' '); });
console.log(res.join('\n')); console.log(`\n${ok} passaram, ${falhas} falharam`); process.exit(falhas ? 1 : 0);
