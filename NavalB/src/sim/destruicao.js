// v1.2.19 itens 11/11b — DESTRUIÇÃO DE ESTRUTURAS (pontes, prédios, portos, guindastes, torres, tanques) conforme arma e calibre.
// Módulo puro (sem THREE): registro espacial em grade + dano por energia da arma com queda pela distância e estágios
// 0 intacto · 1 avariado (fumaça) · 2 em chamas (fogo, parcialmente desabado) · 3 destruído (desabou: escombros e brasas).
// O render registra as estruturas no carregamento (T.estr); a simulação só usa o registro para o choque das granadas.
export const HP_TIPO = { predio: 40, galpao: 34, guindaste: 26, tanque: 16, farol: 30, torre: 55, ponteVao: 140, ponteTorre: 200, forte: 260, casa: 12, plataforma: 80 };
export function criaRegistro() { return { lista: [], grade: new Map(), cel: 160, yMax: 0, versao: 0 }; }
const chave = (i, j) => i * 100003 + j;
/** e = { x, z, y0, h, hw, hd, rot, tipo, hp? } — caixa orientada (rot em torno de y). */
export function registraEstr(R, e) { e.hp0 = e.hp0 || (HP_TIPO[e.tipo] || 30) * (e.kHp || 1); e.hp = e.hp0; e.est = 0; e.i = R.lista.length; R.lista.push(e); R.yMax = Math.max(R.yMax, e.y0 + e.h + 2);
  const rr = Math.hypot(e.hw, e.hd), c = R.cel; for (let i = Math.floor((e.x - rr) / c); i <= Math.floor((e.x + rr) / c); i++) for (let j = Math.floor((e.z - rr) / c); j <= Math.floor((e.z + rr) / c); j++) { const k = chave(i, j); let a = R.grade.get(k); if (!a) R.grade.set(k, (a = [])); a.push(e.i); } return e; }
/** Distância horizontal do ponto à caixa (0 = dentro) e se está dentro em altura. */
function dCaixa(e, x, z) { const dx = x - e.x, dz = z - e.z, c = Math.cos(e.rot || 0), s = Math.sin(e.rot || 0); const lx = Math.abs(dx * c + dz * s) - e.hw, lz = Math.abs(-dx * s + dz * c) - e.hd; return Math.hypot(Math.max(0, lx), Math.max(0, lz)); }
/** Granada em (x,y,z) dentro de alguma estrutura em pé? (sem alocação) */
export function toqueEstr(R, x, y, z) { if (!R || y > R.yMax) return null; const a = R.grade.get(chave(Math.floor(x / R.cel), Math.floor(z / R.cel))); if (!a) return null;
  for (let k = 0; k < a.length; k++) { const e = R.lista[a[k]]; const hAt = e.est >= 3 ? e.h * 0.18 : e.est === 2 ? e.h * 0.8 : e.h; if (e.vazado && e.est < 3 && y > e.y0 + e.h * 0.25 && y < e.y0 + e.h - 3) continue; if (y < e.y0 - 1 || y > e.y0 + hAt) continue; if (dCaixa(e, x, z) <= 0.01) return e; } return null; }
/** Energia (HP de estrutura) e raio de efeito por arma/calibre. cal em mm. */
export function energiaArma(tipo, cal = 127) { if (tipo === 'nuclear') return [900, 4200]; /* v1.2.30 nuke1230: raio ~4,2 km, energia alta — árvores/prédios/pontes; montanhas não estão em T.estr */
  if (tipo === 'missil') return [150, 38]; if (tipo === 'bomba') return [110, 30]; if (tipo === 'torpedo') return [170, 26]; if (tipo === 'foguete') return [9, 9];
  const k = cal / 127; return [Math.max(0.15, 10 * Math.pow(k, 2.4)), Math.max(3, 9 * Math.pow(k, 0.9))]; }
/** Aplica dano de explosão; devolve quantas estruturas mudaram de estágio (lista em R.mudou, reaproveitada). */
export function danoEstr(R, x, y, z, tipo, cal, alvo = null) { if (!R || !R.lista.length) return 0; const [E, Rb] = energiaArma(tipo, cal); const mud = R.mudou || (R.mudou = []); mud.length = 0; const c = R.cel, vis = R._vis || (R._vis = new Set()); vis.clear();
  for (let i = Math.floor((x - Rb) / c); i <= Math.floor((x + Rb) / c); i++) for (let j = Math.floor((z - Rb) / c); j <= Math.floor((z + Rb) / c); j++) { const a = R.grade.get(chave(i, j)); if (!a) continue;
    for (let k = 0; k < a.length; k++) { const e = R.lista[a[k]]; if (vis.has(e.i) || e.est >= 3) continue; vis.add(e.i); const dh = dCaixa(e, x, z), dv = y > e.y0 + e.h ? y - e.y0 - e.h : y < e.y0 ? e.y0 - y : 0; const d = Math.hypot(dh, dv);
      if (d > Rb && e !== alvo) continue; let dn = E * (e === alvo ? 1.5 : Math.pow(1 - d / Rb, 2)); if (e.tipo === 'forte' || e.tipo === 'ponteTorre') dn *= tipo === 'canhao' && cal < 60 ? 0.15 : 1; /* pedra/aço maciço: tiro leve só arranha */
      e.hp -= dn; const f = e.hp / e.hp0, est = f <= 0 ? 3 : f < 0.4 ? 2 : f < 0.78 ? 1 : 0; if (est > e.est) { e.est = est; mud.push(e); } } }
  if (mud.length) R.versao++; return mud.length; }

const _pm = { x: 0, y: 0, z: 0 };
/** v1.2.98: ponte e plataforma são sólidas. Vão alto passa por baixo; vão destruído não para o navio. */
export function empurraNavioEstr(sim, n) { if (!sim || !n || n.morto || !n.C || !sim.mundo) return; const B = n.C.B || 16, L = n.C.L || 80, folga = B * 0.5 + 2, R = sim.T && sim.T.estr;
  if (R && R.lista && R.lista.length) { for (let pi = 0; pi < 3; pi++) { const lzA = pi === 0 ? 0 : pi === 1 ? -L * 0.42 : L * 0.42; sim.mundo(n, 0, 0, lzA, _pm); const a = R.grade.get(chave(Math.floor(_pm.x / R.cel), Math.floor(_pm.z / R.cel))); if (!a) continue;
    for (let k = 0; k < a.length; k++) { const e = R.lista[a[k]]; if (!e || e.est >= 3) continue; const tp = e.tipo; if (tp !== 'ponteVao' && tp !== 'ponteTorre' && tp !== 'plataforma') continue; if (tp === 'ponteVao' && e.y0 > (n.C.F || 8) + 28) continue;
      const dx = _pm.x - e.x, dz = _pm.z - e.z, c = Math.cos(e.rot || 0), s = Math.sin(e.rot || 0), lx = dx * c + dz * s, lz = -dx * s + dz * c, hx = e.hw + folga, hz = e.hd + folga; if (Math.abs(lx) > hx || Math.abs(lz) > hz) continue;
      const penX = hx - Math.abs(lx), penZ = hz - Math.abs(lz); let px, pz; if (penX < penZ) { const sgn = lx >= 0 ? 1 : -1; px = sgn * penX * c; pz = sgn * penX * s; } else { const sgn = lz >= 0 ? 1 : -1; px = -sgn * penZ * s; pz = sgn * penZ * c; }
      n.x += px; n.z += pz; n.v *= 0.25; if (!n._estHit || sim.t >= n._estHit) { n._estHit = sim.t + 1.5; if (sim.dano) sim.dano(n, n.C.vida * 0.006, null, 'colisao', true); } return; } } }
  const obst = sim.T && sim.T.obst; if (!obst) return; sim.mundo(n, 0, 0, -L * 0.45, _pm); for (let i = 0; i < obst.length; i++) { const o = obst[i], rad = (o.r || 0) + 8 + B * 0.5, dx = _pm.x - o.x, dz = _pm.z - o.z, dd = Math.hypot(dx, dz) || 1; if (dd >= rad) continue; const push = rad - dd; n.x += dx / dd * push; n.z += dz / dd * push; n.v *= 0.35; if (!n._estHit || sim.t >= n._estHit) { n._estHit = sim.t + 1.5; if (sim.dano) sim.dano(n, n.C.vida * 0.006, null, 'colisao', true); } return; } }
