// v1.2.75 — linha costeira nova, nave que voa e aeródromo militar (não entra na loja).
// Projetos originais. O aeródromo usa o casco da megabase e fica fora da contagem de vitória (base: 1).
import { PLANO_PA } from './classes1225.js';

export const IDS_1275 = ['guarani', 'arara', 'sucuri', 'jaburu', 'tucano', 'caracara', 'mutum', 'garca', 'pirarucu'];
export const HELIS_1275 = {
  harpia: { id: 'harpia', nome: 'Caça Harpia', desc: 'Superioridade aérea: 4 mísseis e canhão, longo alcance', vmax: 228, comb: 250, vida: 36, sensor: 11500, arma: 'missil', mun: 4, alc: 10500, dano: 22, aviao: 1 },
  urutau: { id: 'urutau', nome: 'Caça pesado Urutau', desc: 'Bimotor de escolta: mísseis pesados além do visual', vmax: 205, comb: 270, vida: 42, sensor: 12500, arma: 'missil', mun: 4, alc: 12000, dano: 26, aviao: 1 },
  quiriquiri: { id: 'quiriquiri', nome: 'VTOL Quiriquiri', desc: 'Decolagem vertical a partir de convés curto', vmax: 168, comb: 230, vida: 28, sensor: 9500, arma: 'missil', mun: 2, alc: 7500, dano: 20, aviao: 1 },
  girao: { id: 'girao', nome: 'Ataque Girão', desc: 'Helicóptero blindado: foguetes e soldados de porta com bazuca', vmax: 72, comb: 200, vida: 58, sensor: 5200, arma: 'foguete', mun: 28, alc: 2500, dano: 12, bazuca: 1 },
  jacare: { id: 'jacare', nome: 'Assalto Jacaré', desc: 'Transporte de assalto: metralhadora e dois soldados com bazuca na porta', vmax: 64, comb: 260, vida: 50, sensor: 7000, arma: 'mg', mun: 520, alc: 1500, dano: 2.1, bazuca: 1 },
  soco: { id: 'soco', nome: 'Reconhecimento Socó', desc: 'Leve e rápido, revela atrás de ilha', vmax: 78, comb: 280, vida: 22, sensor: 9000, arma: 'mg', mun: 360, alc: 1200, dano: 1.1 },
  carcara: { id: 'carcra', nome: 'Nave Carcará', desc: 'Nave que voa rente à água: ataca navio e se defende com manobra', vmax: 148, comb: 300, vida: 74, sensor: 13000, arma: 'missil', mun: 6, alc: 11500, dano: 30, aviao: 1, nave: 1 },
  biguatinga: { id: 'biguatinga', nome: 'Alerta Biguatinga', desc: 'Radar no alto: revela a frota inimiga', vmax: 150, comb: 340, vida: 30, sensor: 18000, arma: 'mg', mun: 0, alc: 0, dano: 0, aviao: 1 },
  murucututu: { id: 'murucututu', nome: 'Drone Murucututu', desc: 'Asa voadora furtiva, 2 mísseis', vmax: 210, comb: 360, vida: 20, sensor: 11000, arma: 'missil', mun: 2, alc: 10000, dano: 22, aviao: 1, furtivo: 1, drone: 1 },
  araponga: { id: 'araponga', nome: 'Furtivo Araponga', desc: 'Caça de baixa assinatura', vmax: 220, comb: 240, vida: 32, sensor: 12000, arma: 'missil', mun: 4, alc: 11000, dano: 24, aviao: 1, furtivo: 1 },
  curio: { id: 'curio', nome: 'Naval Curió', desc: 'Helicóptero antinavio de convés', vmax: 66, comb: 220, vida: 32, sensor: 6200, arma: 'missil', mun: 2, alc: 6200, dano: 22 },
  inhambu: { id: 'inhambu', nome: 'ASW Inhambu', desc: 'Dois torpedos leves', vmax: 60, comb: 240, vida: 34, sensor: 5800, arma: 'torpedo', mun: 2, alc: 1800, dano: 36 },
  seriema: { id: 'seriema', nome: 'Bombardeiro Seriema', desc: 'Bombardeiro moderno metálico, sem carga nuclear: cruzeiro e escolta em V de cinco', vmax: 198, comb: 400, vida: 64, sensor: 13000, arma: 'missil', mun: 4, alc: 14000, dano: 36, aviao: 1, bombardeiro: 1, semNuclear: 1 },
  jacu: { id: 'jacu', nome: 'Ataque Jacu', desc: 'Helicóptero de ataque moderno: foguetes e soldados com bazuca nas portas', vmax: 76, comb: 210, vida: 60, sensor: 5600, arma: 'foguete', mun: 24, alc: 2600, dano: 13, bazuca: 1 },
  gaviao: { id: 'gaviao', nome: 'Assalto Gavião-real', desc: 'Helicóptero de assalto moderno: mísseis e dois soldados com bazuca na porta', vmax: 70, comb: 240, vida: 54, sensor: 6400, arma: 'missil', mun: 4, alc: 5200, dano: 18, bazuca: 1 },
};
export function alturaVoo(n) { return n && n.C && n.C.naveVoo && !n.morto ? 4 + Math.min(6, Math.abs(n.v) * 0.28) : 0; } /* v1.2.77: a nave sobe de verdade (4–10 m). Torpedo passa por baixo; canhão e míssil miram o casco no ar. */
HELIS_1275.carcra = HELIS_1275.carcara;

export function adiciona1275(CLASSES, { D, CAN, VIDA }) {
  const ala = ['tesourao', 'tuiuiu', 'harpia', 'caca', 'coruja', 'beijaflor', 'jacare', 'girao', 'tesourao', 'tuiuiu', 'urutau', 'marimbondo'];
  CLASSES.guarani = D('corveta', 'guarani', { nome: 'Corveta Guarani', classe: 'Classe Guarani', num: 'V 41', papel: 'Patrulha costeira rápida: 76 mm, 12 VLS e torpedos', pf: 'batedor',
    L: 98, B: 13.2, T: 3.9, F: 5.0, vmax: 17.2, acel: 1.05, giro: 1.3, vida: VIDA(160), blind: 0.95, rcs: 0.48, radar: 12000, desl: 2300,
    canhao: CAN({ cal: 76, V0: 920, cad: 0.9, dano: 8, alc: 8600, disp: 0.9, torres: 1, canos: 1, som: 'medio' }),
    vls: 12, missil: 'curto', sam: 8, torp: 6, tubos: [1, 3], ciws: 1, a30: 1, chaff: 8, heli: 1 });
  CLASSES.arara = D('fragata', 'arara', { nome: 'Fragata Arara', classe: 'Classe Arara', num: 'F 48', papel: 'Escolta: bom radar, SAM e um helicóptero', pf: 'ataque',
    L: 136, B: 16.6, T: 5.0, F: 5.8, vmax: 16.0, acel: 0.88, giro: 0.98, vida: VIDA(230), blind: 1.05, rcs: 0.7, radar: 14500, desl: 4800,
    canhao: CAN({ cal: 76, V0: 940, cad: 0.8, dano: 9, alc: 9000, disp: 0.8, torres: 1, canos: 1, som: 'medio' }),
    vls: 24, missil: 'medio', sam: 16, torp: 6, tubos: [1, 3], ciws: 2, a30: 1, chaff: 10, heli: 1 });
  CLASSES.sucuri = D('destroier', 'sucuri', { nome: 'Destróier Sucuri', classe: 'Classe Sucuri', num: 'D 61', papel: 'Contratorpedeiro de ataque: 127 mm e 40 VLS', pf: 'batedor',
    L: 158, B: 18.4, T: 5.6, F: 6.4, vmax: 16.8, acel: 0.82, giro: 0.9, vida: VIDA(280), blind: 1.12, rcs: 0.42, radar: 16000, desl: 6800,
    canhao: CAN({ cal: 127, V0: 840, cad: 1.5, dano: 16, alc: 11000, disp: 0.65, torres: 1, canos: 1, som: 'grande' }),
    vls: 40, missil: 'longo', sam: 16, torp: 6, tubos: [1, 3], ciws: 2, a30: 2, chaff: 12, heli: 1, casco: 'tumblehome' });
  CLASSES.jaburu = D('cruzador', 'jaburu', { nome: 'Cruzador Jaburu', classe: 'Classe Jaburu', num: 'C 71', papel: 'Defesa de área: dois canhões, SAM pesado e dois helicópteros', pf: 'ataque',
    L: 192, B: 22.4, T: 6.8, F: 7.4, vmax: 15.2, acel: 0.72, giro: 0.74, vida: VIDA(400), blind: 1.4, rcs: 0.9, radar: 18500, desl: 11200,
    canhao: CAN({ cal: 127, V0: 830, cad: 2.0, dano: 18, alc: 11500, disp: 0.7, torres: 2, canos: 1, som: 'grande' }),
    vls: 16, missil: 'longo', sam: 48, torp: 6, tubos: [1, 3], ciws: 3, ciwsLug: [0, 1, 4], a30: 2, chaff: 14, heli: 2, antiAereo: 1, defesaFrota: 1 });
  CLASSES.tucano = D('horizonte', 'tucano', { nome: 'Porta-Helicópteros Tucano', classe: 'Classe Tucano', num: 'A 31', papel: 'Convés de assalto: 8 helicópteros (ataque e bazuca), SAM e CIWS', pf: 'capitania',
    L: 210, B: 32, T: 7.2, F: 11, vmax: 14.2, acel: 0.5, giro: 0.55, vida: VIDA(560), blind: 1.45, rcs: 1.5, radar: 16000, desl: 28000,
    canhao: CAN({ cal: 76, V0: 960, cad: 0.7, dano: 8, alc: 9000, torres: 1, canos: 1, som: 'medio', frenteDupla: 0, embutido: 1 }),
    vls: 8, missil: 'medio', sam: 24, ciws: 3, ciwsLug: [0, 2, 4], a30: 2, torp: 0, tubos: [0, 0], laser: 1, heli: 8, maxAr: 6,
    helisPadrao: ['girao', 'jacare', 'tufao', 'ataque', 'beijaflor', 'jacare', 'girao', 'asw'], porta: 'pa' });
  CLASSES.caracara = D('fragata', 'caracara', { nome: 'Nave de Assalto Carcará', classe: 'Classe Carcará', num: 'W 01', premium: 1, lendario: 1, naveVoo: 1, pf: 'ataque',
    papel: 'Nave que voa rente ao mar: ataca com VLS e defende a frota com SAM. Levanta com a velocidade — torpedo passa por baixo.',
    L: 74, B: 22, T: 2.2, F: 3.4, vmax: 28, acel: 1.4, giro: 1.15, vida: VIDA(210), blind: 0.85, rcs: 0.35, radar: 15000, desl: 420,
    canhao: CAN({ cal: 57, V0: 1000, cad: 0.55, dano: 6, alc: 7000, torres: 1, canos: 1, som: 'rapido' }),
    vls: 16, missil: 'medio', sam: 24, torp: 0, tubos: [0, 0], ciws: 2, a30: 0, chaff: 12, heli: 0, antiAereo: 1 });
  CLASSES.mutum = D('corveta', 'mutum', { nome: 'Corveta Mutum', classe: 'Classe Mutum', num: 'V 52', papel: 'Patrulha moderna de casco fino: 76 mm, 16 VLS e um helicóptero', pf: 'batedor',
    L: 112, B: 14.4, T: 4.1, F: 5.2, vmax: 17.6, acel: 1.08, giro: 1.25, vida: VIDA(175), blind: 0.98, rcs: 0.4, radar: 13000, desl: 2800,
    canhao: CAN({ cal: 76, V0: 940, cad: 0.75, dano: 8, alc: 9000, disp: 0.85, torres: 1, canos: 1, som: 'medio' }),
    vls: 16, missil: 'curto', sam: 12, torp: 6, tubos: [1, 3], ciws: 1, a30: 1, chaff: 8, heli: 1 });
  CLASSES.garca = D('fragata', 'garca', { nome: 'Fragata Garça', classe: 'Classe Garça', num: 'F 55', papel: 'Fragata moderna de escolta: mastro integrado, 32 VLS e SAM de área', pf: 'ataque',
    L: 146, B: 17.8, T: 5.2, F: 6.2, vmax: 16.4, acel: 0.9, giro: 0.96, vida: VIDA(250), blind: 1.08, rcs: 0.55, radar: 15500, desl: 5400,
    canhao: CAN({ cal: 76, V0: 950, cad: 0.7, dano: 9, alc: 9200, disp: 0.75, torres: 1, canos: 1, som: 'medio' }),
    vls: 32, missil: 'medio', sam: 24, torp: 6, tubos: [1, 3], ciws: 2, a30: 2, chaff: 12, heli: 1 });
  CLASSES.pirarucu = D('destroier', 'pirarucu', { nome: 'Destróier Pirarucu', classe: 'Classe Pirarucu', num: 'D 70', papel: 'Contratorpedeiro furtivo moderno: tumblehome, 127 mm e 48 VLS', pf: 'ataque',
    L: 168, B: 19.8, T: 5.8, F: 6.6, vmax: 16.6, acel: 0.8, giro: 0.88, vida: VIDA(310), blind: 1.16, rcs: 0.36, radar: 17000, desl: 7600,
    canhao: CAN({ cal: 127, V0: 850, cad: 1.4, dano: 16, alc: 11200, disp: 0.62, torres: 1, canos: 1, som: 'grande' }),
    vls: 48, missil: 'longo', sam: 24, torp: 6, tubos: [1, 3], ciws: 2, a30: 2, chaff: 14, heli: 1, casco: 'tumblehome' });
  CLASSES.aerodromo = D('megabase', 'aerodromo', { nome: 'Aeródromo Militar', classe: 'Aeródromo de Campanha', num: 'AF 01', base: 1, aerodromo: 1, pf: 0,
    papel: 'Aeródromo militar enorme no canto oposto de cada equipe: pista dupla, hangares blindados, torre, SAM e patrulha. Não conta para a vitória.',
    L: 820, B: 128, T: 11, F: 14, hHangar: 8, vmax: 0.15, acel: 0.02, giro: 0.01, vida: VIDA(5600), blind: 3.4, rcs: 8, radar: 32000, desl: 1200000,
    vls: 0, missil: undefined, salva: 0, sam: 80, ciws: 8, ciwsLug: [0, 1, 2, 3, 4, 5], a30: 8, laser: 4, chaff: 36,
    canhao: CAN({ cal: 76, V0: 920, cad: 0.65, dano: 8, alc: 9000, torres: 2, canos: 1, som: 'medio' }),
    heli: 12, maxAr: 6, alaTotal: 48, parque: 40, nuclear: undefined, helisPadrao: ala });
  if (PLANO_PA.megabase) PLANO_PA.aerodromo = PLANO_PA.megabase;
}
export const META_1275 = {
  guarani: ['BRA', 2, 'metal_vay'], arara: ['BRA', 2, 'metal_vay'], sucuri: ['BRA', 3, 'metal_vay'], jaburu: ['BRA', 3, 'metal_vay'],
  tucano: ['BRA', 3, 'metal_vay'], caracara: ['BRA', 4, 'metal_vay'], mutum: ['BRA', 2, 'metal_vay'], garca: ['BRA', 3, 'metal_vay'], pirarucu: ['BRA', 3, 'metal_vay'], aerodromo: ['BRA', 4, 'cinza_naval'],
};
