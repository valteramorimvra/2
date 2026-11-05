// v1.2.14 — TOQUE = 1 torre, SEGURAR = todas; som(evento tiro) == projétil vivo; granadas × foguetes independentes
import { criaSessao } from '../src/sim/session.js';
import { CLASSES } from '../src/sim/classes.js';
let ok = 0, falha = 0; const L = [];
const chk = (c, m) => { if (c) ok++; else { falha++; L.push('FALHA ' + m); } };
const prep = (k) => { const S = criaSessao({ mapa: 'atois', modo: 'duelo', classe: k, seed: 3 }); const s = S.sim, n = s.navios[S.match.jogadorId];
  s.revelaTudo = 1; const a = s.navios.find((q) => q.time !== n.time); for (const q of s.navios) if (q !== n && q !== a) { q.x = 1e9; q.morto = 1; }
  const fix = (d = 3000) => { n.x = 0; n.z = 0; n.rumo = 0; n.v = 0; n.vida = n.C.vida; Object.assign(a, { x: d, z: 0, v: 0, vida: a.C.vida }) /* través: todas as torres com arco */; };
  fix(); return { s, n, a, fix }; };
const tiros = (s, n, set) => { let c = 0, sg = 0; for (const e of s.eventos) if (e.t === 'tiro' && e.id === n.id && !e.sec) { c++; set.add(e.torre); const g = s.granadas[e.gi]; if (!g || !g.ativo) sg++; } s.eventos.length = 0; return [c, sg]; };
for (const k of Object.keys(CLASSES).filter((q) => q !== 'mercante')) { const { s, n, a, fix } = prep(k); if (!n.torres || n.torres.length < 2) continue;
  const d = Math.min(3000, n.C.canhao.alc * 0.6); fix(d);
  for (let f = 0; f < 60 * 15; f++) { fix(d); s.passo(f === 2 ? [{ t: 'travar', id: n.id, alvo: a.id }] : []); s.eventos.length = 0; } // gira torres
  // TOQUE
  let T = new Set(), tot = 0, sem = 0; for (let f = 0; f < 60 * 3; f++) { fix(d); s.passo(f === 0 ? [{ t: 'canhao', id: n.id, modo: 'um' }] : []); const [c, sg] = tiros(s, n, T); tot += c; sem += sg; }
  chk(T.size === 1, `${k}: toque disparou ${T.size} torres`); chk(sem === 0, `${k}: ${sem} tiros sem projétil (toque)`);
  for (let f = 0; f < 60 * 25; f++) { fix(d); s.passo([]); s.eventos.length = 0; } // recarrega
  const H = new Set(); sem = 0; for (let f = 0; f < 60 * 3; f++) { fix(d); s.passo(f === 0 ? [{ t: 'canhao', id: n.id }] : []); const [c, sg] = tiros(s, n, H); sem += sg; }
  const prontas = n.torres.filter((t) => !t.bloq && !t.fora).length;
  chk(H.size >= Math.min(2, n.torres.length), `${k}: segurar disparou só ${H.size}/${n.torres.length}`); chk(sem === 0, `${k}: ${sem} tiros sem projétil (segurar)`);
  L.push(`${k}: toque ${T.size} torre, segurar ${H.size}/${n.torres.length} torres`); }
// granadas × foguetes
let nG = 0; for (const k of Object.keys(CLASSES)) { const { s, n, a, fix } = prep(k); if (!n.fgC) continue; nG++; fix(1500);
  for (let f = 0; f < 60 * 5; f++) { fix(1500); s.passo(f === 2 ? [{ t: 'travar', id: n.id, alvo: a.id }] : []); }
  const g0 = n.rbu, f0 = n.fgC.rbu; s.passo([{ t: 'rbu', id: n.id, alvo: a.id }, { t: 'rbu', id: n.id, alvo: a.id, canal: 1 }]);
  chk(n.rbu === g0 - 1, `${k}: granadas não dispararam (${g0}->${n.rbu})`); chk(n.fgC.rbu === f0 - 1, `${k}: foguetes não dispararam junto (${f0}->${n.fgC.rbu})`);
  const g1 = n.rbu; s.passo([{ t: 'rbu', id: n.id, alvo: a.id, canal: 1 }]); chk(n.rbu === g1, `${k}: foguete consumiu granada`);
  L.push(`${k}: granada ${g0}->${n.rbu}, foguete ${f0}->${n.fgC.rbu} (independentes)`); }
chk(nG > 0, 'nenhuma classe com canal de foguetes');
console.log(L.join('\n')); console.log(`disparo1214: ${ok} ok, ${falha} falhas`); process.exit(falha ? 1 : 0);
