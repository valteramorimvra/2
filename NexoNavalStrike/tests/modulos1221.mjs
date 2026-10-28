// v1.2.21 itens 19/19b/19c — AUDITORIA da economia que afeta a batalha. Para cada opção comprável: efeito MEDIDO no sim (com × sem)
// = descrição ±2%; a ficha/estaleiro mostra o mesmo valor; bots seguem a mesma regra; empilhamento multiplica sem dupla contagem.
// BASE=1 roda o mesmo roteiro no código 1.2.20 (/tmp/base1220) para a coluna "antes".
import { writeFileSync, readFileSync } from 'node:fs';
const B = process.env.BASE ? '/tmp/base1220/' : '../src/', base = !!process.env.BASE;
const { criaSessao } = await import(B + 'sim/session.js'); const { CLASSES, FTEL } = await import(B + 'sim/classes.js');
const E = await import(B + 'navalTechTreeEconomy.js'); const { modsDe, MODULOS, PROPULSAO, MUNICOES, MISSEIS_OPC, ISCAS, PINTURAS, LOTE_CAP, Economia } = E;
const CM = await import(B + 'navalComandantes.js'); const { aplicaComandante, fatorNivel } = CM;
const { alcRadar } = await import(B + 'sim/deteccao.js'); const { alturaTerreno } = await import(B + 'sim/maps.js'); const OC = await import(B + 'sim/ocean.js'); const AV = await import(B + 'naval5v5/avarias.js');
const PA = await import(B + 'armasParametros.js'); const FT = await import(B + 'fichaTecnica.js'); const CO = await import(B + 'naval5v5/consumiveis.js');
const { recargaMinCal } = PA.recargaMinCal ? PA : await import('../src/armasParametros.js');
let ok = 0, falha = 0; const L = [], TAB = [];
const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
const r3 = (x) => Math.round(x * 1000) / 1000;
const linha = (opcao, atributo, desc, med, ficha = '—', bot = '—') => { const e = Math.abs(med / desc - 1); TAB.push({ opcao, atributo, desc: r3(desc), medido: r3(med), erro: (e * 100).toFixed(2) + '%', ficha, bot }); chk(e <= 0.02, `${opcao} / ${atributo}: medido ${r3(med)} vs descrição ${r3(desc)} (${(e * 100).toFixed(1)}%)`); };
/** duelo isolado: o jogador com os mods, rival fixo longe */
const sess = (k, mods, seed = 5, rival = 'destroier') => { OC.defineMar(0); const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, classeRival: rival, seed, jogadorOpc: mods ? { mods } : null }); const s = S.sim; const n = s.navios[S.match.jogadorId]; OC.defineMar(0);
  const a = s.navios.find((q) => q.time !== n.time); for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; } s.revelaTudo = 1;
  const T = s.arena || s.T, c = T.plano.centro; n.x = c.x; n.z = c.z; let br = 0.3; for (let t = 0; t < 80; t++) { let ok = 1; for (let f = -0.2; f <= 1.3; f += 0.02) if (alturaTerreno(T, c.x + Math.sin(br) * 8000 * f, c.z - Math.cos(br) * 8000 * f) > -14) ok = 0; if (ok) break; br += 0.37; }
  n.rumo = br + Math.PI / 2; const poe = (d) => { a.x = n.x + Math.sin(br) * d; a.z = n.z - Math.cos(br) * d; a.v = 0; }; poe(7000); n.mira.az = br; return { s, n, a, S, poe, br }; };
const X0 = 0, Z0 = 0; const fixa = (n) => { n.x = X0; n.z = Z0; };
const P0 = (() => { const { s } = sess('destroier'); return { x: s.navios[0].x, z: s.navios[0].z }; })();
// ---------- velocidade máxima, aceleração, giro ----------
const vmaxMed = (k, mods) => { const { s, n, a } = sess(k, mods); a.x = 1e9; n.tel = n.telAlvo = FTEL.length - 1; n.lemeCmd = 0; let x = n.x, z = n.z; for (let f = 0; f < 60 * 150; f++) { n.x = x; n.z = z; n.lemeCmd = 0; s.passo([]); s.eventos.length = 0; } return n.v; };
const acelMed = (k, mods) => { const { s, n, a } = sess(k, mods); a.x = 1e9; n.v = 0; n.tel = n.telAlvo = FTEL.length - 1; n.lemeCmd = 0; let x = n.x, z = n.z; for (let f = 0; f < 60 * 1.0; f++) { n.x = x; n.z = z; s.passo([]); s.eventos.length = 0; } return n.v; };
const giroMed = (k, mods, vF) => { const { s, n, a } = sess(k, mods); a.x = 1e9; n.tel = n.telAlvo = 3; let x = n.x, z = n.z; let r0 = 0; const N0 = 60 * 25, N1 = 60 * 35;
  for (let f = 0; f < N1; f++) { n.x = x; n.z = z; n.v = vF; n.lemeCmd = 1; n.leme = n.leme; s.passo([]); s.eventos.length = 0; if (f === N0) r0 = n.rumo; if (f > N0) { /* soma desenrolada */ } }
  let d = n.rumo - r0; return d; };
const giroRate = (k, mods, vF) => { const { s, n, a } = sess(k, mods); a.x = 1e9; n.tel = n.telAlvo = 3; let x = n.x, z = n.z; let tot = 0, prev = n.rumo; const N0 = 60 * 25, N1 = 60 * 40;
  for (let f = 0; f < N1; f++) { n.x = x; n.z = z; n.v = vF; n.lemeCmd = 1; s.passo([]); s.eventos.length = 0; let d = n.rumo - prev; d = Math.atan2(Math.sin(d), Math.cos(d)); prev = n.rumo; if (f >= N0) tot += d; } return tot / ((N1 - N0) / 60); };
const KS = ['corveta', 'destroier', 'cruzador', 'corsario', 'baluarte', 'marcos'];
const M0 = (k) => modsDe(k, {});
for (const k of KS) {
  const v0 = vmaxMed(k, M0(k)), v1 = vmaxMed(k, modsDe(k, { modulos: { turbinas: 1 } })); linha(`turbinas (${k})`, 'velocidade máxima', 1.06, v1 / v0);
  if (k === 'destroier' || k === 'corveta') { for (const p of [1, 2]) linha(`propulsão ${PROPULSAO[p].nome} (${k})`, 'velocidade máxima', PROPULSAO[p].vmax, vmaxMed(k, modsDe(k, { propulsao: p })) / v0);
    linha(`turbinas + propulsão AD (${k})`, 'velocidade máxima (empilha)', 1.06 * 1.04, vmaxMed(k, modsDe(k, { modulos: { turbinas: 1 }, propulsao: 2 })) / v0); }
  const a0 = acelMed(k, M0(k)), a1 = acelMed(k, modsDe(k, { modulos: { turbinas: 1 } })); linha(`turbinas (${k})`, 'aceleração (v em 1 s do repouso)', 1.12, a1 / a0);
  const vF = CLASSES[k].vmax * 0.6; const g0 = giroRate(k, M0(k), vF), g1 = giroRate(k, modsDe(k, { modulos: { leme_hidraulico: 1 } }), vF); linha(`leme_hidraulico (${k})`, 'taxa de giro (°/s, mesma velocidade)', 1.1, g1 / g0);
}
// ---------- radar e trava ----------
{ const { n, a } = sess('destroier', M0('destroier')); const r0 = alcRadar(n, a); const { n: n1, a: a1 } = sess('destroier', modsDe('destroier', { modulos: { radar_aesa: 1 } })); linha('radar_aesa', 'alcance de radar', 1.15, alcRadar(n1, a1) / r0); }
const tempoTrava = (mods, ativo) => { const { s, n, a, poe } = sess('destroier', mods); poe(6000); n.radarAtivo = ativo ? 1 : 0; n.alvoId = a.id; n.trava = 0; n.travaMis = 0; let t1 = -1, t2 = -1;
  for (let f = 0; f < 60 * 40; f++) { n.alvoId = a.id; n.radarAtivo = ativo ? 1 : 0; poe(6000); s.passo([]); s.eventos.length = 0; if (t1 < 0 && n.trava >= 1) t1 = f / 60; if (t2 < 0 && n.travaMis >= 1) { t2 = f / 60; break; } } return { t1, t2 }; };
for (const at of [1, 0]) { const T0 = tempoTrava(M0('destroier'), at), T1 = tempoTrava(modsDe('destroier', { modulos: { radar_aesa: 1 } }), at);
  linha('radar_aesa', `tempo de trava total (${at ? 'ativo' : 'passivo'})`, 1 / 1.3, T1.t2 / T0.t2);
  const fd = FT.fichaTecnica('destroier', modsDe('destroier', { modulos: { radar_aesa: 1 } })).find((q) => q.id === 'missil'); const lf = fd && fd.linhas.find((q) => q.k === (at ? 'trA' : 'trP'));
  chk(lf && Math.abs(lf.v - T1.t2) <= Math.max(0.15, T1.t2 * 0.03), `ficha trava ${at ? 'ativo' : 'passivo'}: ficha ${lf && lf.v} s vs medido ${T1.t2.toFixed(2)} s`); TAB[TAB.length - 1].ficha = lf ? lf.v + ' s (medido ' + T1.t2.toFixed(2) + ')' : '?'; }
// ---------- 19b: células VLS extras ----------
for (const k of ['destroier', 'cruzador', 'corsario', 'capitania']) { const C = CLASSES[k]; if (!C.vls) continue;
  for (const [nome, mods, mais] of [['vls_extra', modsDe(k, { modulos: { vls_extra: 1 } }), 4], ['vls_extra + cmte Mísseis nv10', modsDe(k, { modulos: { vls_extra: 1 }, comandante: { esp: 'misseis', nivel: 10 } }), 8]]) {
    const { s, n, a, poe } = sess(k, mods); const fi = FT.fichaTecnica(k, mods).find((q) => q.id === 'missil').linhas.find((q) => q.k === 'cel').v;
    linha(`${nome} (${k})`, 'células VLS (n.vls)', C.vls + mais, n.vls, String(fi)); chk(fi === n.vls, `ficha células ${fi} ≠ n.vls ${n.vls} (${k})`);
    if (!base) { chk(n.P.vls.length === n.vls, `${k} ${nome}: posições de célula ${n.P.vls.length} ≠ ${n.vls}`); chk(n.vlsUsadas.length === n.vls, `${k}: vlsUsadas ${n.vlsUsadas.length}`);
      let dmin = 1e9; const cel = n.P.celulas; for (let i = 0; i < cel.length; i++) for (let j = i + 1; j < cel.length; j++) dmin = Math.min(dmin, Math.hypot(cel[i].x - cel[j].x, cel[i].z - cel[j].z) + Math.abs(cel[i].y - cel[j].y)); chk(dmin >= 1.0, `${k}: células sobrepostas (${dmin.toFixed(2)} m)`);
      for (const c of n.P.vls) chk(Math.abs(c.z) < C.L * 0.47 && Math.abs(c.x) < C.B * 0.5, `${k}: célula fora do casco (${c.x.toFixed(1)}, ${c.z.toFixed(1)})`); }
    // dispara todas: cada míssil sai de uma célula PRÓPRIA (nenhuma tampa reaproveitada)
    poe(7000); const cels = []; let tent = 0; while (n.vls > 0 && tent++ < 400) { s.eventos.length = 0; n.alvoId = a.id; n.trava = 1; n.travaMis = 1; n.tVls = 0; n.avaria.vls = 1; n.mira.az = Math.atan2(a.x - n.x, -(a.z - n.z)); s.lancaMissil(n, a.id, 1); for (const e of s.eventos) if (e.t === 'vls' && e.id === n.id) cels.push(e.cel); for (const m of s.misseis) m.ativo = 0; poe(7000); s.passo([]); }
    const uniq = new Set(cels).size; chk(cels.length === C.vls + mais && uniq === cels.length, `${k} ${nome}: ${cels.length} lançados, ${uniq} células distintas (esperado ${C.vls + mais})`); TAB.push({ opcao: `${nome} (${k})`, atributo: 'mísseis disparados / células distintas', desc: C.vls + mais, medido: `${cels.length}/${uniq}`, erro: '', ficha: '', bot: '' }); } }
// HUD: contador = n.vls (fonte)
{ const h = readFileSync(new URL(B + 'ui/hud.js', import.meta.url), 'utf8'); chk(/n_vls[^]*?String\(Math\.max\(0, n\.vls \| 0\)\)/.test(h), 'HUD: contador de mísseis não lê n.vls'); }
// ---------- tandem: só os 8 do lote ----------
for (const [nome, mods, pkE, pkDep] of [['tandem', modsDe('destroier', { missil: 'tandem' }), 0.85, 1], ['tandem + cmte Mísseis nv10', modsDe('destroier', { missil: 'tandem', comandante: { esp: 'misseis', nivel: 10 } }), 0.85 * (1 - 0.12), 1 - 0.12]]) {
  const { s, n, a, poe } = sess('destroier', mods); n.vls = 20; poe(7000); const L2 = []; let tent = 0; while (L2.length < 12 && tent++ < 300) { s.eventos.length = 0; n.alvoId = a.id; n.trava = 1; n.travaMis = 1; n.tVls = 0; n.mira.az = Math.atan2(a.x - n.x, -(a.z - n.z)); const antes = s.misseis.filter((m) => m.ativo).length; s.lancaMissil(n, a.id, 1); for (const m of s.misseis) if (m.ativo && m.dono === n.id) { L2.push({ dm: m.danoMul != null ? m.danoMul : m.dano / m.perfil.dano, pk: m.pkMul }); m.ativo = 0; } poe(7000); s.passo([]); }
  const lote = L2.slice(0, 8), dep = L2.slice(8); linha(nome, 'dano dos 8 do lote', 1.25, lote.reduce((q, m) => q + m.dm, 0) / 8); linha(nome, 'pkCiws dos 8 do lote', pkE, lote.reduce((q, m) => q + m.pk, 0) / 8);
  linha(nome, 'dano depois do lote (padrão)', 1, dep.reduce((q, m) => q + m.dm, 0) / Math.max(1, dep.length)); linha(nome, 'pkCiws depois do lote', pkDep, dep.reduce((q, m) => q + m.pk, 0) / Math.max(1, dep.length)); chk(n.stats.tandemLanc === 8 || base, `tandemLanc ${n.stats.tandemLanc}`); }
// dano real do míssil (fração do casco) tandem/padrão
{ const DR = await import(B + 'naval5v5/danoReal.js'); const pf = (await import(B + 'sim/classes.js')).MISSEIS.antinavio || Object.values((await import(B + 'sim/classes.js')).MISSEIS)[0];
  if (DR.fracMissil) { const f0 = DR.fracMissil({ perfil: pf }), f1 = DR.fracMissil({ perfil: pf, danoMul: 1.25, ouro: 1 }); linha('tandem', 'fração de casco por míssil (danoReal)', 1.25, f1 / f0); } }
// ---------- munição: dano, incêndio e lote de 80 ----------
const granadas = (k, mods, N) => { const { s, n, a } = sess(k, mods, 5); const d = Math.min(3000, n.C.canhao.alc * 0.5); a.x = n.x + d; a.z = n.z; a.v = 0; a.vida = 1e12; const G = []; n.alvoId = -1; n.mira.az = Math.PI / 2; n.mira.dist = d;
  for (let f = 0; f < 60 * 600 && G.length < N; f++) { n.v = 0; a.x = n.x + d; a.z = n.z; a.vida = 1e12; n.alvoId = -1; for (const t of n.torres) t.rec = Math.min(t.rec, 0); s.passo(f % 3 === 0 ? [{ t: 'canhao', id: n.id, modo: 'um' }] : []); for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id && e.gi >= 0 && !e.sec) { const g = s.granadas[e.gi]; G.push({ dano: g.dano, fogo: g.fogo, ap: g.ap }); g.ativo = 0; } s.eventos.length = 0; } return { G, n }; };
{ const k = 'destroier'; const { G: G0 } = granadas(k, M0(k), 10); const d0 = G0[0].dano;
  for (const mu of ['sap', 'ap']) { const { G, n } = granadas(k, modsDe(k, { municao: mu }), 90); const ef = MUNICOES[mu].ef; linha(`munição ${mu.toUpperCase()}`, 'dano por granada (lote)', ef.dano, G[0].dano / d0); linha(`munição ${mu.toUpperCase()}`, 'chance de incêndio', ef.fogo, G[0].fogo);
    if (!base) { const l = G.slice(0, 80), dp = G.slice(80); chk(l.every((g) => Math.abs(g.dano / d0 - ef.dano) < 1e-6) && dp.length > 0 && dp.every((g) => Math.abs(g.dano / d0 - 1) < 1e-6 && g.fogo === 0.18 && !g.ap), `${mu}: lote de 80 → HE depois (lote ${l.length}, depois ${dp.length})`); chk(n.stats.loteTiros === 80, `${mu}: loteTiros ${n.stats.loteTiros}`); }
    TAB.push({ opcao: `munição ${mu.toUpperCase()}`, atributo: 'granadas do lote / depois HE', desc: 80, medido: `${Math.min(80, G.length)}/${Math.max(0, G.length - 80)}`, erro: '', ficha: '', bot: '' }); }
  linha('munição HE', 'chance de incêndio', 0.18, G0[0].fogo); }
// dano AP aplicado no impacto (contra blindagem): sem multiplicador extra
{ const src = readFileSync(new URL(B + 'sim/world.js', import.meta.url), 'utf8'); chk(base || !/g\.ap && n\.C\.blind > 1\.1 \? 1\.1/.test(src), 'AP: multiplicador extra ×1,1 contra blindagem ainda presente'); }
// ---------- carregador (depois do piso do 11c) e ficha ----------
for (const k of ['corveta', 'destroier', 'cruzador', 'capitania', 'marcos', 'corsario']) { const C = CLASSES[k]; if (!C.canhao) continue; const piso = Math.max(C.canhao.cad * 0.8, recargaMinCal(C.canhao.cal));
  const { n: n0 } = sess(k, M0(k)), { n: n1 } = sess(k, modsDe(k, { modulos: { carregador: 1 } })); linha(`carregador (${k})`, 'recarga do canhão (A.cad, após o piso)', 0.92, n1.C.canhao.cad / n0.C.canhao.cad);
  chk(Math.abs(n0.C.canhao.cad - piso) < 1e-6 || base, `${k}: recarga sem módulo ${n0.C.canhao.cad} ≠ piso ${piso}`); const fr = FT.fichaTecnica(k, modsDe(k, { modulos: { carregador: 1 } })).find((q) => q.id === 'canhao').linhas.find((q) => q.k === 'rec').v; TAB[TAB.length - 1].ficha = fr + ' s'; chk(Math.abs(fr - n1.C.canhao.cad) <= 0.051, `ficha recarga ${k}: ${fr} vs sim ${n1.C.canhao.cad.toFixed(3)}`); }
{ const k = 'destroier'; const { G: G0, n: n0 } = granadas(k, M0(k), 3); } // aquece
// recarga REAL medida na torre (tr.rec logo após o tiro)
for (const k of ['destroier', 'cruzador']) { const rec = (mods) => { const { s, n, a } = sess(k, mods); const d = 3000; let r = -1; for (let f = 0; f < 60 * 30 && r < 0; f++) { n.v = 0; a.x = n.x + d; a.z = n.z; n.alvoId = -1; n.mira.az = Math.PI / 2; n.mira.dist = d; s.passo(f > 600 && f % 5 === 0 ? [{ t: 'canhao', id: n.id, modo: 'um' }] : []); for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id && !e.sec && e.torre >= 0 && r < 0) r = n.torres[e.torre].rec; s.eventos.length = 0; } return r; };
  linha(`carregador (${k})`, 'recarga medida na torre', 0.92, rec(modsDe(k, { modulos: { carregador: 1 } })) / rec(M0(k))); }
// ---------- controle de avarias: duração de incêndio/alagamento ----------
const durAv = (mods) => { const { s, n } = sess('destroier', mods); n.vida = 1e9; n.C.vida = 1e9; AV.danoLocal(s, n, { lx: 0, ly: 0.5, lz: 0, px: n.x, py: 0.5, pz: n.z }, 1, 'torpedo', null); const fo = n.incendio, al = n.alagamento; n.incendio = 0; AV.danoLocal(s, n, { lx: 0, ly: 0.5, lz: 0 }, 1, 'canhao', { fogo: 1 }); return { fogo: n.incendio, alag: al }; };
{ const d0 = durAv(M0('destroier')), d1 = durAv(modsDe('destroier', { modulos: { controle_avarias: 1 } })); linha('controle_avarias', 'duração do incêndio', 0.75, d1.fogo / d0.fogo); linha('controle_avarias', 'duração do alagamento', 0.75, d1.alag / d0.alag);
  for (const nv of [1, 10]) { const f = fatorNivel(nv); const dc = durAv(modsDe('destroier', { comandante: { esp: 'avarias', nivel: nv } })); linha(`cmte Controle de avarias nv${nv}`, 'duração do incêndio', 1 - 0.35 * f, dc.fogo / d0.fogo); }
  const dE = durAv(modsDe('destroier', { modulos: { controle_avarias: 1 }, comandante: { esp: 'frota', nivel: 10 } })); linha('controle_avarias + cmte Frota nv10', 'duração do incêndio (empilha)', 0.75 * 0.9, dE.fogo / d0.fogo); }
// ---------- pinturas: RCS, casco, lendária ----------
const pints = Object.keys(PINTURAS).filter((p) => PINTURAS[p].furt || PINTURAS[p].hp || PINTURAS[p].bonus); const amostra = [...new Set([...pints.filter((p) => PINTURAS[p].bonus).slice(0, 3), ...pints.filter((p) => !PINTURAS[p].bonus).slice(0, 8)])];
{ const { n: n0 } = sess('destroier', M0('destroier'));
  for (const p of amostra) { const P = PINTURAS[p]; const b = P.bonus ? 1 + P.bonus : 1; const { n } = sess('destroier', modsDe('destroier', { pintura: p })); linha(`pintura ${p}`, 'RCS', (1 - (P.furt || 0)) / b, n.C.rcs / n0.C.rcs); linha(`pintura ${p}`, 'casco (HP)', (1 + (P.hp || 0)) * b, n.C.vida / n0.C.vida);
    if (P.bonus) { linha(`pintura ${p}`, 'radar (lendária ×1,5)', b, n.C.radar / n0.C.radar); linha(`pintura ${p}`, 'recarga (lendária ÷1,5)', 1 / b, n.C.canhao.cad / n0.C.canhao.cad); chk(!(n.mods.heliMun > 1) || base, `pintura ${p}: lendária NÃO deve dar +25% munição de heli`); } } }
// bots: pintura aplicada pela MESMA regra (MatchManager)
{ let nb = 0, okb = 0; for (let seed = 1; seed <= 30; seed++) { OC.defineMar(0); const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'destroier', seed }); for (const n of S.sim.navios) { if (n.papel === 'jogador' || !n.pintura) continue; const P = PINTURAS[n.pintura]; if (!P || !(P.hp || P.furt)) continue; nb++; const Cb = CLASSES[n.tipo]; const b = P.bonus ? 1 + P.bonus : 1; if (Math.abs(n.C.vida / Cb.vida - (1 + (P.hp || 0)) * b) < 0.02 * (1 + (P.hp || 0)) && Math.abs(n.C.rcs / Cb.rcs - (1 - (P.furt || 0)) / b) < 0.02) okb++; } }
  TAB.push({ opcao: 'pinturas (bots)', atributo: 'casco e RCS pela mesma regra', desc: nb, medido: okb, erro: '', ficha: '', bot: `${okb}/${nb}` }); chk(nb > 5 && okb === nb, `bots: ${okb}/${nb} com o efeito da pintura`); }
// ---------- comandantes nível 1 e 10 ----------
const atrib = (k, mods) => { const { n } = sess(k, mods); return { vmax: vmaxMed(k, mods), giro: n.C.giro, cad: n.C.canhao.cad, radar: n.C.radar, vls: n.vls, n }; };
{ const k = 'destroier', b0 = atrib(k, M0(k)); const g0 = giroRate(k, M0(k), CLASSES[k].vmax * 0.6);
  for (const nv of [1, 10]) { const f = fatorNivel(nv); const cm = (esp) => modsDe(k, { comandante: { esp, nivel: nv } });
    { const m = cm('navegacao'); linha(`cmte Navegação nv${nv}`, 'velocidade máxima', 1 + 0.05 * f, vmaxMed(k, m) / b0.vmax); linha(`cmte Navegação nv${nv}`, 'taxa de giro', 1 + 0.12 * f, giroRate(k, m, CLASSES[k].vmax * 0.6) / g0); linha(`cmte Navegação nv${nv}`, 'aceleração', (1 + 0.12 * f), acelMed(k, m) / acelMed(k, M0(k))); }
    { const m = cm('artilharia'); const { n } = sess(k, m); linha(`cmte Artilharia nv${nv}`, 'recarga', 1 - 0.1 * f, n.C.canhao.cad / b0.cad); linha(`cmte Artilharia nv${nv}`, 'dispersão', 1 - 0.18 * f, n.mods.disp); }
    { const m = cm('frota'); const { n, a } = sess(k, m); const { n: q0, a: a0 } = sess(k, M0(k)); linha(`cmte Frota nv${nv}`, 'alcance de radar', 1 + 0.1 * f, alcRadar(n, a) / alcRadar(q0, a0)); linha(`cmte Frota nv${nv}`, 'recarga', 1 - 0.04 * f, n.C.canhao.cad / b0.cad); linha(`cmte Frota nv${nv}`, 'eficácia CIWS', 1 + 0.08 * f, n.mods.ciwsTaxa); }
    { const m = cm('defesa'); linha(`cmte Defesa aérea nv${nv}`, 'eficácia CIWS', 1 + 0.25 * f, m.ciwsTaxa); linha(`cmte Defesa aérea nv${nv}`, 'Pk do SAM', 1 + 0.1 * f, m.samPk); const fd = FT.fichaTecnica('cruzador', modsDe('cruzador', { comandante: { esp: 'defesa', nivel: nv } })).find((q) => q.id === 'defesa'); const lc = fd && fd.linhas.find((q) => q.k === 'ciwsT'); TAB[TAB.length - 2].ficha = lc ? lc.v + '%' : '?'; if (lc) chk(Math.abs(lc.v - Math.round(m.ciwsTaxa * 100)) <= 1, 'ficha CIWS'); }
    { const m = cm('misseis'); const { n } = sess(k, m); linha(`cmte Mísseis nv${nv}`, 'células VLS', CLASSES[k].vls + Math.round(4 * f), n.vls); linha(`cmte Mísseis nv${nv}`, 'pkCiws do míssil', 1 - 0.12 * f, m.missilEf.pkCiws); }
    { const m = cm('antisub'); linha(`cmte Antissubmarino nv${nv}`, 'dano de torpedo', 1 + 0.25 * f, m.torpDano); const DR = await import(B + 'naval5v5/danoReal.js'); if (DR.fracTorpedo) { const f0 = DR.fracTorpedo({ danoMul: 1 }), f1 = DR.fracTorpedo({ danoMul: m.torpDano }); linha(`cmte Antissubmarino nv${nv}`, 'fração de casco por torpedo', 1 + 0.25 * f, f1 / f0); } }
    { const m = cm('avarias'); const { n } = sess(k, m); linha(`cmte Avarias nv${nv}`, 'recarga do reparo', 1 - 0.25 * f, n.reparo.recarga / 60); linha(`cmte Avarias nv${nv}`, 'cura do reparo', 0.08 + 0.04 * f, n.reparo.cura); }
    { const m = cm('aviacao'); const { n, s } = sess('cruzador', m); linha(`cmte Aviação nv${nv}`, 'combustível do heli', 1 + 0.35 * f, m.heliFuel); chk(base || m.heliMun === 1.25, 'heli +25% munição'); } } }
// empilhamento sem dupla contagem: módulo × propulsão × pintura lendária × comandante
{ const k = 'destroier'; const lend = Object.keys(PINTURAS).find((p) => PINTURAS[p].bonus); const b = 1 + PINTURAS[lend].bonus; const f = fatorNivel(10);
  const m = modsDe(k, { modulos: { turbinas: 1, carregador: 1 }, propulsao: 2, pintura: lend, comandante: { esp: 'navegacao', nivel: 10 } }); linha('turbinas × propulsão AD × lendária × cmte Navegação nv10', 'velocidade máxima', 1.06 * 1.04 * b * (1 + 0.05 * f), vmaxMed(k, m) / vmaxMed(k, M0(k)));
  const { n } = sess(k, m), { n: n0 } = sess(k, M0(k)); linha('carregador × lendária', 'recarga', 0.92 / b, n.C.canhao.cad / n0.C.canhao.cad); }
// ---------- iscas, reparo e consumíveis ----------
{ const k = 'destroier'; const { n: n0 } = sess(k, M0(k)); const { n: n1 } = sess(k, modsDe(k, { isca: 'ouro' })); linha('isca ouro', 'chance de desviar', ISCAS.ouro.ef.pIsca, n1.pIsca); linha('isca padrão', 'chance de desviar', ISCAS.padrao.ef.pIsca, n0.pIsca);
  linha('isca ouro', 'cargas (+2)', (n0.chaff + n0.chaffReserva) + 2, n1.chaff + n1.chaffReserva);
  for (const cons of ['reparo', 'reparo_ouro']) { const { s, n } = sess(k, modsDe(k, { consumivel: cons })); const E2 = cons === 'reparo' ? { usos: 2, recarga: 60, cura: 0.08 } : { usos: 3, recarga: 40, cura: 0.12 }; n.vida = n.C.vida * 0.5; n.incendio = 5; const v0 = n.vida; s.usaReparo(n); linha(cons, 'cura (fração do casco)', E2.cura, (n.vida - v0) / n.C.vida); linha(cons, 'usos', E2.usos, n.reparo.usosMax); linha(cons, 'recarga', E2.recarga, n.reparo.recarga); chk(n.incendio === 0, `${cons}: apaga incêndio`); }
  for (const ck of ['kit', 'controle', 'bomba']) for (const nv of ['prata', 'ouro']) { const P = CO.CONS[ck][nv]; for (const [nm, mods] of [['', M0(k)], [' + controle_avarias', modsDe(k, { modulos: { controle_avarias: 1 } })], [' + cmte Avarias nv10', modsDe(k, { comandante: { esp: 'avarias', nivel: 10 } })]]) {
      const { s, n } = sess(k, mods); CO.instalaCons(n, { [ck]: nv }); n.vida = n.C.vida * 0.4; const v0 = n.vida; const cmd = nm.includes('cmte'); const fR = cmd ? 1 - 0.25 * fatorNivel(10) : 1, cA = cmd ? 0.04 * fatorNivel(10) : 0; if (ck === 'bomba') n.aguaAbordo = 1; if (ck === 'controle') n.incendio = 10;
      CO.usaCons(s, n, ck); const c = n.cons[ck]; linha(`consumível ${ck} ${nv}${nm}`, 'recarga', P.recarga * fR, c.t || c.recarga * fR); linha(`consumível ${ck} ${nv}${nm}`, 'usos restantes', P.usos - 1, c.usos);
      if (ck === 'kit') { for (let f = 0; f < 60 * (P.dur + 1); f++) CO.passoCons(s, n, 1 / 60); linha(`consumível kit ${nv}${nm}`, 'cura', P.cura + cA, (n.vida - v0) / n.C.vida); }
      if (ck === 'bomba') { let t = 0; const a0 = n.aguaAbordo; CO.passoCons(s, n, 1); linha(`consumível bomba ${nv}${nm}`, 'taxa (água/s)', P.taxa, a0 - n.aguaAbordo); } } } }
// ---------- custos e reembolso proporcional (prata e ouro) ----------
{ const mem = {}; globalThis.localStorage = { getItem: (k) => mem[k] || null, setItem: (k, v) => (mem[k] = v), removeItem: (k) => delete mem[k] }; const { Save } = await import(B + 'save.js');
  const caso = (lote, uso, prata0 = 1e6, ouro0 = 1e4) => { const sv = new Save(); const Ec = new Economia(sv); Ec.e.prata = prata0; Ec.e.ouro = ouro0; for (const t in Ec.e.lotes) Ec.e.lotes[t] = 0; Ec.e.loadout = { municao: lote === 'sap' || lote === 'ap' ? lote : 'he', missil: lote === 'tandem' ? 'tandem' : 'padrao', isca: lote === 'iscaOuro' ? 'ouro' : 'padrao', consumivel: lote === 'reparoOuro' ? 'reparo_ouro' : 'reparo', cons: { kit: null, controle: null, bomba: null } };
    const m = Ec.prepararPartida('destroier'); const p1 = Ec.e.prata, o1 = Ec.e.ouro; const stats = { tiros: uso + 37, loteTiros: lote === 'sap' || lote === 'ap' ? uso : 0, misLanc: uso + 3, tandemLanc: lote === 'tandem' ? uso : 0, iscas: lote === 'iscaOuro' ? uso : 0, reparos: lote === 'reparoOuro' ? uso : 0 };
    const devolver = (m.lotesUsados || []).filter((t) => ((t === 'ap' || t === 'sap') && !stats.loteTiros) || (t === 'tandem' && !stats.tandemLanc) || (t === 'iscaOuro' && !stats.iscas) || (t === 'reparoOuro' && !stats.reparos));
    const g = Ec.creditar({ stats, vitoria: false, devolver, lotesUsados: m.lotesUsados, navios: [], tempoVivo: 60, mvp: false, vidaFinal: 1, dano: 0 }, 'destroier'); return { g, p1, o1, Ec, m, prata0, ouro0 }; };
  for (const lote of ['sap', 'ap', 'tandem', 'iscaOuro', 'reparoOuro']) { const c = E.custoLote(lote); const moeda = c.prata ? 'prata' : 'ouro'; const cap = LOTE_CAP[lote];
    for (const uso of [Math.floor(cap / 4) || 1, Math.floor(cap / 2)]) { const r = caso(lote, uso); const esp = Math.floor((c.prata || c.ouro) * (1 - uso / cap)); const re = r.g.reembolso[moeda]; linha(`reembolso ${lote} (${uso}/${cap} usados)`, `${moeda} devolvida`, Math.max(1, esp), Math.max(1, re)); chk(r.g.reembolso[moeda === 'prata' ? 'ouro' : 'prata'] === 0, `${lote}: reembolso na moeda errada`); }
    { const r = caso(lote, 0); chk((r.Ec.e.lotes[lote] || 0) === 1, `${lote}: lote intacto deveria voltar ao paiol (${r.Ec.e.lotes[lote]})`); }
    { const r = caso(lote, 1, 0, 0); chk(r.Ec.e.prata >= 0 && r.Ec.e.ouro >= 0 && !r.m.lotesUsados.includes(lote), `${lote}: sem saldo — saldo negativo ou lote usado`); } } }
// ---------- ficha: velocidade/casco/radar/RCS do quadro "visualizar" usam os mesmos fatores ----------
{ const src = readFileSync(new URL(B + 'main.js', import.meta.url), 'utf8'); chk(/C\.vmax \* \(M\.vmax \|\| 1\) \* NOS/.test(src), 'visualizar: velocidade sem módulos'); chk(/C\.vida \* \(M\.vida \|\| 1\)/.test(src) && /C\.radar \* \(M\.radar \|\| 1\)/.test(src) && /\(C\.rcs \|\| 1\) \* \(M\.rcs \|\| 1\)/.test(src), 'visualizar: casco/radar/RCS'); chk(base || /barras\(C, mk\(k\)\)/.test(src) && /arsenal\(C, mk\(k\)\)/.test(src), 'estaleiro: barras/arsenal sem os módulos (células VLS extras)'); }
for (const l of L) console.log(l); console.table(TAB.map((q) => ({ ...q, opcao: q.opcao.slice(0, 44), atributo: String(q.atributo).slice(0, 40) })));
writeFileSync(`/workspace/modulos1221-${base ? 'base' : 'novo'}.json`, JSON.stringify(TAB, null, 1)); console.log(`modulos1221${base ? ' (BASE)' : ''}: ${ok} ok, ${falha} falhas`); process.exit(base ? 0 : falha ? 1 : 0);
