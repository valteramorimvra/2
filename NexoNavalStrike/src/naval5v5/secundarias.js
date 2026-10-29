import { livre } from '../sim/linhaTiro.js';
// v1.2.18 item 14d: ARTILHARIA SECUNDÁRIA AUTOMÁTICA dos cruzeiros pesados novos (canhão automático de 100 mm e
// canhões leves de borda 30 mm / 12,7 mm). Cada reparo tem calibre, V0, cadência, dispersão e alcance próprios e
// dispara GRANADAS REAIS no mesmo pool/motor de balística do canhão principal (arrasto por calibre, gravidade,
// avanço sobre o alvo, guinada do alvo, dispersão por calibre/estado do navio). Regra da 1.2.17: no navio do
// usuário entram no AUTO-FOGO de canhões (mesma condição das torres principais); bots atiram no alvo travado.
// Sem alocação por passo: estado pré-criado em instalaSec e solução gravada em objetos reutilizados.
import { clamp, ang, marcacao } from '../sim/util.js';
import { arrastoCal, solucaoArrasto } from './balistica.js';
import { PARAM, recargaMinCal } from '../armasParametros.js';

const _o = { x: 0, y: 0, z: 0 };
/** Secundárias usam só a METADE ALTA do pool de granadas de canhão [150, 224): as torres principais procuram a partir do 0 e nunca ficam sem granada por causa delas. */
function slotSec(sim) { const G = sim.granadas; for (let i = 150; i < 224 && i < G.length; i++) if (!G[i].ativo) return G[i]; return null; }
/** Estado por reparo (chamado na criação do navio). */
export function instalaSec(n) { const M = (n.P && n.P.sec) || []; n.sec = M.map((m) => ({ az: m.centro || 0, el: 0, rec: 0.3 + (m.i || 0) * 0.17, fogo: 0, sol: { az: 0, el: 0, tv: 0, d: 0, px: 0, pz: 0 }, k: arrastoCal(m.cal), rajada: 0 })); }

/** Passo das secundárias (após as torres principais). quer = mesma condição de disparo das torres (gatilho manual ou AUTO-FOGO). */
export function passoSec(sim, n, dt, quer, sol) {
  const M = n.P.sec; if (!M || !M.length || n.morto) return; const al = sol && sol.travado && !sol.livre && n.alvoId >= 0 ? sim.navios[n.alvoId] : null;
  const PDs = PARAM.dispersao, disp0 = sim.fatorDisp(n), bot = n.papel !== 'jogador' || n.controleIA ? PDs.bot : 1;
  for (let j = 0; j < M.length; j++) { const m = M[j], st = n.sec[j], A = m.arma; st.fogo = 0; if (st.rec > 0) st.rec -= dt;
    let alvoOk = 0; if (al && !al.morto && quer) { sim.mundo(n, m.x, m.y + 1, m.z, _o); const h0 = Math.max(1.5, _o.y), vx = Math.sin(al.rumo) * al.v, vz = -Math.cos(al.rumo) * al.v;
      const s = solucaoArrasto(_o.x, _o.z, Math.max(0.5, h0 - al.C.F * 0.7), A.V0, st.k, al.x, al.z, vx, vz, st.sol, al.w || 0);
      if (s && s.d <= A.alc) { const rel = ang(s.az - n.rumo); if (Math.abs(ang(rel - m.centro)) <= m.meio) alvoOk = 1; } }
    const alvoRel = alvoOk ? ang(st.sol.az - n.rumo) : m.centro, alvoEl = alvoOk ? clamp(st.sol.el, -0.1, 1.2) : 0;
    const vg = A.giro * dt; const er = ang(alvoRel - st.az); st.az += clamp(er, -vg, vg); st.el += clamp(alvoEl - st.el, -A.giro * 0.7 * dt, A.giro * 0.7 * dt); /* reparo gira/eleva com taxa própria (leve: rápido) */
    if (!alvoOk || st.rec > 0 || Math.abs(ang(alvoRel - st.az)) > 0.03 || Math.abs(alvoEl - st.el) > 0.02) continue;
    if (livre(n, 'sec', j, st.az, st.el) === 0) continue; /* v1.2.19 item 5: secundária só dispara com a linha de tiro livre da própria estrutura */
    const g = slotSec(sim); if (!g) continue;
    const fCal = A.cal >= 100 ? PDs.calM : PDs.calP, fDist = 1 + PDs.distK * Math.min(1.5, st.sol.d / 10000);
    const az = n.rumo + st.az + sim.rng.gauss() * PDs.az * A.disp * disp0 * bot * fCal; const el = st.el * (1 + sim.rng.gauss() * PDs.alc * A.disp * disp0 * bot * fCal * fDist * 0.5);
    const ce = Math.cos(el), o = sim.mundoInc(n, m.x + Math.sin(st.az) * m.lc, m.y + 0.9 + Math.sin(st.el) * m.lc, m.z - Math.cos(st.az) * m.lc, sim._o);
    const ux = Math.sin(az) * ce, uy = Math.sin(el), uz = -Math.cos(az) * ce; if (sim.bocaObstruida(o, ux * A.V0, uy * A.V0, uz * A.V0)) { st.rec = 0.4; continue; }
    g.agua = 0; g.ativo = 1; g.x = o.x; g.y = o.y; g.z = o.z; g.vx = ux * A.V0; g.vy = uy * A.V0; g.vz = uz * A.V0; g.dono = n.id; g.time = n.time; g.dano = A.dano * 0.65 * (n.mods.dano || 1); g.cal = A.cal; g.t = 0; g.k = st.k; g.fogo = A.cal >= 100 ? 0.12 : 0.03; g.ap = 0; g.rbu = 0; g.foguete = 0; g.arcR = 0; g.fim = null; g.livre = 0; g.tracante = 1;
    st.rec = Math.max(A.cad, recargaMinCal(A.cal || 0)) /* v1.2.21 item 11c */ * (n.avaria.canhao < 0.3 ? 2 : 1) * (0.92 + sim.rng.next() * 0.16); st.fogo = 1; n.stats.tiros++;
    sim.evento({ t: 'tiro', id: n.id, torre: -1 - j, sec: 1, cano: 0, canos: 1, x: o.x, y: o.y, z: o.z, cal: A.cal, az, el, gi: -1 }); }
}
