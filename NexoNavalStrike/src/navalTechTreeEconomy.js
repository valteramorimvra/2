import { NOMES_PADRAO } from './sim/nomes.js';
import { CAMO_AEREO } from './camoAereo.js';
// Economia OFFLINE (perfil local) e árvore tecnológica do Nexo Naval Strike 3D.
// Moedas: PRATA (ganha em batalha; compra navios de linha, módulos, propulsão, manutenção e pinturas comuns),
// OURO (ganho raro em batalha + reserva DEV; compra navios PREMIUM, munição perfurante pesada, mísseis tandem, iscas ouro
// e pinturas especiais) e PESQUISA (pontos de experiência por navio: libera o próximo navio de linha na árvore).
// Nenhuma compra com dinheiro real nesta versão: não há billing, rede nem servidor.
import { CLASSES, ORDEM_CLASSES, HELIS } from './sim/classes.js';
import { CONS, ORDEM_CONS } from './naval5v5/consumiveis.js';
import { COMANDANTES, aplicaComandante, xpPara, NIVEL_MAX } from './navalComandantes.js';
import { medalhasDe } from './navalTrofeus.js';

/** ÚNICO lugar da reserva de desenvolvimento pedida pelo Valter (perfil inicial grande). Desligue com ativo:false. */
export const DEV_ECONOMY = { ativo: true, prata: 100_000_000, ouro: 1_000_000, pesquisa: 0, versao: 3, lotesCons: 99 }; // v2 (1.2.0): 100M prata / 1M ouro · v3: consumíveis de recuperação comprados em quantidade

// ---------- árvore: pai → filhos (navios de LINHA). Premium não entram na pesquisa. ----------
export const ARVORE = {
  corveta: ['fragata', 'destroier'],
  fragata: ['sentinela', 'tempestade'],
  destroier: ['furtivo'],
  furtivo: ['tridente'],
  sentinela: ['cruzador'], tempestade: ['cruzador'],
  tridente: ['dragao'],
  cruzador: ['capitania'], capitania: ['trovao'],
  // linhas nacionais (v1.2.0 revisão): tier 1 nacional → tier 2 → tier 3 da mesma marinha
  kestrel: ['redwood', 'tridente'], redwood: ['monolito'],
  haiyan: ['jinpeng', 'tianlong'], tianlong: ['xuanwu', 'dragao'], jinpeng: ['dragao'],
  strizh: ['tempestade', 'sokol'], sokol: ['medved'], medved: ['zarev'],
  puffin: ['sentinela', 'thornwood'], thornwood: ['warden'],
};
ARVORE.capitania.push('horizonte'); ARVORE.corveta.push('jalapao'); ARVORE.jalapao = ['ilhagrande', 'pantanal']; ARVORE.ilhagrande = ['serramar']; ARVORE.pantanal = ['serramar']; /* v1.2.25 item 14 */ ARVORE.corveta.push('kestrel', 'haiyan', 'strizh', 'puffin'); ARVORE.tridente.push('monolito'); ARVORE.tempestade.push('medved'); ARVORE.sentinela.push('warden');
export const PAIS = {}; for (const [p, fs] of Object.entries(ARVORE)) for (const f of fs) (PAIS[f] = PAIS[f] || []).push(p);
/** Preços: linha em PRATA + pesquisa necessária; premium em OURO. */
export const PRECO = {
  sejong: { ouro: 98_000 }, nanchang: { ouro: 112_000 }, nakhimov: { ouro: 145_000 }, /* v1.2.31 (preço aprovado pelo Valter 03:06) */
  jalapao: { prata: 320_000, pesquisa: 6_200 }, ilhagrande: { prata: 1_320_000, pesquisa: 25_500 }, pantanal: { prata: 1_380_000, pesquisa: 26_500 }, serramar: { prata: 3_600_000, pesquisa: 69_000 }, abrolhos: { ouro: 96_000 }, /* v1.2.26 */ ilhabela: { ouro: 44_000 }, jericoacoara: { ouro: 47_000 }, aparados: { ouro: 49_000 }, itatiaia: { ouro: 52_000 }, neblina: { ouro: 89_000 }, canastra: { ouro: 92_000 }, chapada: { ouro: 118_000 }, lencois: { ouro: 122_000 }, costaverde: { ouro: 98_000 }, /* v1.2.25 */
  corveta: { prata: 0, pesquisa: 0 },
  fragata: { prata: 420_000, pesquisa: 8_000 }, destroier: { prata: 480_000, pesquisa: 9_000 },
  furtivo: { prata: 1_150_000, pesquisa: 22_000 }, sentinela: { prata: 1_250_000, pesquisa: 24_000 }, tempestade: { prata: 1_200_000, pesquisa: 23_000 },
  tridente: { prata: 2_400_000, pesquisa: 45_000 },
  cruzador: { prata: 3_100_000, pesquisa: 60_000 }, dragao: { prata: 3_600_000, pesquisa: 70_000 }, capitania: { prata: 4_800_000, pesquisa: 95_000 },
  kestrel: { prata: 300_000, pesquisa: 6_000 }, haiyan: { prata: 280_000, pesquisa: 5_500 }, strizh: { prata: 290_000, pesquisa: 5_800 }, puffin: { prata: 270_000, pesquisa: 5_400 },
  redwood: { prata: 1_300_000, pesquisa: 25_000 }, jinpeng: { prata: 1_150_000, pesquisa: 22_000 }, tianlong: { prata: 1_400_000, pesquisa: 27_000 }, sokol: { prata: 1_350_000, pesquisa: 26_000 }, thornwood: { prata: 1_300_000, pesquisa: 25_000 },
  monolito: { prata: 3_500_000, pesquisa: 68_000 }, xuanwu: { prata: 4_600_000, pesquisa: 90_000 }, medved: { prata: 3_700_000, pesquisa: 70_000 }, warden: { prata: 3_400_000, pesquisa: 66_000 },
  corsario: { ouro: 3_500 }, leviata: { ouro: 8_500 }, sapsan: { ouro: 9_000 }, aurora: { ouro: 16_000 }, trovao: { prata: 5_400_000, pesquisa: 105_000 }, zarev: { prata: 4_900_000, pesquisa: 96_000 }, fenghuang: { ouro: 15_000 },
  volkhar: { ouro: 40_000 }, baluarte: { ouro: 42_000 }, kordao: { ouro: 38_000 }, estrelar: { ouro: 30_000 }, colosso: { ouro: 60_000 }, antonia: { ouro: 72_000 }, atlantico: { ouro: 95_000 }, rodolfo: { ouro: 78_000 }, marcos: { ouro: 90_000 }, /* v1.2.16 lendários supremos */ kelly: { ouro: 46_000 }, laiane: { ouro: 48_000 }, klevton: { ouro: 50_000 }, ananery: { ouro: 47_000 }, trajano: { ouro: 88_000 }, leidevaldo: { ouro: 85_000 }, ronaldo: { ouro: 84_000 }, /* v1.2.18: cruzeiros pesados (lendários 46–50 mil; super lendários 84–88 mil) */ horizonte: { prata: 5_200_000, pesquisa: 100_000 }, /* v1.2.11 LENDÁRIOS (ouro) */
};
/** Bônus de prata por batalha dos premium. Além disso os premium são 15–25% (alvo +20%) mais fortes que o navio de linha equivalente (classes.js: REF_PREMIUM/razaoPoder). */
export const BONUS_PREMIUM = { sejong: 1.5, nanchang: 1.55, nakhimov: 1.7, /* v1.2.31 */ abrolhos: 1.5, costaverde: 1.5, /* v1.2.25 */ ilhabela: 1.0, jericoacoara: 1.05, aparados: 1.05, itatiaia: 1.1, neblina: 1.4, canastra: 1.42, chapada: 1.6, lencois: 1.6, /* v1.2.26 */ corsario: 0.5, leviata: 0.6, sapsan: 0.6, aurora: 0.75, fenghuang: 0.75, volkhar: 1, baluarte: 1, kordao: 1, estrelar: 0.9, colosso: 1.2, antonia: 1.3, atlantico: 1.5, rodolfo: 1.35, marcos: 1.5, kelly: 1.05, laiane: 1.05, klevton: 1.1, ananery: 1.05, trajano: 1.4, leidevaldo: 1.38, ronaldo: 1.36 };
/** Navios entregues de fábrica (os da 1.0/1.1 continuam acessíveis como antes). */
const INICIAIS = ['corveta', 'fragata', 'destroier', 'furtivo', 'cruzador', 'capitania'];

// ---------- módulos (PRATA): efeitos multiplicativos aplicados ao navio do jogador na criação da partida ----------
export const MODULOS = {
  radar_aesa: { nome: 'Radar AESA', desc: '+15% alcance de radar, trava 30% mais rápida', prata: 180_000, ef: { radar: 1.15, trava: 1.3 } },
  vls_extra: { nome: 'Células VLS extras', desc: '+4 células antinavio', prata: 240_000, ef: { vlsMais: 4 } },
  turbinas: { nome: 'Turbinas de gás', desc: '+6% velocidade máxima, +12% aceleração', prata: 210_000, ef: { vmax: 1.06, acel: 1.12 } },
  leme_hidraulico: { nome: 'Leme hidráulico', desc: '+10% taxa de giro', prata: 120_000, ef: { giro: 1.1 } },
  controle_avarias: { nome: 'Controle de avarias', desc: 'incêndio e alagamento duram 25% menos', prata: 150_000, ef: { avarias: 0.75 } },
  carregador: { nome: 'Carregador automático', desc: '−8% tempo de recarga do canhão', prata: 200_000, ef: { cad: 0.92 } },
};
/** Propulsão e manutenção (PRATA, por navio). */
export const PROPULSAO = [
  { nivel: 0, nome: 'Padrão', prata: 0, vmax: 1 }, { nivel: 1, nome: 'Revisada', prata: 90_000, vmax: 1.02 }, { nivel: 2, nome: 'Alto desempenho', prata: 260_000, vmax: 1.04 },
];
export const MANUTENCAO = { porHp: 22, minimo: 2_000 }; // custo de reparo pós-batalha (prata por % de casco perdido × tier)

// ---------- munição, mísseis, iscas e consumíveis (pré-batalha) ----------
export const MUNICOES = {
  he: { nome: 'Alto-explosivo (HE)', desc: 'chance de incêndio 18%, dano normal', custo: { prata: 0 }, ef: { dano: 1, fogo: 0.18, perf: 0 } },
  sap: { nome: 'Semiperfurante (SAP)', desc: '+10% dano, incêndio 12% — lote de 80 tiros (prata)', custo: { prata: 18_000 }, ef: { dano: 1.1, fogo: 0.12, perf: 0.5 } },
  ap: { nome: 'Perfurante pesada (AP)', desc: '+22% dano contra blindagem, incêndio 6% — munição OURO, lote de 80 tiros pago com PRATA', custo: { prata: 45_000 }, ef: { dano: 1.22, fogo: 0.06, perf: 1 } },
};
export const MISSEIS_OPC = {
  padrao: { nome: 'Antinavio padrão', desc: 'carga única', custo: { prata: 0 }, ef: { dano: 1, pkCiws: 1 } },
  tandem: { nome: 'Ogiva tandem', desc: '+25% dano e 15% mais difícil de abater — míssil OURO, 1 lote pago com PRATA', custo: { prata: 60_000 }, ef: { dano: 1.25, pkCiws: 0.85 } },
};
/** Capacidade de cada lote: o NÃO usado volta (lote inteiro ao paiol se intacto; senão reembolso proporcional na moeda do lote). */
export const LOTE_CAP = { sap: 80, ap: 80, tandem: 8, iscaOuro: 4, reparoOuro: 3 };
// consumíveis de recuperação: 1 lote = 1 partida (cargas = usos); chave c_<tipo>_<nível>
export const loteCons = (k, nv) => `c_${k}_${nv}`;
for (const k of ORDEM_CONS) for (const nv of ['prata', 'ouro']) LOTE_CAP[loteCons(k, nv)] = CONS[k][nv].usos;
export const CONS_PADRAO = { kit: 'prata', controle: 'prata', bomba: null, reparoHeli: null, abastece: null };
export const ISCAS = {
  padrao: { nome: 'Isca térmica padrão', desc: 'Flares térmicos + chaff: 85% de chance de desviar cada míssil travado (cargas limitadas)', custo: { prata: 0 }, ef: { pIsca: 0.85, cargasMais: 0 } },
  ouro: { nome: 'Isca térmica ouro', desc: 'Multiespectral: 95% de chance de desviar cada míssil, +2 cargas — 1 lote (ouro)', custo: { ouro: 50 }, ef: { pIsca: 0.95, cargasMais: 2 } },
};
export const CONSUMIVEIS = {
  reparo: { nome: 'Equipe de reparo', desc: 'apaga incêndio, estanca alagamento e repara 8% do casco (2 usos, recarga 60 s)', custo: { prata: 12_000 }, usos: 2 },
  reparo_ouro: { nome: 'Reparo de emergência ouro', desc: '3 usos, recarga 40 s, repara 12%', custo: { ouro: 30 }, usos: 3 },
};

// ---------- pinturas / camuflagens (padrões PROCEDURAIS no shader) ----------
// furt: redução da assinatura radar (multiplica o RCS). hp: CASCO REFORÇADO (+% de vida máxima aplicada na partida):
// comuns (prata) +3–5%, nacionais (nac_*) +6–8%, especiais ouro +10–12%. Cinza naval (padrão gratuito) e pinturas de fábrica: 0.
export const PINTURAS = {
  cinza_naval: { nome: 'Cinza naval', tipo: 0, cores: ['#7b8084', '#6b7074', '#8a8f93'], prata: 0, furt: 0 }, /* v1.2.9: cinza-névoa natural */
  rus_cinza: { nome: 'Cinza do norte (convés vermelho)', tipo: 0, cores: ['#7d8286', '#6a6f73', '#8c9195'], prata: 0, furt: 0, conves: 'vermelho', fabrica: 1 },
  bra: { nome: 'Azul-acinzentado', tipo: 0, cores: ['#6c8193', '#5d7183', '#7f93a4'], prata: 40_000, hp: 0.03, furt: 0 },
  artica: { nome: 'Ártico fragmentado', tipo: 1, cores: ['#e6eaee', '#9aa5ae', '#2d353c'], prata: 90_000, hp: 0.05, furt: 0.02, conves: 'vermelho' },
  dazzle: { nome: 'Dazzle clássico', tipo: 2, cores: ['#f0f2f4', '#1c2126', '#7d8790'], prata: 110_000, hp: 0.04, furt: 0.02 },
  digital: { nome: 'Digital oceânico', tipo: 3, cores: ['#3e5c78', '#27415a', '#6a8aa6'], prata: 100_000, hp: 0.04, furt: 0.03 },
  noturno: { nome: 'Escuro noturno', tipo: 0, cores: ['#30363d', '#262b31', '#3b424a'], prata: 80_000, hp: 0.04, furt: 0.03 },
  costeiro: { nome: 'Verde costeiro', tipo: 4, cores: ['#55634f', '#3f4a3c', '#77836b'], prata: 85_000, hp: 0.04, furt: 0.02 },
  tropical: { nome: 'Cinza claro tropical', tipo: 0, cores: ['#a9b2b9', '#98a2aa', '#bcc4ca'], prata: 60_000, hp: 0.03, furt: 0 },
  // NACIONAIS (prata): esquemas inspirados nas cores históricas de cada marinha (só cores/padrão; nada de insígnias)
  nac_bra: { nome: 'Nacional Brasil — cinza-azulado em manchas', tipo: 4, cores: ['#5d6f7e', '#46586a', '#7d8e9c'], prata: 120_000, hp: 0.06, furt: 0.02, nac: 'BRA' },
  nac_deu: { nome: 'Nacional Alemanha — cinza fragmentado', tipo: 1, cores: ['#7c838a', '#5b6168', '#9aa1a7'], prata: 120_000, hp: 0.06, furt: 0.02, nac: 'DEU' },
  nac_rus: { nome: 'Nacional Rússia — azul-cinza do norte', tipo: 4, cores: ['#5b6b78', '#3f4c57', '#7a8995'], prata: 120_000, hp: 0.07, furt: 0.02, nac: 'RUS', conves: 'vermelho' },
  areia_verm: { nome: 'Areia com convés vermelho', tipo: 0, cores: ['#c9b48a', '#b8a378', '#d8c7a0'], prata: 140_000, hp: 0.05, furt: 0, conves: 'vermelho' },
  nac_eua: { nome: 'Nacional EUA — azul-marinho e cinza-névoa', tipo: 7, cores: ['#2c3a4f', '#7d868e', '#69727a'], prata: 120_000, hp: 0.07, furt: 0.02, nac: 'EUA' },
  nac_uk: { nome: 'Nacional Reino Unido — Western Approaches', tipo: 2, cores: ['#e8eef0', '#a9c8cc', '#6f95a8'], prata: 120_000, hp: 0.08, furt: 0.01, nac: 'UK' },
  nac_chn: { nome: 'Nacional China — oceano digital', tipo: 3, cores: ['#7f8f9c', '#5d6f80', '#a7b4bd'], prata: 120_000, hp: 0.07, furt: 0.03, nac: 'CHN' },
  // especiais (OURO): furtividade radar + CASCO REFORÇADO (hp: +% de vida máxima)
  mercurio: { nome: 'Mercúrio absorvente', tipo: 5, cores: ['#3a4148', '#59626b', '#c9a227'], ouro: 1_800, furt: 0.08, hp: 0.1, especial: 1 },
  eclipse: { nome: 'Eclipse dourado', tipo: 6, cores: ['#16191d', '#24282d', '#d4af37'], ouro: 2_600, furt: 0.10, hp: 0.11, especial: 1 },
  aurora_ouro: { nome: 'Aurora fragmentada', tipo: 1, cores: ['#d9c27a', '#4a5560', '#1d2329'], ouro: 2_200, furt: 0.07, hp: 0.1, especial: 1 },
  neon_tech: { nome: 'Neon Tech (ouro)', tipo: 8, cores: ['#0b1730', '#13244a', '#2f7bff'], ouro: 4_200, furt: 0.03, hp: 0.12, especial: 1, conves: 'vermelho' },
  faixas_nexo: { nome: 'Faixas Nexo (azul/branco/vermelho/amarelo)', tipo: 9, cores: ['#e9edf1', '#1d4ed8', '#d62828'], prata: 160_000, hp: 0.05, furt: 0, conves: 'escuro' },
  couraca_ouro: { nome: 'Couraça dourada', tipo: 5, cores: ['#59626b', '#3a4148', '#d4af37'], ouro: 3_500, furt: 0.04, hp: 0.12, especial: 1 },
  // v1.2.15 LENDÁRIAS (OURO, as mais caras): efeito especial SUTIL animado no shader (mesmo programa, só uniforms) e +50% em TODOS os atributos; nunca usadas por bots (especial)
  lend_relampago: { nome: 'Relâmpago Austral', tipo: 10, cores: ['#262c33', '#39424c', '#8fd3ff'], ouro: 9_500, especial: 1, lendaria: 1, bonus: 0.5, metal: 0.68, rug: 0.27, conves: 'escuro', desc: 'grafite-aço com veios elétricos azul-gelo que pulsam devagar ao longo do casco' },
  lend_obsidiana: { nome: 'Maré de Obsidiana', tipo: 11, cores: ['#0d1218', '#1b2530', '#5ad1c4'], ouro: 11_000, especial: 1, lendaria: 1, bonus: 0.5, metal: 0.74, rug: 0.22, desc: 'negro-vítreo com brilho iridescente que corre como uma maré lenta' },
  lend_brasa: { nome: 'Brasa Dourada', tipo: 12, cores: ['#23262a', '#33373c', '#ffb347'], ouro: 12_500, especial: 1, lendaria: 1, bonus: 0.5, metal: 0.7, rug: 0.3, conves: 'vermelho', desc: 'grafite com veios de ouro derretido em brasa suave' },
  // v1.2.19 item 12 LENDÁRIAS NACIONAIS (OURO, o topo da loja): cores da bandeira + motivo animal ANIMADO (atlas desenhado no app, 1 programa para todas — a nação é só um uniform); +50% em todos os atributos; nunca usadas por bots
  lend_nac_bra: { nome: 'Onças do Brasil', tipo: 24, var: 1, cores: ['#0b7a3e', '#ffd100', '#1f3f8f'], ouro: 15_000, especial: 1, lendaria: 1, nacional: 1, bonus: 0.5, metal: 0.42, rug: 0.4, nac: 'BRA', desc: 'casco verde com faixa amarela ondulando e superestrutura azul estrelada; onças-pintadas dão o bote ao longo do costado' },
  lend_nac_eua: { nome: 'Águia da Liberdade', tipo: 24, var: 2, cores: ['#1b2a4e', '#b31942', '#ffffff'], ouro: 14_500, especial: 1, lendaria: 1, nacional: 1, bonus: 0.5, metal: 0.45, rug: 0.38, nac: 'EUA', desc: 'azul-marinho estrelado com listras vermelhas e brancas; águias-de-cabeça-branca batem as asas no costado' },
  lend_nac_deu: { nome: 'Tricolor do Reno', tipo: 24, var: 3, cores: ['#111111', '#dd0000', '#ffce00'], ouro: 13_500, especial: 1, lendaria: 1, nacional: 1, bonus: 0.5, metal: 0.55, rug: 0.34, nac: 'DEU', desc: 'preto, vermelho e dourado em faixas que ondulam pelo casco, com brilho dourado varrendo devagar (só as cores da bandeira)' },
  lend_nac_uk: { nome: 'Leões do Atlântico Norte', tipo: 24, var: 4, cores: ['#012169', '#c8102e', '#ffffff'], ouro: 14_000, especial: 1, lendaria: 1, nacional: 1, bonus: 0.5, metal: 0.48, rug: 0.36, nac: 'UK', desc: 'azul-real com faixas diagonais vermelhas debruadas de branco; leões dão o bote no costado' },
  lend_nac_chn: { nome: 'Grous do Mar da China', tipo: 24, var: 5, cores: ['#9e1b16', '#ffde00', '#f5f5f2'], ouro: 14_000, especial: 1, lendaria: 1, nacional: 1, bonus: 0.5, metal: 0.46, rug: 0.37, nac: 'CHN', desc: 'vermelho profundo com estrelas douradas; grous-de-coroa-vermelha voam batendo as asas ao longo do casco' },
  // v1.2.16 HERÓICAS (OURO): animação SUTIL no shader (mesmo esquema das lendárias: só uniforms, 1 programa por tipo, pré-aquecido), +25% em todos os atributos; nunca usadas por bots
  her_brasil: { nome: 'Verde-Amarela', tipo: 13, cores: ['#1f6b3c', '#e0b81e', '#1d3f8a'], ouro: 7_000, especial: 1, heroica: 1, bonus: 0.25, metal: 0.45, rug: 0.38, desc: 'verde, amarelo, azul e branco em faixas navais com brilho que ondula como bandeira' },
  her_italia: { nome: 'Tricolor do Mediterrâneo', tipo: 14, cores: ['#a9b0b4', '#13874a', '#c22d35'], ouro: 7_000, especial: 1, heroica: 1, bonus: 0.25, metal: 0.42, rug: 0.4, desc: 'cinza-claro de esquadra com faixas verde/branca/vermelha na proa; reflexo lento correndo' },
  her_mb: { nome: 'Esquadra Atlântica', tipo: 15, cores: ['#6f7a82', '#1c2c4a', '#e8edf0'], ouro: 7_200, especial: 1, heroica: 1, bonus: 0.25, metal: 0.4, rug: 0.42, conves: 'escuro', desc: 'cinza-naval, faixa azul-marinho e filete branco; luz de varredura discreta no filete' },
  her_fogos: { nome: 'Fogos de Artifício', tipo: 16, cores: ['#10172a', '#1b2540', '#ffd27a'], ouro: 8_200, especial: 1, heroica: 1, bonus: 0.25, metal: 0.5, rug: 0.35, conves: 'escuro', desc: 'azul-noite com explosões de luz que abrem e se apagam pelo casco' },
  her_trovoes: { nome: 'Trovões', tipo: 17, cores: ['#20262e', '#2e3640', '#b9ddff'], ouro: 8_400, especial: 1, heroica: 1, bonus: 0.25, metal: 0.62, rug: 0.3, conves: 'escuro', desc: 'raios elétricos ramificados percorrendo o casco em descargas curtas' },
  her_faisca: { nome: 'Faísca', tipo: 18, cores: ['#3b4148', '#4a5159', '#ffb04a'], ouro: 7_600, especial: 1, heroica: 1, bonus: 0.25, metal: 0.66, rug: 0.32, desc: 'aço com faíscas de solda cintilando nas costuras das chapas' },
  her_militar: { nome: 'Militar Digital', tipo: 19, cores: ['#4d5a4a', '#353f36', '#7c8578'], ouro: 7_400, especial: 1, heroica: 1, bonus: 0.25, metal: 0.3, rug: 0.55, desc: 'disruptiva digital de 4 tons com pixels adaptativos que mudam devagar' },
  her_aurora: { nome: 'Aurora Boreal', tipo: 20, cores: ['#0f1d26', '#18303a', '#55ffb0'], ouro: 8_600, especial: 1, heroica: 1, bonus: 0.25, metal: 0.5, rug: 0.32, conves: 'escuro', desc: 'casco escuro com cortinas de luz verde e violeta se movendo' },
  her_oceano: { nome: 'Oceano Profundo', tipo: 21, cores: ['#0c2338', '#123b5c', '#6fd0ff'], ouro: 8_000, especial: 1, heroica: 1, bonus: 0.25, metal: 0.48, rug: 0.34, desc: 'degradê abissal com cáusticas de ondas correndo no costado' },
  her_cromo: { nome: 'Aço Polido', tipo: 22, cores: ['#8e979e', '#b7c0c6', '#ffffff'], ouro: 8_800, especial: 1, heroica: 1, bonus: 0.25, metal: 0.95, rug: 0.13, desc: 'aço espelhado com faixa de reflexo varrendo o casco' },
  // pinturas de fábrica das nações / premium (não compráveis; só exibidas nesses navios)
  eua: { nome: 'Cinza-aço fosco', tipo: 0, cores: ['#6e7275', '#606467', '#7b7f82'], fabrica: 1, furt: 0 },
  chn: { nome: 'Cinza-claro naval', tipo: 0, cores: ['#8d9295', '#7c8184', '#9ca1a4'], fabrica: 1, furt: 0 },
  uk_escura: { nome: 'Cinza escuro camuflado', tipo: 4, cores: ['#3f464d', '#30363c', '#575f66'], fabrica: 1, furt: 0 },
  bra_escura: { nome: 'Cinza-ardósia', tipo: 0, cores: ['#5c656c', '#50585f', '#6b737a'], fabrica: 1, furt: 0 },
  premium_noite: { nome: 'Corsário noturno', tipo: 6, cores: ['#1e2329', '#2b3138', '#c9a227'], fabrica: 1, furt: 0, conves: 'vermelho' },
  premium_oceano: { nome: 'Gigante oceânico', tipo: 3, cores: ['#2f4c66', '#1f3449', '#d4af37'], fabrica: 1, furt: 0 },
  real_kor: { nome: 'Cinza naval KDX (limpo)', tipo: 0, cores: ['#6a7279', '#646c73', '#707880'], fabrica: 1, furt: 0, metal: 0.38, rug: 0.5, limpa: 1 }, real_chn: { nome: 'Cinza naval Tipo 055 (limpo)', tipo: 0, cores: ['#8a9299', '#848c93', '#9099a0'], fabrica: 1, furt: 0, metal: 0.38, rug: 0.5, limpa: 1 }, real_rus: { nome: 'Cinza naval Kirov (convés vermelho)', tipo: 0, cores: ['#697177', '#636b71', '#6f777d'], fabrica: 1, furt: 0, metal: 0.36, rug: 0.52, limpa: 1, conves: 'vermelho' }, /* v1.2.31: tinta naval limpa, desgaste sutil */
  lend_grafite: { nome: 'Grafite metálico lendário', tipo: 0, cores: ['#4a5058', '#3a4047', '#5a6169'], fabrica: 1, furt: 0, metal: 0.62, rug: 0.34, conves: 'vermelho' }, /* v1.2.11: pinturas METÁLICAS dos lendários */
  lend_italia: { nome: 'Cinza-claro mediterrâneo lendário', tipo: 23, cores: ['#9aa3a9', '#8a9399', '#13874a'], fabrica: 1, furt: 0, metal: 0.5, rug: 0.38 }, /* v1.2.16: Marcos Vinícius (traços italianos; só cores) */
  lend_aco: { nome: 'Aço azulado lendário', tipo: 0, cores: ['#5d6873', '#4d5761', '#6c7782'], fabrica: 1, furt: 0, metal: 0.6, rug: 0.36 },
  lend_ardosia: { nome: 'Ardósia polida lendária', tipo: 4, cores: ['#55606a', '#434d56', '#6a757f'], fabrica: 1, furt: 0, metal: 0.58, rug: 0.38 },
  lend_titanio: { nome: 'Titânio escovado lendário', tipo: 0, cores: ['#7a8088', '#686e76', '#8a9098'], fabrica: 1, furt: 0, metal: 0.66, rug: 0.32, conves: 'escuro' },
  cruz_vermelho: { nome: 'Cinza de cruzeiro com convés vermelho', tipo: 0, cores: ['#7d858c', '#6c747b', '#8e969d'], fabrica: 1, furt: 0, metal: 0.52, rug: 0.4, conves: 'vermelho' }, /* v1.2.18: cruzeiros pesados (casco cinza, convés vermelho como a referência) */
  slend_rubi: { nome: 'Aço-rubi super lendário', tipo: 0, cores: ['#5a6068', '#474d55', '#8f1d22'], fabrica: 1, furt: 0, metal: 0.64, rug: 0.33, conves: 'vermelho' },
  slend_azul: { nome: 'Azul-almirante super lendário', tipo: 0, cores: ['#3d4f63', '#2f3f51', '#7f8c99'], fabrica: 1, furt: 0, metal: 0.62, rug: 0.34, conves: 'azul' },
  slend_negro: { nome: 'Grafite-negro super lendário', tipo: 4, cores: ['#30353b', '#24282d', '#6d747c'], fabrica: 1, furt: 0, metal: 0.66, rug: 0.32, conves: 'escuro' },
  lend_basalto: { nome: 'Basalto furtivo lendário', tipo: 4, cores: ['#3f454c', '#30353b', '#59616a'], fabrica: 1, furt: 0, metal: 0.6, rug: 0.4, conves: 'escuro' }, /* v1.2.26 */
  slend_safira: { nome: 'Safira-aço super lendário', tipo: 0, cores: ['#44566b', '#35455a', '#9fb3c8'], fabrica: 1, furt: 0, metal: 0.64, rug: 0.33, conves: 'escuro' }, /* v1.2.26 */
  premium_dourada: { nome: 'Aurora real', tipo: 5, cores: ['#4b535b', '#2e343a', '#d4af37'], fabrica: 1, furt: 0 },
};
export const PINTURAS_COMPRAVEIS = Object.keys(PINTURAS).filter((k) => !PINTURAS[k].fabrica);

// ---------- recompensas ----------
/** Tipo de navio → multiplicador de ganho (corveta < fragata < contratorpedeiro < cruzador < capitânia; premium tem bônus à parte). */
export const TIPO_NAVIO = { sejong: 'destroier', nanchang: 'cruzador', nakhimov: 'capitania', /* v1.2.31 */ jalapao: 'corveta', ilhagrande: 'fragata', pantanal: 'destroier', serramar: 'cruzador', abrolhos: 'capitania', costaverde: 'capitania', /* v1.2.25 */ ilhabela: 'fragata', jericoacoara: 'destroier', aparados: 'destroier', itatiaia: 'cruzador', neblina: 'cruzador', canastra: 'capitania', chapada: 'capitania', lencois: 'capitania', /* v1.2.26 */ kelly: 'cruzador', laiane: 'cruzador', klevton: 'cruzador', ananery: 'cruzador', trajano: 'capitania', leidevaldo: 'capitania', ronaldo: 'capitania', volkhar: 'capitania', baluarte: 'capitania', kordao: 'capitania', estrelar: 'cruzador', colosso: 'capitania', marcos: 'capitania', atlantico: 'capitania', rodolfo: 'capitania', antonia: 'capitania', horizonte: 'capitania', corveta: 'corveta', corsario: 'corveta', fragata: 'fragata', tempestade: 'fragata', leviata: 'fragata', destroier: 'destroier', furtivo: 'destroier', sentinela: 'destroier', tridente: 'destroier', cruzador: 'cruzador', dragao: 'cruzador', aurora: 'cruzador', capitania: 'capitania',
  kestrel: 'corveta', haiyan: 'corveta', strizh: 'corveta', puffin: 'corveta', redwood: 'fragata', jinpeng: 'fragata', thornwood: 'fragata', sapsan: 'fragata', tianlong: 'destroier', sokol: 'destroier', monolito: 'cruzador', medved: 'cruzador', warden: 'cruzador', xuanwu: 'capitania', fenghuang: 'destroier', trovao: 'capitania', zarev: 'capitania' };
export const GANHO_TIPO = { corveta: { nome: 'Corveta/patrulha', mult: 1.0 }, fragata: { nome: 'Fragata', mult: 1.3 }, destroier: { nome: 'Contratorpedeiro', mult: 1.6 }, cruzador: { nome: 'Cruzador', mult: 2.0 }, capitania: { nome: 'Capitânia', mult: 2.4 } };
/** Prata/pesquisa/ouro de uma partida (determinístico a partir das estatísticas). */
export function recompensa(r, classe) {
  const C = CLASSES[classe]; const s = r.stats || r; const tier = C.tier || 1; const mult = GANHO_TIPO[TIPO_NAVIO[classe] || 'corveta'].mult;
  const base = Math.round(30_000 * mult), porDano = Math.round(Math.min(s.dano || 0, 9000) * 140 * mult), porAbate = (s.abates || 0) * Math.round(38_000 * mult), porDef = ((s.intercept || 0) + (s.menores || 0)) * 6_500, porVit = r.vitoria === true ? Math.round(55_000 * mult) : r.vitoria === null ? 15_000 : 0;
  let prata = base + porDano + porAbate + porDef + porVit;
  const bonus = C.premium ? BONUS_PREMIUM[classe] || 0.5 : 0; const prataBonus = Math.round(prata * bonus); prata += prataBonus;
  const pesquisa = Math.round(900 * tier + (s.dano || 0) * 6 + (s.abates || 0) * 1_400 + (r.vitoria === true ? 1_500 : 0));
  const ouro = (r.vitoria === true ? 15 : 3) + (s.abates || 0) * 5;
  const reparo = Math.max(MANUTENCAO.minimo, Math.round((1 - (r.vidaFinal ?? 1)) * 100 * MANUTENCAO.porHp * tier * 10));
  const xp = Math.round(pesquisa * 0.6 + (r.mvp ? 400 : 0)); return { prata, pesquisa, ouro, reparo, bonus, prataBonus, mult, tipo: TIPO_NAVIO[classe] || 'corveta' /* v1.2.15: classe sem tipo (ex.: teste com mercante) não quebra a tela de resultado */, partes: { base, porDano, porAbate, porDef, porVit }, xp, liquido: prata - reparo };
}

// ---------- perfil econômico (fica dentro do Save local) ----------
const PADRAO = () => ({ prata: 250_000, ouro: 500, pesquisaLivre: 0, pesquisa: {}, pesquisados: { corveta: 1 }, possui: Object.fromEntries(INICIAIS.map((k) => [k, 1])),
  modulos: {}, propulsao: {}, pintura: {}, pinturasPossui: { cinza_naval: 1 }, loadout: { municao: 'he', missil: 'padrao', isca: 'padrao', consumivel: 'reparo' }, lotes: { sap: 0, ap: 0, tandem: 0, iscaOuro: 0, reparoOuro: 0 }, devAplicado: 0, devVersao: 0, historico: [], comandantes: {}, cmdNavio: {}, helis: {}, trofeus: {}, batalhas: 0, vitorias: 0 });

export class Economia {
  constructor(save) { this.save = save; const d = save.d; if (!d.economia) d.economia = PADRAO(); const e = d.economia; const p = PADRAO(); for (const k in p) if (!(k in e)) e[k] = p[k];
    // reserva DEV: perfis novos E saves antigos (devAplicado da 10M/100k) sobem para o novo mínimo uma vez por versão da reserva
    if (DEV_ECONOMY.ativo && (!e.devAplicado || (e.devVersao || 0) < DEV_ECONOMY.versao)) { e.prata = Math.max(e.prata, DEV_ECONOMY.prata); e.ouro = Math.max(e.ouro, DEV_ECONOMY.ouro); if (!e.devAplicado) e.pesquisaLivre += DEV_ECONOMY.pesquisa; for (const kk of ORDEM_CONS) for (const nv of ['prata', 'ouro']) { const l = loteCons(kk, nv); e.lotes[l] = Math.max(e.lotes[l] || 0, DEV_ECONOMY.lotesCons); } if (!e.loadout.cons) e.loadout.cons = { kit: 'ouro', controle: 'ouro', bomba: 'ouro', reparoHeli: 'ouro', abastece: 'ouro' }; e.devAplicado = 1; e.devVersao = DEV_ECONOMY.versao; save.salva(); }
    for (const t in LOTE_CAP) if (!(t in e.lotes)) e.lotes[t] = 0; }
  /** Botão 'Recarregar saldo (dev)': volta prata/ouro exatamente para a reserva DEV. */
  recarregarDev() { if (!DEV_ECONOMY.ativo) return false; this.e.prata = DEV_ECONOMY.prata; this.e.ouro = DEV_ECONOMY.ouro; for (const kk of ORDEM_CONS) for (const nv of ['prata', 'ouro']) { const l = loteCons(kk, nv); this.e.lotes[l] = Math.max(this.e.lotes[l] || 0, DEV_ECONOMY.lotesCons); } this.e.devAplicado = 1; this.e.devVersao = DEV_ECONOMY.versao; this.save.salva(); return true; }
  get e() { return this.save.d.economia; }
  get prata() { return this.e.prata; } get ouro() { return this.e.ouro; }
  possui(k) { return !!this.e.possui[k] || this.dev(); } /* v1.2.11: MODO DESENVOLVEDOR = todos os navios desbloqueados */
  dev() { const a = this.save.ajustes || (this.save.d && this.save.d.ajustes); return !!(a && a.dev); }
  pesquisado(k) { return !!this.e.pesquisados[k] || this.possui(k) || !!CLASSES[k].premium; }
  /** Pesquisa acumulada disponível para liberar k (pontos ganhos nos navios-pais + pesquisa livre). */
  pesquisaPara(k) { return (PAIS[k] || []).reduce((a, p) => a + (this.e.pesquisa[p] || 0), 0) + this.e.pesquisaLivre; }
  podePesquisar(k) { const pr = PRECO[k]; if (!pr || CLASSES[k].premium || this.pesquisado(k)) return false; const pais = PAIS[k] || []; return pais.some((p) => this.possui(p)) && this.pesquisaPara(k) >= pr.pesquisa; }
  pesquisar(k) { if (!this.podePesquisar(k)) return { ok: false, motivo: 'Pesquisa insuficiente ou navio anterior não adquirido' }; let falta = PRECO[k].pesquisa;
    for (const p of PAIS[k] || []) { const u = Math.min(falta, this.e.pesquisa[p] || 0); this.e.pesquisa[p] = (this.e.pesquisa[p] || 0) - u; falta -= u; } this.e.pesquisaLivre -= falta; this.e.pesquisados[k] = 1; this.save.salva(); return { ok: true }; }
  /** Pesquisa usando a RESERVA (converte prata em pesquisa livre na razão 25:1 — útil com a reserva DEV). */
  converterPesquisa(pontos) { const custo = pontos * 25; if (this.e.prata < custo) return false; this.e.prata -= custo; this.e.pesquisaLivre += pontos; this.save.salva(); return true; }
  comprar(k) { if (this.possui(k)) return { ok: false, motivo: 'Já possui' }; const pr = PRECO[k] || {}; const C = CLASSES[k];
    if (C.premium) { if (this.e.ouro < pr.ouro) return { ok: false, motivo: 'Ouro insuficiente' }; this.e.ouro -= pr.ouro; }
    else { if (!this.pesquisado(k)) return { ok: false, motivo: 'Pesquise antes na árvore' }; if (this.e.prata < pr.prata) return { ok: false, motivo: 'Prata insuficiente' }; this.e.prata -= pr.prata; }
    this.e.possui[k] = 1; this.save.salva(); return { ok: true }; }
  temModulo(k, m) { return !!(this.e.modulos[k] && this.e.modulos[k][m]); }
  comprarModulo(k, m) { const M = MODULOS[m]; if (!M || this.temModulo(k, m)) return false; if (this.e.prata < M.prata) return false; this.e.prata -= M.prata; (this.e.modulos[k] = this.e.modulos[k] || {})[m] = 1; this.save.salva(); return true; }
  comprarPropulsao(k, nivel) { const P = PROPULSAO[nivel]; if (!P || (this.e.propulsao[k] || 0) >= nivel || this.e.prata < P.prata) return false; this.e.prata -= P.prata; this.e.propulsao[k] = nivel; this.save.salva(); return true; }
  possuiPintura(p) { return !!this.e.pinturasPossui[p] || p === 'cinza_naval'; }
  comprarPintura(p) { const P = PINTURAS[p]; if (!P || P.fabrica || this.possuiPintura(p)) return false; if (P.ouro) { if (this.e.ouro < P.ouro) return false; this.e.ouro -= P.ouro; } else { if (this.e.prata < (P.prata || 0)) return false; this.e.prata -= P.prata || 0; } this.e.pinturasPossui[p] = 1; this.save.salva(); return true; }
  /** Pintura em uso no navio k ('' = fábrica). */
  /** Bandeira do pau da popa (país, estado BR ou sinal náutico) e navio embandeirado em arco (gala). Cosmético. */
  enfeiteDe(k) { const f = (this.e.enfeite || {})[k] || {}; return { bandeira: f.bandeira || CLASSES[k].nacao || 'BRA', gala: !!f.gala, faixa: !!f.faixa, nome: f.nome || NOMES_PADRAO[k] || null }; } /* v1.2.16 item 34: nome fictício padrão */
  escolherEnfeite(k, o) { this.e.enfeite = this.e.enfeite || {}; this.e.enfeite[k] = Object.assign(this.enfeiteDe(k), o); this.save.salva(); return this.enfeiteDe(k); }
  pinturaDe(k) { const p = this.e.pintura[k]; return p && this.possuiPintura(p) ? p : CLASSES[k].pintura || 'cinza_naval'; }
  escolherPintura(k, p) { if (p !== CLASSES[k].pintura && !this.possuiPintura(p)) return false; this.e.pintura[k] = p; this.save.salva(); return true; }
  /** Lotes de munição/míssil/isca especiais (consumidos ao zarpar). */
  comprarLote(tipo, n = 1) { const c = custoLote(tipo); if (!c) return false; const moeda = c.prata ? 'prata' : 'ouro'; const custo = (c.prata || c.ouro) * n; if (this.e[moeda] < custo) return false; this.e[moeda] -= custo; this.e.lotes[tipo] = (this.e.lotes[tipo] || 0) + n; this.save.salva(); return true; }
  /** Loadout efetivo para uma partida: gasta lotes; se faltar lote, volta ao padrão. Retorna os modificadores para a simulação. */
  prepararPartida(k) { const L = this.e.loadout, e = this.e; const usa = (lote, ok) => { if (!ok) return false; if ((e.lotes[lote] || 0) <= 0 && !this.comprarLote(lote)) return false; e.lotes[lote]--; return true; };
    const sap = L.municao === 'sap' && usa('sap', true), ap = !sap && L.municao === 'ap' && usa('ap', true), tandem = L.missil === 'tandem' && usa('tandem', true), iscaOuro = L.isca === 'ouro' && usa('iscaOuro', true), repOuro = L.consumivel === 'reparo_ouro' && usa('reparoOuro', true);
    if (!repOuro && L.consumivel === 'reparo') { if (e.prata >= CONSUMIVEIS.reparo.custo.prata) e.prata -= CONSUMIVEIS.reparo.custo.prata; }
    // consumíveis de recuperação: debita no INÍCIO (usa lote do paiol ou compra 1); sem saldo → não leva (saldo nunca negativo)
    const selC = Object.assign({}, CONS_PADRAO, L.cons || {}), cons = {}, lotesC = []; const Ck = CLASSES[k];
    for (const kk of ORDEM_CONS) { const nv = selC[kk]; if (nv !== 'prata' && nv !== 'ouro') continue; if (CONS[kk].heli && !(Ck && Ck.heli > 0)) continue; const l = loteCons(kk, nv); if (usa(l, true)) { cons[kk] = nv; lotesC.push(l); } }
    this.save.salva(); const c = this.comandanteDe(k); const cd = c && COMANDANTES.find((q) => q.id === c.id);
    const m = modsDe(k, { modulos: e.modulos[k] || {}, propulsao: e.propulsao[k] || 0, pintura: this.pinturaDe(k), municao: ap ? 'ap' : sap ? 'sap' : 'he', missil: tandem ? 'tandem' : 'padrao', isca: iscaOuro ? 'ouro' : 'padrao', consumivel: repOuro ? 'reparo_ouro' : 'reparo', comandante: cd ? { esp: cd.esp, nivel: c.nivel } : null });
    m.lotesUsados = [sap && 'sap', ap && 'ap', tandem && 'tandem', iscaOuro && 'iscaOuro', repOuro && 'reparoOuro'].filter(Boolean).concat(lotesC); m.cons = cons; return m; }
  /** Credita a partida (prata líquida de manutenção, pesquisa no navio usado, ouro, XP do comandante, medalhas). */
  creditar(r, k) { const g = recompensa(r, k); if (r.pers) { g.persBruto = { liquido: g.liquido, ouro: g.ouro, pesquisa: g.pesquisa }; g.liquido = Math.round(g.liquido * 0.35); g.ouro = 0; g.pesquisa = Math.round(g.pesquisa * 0.35); g.pers = 1; g.persCorte = { liquido: g.persBruto.liquido - g.liquido, ouro: g.persBruto.ouro, pesquisa: g.persBruto.pesquisa - g.pesquisa }; } /* v1.2.17 item 8: guarda o bruto e o corte para o DETALHAMENTO na tela de resultado */ /* v1.2.16 BATALHA PERSONALIZADA: recompensa reduzida, sem ouro */ const e = this.e; const antes = e.prata; e.prata = Math.max(0, e.prata + g.liquido); g.liquido = e.prata - antes; e.ouro += g.ouro; e.pesquisa[k] = (e.pesquisa[k] || 0) + g.pesquisa;
    // devolução ao paiol: lotes especiais não usados (partida terminou com munição sobrando) voltam — 1 lote de cada tipo consumido só se usado
    for (const t of r.devolver || []) e.lotes[t] = (e.lotes[t] || 0) + 1;
    // lote usado só em parte: reembolso proporcional do que sobrou, na moeda do lote
    const s = r.stats || {}; const usoDe = { sap: s.loteTiros != null ? s.loteTiros : s.tiros, ap: s.loteTiros != null ? s.loteTiros : s.tiros, tandem: s.tandemLanc != null ? s.tandemLanc : s.misLanc, iscaOuro: s.iscas, reparoOuro: s.reparos }; for (const kk of ORDEM_CONS) for (const nv of ['prata', 'ouro']) usoDe[loteCons(kk, nv)] = (s.cons || {})[kk] || 0; g.reembolso = { prata: 0, ouro: 0, itens: [] };
    for (const t of r.lotesUsados || []) { if ((r.devolver || []).includes(t)) { g.reembolso.itens.push({ t, frac: 1, lote: 1 }); continue; } const c = custoLote(t); if (!c) continue; if (t.startsWith('c_') && !usoDe[t]) { e.lotes[t] = (e.lotes[t] || 0) + 1; g.reembolso.itens.push({ t, frac: 1, lote: 1 }); continue; } const frac = Math.max(0, 1 - (usoDe[t] || 0) / LOTE_CAP[t]); if (frac <= 0) continue; const moeda = c.prata ? 'prata' : 'ouro'; const v = Math.floor((c.prata || c.ouro) * frac); e[moeda] += v; g.reembolso[moeda] += v; g.reembolso.itens.push({ t, frac, v, moeda }); }
    const c = this.comandanteDe(k); if (c) { const ant = c.nivel; c.xp += g.xp; while (c.nivel < NIVEL_MAX && c.xp >= xpPara(c.nivel)) c.nivel++; g.cmd = { id: c.id, nivel: c.nivel, subiu: c.nivel > ant, xp: c.xp, prox: c.nivel < NIVEL_MAX ? xpPara(c.nivel) : null }; }
    g.medalhas = medalhasDe(r.stats || {}, r); for (const m of g.medalhas) e.trofeus[m] = (e.trofeus[m] || 0) + 1; e.batalhas++; if (r.vitoria === true) e.vitorias++;
    e.historico.unshift({ k, prata: g.prata, liquido: g.liquido, ouro: g.ouro, v: r.vitoria, medalhas: g.medalhas }); e.historico.length = Math.min(e.historico.length, 20); this.save.salva(); return g; }
  // ---------- comandantes (OURO) ----------
  contratado(id) { return !!this.e.comandantes[id]; }
  contratar(id) { const C = COMANDANTES.find((c) => c.id === id); if (!C || this.contratado(id)) return { ok: false, motivo: 'Já contratado' }; if (this.e.ouro < C.ouro) return { ok: false, motivo: 'Ouro insuficiente' }; this.e.ouro -= C.ouro; this.e.comandantes[id] = { id, nivel: 1, xp: 0 }; this.save.salva(); return { ok: true }; }
  /** Designa o comandante id ao navio k (1 por navio; sai do navio anterior). id = '' remove. */
  designar(k, id) { const e = this.e; if (id && !this.contratado(id)) return false; if (id) for (const n in e.cmdNavio) if (e.cmdNavio[n] === id) delete e.cmdNavio[n]; if (id) e.cmdNavio[k] = id; else delete e.cmdNavio[k]; this.save.salva(); return true; }
  navioDoComandante(id) { for (const n in this.e.cmdNavio) if (this.e.cmdNavio[n] === id) return n; return null; } /* v1.2.11 */
  comandanteDe(k) { const id = this.e.cmdNavio[k]; return id ? this.e.comandantes[id] || null : null; }
  // ---------- helicópteros (hangar do navio, escolhidos na pré-batalha) ----------
  camoAereoDe(k) { const c = (this.e.camoAereo || {})[k]; return CAMO_AEREO[c] ? c : 'padrao'; } /* v1.2.17 13i */
  escolherCamoAereo(k, c) { if (!CAMO_AEREO[c]) return false; this.e.camoAereo = this.e.camoAereo || {}; this.e.camoAereo[k] = c; this.save.salva(); return true; }
  helisDe(k) { const n = CLASSES[k].heli || 0; const l = (this.e.helis[k] || []).filter((h) => HELIS[h]).slice(0, n); while (l.length < n) l.push(l.length ? 'asw' : 'multi'); return l; }
  escolherHeli(k, slot, modelo) { if (!HELIS[modelo] || slot >= (CLASSES[k].heli || 0)) return false; const l = this.helisDe(k); l[slot] = modelo; this.e.helis[k] = l; this.save.salva(); return true; }
}

/** Custo de 1 lote (prata OU ouro). */
export function custoLote(t) { const mc = /^c_(\w+)_(prata|ouro)$/.exec(t); if (mc && CONS[mc[1]]) return CONS[mc[1]][mc[2]].custo; return { sap: MUNICOES.sap.custo, ap: MUNICOES.ap.custo, tandem: MISSEIS_OPC.tandem.custo, iscaOuro: ISCAS.ouro.custo, reparoOuro: CONSUMIVEIS.reparo_ouro.custo }[t] || null; }
/** Modificadores puros (serializáveis → vão no cfg da partida e chegam iguais a todos os pares numa partida em rede). */
export function modsDe(k, { modulos = {}, propulsao = 0, pintura = '', municao = 'he', missil = 'padrao', isca = 'padrao', consumivel = 'reparo', comandante = null } = {}) {
  const m = { radar: 1, trava: 1, vlsMais: 0, vmax: 1, acel: 1, giro: 1, avarias: 1, cad: 1, rcs: 1, disp: 1, misVel: 1, torpDano: 1, ciwsTaxa: 1, samPk: 1, heliFuel: 1, pintura, municao, missil, isca, consumivel };
  for (const id of Object.keys(modulos)) { const ef = MODULOS[id] && MODULOS[id].ef; if (!ef) continue; for (const [a, v] of Object.entries(ef)) m[a] = a === 'vlsMais' ? m[a] + v : m[a] * v; }
  m.vmax *= (PROPULSAO[propulsao] || PROPULSAO[0]).vmax; const P = PINTURAS[pintura]; if (P) { m.rcs *= 1 - (P.furt || 0); if (P.hp) m.vida = (m.vida || 1) * (1 + P.hp);
    if (P.bonus) { const b = 1 + P.bonus; /* v1.2.15 LENDÁRIA: +50% em TODOS os atributos (os de 'menor é melhor' são divididos) */ for (const a of ['radar', 'trava', 'vmax', 'acel', 'giro', 'misVel', 'torpDano', 'ciwsTaxa', 'samPk', 'heliFuel']) m[a] *= b; for (const a of ['cad', 'disp', 'rcs', 'avarias']) m[a] /= b; m.vida = (m.vida || 1) * b; m.dano = (m.dano || 1) * b; if (P.heroica) m.heroica = 1; else m.lendaria = 1; } }
  m.municaoEf = MUNICOES[municao].ef; m.missilEf = MISSEIS_OPC[missil].ef; m.iscaEf = ISCAS[isca].ef; m.reparo = consumivel === 'reparo_ouro' ? { usos: 3, recarga: 40, cura: 0.12 } : { usos: 2, recarga: 60, cura: 0.08 };
  if (comandante) aplicaComandante(m, comandante.esp, comandante.nivel);
  { const t = MISSEIS_OPC[missil].ef; m.missilPadraoEf = { dano: m.missilEf.dano / t.dano, pkCiws: m.missilEf.pkCiws / t.pkCiws }; m.municaoHeEf = MUNICOES.he.ef; m.tandemLote = LOTE_CAP.tandem; m.municaoLoteN = LOTE_CAP[municao] || 0; } /* v1.2.21 itens 19b/19c: depois do lote volta ao padrão (sem perder o bônus do comandante) */
  return m;
}
/** Pintura variada para bots (determinística pela semente e índice). */
export function pinturaBot(seed, i, k) { const lista = PINTURAS_COMPRAVEIS.filter((p) => !PINTURAS[p].especial); const C = CLASSES[k]; const h = (seed * 31 + i * 17) % 7; return h < 3 ? C.pintura || 'cinza_naval' : lista[(seed + i * 5) % lista.length]; }
export const LISTA_NAVIOS = ORDEM_CLASSES;
