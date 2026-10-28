import { livre as livreLT } from '../sim/linhaTiro.js';
// Defesa em camadas (todos os navios, jogador e bots) + ameaças pequenas. Determinístico (sim.rng), pools estáticos.
// • CIWS: esfera de 1200 m, 4500 tiros/min, rajadas com pontaria automática contra mísseis, drones e torpedos de
//   superfície. Probabilidade de abate por unidade de tempo cresce com a proximidade e com o tempo de engajamento.
// • SAM (defesa de frota): células VLS dedicadas lançam interceptadores contra mísseis antinavio até 3 km, protegendo
//   o próprio navio e aliados a até 1500 m. Guiagem por navegação proporcional, espoleta de proximidade.
// • 30 mm: reparos secundários disparam sozinhos contra lanchas rápidas, torpedos e drones a até 1500 m.
// • Drones kamikaze (pequenos) e lanchas de ataque rápido: lançados periodicamente pelas duas frotas.
import { clamp, ang, marcacao } from '../sim/util.js';
import { PARAM } from '../armasParametros.js';
import { SAM, DRONE, LANCHA, TORPEDO } from '../sim/classes.js';
import { alturaMar } from '../sim/ocean.js';
import { alturaTerreno } from '../sim/maps.js';
import { derrubaAereo } from './aereo.js';
import { regAereoInterc } from './regAereo.js'; /* v1.2.30 item 15 */
import { resAr } from './resistAereo.js'; /* v1.2.30 item 15b */

export const CIWS = { alc: 1200, rpm: 4500, mun: 1550, recarga: 25, engaja: 0.6, taxaMissil: 0.2, /* v1.2.10: mísseis em arco chegam mais rápidos — defesa ainda reage */ /* v1.2.5: 0,5→0,11 — míssil travado só cai na defesa com chance limitada */ taxaDrone: 1.3, taxaTorp: 0.013, alcTorp: 700 };
export const A30 = { alc: 1500, danoLancha: 15, taxaTorp: 0.004, taxaDrone: 0.8, giro: 2.2 };
export const DEF = { samAlcMis: 1.7, /* v1.2.5: engaja míssil mais cedo (mísseis +35%) */ samPkMis: 0.15, /* v1.2.5: pk do SAM contra míssil (×0,72) e no máximo 1 SAM por míssil */ samCad: 1.1, samProtege: 1500, droneInt: 45, lanchaResp: 60 };
export const POOL5 = { sams: 48, drones: 24, lanchas: 8 }; /* v1.2.11: 8×8 */
const FASE_PITCH = 2, FASE_CRUZ = 3, FASE_TERM = 4;

function pool(n, f) { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = Object.assign({ ativo: 0, idx: i }, f()); return a; }
const livre = (a) => { for (let i = 0; i < a.length; i++) if (!a[i].ativo) return a[i]; return null; };
const _o = { x: 0, y: 0, z: 0 };

/** Prepara a simulação (pools e estado por navio). Chamado pelo construtor do Sim e em adicionaNavio. */
export function instalaDefesa(sim) {
  sim.sams = pool(POOL5.sams, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, dono: -1, time: '', alvo: -1, t: 0, fase: 0 }));
  sim.drones = pool(POOL5.drones, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, dono: -1, time: '', alvo: -1, t: 0, mergulho: 0 }));
  sim.lanchas = pool(POOL5.lanchas, () => ({ x: 0, z: 0, rumo: 0, v: 0, vida: 0, dono: -1, time: '', alvo: -1, t: 0, torp: 1, fogo: 0, tTorp: 0 }));
  sim.ameacas = { azul: { tDrone: 41, tLancha: 7, mortas: 0, tResp: 0 }, vermelho: { tDrone: 41, tLancha: 7, mortas: 0, tResp: 0 } /* v1.2.20: mesmos tempos para os dois lados (antes azul 38/6 × vermelho 44/8) */, ligadas: 1 };
}
export function instalaNavio(n) {
  n.sam = n.C.sam || 0; n.samUsadas = new Uint8Array(n.C.sam || 0); n.tSam = 0; n.samAuto = 1;
  n.a30 = n.P.a30.map(() => ({ az: 0, el: 0, tipo: '', alvo: -1, fogo: 0, t: 0, tx: 0, ty: 0, tz: 0 }));
  for (const c of n.ciws) { c.mun = CIWS.mun; c.tEng = 0; c.tipo = ''; c.tx = 0; c.ty = 0; c.tz = 0; }
  n.lasers = (n.P.laser || []).map(() => ({ on: 0, alvo: -1, tipo: '', t: 0, tc: 0, tx: 0, ty: 0, tz: 0 })); /* v1.2.11 */
  n.autoFogo = 0; n.tAutoMis = 0; n.tAutoTorp = 0; n.pivo = 0;
  for (const tr of n.torres) { tr.sol2 = { az: 0, el: 0, tv: 0, d: 0, px: 0, pz: 0, travado: 0, alvo: -1 }; tr.sol2ok = 0; tr.alvoT = -1; tr.bloqueada = 0; }
}

// ---------------- CIWS ----------------
/** v1.2.1 setor cego: montagem lateral não atira rasante para o bordo oposto; montagem de proa (popa) não atira rasante para ré (vante) atravessando a superestrutura. */
export function ciwsCego(pc, az, el) { const P = PARAM.ciws; if (el > P.elCego) return false; const s = Math.sin(az);
  if (Math.abs(pc.x) > 1.5) return Math.sign(s) !== Math.sign(pc.x) && Math.abs(s) > Math.sin(P.cego);
  return Math.abs(ang(az - (pc.z < 0 ? Math.PI : 0))) < P.cego; }
/** v1.2.17 item 25b: só MÍSSEIS e TORPEDOS (e aeronaves: drones, helicópteros, VANTs) podem ser interceptados. Tiros de canhão, granadas e foguetes (pool sim.granadas) NÃO têm sistema de defesa — nenhum CIWS/SAM/laser/A30 os procura; se acertarem, causam dano. */
export const INTERCEPTAVEIS = Object.freeze(['misseis', 'torpedos', 'drones', 'helis', 'uavs']);
export function passoCiws5(sim, n, dt) {
  if (n.morto) { for (const c of n.ciws) c.fogo = 0; return; }
  const alc = CIWS.alc;
  for (let j = 0; j < n.ciws.length; j++) { const c = n.ciws[j], pc = n.P.ciws[j]; sim.mundo(n, pc.x, pc.y, pc.z, _o); c.t += dt;
    if (c.mun <= 0) { c.fogo = 0; if (c.t > CIWS.recarga) { c.mun = CIWS.mun; c.t = 0; } continue; }
    let melhor = null, tipo = '', md = 1e9, score = 1e9;
    for (const m of sim.misseis) { if (!m.ativo || m.time === n.time || m.fase < FASE_PITCH || m.t < 0) continue; const d = Math.hypot(m.x - _o.x, m.y - _o.y, m.z - _o.z); if (d > alc * 1.6) continue;
      const aN = sim.navios[m.alvo]; const meu = m.alvo === n.id || (n.C.defesaFrota && aN && aN.time === n.time && Math.hypot(aN.x - n.x, aN.z - n.z) < n.C.defesaFrota); if (!meu && d > alc * 0.35) continue; /* v1.2.1: só ameaças reais */
      if (d < score) { score = d; md = d; melhor = m; tipo = 'm'; } }
    for (const q of sim.drones) { if (!q.ativo || q.time === n.time) continue; const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d > alc * 1.3) continue; const sc = d * 1.15; if (sc < score) { score = sc; md = d; melhor = q; tipo = 'd'; } }
    for (const tp of sim.torpedos) { if (!tp.ativo || tp.time === n.time) continue; const d = Math.hypot(tp.x - _o.x, tp.z - _o.z); if (d > CIWS.alcTorp) continue; const sc = d * 1.4; if (sc < score) { score = sc; md = d; melhor = tp; tipo = 't'; } }
    for (const q of sim.helis) { if (!q.ativo || q.time === n.time) continue; const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d > alc) continue; const sc = d * 1.25; if (sc < score) { score = sc; md = d; melhor = q; tipo = 'h'; } }
    for (const q of sim.uavs) { if (!q.ativo || q.time === n.time) continue; const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d > alc) continue; const sc = d * 1.5; if (sc < score) { score = sc; md = d; melhor = q; tipo = 'u'; } }
    if (!melhor) { c.alvo = -1; c.tipo = ''; c.fogo = 0; c.tEng = 0; c.az += clamp(ang(0 - c.az), -dt, dt); continue; }
    if (c.alvo !== melhor.idx || c.tipo !== tipo) c.tEng = 0; c.alvo = melhor.idx; c.tipo = tipo;
    const my = tipo === 't' ? -0.5 : melhor.y; c.tx = melhor.x; c.ty = my; c.tz = melhor.z;
    const azA = ang(Math.atan2(melhor.x - _o.x, -(melhor.z - _o.z)) - n.rumo), elA = Math.atan2(my - _o.y, Math.hypot(melhor.x - _o.x, melhor.z - _o.z));
    const taxa = PARAM.ciws.giro * dt; c.az += clamp(ang(azA - c.az), -taxa, taxa); c.el += clamp(elA - c.el, -taxa, taxa);
    const apontado = Math.abs(ang(azA - c.az)) < 0.05 && Math.abs(elA - c.el) < 0.06; const lim = tipo === 't' ? CIWS.alcTorp : alc;
    { const lv = livreLT(n, 'ciws', j, azA, elA); c.cego = lv < 0 ? ciwsCego(pc, azA, elA) : lv === 0; } /* v1.2.19 item 5: LINHA DE TIRO LIVRE pela máscara da estrutura real (fallback: setor cego antigo) */ c.fogo = apontado && md <= lim && !c.cego && ((c.tEng + j * 0.37) % 1.5) < 1.15 ? 1 : 0; if (apontado && md <= lim && !c.cego && !c.fogo) c.tEng += dt; /* v1.2.11: RAJADAS realistas (1,15 s de fogo / 0,35 s de pausa) */ /* v1.2.1: só dispara alinhado, ≤ 1,2 km e fora do setor cego */
    if (c.fogo) { c.mun -= (CIWS.rpm / 60) * dt; c.t = 0; c.tEng += dt; const eng = clamp(c.tEng / CIWS.engaja, 0.3, 1);
      const taxaAbate = probCiws(tipo, md, eng, melhor) * (n.mods.ciwsTaxa || 1) * 1.3 * ((tipo === 'h' || tipo === 'u') && n.C.antiAereo ? 1.5 : 1); /* ×1,3 compensa as pausas entre rajadas; antiaéreo dedicado ×1,5 contra aeronaves */
      if (sim.rng.next() < 1 - Math.exp(-taxaAbate * dt)) { abate(sim, n, tipo, melhor, 'ciws', j); c.tEng = 0; } } }
}
/** Taxa de abate (1/s) do CIWS por tipo de alvo, distância e tempo de engajamento (0..1). */
export function probCiws(tipo, d, eng, alvo) {
  if (tipo === 'm') return CIWS.taxaMissil * ((alvo && alvo.perfil && alvo.perfil.pkCiws) || 1) * ((alvo && alvo.pkMul) || 1) * resAr(alvo) * Math.max(0, 1.6 - d / CIWS.alc) * eng * (alvo && alvo.fase === FASE_TERM && alvo.tf < 2 ? 0.8 : 1);
  if (tipo === 'd') return CIWS.taxaDrone * Math.max(0, 1.6 - d / CIWS.alc) * eng;
  if (tipo === 'h') return (alvo && alvo.tFlare > 0 ? PARAM.heli.flareCiws : 1) * CIWS.taxaDrone * 0.8 * (22 / ((alvo && alvo.H && alvo.H.vida) || 30)) * Math.max(0, 1.6 - d / CIWS.alc) * eng;
  if (tipo === 'u') return CIWS.taxaDrone * 0.9 * Math.max(0, 1.6 - d / CIWS.alc) * eng;
  return CIWS.taxaTorp * Math.max(0, 1.4 - d / CIWS.alcTorp) * eng;
}
function abate(sim, n, tipo, alvo, arma, j) {
  if (tipo === 'h' || tipo === 'u') { derrubaAereo(sim, tipo, alvo, n); return; }
  alvo.ativo = 0; regAereoInterc(sim, n, tipo, alvo, arma); /* v1.2.30 item 15: arma de aeronave interceptada (CIWS/laser/30 mm) */
  if (tipo === 'm') { n.stats.intercept++; sim.evento({ t: 'missilAbatido', idx: alvo.idx, x: alvo.x, y: alvo.y, z: alvo.z, por: n.id, mount: j, arma }); }
  else if (tipo === 'd') { n.stats.menores = (n.stats.menores || 0) + 1; sim.evento({ t: 'droneAbatido', x: alvo.x, y: alvo.y, z: alvo.z, por: n.id, arma }); }
  else if (tipo === 't') { n.stats.intercept++; sim.evento({ t: 'torpAbatido', x: alvo.x, z: alvo.z, por: n.id, arma }); }
}

// ---------------- LASER (v1.2.11) ----------------
/** Laser de defesa aérea: feixe contínuo que precisa ficar sobre o alvo (tempo de permanência) para queimá-lo; depois recarrega (energia). Sem efeito sobre torpedos. */
export const LASER = { alc: 2600, perm: { m: 1.5, h: 2.0, d: 0.9, u: 1.0 }, pk: 0.82, recarga: 2.6 };
export function passoLaser(sim, n, dt) { if (!n.lasers || !n.lasers.length) return;
  for (let j = 0; j < n.lasers.length; j++) { const L = n.lasers[j], pl = n.P.laser[j]; if (n.morto) { L.on = 0; continue; } if (L.tc > 0) { L.tc -= dt; L.on = 0; continue; } sim.mundo(n, pl.x, pl.y, pl.z, _o);
    let alvo = null, tipo = '', md = LASER.alc;
    const ok = (q, tp) => { const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d < md) { md = d; alvo = q; tipo = tp; } };
    if (L.alvo >= 0) { const q = L.tipo === 'm' ? sim.misseis[L.alvo] : L.tipo === 'h' ? sim.helis[L.alvo] : L.tipo === 'd' ? sim.drones[L.alvo] : sim.uavs[L.alvo]; if (q && q.ativo && q.time !== n.time && Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z) < LASER.alc) { alvo = q; tipo = L.tipo; } }
    if (!alvo) { for (const m of sim.misseis) if (m.ativo && m.time !== n.time && m.t > 0 && m.fase >= FASE_PITCH) { const aN = sim.navios[m.alvo]; if (aN && aN.time === n.time) ok(m, 'm'); }
      for (const q of sim.helis) if (q.ativo && q.time !== n.time) ok(q, 'h'); for (const q of sim.drones) if (q.ativo && q.time !== n.time) ok(q, 'd'); for (const q of sim.uavs) if (q.ativo && q.time !== n.time) ok(q, 'u'); }
    if (!alvo) { L.on = 0; L.alvo = -1; L.t = 0; continue; }
    if (livreLT(n, 'laser', j, ang(Math.atan2(alvo.x - _o.x, -(alvo.z - _o.z)) - n.rumo), Math.atan2(alvo.y - _o.y, Math.hypot(alvo.x - _o.x, alvo.z - _o.z))) === 0) { L.on = 0; L.t = 0; continue; } /* v1.2.19 item 5: o feixe nunca atravessa a própria estrutura */
    if (L.alvo !== alvo.idx || L.tipo !== tipo) L.t = 0; L.alvo = alvo.idx; L.tipo = tipo; L.on = 1; L.t += dt; L.tx = alvo.x; L.ty = alvo.y; L.tz = alvo.z;
    if (L.t >= LASER.perm[tipo] * (tipo === 'h' && alvo.tFlare > 0 ? 1.3 : 1)) { L.t = 0; L.tc = LASER.recarga; L.on = 0; if (sim.rng.next() < LASER.pk * resAr(alvo)) abate(sim, n, tipo, alvo, 'laser', j); L.alvo = -1; } }
}
// ---------------- SAM ----------------
export function passoSam(sim, n, dt) {
  if (n.morto || !n.sam || !n.samAuto) return; if (n.tSam > 0) { n.tSam -= dt; return; }
  let melhor = null, md = 1e9;
  for (const m of sim.misseis) { if (!m.ativo || m.time === n.time || m.fase < FASE_CRUZ || m.t < 0 || m.samAlvo || m.samTent) continue;
    const d = Math.hypot(m.x - n.x, m.y, m.z - n.z); if (d > SAM.alc * DEF.samAlcMis) continue; const aN = sim.navios[m.alvo]; if (!aN) continue;
    const protege = m.alvo === n.id || (aN.time === n.time && !aN.morto && Math.hypot(aN.x - n.x, aN.z - n.z) < DEF.samProtege); if (!protege) continue;
    const dA = Math.hypot(aN.x - m.x, aN.z - m.z); if (dA < 350) continue; // perto demais do alvo: fica para o CIWS
    if (dA < md) { md = dA; melhor = m; } }
  if (!melhor) { // sem míssil: helicóptero inimigo dentro do alcance do SAM
    for (const h of sim.helis) { if (!h.ativo || h.time === n.time || h.samAlvo || h.estado < 3) continue; const d = Math.hypot(h.x - n.x, h.y, h.z - n.z); if (h.y < 45 && d > (n.C.antiAereo ? 3000 : 1800)) continue; /* rasante: fora do horizonte do radar de tiro */ if (d < SAM.alc && d < md) { md = d; melhor = h; } }
    if (melhor) { const s = lancaSam(sim, n, melhor); if (s) s.tipoAlvo = 'h'; n.tSam = DEF.samCad * 2; } return; }
  lancaSam(sim, n, melhor); n.tSam = DEF.samCad;
}
export function lancaSam(sim, n, m) {
  let cel = -1; for (let i = 0; i < n.samUsadas.length; i++) if (!n.samUsadas[i]) { cel = i; break; } if (cel < 0) return null;
  const s = livre(sim.sams); if (!s) return null; n.samUsadas[cel] = 1; n.sam--;
  const pc = n.P.sam[cel]; sim.mundo(n, pc.x, pc.y, pc.z, _o);
  s.ativo = 1; s.x = _o.x; s.y = _o.y; s.z = _o.z; s.vx = 0; s.vy = 45; s.vz = 0; s.dono = n.id; s.time = n.time; s.alvo = m.idx; s.t = 0; s.fase = 1; s.tipoAlvo = 'm'; m.samAlvo = s.idx + 1; if (m.perfil) m.samTent = (m.samTent || 0) + 1;
  sim.evento({ t: 'samLanc', id: n.id, cel: n.P.vls.length + cel, idx: s.idx, x: _o.x, y: _o.y, z: _o.z }); return s;
}
export function passoSams(sim, dt) {
  for (const s of sim.sams) { if (!s.ativo) continue; s.t += dt; const m = s.tipoAlvo === 'h' ? sim.helis[s.alvo] : sim.misseis[s.alvo];
    if (!m.ativo || s.t > 8) { s.ativo = 0; if (m.samAlvo === s.idx + 1) m.samAlvo = 0; sim.evento({ t: 'samFim', idx: s.idx, x: s.x, y: s.y, z: s.z }); continue; }
    let v = Math.hypot(s.vx, s.vy, s.vz); let ux = s.vx / v, uy = s.vy / v, uz = s.vz / v;
    if (s.fase === 1) { v = Math.min(v + 300 * dt, 140); if (s.t > 0.3) s.fase = 2; ux = 0; uy = 1; uz = 0; }
    else { v = Math.min(SAM.v, v + 450 * dt); /* v1.2.5: aceleração e manobra maiores (mísseis +35%) */ const rx = m.x - s.x, ry = m.y - s.y, rz = m.z - s.z, R = Math.hypot(rx, ry, rz) || 1;
      const fech = Math.max(200, v + (m.vx * -rx + m.vy * -ry + m.vz * -rz) / R); const tgo = Math.min(4, R / fech);
      let px = rx + m.vx * tgo, py = ry + m.vy * tgo, pz = rz + m.vz * tgo; const pl = Math.hypot(px, py, pz) || 1; px /= pl; py /= pl; pz /= pl;
      const maxG = 1100 / v * dt; /* v1.2.5: ~110 g de manobra */ const dot = clamp(ux * px + uy * py + uz * pz, -1, 1); const ang3 = Math.acos(dot); const f = ang3 > maxG ? maxG / ang3 : 1;
      ux += (px - ux) * f; uy += (py - uy) * f; uz += (pz - uz) * f; const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l; }
    const ox = s.x - m.x, oy = s.y - m.y, oz = s.z - m.z; // posição relativa antes do passo (o míssil já andou neste passo)
    s.vx = ux * v; s.vy = uy * v; s.vz = uz * v; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (s.fase === 2) { // espoleta de proximidade: menor distância no segmento do passo
      const nx = s.x - m.x, ny = s.y - m.y, nz = s.z - m.z; const dxs = nx - ox, dys = ny - oy, dzs = nz - oz; const L2 = dxs * dxs + dys * dys + dzs * dzs;
      const u = L2 > 0 ? clamp(-(ox * dxs + oy * dys + oz * dzs) / L2, 0, 1) : 1; const dmin = Math.hypot(ox + dxs * u, oy + dys * u, oz + dzs * u);
      if (dmin < SAM.espoleta) { const d = sim.navios[s.dono]; s.ativo = 0;
        if (s.tipoAlvo === 'h') { if (sim.rng.next() < SAM.pk * 1.1 * (m.tFlare > 0 ? PARAM.heli.flareSam : 1)) { m.samAlvo = 0; derrubaAereo(sim, 'h', m, d); sim.evento({ t: 'samAbate', idx: s.idx, x: m.x, y: m.y, z: m.z, por: d.id, heli: 1 }); } else { m.samAlvo = 0; sim.evento({ t: 'samFalha', idx: s.idx, x: s.x, y: s.y, z: s.z }); } continue; }
        if (sim.rng.next() < SAM.pk * DEF.samPkMis * ((m.perfil && m.perfil.pkSam) || 1) * (d.mods.samPk || 1) * (m.pkMul || 1) * resAr(m)) { m.ativo = 0; d.stats.intercept++; regAereoInterc(sim, d, 'm', m, 'sam'); /* v1.2.30 item 15 */ sim.evento({ t: 'samAbate', idx: s.idx, mIdx: m.idx, x: m.x, y: m.y, z: m.z, por: d.id }); }
        else { m.samAlvo = 0; sim.evento({ t: 'samFalha', idx: s.idx, x: s.x, y: s.y, z: s.z }); } continue; } }
    if (s.y < alturaMar(s.x, s.z, sim.t) - 1) { s.ativo = 0; if (m.samAlvo === s.idx + 1) m.samAlvo = 0; sim.evento({ t: 'samFim', idx: s.idx, x: s.x, y: 0, z: s.z }); } }
}

// ---------------- 30 mm ----------------
/** O reparo (lado ±1 = bordo; 0 = linha de centro, 360°) cobre o ponto? (usa _o = posição do reparo) */
function cobre(n, pm, x, z) { if (!pm.lado) return true; const rel = ang(marcacao(_o.x, _o.z, x, z) - n.rumo); return Math.abs(ang(rel - pm.lado * Math.PI / 2)) < 1.8; }
export function passoA30(sim, n, dt) {
  if (n.morto) { for (const a of n.a30) a.fogo = 0; return; }
  for (let j = 0; j < n.a30.length; j++) { const a = n.a30[j], pm = n.P.a30[j]; sim.mundo(n, pm.x, pm.y, pm.z, _o); a.t -= dt;
    if (a.t <= 0) { a.t = 0.25; a.alvo = -1; a.tipo = ''; let md = A30.alc, sc = 1e9;
      for (const l of sim.lanchas) { if (!l.ativo || l.time === n.time) continue; const d = Math.hypot(l.x - _o.x, l.z - _o.z); if (d < md && d < sc && cobre(n, pm, l.x, l.z)) { sc = d; a.alvo = l.idx; a.tipo = 'l'; } }
      for (const tp of sim.torpedos) { if (!tp.ativo || tp.time === n.time) continue; const d = Math.hypot(tp.x - _o.x, tp.z - _o.z); if (d < md && d * 1.1 < sc && cobre(n, pm, tp.x, tp.z)) { sc = d * 1.1; a.alvo = tp.idx; a.tipo = 't'; } }
      for (const q of sim.drones) { if (!q.ativo || q.time === n.time) continue; const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d < md && d * 1.3 < sc && cobre(n, pm, q.x, q.z)) { sc = d * 1.3; a.alvo = q.idx; a.tipo = 'd'; } }
      for (const q of sim.helis) { if (!q.ativo || q.time === n.time) continue; const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d < md && d * 1.2 < sc && cobre(n, pm, q.x, q.z)) { sc = d * 1.2; a.alvo = q.idx; a.tipo = 'h'; } }
      for (const q of sim.uavs) { if (!q.ativo || q.time === n.time) continue; const d = Math.hypot(q.x - _o.x, q.y - _o.y, q.z - _o.z); if (d < md && d * 1.4 < sc && cobre(n, pm, q.x, q.z)) { sc = d * 1.4; a.alvo = q.idx; a.tipo = 'u'; } } }
    const alvo = a.tipo === 'l' ? sim.lanchas[a.alvo] : a.tipo === 't' ? sim.torpedos[a.alvo] : a.tipo === 'd' ? sim.drones[a.alvo] : a.tipo === 'h' ? sim.helis[a.alvo] : a.tipo === 'u' ? sim.uavs[a.alvo] : null;
    if (!alvo || !alvo.ativo) { a.fogo = 0; continue; }
    const ty = a.tipo === 'd' || a.tipo === 'h' || a.tipo === 'u' ? alvo.y : a.tipo === 'l' ? 1.2 : -0.3; a.tx = alvo.x; a.ty = ty; a.tz = alvo.z; const d = Math.hypot(alvo.x - _o.x, ty - _o.y, alvo.z - _o.z);
    const azA = ang(marcacao(_o.x, _o.z, alvo.x, alvo.z) - n.rumo), elA = Math.atan2(ty - _o.y, Math.hypot(alvo.x - _o.x, alvo.z - _o.z));
    a.az += clamp(ang(azA - a.az), -A30.giro * dt, A30.giro * dt); a.el += clamp(elA - a.el, -A30.giro * dt, A30.giro * dt);
    a.fogo = Math.abs(ang(azA - a.az)) < 0.06 && d < A30.alc && livreLT(n, 'a30', j, azA, elA) !== 0 ? 1 : 0; /* v1.2.19 item 5 */ if (!a.fogo) continue; const fd = Math.max(0, 1.3 - d / A30.alc);
    if (a.tipo === 'l') { alvo.vida -= A30.danoLancha * fd * dt; if (alvo.vida <= 0) afundaLancha(sim, alvo, n); }
    else { const taxa = (a.tipo === 't' ? A30.taxaTorp : a.tipo === 'h' ? A30.taxaDrone * 0.45 * (22 / alvo.H.vida) : A30.taxaDrone) * fd; if (sim.rng.next() < 1 - Math.exp(-taxa * dt)) abate(sim, n, a.tipo, alvo, '30mm', j); } }
}
/** Probabilidade de abate acumulada do 30 mm em T segundos de fogo contínuo a d metros (para testes/HUD). */
export const pA30 = (tipo, d, T) => 1 - Math.exp(-(tipo === 't' ? A30.taxaTorp : A30.taxaDrone) * Math.max(0, 1.3 - d / A30.alc) * T);
function afundaLancha(sim, l, por) { l.ativo = 0; if (por) por.stats.menores = (por.stats.menores || 0) + 1; sim.ameacas[l.time].mortas++; sim.evento({ t: 'lanchaAfunda', idx: l.idx, x: l.x, z: l.z, time: l.time, por: por ? por.id : -1 }); }

// ---------------- drones e lanchas ----------------
function maeDoTime(sim, time) { let m = null; for (const n of sim.navios) { if (n.time !== time || n.morto) continue; if (!m || (n.tipo === 'capitania') || (n.tipo === 'cruzador' && m.tipo !== 'capitania')) m = n; } return m; }
function maisProximo(sim, time, x, z) { let b = null, bd = 1e12; for (const n of sim.navios) { if (n.morto || n.time === time) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; b = n; } } return b; }
export function passoAmeacas(sim, dt) {
  const A = sim.ameacas; if (!A) return; const frota = sim.navios.length > 4; const limD = frota ? 2 : 1, limL = frota ? 2 : 1;
  if (A.ligadas && !sim.fim) for (const time of ['azul', 'vermelho']) { const st = A[time]; st.tDrone -= dt; st.tLancha -= dt; const mae = maeDoTime(sim, time); if (!mae) continue;
    if (st.tDrone <= 0) { st.tDrone = DEF.droneInt + sim.rng.next() * 10; let vivos = 0; for (const q of sim.drones) if (q.ativo && q.time === time) vivos++;
      const alvo = maisProximo(sim, time, mae.x, mae.z); if (vivos < limD && alvo && Math.hypot(alvo.x - mae.x, alvo.z - mae.z) < 9000) { const q = livre(sim.drones); if (q) {
        sim.mundo(mae, 0, mae.C.F + 6, mae.C.L * 0.3, _o); Object.assign(q, { ativo: 1, x: _o.x, y: _o.y, z: _o.z, vx: Math.sin(mae.rumo) * 30, vy: 12, vz: -Math.cos(mae.rumo) * 30, dono: mae.id, time, alvo: alvo.id, t: 0, mergulho: 0 });
        sim.evento({ t: 'droneLanc', idx: q.idx, id: mae.id, x: _o.x, y: _o.y, z: _o.z }); } } }
    if (st.tLancha <= 0) { st.tLancha = DEF.lanchaResp; let vivas = 0; for (const l of sim.lanchas) if (l.ativo && l.time === time) vivas++;
      if (vivas < limL) { const l = livre(sim.lanchas); if (l) { const lado = sim.rng.next() < 0.5 ? -1 : 1; let x = mae.x + Math.cos(mae.rumo) * lado * 260, z = mae.z + Math.sin(mae.rumo) * lado * 260;
        if (alturaTerreno(sim.T, x, z) > -3) { x = mae.x - Math.sin(mae.rumo) * (mae.C.L * 0.5 + 80); z = mae.z + Math.cos(mae.rumo) * (mae.C.L * 0.5 + 80); }
        if (alturaTerreno(sim.T, x, z) <= -3) { Object.assign(l, { ativo: 1, x, z, rumo: mae.rumo, v: 8, vida: LANCHA.vida, dono: mae.id, time, alvo: -1, t: 0, torp: 1, fogo: 0, tTorp: 0, orbita: lado });
          sim.evento({ t: 'lanchaLanc', idx: l.idx, x, z, time }); } } } } }
  // drones
  for (const q of sim.drones) { if (!q.ativo) continue; q.t += dt; let a = sim.navios[q.alvo]; if (!a || a.morto) { a = maisProximo(sim, q.time, q.x, q.z); if (!a) { q.ativo = 0; continue; } q.alvo = a.id; }
    const dx = a.x - q.x, dz = a.z - q.z, dh = Math.hypot(dx, dz); const v = DRONE.v; let ty;
    if (!q.mergulho && dh < 650) { q.mergulho = 1; sim.evento({ t: 'droneMergulho', idx: q.idx, alvo: a.id }); }
    ty = q.mergulho ? a.arfagem + a.C.F + 2 : DRONE.alt; const dy = ty - q.y; const L = Math.hypot(dx, dy * (q.mergulho ? 1 : 3), dz) || 1;
    const tx = dx / L * v, tyv = q.mergulho ? dy / L * v : clamp(dy * 0.6, -12, 12), tz = dz / L * v; const k = Math.min(1, dt * (q.mergulho ? 2.5 : 1.2));
    q.vx += (tx - q.vx) * k; q.vy += (tyv - q.vy) * k; q.vz += (tz - q.vz) * k; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    const hit = sim.acertaNavio(q.x, q.y, q.z, -1); if (hit && hit.n.time !== q.time) { q.ativo = 0; const d = sim.navios[q.dono]; const ap = sim.dano(hit.n, DRONE.dano, d, 'drone'); sim.evento({ t: 'impacto', x: q.x, y: q.y, z: q.z, alvo: hit.n.id, dono: q.dono, tipo: 'drone', cal: 60, dano: Math.max(1, Math.round(ap || DRONE.dano)) }); continue; }
    if (q.y < alturaMar(q.x, q.z, sim.t) || q.t > 150) { q.ativo = 0; sim.evento({ t: 'agua', x: q.x, y: 0, z: q.z, cal: 40, dono: q.dono }); } }
  // lanchas de ataque rápido
  for (const l of sim.lanchas) { if (!l.ativo) continue; l.t += dt; if (l.tTorp > 0) l.tTorp -= dt; let a = sim.navios[l.alvo];
    if (!a || a.morto || l.t % 5 < dt) { a = maisProximo(sim, l.time, l.x, l.z); l.alvo = a ? a.id : -1; } if (!a) { l.fogo = 0; continue; }
    const d = Math.hypot(a.x - l.x, a.z - l.z), b = marcacao(l.x, l.z, a.x, a.z); let rAlvo = d > 1050 ? b : ang(b + (l.orbita || 1) * 1.35); const vAlvo = d > 1050 ? LANCHA.v : LANCHA.v * 0.75;
    const px = l.x + Math.sin(l.rumo) * 90, pz = l.z - Math.cos(l.rumo) * 90; if (alturaTerreno(sim.T, px, pz) > -2.5) rAlvo = ang(l.rumo + 1.2);
    l.rumo = ang(l.rumo + clamp(ang(rAlvo - l.rumo), -0.5 * dt, 0.5 * dt)); l.v += clamp(vAlvo - l.v, -3 * dt, 2.5 * dt);
    l.x += Math.sin(l.rumo) * l.v * dt; l.z -= Math.cos(l.rumo) * l.v * dt; const lim = sim.T.tam * 0.47; l.x = clamp(l.x, -lim, lim); l.z = clamp(l.z, -lim, lim);
    l.fogo = d < LANCHA.alcCanhao ? 1 : 0; if (l.fogo) sim.dano(a, LANCHA.danoS * dt, sim.navios[l.dono], 'lancha', true);
    if (l.torp > 0 && l.tTorp <= 0 && d < LANCHA.alcTorp && d > 800) { l.tTorp = 4; if (sim.rng.next() < 0.5) { const tp = livre(sim.torpedos); if (tp) { l.torp--;
      Object.assign(tp, { lancha: 1, leve: 0, danoMul: 0.5, alcMax: 0, ativo: 1, x: l.x, z: l.z, rumo: l.rumo, rumoAlvo: b, v: 10, dono: l.dono, time: l.time, alvo: a.id, corrida: 0, modo: 'acustico', t: 0, buscando: 0 });
      sim.evento({ t: 'torpLanc', id: l.dono, x: l.x, z: l.z, idx: tp.idx, lancha: l.idx }); } } } }
}
/** Granada caindo na água perto de uma lancha: dano por estilhaço/impacto (raio 14 m). */
export function granadaNaAgua(sim, g) {
  for (const l of sim.lanchas) { if (!l.ativo || l.time === g.time) continue; const d = Math.hypot(l.x - g.x, l.z - g.z); if (d > 14) continue;
    l.vida -= g.dano * (d < 5 ? 3 : 1.4); if (l.vida <= 0) afundaLancha(sim, l, sim.navios[g.dono]); }
}
