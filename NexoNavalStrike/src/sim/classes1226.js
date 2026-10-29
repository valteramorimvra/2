// v1.2.26 — OITO navios premium ORIGINAIS novos (projetos procedurais próprios; nomes de LUGARES brasileiros — nenhum nome de
// navio/arma/marca/jogo real; nada religioso). Mesmo formato das classes 1.2.25: D(base, id, {...}), CAN(), VIDA().
//  · 2 PORTA-AVIÕES GIGANTES (super lendários, ~450–476 m, maiores que Abrolhos/Costa Verde): convés em ângulo, 6 catapultas,
//    6 elevadores, ilha(s) com painéis de radar, 100+ aeronaves estacionadas no convés (instanciadas, render/extras1226.js),
//    ala ativa de 40 aeronaves + reserva que repõe abatidos (naval5v5/aereo.js), SAM/VLS em patrocínios, 6 CIWS, 6×30 mm, lasers.
//  · 6 combatentes modernos (escola "Nexo 25": casco/casaria furtivos, painéis planos de radar, VLS, canhão eletromagnético ou
//    furtivo, laser, CIWS e hangar): encouraçado de mísseis (arsenal), cruzador eletromagnético, cruzador, 2 destróieres e fragata.
// Uso (classes.js, logo após adiciona1225): adiciona1226(CLASSES, { D, CAN, VIDA });
import { PLANO_PA, EST_1225, NOMES_OURO_1225, bordaPA } from './classes1225.js';
export const IDS_1226 = ['ilhabela', 'jericoacoara', 'aparados', 'itatiaia', 'neblina', 'canastra', 'chapada', 'lencois'];
export const SUPER_LEND_1226 = ['neblina', 'canastra', 'chapada', 'lencois'];
/** Aeronaves novas (só porta-aviões gigantes 1.2.26; fora de ORDEM_HELIS → escoltas/bots não as sorteiam).
 *  'bombardeiroNuclear' = GANCHO para o módulo nuclear (outro worker): aqui ele voa com arma CONVENCIONAL (missil) e expõe
 *  `nuclear: 1` + `armaEspecial: 'nuclear'` para o módulo trocar a carga. Nenhuma lógica nuclear foi implementada aqui. */
export const HELIS_1226 = {
  tesourao: { id: 'tesourao', nome: 'Caça furtivo embarcado Tesourão', desc: 'Caça sem cauda de baixíssima assinatura (asa em lambda): 4 mísseis antinavio em baias internas a 12 km; o mais rápido do convés', vmax: 250, comb: 280, vida: 34, sensor: 13000, arma: 'missil', mun: 4, alc: 12000, dano: 26, aviao: 1, furtivo: 1 },
  tuiuiu: { id: 'tuiuiu', nome: 'Caça pesado embarcado Tuiuiú', desc: 'Bimotor pesado com canards e derivas duplas: 6 mísseis antinavio a 13 km, grande autonomia', vmax: 235, comb: 320, vida: 44, sensor: 14000, arma: 'missil', mun: 6, alc: 13000, dano: 28, aviao: 1 },
  coruja: { id: 'coruja', nome: 'Alerta aéreo antecipado Coruja', desc: 'Bijato de catapulta com radar de painéis planos em prancha dorsal: sem armas, revela navios e mísseis a 26 km para toda a frota', vmax: 160, comb: 480, vida: 32, sensor: 26000, arma: 'mg', mun: 0, alc: 0, dano: 0, aviao: 1, aew: 1 },
  beijaflor: { id: 'beijaflor', nome: 'Helicóptero multimissão Beija-flor', desc: 'Helicóptero naval de rotor de 5 pás e rotor de cauda carenado: 4 mísseis leves antinavio a 7 km', vmax: 82, comb: 260, vida: 44, sensor: 8000, arma: 'missil', mun: 4, alc: 7000, dano: 22 },
  marimbondo: { id: 'marimbondo', nome: 'Drone de combate Marimbondo', desc: 'Drone furtivo de asa voadora lançado por catapulta (sem tripulação): 2 mísseis antinavio a 11 km, alta autonomia', vmax: 220, comb: 360, vida: 22, sensor: 11000, arma: 'missil', mun: 2, alc: 11000, dano: 24, aviao: 1, furtivo: 1, drone: 1 },
  bombardeiroNuclear: { id: 'bombardeiroNuclear', nome: 'Bombardeiro embarcado Urubu-rei', desc: 'Bombardeiro bimotor de catapulta com baia interna: 2 mísseis de cruzeiro pesados a 16 km (módulo nuclear: carga especial)', vmax: 205, comb: 420, vida: 60, sensor: 12000, arma: 'missil', mun: 2, alc: 16000, dano: 40, aviao: 1, bombardeiro: 1, nuclear: 1, armaEspecial: 'nuclear' },
};
const ALA_GIGA = ['tesourao', 'tuiuiu', 'tesourao', 'marimbondo', 'coruja', 'tuiuiu', 'tesourao', 'beijaflor', 'marimbondo', 'bombardeiroNuclear'];
const ala = (n, extra) => { const a = []; for (let i = 0; i < n; i++) a.push(ALA_GIGA[i % ALA_GIGA.length]); return extra ? a.map((t, i) => extra[i] || t) : a; };
export function adiciona1226(CLASSES, { D, CAN, VIDA }) {
  const PREM = { premium: 1, lendario: 1, eletroCasco: 1 };
  const RAIL = (o) => CAN(Object.assign({ cal: 155, V0: 2300, cad: 2.6, dano: 34, alc: 20000, disp: 0.45, canos: 1, som: 'grande', eletro: 1 }, o)); /* canhão eletromagnético (sem propelente; som de calibre grande existente) */
  // ---------------- FRAGATA (L) ----------------
  CLASSES.ilhabela = D('fragata', 'ilhabela', Object.assign({}, PREM, { nome: 'Fragata Furtiva Lendária', classe: 'Classe Ilhabela', nomeOriginal: 'Classe Ilhabela (original)', num: 'F 61', est25: 'fragata',
    papel: 'Fragata furtiva de 158 m: canhão furtivo de 127 mm, 48 VLS hipersônicos/longos, 48 SAM de área, 4 painéis AESA, 4 CIWS, laser sobre o hangar e 2 helicópteros',
    L: 158, B: 20.2, T: 6.0, F: 7.4, vmax: 16.4, acel: 0.9, giro: 0.9, vida: VIDA(840), blind: 2.0, rcs: 0.5, radar: 18500, desl: 8200,
    canhao: CAN({ cal: 127, V0: 850, cad: 1.6, dano: 30, alc: 13000, disp: 0.6, torres: 1, canos: 1, som: 'grande' }),
    vls: 48, vlsRe: 0.15, missil: 'hiper', salva: 4, sam: 48, torp: 6, tubos: [1, 3], ciws: 4, ciwsLug: [0, 1, 2, 3], a30: 4, laser: 1, chaff: 14, heli: 2, casco: 'convencional', estilo: 'fragata', pf: 'ataque', antiAereo: 1 }));
  // ---------------- DESTRÓIER (L) ----------------
  CLASSES.jericoacoara = D('cruzador', 'jericoacoara', Object.assign({}, PREM, { nome: 'Destróier de Mísseis Lendário', classe: 'Classe Jericoacoara', nomeOriginal: 'Classe Jericoacoara (original)', num: 'D 63', est25: 'destroier',
    papel: 'Destróier furtivo de 186 m: 2 canhões furtivos de 127 mm (proa sobreposta), 64 VLS longos, 48 SAM, 4 painéis AESA + controle de tiro, 4 CIWS, laser e 2 helicópteros',
    L: 186, B: 22.4, T: 6.8, F: 8.0, vmax: 15.8, acel: 0.78, giro: 0.8, vida: VIDA(850), blind: 2.05, rcs: 0.55, radar: 19500, desl: 12500,
    canhao: CAN({ cal: 127, V0: 850, cad: 1.6, dano: 30, alc: 13000, disp: 0.6, torres: 2, canos: 1, som: 'grande', frenteDupla: 1 }),
    vls: 64, vlsRe: 0.145, missil: 'longo', salva: 4, sam: 48, torp: 6, tubos: [1, 3], ciws: 4, ciwsLug: [0, 1, 2, 3], a30: 4, laser: 1, chaff: 14, heli: 2, casco: 'convencional', estilo: 'destroier', pf: 'ataque', antiAereo: 1 }));
  // ---------------- DESTRÓIER FURTIVO TUMBLEHOME (L) ----------------
  CLASSES.aparados = D('cruzador', 'aparados', Object.assign({}, PREM, { nome: 'Destróier Furtivo Eletromagnético', classe: 'Classe Aparados da Serra', nomeOriginal: 'Classe Aparados da Serra (original)', num: 'D 65', est25: 'destroier',
    papel: 'Destróier de casco tumblehome e proa perfurante (190 m): canhão eletromagnético de 155 mm a 20 km, 2º canhão furtivo de 127 mm, 64 VLS periféricos, 40 SAM, 2 lasers, 4 CIWS e hangar para 2 helicópteros; a menor assinatura radar da esquadra',
    L: 190, B: 24.6, T: 8.2, F: 7.6, vmax: 15.6, acel: 0.74, giro: 0.76, vida: VIDA(860), blind: 2.0, rcs: 0.38, radar: 19500, desl: 15600,
    canhao: RAIL({ torres: 2, frenteDupla: 1, dano: 32 }),
    vls: 64, vlsRe: 0.15, missil: 'longo', salva: 4, sam: 40, torp: 6, tubos: [1, 3], ciws: 4, ciwsLug: [0, 1, 2, 3], a30: 4, laser: 2, chaff: 14, heli: 2, casco: 'tumblehome', cascoFixo: 'eua' /* casco tumblehome perfurador (mesma escola de casco dos furtivos) */, estilo: 'destroier', pf: 'ataque', antiAereo: 1, furtivo: 1 }));
  // ---------------- CRUZADOR (L) ----------------
  CLASSES.itatiaia = D('cruzador', 'itatiaia', Object.assign({}, PREM, { nome: 'Cruzador de Mísseis Lendário', classe: 'Classe Itatiaia', nomeOriginal: 'Classe Itatiaia (original)', num: 'C 74', est25: 'cruzador',
    papel: 'Cruzador furtivo de 228 m: 2 canhões de 155 mm (proa e popa), 96 VLS de cruzeiro pesado, 64 SAM de área (guarda-chuva da frota), mastro integrado com 2 conjuntos de painéis, 5 CIWS, laser e 2 helicópteros',
    L: 228, B: 25.6, T: 7.8, F: 9.2, vmax: 15.2, acel: 0.66, giro: 0.68, vida: VIDA(880), blind: 2.1, rcs: 0.8, radar: 21000, desl: 18500,
    canhao: CAN({ cal: 155, V0: 880, cad: 2.4, dano: 30, alc: 15000, disp: 0.6, torres: 2, canos: 1, som: 'grande' }),
    vls: 96, vlsRe: 0.15, missil: 'cruzeiro', salva: 6, sam: 64, torp: 6, tubos: [1, 3], ciws: 5, ciwsLug: [0, 1, 2, 3, 4], a30: 4, laser: 1, chaff: 16, heli: 2, casco: 'convencional', estilo: 'cruzador', pf: 'capitania', antiAereo: 1, defesaFrota: 2600 }));
  // ---------------- CRUZADOR ELETROMAGNÉTICO (SL) ----------------
  CLASSES.neblina = D('cruzador', 'neblina', Object.assign({}, PREM, { superLend: 1, nome: 'Cruzador Eletromagnético Super Lendário', classe: 'Classe Pico da Neblina', nomeOriginal: 'Classe Pico da Neblina (original)', num: 'C 80', est25: 'cruzador',
    papel: 'Cruzador furtivo de 252 m: 3 canhões eletromagnéticos de 155 mm (2 à proa sobrepostos + 1 à popa) a 22 km, 96 VLS hipersônicos, 72 SAM, 3 lasers, 5 CIWS, 4 reparos de 30 mm e 2 helicópteros',
    L: 252, B: 28.6, T: 8.6, F: 10.0, vmax: 15.8, acel: 0.62, giro: 0.64, vida: VIDA(1180), blind: 2.5, rcs: 0.9, radar: 23000, desl: 29000,
    canhao: RAIL({ torres: 3, dano: 52, cad: 2.2, alc: 22000 }),
    vls: 96, vlsRe: 0.15, missil: 'hiper', salva: 6, sam: 72, torp: 6, tubos: [1, 3], ciws: 5, ciwsLug: [0, 2, 3, 5, 6], a30: 4, laser: 3, chaff: 18, heli: 2, casco: 'convencional', estilo: 'cruzador', pf: 'capitania', antiAereo: 1, defesaFrota: 2800 }));
  // ---------------- ENCOURAÇADO DE MÍSSEIS / NAVIO-ARSENAL (SL) ----------------
  CLASSES.canastra = D('cruzador', 'canastra', Object.assign({}, PREM, { superLend: 1, nome: 'Encouraçado de Mísseis Super Lendário', classe: 'Classe Serra da Canastra', nomeOriginal: 'Classe Serra da Canastra (original)', num: 'B 82', est25: 'cruzador',
    papel: 'Navio-arsenal blindado de 286 m: 160 VLS (cruzeiro pesado/hipersônicos) em 2 grandes campos, 4 canhões eletromagnéticos de 155 mm (2 à proa + 2 à popa), 80 SAM, 2 lasers, 5 CIWS, 4×30 mm e 2 helicópteros',
    L: 286, B: 34, T: 9.8, F: 11.2, vmax: 14.6, acel: 0.56, giro: 0.56, vida: VIDA(1150), blind: 2.55, rcs: 1.25, radar: 23500, desl: 52000,
    canhao: RAIL({ torres: 4, dano: 38, cad: 2.4, alc: 21000 }),
    vls: 160, vlsRe: 0.13, missil: 'cruzeiro', salva: 8, sam: 80, torp: 0, tubos: [0, 0], ciws: 5, ciwsLug: [0, 2, 3, 5, 6], a30: 4, laser: 2, chaff: 20, heli: 2, casco: 'convencional', estilo: 'cruzador', pf: 'capitania', antiAereo: 1, defesaFrota: 3000, couracado: 0 }));
  // ---------------- PORTA-AVIÕES GIGANTES (SL) ----------------
  const PA = { porta: 'pa', superPA: 1, gigaPA: 1, premium: 1, lendario: 1, superLend: 1, supremo: 1, couracado: 0, estilo: 'capitania', pf: 'capitania', antiAereo: 1, missil: 'longo', salva: 4, torp: 0, tubos: [0, 0] };
  CLASSES.chapada = D('capitania', 'chapada', Object.assign({}, PA, { nome: 'Porta-Aviões Gigante Chapada Diamantina', classe: 'Classe Chapada Diamantina', nomeOriginal: 'Porta-Aviões Gigante Chapada Diamantina (original)', num: 'A 20', est25: 'pa1',
    papel: 'CATOBAR gigante de 452 m: convés em ângulo, 5 catapultas, 6 cabos, 6 elevadores; 112 aeronaves embarcadas — 104 no convés (caças furtivos Tesourão, caças pesados Tuiuiú, alerta aéreo Coruja, drones Marimbondo, helicópteros Beija-flor e bombardeiros Urubu-rei) — ala ativa de 40 com reserva que repõe abatidos; 48 SAM + 32 VLS em patrocínios, 6 CIWS, 6 reparos de 30 mm, 3 lasers e 2 canhões de 76 mm',
    L: 452, B: 58, T: 13.6, F: 15.0, hHangar: 7.0, vmax: 15.4, acel: 0.36, giro: 0.36, vida: VIDA(1650), blind: 2.5, rcs: 3.0, radar: 24000, desl: 205000,
    canhao: CAN({ cal: 76, V0: 980, cad: 0.5, dano: 7.5, alc: 9500, torres: 2, canos: 1, som: 'medio', frenteDupla: 0, embutido: 1 }), /* v1.2.27: 76 mm = medio como os antigos (não rapido) */
    vls: 32, sam: 48, ciws: 6, ciwsLug: [0, 1, 2, 3, 4, 5], a30: 6, laser: 3, chaff: 24, heli: 40, maxAr: 18, nuclear: { bombas: 4 } /* v1.2.28: várias bombas por surtida; recarrega ao pousar */ /* v1.2.26: gancho do módulo nuclear (bombardeiro único 'bombardeiroNuclear' = Urubu-rei) */, alaTotal: 112, parque: 104,
    helisPadrao: ala(40) }));
  CLASSES.lencois = D('capitania', 'lencois', Object.assign({}, PA, { nome: 'Porta-Aviões Gigante Lençóis Maranhenses', classe: 'Classe Lençóis Maranhenses', nomeOriginal: 'Porta-Aviões Gigante Lençóis Maranhenses (original)', num: 'A 22', est25: 'pa2',
    papel: 'CATOBAR gigante de 476 m com duas ilhas (navegação e controle aéreo): convés em ângulo, 5 catapultas, 6 cabos, 6 elevadores; 120 aeronaves embarcadas — 111 no convés (Tesourão, Tuiuiú, Coruja, Marimbondo, Beija-flor, Urubu-rei) — ala ativa de 40 com reserva que repõe abatidos; 64 SAM + 48 VLS em patrocínios, 6 CIWS, 6 reparos de 30 mm, 4 lasers e 2 canhões de 76 mm',
    L: 476, B: 60, T: 14.0, F: 15.4, hHangar: 7.2, vmax: 15.0, acel: 0.34, giro: 0.34, vida: VIDA(1700), blind: 2.5, rcs: 3.1, radar: 24500, desl: 228000,
    canhao: CAN({ cal: 76, V0: 980, cad: 0.5, dano: 7.5, alc: 9500, torres: 2, canos: 1, som: 'medio', frenteDupla: 0, embutido: 1 }), /* v1.2.27: 76 mm = medio como os antigos (não rapido) */
    vls: 48, sam: 64, ciws: 6, ciwsLug: [0, 1, 2, 3, 4, 5], a30: 6, laser: 4, chaff: 24, heli: 40, maxAr: 18, nuclear: { bombas: 4 } /* v1.2.28: várias bombas por surtida; recarrega ao pousar */ /* v1.2.26: gancho do módulo nuclear (bombardeiro único 'bombardeiroNuclear' = Urubu-rei) */, alaTotal: 120, parque: 111,
    helisPadrao: ala(40, { 4: 'coruja', 14: 'coruja' }) }));
  /* v1.2.60: MEGABASE AERONAVAL FLUTUANTE (militar + comercial) — 1 por equipe, atrás da linha inicial, ancorada (quase parada). Herda do porta-aviões gigante o convés de operações
     (catapultas, elevadores, parque e ala aérea que decola sozinha como CAP), os SAM/CIWS/30 mm/laser de defesa e o sistema de dano/incêndio/afundamento. Sem VLS ofensivo.
     Não conta para a vitória por aniquilação e não é selecionável/comprável. Setores de integridade (pistas, tanques, defesas, terminal) em naval5v5/megabase.js. */
  CLASSES.megabase = D('chapada', 'megabase', { nome: 'Base Aeronaval Flutuante', classe: 'Megabase Flutuante Mista', nomeOriginal: 'Base Aeronaval Flutuante', num: 'B 01', base: 1, est25: 'pa1',
    papel: 'Megabase flutuante mista: módulo militar (pista reforçada, catapultas, elevadores, hangares em arco, radares, tanques de combustível) e módulo comercial conectado (terminal com pontes de embarque, torre de controle envidraçada e aviões de linha). Defesas: 64 SAM, 6 CIWS, 6 reparos de 30 mm, 4 lasers. Ala de patrulha (CAP) que decola sozinha.',
    L: 560, B: 96, T: 12, F: 16, hHangar: 7.5, vmax: 0.6, acel: 0.03, giro: 0.02, vida: VIDA(4200), blind: 3.2, rcs: 6, radar: 30000, desl: 900000,
    vls: 0, missil: undefined, salva: 0, sam: 64, ciws: 6, ciwsLug: [0, 1, 2, 3, 4, 5], a30: 6, laser: 4, chaff: 32, heli: 24, maxAr: 10, nuclear: undefined, alaTotal: 60, parque: 52,
    helisPadrao: ala(24, { 0: 'tesourao', 1: 'tuiuiu', 2: 'tesourao', 3: 'tuiuiu', 4: 'coruja', 5: 'tesourao', 6: 'tuiuiu', 7: 'beijaflor', 8: 'tesourao', 9: 'tuiuiu', 10: 'tesourao', 11: 'beijaflor', 12: 'tesourao', 13: 'tuiuiu', 14: 'coruja', 15: 'tesourao', 16: 'tuiuiu', 17: 'marimbondo', 18: 'tesourao', 19: 'tuiuiu', 20: 'tesourao', 21: 'beijaflor', 22: 'tesourao', 23: 'tuiuiu' }) });
}
/** Nação, tier e pintura de fábrica (mesclar no META de classes.js ANTES do laço `for (const k in META)`). */
export const META_1226 = { megabase: ['BRA', 4, 'cinza_naval'], /* v1.2.60 */ ilhabela: ['BRA', 4, 'lend_grafite'], jericoacoara: ['BRA', 4, 'lend_aco'], aparados: ['BRA', 4, 'lend_basalto'], itatiaia: ['BRA', 4, 'lend_titanio'], neblina: ['BRA', 4, 'slend_negro'], canastra: ['BRA', 4, 'slend_rubi'], chapada: ['BRA', 4, 'slend_safira'], lencois: ['BRA', 4, 'slend_azul'] };
// Economia (navalTechTreeEconomy.js): PRECO em ouro, BONUS_PREMIUM, TIPO_NAVIO e as pinturas lend_basalto / slend_safira.
export const NOMES_PADRAO_1226 = {};
export const NOMES_OURO_1226 = { ilhabela: 'ILHABELA', jericoacoara: 'JERICOACOARA', aparados: 'APARADOS DA SERRA', itatiaia: 'ITATIAIA', neblina: 'PICO DA NEBLINA', canastra: 'SERRA DA CANASTRA', chapada: 'CHAPADA DIAMANTINA', lencois: 'LENÇÓIS MARANHENSES' };
// Superestrutura [z0, z1] (fração de L). Porta-aviões: trecho da ilha principal.
Object.assign(EST_1225, { ilhabela: [-0.16, 0.09], jericoacoara: [-0.15, 0.08], aparados: [-0.14, 0.07], itatiaia: [-0.16, 0.07], neblina: [-0.16, 0.06], canastra: [-0.07, 0.06], chapada: [0.06, 0.14], lencois: [-0.1, -0.025] });
Object.assign(NOMES_OURO_1225, NOMES_OURO_1226);
// Planta dos gigantes (mesmo formato de PLANO_PA 1.2.25; proa −z, boreste +x). 6 elevadores, 2 catapultas de proa (+2 de meia-nau
// desenhadas pelo extras1226), ilhas. B = boca na linha d'água; o convés de voo se estende até ~2,1×B/2 a bombordo.
Object.assign(PLANO_PA, {
  chapada: { bb: [[-0.99, -0.36], [-0.9, -0.76], [-0.72, -1.08], [-0.6, -1.2], [-0.24, -2.12], [0.12, -1.98], [0.38, -1.8], [0.62, -1.56], [0.9, -1.34], [1, -1.1]],
    be: [[-0.99, 0.36], [-0.9, 0.7], [-0.72, 1.04], [-0.48, 1.26], [0.9, 1.26], [1, 1.14]],
    ang: 0.13, xPopa: 0.06, cat: [[-3.5, 0], [9.5, 0]], ilhas: [[0.06, 0.14, 'princ']],
    elev: [['be', -0.3, 0.042], ['be', -0.19, 0.042], ['be', -0.03, 0.042], ['be', 0.2, 0.042], ['bb', 0.3, 0.042], ['bb', 0.4, 0.042]] },
  megabase: { bb: [[-1, -0.96], [-0.97, -1.0], [0.97, -1.0], [1, -0.96]], /* v1.2.60: convés RETANGULAR de pontão (pista reforçada), sem proa afilada */
    be: [[-1, 0.96], [-0.97, 1.0], [0.97, 1.0], [1, 0.96]],
    ang: 0.05, xPopa: 0.0, cat: [[-12, 0], [12, 0]], ilhas: [[0.04, 0.12, 'princ']],
    elev: [['be', -0.3, 0.042], ['be', -0.12, 0.042], ['be', 0.2, 0.042], ['bb', 0.28, 0.042], ['bb', 0.38, 0.042]] },
  lencois: { bb: [[-0.99, -0.36], [-0.9, -0.77], [-0.72, -1.1], [-0.6, -1.22], [-0.23, -2.1], [0.12, -1.98], [0.38, -1.8], [0.62, -1.56], [0.9, -1.34], [1, -1.1]],
    be: [[-0.99, 0.36], [-0.9, 0.72], [-0.72, 1.06], [-0.47, 1.28], [0.9, 1.28], [1, 1.16]],
    ang: 0.13, xPopa: 0.06, cat: [[-3.5, 0], [9.5, 0]], ilhas: [[-0.1, -0.025, 'nav'], [0.12, 0.17, 'ar']],
    elev: [['be', -0.3, 0.042], ['be', -0.17, 0.042], ['be', 0.04, 0.042], ['be', 0.22, 0.042], ['bb', 0.3, 0.042], ['bb', 0.4, 0.042]] },
});
/** layout.js chama DEPOIS de layoutSuperPA para os gigantes: 6 CIWS / 6×30 mm em patrocínios, VLS em blocos de patrocínio
 *  (tipo 'samPa': render e teste de boca já os tratam), lasers extras nas quinas dos patrocínios de popa. */
export function layoutGigaPA(C, P) { const L = C.L, yS = P.pa1225.yS, cs = 1.08;
  const fora = (z, lado, d) => bordaPA(C, z, lado) + (lado === 'be' ? d : -d);
  P.ciws = [[-0.4, 'bb'], [-0.37, 'be'], [0.455, 'bb'], [0.47, 'be'], [-0.06, 'bb'], [0.3, 'be']].slice(0, C.ciws).map(([f, l], i) => ({ x: fora(f * L, l, 1.6), y: yS + 0.9, z: f * L, lug: 10 + i, spon: l }));
  P.a30 = [[-0.31, 'bb'], [-0.29, 'be'], [0.39, 'bb'], [0.41, 'be'], [0.05, 'bb'], [-0.22, 'be']].slice(0, C.a30 || 0).map(([f, l]) => ({ x: fora(f * L, l, 1.3), y: yS + 1.0, z: f * L, lado: l === 'be' ? 1 : -1, spon: l }));
  for (const [f, l] of [[0.445, 'bb'], [-0.43, 'be']].slice(0, Math.max(0, (C.laser || 0) - P.laser.length))) P.laser.push({ x: fora(f * L, l, 1.5), y: yS + 1.2, z: f * L });
  P.blocosVls = P.blocosVls.filter((b) => b.tipo === 'samPa'); P.vls = []; const h = Math.round((C.vls || 0) / 2);
  for (const [nb, f, l] of [[h, -0.33, 'be'], [(C.vls || 0) - h, 0.34, 'bb']]) { if (!nb) continue; const zc = f * L, col = 4, lin = Math.ceil(nb / col), xc = fora(zc, l, col * cs / 2 + 1.2);
    P.blocosVls.push({ zc, y: yS, col, lin, cs, n: nb, tipo: 'samPa', vlsPa: 1, xc }); for (let i = 0; i < nb; i++) P.vls.push({ x: xc + (i % col - (col - 1) / 2) * cs, y: yS + 0.25, z: zc + (Math.floor(i / col) - (lin - 1) / 2) * cs }); }
  P.celulas = P.vls.concat(P.sam);
}
