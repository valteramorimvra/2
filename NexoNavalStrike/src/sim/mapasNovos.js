// v1.2.25 item 10 — 4 ARENAS NOVAS de arquipélago (originais; nenhum asset, nome ou layout de outro jogo).
// Mesmo formato das arenas procedurais de maps.js: grade de alturas (m; negativo = profundidade), determinística pela semente.
// Cada arena: ilhas GRANDES nas bordas + dezenas de ilhas rochosas pequenas/médias espalhadas formando canais e pontos de
// cobertura; posições espelhadas pelo centro (com variação de forma/tamanho/altura) para EQUILÍBRIO entre os cantos de largada.
// Perfis por tipo de rocha: 'rocha' (falésias + praias abrigadas), 'pico' (montanhas serrilhadas com paredões), 'karst' (torres de
// calcário de paredes quase verticais), 'cal' (ilhas calcárias alongadas, baixas, de costa recortada).
import { clamp, Rng } from './util.js';

export const MAPAS_NOVOS = {
  dalmacia: { ladoSorteio: 1, /* v1.2.25 item 9: eixo/sorteio pela medição bot×bot (PROGRESSO) */ nome: 'Arquipélago da Dalmácia', desc: 'Ilhas calcárias longas e paralelas, canais estreitos e enseadas: cobertura a cada 1 km.', tipo: 'novo', seed: 131, km: 12, n: 320, clima: 'temperado', hora: 'dia', tempo: 'limpo', bf: 2, novo: 1, segK: 1.25 },
  lofoten: { dirCantos: [1], /* v1.2.25 item 9: eixo/sorteio pela medição bot×bot (PROGRESSO) */ nome: 'Ilhas Lofoten', desc: 'Picos serrilhados de até 800 m, paredões e recifes rochosos em mar frio e nublado.', tipo: 'novo', seed: 149, km: 12, n: 320, clima: 'frio', hora: 'dia', tempo: 'nublado', bf: 4, novo: 1, segK: 1.25 },
  halong: { nome: 'Baía de Ha Long', desc: 'Centenas de torres de calcário cobertas de mata saindo do mar sob chuva tropical.', tipo: 'novo', seed: 167, km: 12, n: 384, clima: 'tropical', hora: 'dia', tempo: 'chuva', bf: 2, novo: 1, segK: 1.5 },
  ruinas: { nome: 'Enseada das Torres Submersas', desc: 'Arquipélago rochoso ao entardecer nublado; ruínas de uma cidade afundada no horizonte.', tipo: 'novo', seed: 181, km: 12, n: 320, clima: 'temperado', hora: 'entardecer', tempo: 'nublado', bf: 3, novo: 1, segK: 1.25, ruinas: 1 },
};
export const ORDEM_NOVOS = ['ruinas', 'dalmacia', 'lofoten', 'halong'];

// ---------- ruído determinístico (cópia exata do de maps.js, para não criar import circular) ----------
const h2 = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, z, s) { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); const a = h2(i, j, s), b = h2(i + 1, j, s), c = h2(i, j + 1, s), d = h2(i + 1, j + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, z, s, oit = 5) { let a = 0, amp = 0.5, f = 1, t = 0; for (let o = 0; o < oit; o++) { a += amp * vnoise(x * f, z * f, s + o * 17); t += amp; amp *= 0.5; f *= 2.03; } return a / t; }
function rid(x, z, s, o) { let a = 0, amp = 0.5, f = 1, t = 0; for (let k = 0; k < o; k++) { a += amp * (1 - Math.abs(2 * vnoise(x * f, z * f, s + k * 13) - 1)) ** 2; t += amp; amp *= 0.5; f *= 2.07; } return a / t; }
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Centro de uma célula da grade tática 7×7 (colunas 1–7 de oeste p/ leste, linhas A–G de norte p/ sul). */
export function celula(tam, letra, col) { const c = tam / 7, r = 'ABCDEFG'.indexOf(letra); return { x: -tam / 2 + (col - 0.5) * c, z: -tam / 2 + (r + 0.5) * c }; }
/** Canto de largada usado no layout (cruzamento B-C × 2-3 e o oposto E-F × 5-6). */
const CANTO = (tam) => (tam / 7) * 2 - tam / 2; // −2571 m em 12 km

/** Ilhas por arena: [x, z, R, H, alongamento, ângulo, tipo]. */
function ilhasNovas(id, M, rng) {
  const tam = M.km * 1000, cs = CANTO(tam), I = [];
  const livre = (x, z, R) => Math.hypot(x - cs, z - cs) > 1250 + R && Math.hypot(x + cs, z + cs) > 1250 + R && Math.hypot(x, z) > 650 + R; /* cantos de largada e zona central em água livre */
  const espaco = (x, z, R, folga) => I.every((q) => Math.hypot(q[0] - x, q[1] - z) > (q[2] * Math.max(1, q[4]) * 0.8 + R * 0.9 + folga));
  /** coloca uma ilha e o seu par espelhado pelo centro (forma, tamanho e altura variam ±15–20 %). */
  const par = (x, z, R, H, al, a, tipo) => { I.push([x, z, R, H, al, a, tipo]); I.push([-x + rng.range(-160, 160), -z + rng.range(-160, 160), R * rng.range(0.86, 1.14), H * rng.range(0.82, 1.18), al * rng.range(0.9, 1.1), a + rng.range(-0.5, 0.5) + (rng.next() < 0.5 ? Math.PI / 2 : 0) * (al > 1.6 ? 0 : 1), tipo]); };
  const espalha = (n, Rmin, Rmax, Hk, alMin, alMax, ang, tipo, folga) => { for (let k = 0, t = 0; k < n && t < n * 80; t++) { const x = rng.range(-0.42, 0.42) * tam, z = rng.range(-0.42, 0.42) * tam; const R = rng.range(Rmin, Rmax), al = rng.range(alMin, alMax);
      if (!livre(x, z, R * al) || !livre(-x, -z, R * al) || !espaco(x, z, R * al, folga) || !espaco(-x, -z, R * al, folga) || Math.hypot(x, z) < 900) continue; par(x, z, R, Hk(R), al, ang == null ? rng.range(0, Math.PI) : ang + rng.range(-0.25, 0.25), tipo); k++; } };
  /** CINTURÃO de ilhas ENTRE os dois cantos de largada (faixa da anti-diagonal, 0,9–2,8 km do centro): cobertura no caminho, como nas batalhas de referência. */
  const cinturao = (n, Rmin, Rmax, Hk, alMin, alMax, ang, tipo, folga) => { for (let k = 0, t = 0; k < n && t < n * 120; t++) { const s = rng.range(0.9, 2.8) * 1000 * (rng.next() < 0.5 ? 1 : -1), w = rng.range(-900, 900); const x = (s - w) * 0.7071, z = (-s - w) * 0.7071; const R = rng.range(Rmin, Rmax), al = rng.range(alMin, alMax);
      if (!livre(x, z, R * al) || !espaco(x, z, R * al, folga) || !espaco(-x, -z, R * al, folga)) continue; par(x, z, R, Hk(R), al, ang == null ? rng.range(0, Math.PI) : ang + rng.range(-0.25, 0.25), tipo); k++; } };
  if (id === 'dalmacia') { /* ilhas longas paralelas (dobras calcárias NO–SE, como na costa dálmata) */
    par(3000, -4900, 1150, 300, 3.0, 0.42, 'cal'); par(5000, -1400, 700, 220, 2.6, 0.5, 'cal'); /* grandes nas bordas (e os pares em SO) */
    cinturao(4, 260, 420, (R) => R * rng.range(0.3, 0.45), 2.0, 3.0, 0.45, 'cal', 320);
    espalha(9, 220, 420, (R) => R * rng.range(0.28, 0.45), 2.0, 3.4, 0.45, 'cal', 380);
    espalha(10, 110, 220, (R) => R * rng.range(0.25, 0.5), 1, 1.8, null, 'rocha', 300);
  } else if (id === 'lofoten') { /* cordilheira insular alta + recifes (escolhos) */
    par(3800, -4300, 1700, 640, 1.7, 0.75, 'pico'); par(-500, -5200, 900, 420, 1.9, 1.4, 'pico');
    cinturao(4, 260, 420, (R) => R * rng.range(0.55, 0.85), 1.1, 1.7, null, 'pico', 340);
    espalha(6, 300, 520, (R) => R * rng.range(0.55, 0.9), 1.1, 1.9, null, 'pico', 420);
    espalha(12, 90, 190, (R) => R * rng.range(0.15, 0.35), 1, 1.6, null, 'rocha', 260);
  } else if (id === 'halong') { /* torres de calcário em aglomerados + duas ilhas grandes de bordas */
    par(4300, -3900, 1300, 230, 1.5, 0.3, 'karst'); par(1200, -5200, 700, 190, 2, 1.1, 'karst');
    cinturao(6, 150, 300, () => rng.range(80, 170), 1, 1.6, null, 'karst', 220);
    espalha(18, 140, 330, (R) => rng.range(70, 180), 1, 1.7, null, 'karst', 240);
    espalha(18, 70, 120, () => rng.range(45, 110), 1, 1.4, null, 'karst', 180);
  } else { /* ruinas: arquipélago rochoso verde (granito) com falésias e praias */
    par(3900, -4600, 1500, 380, 1.9, 0.6, 'rocha'); par(-200, -5300, 800, 220, 2.2, 0.15, 'rocha');
    cinturao(5, 230, 420, (R) => R * rng.range(0.35, 0.55), 1, 1.7, null, 'rocha', 300);
    espalha(8, 280, 500, (R) => R * rng.range(0.35, 0.6), 1, 1.8, null, 'rocha', 400);
    espalha(10, 120, 230, (R) => R * rng.range(0.3, 0.5), 1, 1.5, null, 'rocha', 280);
  }
  return I;
}

/** Perfil de altura de UMA ilha no ponto (borda: 0 = cume, 1 = linha de costa nominal). */
function perfil(tipo, borda, d, x, z, H, sd) {
  if (tipo === 'karst') { /* paredões quase verticais, topo arredondado e esburacado (dolinas), pé com entalhe de maré */
    const p = clamp(1 - borda, 0, 1), parede = sstep(0, 0.22, p), topo = 0.78 + 0.22 * fbm(x / 70, z / 70, sd + 3) - 0.12 * rid(x / 110, z / 110, sd + 7, 3);
    return parede * H * topo + 6 * sstep(0, 0.05, p) - (borda > 1 ? (borda - 1) * 90 : 0) - 4; }
  if (tipo === 'pico') { /* cristas serrilhadas (ruído 'ridged'), paredões sobre o mar */
    const p = clamp(1 - borda, 0, 1), cr = rid(x / 360, z / 360, sd + 21, 5); const fal = sstep(0, 0.12, p) * 0.22;
    return (Math.pow(p, 0.9) * (0.38 + cr * 0.62) + fal) * H + 10 - borda * 60; }
  if (tipo === 'cal') { /* calcário: dorso baixo e comprido, costa recortada, falésias brancas no lado do mar aberto */
    const p = clamp(1 - borda, 0, 1), cr = fbm(x / 240, z / 240, sd + 9); const fal = sstep(0.35, 0.75, fbm(x / 900, z / 900, sd + 2)) * sstep(0, 0.1, p) * 0.3;
    return (Math.pow(p, 0.75) * (0.62 + cr * 0.55) + fal) * H + 12 - borda * 64; }
  /* rocha (granito): morros com falésias onde o ruído de baixa frequência manda, praias nas enseadas abrigadas */
  const p = clamp(1 - borda, 0, 1), rug = fbm(x / 230, z / 230, sd + 9), cr = rid(x / 420, z / 420, sd + 17, 4);
  const falesia = sstep(0.42, 0.7, fbm(x / 700, z / 700, sd + 4)); const ombro = falesia * sstep(0, 0.09, p) * 0.28;
  const forma = falesia ? Math.pow(p, 0.8 + (1 - falesia) * 0.6) : Math.pow(p, 1.4);
  return (forma * (0.55 + rug * 0.35 + cr * 0.35) + ombro) * H + 14 - borda * (60 + falesia * 40);
}

/** Gera a grade (n × n) de uma arena nova — mesmo contrato de geraProcedural(): { n, tam, h }. */
export function geraNovo(id, M) {
  const n = M.n || 256, tam = M.km * 1000, h = new Float32Array(n * n), rng = new Rng(M.seed), I = ilhasNovas(id, M, rng), cel = tam / n;
  const pre = I.map(([ix, iz, R, H, al, a, tipo], k) => ({ ix, iz, R, H, al, ca: Math.cos(a), sa: Math.sin(a), tipo, sd: M.seed + k * 7, rx: R * al * 1.75 })); /* rx: raio de influência (borda ≤ 1,6) */
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * cel - tam / 2, z = (j + 0.5) * cel - tam / 2;
    let v = -48 - fbm(x / 2400, z / 2400, M.seed) * 55 - sstep(3200, 6800, Math.hypot(x, z)) * 35; /* fundo: plataforma rasa entre as ilhas, mais fundo fora */
    if (id === 'halong') v = -18 - fbm(x / 1800, z / 1800, M.seed) * 22; /* baía rasa (≈ 20–40 m) */
    for (const q of pre) { const dx = x - q.ix, dz = z - q.iz; if (Math.abs(dx) > q.rx || Math.abs(dz) > q.rx) continue;
      const u = (dx * q.ca + dz * q.sa) / q.al, w = -dx * q.sa + dz * q.ca, d = Math.hypot(u, w) / q.R;
      const borda = d + (fbm(x / 380, z / 380, q.sd + 5) - 0.5) * (q.tipo === 'karst' ? 0.45 : 0.7) + (fbm(x / 120, z / 120, q.sd + 6) - 0.5) * 0.18; if (borda > 1.6) continue;
      const hv = perfil(q.tipo, borda, d, x, z, q.H, q.sd); if (hv > v) v = hv; }
    h[j * n + i] = v;
  }
  return { n, tam, h };
}

/** v1.2.25: posições das RUÍNAS da cidade submersa (só a arena 'ruinas'): fora da área navegável, num arco N–O–NE do horizonte.
 *  [x, z, largura, profundidade, altura acima d'água, inclinação (rad), rumo, tipo 0 = prédio quebrado, 1 = torre alta com mastro, 2 = toco/pilar] */
export function ruinasDe(id) {
  const M = MAPAS_NOVOS[id]; if (!M || !M.ruinas) return []; const rng = new Rng(M.seed * 7 + 3), L = [], tam = M.km * 1000;
  const bairros = [-2.05, -1.45, -0.55, 0.25]; /* 4 "bairros" da cidade afundada no arco NO–N–NE (silhueta de skyline, não pontos soltos) */
  for (let k = 0, t = 0; k < 46 && t < 4000; t++) { const a = bairros[k % 4] + rng.range(-0.2, 0.2), r = rng.range(tam * 0.5, tam * 0.74);
    const x = Math.sin(a) * r, z = -Math.cos(a) * r; if (Math.max(Math.abs(x), Math.abs(z)) < tam * 0.47 + 60) continue; /* sempre FORA da área navegável (±0,44 × lado) */ if (L.some((q) => Math.hypot(q[0] - x, q[1] - z) < 150)) continue;
    const tipo = k < 4 ? 1 : rng.next() < 0.2 ? 2 : 0, w = tipo === 2 ? rng.range(14, 26) : rng.range(26, 50), dp = w * rng.range(0.7, 1.25);
    const alt = tipo === 1 ? rng.range(230, 340) : tipo === 2 ? rng.range(12, 40) : rng.range(60, 170);
    L.push([x, z, w, dp, alt, rng.next() < 0.3 ? rng.range(-0.09, 0.09) : 0, rng.range(0, Math.PI), tipo]); k++; }
  return L;
}
