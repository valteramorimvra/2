// v1.2.31 — LAYOUT real dos 3 navios lendários (módulo NOVO). Substitui o P de layoutDe() para essas classes
// (gancho de 1 linha no patch: `if (C.m1231) { const q = layout1231(C); if (q) return CACHE[ck] = q; }`).
// Todas as posições vêm de dados1231.js (mesma tabela do modelo 3D) → sim e modelo concordam. Contagem de células = contagem REAL (FONTES.md).
import { SPEC, deckY1231, meiaBoca1231, zDe } from './dados1231.js';

/** altura do pivô (cab) de cada tipo de montagem antiaérea sobre a sua base */
export const PIV = { ciws: 1.3, ram: 1.3, hhq10: 1.3, pantsir: 2.0 };
export function layout1231(C) {
  const S = SPEC[C.id]; if (!S) return null; const id = C.id, L = S.L;
  const dY = (z) => deckY1231(id, z), mb = (z) => meiaBoca1231(id, z);
  const P = { torres: [], vls: [], sam: [], celulas: [], ciws: [], a30: [], tubos: [], mastro: 0, laser: [], sec: [], granadas: [], blocosVls: [] };
  P.sup = { z0: zDe(id, S.sup.z0), z1: zDe(id, S.sup.z1), h: S.sup.h };
  /* canhão único (127 mm Mk 45 / 130 mm H/PJ-45 / 130 mm A-192M): mesma geometria de torre 'padrão' do jogo p/ cal > 100 (esc 1,3) */
  const cal = S.canhao.cal, esc = cal > 100 ? 1.3 : 1.1;
  S.canhao.zb.forEach((zb, i) => { const z = zDe(id, zb); const frente = S.canhao.frente || 1; const zS = z < P.sup.z0 ? P.sup.z0 : P.sup.z1; const arco = Math.max(1.6, Math.PI - Math.atan2(mb(zS) * 0.9, Math.max(1, Math.abs(zS - z))) - 0.05);
    P.torres.push({ z, y: dY(z) + (S.canhao.yx ? S.canhao.yx[i] : 0), barbeta: 0, frente, arco, canos: 1, nome: i ? 'Torre ' + (i + 1) : 'Torre 1', estilo: 'padrao', esc, lc: (cal > 100 ? 7.5 : 5.2) * esc, esp: 0, py: 1.9 * esc, pz: -1.2 * (cal / 127) * esc }); });
  /* blocos de células em grade (col × lin), centrados em x = 0, passo cs; w = largura da tampa */
  const grade = (b, lista) => { const zc = zDe(id, b.zb), lin = Math.ceil(b.n / b.col), y = dY(zc) + (b.sobre || 0); P.blocosVls.push({ zc, y, col: b.col, lin, cs: b.cs, n: b.n, tipo: b.tipo, xc: 0 });
    for (let i = 0; i < b.n; i++) lista.push({ x: (i % b.col - (b.col - 1) / 2) * b.cs, y: y + 0.25, z: zc + (Math.floor(i / b.col) - (lin - 1) / 2) * b.cs, w: b.cs * 0.9 }); };
  for (const b of S.vls) grade(b, P.vls);
  if (S.fort) { /* Fort-M: 12 tambores de 8 células, 2 colunas × 6, escotilha redonda; as 8 células de cada tambor em anel */
    const F = S.fort; let k = 0; for (let r = 0; r < F.nCol; r++) for (const sx of [-1, 1]) { const zc = zDe(id, F.zb0 + r * F.passo), y = dY(zc) + 0.25; for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2 + Math.PI / 8; P.sam.push({ x: sx * F.dx + Math.cos(a) * 1.0, y, z: zc + Math.sin(a) * 1.0, w: 0.62, tambor: k }); } k++; }
    P.blocosVls.push({ zc: zDe(id, F.zb0 + (F.nCol - 1) * F.passo / 2), y: dY(zDe(id, F.zb0 + 12)), col: 2, lin: F.nCol, cs: F.passo, n: 96, tipo: 'sam', xc: 0, fort: 1 });
  } else for (const b of S.sam) grade(b, P.sam);
  P.celulas = P.vls.concat(P.sam);
  /* CIWS / RAM / HHQ-10 / Pantsir-M (cada um é um "ciws" para a sim; o modelo desenha o tipo certo) */
  S.ciws.forEach((c, i) => { const z = zDe(id, c.zb), piv = PIV[c.tipo] || 1.3; P.ciws.push({ x: c.x, y: dY(z) + (c.sobre || 0) + piv, z, lug: i, tipo: c.tipo, piv }); });
  /* tubos de torpedo: portas submersas (padrão do jogo) */
  { const T = S.tubos; for (let k = 0; k < T.n / 2; k++) { const zt = zDe(id, T.zb + k * 4.2); for (const sx of [-1, 1]) P.tubos.push({ x: sx * mb(zt) * 0.9, y: -C.T * 0.55, z: zt, lado: sx, canos: T.canos, sub: 1 }); } }
  P.mastro = dY(zDe(id, S.mastro.zb)) + S.mastro.topo - dY(zDe(id, S.mastro.zb)); /* altura do topo sobre a LA */
  P.mastro = S.mastro.topo;
  if (S.gran) { const z = zDe(id, S.gran.zb); P.granadas.push({ x: 0, y: dY(z), z, lado: 1, r: 1.9, centro: 0, meio: 2.2 }); }
  { const zc = zDe(id, S.heli.zc ?? (S.heli.zb0 + S.heli.zb1) / 2); /* zc: centro escolhido para que o ponto 'hang' do convoo (FINAL-10: zc − min(16, 0,07·L)) caia DENTRO do hangar — nada nasce/some no convés */ P.convoo = { z: zc, y: dY(zc) }; }
  { const z = zDe(id, S.nuke.zb); P.nuke = { x: 0, y: dY(z), z, w: S.nuke.w, l: S.nuke.l }; } /* compartimento do míssil nuclear (acréscimo do jogo) */
  return P;
}
