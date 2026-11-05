// v1.2.25 item 1 — ELEVAÇÃO DOS CANOS do jogador. (A) mira acima do horizonte (elD): o cano sobe até o limite do calibre e a granada sai pelo EIXO do cano
// (v_granada − v_boca comparado ao vetor do cano no mundo, com banda/caimento) < 0,5°; (B) MIRA LIVRE na PONTE ALTA de perto (ponto acima da boca) → acerto no módulo 'ponte'.
// SRC=… (base 1.2.24 para A/B: SRC=/tmp/base1224/src)
const SRC = process.env.SRC || '/workspace/nexo-naval-strike/src';
const { criaSessao } = await import(SRC + '/sim/session.js'); const { elMaxCal } = await import(SRC + '/armasParametros.js');
const out = { src: SRC, direto: [], ponte: [] }; const falhas = [];
for (const cls of ['corveta', 'destroier', 'cruzador']) { /* (A) */
  const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: cls, seed: 7 }); const s = S.sim, n = s.navios[S.match.jogadorId];
  for (const q of s.navios) if (q !== n) { q.x = 1e9; q.morto = 1; } n.x = 0; n.z = 0; n.rumo = 0.3; n.telAlvo = 2;
  const cap = []; const ev0 = s.evento.bind(s); s.evento = (e) => { if (e.t === 'tiro' && e.id === n.id && e.gi >= 0) { const g = s.granadas[e.gi], tr = n.torres[e.torre], lado = e.canos > 1 ? (2 * e.cano - (e.canos - 1)) / (e.canos - 1) : 0; const L = { ...s.P_(n, e.torre, lado) }; const VB = s.velBoca(n, L, {}); const o = s.mundoInc(n, L.x, L.y, L.z, {}); const q = s.mundoInc(n, L.x + Math.sin(tr.az) * Math.cos(tr.el) * 100, L.y + Math.sin(tr.el) * 100, L.z - Math.cos(tr.az) * Math.cos(tr.el) * 100, {}); const bx = q.x - o.x, by = q.y - o.y, bz = q.z - o.z, bm = Math.hypot(bx, by, bz); const rx = g.vx - VB.x, ry = g.vy - VB.y, rz = g.vz - VB.z, rm = Math.hypot(rx, ry, rz); cap.push({ erro: Math.acos(Math.min(1, (bx * rx + by * ry + bz * rz) / (bm * rm))) * 57.2958, el: tr.el * 57.2958, elMundo: Math.asin(ry / rm) * 57.2958 }); } return ev0(e); };
  const elD = 0.35; for (let f = 0; f < 60 * 25; f++) { const cmds = [{ t: 'mira', id: n.id, az: n.rumo + 0.9, dist: 9000, elD }]; if (f > 600 && f % 40 === 0) cmds.push({ t: 'canhao', id: n.id, modo: 'um' }); s.passo(cmds); s.eventos.length = 0; }
  const em = Math.min(elD, elMaxCal(n.C.canhao.cal)) * 57.2958; const eMax = cap.length ? Math.max(...cap.map((c) => c.erro)) : null; const elM = cap.length ? cap.reduce((a, c) => a + c.el, 0) / cap.length : null;
  out.direto.push({ cls, tiros: cap.length, erroMaxGraus: eMax == null ? null : +eMax.toFixed(4), elCanoMedia: elM == null ? null : +elM.toFixed(2), elPedida: +em.toFixed(2), elMundo: cap.slice(0, 3).map((c) => +c.elMundo.toFixed(2)) });
  if (!(cap.length >= 3 && eMax < 0.5 && Math.abs(elM - em) < 0.6)) falhas.push(`${cls}: direto ${JSON.stringify(out.direto.at(-1))}`); }
for (const [cls, alvoCls, DIST] of [['corveta', 'capitania', 700], ['corveta', 'capitania', 1400], ['destroier', 'capitania', 900]]) { /* (B) */
  const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: cls, seed: 5 }); const s = S.sim, n = s.navios[S.match.jogadorId]; const a0 = s.navios.find((e) => e.time !== n.time && !e.C.mercante); const a = s.adicionaNavio(a0.time, alvoCls, DIST, 0, 0, 'alvo') || s.navios.at(-1); a0.x = 1e9; a0.morto = 1;
  for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; } s.revelaTudo = 1;
  const fixa = () => { n.vida = n.C.vida; n.incendio = 0; n.alagamento = 0; n.x = 0; n.z = 0; n.v = 0; n.rumo = 0; a.x = DIST; a.z = 0; a.v = 0; a.rumo = 0; a.telAlvo = 1; a.papel = 'alvo'; a.vida = a.C.vida; a.incendio = 0; a.alagamento = 0; for (const k in a.avaria) a.avaria[k] = 1; a.nCiws = 0; };
  fixa(); const sp = a.P.sup, ly = a.C.F + sp.h * 0.74, lz = (sp.z0 + sp.z1) / 2; const P = s.mundo(a, 0, ly, lz, {}); const h0 = s.mundo(n, 0, n.P.torres[0].y + 2, n.P.torres[0].z, {}).y; let ok = 0, hits = 0, tiros = 0; const outros = {};
  for (let f = 0; f < 60 * 40; f++) { fixa(); a.ultHit.mod = undefined; const az = Math.atan2(P.x - n.x, -(P.z - n.z)), dist = Math.hypot(P.x - n.x, P.z - n.z); const cmds = [{ t: 'miraLivre', id: n.id, v: 1 }, { t: 'mira', id: n.id, az, dist, px: P.x, pz: P.z, h: P.y }]; if (f > 240 && f % 30 === 0) cmds.push({ t: 'canhao', id: n.id, modo: 'um' }); s.passo(cmds); for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id) tiros++; s.eventos.length = 0;
    if (a.ultHit.mod !== undefined) { hits++; const m = a.ultHit.mod || 'casco'; if (m === 'ponte') ok++; else outros[m] = (outros[m] || 0) + 1; } }
  out.ponte.push({ cls, alvo: a.tipo || a.C.id, DIST, hPonte: +P.y.toFixed(1), hBoca: +h0.toFixed(1), tiros, hits, ponte: ok, outros }); }
const pt = out.ponte.reduce((p, q) => p + q.ponte, 0), ht = out.ponte.reduce((p, q) => p + q.hits, 0); out.ponteTotal = `${pt}/${ht}`;
if (!SRC.includes('base1224') && !(ht > 0 && pt / ht >= 0.6)) falhas.push('ponte alta ' + out.ponteTotal);
out.falhas = falhas; console.log(JSON.stringify(out)); console.log(SRC.includes('base1224') ? 'BASE (referência)' : falhas.length ? 'FALHOU: ' + falhas.join(' | ') : 'OK');
