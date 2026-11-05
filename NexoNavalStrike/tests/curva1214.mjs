// v1.2.14 — avanço em ARCO (B): acertos contra alvo GUINANDO forte, com e sem a correção. Mesma seed/cenário.
const SRC = process.env.SRC || '/workspace/nexo-naval-strike/src';
const { criaSessao } = await import(SRC + '/sim/session.js'); const { BAL } = await import(SRC + '/naval5v5/balistica.js');
const W = []; const roda = (curva, D) => { BAL.curva = curva; let ac = 0, tiros = 0;
  for (let k = 0; k < 6; k++) { const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: 'cruzador', seed: 40 + k }); const s = S.sim, n = s.navios[S.match.jogadorId]; const a = s.navios.find((e) => e.time !== n.time && !e.C.mercante);
    for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; } s.revelaTudo = 1; a.x = D; a.z = 0; a.rumo = k * 1.1; a.papel = 'alvo'; a.telAlvo = 4; a.v = a.C.vmax;
    for (let f = 0; f < 60 * 50; f++) { n.vida = n.C.vida; a.vida = a.C.vida; n.x = 0; n.z = 0; n.v = 0; n.miraSobre = 1; a.lemeCmd = 1; a.rumoAlvo = null; a.telAlvo = 4; if (Math.hypot(a.x, a.z) > D + 1500 || Math.hypot(a.x, a.z) < D - 1500) { a.x = D; a.z = 0; }
      n.mira.az = Math.atan2(a.x - n.x, -(a.z - n.z)); n.mira.dist = Math.hypot(a.x, a.z); const c = []; if (f === 2) c.push({ t: 'travar', id: n.id, alvo: a.id }); if (f > 300 && f % 20 === 0) c.push({ t: 'canhao', id: n.id }); s.passo(c);
      if (f === 1500) W.push(+a.w.toFixed(4)); for (const e of s.eventos) { if (e.t === "tiro" && e.id === n.id) tiros++; if (e.t === 'impacto' && e.dono === n.id && e.alvo === a.id) ac++; } s.eventos.length = 0; } }
  return { ac, tiros, pct: (100 * ac / Math.max(1, tiros)).toFixed(1) }; };
for (const D of [5000, 8000]) { const sem = roda(0, D), com = roda(1, D); console.log(`alvo guinando a ${D} m: SEM arco ${sem.ac}/${sem.tiros} (${sem.pct}%)  COM arco ${com.ac}/${com.tiros} (${com.pct}%) w=${W.slice(-6)}`); }
