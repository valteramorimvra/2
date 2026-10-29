// v1.2.25 item 13 — TESTE AUTOMÁTICO DE SPAWN por mapa (node --experimental-websocket não é preciso; roda em node puro).
// Uso: node tests/spawn1225.mjs <raiz-do-projeto> [saidaTabelas]
// Para CADA mapa: monta partidas REAIS (criaSessao → MatchManager.monta) em 4 modos (frota 8×8 mista, frota com porta-aviões + mercantes,
// duelo, personalizada 2×2) e verifica: 0 navios em terra/raso (prof. < calado+2,5), distância mínima à terra, espaçamento entre navios,
// times em cantos opostos e EQUILÍBRIO (distância média em linha reta ao centro e entre bases; caminho navegável do plano ≤ 10%).
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const raiz = process.argv[2] || '.', saida = process.argv[3]; const imp = (p) => import(pathToFileURL(raiz + '/src/sim/' + p).href);
const { criaSessao } = await imp('session.js'); const { MAPAS, ORDEM_MAPAS, alturaTerreno, distTerra } = await imp('maps.js'); const { celulaDe } = await imp('spawnCantos.js');
const MODOS = { frota: { modo: 'frota', classe: 'destroier' }, frotaPA: { modo: 'frota', classe: 'cruzador', portaAvioes: true, mercantes: true, mista: false }, duelo: { modo: 'duelo', classe: 'fragata', classeRival: 'destroier' }, pers2: { modo: 'frota', classe: 'corveta', pers: { azul: [{ tipo: 'fragata' }], vermelho: [{ tipo: 'destroier' }, { tipo: 'corveta' }] } } };
const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z); let falhas = 0; const linhas = []; const tabelas = {};
for (const id of ORDEM_MAPAS) { const r = { id, nome: MAPAS[id].nome }; let emTerra = 0, minTerra = 1e9, minEsp = 1e9, maxDesb = 0, n = 0; let plano = null;
  for (const [nm, cfg] of Object.entries(MODOS)) { const s = criaSessao({ mapa: id, seed: 1234, ...cfg }); const T = s.sim.T, P = T.plano; if (nm === 'frota') plano = P; const ns = s.sim.navios;
    for (const q of ns) { n++; const h = alturaTerreno(T, q.x, q.z), dt = distTerra(T, q.x, q.z); if (h > -(q.C.T + 2.5)) { emTerra++; console.log(`  ✗ ${id}/${nm}: ${q.time} ${q.tipo} em ${celulaDe(T, q.x, q.z)} prof ${(-h).toFixed(1)} m < calado ${q.C.T}+2,5`); }
      minTerra = Math.min(minTerra, dt); for (const o of ns) if (o !== q) minEsp = Math.min(minEsp, d2(q, o)); }
    const comb = (t) => ns.filter((q) => q.time === t && !q.C.mercante); const md = (L) => L.reduce((a, q) => a + d2(q, P.centro), 0) / Math.max(1, L.length); const a = md(comb('azul')), v = md(comb('vermelho'));
    if (nm !== 'pers2') maxDesb = Math.max(maxDesb, Math.abs(a - v) / Math.max(a, v)); r[nm] = { navios: ns.length, mediaCentroAzul: Math.round(a), mediaCentroVermelho: Math.round(v) }; }
  const E = plano.equilibrio || {}; Object.assign(r, { azul: plano.cantos ? plano.cantos.azul : '-', vermelho: plano.cantos ? plano.cantos.vermelho : '-', profTier: plano.prof, entreBases: Math.round(E.entreBases || d2(plano.azul, plano.vermelho)), navAzul: E.navA, navVermelho: E.navV, emTerra, minTerra: Math.round(minTerra), minEspaco: Math.round(minEsp), desbalanco: +(maxDesb * 100).toFixed(1), navios: n });
  const difNav = E.navA ? Math.abs(E.navA - E.navV) / Math.max(E.navA, E.navV) : 1; r.difNav = +(difNav * 100).toFixed(1);
  r.ok = emTerra === 0 && !!plano.vagas && minEsp >= 150 && maxDesb <= 0.10 && difNav <= 0.10 && minTerra >= 120; r.excecao = !!MAPAS[id].semCantos && emTerra === 0; /* v1.2.25: mapa marcado semCantos mantém a largada da 1.2.24 (exceção documentada; só exige 0 em terra) */ if (!r.ok && !r.excecao) falhas++;
  tabelas[id] = { cantos: plano.cantos, centro: plano.centro, azul: plano.azul, vermelho: plano.vermelho, equilibrio: E, prof: plano.prof, vagas: plano.vagas };
  linhas.push(r); console.log(`${r.ok ? '✓' : r.excecao ? '≈' : '✗'} ${id.padEnd(14)} azul ${r.azul} × verm ${r.vermelho} | entre bases ${r.entreBases} m | nav ${E.navA}/${E.navV} (Δ${r.difNav}%) | em terra ${emTerra}/${n} | terra mín ${r.minTerra} m | espaço mín ${r.minEspaco} m | desbal. média ao centro ${r.desbalanco}% | prof ${plano.prof}`); }
if (saida) { mkdirSync(saida, { recursive: true }); for (const [id, t] of Object.entries(tabelas)) writeFileSync(`${saida}/${id}.json`, JSON.stringify(t, (k, v) => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v), 1)); writeFileSync(`${saida}/_resultado-teste.json`, JSON.stringify(linhas, null, 1)); }
console.log(falhas ? `FALHOU em ${falhas} mapa(s)` : `OK — ${linhas.length} mapas`); process.exit(falhas ? 1 : 0);
