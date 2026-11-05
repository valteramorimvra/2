// Item 11 (1.2.30) + regra preservada. Rodar com cwd = raiz da árvore. Env: BASE_ROOT = árvore da 1.2.29.
// Avalia as EXPRESSÕES REAIS anon0/info do rótulo 3D (extraídas do fonte) com os contatos da simulação.
//  Garantias: (0) radar ligado + contato por radar (q>=2) => identificado sem trava; (1) radar desligado => igual à 1.2.29;
//  (2) furtivo/oculto/fora de alcance de radar => continua anônimo/sem contato (a identificação só vale p/ o que o radar detecta).
import fs from 'node:fs';
import { criaSessao } from './src/sim/session.js';
import { PARAM } from './src/armasParametros.js';
import { alcRadar } from './src/sim/deteccao.js';
const BASE = process.env.BASE_ROOT;
const ext = (root) => { const s = fs.readFileSync(root + '/src/modernNavalCombat3D.js', 'utf8');
  const a = s.match(/const anon0 = ([\s\S]*?);\s*if \(anon0/)[1], i = s.match(/const info = ([\s\S]*?);\s*(?:\/\*[^*]*\*\/\s*)?const merc/)[1]; const fix = (x) => x.replace(/this\.mem/g, 'mem');
  return { anon0: new Function('inim', 'mem', 'fresco0', 'q', 'n', 'c', 'it', 'PARAM', 'sim', 'alcRadarAlvo', 'return (' + fix(a) + ');'), info: new Function('inim', 'fresco', 'travadoQ', 'c', 'it', 'PARAM', 'n', 'mem', 'q', 'alcRadarAlvo', 'return (' + fix(i) + ');') }; };
const NOVO = ext('.'), VELHO = BASE ? ext(BASE) : null;
const falhas = [], log = []; const ck = (c, m) => { if (!c) falhas.push(m); };
const avalia = (E, sim, n, q, c, radar, travado) => { const nn = Object.create(n); Object.assign(nn, { alvoId: travado ? q.id : -1, trava: travado ? 1 : 0, radarAtivo: radar }); const d = Math.hypot(q.x - n.x, q.z - n.z); const it = { dist: d }; const mem = { revelaTudo: 0 };
  const fresco = sim.t - c.t < 1.1, tq = q.id === nn.alvoId && nn.trava >= 1;
  return { info: !!E.info(true, fresco, tq, c, it, PARAM, nn, mem, q, alcRadar), anon: !!E.anon0(true, mem, fresco, q, nn, c, it, PARAM, sim, alcRadar) }; };
let total = 0, ident = 0;
for (const mapa of ['atois', 'cordilheira', 'halong']) {
  const S = criaSessao({ mapa, modo: 'frota', classe: 'chapada', seed: 29, portaAvioes: true }); const s = S.sim;
  const eu = s.navios.find((n) => n.papel === 'jogador'); eu.radarAtivo = 1; eu.alvoId = -1; eu.trava = 0;
  for (let i = 0; i < 20 * 60; i++) s.passo();
  const cs = s.contatos[eu.time];
  for (const q of s.navios) { if (q.time === eu.time || q.morto) continue; const c = cs.get(q.id); if (!c || c.q < 1) continue; total++;
    const fresco = s.t - c.t < 1.1;
    // (1) radar desligado: novo == 1.2.29 (travado ou não)
    for (const tr of [false, true]) { const nv = avalia(NOVO, s, eu, q, c, 0, tr); if (VELHO) { const ve = avalia(VELHO, s, eu, q, c, 0, tr); ck(nv.info === ve.info && nv.anon === ve.anon, `${mapa} #${q.id} radar OFF trava=${tr}: novo!=1.2.29`); }
      if (!tr && c.q < 3) ck(!nv.info, `${mapa} #${q.id} radar OFF sem trava deveria ficar sem nome`); }
    // (0) radar ligado, sem trava: contato por radar (q>=2) fresco => identificado
    const on = avalia(NOVO, s, eu, q, c, 1, false); if (fresco && c.q >= 2) { ck(on.info && !on.anon, `${mapa} #${q.id} radar ON q=${c.q}: não identificado`); ident += on.info ? 1 : 0; }
    if (c.q < 2) ck(!on.info, `${mapa} #${q.id} q=${c.q} (<2) identificado indevidamente`);
    if (VELHO) { const ve = avalia(VELHO, s, eu, q, c, 1, false); if (ve.info) ck(on.info, `${mapa} #${q.id}: perdeu identificação que a 1.2.29 dava`); }
  }
  log.push(`${mapa}: contatos ${[...cs.values()].length}`);
}
// (2) furtivo / fora do alcance do radar: não vira contato por radar => não identifica
{ const S = criaSessao({ mapa: 'atois', modo: 'frota', classe: 'chapada', seed: 29, portaAvioes: true }); const s = S.sim;
  const eu = s.navios.find((n) => n.papel === 'jogador'); const e = s.navios.find((n) => n.time !== eu.time && !n.morto && !n.C.mercante);
  eu.radarAtivo = 1; eu.alvoId = -1; eu.trava = 0;
  const alcN = alcRadar(eu, e); e.C = Object.assign({}, e.C, { rcs: 0.15, casco: 'tumblehome', _furt: null }); const alcF = alcRadar(eu, e);
  log.push(`alcance radar normal ${Math.round(alcN)} m, furtivo ${Math.round(alcF)} m`); ck(alcF < alcN, 'furtivo deveria ter alcance de radar menor');
  const teste = (d) => { const a = 0.4; e.x = eu.x + Math.sin(a) * d; e.z = eu.z - Math.cos(a) * d; e.v = 0; e.vx = 0; e.vz = 0; e.velX = 0; for (let i = 0; i < 600; i++) { e.x = eu.x + Math.sin(a) * d; e.z = eu.z - Math.cos(a) * d; s.passo(); } const c = s.contatos[eu.time].get(e.id); return c; };
  const fr = (c) => !!(c && s.t - c.t < 1.1);
  const cDentro = teste(alcF * 0.8); log.push(`controle positivo: furtivo a ${Math.round(alcF * 0.8)} m (dentro do alcance dele): q=${cDentro ? cDentro.q : 'nenhum'} fresco=${fr(cDentro)}`);
  if (fr(cDentro) && cDentro.q >= 2) { const r = avalia(NOVO, s, eu, e, cDentro, 1, false); ck(r.info, 'furtivo DENTRO do alcance do radar deveria ser identificado'); }
  const cFora = teste(alcF * 1.25); // dentro do alcance de um navio comum, fora do alcance do furtivo
  const dentro = cFora && cFora.q >= 2 && s.t - cFora.t < 1.1 && cFora.q < 3; log.push(`furtivo a ${Math.round(alcF * 1.25)} m (fora do alcance dele, dentro do de um navio comum): q=${cFora ? cFora.q : 'nenhum'} fresco=${fr(cFora)}`);
  if (cFora && s.t - cFora.t < 1.1) { const r = avalia(NOVO, s, eu, e, cFora, 1, false); log.push(`  fonte=${cFora.fonte} rótulo identificado(radar ON, sem trava)=${r.info}`); ck(cFora.fonte === 'radar' || cFora.q >= 3 || !r.info, 'furtivo fora do alcance identificado'); if (cFora.q >= 3) ck(r.info === (Math.hypot(e.x - eu.x, e.z - eu.z) < PARAM.deteccao.perto), 'contato q3 (não-radar) fora do alcance do radar do furtivo: regra do radar não pode identificar (só a regra antiga de 7 km vale)'); ck(cFora.q >= 2 || !r.info, 'q<2 identificado'); }
  ck(!dentro, 'furtivo FORA do alcance do seu radar virou contato por radar (q=2)');
}
console.log(JSON.stringify({ contatosAvaliados: total, identificadosRadarOnSemTrava: ident, falhas: falhas.length, detalhes: falhas.slice(0, 20), log }));
process.exit(falhas.length ? 1 : 0);
