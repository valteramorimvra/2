// Mapas: grade de alturas (m; negativo = profundidade). 4 arenas procedurais com semente fixa + 2 arenas de geografia
// real aproximada. Também planeja automaticamente spawns opostos a 8–12 km (v1.2.2) e a zona marítima central disputada.
import { clamp, Rng } from './util.js';
import { ARENAS_REAIS } from './arenasReais.js';
import { PARAM } from '../armasParametros.js';
import { MAPAS_NOVOS, ORDEM_NOVOS, geraNovo } from './mapasNovos.js'; /* v1.2.25 item 10 */
import { planejaCantos } from './spawnCantos.js'; /* v1.2.25 item 13 */

export const MAPAS = {
  arquipelago: { nome: 'Arquipélago Esmeralda', desc: 'Ilhas tropicais com morros verdes; canais estreitos servem de cobertura.', tipo: 'proc', seed: 11, km: 12, clima: 'tropical', hora: 'dia', tempo: 'limpo', bf: 3, dirCantos: [15] /* v1.2.25 item 9: B3×F5 — medido bot×bot: C5×E2 26×4 (28×2 trocado), D2×F5 10×22, C6×E2 2×14, B3×F5 9×7 */ },
  estreito: { nome: 'Estreito do Farol', desc: 'Duas costas altas e um estreito de 3 km: combate de canal, sem para onde fugir.', tipo: 'proc', seed: 23, km: 12, clima: 'temperado', hora: 'entardecer', tempo: 'limpo', bf: 3 },
  atois: { nome: 'Atóis do Sul', desc: 'Mar aberto com atóis baixos: alcance máximo dos mísseis e do radar.', tipo: 'proc', seed: 37, km: 12, clima: 'tropical', hora: 'dia', tempo: 'nublado', bf: 4 },
  fiordes: { dirCantos: [3], ladoSorteio: 1, /* v1.2.25 item 9: eixo/sorteio pela medição bot×bot (PROGRESSO) */ nome: 'Fiordes do Norte', desc: 'Ilhas rochosas altas e mar frio; o relevo bloqueia o radar.', tipo: 'proc', seed: 53, km: 12, clima: 'frio', hora: 'dia', tempo: 'chuva', bf: 4 },
  cordilheira: { nome: 'Costa da Cordilheira', desc: 'Costa continental com serras de até 900 m, enseadas, praias e ilhas com relevo — novo (8×8).', tipo: 'proc', seed: 71, km: 14, clima: 'temperado', hora: 'dia', tempo: 'limpo', bf: 3, novo: 1 },
  vulcanico: { dirCantos: [1], /* v1.2.25 item 9: eixo/sorteio pela medição bot×bot (PROGRESSO) */ nome: 'Arquipélago Vulcânico', desc: 'Cones vulcânicos com crateras, encostas íngremes e canais profundos — novo (8×8).', tipo: 'proc', seed: 89, km: 14, clima: 'tropical', hora: 'entardecer', tempo: 'nublado', bf: 3, novo: 1 },
  guanabara: { semCantos: 1, /* v1.2.25: os cantos da baía só existem com fundo de 7 m (PROF rasa) → navios de calado maior encalham na largada (unit: 4 939 encalhes, 0 afundamentos em 600 s) → mantém a largada da 1.2.24 */ nome: 'Baía de Guanabara (aprox.)', desc: 'Entrada da baía do Rio de Janeiro com o morro do Pão de Açúcar.', tipo: 'real', km: 14, clima: 'tropical', hora: 'entardecer', tempo: 'limpo', bf: 2 },
  santos: { nome: 'Litoral de Santos (aprox.)', desc: 'Baía de Santos, ilhas costeiras e Guarujá.', tipo: 'real', km: 14, clima: 'tropical', hora: 'noite', tempo: 'limpo', bf: 3 },
  florianopolis: { nome: 'Florianópolis (aprox.)', desc: 'Ilha de Santa Catarina: ponte pênsil Hercílio Luz, pontes do Estreito, Beira-Mar e morros.', tipo: 'real', km: 14, clima: 'temperado', hora: 'entardecer', tempo: 'limpo', bf: 2 },
  salvador: { nome: 'Baía de Todos-os-Santos (aprox.)', desc: 'Salvador: Cidade Alta, porto, farol da Barra e forte no mar.', tipo: 'real', km: 14, clima: 'tropical', hora: 'dia', tempo: 'limpo', bf: 3 },
  gibraltar: { nome: 'Baía de Gibraltar (aprox.)', desc: 'O Rochedo, Algeciras, o porto e o estreito.', tipo: 'real', km: 14, clima: 'temperado', hora: 'dia', tempo: 'nublado', bf: 4 },
  saofrancisco: { dirCantos: [3], /* v1.2.25 item 9: eixo/sorteio pela medição bot×bot (PROGRESSO) */ nome: 'Golden Gate (aprox.)', desc: 'Entrada da baía de São Francisco com a grande ponte pênsil.', tipo: 'real', km: 14, clima: 'frio', hora: 'dia', tempo: 'nublado', bf: 4 },
  noronha: { nome: 'Fernando de Noronha (aprox.)', desc: 'Arquipélago vulcânico em mar aberto, vila e porto.', tipo: 'real', km: 14, clima: 'tropical', hora: 'dia', tempo: 'limpo', bf: 3 },
};
Object.assign(MAPAS, MAPAS_NOVOS); /* v1.2.25 item 10: 4 arenas novas */
export const ORDEM_MAPAS = [...ORDEM_NOVOS, 'cordilheira', 'vulcanico', 'arquipelago', 'estreito', 'atois', 'fiordes', 'guanabara', 'santos', 'florianopolis', 'salvador', 'gibraltar', 'saofrancisco', 'noronha'];

// ---------- ruído determinístico ----------
const h2 = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, z, s) { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = h2(i, j, s), b = h2(i + 1, j, s), c = h2(i, j + 1, s), d = h2(i + 1, j + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
export function fbm(x, z, s, oit = 5) { let a = 0, amp = 0.5, f = 1, t = 0; for (let o = 0; o < oit; o++) { a += amp * vnoise(x * f, z * f, s + o * 17); t += amp; amp *= 0.5; f *= 2.03; } return a / t; }
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Ilhas por mapa: [x, z, raio (m), altura (m), alongamento, ângulo]. Posições escolhidas para deixar o eixo de combate livre. */
function ilhasDe(id, rng) {
  const I = [];
  if (id === 'arquipelago') {
    I.push([-900, -1400, 650, 190, 1.6, 0.4], [1100, 1300, 700, 230, 1.4, -0.6], [-2300, 900, 520, 120, 1.2, 1.1], [2400, -900, 560, 150, 1.5, 0.2],
      [200, -3300, 800, 260, 1.8, 1.4], [-300, 3400, 760, 210, 1.7, 1.2], [-3800, -2600, 900, 280, 1.3, 0.3], [3700, 2700, 880, 250, 1.4, 0.9], [3600, -3600, 420, 90, 1, 0], [-3500, 3600, 450, 110, 1, 0]);
  } else if (id === 'estreito') {
    for (let k = -6; k <= 6; k++) { I.push([k * 900 + rng.range(-200, 200), -2700 - rng.range(0, 900), 1100 + rng.range(0, 400), 260 + rng.range(0, 200), 1.2, rng.range(0, 3)]); I.push([k * 900 + rng.range(-200, 200), 2700 + rng.range(0, 900), 1100 + rng.range(0, 400), 240 + rng.range(0, 220), 1.2, rng.range(0, 3)]); }
    I.push([0, -1600, 380, 70, 1.4, 0], [-1500, 1500, 300, 50, 1.2, 0.5]);
  } else if (id === 'atois') {
    I.push([-1400, -1200, 420, 9, 1, 0], [1500, 1100, 460, 10, 1, 0], [-200, -2800, 380, 12, 1.4, 0.8], [400, 2900, 360, 8, 1.3, 0.3], [-3200, 2200, 500, 14, 1, 0], [3300, -2300, 520, 12, 1, 0], [-3600, -3300, 300, 30, 1, 0], [3000, 3600, 320, 40, 1, 0]);
  } else if (id === 'cordilheira') { /* ilhas costeiras com relevo (a costa continental é gerada à parte) */
    I.push([-3600, 600, 700, 260, 1.5, 0.3], [3300, 1400, 620, 230, 1.3, 1.0], [-800, 2600, 520, 180, 1.6, 0.6], [1800, -900, 460, 150, 1.2, 2.0], [-2200, -1500, 380, 120, 1.4, 1.3], [4300, -2300, 520, 300, 1.2, 0.5], [600, 4600, 640, 210, 1.7, 0.2]);
  } else if (id === 'vulcanico') { /* cones vulcânicos (o último campo marca 'cone') */
    I.push([-2600, -2200, 1100, 620, 1.1, 0.2, 1], [2700, 2300, 1000, 560, 1.15, 1.2, 1], [-3000, 2600, 700, 380, 1.3, 0.7, 1], [3100, -2700, 760, 420, 1.2, 2.1, 1], [0, -4300, 600, 300, 1.6, 0.1, 1], [-400, 4300, 620, 320, 1.5, 0.9, 1], [-4600, 0, 520, 260, 1.2, 0, 1], [4600, 200, 540, 280, 1.2, 0, 1], [900, -700, 260, 60, 1, 0, 0], [-1100, 1000, 240, 50, 1, 0, 0]);
  } else if (id === 'fiordes') {
    for (let k = 0; k < 14; k++) { const a = rng.range(0, Math.PI * 2), r = rng.range(1300, 5200); const x = Math.cos(a) * r, z = Math.sin(a) * r * 1.0; if (Math.abs(z) < 700 && Math.abs(x) < 3000) continue; I.push([x, z, rng.range(380, 900), rng.range(220, 520), rng.range(1.2, 2.2), rng.range(0, 3)]); }
  }
  return I;
}

/** Gera uma arena procedural (grade n x n) — determinística pela semente. */
function geraProcedural(id, M, n = 256) {
  const tam = M.km * 1000, h = new Float32Array(n * n), rng = new Rng(M.seed), I = ilhasDe(id, rng), cel = tam / n;
  const atol = id === 'atois', frio = id === 'fiordes'; const cord = id === 'cordilheira', vulc = id === 'vulcanico'; const rid = (x, z, sd, o) => { let a = 0, amp = 0.5, f = 1, t = 0; for (let k = 0; k < o; k++) { a += amp * (1 - Math.abs(2 * vnoise(x * f, z * f, sd + k * 13) - 1)) ** 2; t += amp; amp *= 0.5; f *= 2.07; } return a / t; }; /* v1.2.11: ruído 'ridged' (cristas de serra) */
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * cel - tam / 2, z = (j + 0.5) * cel - tam / 2;
    let v = -55 - fbm(x / 2600, z / 2600, M.seed) * 60 - sstep(3000, 6500, Math.hypot(x, z)) * 40; // fundo do mar
    if (cord) { const zc = -4300 + (fbm(x / 3000, 7.3, M.seed + 3) - 0.5) * 1800 + Math.sin(x / 1700) * 420; const dd = zc - z; /* terra ao norte da linha de costa */
      if (dd > -400) { const t = clamp(dd / 1800, 0, 1); const serra = rid(x / 1500, z / 1500, M.seed + 21, 5); const praia = dd < 120 ? 2.5 + dd * 0.02 : 0; v = Math.max(v, dd < 0 ? -6 + dd * 0.06 : praia + Math.pow(t, 0.8) * (120 + serra * 780) * (0.7 + fbm(x / 600, z / 600, M.seed + 4) * 0.6) + (dd > 120 ? 6 : 0)); } }
    for (const [ix, iz, R, H, al, a, cone] of I) {
      const dx = x - ix, dz = z - iz, ca = Math.cos(a), sa = Math.sin(a); const u = (dx * ca + dz * sa) / al, w = -dx * sa + dz * ca;
      const d = Math.hypot(u, w) / R; const borda = d + (fbm(x / 420, z / 420, M.seed + 5) - 0.5) * 0.7; if (borda > 1.6) continue;
      let ilha;
      if (atol) { const anel = Math.exp(-Math.pow((borda - 0.7) / 0.18, 2)); ilha = anel * (H + 30) - 26 + (borda < 0.55 ? -4 : 0); }
      else if (cone) { const pr = clamp(1 - borda, 0, 1); const cr = d < 0.14 ? (0.14 - d) / 0.14 : 0; const sulcos = rid(x / 300, z / 300, M.seed + 31, 4); ilha = Math.pow(pr, 1.05) * H * (0.88 + sulcos * 0.24) - cr * H * 0.28 + 14 - borda * 60; }
      else if (cord || vulc) { const perfil = Math.pow(clamp(1 - borda, 0, 1), 1.1); const rr = rid(x / 420, z / 420, M.seed + 17, 4); ilha = perfil * H * (0.65 + rr * 0.6) + 16 - borda * 66; }
      else { const perfil = Math.pow(clamp(1 - borda, 0, 1), frio ? 0.8 : 1.35); const rug = fbm(x / 260, z / 260, M.seed + 9) * (frio ? 0.55 : 0.35); ilha = perfil * H * (0.75 + rug) + 18 - borda * 70; }
      v = Math.max(v, ilha);
    }
    h[j * n + i] = v;
  }
  return { n, tam, h };
}
function decodeReal(A) { const n = A.n, bin = atob(A.b64), h = new Float32Array(n * n); for (let i = 0; i < n * n; i++) { const q = bin.charCodeAt(i); h[i] = q < 64 ? -(64 - q) * 2.4 : ((q - 64) * (q - 64)) / 36; } return { n, tam: A.km * 1000, h }; }

/** Monta a arena: grade + campos derivados (distância à terra) + plano de partida. */
/** v1.2.17 item 1 (13a): ILHAS EXTRAS da Batalha Personalizada — quantidade, tamanho e posição (ou aleatório), carimbadas na grade com o mesmo perfil natural
 *  das ilhas procedurais (borda irregular por fBm, praia rasa, relevo rugoso). Determinístico pela semente. */
function ilhasExtras(base, ex, id) { const n = base.n, tam = base.tam, cel = tam / n, rng = new Rng(9137 + (ex.seed | 0) * 31 + id.length * 7); const RT = { p: [170, 300], m: [300, 520], g: [520, 820] };
  const pos = ex.pos || 'aleatoria'; let k = 0; for (let t = 0; t < 200 && k < ex.ilhas; t++) { const tt = ex.tam && RT[ex.tam] ? ex.tam : ['p', 'm', 'g'][Math.floor(rng.next() * 3)]; const R = rng.range(RT[tt][0], RT[tt][1]);
      const lim = tam * 0.36 - R; let x, z; if (pos === 'centro') { const a = rng.range(0, 6.28), r = rng.range(0, Math.min(2600, lim)); x = Math.cos(a) * r; z = Math.sin(a) * r; } else if (pos === 'flancos') { x = (rng.next() < 0.5 ? -1 : 1) * rng.range(2200, Math.max(2300, lim)); z = rng.range(-lim, lim); } else { x = rng.range(-lim, lim); z = rng.range(-lim, lim); }
      const al = rng.range(1, 1.7), a = rng.range(0, 3.1), H = R * rng.range(0.12, 0.3), sd = 400 + k * 13; let ok = true; { const cx = Math.floor((x / tam + 0.5) * n), cz = Math.floor((z / tam + 0.5) * n); if (cx < 0 || cz < 0 || cx >= n || cz >= n || base.h[cz * n + cx] > -15) ok = false; } if (!ok) continue;
      const rr = Math.ceil(R * al * 1.7 / cel) + 1, ci = Math.floor((x / tam + 0.5) * n), cj = Math.floor((z / tam + 0.5) * n);
      for (let j = Math.max(0, cj - rr); j < Math.min(n, cj + rr); j++) for (let i = Math.max(0, ci - rr); i < Math.min(n, ci + rr); i++) { const px = (i + 0.5) * cel - tam / 2, pz = (j + 0.5) * cel - tam / 2, dx = px - x, dz = pz - z, ca = Math.cos(a), sa = Math.sin(a);
        const u = (dx * ca + dz * sa) / al, w = -dx * sa + dz * ca, d = Math.hypot(u, w) / R, borda = d + (fbm(px / 420, pz / 420, sd) - 0.5) * 0.7; if (borda > 1.6) continue;
        const perfil = Math.pow(clamp(1 - borda, 0, 1), 1.35), rug = fbm(px / 260, pz / 260, sd + 9) * 0.35, v = perfil * H * (0.75 + rug) + 18 - borda * 70; if (v > base.h[j * n + i]) base.h[j * n + i] = v; }
      k++; } return k; }
export function criaArena(id, ex = null) {
  const M = MAPAS[id] || MAPAS.arquipelago; const base0 = M.tipo === 'real' ? decodeReal(ARENAS_REAIS[id]) : M.tipo === 'novo' ? geraNovo(id, M) : geraProcedural(id, M); /* v1.2.25 item 10 */ const base = ex && ex.ilhas > 0 ? { ...base0, h: Float32Array.from(base0.h) } : base0; const nIlhasExtra = ex && ex.ilhas > 0 ? ilhasExtras(base, ex, id) : 0;
  const T = Object.assign({ id, nome: M.nome, def: M }, base); const n = T.n;
  // distância (em células) até terra/raso (h > −6 m), por BFS
  T.dist = new Float32Array(n * n).fill(1e9); const fila = new Int32Array(n * n); let fim = 0;
  for (let i = 0; i < n * n; i++) if (T.h[i] > -6) { T.dist[i] = 0; fila[fim++] = i; }
  for (let q = 0; q < fim; q++) { const i = fila[q], x = i % n, y = (i / n) | 0; const d = T.dist[i] + 1;
    if (x > 0 && T.dist[i - 1] > d) { T.dist[i - 1] = d; fila[fim++] = i - 1; } if (x < n - 1 && T.dist[i + 1] > d) { T.dist[i + 1] = d; fila[fim++] = i + 1; }
    if (y > 0 && T.dist[i - n] > d) { T.dist[i - n] = d; fila[fim++] = i - n; } if (y < n - 1 && T.dist[i + n] > d) { T.dist[i + n] = d; fila[fim++] = i + n; } }
  T.cel = T.tam / n; T.plano = (!(T.def && T.def.semCantos) && planejaCantos(T)) || planejaPartida(T); /* v1.2.25 item 13: largada nos cantos opostos, em formação (fallback: plano antigo) */ T.ilhasExtra = nIlhasExtra;
  /* v1.2.17 item 1 (13a): PLATAFORMAS offshore escolhidas na personalizada — em água funda, longe das largadas e do centro; SÓLIDAS (obstáculo r = 42 m na sim) */
  if (ex && ex.plataformas > 0) { const rng = new Rng(5501 + (ex.seed | 0)); const pl = T.plano, L = []; for (let t = 0; t < 900 && L.length < ex.plataformas; t++) { const x = rng.range(-0.36, 0.36) * T.tam, z = rng.range(-0.36, 0.36) * T.tam; if (alturaTerreno(T, x, z) > -40) continue; if ([pl.azul, pl.vermelho].some((r) => Math.hypot(r.x - x, r.z - z) < 2500) || Math.hypot(x - pl.centro.x, z - pl.centro.z) < 1200 || L.some((q) => Math.hypot(q.x - x, q.z - z) < 1500)) continue; L.push({ x, z, r: 42 }); }
    T.plataformas = L; T.obst = L.slice(); }
  return T;
}

export function alturaTerreno(T, x, z) { if (T.obst) for (const o of T.obst) if (Math.abs(x - o.x) < o.r && Math.abs(z - o.z) < o.r && Math.hypot(x - o.x, z - o.z) < o.r) return Math.max(-1, alturaGrade(T, x, z)); /* v1.2.17 item 1: plataformas sólidas */ return alturaGrade(T, x, z); }
function alturaGrade(T, x, z) {
  const n = T.n, s = T.tam; const fx = (x / s + 0.5) * n - 0.5, fz = (z / s + 0.5) * n - 0.5; if (fx < 0 || fz < 0 || fx > n - 1 || fz > n - 1) return -150;
  const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, i1 = Math.min(n - 1, i + 1), j1 = Math.min(n - 1, j + 1);
  const a = T.h[j * n + i], b = T.h[j * n + i1], c = T.h[j1 * n + i], d = T.h[j1 * n + i1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz;
}
/** Distância aproximada (m) até terra ou águas rasas. */
export function distTerra(T, x, z) { const n = T.n; const i = clamp(Math.floor((x / T.tam + 0.5) * n), 0, n - 1), j = clamp(Math.floor((z / T.tam + 0.5) * n), 0, n - 1); return T.dist[j * n + i] * T.cel; }
/** A linha de visada (alturas y1, y2) passa através do terreno? */
/** v1.2.15: linha de visada no heightmap com CURVATURA (raio de jogo 2.000 km, o mesmo do render): o ponto do meio sobe d1·d2/2R. */
export function losTerreno(T, x1, z1, y1, x2, z2, y2) { const d = Math.hypot(x2 - x1, z2 - z1), k = Math.max(2, Math.ceil(d / 60)); for (let i = 1; i < k; i++) { const u = i / k; const cv = (u * d) * ((1 - u) * d) / 4.0e6; if (alturaTerreno(T, x1 + (x2 - x1) * u, z1 + (z2 - z1) * u) + cv > y1 + (y2 - y1) * u) return false; } return true; }
export function bloqueado(T, x1, z1, y1, x2, z2, y2) { const d = Math.hypot(x2 - x1, z2 - z1), k = Math.max(2, Math.ceil(d / 70)); for (let i = 1; i < k; i++) { const u = i / k; if (alturaTerreno(T, x1 + (x2 - x1) * u, z1 + (z2 - z1) * u) > y1 + (y2 - y1) * u) return true; } return false; }

/** Escolhe centro da zona e eixo de combate: spawns a 2.000 m do centro (4.000 m entre si) em água livre. */
/** v1.2.2: distância NAVEGÁVEL (BFS em grade de 250 m, água ≥ 14 m) a partir de (cx, cz). */
function gradeAgua(T, cx, cz) { const c = 250, N = Math.ceil(T.tam / c) + 1, o = T.tam / 2; if (!T._agua) { const a = new Uint8Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) a[j * N + i] = alturaTerreno(T, i * c - o, j * c - o) < -7 ? 1 : 0; T._agua = a; }
  const A = T._agua, D = new Float32Array(N * N).fill(1e9), idx = (x, z) => { const i = Math.round((x + o) / c), j = Math.round((z + o) / c); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
  const s0 = idx(cx, cz); const fila = new Int32Array(N * N); let h = 0, tl = 0; if (s0 >= 0 && A[s0]) { D[s0] = 0; fila[tl++] = s0; }
  while (h < tl) { const k = fila[h++], i = k % N, j = (k / N) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; const q = jj * N + ii; if (!A[q] || D[q] < 1e9) continue; D[q] = D[k] + c; fila[tl++] = q; } }
  return { dist: (x, z) => { const q = idx(x, z); return q < 0 ? 1e9 : D[q]; } }; }
export function planejaPartida(T) {
  /* v1.2.2: encontros a 8–12 km — tenta a maior meia-distância possível entre as bases (PARAM.partida.meias); ilhas no caminho servem de cobertura */
  const lim = T.tam * 0.44; let melhor = null;
  const tent = []; for (const rz of [1.3, 1.6]) for (const m of PARAM.partida.meias) if (m >= 2800) tent.push([m, rz]); for (const m of PARAM.partida.meias) if (m < 2800) tent.push([m, 1.9]);
  for (const [meia, rz] of tent) {
    for (let cz = -2400; cz <= 2400; cz += 300) for (let cx = -2400; cx <= 2400; cx += 300) {
      const dc = distTerra(T, cx, cz); if (dc < 500) continue; const G = gradeAgua(T, cx, cz);
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI; const ex = Math.sin(a) * meia, ez = -Math.cos(a) * meia;
        const ax = cx - ex, az = cz - ez, bx = cx + ex, bz = cz + ez; if (Math.max(Math.abs(ax), Math.abs(az), Math.abs(bx), Math.abs(bz)) > lim - 400) continue;
        const da = distTerra(T, ax, az), db = distTerra(T, bx, bz); if (da < 450 || db < 450) continue;
        let canal = 1e9; for (let u = 0.1; u < 1; u += 0.1) canal = Math.min(canal, distTerra(T, ax + (bx - ax) * u, az + (bz - az) * u));
        const ra = G.dist(ax, az), rb = G.dist(bx, bz); if (!(ra < meia * rz && rb < meia * rz)) continue; /* base precisa ter caminho por água até o centro (sem ficar atrás de uma ilha fechada) */
        let abr = 0; for (const [bx0, bz0, sx] of [[ax, az, 1], [bx, bz, -1]]) for (const lado of [-1, 1]) { const ux = ax + (bx - ax) * (sx > 0 ? 0.22 : 0.78), uz = az + (bz - az) * (sx > 0 ? 0.22 : 0.78); const px = -(bz - az) / (2 * meia), pz = (bx - ax) / (2 * meia); const dt = distTerra(T, ux + px * 1300 * lado, uz + pz * 1300 * lado); if (dt < 700) { abr += 1; break; } } /* v1.2.19 item 9: ABRIGO — terra (ilha/morro) a ~1,3 km do flanco da linha de cada lado, para quem quiser se cobrir na largada */
        const score = Math.min(da, db, 1100) + Math.min(dc, 900) * 0.8 + Math.min(canal, 500) * 0.3 - Math.hypot(cx, cz) * 0.12 + abr * 260;
        if (!melhor || score > melhor.score) melhor = { score, cx, cz, a, ax, az, bx, bz }; } }
    if (melhor) break; }
  if (!melhor) melhor = { cx: 0, cz: 0, a: 0, ax: 0, az: 2000, bx: 0, bz: -2000, score: 0 };
  return { centro: { x: melhor.cx, z: melhor.cz, r: 600 }, azul: { x: melhor.ax, z: melhor.az }, vermelho: { x: melhor.bx, z: melhor.bz }, eixo: melhor.a };
}
