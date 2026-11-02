// Naval B v1.3.02 — FRAGATA LENDÁRIA AMORIM (L 09), projeto do Valter (Fragata-Amorim v5.1). Ficha, constantes e layout
// (SEM importações: classes.js/layout.js importam daqui sem ciclo). Posições = modelo 3D = simulação (metros; proa −z; boreste +x).
// Usa os sistemas que o jogo e o Amorim já têm (balística, VLS, lançadores laterais inclinados, canhões automáticos, torpedo, RBU,
// LASER, CIWS, SAM, helicóptero); o que muda é configurado por classe — o Amorim continua idêntico.

const DEG = Math.PI / 180;
/** Mísseis: o navio ESCOLHE o melhor slot a cada lançamento (lateral BB, lateral BE ou VLS de proa); salva de 4; recarga 5 s. */
export const MIS_FA = Object.freeze({ salvaVls: 4, salvaLat: 4, rec: 5, alterna: 0.35 });
/** Lançadores laterais inclinados (4 tubos por bordo): eixo 35° para cima, 8° para fora; bocas medidas no modelo. */
export const LAT_FA = Object.freeze({ t1: 0.7, t2: 2.0, v0: 35, acel: 25, giro: 30 * DEG, elev: 35 * DEG, fora: 8 * DEG });
const BE = [[5.4377, 13.3404, -3.5777], [4.8238, 13.3404, -3.6639], [5.3883, 13.8482, -3.2255], [4.7743, 13.8482, -3.3118]];
export const TUBOS_LAT_FA = { bb: BE.map(([x, y, z]) => ({ x: -x, y, z })), be: BE.map(([x, y, z]) => ({ x, y, z })) };
/** Canhões automáticos de 30 mm elevados (2): mesmo sistema do Amorim, recarga 7 s. */
export const AUTO_FA = Object.freeze({ alc: 3000, cad: 0.1, carregador: 20, recarga: 7, dano: 0.6, cal: 30, V0: 1000, giro: 2.6, disp: 0.6 });
export const AUTOS_FA = [
  { x: -4.9, y: 9.0, z: -36.3, centro: -Math.PI / 2, meio: 100 * DEG, lc: 2.42, nome: 'Canhão automático 30 mm (BB)' },
  { x: 4.9, y: 9.0, z: -36.3, centro: Math.PI / 2, meio: 100 * DEG, lc: 2.42, nome: 'Canhão automático 30 mm (BE)' },
];
/** Caixas da própria estrutura (linha de tiro dos canhões automáticos) — geradas das malhas do modelo. */
export const CAIXAS_FA = [
  [-6.73, 6.73, 6.60, 17.03, -27.04, 17.54], [-1.96, 1.96, 17.00, 26.70, -17.01, -13.64], [-3.48, 3.48, 13.80, 17.63, 5.00, 8.60],
  [-5.83, 5.83, 6.59, 13.03, 20.97, 43.05], [-2.10, 2.10, 6.60, 10.30, -57.90, -47.70], [-2.10, 2.10, 6.60, 11.70, -37.50, -27.30],
];
/** Torpedos: 2 lançadores triplos; 1 aperto = salva de 3 em leque; recarga 7 s. Bocas dos 3 tubos de cada bordo. */
const TORP_BE = [[6.9281, 7.5915, 61.24], [7.3182, 7.5915, 60.683], [7.2219, 8.16, 61.03]];

export function adicionaFragAmorim(CLASSES, { D, CAN, VIDA }) {
  CLASSES.fragata_amorim = D('fragata', 'fragata_amorim', { premium: 1, lendario: 1, fragAmorim: 1, pinturaFixa: 1,
    nome: 'Fragata Lendária Amorim', classe: 'Classe Amorim', nomeOriginal: 'Fragata Amorim (projeto do Valter)', num: 'L 09',
    papel: 'Fragata lendária: 2 canhões de 127 mm (o de ré mais alto, recarga 4 s), 32 células VLS e 2 lançadores laterais inclinados de 4 mísseis com escolha automática do melhor slot (salva de 4, recarga 5 s), 6 torpedos em 2 lançadores triplos (salva de 3, recarga 7 s), lança-granadas LF-12, 2 lasers, 2 CIWS, 12 SAM, 2 canhões automáticos de 30 mm elevados (recarga 7 s), hangar com helicóptero, heliponto e bandeiras de popa e de proa',
    L: 128, B: 16, T: 4.4, F: 6.6, vmax: 15.8, acel: 0.85, giro: 0.95, vida: VIDA(250), blind: 1.1, rcs: 0.6, radar: 14500, desl: 5000,
    canhao: CAN({ cal: 127, V0: 840, cad: 5.0, dano: 15, alc: 10500, disp: 0.7, torres: 2, canos: 1, som: 'grande' }),
    vls: 32, missil: 'medio', salva: 4, misRec: 5, misAuto: MIS_FA, latCfg: LAT_FA, tubosLat: TUBOS_LAT_FA, autoCfg: AUTO_FA, autos: AUTOS_FA, caixasAuto: CAIXAS_FA,
    sam: 12, ciws: 2, ciwsLug: [0, 1], a30: 0, laser: 2, chaff: 10,
    torp: 6, tubos: [1, 3], torpSalva: 3, torpRec: 7, heli: 1,
    rbu: { nome: 'LF-12 Martelo', salvas: 6, foguetes: 12, alc: 4500, min: 700, dano: 26, cad: 15, el: 0.82 },
    bandeiraProa: 1, casco: 'convencional', cascoN: 'bra', estilo: 'fragata', pf: 'ataque' });
}
export const META_FRAGAMORIM = { fragata_amorim: ['BRA', 3, 'fab_fragamorim'] };

/** Layout (posições = modelo 3D). Gancho em layout.js: if (C.fragAmorim) return layoutFragAmorim(C). */
export function layoutFragAmorim(C) {
  const P = { torres: [], vls: [], sam: [], celulas: [], ciws: [], a30: [], tubos: [], laser: [], sec: [], granadas: [], blocosVls: [], mastro: 30.85 };
  P.sup = { z0: -27.0, z1: 17.5, h: 6.5 };
  P.torres.push({ z: -50.0, y: 8.7, barbeta: 1.6, frente: 1, arco: 2.9, canos: 1, nome: 'Canhão 127 mm nº 1 (proa)', estilo: 'padrao', esc: 1, lc: 6.2, esp: 1.0, py: 0.9, pz: -1.7 });
  P.torres.push({ z: -29.6, y: 10.1, barbeta: 3.0, frente: 1, arco: 2.4, canos: 1, nome: 'Canhão 127 mm nº 2 (elevado)', estilo: 'padrao', esc: 1, lc: 6.2, esp: 1.0, py: 0.9, pz: -1.7 });
  const XS = [-1.72, -0.57, 0.57, 1.72]; for (const x of XS) for (let r = 0; r < 8; r++) P.vls.push({ x, y: 6.675 + 0.25, z: -40.32 + r * 1.15 });
  P.blocosVls.push({ zc: -36.3, y: 6.675, col: 4, lin: 8, cs: 1.15, n: 32, tipo: 'vls', xc: 0 });
  for (let i = 0; i < 12; i++) { const c = P.vls[i]; P.sam.push({ x: c.x, y: c.y, z: c.z }); } /* SAM em 12 células do mesmo bloco (pacote quádruplo) */
  P.celulas = P.vls.concat(P.sam);
  P.ciws.push({ x: 0, y: 14.8, z: -23.8, lug: 0, tipo: 'ciws', piv: 1.0 }, { x: 0, y: 14.0, z: 36.0, lug: 1, tipo: 'ciws', piv: 1.0 });
  P.laser.push({ x: -2.7, y: 18.35 - 0.95, z: -19.2 }, { x: 2.7, y: 18.35 - 0.95, z: -19.2 }); /* o feixe do jogo nasce 0,95 m acima → CENTRO da esfera */
  for (const sx of [-1, 1]) for (const [x, y, z] of TORP_BE) P.tubos.push({ x: sx * x, y, z, lado: sx, canos: 1, sub: 0 });
  P.granadas.push({ x: 0, y: 8.1, z: -44.2, lado: 0, r: 1.3, centro: 0, meio: 2.6 });
  P.convoo = { z: 52.5, y: 6.64, x: 0 }; P.heliponto = { z: 54.0, y: 6.64 }; /* ponto do hangar (z ≈ 42) cai dentro do hangar */
  P.autos = AUTOS_FA; P.tubosLat = TUBOS_LAT_FA;
  return P;
}
