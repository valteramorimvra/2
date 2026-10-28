// v1.2.31 — MÍSSIL NUCLEAR DE NAVIO (módulo NOVO; não altera sim/nuclear.js). Os 3 navios lendários (C.missilNuclear = 1) levam UM míssil
// vertical num compartimento especial (escotilha dupla). Regras IGUAIS às da bomba do jogador (constantes lidas de NUK):
//   • liberado aos NUK.liberaApos (15 s) · recarga NUK.tRecargaPouso (25 s) após a detonação · um por vez · estoque ilimitado (FLAG k.ilimitado = 1, sem Infinity;
//     o HUD nunca mostra "0 restantes") · alcance NUK.alcanceMax · jogador sempre; bot só com a opção (nuclearLiberado: sim.nkBotAtomica; opção já existente, nenhuma nova).
//   • EFEITO e DANO = os da bomba v2: no ponto terminal o míssil injeta a carga no pool sim.nukes (b.ativo=1 já na altura NUK.hRajada) e o passoBomba/detona
//     EXISTENTES fazem o resto (onda, dano ≤ danoMaxFrac, fogo amigo = 0, estruturas, choque). Nada de nuclear.js / fatorNuclear / nuclearFx foi tocado.
// Trajetória (ficção de jogo; ver referencias/FONTES.md §4): escotilha abre 1,0 s → ejeção a frio + ignição vertical → arco de Bézier cúbico (tangentes
// verticais na saída e no mergulho) a ~520 m/s de cruzeiro → detona a NUK.hRajada. Não interceptável (como a bomba após o paraquedas: Pk documentada ≈ 0).
import { NUK, nuclearLiberado } from './nuclear.js';
import { layout1231 } from './layout1231.js';
/** DECISÃO DO VALTER: o bot usa a opção EXISTENTE "Bomba atômica do computador" (sim.nkBotAtomica ← pers.nukeBot==='ligada', via nuclearLiberado). Nenhuma opção nova. */
export const MISS = Object.freeze({ tAbre: 1.0, tFecha: 1.2, vCruz: 520, aceleracao: 240, v0: 25, altMin: 450, altMax: 2400, altK: 0.18, travaU: 0.88, tEspera: 0.5, iaIntervalo: 2, intervaloJogador: 8 /* v1.2.33: s entre lançamentos do jogador */ });
export const temMissilNuclear = (n) => !!(n && n.C && n.C.missilNuclear);
export const missilLiberado1231 = (sim, n) => nuclearLiberado(sim, n);
export function preparaMissil(n) { if (n.nm1231 || !temMissilNuclear(n)) return n.nm1231; n.nm1231 = { ilimitado: 1, bombas: 1, usadas: 0, noAr: -1 /* -1 sempre: a UI do bombardeiro (PILOTAR) não se aplica */, voando: 0, perdidas: 0, tRec: 0, tIa: 0, m: null }; return n.nm1231; }
/** Motivo de não poder lançar agora ('' = pode). Mesmos códigos de motivoNuclear (HUD/IA reaproveitam as mensagens). */
export function motivoMissil1231(sim, n) { if (!temMissilNuclear(n)) return 'semBombardeiro'; if (!missilLiberado1231(sim, n)) return 'semBombardeiro'; const k = preparaMissil(n); if (n.morto) return 'morto'; if (k.voando && n.papel !== 'jogador') return 'noAr'; /* v1.2.33: jogador lança de novo 8 s após o lançamento, mesmo com o anterior em voo */ if (k.tRec && sim.t < k.tRec) return 'recarga'; if (sim.t < NUK.liberaApos) return 'cedo'; return ''; }
const _o = { x: 0, y: 0, z: 0 };
const lig = (p0, p1, p2, p3, u, o) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; o.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x; o.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y; o.z = a * p0.z + b * p1.z + c * p2.z + d * p3.z; return o; };
const dBez = (p0, p1, p2, p3, u, o) => { const v = 1 - u; o.x = 3 * v * v * (p1.x - p0.x) + 6 * v * u * (p2.x - p1.x) + 3 * u * u * (p3.x - p2.x); o.y = 3 * v * v * (p1.y - p0.y) + 6 * v * u * (p2.y - p1.y) + 3 * u * u * (p3.y - p2.y); o.z = 3 * v * v * (p1.z - p0.z) + 6 * v * u * (p2.z - p1.z) + 3 * u * u * (p3.z - p2.z); return o; };
function montaCurva(m, ax, az) { const dx = ax - m.x0, dz = az - m.z0, d = Math.hypot(dx, dz), alt = Math.max(MISS.altMin, Math.min(MISS.altMax, d * MISS.altK)), yb = NUK.hRajada;
  m.p0 = { x: m.x0, y: m.y0, z: m.z0 }; m.p1 = { x: m.x0 + dx * 0.04, y: m.y0 + alt * 1.15, z: m.z0 + dz * 0.04 }; m.p2 = { x: ax - dx * 0.03, y: yb + alt * 0.95, z: az - dz * 0.03 }; m.p3 = { x: ax, y: yb, z: az }; m.ax = ax; m.az = az; }
/** Lança (comando { t:'nuclear', alvo? | px,pz }). Retorna 1 se lançou. */
export function lancaMissilNuclear1231(sim, n, cmd) {
  const mot = motivoMissil1231(sim, n); if (mot) { sim.evento({ t: 'nkNegado', id: n.id, motivo: mot }); return 0; } const k = preparaMissil(n);
  let a = sim.navios[cmd && cmd.alvo != null ? cmd.alvo : n.alvoId], ax, az; if (a && !a.morto && a.time !== n.time) { ax = a.x; az = a.z; } else { a = null; if (cmd && Number.isFinite(cmd.px) && Number.isFinite(cmd.pz)) { ax = +cmd.px; az = +cmd.pz; } else { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'semAlvo' }); return 0; } }
  if (Math.hypot(ax - n.x, az - n.z) > NUK.alcanceMax) { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'alcance' }); return 0; }
  if (!sim.nukes || !sim.nukes.some((x) => !x.ativo && !x.b.ativo && !(x.espDec > 0))) { sim.evento({ t: 'nkNegado', id: n.id, motivo: 'pool' }); return 0; }
  const P = layout1231(n.C), nk = P.nuke; sim.mundo(n, nk.x, nk.y + 0.3, nk.z, _o);
  const m = { fase: 0, t: 0, x: _o.x, y: _o.y, z: _o.z, px: _o.x, py: _o.y, pz: _o.z, x0: _o.x, y0: _o.y, z0: _o.z, vx: 0, vy: 0, vz: 0, v: 0, u: 0, dono: n.id, time: n.time, alvo: a ? a.id : -1, esc: 0, rumo: n.rumo, pitch: Math.PI / 2, espera: 0 };
  montaCurva(m, ax, az); if (k.voando && k.m) (k.ms || (k.ms = [])).push(k.m); m.k = k.kSeq = (k.kSeq || 0) + 1; if (n.papel === 'jogador') k.tRec = sim.t + MISS.intervaloJogador; k.m = m; k.voando = 1; k.usadas++; sim.evento({ t: 'nkMissilEscotilha', id: n.id, x: m.x, y: m.y, z: m.z }); return 1; }
const _d = { x: 0, y: 0, z: 0 }, _b = { x: 0, y: 0, z: 0 };
function termina(sim, n, k, m, det) { k.voando = 0; k.m = null; if (n.papel !== 'jogador') k.tRec = sim.t + NUK.tRecargaPouso; /* v1.2.33: jogador conta 8 s do lançamento */ /* recarga 25 s a contar da detonação (ou da perda) */ if (!det) k.perdidas++; }
function passoUm(sim, n, k, dt) { const m = k.m; m.px = m.x; m.py = m.y; m.pz = m.z; m.t += dt;
  if (m.fase === 0) { m.esc = Math.min(1, m.t / MISS.tAbre); /* abre a escotilha */ if (n.morto) { termina(sim, n, k, m, 0); return; } if (m.t >= MISS.tAbre) { m.fase = 1; m.t = 0; m.v = MISS.v0; sim.evento({ t: 'nkMissilLanca', id: n.id, x: m.x, y: m.y, z: m.z }); } return; }
  if (m.fase === 1) { m.esc = Math.max(0, 1 - Math.max(0, m.t - 0.8) / MISS.tFecha); /* fecha atrás de si */ /* o ponto de saída acompanha o navio só durante a abertura; depois o míssil já está livre */
    if (m.u < MISS.travaU) { const a = sim.navios[m.alvo]; if (a && !a.morto) { montaCurva(m, a.x, a.z); } }
    m.v = Math.min(MISS.vCruz, m.v + MISS.aceleracao * dt); dBez(m.p0, m.p1, m.p2, m.p3, m.u, _d); const sp = Math.hypot(_d.x, _d.y, _d.z) || 1; m.u = Math.min(1, m.u + m.v * dt / sp);
    lig(m.p0, m.p1, m.p2, m.p3, m.u, _b); m.x = _b.x; m.y = _b.y; m.z = _b.z; dBez(m.p0, m.p1, m.p2, m.p3, m.u, _d); const h = Math.hypot(_d.x, _d.z); m.pitch = Math.atan2(_d.y, h); m.rumo = Math.atan2(_d.z, _d.x); m.vx = _d.x / sp * m.v; m.vy = _d.y / sp * m.v; m.vz = _d.z / sp * m.v;
    if (m.u >= 1) m.fase = 2; return; }
  if (m.fase === 2) { /* ponto terminal: injeta a carga no pool NUCLEAR existente já à altura de rajada → passoBomba chama detona() (mesmo efeito/dano da bomba v2) */
    const q = sim.nukes.find((x) => !x.ativo && !x.b.ativo && !(x.espDec > 0)); if (!q) { m.espera += dt; if (m.espera > 6) { termina(sim, n, k, m, 0); } return; }
    const b = q.b; b.ativo = 1; b.t = NUK.tChute + 1; b.chute = 1; b.x = b.px = m.x; b.y = b.py = NUK.hRajada + 1.5; b.z = b.pz = m.z; b.vx = 0; b.vy = -6; b.vz = 0; b.dono = n.id; b.time = n.time; q.dono = n.id; q.time = n.time;
    sim.evento({ t: 'nkMissilFim', id: n.id, x: m.x, y: b.y, z: m.z, idx: q.idx }); termina(sim, n, k, m, 1); } }
/** IA do computador — só com a opção ligada (missilLiberado1231). Mesma regra de escolha de alvo de iaNuclear (cluster inimigo, sem amigos no raio). */
export function iaMissil1231(sim, n, dt) { const k = n.nm1231; k.tIa -= dt; if (k.tIa > 0) return; k.tIa = MISS.iaIntervalo; if (motivoMissil1231(sim, n) || sim.t < NUK.liberaApos + 30) return;
  let best = null, bs = 0; const cont = sim.contatos && sim.contatos[n.time]; if (!cont) return;
  for (const [id] of cont) { const e = sim.navios[id]; if (!e || e.morto || e.time === n.time || !sim.detectado(n.time, id)) continue; if (Math.hypot(e.x - n.x, e.z - n.z) > NUK.alcanceMax * 0.9) continue;
    let sc = 0; for (const o of sim.navios) { if (o.morto) continue; const d = Math.hypot(o.x - e.x, o.z - e.z); if (o.time === n.time) { if (d < NUK.raioTotal * 0.7) { sc = -1; break; } continue; } if (d < NUK.raioTotal * 0.85) sc += o.C.superPA || o.C.vida >= 7000 ? 1.6 : 1; }
    if (sc > bs) { bs = sc; best = e; } }
  const tardio = sim.t > 420; if (best && (bs >= NUK.iaMinSc || (tardio && bs >= 1))) lancaMissilNuclear1231(sim, n, { alvo: best.id }); }
/** Passo do mundo — chamar logo ANTES de passoNuclear(sim, dt) (o míssil injeta a carga e o passoBomba do mesmo tick já a processa). */
export function passoMissil1231(sim, dt) { if (!sim.nukes) return; for (const n of sim.navios) { if (!temMissilNuclear(n)) continue; const k = preparaMissil(n); if (k.ms && k.ms.length) { const m0 = k.m, v0 = k.voando, r0 = k.tRec; for (let i = k.ms.length - 1; i >= 0; i--) { k.m = k.ms[i]; k.voando = 1; passoUm(sim, n, k, dt); if (!k.m) k.ms.splice(i, 1); } k.m = m0; k.voando = v0; k.tRec = r0; } /* v1.2.33: mísseis anteriores ainda em voo */ if (k.voando && k.m) passoUm(sim, n, k, dt);
    if (!n.morto && n.papel !== 'jogador' && n.papel !== 'alvo' && !n.controleRemoto && missilLiberado1231(sim, n)) iaMissil1231(sim, n, dt); } }
