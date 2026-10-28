import { PARAM, elMaxCal } from '../armasParametros.js';
// Armamento principal multi-torre + automação de tiro (AUTO-FOGO).
// Cada torre tem azimute/elevação próprios e um arco livre limitado pela superestrutura (layout.arcoLivre).
// Se o alvo travado está fora do arco de uma torre, em AUTO ela procura um alvo secundário que consiga cobrir
// (torres sincronizadas no mesmo alvo ou em alvos separados). Avanço preditivo por velocidade e rumo do alvo.
import { clamp, ang, marcacao } from '../sim/util.js';
import { MISSEIS, TORPEDO } from '../sim/classes.js';
import { passoSec } from './secundarias.js';

export const AUTO = { intMissil: 8, intMissilSalva: 11, intTorp: 20, alcTorp: 5200, recalc: 10 };

/** A torre i consegue apontar para o azimute ABSOLUTO az? */
export function torreCobre(n, i, az) { const tr = n.torres[i]; const fr = tr.frente > 0 ? 0 : Math.PI; return Math.abs(ang(ang(az - n.rumo) - fr)) <= tr.arco; }
/** Quantas torres cobrem o azimute absoluto az. */
export function torresQueCobrem(n, az) { let k = 0; for (let i = 0; i < n.torres.length; i++) if (torreCobre(n, i, az)) k++; return k; }

const _o = { x: 0, y: 0, z: 0 };
/** Solução de tiro (com avanço) da torre i contra o navio `alvo`; grava em tr.sol2 sem alocar. */
function solucaoTorre(sim, n, i, alvo, out) {
  const A = n.C.canhao, base = n.P.torres[i]; sim.mundo(n, 0, base.y + 2, base.z, _o); const h0 = Math.max(2, _o.y);
  const vx = Math.sin(alvo.rumo) * alvo.v, vz = -Math.cos(alvo.rumo) * alvo.v;
  const s = sim.solucao(_o.x, _o.z, h0, A.V0, alvo.x, alvo.z, vx, vz, sim.kArrasto(n)); if (!s || s.d > A.alc) return null;
  out.az = s.az; out.el = s.el; out.tv = s.tv; out.d = s.d; out.px = s.px; out.pz = s.pz; out.travado = 1; out.hMira = 0; out.alvo = alvo.id; return out;
}

/** v1.2.1: giro em azimute (rad/s) por calibre — PARAM.torre.az = [[cal máx, °/s], …] (76 mm 40°/s … 305 mm 15°/s). */
export function taxaTorre(cal) { const t = PARAM.torre.az; for (const [c, g] of t) if (cal <= c) return g * Math.PI / 180; return t[t.length - 1][1] * Math.PI / 180; }
/** v1.2.21 item 14b: recuo do cano — impulso no disparo (tr.rcV), freio hidráulico no recuo e recuperador (mola) amortecido no retorno; tr.recuo ∈ [0,1] = curso normalizado (o modelo 3D lê). */
export function passoRecuo(tr, cal, dt) { const R = PARAM.recuo, f = clamp((cal - 57) / 248, 0, 1), w = R.w[0] + (R.w[1] - R.w[0]) * f, fr = R.freio[0] + (R.freio[1] - R.freio[0]) * f; let x = tr.recuo || 0, v = tr.rcV || 0; if (!x && !v) return; const ac = -w * w * x - (v > 0 ? fr * v : 2 * R.zeta * w * v); v += ac * dt; x += v * dt; if (x < 1e-4 && v <= 0) { x = 0; v = 0; } tr.recuo = Math.min(1.2, x); tr.rcV = v; }
export function kickRecuo(cal) { const R = PARAM.recuo, f = clamp((cal - 57) / 248, 0, 1); return R.kick[0] + (R.kick[1] - R.kick[0]) * f; }
/** Passo do canhão principal (todas as torres) + automação de mísseis/torpedos. */
export function passoArmas5(sim, n, dt) {
  if (n.morto) return; const A = n.C.canhao; const sol = sim.pontaria(n);
  if (n.gatilho > 0) n.gatilho -= dt; if (n.tAutoMis > 0) n.tAutoMis -= dt; if (n.tAutoTorp > 0) n.tAutoTorp -= dt;
  const auto = !n.doutrinaIA && (!!n.autoFogo || (n.papel === 'jogador' && !!n.controleIA)); /* v1.2.20 item 1: navio sob a IA (bots e o do jogador com a IA no comando) atira pela DOUTRINA de tiro da SquadAI (salvas/rajadas com pausa de observação), não a cada recarga */ /* jogador no heli/drone: a IA do navio atira sozinha */ let disparou = 0;
  for (let i = 0; i < n.torres.length; i++) { const tr = n.torres[i];
    let S = sol; const cobre = torreCobre(n, i, sol.az);
    if (false && !cobre && auto) { // v1.2.1: DESLIGADO — o AUTO-FOGO não escolhe alvos secundários pelo radar
      if ((sim.tick + i) % AUTO.recalc === 0) { tr.sol2ok = 0; let md = A.alc;
        for (const e of sim.navios) { if (e.morto || e.time === n.time || !sim.detectado(n.time, e.id)) continue; const d = Math.hypot(e.x - n.x, e.z - n.z); if (d > md) continue; if (!sim.linhaLivre(n, e)) continue; /* v1.2.2: torre livre não atira em ilha */
          if (!torreCobre(n, i, marcacao(n.x, n.z, e.x, e.z))) continue; if (solucaoTorre(sim, n, i, e, tr.sol2)) { tr.sol2ok = 1; md = d; } } }
      else if (tr.sol2ok) { const e = sim.navios[tr.sol2.alvo]; if (!e || e.morto || !solucaoTorre(sim, n, i, e, tr.sol2)) tr.sol2ok = 0; }
      if (tr.sol2ok) S = tr.sol2; } else tr.sol2ok = 0;
    tr.alvoT = S.travado ? (S === sol ? n.alvoId : S.alvo) : -1;
    // torre gira 25°/s (127/152 mm, 20°/s) ou 35°/s (76 mm) dentro do arco livre; cano −5°..+45°
    const fr = tr.frente > 0 ? 0 : Math.PI; let rel = ang(S.az - n.rumo); if (S.px != null && (S.d > 0 || S.livre || S.travado)) { /* fiscal nukefumaca (item 8 revisado): convergência sempre que há ponto de mira */ const pt = n.P.torres[i]; if (pt) { const c = Math.cos(n.rumo), sn = Math.sin(n.rumo); const tx = n.x - pt.z * sn, tz = n.z + pt.z * c; rel = ang(marcacao(tx, tz, S.qx != null ? S.qx : S.px, S.qz != null ? S.qz : S.pz) - n.rumo); /* v1.2.21 item 14c: converge no ponto de PONTARIA compensado pela velocidade do navio */ } } /* v1.2.2: torres CONVERGEM no ponto de impacto (salva agrupada) */ const dentro = Math.abs(ang(rel - fr)) <= tr.arco; if (!dentro) rel = ang(fr + Math.sign(ang(rel - fr)) * tr.arco);
    const emT = elMaxCal(A.cal); /* v1.2.21 item 14a: elevação máxima mecânica por calibre (tiro em arco) */ const elMin = (S.d != null && S.d < 3000) ? -0.262 : -0.087; /* fiscal nukefumaca (item 8 revisado Valter): depressão −15° perto (geometria alvo colado), −5° longe */ const vT = taxaTorre(A.cal), acT = vT * (A.cal >= 200 ? 1.2 : A.cal >= 100 ? 2.5 : 6); /* v1.2.15: giro com ACELERAÇÃO/DESACELERAÇÃO por calibre (pesada embala e freia devagar) */ { const er = ang(rel - tr.az), vd = clamp(Math.sign(er) * Math.sqrt(2 * acT * Math.abs(er)) * 0.95, -vT, vT); const dv = clamp(vd - (tr.vaz || 0), -acT * dt, acT * dt); tr.vaz = (tr.vaz || 0) + dv; const pa = tr.vaz * dt; tr.az += Math.abs(pa) > Math.abs(er) ? er : pa; if (Math.abs(er) < 1e-3 && Math.abs(tr.vaz) < acT * dt * 2) tr.vaz = 0; } tr.el += clamp(clamp(S.el, elMin, emT) - tr.el, -PARAM.torre.el * dt, PARAM.torre.el * dt);
    tr.erroAz = ang(rel - tr.az); tr.girando = Math.abs(tr.erroAz) > 0.035 || Math.abs(tr.el - clamp(S.el, elMin, emT)) > 0.02 ? 1 : 0; /* v1.2.1: HUD "girando" */
    if ((sim.tick + i * 3) % 10 === 0 && (n.papel === 'jogador' || tr.obstr)) tr.obstr = dentro && sim.torreObstruida(n, i) ? 1 : 0; /* v1.2.14: obstrução contínua (HUD) */
    if (tr.rec > 0) tr.rec -= dt; passoRecuo(tr, A.cal, dt); /* v1.2.21 item 14b: recuo mola-amortecedor (freio no recuo, recuperador amortecido no retorno) */
    const alinhado = dentro && Math.abs(ang(rel - tr.az)) < 0.02 && Math.abs(tr.el - S.el) < 0.01; tr.bloqueada = dentro ? 0 : 1;
    if (tr.pend > 0) { tr.pend -= dt; if (!dentro && Math.abs(ang(ang(sol.az - n.rumo) - fr)) > tr.arco + 0.05) tr.pend = 0; if (tr.pend <= 0) { tr.pend = 0; tr.pendT = 0; tr.pendH = 0; } } /* v1.2.21 item 11b: pendência expira sem deixar tiro tardio */ const quer = n.gatilho > 0 || tr.pend > 0 || (auto && S.travado && !S.bloq && n.trava >= 1 && (n.miraSobre || n.papel !== 'jogador' || n.controleIA)); /* v1.2.1: AUTO-FOGO só com a mira (manual) sobre o alvo travado e torre alinhada */ /* AUTO não desperdiça salva contra ilha */
    const apontado = tr.pendT && tr.pend > 0 && dentro && Math.abs(ang(rel - tr.az)) < 0.06 && Math.abs(tr.el - clamp(S.el, elMin, emT)) < 0.03; /* v1.2.21 item 11a: TOQUE dispara JÁ na direção atual do cano (a trava só refina) — antes exigia alinhamento fino de 0,02 rad e, com a mira em movimento, o tiro ficava pendente e saía depois 'sozinho' */
    if (quer && tr.rec <= 0 && (alinhado || apontado)) { if (sim.disparaCanhao(n, i, S)) { disparou++; tr.pend = 0; tr.pendT = 0; tr.pendH = 0; } }
  }
  if (disparou > 1) sim.evento({ t: 'salva', id: n.id, n: disparou });
  if (n.sec && n.sec.length) passoSec(sim, n, dt, n.gatilho > 0 || (auto && sol.travado && !sol.bloq && n.trava >= 1 && (n.miraSobre || n.papel !== 'jogador' || n.controleIA)), sol); /* v1.2.18 item 14d: 100 mm e canhões leves — mesma regra do AUTO-FOGO de canhões */
  /* v1.2.17 item 26: no navio do USUÁRIO o AUTO-FOGO vale só para os CANHÕES — mísseis, torpedos, foguetes e granadas NUNCA saem sozinhos (antes: salvas VLS e torpedos automáticos no alvo travado). Defesa automática (CIWS/SAM/laser/30 mm) segue em defesa.js; bots seguem com a SquadAI. */
}
