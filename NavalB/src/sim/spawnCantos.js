// v1.2.25 item 13 — NOVO POSICIONAMENTO DE INÍCIO: cada time nasce num CANTO OPOSTO da grade tática 7×7 (A–G × 1–7),
// em FORMAÇÃO DE ESQUADRA (cortina de batedores à frente, núcleo de ataque, capitânia à ré, porta-aviões e comboio na
// retaguarda), com as ilhas entre os times. Vale para TODAS as arenas (procedurais, reais e as 4 novas) e respeita a
// geografia: nenhum navio nasce em terra/raso, folga mínima até a costa, caminho por água até a zona central e a MESMA
// distância das duas bases até a zona (equilíbrio). Determinístico (só depende do campo de alturas).
import { clamp } from './util.js';

export const FOLGA_TERRA = 220;   // m mínimos da costa/raso (h > −6 m) para qualquer vaga
export const PROF_MIN = 16;       // m de lâmina d'água na vaga: maior calado do jogo (13 m) + 2,5 m de folga sob a quilha, como em match.js
export const PROF_RASA = [10, 7]; /* 7 m = mesmo limiar de 'água navegável' do planejaPartida antigo (gradeAgua) */ //      // 2ª tentativa só em baías rasas (Guanabara/Santos); os navios de calado maior procuram água mais funda ao serem colocados (vagaParaClasse)
let PROF = PROF_MIN;
/** Formação de esquadra (m): [lateral (+ = boreste de quem olha para o inimigo), avanço (+ = para o inimigo)]. */
export const FORMACAO = {
  frente: [[0, 600], [-440, 450], [440, 450]],                               // cortina: batedores/escoltas
  meio: [[0, 120], [-370, 190], [370, 190], [-730, 30], [730, 30]],          // núcleo: jogador no centro + ataque
  re: [[-330, -330], [330, -330], [0, -500]],                                // capitânia e apoio
  pa: [[0, -1050]],                                                          // porta-aviões
  merc: [[-680, -1400], [680, -1400]],                                       // comboio mercante
};
const ORDEM_GRUPO = { jogador: ['meio', 'frente', 're'], batedor: ['frente', 'meio', 're'], ataque: ['meio', 'frente', 're'], capitania: ['re', 'meio', 'frente'], pa: ['pa', 're', 'meio'], mercante: ['merc', 're', 'pa'] };

/* ---------- utilitários sobre o campo de alturas (mesma convenção de maps.js) ---------- */
function alturaG(T, x, z) { const n = T.n, s = T.tam; const fx = (x / s + 0.5) * n - 0.5, fz = (z / s + 0.5) * n - 0.5; if (fx < 0 || fz < 0 || fx > n - 1 || fz > n - 1) return -150;
  const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j, i1 = Math.min(n - 1, i + 1), j1 = Math.min(n - 1, j + 1); const a = T.h[j * n + i], b = T.h[j * n + i1], c = T.h[j1 * n + i], d = T.h[j1 * n + i1]; return a + (b - a) * tx + (c - a) * tz + (a - b - c + d) * tx * tz; }
function distT(T, x, z) { const n = T.n; const i = clamp(Math.floor((x / T.tam + 0.5) * n), 0, n - 1), j = clamp(Math.floor((z / T.tam + 0.5) * n), 0, n - 1); return T.dist[j * n + i] * T.cel; }
export const vagaOk = (T, x, z, folga = FOLGA_TERRA) => { const lim = T.tam * 0.44; return Math.abs(x) < lim && Math.abs(z) < lim && alturaG(T, x, z) < -PROF && distT(T, x, z) >= folga; };
/** Distância NAVEGÁVEL (BFS em grade de 125 m, água ≥ 8 m) a partir de (cx, cz) — usada para o equilíbrio e para garantir saída da largada. */
export function campoNav(T, cx, cz) { const c = 125, N = Math.ceil(T.tam / c) + 1, o = T.tam / 2; const A = new Uint8Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) A[j * N + i] = alturaG(T, i * c - o, j * c - o) < -Math.min(8, PROF) ? 1 : 0;
  const D = new Float32Array(N * N).fill(1e9), idx = (x, z) => { const i = Math.round((x + o) / c), j = Math.round((z + o) / c); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
  const fila = new Int32Array(N * N); let h = 0, tl = 0; const s0 = idx(cx, cz); if (s0 >= 0 && A[s0]) { D[s0] = 0; fila[tl++] = s0; }
  const V = [[1, 0, c], [-1, 0, c], [0, 1, c], [0, -1, c], [1, 1, c * 1.414], [-1, 1, c * 1.414], [1, -1, c * 1.414], [-1, -1, c * 1.414]];
  while (h < tl) { const k = fila[h++], i = k % N, j = (k / N) | 0; for (const [di, dj, w] of V) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue; const q = jj * N + ii; if (!A[q] || D[q] <= D[k] + w) continue; D[q] = D[k] + w; fila[tl++] = q; } } /* Bellman-Ford em fila (pesos 1/√2): converge em poucas passadas */
  return (x, z) => { const q = idx(x, z); if (q < 0) return 1e9; if (D[q] < 1e9) return D[q]; let m = 1e9; for (const [di, dj] of V) { const i = q % N + di, j = ((q / N) | 0) + dj; if (i >= 0 && j >= 0 && i < N && j < N) m = Math.min(m, D[j * N + i] + c); } return m; }; }

/** Converte (x,z) em célula da grade tática: 'C3'. */
export const celulaDe = (T, x, z) => { const c = T.tam / 7; const col = clamp(Math.floor((x + T.tam / 2) / c), 0, 6) + 1, lin = 'ABCDEFG'[clamp(Math.floor((z + T.tam / 2) / c), 0, 6)]; return lin + col; };

/** Coloca as vagas da formação a partir da base (bx,bz) olhando para (ax,az): cada vaga inválida é deslocada para a água livre mais próxima (≤ 1.100 m). */
function vagas(T, bx, bz, ax, az, usar = null) { const r = Math.atan2(ax - bx, -(az - bz)), fx = Math.sin(r), fz = -Math.cos(r), px = Math.cos(r), pz = Math.sin(r); const out = {}; let mov = 0, falhas = 0; const todas = [];
  for (const g of Object.keys(FORMACAO)) { out[g] = []; for (const [lat, av] of FORMACAO[g]) { let x = bx + px * lat + fx * av, z = bz + pz * lat + fz * av; const x0 = x, z0 = z; let ok = vagaOk(T, x, z) && todas.every((q) => Math.hypot(q.x - x, q.z - z) >= 200);
      for (let k = 1; k <= 44 && !ok; k++) { const rr = 25 * k; for (let a = 0; a < 16 && !ok; a++) { const b = a / 16 * Math.PI * 2 + k; const xx = x0 + Math.cos(b) * rr, zz = z0 + Math.sin(b) * rr; if (vagaOk(T, xx, zz) && todas.every((q) => Math.hypot(q.x - xx, q.z - zz) >= 200)) { x = xx; z = zz; ok = true; } } }
      if (!ok) { falhas++; x = x0; z = z0; } mov += Math.hypot(x - x0, z - z0); const v = { x, z, rumo: Math.atan2(ax - x, -(az - z)), g, ok }; out[g].push(v); todas.push(v); } }
  return { out, mov, falhas }; }

/** Plano de partida nos cantos. Mantém o contrato de planejaPartida(): { centro, azul, vermelho, eixo } + { vagas, cantos, equilibrio }.
 *  Busca: eixo entre as bases em 16 direções (as DIAGONAIS — cantos opostos da grade — são as preferidas; o eixo só gira quando a
 *  geografia fecha os cantos, ex.: Estreito), meia-distância alvo = 0,303 × lado (cruzamento B-C/2-3 ↔ E-F/5-6), centro deslizando ±1,8 km.
 *  Restrições DURAS: todas as vagas em água funda e livre; zona central em água a ≥ 450 m da costa; as duas bases com caminho por água até a
 *  zona e diferença de distância NAVEGÁVEL ≤ 10 %. */
export function planejaCantos(T) { for (const p of [PROF_MIN, ...PROF_RASA]) { PROF = p; const r = planejaCantos0(T); PROF = PROF_MIN; if (r) { r.prof = p; return r; } } return null; }
function planejaCantos0(T) {
  const tam = T.tam, alvoM = tam * 0.303, lim = tam * 0.44; const cand = [];
  for (let d = 0; d < 16; d++) { { const dc = (globalThis.__nnsDirCantos && globalThis.__nnsDirCantos[T.id]) || (T.def && T.def.dirCantos); if (dc && !dc.includes(d)) continue; } /* (globalThis.__nnsDirCantos: só teste) */ /* v1.2.25 item 9: diagonal fixada por mapa quando a medida de vitórias mostrou canto favorecido */ const th = d / 16 * Math.PI * 2; const diag = Math.abs(((th - Math.PI / 4) % (Math.PI / 2) + Math.PI / 2) % (Math.PI / 2)); const desv = Math.min(diag, Math.PI / 2 - diag); /* 0 = diagonal */
    const ux = Math.sin(th), uz = -Math.cos(th); /* direção centro → base AZUL */
    for (const mk of [1, 0.9, 1.1, 0.8, 1.2, 0.7]) { const m = alvoM * mk;
      for (let oy = -3; oy <= 3; oy++) for (let ox = -3; ox <= 3; ox++) { const cx = ox * 600, cz = oy * 600, ax = cx + ux * m, az = cz + uz * m, bx = cx - ux * m, bz = cz - uz * m;
        if (Math.max(Math.abs(ax), Math.abs(az), Math.abs(bx), Math.abs(bz)) > lim - 350) continue; if (distT(T, ax, az) < 500 || distT(T, bx, bz) < 500 || !vagaOk(T, cx, cz, 450)) continue;
        let cob = 0; for (let u = 0.25; u <= 0.75; u += 0.125) { if (distT(T, ax + (bx - ax) * u, az + (bz - az) * u) < 500) cob++; }
        const pre = -desv * 900 - Math.abs(mk - 1) * 700 - Math.hypot(cx, cz) * 0.08 + Math.min(distT(T, ax, az), 900) * 0.15 + Math.min(distT(T, bx, bz), 900) * 0.15 + Math.min(cob, 3) * 90 + (az > 0 && ax > 0 ? 40 : 0); /* leve preferência: seu time em E-F/5-6 */
        cand.push({ pre, ax, az, bx, bz, cx, cz }); } } }
  cand.sort((p, q) => q.pre - p.pre); let melhor = null, testados = 0;
  for (const c of cand) { if (melhor && c.pre < melhor.score - 400) break; if (++testados > 120) break;
    const VA = vagas(T, c.ax, c.az, c.cx, c.cz), VV = vagas(T, c.bx, c.bz, c.cx, c.cz); if (VA.falhas || VV.falhas) continue;
    const nav = campoNav(T, c.cx, c.cz); const media = (V) => { let s = 0, n = 0; for (const g in V) for (const v of V[g]) if (g !== 'merc' && g !== 'pa') { s += nav(v.x, v.z); n++; } return s / n; };
    const nA = media(VA.out), nV = media(VV.out), reta = Math.hypot(c.ax - c.cx, c.az - c.cz); if (!(nA < 1e8 && nV < 1e8) || Math.abs(nA - nV) / Math.max(nA, nV) > 0.1 || Math.max(nA, nV) > reta * 1.45) continue;
    const score = c.pre - (VA.mov + VV.mov) * 0.25 - Math.abs(nA - nV) * 0.5; if (!melhor || score > melhor.score) melhor = { ...c, score, VA, VV, nA, nV }; }
  if (!melhor) return null; /* arena sem largada equilibrada possível: o chamador volta ao planejaPartida() antigo */
  const { ax, az, bx, bz, cx, cz } = melhor;
  return { centro: { x: cx, z: cz, r: 600 }, azul: { x: ax, z: az }, vermelho: { x: bx, z: bz }, eixo: Math.atan2(ax - bx, -(az - bz)),
    cantos: { azul: celulaDe(T, ax, az), vermelho: celulaDe(T, bx, bz) }, vagas: { azul: melhor.VA.out, vermelho: melhor.VV.out },
    equilibrio: { retaA: Math.round(Math.hypot(ax - cx, az - cz)), retaV: Math.round(Math.hypot(bx - cx, bz - cz)), navA: Math.round(melhor.nA), navV: Math.round(melhor.nV), entreBases: Math.round(Math.hypot(ax - bx, az - bz)) } };
}

/** Entrega a próxima vaga livre do time para um navio (papel → grupo da formação; porta-aviões → 'pa'; mercante → 'merc'),
 *  já ajustada ao calado da classe. Guarda o uso em plano._uso (zerado por match.monta). null = arena sem vagas (usa o método antigo). */
export function pegaVaga(plano, time, papel, C, T) { const V = plano.vagas && plano.vagas[time]; if (!V) return null; const u = plano._uso || (plano._uso = {}); const U = u[time] || (u[time] = { n: {}, oc: [] });
  const chave = C.mercante ? 'mercante' : (C.id === 'horizonte' || C.maxAr) && papel !== 'jogador' ? 'pa' : ORDEM_GRUPO[papel] ? papel : 'ataque'; let v = null;
  for (const g of ORDEM_GRUPO[chave]) if ((U.n[g] || 0) < V[g].length) { v = V[g][U.n[g] = (U.n[g] || 0) + 1, U.n[g] - 1]; break; }
  if (!v) for (const g in V) if ((U.n[g] || 0) < V[g].length) { v = V[g][U.n[g] = (U.n[g] || 0) + 1, U.n[g] - 1]; break; }
  if (!v) return null; v = vagaParaClasse(T, v, C, U.oc); U.oc.push(v); return v; }

/** Desloca base e vagas de um time em direção à zona (frotas pequenas na personalizada). Devolve cópia. */
export function aproximaTime(plano, time, k) { const c = plano.centro, B = plano[time]; const dx = (c.x - B.x) * k, dz = (c.z - B.z) * k; B.x += dx; B.z += dz;
  for (const g in plano.vagas[time]) plano.vagas[time][g] = plano.vagas[time][g].map((v) => ({ ...v, x: v.x + dx, z: v.z + dz })); }

/** Ajusta UMA vaga para o calado da classe (quilha + 2,5 m, mesma regra do match.js) e folga da costa; espiral ≤ 900 m, longe das outras vagas já ocupadas. */
export function vagaParaClasse(T, v, C, ocupadas = []) { const lim = T.tam * 0.44; const livre = (x, z, e) => Math.abs(x) < lim && Math.abs(z) < lim && ocupadas.every((q) => Math.hypot(q.x - x, q.z - z) >= e);
  const tenta = (prof, folga, esp, kmax) => { const ok = (x, z) => alturaG(T, x, z) < -prof && distT(T, x, z) >= folga && livre(x, z, esp); if (ok(v.x, v.z)) return v;
    for (let k = 1; k <= kmax; k++) { const r = k <= 36 ? 25 * k : 900 + (k - 36) * 50; for (let a = 0; a < 16; a++) { const b = a / 16 * Math.PI * 2 + k, x = v.x + Math.cos(b) * r, z = v.z + Math.sin(b) * r; if (ok(x, z)) return { ...v, x, z }; } } return null; };
  /* 1) calado+2,5 m e folga de 160 m (≤ 900 m); 2) até 2,5 km; 3) folga menor; 4) último recurso: o ponto mais fundo num raio de 2,5 km (baías rasas de mapas reais aproximados) */
  const r = tenta(C.T + 2.5, Math.max(C.L * 0.6, 160), 180, 36) || tenta(C.T + 2.5, Math.max(C.L * 0.6, 160), 180, 68) || tenta(C.T + 2.5, C.L * 0.6, 150, 68); if (r) return r;
  let m = v, hm = alturaG(T, v.x, v.z); for (let k = 1; k <= 68; k++) { const rr = k <= 36 ? 25 * k : 900 + (k - 36) * 50; for (let a = 0; a < 16; a++) { const b = a / 16 * Math.PI * 2 + k, x = v.x + Math.cos(b) * rr, z = v.z + Math.sin(b) * rr; const h = alturaG(T, x, z); if (h < hm && livre(x, z, 150)) { hm = h; m = { ...v, x, z }; } } } return m; }
