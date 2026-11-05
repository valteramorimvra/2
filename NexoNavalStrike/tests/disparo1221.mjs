// v1.2.21 item 11 — (a) toque sem trava dispara em ≤1 quadro após a recarga; (b) após acertar, 0 tiros extras sem input;
// (c) recarga por classe dentro da tabela realista. BASE=1 roda o mesmo roteiro no código-fonte 1.2.20 (/tmp/base1220) para o "antes".
const R = process.env.BASE ? '/tmp/base1220/' : '../src/';
const { criaSessao } = await import(R + 'sim/session.js'); const { CLASSES } = await import(R + 'sim/classes.js');
const P = await import(R + 'armasParametros.js'); const base = !!process.env.BASE;
let ok = 0, falha = 0; const L = [], tab = [];
const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
const prep = (k) => { const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed: 5 }); const s = S.sim, n = s.navios[S.match.jogadorId];
  s.revelaTudo = 1; const a = s.navios.find((q) => q.time !== n.time); for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; }
  const fix = (d) => { n.x = 0; n.z = 0; n.rumo = 0; n.v = 0; n.w = 0; n.vida = n.C.vida; Object.assign(a, { x: d, z: 0, v: 0, vida: a.C.vida }); };
  return { s, n, a, fix }; };
let recTiro = 0; const tiros = (s, n) => { const T = new Set(); for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id && !e.sec && e.torre >= 0) { T.add(e.torre); recTiro = n.torres[e.torre].rec; } s.eventos.length = 0; return T.size; }; /* 1 tiro = 1 torre disparando (todos os canos dela) */
const ks = Object.keys(CLASSES).filter((q) => q !== 'mercante' && CLASSES[q].canhao && CLASSES[q].canhao.cal >= 57);
let maxAtraso = 0, extrasTot = 0, extrasSolta = 0, semTiro = 0;
for (const k of ks) { const { s, n, a, fix } = prep(k); const d = Math.min(3000, n.C.canhao.alc * 0.5); fix(d);
  n.alvoId = -1; n.miraLivre = 0; n.mira.az = Math.PI / 2; n.mira.dist = d; // SEM trava, mira no través
  for (let f = 0; f < 60 * 25; f++) { fix(d); n.alvoId = -1; s.passo([]); s.eventos.length = 0; } // torres giram e recarregam
  // (a) mira em movimento lento (o jogador arrastando): toque deve sair em ≤1 quadro
  let atraso = -1; for (let f = 0; f < 60 * 3; f++) { fix(d); n.alvoId = -1; n.mira.az = Math.PI / 2 + 0.12 * Math.sin(f / 60); /* jogador arrastando a mira ~0,12 rad/s */ s.passo(f === 30 ? [{ t: 'canhao', id: n.id, modo: 'um' }] : []); const c = tiros(s, n); if (c && atraso < 0 && f >= 30) atraso = f - 30; }
  if (atraso < 0) semTiro++; maxAtraso = Math.max(maxAtraso, atraso < 0 ? 999 : atraso);
  chk(atraso >= 0 && atraso <= 1, `${k}: toque sem trava saiu em ${atraso} quadros`);
  // recarga real medida na torre que atirou
  const recM = recTiro; const tr = n.torres.find((t) => t.rec > 0.05);
  // toque DURANTE a recarga: sai ≤1 quadro depois de rec chegar a 0
  if (n.torres.length === 1 && tr) { let fr = -1, fz = -1; for (let f = 0; f < 60 * 20; f++) { fix(d); n.alvoId = -1; s.passo(f === 2 ? [{ t: 'canhao', id: n.id, modo: 'um' }] : []); if (fz < 0 && tr.rec <= 0) fz = f; if (tiros(s, n) && fr < 0) fr = f; }
    chk(fr >= 0 && fz >= 0 && fr - fz <= 1, `${k}: toque na recarga saiu ${fr - fz} quadros após recarregar`); }
  // (b) trava + acerto: 1 toque => exatamente 1 tiro; nada mais em 25 s sem input
  for (let f = 0; f < 60 * 25; f++) { fix(d); s.passo(f === 2 ? [{ t: 'travar', id: n.id, alvo: a.id }] : []); s.eventos.length = 0; }
  let nt = 0; for (let f = 0; f < 60 * 25; f++) { fix(d); a.x = d + 40 * Math.sin(f / 90); s.passo(f === 0 ? [{ t: 'canhao', id: n.id, modo: 'um' }] : []); nt += tiros(s, n); }
  extrasTot += Math.max(0, nt - 1); chk(nt === 1, `${k}: toque deu ${nt} tiros em 25 s (esperado 1)`);
  // segurar 1 s e soltar: nenhum tiro depois do soltar
  for (let f = 0; f < 60 * 25; f++) { fix(d); s.passo([]); s.eventos.length = 0; }
  let depois = 0; for (let f = 0; f < 60 * 15; f++) { fix(d); a.x = d + 40 * Math.sin(f / 90); const cmd = []; if (f === 0) cmd.push({ t: 'canhao', id: n.id, modo: 'um' }); else if (f < 60 && f % 21 === 0) cmd.push(base ? { t: 'canhao', id: n.id } : { t: 'canhao', id: n.id, seg: 1 }); if (f === 60 && !base) cmd.push({ t: 'canhaoSolta', id: n.id }); s.passo(cmd); const c = tiros(s, n); if (f > 61) depois += c; }
  extrasSolta += depois; chk(depois === 0, `${k}: ${depois} tiros depois de soltar`);
  // (c) tabela de recarga
  const cal = n.C.canhao.cal, cad = n.C.canhao.cad, ref = P.recargaMinCal ? P.recargaMinCal(cal) : 0;
  tab.push({ classe: k, cal, recarga: +cad.toFixed(2), medida: +recM.toFixed(2), minimoTabela: ref });
  if (!base) chk(cad >= ref - 1e-6 && Math.abs(recM - cad) < 0.05 + cad * 0.02, `${k}: recarga ${cad.toFixed(2)} s (medida ${recM.toFixed(2)}) fora da tabela (mín ${ref})`);
}
// outras armas (iguais p/ jogador e bots: mesmos campos do sim)
{ const { s, n, a, fix } = prep(ks.find((k) => CLASSES[k].rbu) || ks[0]); fix(2000); for (let f = 0; f < 120; f++) { fix(2000); s.passo(f === 2 ? [{ t: 'travar', id: n.id, alvo: a.id }] : []); }
  if (n.rbu > 0) { s.passo([{ t: 'rbu', id: n.id, alvo: a.id }]); tab.push({ arma: 'lança-foguetes/granadas (salva)', recarga: +n.tRbu.toFixed(2) }); if (!base) chk(n.tRbu >= P.PARAM.recarga.rbu - 0.05, 'rbu recarga ' + n.tRbu); } }
console.log(L.join('\n')); console.table(tab);
const out = { base, classes: ks.length, maxAtrasoToque: maxAtraso, semTiro, extrasAposAcerto: extrasTot, tirosAposSoltar: extrasSolta, tab, ok, falha };
(await import('node:fs')).writeFileSync(base ? '/tmp/disparo1221-base.json' : '/tmp/disparo1221-novo.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({ maxAtraso, semTiro, extrasTot, extrasSolta }));
console.log(`disparo1221${base ? ' (BASE 1.2.20)' : ''}: ${ok} ok, ${falha} falhas`); process.exit(falha && !base ? 1 : 0);
