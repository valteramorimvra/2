// v1.2.0 — Avarias por área/módulo, incêndio e alagamento (danos contínuos), equipe de reparo, recarga das iscas e
import { PARAM } from '../armasParametros.js';
import { danoSetor } from './megabase.js'; /* v1.2.60 */
// AFUNDAMENTO realista (jogador e bots). Determinístico (só sim.rng). Sem tripulação visível, sem gore.
// Módulos (0..1): motor (popa), leme (popa extrema), canhao (proa), vls (meia-nau/proa). Em 0 o módulo fica INOPERANTE
// (abaixo de 30% = inoperante — motor: 55% da velocidade; leme: 45% da taxa de giro; canhão: recarga 2,2×; VLS: não lança) e se recupera sozinho
// até 30% em ~25 s (equipe de bordo); a equipe de reparo leva tudo a ≥ 60% na hora.
import { clamp } from '../sim/util.js';

/** Modificadores neutros (bots sem perfil). Iguais em forma aos de navalTechTreeEconomy.modsDe. */
export const MODS_PADRAO = { radar: 1, trava: 1, vlsMais: 0, vmax: 1, acel: 1, giro: 1, avarias: 1, cad: 1, rcs: 1, disp: 1, misVel: 1, torpDano: 1, ciwsTaxa: 1, samPk: 1, heliFuel: 1, municao: 'he', missil: 'padrao', isca: 'padrao',
  municaoEf: { dano: 1, fogo: 0.18, perf: 0 }, missilEf: { dano: 1, pkCiws: 1 }, iscaEf: { pIsca: 0.85, cargasMais: 0 }, reparo: { usos: 2, recarga: 60, cura: 0.08 } };
export const AVARIA = { fogoDps: 0.55, alagDps: 0.75, fogoDur: 16, alagDur: 20, regen: 1 / 80, minRegen: 0.3, iscaPronta: 3, iscaRecarga: 22 };

export function instalaAvarias(n) {
  const m = n.mods; n.avaria = { motor: 1, leme: 1, canhao: 1, vls: 1, radar: 1, ponte: 1 }; /* v1.2.14: + ponte de comando */ /* v1.2.2: + radar (alcance do radar e dispersão) */ n.incendio = 0; n.alagamento = 0; n.alagSide = 1; n.aguaAbordo = 0;
  n.reparo = { usos: m.reparo.usos, usosMax: m.reparo.usos, t: 0, recarga: m.reparo.recarga, cura: m.reparo.cura };
  // iscas: cargas PRONTAS no lançador (3 + bônus) e o resto no paiol, recarregadas uma a uma
  const tot = Math.min(n.papel === 'jogador' ? 99 : 4, n.Cb.chaff + (m.iscaEf.cargasMais || 0)); /* v1.2.5: bots com no máximo 4 cargas */ n.chaffMax = Math.min(tot, AVARIA.iscaPronta + (m.iscaEf.cargasMais || 0)); n.chaff = n.chaffMax; n.chaffReserva = tot - n.chaffMax; n.tChaffRec = 0; n.pIsca = m.iscaEf.pIsca;
  n.ultHit = { lx: 0, lz: 0, como: '' }; n.afunda = null;
}
/** Dano localizado: decide módulo atingido, incêndio e alagamento conforme o ponto de impacto (coordenadas locais). */
/** v1.2.14: módulo exato pelo ponto local do impacto (MIRA LIVRE): torre (raio ≈ 0,32·boca em torno do eixo), ponte (superestrutura), leme (popa extrema), motor (popa), linha d'água (alagamento), senão casco. */
export function moduloExato(n, hit) { const C = n.C, P = n.P, u = (C.L / 2 - hit.lz) / C.L; let torre = -1;
  if (hit.ly < 1.2) return { mod: 'agua', torre };
  if (P.torres) for (let j = 0; j < P.torres.length; j++) { const t = P.torres[j]; if (Math.abs(hit.lz - t.z) < Math.max(3.5, C.B * 0.34) && hit.ly > C.F - 0.8) /* acima do convés, na estação da torre */ { torre = j; return { mod: 'canhao', torre }; } }
  const sp = P.sup; if (sp && hit.lz > Math.min(sp.z0, sp.z1) - 2 && hit.lz < Math.max(sp.z0, sp.z1) + 2 && hit.ly > C.F + 0.5) return { mod: hit.ly > C.F + sp.h * 0.8 ? 'radar' : 'ponte', torre };
  if (u < 0.08) return { mod: 'leme', torre }; if (u < 0.3) return { mod: 'motor', torre }; return { mod: null, torre }; }
export function danoLocal(sim, n, hit, d, como, g) {
  if (n.morto) return; const C = n.C, u = (C.L / 2 - hit.lz) / C.L; /* 0 popa .. 1 proa */ n.ultHit.lx = hit.lx; n.ultHit.lz = hit.lz; n.ultHit.como = como; if (C.base) danoSetor(sim, n, hit.lx, hit.lz, d); /* v1.2.60: setores da megabase */
  const fr = d / (C.vida * 0.12); // fração de "pancada" relativa ao navio
  let mod = null; if (u < 0.08) mod = 'leme'; else if (u < 0.3) mod = 'motor'; else if (u > 0.66) mod = 'canhao'; else if (u > 0.48) mod = 'vls';
  if (g && g.livre && !g.rbu && !g.foguete && como === 'canhao') { const mz = moduloExato(n, hit); n.ultHit.mod = mz.mod; if (mz.torre >= 0 && n.torres[mz.torre]) { const t = n.torres[mz.torre]; t.rec = Math.max(t.rec || 0, 6 + 10 * clamp(fr, 0, 1)); t.atingida = sim.t; } /* torre atingida: fica fora de ação alguns segundos */
    if (mz.mod && mz.mod !== 'agua') { const a = n.avaria, ant = a[mz.mod]; if (sim.rng.next() < 0.8) { a[mz.mod] = Math.max(0, a[mz.mod] - clamp(fr * 0.8, 0.18, 1)); if (ant > 0 && a[mz.mod] <= 0) sim.evento({ t: 'modulo', id: n.id, mod: mz.mod }); } } mod = null; if (mz.mod === 'agua') hit.ly = Math.min(hit.ly, 0.5); } /* v1.2.14 MIRA LIVRE: dano no módulo EXATO do ponto atingido (sem sorteio de área) */
  const PD = PARAM.danoReal; if (!(g && g.livre) && (como === 'missil' || como === 'canhao') && hit.ly > C.F + n.P.sup.h * 0.8 && hit.lz > n.P.sup.z0 - 4 && hit.lz < n.P.sup.z1 + 4 && sim.rng.next() < (como === 'missil' ? PD.radarMissil * 2 : 0.12)) mod = 'radar'; /* v1.2.2: impacto alto na superestrutura → radar */
  if (mod && sim.rng.next() < (como === 'canhao' ? 0.45 : como === 'torpedo' ? PD.modTorp : PD.modMissil)) { const a = n.avaria; const ant = a[mod]; a[mod] = Math.max(0, a[mod] - clamp(fr * 0.7, 0.15, 1)); if (ant > 0 && a[mod] <= 0) sim.evento({ t: 'modulo', id: n.id, mod }); }
  const durA = n.mods.avarias || 1;
  // incêndio: HE incendeia mais; mísseis quase sempre
  const pf = como === 'missil' ? PD.fogoMissil : como === 'torpedo' ? PD.fogoTorp : como === 'canhao' ? (g ? g.fogo : 0.18) : como === 'drone' ? 0.5 : 0; if (pf && sim.rng.next() < pf) { if (n.incendio <= 0) sim.evento({ t: 'incendio', id: n.id }); n.incendio = Math.max(n.incendio, AVARIA.fogoDur * durA); }
  // alagamento: abaixo/na linha d'água (torpedo sempre)
  if (como === 'torpedo' || (hit.ly < 1.2 && ((g && g.livre && n.ultHit.mod === 'agua') || sim.rng.next() < 0.45))) /* v1.2.14: MIRA LIVRE na linha d'água = alagamento garantido */ { if (n.alagamento <= 0) sim.evento({ t: 'alagamento', id: n.id }); n.alagamento = Math.max(n.alagamento, AVARIA.alagDur * durA * (como === 'torpedo' ? 1.5 : 1)); n.alagSide = hit.lx >= 0 ? 1 : -1; n.aguaAbordo = Math.min(1, n.aguaAbordo + (como === 'torpedo' ? 0.35 : 0.1)); }
}
export function passoAvarias(sim, n, dt) {
  const a = n.avaria, Cb = n.Cb, md = n.mods;
  if (n.incendio > 0) { n.incendio -= dt; sim.dano(n, AVARIA.fogoDps * dt * (Cb.vida / 200), null, 'fogo', true); }
  if (n.alagamento > 0) { n.alagamento -= dt; sim.dano(n, AVARIA.alagDps * dt * (Cb.vida / 200), null, 'alagamento', true); n.aguaAbordo = Math.min(1, n.aguaAbordo + dt * 0.012); } else n.aguaAbordo = Math.max(0, n.aguaAbordo - dt * 0.004);
  for (const k in a) if (a[k] < AVARIA.minRegen) a[k] = Math.min(AVARIA.minRegen, a[k] + AVARIA.regen * dt);
  // efeitos dos módulos (cópia do navio): sem motor ~55% vmax; sem leme ~45% do giro
  n.C.vmax = Cb.vmax * md.vmax * (a.motor < AVARIA.minRegen ? 0.55 : 0.85 + 0.15 * Math.min(1, a.motor / 0.6)); n.C.giro = Cb.giro * md.giro * (a.leme < AVARIA.minRegen ? 0.45 : 1) * (a.ponte != null && a.ponte < AVARIA.minRegen ? 0.8 : 1); /* v1.2.14: ponte inoperante = manobra mais lenta */
  // adernamento/caimento progressivos com o dano e a água embarcada (o render soma em lista/trimDano)
  const dano = 1 - n.vida / n.C.vida; const lAlvo = n.alagSide * (n.aguaAbordo * 0.11 + dano * 0.035); n.lista += (lAlvo - n.lista) * Math.min(1, dt * 0.25);
  const tAlvo = (n.ultHit.lz < 0 ? -1 : 1) * (n.aguaAbordo * 0.03); n.trimDano += (tAlvo - n.trimDano) * Math.min(1, dt * 0.2);
  const r = n.reparo; if (r.t > 0) r.t -= dt;
  if (n.chaff < n.chaffMax && n.chaffReserva > 0) { n.tChaffRec += dt; if (n.tChaffRec >= AVARIA.iscaRecarga) { n.tChaffRec = 0; n.chaff++; n.chaffReserva--; } } else n.tChaffRec = 0;
}
/** Afundamento: explosão secundária, incêndio, adernamento/caimento conforme o último dano, convés alagando, some. */
export function passoAfundamento(sim, n, dt) {
  const C = n.C; n.tMorto += dt; if (!n.afunda) { const u = (C.L / 2 - n.ultHit.lz) / C.L; const modo = n.ultHit.como === 'torpedo' || Math.abs(n.ultHit.lx) > C.B * 0.3 ? 'adorno' : u > 0.62 ? 'proa' : u < 0.3 ? 'popa' : (sim.rng.next() < 0.5 ? 'adorno' : 'proa');
    n.afunda = { modo, lado: n.ultHit.lx >= 0 ? 1 : -1, sec: 0, prof: 0, l0: n.lista, a0: n.adorno + n.balanco }; n.incendio = 30; sim.evento({ t: 'afundaModo', id: n.id, modo }); }
  const A = n.afunda, t = n.tMorto;
  if (!A.sec && t > 1.4) { A.sec = 1; sim.evento({ t: 'secundaria', id: n.id }); }
  /* v1.2.16 item 27: 3–4 explosões secundárias PEQUENAS internas (paióis/praça de máquinas/convés) espaçadas 2–3,5 s — iguais para jogador e bots */
  if (A.sec && (A.s2 | 0) < 4 && t > 2.8 + (A.s2 | 0) * 2.4 + (A.j || 0) && A.prof < C.F + 2) { A.s2 = (A.s2 | 0) + 1; A.j = (A.j || 0) + sim.rng.next() * 0.9; sim.evento({ t: 'secundaria', id: n.id, peq: 1, lx: (sim.rng.next() - 0.5) * C.B * 0.5, lz: (sim.rng.next() - 0.5) * C.L * 0.7 }); }
  n.v *= 1 - 0.35 * dt; n.w *= 1 - 0.5 * dt; n.rumo += n.w * dt; n.x += Math.sin(n.rumo) * n.v * dt; n.z -= Math.cos(n.rumo) * n.v * dt;
  // perfil de afundamento: perde a reserva de flutuação (0–5 s), depois acelera; casco coberto em ~12 s, some em ~20 s (v1.2.16)
  /* v1.2.16 item 27: perfil comprimido para a sequência de 8–15 s (casco coberto ~12 s, some ~20 s), igual para jogador e bots */ const vel = t < 5 ? 0.25 + t * 0.06 : Math.min(2.4, 0.55 + (t - 5) * 0.16); A.prof += vel * dt; n.arfagem = -A.prof;
  const f = clamp(t / 12, 0, 1), e = f * f * (3 - 2 * f);
  n.adorno += (0 - n.adorno) * Math.min(1, dt * 0.5); n.balanco *= 1 - Math.min(1, dt * 0.5);
  if (A.modo === 'adorno') { n.lista = A.l0 + (A.lado * 0.95 - A.l0) * e; n.trimDano = (n.ultHit.lz < 0 ? -0.05 : 0.05) * e; }
  else if (A.modo === 'proa') { n.trimDano = -0.3 * e; n.lista = A.l0 + (A.lado * 0.18 - A.l0) * e; }
  else { n.trimDano = 0.28 * e; n.lista = A.l0 + (A.lado * 0.15 - A.l0) * e; }
  n.caturro += (0 - n.caturro) * Math.min(1, dt * 0.5);
  n.submerso = A.prof > C.F + n.P.sup.h * 2.6 + C.L * Math.abs(Math.sin(n.trimDano)) * 0.5 + 14 ? 1 : 0;
  n.aguaAbordo = clamp(A.prof / (C.F + 1), 0, 1);
}
