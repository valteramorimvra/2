// v1.2.25 itens 12 e 14 — SEIS navios ORIGINAIS novos (projetos procedurais próprios; nomes de LUGARES brasileiros, nenhum nome
// de navio/arma/marca/jogo real). Mesmo formato das 47 classes: derivados por D(base, id, {...}) e VIDA().
//  · 4 navios de linha modernos (escola "Nexo 25": casco e casaria furtivos, painéis planos de radar nas 4 faces, VLS, canhão
//    furtivo, CIWS, hangar/convoo), um por classe: corveta Jalapão → fragata Ilha Grande / destróier Pantanal → cruzador Serra do Mar.
//  · 2 super porta-aviões (~330 m, CATOBAR: convés em ângulo, 4 catapultas, cabos de parada, elevadores laterais, ilha com radares),
//    lendários premium (ouro), alas aéreas mistas com caças de dois tipos, aeronave de alerta aéreo antecipado e helicópteros.
// Uso (classes.js, logo após CLASSES.atlantico = ...):  adiciona1225(CLASSES, { D, CAN, VIDA });
export const IDS_1225 = ['jalapao', 'ilhagrande', 'pantanal', 'serramar', 'abrolhos', 'costaverde'];
/** Aeronaves novas (só porta-aviões 1.2.25; não entram em ORDEM_HELIS → bots/hangares de escolta não as sorteiam). */
export const HELIS_1225 = {
  raio: { id: 'raio', nome: 'Caça furtivo embarcado Raio', desc: 'Caça de catapulta de baixa assinatura: 2 mísseis antinavio em baia interna a 10 km + canhão 25 mm; o mais rápido do convés', vmax: 225, comb: 250, vida: 30, sensor: 11000, arma: 'missil', mun: 2, alc: 10000, dano: 24, aviao: 1, furtivo: 1 },
  vigia: { id: 'vigia', nome: 'Alerta aéreo antecipado Vigia', desc: 'Bimotor turboélice de catapulta com radome giratório: sem armas, revela navios e mísseis a 22 km para toda a frota', vmax: 150, comb: 420, vida: 28, sensor: 22000, arma: 'mg', mun: 0, alc: 0, dano: 0, aviao: 1, aew: 1 },
};
export function adiciona1225(CLASSES, { D, CAN, VIDA }) {
  // ---------------- CORVETA ----------------
  CLASSES.jalapao = D('corveta', 'jalapao', { nome: 'Corveta Furtiva Multimissão', classe: 'Classe Jalapão', nomeOriginal: 'Classe Jalapão (original)', num: 'V 36', est25: 'corveta',
    papel: 'Casco e casaria furtivos, mastro integrado com 4 painéis planos de radar, canhão furtivo de 76 mm, 8 mísseis antinavio, 4 SAM de autodefesa, torpedos e hangar para 1 helicóptero',
    L: 98, B: 13.6, T: 3.9, F: 5.4, vmax: 17.2, acel: 1.0, giro: 1.2, vida: VIDA(140), blind: 0.92, rcs: 0.36, radar: 13000, desl: 2700,
    canhao: CAN({ cal: 76, V0: 920, cad: 1.0, dano: 7.0, alc: 8200, disp: 0.9, torres: 1, canos: 1, som: 'medio' }),
    vls: 8, missil: 'curto', sam: 4, torp: 6, tubos: [1, 3], ciws: 1, ciwsLug: [1], a30: 2, chaff: 8, heli: 1, casco: 'convencional', estilo: 'corveta', pf: 'batedor' });
  // ---------------- FRAGATA ----------------
  CLASSES.ilhagrande = D('fragata', 'ilhagrande', { nome: 'Fragata Furtiva de Defesa Aérea', classe: 'Classe Ilha Grande', nomeOriginal: 'Classe Ilha Grande (original)', num: 'F 47', est25: 'fragata',
    papel: 'Fragata oceânica: canhão furtivo de 127 mm, 24 VLS antinavio, 16 SAM, 4 painéis AESA fixos, CIWS sobre o hangar, torpedos e helicóptero',
    L: 142, B: 18.6, T: 5.2, F: 6.8, vmax: 15.8, acel: 0.85, giro: 0.9, vida: VIDA(235), blind: 1.05, rcs: 0.45, radar: 15500, desl: 6100,
    canhao: CAN({ cal: 127, V0: 820, cad: 1.9, dano: 15, alc: 10000, disp: 0.7, torres: 1, canos: 1, som: 'grande' }),
    vls: 24, vlsRe: 0.156, missil: 'medio', sam: 16, torp: 6, tubos: [1, 3], ciws: 1, ciwsLug: [1], a30: 2, chaff: 10, heli: 1, casco: 'convencional', estilo: 'fragata', pf: 'ataque' });
  // ---------------- DESTRÓIER ----------------
  CLASSES.pantanal = D('fragata', 'pantanal', { nome: 'Destróier de Mísseis Guiados', classe: 'Classe Pantanal', nomeOriginal: 'Classe Pantanal (original)', num: 'D 58', est25: 'destroier',
    papel: 'Destróier furtivo de 168 m: 32 VLS de longo alcance (proa e popa), 16 SAM, canhão de 127 mm, 2 CIWS, 4 grandes painéis AESA + 4 de controle de tiro e 2 helicópteros',
    L: 168, B: 20.8, T: 6.4, F: 7.4, vmax: 15.6, acel: 0.75, giro: 0.8, vida: VIDA(272), blind: 1.12, rcs: 0.42, radar: 17500, desl: 9600,
    canhao: CAN({ cal: 127, V0: 830, cad: 1.75, dano: 16, alc: 10500, disp: 0.65, torres: 1, canos: 1, som: 'grande' }),
    vls: 32, vlsRe: 0.145, missil: 'longo', sam: 16, torp: 6, tubos: [1, 3], ciws: 2, ciwsLug: [0, 1], a30: 2, chaff: 10, heli: 2, casco: 'convencional', estilo: 'destroier', pf: 'ataque', antiAereo: 1 });
  // ---------------- CRUZADOR ----------------
  CLASSES.serramar = D('cruzador', 'serramar', { nome: 'Cruzador de Mísseis de Grande Porte', classe: 'Classe Serra do Mar', nomeOriginal: 'Classe Serra do Mar (original)', num: 'C 72', est25: 'cruzador',
    papel: 'Cruzador furtivo de 204 m: 40 VLS longos em salvas de 4, 32 SAM de área (guarda-chuva da frota), canhão de 130 mm, 2 CIWS, laser, mastro integrado com 2 conjuntos de painéis e 2 helicópteros',
    L: 204, B: 23.4, T: 7.2, F: 8.6, vmax: 15.0, acel: 0.68, giro: 0.7, vida: VIDA(340), blind: 1.3, rcs: 0.72, radar: 19000, desl: 13800,
    canhao: CAN({ cal: 130, V0: 850, cad: 1.8, dano: 16.5, alc: 11000, disp: 0.7, torres: 1, canos: 1, som: 'grande' }),
    vls: 40, vlsRe: 0.152, missil: 'longo', salva: 4, sam: 32, torp: 6, tubos: [1, 3], ciws: 2, ciwsLug: [0, 1], a30: 2, laser: 1, chaff: 12, heli: 2, casco: 'convencional', estilo: 'cruzador', pf: 'capitania', antiAereo: 1, defesaFrota: 2200 });
  // ---------------- SUPER PORTA-AVIÕES ----------------
  const PA = { porta: 'pa', superPA: 1, premium: 1, lendario: 1, supremo: 1, couracado: 0, estilo: 'capitania', pf: 'capitania', antiAereo: 1, vls: 0, missil: 'medio', salva: 0, torp: 0, tubos: [0, 0] };
  CLASSES.abrolhos = D('capitania', 'abrolhos', Object.assign({}, PA, { nome: 'Super Porta-Aviões Abrolhos', classe: 'Classe Abrolhos', nomeOriginal: 'Super Porta-Aviões Abrolhos (original)', num: 'A 14', est25: 'pa1',
    papel: 'CATOBAR de 332 m: convés em ângulo, 4 catapultas, 4 cabos de parada e 4 elevadores laterais; ala de 26 aeronaves (caças Gavião e Raio, alerta aéreo Vigia, VTOL, Tufão e ASW) — LANÇAR ESQUADRILHA; 24 SAM em patrocínios, 4 CIWS, 4 reparos de 30 mm e 2 lasers',
    L: 332, B: 41, T: 11.8, F: 13.4, hHangar: 6.2, vmax: 15.6, acel: 0.42, giro: 0.42, vida: VIDA(1480), blind: 2.2, rcs: 2.4, desl: 101000,
    canhao: CAN({ cal: 57, V0: 1000, cad: 0.55, dano: 4.8, alc: 8500, torres: 2, canos: 1, som: 'rapido', frenteDupla: 0, embutido: 1 }),
    sam: 24, ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 4, laser: 2, chaff: 16, heli: 26, maxAr: 14,
    helisPadrao: ['caca', 'caca', 'raio', 'raio', 'caca', 'caca', 'vigia', 'raio', 'raio', 'caca', 'caca', 'jato', 'jato', 'tufao', 'asw', 'caca', 'raio', 'vigia', 'jato', 'tufao', 'asw', 'caca', 'caca', 'utilitario', 'jato', 'asw'] }));
  CLASSES.costaverde = D('capitania', 'costaverde', Object.assign({}, PA, { nome: 'Super Porta-Aviões Costa Verde', classe: 'Classe Costa Verde', nomeOriginal: 'Super Porta-Aviões Costa Verde (original)', num: 'A 16', est25: 'pa2',
    papel: 'CATOBAR de 328 m com duas ilhas (navegação e controle aéreo): convés em ângulo, 4 catapultas, 4 cabos, 3 elevadores; ala de 28 aeronaves (caças, alerta aéreo Vigia e mais helicópteros Tufão/ASW) — LANÇAR ESQUADRILHA; 32 SAM, 4 CIWS, 4 reparos de 30 mm e 2 lasers',
    L: 328, B: 40, T: 11.5, F: 13.2, hHangar: 6.1, vmax: 16.0, acel: 0.44, giro: 0.44, vida: VIDA(1420), blind: 2.15, rcs: 2.35, desl: 97000,
    canhao: CAN({ cal: 57, V0: 1000, cad: 0.55, dano: 4.8, alc: 8500, torres: 2, canos: 1, som: 'rapido', frenteDupla: 0, embutido: 1 }),
    sam: 32, ciws: 4, ciwsLug: [0, 2, 3, 4], a30: 4, laser: 2, chaff: 16, heli: 28, maxAr: 14,
    helisPadrao: ['caca', 'raio', 'caca', 'raio', 'vigia', 'tufao', 'tufao', 'caca', 'raio', 'asw', 'caca', 'jato', 'tufao', 'asw', 'coaxial', 'caca', 'raio', 'vigia', 'jato', 'tufao', 'asw', 'caca', 'multi', 'utilitario', 'caca', 'raio', 'tufao', 'asw'] }));
}
/** Nação, tier e pintura de fábrica (mesclar no META de classes.js ANTES do laço `for (const k in META)`). */
export const META_1225 = { jalapao: ['BRA', 1, 'bra'], ilhagrande: ['BRA', 2, 'bra'], pantanal: ['BRA', 2, 'bra_escura'], serramar: ['BRA', 3, 'bra'], abrolhos: ['BRA', 4, 'lend_aco'], costaverde: ['BRA', 4, 'lend_ardosia'] };
/** layout.js: trecho da superestrutura [z0, z1] em fração de L (ilha dos porta-aviões a boreste, como Horizonte/Atlântico). */
export const EST_1225 = { jalapao: [-0.13, 0.11], ilhagrande: [-0.16, 0.09], pantanal: [-0.17, 0.08], serramar: [-0.17, 0.1], abrolhos: [0.06, 0.15], costaverde: [-0.1, -0.015] };
/** Nomes em letras (padrão naval) nos costados — nomes de lugares. Porta-aviões: nome em ouro (lendários). */
export const NOMES_PADRAO_1225 = { jalapao: 'JALAPÃO', ilhagrande: 'ILHA GRANDE', pantanal: 'PANTANAL', serramar: 'SERRA DO MAR' };
export const NOMES_OURO_1225 = { abrolhos: 'ABROLHOS', costaverde: 'COSTA VERDE' };

// ---------------------------------------------------------------------------------------------------------------------------------
// SUPER PORTA-AVIÕES: planta do convés de voo (em frações: z/(L/2), x/(B/2); proa em −z, boreste em +x), ilhas e arranjo de armas.
// Partilhado pela simulação (layout.js → posições de CIWS/SAM/30 mm/laser, convoo e catapulta) e pelo modelo 3D (extras1225.js).
// ---------------------------------------------------------------------------------------------------------------------------------
export const PLANO_PA = {
  abrolhos: { bb: [[-0.988, -0.34], [-0.904, -0.68], [-0.723, -0.93], [-0.602, -1.0], [-0.241, -2.05], [0.12, -1.61], [0.361, -1.32], [0.602, -1.02], [1, -0.88]],
    be: [[-0.988, 0.34], [-0.904, 0.63], [-0.723, 0.93], [-0.482, 1.1], [0.904, 1.1], [1, 0.93]],
    ang: 0.15, xPopa: 0.06, cat: [[-3, 0], [8.5, 0]], ilhas: [[0.06, 0.15, 'princ']], elev: [['be', -0.268, 0.048], ['be', -0.13, 0.048], ['be', 0.19, 0.048], ['bb', 0.37, 0.048]] },
  costaverde: { bb: [[-0.988, -0.34], [-0.904, -0.7], [-0.723, -0.95], [-0.6, -1.02], [-0.23, -1.95], [0.12, -1.56], [0.38, -1.27], [0.6, -1.02], [1, -0.88]],
    be: [[-0.988, 0.34], [-0.904, 0.66], [-0.72, 0.96], [-0.47, 1.14], [0.9, 1.14], [1, 0.95]],
    ang: 0.145, xPopa: 0.06, cat: [[-3, 0], [8.5, 0]], ilhas: [[-0.1, -0.015, 'nav'], [0.12, 0.175, 'ar']], elev: [['be', -0.19, 0.049], ['be', 0.03, 0.049], ['be', 0.215, 0.049]] },
};
/** x da borda do convés de voo na estação z ('bb' = bombordo, negativo; 'be' = boreste). */
export function bordaPA(C, z, lado) { const PL = PLANO_PA[C.id]; const pts = PL[lado], zn = z / (C.L / 2); if (zn <= pts[0][0]) return pts[0][1] * C.B / 2; for (let i = 1; i < pts.length; i++) if (zn <= pts[i][0]) { const [z0, x0] = pts[i - 1], [z1, x1] = pts[i]; return (x0 + (x1 - x0) * (zn - z0) / (z1 - z0)) * C.B / 2; } return pts[pts.length - 1][1] * C.B / 2; }
/** Eixo do convés em ângulo: x(z) da linha central da área de pouso. */
export const eixoAngPA = (C, z) => { const PL = PLANO_PA[C.id]; return PL.xPopa * C.B - PL.ang * (C.L / 2 - z); };
/** Dimensões da(s) ilha(s): z0/z1 (m), x interno/externo, altura do corpo (até o teto do passadiço). */
export function ilhasPA(C) { const PL = PLANO_PA[C.id], L = C.L; return PL.ilhas.map(([a, b, tipo]) => { const z0 = a * L, z1 = b * L, xe = bordaPA(C, (z0 + z1) / 2, 'be') - 0.6; const w = tipo === 'ar' ? 8.4 : 9.6; return { z0, z1, xe, xi: xe - w, xc: xe - w / 2, w, c: z1 - z0, h: tipo === 'ar' ? 10.1 : 14.7, hR: tipo === 'ar' ? 7.2 : 11.8, tipo }; /* hR = teto da casaria dos radares (render: níveis 3,6 + 3,3 + 4,9 m) */ }); }
/** layout.js chama no fim (antes do AJUSTE_LT): convés corrido em toda a extensão, convoo/catapulta 1, canhões sob o balanço de proa e
 *  no tombadilho de popa, SAM/CIWS/30 mm em patrocínios (sponsons) fora da área de pouso e laser no teto da ilha. */
export function layoutSuperPA(C, P, deckY, meiaBoca) { const L = C.L, B = C.B, PL = PLANO_PA[C.id]; const yD = C.F + C.hHangar, yS = yD - 3.4;
  P.deckV = { z0: -L * 0.49, z1: L / 2, y: yD, x: -B * 0.12, w: B * 1.5, ang: 0, plano: 1 }; P.ilhaX = 0;
  P.convoo = { z: -L * 0.2, y: yD, x: PL.cat[0][0] }; /* corrida da catapulta 1 (bombordo de proa) até deckV.z0+4 ≈ 93 m */
  const T = P.torres; if (T[0]) Object.assign(T[0], { z: -L / 2 + 19, y: C.F, frente: 1, arco: 1.75 }); if (T[1]) Object.assign(T[1], { z: L / 2 - 6.5, y: C.F, frente: -1, arco: 1.75 });
  const fora = (z, lado, d) => bordaPA(C, z, lado) + (lado === 'be' ? d : -d);
  P.ciws = [[-0.4, 'bb'], [-0.37, 'be'], [0.455, 'bb'], [0.47, 'be']].slice(0, C.ciws).map(([f, l], i) => ({ x: fora(f * L, l, 1.6), y: yS + 0.9, z: f * L, lug: i, spon: l }));
  P.a30 = [[-0.31, 'bb'], [-0.29, 'be'], [0.39, 'bb'], [0.41, 'be']].slice(0, C.a30 || 0).map(([f, l]) => ({ x: fora(f * L, l, 1.3), y: yS + 1.0, z: f * L, lado: l === 'be' ? 1 : -1, spon: l }));
  const il = ilhasPA(C), ia = il[0]; P.laser = []; if (C.laser >= 1) P.laser.push({ x: ia.xc, y: yD + ia.hR + 1.2, z: (ia.z0 + ia.z1) / 2 + ia.c * 0.28 }); if (C.laser >= 2) P.laser.push({ x: fora(L * 0.435, 'be', 1.5), y: yS + 1.2, z: L * 0.435 });
  P.blocosVls = P.blocosVls.filter((b) => b.tipo !== 'samPa'); P.sam = []; const h = Math.round(C.sam / 2), cs = 1.08;
  for (const [nb, f, l] of [[h, -0.215, 'bb'], [C.sam - h, 0.43, 'be']]) { if (!nb) continue; const zc = f * L, col = 4, lin = Math.ceil(nb / col), xc = fora(zc, l, col * cs / 2 + 1.2);
    P.blocosVls.push({ zc, y: yS, col, lin, cs, n: nb, tipo: 'samPa', xc }); for (let i = 0; i < nb; i++) P.sam.push({ x: xc + (i % col - (col - 1) / 2) * cs, y: yS + 0.25, z: zc + (Math.floor(i / col) - (lin - 1) / 2) * cs }); }
  P.celulas = P.vls.concat(P.sam); P.mastro = yD + il[0].h + 15; P.pa1225 = { yD, yS, il };
}
