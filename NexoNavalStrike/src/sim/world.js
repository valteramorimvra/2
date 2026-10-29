// Simulação DETERMINÍSTICA de passo fixo (1/60 s) do combate naval: navios, telégrafo/leme/adorno, flutuabilidade,
// canhões, mísseis VLS de 4 fases, torpedos, CIWS, chaff, sensores e data-link. Sem Three.js, sem Math.random e sem
// relógio de parede: dado o mesmo mapa, semente e comandos, o resultado é idêntico (base para o modo online futuro).
import { colideTodos } from './colisao.js';
import { G, clamp, ang, marcacao, Rng, hashNums } from './util.js';
import { CLASSES, MISSEIS, TORPEDO, FTEL, LEME_MAX } from './classes.js';
import { layoutDe } from './layout.js';
import { PARAM, recargaMinCal, elMaxCal } from '../armasParametros.js';
import { TIPO_NAVIO } from '../navalTechTreeEconomy.js';
import { alcVisual, alcRadar, alcEsm, QUAL, fatorSonar } from './deteccao.js';
import { danoMissil, danoTorpedo } from '../naval5v5/danoReal.js';
import { instalaCons, usaCons, passoCons } from '../naval5v5/consumiveis.js';
import { flutuacao, alturaMar, ONDAS } from './ocean.js';
const dh0 = (m, a) => Math.hypot(a.x - m.x, a.z - m.z);
const cristaMar = () => { let a = 0; for (let i = 0; i < ONDAS.length; i++) a += ONDAS[i].A; return a; }; /* v1.2.21 item 17: crista máxima do mar atual (Σ A ≈ altura máx. medida) */
import { alturaTerreno, bloqueado, losTerreno } from './maps.js';
import { respondeNavioTerreno, atualizaVCasco, zeraVHudSeTravado, resetCacheTerreno } from './colisaoTerreno.js';
import { toqueEstr } from './destruicao.js';
import { passoHidro } from '../naval5v5/hidro.js';
import { passoArmas5, taxaTorre, kickRecuo } from '../naval5v5/armas.js';
import { instalaSec } from '../naval5v5/secundarias.js';
import { arrastoCal, solucaoArrasto, elevacaoArrasto, arcoBloqueado, alcanceMax, cargaArco } from '../naval5v5/balistica.js';
import { instalaAvarias, passoAvarias, danoLocal, passoAfundamento, MODS_PADRAO } from '../naval5v5/avarias.js';
import { instalaAereo, instalaHelisNavio, comandoAereo, passoAereo, sensorAereo, POOL_AEREO } from '../naval5v5/aereo.js';
import { instalaDefesa, instalaNavio, passoCiws5, passoLaser, passoSam, passoSams, passoA30, passoAmeacas, granadaNaAgua, CIWS, POOL5 } from '../naval5v5/defesa.js';

import { instalaNuclear, passoNuclear, lancaNuclear, comandoNuclear } from './nuclear.js'; import { passoHidros, comandoHidro } from './hidroaviao.js'; /* v1.2.39: hidroaviões */
import { passoMissil1231, lancaMissilNuclear1231 } from './missilNuclear1231.js'; /* v1.2.31 */ /* v1.2.26: bombardeiro + bomba atômica */
export const DT = 1 / 60;
export const PISCA_BOT = 0.2;
/** v1.2.7 lança-granadas: velocidade de boca fixa (alcance máx. a 45°) e elevação de tiro baixo para a distância */
/** v1.2.9: dispersão da salva do lança-granadas (1σ): velocidade (fração), elevação e azimute (rad). 1.2.8: { v: 0.01, el: 0.012, az: 0.02 } */
export const RBU_DISP = { v: 0.003, el: 0.0012, az: 0.006 };
export const rbuV0 = (R) => Math.sqrt(R.alc * G) * 1.6; /* v1.2.9: boca mais rápida → arco mais baixo e voo mais curto (mesmo alcance) */ /* v1.2.8: foguete mais rápido → trajetória mais baixa/plana */ export const elRbu = (d, V0, alta = 0) => { const e = 0.5 * Math.asin(Math.min(1, (d * G) / (V0 * V0))); return alta ? alta : e; }; /* alta = elevação fixa (LF-12): o alcance vem da carga (velocidade) */ /* alta: parábola alta (LF-12, el ≥ 0,8) */
export const ALC_MIN = { vls: 0, torp: 400 }; /* fiscal nukefumaca (item 8 revisado Valter): SEM mín. de míssil (jogador+bots); torp 400 m */
/** fiscal nukefumaca (item 7): VLS — corveta/fragata 8 s, destroier/cruzador 6 s, capitânia/PA 10 s (jogador = bots). */
export function recargaVlsSeg(id) { const t = TIPO_NAVIO[id] || 'corveta'; return t === 'capitania' ? 10 : (t === 'destroier' || t === 'cruzador') ? 6 : 8; }
export const POOL_SEG = { canhao: [0, 224], rbu: [224, 288], heli: [288, 320] }; /* v1.2.14 */
const CANAL_RBU = ['rbu', 'tRbu', 'rbuFila', 'rbuTk', 'rbuEsp', 'rbuAlvo', 'rbuMont', 'rbuElv'];
export const POOL = { granadas: 320, misseis: 128, /* v1.2.11: 8×8 */ /* v1.2.1: 40+ simultâneos (salvas de todos os navios) */ torpedos: 32, iscas: 24, ...POOL5, ...POOL_AEREO };
export const CIWS_ALC = CIWS.alc, CIWS_RPM = CIWS.rpm;
export const FASE = { EJECAO: 1, PITCH: 2, CRUZEIRO: 3, TERMINAL: 4 };

// ---------- balística sem arrasto ----------
export const alcanceCom = (el, h0, v) => { const vy = v * Math.sin(el), vx = v * Math.cos(el); const t = (vy + Math.sqrt(vy * vy + 2 * G * h0)) / G; return { x: vx * t, t }; };
export function elevacaoPara(d, h0, v) { if (alcanceCom(Math.PI / 4, h0, v).x < d) return null; let a = -0.087, b = Math.PI / 4; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (alcanceCom(m, h0, v).x < d) a = m; else b = m; } return (a + b) / 2; }
/** Solução de tiro com avanço: itera o ponto futuro do alvo pelo tempo de voo. */
export function solucaoTiro(gx, gz, h0, V0, tx, tz, tvx, tvz, out) { let px = tx, pz = tz, el = 0, tv = 0; for (let i = 0; i < 6; i++) { const d = Math.hypot(px - gx, pz - gz); const e = elevacaoPara(d, h0, V0); if (e == null) return null; el = e; tv = alcanceCom(el, h0, V0).t; px = tx + tvx * tv; pz = tz + tvz * tv; } const o = out || {}; o.az = marcacao(gx, gz, px, pz); o.el = el; o.tv = tv; o.d = Math.hypot(px - gx, pz - gz); o.px = px; o.pz = pz; return o; }

function novoNavio(id, time, tipo, x, z, rumo, papel, opc = {}) {
  const md = opc.mods || MODS_PADRAO; const Cb = CLASSES[tipo], P = layoutDe(Cb, Cb.vls ? md.vlsMais || 0 : 0); /* v1.2.21 item 19b: células extras com posição própria */
  // cópia por navio (módulos comprados e avarias alteram vmax/giro/cadência só deste navio; CLASSES fica intacto)
  const C = Object.assign({}, Cb, { vida: Math.round(Cb.vida * (md.vida || 1)), vmax: tipo === 'nakhimov' ? Math.min(Cb.vmax * md.vmax, 27.778) /* v1.2.33: teto 100 km/h */ : Cb.vmax * md.vmax, acel: Cb.acel * md.acel, acelMul: md.acel || 1, vmaxMul: md.vmax || 1, giro: Cb.giro * md.giro, radar: Cb.radar * md.radar, rcs: Cb.rcs * md.rcs, canhao: Object.assign({}, Cb.canhao, { cad: Math.max(Cb.canhao.cad * 0.8, recargaMinCal(Cb.canhao.cal)) * md.cad /* v1.2.21 item 11c: nunca abaixo da recarga real do calibre */ /* v1.2.5: cadência 25% maior */ }) });
  return { id, time, tipo, C, P, papel, x, z, rumo, v: 0, w: 0, tel: 1, telAlvo: 1, lemeCmd: 0, leme: 0, rumoAlvo: null, adorno: 0, adornoV: 0, caturro: 0, balanco: 0, arfagem: 0,
    vida: C.vida, morto: 0, tMorto: 0, radarAtivo: 0 /* v1.2.2: todos saem em EMCON (radar passivo); o jogador liga no botão RADAR */, vls: C.vls ? C.vls + (md.vlsMais || 0) : 0, vlsMax: C.vls ? C.vls + (md.vlsMais || 0) : 0, tandem: md.missil === 'tandem' ? (md.tandemLote != null ? md.tandemLote : 8) : 0 /* v1.2.21 item 19b: ogiva tandem só nos 8 mísseis do lote */, municaoLote: md.municao === 'ap' || md.municao === 'sap' ? (md.municaoLoteN != null ? md.municaoLoteN : 80) : 0 /* item 19c: lote de 80 tiros e depois HE */, torp: C.torp, Cb, mods: md, comandante: opc.comandante || '', pintura: opc.pintura || Cb.pintura || 'cinza_naval', camoAereo: opc.camoAereo || 'padrao', /* v1.2.17 13i */ enfeite: opc.enfeite || null, lista: 0, trimDano: 0, chaff: C.chaff, tChaff: 0, incendio: 0,
    torres: P.torres.map((t) => ({ az: t.frente > 0 ? 0 : Math.PI, el: 0.05, rec: 0, recuo: 0, frente: t.frente, arco: t.arco, z: t.z, y: t.y, canos: t.canos || 1, nome: t.nome })),
    ciws: P.ciws.map((c) => ({ az: 0, el: 0.2, alvo: -1, fogo: 0, mun: 1550, t: 0 })),
    vlsUsadas: new Uint8Array(P.vls.length), tVls: 0, tTorp: 0, rbu: C.rbu ? C.rbu.salvas : 0, fgC: C.rbu && !C.torp ? { rbu: C.rbu.salvas, tRbu: 0, rbuFila: 0, rbuTk: 0, rbuEsp: 0, rbuAlvo: null, rbuMont: 0, rbuElv: 0.35 } : null, lg: null, rbuEsp: 0, rbuMont: 0, tRbu: 0, rbuFila: 0, rbuTk: 0, rbuAlvo: null, tuboAtivo: 0, torpModo: 'acustico',
    mira: { modo: 'livre', az: rumo, dist: 4000 }, _sol: { az: 0, el: 0, tv: 0, d: 0, px: 0, pz: 0, travado: 0 }, _o: { x: 0, y: 0, z: 0 }, gatilho: 0, alvoId: -1, trava: 0, alertaMissil: 0, sol: null,
    stats: { tiros: 0, loteTiros: 0, tandemLanc: 0, acertos: 0, misLanc: 0, misAcertos: 0, torpLanc: 0, torpAcertos: 0, abates: 0, dano: 0, intercept: 0, ricochetes: 0 } };
}
function pool(n, f) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = Object.assign({ ativo: 0, idx: i }, f()); return a; }

/** v1.2.25 item 1: desnível boca→ponto para a tabela balística. Antes era ≥ 0,5 m (não mirava ACIMA da boca: ponte alta de perto passava baixo); agora, só quando o ponto visado está acima da boca, o desnível fica negativo (até −80 m) — abaixo da boca é idêntico ao 1.2.24. */
function dhM(h0, hm) { const d = h0 - hm; return d >= 0.5 ? d : hm > 0 ? Math.max(-80, d) : 0.5; }
export class Sim {
  constructor({ arena, seed = 1, hora = 'dia', tempo = 'limpo' }) {
    this.T = arena; resetCacheTerreno(); this.rng = new Rng(seed); this.tick = 0; this.t = 0; this.hora = hora; this.tempo = tempo;
    this.navios = []; this.eventos = []; this.fim = null;
    this.granadas = pool(POOL.granadas, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, dono: -1, dano: 0, cal: 0, t: 0 }));
    this.misseis = pool(POOL.misseis, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, dono: -1, time: '', alvo: -1, isca: -1, fase: 0, t: 0, v: 0, perfil: null, cel: 0, iscasVistas: 0, tf: 0, d0: 0 }));
    this.torpedos = pool(POOL.torpedos, () => ({ x: 0, z: 0, rumo: 0, v: 0, dono: -1, time: '', alvo: -1, corrida: 0, modo: 'acustico', t: 0, buscando: 0 }));
    this.iscas = pool(POOL.iscas, () => ({ x: 0, y: 0, z: 0, dono: -1, time: '', t: 0, vx: 0, vz: 0 }));
    this.contatos = { azul: new Map(), vermelho: new Map() }; // id → { t, x, z, fonte }
    this.visual = hora === 'noite' ? 2600 : hora === 'entardecer' ? 6000 : 8500; if (tempo === 'chuva') this.visual *= 0.5; else if (tempo === 'nublado') this.visual *= 0.8;
    this.match = null; this._tmp = {}; this._o = { x: 0, y: 0, z: 0 }; this._s = { az: 0, el: 0, tv: 0, d: 0, px: 0, pz: 0 }; instalaDefesa(this); instalaAereo(this); instalaNuclear(this);
  }
  adicionaNavio(time, tipo, x, z, rumo, papel = 'jogador', opc) { const n = novoNavio(this.navios.length, time, tipo, x, z, rumo, papel, opc); instalaNavio(n); instalaSec(n); instalaAvarias(n); if (n.C.canhao && n.C.canhao.V0) { const k0 = arrastoCal(n.C.canhao.cal); alcanceMax(n.C.canhao.V0, k0); alcanceMax(n.C.canhao.V0, k0 * 0.9); } /* v1.2.1: tabelas balísticas (HE e AP) no carregamento — antes eram geradas no 1º tiro (pico de dezenas de ms) */ instalaCons(n, (opc && opc.cons) || (opc && opc.mods && opc.mods.cons) || {}); instalaHelisNavio(this, n, opc && opc.helis); this.navios.push(n); return n; }
  solucao(gx, gz, h0, V0, tx, tz, tvx, tvz, k) { return k ? solucaoArrasto(gx, gz, h0, V0, k, tx, tz, tvx, tvz, this._s) : solucaoTiro(gx, gz, h0, V0, tx, tz, tvx, tvz, this._s); }
  evento(e) { if (this.eventos.length < 800) this.eventos.push(e); }
  navio(id) { return this.navios[id]; }
  inimigos(n) { return this.navios.filter((o) => o.time !== n.time && !o.morto); }
  aliados(n) { return this.navios.filter((o) => o.time === n.time && !o.morto); }
  /** posição de um ponto local do navio no mundo (inclui arfagem, ignora caturro/balanço — erro < 1 m). */
  /** v1.2.11: local→mundo COM banda e caimento, idêntico ao grupo 3D (Euler XYZ: x = caimento, y = −rumo, z = −banda). */
  mundoInc(n, lx, ly, lz, o) { const px = n.caturro + (n.trimDano || 0) + (n.morto ? 0 : (Math.abs(n.v) / n.C.vmax) * 0.006) /* v1.2.21 item 15: só o levantar de proa em velocidade — sem a senoide fixa */, g = -(n.adorno + n.balanco + (n.lista || 0)), th = -n.rumo;
    const cg = Math.cos(g), sg = Math.sin(g), x1 = lx * cg - ly * sg, y1 = lx * sg + ly * cg; const ct = Math.cos(th), st = Math.sin(th), x2 = x1 * ct + lz * st, z2 = -x1 * st + lz * ct; const ca = Math.cos(px), sa = Math.sin(px);
    o.x = n.x + x2; o.y = n.arfagem + y1 * ca - z2 * sa; o.z = n.z + y1 * sa + z2 * ca; return o; }
  mundo(n, lx, ly, lz, o) { const c = Math.cos(n.rumo), s = Math.sin(n.rumo); o.x = n.x + lx * c - lz * s; o.z = n.z + lx * s + lz * c; o.y = ly + n.arfagem; return o; }

  // ======================= COMANDOS (o único jeito de alterar a simulação) =======================
  aplica(cmd) {
    const n = this.navios[cmd.id]; if (!n || n.morto) return;
    switch (cmd.t) {
      case 'telegrafo': n.telAlvo = clamp(cmd.v | 0, 0, 4); break;
      case 'leme': n.lemeCmd = clamp(+cmd.v || 0, -1, 1); n.rumoAlvo = null; break;
      case 'optica': n.optica = cmd.v ? 1 : 0; break; /* v1.2.2: ÓPTICA/binóculo reduz a dispersão */
      case 'rumo': n.rumoAlvo = cmd.v == null || cmd.v < -10 ? null : ang(+cmd.v || 0); n.pivo = 0; break; // v1.2.1 piloto automático de rumo
      case 'mira': n.mira.modo = 'livre'; n.mira.az = +cmd.az; n.mira.dist = clamp(+cmd.dist, 300, n.C.canhao.alc); n.tMiraCmd = 1; if (Number.isFinite(cmd.px) && Number.isFinite(cmd.pz)) { n.mira.px = +cmd.px; n.mira.pz = +cmd.pz; n.mira.h = clamp(Number.isFinite(cmd.h) ? +cmd.h : 0, 0, 80); } else n.mira.px = null; n.mira.elD = Number.isFinite(cmd.elD) ? clamp(+cmd.elD, 0, 1.5) : null; /* v1.2.25 item 1 */ break;
      case 'miraLivre': n.miraLivre = cmd.v ? 1 : 0; break; /* v1.2.14: MIRA LIVRE — canhão sem trava/avanço: vai ao ponto exato */
      case 'travar': { const a = this.navios[cmd.alvo]; if (a && !a.morto && a.time !== n.time && this.oculto(n, a) && !(this.vlsContorna(n) && this.detectado(n.time, a.id))) { this.evento({ t: 'travaNegada', id: n.id, alvo: a.id }); break; } /* v1.2.15: alvo atrás do relevo não pode ser selecionado */ if (a && !a.morto && a.time !== n.time) { if (n.alvoId !== a.id) n.trava = 0; n.alvoId = a.id; } else { n.alvoId = -1; n.trava = 0; } break; }
      case 'canhao': if (cmd.modo === 'um') { const i = this.escolheTorre(n); if (i >= 0) { const tr = n.torres[i]; tr.pend = Math.min(12, Math.max(0, tr.rec) + Math.abs(tr.erroAz || 0) / taxaTorre(n.C.canhao.cal) + 0.3); tr.pendT = 1; } } else if (cmd.seg) { n.gatilho = 0.45; for (const t of n.torres) if (!t.pendT) { t.pend = 0.45; t.pendH = 1; } } else { n.gatilho = 0.7; for (const t of n.torres) { t.pend = 12; t.pendT = 0; } } break; /* v1.2.21 item 11a/b: TOQUE = 1 tiro de 1 torre, pendente só pela recarga + giro real (sem tiro tardio 'sozinho'); SEGURAR do jogador (seg) renova a cada 0,35 s e PARA ao soltar */
      case 'canhaoSolta': n.gatilho = 0; for (const t of n.torres) if (t.pendH) { t.pend = 0; t.pendH = 0; } break; /* v1.2.14: TOQUE = uma torre (a próxima pronta com arco livre); SEGURAR (modo padrão, também dos bots) = todas */ /* v1.2.12: o toque fica PENDENTE por torre até 12 s — torre ainda girando atira assim que alinha (antes o toque expirava em 0,7 s e as torres pesadas não atiravam) */
      case 'missil': this.lancaMissil(n, cmd.alvo != null ? cmd.alvo : n.alvoId, cmd.n || 1, cmd.az); break;
      case 'torpedo': this.lancaTorpedo(n, cmd.alvo != null ? cmd.alvo : n.alvoId); break;
      case 'torpModo': n.torpModo = cmd.v === 'reto' ? 'reto' : 'acustico'; break;
      case 'contramedida': this.lancaIsca(n); break;
      case 'radar': n.radarAtivo = cmd.v ? 1 : 0; break;
      case 'auto': n.autoFogo = cmd.v ? 1 : 0; break;
      case 'pivo': n.pivo = clamp(Math.round(+cmd.v || 0), -1, 1); if (n.pivo) n.rumoAlvo = null; break;
      case 'sam': n.samAuto = cmd.v ? 1 : 0; break;
      case 'reparo': this.usaReparo(n); break;
      case 'cons': usaCons(this, n, String(cmd.k)); break;
      case 'rbu': if (cmd.canal === 1 && n.fgC) { this.trocaCanal(n); this.lancaRbu(n, cmd.alvo != null ? cmd.alvo : n.alvoId); this.trocaCanal(n); } else this.lancaRbu(n, cmd.alvo != null ? cmd.alvo : n.alvoId); break; /* v1.2.14: canal 1 = FOGUETES ASW independente do lança-granadas */
      case 'uav': case 'esquadrilha': case 'heliLanca': case 'heliCtrl': case 'heliFlare': case 'iaNavio': case 'heliFogo': case 'heliVolta': case 'controle': comandoAereo(this, n, cmd); break;
      case 'nuclear': (n.C.missilNuclear ? lancaMissilNuclear1231 : lancaNuclear)(this, n, cmd); break; /* v1.2.31: míssil nuclear de navio */ /* v1.2.26 */
      case 'hidro': case 'hdPil': case 'hdMissil': case 'hdTorp': case 'hdFlare': case 'hdVolta': comandoHidro(this, n, cmd); break; /* v1.2.39 */
      case 'nkPiloto': case 'nkEspera': case 'nkCtl': case 'nkThr': case 'nkMiraSolo': case 'nkTrava': case 'nkSolta': if (cmd.t === 'nkSolta' && n.hd && n.hd.pil && n.hd.noAr >= 0) { comandoHidro(this, n, cmd); break; } comandoNuclear(this, n, cmd); break; /* v1.2.26/28: pilotagem + acel + mira solo */
    }
  }

  // ======================= PASSO =======================
  passo(cmds) {
    if (cmds) for (const c of cmds) this.aplica(c);
    const dt = DT; this.tick++; this.t += dt;
    const L = this.ordemTick(); /* v1.2.20: ORDEM NEUTRA — a cada tick a ordem de processamento dos navios se inverte (antes o azul sempre ia primeiro e o vermelho, por último, reagia ao estado mais novo: vantagem sistemática do vermelho em bot × bot) */
    for (const n of L) this.passoNavio(n, dt);
    this.passoGranadas(dt); this.passoMisseis(dt); passoSams(this, dt); this.passoTorpedos(dt); passoAereo(this, dt); passoMissil1231(this, dt); passoNuclear(this, dt); passoHidros(this, dt); this.passoIscas(dt); passoAmeacas(this, dt);
    for (const n of L) { passoCiws5(this, n, dt); passoLaser(this, n, dt); passoSam(this, n, dt); passoA30(this, n, dt); }
    if (this.tick % 15 === 0) this.sensores();
    for (const n of L) passoArmas5(this, n, dt);
    if (this.match) this.match.passo(this, dt);
  }

  ordemTick() { if (!(this.tick & 1)) return this.navios; const N = this.navios; let R = this._ordInv; if (!R || R.length !== N.length) { R = this._ordInv = new Array(N.length); } for (let i = 0; i < N.length; i++) R[i] = N[N.length - 1 - i]; return R; }
  passoNavio(n, dt) {
    const C = n.C;
    if (n.morto) { passoAfundamento(this, n, dt); return; }
    const ox = n.x, oz = n.z, orr = n.rumo; passoHidro(this, n, dt); // v1.1.0: hidrodinâmica pesada (naval5v5/hidro.js)
    // v1.2.29 item 10: casco × terreno — hard stop sem atravessar; ré libera; HUD usa deslocamento real
    respondeNavioTerreno(this, n, ox, oz, dt, orr);
    atualizaVCasco(n, ox, oz, dt);
    zeraVHudSeTravado(n);
    // colisão SÓLIDA entre navios (sim/colisao.js)
    colideTodos(this, n, dt); /* v1.2.16 (item 15): cápsulas sólidas + impulso com massa + guinada + deriva + abalroamento (só inimigos) */
    // incêndio, alagamento, módulos avariados, reparo e recarga das iscas (naval5v5/avarias.js)
    if (Math.abs(n.w || 0) < PARAM.dispersao.wEstavel && Math.abs((n.v || 0) - (n._vEst || 0)) < 0.5 * dt * 60) n.tEstavel = (n.tEstavel || 0) + dt; else n.tEstavel = 0; n._vEst = n.v; /* v1.2.2: navio estável (sem guinada) há quanto tempo */
    if ((this.tick + n.id) % 6 === 0) this.fatorDisp(n);
    passoAvarias(this, n, dt); passoCons(this, n, dt); if (n.C.rbu) { this.passoRbu(n, dt); if (n.fgC && (n.fgC.rbuFila > 0 || n.fgC.tRbu > 0)) { this.trocaCanal(n); n._canal1 = 1; this.passoRbu(n, dt); n._canal1 = 0; this.trocaCanal(n); } } /* v1.2.14: granadas e foguetes com filas/recargas próprias */
    if (n.tChaff > 0) n.tChaff -= dt; if (n.tVls > 0) n.tVls -= dt; if (n.tTorp > 0) n.tTorp -= dt;
    // trava de alvo: precisa de contato atual; radar ativo trava mais rápido
    this.travaAuto(n, dt); const PT = PARAM.trava;
    if (n.alvoId >= 0) { const a = this.navios[n.alvoId], c = this.detectado(n.time, n.alvoId); /* v1.2.2: trava exige alvo DETECTADO (radar ou confirmado) */ if (!a || a.morto) { n.alvoId = -1; n.trava = 0; } else if (c && this.oculto(n, a) && !this.vlsContorna(n)) { if (n.trava > 0) this.evento({ t: 'destravado', id: n.id, alvo: a.id, oculto: 1 }); n.trava = 0; /* v1.2.15: passou para trás do relevo → perde a trava (contato vira última posição conhecida) */ } else if (c) { n.alvoOculto = this.oculto(n, a) ? 1 : 0; /* fiscal nukefumaca: trava mantida p/ VLS mesmo atrás do relevo */ const ant = n.trava; n.trava = Math.min(1, n.trava + dt * (n.mods.trava || 1) / (n.radarAtivo ? PT.tAtivo : PT.tPassivo)); /* v1.2.15: módulo AESA/lendária aceleram a trava (antes o efeito não era aplicado) */ if (ant < 1 && n.trava >= 1) this.evento({ t: 'travado', id: n.id, alvo: a.id }); } else n.trava = Math.max(0, n.trava - dt * 0.5); }
    if (n.alvoId !== n._tmAlvo || !(n.trava >= 1) || n.morto) { n.travaMis = 0; n._tmAlvo = n.alvoId; } else if ((n.travaMis || 0) < 1) { const a0 = n.travaMis || 0; n.travaMis = Math.min(1, a0 + dt * (n.mods.trava || 1) / (n.radarAtivo ? PT.tMisAtivo : PT.tMisPassivo)); if (n.travaMis >= 1) this.evento({ t: 'travadoMis', id: n.id, alvo: n.alvoId }); } /* v1.2.17 item 17: trava do MÍSSIL leva tempo (progresso no botão VLS) */
  }

  // ======================= CANHÃO =======================
  /** Calcula a pontaria do navio (azimute absoluto, elevação, ponto de impacto previsto). */
  /** v1.2.21 item 14: velocidade horizontal do PRÓPRIO navio (somada ao projétil na boca) — avanço + deriva. */
  velNavio(n, o) { const vl = n.v * Math.tan(n.deriva || 0), c = Math.cos(n.rumo), s = Math.sin(n.rumo); o.ux = s * n.v + c * vl; o.uz = -c * n.v + s * vl; return o; }
  pontaria(n) {
    const A = n.C.canhao, sk = (this.tick + n.id) % 6 === 0, bq = n._sol.bloq || 0, em = elMaxCal(A.cal);
    const eDir = !!(n.mira && n.mira.elD != null); /* v1.2.25 item 1: mira ACIMA do horizonte = elevação direta escolhida pelo jogador — não troca para o ramo alto */ let sol; if (!sk) { sol = this._pont(n, n._alto && !eDir ? 1 : 0); sol.bloq = bq; }
    else { /* v1.2.21 item 14a: arco baixo bloqueado por ilha/montanha e a torre eleva o bastante → TIRO EM ARCO (ramo alto), para jogador e bots */
      sol = this._pont(n, 0); sol.bloq = arcoBloqueado(this.T, alturaTerreno, n._o.x, n._o.z, n._h0, sol);
      if (sol.bloq && em > 0.8 && !eDir) { const s2 = this._pont(n, 1); if (s2.alto && s2.el <= em) { s2.bloq = arcoBloqueado(this.T, alturaTerreno, n._o.x, n._o.z, n._h0, s2); if (!s2.bloq) { n._alto = 1; sol = s2; } } if (!sol.alto) { n._alto = 0; sol = this._pont(n, 0); sol.bloq = 1; } }
      else n._alto = 0; }
    n.sol = sol; return sol;
  }
  /** v1.2.21 item 14a: ramo alto = tiro em ARCO com CARGA REDUZIDA (como obuseiro/morteiro): elevação fixa perto de 57° (ou o limite mecânico da torre)
   *  e a carga (V0 de boca) resolvida pela MESMA integração da sim (g + arrasto quadrático, passo 1/60) — sem tabela, ≈ 0,2 ms a cada 6 passos e só quando o arco baixo está bloqueado. */
  _pont(n, alto) { const s0 = this._pont1(n, 0, 1); if (!alto) return s0; const A = n.C.canhao, em = elMaxCal(A.cal); if (em < 0.75) return s0;
    const elA = Math.min(em - 0.01, 1.0), k = this.kArrasto(n), o = n._o, h0 = n._h0, hm = s0.hMira || 0, U = this._U; const alvo = s0.travado && n.alvoId >= 0 ? this.navios[n.alvoId] : null;
    const avx = alvo ? Math.sin(alvo.rumo) * alvo.v : 0, avz = alvo ? -Math.cos(alvo.rumo) * alvo.v : 0, bx = alvo ? alvo.x : s0.px, bz = alvo ? alvo.z : s0.pz; const r = n._rA || (n._rA = {}); /* por navio: partida a quente da carga */
    let px = bx, pz = bz, qx = px, qz = pz, tv = 0, V = 0, d = 0;
    if (r.V > 0) { V = r.V; tv = r.t || 0; d = Math.hypot(bx - o.x, bz - o.z); } for (let it = 0, nIt = r.V > 0 ? 1 : 4; it < nIt; it++) { px = bx + avx * tv; pz = bz + avz * tv; const fu = V ? d / (V * Math.cos(elA)) : 0; qx = px - U.ux * fu; qz = pz - U.uz * fu; d = Math.max(150, Math.hypot(qx - o.x, qz - o.z));
      if (!cargaArco(d, Math.max(0.5, h0 - hm), elA, k, A.V0 * PARAM.canhao.cargaArco[0], A.V0 * PARAM.canhao.cargaArco[1], r)) return s0; V = r.V; tv = r.t; }
    const sol = s0; sol.az = marcacao(o.x, o.z, qx, qz); sol.el = elA; sol.tv = tv; sol.ymax = r.ymax; sol.d = d; sol.qx = qx; sol.qz = qz; sol.px = px; sol.pz = pz; sol.alto = 1; sol.carga = V / A.V0; return sol; }
  _pont1(n, alto, cg) {
    const A = n.C.canhao, V0p = A.V0 * cg, tr = n.P.torres[0], o = this.mundo(n, 0, tr.y + 2, tr.z, n._o); const h0 = Math.max(2, o.y); n._h0 = h0;
    let sol = null; const alvo = n.alvoId >= 0 ? this.navios[n.alvoId] : null; const c = alvo ? this.contatos[n.time].get(alvo.id) : null;
    const k = this.kArrasto(n); const U = this.velNavio(n, this._U || (this._U = {})), ux = U.ux, uz = U.uz;
    /* ponto a atingir P → ponto de PONTARIA Q = P − u·d/(V0·cos el): o projétil leva a velocidade do navio e o arrasto conserva a direção horizontal */
    const mira = (px, pz, hm) => { sol = n._sol; let qx = px, qz = pz, okE = 0; for (let it = 0; it < 3; it++) { const d = Math.max(150, Math.hypot(qx - o.x, qz - o.z)); okE = elevacaoArrasto(d, dhM(h0, hm), V0p, k, sol, alto) ? 1 : 0; if (!okE) break; const fu = d / (V0p * Math.max(0.05, Math.cos(sol.el))); qx = px - ux * fu; qz = pz - uz * fu; }
      const dq = Math.hypot(qx - o.x, qz - o.z); if (!okE || !elevacaoArrasto(Math.max(150, dq), dhM(h0, hm), V0p, k, sol, alto)) { sol.el = 0.05; sol.tv = dq / V0p; sol.ymax = h0; sol.alto = 0; }
      sol.az = marcacao(o.x, o.z, qx, qz); sol.d = dq; sol.px = px; sol.pz = pz; sol.qx = qx; sol.qz = qz; sol.hMira = hm; };
    if (n.miraLivre && n.mira.px != null) { /* v1.2.14 MIRA LIVRE: ponto exato (mar/casco) com balística real (arrasto), SEM trava e SEM avanço */ mira(n.mira.px, n.mira.pz, n.mira.h || 0); sol.travado = 0; sol.livre = 1; if (sol.d > A.alc) sol.d = A.alc; }
    else if (alvo && c && this.t - c.t < 2 && (c.q == null || c.q >= 2)) { if (n._sol) n._sol.livre = 0; const vx = Math.sin(alvo.rumo) * alvo.v, vz = -Math.cos(alvo.rumo) * alvo.v; sol = solucaoArrasto(o.x, o.z, Math.max(0.5, h0 - alvo.C.F * 0.7), V0p, k, alvo.x, alvo.z, vx, vz, n._sol, alvo.w || 0, ux, uz, alto); /* v1.2.14: + guinada do alvo · v1.2.21: + velocidade do próprio navio e ramo alto */ if (sol) sol.hMira = h0 - Math.max(0.5, h0 - alvo.C.F * 0.7); /* v1.2.4: altura do ponto visado (para a correção por cano) */ if (sol && sol.d > A.alc) sol = null; if (sol) sol.travado = 1; }
    if (!sol) { const d = clamp(n.mira.dist, 300, A.alc); mira(o.x + Math.sin(n.mira.az) * d, o.z - Math.cos(n.mira.az) * d, 0); sol.livre = 0; sol.travado = 0; }
    if (n.mira.elD != null && sol && !sol.alto) { const eD = Math.min(elMaxCal(A.cal), n.mira.elD); if (eD > sol.el) { sol.el = eD; sol.direto = 1; } else sol.direto = 0; } else if (sol) sol.direto = 0; /* v1.2.25 item 1: jogador mirou ACIMA da solução → canos sobem até o limite do calibre e o tiro sai pelo eixo do cano */
    sol.carga = cg; return sol;
  }
  /** v1.2.2: fator de dispersão atual do navio (1 = navio parado, sem avaria, mar calmo, sem bônus). Também exposto em n.dispF para o anel da mira. */
  fatorDisp(n) { const P = PARAM.dispersao, C = n.C; let f = n.mods.disp || 1; /* comandante/módulos de artilharia */ if (n.mods.cmdArt) f *= P.cmdArt;
    f *= 1 + P.giro * Math.min(1, Math.abs(n.w || 0) / 0.06); const vr = Math.min(1, Math.abs(n.v) / Math.max(1, C.vmax)); f *= 1 + P.vel * vr * vr;
    f *= 1 + P.avCanhao * (1 - clamp(n.avaria.canhao, 0, 1)) + P.avRadar * (1 - clamp(n.avaria.radar != null ? n.avaria.radar : 1, 0, 1)); f *= 1 + P.mar * (this.T.def.bf || 0);
    const te = n.tEstavel || 0; if (te > P.tEstavel) f *= 1 - (1 - P.estavel) * Math.min(1, (te - P.tEstavel) / 2); if (n.optica) f *= P.optica; f *= 1 + P.balanco * Math.min(2, (n.balancoV || 0) / P.balRef) + P.deriva * Math.min(2, Math.abs(n.deriva || 0) / P.derRef); /* v1.2.3: balanço residual e deriva */ n.dispF = f; return f; }
  /** Coeficiente de arrasto do projétil do navio (munição AP é mais densa: conserva velocidade). */
  kArrasto(n) { return arrastoCal(n.C.canhao.cal) * (n.mods && n.mods.municao === 'ap' ? 0.9 : 1); }
  /** v1.1.0: multi-torre + AUTO-FOGO em naval5v5/armas.js */
  passoArmas(n, dt) { passoArmas5(this, n, dt); }
  /** v1.2.14: próxima torre para um TOQUE — com arco livre, boca desobstruída e sem toque pendente; pronta e alinhada primeiro, depois a que recarrega antes; rodízio entre iguais. */
  escolheTorre(n) { let best = -1, bs = 1e9; const N = n.torres.length; const r0 = (n.proxTorre || 0) % Math.max(1, N);
    for (let j = 0; j < N; j++) { const i = (r0 + j) % N, tr = n.torres[i]; if (tr.bloqueada || tr.obstr || tr.pend > 0) continue; const sc = Math.max(0, tr.rec) * 10 + (tr.girando ? 1 + Math.abs(tr.erroAz || 0) : 0) + j * 0.01; if (sc < bs) { bs = sc; best = i; } }
    if (best >= 0) n.proxTorre = best + 1; return best; }
  /** v1.2.14: estado de obstrução da boca da torre i na posição ATUAL (HUD: ícone cinza + aviso 'torre obstruída'). */
  torreObstruida(n, i) { const tr = n.torres[i], A = n.C.canhao; const L = this.P_(n, i, 0); const o = this.mundoInc(n, L.x, L.y, L.z, this._oO || (this._oO = { x: 0, y: 0, z: 0 })); const az = n.rumo + tr.az, ce = Math.cos(tr.el); return this.bocaObstruida(o, Math.sin(az) * ce * A.V0, Math.sin(tr.el) * A.V0, -Math.cos(az) * ce * A.V0); }
  /** v1.2.13: a trajetória dos primeiros 0,12 s (≈ 7 passos) entra em terreno ou na água? Então a boca está obstruída. */
  bocaObstruida(o, vx, vy, vz) { for (let k = 0; k <= 7; k++) { const t = k / 60, x = o.x + vx * t, z = o.z + vz * t, y = o.y + vy * t - G * t * t / 2; if (alturaTerreno(this.T, x, z) > y || y <= alturaMar(x, z, this.t)) return true; } return false; }
  /** v1.2.21 item 14c: velocidade da BOCA (m/s, mundo) = avanço/deriva do navio + arfagem + rotação de balanço/caturro (derivada numérica de mundoInc, mesma convenção do casco). */
  velBoca(n, L, o) { const U = this.velNavio(n, this._U2 || (this._U2 = {})); const a = this.mundoInc(n, L.x, L.y, L.z, this._vb1 || (this._vb1 = {})); const ax = a.x, ay = a.y, az = a.z, e = 0.01, b0 = n.balanco, c0 = n.caturro, h0 = n.arfagem;
    n.balanco = b0 + (n.balV || 0) * e; n.caturro = c0 + (n.catV || 0) * e; n.arfagem = h0 + (n.arfV || 0) * e; const b = this.mundoInc(n, L.x, L.y, L.z, this._vb1); n.balanco = b0; n.caturro = c0; n.arfagem = h0;
    let rx = (b.x - ax) / e, ry = (b.y - ay) / e, rz = (b.z - az) / e; const m = Math.hypot(rx, ry, rz); if (!(m < 25)) { rx = ry = rz = 0; } o.x = U.ux + rx; o.y = ry; o.z = U.uz + rz; return o; }
  /** v1.2.21 item 14: correção de elevação POR CANO (boca real até o ponto de pontaria), mesmo ramo (baixo/alto) da solução. */
  elCano(n, L, sol, ruA, kA, VB) { if (!sol || sol.px == null || sol.el == null) return null; const A = n.C.canhao, V0s = A.V0 * (sol.alto && sol.carga ? sol.carga : 1); const om = this.mundoInc(n, L.x, L.y, L.z, this._oEC || (this._oEC = {})); /* v1.2.21 item 15: altura REAL da boca com balanço/caturro */ const qx = sol.qx != null ? sol.qx : sol.px, qz = sol.qz != null ? sol.qz : sol.pz; const dm = Math.hypot(qx - om.x, qz - om.z); const o2 = this._eD || (this._eD = {}); if (sol.alto) return -(VB ? VB.y / (V0s * Math.max(0.05, Math.cos(sol.el))) : 0); /* arco: boca a ±2 m do ponto de referência muda < 0,05% o alcance */ if (elevacaoArrasto(Math.max(150, dm * (1 + ruA)), dhM(om.y, sol.hMira || 0), V0s, kA, o2, sol.alto ? 1 : 0)) return o2.el - sol.el - (VB ? VB.y / (V0s * Math.max(0.05, Math.cos(sol.el))) : 0); /* v1.2.21 item 14c: direção de tiro compensa a velocidade VERTICAL da boca (arfagem/balanço) */ return null; }
  /** v1.2.21 item 14e: PREVISÃO do tiro da torre i AGORA (cano 0, sem dispersão), integrada com a MESMA física de passoGranadas (passo fixo 1/60, g, arrasto quadrático, boca + velocidade do navio). pts = Float32Array(3·N) amostrado; devolve { x, y, z, t, n } do impacto. */
  prevTiro(n, i, sol, pts, out, plano = 0) { const A = n.C.canhao, tr = n.torres[i], V0s = A.V0 * (sol && sol.alto && sol.carga ? sol.carga : 1); if (!tr) return null; const L = this.P_(n, i, 0); const kA = this.kArrasto(n); const VB = this.velBoca(n, L, this._VBp || (this._VBp = {})); let el = tr.el; const ec = this.elCano(n, L, sol, 0, kA, VB); if (ec != null) el += ec; const az = n.rumo + tr.az, ce = Math.cos(el);
    const o = this.mundoInc(n, L.x, L.y, L.z, this._oP || (this._oP = {})); let x = o.x, y = o.y, z = o.z, vx = Math.sin(az) * ce * V0s + VB.x, vy = Math.sin(el) * V0s + VB.y, vz = -Math.cos(az) * ce * V0s + VB.z; const dt = DT, Np = pts ? pts.length / 3 : 0; let t = 0, k = 0; if (out) out.navio = -1;
    const tv = sol && sol.tv ? sol.tv : 30, passoA = Math.max(1, Math.round(tv / dt / Math.max(1, Np - 1)));
    for (let s = 0; s < 60 * 150; s++) { const vg = Math.hypot(vx, vy, vz), kd = kA * vg * dt; vx -= kd * vx; vz -= kd * vz; vy -= G * dt + kd * vy; x += vx * dt; y += vy * dt; z += vz * dt; t += dt;
      if (pts && s % passoA === 0 && k < Np) { pts[k * 3] = x; pts[k * 3 + 1] = y; pts[k * 3 + 2] = z; k++; }
      if (!plano) { /* v1.2.21 item 14e: a granada PARA no casco (mesma acertaNavio e subamostragem ≤ 4 m de passoGranadas) — sem isso, na trajetória tensa o ponto de queda aparecia ~900 m ALÉM do navio que o tiro de fato acerta */ const sg = Math.hypot(vx, vy, vz) * dt; let ns = 0; for (const q of this.navios) { if (q.morto || q.id === n.id) continue; const Rq = q.C.L * 0.55 + sg, dx = x - q.x, dz = z - q.z; if (dx * dx + dz * dz < Rq * Rq) { ns = Math.min(24, Math.max(2, Math.ceil(sg / 4))); break; } }
        if (ns) { const h0 = this._hP || (this._hP = {}); const ox = x - vx * dt, oy = y - vy * dt, oz = z - vz * dt; for (let si = 1; si <= ns; si++) { const f = si / ns, px = ox + (x - ox) * f, py = oy + (y - oy) * f, pz = oz + (z - oz) * f; if (this.acertaNavio(px, py, pz, n.id, h0)) { out.x = px; out.y = py; out.z = pz; out.t = t; out.n = k; out.terra = 0; out.navio = h0.n.id; return out; } } } }
      if (plano) { if (y <= (sol && sol.hMira || 0)) { out.x = x; out.y = y; out.z = z; out.t = t; out.n = k; out.terra = 0; return out; } continue; } /* plano = sem ondas/terreno (teste da pontaria) */ if (y < 400) { const hA = alturaMar(x, z, this.t + t); if (y <= hA || (y < 1500 && alturaTerreno(this.T, x, z) > y)) { out.x = x; out.y = Math.max(hA, y); out.z = z; out.t = t; out.n = k; out.terra = alturaTerreno(this.T, x, z) > hA ? 1 : 0; return out; } } }
    return null; }
  disparaCanhao(n, i, sol) {
    const A = n.C.canhao, tr = n.torres[i], nc = tr.canos || 1, V0s = A.V0 * (sol && sol.alto && sol.carga ? sol.carga : 1) /* v1.2.21 item 14a: tiro em arco com CARGA REDUZIDA */; let saiu = 0;
    const PDs = PARAM.dispersao; const disp = A.disp * this.fatorDisp(n); const bot = n.papel !== 'jogador' || n.controleIA ? PDs.bot : 1; /* v1.2.2: dispersão parametrizada (PARAM.dispersao) */
    // v1.2.0 — ENQUADRAMENTO: cada novo alvo começa com um erro sistemático de direção de tiro (alcance e deriva) que as
    // correções de salva vão reduzindo (~28% por salva); alvo guinando reabre o erro. Bots erram mais que a direção de tiro do jogador.
    const chave = sol && sol.travado ? (sol === n._sol ? n.alvoId : sol.alvo) : -2; const fc = 1;
    if (tr.fcAlvo !== chave) { tr.fcAlvo = chave; tr.biasAz = this.rng.gauss() * 0.0042 * bot * fc * PDs.vies; tr.biasR = this.rng.gauss() * 0.035 * bot * PDs.vies; }
    else { const al = this.navios[chave]; if (al && Math.abs(al.w) > 0.012) { tr.biasAz += this.rng.gauss() * 0.0018; tr.biasR += this.rng.gauss() * 0.012; } }
    const dAl = sol && sol.d ? sol.d : n.mira.dist || 3000, kA = this.kArrasto(n), alto = sol && sol.alto ? 1 : 0; let elB = null; { const o3 = this._eD3 || (this._eD3 = {}); if (!alto && elevacaoArrasto(dAl, 5, V0s, kA, o3, 0)) elB = o3.el; }
    for (let k = 0; k < nc; k++) { const g = this.slotGranada('canhao'); if (!g) break;
      const L = this.P_(n, i, nc > 1 ? (2 * k - (nc - 1)) / (nc - 1) : 0); /* v1.2.3: canos simétricos (3 canos: −1, 0, +1 — antes 2 de 3 saíam do mesmo lado, viés lateral) */ const fCal = A.cal >= 200 ? PDs.calG : A.cal >= 100 ? PDs.calM : PDs.calP, fDist = 1 + PDs.distK * Math.min(1.5, (n.mira.dist || 0) / 10000); /* v1.2.15: dispersão por CALIBRE (pesado mais regular) e que cresce mais que linear no alcance (ângulo de queda) */ const dirE = !!(sol && sol.direto); const az = dirE ? n.rumo + tr.az : n.rumo + tr.az + tr.biasAz + this.rng.gauss() * PDs.az * disp * bot * fCal; let el = dirE ? tr.el : tr.el * (1 + tr.biasR); const ruA = dirE ? 0 : this.rng.gauss() * PDs.alc * disp * bot * fCal * fDist; /* v1.2.25 item 1: elevação DIRETA — sai exatamente pelo eixo do cano */
      /* v1.2.4: elevação POR CANO — a solução era calculada para a boca da torre 1 (altura y+2 e centro da torre); bocas mais altas/à frente (couraçado: +0,5…+1,8 m, cano de 15 m) passavam ~1 m acima do ponto visado e, com a trajetória tensa (2.800 m/s), caíam 90–150 m longe. Agora: distância e altura reais da boca até o ponto previsto. */
      const VB = this.velBoca(n, L, this._VB || (this._VB = {})); let elC = dirE ? 0 : this.elCano(n, L, sol, ruA, kA, VB);
      if (elC != null) el += elC; else if (elB != null && !dirE) { const o2 = this._eD || (this._eD = {}); if (elevacaoArrasto(Math.max(150, dAl * (1 + ruA)), 5, V0s, kA, o2, alto)) el += o2.el - elB; } /* v1.2.2: elipse — erro lateral (az) e erro em ALCANCE proporcional à distância (σ = alc·d), sem viés */
      const ce = Math.cos(el), o = this.mundoInc(n, L.x, L.y, L.z, this._o); /* v1.2.11: boca com banda/caimento do casco (igual ao modelo 3D) */
      if (this.bocaObstruida(o, Math.sin(az) * ce * V0s, Math.sin(el) * V0s, -Math.cos(az) * ce * V0s)) { tr.obstr = 1; continue; } tr.obstr = 0; /* v1.2.13: boca dentro da rocha/costa ou mergulhando na água em < 0,12 s: NÃO dispara (antes: som + clarão e a granada morria no 1º passo) */
      const V0g = alto ? V0s * (1 + ruA * 0.5) : V0s; /* arco: dispersão em alcance pela carga (alcance ∝ V²) */ g.ativo = 1; g.x = o.x; g.y = o.y; g.z = o.z; g.vx = Math.sin(az) * ce * V0g + VB.x; g.vy = Math.sin(el) * V0g + VB.y; g.vz = -Math.cos(az) * ce * V0g + VB.z; if (dirE) { const q = this.mundoInc(n, L.x + Math.sin(tr.az) * Math.cos(tr.el) * 100, L.y + Math.sin(tr.el) * 100, L.z - Math.cos(tr.az) * Math.cos(tr.el) * 100, this._oDE || (this._oDE = {})); const dx = q.x - o.x, dy = q.y - o.y, dz = q.z - o.z, m = Math.hypot(dx, dy, dz) || 1; g.vx = (dx / m) * V0g + VB.x; g.vy = (dy / m) * V0g + VB.y; g.vz = (dz / m) * V0g + VB.z; } /* v1.2.25 item 1: elevação direta — eixo REAL do cano (torre + banda/caimento do casco, = modelo 3D) */ /* v1.2.21 item 14c: sai da BOCA no eixo do cano + velocidade do navio + arfagem/balanço/caturro do mar */ g.dono = n.id; g.time = n.time; const lt = n.municaoLote > 0; if (lt) { n.municaoLote--; n.stats.loteTiros = (n.stats.loteTiros || 0) + 1; } const mEf = lt || !n.mods.municaoHeEf ? n.mods.municaoEf : n.mods.municaoHeEf; /* v1.2.21 item 19c: SAP/AP só nos 80 tiros do lote; depois HE */ g.dano = A.dano * 0.65 * (mEf ? mEf.dano : 1) * (n.mods.dano || 1); /* v1.2.0: 0,65 — granadas HE em navios modernos (compartimentados) */ g.cal = A.cal; g.t = 0; g.k = this.kArrasto(n); g.fogo = mEf ? mEf.fogo : 0.18; g.ap = n.mods.municao === 'ap' && (lt || !n.mods.municaoHeEf) ? 1 : 0; g.rbu = 0; g.foguete = 0; g.arcR = 0; g.fim = null; g.livre = sol && sol.livre ? 1 : 0; /* v1.2.14 tiro de MIRA LIVRE → dano pelo módulo exato */ /* v1.2.13: slot reciclado de foguete LF-12 (arcR=1) fazia a granada seguir o ARCO velho: som/clarão sem projétil visível */
      n.stats.tiros++; saiu++; n.tTiro = this.t; this.evento({ t: 'tiro', id: n.id, torre: i, cano: k, canos: nc, x: o.x, y: o.y, z: o.z, cal: A.cal, az, el, gi: this.granadas.indexOf(g) }); }
    if (!saiu) return false; tr.biasAz *= 0.72; tr.biasR *= 0.72; tr.rec = A.cad * (n.avaria.canhao < 0.3 ? 2.2 : 1); tr.rcV = kickRecuo(A.cal); /* v1.2.21 item 14b: impulso de recuo (mola-amortecedor em armas.js) */ return true;
  }
  /** v1.2.0 rev.2 — LANÇA-FOGUETES ASW "LF-12 Martelo" (estilo RBU, couraçado Trovão): rajada de 12 foguetes em parábola ALTA
   * (elevação ~56°) sobre o alvo travado a 0,7–3 km (ou 2 km à proa), um a cada 0,12 s, alternando os dois lançadores. */
  /** v1.2.7: ponto de mira do lança-granadas — travado e com a mira sobre o alvo: ponto futuro (tabela de tiro com avanço); senão o ponto do retículo (az/dist da mira). Bots: sempre o alvo com avanço. */
  pontoRbu(n, alvoId) { const R = n.C.rbu, a = this.navios[alvoId]; const jog = n.papel === 'jogador' && !n.controleIA; const V0 = rbuV0(R);
    let usaAlvo = a && !a.morto && a.time !== n.time && Math.hypot(a.x - n.x, a.z - n.z) <= R.alc * 1.05; if (usaAlvo && jog) { const d = Math.hypot(a.x - n.x, a.z - n.z), PT = PARAM.trava; const tol = Math.max(PT.tolMin, Math.atan((a.C.L * 0.5 + PT.margem) / Math.max(1, d))) * 1.5; usaAlvo = n.trava >= 1 && Math.abs(ang(marcacao(n.x, n.z, a.x, a.z) - n.mira.az)) <= tol; }
    if (usaAlvo) { let tx = a.x, tz = a.z, d0 = Math.hypot(a.x - n.x, a.z - n.z); for (let i = 0; i < 3; i++) { const el = elRbu(Math.max(R.min, d0), V0, R.el >= 0.8 ? R.el : 0), Vt = R.el >= 0.8 ? Math.sqrt(Math.max(R.min, d0) * G / Math.sin(2 * el)) : V0, tf = 2 * Vt * Math.sin(el) / G; tx = a.x + Math.sin(a.rumo) * a.v * tf; tz = a.z - Math.cos(a.rumo) * a.v * tf; d0 = Math.hypot(tx - n.x, tz - n.z); } return { x: tx, z: tz }; }
    const d = clamp(n.mira.dist || 2000, R.min, R.alc); return { x: n.x + Math.sin(n.mira.az) * d, z: n.z - Math.cos(n.mira.az) * d }; }
  /** montagens do lança-granadas cujo setor de tiro cobre a marcação (relativa à proa) */
  montRbu(n, rel) { const out = []; n.P.granadas.forEach((m, i) => { if (Math.abs(ang(rel - m.centro)) <= m.meio) out.push(i); }); return out; }
  lancaRbu(n, alvoId) { const R = n.C.rbu; if (!R || n.morto || n.rbu <= 0 || n.tRbu > 0 || n.rbuFila > 0 || !n.P.granadas.length) return 0;
    let { x: tx, z: tz } = this.pontoRbu(n, alvoId); const d = Math.hypot(tx - n.x, tz - n.z); if (d < R.min) { const f = R.min / Math.max(1, d); tx = n.x + (tx - n.x) * f; tz = n.z + (tz - n.z) * f; }
    if (d > R.alc * 1.05) { this.evento({ t: 'naoPronto', id: n.id, arma: 'rbu', motivo: 'fora' }); return 0; }
    const rel = ang(marcacao(n.x, n.z, tx, tz) - n.rumo); if (!this.montRbu(n, rel).length) { this.evento({ t: 'naoPronto', id: n.id, arma: 'rbu', motivo: 'arco' }); return 0; } /* fora do setor de TODAS as montagens */
    n.rbu--; n.tRbu = Math.max(R.cad, PARAM.recarga.rbu); /* v1.2.21 item 11c: recarga do lançador ≥ 15 s */ n.rbuFila = R.foguetes; n.rbuTk = 0; n.rbuEsp = 0; n.rbuAlvo = { x: tx, z: tz, id: alvoId }; this.evento({ t: 'rbu', id: n.id, x: tx, z: tz }); return 1; }
  /** foguete ASW explode SOB a água (carga de profundidade): dano por onda de choque até 35 m do casco */
  explodeRbu(g) { const dono = this.navios[g.dono]; for (const n of this.navios) { if (n.morto || n.time === g.time) continue; const c = Math.cos(n.rumo), sn = Math.sin(n.rumo), dx = g.x - n.x, dz = g.z - n.z; const lz = -dx * sn + dz * c, lx = dx * c + dz * sn;
      const ex = Math.max(0, Math.abs(lx) - n.C.B / 2), ez = Math.max(0, Math.abs(lz) - n.C.L / 2), d = Math.hypot(ex, ez); if (d > 35) continue; const f = 1 - d / 35; const dd = g.dano * (0.35 + 0.65 * f);
      this.dano(n, dd, dono, 'canhao'); this.evento({ t: 'impacto', x: g.x, y: 0, z: g.z, alvo: n.id, dono: g.dono, cal: 120, tipo: 'rbu', ly: -2, dano: Math.max(1, Math.round(dd / n.C.blind)) }); } }
  /** v1.2.14: pools SEPARADOS no mesmo vetor: canhão [0, 224), granadas/foguetes ASW [224, 288), foguetes de heli [288, 320). */
  slotGranada(tipo) { const [a, b] = POOL_SEG[tipo] || POOL_SEG.canhao; const G = this.granadas; for (let i = a; i < b && i < G.length; i++) if (!G[i].ativo) return G[i]; return null; }
  /** v1.2.14: troca o estado do lança-granadas pelo do canal FOGUETES (mesmas montagens, filas/recargas/estoques separados). */
  trocaCanal(n) { const c = n.fgC; for (const k of CANAL_RBU) { const v = n[k]; n[k] = c[k]; c[k] = v; } }
  passoRbu(n, dt) { if (n.tRbu > 0) n.tRbu -= dt; const RR = n.C.rbu, V0 = rbuV0(RR);
    if (!n.lg) n.lg = n.P.granadas.map((m) => ({ az: m.centro, el: 0.35 })); /* v1.2.7: montagens giram (traverse 1,1 rad/s, elevação 0,7 rad/s) e acompanham o ponto de mira */
    if (!n.morto && n.lg.length && !(!n._canal1 && n.rbuFila <= 0 && n.fgC && n.fgC.rbuFila > 0)) { let p = n.rbuFila > 0 && n.rbuAlvo ? n.rbuAlvo : null; if (!p) { const jog = n.papel === 'jogador' && !n.controleIA; if (jog) p = this.pontoRbu(n, n.alvoId); else if (n.alvoId >= 0 && this.navios[n.alvoId] && !this.navios[n.alvoId].morto) p = this.navios[n.alvoId]; }
      const d = p ? Math.hypot(p.x - n.x, p.z - n.z) : 0, rel = p ? ang(marcacao(n.x, n.z, p.x, p.z) - n.rumo) : 0, elA = p ? (PARAM.rbuArco ? Math.atan(4 * PARAM.rbuArco.h) : elRbu(clamp(d, RR.min, RR.alc), V0, RR.el >= 0.8 ? RR.el : 0)) : 0.35; /* v1.2.11: foguete em ARCO sai a ~22° */ n.rbuElv = elA; if (n.rbuFila > 0) n.rbuEsp += dt;
      n.P.granadas.forEach((m, i) => { const st = n.lg[i]; const dentro = p && Math.abs(ang(rel - m.centro)) <= m.meio; const alvoOff = dentro ? ang(rel - m.centro) : 0; const off = ang(st.az - m.centro);
        st.az = m.centro + off + clamp(alvoOff - off, -1.1 * dt, 1.1 * dt); st.el += clamp((dentro ? elA : 0.35) - st.el, -0.9 * dt, 0.9 * dt); }); }
    if (!n._canal1 && !n.doutrinaIA /* v1.2.20 item 2: sob a SquadAI o lança-granadas/foguetes segue a escolha tática (alvo detectado, distância, cooldown) */ && (n.papel !== 'jogador' || n.controleIA) /* v1.2.17 itens 26/27: no navio do usuário só com a IA no comando (jogador fora, no heli/drone); AUTO-FOGO do usuário nunca lança granadas */ && !n.controleRemoto && !n.morto && n.rbu > 0 && n.tRbu <= 0 && n.rbuFila <= 0 && (this.tick % 30) === (n.id % 30)) { // IA: dispara em inimigo a 0,7–3 km
      let melhor = -1, md = n.C.rbu.alc; for (const a of this.navios) { if (a.morto || a.time === n.time) continue; const d = Math.hypot(a.x - n.x, a.z - n.z); if (d >= n.C.rbu.min && d < md) { md = d; melhor = a.id; } } if (melhor >= 0) this.lancaRbu(n, melhor); } if (n.rbuFila <= 0 || n.morto) { if (n.morto) n.rbuFila = 0; return; } n.rbuTk -= dt; if (n.rbuTk > 0) return; n.rbuTk = 0.12;
    const R = n.C.rbu; const rel = ang(marcacao(n.x, n.z, n.rbuAlvo.x, n.rbuAlvo.z) - n.rumo), elv = n.rbuElv; const ms = this.montRbu(n, rel);
    if (!ms.length || n.rbuEsp > 5) { n.rbuFila = 0; this.evento({ t: 'naoPronto', id: n.id, arma: 'rbu', motivo: 'arco' }); return; } /* alvo saiu do setor ou a montagem não chegou: rajada cancelada */
    const mi = ms[n.rbuMont++ % ms.length], st = n.lg[mi]; if (Math.abs(ang(st.az - rel)) > 0.05 || Math.abs(st.el - elv) > 0.04) { n.rbuTk = 0.05; return; } /* só dispara com a montagem APONTADA (traverse/elevação) */
    const g = this.slotGranada('rbu'); if (!g) { n.rbuTk = 0.05; return; } n.rbuFila--; const m = n.P.granadas[mi]; /* v1.2.14: pool próprio; sem slot espera (antes perdia o foguete) */
    const o = this.mundo(n, m.x, m.y + 2.3, m.z, this._o); const dR = Math.hypot(n.rbuAlvo.x - o.x, n.rbuAlvo.z - o.z); const DS = RBU_DISP; const V = (R.el >= 0.8 ? Math.sqrt(dR * G / Math.sin(2 * R.el)) : rbuV0(R)) * (1 + this.rng.gauss() * DS.v); const el = st.el + this.rng.gauss() * DS.el;
    const az = n.rumo + st.az + this.rng.gauss() * DS.az; const ce = Math.cos(el);
    g.ativo = 1; g.x = o.x; g.y = o.y; g.z = o.z; g.vx = Math.sin(az) * ce * V; g.vy = Math.sin(el) * V; g.vz = -Math.cos(az) * ce * V; g.dono = n.id; g.time = n.time; g.dano = R.dano; g.cal = 120; g.t = 0; g.k = 0; g.fogo = n._canal1 ? 0.2 : 0.12; /* v1.2.17 item 16: impacto DIRETO de foguete (propelente + HE) ou granada pode incendiar (usuário e inimigo); explosão submersa não incendeia */ g.ap = 0; g.rbu = 1; g.foguete = 0; g.can = n._canal1 ? 1 : 0; /* v1.2.17 itens 14/24: 0 = lança-granadas, 1 = foguetes */ g.arcR = 0; if (PARAM.rbuArco) { /* v1.2.11: foguete em ARCO (como os mísseis) com correção de rumo para o alvo travado (semiguiado) */ const RA = PARAM.rbuArco, ex = this.rng.gauss() * dR * RA.disp, ez = this.rng.gauss() * dR * RA.disp; g.arcR = 1; g.x0 = o.x; g.y0 = o.y; g.z0 = o.z; g.tx = n.rbuAlvo.x + ex; g.tz = n.rbuAlvo.z + ez; g.alvoR = n.rbuAlvo.id >= 0 ? n.rbuAlvo.id : -1; g.sp = 0; g.vR = RA.v * (1 + this.rng.gauss() * 0.01); g.Lr = Math.max(50, Math.hypot(g.tx - o.x, g.tz - o.z)); g.Hr = clamp(g.Lr * RA.h, 25, 500); }
    this.evento({ t: 'tiroRbu', id: n.id, mi, x: o.x, y: o.y, z: o.z, az, gi: this.granadas.indexOf(g), can: g.can }); }
  /** boca do cano (local) da torre i; lado = −1/+1 para o cano esquerdo/direito da torre dupla */
  P_(n, i, lado = 0) { const tr = n.torres[i], base = n.P.torres[i]; const Lc = base.lc - base.pz; const a = tr.az, ce = Math.cos(tr.el), off = lado * base.esp, o = this._p || (this._p = { x: 0, y: 0, z: 0 });
    o.x = Math.sin(a) * Lc * ce + Math.cos(a) * off; o.y = base.y + base.py + Math.sin(tr.el) * base.lc; o.z = base.z - Math.cos(a) * Lc * ce + Math.sin(a) * off; return o; }
  passoGranadas(dt) {
    for (const g of this.granadas) { if (!g.ativo) continue; g.t += dt; const ox = g.x, oy = g.y, oz = g.z;
      if (g.arcR) { const a = g.alvoR >= 0 ? this.navios[g.alvoR] : null; const sA = g.sp / g.Lr; if (a && !a.morto && sA < 0.92) { const k = PARAM.rbuArco.guia * dt; g.tx += Math.sin(a.rumo) * a.v * dt * k * 60 / 60; g.tz -= Math.cos(a.rumo) * a.v * dt * k * 60 / 60; } /* acompanha o deslocamento do alvo */
        g.sp += g.vR * dt; const s1 = g.sp / g.Lr; const bx = g.x0 + (g.tx - g.x0) * s1, bz = g.z0 + (g.tz - g.z0) * s1, by = g.y0 * (1 - s1) + g.Hr * 4 * s1 * (1 - s1) - 3 * s1 * s1; g.vx = (bx - ox) / dt; g.vy = (by - oy) / dt; g.vz = (bz - oz) / dt; g.x = bx; g.y = by; g.z = bz; }
      else { const vg = Math.hypot(g.vx, g.vy, g.vz), kd = (g.k || 0) * vg * dt; /* arrasto quadrático */ g.vx -= kd * g.vx; g.vz -= kd * g.vz; g.vy -= G * dt + kd * g.vy; g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt; }
      // impacto em navio (2 amostras por passo)
      let hit = null; /* v1.2.4: amostragem pelo comprimento do passo (≤ 4 m) perto de navios — a 2.700 m/s o passo tem ~45 m e 2 amostras atravessavam um casco de través (tiros "longos" de 600–1000 m) */
      let ns = 2; { const sg = Math.hypot(g.x - ox, g.y - oy, g.z - oz); if (sg > 8) { for (const q of this.navios) { if (q.morto || q.id === g.dono) continue; const R = q.C.L * 0.55 + sg, dx = g.x - q.x, dz = g.z - q.z; if (dx * dx + dz * dz < R * R) { ns = Math.min(24, Math.ceil(sg / 4)); break; } } } }
      for (let si = 1; si <= ns && !hit; si++) { const s = si / ns; const px = ox + (g.x - ox) * s, py = oy + (g.y - oy) * s, pz = oz + (g.z - oz) * s; hit = this.acertaNavio(px, py, pz, g.dono); if (hit) { hit.px = px; hit.py = py; hit.pz = pz; } }
      if (hit) { const n = hit.n, dono = this.navios[g.dono]; const dir = { x: g.vx, y: g.vy, z: g.vz }; const v = Math.hypot(dir.x, dir.y, dir.z);
        // ricochete: impacto rasante no costado (> 72° da normal) sem perfurar
        const sx = Math.cos(n.rumo), sz = Math.sin(n.rumo); const cosI = Math.abs((dir.x * sx + dir.z * sz) / v); const lateral = Math.abs(hit.ly) < n.C.F + 1 && Math.abs(hit.lx) > n.C.B * 0.35;
        const rico = lateral && cosI < 0.31 && g.cal < 100 && this.rng.next() < 0.55; if (rico) { dono.stats.ricochetes++; this.evento({ t: 'ricochete', x: hit.px, y: hit.py, z: hit.pz, alvo: n.id }); } /* v1.2.17 item 25b: tiro de canhão/granada NÃO tem defesa — se ACERTA, causa dano; o ricochete rasante (sem perfurar) ainda arranca chapa/estilhaça: 25% do dano */
        { const sec = hit.lz < -n.C.L * 0.25 ? 0.9 : hit.lz > n.C.L * 0.3 ? 1.15 : 1; const d = g.dano * sec * (hit.ly < 1 ? 1.25 : 1) * 1 /* v1.2.21 item 19: AP já leva +22% (municaoEf); o ×1,1 extra contra blindagem dava +34% */ * (rico ? 0.25 : 1); if (g.foguete) dono.stats.heliAcertos = (dono.stats.heliAcertos || 0) + 1; else dono.stats.acertos++; if (!(dono && dono !== n && dono.time === n.time)) danoLocal(this, n, hit, d, 'canhao', g); /* v1.2.30 item 12: fogo amigo = 0 também no dano LOCAL (alagamento/módulo) */ this.dano(n, d, dono, 'canhao');
          this.evento({ t: 'impacto', x: hit.px, y: hit.py, z: hit.pz, alvo: n.id, dono: g.dono, cal: g.cal, tipo: g.rbu ? 'rbu' : g.foguete ? 'foguete' : 'canhao', ly: hit.ly, dano: Math.max(1, Math.round(d / n.C.blind)) }); }
        g.ativo = 0; g.fim = 'navio'; continue; }
      const hA = alturaMar(g.x, g.z, this.t);
      if (g.y <= hA) { const hT = alturaTerreno(this.T, g.x, g.z); this.evento({ t: hT > 0 ? 'terra' : 'agua', x: g.x, y: Math.max(hA, hT), z: g.z, cal: g.cal, dono: g.dono, gr: g.rbu && g.can === 0 ? 1 : 0 }); if (hT <= 0) granadaNaAgua(this, g); if (g.rbu && hT <= 0) this.explodeRbu(g); g.ativo = 0; g.fim = hT > 0 ? 'terra' : 'agua'; continue; }
      if (alturaTerreno(this.T, g.x, g.z) > g.y) { this.evento({ t: 'terra', x: g.x, y: g.y, z: g.z, cal: g.cal, dono: g.dono }); g.ativo = 0; g.fim = 'terra'; continue; }
      if (this.T.estr && g.y < this.T.estr.yMax) { const es = toqueEstr(this.T.estr, g.x, g.y, g.z); if (es) { this.evento({ t: 'estr', i: es.i, x: g.x, y: g.y, z: g.z, cal: g.cal, dono: g.dono, tipo: g.foguete ? 'foguete' : 'canhao' }); g.ativo = 0; g.fim = 'estr'; continue; } } /* v1.2.19 item 11: granada acerta prédio/ponte/guindaste/torre/tanque */
      if (g.t > 40) { g.ativo = 0; g.fim = 'tempo'; } }
  }
  /** O ponto (x,y,z) está dentro do volume de algum navio (exceto `ignora`)? Volume: casco afinando na proa + superestrutura. */
  /** v1.2.1 TRAVA AUTOMÁTICA (jogador e bots, mesma regra): o navio mais perto da linha da mira, com contato atual e dentro do alcance,
   *  vira o alvo; a trava completa em ~0,5–1 s (PARAM.trava); sair da mira por ≤ tFora s mantém a trava; parar sobre OUTRO navio por tTroca s troca. */
  /** v1.2.5 PRONTIDÃO de VLS/TORP (jogador e bots, mesmas faixas de alcance): alvo travado, DETECTADO, dentro de [mín, máx] da arma;
   *  para o jogador a mira também precisa estar sobre o alvo. Devolve { ok, motivo: 'vazio'|'sem'|'mira'|'travando'|'fora'|'perto', d, falta }. */
  prontidao(n, arma) { const ehM = arma === 'vls'; const tem = ehM ? n.C.vls && n.C.missil && n.vls > 0 && (!n.avaria || n.avaria.vls >= 0.3) : n.C.torp && n.torp > 0; if (!tem) return { ok: 0, motivo: 'vazio', d: 0, falta: 0 };
    const a = n.alvoId >= 0 ? this.navios[n.alvoId] : null; if (!a || a.morto || a.time === n.time || !this.detectado(n.time, a.id)) return { ok: 0, motivo: 'sem', d: 0, falta: 0 }; if (this.oculto(n, a) && !(ehM && this.vlsContorna(n))) return { ok: 0, motivo: 'oculto', d: Math.hypot(a.x - n.x, a.z - n.z), falta: 0 }; /* v1.2.15 — fiscal nukefumaca: VLS do jogador dispensa a visada (míssil contorna o relevo) */
    const d = Math.hypot(a.x - n.x, a.z - n.z), max = ehM ? MISSEIS[n.C.missil].alc : TORPEDO.alc, min = ehM ? ALC_MIN.vls : ALC_MIN.torp;
    if (d > max) return { ok: 0, motivo: 'fora', d, falta: d - max }; if (d < min) return { ok: 0, motivo: 'perto', d, falta: min - d };
    if (n.papel === 'jogador' && !n.controleIA) { const PT = PARAM.trava; const tol = Math.max(PT.tolMin, Math.atan((a.C.L * 0.5 + PT.margem) / Math.max(1, d))); if (Math.abs(ang(marcacao(n.x, n.z, a.x, a.z) - n.mira.az)) > tol * 1.5) return { ok: 0, motivo: 'mira', d, falta: 0 }; }
    if (n.trava < 1) return { ok: 0, motivo: 'travando', d, falta: 0 }; if (ehM && n.papel === 'jogador' && !n.controleIA && (n.travaMis || 0) < 1) return { ok: 0, motivo: 'travandoMis', d, falta: 0, prog: n.travaMis || 0 }; /* v1.2.17 item 17 */ return { ok: 1, motivo: 'pronto', d, falta: 0 }; }
  travaAuto(n, dt) { if (n.morto || !(n.tMiraCmd > 0)) { n.miraSobre = 0; return; } n.tMiraCmd -= dt; const PT = PARAM.trava;
    const alc = Math.max(n.C.canhao.alc || 0, n.C.vls && n.C.missil ? MISSEIS[n.C.missil].alc : 0, n.C.torp ? TORPEDO.alc : 0); let cand = -1, melhor = 1e9;
    for (const e of this.navios) { if (e.morto || e.time === n.time || e.submerso || !this.detectado(n.time, e.id)) continue; const d = Math.hypot(e.x - n.x, e.z - n.z); if (d > alc) continue; if (this.oculto(n, e) && !this.vlsContorna(n)) continue; /* v1.2.15 · pedido 02:45 item 4: jogador com VLS ADQUIRE (mira) alvo detectado atrás de relevo/rente à costa — o míssil contorna; antes: if (this.oculto(n, e)) continue; (nunca travava → míssil 'SEM ALVO') */
      const tol = Math.max(PT.tolMin, Math.atan((e.C.L * 0.5 + PT.margem) / Math.max(1, d))); const err = Math.abs(ang(marcacao(n.x, n.z, e.x, e.z) - n.mira.az)) / tol; if (err <= 1 && err < melhor) { melhor = err; cand = e.id; } }
    n.miraSobre = cand >= 0 && cand === n.alvoId ? 1 : 0; if (cand >= 0 && cand === n.alvoId) { n.tFora = 0; n.tOutro = 0; return; }
    if (cand >= 0) { n.tOutro = n.candId === cand ? (n.tOutro || 0) + dt : 0; n.candId = cand; if (n.alvoId < 0 || n.tOutro >= PT.tTroca) { n.alvoId = cand; n.trava = 0; n.tFora = 0; n.tOutro = 0; this.evento({ t: 'travaInicio', id: n.id, alvo: cand }); } return; }
    n.candId = -1; n.tOutro = 0; if (n.alvoId >= 0) { n.tFora = (n.tFora || 0) + dt; if (n.tFora > PT.tFora) { this.evento({ t: 'destravado', id: n.id, alvo: n.alvoId }); n.alvoId = -1; n.trava = 0; n.tFora = 0; } } }
  /** v1.2.1: casco real do alvo em coordenadas locais (rumo + adorno/banda + caimento + afundamento); devolve o ponto mais próximo do segmento p0→p1 dentro de 'raio' m. */
  proxSegmento(a, x0, y0, z0, x1, y1, z1, raio) { if (!a || a.morto) return null; const C = a.C; const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, seg = Math.hypot(x1 - x0, z1 - z0); if ((mx - a.x) ** 2 + (mz - a.z) ** 2 > (C.L * 0.6 + raio + seg) ** 2) return null;
    const c = Math.cos(a.rumo), s = Math.sin(a.rumo), rol = -(a.adorno + a.balanco + (a.lista || 0)), pit = a.caturro + (a.trimDano || 0); const N = Math.max(2, Math.ceil(seg / 3)); let best = null, bd = 1e9;
    for (let k = 0; k <= N; k++) { const f = k / N, x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, z = z0 + (z1 - z0) * f; const dx = x - a.x, dz = z - a.z; let lx = dx * c + dz * s, lz = -dx * s + dz * c, ly = y - a.arfagem;
      { const cr = Math.cos(rol), sr = Math.sin(rol), ty = ly * cr + lx * sr; lx = lx * cr - ly * sr; ly = ty; const cp = Math.cos(pit), sp = Math.sin(pit), tz = lz * cp - ly * sp; ly = ly * cp + lz * sp; lz = tz; } /* desfaz banda e caimento */
      const topo = C.F + a.P.sup.h * 2.6; const ex = Math.max(0, Math.abs(lx) - C.B / 2), ez = Math.max(0, Math.abs(lz) - C.L / 2), ey = ly > topo ? ly - topo : ly < -C.T ? -C.T - ly : 0; const d = Math.hypot(ex, ey, ez);
      if (d < bd) { bd = d; best = { n: a, lx: clamp(lx, -C.B / 2, C.B / 2), ly: clamp(ly, 0, C.F + 4), lz: clamp(lz, -C.L / 2, C.L / 2), d, x, y, z }; } }
    return bd <= raio ? best : null; }
  /** v1.2.24 item 2: contato do torpedo com o casco — planta afinada do casco (como acertaNavio) na faixa submersa, sem depender do calado (cascos rasos também são atingidos). Devolve { n, lx, ly, lz } ou null. */
  contatoTorpedo(x, z, ignora) { for (const n of this.navios) { if (n.id === ignora || n.morto) continue; const C = n.C; const dx = x - n.x, dz = z - n.z; if (dx * dx + dz * dz > (C.L * 0.55) ** 2) continue; const c = Math.cos(n.rumo), s = Math.sin(n.rumo); const lx = dx * c + dz * s, lz = -dx * s + dz * c; if (Math.abs(lz) > C.L / 2) continue; const u = (C.L / 2 - lz) / C.L; const afina = u > 0.6 ? Math.max(0.08, 1 - (u - 0.6) / 0.4) : u < 0.06 ? 0.85 : 1; if (Math.abs(lx) < (C.B / 2) * afina * 1.05) return { n, lx, ly: -Math.min(3, C.T * 0.6), lz }; } return null; }
  /** v1.2.24: distância (m) de um ponto à borda da planta afinada do casco (0 = no costado; >0 fora). Usada pelo teste de detonação. */
  distCasco(n, x, z) { const C = n.C; const dx = x - n.x, dz = z - n.z; const c = Math.cos(n.rumo), s = Math.sin(n.rumo); const lx = dx * c + dz * s, lz = -dx * s + dz * c; const W = (zz) => { const u = (C.L / 2 - zz) / C.L; const af = u > 0.6 ? Math.max(0.08, 1 - (u - 0.6) / 0.4) : u < 0.06 ? 0.85 : 1; return (C.B / 2) * af * 1.05; };
    const dentro = Math.abs(lz) <= C.L / 2 && Math.abs(lx) < W(lz); const ds = (ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz || 1e-9; const k = Math.max(0, Math.min(1, ((lx - ax) * vx + (lz - az) * vz) / L2)); return Math.hypot(lx - ax - vx * k, lz - az - vz * k); };
    let best = 1e9; const N = 1200; let pz = -C.L / 2, pw = W(pz); for (let k = 1; k <= N; k++) { const zz = -C.L / 2 + (C.L * k) / N, w = W(zz); for (const sx of [-1, 1]) { best = Math.min(best, ds(sx * pw, pz, sx * w, zz)); if (Math.abs(w - pw) > 1e-6) best = Math.min(best, ds(sx * pw, zz, sx * w, zz)); } pz = zz; pw = w; } /* bordas em segmentos finos (inclui o degrau da popa) */
    best = Math.min(best, ds(-W(-C.L / 2), -C.L / 2, W(-C.L / 2), -C.L / 2), ds(-W(C.L / 2), C.L / 2, W(C.L / 2), C.L / 2)); return dentro ? -best : best; }
  acertaNavio(x, y, z, ignora, o = null) { /* o: objeto reaproveitado (previsão do arco, sem alocação) */
    for (const n of this.navios) { if (n.id === ignora || n.morto) continue; const C = n.C; const dx = x - n.x, dz = z - n.z; if (dx * dx + dz * dz > (C.L * 0.55) ** 2) continue;
      const c = Math.cos(n.rumo), s = Math.sin(n.rumo); const lx = dx * c + dz * s, lz = -dx * s + dz * c, ly = y - n.arfagem; // inversa de mundo()
      if (Math.abs(lz) > C.L / 2) continue; const u = (C.L / 2 - lz) / C.L; const afina = u > 0.6 ? Math.max(0.08, 1 - (u - 0.6) / 0.4) : u < 0.06 ? 0.85 : 1;
      const sup = lz > n.P.sup.z0 - 2 && lz < n.P.sup.z1 + 2; let topo = sup ? C.F + n.P.sup.h * 2.6 : C.F * 1.15; if (!sup) { const PT = n.P.torres, rT = Math.max(3.5, C.B * 0.34); for (let j = 0; j < PT.length; j++) if (Math.abs(lz - PT[j].z) < rT && Math.abs(lx) < rT) { topo = Math.max(topo, PT[j].y + 3.2); break; } } /* v1.2.14: as TORRES (acima do convés) também são alvo físico — antes o tiro passava por cima delas */
      if (Math.abs(lx) < (C.B / 2) * afina * 1.05 && ly > -C.T && ly < topo) { if (o) { o.n = n; o.lx = lx; o.ly = ly; o.lz = lz; return o; } return { n, lx, ly, lz }; } }
    return null;
  }
  dano(n, d, dono, como, silencioso) {
    if (n.morto || d <= 0) return 0; if (dono && dono !== n && dono.time === n.time) { this._apl = 0; return 0; } /* v1.2.8: FOGO AMIGO sempre sem dano */ const ef = como === 'missil' || como === 'torpedo' ? d : d / n.C.blind; /* v1.2.2: blindagem de canhão (blind) não reduz míssil/torpedo — o dano real já é calibrado por tier */ const apl = Math.min(ef, Math.max(0, n.vida)); if (dono) { dono.stats.dano += apl; if (apl > 0 && dono.time !== n.time && !this.primeiroDano) { this.primeiroDano = 1; dono.stats.primeiroDano = 1; } /* v1.2.3: troféu 'Primeiro Dano' = 1º acerto de dano da partida */ const k = 'dano_' + (como === 'missil' || como === 'torpedo' || como === 'nuclear' ? como : 'canhao'); /* v1.2.26: dano nuclear na própria categoria */ dono.stats[k] = (dono.stats[k] || 0) + apl; } n.stats.danoRec = (n.stats.danoRec || 0) + apl; /* v1.2.3: dano causado por arma e dano RECEBIDO (resumo do fim) */ n.vida -= ef; this._apl = apl;
    // casco CRÍTICO (< 25%): o navio sempre pega fogo e começa a alagar ANTES de afundar (avisos visuais/sonoros)
    if (!n.critico && n.vida > 0 && n.vida < n.C.vida * 0.25) { n.critico = 1; if (n.incendio <= 0) this.evento({ t: 'incendio', id: n.id }); if (n.alagamento <= 0) this.evento({ t: 'alagamento', id: n.id }); n.incendio = Math.max(n.incendio || 0, 14); n.alagamento = Math.max(n.alagamento || 0, 14); this.evento({ t: 'critico', id: n.id }); }
    if (n.vida <= 0) { n.incendio = Math.max(n.incendio || 0, 30); n.alagamento = Math.max(n.alagamento || 0, 30); n.vida = 0; n.morto = 1; n.tMorto = 0; n.radarAtivo = 0; if (dono && dono.time !== n.time) { dono.stats.abates++; if (n.C.mercante) dono.stats.mercantes = (dono.stats.mercantes || 0) + 1; } if (n.C.mercante && this.match && this.match.merc) { const ot = n.time === 'azul' ? 'vermelho' : 'azul'; this.match.merc[ot] += 1; this.evento({ t: 'mercanteAfundado', id: n.id, time: n.time, por: dono ? dono.id : -1 }); } /* v1.2.11 */ this.evento({ t: 'afunda', id: n.id, por: dono ? dono.id : -1, como }); }
    return apl;
  }

  // ======================= MÍSSEIS VLS (4 fases) =======================
  lancaMissil(n, alvoId, qtd = 1, azLivre) {
    const livre = !(alvoId >= 0) && azLivre != null && Number.isFinite(+azLivre); /* v1.2.1: lançamento SEM alvo, na direção da mira (buscador com cone estreito) */
    const alvo = livre ? null : this.navios[alvoId]; if ((!livre && (!alvo || alvo.morto || alvo.time === n.time)) || n.vls <= 0 || n.tVls > 0 || n.avaria.vls < 0.3) return 0;
    if (livre && !n.heliLanc) return 0; /* v1.2.5: sem alvo válido o tiro não sai */ if (!livre) { if (n.alvoId !== alvoId) return 0; const pr = this.prontidao(n, 'vls'); if (!pr.ok) { this.evento({ t: 'naoPronto', id: n.id, arma: 'vls', motivo: pr.motivo, falta: Math.round(pr.falta) }); return 0; } }
    const pf = MISSEIS[n.C.missil]; const d = livre ? pf.alc : Math.hypot(alvo.x - n.x, alvo.z - n.z); if (d > pf.alc) return 0; if (livre) alvoId = -1;
    let saiu = 0;
    for (let k = 0; k < qtd && n.vls > 0; k++) {
      const m = this.misseis.find((q) => !q.ativo); if (!m) break;
      let cel = -1; for (let i = 0; i < n.vlsUsadas.length; i++) if (!n.vlsUsadas[i]) { cel = i; break; } if (cel < 0 && n.vls > 0 && n.vlsUsadas.length) { n.vlsUsadas.fill(0); cel = 0; } /* células extras (módulo): recarga do paiol */ if (cel < 0) break; n.vlsUsadas[cel] = 1; n.vls--;
      const pc = n.P.vls[cel], o = this.mundo(n, pc.x, pc.y, pc.z, {}); const tdm = n.tandem > 0; if (tdm) { n.tandem--; n.stats.tandemLanc = (n.stats.tandemLanc || 0) + 1; } const mEf = n.mods.missil === 'tandem' && !tdm && n.mods.missilPadraoEf ? n.mods.missilPadraoEf : n.mods.missilEf; /* v1.2.21 item 19b: tandem só nos 8 do lote */ const pfK = n.C.misseis ? MISSEIS[n.C.misseis[n.stats.misLanc % n.C.misseis.length]] : pf; /* v1.2.11: lendários alternam perfis na salva */
      Object.assign(m, { ativo: 1, x: o.x, y: o.y, z: o.z, vx: 0, vy: 28, vz: 0, dono: n.id, time: n.time, alvo: alvoId, isca: -1, fase: FASE.EJECAO, t: -k * (PARAM.missil.cadencia || 0.7), v: 28, perfil: pfK, cel, iscasVistas: 0, tf: 0, d0: d, samAlvo: 0, samTent: 0, hPit: 0, dT: 0, cont: !livre && this.oculto(n, alvo) ? 1 : 0, hCrest: 0, livre: livre ? 1 : 0, azL: livre ? +azLivre : 0, heli: 0, curto: d < 1500 ? 1 : 0, /* fiscal nukefumaca (item 8): curtíssima distância = voo plano/direto */ ouro: mEf && mEf.dano > 1 ? 1 : 0, dano: pfK.dano * (mEf ? mEf.dano : 1) * (n.mods.dano || 1), danoMul: (mEf ? mEf.dano : 1) * (n.mods.dano || 1), velMul: n.mods.misVel || 1, pkMul: mEf ? mEf.pkCiws : 1 });
      if (m.cont && alvo) { let mx = 0; const N = 48; for (let i = 1; i < N; i++) { const u = i / N; mx = Math.max(mx, alturaTerreno(this.T, o.x + (alvo.x - o.x) * u, o.z + (alvo.z - o.z) * u)); } m.hCrest = mx + 90; /* fiscal nukefumaca: teto mínimo = crista do caminho + 90 m */ } n.stats.misLanc++; saiu++; n.tTiro = this.t; this.evento({ t: 'vls', id: n.id, cel, x: o.x, y: o.y, z: o.z, atraso: k * (PARAM.missil.cadencia || 0.7) });
    }
    if (saiu) n.tVls = recargaVlsSeg(n.tipo); /* fiscal nukefumaca (item 7): tabela por tipo */ return saiu;
  }
  passoMisseis(dt) {
    for (const m of this.misseis) { if (!m.ativo) continue; m.t += dt; if (m.heli && m.t < PARAM.heli.missilReto) { const vv = Math.hypot(m.vx, m.vy, m.vz) || 1, nv = Math.min(m.perfil.v, vv + 160 * dt); m.vx *= nv / vv; m.vy = Math.min(0, m.vy * nv / vv); m.vz *= nv / vv; m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt; continue; } /* míssil de asa do heli: sai RETO e depois guia */ if (m.t < 0) { const d = this.navios[m.dono]; const pc = d.P.vls[m.cel], o = this.mundo(d, pc.x, pc.y, pc.z, {}); m.x = o.x; m.y = o.y; m.z = o.z; continue; }
      const pf = m.perfil; let tx, ty, tz, tvx = 0, tvz = 0;
      if (m.isca >= 0) { const s = this.iscas[m.isca]; tx = s.x; ty = s.y; tz = s.z; if (!s.ativo) { m.isca = -1; m.alvo = -1; } }
      else { if (m.livre && m.alvo < 0) { /* buscador do míssil livre: só adquire navio inimigo num cone de ±PARAM.trava.coneMissil da direção da mira, até 6 km à frente */ let md = 6000; for (const e of this.navios) { if (e.morto || e.time === m.time) continue; const de = Math.hypot(e.x - m.x, e.z - m.z); if (de < md && Math.abs(ang(marcacao(m.x, m.z, e.x, e.z) - m.azL)) < PARAM.trava.coneMissil) { md = de; m.alvo = e.id; } } }
        const a = this.navios[m.alvo]; if (!a || a.morto) { if (m.livre) { tx = m.x + Math.sin(m.azL) * 2000; tz = m.z - Math.cos(m.azL) * 2000; ty = 6; } else { tx = m.x + m.vx; ty = 6; tz = m.z + m.vz; } m.alvo = -1; } else { tx = a.x; tz = a.z; { const C = a.C, cr = cristaMar(), base = C.F * 0.7, topo = C.F + a.P.sup.h * 1.3; ty = a.arfagem + Math.min(topo, Math.max(base, cr * 1.1 + 1.6)); /* v1.2.21 item 17: ponto de pontaria no COSTADO acima da linha d'água e acima das cristas em volta (mar grosso não engole o míssil antes do casco) */ ty += (a.arfV || 0) * clamp(dh0(m, a) / Math.max(150, m.perfil.vt), 0, 0.8); /* arfagem (heave) prevista no tempo até o impacto */ } tvx = Math.sin(a.rumo) * a.v; tvz = -Math.cos(a.rumo) * a.v; } }
      const dx = tx - m.x, dz = tz - m.z, dh = Math.hypot(dx, dz);
      let v = Math.hypot(m.vx, m.vy, m.vz), ux = m.vx / v, uy = m.vy / v, uz = m.vz / v;
      if (m.fase === FASE.EJECAO) { // 1) ejeção vertical a 90° com o impulsionador
        const tEj = m.curto ? Math.min(0.28, PARAM.missil.ejecao * 0.45) : PARAM.missil.ejecao; /* fiscal nukefumaca (item 8): curto = ejeção breve, depois plano no alvo */
        v = Math.min(v + 55 * dt * PARAM.missil.aceleracao, 80 * PARAM.missil.aceleracao * 0.6); if (m.t > tEj - (PARAM.missil.pausa || 0)) v = Math.max(18, v * (1 - 5 * dt)); ux = 0; uy = 1; uz = 0; if (m.t > tEj) { m.fase = FASE.PITCH; this.evento({ t: 'faseMissil', idx: m.idx, fase: 2 }); }
      } else if (m.fase === FASE.PITCH) { // 2) pitch-over suave na direção do alvo, descendo
        v = Math.min(v + 120 * dt * PARAM.missil.aceleracao, pf.v); const hx = dx / dh, hz = dz / dh; let hP = m.curto ? Math.max(ty + 4, 8) : (m.cont ? Math.max(80, (m.hCrest || 80) * 0.55) : 5); if (!m.curto) for (const f of m.cont ? [0.5, 1.2, 2.2, 3.4, 5, 8] : [0.5, 1.2, 2.2]) hP = Math.max(hP, alturaTerreno(this.T, m.x + hx * v * f, m.z + hz * v * f) + 28); /* fiscal nukefumaca (item 8): curto = pitch direto/plano no alvo */ if (m.cont && !m.curto) for (const L of [200, 400, 650, 900, 1300]) if (L < dh) hP = Math.max(hP, alturaTerreno(this.T, m.x + hx * L, m.z + hz * L) + 40); /* pedido 05:20 item 4: na subida o relevo é olhado por DISTÂNCIA (200–1300 m à frente), não por v·t (v≈28 m/s só olhava 224 m e o míssil batia na crista a 1,5 km) */ const dy = clamp((hP - m.y) / (m.curto ? 60 : 120), m.curto ? -0.55 : -0.35, m.curto ? 0.15 : 0.3); let nx = hx, ny = dy, nz = hz; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const r = 1.25 * dt * Math.min(3, Math.sqrt(PARAM.missil.vel)); ux += (nx - ux) * r * 1.7; uy += (ny - uy) * r * 1.7; uz += (nz - uz) * r * 1.7; /* v1.2.9: pitch-over mais suave (ápice já é mais baixo) */ const ll = Math.hypot(ux, uy, uz); ux /= ll; uy /= ll; uz /= ll;
        if (m.curto ? (m.t > 0.45 || uy < 0.25) : ((PARAM.missil.arco && !m.heli && m.d0 > 3800 && uy < 0.55) || (uy < 0.05 && m.y < hP + 12))) { m.fase = FASE.CRUZEIRO; /* fiscal nukefumaca (item 8): curto entra logo no cruzeiro plano */ this.evento({ t: 'faseMissil', idx: m.idx, fase: 3 }); }
      } else if (m.fase === FASE.CRUZEIRO) { // 3) cruzeiro rasante a 6 m da água
        v += (pf.v * (m.velMul || 1) - v) * dt; const tv = dh / v; const px = tx + tvx * tv, pz = tz + tvz * tv; const b = Math.atan2(px - m.x, -(pz - m.z)); const cur = Math.atan2(ux, -uz); const tr = 0.5 * Math.min(4, PARAM.missil.vel); const nb = cur + clamp(ang(b - cur), -tr * dt, tr * dt);
        let hAlvo = 4.5, vyFF = 0; /* v1.2.8: cruzeiro a 4,5 m (mantido) */ const arco = PARAM.missil.arco && !m.heli && m.d0 > 3800 && !m.cont; /* fiscal nukefumaca: contorna = SEM arco (sobe sobre a crista e mergulha; o arco forçava a descida no relevo) */
         if (arco) { /* v1.2.10: trajetória em ARCO (parábola alta e suave tipo arco-íris) do lançamento até ~900 m do alvo */ const dT = m.dT || (m.dT = Math.max(2600, v * 1.4)), L = Math.max(600, m.d0 - dT), sA = clamp((m.d0 - dh) / L, 0, 1), H = clamp(Math.min(m.d0 * PARAM.missil.arco, L * 0.22), 30, 380), /* arco termina ~2,6 km antes: aproximação final baixa (CIWS/SAM ainda reagem) */ h0 = m.hPit || (m.hPit = m.y), hE = 18, sn = Math.sin(Math.PI * sA); hAlvo = hE + H * sn * sn + (h0 - hE) * (1 - sA) * (1 - sA); vyFF = (H * Math.PI * Math.sin(2 * Math.PI * sA) - 2 * (h0 - hE) * (1 - sA)) * v / L; }
         for (const f of m.cont ? [0.4, 0.9, 1.6, 2.6, 4, 6, 9] : [0.6, 1.4, 2.4]) hAlvo = Math.max(hAlvo, alturaTerreno(this.T, m.x + ux * v * f, m.z + uz * v * f) + (m.cont ? 55 : 28)); /* fiscal nukefumaca: olha até ~9 s à frente + folga 55 m */ if (m.cont) { const dA = Math.hypot((tx||m.x)-m.x,(tz||m.z)-m.z); hAlvo = Math.max(hAlvo, alturaTerreno(this.T, m.x, m.z) + 80); for (const f of [0.08,0.18,0.3,0.45,0.6,0.75,0.9]) { const xx=m.x+(tx-m.x)*f, zz=m.z+(tz-m.z)*f; hAlvo = Math.max(hAlvo, alturaTerreno(this.T, xx, zz) + 80); } if (dA > 2000) hAlvo = Math.max(hAlvo, m.hCrest || 180, 140); else if (dA > 1200) hAlvo = Math.max(hAlvo, Math.min(m.hCrest || 120, 200), 70); /* perto: deixa cair p/ o terminal */ } hAlvo = Math.max(hAlvo, cristaMar() * 1.15 + 2.2); /* v1.2.21 item 17: rádio-altímetro — com mar grosso o rasante sobe acima das cristas */ const vyAlvo = clamp(vyFF + (hAlvo - m.y) * (arco ? 2.2 : m.cont ? 2.4 : 0.9), arco ? -v * 0.45 : m.cont ? -v * 0.18 : -20, arco ? v * 0.45 : m.cont ? v * 0.55 : 45) / v; /* cont: sobe forte (0,55·v), desce só após a crista (0,18·v) */ const ch = Math.sqrt(Math.max(0, 1 - vyAlvo * vyAlvo)); ux = Math.sin(nb) * ch; uz = -Math.cos(nb) * ch; uy = vyAlvo;
        if (arco ? dh < (m.dT || 2600) : dh < (m.cont ? 1400 : 1800 * Math.max(1, Math.sqrt(PARAM.missil.vel)))) { /* fiscal nukefumaca: contorna só entra no terminal perto do alvo (já passou a crista) */ m.fase = FASE.TERMINAL; m.tf = 0; this.evento({ t: 'faseMissil', idx: m.idx, fase: 4, alvo: m.alvo }); }
      } else { // 4) ataque terminal: sobe ~24 m (pop-up) e mergulha com navegação proporcional 3D verdadeira (N = 4)
        m.tf += dt; v = Math.min(pf.vt, v + 25 * dt); let hPop = 15; /* v1.2.9: curva terminal mais suave */ for (const f of m.cont ? [0.4, 0.9, 1.6, 2.6] : [0.5, 1.2, 2]) hPop = Math.max(hPop, alturaTerreno(this.T, m.x + ux * v * f, m.z + uz * v * f) + (m.cont ? 45 : 28)); const popup = m.cont ? (dh > 800 && hPop > Math.max(ty + 35, 50)) : (dh > 650 || hPop > 15.5); /* fiscal nukefumaca: contorna só faz pop-up se ainda há crista à frente; senão mergulha no alvo */
        const rx = tx - m.x, ry = (popup ? hPop : ty) - m.y, rz = tz - m.z, R2 = rx * rx + ry * ry + rz * rz;
        const vmx = ux * v, vmy = uy * v, vmz = uz * v, vrx = tvx - vmx, vry = -vmy, vrz = tvz - vmz;
        // Ω = (R × Vr) / |R|² ; a = N · (Ω × Vm)
        const ox = (ry * vrz - rz * vry) / R2, oy = (rz * vrx - rx * vrz) / R2, oz = (rx * vry - ry * vrx) / R2; const N = 4;
        let ax = N * (oy * vmz - oz * vmy), ay = N * (oz * vmx - ox * vmz), az = N * (ox * vmy - oy * vmx);
        if (popup) ay = clamp((hPop - m.y) * (m.cont ? 3.2 : 1.5) - vmy * (m.cont ? 2.4 : 1.2), m.cont ? -60 : -40, m.cont ? 220 : 80); /* cont: autoridade de subida bem maior p/ reverter mergulho sobre a crista */
        { /* v1.2.21 item 17: piso do rádio-altímetro no mergulho final — nunca abaixo das cristas à frente; o míssil só encontra a água se o alvo sumir ou for iludido */
          const cr = cristaMar(); let hM = alturaMar(m.x, m.z, this.t); for (const f of [0.12, 0.25, 0.4]) hM = Math.max(hM, alturaMar(m.x + vmx * f, m.z + vmz * f, this.t + f)); const yF = Math.min(hM + 1.0 + cr * 0.15, ty + 0.5);
          const yP = m.y + vmy * 0.3; if (yP < yF) ay = Math.max(ay, (yF - m.y) * 12 - vmy * 5);
          if (m.cont) { let hT = 0; for (const f of [0.1, 0.25, 0.45, 0.7, 1.0, 1.4]) hT = Math.max(hT, alturaTerreno(this.T, m.x + vmx * f, m.z + vmz * f)); if (hT > 0) { hT += 22; const yT = m.y + vmy * 0.45; if (yT < hT && dh > 350) ay = Math.max(ay, (hT - m.y) * 12 - vmy * 5); } } /* pedido 05:20 item 4: fase terminal com folga do relevo (22 m) também no mergulho — vale para todo míssil que contorna relevo (todos os navios que lançam); sem alcance mínimo: a folga some a <350 m do alvo */ }
        const am = Math.hypot(ax, ay, az), amax = PARAM.missil.gMax * 10 * Math.max(1, (v / 330) ** 2); if (am > amax) { ax *= amax / am; ay *= amax / am; az *= amax / am; } // limite ~30 g
        let nx = vmx + ax * dt, ny = vmy + ay * dt, nz = vmz + az * dt; const ll = Math.hypot(nx, ny, nz); ux = nx / ll; uy = ny / ll; uz = nz / ll;
      }
      m.vx = ux * v; m.vy = uy * v; m.vz = uz * v; const x0m = m.x, y0m = m.y, z0m = m.z; m.x += m.vx * dt; m.y += m.vy * dt; m.z += m.vz * dt;
      // impacto
      // espoleta de proximidade/impacto: o míssil guiado NÃO erra por sorte — se chegou ao volume do alvo travado, acerta.
      let hit = null; if (m.fase >= FASE.CRUZEIRO || (m.curto && m.t > 0.35)) { /* fiscal nukefumaca (item 8): curto — espoleta arma já; acertaNavio exclui o próprio navio */ hit = this.acertaNavio(m.x, m.y, m.z, m.dono); if (!hit && m.isca < 0 && m.alvo >= 0) { const a = this.navios[m.alvo]; hit = this.proxSegmento(a, x0m, y0m, z0m, m.x, m.y, m.z, m.fase === FASE.TERMINAL ? PARAM.trava.proxMissil : 4); if (hit) { m.x = hit.x; m.y = hit.y; m.z = hit.z; } } } /* v1.2.1: espoleta de proximidade ~15 m varrida no segmento do passo (não "atravessa" o casco a 300 m/s) */
      if (hit) { { const d = this.navios[m.dono]; const dd = danoMissil(this, hit.n, m); /* v1.2.2: dano REAL (18–25% / ouro 30–40% do HP do tier) no navio ATINGIDO */ if (!(d && d !== hit.n && d.time === hit.n.time)) danoLocal(this, hit.n, hit, dd, 'missil', null); /* v1.2.30 item 12: fogo amigo sem avaria local */ const apl = this.dano(hit.n, dd, d, 'missil'); if (d) d.stats.misAcertos++; if (m.heli && d) d.stats.heliAcertos = (d.stats.heliAcertos || 0) + 1; this.evento({ t: 'impacto', idx: m.idx, x: m.x, y: m.y, z: m.z, alvo: hit.n.id, dono: m.dono, tipo: 'missil', ouro: m.ouro ? 1 : 0, dano: Math.round(dd), apl: Math.round(apl || 0), pct: +(dd / hit.n.C.vida).toFixed(3), lx: hit.lx, lz: hit.lz, ly: hit.ly }); m.ativo = 0; continue; } }
      if (m.isca >= 0 && Math.hypot(tx - m.x, ty - m.y, tz - m.z) < 25) { this.evento({ t: 'missilIsca', x: m.x, y: m.y, z: m.z, idx: m.idx, dono: m.dono }); m.ativo = 0; continue; }
      if (this.T.estr && m.y < this.T.estr.yMax && m.t > 1) { const es = toqueEstr(this.T.estr, m.x, m.y, m.z); if (es) { this.evento({ t: 'missilAgua', x: m.x, y: m.y, z: m.z, estr: es.i, fase: m.fase, idx: m.idx, dono: m.dono }); m.ativo = 0; continue; } } /* v1.2.19 item 11: míssil que bate em prédio/ponte/torre detona nela */
      const hA = alturaMar(m.x, m.z, this.t); if (m.y < hA - 0.5 || alturaTerreno(this.T, m.x, m.z) > m.y) { this.evento({ t: 'missilAgua', x: m.x, y: Math.max(hA, 0), z: m.z, fase: m.fase, idx: m.idx, dono: m.dono, dAlvo: m.alvo >= 0 ? Math.round(Math.hypot(this.navios[m.alvo].x - m.x, this.navios[m.alvo].z - m.z)) : -1, terra: alturaTerreno(this.T, m.x, m.z) > m.y ? 1 : 0 }); m.ativo = 0; continue; }
      if (m.alvo < 0 && m.isca < 0 && m.t > pf.alc / pf.v + (m.livre ? 4 : 12)) { this.evento({ t: 'missilAgua', x: m.x, y: 0, z: m.z }); m.ativo = 0; } /* só sem alvo (afundado por outro): autodestruição */
    }
    // alarme de míssil: algum míssil hostil em cruzeiro/terminal apontado para o navio
    for (const n of this.navios) n.alertaMissil = 0; for (const m of this.misseis) if (m.ativo && m.fase >= FASE.CRUZEIRO && m.alvo >= 0 && m.isca < 0) { const a = this.navios[m.alvo]; const d = Math.hypot(a.x - m.x, a.z - m.z); if (d < 9000) a.alertaMissil = Math.max(a.alertaMissil, d < 2500 ? 2 : 1); }
  }

  /** Espoleta de proximidade na fase terminal: dentro de 9 m do casco/superestrutura do alvo travado → impacto. */
  proximidade(m, a) { if (!a || a.morto) return null; const C = a.C; const dx = m.x - a.x, dz = m.z - a.z; if (dx * dx + dz * dz > (C.L * 0.6 + 10) ** 2) return null; const c = Math.cos(a.rumo), s = Math.sin(a.rumo);
    const lx = dx * c + dz * s, lz = -dx * s + dz * c, ly = m.y - a.arfagem; if (Math.abs(lz) < C.L / 2 + 6 && Math.abs(lx) < C.B / 2 + 9 && ly < C.F + a.P.sup.h * 2.6 + 9 && ly > -2) return { n: a, lx: clamp(lx, -C.B / 2, C.B / 2), ly: clamp(ly, 0, C.F + 4), lz: clamp(lz, -C.L / 2, C.L / 2) }; return null; }
  // ======================= CIWS =======================
  /** v1.1.0: CIWS 1000 m / 4500 tpm contra mísseis, drones e torpedos em naval5v5/defesa.js */
  passoCiws(n, dt) { passoCiws5(this, n, dt); }

  // ======================= TORPEDOS =======================
  lancaTorpedo(n, alvoId) {
    if (n.torp <= 0 || n.tTorp > 0) return 0; if (!(alvoId >= 0) || n.alvoId !== alvoId) return 0; { const pr = this.prontidao(n, 'torp'); if (!pr.ok) { this.evento({ t: 'naoPronto', id: n.id, arma: 'torp', motivo: pr.motivo, falta: Math.round(pr.falta) }); return 0; } } /* v1.2.5: torpedo só com alvo válido no alcance */ const alvo = this.navios[alvoId]; let rumo;
    if (alvo && !alvo.morto && alvo.time !== n.time) { const d = Math.hypot(alvo.x - n.x, alvo.z - n.z); if (d > TORPEDO.alc) return 0; const vx = Math.sin(alvo.rumo) * alvo.v, vz = -Math.cos(alvo.rumo) * alvo.v; let px = alvo.x, pz = alvo.z; for (let i = 0; i < 5; i++) { const t = Math.hypot(px - n.x, pz - n.z) / TORPEDO.v; px = alvo.x + vx * t; pz = alvo.z + vz * t; } rumo = marcacao(n.x, n.z, px, pz); }
    else { rumo = n.mira.az; alvoId = -1; }
    const t = this.torpedos.find((q) => !q.ativo); if (!t) return 0;
    // tubo do bordo voltado para o alvo
    const rel = ang(rumo - n.rumo); const tubo = n.P.tubos.find((q) => q.lado === (rel >= 0 ? 1 : -1)) || n.P.tubos[0]; const o = this.mundo(n, tubo.x, 0, tubo.z, {});
    Object.assign(t, { y: tubo.y, vy: tubo.sub ? 0 : 1.5, sub: tubo.sub ? 1 : 0, /* v1.2.7: sai do tubo de convés (cai na água) ou da porta submersa */ danoMul: n.mods.torpDano || 1, alcMax: 0, leve: 0, lancha: 0, ativo: 1, x: o.x, z: o.z, rumo: n.rumo + (rel >= 0 ? 1.1 : -1.1), rumoAlvo: rumo, v: 8, dono: n.id, time: n.time, alvo: alvoId, corrida: 0, modo: n.torpModo, t: 0, buscando: 0 });
    n.torp--; n.tTorp = PARAM.recarga.torpTubo; /* v1.2.21 item 11c: 2,5 → 4,0 s entre tubos */ n.tuboAtivo = (n.tuboAtivo + 1) % 3; n.stats.torpLanc++; this.evento({ t: 'torpLanc', id: n.id, x: o.x, z: o.z, idx: t.idx }); return 1;
  }
  passoTorpedos(dt) {
    for (const tp of this.torpedos) { if (!tp.ativo) continue; tp.t += dt; if (tp.y > -2.5) { const a0 = tp.y; tp.vy -= G * dt; tp.y = Math.max(-2.5, tp.y + tp.vy * dt); if (a0 > 0 && tp.y <= 0) this.evento({ t: 'torpAgua', x: tp.x, z: tp.z }); } tp.v = Math.min(TORPEDO.v, tp.v + Math.max(8, TORPEDO.v * 0.2) * dt); const kv = Math.max(1, tp.v / 42); /* v1.2.9: acelera até a corrida em ~5 s; giro escala com a velocidade (raio de curva ~constante) */ tp.corrida += tp.v * dt;
      let alvoRumo = tp.rumoAlvo;
      if (tp.modo === 'acustico' && tp.corrida > TORPEDO.arma) { tp.buscando = 0; /* v1.2.7: perdeu o contato acústico → volta ao filoguiado (não segue reto) */ let melhor = null, md = TORPEDO.buscaAlc; for (const n of this.navios) { if (n.morto || n.time === tp.time) continue; const d = Math.hypot(n.x - tp.x, n.z - tp.z); const b = marcacao(tp.x, tp.z, n.x, n.z); if (d < md && Math.abs(ang(b - tp.rumo)) < TORPEDO.buscaCone) { md = d; melhor = n; } } if (melhor) { tp.buscando = 1; const vx = Math.sin(melhor.rumo) * melhor.v, vz = -Math.cos(melhor.rumo) * melhor.v, tt = md / Math.max(5, tp.v); alvoRumo = marcacao(tp.x, tp.z, melhor.x + vx * tt, melhor.z + vz * tt); /* v1.2.9: busca acústica com AVANÇO (navegação no ponto futuro, sem laços) */ } }
      { const a = tp.alvo >= 0 ? this.navios[tp.alvo] : null; if (a && !a.morto && !tp.buscando && tp.corrida > 60) { /* v1.2.1: torpedo TRAVADO é filoguiado até o alvo (ponto de interceptação atualizado) */ const vx = Math.sin(a.rumo) * a.v, vz = -Math.cos(a.rumo) * a.v; let px = a.x, pz = a.z; for (let i = 0; i < 4; i++) { const tt = Math.hypot(px - tp.x, pz - tp.z) / Math.max(5, tp.v); px = a.x + vx * tt; pz = a.z + vz * tt; } alvoRumo = marcacao(tp.x, tp.z, px, pz); } }
      { const a = tp.alvo >= 0 ? this.navios[tp.alvo] : null; const dA = a && !a.morto ? Math.hypot(a.x - tp.x, a.z - tp.z) : 1e9; const gk = dA < 600 ? 6 : 3; { const fr = (r, L) => alturaTerreno(this.T, tp.x + Math.sin(r) * L, tp.z - Math.cos(r) * L); const lk = Math.min(3, Math.max(1, tp.v / 32.4)); /* v1.2.14: 400 m/s → olhar à frente até 3× */ /* v1.2.9: olhar à frente limitado (a 200 m/s não desvia de ilhas distantes) */ if (fr(tp.rumo, 90 * lk) > -7 || fr(alvoRumo, 160 * lk) > -7) { const e = fr(tp.rumo - 0.7, 120 * lk), d = fr(tp.rumo + 0.7, 120 * lk); alvoRumo = tp.rumo + (e < d ? -0.9 : 0.9); } } /* v1.2.5: contorna baixios/ilhas pelo lado mais fundo */ /* v1.2.5: correção de rumo mais forte na aproximação final */ tp.rumo += clamp(ang(alvoRumo - tp.rumo), -TORPEDO.giro * gk * kv * dt, TORPEDO.giro * gk * kv * dt); if (dA < 1500 && tp.corrida > (tp.alcMax || TORPEDO.alc) * 0.9) tp.alcMax = Math.min(TORPEDO.alc * 1.5, Math.max(tp.alcMax || TORPEDO.alc, tp.corrida + 400)); /* v1.2.5: buscando o alvo travado, não morre por alcance a poucos metros dele */ }
      const tx0 = tp.x, tz0 = tp.z; tp.x += Math.sin(tp.rumo) * tp.v * dt; tp.z -= Math.cos(tp.rumo) * tp.v * dt; /* v1.2.9: segmento do passo para o teste varrido */
      let hit = null; if (tp.corrida > 120) { const ns = Math.max(1, Math.ceil(Math.hypot(tp.x - tx0, tp.z - tz0) / 2)); let fa = 0; for (let si = 1; si <= ns && !hit; si++) { const f = si / ns; hit = this.contatoTorpedo(tx0 + (tp.x - tx0) * f, tz0 + (tp.z - tz0) * f, tp.dono); if (!hit) fa = f; else { let lo = fa, hi = f; for (let it = 0; it < 14 && (hi - lo) * Math.hypot(tp.x - tx0, tp.z - tz0) > 0.05; it++) { const md = (lo + hi) / 2; const h = this.contatoTorpedo(tx0 + (tp.x - tx0) * md, tz0 + (tp.z - tz0) * md, tp.dono); if (h) { hi = md; hit = h; } else lo = md; } tp.x = tx0 + (tp.x - tx0) * hi; tp.z = tz0 + (tp.z - tz0) * hi; } } }
      /* v1.2.24 item 2: CAUSA do torpedo explodir antes do navio = a "espoleta magnética" (v1.2.1; raio 6→12 m na v1.2.5) detonava a até 12 m da CAIXA retangular do casco (proxSegmento) e o evento saía na posição do torpedo, longe do costado.
         Agora: só detonação por CONTATO com o casco afinado (mesma planta de acertaNavio, na linha d'água), varrida a cada 2 m e refinada por bissecção (< 5 cm); o evento sai NO costado. */
      if (hit) { const d = this.navios[tp.dono]; hit.ly = -3; const dd = danoTorpedo(this, hit.n, tp); /* v1.2.2: torpedo 25–35% do HP do tier, abaixo da linha d'água */ if (!(d && d !== hit.n && d.time === hit.n.time)) danoLocal(this, hit.n, hit, dd, 'torpedo', null); /* v1.2.30 item 12: torpedo em navio do MESMO time (fogo amigo 0) não alaga nem avaria o módulo */ const apl = this.dano(hit.n, dd, d, 'torpedo'); if (d && !tp.lancha) d.stats.torpAcertos++; if (d && tp.leve) d.stats.heliAcertos = (d.stats.heliAcertos || 0) + 1; this.evento({ t: 'torpImpacto', x: tp.x, z: tp.z, alvo: hit.n.id, dono: tp.dono, idx: tp.idx, leve: tp.leve ? 1 : 0, dano: Math.round(dd), apl: Math.round(apl || 0), pct: +(dd / hit.n.C.vida).toFixed(3), lx: hit.lx, lz: hit.lz, alaga: hit.n.alagamento > 0 ? 1 : 0 }); tp.ativo = 0; continue; }
      const alcT = tp.alcMax || (tp.alvo >= 0 ? TORPEDO.alc * 1.3 : TORPEDO.alc); /* v1.2.7: filoguiado (mais rápido) ganha 30% de corrida */ if (alturaTerreno(this.T, tp.x, tp.z) > -4 || tp.corrida > alcT) { this.evento({ t: 'torpFim', x: tp.x, z: tp.z, terra: tp.corrida <= alcT }); tp.ativo = 0; } }
  }

  // ======================= CHAFF / FLARES =======================
  lancaIsca(n) {
    if (n.chaff <= 0 || n.tChaff > 0) return 0; n.chaff--; n.tChaff = n.papel === 'jogador' ? 4 : 20 + this.rng.next() * 10; /* v1.2.5: bots recarregam a isca em 20–30 s */ n.stats.iscas = (n.stats.iscas || 0) + 1; let lancadas = 0;
    for (const lado of [-1, 1]) { const s = this.iscas.find((q) => !q.ativo); if (!s) break; const o = this.mundo(n, lado * n.C.B * 0.4, n.C.F + 6, n.C.L * 0.05, {});
      const c = Math.cos(n.rumo), sn = Math.sin(n.rumo); Object.assign(s, { ativo: 1, x: o.x, y: 30, z: o.z, vx: lado * c * 18 - Math.sin(n.rumo) * n.v * 0.3, vz: lado * sn * 18 + Math.cos(n.rumo) * n.v * 0.3, dono: n.id, time: n.time, t: 0 }); lancadas++;
      this.evento({ t: 'isca', id: n.id, idx: s.idx, x: o.x, y: o.y, z: o.z, lado }); }
    // mísseis travados neste navio podem ser seduzidos (casco furtivo ajuda: menor RCS = isca mais convincente)
    // v1.2.0: probabilidade FIXA e visível nas stats: 85% (padrão) ou 95% (isca ouro) por míssil travado neste navio a até 6 km
    const p = n.papel === 'jogador' ? n.pIsca : Math.min(n.pIsca, PISCA_BOT); /* v1.2.5: isca de bot seduz com chance limitada */ let seduz = 0, resist = 0;
    for (const m of this.misseis) { if (!m.ativo || m.alvo !== n.id || m.isca >= 0 || m.fase < FASE.PITCH) continue; const d = Math.hypot(m.x - n.x, m.z - n.z); if (d > 6000) continue; if (this.rng.next() < p) { const s = this.iscas.find((q) => q.ativo && q.dono === n.id && q.t === 0); if (s) { m.isca = s.idx; seduz++; n.stats.seduzidos = (n.stats.seduzidos || 0) + 1; this.evento({ t: 'seduzido', idx: m.idx, id: n.id }); } } else { resist++; this.evento({ t: 'resistiuIsca', idx: m.idx, id: n.id }); } }
    if (n.chaff <= 0 && n.chaffReserva > 0) n.tChaffRec = Math.max(n.tChaffRec, 0.01); this.evento({ t: 'iscaResultado', id: n.id, seduz, resist });
    return lancadas;
  }
  passoIscas(dt) { for (const s of this.iscas) { if (!s.ativo) continue; s.t += dt; s.x += s.vx * dt; s.z += s.vz * dt; s.vx *= 1 - 0.5 * dt; s.vz *= 1 - 0.5 * dt; s.y = Math.max(6, s.y - 1.5 * dt); if (s.t > 11) s.ativo = 0; } }
  /** Equipe de reparo: apaga incêndio, estanca alagamento, recupera módulos e parte do casco (usos limitados + recarga). */
  usaReparo(n) { const r = n.reparo; if (!r || r.usos <= 0 || r.t > 0) return 0; r.usos--; r.t = r.recarga; n.stats.reparos = (n.stats.reparos || 0) + 1; n.incendio = 0; n.alagamento = 0; for (const k in n.avaria) n.avaria[k] = Math.max(n.avaria[k], 0.6); n.vida = Math.min(n.C.vida, n.vida + n.C.vida * r.cura); this.evento({ t: 'reparo', id: n.id }); return 1; }

  // ======================= SENSORES + DATA-LINK =======================
  sensores() {
    /* v1.2.2: detecção realista — assinatura (tamanho, furtividade, camuflagem, velocidade, tiros recentes), hora/tempo, ilhas, radar ATIVO (detecta mais, mas denuncia por ESM),
       sonar curto e sensores aéreos. Contato perdido vira fantasma "?" na última posição por PARAM.deteccao.perda s. Mesmas regras para bots e jogador. */
    const T = this.T, t = this.t, D = PARAM.deteccao; if (!this.vistos) this.vistos = { azul: new Set(), vermelho: new Set() };
    for (const time of ['azul', 'vermelho']) { const mapa = this.contatos[time]; const meus = this.navios.filter((n) => n.time === time && !n.morto);
      for (const e of this.navios) { if (e.time === time || e.morto) { if (e.morto) mapa.delete(e.id); continue; } let fonte = null, q = 0; const aV = alcVisual(this, e), hE = e.C.F + 10;
        for (const o of meus) { const d = Math.hypot(e.x - o.x, e.z - o.z); if (d > 26000) continue; const hO = o.P.mastro;
          if (d < D.sonar * fatorSonar(e.C) && !bloqueado(T, o.x, o.z, -2, e.x, e.z, -2)) /* v1.2.14 */ { fonte = 'sonar'; q = 3; break; }
          const vis = d < aV * (o.optica ? 1.35 : 1) /* v1.2.10: ÓPTICA alcança +35% */, rad = o.radarAtivo && d < alcRadar(o, e), esm = e.radarAtivo && d < alcEsm(e); if (!vis && !rad && !esm) continue;
          if (bloqueado(T, o.x, o.z, hO, e.x, e.z, vis || rad ? hE : e.P.mastro)) continue;
          if (vis) { fonte = 'visual'; q = 3; break; } if (rad && q < 2) { fonte = 'radar'; q = 2; } else if (esm && q < 1) { fonte = 'esm'; q = 1; } }
        if (this.revelaTudo && q < 3) { fonte = 'visual'; q = 3; } /* só testes isolados de armas (dispersão/dano/trava): o alvo é dado como visto */
        if (q < 3) { const fa = sensorAereo(this, time, e); if (fa) { const ant = mapa.get(e.id); if (!ant || t - ant.t > 8) { const qd = this._aereoDono; if (qd != null && this.navios[qd]) this.navios[qd].stats.avistAereo = (this.navios[qd].stats.avistAereo || 0) + 1; } fonte = fa; q = 3; } } // helicóptero/VANT enxerga por cima das ilhas
        if (fonte) { const ant = mapa.get(e.id); const c = ant || {}; const novo = !ant || t - ant.t > 1.1; Object.assign(c, { t, x: e.x, z: e.z, rumo: e.rumo, v: e.v, fonte, q, t0: novo ? t : c.t0, conf: q >= 3 ? t : c.conf || -99 }); mapa.set(e.id, c); if (q >= 2 && !this.vistos[time].has(e.id)) { this.vistos[time].add(e.id); this.evento({ t: 'contato', time, id: e.id, fonte }); } }
        else { const c = mapa.get(e.id); if (c && t - c.t > (c.vida || D.perda) /* v1.2.18 item 11: informe de inteligência pré-missão dura c.vida s */) mapa.delete(e.id); } } }
    // "você foi detectado": algum inimigo tem contato (≥ radar) com este navio
    for (const n of this.navios) { if (n.morto) continue; const c = this.contatos[n.time === 'azul' ? 'vermelho' : 'azul'].get(n.id); const det = c && t - c.t < 1.1 && c.q >= 2 ? 1 : 0; if (det && !n.detectado) this.evento({ t: 'detectado', id: n.id, fonte: c.fonte }); n.detectado = det; }
  }
  /** v1.2.2: linha de tiro livre de terra entre dois navios (cache de 20 passos — barato para IA e torres livres). */
  /** v1.2.15: alvo atrás de ilha/montanha (sem visada própria) — não trava, não mira, perde a trava. */
  oculto(n, a) { return !a || !this.linhaLivre(n, a); }
  /** fiscal nukefumaca (item 6): jogador com VLS e paiol — alvo DETECTADO atrás do relevo continua travável p/ MÍSSIL (o míssil contorna o relevo; canhão segue sem visada). */
  vlsContorna(n) { return n.papel === 'jogador' && !n.controleIA && !!(n.C.vls && n.C.missil && n.vls > 0 && (!n.avaria || n.avaria.vls >= 0.3)); }
  linhaLivre(a, b) { const c = this._los || (this._los = new Map()); const k = a.id * 64 + b.id; const v = c.get(k); if (v && this.tick - v.t < 20) return v.ok; const ok = losTerreno(this.T, a.x, a.z, Math.max(12, a.P.mastro || 30), b.x, b.z, Math.max(10, (b.P.mastro || 30) * 0.85)); /* v1.2.15: visada do MASTRO até a superestrutura do alvo, com curvatura */ if (v) { v.t = this.tick; v.ok = ok; } else c.set(k, { t: this.tick, ok }); return ok; }
  /** v1.2.2: contato atual DETECTADO (radar ou confirmado — ESM sozinho não serve para travar nem para mostrar o navio). */
  detectado(time, id) { const c = this.contatos[time].get(id); return c && this.t - c.t < 1.1 && c.q >= 2 ? c : null; }
  /** v1.2.2: contato CONFIRMADO (visual/sonar/aéreo) atual. */
  confirmado(time, id) { const c = this.contatos[time].get(id); return c && this.t - c.t < 1.1 && c.q >= 3 ? c : null; }
  /** Contato atual (visto há < 1 s) do ponto de vista de um time. */
  contatoAtual(time, id) { const c = this.contatos[time].get(id); return c && this.t - c.t < 1.1 ? c : null; }
  /** Hash do estado — para detectar dessincronia numa partida em rede. */
  hashEstado() { const a = [this.tick]; for (const n of this.navios) a.push(n.x, n.z, n.rumo, n.v, n.vida); for (const m of this.misseis) if (m.ativo) a.push(m.x, m.y, m.z); for (const q of this.drones) if (q.ativo) a.push(q.x, q.y, q.z); for (const l of this.lanchas) if (l.ativo) a.push(l.x, l.z, l.vida); for (const q of this.sams) if (q.ativo) a.push(q.x, q.y, q.z); for (const q of this.helis) if (q.ativo) a.push(q.x, q.y, q.z, q.comb); for (const q of this.uavs) if (q.ativo) a.push(q.x, q.y, q.z); return hashNums(a); }
}
