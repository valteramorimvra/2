// v1.2.0 — Balística COM ARRASTO (projétil real perde velocidade: arco mais alto e tempo de voo maior que no vácuo).
// a = −g ŷ − k·|v|·v, com k por calibre (projéteis pesados conservam velocidade). A simulação integra exatamente isto e o
// computador de tiro usa uma TABELA pré-calculada (elevação → alcance, tempo de voo) da mesma equação: sem divergência.
import { G } from '../sim/util.js';

/** Coeficiente de arrasto efetivo (1/m) por calibre (mm): 57 mm ≈ 1,0e-4 · 76 mm ≈ 8e-5 · 155 mm ≈ 5,2e-5. */
/** Multiplicadores ajustáveis (src/armasParametros.js). */
export const BAL = { arrasto: 1, curva: 1 }; /* v1.2.14: curva = avanço em ARCO para alvo guinando (ideia do projeto B) */
export const arrastoCal = (cal) => (BAL.arrasto * 1.1e-3) / Math.pow(Math.max(20, cal), 0.6);
const TAB = new Map(); const EL0 = -0.087, EL1 = Math.PI / 4, NEL = 220, DTI = 1 / 60;
/** Integra a trajetória (mesmo passo da sim) de h0 até cruzar y = 0. */
export function trajetoria(el, h0, V0, k, o = null) { /* o: objeto reutilizado (sem alocação no laço do tiro em arco) */ let x = 0, y = h0, vx = V0 * Math.cos(el), vy = V0 * Math.sin(el), t = 0, ymax = h0;
  for (let i = 0; i < 60 * 400; i++) { const v = Math.hypot(vx, vy); vx -= k * v * vx * DTI; vy -= (G + k * v * vy) * DTI; const ny = y + vy * DTI, nx = x + vx * DTI; t += DTI; if (ny <= 0) { const f = y / (y - ny); const r = o || {}; r.x = x + (nx - x) * f; r.t = t - DTI + DTI * f; r.ymax = ymax; r.vf = v; return r; } x = nx; y = ny; if (y > ymax) ymax = y; }
  const r = o || {}; r.x = x; r.t = t; r.ymax = ymax; r.vf = 0; return r; }
function tabela(V0, k) { const ch = V0 + ':' + k.toFixed(9); let T = TAB.get(ch); if (T) return T;
  /* v1.2.4: grade NÃO uniforme — fina (0,1 mrad) perto do tiro tenso (−30…+60 mrad), onde o alcance varia muito com a elevação.
     Com a grade uniforme de 4 mrad, a 2.800 m/s (305 mm) o tiro tenso ficava 0,5–1,4 m abaixo/acima do ponto visado = 90–220 m de erro de alcance. */
  const L = []; for (let e = EL0; e < -0.03; e += 0.002) L.push(e); for (let e = -0.03; e < 0.06; e += 0.0001) L.push(e); for (let e = 0.06; e <= EL1 + 1e-9; e += 0.004) L.push(e);
  const NN = L.length - 1; const els = new Float64Array(NN + 1), xs = new Float64Array(NN + 1), ts = new Float64Array(NN + 1), ys = new Float64Array(NN + 1);
  for (let i = 0; i <= NN; i++) { const el = L[i]; const r = trajetoria(el, 10, V0, k); els[i] = el; xs[i] = r.x; ts[i] = r.t; ys[i] = r.ymax; }
  let imax = 0; for (let i = 1; i <= NN; i++) if (xs[i] > xs[imax]) imax = i; T = { els, xs, ts, ys, imax, max: xs[imax], nn: NN }; TAB.set(ch, T); return T; }
/** v1.2.21 item 14a: TIRO EM ARCO com carga reduzida — dada a elevação el, acha a velocidade de boca V em [Vmin, Vmax] cuja trajetória (mesma integração da sim)
 *  cai a d. O alcance cresce com V (monótono) → secante protegida por bissecção. out = { V, t, ymax } ou null se d estiver fora de [alcance(Vmin), alcance(Vmax)]. */
const TJ = {}; /* trajetória de rascunho do tiro em arco: lida logo após cada chamada */
export function cargaArco(d, h0, el, k, Vmin, Vmax, out) { let a = Vmin, b = Vmax, fa, fb, lado = 0; const tol = d * 2e-4;
  /* v1.2.21 desempenho (mesma física, mesma tolerância de 2e-4·d): cada trajetória de arco integra ~2–3 mil passos de 1/60 s e isto roda a cada
     passo da sim para todo navio em tiro de arco. (1) Fora da faixa de carga: o alcance com Vmin/Vmax da última chamada (mesma elevação/arrasto/faixa,
     boca ±0,3 m) recusa sem integrar. (2) Partida a quente PREDITIVA: o alcance cresce ~V², então V' = V·√(d/x_ant) quase sempre já cai dentro da
     tolerância (1 trajetória); senão um 2º palpite pela mesma lei, levemente além, fecha o colchete e a regula falsi termina em 1–2 passos. */
  const c = out._c, ch = el * 1e3 + k * 1e9 + Vmin * 7 + Vmax * 13; /* chave numérica (sem concatenar string a cada passo) */
  if (c && c.ch === ch && Math.abs(c.h0 - h0) < 0.3 && (d < c.xmin - 2 || d > c.xmax + 2)) return null;
  const fim = (V, r) => { out.V = V; out.t = r.t; out.ymax = r.ymax; out.d = r.x; out.h0 = h0; out.ch = ch; return out; }; /* out.d = alcance REAL da carga achada (não o pedido): o palpite seguinte parte do ponto exato */
  /* (3) alvo/boca quase parados desde a última solução: o mesmo V ainda cai dentro da tolerância (no arco de carga reduzida a descida é > 55°, logo Δalcance ≤ 0,7·Δh da boca) */
  if (out.ch === ch && out.V > Vmin && out.V < Vmax && Math.abs(d - out.d) + 0.7 * Math.abs(h0 - out.h0) < tol * 0.9) return out;
  if (out.V > Vmin && out.V < Vmax && out.d > 0) { const V1 = Math.min(Vmax, Math.max(Vmin, out.V * Math.sqrt(d / out.d))); const r1 = trajetoria(el, h0, V1, k, TJ), f1 = r1.x - d;
    if (Math.abs(f1) < tol) return fim(V1, r1);
    const V2 = Math.min(Vmax, Math.max(Vmin, V1 * Math.sqrt(d / Math.max(1, r1.x)) * (f1 > 0 ? 0.9995 : 1.0005))); const r2 = trajetoria(el, h0, V2, k, TJ), f2 = r2.x - d;
    if (Math.abs(f2) < tol) return fim(V2, r2);
    if (f1 < 0 && f2 > 0) { a = V1; fa = f1; b = V2; fb = f2; } else if (f2 < 0 && f1 > 0) { a = V2; fa = f2; b = V1; fb = f1; } }
  if (fa == null) { fa = trajetoria(el, h0, a, k, TJ).x - d; fb = trajetoria(el, h0, b, k, TJ).x - d; { const cc = out._c || (out._c = {}); cc.ch = ch; cc.h0 = h0; cc.xmin = fa + d; cc.xmax = fb + d; } if (fa > 0 || fb < 0) return null; }
  for (let it = 0; it < 40; it++) { const m = a - fa * (b - a) / (fb - fa); const r = trajetoria(el, h0, m, k, TJ), fm = r.x - d; if (Math.abs(fm) < tol || b - a < 1e-3) return fim(m, r);
    if (fm < 0) { a = m; fa = fm; if (lado === -1) fb /= 2; lado = -1; } else { b = m; fb = fm; if (lado === 1) fa /= 2; lado = 1; } } /* Illinois (regula falsi modificada) */
  return null; }
/** Alcance máximo (m) da arma. */
export const alcanceMax = (V0, k) => tabela(V0, k).max;
/** Elevação, tempo de voo e altura máxima para atingir a distância horizontal d (null se fora de alcance).
 *  A tabela é de h0 = 10 m; a diferença de altura da boca é corrigida pela inclinação h/d. */
export function elevacaoArrasto(d, h0, V0, k, out, alto = 0) { const T = tabela(V0, k); if (d > T.max) return null; const { els, xs, ts, ys } = T;
  if (alto) { /* v1.2.21 item 14a: ramo ALTO (acima da elevação de alcance máximo) — o alcance DECRESCE com a elevação */ let i = T.imax; while (i < T.nn && xs[i + 1] > d) i++; if (i >= T.nn || xs[i] < d) return null; const a = xs[i], b2 = xs[i + 1], f = a > b2 ? Math.max(0, Math.min(1, (a - d) / (a - b2))) : 0;
    out.el = els[i] + (els[i + 1] - els[i]) * f; out.tv = ts[i] + (ts[i + 1] - ts[i]) * f; out.ymax = ys[i] + (ys[i + 1] - ys[i]) * f + (h0 - 10); out.alto = 1; return out; }
  out.alto = 0; let lo = 0, hi = T.imax; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] < d) lo = m; else hi = m; } let i = xs[0] >= d ? 0 : lo;
  const a = xs[i], b = xs[Math.min(i + 1, T.imax)], f = b > a ? Math.max(0, Math.min(1, (d - a) / (b - a))) : 0; const j = Math.min(i + 1, T.imax);
  out.el = els[i] + (els[j] - els[i]) * f - (h0 - 10) / Math.max(150, d); out.tv = ts[i] + (ts[j] - ts[i]) * f; out.ymax = ys[i] + (ys[j] - ys[i]) * f + (h0 - 10); return out; }
const _e = { el: 0, tv: 0, ymax: 0 };
/** Solução de tiro preditiva com arrasto: itera a posição futura do alvo pelo tempo de voo (6 iterações). */
export function solucaoArrasto(gx, gz, h0, V0, k, tx, tz, tvx, tvz, out, tw = 0, ux = 0, uz = 0, alto = 0) { /* v1.2.21 item 14c: (ux, uz) = velocidade do PRÓPRIO navio somada ao projétil (o arrasto conserva a direção horizontal: deslocamento ≈ u·d/(V0·cos el)) */ let px = tx, pz = tz; const curva = BAL.curva && Math.abs(tw) > 0.003;
  /* v1.2.14 (trazido do projeto B e corrigido): alvo GUINANDO (taxa tw rad/s) → deslocamento ao longo do ARCO: corda = v·t·sinc(θ/2) na direção girada θ/2 (o B usava a média das velocidades, 7 iterações) */
  for (let i = 0; i < 7; i++) { const d = Math.hypot(px - gx, pz - gz); if (!elevacaoArrasto(d, h0, V0, k, _e, alto)) return null; const t = _e.tv; const fu = d / (V0 * Math.max(0.05, Math.cos(_e.el)));
    if (curva) { const h = tw * t * 0.5, c = Math.cos(h), s = Math.sin(h), sc = Math.abs(h) > 1e-6 ? Math.sin(h) / h : 1; px = tx + (tvx * c - tvz * s) * sc * t - ux * fu; pz = tz + (tvz * c + tvx * s) * sc * t - uz * fu; } else { px = tx + tvx * t - ux * fu; pz = tz + tvz * t - uz * fu; } }
  const d = Math.hypot(px - gx, pz - gz); const fuF = d / (V0 * Math.max(0.05, Math.cos(_e.el))); out.az = Math.atan2(px - gx, -(pz - gz)); out.el = _e.el; out.tv = _e.tv; out.d = d; out.qx = px; out.qz = pz; out.px = px + ux * fuF; out.pz = pz + uz * fuF; /* px/pz = ponto de IMPACTO previsto; qx/qz = ponto de pontaria compensado */ out.ymax = _e.ymax; out.alto = _e.alto || 0; out.bloq = 0; return out; }
/** Ilhas/montanhas no caminho do arco? Amostra a trajetória (forma quase parabólica com o ápice deslocado pelo arrasto). */
export function arcoBloqueado(T, alturaTerreno, gx, gz, h0, sol) { const n = 14; const dx = sol.px - gx, dz = sol.pz - gz; const ym = Math.max(h0, sol.ymax || h0);
  for (let i = 1; i < n; i++) { const f = i / n; const fa = 0.56; /* ápice depois da metade por causa do arrasto */ const y = f < fa ? h0 + (ym - h0) * (1 - Math.pow(1 - f / fa, 2)) : ym * (1 - Math.pow((f - fa) / (1 - fa), 2));
    if (alturaTerreno(T, gx + dx * f, gz + dz * f) > y - 2) return 1; } return 0; }
