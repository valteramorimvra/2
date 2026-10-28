// v1.2.0 (revisão) — PARÂMETROS DE ARMAS num lugar só (balística, mísseis, torpedos, SAM e efeitos visuais).
// Os valores de PARAM_PADRAO seguem o vídeo de referência de estilo analisado (alvo a ~3,1 km):
//  • canhão: tempo de voo ≈ 1 s até 3 km (velocidade de jogo ≈ 3.000 m/s), trajetória quase plana; arco visível só > 6–8 km
//  • míssil VLS: ejeção vertical ~1 s, pitch agressivo, voo rasante, ≈ 2–2,5 s para 3 km
// Para recalibrar, edite PARAM_PADRAO ou chame aplicaParametros({...parcial}) antes de criar a partida.
import { CLASSES, MISSEIS, TORPEDO, SAM } from './sim/classes.js';
import { BAL } from './naval5v5/balistica.js';
export const PARAM_PADRAO = {
  canhao: { cargaArco: [0.04, 0.3] /* v1.2.21 item 14a: faixa da carga reduzida do tiro em arco (fração de V0: mínima, máxima) */, vel: 3.28, /* v1.2.12: −8,9% (3,6→3,28); a tabela de tiro é recalculada do mesmo V0 */ arrasto: 0.08, dispersao: 1, porCalibre: {} }, // vel/arrasto: multiplicadores sobre V0 e o arrasto; porCalibre: { 127: { V0, cad, dano, alc } }
  missil: { pausa: 0.14, cadencia: 0.45, /* v1.2.8: salva mais rápida (0,7→0,45 s) */ vel: 6.7, /* v1.2.9: +18% sobre 1.2.7 */ /* v1.2.5: +35% (4,2→5,67) */ aceleracao: 4.2, gMax: 30, ejecao: 0.52, arco: 0.075, /* v1.2.10: ARCO alto e suave — pico ≈ 7,5% da distância (40–380 m) */ /* v1.2.9: ápice do booster ~35% mais baixo */ tipos: {} }, // vel multiplica v/vt; gMax em g (escala com v² para manter o raio de curva); tipos: { longo: { alc, dano, pkCiws } }
  rbuArco: { v: 420, h: 0.1, disp: 0.0045, guia: 1 }, /* v1.2.11: foguetes LG-4/LF-12 em ARCO (pico 10% da distância), 420 m/s, dispersão 0,45% da distância, acompanham o alvo travado */
  torpedo: { v: 400 }, /* v1.2.14: 400 m/s (pedido) — guiagem/olhar à frente escalados e teste varrido a cada 2 m */ /* v1.2.10: 300 m/s */ /* v1.2.9 (pedido explícito, final): 200 m/s — integração varrida (sem atravessar cascos) e guiagem escalada pela velocidade */ /* v1.2.8: ≈97 nós */ /* v1.2.7: corrida mais rápida (≈82 nós) */ /* v1.2.5: +35% (24→32,4 m/s) */ // ex.: { v: 24, alc: 6500, dano: 70 } (inalterado: o vídeo não mostra torpedos)
  sam: { vel: 3.25 }, /* v1.2.8: acompanha os mísseis +9% */ // SAM acompanha os mísseis mais rápidos (v1.2.5: ×1,35 junto com os mísseis)
  // efeitos por CALIBRE (mesma linguagem para todos os canhões, em escala; o couraçado de 305 mm é o topo da escala)
  calibre: { ref: 127, claraoBola: 1.0, fumacaDur: [0.9, 1.5], anelChoque: 120, colunaAlt: [12, 70], colunaDur: 2.0, faiscas: 1, tremor: [0.08, 0.95], tracanteGrossura: [0.42, 1.35] /* v1.2.21 item 6: traçante fino ∝ calibre (era 0,8–2,6) */ },
  fx: { brilhoGlobal: 0.55, /* v1.2.7: tiros/explosões menos iluminados */ clarao: 0.7, claraoDur: 0.08, fumacaTiro: 1.5, tracante: '#ff7a2a', /* v1.2.21 item 6: laranja-avermelhado de traçante real (era #ffb020 amarelo) */ tracanteLarg: 1.0, /* v1.2.8 */ geiser: 1.7, explosao: 0.9, explosaoMissil: 2.0, tremorTiro: 0.12, trilhaMissil: 10 },
  // v1.2.0 (revisão) — MOVIMENTO PERCEPTÍVEL dos veículos (vídeo de referência de helicóptero); tudo parametrizável
  heli: { vCruzKmh: 160, pitchAcel: 27, pitchFreio: 12, pitchCruz: 9, rollMax: 38, guinada: 0.75, inercia: 0.6, acelMax: 9, acelFreio: 24, taxaAtitude: 3.2,
    balancoGraus: 1, balancoHz: 0.5, sprayAlt: 25, altMin: 15, altMax: 120, altPasso: 10, altPadrao: 70, camDist: 18, camAlt: 5, tremorCanhao: 0.06,
    canhaoTps: 12, missilReto: 0.55, flares: 3, flareDur: 5, flareSam: 0.15, flareCiws: 0.55, hpEscala: 250, detectado: 9000 },
  navio: { bandaPequeno: 6.2, bandaGrande: 2.5, /* v1.2.15: corveta inclina mais, encouraçado/porta-aviões menos */ Lpequeno: 60, Lgrande: 300, tAcel: [8.0, 12.0], /* v1.2.8: aceleração ~13% mais viva */ velMul: 1.17, /* v1.2.8: +17% na velocidade máxima de TODAS as classes (proporções mantidas; nós exibidos = m/s × 1,944, sem fator de escala) */ /* v1.2.5: aceleração ~30% mais rápida (12–18→9,2–13,8 s) */
    /* v1.2.1 governo: raio mínimo de referência (m, ÷ giro da classe), crescimento do raio com a velocidade, servo do leme (rad/s ≈ 35° em 1 s),
       resposta de guinada (s, ×√(L/142)), zona morta do trilho, piloto automático de rumo (kp, kd). Contratorpedeiro a 30 nós ≈ 180° em 25–35 s. */
    rRef: 80.769 /* v1.2.5: era 105.0 */, kR: 0.6, lemeTaxa: 0.61, tGiro: 0.87 /* v1.2.5: era 1.0 */, zonaMorta: 0.08, apKp: 2.2, apKd: 8,
    /* v1.2.3: DERIVA (ângulo de deriva β ≈ kDeriva·L/R na curva, popa escorrega para fora; resposta tDeriva s) e ESTABILIZADOR de aletas (corta o balanço das ondas até estab, a partir de vEstab·vmax) */
    kDeriva: 0.12, betaMax: 0.14, tDeriva: 2.2, estab: 0.6, vEstab: 0.3, perdaCurva: 1.0 },
  /* v1.2.1 torres: giro em azimute por calibre ([cal máx mm, °/s]), elevação (rad/s); CIWS: giro (rad/s), setor cego da superestrutura (meia-largura, rad, abaixo de elCego) */
  /* v1.2.1 câmera 3ª pessoa PERTO: distância = (L·distL + dist0)·ajuste, altura = L·altL + alt0, mira em L·olhaL acima do convés; ajuste automático para o navio ocupar 'fracao' da largura */
  cam: { tauArf: 3.5 /* v1.2.21 item 15 */,  distL: 0.48, dist0: 12, altL: 0.14875, alt0: 5.225, /* fiscal nukefumaca: meio termo exato perto: (0.08·L+3.2) ↔ (0.15·L+5.0)×1.45 → média = 0.14875·L+5.225 (×1) */ olhaL: 0.03, fracao: 0.58, ajMin: 0.45, ajMax: 1.8, offAz: 0.6, lado: 0.04, minPx: 34, hfovMax: 80, autoMiraCone: 0.06, zoomMin: 0.4, folgaMin: 12, zoomMax: 1.9, margemCol: 2.5, folgaIlha: 6 }, /* v1.2.29: externas um pouco mais altas (mesmo distL) */
  /* v1.2.1 trava automática: tempo até travar (radar ativo/passivo, s), tolerância angular mínima (rad) + margem lateral (m) em volta do casco, manter trava fora da mira (s), troca de alvo (s); espoletas de proximidade (m) */
  trava: { tAtivo: 0.6, tPassivo: 0.95, tolMin: 0.035, margem: 60, tFora: 2, tTroca: 0.6, proxMissil: 15, proxTorp: 12, /* v1.2.5: 6→12 m — v1.2.24: NÃO usado (torpedo só detona no contato com o casco) */ coneMissil: 0.07, tMisAtivo: 1.6, tMisPassivo: 2.4 /* fiscal nukefumaca (item 7): trava míssil 1,6 / 2,4 s */ },
  torre: { az: [[90, 40], [140, 25], [200, 20], [999, 15]], el: 0.3 },
  /* v1.2.21 item 11c: RECARGA mínima realista por calibre (s por tiro, por torre) — vale igual para jogador e bots; [cal máx, s] */
  /* v1.2.21 item 14a/b: elevação MÁXIMA mecânica por calibre (rad): 57 mm 77° · 76 mm 85° · 100 mm 80° · 114 mm 55° · 127/130 mm 65° · 152/155 mm 60° · pesados 45°; recuo mola-amortecedor (curso normalizado; freio no recuo, recuperador amortecido no retorno) */
  elevMax: [[60, 1.344], [80, 1.484], [105, 1.396], [120, 0.96], [135, 1.134], [160, 1.047], [999, 0.785]],
  recuo: { kick: [111, 49], freio: [38, 26], w: [7.5, 4.2], zeta: 1.05 },
  recarga: { canhao: [[45, 0], [60, 0.42], [80, 0.75], [105, 0.75], [120, 2.2], [135, 2.2], [160, 5.0], [210, 8.0], [999, 12.0]], torpTubo: 4.0, vls: 8.0 /* fallback; world.recargaVlsSeg por tipo (item 7) */, rbu: 15.0 },
  ciws: { giro: 2.8, cego: 0.6, elCego: 0.35 },
  /* v1.2.2 DANO REAL de míssil/torpedo: fração do HP de referência do TIER do alvo (a escolta/fragata de linha do tier: ref),
     sem divisão pela blindagem de canhão; var = ±variação aleatória. Ouro = ogiva tandem/pesada. Heli/lancha/torpedo leve de heli são armas menores. */
  danoReal: { missil: { curto: 0.195, medio: 0.215, longo: 0.235, rasante: 0.24, hiper: 0.27, cruzeiro: 0.28 }, missilOuro: 0.35, missilHeli: 0.26, /* v1.2.30 item 13 (Valter 20:02): 0.13→0.26, aeronave APENAS (fracMissil só lê isto se m.heli) */ torpedo: 0.30, torpLeve: 0.30, /* v1.2.30 item 13: 0.20→0.30 (= torpedo pesado), só torpedo leve de aeronave (tp.leve) */ torpLancha: 0.15, var: 0.06,
    ref: { 1: 'corveta', 2: 'fragata', 3: 'cruzador' }, fogoMissil: 0.75, fogoTorp: 0.3, modMissil: 0.9, modTorp: 0.7, radarMissil: 0.25, flutuante: 1.8 },
  /* v1.2.2 DETECÇÃO: alcance visual base (m) por hora × tempo × assinatura do ALVO. Assinatura = (L/tamRef)^tamExp × furtividade × camuflagem × (1 + velMul·v/vmax) × (tiroMul se disparou há < tTiro s).
     Radar ativo: C.radar × (0,55 + 0,45·rcs) × assinatura de radar (tiro não muda); ESM: o radar ATIVO do alvo o revela (só marcação/ponto) até C.radar × esmMul.
     Sonar curto (m). Perda de contato: fantasma "?" por 'perda' s. Nome/HP inimigo só com contato confirmado E a < 'perto' m, ou travado. */
  deteccao: { visDia: 6500, visEntardecer: 4800, visNoite: 2200, chuva: 0.55, nublado: 0.8, tamRef: 150, tamExp: 0.5, furtivoVis: 0.72, furtivoRcs: 0.75,
    velMul: 0.22, tiroMul: 1.6, tTiro: 20, esmMul: 1.15, radarMul: 0.65, sonar: 1800, perda: 12, perto: 7000, vMin: 0.55 },
  /* v1.2.2 DISPERSÃO do canhão (1σ): lateral az (rad) e em ALCANCE alc (fração da distância) — elipse mais estreita na lateral; fatores multiplicativos. Bot ×bot. Estável = |guinada| baixa por > tEstavel s. */
  dispersao: { az: 0.0041, alc: 0.044, /* v1.2.15: um pouco mais fechada (1.2.14: 0.0048/0.055) */ calG: 0.85, calM: 0.95, calP: 1.08, distK: 0.25, vies: 0.3, bot: 1.3, giro: 1.4, vel: 0.35, avCanhao: 0.8, avRadar: 0.5, mar: 0.05, estavel: 0.8, tEstavel: 3, optica: 0.82, cmdArt: 0.88, wEstavel: 0.012,
    /* v1.2.3: balanço residual (taxa de balanço não compensada pelo estabilizador) e deriva na curva aumentam a dispersão */ balanco: 0.15, balRef: 0.03, deriva: 0.35, derRef: 0.1 },
  /* v1.2.2 encontros: meia-distância entre as bases (m) tentada em ordem (8–12 km entre frotas) */
  partida: { meias: [3700, 3400, 3100, 2800, 2400, 2000] /* v1.2.19 item 9: largada a ~5,5–7,5 km (antes 8–11 km): perto, mas não colado — ilhas/morros entre as linhas servem de abrigo */ }
};
export const PARAM = JSON.parse(JSON.stringify(PARAM_PADRAO));
const ORIG = new Map(); let ORIG_M = null, ORIG_S = null;
const mescla = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) { a[k] = a[k] || {}; mescla(a[k], b[k]); } else a[k] = b[k]; } return a; };
/** Aplica (parcialmente) sobre os padrões. Sempre parte dos valores originais das tabelas, então pode ser chamado de novo. */
export function aplicaParametros(p = {}) { mescla(PARAM, p); const P = PARAM;
  for (const C of Object.values(CLASSES)) { if (!ORIG.has(C)) { ORIG.set(C, Object.assign({}, C.canhao)); C.vmax0 = C.vmax; } if (C.vmax0) C.vmax = C.vmax0 * ((P.navio && P.navio.velMul) || 1); const c = (C.canhao = Object.assign({}, ORIG.get(C)));
    Object.assign(c, (P.canhao.porCalibre || {})[c.cal] || {}); c.V0 = c.V0 * (P.canhao.vel || 1); if (P.canhao.dispersao) c.disp = (c.disp || 1) * P.canhao.dispersao; }
  BAL.arrasto = P.canhao.arrasto || 1;
  if (!ORIG_M) ORIG_M = JSON.parse(JSON.stringify(MISSEIS)); for (const k in MISSEIS) { Object.assign(MISSEIS[k], ORIG_M[k], (P.missil.tipos || {})[k] || {}); MISSEIS[k].v *= P.missil.vel || 1; MISSEIS[k].vt *= P.missil.vel || 1; }
  if (!ORIG_S) ORIG_S = Object.assign({}, SAM); Object.assign(SAM, ORIG_S); SAM.v *= P.sam.vel || 1; Object.assign(TORPEDO, P.torpedo || {});
  return PARAM; }
aplicaParametros();

/** v1.2.21 item 11c: recarga mínima (s) do canhão por calibre (PARAM.recarga.canhao). */
export function recargaMinCal(cal) { const t = (PARAM.recarga || PARAM_PADRAO.recarga).canhao; for (const [c, s] of t) if (cal <= c) return s; return t[t.length - 1][1]; }
/** v1.2.21 item 14a: elevação máxima (rad) do canhão por calibre (PARAM.elevMax). */
export function elMaxCal(cal) { const t = PARAM.elevMax || PARAM_PADRAO.elevMax; for (const [c, e] of t) if (cal <= c) return e; return t[t.length - 1][1]; }
