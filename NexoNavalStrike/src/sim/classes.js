// v1.1.0: Tamboril D52, Atlântico C60 e Fortaleza B90 assumem as linhas destróier/cruzador/capitânia.
// As 6 classes de navio jogáveis (projetos ORIGINAIS, nomes inventados; nenhuma classe/marca real).
// L comprimento, B boca, T calado, F borda livre (m). vmax em m/s. Cada navio tem armamento e precisão próprios.
// canhao: cal (mm), V0 (m/s), cad (s entre disparos), dano, alc (m), disp (dispersão relativa: menor = mais certeiro),
//         torres (1 ou 2), rajada (tiros por disparo). vls: células; missil: perfil do míssil anti-navio.
export const MISSEIS = {
  curto: { nome: 'AN-1 Agulha', alc: 9000, v: 270, vt: 300, dano: 34, pkCiws: 1.0 },
  medio: { nome: 'AN-2 Garra', alc: 12000, v: 285, vt: 330, dano: 42, pkCiws: 0.9 },
  longo: { nome: 'AN-3 Relâmpago', alc: 15000, v: 300, vt: 360, dano: 52, pkCiws: 0.8 },
};
/* v1.2.11: perfis extras dos LENDÁRIOS (nomes originais) */
MISSEIS.hiper = { nome: 'AN-5 Cometa (hipersônico)', alc: 16000, v: 420, vt: 560, dano: 60, pkCiws: 0.55 };
MISSEIS.rasante = { nome: 'AN-4 Rasante', alc: 14000, v: 290, vt: 345, dano: 48, pkCiws: 0.7 };
MISSEIS.cruzeiro = { nome: 'AN-6 Tormenta (cruzeiro pesado)', alc: 18000, v: 260, vt: 380, dano: 66, pkCiws: 0.75 };
for (const k in MISSEIS) MISSEIS[k].chave = k; // v1.2.2: perfil → faixa de dano real
export const SAM = { nome: 'SA-2 Escudo', alc: 3000, v: 720, pk: 0.72, espoleta: 11 };
export const DRONE = { v: 52, alt: 110, vida: 1, dano: 10 };
import { adiciona1225, HELIS_1225, META_1225, IDS_1225 } from './classes1225.js'; /* v1.2.25 itens 12/14 */
import { adiciona1226, HELIS_1226, META_1226, IDS_1226, SUPER_LEND_1226 } from './classes1226.js'; /* v1.2.26 */
import { adiciona1231, META_1231, IDS_1231 } from './classes1231.js'; /* v1.2.31 */
export const LANCHA = { v: 21, vida: 40, alcCanhao: 1000, danoS: 0.9, alcTorp: 2400 };
/** v1.2.0 — helicópteros embarcados (modelos genéricos, sem marcas). vmax m/s, comb s de voo, mun = cargas da arma. */
export const HELIS = {
  leve: { id: 'leve', nome: 'Reconhecimento leve', desc: 'Rápido, sensor de longo alcance (revela navios atrás de ilhas), metralhadora 12,7 mm', vmax: 72, comb: 260, vida: 22, sensor: 8000, arma: 'mg', mun: 400, alc: 1100, dano: 1.0 /* v1.2.30 item 13: ×2 (0,5) */ },
  multi: { id: 'multi', nome: 'Multimissão antinavio', desc: '2 mísseis antinavio leves lançados a 6 km, sensor médio', vmax: 64, comb: 210, vida: 30, sensor: 6000, arma: 'missil', mun: 2, alc: 6000, dano: 22 },
  asw: { id: 'asw', nome: 'Antissubmarino', desc: 'Torpedo leve lançado a até 1,8 km do alvo (busca acústica imediata)', vmax: 62, comb: 230, vida: 30, sensor: 5500, arma: 'torpedo', mun: 1, alc: 1800, dano: 38 },
  ataque: { id: 'ataque', nome: 'Pesado de ataque', desc: 'Canhão 20 mm + salvas de foguetes 70 mm, blindado', vmax: 66, comb: 170, vida: 46, sensor: 4500, arma: 'foguete', mun: 24, alc: 2400, dano: 10 /* v1.2.30 item 13: ×2 (5) */ },
};
  // v1.2.0 (revisão): mais dois modelos com geometria própria
HELIS.coaxial = { id: 'coaxial', nome: 'Coaxial naval', desc: 'Dois rotores contrarrotativos (sem rotor de cauda): compacto, 2 torpedos leves ASW', vmax: 58, comb: 240, vida: 36, sensor: 6000, arma: 'torpedo', mun: 2, alc: 1600, dano: 34 };
HELIS.jato = { id: 'jato', nome: 'Caça VTOL embarcado', desc: 'Caça de decolagem vertical: 2 mísseis antinavio leves a 7 km, rápido (abatível por CIWS/SAM/laser)', vmax: 165, comb: 240, vida: 26, sensor: 9000, arma: 'missil', mun: 2, alc: 7000, dano: 20, aviao: 1 }; /* v1.2.11: porta-aviões */
HELIS.utilitario = { id: 'utilitario', nome: 'Utilitário médio', desc: 'Cabine grande, metralhadora de porta 7,62 mm e radar de busca de longo alcance', vmax: 68, comb: 280, vida: 34, sensor: 7500, arma: 'mg', mun: 600, alc: 1500, dano: 1.8 /* v1.2.30 item 13: ×2 (0,9) */ };
/* v1.2.16 item 13e: novos modelos (nomes fictícios) — caça embarcado convencional e helicóptero pesado de ataque */
HELIS.caca = { id: 'caca', nome: 'Caça embarcado Gavião', desc: 'Caça de catapulta: 4 mísseis antinavio leves a 9 km + canhão 25 mm; rápido, blindagem leve', vmax: 210, comb: 260, vida: 34, sensor: 10000, arma: 'missil', mun: 4, alc: 9000, dano: 20, aviao: 1 };
HELIS.tufao = { id: 'tufao', nome: 'Helicóptero pesado Tufão', desc: 'Ataque pesado: foguetes 70 mm + canhão 30 mm, blindado (resiste mais à AA)', vmax: 74, comb: 200, vida: 60, sensor: 5000, arma: 'foguete', mun: 32, alc: 2600, dano: 11 /* v1.2.30 item 13: ×2 (5,5) */ };
Object.assign(HELIS, HELIS_1225, HELIS_1226); /* v1.2.26: Tesourão, Tuiuiú, Coruja, Beija-flor, Marimbondo, Urubu-rei (gancho 'bombardeiroNuclear') */ /* v1.2.25: caça furtivo Raio + alerta aéreo Vigia (só porta-aviões 1.2.25) */
export const ORDEM_HELIS = ['leve', 'multi', 'asw', 'ataque', 'coaxial', 'utilitario', 'jato', 'caca', 'tufao'];
export const UAV = { v: 34, alt: 100, raio: 600, dur: 150, recarga: 60, sensor: 6500, vida: 1 };
export const TORPEDO = { v: 24, alc: 6500, dano: 70, buscaAlc: 1300, buscaCone: 0.5, giro: 0.16, arma: 900 };

const VIDA = (v) => Math.round(v * 3.2 * 1.5); /* v1.2.5: ×1,5 de vida (dano de míssil/torpedo segue em % do HP de referência) */ // v1.2.0: casco mais resistente (batalhas de 4–8 min com fogo/alagamento/afundamento progressivo)
export const CLASSES = {
  corveta: {
    id: 'corveta', nome: 'Corveta', classe: 'Classe Garoupa', papel: 'Rápida, ágil, torpedos', num: 'V 34',
    L: 92, B: 12.4, T: 3.7, F: 4.8, vmax: 16.5, acel: 1.0, giro: 1.25, vida: VIDA(140), blind: 0.9, rcs: 0.55, radar: 11000, desl: 1900,
    canhao: { cal: 76, V0: 900, cad: 1.0, dano: 7, alc: 8000, disp: 1.0, torres: 1, canos: 1, rajada: 1, som: 'medio' },
    vls: 8, missil: 'curto', sam: 0, torp: 6, tubos: [1, 3], ciws: 1, a30: 2, chaff: 6, heli: 0, casco: 'convencional', estilo: 'corveta',
  },
  fragata: {
    id: 'fragata', nome: 'Fragata', classe: 'Classe Albatroz', papel: 'Equilibrada, boa defesa', num: 'F 41',
    L: 128, B: 16, T: 4.8, F: 5.6, vmax: 15.4, acel: 0.85, giro: 0.95, vida: VIDA(200), blind: 1.0, rcs: 0.8, radar: 13000, desl: 4200,
    canhao: { cal: 76, V0: 920, cad: 0.85, dano: 8, alc: 8500, disp: 0.85, torres: 1, canos: 1, rajada: 1, som: 'medio' },
    vls: 16, missil: 'medio', sam: 8, torp: 6, tubos: [1, 3], ciws: 2, a30: 1, chaff: 8, heli: 1, casco: 'convencional', estilo: 'fragata',
  },
  destroier: {
    id: 'destroier', nome: 'Destróier Stealth Leve', classe: 'Classe Tamboril', papel: 'Batedor furtivo e rápido: 32 nós, canhão de 76 mm e 4 mísseis', num: 'D 52',
    L: 142, B: 17.2, T: 5.2, F: 6.2, vmax: 16.46, acel: 0.8, giro: 0.95, vida: VIDA(240), blind: 1.05, rcs: 0.5, radar: 14000, desl: 5200,
    canhao: { cal: 76, V0: 925, cad: 0.9, dano: 9, alc: 8500, disp: 0.8, torres: 1, canos: 1, rajada: 1, som: 'medio' },
    vls: 4, missil: 'medio', sam: 0, torp: 4, tubos: [1, 1], ciws: 1, a30: 1, chaff: 8, heli: 1, casco: 'tumblehome', estilo: 'destroier',
  },
  furtivo: {
    id: 'furtivo', nome: 'Destróier Furtivo', classe: 'Classe Sombra', papel: 'Casco tumblehome, quase invisível ao radar', num: 'D 77',
    L: 172, B: 20.5, T: 6.2, F: 6.0, vmax: 15.5, acel: 0.75, giro: 0.8, vida: VIDA(270), blind: 1.1, rcs: 0.32, radar: 15000, desl: 7400,
    canhao: { cal: 127, V0: 820, cad: 1.7, dano: 17, alc: 10000, disp: 0.6, torres: 1, canos: 1, rajada: 1, som: 'grande' },
    vls: 32, missil: 'longo', sam: 8, torp: 6, tubos: [1, 3], ciws: 2, a30: 1, chaff: 10, heli: 1, casco: 'tumblehome', estilo: 'furtivo',
  },
  cruzador: {
    id: 'cruzador', nome: 'Cruzador de Mísseis Guiados', classe: 'Classe Atlântico', papel: 'Dois canhões (proa e popa), 2 silos VLS: cruzeiro + antiaéreos', num: 'C 60',
    L: 184, B: 21.8, T: 6.6, F: 7.2, vmax: 14.4, acel: 0.7, giro: 0.72, vida: VIDA(340), blind: 1.3, rcs: 1.0, radar: 16000, desl: 9800,
    canhao: { cal: 127, V0: 800, cad: 2.2, dano: 16, alc: 10000, disp: 0.75, torres: 2, canos: 1, rajada: 1, som: 'grande' },
    vls: 8, missil: 'longo', sam: 8, torp: 8, tubos: [2, 1], ciws: 2, ciwsLug: [4, 1], a30: 2, chaff: 10, heli: 2, casco: 'convencional', estilo: 'cruzador',
  },
  capitania: {
    id: 'capitania', nome: 'Couraçado Nau-Capitânia', classe: 'Classe Fortaleza', papel: 'Blindagem pesada, 3 torres duplas de 152 mm e bateria de saturação', num: 'B 90',
    L: 222, B: 30, T: 8.2, F: 8.4, vmax: 11.32, acel: 0.55, giro: 0.58, vida: VIDA(520), blind: 1.85, rcs: 1.25, radar: 17000, desl: 24000,
    canhao: { cal: 152, V0: 860, cad: 3.4, dano: 21, alc: 12000, disp: 0.85, torres: 3, canos: 2, rajada: 1, som: 'grande' },
    vls: 16, missil: 'curto', salva: 4, sam: 12, torp: 0, tubos: [0, 0], ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 4, chaff: 14, heli: 2, casco: 'convencional', estilo: 'capitania', defesaFrota: 1600,
  },
};
// ---------- v1.2.0: 4 navios por nação (linhas inspiradas em escolas de projeto reais; nomes 100% inventados) + 3 premium ----------
Object.assign(CLASSES, {
  tridente: {
    id: 'tridente', nome: 'Destróier Furtivo Pesado', classe: 'Classe Tridente', papel: 'Casco tumblehome perfurador de ondas, superestrutura piramidal integrada e 2 canhões de 155 mm embutidos', num: 'DDG 120',
    L: 186, B: 24.6, T: 8.4, F: 6.4, vmax: 15.4, acel: 0.66, giro: 0.74, vida: VIDA(330), blind: 1.2, rcs: 0.22, radar: 17000, desl: 15000,
    canhao: { cal: 155, V0: 825, cad: 2.6, dano: 20, alc: 12500, disp: 0.6, torres: 2, canos: 1, rajada: 1, som: 'grande', embutido: 1, frenteDupla: 1 },
    vls: 20, missil: 'longo', sam: 8, torp: 0, tubos: [0, 0], ciws: 2, ciwsLug: [4, 1], a30: 2, chaff: 12, heli: 1, casco: 'tumblehome', estilo: 'eua',
  },
  dragao: {
    id: 'dragao', nome: 'Cruzador Furtivo de Mísseis', classe: 'Classe Dragão', papel: 'Linhas furtivas, mastro integrado fechado e matriz VLS enorme na proa e na popa', num: 'C 55',
    L: 180, B: 20.8, T: 6.6, F: 7.0, vmax: 15.4, acel: 0.7, giro: 0.76, vida: VIDA(330), blind: 1.15, rcs: 0.55, radar: 18000, desl: 12500,
    canhao: { cal: 130, V0: 850, cad: 2.0, dano: 16, alc: 10500, disp: 0.7, torres: 1, canos: 1, rajada: 1, som: 'grande' },
    vls: 28, missil: 'longo', salva: 3, sam: 16, torp: 6, tubos: [1, 3], ciws: 2, ciwsLug: [4, 1], a30: 1, chaff: 12, heli: 2, casco: 'convencional', estilo: 'chn',
  },
  tempestade: {
    id: 'tempestade', nome: 'Fragata Pesada de Ataque', classe: 'Classe Tempestade', papel: 'Superestrutura maciça cheia de antenas, baterias de mísseis inclinadas e torre dupla pesada de 130 mm', num: 'F 22',
    L: 158, B: 18.4, T: 5.8, F: 6.6, vmax: 15.0, acel: 0.74, giro: 0.86, vida: VIDA(290), blind: 1.2, rcs: 0.9, radar: 15500, desl: 6800,
    canhao: { cal: 130, V0: 850, cad: 1.6, dano: 14, alc: 10000, disp: 0.8, torres: 1, canos: 2, rajada: 1, som: 'grande' },
    vls: 16, missil: 'medio', salva: 4, sam: 12, torp: 8, tubos: [1, 3], ciws: 2, a30: 2, chaff: 10, heli: 1, casco: 'convencional', estilo: 'rus', baterias: 1,
  },
  sentinela: {
    id: 'sentinela', nome: 'Destróier de Defesa Aérea', classe: 'Classe Sentinela', papel: 'Mastro cônico alto com radar esférico: o maior guarda-chuva antiaéreo da frota', num: 'D 45',
    L: 152, B: 21.2, T: 5.7, F: 6.6, vmax: 15.4, acel: 0.78, giro: 0.86, vida: VIDA(270), blind: 1.05, rcs: 0.7, radar: 19000, desl: 8000,
    canhao: { cal: 114, V0: 870, cad: 1.2, dano: 11, alc: 9500, disp: 0.75, torres: 1, canos: 1, rajada: 1, som: 'medio' },
    vls: 8, missil: 'medio', sam: 24, torp: 0, tubos: [0, 0], ciws: 2, ciwsLug: [4, 1], a30: 2, chaff: 12, heli: 1, casco: 'convencional', estilo: 'uk', defesaFrota: 1800,
  },
  // ---- PREMIUM (compra com OURO, sem pesquisa, +prata por batalha; balanceados no meio do seu tier) ----
  corsario: {
    id: 'corsario', nome: 'Patrulha Rápida Premium', classe: 'Classe Corsário', papel: 'Interceptadora de 36 nós com canhão de 57 mm de cadência alta e torpedos', num: 'P 12', premium: 1,
    L: 84, B: 11.2, T: 3.3, F: 4.4, vmax: 18.5, acel: 1.1, giro: 1.35, vida: VIDA(135), blind: 0.85, rcs: 0.45, radar: 10500, desl: 1300,
    canhao: { cal: 57, V0: 1000, cad: 0.5, dano: 4.2, alc: 7500, disp: 1.0, torres: 1, canos: 1, rajada: 1, som: 'rapido' },
    vls: 4, missil: 'curto', sam: 0, torp: 4, tubos: [1, 1], ciws: 1, a30: 2, chaff: 6, heli: 0, casco: 'convencional', estilo: 'premium',
  },
  leviata: {
    id: 'leviata', nome: 'Fragata de Escolta Premium', classe: 'Classe Cachalote', papel: 'Dois canhões de 100 mm (proa e popa), escolta antiaérea e casco reforçado', num: 'P 31', premium: 1,
    L: 140, B: 17.5, T: 5.0, F: 6.0, vmax: 15.2, acel: 0.8, giro: 0.9, vida: VIDA(250), blind: 1.1, rcs: 0.75, radar: 14500, desl: 5600,
    canhao: { cal: 100, V0: 870, cad: 1.1, dano: 9, alc: 9000, disp: 0.8, torres: 2, canos: 1, rajada: 1, som: 'medio' },
    vls: 8, missil: 'medio', sam: 12, torp: 6, tubos: [1, 3], ciws: 2, ciwsLug: [4, 1], a30: 2, chaff: 10, heli: 1, casco: 'convencional', estilo: 'premium',
  },
  aurora: {
    id: 'aurora', nome: 'Cruzador de Ataque Premium', classe: 'Classe Aurora', papel: 'Torre dupla de 130 mm, 24 células de mísseis de longo alcance e 3 CIWS', num: 'P 58', premium: 1,
    L: 192, B: 22.5, T: 6.8, F: 7.4, vmax: 14.6, acel: 0.68, giro: 0.72, vida: VIDA(350), blind: 1.3, rcs: 0.85, radar: 16500, desl: 11000,
    canhao: { cal: 130, V0: 850, cad: 1.9, dano: 14, alc: 10500, disp: 0.75, torres: 1, canos: 2, rajada: 1, som: 'grande' },
    vls: 24, missil: 'longo', salva: 3, sam: 8, torp: 0, tubos: [0, 0], ciws: 3, ciwsLug: [0, 4, 1], a30: 2, chaff: 12, heli: 2, casco: 'convencional', estilo: 'premium',
  },
});
// ---------- v1.2.0 (revisão): 5 projetos POR NAÇÃO. Derivados de arquétipos de casco, com geometria (L/B/armas) e
// detalhes nacionais próprios. Nomes ORIGINAIS no idioma de cada marinha, todos INVENTADOS (nenhuma classe real). ----------
const D = (base, id, o) => { const B0 = CLASSES[base]; return Object.assign({}, B0, o, { id, canhao: Object.assign({}, B0.canhao, o.canhao || {}) }); };
Object.assign(CLASSES, {
  // EUA
  kestrel: D('corveta', 'kestrel', { nome: 'Corveta Litorânea', classe: 'Classe Kestrel', nomeOriginal: 'Kestrel-class LCS', num: 'LCS 7', papel: 'Casco rápido de 35 nós, canhão de 57 mm e hangar para 1 helicóptero', L: 104, B: 13.8, vmax: 18, vida: VIDA(150), canhao: { cal: 57, V0: 1000, cad: 0.55, dano: 4.6, som: 'rapido' }, vls: 8, heli: 1, estilo: 'eua', pf: 'batedor' }),
  redwood: D('fragata', 'redwood', { nome: 'Fragata de Escolta', classe: 'Classe Redwood', nomeOriginal: 'Redwood-class FFG', num: 'FFG 64', papel: '32 células VLS, SAM de área e helicóptero antissubmarino', L: 151, B: 19.8, vida: VIDA(230), canhao: { cal: 57, V0: 1000, cad: 0.5, dano: 4.8, som: 'rapido' }, vls: 32, missil: 'medio', sam: 8, heli: 1, estilo: 'eua', pf: 'ataque' }),
  monolito: D('cruzador', 'monolito', { nome: 'Cruzador de Defesa de Área', classe: 'Classe Monolith', nomeOriginal: 'Monolith-class CG', num: 'CG 81', papel: 'Dois canhões de 127 mm, 32 VLS de longo alcance e 16 SAM', L: 196, B: 22.6, vida: VIDA(360), vls: 32, salva: 3, sam: 16, heli: 2, estilo: 'eua', pf: 'ataque' }),
  // CHINA
  haiyan: D('corveta', 'haiyan', { nome: 'Corveta Costeira', classe: 'Classe Haiyan', nomeOriginal: '海燕 Haiyan', num: '581', papel: 'Corveta de patrulha costeira com 76 mm e mísseis curtos', L: 90, B: 11.6, vida: VIDA(145), vls: 4, estilo: 'chn', pf: 'batedor' }),
  jinpeng: D('fragata', 'jinpeng', { nome: 'Fragata Multimissão', classe: 'Classe Jinpeng', nomeOriginal: '金鹏 Jinpeng', num: '532', papel: '32 células VLS, sonar rebocado e hangar', L: 136, B: 16.4, vida: VIDA(215), vls: 32, sam: 8, heli: 1, estilo: 'chn', pf: 'ataque' }),
  tianlong: D('fragata', 'tianlong', { nome: 'Destróier de Mísseis Guiados', classe: 'Classe Changfeng', nomeOriginal: '长风 Changfeng', num: '171', papel: 'Canhão de 130 mm, 32 VLS longos e radar de painéis fixos', L: 156, B: 18, vida: VIDA(280), vmax: 15.6, canhao: { cal: 130, V0: 850, cad: 1.8, dano: 15, alc: 10500, disp: 0.7, som: 'grande' }, vls: 32, missil: 'longo', sam: 8, heli: 1, estilo: 'chn', pf: 'batedor' }),
  xuanwu: D('capitania', 'xuanwu', { nome: 'Cruzador Pesado de Batalha', classe: 'Classe Haixing', nomeOriginal: '海星 Haixing', num: '101', papel: 'Duas torres duplas de 130 mm, 48 células VLS e 24 SAM', L: 214, B: 27, vida: VIDA(480), blind: 1.6, canhao: { cal: 130, V0: 860, cad: 2.4, dano: 15, alc: 11000, disp: 0.75, torres: 2, canos: 2 }, vls: 48, missil: 'longo', salva: 4, sam: 24, heli: 2, estilo: 'chn', pf: 'capitania' }),
  // RÚSSIA
  strizh: D('corveta', 'strizh', { nome: 'Corveta de Mísseis', classe: 'Classe Strizh', nomeOriginal: 'Стриж (Strizh)', num: '561', papel: 'Pequena e veloz, 8 mísseis médios em baterias inclinadas', L: 82, B: 11.8, vmax: 17.5, vida: VIDA(132), vls: 8, missil: 'medio', estilo: 'rus', baterias: 1, pf: 'batedor' }),
  sokol: D('fragata', 'sokol', { nome: 'Destróier Antinavio', classe: 'Classe Sokol', nomeOriginal: 'Сокол (Sokol)', num: '610', papel: 'Torre dupla de 130 mm, 16 mísseis longos e 8 torpedos', L: 160, B: 18.8, vida: VIDA(290), canhao: { cal: 130, V0: 850, cad: 1.7, dano: 14, alc: 10000, disp: 0.8, canos: 2, som: 'grande' }, vls: 16, missil: 'longo', sam: 12, torp: 8, heli: 1, estilo: 'rus', baterias: 1, pf: 'batedor' }),
  medved: D('cruzador', 'medved', { nome: 'Cruzador Lança-Mísseis', classe: 'Classe Medved', nomeOriginal: 'Медведь (Medved)', num: '099', papel: 'Maciço: torre dupla de 130 mm, 24 mísseis longos em salvas de 4', L: 200, B: 23, vida: VIDA(380), canhao: { cal: 130, V0: 850, cad: 2.0, dano: 15, torres: 1, canos: 2 }, vls: 24, salva: 4, sam: 16, heli: 2, estilo: 'rus', baterias: 1, pf: 'capitania' }),
  sapsan: D('fragata', 'sapsan', { nome: 'Fragata Premium de Ataque', classe: 'Classe Sapsan', nomeOriginal: 'Сапсан (Sapsan)', num: 'P 45', premium: 1, papel: 'Versão premium de ataque: torre dupla de 100 mm, 16 VLS e SAM reforçado', L: 150, B: 18, vida: VIDA(260), canhao: { cal: 100, V0: 880, cad: 1.2, dano: 10, canos: 2, som: 'medio' }, vls: 16, sam: 12, torp: 8, heli: 1, estilo: 'rus', baterias: 1, pf: 'ataque' }),
  fenghuang: D('dragao', 'fenghuang', { nome: 'Destróier Premium de Escolta', classe: 'Classe Fenghuang', nomeOriginal: '凤凰 Fenghuang', num: 'P 88', premium: 1, papel: 'Premium Tier III: 130 mm, 48 VLS, SAM de área e hangar duplo para 2 helicópteros', L: 186, B: 21, heli: 2, vls: 48, sam: 24, estilo: 'chn', pf: 'capitania' }),
  // CRUZADOR PESADO DE ESCOLA RUSSA (Tier III; nome ORIGINAL): 2 torres duplas de 130 mm superelevadas na proa, VLS embutido no convés de proa e no alto da superestrutura, CIWS nos bordos, hangar
  zarev: D('capitania', 'zarev', { nome: 'Cruzador Pesado de Mísseis', classe: 'Classe Zarev', nomeOriginal: 'Зарев (Zarev)', num: '058', papel: 'Duas torres duplas de 130 mm superelevadas, 40 VLS (proa e superestrutura), 24 SAM e 4 CIWS nos bordos', L: 236, B: 26, T: 8, F: 8, vmax: 14.4, acel: 0.6, giro: 0.6, vida: VIDA(520), blind: 1.7, rcs: 1.25,
    canhao: { cal: 130, V0: 850, cad: 4.5, dano: 26, alc: 11500, disp: 0.7, torres: 2, canos: 2, rajada: 1, som: 'grande', frenteDupla: 1 }, vls: 40, missil: 'longo', salva: 4, sam: 24, ciws: 4, heli: 1, vlsSup: 1, estilo: 'rus', baterias: 0, pf: 'capitania' }),
  // COURAÇADO MODERNO (Brasil, Tier III): 2 torres TRIPLAS de 305 mm na proa (a 2ª superelevada), VLS, SAM e CIWS
  trovao: D('capitania', 'trovao', { nome: 'Couraçado de Batalha', classe: 'Classe Trovão', nomeOriginal: 'Classe Trovão', num: 'B 81', papel: 'Couraçado moderno: 2 torres triplas de 305 mm em salva simultânea, 24 VLS, lança-foguetes ASW LF-12 Martelo e defesa em camadas', L: 250, B: 33, T: 9, F: 9, vmax: 10.8, acel: 0.5, giro: 0.5, vida: VIDA(600), blind: 2.0, rcs: 1.35, desl: 42000,
    canhao: { cal: 305, V0: 780, cad: 4.0, dano: 46, alc: 14000, disp: 1.0, torres: 2, canos: 3, rajada: 1, som: 'grande', frenteDupla: 1, embutido: 0, salva: 1 }, vls: 24, missil: 'longo', salva: 4, sam: 16, ciws: 4, heli: 1, couracado: 1, estilo: 'capitania', pf: 'capitania',
    rbu: { nome: 'LF-12 Martelo', salvas: 6, foguetes: 12, alc: 4500, min: 700, dano: 26, cad: 13, el: 0.82 } /* v1.2.9: 3→4,5 km */ }), // lança-foguetes ASW (estilo RBU; nome original)
  // REINO UNIDO
  puffin: D('corveta', 'puffin', { nome: 'Navio-Patrulha Oceânico', classe: 'Classe Puffin', nomeOriginal: 'Puffin-class OPV', num: 'P 290', papel: 'Patrulha oceânica robusta, 57 mm e mísseis curtos', L: 92, B: 13.4, vmax: 15.8, vida: VIDA(160), canhao: { cal: 57, V0: 1000, cad: 0.6, dano: 4.4, som: 'rapido' }, vls: 4, estilo: 'uk', pf: 'batedor' }),
  thornwood: D('fragata', 'thornwood', { nome: 'Fragata Antissubmarino', classe: 'Classe Thornwood', nomeOriginal: 'Thornwood-class FF', num: 'F 238', papel: 'Canhão de 127 mm, 24 VLS, 16 SAM e torpedos', L: 150, B: 20.5, vida: VIDA(240), canhao: { cal: 127, V0: 820, cad: 1.8, dano: 15, alc: 10000, som: 'grande' }, vls: 24, sam: 16, heli: 1, estilo: 'uk', pf: 'ataque' }),
  warden: D('cruzador', 'warden', { nome: 'Cruzador de Escolta', classe: 'Classe Warden', nomeOriginal: 'Warden-class CG', num: 'C 12', papel: 'Dois canhões de 114 mm e 32 SAM: guarda-chuva antiaéreo da frota', L: 190, B: 22, vida: VIDA(350), canhao: { cal: 114, V0: 870, cad: 1.3, dano: 11, torres: 2 }, vls: 16, sam: 32, heli: 2, estilo: 'uk', defesaFrota: 2000, pf: 'ataque' }),
});
// ---------- v1.2.11: categoria LENDÁRIO (símbolo roxo, Premium). Projetos ORIGINAIS: só o ESTILO lembra navios conhecidos; nomes inventados. ----------
const CAN = (o) => Object.assign({ V0: 800, rajada: 1, som: 'grande', disp: 0.8 }, o);
Object.assign(CLASSES, {
  // couraçado-cruzador moderno de escola russa: 3 torres triplas pesadas, VLS de proa e popa, hipersônicos, laser de defesa
  volkhar: D('trovao', 'volkhar', { nome: 'Couraçado Lendário', classe: 'Classe Volkhar', nomeOriginal: 'Волхар (Volkhar)', num: 'L 01', premium: 1, lendario: 1, papel: 'Lendário: 3 torres triplas de 406 mm, 48 VLS (longo + hipersônico), 32 SAM, laser de defesa aérea e 4 CIWS',
    L: 272, B: 34, T: 9.5, F: 9.5, vmax: 12.2, acel: 0.55, giro: 0.52, vida: VIDA(820), blind: 2.3, rcs: 1.4, desl: 52000, canhao: CAN({ cal: 406, V0: 800, cad: 4.6, dano: 72, alc: 16000, disp: 0.85, torres: 3, canos: 3, frenteDupla: 0, salva: 1 }),
    vls: 48, missil: 'longo', misseis: ['longo', 'hiper'], salva: 4, sam: 32, ciws: 4, a30: 2, laser: 1, heli: 1, couracado: 1, estilo: 'capitania', pf: 'capitania' }),
  // couraçado rápido de escola norte-americana: 4 torres triplas (2 à vante, 2 à ré), antiaérea pesada
  baluarte: D('trovao', 'baluarte', { nome: 'Super Couraçado Rafaella', classe: 'Classe Rafaella', nomeOriginal: 'Super Couraçado Rafaella (original)', /* v1.2.15: renomeado; id 'baluarte' mantido (save compatível) */ num: 'L 02', premium: 1, lendario: 1, papel: 'Lendário: 4 torres triplas de 406 mm (12 canos), 24 VLS (rasante + cruzeiro), 8 reparos de 30 mm, 4 CIWS e laser',
    L: 282, B: 37, T: 10.5, F: 9.8, vmax: 11.8, acel: 0.5, giro: 0.48, vida: VIDA(900), blind: 2.5, rcs: 1.5, desl: 70000, canhao: CAN({ cal: 406, V0: 790, cad: 5.0, dano: 70, alc: 15500, disp: 0.9, torres: 4, canos: 3, frenteDupla: 0, salva: 1 }),
    vls: 24, missil: 'rasante', misseis: ['rasante', 'cruzeiro'], salva: 4, sam: 16, ciws: 4, a30: 4, laser: 1, heli: 1, couracado: 1, estilo: 'eua', pf: 'capitania' }),
  // cruzador porta-aeronaves de escola russa: lançadores pesados na proa, convés de voo em ângulo à ré, caças VTOL
  kordao: D('capitania', 'kordao', { nome: 'Cruzador Porta-Aeronaves Lendário', classe: 'Classe Kordão', nomeOriginal: 'Кордон (Kordão)', num: 'L 03', premium: 1, lendario: 1, papel: 'Lendário: convés de voo em ângulo com 3 caças VTOL + 1 helicóptero, 16 mísseis de cruzeiro pesados, 24 SAM e 4 CIWS',
    L: 274, B: 34, T: 9, F: 9, vmax: 13.4, acel: 0.55, giro: 0.55, vida: VIDA(720), blind: 1.9, rcs: 1.55, desl: 45000, canhao: CAN({ cal: 100, V0: 870, cad: 1.1, dano: 11, alc: 9500, torres: 1, canos: 2, som: 'medio', frenteDupla: 0, embutido: 0 }),
    vls: 16, missil: 'cruzeiro', misseis: ['cruzeiro', 'longo'], salva: 4, sam: 24, ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 2, torp: 0, tubos: [0, 0], heli: 4, helisPadrao: ['jato', 'jato', 'jato', 'multi'], porta: 'cruzador', laser: 0, couracado: 0, estilo: 'rus', baterias: 1, pf: 'capitania' }),
  // cruzador lança-mísseis de escola russa: grandes tubos inclinados nos bordos da proa
  estrelar: D('medved', 'estrelar', { nome: 'Cruzador Lança-Mísseis Lendário', classe: 'Classe Estrelar', nomeOriginal: 'Звездар (Estrelar)', num: 'L 04', premium: 1, lendario: 1, papel: 'Lendário: 16 tubos pesados inclinados (cruzeiro + hipersônico), torre dupla de 130 mm, 32 SAM, 4 CIWS e laser',
    L: 196, B: 22.5, T: 7.5, F: 7.8, vmax: 15.6, acel: 0.7, giro: 0.7, vida: VIDA(560), blind: 1.8, rcs: 1.2, desl: 13000, canhao: CAN({ cal: 130, V0: 850, cad: 1.8, dano: 18, alc: 11500, torres: 1, canos: 2, frenteDupla: 0 }),
    vls: 16, missil: 'cruzeiro', misseis: ['cruzeiro', 'hiper'], salva: 4, sam: 32, ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 2, torp: 8, laser: 1, heli: 1, estilo: 'rus', baterias: 1, pf: 'capitania' }),
  // o gigante: TODAS as armas (canhões pesados, 3 tipos de míssil, SAM, CIWS, laser, torpedos, lança-foguetes, helicópteros)
  colosso: D('trovao', 'colosso', { nome: 'Supernavio de Batalha Lendário', classe: 'Classe Colosso Austral', nomeOriginal: 'Classe Colosso Austral', num: 'L 00', premium: 1, lendario: 1, papel: 'Lendário máximo: 4 torres triplas de 460 mm, 96 VLS (longo/hipersônico/cruzeiro), 48 SAM, 5 CIWS, 2 lasers, torpedos, lança-foguetes e 3 helicópteros',
    L: 342, B: 44, T: 12, F: 11, vmax: 11.2, acel: 0.45, giro: 0.42, vida: VIDA(1250), blind: 2.8, rcs: 1.8, desl: 98000, canhao: CAN({ cal: 460, V0: 780, cad: 5.4, dano: 92, alc: 17000, disp: 0.9, torres: 4, canos: 3, frenteDupla: 0, salva: 1 }),
    vls: 96, missil: 'longo', misseis: ['longo', 'hiper', 'cruzeiro'], salva: 6, sam: 48, ciws: 5, ciwsLug: [0, 1, 2, 3, 4], a30: 4, torp: 8, tubos: [1, 4], laser: 2, heli: 3, couracado: 1, estilo: 'capitania', pf: 'capitania',
    rbu: { nome: 'LF-16 Trovoada', salvas: 8, foguetes: 16, alc: 5500, min: 600, dano: 32, cad: 12, el: 0.8 } }),
  // v1.2.16 TRÊS LENDÁRIOS SUPREMOS (acima do Colosso e do Rafaella): projetos ORIGINAIS, couraçados-arsenal modernos
  marcos: D('trovao', 'marcos', { nome: 'Super Encouraçado Marcos Vinícius', classe: 'Classe Marcos Vinícius', nomeOriginal: 'Super Encouraçado Marcos Vinícius (original)', num: 'L 05', premium: 1, lendario: 1, supremo: 1, papel: 'Lendário supremo, o maior e mais forte: 6 torres triplas de 508 mm (18 canos), 128 VLS (longo/hipersônico/cruzeiro), 64 SAM, 5 CIWS, 2 lasers, 12 tubos de torpedo e lança-foguetes',
    L: 392, B: 50, T: 13, F: 12, vmax: 11.6, acel: 0.44, giro: 0.4, vida: VIDA(1650), blind: 3.1, rcs: 1.95, desl: 128000, canhao: CAN({ cal: 508, V0: 790, cad: 5.6, dano: 110, alc: 18500, disp: 0.88, torres: 6, canos: 3, frenteDupla: 0, salva: 1 }),
    vls: 128, missil: 'longo', misseis: ['longo', 'hiper', 'cruzeiro'], salva: 6, sam: 64, ciws: 5, ciwsLug: [0, 1, 2, 3, 4], a30: 4, torp: 12, tubos: [2, 3], laser: 2, heli: 0, couracado: 1, estilo: 'capitania', pf: 'capitania',
    rbu: { nome: 'LF-20 Tempestade', salvas: 10, foguetes: 20, alc: 6000, min: 600, dano: 36, cad: 11, el: 0.8 } }),
  rodolfo: D('trovao', 'rodolfo', { nome: 'Comandante Rodolfo', classe: 'Classe Comandante Rodolfo', nomeOriginal: 'Comandante Rodolfo (original)', num: 'L 06', premium: 1, lendario: 1, supremo: 1, papel: 'Lendário supremo: 4 torres QUÁDRUPLAS de 460 mm (16 canos), 112 VLS, 56 SAM, 5 CIWS, 2 lasers, 12 tubos de torpedo, lança-foguetes e 2 helicópteros',
    L: 352, B: 46, T: 12, F: 11.4, vmax: 12.4, acel: 0.5, giro: 0.46, vida: VIDA(1420), blind: 2.95, rcs: 1.85, desl: 108000, canhao: CAN({ cal: 460, V0: 800, cad: 5.2, dano: 96, alc: 17800, disp: 0.88, torres: 4, canos: 4, frenteDupla: 0, salva: 1 }),
    vls: 112, missil: 'longo', misseis: ['longo', 'hiper', 'cruzeiro'], salva: 6, sam: 56, ciws: 5, ciwsLug: [0, 1, 2, 3, 4], a30: 4, torp: 12, tubos: [2, 3], laser: 2, heli: 2, couracado: 1, estilo: 'rus', pf: 'capitania',
    rbu: { nome: 'LF-18 Trovoada Pesada', salvas: 9, foguetes: 18, alc: 5800, min: 600, dano: 34, cad: 11.5, el: 0.8 } }),
  antonia: D('trovao', 'antonia', { nome: 'Capitã Antônia', classe: 'Classe Capitã Antônia', nomeOriginal: 'Capitã Antônia (original)', num: 'L 07', premium: 1, lendario: 1, supremo: 1, papel: 'Lendário supremo rápido: 5 torres triplas de 457 mm (15 canos), 104 VLS, 64 SAM, 5 CIWS, 2 lasers, 12 tubos de torpedo, lança-foguetes e 2 helicópteros',
    L: 336, B: 42, T: 11.5, F: 11, vmax: 13.6, acel: 0.56, giro: 0.5, vida: VIDA(1380), blind: 2.9, rcs: 1.75, desl: 96000, canhao: CAN({ cal: 457, V0: 810, cad: 5.0, dano: 94, alc: 17600, disp: 0.86, torres: 5, canos: 3, frenteDupla: 0, salva: 1 }),
    vls: 104, missil: 'longo', misseis: ['longo', 'hiper', 'cruzeiro'], salva: 6, sam: 64, ciws: 5, ciwsLug: [0, 1, 2, 3, 4], a30: 4, torp: 12, tubos: [2, 3], laser: 2, heli: 2, couracado: 1, estilo: 'chn', pf: 'capitania',
    rbu: { nome: 'LF-18 Granizo Pesado', salvas: 9, foguetes: 18, alc: 5800, min: 600, dano: 34, cad: 11.5, el: 0.8 } }),
  // porta-aviões de escolta (opção na tela pré-batalha): ilha a boreste, convés corrido, caças VTOL e helicópteros
  horizonte: D('capitania', 'horizonte', { nome: 'Porta-Aviões de Escolta', classe: 'Classe Horizonte', nomeOriginal: 'Classe Horizonte', num: 'A 12', papel: 'Convés corrido com 4 caças VTOL e 1 helicóptero ASW; defesa por 4 CIWS, 2 reparos de 30 mm e laser',
    L: 262, B: 34, T: 9, F: 13, vmax: 13.5, acel: 0.5, giro: 0.5, vida: VIDA(640), blind: 1.5, rcs: 1.7, desl: 42000, canhao: CAN({ cal: 57, V0: 1000, cad: 0.6, dano: 4.6, alc: 8000, torres: 1, canos: 1, som: 'rapido', frenteDupla: 0, embutido: 1 }),
    vls: 0, missil: 'medio', salva: 0, sam: 0, ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 2, torp: 0, tubos: [0, 0], laser: 1, heli: 8, maxAr: 8, helisPadrao: ['jato', 'jato', 'caca', 'caca', 'jato', 'tufao', 'asw', 'jato'], porta: 'pa', /* v1.2.16 item 13b/k: ala aérea ampliada (balanceada: 8, sem mísseis de navio) */ couracado: 0, estilo: 'capitania', pf: 'capitania' }),
});
/* v1.2.16 item 13f/j: SUPER PORTA-AVIÕES LENDÁRIO (nome fictício) — convés corrido ampliado, ilha a boreste, ala aérea de 24 (≤14 no ar, resto em fila no hangar), defesa própria CIWS/SAM/laser. Jogável e bot no modo personalizado; IA normal não usa (lendário). */
CLASSES.atlantico = D('capitania', 'atlantico', { nome: 'Super Porta-Aviões Atlântico', classe: 'Classe Atlântico', nomeOriginal: 'Super Porta-Aviões Atlântico (original)', num: 'L 08', premium: 1, lendario: 1, supremo: 1,
  papel: 'Ala aérea de 24 aeronaves (caças Gavião, VTOL, helicópteros Tufão e ASW) — LANÇAR ESQUADRILHA; defesa por 16 SAM de autodefesa (2 lançadores de 8 células em patrocínios), 4 CIWS, 4 reparos de 30 mm e 2 lasers, mais a patrulha aérea de combate',
  L: 336, B: 44, T: 11.5, F: 17, vmax: 15.4, acel: 0.42, giro: 0.42, vida: VIDA(1500), blind: 2.2, rcs: 2.4, desl: 104000, canhao: CAN({ cal: 57, V0: 1000, cad: 0.55, dano: 4.8, alc: 8500, torres: 2, canos: 1, som: 'rapido', frenteDupla: 0, embutido: 1 }),
  vls: 0, missil: 'medio', salva: 0, sam: 16, ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 4, torp: 0, tubos: [0, 0], laser: 2, heli: 24, maxAr: 14, /* v1.2.17 item 7: 2×8 células SAM de autodefesa em patrocínios */
  helisPadrao: ['caca', 'caca', 'caca', 'caca', 'caca', 'caca', 'caca', 'caca', 'jato', 'jato', 'jato', 'jato', 'caca', 'caca', 'tufao', 'tufao', 'tufao', 'asw', 'asw', 'jato', 'caca', 'caca', 'utilitario', 'tufao'], porta: 'pa', couracado: 0, estilo: 'capitania', pf: 'capitania' });
adiciona1225(CLASSES, { D, CAN, VIDA }); adiciona1226(CLASSES, { D, CAN, VIDA }); adiciona1231(CLASSES, { D, CAN, VIDA }); /* v1.2.31 */ /* v1.2.26: 8 navios premium */ /* v1.2.25 itens 12/14: Jalapão, Ilha Grande, Pantanal, Serra do Mar, Abrolhos, Costa Verde */
/* v1.2.18 item 14/14b/14c/14d: SETE CRUZEIROS PESADOS (projetos ORIGINAIS inspirados num cruzeiro multimissão moderno; nomes do Valter).
   Mais fortes que a referência, com torres EXTRAS na proa e na popa, cada um com layout/calibre/mísseis/defesa/pintura próprios.
   Antiaérea como na referência: SAM de longo alcance em VLS vertical + defesa de ponto 30 mm combinada (CIWS) e reparos de 30 mm — tudo AUTOMÁTICO (defesa.js).
   Secundárias automáticas (14d): canhão automático de 100 mm por bordo + canhões leves de borda, balística real (secundarias.js), no AUTO-FOGO de canhões. */
export const SEC = {
  c100: { nome: 'Canhão automático 100 mm', cal: 100, V0: 880, cad: 0.75, dano: 7, alc: 9000, disp: 0.9, giro: 1.0 },
  c30: { nome: 'Canhão leve 30 mm', cal: 30, V0: 960, cad: 0.5, dano: 1.4, alc: 3000, disp: 1.2, giro: 2.2 },
  m127: { nome: 'Metralhadora pesada 12,7 mm', cal: 12.7, V0: 890, cad: 0.4, dano: 0.55, alc: 1800, disp: 1.4, giro: 2.6 },
};
const SECS = (n100, nL, leve = 'c30') => [{ arma: SEC.c100, n: n100 }, { arma: SEC[leve], n: nL }];
const ASW300 = (o) => Object.assign({ nome: 'LG-30 Abissal', salvas: 8, foguetes: 12, alc: 5000, min: 600, dano: 30, cad: 12, el: 0.8 }, o); /* lança-granadas ASW de 300 mm (nome original) */
const CRZ = (o) => D('zarev', o.id, Object.assign({ premium: 1, lendario: 1, T: 9.6, F: 9.4, acel: 0.55, giro: 0.55, rcs: 1.45, ciwsLug: [0, 2, 3, 5, 6] /* v1.2.18: o lugar 1 (a ré) é da torre superelevada */, tubos: [1, 4], couracado: 0, baterias: 1, vlsSup: 0, laser: 0, pf: 'capitania', nacao: 'BRA', cruzeiroPesado: 1 }, o, { canhao: CAN(Object.assign({ frenteDupla: 0, embutido: 0, salva: 1, rajada: 1 }, o.canhao)) }));
Object.assign(CLASSES, {
  kelly: CRZ({ id: 'kelly', ciwsLug: [2, 3, 5, 6], nome: 'Capitã Kelly', classe: 'Classe Capitã Kelly', nomeOriginal: 'Cruzeiro Pesado Capitã Kelly (original)', num: 'L 11', papel: 'Cruzeiro pesado lendário: 4 torres triplas de 280 mm (2 à vante, 2 à ré), 20 VLS inclinados antinavio, 48 SAM de longo alcance, 4 CIWS 30 mm, 2 canhões automáticos de 100 mm, torpedos, lança-granadas ASW e 2 helicópteros',
    L: 292, B: 35, vmax: 14.2, vida: VIDA(860), blind: 2.05, desl: 37000, canhao: { cal: 280, V0: 870, cad: 4.4, dano: 44, alc: 15500, disp: 0.82, torres: 4, canos: 3 }, vls: 20, missil: 'longo', misseis: ['longo', 'rasante'], salva: 4, sam: 48, ciws: 4, a30: 2, torp: 8, heli: 2, sec: SECS(2, 4), rbu: ASW300({}), estilo: 'rus' }),
  laiane: CRZ({ id: 'laiane', nome: 'Capitã Laiane', classe: 'Classe Capitã Laiane', nomeOriginal: 'Cruzeiro Pesado Capitã Laiane (original)', num: 'L 12', papel: 'Cruzeiro pesado lendário: 5 torres triplas de 280 mm (3 à vante, 2 à ré), 24 VLS (cruzeiro + longo), 40 SAM, 5 CIWS, 100 mm automáticos, metralhadoras de borda, torpedos e helicóptero',
    L: 298, B: 35.5, vmax: 13.8, vida: VIDA(900), blind: 2.1, desl: 39000, canhao: { cal: 280, V0: 870, cad: 4.6, dano: 44, alc: 15500, disp: 0.84, torres: 5, canos: 3 }, vls: 24, missil: 'cruzeiro', misseis: ['cruzeiro', 'longo'], salva: 4, sam: 40, ciws: 5, a30: 2, torp: 8, heli: 1, sec: SECS(2, 4, 'm127'), rbu: ASW300({ salvas: 7 }), estilo: 'chn', baterias: 0 }),
  klevton: CRZ({ id: 'klevton', ciwsLug: [2, 3, 5, 6], nome: 'Almirante Klevton', classe: 'Classe Almirante Klevton', nomeOriginal: 'Cruzeiro Pesado Almirante Klevton (original)', num: 'L 13', papel: 'Cruzeiro pesado lendário: 4 torres QUÁDRUPLAS de 280 mm (16 canos), 32 VLS (hipersônico + longo), 48 SAM, 4 CIWS, 4 reparos de 30 mm, 100 mm automáticos, torpedos e 2 helicópteros',
    L: 296, B: 36, vmax: 13.6, vida: VIDA(920), blind: 2.15, desl: 40000, canhao: { cal: 280, V0: 860, cad: 4.8, dano: 43, alc: 15200, disp: 0.86, torres: 4, canos: 4 }, vls: 32, missil: 'longo', misseis: ['longo', 'hiper'], salva: 4, sam: 48, ciws: 4, a30: 4, torp: 10, tubos: [1, 5], heli: 2, sec: SECS(2, 4), rbu: ASW300({ foguetes: 14 }), estilo: 'rus' }),
  ananery: CRZ({ id: 'ananery', nome: 'Capitã Ana Nery', classe: 'Classe Capitã Ana Nery', nomeOriginal: 'Cruzeiro Pesado Capitã Ana Nery (original)', num: 'L 14', papel: 'Cruzeiro pesado lendário de escolta: 4 torres triplas de 305 mm, 20 VLS (rasante + cruzeiro), 56 SAM de longo alcance, 5 CIWS, 4 reparos de 30 mm, 100 mm automáticos e 2 helicópteros',
    L: 288, B: 35, vmax: 14.0, vida: VIDA(880), blind: 2.05, desl: 38000, canhao: { cal: 305, V0: 820, cad: 4.8, dano: 49, alc: 15800, disp: 0.86, torres: 4, canos: 3 }, vls: 20, missil: 'rasante', misseis: ['rasante', 'cruzeiro'], salva: 4, sam: 56, ciws: 5, a30: 4, torp: 8, heli: 2, sec: SECS(2, 6), rbu: ASW300({ salvas: 7 }), estilo: 'capitania', baterias: 0, antiAereo: 1 }),
  trajano: CRZ({ id: 'trajano', nome: 'Rei Trajano', classe: 'Classe Rei Trajano', nomeOriginal: 'Super Cruzeiro Pesado Rei Trajano (original)', num: 'SL 01', superLend: 1, papel: 'Super lendário: 6 torres triplas de 305 mm (3 à vante, 3 à ré, 18 canos), 40 VLS (hipersônico/cruzeiro/longo), 64 SAM, 5 CIWS, 4 reparos de 30 mm, 100 mm automáticos, canhões leves de borda, 12 torpedos e 2 helicópteros',
    L: 318, B: 38, T: 10.4, F: 10, vmax: 13.4, acel: 0.5, giro: 0.5, vida: VIDA(1240), blind: 2.55, rcs: 1.6, desl: 52000, canhao: { cal: 305, V0: 830, cad: 4.9, dano: 50, alc: 16500, disp: 0.84, torres: 6, canos: 3 }, vls: 40, missil: 'longo', misseis: ['hiper', 'cruzeiro', 'longo'], salva: 6, sam: 64, ciws: 5, a30: 4, torp: 12, tubos: [2, 3], heli: 2, sec: SECS(2, 6), rbu: ASW300({ nome: 'LG-30 Abissal Pesado', salvas: 9, foguetes: 16, dano: 33, cad: 11 }), estilo: 'rus' }),
  leidevaldo: CRZ({ id: 'leidevaldo', nome: 'Almirante Leidevaldo', classe: 'Classe Almirante Leidevaldo', nomeOriginal: 'Super Cruzeiro Pesado Almirante Leidevaldo (original)', num: 'SL 02', superLend: 1, papel: 'Super lendário: 5 torres QUÁDRUPLAS de 280 mm (20 canos), 48 VLS (cruzeiro/hipersônico/rasante), 64 SAM, 5 CIWS, 4 reparos de 30 mm, 100 mm automáticos, metralhadoras de borda, torpedos e 2 helicópteros',
    L: 312, B: 37.5, T: 10.2, F: 9.8, vmax: 13.2, acel: 0.5, giro: 0.5, vida: VIDA(1200), blind: 2.5, rcs: 1.58, desl: 50000, canhao: { cal: 280, V0: 865, cad: 5.0, dano: 43, alc: 16000, disp: 0.85, torres: 5, canos: 4 }, vls: 48, missil: 'cruzeiro', misseis: ['cruzeiro', 'hiper', 'rasante'], salva: 6, sam: 64, ciws: 5, a30: 4, torp: 10, tubos: [1, 5], heli: 2, sec: SECS(2, 6, 'm127'), rbu: ASW300({ nome: 'LG-30 Abissal Pesado', salvas: 9, foguetes: 16, dano: 33, cad: 11 }), estilo: 'chn', baterias: 0 }),
  ronaldo: CRZ({ id: 'ronaldo', nome: 'Almirante Ronaldo', classe: 'Classe Almirante Ronaldo', nomeOriginal: 'Super Cruzeiro Pesado Almirante Ronaldo (original)', num: 'SL 03', superLend: 1, papel: 'Super lendário rápido: 5 torres triplas de 305 mm (3 à vante, 2 à ré), 56 VLS (longo/hipersônico/cruzeiro), 72 SAM de longo alcance, 5 CIWS, 4 reparos de 30 mm, 100 mm automáticos, canhões leves, torpedos e 2 helicópteros',
    L: 306, B: 36.5, T: 10, F: 9.8, vmax: 14.8, acel: 0.6, giro: 0.56, vida: VIDA(1160), blind: 2.45, rcs: 1.52, desl: 47000, canhao: { cal: 305, V0: 835, cad: 4.8, dano: 49, alc: 16300, disp: 0.84, torres: 5, canos: 3 }, vls: 56, missil: 'longo', misseis: ['longo', 'hiper', 'cruzeiro'], salva: 6, sam: 72, ciws: 5, a30: 4, torp: 10, tubos: [1, 5], heli: 2, sec: SECS(2, 6), rbu: ASW300({ salvas: 8, foguetes: 14 }), estilo: 'capitania', antiAereo: 1 }),
  /* v1.2.33: dois SUPER LENDÁRIOS novos (almirantes da Marinha do Brasil) */
  tamandare: CRZ({ id: 'tamandare', nome: 'Almirante Tamandaré', classe: 'Classe Almirante Tamandaré', nomeOriginal: 'Super Encouraçado de Mísseis Almirante Tamandaré (original)', num: 'SL 04', superLend: 1, papel: 'Super lendário pesado: 4 torres triplas de 406 mm (12 canos), 64 VLS (hipersônico/cruzeiro/longo), 80 SAM de longo alcance, 6 CIWS, 4 reparos de 30 mm, 100 mm automáticos, torpedos e 2 helicópteros',
    L: 330, B: 40, T: 10.8, F: 10.4, vmax: 13.6, acel: 0.48, giro: 0.48, vida: VIDA(1320), blind: 2.65, rcs: 1.65, desl: 58000, canhao: { cal: 406, V0: 800, cad: 5.4, dano: 62, alc: 17500, disp: 0.84, torres: 4, canos: 3 }, vls: 64, missil: 'hiper', misseis: ['hiper', 'cruzeiro', 'longo'], salva: 6, sam: 80, ciws: 6, ciwsLug: [0, 2, 3, 5, 6, 4], a30: 4, torp: 12, tubos: [2, 3], heli: 2, sec: SECS(2, 6), rbu: ASW300({ nome: 'LG-30 Abissal Pesado', salvas: 10, foguetes: 16, dano: 34, cad: 11 }), estilo: 'capitania', antiAereo: 1 }),
  barroso: CRZ({ id: 'barroso', nome: 'Almirante Barroso', classe: 'Classe Almirante Barroso', nomeOriginal: 'Super Cruzador de Ataque Almirante Barroso (original)', num: 'SL 05', superLend: 1, papel: 'Super lendário de ataque rápido: 5 torres QUÁDRUPLAS de 280 mm (20 canos), 72 VLS (hipersônico/rasante/longo), 72 SAM, 5 CIWS, 4 reparos de 30 mm, 100 mm automáticos, torpedos e 2 helicópteros — o mais rápido dos super lendários',
    L: 308, B: 36, T: 9.8, F: 9.6, vmax: 16.2, acel: 0.66, giro: 0.6, vida: VIDA(1180), blind: 2.45, rcs: 1.48, desl: 46000, canhao: { cal: 280, V0: 870, cad: 4.6, dano: 44, alc: 16200, disp: 0.83, torres: 5, canos: 4 }, vls: 72, missil: 'hiper', misseis: ['hiper', 'rasante', 'longo'], salva: 6, sam: 72, ciws: 5, a30: 4, torp: 10, tubos: [1, 5], heli: 2, sec: SECS(2, 6, 'm127'), rbu: ASW300({ salvas: 9, foguetes: 14 }), estilo: 'rus', baterias: 0 }),
});
/* v1.2.33: cruzador lendário russo no estilo do real Admiral Isakov (projeto 1134A, Kresta II — 159 m), modernizado */
CLASSES.isakov = D('cruzador', 'isakov', { nome: 'Cruzador de Mísseis Almirante Isakov', classe: 'Classe Kresta II modernizada (proj. 1134A)', nomeOriginal: 'Адмирал Исаков (Admiral Isakov)', num: '546', premium: 1, lendario: 1,
  papel: 'Lendário russo de 159 m e 34 nós: 2 torres duplas de 57 mm, 16 VLS Kalibr (cruzeiro/longo), 48 SAM Shtorm modernizados, 4 CIWS AK-630, 10 torpedos em 2 tubos quíntuplos, 2 lança-foguetes RBU e helicóptero de convoo à ré',
  L: 159, B: 17, T: 6, F: 7.2, vmax: 15.4 /* ×1,17 = 18 m/s ≈ 35 nós */, acel: 0.9, giro: 0.9, vida: VIDA(560), blind: 1.7, rcs: 0.85, radar: 17000, desl: 7535,
  canhao: { cal: 57, V0: 1000, cad: 0.45, dano: 6, alc: 8000, disp: 0.7, torres: 2, canos: 2, rajada: 2, som: 'rapido' }, vls: 16, missil: 'cruzeiro', misseis: ['cruzeiro', 'longo'], salva: 4, sam: 48, ciws: 4, ciwsLug: [2, 3, 5, 6], a30: 0, torp: 10, tubos: [1, 5], heli: 1,
  rbu: { nome: 'RBU-6000 Smerch', salvas: 10, foguetes: 12, alc: 5800, min: 300, dano: 28, cad: 13, el: 0.62 }, estilo: 'rus', antiAereo: 1, pf: 'ataque' });
export const CRUZEIROS_1218 = ['kelly', 'laiane', 'klevton', 'ananery', 'trajano', 'leidevaldo', 'ronaldo', 'tamandare', 'barroso'];
for (const k of CRUZEIROS_1218) CLASSES[k].antiAereo = 1;
for (const k of ['kordao', 'estrelar', 'horizonte', 'atlantico']) delete CLASSES[k].rbu;
/* v1.2.11: NAVIO MERCANTE (porta-contêineres; não combatente, só metralhadora de autodefesa). Escoltado; afundar o do inimigo dá pontos e troféu. */
CLASSES.mercante = D('corveta', 'mercante', { nome: 'Navio Mercante', classe: 'Porta-contêineres', nomeOriginal: 'Porta-contêineres', num: 'M', papel: 'Comboio: carga da frota (não combatente)', L: 168, B: 26, T: 8.5, F: 7, vmax: 9.5, acel: 0.35, giro: 0.4, vida: VIDA(520) /* v1.2.12: casco grande aguenta mais (fica em jogo) */, blind: 0.7, rcs: 1.6, radar: 9000, desl: 22000,
  canhao: { cal: 20, V0: 1050, cad: 0.6, dano: 0.6, alc: 1500, disp: 1.6, torres: 1, canos: 1, rajada: 1, som: 'rapido', embutido: 1, frenteDupla: 0 }, vls: 0, missil: 'curto', salva: 0, sam: 0, torp: 0, tubos: [0, 0], ciws: 0, a30: 0, chaff: 2, heli: 0, mercante: 1, casco: 'convencional', estilo: 'mercante', pf: 'batedor' });
delete CLASSES.mercante.rbu;
/* v1.2.11: LASER e defesa ANTIAÉREA dedicada em alguns navios existentes */
for (const k of ['monolito', 'warden', 'aurora', 'fenghuang', 'zarev']) CLASSES[k].laser = 1;
for (const k of ['warden', 'monolito', 'leviata', 'aurora', 'redwood', 'sentinela', 'horizonte', 'volkhar', 'baluarte', 'kordao', 'estrelar', 'colosso', 'marcos', 'rodolfo', 'antonia', 'atlantico']) CLASSES[k].antiAereo = 1;
/** Nação (bandeira nas laterais), tier e pintura de fábrica de cada classe. Os navios originais 1.0/1.1 são da Marinha do Brasil. */
export const NACOES = { BRA: 'Brasil', EUA: 'Estados Unidos', CHN: 'China', RUS: 'Rússia', UK: 'Reino Unido', ITA: 'Itália' };
const META = { kestrel: ['EUA', 1, 'eua'], redwood: ['EUA', 2, 'eua'], monolito: ['EUA', 3, 'eua'], haiyan: ['CHN', 1, 'chn'], jinpeng: ['CHN', 2, 'chn'], tianlong: ['CHN', 2, 'chn'], xuanwu: ['CHN', 3, 'chn'],
  strizh: ['RUS', 1, 'artica'], sokol: ['RUS', 2, 'artica'], medved: ['RUS', 3, 'artica'], zarev: ['RUS', 3, 'rus_cinza'], sapsan: ['RUS', 2, 'premium_oceano'], trovao: ['BRA', 3, 'faixas_nexo'], fenghuang: ['CHN', 3, 'premium_noite'], puffin: ['UK', 1, 'uk_escura'], thornwood: ['UK', 2, 'uk_escura'], warden: ['UK', 3, 'uk_escura'],
  corveta: ['BRA', 1, 'bra'], corsario: ['BRA', 1, 'premium_noite'], fragata: ['BRA', 2, 'bra'], destroier: ['BRA', 2, 'bra'], furtivo: ['BRA', 2, 'bra_escura'],
  tempestade: ['RUS', 2, 'artica'], sentinela: ['UK', 2, 'uk_escura'], tridente: ['EUA', 2, 'eua'], leviata: ['UK', 2, 'premium_oceano'],
  volkhar: ['RUS', 4, 'lend_grafite'], baluarte: ['EUA', 4, 'lend_aco'], kordao: ['RUS', 4, 'lend_grafite'], estrelar: ['RUS', 4, 'lend_ardosia'], colosso: ['BRA', 4, 'lend_titanio'], atlantico: ['BRA', 4, 'lend_aco'], marcos: ['ITA', 4, 'lend_italia'], rodolfo: ['BRA', 4, 'lend_aco'], antonia: ['BRA', 4, 'lend_ardosia'], kelly: ['BRA', 4, 'cruz_vermelho'], laiane: ['BRA', 4, 'lend_aco'], klevton: ['BRA', 4, 'lend_grafite'], ananery: ['BRA', 4, 'lend_ardosia'], trajano: ['BRA', 4, 'slend_rubi'], leidevaldo: ['BRA', 4, 'slend_negro'], ronaldo: ['BRA', 4, 'slend_azul'], tamandare: ['BRA', 4, 'slend_safira'], barroso: ['BRA', 4, 'slend_negro'], isakov: ['RUS', 4, 'lend_grafite'], /* v1.2.33 */ horizonte: ['BRA', 3, 'bra'], mercante: ['BRA', 1, 'cinza_naval'],
  cruzador: ['BRA', 3, 'bra'], dragao: ['CHN', 3, 'chn'], capitania: ['BRA', 3, 'bra'], aurora: ['EUA', 3, 'premium_dourada'] };
Object.assign(META, META_1225, META_1226, META_1231); /* v1.2.25 + v1.2.26 */
for (const k in META) { const [nacao, tier, pintura] = META[k]; Object.assign(CLASSES[k], { nacao, tier, pintura, premium: CLASSES[k].premium || 0 }); }
/* v1.2.7: escola de CASCO por nação (geometria procedural original; L/B/T, hitbox e pontos de flutuação não mudam). EUA: tumblehome perfurador de ondas em todos os navios. */
const CASCO_NAC = { EUA: 'eua', CHN: 'chn', RUS: 'rus', UK: 'uk', BRA: 'bra' };
for (const k in CLASSES) { const C = CLASSES[k]; if (!C.L) continue; const fort = ((C.canhao && C.canhao.torres >= 3) || C.couracado) && !C.eletroCasco /* v1.2.26: arsenal/cruzador eletromagnético usam casco moderno */; C.cascoN = C.cascoFixo ? C.cascoFixo : fort ? 'classico' : C.L < 100 ? 'corv' : CASCO_NAC[C.nacao] || 'bra'; if (C.cascoN === 'eua') C.casco = 'tumblehome'; }
const ORIGINAL = { tridente: 'Trident-class DDG', aurora: 'Aurora-class CG (premium)', dragao: '龙威 Longwei', tempestade: 'Гроза (Groza)', sentinela: 'Sentinel-class DDG', leviata: 'Cachalote-class FF (premium)' };
/* v1.2.5: LANÇA-GRANADAS / foguetes de curto alcance (≤ 4 km, salva em arco, área na água e no navio, recarga ~15 s) em corvetas, destróieres leves e couraçados */
export const GRANADAS = { nome: 'LG-4 Granizo', salvas: 10, foguetes: 8, alc: 5500, min: 300, dano: 30, cad: 14, el: 0.62 }; /* v1.2.11: dano 24→30, recarga 15→14 s, foguetes em arco semiguiados */ /* v1.2.9: dano 19→24 */
for (const k of ['corveta', 'kestrel', 'haiyan', 'strizh', 'puffin', 'corsario', 'destroier', 'sentinela', 'capitania', 'trovao']) if (CLASSES[k] && !CLASSES[k].rbu) CLASSES[k].rbu = Object.assign({}, GRANADAS);
for (const k in CLASSES) if (!CLASSES[k].nomeOriginal) CLASSES[k].nomeOriginal = ORIGINAL[k] || CLASSES[k].classe; // brasileiros: nome original em português
// ---------- PREMIUM 15–25% mais fortes que o navio de linha equivalente (mesmo tier e função) ----------
/** Índice de poder de combate (casco, fogo de canhão por minuto, salva de mísseis, defesa aérea, mobilidade). */
export function poderNavio(C) { const cn = C.canhao; let dps = (cn.dano * (cn.torres || 1) * (cn.canos || 1) * (cn.rajada || 1)) / cn.cad; for (const g of C.sec || []) dps += g.arma.dano * g.n * 0.5 / g.arma.cad; /* v1.2.18: secundárias (metade: só pelo través/curto alcance) */ const mis = (C.vls || 0) * (MISSEIS[C.missil] || MISSEIS.curto).dano; const def = (C.sam || 0) * 1.5 + (C.ciws || 0) * 6 + (C.a30 || 0) * 2;
  return { casco: C.vida * (C.blind || 1), fogo: dps * 60, missil: mis, defesa: def, mob: C.vmax }; }
const PESO = { casco: 0.36, fogo: 0.28, missil: 0.2, defesa: 0.1, mob: 0.06 };
export function razaoPoder(C, R) { const a = poderNavio(C), b = poderNavio(R); let t = 0; for (const k in PESO) t += PESO[k] * (b[k] > 0 ? Math.min(2.5, a[k] / b[k]) : 1); return t; }
export const REF_PREMIUM = { corsario: 'corveta', leviata: 'fragata', sapsan: 'tempestade', aurora: 'cruzador', fenghuang: 'dragao' };
export const ALVO_PREMIUM = 1.2; // +20% (faixa pedida 15–25%)
for (const [k, ref] of Object.entries(REF_PREMIUM)) { const C = CLASSES[k], R = CLASSES[ref]; for (let it = 0; it < 12; it++) { const r = razaoPoder(C, R); if (Math.abs(r - ALVO_PREMIUM) < 0.004) break; const f = Math.pow(ALVO_PREMIUM / r, 0.9); C.vida = Math.round(C.vida * f); C.canhao = Object.assign({}, C.canhao, { dano: +(C.canhao.dano * f).toFixed(2) }); } }
export const ORDEM_CLASSES = ['corveta', 'corsario', 'kestrel', 'haiyan', 'strizh', 'puffin', 'fragata', 'destroier', 'furtivo', 'tempestade', 'sentinela', 'tridente', 'redwood', 'jinpeng', 'tianlong', 'sokol', 'thornwood', 'leviata', 'sapsan', 'cruzador', 'dragao', 'capitania', 'trovao', 'monolito', 'xuanwu', 'medved', 'warden', 'aurora', 'fenghuang', 'zarev', 'horizonte', 'volkhar', 'baluarte', 'kordao', 'estrelar', 'colosso', 'antonia', 'rodolfo', 'marcos', 'atlantico', 'kelly', 'laiane', 'klevton', 'ananery', 'trajano', 'leidevaldo', 'ronaldo', 'tamandare', 'barroso', 'isakov', ...IDS_1225, ...IDS_1226, ...IDS_1231]; /* v1.2.26 */
export const LENDARIOS = ['volkhar', 'baluarte', 'kordao', 'estrelar', 'colosso', 'antonia', 'rodolfo', 'marcos', 'atlantico', 'kelly', 'laiane', 'klevton', 'ananery', 'trajano', 'leidevaldo', 'ronaldo', 'tamandare', 'barroso', 'isakov', 'abrolhos', 'costaverde', ...IDS_1226, ...IDS_1231];
export const SUPER_LENDARIOS = ['trajano', 'leidevaldo', 'ronaldo', 'tamandare', 'barroso', ...SUPER_LEND_1226]; /* v1.2.33: + Tamandaré e Barroso */ /* v1.2.18: nova raridade acima de lendário */
/** Navios por nação (5+ projetos cada). */
export const POR_NACAO = () => { const o = {}; for (const k of ORDEM_CLASSES) (o[CLASSES[k].nacao] = o[CLASSES[k].nacao] || []).push(k); return o; };
/** As 5 escolas nacionais pedidas (vitrine do estaleiro). */
export const NAVIOS_NACAO = ['tridente', 'dragao', 'tempestade', 'sentinela', 'destroier'];
export const TELEG = ['Atrás', 'Parado', '1/3', '2/3', 'Toda'];
export const FTEL = [-0.38, 0, 1 / 3, 2 / 3, 1];
export const LEME_MAX = 35 / 57.29578;
