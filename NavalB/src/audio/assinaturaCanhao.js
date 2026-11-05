// v1.2.18 item 14e: ASSINATURA SONORA DO CANHÃO POR NAVIO (todas as classes).
// Pré-renderizada UMA vez no carregamento, em JS puro sobre o PCM já decodificado (gravação CC0 do banco), e enviada ao pool do
// mixer fixo (Worklet OU ScriptProcessor de reserva) — 0 nós de áudio em combate. Cada variante muda, de forma fisicamente plausível:
//  · estampido (transiente de boca: realce de agudos só nos primeiros ~60 ms — boca/freio de boca diferente);
//  · grave (corpo da onda de pressão: reforço/corte abaixo de ~180 Hz — calibre/carga/casaria que ressoa);
//  · cauda/reverberação (reflexões curtas no convés e na casaria: pente com realimentação e passa-baixas, tempos próprios);
//  · mecânica de recarga (culatra/soquete: 2–3 batidas metálicas amortecidas + baque grave, no tempo de cada reparo).
// Nada é sintetizado ao vivo; o navio escolhe a variante por hash estável da classe (modernNaval5v5.timbre) e ainda soma o próprio rate.
export const VARIANTES = { canhao_grande: 8, canhao_medio: 8, canhao_longe: 3 };
/** Assinatura do NAVIO (regra única usada pelo jogo e pelo teste assin1218): variante, rate, brilho (corte do passa-baixas da voz do mixer) e eco próprio (reflexões da casaria). */
export function assinaturaNavio(C, ordem = null) { let h = 2166136261; for (let i = 0; i < C.id.length; i++) { h ^= C.id.charCodeAt(i); h = Math.imul(h, 16777619); } h >>>= 0; const cn = (C.canhao && C.canhao.canos) || 1;
  /* índice ESTÁVEL da classe na ordem do jogo: navios vizinhos nunca repetem a combinação variante × brilho × rate (o hash só entra como reserva) */ const grande = (C.canhao && C.canhao.cal || 0) > 100, mesma = ordem ? ordem.filter((k) => ordem.CL ? ((ordem.CL[k].canhao && ordem.CL[k].canhao.cal || 0) > 100) === grande : true) : null; const ix = mesma && mesma.indexOf(C.id) >= 0 ? mesma.indexOf(C.id) : (h % 97); /* índice DENTRO do banco (grande/médio) */
  const sg = ix % 8, nb = Math.floor(ix / 8) % 3, uB = [1, 0.32, 0.03][nb], uR = [0.5, 0.0, 1.0][nb] * 0.8 + ((ix * 5) % 3) * 0.1, u3 = ((ix * 7) % 9) / 8; /* 8 variantes × 3 níveis de brilho = 24 combinações únicas por banco */
  const f = (0.9 + 0.2 * uR) * (1 - 0.012 * (cn - 1)) * (C.couracado ? 0.97 : 1) * (C.canhao && C.canhao.embutido ? 1.03 : 1) * (1 - Math.min(0.03, Math.max(0, (C.L - 150) / 8000)));
  return { sg, f, brilho: 0.28 + 0.72 * uB, eco: 0.03 + 0.14 * u3 }; }
const R = (k, i) => { let h = (k * 2654435761 + i * 40503) >>> 0; h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0; return (h % 10000) / 10000; };
export function parametros(base, k) { const u = (i) => R(k + 17 * base.length, i);
  return { grave: -0.45 + 1.15 * ((k * 3 + 1) % 8) / 7, est: 0.2 + 1.4 * ((k * 5 + 2) % 8) / 7, res: 140 * 2 ** (1.9 * ((k * 3) % 8) / 7), resG: 0.35 + 0.6 * u(11), cDel: 0.031 + 0.05 * u(3), cFb: 0.32 + 0.3 * u(4), cWet: 0.12 + 0.3 * u(5), cLp: 0.05 + 0.15 * u(6), recT: 1.35 + 1.2 * u(7), recF: 850 + 1600 * u(8), recN: 2 + (u(9) > 0.5 ? 1 : 0), recA: base === 'canhao_longe' ? 0 : 0.035 + 0.05 * u(10) }; }
/** src: Float32Array mono (ou canal 0), sr. Devolve Float32Array com a variante (mesma escala de pico). */
export function variante(src, sr, base, k) { const P = parametros(base, k), ext = Math.round(sr * (P.recA ? Math.max(0.4, P.recT + 0.5 - src.length / sr) : 0.35)), n = src.length + Math.max(0, ext), y = new Float32Array(n);
  let pk = 0; for (let i = 0; i < src.length; i++) { const a = Math.abs(src[i]); if (a > pk) pk = a; }
  const aL = 1 - Math.exp(-2 * Math.PI * 180 / sr), aH = 1 - Math.exp(-2 * Math.PI * 2200 / sr), nEst = Math.round(0.06 * sr); let lo = 0, lo2 = 0;
  for (let i = 0; i < n; i++) { const x = i < src.length ? src[i] : 0; lo += aL * (x - lo); lo2 += aH * (x - lo2); const hi = x - lo2; const fe = i < nEst ? 1 - i / nEst : 0; y[i] = x + P.grave * lo + P.est * fe * hi; }
  { /* ressonância do casco/convés (corpo): ressonador de 2 polos na frequência própria da variante */ const w = 2 * Math.PI * P.res / sr, rr = Math.exp(-w / 3.2), c1 = 2 * rr * Math.cos(w), c2 = -rr * rr, gN = (1 - rr) * 1.6; let r1 = 0, r2 = 0; for (let i = 0; i < n; i++) { const r0 = gN * y[i] + c1 * r1 + c2 * r2; r2 = r1; r1 = r0; y[i] += P.resG * r0; } }
  { const D = Math.round(P.cDel * sr), D2 = Math.round(P.cDel * 1.618 * sr), buf = new Float32Array(D + D2 + 2); let w = 0, lp = 0; const ini = Math.round(0.07 * sr); for (let i = 0; i < n; i++) { const r1 = buf[(w - D + buf.length) % buf.length], r2 = buf[(w - D2 + buf.length) % buf.length]; const fb = (r1 + r2) * 0.5; lp += P.cLp * 2 * (fb - lp); buf[w] = y[i] * 0.7 + lp * P.cFb; w = (w + 1) % buf.length; if (i > ini) y[i] += lp * P.cWet; } }
  if (P.recA) for (let b = 0; b < P.recN; b++) { const t0 = Math.round((P.recT + b * (0.11 + 0.05 * b)) * sr), f = P.recF * (1 + 0.23 * b), A = P.recA * pk * (b === P.recN - 1 ? 1.25 : 1); for (let i = 0; i < Math.round(0.16 * sr) && t0 + i < n; i++) { const t = i / sr; y[t0 + i] += A * (Math.exp(-t / 0.022) * (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(2 * Math.PI * f * 2.76 * t) * 0.3) + 0.8 * Math.exp(-t / 0.05) * Math.sin(2 * Math.PI * (95 + 30 * b) * t)); } }
  let p2 = 0; for (let i = 0; i < n; i++) { const a = Math.abs(y[i]); if (a > p2) p2 = a; } const g = p2 > 0 ? pk / p2 : 1; for (let i = 0; i < n; i++) y[i] *= g; return y; }
/** Objeto compatível com AudioBuffer para _envia (só leitura). */
export const bufDe = (y, sr) => ({ numberOfChannels: 1, sampleRate: sr, duration: y.length / sr, length: y.length, getChannelData: () => y });
