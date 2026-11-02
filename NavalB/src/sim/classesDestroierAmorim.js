// Naval B v1.3.03 — DESTRÓIER AMORIM D-01 (id destroier_amorim), projeto do Valter. Ficha, constantes e layout (SEM importações:
// classes.js/layout.js importam daqui sem ciclo). Posições = modelo 3D = simulação (metros; proa −z; boreste +x). Medidas do META.json do
// modelo (tools/destroier). Usa os sistemas que o jogo, o Amorim e a Fragata Amorim já têm (configuração POR CLASSE; os outros ficam iguais).
const DEG = Math.PI / 180;
/** Mísseis: o navio escolhe o melhor slot a cada salva (lateral BB, lateral BE, VLS); salva de 6; recarga 6 s. */
export const MIS_DA = Object.freeze({ salvaVls: 6, salvaLat: 6, rec: 6, alterna: 0.35 });
/** Lançadores laterais inclinados (6 tubos por bordo): 24,1° para cima, 8° para fora (bocas do modelo). */
export const LAT_DA = Object.freeze({ t1: 0.7, t2: 2.0, v0: 35, acel: 25, giro: 30 * DEG, elev: 24.1 * DEG, fora: 8 * DEG });
const BE = [[7.5844, 14.2783, -32.1582], [7.5844, 14.2783, -29.1582], [7.5844, 14.2783, -26.1582], [7.5844, 14.2783, -23.1582], [7.5844, 14.2783, -20.1582], [7.5844, 14.2783, -17.1582]];
export const TUBOS_LAT_DA = { bb: BE.map(([x, y, z]) => ({ x: -x, y, z })), be: BE.map(([x, y, z]) => ({ x, y, z })) };
/** 4 canhões automáticos de 30 mm (2 à vante, 2 à ré), recarga 7 s (sistema do Amorim). */
export const AUTO_DA = Object.freeze({ alc: 3000, cad: 0.1, carregador: 20, recarga: 7, dano: 0.6, cal: 30, V0: 1000, giro: 2.6, disp: 0.6 });
export const AUTOS_DA = [
  { x: -8.7, y: 10.8, z: -46.0, centro: -Math.PI / 2, meio: 100 * DEG, lc: 2.42, nome: 'Canhão automático 30 mm (vante BB)' },
  { x: 8.7, y: 10.8, z: -46.0, centro: Math.PI / 2, meio: 100 * DEG, lc: 2.42, nome: 'Canhão automático 30 mm (vante BE)' },
  { x: -8.7, y: 10.8, z: 22.0, centro: -Math.PI / 2, meio: 100 * DEG, lc: 2.42, nome: 'Canhão automático 30 mm (ré BB)' },
  { x: 8.7, y: 10.8, z: 22.0, centro: Math.PI / 2, meio: 100 * DEG, lc: 2.42, nome: 'Canhão automático 30 mm (ré BE)' },
];
/** Caixas da própria estrutura (linha de tiro: a arma NUNCA atira através do navio) — medidas nas malhas do modelo. */
export const CAIXAS_DA = [
  [-8.63, 8.63, 8.18, 19.64, -36.04, 5.04], [-2.7, 2.7, 19.6, 44.3, -23.73, -17.0], [-4.42, 4.42, 15.4, 19.68, -4.07, 0.07],
  [-7.43, 7.43, 8.19, 14.04, 23.97, 52.05], [-2.75, 2.75, 8.2, 12.6, -74.1, -68.1], [-2.75, 2.75, 8.2, 14.8, -60.6, -54.6], [-2.75, 2.75, 14.0, 17.7, 29.1, 35.1],
];
const VLS = [[-3.5,8.275,-48.0],[-3.5,8.275,-47.0],[-3.5,8.275,-46.0],[-3.5,8.275,-45.0],[-3.5,8.275,-44.0],[-3.5,8.275,-43.0],[-3.5,8.275,-42.0],[-3.5,8.275,-41.0],[-3.5,8.275,-40.0],[-3.5,8.275,-39.0],[-2.5,8.275,-48.0],[-2.5,8.275,-47.0],[-2.5,8.275,-46.0],[-2.5,8.275,-45.0],[-2.5,8.275,-44.0],[-2.5,8.275,-43.0],[-2.5,8.275,-42.0],[-2.5,8.275,-41.0],[-2.5,8.275,-40.0],[-2.5,8.275,-39.0],[-1.5,8.275,-48.0],[-1.5,8.275,-47.0],[-1.5,8.275,-46.0],[-1.5,8.275,-45.0],[-1.5,8.275,-44.0],[-1.5,8.275,-43.0],[-1.5,8.275,-42.0],[-1.5,8.275,-41.0],[-1.5,8.275,-40.0],[-1.5,8.275,-39.0],[-0.5,8.275,-48.0],[-0.5,8.275,-47.0],[-0.5,8.275,-46.0],[-0.5,8.275,-45.0],[-0.5,8.275,-44.0],[-0.5,8.275,-43.0],[-0.5,8.275,-42.0],[-0.5,8.275,-41.0],[-0.5,8.275,-40.0],[-0.5,8.275,-39.0],[0.5,8.275,-48.0],[0.5,8.275,-47.0],[0.5,8.275,-46.0],[0.5,8.275,-45.0],[0.5,8.275,-44.0],[0.5,8.275,-43.0],[0.5,8.275,-42.0],[0.5,8.275,-41.0],[0.5,8.275,-40.0],[0.5,8.275,-39.0],[1.5,8.275,-48.0],[1.5,8.275,-47.0],[1.5,8.275,-46.0],[1.5,8.275,-45.0],[1.5,8.275,-44.0],[1.5,8.275,-43.0],[1.5,8.275,-42.0],[1.5,8.275,-41.0],[1.5,8.275,-40.0],[1.5,8.275,-39.0],[2.5,8.275,-48.0],[2.5,8.275,-47.0],[2.5,8.275,-46.0],[2.5,8.275,-45.0],[2.5,8.275,-44.0],[2.5,8.275,-43.0],[2.5,8.275,-42.0],[2.5,8.275,-41.0],[2.5,8.275,-40.0],[2.5,8.275,-39.0],[3.5,8.275,-48.0],[3.5,8.275,-47.0],[3.5,8.275,-46.0],[3.5,8.275,-45.0],[3.5,8.275,-44.0],[3.5,8.275,-43.0],[3.5,8.275,-42.0],[3.5,8.275,-41.0],[3.5,8.275,-40.0],[3.5,8.275,-39.0],[-3.5,8.275,9.0],[-3.5,8.275,10.0],[-3.5,8.275,11.0],[-3.5,8.275,12.0],[-3.5,8.275,13.0],[-3.5,8.275,14.0],[-3.5,8.275,15.0],[-3.5,8.275,16.0],[-3.5,8.275,17.0],[-3.5,8.275,18.0],[-2.5,8.275,9.0],[-2.5,8.275,10.0],[-2.5,8.275,11.0],[-2.5,8.275,12.0],[-2.5,8.275,13.0],[-2.5,8.275,14.0],[-2.5,8.275,15.0],[-2.5,8.275,16.0],[-2.5,8.275,17.0],[-2.5,8.275,18.0],[-1.5,8.275,9.0],[-1.5,8.275,10.0],[-1.5,8.275,11.0],[-1.5,8.275,12.0],[-1.5,8.275,13.0],[-1.5,8.275,14.0],[-1.5,8.275,15.0],[-1.5,8.275,16.0],[-1.5,8.275,17.0],[-1.5,8.275,18.0],[-0.5,8.275,9.0],[-0.5,8.275,10.0],[-0.5,8.275,11.0],[-0.5,8.275,12.0],[-0.5,8.275,13.0],[-0.5,8.275,14.0],[-0.5,8.275,15.0],[-0.5,8.275,16.0],[-0.5,8.275,17.0],[-0.5,8.275,18.0],[0.5,8.275,9.0],[0.5,8.275,10.0],[0.5,8.275,11.0],[0.5,8.275,12.0],[0.5,8.275,13.0],[0.5,8.275,14.0],[0.5,8.275,15.0],[0.5,8.275,16.0],[0.5,8.275,17.0],[0.5,8.275,18.0],[1.5,8.275,9.0],[1.5,8.275,10.0],[1.5,8.275,11.0],[1.5,8.275,12.0],[1.5,8.275,13.0],[1.5,8.275,14.0],[1.5,8.275,15.0],[1.5,8.275,16.0],[1.5,8.275,17.0],[1.5,8.275,18.0],[2.5,8.275,9.0],[2.5,8.275,10.0],[2.5,8.275,11.0],[2.5,8.275,12.0],[2.5,8.275,13.0],[2.5,8.275,14.0],[2.5,8.275,15.0],[2.5,8.275,16.0],[2.5,8.275,17.0],[2.5,8.275,18.0],[3.5,8.275,9.0],[3.5,8.275,10.0],[3.5,8.275,11.0],[3.5,8.275,12.0],[3.5,8.275,13.0],[3.5,8.275,14.0],[3.5,8.275,15.0],[3.5,8.275,16.0],[3.5,8.275,17.0],[3.5,8.275,18.0]];
const TORP = [[10.0781,9.4915,9.64,1],[10.4682,9.4915,9.083,1],[10.3719,10.0588,9.4307,1],[10.0781,9.4915,13.34,1],[10.4682,9.4915,12.783,1],[10.3719,10.0588,13.1307,1],[10.0781,9.4915,17.04,1],[10.4682,9.4915,16.483,1],[10.3719,10.0588,16.8307,1],[-10.4682,9.4915,9.083,-1],[-10.0781,9.4915,9.64,-1],[-10.3719,10.0588,9.4307,-1],[-10.4682,9.4915,12.783,-1],[-10.0781,9.4915,13.34,-1],[-10.3719,10.0588,13.1307,-1],[-10.4682,9.4915,16.483,-1],[-10.0781,9.4915,17.04,-1],[-10.3719,10.0588,16.8307,-1]]; /* 6 lançadores triplos = 18 tubos: [x, y, z, lado] */

export function adicionaDestroierAmorim(CLASSES, { D, CAN, VIDA }) {
  CLASSES.destroier_amorim = D('destroier', 'destroier_amorim', { premium: 1, lendario: 1, destAmorim: 1, pinturaFixa: 1,
    nome: 'Destróier Amorim', classe: 'Classe Amorim', nomeOriginal: 'Destróier Amorim (projeto do Valter)', num: 'D-01',
    papel: 'Escolta oceânica multimissão: 3 torres de 2×155 mm (recarga 5 s), 160 células VLS e 2 lançadores laterais de 6 mísseis com escolha automática do melhor slot (salva de 6, recarga 6 s), 18 tubos de torpedo (salva de 9, recarga 10 s), 4 lança-granadas, 6 lasers, 4 CIWS, 4 canhões automáticos de 30 mm e 2 caças VTOL de classe fixa (Acauã e Uiraçu) no heliponto',
    L: 176, B: 21.6, T: 6.4, F: 8.2, vmax: 17.0, acel: 0.7, giro: 0.82, vida: VIDA(320), blind: 1.4, rcs: 0.8, radar: 18000, desl: 9800,
    canhao: CAN({ cal: 155, V0: 920, cad: 5.0, dano: 30, alc: 17000, disp: 0.55, torres: 3, canos: 2, som: 'grande' }),
    vls: 160, missil: 'hiper', salva: 6, misRec: 6, misAuto: MIS_DA, latCfg: LAT_DA, tubosLat: TUBOS_LAT_DA, autoCfg: AUTO_DA, autos: AUTOS_DA, caixasAuto: CAIXAS_DA,
    sam: 0, ciws: 4, ciwsLug: [0, 1, 2, 3], a30: 0, laser: 6, chaff: 12,
    torp: 18, tubos: [6, 3], torpSalva: 9, torpRec: 10,
    heli: 2, helisPadrao: ['acaua', 'uiracu'],
    rbu: { nome: 'LG-12', salvas: 10, foguetes: 12, alc: 5500, min: 300, dano: 30, cad: 14, el: 0.62 },
    bandeiraProa: 1, casco: 'convencional', cascoN: 'bra', estilo: 'destroier', pf: 'escolta', antiAereo: 1 });
}
export const META_DESTAMORIM = { destroier_amorim: ['BRA', 4, 'fab_destamorim'] };

/** Layout (posições = modelo 3D). Gancho em layout.js: if (C.destAmorim) return layoutDestroierAmorim(C). */
export function layoutDestroierAmorim(C) {
  const P = { torres: [], vls: [], sam: [], celulas: [], ciws: [], a30: [], tubos: [], laser: [], sec: [], granadas: [], blocosVls: [], mastro: 44.3 };
  P.sup = { z0: -36.0, z1: 5.0, h: 7.5 };
  P.torres.push({ z: -71.0, y: 10.7, barbeta: 2.0, frente: 1, arco: 2.9, canos: 2, nome: 'Torre 1 (vante)', estilo: 'padrao', esc: 1, lc: 8.3, esp: 1.6, py: 1.0, pz: -1.9 });
  P.torres.push({ z: -57.5, y: 12.9, barbeta: 4.2, frente: 1, arco: 2.6, canos: 2, nome: 'Torre 2 (vante, elevada)', estilo: 'padrao', esc: 1, lc: 8.3, esp: 1.6, py: 1.0, pz: -1.9 });
  P.torres.push({ z: 32.0, y: 15.8, barbeta: 1.3, frente: -1, arco: 2.6, canos: 2, nome: 'Torre 3 (ré, sobre o hangar)', estilo: 'padrao', esc: 1, lc: 8.3, esp: 1.6, py: 1.0, pz: -1.9 });
  for (const [x, y, z] of VLS) P.vls.push({ x, y: y + 0.25, z });
  P.blocosVls.push({ zc: -43.5, y: 8.275, col: 8, lin: 10, cs: 1.0, n: 80, tipo: 'vls', xc: 0 }, { zc: 13.5, y: 8.275, col: 8, lin: 10, cs: 1.0, n: 80, tipo: 'vls', xc: 0 });
  P.celulas = P.vls.slice();
  P.ciws.push({ x: -2.9, y: 14.6, z: -33.4, lug: 0, tipo: 'ciws', piv: 1.0 }, { x: 2.9, y: 14.6, z: -33.4, lug: 1, tipo: 'ciws', piv: 1.0 }, { x: -5.3, y: 16.7, z: 49.0, lug: 2, tipo: 'ciws', piv: 1.0 }, { x: 5.3, y: 16.7, z: 49.0, lug: 3, tipo: 'ciws', piv: 1.0 });
  for (const [x, y, z] of [[-3.1, 20.95, -26.2], [3.1, 20.95, -26.2], [-3.9, 16.75, 2.9], [3.9, 16.75, 2.9], [-5.4, 15.35, 27.9], [5.4, 15.35, 27.9]]) P.laser.push({ x, y: y - 0.95, z }); /* feixe no CENTRO de cada esfera */
  for (const [x, y, z, lado] of TORP) P.tubos.push({ x, y, z, lado, canos: 1, sub: 0 });
  for (const [x, y, z, sx] of [[-7.3, 9.7, -53.2, -1], [-7.3, 9.7, -49.9, -1], [7.3, 9.7, -53.2, 1], [7.3, 9.7, -49.9, 1]]) P.granadas.push({ x, y, z, lado: sx, r: 1.3, centro: sx * 0.45, meio: 2.2 });
  P.convoo = { z: 60.5, y: 8.24, x: 0 }; P.heliponto = { z: 68.5, y: 8.24, pontos: [60.5, 76.5] }; /* pontos de pouso do Acauã (60,5) e do Uiraçu (76,5) */
  P.autos = AUTOS_DA; P.tubosLat = TUBOS_LAT_DA;
  return P;
}
