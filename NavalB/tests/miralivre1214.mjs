// v1.2.14 — MIRA LIVRE: tiros manuais vão ao ponto exato e o dano cai no MÓDULO mirado (torre, ponte, motor, leme, linha d'água).
const SRC = process.env.SRC || '/workspace/nexo-naval-strike/src';
const { criaSessao } = await import(SRC + '/sim/session.js');
const DIST = +(process.env.DIST || 2200);
const alvos = (a) => { const C = a.C, P = a.P, sp = P.sup; return [
  ['ponte', 'ponte', 0, C.F + 2.5, (sp.z0 + sp.z1) / 2],
  ['motor', 'motor', 0, C.F * 0.7, C.L * 0.3],
  ['leme', 'leme', 0, C.F * 0.75, C.L * 0.47],
  ['linha dagua', 'agua', 0, 0.6, -C.L * 0.05],
  ['torre', 'canhao', 0, P.torres[0].y + 1.2, P.torres[0].z]]; };
const res = []; let okTot = 0, hitTot = 0;
for (const cls of ['destroier', 'capitania']) {
  const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: cls, seed: 5 }); const s = S.sim, n = s.navios[S.match.jogadorId]; const a = s.navios.find((e) => e.time !== n.time && !e.C.mercante);
  for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; }
  s.revelaTudo = 1; const fixa = () => { n.vida = n.C.vida; n.incendio = 0; n.alagamento = 0; n.x = 0; n.z = 0; n.v = 0; n.rumo = 0; a.x = DIST; a.z = 0; a.v = 0; a.rumo = 0; a.telAlvo = 1; a.papel = 'alvo'; a.vida = a.C.vida; a.incendio = 0; a.alagamento = 0; for (const k in a.avaria) a.avaria[k] = 1; a.nCiws = 0; };
  for (const [nome, esp, lx, ly, lz] of alvos(a)) { fixa(); const P = s.mundo(a, lx, ly, lz, {}); let ok = 0, hits = 0, outros = {}, tiros = 0, ev = {};
    for (let f = 0; f < 60 * 45; f++) { fixa(); a.ultHit.mod = undefined; const az = Math.atan2(P.x - n.x, -(P.z - n.z)), dist = Math.hypot(P.x - n.x, P.z - n.z); const cmds = [{ t: 'miraLivre', id: n.id, v: 1 }, { t: 'mira', id: n.id, az, dist, px: P.x, pz: P.z, h: P.y }]; if (f > 240 && f % 30 === 0) cmds.push({ t: 'canhao', id: n.id, modo: 'um' }); s.passo(cmds); for (const e of s.eventos) { if (e.t === "tiro" && e.id === n.id) tiros++; if ((e.t === "naoPronto" || e.t === "agua") && (e.dono == null || e.dono === n.id)) ev[e.t] = (ev[e.t] || 0) + 1; } s.eventos.length = 0;
      if (a.ultHit.mod !== undefined) { hits++; const m = a.ultHit.mod || "casco"; if (m === esp && (esp !== "agua" || a.alagamento > 0)) ok++; else outros[m] = (outros[m] || 0) + 1; } }
    okTot += ok; hitTot += hits; res.push(`${cls}/${nome}: ${ok}/${hits} no módulo ${esp}` + ` tiros ${tiros} ${JSON.stringify(ev)}` + (Object.keys(outros).length ? ' outros ' + JSON.stringify(outros) : '')); } }
console.log('MIRA LIVRE (' + DIST + ' m):', res.join(' | '), '| TOTAL', okTot + '/' + hitTot, (100 * okTot / Math.max(1, hitTot)).toFixed(0) + '%');
