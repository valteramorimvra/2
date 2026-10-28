// Baseline A/B: atravessamentos avião/navio × terreno em 300 s (Node, sem WebGL).
import { criaSessao } from '../src/sim/session.js';
import { alturaTerreno, ORDEM_MAPAS } from '../src/sim/maps.js';
import { EST } from '../src/naval5v5/aereo.js';
import { SquadAI } from '../src/sim/ai.js';

const MAPAS = ['cordilheira', 'vulcanico', 'fiordes', 'lofoten', 'halong', 'arquipelago', 'estreito', 'guanabara'].filter((m) => ORDEM_MAPAS.includes(m));
const SEG = +(process.env.SEG || 300);

function roda(id, force = 1) {
  const S = criaSessao({ mapa: id, modo: 'frota', classe: 'chapada', seed: 29, portaAvioes: true });
  const s = S.sim; s.ameacas.ligadas = 0; s.revelaTudo = 1;
  const aiA = new SquadAI('azul'), aiV = new SquadAI('vermelho');
  for (const n of s.navios) {
    if (n.papel === 'jogador') n.controleIA = 1;
    if (n.helis) { n.esq = 1; for (const i of n.helis) { const h = s.helis[i]; if (h && h.estado !== EST.ABATIDO) h.auto = 1; } }
  }
  // ponto de terra mais alto perto do centro
  let bx = 0, bz = 0, bh = -1e9;
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2, r = 1800 + (k % 3) * 900;
    const x = Math.sin(a) * r, z = -Math.cos(a) * r;
    const h = alturaTerreno(s.T, x, z); if (h > bh) { bh = h; bx = x; bz = z; }
  }
  let hForce = null;
  for (const h of s.helis) if (h.usado && h.H && h.H.aviao) { hForce = h; break; }
  const nForce = s.navios.find((n) => n.papel !== 'jogador' && n.time === 'azul' && !n.C.porta) || s.navios[1];

  let atravAv = 0, atravNav = 0, maxPenAv = 0, maxPenNav = 0, abatesTerreno = 0;
  const N = SEG * 60;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) {
    if (force && i === 90 && hForce && bh > 40) {
      const rumo = Math.atan2(bx - 0, -(bz - 0));
      hForce.estado = EST.VOO; hForce.ativo = 1; hForce.ctrl = 'ia'; hForce.auto = 1; hForce.oculto = 0;
      hForce.x = bx - Math.sin(rumo) * 2200; hForce.z = bz + Math.cos(rumo) * 2200;
      hForce.y = Math.max(60, bh * 0.25); hForce.v = Math.min(200, hForce.H.vmax * 0.9);
      hForce.rumo = Math.atan2(bx - hForce.x, -(bz - hForce.z));
      hForce.vx = Math.sin(hForce.rumo) * hForce.v; hForce.vz = -Math.cos(hForce.rumo) * hForce.v; hForce.vy = -2;
      hForce.comb = 800; hForce.mun = 4; hForce.vida = hForce.H.vida; hForce.alt = 80;
      // força destino baixo sobre o pico
      hForce._forcePeak = { x: bx, z: bz, y: Math.max(30, bh * 0.15) };
    }
    if (force && i === 120 && nForce && bh > 5) {
      const rumo = Math.atan2(bx - nForce.x, -(bz - nForce.z));
      nForce.x = bx - Math.sin(rumo) * 600; nForce.z = bz + Math.cos(rumo) * 600;
      nForce.rumo = rumo; nForce.v = 14; nForce.telAlvo = 4; nForce.lemeCmd = 0;
    }
    // IA bots
    if (i % 15 === 0) {
      for (const c of [...aiA.pensa(s), ...aiV.pensa(s)]) s.aplica(c);
    }
    // força o caça a voar baixo para o pico (sobrescreve rumo da IA a cada passo depois de force)
    if (hForce && hForce._forcePeak && hForce.estado === EST.VOO) {
      const p = hForce._forcePeak;
      hForce.rumo = Math.atan2(p.x - hForce.x, -(p.z - hForce.z));
      // baixa altitude alvo para provocar atravessamento se só sobe reativo
      hForce.alt = p.y;
    }
    s.passo();
    if (i % 6 === 0) {
      for (const h of s.helis) {
        if (!h.ativo || h.estado < EST.DECOLA || h.estado > EST.RETORNO) continue;
        const ht = alturaTerreno(s.T, h.x, h.z);
        if (h.y + 1 < ht) { atravAv++; maxPenAv = Math.max(maxPenAv, ht - h.y); }
      }
      for (const u of s.uavs || []) {
        if (!u.ativo) continue;
        const ht = alturaTerreno(s.T, u.x, u.z);
        if (u.y + 1 < ht) { atravAv++; maxPenAv = Math.max(maxPenAv, ht - u.y); }
      }
      for (const q of s.nukes || []) {
        if (!q.ativo || q.fase < 2) continue;
        const ht = alturaTerreno(s.T, q.x, q.z);
        if (q.y + 1 < ht) { atravAv++; maxPenAv = Math.max(maxPenAv, ht - q.y); }
      }
      for (const n of s.navios) {
        if (n.morto) continue;
        const hx = Math.sin(n.rumo), hz = -Math.cos(n.rumo);
        let inland = 0, htMax = -1e9;
        for (const f of [-0.35, 0, 0.35]) {
          const ht = alturaTerreno(s.T, n.x + hx * n.C.L * f, n.z + hz * n.C.L * f);
          htMax = Math.max(htMax, ht);
          if (ht > 2) inland++;
        }
        // atravessamento: casco com ≥2 amostras em terra seca E ainda avançando
        if (inland >= 2 && Math.abs(n.v) > 1.0) { atravNav++; maxPenNav = Math.max(maxPenNav, htMax); }
      }
    }
  }
  const ms = performance.now() - t0;
  return { id, bh: +bh.toFixed(0), atravAv, atravNav, maxPenAv: +maxPenAv.toFixed(1), maxPenNav: +maxPenNav.toFixed(1), ms: +ms.toFixed(0), msPerTick: +(ms / N).toFixed(4) };
}

const out = [];
for (const id of MAPAS) {
  try { const r = roda(id, 1); out.push(r); console.log(JSON.stringify(r)); }
  catch (e) { console.log(JSON.stringify({ id, erro: String(e.stack || e) })); }
}
console.log(JSON.stringify({ totAv: out.reduce((a, r) => a + r.atravAv, 0), totNav: out.reduce((a, r) => a + r.atravNav, 0), mapas: out.length }));
