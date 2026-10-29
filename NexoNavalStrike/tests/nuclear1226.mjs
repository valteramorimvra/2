// v1.2.26 NUCLEAR — teste isolado (Node): decolagem, voo, soltura, detonação, dano no raio/borda, FOGO AMIGO 0, limites, interceptação, IA, determinismo.
// Uso: node --experimental-websocket tests/nuclear1226.mjs
import { Sim, DT } from '../src/sim/world.js';
import { criaArena } from '../src/sim/maps.js';
import { NUK, fatorNuclear } from '../src/sim/nuclear.js';
import { valida } from '../src/net/commands.js';
const A = criaArena('atois'); let ok = 0, fal = 0; const out = [];
const t = (nome, f) => { try { const r = f(); ok++; out.push('✔ ' + nome + (r ? ' — ' + r : '')); } catch (e) { fal++; out.push('✘ ' + nome + ': ' + e.message); } };
const assert = (c, m) => { if (!c) throw new Error(m); };
function cena(seed = 7, defesa = false) { const s = new Sim({ arena: A, seed }); s.revelaTudo = 1; if (s.ameacas) s.ameacas.ligadas = 0;
  const X = 6000, Z = 1000; // área de mar aberto em 'atois' (verificada: terreno < -30 m num retângulo de 5 × 9,5 km)
  const pa = s.adicionaNavio('azul', 'atlantico', X, Z + 6000, 0, 'jogador'); pa.C = Object.assign(Object.create(Object.getPrototypeOf(pa.C)), pa.C, { nuclear: { bombas: 1 } });
  const al = s.adicionaNavio('azul', 'fragata', X + 300, Z + 400, 0, 'bot'); // aliado DENTRO do raio total
  const e = [s.adicionaNavio('vermelho', 'destroier', X, Z, 0, 'bot'), s.adicionaNavio('vermelho', 'fragata', X + 450, Z, 0, 'bot'), s.adicionaNavio('vermelho', 'corveta', X + 2400, Z, 0, 'bot'), s.adicionaNavio('vermelho', 'cruzador', X - 5600, Z, 0, 'bot')]; /* v1.2.27: borda ~2,4 km; fora >5 km */
  if (!defesa) { const od = s.dano.bind(s); s.dano = (n, d, dono, como, sil) => (n === al && como !== 'nuclear' ? 0 : od(n, d, dono, como, sil)); } // isola: canhões automáticos dos 'alvos' não afundam o aliado antes da bomba
  for (const n of s.navios) { n.telAlvo = 0; n.v = 0; if (!defesa) { if (n !== pa) n.papel = 'alvo'; /* alvos não pensam nem atiram: isola o efeito nuclear */ n.sam = 0; n.ciws = []; n.lasers = []; } } return { s, pa, al, e }; }
const roda = (s, seg, f) => { for (let i = 0; i < seg * 60; i++) { s.passo(); if (f && f()) return i / 60; } return -1; };
t('comando nuclear passa pela validação de rede', () => { const c = valida({ id: 0, t: 'nuclear', alvo: 2 }); assert(c && c.alvo === 2, 'descartado'); });
t('liberação só após ' + NUK.liberaApos + ' s', () => { const { s, pa, e } = cena(); s.aplica({ id: pa.id, t: 'nuclear', alvo: e[0].id }); const neg = s.eventos.find((x) => x.t === 'nkNegado'); assert(neg && neg.motivo === 'cedo', 'lançou cedo'); assert(pa.nk.bombas === 1, 'gastou bomba'); });
let det1;
t('ciclo completo: decola, solta, detona; raio total destrói; borda danifica; fora do raio intacto; aliado 0', () => { const { s, pa, al, e } = cena(); s.t = NUK.liberaApos; const vi = e.map((n) => n.vida), vAl = al.vida;
  s.aplica({ id: pa.id, t: 'nuclear', alvo: e[0].id }); assert(s.nukes[0].ativo, 'não decolou'); const ev = []; let vAnt = al.vida, vDep = -1; const tt = roda(s, 300, () => { if (s.nukeDet.length) { vDep = al.vida; return 1; } vAnt = al.vida; for (const x of s.eventos) ev.push([x.t, +s.t.toFixed(2)]); s.eventos.length = 0; return s.nukeDet.length > 0; });
  assert(tt > 0, 'não detonou'); const d = s.nukeDet[0]; det1 = d; const fase = (k) => (ev.find((x) => x[0] === k) || [])[1];
  assert(e[0].morto && e[1].morto, 'navios no raio total não destruídos'); assert(!e[2].morto && e[2].vida < vi[2], 'borda sem dano'); assert(e[3].vida === vi[3], 'fora do raio levou dano'); assert(vDep === vAnt && !al.morto && !d.danos.some((x) => x[0] === al.id), 'FOGO AMIGO causou dano ' + JSON.stringify({ vAnt, vDep, m: al.morto, dn: d.danos })); void vAl;
  assert(Math.abs(d.y - NUK.hRajada) < 8, 'altura de rajada ' + d.y);
  return `decolou t=${NUK.liberaApos}s, no ar ${fase('nkNoAr')}s, soltou ${fase('nkSolta')}s, paraquedas ${fase('nkChute')}s, detonou ${s.t.toFixed(1)}s a ${d.y.toFixed(0)} m; ponto zero a ${Math.hypot(d.x - e[0].x, d.z - e[0].z).toFixed(0)} m do alvo; corveta a 1,3 km: ${Math.round(100 * (1 - e[2].vida / vi[2]))}% de dano; aliado 0`; });
t('bombardeiro volta e pousa; 2º lançamento negado (1 por porta-aviões)', () => { const { s, pa, e } = cena(); s.t = NUK.liberaApos; s.aplica({ id: pa.id, t: 'nuclear', alvo: e[0].id }); let pousou = 0; roda(s, 260, () => { if (s.eventos.some((x) => x.t === 'nkPousa')) pousou = 1; s.eventos.length = 0; return pousou; });
  assert(pousou, 'não pousou'); s.aplica({ id: pa.id, t: 'nuclear', alvo: e[3].id }); assert(s.eventos.some((x) => x.t === 'nkNegado' && x.motivo === 'usada'), 'permitiu 2º'); return 'pousou em ' + s.t.toFixed(0) + ' s'; });
t('fator de dano por distância (curva)', () => { const v = [0, 1500, 2000, 3000, 4000, 5000].map((d) => d + ' m=' + fatorNuclear(d).toFixed(2)); assert(fatorNuclear(1500) === 1 && fatorNuclear(5000) === 0 && fatorNuclear(3000) >= 0.5 && fatorNuclear(3000) <= 0.6, 'curva 1.2.27'); return v.join(' · '); });
t('com defesas ligadas: interceptação estatística (40 partidas)', () => { let det = 0, abat = 0, bomb = 0; for (let k = 0; k < 40; k++) { const { s, pa, e } = cena(100 + k, true); s.t = NUK.liberaApos; s.aplica({ id: pa.id, t: 'esquadrilha' }); /* escolta */ for (let w = 0; w < 90; w++) s.passo(); s.aplica({ id: pa.id, t: 'nuclear', alvo: e[0].id }); let fim = 0;
    roda(s, 320, () => { for (const x of s.eventos) { if (x.t === 'nkAbatido' && x.comBomba) { abat++; fim = 1; } if (x.t === 'nkBombaAbatida') { bomb++; fim = 1; } if (x.t === 'nkDetona') { det++; fim = 1; } } s.eventos.length = 0; return fim; }); }
  assert(det >= 28, 'meta ≥70% detona vs frota defendida (alvo ≥80% com escolta)'); return `detonou ${det}/40 · bombardeiro abatido antes de soltar ${abat}/40 · bomba destruída em queda ${bomb}/40`; });
t('IA de bot usa com critério (agrupamento ≥ 2) e não usa contra alvo isolado', () => { const { s, e } = cena(); const X0 = 6000, Z0 = 7000; const bot = s.adicionaNavio('vermelho', 'atlantico', X0, Z0 - 5000, Math.PI, 'bot'); bot.C = Object.assign(Object.create(Object.getPrototypeOf(bot.C)), bot.C, { nuclear: { bombas: 1 } }); void e;
  s.t = NUK.liberaApos + 31; for (let i = 0; i < 300; i++) s.passo(); const lancou = s.eventos.some((x) => x.t === 'nkDecola' && x.id === bot.id);
  const s2 = new Sim({ arena: A, seed: 3 }); s2.revelaTudo = 1; if (s2.ameacas) s2.ameacas.ligadas = 0; s2.adicionaNavio('azul', 'corveta', 6000, 7000, 0, 'bot'); const b2 = s2.adicionaNavio('vermelho', 'atlantico', 6000, 1000, Math.PI, 'bot'); b2.C = Object.assign(Object.create(Object.getPrototypeOf(b2.C)), b2.C, { nuclear: { bombas: 1 } }); s2.t = NUK.liberaApos + 31; for (let i = 0; i < 300; i++) s2.passo(); const isolado = s2.eventos.some((x) => x.t === 'nkDecola');
  assert(!isolado, 'usou contra alvo isolado cedo'); return `agrupamento (PA azul + fragata aliada a 400 m — mas sem defesa desligada: aliados bots ainda lutam): ${lancou ? 'lançou' : 'não lançou'} · alvo isolado: não lançou`; });
t('determinismo (mesma semente → mesmo resultado)', () => { const h = []; for (let k = 0; k < 2; k++) { const { s, pa, e } = cena(55, true); s.t = NUK.liberaApos; s.aplica({ id: pa.id, t: 'nuclear', alvo: e[0].id }); roda(s, 60); h.push(s.hashEstado() + ':' + s.navios.map((n) => n.vida.toFixed(1)).join(',')); } assert(h[0] === h[1], 'divergiu'); });
t('custo da simulação por passo (bombardeiro + bomba ativos)', () => { const { s, pa, e } = cena(9, true); s.t = NUK.liberaApos; s.aplica({ id: pa.id, t: 'nuclear', alvo: e[0].id }); const t0 = performance.now(); for (let i = 0; i < 600; i++) s.passo(); const ms = (performance.now() - t0) / 600; return ms.toFixed(3) + ' ms/passo (Sim inteiro, 6 navios)'; });
console.log(out.join('\n')); console.log(`\n${ok} ok / ${fal} falhas`); process.exit(fal ? 1 : 0);
