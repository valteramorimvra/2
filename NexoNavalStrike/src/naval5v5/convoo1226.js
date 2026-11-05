// v1.2.26 item C — PLANTA DO CONVÉS para a sequência realista de decolagem/pouso (geometria pura, no referencial do navio: proa em −z, boreste +x).
// Porta-aviões: elevadores de borda (as aeronaves SOBEM do hangar visíveis, taxiam até a catapulta e decolam UMA A UMA por catapulta livre;
// pousadas taxiam até um elevador e DESCEM ao hangar). Demais navios: hangar + convoo (reboque do hangar ao convoo e de volta).
import { PLANO_PA, bordaPA, ilhasPA } from '../sim/classes1225.js';

export const DK = { taxi: 6, giro: 2.2, sobe: 6, desce: 6, reboque: 7, folga: 15, catNaPista: 10, prepCat: 3 };
/** Planta do convés (cache por navio). */
export function planoConves(n) { if (n._pc && n._pc.C === n.C) return n._pc; const C = n.C, P = n.P, L = C.L, c = P.convoo || { x: 0, y: 0, z: 0 }, cx = c.x || 0;
  const pc = { C, y: c.y, pa: C.porta === 'pa' && !!P.deckV, cats: [], el: [] };
  if (!pc.pa) { pc.pad = { x: cx, z: c.z }; pc.hang = { x: cx, z: c.z - Math.max(10, Math.min(16, L * 0.07)) }; return (n._pc = pc); }
  const D = P.deckV, PL = C.superPA ? PLANO_PA[C.id] : null; pc.zTD = L * 0.38; pc.zRoll = pc.zTD - 70; pc.xL = cx;
  pc.cats = (PL && PL.cat ? PL.cat.map((q) => q[0]) : [cx]).map((x) => ({ x, z: c.z, zF: D.z0 + 4 }));
  const cand = []; if (PL) for (const [lado, f] of PL.elev) { const z = f * L, xb = bordaPA(C, z, lado); cand.push({ x: lado === 'be' ? xb - 7.5 : xb + 7.5, z }); }
  else { const xp = D.x - D.w / 2 + 7.5; for (const z of [c.z + 16, L / 2 - 14, c.z + 16 + (L / 2 - 30 - c.z) / 2, c.z - 22, c.z - 46]) cand.push({ x: xp, z }); }
  const ilhas = PL ? ilhasPA(C) : []; const zMaxCat = Math.max(...pc.cats.map((k) => k.z)); pc.catNaPista = pc.zRoll - 12 < zMaxCat + DK.catNaPista;
  for (const e of cand) { if (e.z < D.z0 + 8 || e.z > L / 2 - 8) continue;
    if (pc.cats.some((k) => Math.hypot(e.x - k.x, e.z - k.z) < DK.folga || (e.z < k.z + 8 && Math.abs(e.x - k.x) < 13))) continue; /* fora da corrida das catapultas */
    if (e.z > pc.zRoll - 12 && Math.abs(e.x - pc.xL) < 14) continue; /* fora da área de pouso/cabos */
    if (ilhas.some((i) => e.z > i.z0 - 9 && e.z < i.z1 + 9 && e.x > i.xi - 8 && e.x < i.xe + 8)) continue;
    if (pc.el.some((q) => Math.hypot(q.x - e.x, q.z - e.z) < 16)) continue; pc.el.push({ x: e.x, z: e.z }); }
  if (!pc.el.length) pc.el.push({ x: D.x - D.w / 2 + 7.5, z: L / 2 - 14 });
  return (n._pc = pc); }
/** Caminho de táxi (pontos no referencial do navio) de (x0,z0) até (x1,z1) passando pela linha central de táxi xT. */
export function caminho(x0, z0, x1, z1, xT) { const p = []; if (Math.abs(x0 - xT) > 0.5) p.push([xT, z0]); if (Math.abs(z1 - z0) > 0.5) p.push([xT, z1]); if (Math.abs(x1 - xT) > 0.5 || !p.length) p.push([x1, z1]); return p; }
