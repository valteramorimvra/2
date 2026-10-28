import { EST_1225, layoutSuperPA } from './classes1225.js'; /* v1.2.25 */
import { layout1231 } from './layout1231.js'; import { bordaLivre1231, meiaBoca1231 } from './dados1231.js'; /* v1.2.31 */
import { layoutGigaPA } from './classes1226.js'; /* v1.2.26: porta-aviões gigantes (também registra EST/PLANO_PA dos 8 navios novos) */
// Arranjo de bordo comum à simulação e ao modelo 3D: onde ficam canhões, células VLS, CIWS e tubos de torpedo.
// Coordenadas LOCAIS do navio: x = boreste, y = cima (0 = linha d'água), z = popa (proa em −z).
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** Borda livre em função de u (0 = popa, 1 = proa): tosado subindo para a proa. */
const SHEER = { uk: 0.42, chn: 0.6, corv: 0.4, eua: 0.32 }; /* v1.2.7: tosamento por escola; UK com castelo de proa elevado */
export const bordaLivre = (C, u) => C.m1231 ? bordaLivre1231(C.id, u) : C.superPA ? C.F /* v1.2.25: super porta-aviões, convés corrido sem tosado */ : C.F * (1 + (SHEER[C.cascoN] ?? 0.5) * Math.pow(sstep(0.45, 1, u), 1.4) + (C.cascoN === 'uk' ? 0.22 * sstep(0.57, 0.62, u) : 0)) * (u < 0.08 ? 0.96 : 1);
export const deckY = (C, z) => bordaLivre(C, Math.max(0, Math.min(1, (C.L / 2 - z) / C.L)));
/** Meia-boca do convés na estação z. */
export function meiaBoca(C, z) { if (C.m1231) return meiaBoca1231(C.id, z); const u = Math.max(0, Math.min(1, (C.L / 2 - z) / C.L)); const tr = 0.8; const b = u < 0.1 ? tr + (1 - tr) * sstep(0, 0.1, u) : u < 0.52 ? 1 : Math.pow(Math.cos(Math.min(1, (u - 0.52) / 0.48) * Math.PI / 2), 0.78); return b * C.B / 2 * (C.casco === 'tumblehome' ? 0.86 : 1); }

const CACHE = {};
export function esqueceLayout(id) { delete CACHE[id]; } /* v1.2.19: usado só pelo teste/ajuste de linha de tiro */
/** Meio-arco de tiro (rad, a partir da direção "frente" da torre) bloqueado pela superestrutura: o setor cego fica
 *  centrado para dentro do navio, com meia-largura atan(meia-boca da superestrutura / distância até ela). */
export function arcoLivre(C, P, zT) {
  const s = P.sup, zS = zT < s.z0 ? s.z0 : s.z1, dz = Math.abs(zS - zT), w = meiaBoca(C, zS) * 0.9;
  return Math.max(1.6, Math.PI - Math.atan2(w, Math.max(1, dz)) - 0.05);
}
/** v1.2.19 item 5: correções de posição por classe (calculadas pelo teste de linha de tiro com os triângulos reais do modelo). */
export const AJUSTE_LT = {"tridente":{"ciws":{"0":{"y":12.05}}},"corsario":{"a30":{"0":{"y":10.56},"1":{"y":10.56}},"ciws":{"0":{"y":11.66}}},"redwood":{"a30":{"0":{"y":13.24}}},"monolito":{"ciws":{"0":{"y":12.89}},"a30":{"0":{"y":10.91},"1":{"y":10.91}}},"haiyan":{"a30":{"0":{"y":10.97},"1":{"y":10.97}},"ciws":{"0":{"y":12.07}}},"xuanwu":{"ciws":{"3":{"y":17.6}}},"strizh":{"a30":{"0":{"y":10.97},"1":{"y":10.97}},"ciws":{"0":{"y":12.07}}},"volkhar":{"laser":{"0":{"y":24.01}}},"baluarte":{"ciws":{"3":{"y":16.43}},"laser":{"0":{"y":24.31}}},"estrelar":{"ciws":{"3":{"y":15.41}}},"colosso":{"ciws":{"1":{"lug":5}},"laser":{"0":{"y":25.51}}},"marcos":{"laser":{"0":{"y":26.53}}},"rodolfo":{"ciws":{"1":{"lug":5}}},"antonia":{"ciws":{"1":{"lug":5}},"laser":{"0":{"y":25.52}}},"horizonte":{"a30":{"0":{"y":24.86}},"ciws":{"3":{"y":25.68}}},"atlantico":{"a30":{"0":{"y":29.88},"2":{"y":26.02}},"laser":{"1":{"y":29.81}}},"corveta":{"a30":{"0":{"y":10.97},"1":{"y":10.97}}},"fragata":{"a30":{"0":{"y":13.28}}},"destroier":{"a30":{"0":{"y":13.88}}},"furtivo":{"a30":{"0":{"y":13.66}}},"cruzador":{"ciws":{"0":{"y":14.94}}},"dragao":{"ciws":{"0":{"y":14.73}},"a30":{"0":{"y":16.56}}},"tempestade":{"a30":{"0":{"y":10.32},"1":{"y":10.32}}},"sentinela":{"ciws":{"0":{"y":14.27}}},"leviata":{"ciws":{"0":{"y":13.66}},"a30":{"0":{"y":9.7},"1":{"y":9.7}}},"aurora":{"ciws":{"1":{"y":15.07}},"a30":{"0":{"y":11.11},"1":{"y":11.11}}},"kestrel":{"a30":{"0":{"y":11.75},"1":{"y":11.75}}},"jinpeng":{"a30":{"0":{"y":13.26}}},"tianlong":{"a30":{"0":{"y":13.35}}},"sokol":{"a30":{"0":{"y":13.23}}},"sapsan":{"a30":{"0":{"y":13.24}}},"fenghuang":{"ciws":{"0":{"y":14.69}},"a30":{"0":{"y":16.52}}},"puffin":{"a30":{"0":{"y":10.97},"1":{"y":10.97}}},"thornwood":{"a30":{"0":{"y":13.28}}}};
export function layoutDe(C, mais = 0) { /* v1.2.21 item 19b: mais = células VLS extras do módulo (posições REAIS, uma fileira a mais no bloco) */
  const ck = mais > 0 ? C.id + ':' + mais : C.id; if (CACHE[ck]) return CACHE[ck];
  if (C.m1231) { const q = layout1231(C); if (q) return CACHE[ck] = q; } /* v1.2.31 */
  const L = C.L, P = { torres: [], vls: [], sam: [], celulas: [], ciws: [], a30: [], tubos: [], mastro: 0 };
  const est = { corveta: [-0.14, 0.12], fragata: [-0.16, 0.08], destroier: [-0.15, 0.08], furtivo: [-0.15, 0.1], cruzador: [-0.17, 0.06], capitania: [-0.19, 0.1], tridente: [-0.18, 0.16], dragao: [-0.17, 0.08], tempestade: [-0.17, 0.1], sentinela: [-0.17, 0.1], corsario: [-0.12, 0.1], leviata: [-0.15, 0.08], aurora: [-0.16, 0.08], kestrel: [-0.1, 0.14], haiyan: [-0.13, 0.1], strizh: [-0.11, 0.08], puffin: [-0.16, 0.14], redwood: [-0.17, 0.12], jinpeng: [-0.15, 0.1], tianlong: [-0.18, 0.06], sokol: [-0.14, 0.12], thornwood: [-0.19, 0.1], sapsan: [-0.13, 0.1], monolito: [-0.2, 0.12], xuanwu: [-0.18, 0.04], medved: [-0.15, 0.14], warden: [-0.18, 0.12], fenghuang: [-0.16, 0.1], trovao: [-0.14, 0.12], volkhar: [-0.12, 0.1], baluarte: [-0.12, 0.1], kordao: [-0.24, -0.04], estrelar: [-0.08, 0.16], colosso: [-0.11, 0.09], marcos: [-0.1, 0.07], rodolfo: [-0.12, 0.09], antonia: [-0.11, 0.08], horizonte: [-0.06, 0.1], atlantico: [-0.06, 0.1], kelly: [-0.12, 0.09], laiane: [-0.1, 0.08], klevton: [-0.12, 0.09], ananery: [-0.12, 0.1], trajano: [-0.09, 0.06], leidevaldo: [-0.1, 0.08], ronaldo: [-0.1, 0.08], mercante: [0.3, 0.4], ...EST_1225 }[C.id] || [-0.16, 0.08];
  P.sup = { z0: est[0] * L, z1: est[1] * L, h: L < 100 ? 2.9 : L > 200 ? 3.9 : 3.3 };
  const nT = C.canhao.torres, canos = C.canhao.canos || 1;
  // torres: A (proa), B (proa, sobreposta/superfiring, mais alta), C (popa). Cada uma gira e eleva independente.
  const defs = nT >= 6 ? [[-0.4, 1, 0, 'Torre 1 Proa'], [-0.325, 1, 3.8, 'Torre 2 Proa'], [-0.25, 1, 7.4, 'Torre 3 Proa'], [0.235, -1, 7.4, 'Torre 4 Popa'], [0.31, -1, 3.8, 'Torre 5 Popa'], [0.385, -1, 0, 'Torre 6 Popa']] /* v1.2.16 */ : nT === 5 ? [[-0.39, 1, 0, 'Torre 1 Proa'], [-0.315, 1, 3.8, 'Torre 2 Proa'], [-0.24, 1, 7.4, 'Torre 3 Proa'], [0.25, -1, 3.8, 'Torre 4 Popa'], [0.33, -1, 0, 'Torre 5 Popa']] /* v1.2.16 */ : nT >= 4 ? [[-0.37, 1, 0, 'Torre 1 Proa'], [-0.285, 1, 3.8, 'Torre 2 Proa'], [0.265, -1, 3.8, 'Torre 3 Popa'], [0.35, -1, 0, 'Torre 4 Popa']] /* v1.2.11: 4 torres (lendários) */ : C.canhao.frenteDupla ? [[-0.34, 1, 0, 'Torre 1 Proa'], [-0.265, 1, 2.4, 'Torre 2 Proa']] : nT >= 3 ? [[-0.33, 1, 0, 'Torre 1 Proa'], [-0.245, 1, 3.6, 'Torre 2'], [0.31, -1, 0, 'Torre 3 Popa']]
    : nT === 2 ? [[-0.31, 1, 0, 'Torre 1 Proa'], [0.31, -1, 0, 'Torre 2 Popa']] : [[-0.31, 1, 0, 'Torre 1 Proa']];
  for (const [f, frente, alt, nome] of defs) { const z = f * L; const cal = C.canhao.cal, cou = cal > 140 && !C.canhao.embutido; /* couraçado: casamata grande, canos longos */
    P.torres.push({ z, y: deckY(C, z) + alt, barbeta: alt, frente, arco: arcoLivre(C, P, z), canos, nome, estilo: cou && !C.canhao.embutido ? 'couracado' : C.canhao.embutido ? 'embutido' : 'padrao',
      esc: cou ? 1 : cal > 100 ? 1.3 : 1.1, lc: cou ? 15 : (cal > 100 ? 7.5 : 5.2) * (cal > 100 ? 1.3 : 1.1), esp: canos > 1 ? (cou ? (canos >= 4 ? 2.5 : 1.55) : (cal / 127) * 0.85 * (cal > 100 ? 1.3 : 1.1)) : 0,
      py: cou ? 2.5 : 1.9 * (cal > 100 ? 1.3 : 1.1), pz: cou ? -3.2 : -1.2 * (cal / 127) * (cal > 100 ? 1.3 : 1.1) }); } /* esc: escala visual da torre (sim usa os mesmos lc/py/pz) */
  // VLS antinavio: bloco de proa (entre canhões e superestrutura); navios grandes dividem em proa/popa
  const zProa = C.canhao.frenteDupla ? -L * 0.2 : nT >= 3 ? -L * 0.215 + 2 : -L * 0.22;
  const nV = C.vls ? C.vls + mais : 0; const blocos = C.vls >= 24 ? [[Math.round(C.vls * 0.5) + mais, -L * 0.215], [C.vls - Math.round(C.vls * 0.5), L * (C.vlsRe || 0.17) /* v1.2.25: bloco de ré à vante do hangar */]] : [[nV, zProa]];
  P.blocosVls = [];
  const bloco = (nb, zc, tipo, lista, xc = 0, yF = null) => { if (!nb) return; const col = nb >= 24 ? 8 : 4, lin = Math.ceil(nb / col), cs = 1.08; const y = yF == null ? deckY(C, zc) : yF; P.blocosVls.push({ zc, y, col, lin, cs, n: nb, tipo, xc });
    for (let i = 0; i < nb; i++) lista.push({ x: xc + (i % col - (col - 1) / 2) * cs, y: y + 0.25, z: zc + (Math.floor(i / col) - (lin - 1) / 2) * cs }); };
  for (const [nb, zc] of blocos) bloco(nb, zc, 'vls', P.vls);
  // VLS de defesa de frota (SAM): silo dedicado logo à ré da superestrutura
  if (C.sam && C.porta === 'pa') { /* v1.2.17 item 7: super porta-aviões — dois lançadores SAM de 8 células em PATROCÍNIOS (sponsons) abaixo da borda do convés de voo, fora da área de pouso: bombordo a meia-nau (a ré do nome dourado, sem cobri-lo) e alheta de boreste */ const h = Math.round(C.sam / 2), yS = deckY(C, -L * 0.27) + 0.6 - 3.2; bloco(h, L * 0.12, 'samPa', P.sam, -(C.B * 0.7 + 2.9), yS); bloco(C.sam - h, L * 0.4, 'samPa', P.sam, C.B * 0.5 + 3.4, yS); }
  else if (C.sam) bloco(C.sam, P.sup.z1 + (C.id === 'capitania' ? 6 : 4.5), 'sam', P.sam);
  P.celulas = P.vls.concat(P.sam);
  const s = P.sup, yT = deckY(C, s.z0) + s.h * 2;
  const lug = [[0, yT + 0.3, s.z0 + 2.4], [0, deckY(C, L * 0.26) + 6.4, L * 0.26], [-(meiaBoca(C, s.z1) * 0.6), deckY(C, s.z1) + s.h + 0.4, s.z1 - 3], [meiaBoca(C, s.z1) * 0.6, deckY(C, s.z1) + s.h + 0.4, s.z1 - 3], [0, deckY(C, s.z1) + s.h + 0.4, s.z1 - 1.6], /* v1.2.18: asas do passadiço (cruzeiros pesados: o lugar 1, a ré, é da torre superelevada) */ [-(meiaBoca(C, s.z0 + 3) * 0.62), deckY(C, s.z0) + s.h + 0.4, s.z0 + 3], [meiaBoca(C, s.z0 + 3) * 0.62, deckY(C, s.z0) + s.h + 0.4, s.z0 + 3]];
  const ordem = C.ciwsLug || [0, 1, 2, 3];
  for (let i = 0; i < C.ciws; i++) { const l = lug[ordem[i]]; P.ciws.push({ x: l[0], y: l[1], z: l[2], lug: ordem[i] }); }
  // reparos de 30 mm nas asas da superestrutura (BE/BB à vante; BE/BB à ré)
  const zA = s.z0 + 4, zR = s.z1 - 4.5; const pos30 = [[1, zA], [-1, zA], [1, zR], [-1, zR]];
  if (C.a30 === 1) P.a30.push({ x: 0, y: deckY(C, s.z1) + s.h + 0.5, z: s.z1 - 1.6, lado: 0 });
  else for (let i = 0; i < Math.min(4, C.a30 || 0) /* v1.2.26: 4 lugares na casaria (gigantes: 6 em patrocínios, layoutGigaPA) */; i++) { const [sx, z] = pos30[i]; P.a30.push({ x: sx * (meiaBoca(C, z) - 2.2), y: deckY(C, z) + 1.1, z, lado: sx }); }
  // tubos de torpedo: tubos[0] lançadores por bordo, cada um com tubos[1] canos
  const [porBordo, canosT] = C.tubos || [1, 3];
  if (C.torp && porBordo) { const zt0 = s.z1 + (C.id === 'corveta' ? 8 : 5) + (C.sam ? C.sam / 4 * 1.08 + 2 : 0);
    for (let k = 0; k < porBordo; k++) { const zt = zt0 + k * 4.2; for (const sx of [-1, 1]) { const sub = true; /* v1.2.9: TODOS os navios lançam por portas submersas no casco */ P.tubos.push(sub ? { x: sx * meiaBoca(C, zt) * 0.9, y: -C.T * 0.55, z: zt, lado: sx, canos: canosT, sub: 1 } : { x: sx * (meiaBoca(C, zt) - 1.7), y: deckY(C, zt) + 0.7, z: zt, lado: sx, canos: canosT }); } } } /* v1.2.7: corvetas e furtivos dos EUA lançam por portas SUBMERSAS */
  /* v1.2.11: LASER de defesa aérea (feixe fino): no topo da superestrutura e/ou sobre o hangar */
  P.laser = []; for (let i = 0; i < (C.laser || 0); i++) P.laser.push(i === 0 ? { x: 0, y: yT + 2.2, z: s.z0 + 5.5 } : { x: 0, y: deckY(C, s.z1) + s.h + 1.4, z: s.z1 - 4 });
  /* v1.2.11: PORTA-AVIÕES ('pa': convés corrido + ilha a boreste) e CRUZADOR PORTA-AERONAVES ('cruzador': convés em ângulo à ré) */
  if (C.porta) { const pa = C.porta === 'pa'; const z0 = pa ? -L * 0.27 : s.z1 + 9; const y = deckY(C, z0) + 0.6; P.deckV = { z0, z1: L / 2 + 2, y, x: -C.B * (pa ? 0.1 : 0.12), w: C.B * (pa ? 1.2 : 1.02), ang: pa ? 0 : 0.055 };
    P.ilhaX = pa ? C.B * 0.3 : 0; if (P.ilhaX) { for (const c of P.ciws.concat(P.laser)) { c.x = Math.max(-(meiaBoca(C, c.z) - 1.3), Math.min(meiaBoca(C, c.z) - 1.3, c.x + P.ilhaX)); if (c.z > z0 - 6) c.y += y - deckY(C, c.z) - 0.2; } }
    for (const a of P.a30) { if (a.z > z0) a.y = Math.max(a.y, y + 0.9); } const zc = (z0 + L / 2) / 2 + (pa ? L * 0.12 : 0); P.convoo = { z: zc, y, x: P.deckV.x * 0.5 }; }
  /* v1.2.18 item 14d: ARTILHARIA SECUNDÁRIA AUTOMÁTICA (cruzeiros pesados novos). 100 mm: um reparo por bordo no teto da superestrutura a meia-nau (setor de ~170° pelo través). Leves (30/12,7 mm): bordas do convés logo à vante e logo à ré da superestrutura (fora do lança-granadas, VLS, SAM e reparos de 30 mm). */
  P.sec = []; if (C.sec) { const zS = (s.z0 + s.z1) / 2; let i = 0; for (const grp of C.sec) { const A = grp.arma, pesado = A.cal >= 76; const lug = pesado ? [[1, zS, 1], [-1, zS, 1]] : [[1, s.z0 - 2.2, 0], [-1, s.z0 - 2.2, 0], [1, s.z1 + (C.baterias ? 15 : 2.2), 0], [-1, s.z1 + (C.baterias ? 15 : 2.2), 0], [1, s.z0 - 5.4, 0], [-1, s.z0 - 5.4, 0]];
      for (let k = 0; k < Math.min(grp.n, lug.length); k++) { const [sx, z, teto] = lug[k]; const x = sx * (teto ? meiaBoca(C, z) * 0.86 - 2.6 : meiaBoca(C, z) - 1.7); const y = deckY(C, z) + (teto ? s.h + 0.15 : 0.15);
        P.sec.push({ i: i++, x, y, z, lado: sx, centro: sx * Math.PI / 2 + (teto ? 0 : (z < zS ? -sx : sx) * 0.35), meio: teto ? 1.48 : 1.35, cal: A.cal, arma: A, lc: pesado ? 4.8 : 1.6, tipo: pesado ? 'pesado' : 'leve' }); } } }
  P.mastro = deckY(C, s.z0) + s.h * 2 + L * 0.09 + 4;
  if (!C.porta) P.convoo = C.heli ? { z: (L * 0.28 + L / 2) / 2 + 2, y: deckY(C, L * 0.4) } : null;
  /* v1.2.7: lança-granadas (LG-4) sempre DENTRO da boca: entre a torre de proa e a superestrutura, afastado da borda ≥ 2,2 m (raio do pedestal 1,8 m) */
  P.granadas = []; if (C.rbu) { const R = 1.9, folga = 0.3; const zA = P.torres[0] ? P.torres[0].z + 6.5 : -L * 0.25, zB = P.sup.z0 - 2.4; let z = zA < zB ? (zA + zB) / 2 : zB; let x = meiaBoca(C, z) - R - folga;
    for (let k = 0; k < 40 && x < R + 0.4; k++) { z += 1; x = meiaBoca(C, z) - R - folga; } x = Math.max(R + 0.2, Math.min(C.B * 0.28, x));
    const zT = P.torres[0] ? P.torres[0].z : -L / 2; for (const b of P.blocosVls || []) { const hw = (b.col * b.cs + 0.6) / 2, hl = (b.lin * b.cs + 0.6) / 2; if (!(Math.abs(z - b.zc) < hl + R && x - R < hw)) continue; /* não sobrepõe o bloco VLS */
      const xL = meiaBoca(C, z) - R - folga; if (xL >= hw + R + 0.2) { x = hw + R + 0.2; continue; }
      const zR = b.zc + hl + R + 0.4, zF = b.zc - hl - R - 0.4; if (zR <= P.sup.z0 - 1 && meiaBoca(C, zR) - R - folga >= R + 0.4) { z = zR; x = Math.min(C.B * 0.28, meiaBoca(C, z) - R - folga); } else if (zF >= zT + 4.5 && meiaBoca(C, zF) - R - folga >= R + 0.4) { z = zF; x = Math.min(C.B * 0.28, meiaBoca(C, z) - R - folga); } }
    for (const sx of [-1, 1]) P.granadas.push({ x: sx * x, y: deckY(C, z), z, lado: sx, r: R, centro: sx * 0.25, meio: 2.45 }); /* par de vante: cobre a proa e os bordos (±140° do eixo de cada um) */
    if (C.heli && L >= 130 && !(C.canhao.torres >= 3 || C.couracado)) { const zh = L * 0.28, chg = L * 0.12, za = zh - chg + 4.6; P.granadas.push({ x: 0, y: deckY(C, zh) + 5.6, z: za, lado: 0, r: R, centro: Math.PI, meio: 1.85, re: 1 }); } /* v1.2.7: lançador de RÉ no teto do hangar (fora do convoo) — setor de popa */ }
  if (C.superPA) layoutSuperPA(C, P, deckY, meiaBoca); /* v1.2.25 */ if (C.gigaPA) layoutGigaPA(C, P); /* v1.2.26 */
  { const A = AJUSTE_LT[C.id]; if (A) for (const t in A) for (const j in A[t]) { const v = A[t][j], m = P[t] && P[t][j]; if (!m) continue; if (v.lug != null) { const l = lug[v.lug]; m.x = l[0]; m.y = l[1]; m.z = l[2]; m.lug = v.lug; } if (v.y != null) m.y = v.y; if (v.x != null) m.x = v.x; if (v.z != null) m.z = v.z; m.ped = v.ped || 0; } } /* v1.2.19 item 5: LINHA DE TIRO LIVRE — montagens antiaéreas que ficavam embutidas na estrutura sobem ao teto do bloco (pedestal) ou mudam de lugar; NENHUMA removida */
  CACHE[ck] = P; return P;
}
