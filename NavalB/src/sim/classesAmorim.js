// Naval B v1.3.00 — AMORIM (SL 06): ficha, constantes e layout (SEM importações — classes.js/layout.js importam daqui sem ciclo).
// A parte que roda na batalha (revezamento de salvas, lançador lateral, canhões automáticos) está em amorim.js.
export const AM = Object.freeze({
  salvaLat: 5, recLat: 7, salvaVls: 4, dtSalva: 0.15, perfilLat: 'medio',
  lat: { t1: 0.7, t2: 2.0, v0: 35, acel: 25, giro: 30 * Math.PI / 180, elev: 24.1 * Math.PI / 180, fora: 8 * Math.PI / 180 },
  auto: { alc: 3000, cad: 0.1, carregador: 20, recarga: 6, dano: 0.6, cal: 30, V0: 1000, giro: 2.6, disp: 0.6 },
});
/* bocas dos 10 tubos laterais (medidas no modelo final) e eixo real */
const ZL = [-2.81, 1.07, 4.95, 8.83, 12.71], XL = [7.44, 8.16, 8.16, 7.44, 7.44];
export const TUBOS_LAT = { bb: ZL.map((z, i) => ({ x: -XL[i], y: 12.42, z })), be: ZL.map((z, i) => ({ x: XL[i], y: 12.42, z })) };
/* canhões automáticos antinavio: centro = direção do través (+π/2 boreste, −π/2 bombordo); arco de −10° a 190° para fora = meio 100° */
export const AUTOS = [
  { x: -8.37, y: 7.25, z: 35.44, centro: -Math.PI / 2, meio: 100 * Math.PI / 180, lc: 1.4, nome: 'Canhão automático de ré (BB)' },
  { x: 8.37, y: 7.25, z: 35.44, centro: Math.PI / 2, meio: 100 * Math.PI / 180, lc: 1.4, nome: 'Canhão automático de ré (BE)' },
  { x: -7.6, y: 7.7, z: -34, centro: -Math.PI / 2, meio: 100 * Math.PI / 180, lc: 2.8, nome: 'Canhão automático de vante (BB)' },
  { x: 7.6, y: 7.7, z: -34, centro: Math.PI / 2, meio: 100 * Math.PI / 180, lc: 2.8, nome: 'Canhão automático de vante (BE)' },
];
/* caixas de colisão da própria estrutura (coordenadas locais) para a linha de tiro dos canhões automáticos */
export const CAIXAS = [
  [-7.62, 7.62, 5.2, 43.2, -15.6, 28.4],   // casaria + torres-mastro
  [-3.8, 3.8, 14.9, 22.7, 21.3, 26.5],     // chaminés
  [-5.1, 5.1, 7.7, 12.9, -69.4, -59.1],    // torre 1
  [-5.7, 5.7, 6.2, 15.5, -51.9, -40.4],    // torre 2 + barbeta
  [-6.25, 6.25, 5.3, 10.4, 41.8, 50.3],    // hangar + CIWS
];

/** Ficha da classe (registrada em classes.js como os outros adiciona*). */
export function adicionaAmorim(CLASSES, { D, CAN, VIDA }) {
  CLASSES.amorim = D('cruzador', 'amorim', { premium: 1, lendario: 1, superLend: 1, amorim: 1, missilNuclear: 1,
    nome: 'Amorim', classe: 'Classe Amorim', nomeOriginal: 'Amorim (projeto do Valter)', num: 'SL 06',
    papel: 'Super lendário: 2 torres grandes de 3 canos, 100 mísseis em 2 slots (salvas de 4), lançadores laterais inclinados (salvas de 5, recarga 7 s), VLS nuclear dourado (efeito do Nakhimov), 30 torpedos em salvas de 4, 3 lança-granadas, antiaérea laser (3 esferas do topo) e convencional, 2 canhões automáticos de ré, canhões automáticos novos e CIWS',
    L: 163, B: 21, T: 5.6, F: 7.0, vmax: 16.0, acel: 0.6, giro: 0.72, vida: VIDA(1150), blind: 2.4, rcs: 1.1, radar: 22000, desl: 12500,
    canhao: CAN({ cal: 152, V0: 900, cad: 2.2, dano: 30, alc: 16000, disp: 0.6, torres: 2, canos: 3, som: 'grande' }),
    vls: 100, missil: 'hiper', salva: 4, sam: 0, ciws: 2, ciwsLug: [0, 1], a30: 0, laser: 7, chaff: 14, torp: 30, tubos: [3, 4], heli: 0,
    rbu: { nome: 'LG-12', salvas: 10, foguetes: 12, alc: 5500, min: 300, dano: 30, cad: 14, el: 0.62 },
    casco: 'convencional', cascoN: 'bra', estilo: 'cruzador', pf: 'ataque', antiAereo: 1 });
}
export const META_AMORIM = { amorim: ['BRA', 4, 'slend_negro'] };

/** Layout (posições = modelo 3D = sim). Gancho em layout.js: if (C.amorim) return layoutAmorim(C). */
export function layoutAmorim(C) {
  const P = { torres: [], vls: [], sam: [], celulas: [], ciws: [], a30: [], tubos: [], laser: [], sec: [], granadas: [], blocosVls: [], mastro: 46.2 };
  P.sup = { z0: -15.6, z1: 28.4, h: 6.5 };
  P.torres.push({ z: -64.27, y: 7.77, barbeta: 0, frente: 1, arco: 2.62, canos: 3, nome: 'Torre 1 (vante)', estilo: 'padrao', esc: 1, lc: 11, esp: 1.6, py: 2.44, pz: -3.63 });
  P.torres.push({ z: -46.16, y: 10.22, barbeta: 2.45, frente: 1, arco: 2.4, canos: 3, nome: 'Torre 2 (elevada)', estilo: 'padrao', esc: 1, lc: 11, esp: 1.6, py: 2.63, pz: -3.7 });
  const grade = (zc, y, col, lin, sx, sz, lista) => { P.blocosVls.push({ zc, y, col, lin, cs: sx, n: col * lin, tipo: 'vls', xc: 0 }); for (let i = 0; i < col * lin; i++) lista.push({ x: (i % col - (col - 1) / 2) * sx, y: y + 0.25, z: zc + (Math.floor(i / col) - (lin - 1) / 2) * sz }); };
  grade(-27.5, 6.4, 5, 10, 0.9, 0.86, P.vls);   // slot de VANTE (preto, z −31,8 a −23,2): 50 mísseis
  grade(35.34, 5.84, 5, 10, 1.2, 1.1, P.vls);   // slot de RÉ (dourado, z 29,8 a 41,0): 50 mísseis — também lança o NUCLEAR
  P.celulas = P.vls.slice();
  P.ciws.push({ x: -1.68, y: 10.6, z: 44.57, lug: 0, tipo: 'ciws', piv: 1.0 }, { x: 1.68, y: 10.6, z: 44.57, lug: 1, tipo: 'ciws', piv: 1.0 });
  for (const [x, y, z] of [[-6.1, 7.5, -10.0], [6.1, 7.5, -10.0], [-7.5, 6.7, 70.5], [7.5, 6.7, 70.5], [-1.24, 33.54 - 0.95, -5.30], [1.29, 33.54 - 0.95, -5.30], [-0.01, 33.54 - 0.95, -4.07]]) P.laser.push({ x, y, z }); /* esferas: o feixe do jogo nasce 0,95 m acima do ponto → aqui fica no CENTRO de cada esfera (y 33,54) */
  for (const z of [55.5, 60.6, 65.8]) for (const sx of [-1, 1]) P.tubos.push({ x: sx * 9.1, y: 6.6, z, lado: sx, canos: 4, sub: 0 });
  P.granadas.push({ x: 0, y: 14.36, z: -46.5, lado: 0, r: 1.3, centro: 0, meio: 2.6, torre: 1 }, { x: 7.6, y: 8.6, z: -42.7, lado: 1, r: 1.3, centro: 0.6, meio: 2.2 }, { x: -7.6, y: 8.6, z: -42.7, lado: -1, r: 1.3, centro: -0.6, meio: 2.2 });
  P.convoo = null; P.heliponto = { z: 64.3, y: 5.6 };
  P.nuke = { x: 0, y: 5.84, z: 35.34, w: 6, l: 11 };
  P.autos = AUTOS; P.tubosLat = TUBOS_LAT;
  return P;
}

