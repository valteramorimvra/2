// v1.2.19 item 5: LINHA DE TIRO LIVRE das antiaéreas (CIWS, 30 mm, secundárias, laser) — TODAS as 47 classes, sem retirar nenhuma montagem.
// Para cada montagem, uma grade azimute × elevação (local do navio: az 0 = proa, + = boreste) diz se o feixe/traçante que sai da boca
// atravessa a ESTRUTURA REAL do modelo 3D (caixas de cada peça da casaria, mastros, chaminés, torres, VLS, hangar, radares) ou o casco/convés.
// Gerada UMA vez por classe na montagem do modelo (cache), consultada na simulação com 4 leituras de tabela (0 alocação por quadro).
// Consulta conservadora: bloqueado se QUALQUER das 4 células vizinhas estiver bloqueada → o traçante nunca entra no navio.
import { deckY, meiaBoca } from './layout.js';
import { MASC_PRE } from './mascarasLT.js';
const D = Math.PI / 180;
export const NAZ = 72, DAZ = 5 * D, EL0 = -30 * D, DEL = 3 * D, NEL = 40, FOLGA = 0.3;
export const MASC = Object.create(null); /* MASC[classeId] = { ciws: [Uint8Array], a30: [...], sec: [...], laser: [...] } (1 = bloqueado) */
/** -1 = sem máscara (modelo não montado: usa o setor cego antigo); 1 = livre; 0 = bloqueado. */
/** v1.2.19: empacota/desempacota máscara (bits → base64) para o arquivo pré-calculado src/sim/mascarasLT.js */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function empacota(m) { const nb = Math.ceil(m.length / 6); let s = ''; for (let i = 0; i < nb; i++) { let v = 0; for (let b = 0; b < 6; b++) v |= (m[i * 6 + b] ? 1 : 0) << b; s += B64[v]; } return s; }
export function desempacota(s) { const m = new Uint8Array(NAZ * NEL); for (let i = 0; i < s.length; i++) { const v = B64.indexOf(s[i]); for (let b = 0; b < 6 && i * 6 + b < m.length; b++) m[i * 6 + b] = (v >> b) & 1; } return m; }
function carrega(id) { const P = MASC_PRE[id]; if (!P || globalThis.__ltGera) return null; const K = {}; for (const t in P) K[t] = P[t].map(desempacota); MASC[id] = K; return K; }
/** v1.2.19: dilatação 3×3 (1 célula em az e el) — peças finas (mastro, radar, antena) nunca escapam entre os nós da grade. */
function dilata(m) { const o = new Uint8Array(m.length); for (let a = 0; a < NAZ; a++) for (let e = 0; e < NEL; e++) { let b = 0; for (let da = -1; da <= 1 && !b; da++) { const aa = (a + da + NAZ) % NAZ; for (let de = -1; de <= 1; de++) { const ee = e + de; if (ee >= 0 && ee < NEL && m[aa * NEL + ee]) { b = 1; break; } } } o[a * NEL + e] = b; } return o; }
export function livre(n, tipo, j, az, el) { const K = MASC[n.C.id] || carrega(n.C.id); const m = K && K[tipo] && K[tipo][j]; if (!m) return -1; if (el >= EL0 + (NEL - 1) * DEL) return 1; if (el < EL0) return 0;
  let a = az / DAZ; a = ((a % NAZ) + NAZ) % NAZ; const a0 = Math.floor(a) % NAZ, a1 = (a0 + 1) % NAZ; const e = (el - EL0) / DEL, e0 = Math.floor(e), e1 = Math.min(NEL - 1, e0 + 1);
  return m[a0 * NEL + e0] | m[a1 * NEL + e0] | m[a0 * NEL + e1] | m[a1 * NEL + e1] ? 0 : 1; }
/** Origem (pivô) e comprimento do cano de cada tipo de montagem, em coordenadas locais (mesmas do modelo 3D). */
export function origens(P) { return {
  ciws: P.ciws.map((c) => [c.x, c.y, c.z, 2.0]), a30: P.a30.map((a) => [a.x, a.y, a.z, 2.6]),
  sec: (P.sec || []).map((m) => [m.x, m.y + 0.9, m.z, Math.max(1.5, m.lc || 2)]), laser: (P.laser || []).map((l) => [l.x, l.y + 0.9, l.z, 1.3]) }; }
/** caixas: [{ a: [xmin,ymin,zmin], b: [xmax,ymax,zmax], dono: 'ciws0' | ... }] (estrutura fixa do modelo). Devolve a máscara da classe. */
export function geraMascaras(C, P, caixas) { const O = origens(P), R = {}, L = C.L;
  const nomeDe = { ciws: (j) => 'ciws' + j, a30: (j) => 'a30_' + j, sec: (j) => 'sec_' + ((P.sec[j] && P.sec[j].i) ?? j), laser: (j) => 'laser' + j };
  const sMax = L * 0.75 + 30; const hs = new Float64Array(caixas.length * 2), hb = new Int32Array(caixas.length);
  for (const tipo of Object.keys(O)) { R[tipo] = O[tipo].map(([x0, y0, z0, r0], j) => { const m = new Uint8Array(NAZ * NEL), meu = nomeDe[tipo](j);
    for (let ia = 0; ia < NAZ; ia++) { const az = ia * DAZ, dx = Math.sin(az), dz = -Math.cos(az); let nb = 0;
      for (let k = 0; k < caixas.length; k++) { const c = caixas[k]; if (c.dono === meu) continue; const ax = c.a[0] - FOLGA, bx = c.b[0] + FOLGA, az0 = c.a[2] - FOLGA, bz = c.b[2] + FOLGA; let t0 = 0, t1 = sMax;
        if (Math.abs(dx) < 1e-9) { if (x0 < ax || x0 > bx) continue; } else { let u = (ax - x0) / dx, v = (bx - x0) / dx; if (u > v) { const w = u; u = v; v = w; } t0 = Math.max(t0, u); t1 = Math.min(t1, v); }
        if (Math.abs(dz) < 1e-9) { if (z0 < az0 || z0 > bz) continue; } else { let u = (az0 - z0) / dz, v = (bz - z0) / dz; if (u > v) { const w = u; u = v; v = w; } t0 = Math.max(t0, u); t1 = Math.min(t1, v); }
        if (t0 <= t1) { hs[nb * 2] = t0; hs[nb * 2 + 1] = t1; hb[nb++] = k; } }
      for (let ie = 0; ie < NEL; ie++) { const el = EL0 + ie * DEL, te = Math.tan(el), s0 = r0 * Math.cos(el); let bl = 0;
        const ce = Math.cos(el), rx = dx * ce, ry = Math.sin(el), rz = dz * ce;
        for (let q = 0; q < nb && !bl; q++) { const c = caixas[hb[q]]; const a = Math.max(hs[q * 2], s0), b = hs[q * 2 + 1]; if (a > b) continue; const ya = y0 + a * te, yb = y0 + b * te; if (Math.max(ya, yb) < c.a[1] - FOLGA || Math.min(ya, yb) > c.b[1] + FOLGA) continue;
          bl = c.tri ? +raioTri(c.tri, x0, y0, z0, rx, ry, rz, r0, sMax / Math.max(0.05, ce)) : 1; } /* v1.2.19: caixa = fase larga; decisão EXATA nos triângulos da peça (dupla face: pivô enterrado na peça também bloqueia) */
        if (!bl && el < 12 * D) for (let s = s0; s < sMax; s += 0.6) { const x = x0 + dx * s, z = z0 + dz * s, y = y0 + s * te; if (Math.abs(z) > L / 2 + 1) { if ((dz > 0) === (z > 0)) break; continue; } if (y < deckY(C, z) + FOLGA && Math.abs(x) < meiaBoca(C, z) + FOLGA) { bl = 1; break; } if (y < -2) break; }
        m[ia * NEL + ie] = bl; } }
    return dilata(m); }); }
  return R; }
/** Raio × triângulos (Möller–Trumbore, dupla face) com folga: testa também o raio deslocado ±FOLGA em y e no través (feixe com espessura). */
function raioTri(T, ox, oy, oz, dx, dy, dz, t0, t1) { const px = -dz, pz = dx, pl = Math.hypot(px, pz) || 1; const offs = [[0, 0, 0], [0, FOLGA, 0], [0, -FOLGA, 0], [px / pl * FOLGA, 0, pz / pl * FOLGA], [-px / pl * FOLGA, 0, -pz / pl * FOLGA]];
  for (const [qx, qy, qz] of offs) { const Ox = ox + qx, Oy = oy + qy, Oz = oz + qz;
    for (let i = 0; i < T.length; i += 9) { const e1x = T[i + 3] - T[i], e1y = T[i + 4] - T[i + 1], e1z = T[i + 5] - T[i + 2], e2x = T[i + 6] - T[i], e2y = T[i + 7] - T[i + 1], e2z = T[i + 8] - T[i + 2];
      const hx = dy * e2z - dz * e2y, hy = dz * e2x - dx * e2z, hz = dx * e2y - dy * e2x, det = e1x * hx + e1y * hy + e1z * hz; if (det > -1e-9 && det < 1e-9) continue; const f = 1 / det;
      const sx = Ox - T[i], sy = Oy - T[i + 1], sz = Oz - T[i + 2], u = f * (sx * hx + sy * hy + sz * hz); if (u < 0 || u > 1) continue; const qx2 = sy * e1z - sz * e1y, qy2 = sz * e1x - sx * e1z, qz2 = sx * e1y - sy * e1x;
      const v = f * (dx * qx2 + dy * qy2 + dz * qz2); if (v < 0 || u + v > 1) continue; const t = f * (e2x * qx2 + e2y * qy2 + e2z * qz2); if (t >= t0 && t <= t1) return true; } }
  return false; }
/** Fração livre de uma máscara (para teste/relatório). */
export const fracaoLivre = (m) => { let k = 0; for (let i = 0; i < m.length; i++) k += m[i] ? 0 : 1; return k / m.length; };
