// v1.2.26 — BOMBARDEIRO de convés 'Urubu-rei' (id de gancho 'bombardeiroNuclear') com BOMBA ATÔMICA tática (simulação determinística).
// Só existe em navios cuja classe declara C.nuclear (os 2 super porta-aviões gigantes da 1.2.26). Nenhum nome real de aeronave/arma.
// Ciclo: DECOLA → VOO de penetração a ~2,8 km (stand-off) com escolta de caças → SOLTA a bomba (paraquedas 1,5 s) → bombardeiro VOLTA e pousa.
// A bomba detona a 150 m sobre a água. LIMITES (v1.2.29, Valter 15:07/15:11/15:12): libera após 15 s; 10 bombas/surtida; recarga 25 s ao pousar; abatido = carga perdida e novo bombardeiro 25 s após a queda; paiol ILIMITADO; 1 bombardeiro no ar/PA; computador SEM bomba (só com a opção da personalizada)
// (sem detonar). Após o paraquedas abrir a bomba NÃO é abatível por CIWS/laser (alvo pequeno sob retardo + tempo curto — irrealista). FOGO AMIGO = 0.
// v1.2.27: raio ~1,5–5 km. v1.2.29 (nuke1230 v2): dano MÁX 50% vida (cai c/ distância); fogo amigo 0;
// onda de choque atraso d/343; arranca convés; T.estr; efeitos ~7 s antes do fim. Colisão terreno (desvio/impacto).
import { clamp, ang, marcacao, G } from './util.js';
import { desviaTerreno, colideAereoTerreno } from './colisaoTerreno.js';
import { alturaMar, emiteOndaNuclear } from './ocean.js';
import { derrubaAereo, arrancaDoConves, noConvesVisivel } from '../naval5v5/aereo.js';
import { LASER } from '../naval5v5/defesa.js';
import { SAM } from './classes.js';
import { danoEstr } from './destruicao.js';

export const NUK = Object.freeze({
  id: 'bombardeiroNuclear', nome: 'Bombardeiro embarcado Urubu-rei', bomba: 'Bomba atômica tática',
  liberaApos: 15,       // s de partida antes do 1º uso (v1.2.29: era 120)
  alcanceMax: 14000,    // m: stand-off maior com voo alto (v1.2.27)
  altVoo: 2200, vVoo: 255, vDecola: 75, tDecola: 3.2, // m, m/s — penetração a alta altitude
  hRajada: 150,         // m: altura de detonação (espoleta barométrica/radar)
  tChute: 1.5, kChute: 0.0042, kLivre: 0.00006, // arrasto quadrático (1/m) com e sem paraquedas de retardo
  raioTotal: 800,       // m: perto — quase Dmax (queda contínua; REVISAO #4 / NOTAS-FISICA §1)
  raioPesado: 2500,     // m: médio
  raioBorda: 5000,      // m: borda → 0
  raioAereo: 3500,      // m: aeronaves no ar empurradas / inimigas derrubadas perto
  raioMisseis: 2000,    // m: mísseis/drones inimigos no ar destruídos
  raioConvés: 4500,     // m: aeronaves no convés podem ser arrancadas
  raioEstr: 4200,       // m: pontes/prédios/árvores
  danoMaxFrac: 0.5,     // v1.2.30: máx 50% da vida (C.vida) por detonação
  vChoque: 343,         // m/s: frente da onda de choque/som
  impNavio: 18,         // m/s Δv radial ref @ fc=1, M=Mref (REVISAO #6; escala 1/M)
  mRefNavio: 180000,    // kg proxy L*B*T ref (~destroyer)
  impAereo: 75,         // m/s Δv ref heli @ fc=1 (REVISAO #7)
  mRefHeli: 8000,       // kg
  mRefUav: 120,         // kg
  dvAereoMax: 120,      // clamp |Δv|
  impYaw: 0.55,         // rad/s guinada máx no choque
  impLista: 0.28,       // rad adorno/lista no choque
  fimAtraso: 7,         // s: espetáculo antes de fechar a partida se a bomba encerrar
  // interceptação v1.2.29: bomba/bombardeiro PRATICAMENTE IMUNES à defesa aérea
  // Pk documentada (por engajamento, com escolta/ECM típicos): SAM ~1,2%; CIWS bomb ~0,05%/s; laser bomb ~0,12%/s; caça ~0,1%/s;
  // bomba em queda pré-chute: CIWS ~0,15%/s, laser ~0,4%/s; pós-paraquedas = 0. Sem escolta SAM sobe a ~2%.
  ciwsBomb: 0.0005, laserBomb: 0.0012, samPk: 0.012, samCad: 18, caca: 0.001, // v1.2.29: quase nunca interceptam
  ciwsQueda: 0.0015, laserQueda: 0.004, // só ANTES do paraquedas; após chute = 0
  iaIntervalo: 2, iaMinSc: 1.6,
  // v1.2.26 item K: PILOTAGEM MANUAL — v1.2.29: menos tremor (taxas menores)
  manBank: 1, manTaxaRol: 0.9, manPitch: 0.5, manTaxaPitch: 0.6, manFatorCurva: 6, manCurvaMax: 0.36, /* v1.2.32: manche mais responsivo */ manAltMin: 160, manAltMax: 3500, manTempo: 320, assume: 4,
  // v1.2.28/29: acelerador + mira solo + preparo bombas (1ª = 10 s; seguintes mais longas)
  thrNiveis: [165, 195, 225, 255, 285], thrMin: 165, thrMax: 285, bombasSurtida: 10, tRecargaPouso: 25, relancaAbatido: 25, /* v1.2.29 Valter 15:07: era 3 / 18 s; relançamento 25 s após abatido */
  tPrep1: 10, tPrepN: [10, 10, 10], // s: 1ª bomba pronta em 10 s após decolar; v1.2.33: seguintes 10 s após a ÚLTIMA bomba da salva (ver FILA.rearme)
  // ESPERA — órbita sem atacar
  espRaio: 2800, espAlt: 2200, espV: 200, espFolga: 2800, autonomia: 720,
});
/** v1.2.32/1.2.33: esquadrilha de 3 bombardeiros — líder (jogador/IA) + 2 alas.
 *  Fila escalonada: cada ala 'passo' m atrás do anterior (27 m de avião + ~10 m de folga) e 'degrau' m mais alto.
 *  O líder solta no comando; as alas soltam 'intervalo' s e 2·'intervalo' s depois; próxima salva 'rearme' s após a última bomba. */
export const FILA = Object.freeze({ passo: 37, degrau: 10, intervalo: 4, rearme: 10, nAlas: 2, decAla: 2.6 });
/** v1.2.29 (Valter 15:12): paiol nuclear por porta-aviões — constante ÚNICA. 'ilimitado' = flag no estado (k.ilimitado), contagem não decrementa
 *  (sem Infinity no estado salvo). Para voltar a um paiol finito, troque por um número (ex.: 10). */
export const PAIOL_NUCLEAR_PA = 'ilimitado';
/** v1.2.29 (Valter 15:11): o COMPUTADOR não tem bomba atômica no test drive e nas partidas normais; só na personalizada com
 *  'Bomba atômica do computador' = ligada (sim.nkBotAtomica = 1), e aí com as mesmas regras do jogador. */
export const nuclearLiberado = (sim, n) => !!n && (n.papel === 'jogador' || !!(sim && sim.nkBotAtomica));
/** Queda do bombardeiro (abatido ou terreno): carga perdida; libera k.noAr; novo bombardeiro em NUK.relancaAbatido s. */
function quedaBombardeiro(sim, q) { const n = sim.navios[q.dono], k = n && n.nk; if (!k || k.noAr !== q.idx) return; k.noAr = -1; q.cargas = 0; k.tRec = Math.max(k.tRec || 0, sim.t + NUK.relancaAbatido); }

const NB = 12; // pool fixo de bombardeiros/bombas (2 PA por lado × líder + 2 alas, com folga)
const _o = { x: 0, y: 0, z: 0 };

export function instalaNuclear(sim) {
  sim.nukes = []; for (let i = 0; i < NB; i++) sim.nukes.push({ idx: i, ativo: 0, fase: 0, dono: -1, time: '', x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rumo: 0, t: 0, alvo: -1, ax: 0, az: 0,
    b: { ativo: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, chute: 0, px: 0, py: 0, pz: 0 }, tSam: 0, sams: [], deck: 0, manual: 0, jx: 0, jy: 0, sx: 0, sy: 0, w: 0, bank: 0, gam: 0, tAssume: 0, px: 0, py: 0, pz: 0, prumo: 0, ppitch: 0, proll: 0 }); /* v1.2.29: pose anterior p/ lerp render */
  sim.nukeDet = []; // detonações (para o render consultar e para testes)
  sim.nkChoque = []; // fila de impulsos atrasados (chegada da frente a vChoque)
  sim.nkEspetaculoAte = 0; // se > sim.t, match adia o fim para mostrar efeitos
}

/** O navio leva bombardeiro? (gancho: classe com C.nuclear = { bombas: 1 } — ou true). */
export const temNuclear = (n) => !!(n && n.C && n.C.nuclear);
function prepara(n) { if (n.nk || !temNuclear(n)) return n.nk; const ilim = PAIOL_NUCLEAR_PA === 'ilimitado'; n.nk = { bombas: ilim ? NUK.bombasSurtida : PAIOL_NUCLEAR_PA, ilimitado: ilim ? 1 : 0, usadas: 0, noAr: -1, tIa: 0, perdidas: 0, tRec: 0 }; /* v1.2.29: paiol PAIOL_NUCLEAR_PA (era C.nuclear.bombas = 4) */ return n.nk; }

/** Por que não pode lançar agora? ('' = pode) — usado pelo HUD e pela IA. */
export function motivoNuclear(sim, n) { if (!nuclearLiberado(sim, n)) return 'semBombardeiro'; const k = prepara(n); if (!k) return 'semBombardeiro'; if (n.morto) return 'morto'; if (!k.ilimitado && k.bombas <= 0) return 'usada'; if (k.noAr >= 0) return 'noAr'; if (k.tRec && sim.t < k.tRec) return 'recarga'; if (sim.t < NUK.liberaApos) return 'cedo'; return ''; }

/** Comando { t:'nuclear', alvo?, px?, pz? } — alvo = id de navio inimigo (segue o navio), ou ponto px/pz na água. */
export function lancaNuclear(sim, n, cmd) { const k = prepara(n); const mot = motivoNuclear(sim, n); if (mot) { sim.evento({ t: 'nkNegado', id: n.id, motivo: mot }); return 0; }
  let a = sim.navios[cmd && cmd.alvo != null ? cmd.alvo : n.alvoId], ax, az; if (a && !a.morto && a.time !== n.time) { ax = a.x; az = a.z; } else { a = null; if (cmd && Number.isFinite(cmd.px) && Number.isFinite(cmd.pz)) { ax = +cmd.px; az = +cmd.pz; } else { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'semAlvo' }); return 0; } }
  if (Math.hypot(ax - n.x, az - n.z) > NUK.alcanceMax) { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'alcance' }); return 0; }
  const q = sim.nukes.find((x) => !x.ativo && !x.b.ativo && !(x.espDec > 0)); if (!q) { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'pool' }); return 0; }
  const nCarga = k.ilimitado ? NUK.bombasSurtida : Math.min(NUK.bombasSurtida, k.bombas); if (!k.ilimitado) k.bombas -= nCarga; k.usadas += nCarga; k.noAr = q.idx; const L = n.C.L, P = n.P || {}, dY = P.convoo && P.convoo.y != null ? P.convoo.y + 0.6 /* fiscal nukefumaca: convés de voo REAL (= aeronaves comuns, aereo.js pad/decolaPista); antes C.F+1.6 = 4–6 m DENTRO do casco/hangar */ : (P.deckY != null ? P.deckY : n.C.F) + 1.6;
  q.ativo = 1; q.fase = 1; q.dono = n.id; q.time = n.time; q.t = 0; q.alvo = a ? a.id : -1; q.ax = ax; q.az = az; q.tSam = 0; q.sams.length = 0; q.deck = dY; q.v = 0; q.manual = 0; q.manualPend = 0; q.tMan = 0; q.espera = 0; q.devolve = 0; q.cargas = nCarga; q.thr = 2; q.miraSolo = 0; q.jx = q.jy = q.sx = q.sy = q.w = q.bank = q.gam = q.tAssume = 0; q.nSoltas = 0; q.tPrep = NUK.tPrep1 || 10; q.auto = a ? 1 : 0; /* v1.2.29: AUTO se alvo travado; prep 1ª bomba 10 s */
  sim.mundo(n, 0, dY, L * 0.38, _o); q.x = q.px = _o.x; q.y = q.py = _o.y; q.z = q.pz = _o.z; q.rumo = q.prumo = n.rumo; q.vx = q.vy = q.vz = 0; q.pitch = q.ppitch = 0; q.roll = q.proll = 0; // começa no terço de ré do convés, aproado
  sim.evento({ t: 'nkDecola', id: n.id, idx: q.idx, x: q.x, y: q.y, z: q.z, alvo: q.alvo, ax, az }); escoltaNuclear(sim, n, q); criaAlas(sim, q); return 1; }
/** v1.2.32: reserva as 2 alas no pool; decolam do mesmo convés 2,6 s e 5,2 s depois do líder. */
function criaAlas(sim, c) { c.pontoFixo = c.alvo < 0 ? 1 : 0; c.lider = -1; let k = 0;
  for (const w of sim.nukes) { if (k >= FILA.nAlas) break; if (w === c || w.ativo || w.b.ativo || w.espDec > 0) continue; k++;
    w.ativo = 0; w.fase = 0; w.dono = c.dono; w.time = c.time; w.t = 0; w.alvo = c.alvo; w.ax = c.ax; w.az = c.az; w.tSam = 0; w.sams.length = 0; w.deck = c.deck; w.v = 0; w.manual = 0; w.manualPend = 0; w.tMan = 0; w.espera = 0; w.devolve = 0; w.cargas = c.cargas; w.thr = 2; w.miraSolo = 0;
    w.jx = w.jy = w.sx = w.sy = w.w = w.bank = w.gam = w.tAssume = 0; w.nSoltas = 0; w.tPrep = 1e9; w.auto = 0; w.pontoFixo = c.pontoFixo; w.lider = c.idx; w.ala = k; w.espDec = FILA.decAla * k; w.soltaEm = 0; } }
/** v1.2.33: líder soltou → alas soltam 4 s e 8 s depois; líder só tem a próxima bomba 10 s após a última da salva. */
function agendaAlas(sim, L) { for (const w of sim.nukes) if (w.lider === L.idx && (w.ativo || w.espDec > 0) && (w.cargas | 0) > 0) { w.soltaEm = sim.t + FILA.intervalo * w.ala; L.tPrep = Math.max(L.tPrep || 0, FILA.intervalo * w.ala + FILA.rearme); } }
/** v1.2.32: ala aguardando a vez de decolar. */
function alaEspera(sim, q, dt) { q.espDec -= dt; if (q.espDec > 0) return; q.espDec = 0; const L = sim.nukes[q.lider], n = sim.navios[q.dono];
  if (!L || !L.ativo || L.dono !== q.dono || !n || n.morto) { q.lider = -1; return; }
  q.ativo = 1; q.fase = 1; q.t = 0; q.v = 0; sim.mundo(n, 0, q.deck, n.C.L * 0.38, _o); q.x = q.px = _o.x; q.y = q.py = _o.y; q.z = q.pz = _o.z; q.rumo = q.prumo = n.rumo; q.vx = q.vy = q.vz = 0; q.pitch = q.ppitch = 0; q.roll = q.proll = 0; }
/** v1.2.33: ala em voo — fila escalonada atrás do líder (alas acima), segura a posição com ganho alto quando perto; longe, aproxima. */
function passoAla(sim, q, dt) { const L = sim.nukes[q.lider];
  if (!L || !L.ativo || L.dono !== q.dono) { q.lider = -1; if (q.fase >= 2) { q.fase = 3; q.tEsc = 0; q.manual = 0; q.tPrep = 0; } return passoBombardeiro(sim, q, dt); }
  if (q.fase === 1) return passoBombardeiro(sim, q, dt);
  guardaPose(q); q.t += dt;
  const fx = Math.sin(L.rumo), fz = -Math.cos(L.rumo), atr = FILA.passo * q.ala, sx = L.x - fx * atr, sz = L.z - fz * atr, sy = Math.max(150, L.y + FILA.degrau * q.ala);
  const ex = sx - q.x, ey = sy - q.y, ez = sz - q.z, Lv = Math.max(120, L.v || 0), jd = Math.hypot(ex, ey, ez), pf = jd < 90, kg = jd > 400 ? 0.5 : 1.6;
  let vx = (L.vx || fx * Lv) + ex * kg, vz = (L.vz || fz * Lv) + ez * kg, vy = (L.vy || 0) + ey * kg; const vM = Lv + (jd > 400 ? 90 : 45), vh = Math.hypot(vx, vz); if (vh > vM) { vx *= vM / vh; vz *= vM / vh; } vy = clamp(vy, -60, 60);
  let dr = ang((pf ? L.rumo : Math.atan2(vx, -vz)) - q.rumo); const tr = (pf ? 1.2 : 0.6) * dt; dr = clamp(dr, -tr, tr); const w = dr / Math.max(1e-4, dt); q.rumo = ang(q.rumo + dr);
  const v = Math.max(110, Math.hypot(vx, vz)); q.v = v; q.vx = vx; q.vz = vz; q.vy = vy; q.x += vx * dt; q.y += vy * dt; q.z += vz * dt;
  q.pitch = pf ? (L.pitch || 0) + (Math.atan2(vy, v) - (L.pitch || 0)) * 0.3 : Math.atan2(vy, v); const rl = pf ? (L.roll || 0) : clamp(-w * 2.2, -1, 1); q.roll = (q.roll || 0) + clamp(rl - (q.roll || 0), -0.9 * dt, 0.9 * dt);
  q.w = w; q.bank = -q.roll; q.gam = q.pitch; q.fase = L.fase >= 3 ? 3 : 2;
  if (q.soltaEm > 0 && sim.t >= q.soltaEm && !q.b.ativo && (q.cargas | 0) > 0 && q.y > NUK.hRajada + 120) { q.soltaEm = 0; q.tPrep = 0; solta(sim, q); q.fase = 2; q.tPrep = 1e9; }
  interceptaBombardeiro(sim, q, dt); }
/** v1.2.33 (render/câmera): o último ala da fila já em posição (ou o próprio líder). */
export function ultimoDaFila(sim, L) { if (!sim || !sim.nukes || !L) return L; let u = L, ma = 0;
  for (const w of sim.nukes) if (w.ativo && w.lider === L.idx && w.dono === L.dono && w.fase >= 2 && (w.ala | 0) > ma) { const fx = Math.sin(L.rumo), fz = -Math.cos(L.rumo), a = FILA.passo * w.ala; if (Math.hypot(L.x - fx * a - w.x, L.z - fz * a - w.z) < 160) { ma = w.ala | 0; u = w; } }
  return u; }
/** v1.2.27: escolta de caças do PA — ativa esquadrilha e marca até 4 aviões para cobrir o bombardeiro. */
function escoltaNuclear(sim, n, q) { if (!n.helis || !n.helis.length) return; n.esq = 1; let k = 0;
  for (const i of n.helis) { const h = sim.helis[i]; if (!h || h.estado === 7 /* ABATIDO */) continue; if (!h.H || !h.H.aviao) continue;
    h.auto = 1; h.missao = 'escolta'; h.escortNk = q.idx; if (h.estado === 0 /* HANGAR */ || h.estado === 1 /* CONVOO */) h.lancar = 1; if (++k >= 4) break; }
  sim.evento({ t: 'nkEscolta', id: n.id, idx: q.idx, n: k }); }

/** Distância horizontal percorrida pela bomba solta a altVoo/vVoo até hRajada (pré-calculada uma vez; mesma integração do passo). */
let _lanço = null; function lanco() { if (_lanço && _lanço.alt === NUK.altVoo) return _lanço; let x = 0, y = NUK.altVoo, vx = NUK.vVoo, vy = 0, t = 0; const dt = 1 / 60;
  while (y > NUK.hRajada && t < 120) { const kk = t > NUK.tChute ? NUK.kChute : NUK.kLivre, v = Math.hypot(vx, vy); vx -= kk * v * vx * dt; vy -= (G + kk * v * vy) * dt; x += vx * dt; y += vy * dt; t += dt; } return (_lanço = { x, t, alt: NUK.altVoo }); }

function voaPara(q, rx, rz, alt, v, dt, sim) { if (sim && !q.manual) { const rumo0 = marcacao(q.x, q.z, rx, rz); const d = desviaTerreno(sim.T, q.x, q.y, q.z, q.rumo, rumo0, q.v || v, alt, { folga: 40, pitchMax: 0.35, gMax: 2.8, look: 1800 }); if (d.s && d.s.hit) { const sx = Math.sin(d.rumo), sz = -Math.cos(d.rumo); rx = q.x + sx * 2500; rz = q.z + sz * 2500; alt = Math.max(alt, d.alt); v *= d.vMul; } else alt = Math.max(alt, d.alt); } const rumo = marcacao(q.x, q.z, rx, rz), e = ang(rumo - q.rumo); let w = clamp(e * 0.9, -0.32, 0.32), vy = clamp((alt - q.y) * 0.35, -28, 48); /* v1.2.27: sobe mais rápido ao teto de penetração */
  /* v1.2.26 item K: voo automático SEM movimentos bruscos — taxa de curva com aceleração limitada (inércia), rolagem com taxa limitada; logo depois do controle manual (tAssume) a IA assume ainda mais devagar */
  const ass = q.tAssume > 0; if (ass) q.tAssume -= dt; w = (q.w || 0) + clamp(w - (q.w || 0), -(ass ? 0.12 : 0.3) * dt, (ass ? 0.12 : 0.3) * dt); vy = (q.vy || 0) + clamp(vy - (q.vy || 0), -(ass ? 6 : 14) * dt, (ass ? 6 : 14) * dt); const rl = clamp(-w * 2.2, -1, 1); q.roll = (q.roll || 0) + clamp(rl - (q.roll || 0), -(ass ? 0.5 : 0.6) * dt, (ass ? 0.5 : 0.6) * dt);
  q.w = w; q.rumo = ang(q.rumo + w * dt);
  q.v += clamp(v - q.v, -12 * dt, 18 * dt); q.pitch = Math.atan2(vy, q.v); q.vx = Math.sin(q.rumo) * q.v; q.vz = -Math.cos(q.rumo) * q.v; q.vy = vy; q.x += q.vx * dt; q.y += vy * dt; q.z += q.vz * dt; }

export function passoNuclear(sim, dt) { if (!sim.nukes) return;
  for (const n of sim.navios) if (temNuclear(n) && !n.nk) prepara(n);
  for (const q of sim.nukes) { if (q.ativo) { if (q.lider >= 0) passoAla(sim, q, dt); else passoBombardeiro(sim, q, dt); } else if (q.espDec > 0) alaEspera(sim, q, dt); if (q.b.ativo) passoBomba(sim, q, dt); }
  passoChoque(sim, dt);
  for (const n of sim.navios) if (n.nk && !n.morto && n.papel !== 'jogador' && n.papel !== 'alvo' && !n.controleRemoto) iaNuclear(sim, n, dt); }

let _imp = null; /* scratch impactoNuclear AUTO */
function guardaPose(q) { q.px = q.x; q.py = q.y; q.pz = q.z; q.prumo = q.rumo; q.ppitch = q.pitch || 0; q.proll = q.roll || 0; } /* v1.2.29 bombcam: pose do passo anterior */
function passoBombardeiro(sim, q, dt) { guardaPose(q); q.t += dt; if (q.tPrep > 0) q.tPrep = Math.max(0, q.tPrep - dt); /* v1.2.29 prep */ const n = sim.navios[q.dono];
  /* v1.2.29 AUTO: com alvo travado e auto=1, IA dirige ao alvo; jogador reassumindo (manual) cancela auto */
  if (q.manual) q.auto = 0; else {
    /* fiscal nukefumaca (item 3): se bomber sem trava própria, herda n.alvoId do navio */
    if (q.alvo < 0 && q.fase === 2) { const don = sim.navios[q.dono]; if (don && don.alvoId >= 0) { const a0 = sim.navios[don.alvoId]; if (a0 && !a0.morto && a0.time !== don.time) { q.alvo = a0.id; q.ax = a0.x; q.az = a0.z; q.miraSolo = 0; q.auto = 1; q.espera = 0; } } }
    if (q.auto && q.alvo >= 0 && q.fase === 2) { const a = sim.navios[q.alvo]; if (a && !a.morto) { q.ax = a.x; q.az = a.z; } }
  }
  if (q.fase === 1) { // corrida no convés (catapulta) acompanhando o navio, depois sai pela proa subindo
    if (n && !n.morto && q.t < NUK.tDecola) { const u = q.t / NUK.tDecola, L = n.C.L; sim.mundo(n, 0, q.deck, L * 0.38 - u * u * L * 0.8, _o); q.x = _o.x; q.y = _o.y; q.z = _o.z; q.rumo = n.rumo; q.v = NUK.vDecola * u + (n.v || 0); q.pitch = 0; return; }
    q.fase = 2; q.v = Math.max(q.v, NUK.vDecola); q.vy = 8; sim.evento({ t: 'nkNoAr', idx: q.idx, id: q.dono }); if (q.manualPend) { q.manualPend = 0; q.manual = 1; q.gam = Math.atan2(8, q.v); q.bank = 0; q.sx = q.sy = 0; sim.evento({ t: 'nkIa', idx: q.idx, id: q.dono, v: 0 }); } }
  if (q.fase === 2 && q.t > NUK.autonomia) { /* combustível: volta e pousa sozinho COM a bomba (devolvida ao paiol) */ q.manual = 0; q.espera = 0; q.fase = 3; q.tEsc = 0; q.devolve = (q.cargas | 0) > 0 ? 1 : 0; q.tAssume = NUK.assume; sim.evento({ t: 'nkIa', idx: q.idx, id: q.dono, v: 1, motivo: 'combustivel' }); }
  if (q.espera && q.fase === 2 && !q.manual) { q.tMan = (q.tMan || 0) + dt; esperaOrbita(sim, q, n, dt); interceptaBombardeiro(sim, q, dt); return; }
  if (q.manual && (q.fase === 2 || q.fase === 3)) { if (q.t > NUK.autonomia + 60) { q.manual = 0; q.tAssume = NUK.assume; if (q.fase === 3) q.tEsc = Math.min(q.tEsc || 0, 4); sim.evento({ t: 'nkIa', idx: q.idx, id: q.dono, v: 1, motivo: 'combustivel' }); } else { q.tMan = (q.tMan || 0) + dt; voaManual(q, dt, sim); if (q.fase === 3 && n && !n.morto && Math.hypot(n.x - q.x, n.z - q.z) < 400 && q.y < 500) { q.ativo = 0; const k = n.nk; if (k && k.noAr === q.idx) { k.noAr = -1; { const devol = q.cargas | 0; if (devol > 0) { if (!k.ilimitado) k.bombas += devol; k.usadas -= devol; } k.tRec = sim.t + NUK.tRecargaPouso; } } sim.evento({ t: 'nkPousa', idx: q.idx, id: q.dono, comBomba: (q.cargas | 0) > 0 ? 1 : 0, restam: k ? (k.ilimitado ? 'ilimitado' : k.bombas) : 0 }); return; } interceptaBombardeiro(sim, q, dt); return; } }
  if (q.fase === 2) { const a = q.alvo >= 0 ? sim.navios[q.alvo] : null; if (a && !a.morto) { const lead = lanco().t; const c = Math.cos(a.rumo), s = Math.sin(a.rumo); q.ax = a.x + s * a.v * lead; q.az = a.z - c * a.v * lead; }
    const L = lanco(), dx = q.ax - q.x, dz = q.az - q.z, d = Math.hypot(dx, dz);
    /* v1.2.27: sobe ao teto ANTES de fechar — senão chega baixo e aborta sem soltar */
    const sobe = q.y < NUK.altVoo * 0.88; /* v1.2.32: sem alvo nem mira de solo → segue reto (não persegue ponto antigo) */ const reto = !(a && !a.morto) && !q.miraSolo && !q.pontoFixo; let tx = reto ? q.x + Math.sin(q.rumo) * 5000 : q.ax, tz = reto ? q.z - Math.cos(q.rumo) * 5000 : q.az;
    /* fiscal nukefumaca (item 3): sobe em ROTA RETA até a altitude (sem órbita de subida) */
    voaPara(q, tx, tz, NUK.altVoo, sobe ? NUK.vVoo * 0.7 : NUK.vVoo, dt, sim);
    const alinhado = Math.abs(ang(marcacao(q.x, q.z, q.ax, q.az) - q.rumo)) < 0.16;
    if (!reto && !sobe && alinhado && d <= L.x + 120 && q.y > NUK.altVoo * 0.85) {
      /* v1.2.29: AUTO não solta se o ponto zero previsto cai perto de aliado (fogo amigo visual/choque) */
      const I = impactoNuclear(q, _imp || (_imp = {})); let okAl = 1;
      if (I.ok) for (const e of sim.navios) { if (e.morto || e.time !== q.time) continue; if (Math.hypot(e.x - I.x, e.z - I.z) < (NUK.raioTotal || 1500) * 0.85) { okAl = 0; break; } }
      if (okAl) solta(sim, q);
    }
    else if (q.t > 320 + (q.tMan || 0)) { q.fase = 3; sim.evento({ t: 'nkAborta', idx: q.idx, id: q.dono }); } } /* v1.2.27: voo alto precisa mais tempo */
  else if (q.fase === 3) { // regresso: curva de escape, sobe e volta ao navio-mãe; pousa (some) a 400 m
    const m = n && !n.morto ? n : null; if (q.tEsc > 0) { q.tEsc -= dt; voaPara(q, q.x + Math.sin(q.rumoEsc) * 5000, q.z - Math.cos(q.rumoEsc) * 5000, NUK.altVoo + 400, NUK.vVoo * 1.08, dt); }
    else if (m) { voaPara(q, m.x, m.z, 300, 120, dt, sim); if (Math.hypot(m.x - q.x, m.z - q.z) < 400) { q.ativo = 0; const k = m.nk; if (k && k.noAr === q.idx) { k.noAr = -1; { const devol = q.cargas | 0; if (devol > 0) { if (!k.ilimitado) k.bombas += devol; k.usadas -= devol; } k.tRec = sim.t + NUK.tRecargaPouso; } } sim.evento({ t: 'nkPousa', idx: q.idx, id: q.dono, comBomba: (q.cargas | 0) > 0 ? 1 : 0, restam: k ? (k.ilimitado ? 'ilimitado' : k.bombas) : 0 }); return; } }
    else { voaPara(q, q.x + Math.sin(q.rumo) * 5000, q.z - Math.cos(q.rumo) * 5000, 900, NUK.vVoo, dt); if (q.t > 260) { q.ativo = 0; return; } } }
  if (!q.manual && q.fase >= 2 && colideAereoTerreno(sim, q, dt, { manual: 0, margem: 4 })) { q.ativo = 0; quedaBombardeiro(sim, q); sim.evento({ t: 'nkTerreno', idx: q.idx, id: q.dono, x: q.x, y: q.y, z: q.z }); return; }
  interceptaBombardeiro(sim, q, dt); }

/** v1.2.26 item K: voo MANUAL — manche suavizado (inércia de comando), rolagem com taxa limitada, curva coordenada (taxa ∝ g·tan(inclinação)/v), ângulo de trajetória com taxa limitada, piso/teto de altitude suaves e energia (sobe perde, desce ganha velocidade). */
function voaManual(q, dt, sim) { const P = NUK; q.sx += (q.jx - q.sx) * Math.min(1, 5 * dt); q.sy += (q.jy - q.sy) * Math.min(1, 6 * dt); /* v1.2.32: manche suavizado exponencial */
  q.bank += clamp((q.sx * P.manBank - q.bank) * 2.6 * dt, -P.manTaxaRol * dt, P.manTaxaRol * dt); let gA = q.sy * P.manPitch;
  if (q.y < P.manAltMin + 160) gA = Math.max(gA, (P.manAltMin + 160 - q.y) / 300); if (q.y > P.manAltMax - 200) gA = Math.min(gA, -(q.y - P.manAltMax + 200) / 800);
  q.gam += clamp((gA - q.gam) * 4 * dt, -P.manTaxaPitch * dt, P.manTaxaPitch * dt); const v = Math.max(1, q.v);
  q.w = (q.w || 0) + (clamp(G * Math.tan(q.bank) / v * P.manFatorCurva, -P.manCurvaMax, P.manCurvaMax) - (q.w || 0)) * Math.min(1, 3 * dt); q.rumo = ang(q.rumo + q.w * dt); q.roll = -q.bank;
  { const thr = P.thrNiveis ? P.thrNiveis[Math.max(0, Math.min(4, q.thr | 0))] : P.vVoo; const vMin = P.thrMin || 165; /* v1.2.28: acelerador tipo telégrafo; sem estol abaixo do mínimo */ q.v = clamp(q.v - G * Math.sin(q.gam) * 0.6 * dt + clamp(thr - q.v, -6 * dt, 7 * dt), vMin, P.thrMax || 290); if (q.v <= vMin + 2 && (q.thr | 0) === 0) q._estolAviso = 1; else q._estolAviso = 0; } q.pitch = q.gam;
  q.vy = q.v * Math.sin(q.gam); const vh = q.v * Math.cos(q.gam); q.vx = Math.sin(q.rumo) * vh; q.vz = -Math.cos(q.rumo) * vh; q.x += q.vx * dt; q.y = Math.max(P.manAltMin * 0.6, q.y + q.vy * dt); q.z += q.vz * dt; if (sim && colideAereoTerreno(sim, q, dt, { manual: 1, margem: 3 })) { q.ativo = 0; const nn = sim.navios[q.dono]; if (nn && nn.nk && nn.nk.noAr === q.idx) nn.nk.noAr = -1; sim.evento({ t: 'nkTerreno', idx: q.idx, id: q.dono, x: q.x, y: q.y, z: q.z }); } }
/** v1.2.26 item K (20:10): ESPERA — órbita de espera SEM ATACAR (não lança, não persegue). Centro = navio-mãe, deslocado para longe das defesas inimigas (alcance SAM + folga). */
function esperaOrbita(sim, q, n, dt) { let cx = n && !n.morto ? n.x : q.x, cz = n && !n.morto ? n.z : q.z; const R = NUK.espRaio, seg = SAM.alc + NUK.espFolga + R;
  for (let it = 0; it < 3; it++) for (const e of sim.navios) { if (e.morto || e.time === q.time) continue; const dx = cx - e.x, dz = cz - e.z, d = Math.hypot(dx, dz); if (d < seg) { const f = (seg - d) / Math.max(1, d); cx += dx * f; cz += dz * f; } }
  q.espC = q.espC || { x: cx, z: cz }; q.espC.x += (cx - q.espC.x) * Math.min(1, dt * 0.05); q.espC.z += (cz - q.espC.z) * Math.min(1, dt * 0.05);
  const a = Math.atan2(q.x - q.espC.x, -(q.z - q.espC.z)), dC = Math.hypot(q.x - q.espC.x, q.z - q.espC.z), av = a + (dC > R * 1.6 ? 0 : 0.55); /* longe: vai ao círculo; perto: segue a órbita (sentido horário) */
  voaPara(q, q.espC.x + Math.sin(av) * R, q.espC.z - Math.cos(av) * R, NUK.espAlt, NUK.espV, dt); }
/** v1.2.26 item K: ponto de impacto previsto (CCIP) se a bomba fosse solta AGORA — mesma integração/arrasto de passoBomba (sem vento). Puro: não altera nada. */
export function impactoNuclear(q, out = {}) { let x = q.x, y = q.y - 2, z = q.z, vx = q.vx, vy = q.vy, vz = q.vz, t = 0; const dt = 1 / 30;
  while (y > NUK.hRajada && t < 90) { const k = t > NUK.tChute ? NUK.kChute : NUK.kLivre, v = Math.hypot(vx, vy, vz); vx -= k * v * vx * dt; vz -= k * v * vz * dt; vy -= (G + k * v * vy) * dt; x += vx * dt; y += vy * dt; z += vz * dt; t += dt; }
  out.x = x; out.z = z; out.t = t; out.ok = q.y > NUK.hRajada + 120 ? 1 : 0; return out; }
/** v1.2.26 item K: comandos do jogador para o SEU bombardeiro no ar. */
export function nkBombardeiroDe(sim, n) { const k = n && n.nk; return k && k.noAr >= 0 && sim.nukes ? sim.nukes[k.noAr] : null; }
export function comandoNuclear(sim, n, cmd) { const q = nkBombardeiroDe(sim, n); if (!q || !q.ativo || q.dono !== n.id) return;
  if (cmd.t === 'nkPiloto') { const m = cmd.v ? 1 : 0; if (q.fase === 1 && m) { q.manualPend = 1; return; } if (m === q.manual && !q.espera) return; q.espera = 0; q.manual = m; if (m) { q.bank = clamp(-q.roll, -NUK.manBank, NUK.manBank); q.gam = Math.atan2(q.vy || 0, Math.max(1, q.v)); q.sx = q.bank / NUK.manBank; q.sy = 0; q.jx = q.jy = 0; } else { q.tAssume = NUK.assume; if (q.fase === 3) { q.tEsc = Math.min(q.tEsc || 0, 6); q.rumoEsc = marcacao(q.ax, q.az, q.x, q.z); } } sim.evento({ t: 'nkIa', idx: q.idx, id: n.id, v: m ? 0 : 1 }); }
  else if (cmd.t === 'nkEspera') { const v = cmd.v ? 1 : 0; if (v) { if (q.manual) { q.manual = 0; q.tAssume = NUK.assume; } q.espera = q.fase <= 2 ? 1 : 0; q.manualPend = 0; q.espC = null; } else q.espera = 0; sim.evento({ t: 'nkEspera', idx: q.idx, id: n.id, v: q.espera }); }
  else if (cmd.t === 'nkCtl') { q.jx = clamp(+cmd.jx || 0, -1, 1); q.jy = clamp(+cmd.jy || 0, -1, 1); }
  else if (cmd.t === 'nkThr') { q.thr = Math.max(0, Math.min(4, cmd.v | 0)); sim.evento({ t: 'nkThr', idx: q.idx, id: n.id, v: q.thr }); } /* v1.2.28: acelerador 0–4 */
  else if (cmd.t === 'nkMiraSolo') { /* v1.2.28: retícula no mar/terra — ponto onde a bomba deve cair */ if (Number.isFinite(cmd.px) && Number.isFinite(cmd.pz)) { q.ax = +cmd.px; q.az = +cmd.pz; q.alvo = -1; q.miraSolo = 1; sim.evento({ t: 'nkMiraSolo', idx: q.idx, id: n.id, px: q.ax, pz: q.az }); } }
  else if (cmd.t === 'nkTrava') { const a = cmd.alvo != null && cmd.alvo >= 0 ? sim.navios[cmd.alvo] : null; if (a && !a.morto && a.time !== n.time) { q.alvo = a.id; q.ax = a.x; q.az = a.z; q.miraSolo = 0; q.espera = 0; q.auto = 1; q.pontoFixo = 0; /* fiscal nukefumaca (item 3): ao travar → DIRETO ao alvo (sem órbita) */ } /* toque SÓ trava; soltar só trocando de alvo (ignora alvo:-1) */ sim.evento({ t: 'nkTravado', idx: q.idx, id: n.id, alvo: q.alvo }); }
  else if (cmd.t === 'nkSolta') { if (q.fase === 2 && q.y > NUK.hRajada + 120 && (q.cargas | 0) > 0) solta(sim, q); } }

function solta(sim, q) { if (q.b.ativo) return; /* uma bomba em queda por vez */ if ((q.tPrep || 0) > 0) return; /* v1.2.29: preparo */ const rest = (q.cargas | 0); if (rest <= 0) return; const b = q.b; b.ativo = 1; b.t = 0; b.chute = 0; b.x = b.px = q.x; b.y = b.py = q.y - 2; b.z = b.pz = q.z; b.vx = q.vx; b.vy = q.vy; b.vz = q.vz; b.dono = q.dono; b.time = q.time;
  q.cargas = rest - 1; q.nSoltas = (q.nSoltas | 0) + 1; /* v1.2.29: seguintes com preparo maior */ { const seq = NUK.tPrepN || [22, 32, 42]; q.tPrep = q.cargas > 0 ? (seq[Math.min(seq.length - 1, (q.nSoltas | 0) - 1)] || 28) : 0; }
  if (q.cargas <= 0) { q.fase = 3; q.tEsc = 18; q.rumoEsc = ang(q.rumo + Math.PI); q.devolve = 0; } else { q.devolve = 1; }
  sim.evento({ t: 'nkSolta', idx: q.idx, id: q.dono, x: b.x, y: b.y, z: b.z, ax: q.ax, az: q.az, tq: lanco().t, restam: q.cargas, prep: q.tPrep }); if (!(q.lider >= 0)) agendaAlas(sim, q); }

function passoBomba(sim, q, dt) { const b = q.b; b.px = b.x; b.py = b.y; b.pz = b.z; b.t += dt; const k = b.t > NUK.tChute ? NUK.kChute : NUK.kLivre; if (b.t > NUK.tChute && !b.chute) { b.chute = 1; sim.evento({ t: 'nkChute', idx: q.idx, x: b.x, y: b.y, z: b.z }); }
  const v = Math.hypot(b.vx, b.vy, b.vz); b.vx -= k * v * b.vx * dt; b.vz -= k * v * b.vz * dt; b.vy -= (G + k * v * b.vy) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
  if (b.y <= NUK.hRajada || b.y <= alturaMar(b.x, b.z, sim.t) + 1) { b.ativo = 0; detona(sim, b.x, Math.max(b.y, 2), b.z, sim.navios[b.dono], b.time); return; }
  // v1.2.27: após paraquedas abrir a bomba NÃO é abatível por CIWS/laser (irrealista); só janela livre-queda pré-chute
  if (b.chute) return;
  let h = 0; for (const n of sim.navios) { if (n.morto || n.time === b.time) continue; const d = Math.hypot(b.x - n.x, b.y - n.C.F, b.z - n.z);
    if (d < 1200 && n.ciws) for (const c of n.ciws) if (c.mun > 0) h += NUK.ciwsQueda * Math.max(0, 1.6 - d / 1200); if (n.lasers && n.lasers.length && d < LASER.alc) h += NUK.laserQueda * n.lasers.length; }
  if (h > 0 && sim.rng.next() < 1 - Math.exp(-h * dt)) { b.ativo = 0; sim.evento({ t: 'nkBombaAbatida', idx: q.idx, x: b.x, y: b.y, z: b.z, dono: b.dono }); } }

function interceptaBombardeiro(sim, q, dt) { if (q.fase === 1 || !q.ativo) return; let h = 0; const S = q.sams;
  const altMul = q.y > 2000 ? 0.15 : q.y > 1200 ? 0.4 : 1; /* v1.2.27: CIWS inútil em altitude; laser/caça degradados */
  for (const n of sim.navios) { if (n.morto || n.time === q.time) continue; const d = Math.hypot(q.x - n.x, q.y - n.C.F, q.z - n.z);
    if (q.y < 1400 && d < 1200 && n.ciws) for (const c of n.ciws) if (c.mun > 0) h += NUK.ciwsBomb * Math.max(0, 1.6 - d / 1200) * (n.C.antiAereo ? 1.5 : 1);
    if (n.lasers && n.lasers.length && d < LASER.alc) h += NUK.laserBomb * n.lasers.length * altMul;
    if (n.sam > 0 && n.samAuto !== 0 && d < SAM.alc * (q.y > 1800 ? 0.72 : 1) && (n.tSamNk || 0) <= sim.t && S.length < 2) { n.sam--; n.tSamNk = sim.t + NUK.samCad; const tv = d / SAM.v + 0.6; S.push({ t: sim.t + tv, por: n.id }); sim.evento({ t: 'nkSamLanc', idx: q.idx, id: n.id, x: n.x, y: n.C.F + 4, z: n.z, tv }); } }
  for (const h2 of sim.helis) { if (!h2.ativo || h2.time === q.time || !h2.H || !h2.H.aviao || h2.estado !== 3) continue; if (Math.hypot(h2.x - q.x, h2.y - q.y, h2.z - q.z) < 3500) h += NUK.caca * altMul; }
  /* escolta: caças aliados próximos reduzem Pk efetivo (ECM/cobertura) */
  let esc = 0; for (const h2 of sim.helis) if (h2.ativo && h2.time === q.time && h2.H && h2.H.aviao && h2.estado === 3 && Math.hypot(h2.x - q.x, h2.z - q.z) < 2800) esc++;
  const ecm = esc > 0 ? Math.max(0.18, 1 - 0.28 * Math.min(4, esc)) : 1;
  for (let i = S.length - 1; i >= 0; i--) if (sim.t >= S[i].t) { const s = S[i]; S.splice(i, 1); if (sim.rng.next() < NUK.samPk * ecm) return abate(sim, q, sim.navios[s.por], 'sam'); sim.evento({ t: 'nkSamFalha', idx: q.idx, x: q.x, y: q.y, z: q.z }); }
  if (h > 0 && sim.rng.next() < 1 - Math.exp(-h * ecm * dt)) abate(sim, q, null, 'defesa'); }
function abate(sim, q, por, arma) { q.ativo = 0; q.sams.length = 0; const n = sim.navios[q.dono], k = n && n.nk; if (k && k.noAr === q.idx) { if (q.fase === 2) k.perdidas++; quedaBombardeiro(sim, q); }
  if (por) { por.stats.menores = (por.stats.menores || 0) + 1; por.stats.helisAbatidos = (por.stats.helisAbatidos || 0) + 1; }
  sim.evento({ t: 'nkAbatido', idx: q.idx, x: q.x, y: q.y, z: q.z, vx: q.vx, vy: q.vy, vz: q.vz, comBomba: q.fase === 2 ? 1 : 0, por: por ? por.id : -1, arma }); }

/** Fração da vida máxima (C.vida) a aplicar como dano: 0…danoMaxFrac (0,5). Cai com a distância. NÃO é mais "1 = destruído". */
export function fatorNuclear(d) {
  /* v1.2.29 (correção da NOTAS-FISICA §1, que misturava valor absoluto com relativo): curva CONTÍNUA, coeficientes todos RELATIVOS a max=0,5.
     u=(d−R0)/(Rp−R0). d≤R0: max·(1−0,15·d/R0) [0,50→0,425] · R0<d≤Rp: max·(0,85+(0,36−0,85)·u) [0,425→0,18] · d>Rp: max·0,36·((Rb−d)/(Rb−Rp))^1,3 [0,18→0], 0 p/ d≥Rb.
     Antes: 42,5% a 799 m e 21,25% a 801 m; 18%→9% a 2,5 km (degraus). anti-NaN r≈0 */
  const max = NUK.danoMaxFrac != null ? NUK.danoMaxFrac : 0.5;
  const R0 = NUK.raioTotal, Rp = NUK.raioPesado || 2500, Rb = NUK.raioBorda;
  if (!(d >= 0) || d !== d) d = 0; // NaN/neg → 0
  if (d <= 0) return max; if (d >= Rb) return 0;
  if (d <= R0) return max * (1 - 0.15 * d / R0); // 0,50 → 0,425
  if (d <= Rp) {
    const u = (d - R0) / Math.max(1e-6, Rp - R0);
    return max * (0.85 + (0.36 - 0.85) * u); // 0,425 → 0,18 (absoluto)
  }
  return max * 0.36 * Math.pow(Math.max(0, (Rb - d) / Math.max(1e-6, Rb - Rp)), 1.3); // 0,18 → 0
}
/** Intensidade da frente de choque (0…1) na distância d — usada p/ impulso/vibração (independente do dano). */
export function fatorChoque(d) { const Rb = NUK.raioBorda * 1.6; if (d >= Rb) return 0; return Math.pow(Math.max(0, 1 - d / Rb), 1.4); }
/** Atraso da frente (s): supersônica perto do zero → 343 m/s. Mesma curva do FX (CURVA.choque invertida aprox.). */
export function atrasoChoque(d) {
  /* REVISAO #13+#14: inverte CURVA.choque R(T)=343T+520(1-exp(-T/0.5)) para impulso = anel visual; d=max(d,1) */
  if (!(d > 0) || d !== d) d = 1; d = Math.max(1, d);
  let T = d / NUK.vChoque;
  for (let i = 0; i < 4; i++) {
    const R = NUK.vChoque * T + 520 * (1 - Math.exp(-T / 0.5));
    const dR = NUK.vChoque + 1040 * Math.exp(-T / 0.5);
    T += (d - R) / Math.max(1e-3, dR);
  }
  return Math.max(0, T);
}

function detona(sim, x, y, z, dono, time) {
  const det = { t: sim.t, x, y, z, time, dono: dono ? dono.id : -1, mortos: [], danos: [], impulsos: 0, convés: 0 }; sim.nukeDet.push(det); if (sim.nukeDet.length > 8) sim.nukeDet.shift();
  sim.nkEspetaculoAte = Math.max(sim.nkEspetaculoAte || 0, sim.t + (NUK.fimAtraso || 7));
  sim.evento({ t: 'nkDetona', x, y, z, time, dono: det.dono, espetaculo: NUK.fimAtraso || 7 });
  emiteOndaNuclear(x, z, sim.t, 6e3, 280); /* item 9: A0=6e3 (REVISAO #1) */
  // 1) DANO imediato (térmico/radiação prompt) — máx 50% vida; FOGO AMIGO = 0
  for (const n of sim.navios) { if (n.morto) continue; const dh = Math.max(0, Math.hypot(n.x - x, n.z - z) - n.C.L * 0.5), d = Math.max(1, Math.hypot(dh, y)); const f = fatorNuclear(d);
    agendaChoqueNavio(sim, n, x, y, z, d, fatorChoque(d)); /* REVISAO #5: impulso mesmo fora do raio de dano */
    if (f <= 0) continue;
    if (n.time === time) { sim.evento({ t: 'nkOnda', id: n.id, f, d }); continue; } /* FOGO AMIGO: 0 de dano */
    const dn = n.C.vida * f * (n.C.blind || 1); const apl = sim.dano(n, dn, dono, 'nuclear');
    if (n.morto) det.mortos.push(n.id); det.danos.push([n.id, Math.round(apl), +f.toFixed(4), Math.round(d)]);
    n.incendio = Math.max(n.incendio || 0, 8 + 18 * (f / (NUK.danoMaxFrac || 0.5))); if (f > 0.12) n.alagamento = Math.max(n.alagamento || 0, 4 + 14 * (f / (NUK.danoMaxFrac || 0.5)));
    sim.evento({ t: 'nkAtingido', id: n.id, f, d, apl, dono: det.dono, x: n.x, z: n.z }); }
  // 2) Aeronaves no ar: agenda impulso (aliadas e inimigas); inimigas perto ainda podem ser derrubadas
  const deck = {}; /* item 12: aeronaves do convés visível, por navio */
  for (const h of sim.helis) {
    if (!h.usado || h.estado === 7 /* ABATIDO */) continue;
    const d = Math.hypot(h.x - x, h.z - z);
    // no convés (hangar/convoo/rearma): pode ser arrancada — ambos os times. v1.2.30 item 12: só PARTE do convés visível (<= ~50 %, cai com a distância), sempre sobra >= 1 por navio; as ocultas no hangar ficam protegidas
    if (h.estado === 0 || h.estado === 1 || h.estado === 6) {
      if (d < (NUK.raioConvés || 4500) && noConvesVisivel(h)) (deck[h.dono] || (deck[h.dono] = [])).push({ h, d });
      continue;
    }
    if (h.estado < 2 || h.estado > 5) continue; // só no ar (DECOLA…POUSO)
    if (d < NUK.raioAereo) {
      agendaChoqueAereo(sim, h, 'h', x, y, z, d, fatorChoque(d));
      // inimigos muito perto: ainda derruba (raio menor que o de empurrão)
      if (h.time !== time && d < NUK.raioAereo * 0.45 && h.y < 2500) derrubaAereo(sim, 'h', h, dono);
    }
  }
  for (const k in deck) { const L = deck[k], n = sim.navios[k]; if (!n || n.morto) continue; const fc = fatorChoque(Math.hypot(n.x - x, n.z - z)); if (!(fc > 0.12)) continue;
    const nR = Math.min(L.length - 1, Math.round(L.length * 0.5 * fc)); L.sort((a, b) => a.d - b.d); /* as mais próximas do ponto zero são as arrancadas */
    for (let i = 0; i < nR; i++) { agendaArrancaConvés(sim, L[i].h, x, y, z, L[i].d, fc, dono, time); det.convés++; } }
  for (const u of sim.uavs || []) if (u.ativo) { const d = Math.hypot(u.x - x, u.z - z); if (d < NUK.raioAereo) { agendaChoqueAereo(sim, u, 'u', x, y, z, d, fatorChoque(d)); if (u.time !== time && d < NUK.raioAereo * 0.45) derrubaAereo(sim, 'u', u, dono); } }
  for (const m of sim.misseis) if (m.ativo && m.time !== time && Math.hypot(m.x - x, m.y - y, m.z - z) < NUK.raioMisseis) m.ativo = 0;
  for (const q of sim.drones || []) if (q.ativo && q.time !== time && Math.hypot(q.x - x, q.z - z) < NUK.raioMisseis) q.ativo = 0;
  for (const q of sim.nukes) if (q.ativo && q.time !== time && Math.hypot(q.x - x, q.y - y, q.z - z) < NUK.raioAereo * 0.5) abate(sim, q, dono, 'onda');
  // 3) Cenário: marca pedido de destruição (render consome via evento; sim pura usa T.estr se existir)
  if (sim.T && sim.T.estr) danoEstr(sim.T.estr, x, y, z, 'nuclear', 9999, null);
  sim.evento({ t: 'nkEstr', x, y, z, r: NUK.raioEstr || 4200 });
  // 4) Vibração (jogador local): intensidade ∝ distância do navio do jogador; evento também para futuros clientes
  let dJog = 1e9, idJog = -1; for (const n of sim.navios) if (n.papel === 'jogador' && !n.morto) { const d = Math.hypot(n.x - x, n.z - z); if (d < dJog) { dJog = d; idJog = n.id; } }
  const iv = fatorChoque(dJog); sim.evento({ t: 'nkVibra', id: idJog, d: dJog, i: iv, ms: vibraPadrao(iv), x, y, z, multi: 1 /* preparado p/ outros jogadores; app sem INTERNET */ });
  return det;
}

/** Padrão de vibração (ms) proporcional à intensidade 0…1. */
export function vibraPadrao(i) { if (i <= 0.02) return [0]; if (i < 0.2) return [40, 40, 60]; if (i < 0.45) return [80, 50, 160]; if (i < 0.75) return [120, 60, 280, 80, 200]; return [180, 40, 420, 60, 300, 80, 180]; }

function agendaChoqueNavio(sim, n, x, y, z, d, fc) {
  if (fc <= 0) return; const Q = sim.nkChoque || (sim.nkChoque = []);
  const dx = n.x - x, dz = n.z - z, L = Math.hypot(dx, dz) || 1;
  Q.push({ t: sim.t + atrasoChoque(d), tipo: 'navio', id: n.id, ux: dx / L, uz: dz / L, fc, d });
}
function agendaChoqueAereo(sim, h, tipo, x, y, z, d, fc) {
  if (fc <= 0) return; const Q = sim.nkChoque || (sim.nkChoque = []);
  const dx = h.x - x, dy = (h.y || 0) - y, dz = h.z - z, L = Math.hypot(dx, dy, dz) || 1;
  Q.push({ t: sim.t + atrasoChoque(d), tipo: 'aereo', kind: tipo, idx: h.idx, ux: dx / L, uy: dy / L, uz: dz / L, fc, d });
}
function agendaArrancaConvés(sim, h, x, y, z, d, fc, dono, time) {
  const Q = sim.nkChoque || (sim.nkChoque = []);
  const dx = h.x - x, dz = h.z - z, L = Math.hypot(dx, dz) || 1;
  Q.push({ t: sim.t + atrasoChoque(d) * 0.85, tipo: 'convés', idx: h.idx, ux: dx / L, uz: dz / L, fc, d, dono: dono ? dono.id : -1, time });
}

function passoChoque(sim, dt) {
  const Q = sim.nkChoque; if (!Q || !Q.length) return;
  for (let i = Q.length - 1; i >= 0; i--) {
    const q = Q[i]; if (sim.t < q.t) continue; Q.splice(i, 1);
    if (q.tipo === 'navio') {
      const n = sim.navios[q.id]; if (!n || n.morto) continue;
      const C = n.C, M = Math.max(1, (C.L || 120) * (C.B || 16) * (C.T || 5)); /* proxy kg */
      const Mref = NUK.mRefNavio || 180000, I0 = NUK.impNavio || 18;
      const I = I0 * q.fc * (Mref / Math.max(M, 0.2 * Mref)); /* REVISAO #6: ∝ 1/M */
      const c = Math.cos(n.rumo), s = Math.sin(n.rumo); const vRad = I * 0.35;
      n.v += (q.ux * s - q.uz * c) * vRad;
      if (C.vmax != null) n.v = clamp(n.v, -C.vmax * 0.35, C.vmax); /* respeita vmax */
      n.w = (n.w || 0) + (NUK.impYaw || 0.55) * q.fc * (q.ux * c + q.uz * s) * Math.min(1, 80 / C.L);
      n.lista = clamp((n.lista || 0) + (NUK.impLista || 0.28) * q.fc * (q.ux * c + q.uz * s), -0.35, 0.35); /* sem capotar */
      n.balanco = clamp((n.balanco || 0) + (NUK.impLista || 0.28) * 0.6 * q.fc, -0.45, 0.45);
      n.nkChoqueAte = Math.max(n.nkChoqueAte || 0, sim.t + 10); /* controlo recuperável ≤10 s */
      sim.evento({ t: 'nkChoqueNavio', id: n.id, fc: q.fc, d: q.d, dv: vRad, I, M, w: n.w });
    } else if (q.tipo === 'aereo') {
      const h = q.kind === 'u' ? (sim.uavs || [])[q.idx] : sim.helis[q.idx]; if (!h || (q.kind !== 'u' && h.estado === 7)) continue;
      const mRef = q.kind === 'u' ? (NUK.mRefUav || 120) : (NUK.mRefHeli || 8000);
      const m = q.kind === 'u' ? mRef : (h.massa || mRef);
      let I = (NUK.impAereo || 75) * q.fc * (mRef / Math.max(m, 0.15 * mRef)); /* REVISAO #7 */
      const lim = NUK.dvAereoMax || 120; if (I > lim) I = lim;
      h.vx = (h.vx || 0) + q.ux * I; h.vy = (h.vy || 0) + Math.max(8, (q.uy || 0.2) * I * 0.55 + 12 * q.fc); h.vz = (h.vz || 0) + q.uz * I;
      if (h.v != null) h.v = Math.hypot(h.vx, h.vz);
      sim.evento({ t: 'nkChoqueAereo', kind: q.kind, idx: q.idx, fc: q.fc, d: q.d, I });
    } else if (q.tipo === 'convés') {
      const h = sim.helis[q.idx]; if (!h || !noConvesVisivel(h)) continue; const n = sim.navios[h.dono]; if (!n || n.morto) continue;
      /* v1.2.30 item 12: confere de novo na chegada da frente (outra bomba / decolagem): sempre fica >= 1 aeronave visível no convés */
      let vis = 0; for (const i of n.helis || []) { const o = sim.helis[i]; if (o && noConvesVisivel(o)) vis++; } if (vis <= 1) continue;
      const mRef = NUK.mRefHeli || 8000; let I = (NUK.impAereo || 75) * q.fc * 0.7 * (mRef / Math.max(h.massa || mRef, 0.15 * mRef));
      if (I > (NUK.dvAereoMax || 120)) I = NUK.dvAereoMax || 120;
      /* vira CORPO FÍSICO: velocidade do navio + empurrão da onda (+ subida); o ramo ABATIDO (aereo.js) faz gravidade, splash na água e colisão com o terreno */
      arrancaDoConves(sim, h, Math.sin(n.rumo) * n.v + q.ux * I, 12 + 35 * q.fc, -Math.cos(n.rumo) * n.v + q.uz * I, q.dono >= 0 ? sim.navios[q.dono] : null);
      sim.evento({ t: 'nkArranca', idx: h.idx, id: h.dono, fc: q.fc, d: q.d, x: h.x, y: h.y, z: h.z, vx: h.vx, vy: h.vy, vz: h.vz });
    }
  }
}


/** IA de bot: usa a bomba COM CRITÉRIO — só depois de liberada +30 s, com ≥ 2 navios inimigos (ou 1 navio capital) dentro do raio total
 *  em torno de um contato detectado, nenhum aliado a < 900 m do ponto e alvo ao alcance. Avalia a cada 2 s (barato). */
export function iaNuclear(sim, n, dt) { const k = n.nk; k.tIa -= dt; if (k.tIa > 0) return; k.tIa = NUK.iaIntervalo; if (motivoNuclear(sim, n) || sim.t < NUK.liberaApos + 30) return;
  let best = null, bs = 0; const cont = sim.contatos[n.time]; if (!cont) return;
  for (const [id] of cont) { const e = sim.navios[id]; if (!e || e.morto || e.time === n.time || !sim.detectado(n.time, id)) continue; if (Math.hypot(e.x - n.x, e.z - n.z) > NUK.alcanceMax * 0.9) continue;
    let sc = 0; for (const o of sim.navios) { if (o.morto) continue; const d = Math.hypot(o.x - e.x, o.z - e.z); if (o.time === n.time) { if (d < NUK.raioTotal * 0.7) { sc = -1; break; } continue; } if (d < NUK.raioTotal * 0.85) sc += o.C.superPA || (o.helis && o.helis.length >= 6) || o.C.vida >= 7000 ? 1.6 : 1; }
    if (sc > bs) { bs = sc; best = e; } }
  const tardio = sim.t > 420; if (best && (bs >= NUK.iaMinSc || (tardio && bs >= 1))) lancaNuclear(sim, n, { alvo: best.id }); }
