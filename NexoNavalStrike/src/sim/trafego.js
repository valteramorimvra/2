// Nexo Naval Strike v1.2.46 — TRÁFEGO CIVIL VIVO: porta-contêineres, petroleiros, graneleiros e rebocadores navegando no mapa.
// Alguns ENTRAM NO PORTO (escoltados por rebocadores), atracam, esperam e saem; outros só cruzam a área. Tudo é DESTRUTÍVEL:
// tiros de canhão abrem rombos, incendeiam e afundam; a onda de choque da bomba atômica EMPURRA, aderna e destrói.
// Determinístico (Rng próprio a partir da semente da partida). Não entra no hash nem na vitória.
import { alturaTerreno, distTerra } from './maps.js';
import { Rng, clamp, ang } from './util.js';

/* fichas (dimensões reais aproximadas; vida em "pontos de casco" da partida) */
export const TIPOS_CIVIS = {
  conteineiro: { nome: 'Porta-contêineres', L: 210, B: 32, F: 14, T: 11, v: 7.2, vida: 900, giro: 0.035 },
  petroleiro: { nome: 'Petroleiro', L: 240, B: 42, F: 9, T: 14, v: 6.4, vida: 1100, giro: 0.03, inflamavel: 1 },
  graneleiro: { nome: 'Graneleiro', L: 190, B: 32, F: 10, T: 11, v: 6.8, vida: 850, giro: 0.035 },
  rebocador: { nome: 'Rebocador', L: 32, B: 12, F: 4, T: 5, v: 6.0, vida: 140, giro: 0.22 },
};
/* empresas FICTÍCIAS (cores inspiradas em armadores reais, nomes originais do jogo) */
export const LIBRES = [
  { id: 'atlantica', nome: 'ATLÂNTICA LINE', casco: '#4aa3d8', faixa: '#ffffff', sup: '#f4f6f7', fundo: '#7a1f1a' },
  { id: 'bravamar', nome: 'BRAVAMAR', casco: '#14396b', faixa: '#f08a1c', sup: '#f2f2ee', fundo: '#7a1f1a' },
  { id: 'oceanica', nome: 'OCEÂNICA OFFSHORE', casco: '#1f6fb5', faixa: '#ffffff', sup: '#eef1f3', fundo: '#8a2a1c' },
  { id: 'cruzeirosul', nome: 'CRUZEIRO DO SUL', casco: '#8e1b1b', faixa: '#f4c430', sup: '#f2f2ee', fundo: '#2a2a2a' },
  { id: 'verdemar', nome: 'VERDEMAR', casco: '#1e6b4a', faixa: '#ffffff', sup: '#f2f2ee', fundo: '#7a1f1a' },
  { id: 'carbono', nome: 'NORTE CARGO', casco: '#2b2f35', faixa: '#e2b93b', sup: '#f2f2ee', fundo: '#7a1f1a' },
];
const NOMES = ['Maré Alta', 'Rio Tapajós', 'Ilha Bela', 'Baía Azul', 'Costa Verde', 'Atlântico Sul', 'Ponta Negra', 'Serra Dourada', 'Cabo Frio', 'Recife', 'Belém', 'Itajaí', 'Marajó', 'Abrolhos', 'Paranaguá', 'Suape'];
const agua = (T, x, z, prof = 10) => alturaTerreno(T, x, z) < -prof;

/** Ponto de água funda perto da costa (o "porto"), o mais perto possível do centro da zona de terra mais próxima do mapa. */
function achaPorto(T, R) { const lim = T.tam * 0.42; let melhor = null;
  for (let k = 0; k < 2400; k++) { const x = (R.next() - 0.5) * 2 * lim, z = (R.next() - 0.5) * 2 * lim; if (!agua(T, x, z, 12)) continue; const d = distTerra(T, x, z); if (d < 120 || d > 600) continue; const s = Math.hypot(x, z) * 0.3 + d; if (!melhor || s < melhor.s) melhor = { x, z, s }; }
  return melhor; }
function pontoBorda(T, R) { const lim = T.tam * 0.47; for (let k = 0; k < 200; k++) { const a = R.next() * Math.PI * 2, x = Math.cos(a) * lim, z = Math.sin(a) * lim; if (agua(T, x, z, 15)) return { x: clamp(x, -lim, lim), z: clamp(z, -lim, lim) }; } return { x: lim * 0.9, z: 0 }; }

export function criaTrafego(sim, seed = 1) { const T = sim.T, R = new Rng((seed * 7919 + 101) >>> 0); const tr = { R, civis: [], porto: achaPorto(T, R), t: 0, eventos: 0 };
  const nM = T.tam > 13000 ? 7 : 6; let id = 0;
  const novo = (tipo, x, z, rumo, extra = {}) => { const F = TIPOS_CIVIS[tipo]; const lb = LIBRES[Math.floor(R.next() * LIBRES.length)]; const c = Object.assign({ id: id++, tipo, F, libre: tipo === 'rebocador' ? (R.next() < 0.5 ? LIBRES[2] : LIBRES[1]) : lb, nome: NOMES[Math.floor(R.next() * NOMES.length)], x, z, rumo, v: F.v * 0.6, vida: F.vida, fogo: 0, afunda: 0, adorno: 0, adV: 0, morto: 0, tMorto: 0, rota: null, i: 0, espera: 0, empurrao: { x: 0, z: 0 }, escolta: -1 }, extra); tr.civis.push(c); return c; };
  for (let k = 0; k < nM; k++) { const tipo = ['conteineiro', 'petroleiro', 'graneleiro', 'conteineiro'][k % 4]; const a = pontoBorda(T, R), b = pontoBorda(T, R); const vaiPorto = tr.porto && k % 2 === 0;
    const rota = vaiPorto ? [a, tr.porto, a] : [a, b]; const f = 0.15 + R.next() * 0.6; const x = a.x + ((vaiPorto ? tr.porto.x : b.x) - a.x) * f, z = a.z + ((vaiPorto ? tr.porto.z : b.z) - a.z) * f;
    if (!agua(T, x, z, 12)) { novo(tipo, a.x, a.z, 0, { rota, i: 1, porto: vaiPorto }); } else novo(tipo, x, z, 0, { rota, i: 1, porto: vaiPorto }); }
  /* rebocadores: um por navio que vai ao porto + 2 parados no porto */ for (const c of tr.civis.slice()) if (c.porto) { const r = novo('rebocador', c.x + 140, c.z + 60, 0, { escolta: c.id }); r.lado = R.next() < 0.5 ? -1 : 1; }
  if (tr.porto) for (let k = 0; k < 2; k++) novo('rebocador', tr.porto.x + (k ? 160 : -160), tr.porto.z + (k ? 90 : -40), R.next() * 6.28, { rota: [{ x: tr.porto.x + (k ? 200 : -200), z: tr.porto.z + (k ? 120 : -80) }], i: 0, ronda: 1 });
  for (const c of tr.civis) { const p = c.rota ? c.rota[c.i] : null; if (p) c.rumo = Math.atan2(p.x - c.x, -(p.z - c.z)); }
  return tr; }

/** Rumo que evita terra: testa o rumo desejado e desvios crescentes para os dois lados. */
function rumoLivre(T, c, desej) { const L = c.F.L * 0.5 + 250; for (const d of [0, 0.3, -0.3, 0.6, -0.6, 0.95, -0.95, 1.4, -1.4]) { const r = desej + d; if (agua(T, c.x + Math.sin(r) * L, c.z - Math.cos(r) * L, c.F.T + 2) && agua(T, c.x + Math.sin(r) * L * 0.5, c.z - Math.cos(r) * L * 0.5, c.F.T + 2)) return r; } return desej + Math.PI * 0.5; }

export function passoTrafego(sim, dt) { const tr = sim.trafego; if (!tr) return; tr.t += dt; const T = sim.T;
  for (const c of tr.civis) {
    if (c.morto) { c.tMorto += dt; if (c.tMorto > 240 && c.tipo !== 'rebocador') renasce(sim, tr, c); continue; }
    /* avarias: incêndio queima o casco devagar; casco no zero → afunda (40 s) */
    if (c.fogo > 0) { c.fogo = Math.max(0, c.fogo - dt); c.vida -= dt * (c.F.inflamavel ? 6 : 3); }
    if (c.vida <= 0 && !c.afundando) { c.afundando = 1; c.vida = 0; sim.evento({ t: 'civAfunda', id: c.id, x: c.x, z: c.z, tipo: c.tipo }); }
    if (c.afundando) { c.afunda = Math.min(1, c.afunda + dt / 40); c.v *= 1 - dt * 0.3; c.adorno += (0.32 * (c.id % 2 ? 1 : -1) - c.adorno) * dt * 0.08; if (c.afunda >= 1) { c.morto = 1; c.tMorto = 0; } }
    /* empurrão (onda de choque) decai */ c.x += c.empurrao.x * dt; c.z += c.empurrao.z * dt; const k = Math.exp(-dt * 0.35); c.empurrao.x *= k; c.empurrao.z *= k;
    c.adV += (-c.adorno * 0.9 - c.adV * 0.5) * dt; if (!c.afundando) c.adorno += c.adV * dt;
    if (c.afundando) { c.x += Math.sin(c.rumo) * c.v * dt; c.z -= Math.cos(c.rumo) * c.v * dt; continue; }
    /* navegação */ let alvo = null, vAlvo = c.F.v;
    if (c.escolta >= 0) { const m = tr.civis[c.escolta]; if (!m || m.morto || m.afundando) { c.escolta = -1; c.rota = tr.porto ? [tr.porto] : null; c.i = 0; c.ronda = 1; } else { const px = Math.cos(m.rumo), pz = Math.sin(m.rumo); alvo = { x: m.x + px * c.lado * (m.F.B * 0.5 + 25) - Math.sin(m.rumo) * m.F.L * 0.15, z: m.z + pz * c.lado * (m.F.B * 0.5 + 25) + Math.cos(m.rumo) * m.F.L * 0.15 }; vAlvo = Math.min(c.F.v * 1.3, m.v + Math.hypot(alvo.x - c.x, alvo.z - c.z) * 0.02); } }
    else if (c.rota) { const p = c.rota[c.i]; const d = Math.hypot(p.x - c.x, p.z - c.z); alvo = p;
      if (c.ronda) { if (d < 160) { c.espera -= dt; vAlvo = 0.6; if (c.espera <= 0) { c.espera = 20 + tr.R.next() * 30; c.alvoR = { x: p.x + (tr.R.next() - 0.5) * 300, z: p.z + (tr.R.next() - 0.5) * 300 }; } alvo = c.alvoR || p; } }
      else if (c.porto && c.i === 1 && d < 600) { vAlvo = Math.max(0.4, c.F.v * d / 600); if (d < 150) { c.espera += dt; vAlvo = 0; if (c.espera > 90) { c.i++; c.espera = 0; } } }
      else if (d < 260) { c.i++; if (c.i >= c.rota.length) { renasce(sim, tr, c); continue; } } }
    if (alvo) { const des = Math.atan2(alvo.x - c.x, -(alvo.z - c.z)); const r = rumoLivre(T, c, des); c.rumo += clamp(ang(r - c.rumo), -c.F.giro * dt, c.F.giro * dt); }
    c.v += clamp(vAlvo - c.v, -0.08 * dt * 10, 0.05 * dt * 10) * (c.tipo === 'rebocador' ? 3 : 1);
    const nx = c.x + Math.sin(c.rumo) * c.v * dt, nz = c.z - Math.cos(c.rumo) * c.v * dt; if (agua(T, nx, nz, c.F.T * 0.5)) { c.x = nx; c.z = nz; } else c.v *= 0.5;
    /* não atravessa navios de guerra: desvia se muito perto */ for (const n of sim.navios) { if (n.morto) continue; const dx = c.x - n.x, dz = c.z - n.z, d = Math.hypot(dx, dz), m = (c.F.L + n.C.L) * 0.42; if (d < m && d > 1) { const f = (m - d) * 0.5 * dt; c.x += dx / d * f; c.z += dz / d * f; } }
  } }
function renasce(sim, tr, c) { const R = tr.R, a = pontoBorda(sim.T, R), b = pontoBorda(sim.T, R); Object.assign(c, { x: a.x, z: a.z, vida: c.F.vida, fogo: 0, afunda: 0, afundando: 0, adorno: 0, adV: 0, morto: 0, tMorto: 0, espera: 0, i: 1, v: c.F.v * 0.5, empurrao: { x: 0, z: 0 } });
  c.rota = c.porto && tr.porto ? [a, tr.porto, a] : [a, b]; const p = c.rota[1]; c.rumo = Math.atan2(p.x - c.x, -(p.z - c.z)); }

/** Projétil no ponto (x,y,z) acerta algum civil? (caixa orientada do casco + superestrutura) */
export function acertaCivil(sim, x, y, z) { const tr = sim.trafego; if (!tr) return null;
  for (const c of tr.civis) { if (c.morto) continue; const F = c.F, yTopo = F.F * (1 - c.afunda) + 6; if (y > yTopo || y < -F.T) continue; const dx = x - c.x, dz = z - c.z, s = Math.sin(c.rumo), co = Math.cos(c.rumo); const lz = -(dx * s - dz * co), lx = dx * co + dz * s; if (Math.abs(lz) < F.L / 2 && Math.abs(lx) < F.B / 2) return c; }
  return null; }
export function danoCivil(sim, c, dano, x, z, fogo = 0.25) { if (c.morto || c.afundando) return; c.vida -= dano; if (sim.rng.next() < fogo) c.fogo = Math.max(c.fogo, 25 + dano * 0.5); c.adV += (sim.rng.next() - 0.5) * 0.02; sim.evento({ t: 'civAcerto', id: c.id, x, z, dano }); }
/** Onda de choque nuclear: empurra para longe (até ~40 m/s), aderna, incendeia e destrói conforme a distância. */
export function choqueCivis(sim, x, z) { const tr = sim.trafego; if (!tr) return; for (const c of tr.civis) { if (c.morto) continue; const dx = c.x - x, dz = c.z - z, d = Math.max(1, Math.hypot(dx, dz)); if (d > 9000) continue; const f = clamp(1 - d / 9000, 0, 1) ** 1.6;
  c.empurrao.x += dx / d * 42 * f; c.empurrao.z += dz / d * 42 * f; c.adV += (dx * Math.cos(c.rumo) + dz * Math.sin(c.rumo) > 0 ? 1 : -1) * 0.5 * f; if (d < 3500) { c.vida -= c.F.vida * (d < 1600 ? 1.1 : 0.6) * f * 1.4; c.fogo = Math.max(c.fogo, 60); } } }
