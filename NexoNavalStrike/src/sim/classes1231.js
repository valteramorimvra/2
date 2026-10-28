// v1.2.31 — TRÊS navios lendários REAIS (projetos procedurais; dimensões/contagens públicas — ver referencias/FONTES.md).
// Uso (classes.js, logo após adiciona1226): adiciona1231(CLASSES, { D, CAN, VIDA });
// Nomes no jogo: pessoa/cidade (nada religioso, de marca ou demoníaco). Mapeamento "jogo": vls = mísseis de ataque, sam = células antiaéreas.
import { SPEC, IDS_1231 } from './dados1231.js';
export { IDS_1231 };
export const SUPER_LEND_1231 = []; /* os três são lendários (como os de 1.2.25/26), não super */
/** 'estoque ilimitado' do míssil nuclear é uma FLAG (sem Infinity); parâmetros iguais aos da bomba do jogador (sim/nuclear.js NUK). */
export function adiciona1231(CLASSES, { D, CAN, VIDA }) {
  const PREM = { premium: 1, lendario: 1, m1231: 1, missilNuclear: 1 };
  const S1 = SPEC.sejong, S2 = SPEC.nanchang, S3 = SPEC.nakhimov;
  CLASSES.sejong = D('cruzador', 'sejong', Object.assign({}, PREM, { nome: 'Destróier Sejong, o Grande', classe: 'Classe Sejong, o Grande (KDX-III)', nomeOriginal: 'Sejong the Great (DDG-991)', num: 'DDG 991', est25: 'destroier',
    papel: 'Destróier de 166 m: canhão de 127 mm à proa, 48 VLS à vante + 80 à ré (128), 4 painéis SPY-1D, 16 SSM-700K, Goalkeeper, RAM e 2 helicópteros',
    L: S1.L, B: S1.B, T: S1.T, F: 6.9, vmax: S1.vmax, acel: 0.8, giro: 0.85, vida: VIDA(780), blind: 2.0, rcs: 0.5, radar: 19000, desl: S1.desl,
    canhao: CAN({ cal: 127, V0: 850, cad: 1.6, dano: 30, alc: 13000, disp: 0.6, torres: 1, canos: 1, som: 'grande' }),
    vls: 48, vlsRe: 0.17, missil: 'longo', salva: 4, sam: 80, torp: 6, tubos: [1, 3], ciws: 2, ciwsLug: [0, 1], a30: 0, laser: 0, chaff: 14, heli: 2, casco: 'convencional', cascoN: 'eua', estilo: 'destroier', pf: 'ataque', antiAereo: 1, defesaFrota: 1 }));
  CLASSES.nanchang = D('cruzador', 'nanchang', Object.assign({}, PREM, { nome: 'Cruzador Furtivo Nanchang', classe: 'Classe Tipo 055 (Renhai)', nomeOriginal: 'Type 055 Nanchang (DDG-101)', num: 'DDG 101', est25: 'cruzador',
    papel: 'Cruzador furtivo de 180 m: canhão de 130 mm, 112 VLS (64 à vante + 48 à ré), 4 painéis AESA no casario e 4 no mastro, HHQ-10, CIWS de 11 canos e 2 helicópteros',
    L: S2.L, B: S2.B, T: S2.T, F: 6.3, vmax: S2.vmax, acel: 0.8, giro: 0.85, vida: VIDA(820), blind: 2.0, rcs: 0.45, radar: 20000, desl: S2.desl,
    canhao: CAN({ cal: 130, V0: 850, cad: 1.7, dano: 32, alc: 14000, disp: 0.6, torres: 1, canos: 1, som: 'grande' }),
    vls: 64, vlsRe: 0.62, missil: 'longo', salva: 4, sam: 48, torp: 6, tubos: [1, 3], ciws: 2, ciwsLug: [0, 1], a30: 0, laser: 0, chaff: 14, heli: 2, casco: 'convencional', cascoN: 'chn', estilo: 'cruzador', pf: 'ataque', antiAereo: 1, defesaFrota: 1 }));
  CLASSES.nakhimov = D('cruzador', 'nakhimov', Object.assign({}, PREM, { nome: 'Cruzador Nuclear Almirante Nakhimov', classe: 'Classe Orlan modernizada (proj. 11442M)', nomeOriginal: 'Admiral Nakhimov', num: 'CGN 080', est25: 'cruzador',
    papel: 'Cruzador nuclear de 250 m: 80 UKSK à proa/vante da casaria, 96 Fort-M em 12 tambores, 6 Pantsir-M, canhão A-192M de 130 mm à ré, RBU, torpedos e convoo de ré',
    L: S3.L, B: S3.B, T: S3.T, F: 9.8, vmax: S3.vmax, acel: 0.55, giro: 0.6, vida: VIDA(1100), blind: 2.4, rcs: 1.2, radar: 22000, desl: S3.desl,
    canhao: CAN({ cal: 130, V0: 850, cad: 1.7, dano: 32, alc: 14000, disp: 0.6, torres: 1, canos: 1, som: 'grande' }),
    vls: 80, vlsRe: 0.5, missil: 'hiper', salva: 4, sam: 96, torp: 10, tubos: [1, 5], ciws: 6, ciwsLug: [0, 1, 2, 3, 4, 5], a30: 0, laser: 0, chaff: 14, heli: 2, rbu: 1, casco: 'convencional', cascoN: 'rus', estilo: 'cruzador', pf: 'ataque', antiAereo: 1, defesaFrota: 1 }));
}
export const META_1231 = { sejong: ['KOR', 4, 'real_kor'], nanchang: ['CHN', 4, 'real_chn'], nakhimov: ['RUS', 4, 'real_rus'] };
export const NOMES_OURO_1231 = { sejong: 'SEJONG O GRANDE', nanchang: 'NANCHANG', nakhimov: 'ALMIRANTE NAKHIMOV' };
