// v1.2.25 item 9/13: para um mapa (MAPA), lista os eixos de canto válidos (d em DIRS) e mede vitórias bot×bot (BOT) em N sementes por eixo.
const SRC = '/workspace/nexo-naval-strike/src'; const MAPA = process.env.MAPA, DIRS = (process.env.DIRS || '1,2,3,5,6,7').split(',').map(Number), N = +(process.env.N || 12);
const { criaSessao } = await import(SRC + '/sim/session.js'); const { criaArena } = await import(SRC + '/sim/maps.js'); const { papelDaClasse } = await import(SRC + '/sim/match.js');
const CL = ['destroier', 'cruzador', 'fragata', 'capitania'];
for (const d of DIRS) { globalThis.__nnsDirCantos = { [MAPA]: [d] }; const T = criaArena(MAPA); const P = T.plano;
  if (!P.cantos || !P.equilibrio || P.equilibrio.entreBases < 6500) { console.log(JSON.stringify({ mapa: MAPA, d, invalido: 1, eq: P.equilibrio || null })); continue; }
  const v = { azul: 0, vermelho: 0, null: 0 }; for (let seed = 301; seed < 301 + N; seed++) { const S = criaSessao({ mapa: MAPA, modo: 'frota', classe: CL[seed % 4], seed }); const s = S.sim; const j = s.navios[S.match.jogadorId]; j.controleIA = 1; j.papel = papelDaClasse(j.tipo);
    let k = 0; while (!s.fim && k < 60 * 700) { S.avanca(1 / 60); k++; } v[s.fim ? s.fim.vencedor : null]++; }
  console.log(JSON.stringify({ mapa: MAPA, d, cantos: P.cantos, entre: P.equilibrio.entreBases, nav: [P.equilibrio.navA, P.equilibrio.navV], v })); }
