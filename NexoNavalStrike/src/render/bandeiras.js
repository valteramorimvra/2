// v1.2.0 — Bandeiras extras desenhadas em canvas (sem imagens externas): Alemanha, os 27 estados brasileiros
// (versões SIMPLIFICADAS — geometria e cores principais; brasões/legendas reduzidos a emblemas) e as 26 bandeiras do
// Código Internacional de Sinais (alfabeto náutico). Símbolos oficiais e o código de sinais são de domínio público.
export const PAISES = [['BRA', 'Brasil'], ['EUA', 'Estados Unidos'], ['CHN', 'China'], ['RUS', 'Rússia'], ['UK', 'Reino Unido'], ['DEU', 'Alemanha'], ['ITA', 'Itália'], ['KOR', 'Coreia do Sul']];
export const ESTADOS = [['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'], ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']].map(([k, n]) => ['BR-' + k, n]);
export const SINAIS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => ['SIN-' + l, `Sinal ${l}`]);
export const TODAS = [...PAISES, ...ESTADOS, ...SINAIS];
export const nomeBandeira = (k) => (TODAS.find((b) => b[0] === k) || [k, k])[1];

import { desenhaKOR } from './bandeiraKOR1231.js'; /* v1.2.31 */
const AZ = '#0a3d91', VM = '#d0202e', AM = '#ffd21f', VD = '#00913f', BR = '#ffffff', PT = '#111111';
/** Desenha a bandeira `k` em (0,0,W,H). Retorna false se o código não é tratado aqui. */
export function desenhaBandeira(x, k, W, H) {
  const ret = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  const faixasH = (cores) => cores.forEach((c, i) => ret(c, 0, (i * H) / cores.length, W, H / cores.length + 1));
  const faixasV = (cores) => cores.forEach((c, i) => ret(c, (i * W) / cores.length, 0, W / cores.length + 1, H));
  const poli = (c, pts) => { x.fillStyle = c; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a * W, b * H) : x.moveTo(a * W, b * H))); x.closePath(); x.fill(); };
  const circ = (c, cx, cy, r) => { x.fillStyle = c; x.beginPath(); x.arc(cx * W, cy * H, r * H, 0, Math.PI * 2); x.fill(); };
  const est = (c, cx, cy, r) => { x.fillStyle = c; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.4 : r; x.lineTo(cx * W + Math.cos(a) * rr * H, cy * H + Math.sin(a) * rr * H); } x.closePath(); x.fill(); };
  const faixaDiag = (c, lw, a = [0, 1], b = [1, 0]) => { x.strokeStyle = c; x.lineWidth = lw * H; x.beginPath(); x.moveTo(a[0] * W, a[1] * H); x.lineTo(b[0] * W, b[1] * H); x.stroke(); };
  const brasao = (cx = 0.5, cy = 0.5, r = 0.2) => { circ('#c9a227', cx, cy, r); circ('#2a5aa8', cx, cy, r * 0.72); est(BR, cx, cy, r * 0.42); };
  if (k === 'KOR') { desenhaKOR(x, W, H); return true; } /* v1.2.31 */
  if (k === 'DEU') { faixasH(['#000000', '#dd0000', '#ffce00']); return true; }
  if (k === 'ITA') { faixasV(['#009246', '#ffffff', '#ce2b37']); return true; } /* v1.2.16: tricolor (domínio público) */
  if (k.startsWith('SIN-')) return sinal(k.slice(4));
  switch (k.slice(3)) {
    case 'AC': poli(AM, [[0, 0], [1, 0], [0, 1]]); poli(VD, [[1, 0], [1, 1], [0, 1]]); est(VM, 0.17, 0.25, 0.14); break;
    case 'AL': faixasV([VM, BR, AZ]); brasao(0.5, 0.5, 0.22); break;
    case 'AP': ret(AZ, 0, 0, W, H * 0.5); ret(VD, 0, H * 0.5, W, H * 0.5); ret(BR, 0, H * 0.44, W, H * 0.12); ret(AM, 0, H * 0.47, W, H * 0.06); ret(PT, W * 0.08, H * 0.18, W * 0.14, H * 0.14); ret(BR, W * 0.1, H * 0.2, W * 0.1, H * 0.1); break;
    case 'AM': faixasH([BR, VM, BR]); ret(AZ, 0, 0, W * 0.4, H * 0.46); for (let i = 0; i < 12; i++) est(BR, 0.04 + (i % 6) * 0.064, 0.12 + Math.floor(i / 6) * 0.2, 0.05); break;
    case 'BA': faixasH([BR, VM, BR, VM]); ret(AZ, 0, 0, W * 0.36, H * 0.5); poli(BR, [[0.11, 0.12], [0.25, 0.12], [0.18, 0.4]]); break;
    case 'CE': ret(VD, 0, 0, W, H); poli(AM, [[0.5, 0.09], [0.93, 0.5], [0.5, 0.91], [0.07, 0.5]]); circ(BR, 0.5, 0.5, 0.25); brasao(0.5, 0.5, 0.17); break;
    case 'DF': ret(BR, 0, 0, W, H); ret(VD, W * 0.27, H * 0.08, W * 0.46, H * 0.84); poli(AM, [[0.5, 0.18], [0.56, 0.44], [0.66, 0.5], [0.56, 0.56], [0.5, 0.82], [0.44, 0.56], [0.34, 0.5], [0.44, 0.44]]); break;
    case 'ES': faixasH(['#3b6cc0', BR, '#e8a3b8']); x.fillStyle = '#1f2937'; x.font = `bold ${H * 0.13}px sans-serif`; x.textAlign = 'center'; x.fillText('TRABALHA E CONFIA', W / 2, H * 0.55); break;
    case 'GO': faixasH([VD, AM, VD, AM, VD, AM, VD, AM]); ret(AZ, 0, 0, W * 0.38, H * 0.5); [[0.19, 0.12], [0.26, 0.25], [0.19, 0.4], [0.12, 0.25], [0.21, 0.31]].forEach(([a, b]) => est(BR, a, b, 0.05)); break;
    case 'MA': faixasH([VM, BR, PT, BR, VM, BR, PT, BR, VM]); ret(AZ, 0, 0, W * 0.38, H * 0.45); est(BR, 0.19, 0.225, 0.13); break;
    case 'MT': ret(AZ, 0, 0, W, H); poli(BR, [[0.5, 0.06], [0.95, 0.5], [0.5, 0.94], [0.05, 0.5]]); circ(VD, 0.5, 0.5, 0.26); est(AM, 0.5, 0.5, 0.2); break;
    case 'MS': poli(VD, [[0, 0.35], [0, 1], [0.6, 1]]); poli('#2b5fb4', [[0.35, 0], [1, 0], [1, 0.75]]); poli(BR, [[0, 0], [0.35, 0], [1, 0.75], [1, 1], [0.6, 1], [0, 0.35]]); est(AM, 0.8, 0.25, 0.14); break;
    case 'MG': ret(BR, 0, 0, W, H); poli(VM, [[0.5, 0.2], [0.68, 0.62], [0.32, 0.62]]); poli(BR, [[0.5, 0.33], [0.6, 0.56], [0.4, 0.56]]); x.fillStyle = VM; x.font = `bold ${H * 0.09}px serif`; x.textAlign = 'center'; x.fillText('LIBERTAS QVÆ SERA TAMEN', W / 2, H * 0.84); break;
    case 'PA': ret(VM, 0, 0, W, H); faixaDiag(BR, 0.28, [0, 0], [1, 1]); est(AZ, 0.5, 0.5, 0.15); break;
    case 'PB': ret(PT, 0, 0, W / 3, H); ret(VM, W / 3, 0, W * 2 / 3, H); x.fillStyle = BR; x.font = `bold ${H * 0.3}px sans-serif`; x.textAlign = 'center'; x.fillText('NEGO', W * 0.66, H * 0.62); break;
    case 'PR': ret(VD, 0, 0, W, H); poli(BR, [[0, 0], [0.18, 0], [1, 0.82], [1, 1], [0.82, 1], [0, 0.18]]); circ('#2350a5', 0.5, 0.5, 0.25); faixaDiag(BR, 0.05, [0.33, 0.55], [0.67, 0.42]); for (let i = 0; i < 5; i++) est(BR, 0.42 + i * 0.04, 0.58 - (i % 2) * 0.06 - i * 0.02, 0.04); break;
    case 'PE': ret('#1a3fa0', 0, 0, W, H * 0.62); ret(BR, 0, H * 0.62, W, H * 0.38); x.lineWidth = H * 0.05; ['#c0392b', AM, VD].forEach((c, i) => { x.strokeStyle = c; x.beginPath(); x.arc(W / 2, H * 0.42, H * (0.24 - i * 0.05), Math.PI, 0); x.stroke(); }); est(AM, 0.5, 0.15, 0.08); circ(AM, 0.5, 0.42, 0.08); ret(VM, W * 0.49, H * 0.66, W * 0.02, H * 0.26); ret(VM, W * 0.46, H * 0.72, W * 0.08, H * 0.04); break;
    case 'PI': faixasH([VD, AM, VD, AM, VD, AM]); ret(AZ, 0, 0, W * 0.38, H * 0.5); est(BR, 0.19, 0.25, 0.16); break;
    case 'RJ': ret(BR, 0, 0, W, H); ret(AZ, 0, 0, W / 2, H / 2); ret(AZ, W / 2, H / 2, W / 2, H / 2); brasao(0.5, 0.5, 0.24); break;
    case 'RN': ret(VD, 0, 0, W, H / 2); ret(BR, 0, H / 2, W, H / 2); brasao(0.5, 0.5, 0.24); break;
    case 'RS': poli(VD, [[0, 0], [0.62, 0], [0, 1]]); poli(AM, [[1, 0], [1, 1], [0.38, 1]]); poli(VM, [[0.62, 0], [1, 0], [0.38, 1], [0, 1]]); brasao(0.5, 0.5, 0.22); break;
    case 'RO': ret(AZ, 0, 0, W, H * 0.62); ret(VD, 0, H * 0.62, W, H * 0.38); poli(AM, [[0, 0.62], [1, 0.62], [0.5, 1]]); est(BR, 0.5, 0.42, 0.14); break;
    case 'RR': ret('#2f6fd0', 0, 0, W, H * 0.5); ret(VD, 0, H * 0.5, W, H * 0.5); poli(BR, [[0.35, 0], [0.65, 0], [0.42, 1], [0.12, 1]]); ret(VM, 0, H * 0.82, W, H * 0.05); est(AM, 0.4, 0.3, 0.13); break;
    case 'SC': faixasH([VM, BR, VM]); poli(VD, [[0.5, 0.1], [0.8, 0.5], [0.5, 0.9], [0.2, 0.5]]); est(BR, 0.5, 0.5, 0.18); break;
    case 'SP': for (let i = 0; i < 13; i++) ret(i % 2 ? BR : PT, 0, (i * H) / 13, W, H / 13 + 1); ret(VM, 0, 0, W * 0.4, H * 7 / 13); circ(BR, 0.2, 0.27, 0.17); circ('#1f4fa0', 0.2, 0.27, 0.11); [[0.05, 0.05], [0.35, 0.05], [0.05, 0.49], [0.35, 0.49]].forEach(([a, b]) => est(AM, a, b, 0.045)); break;
    case 'SE': faixasH([VD, AM, VD, AM]); ret(AZ, 0, 0, W * 0.36, H * 0.5); [[0.18, 0.1], [0.27, 0.22], [0.18, 0.4], [0.09, 0.22], [0.2, 0.28]].forEach(([a, b]) => est(BR, a, b, 0.05)); break;
    case 'TO': poli('#2b5fb4', [[0, 0], [0.72, 0], [0, 0.82]]); poli(AM, [[1, 0.18], [1, 1], [0.28, 1]]); poli(BR, [[0.72, 0], [1, 0], [1, 0.18], [0.28, 1], [0, 1], [0, 0.82]]); circ(AM, 0.5, 0.5, 0.13); break;
    default: return false;
  }
  return true;
  function sinal(l) { // Código Internacional de Sinais
    const xadrez = (n, a, b) => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) ret((i + j) % 2 ? b : a, (i * W) / n, (j * H) / n, W / n + 1, H / n + 1); };
    const cruz = (c, w) => { ret(c, W / 2 - (w * H) / 2, 0, w * H, H); ret(c, 0, H / 2 - (w * H) / 2, W, w * H); };
    const aspa = (c, w) => { faixaDiag(c, w, [0, 0], [1, 1]); faixaDiag(c, w, [0, 1], [1, 0]); };
    const rabo = () => { x.save(); x.globalCompositeOperation = 'destination-out'; poli('#000', [[1, 0], [0.75, 0.5], [1, 1]]); x.restore(); }; // corte em “rabo de andorinha”
    const A = AZ, R = VM, Y = AM, W2 = BR, K = PT;
    switch (l) {
      case 'A': ret(W2, 0, 0, W / 2, H); ret(A, W / 2, 0, W / 2, H); rabo(); break;
      case 'B': ret(R, 0, 0, W, H); rabo(); break;
      case 'C': faixasH([A, W2, R, W2, A]); break; case 'D': ret(Y, 0, 0, W, H); ret(A, 0, H * 0.25, W, H * 0.5); break; case 'E': ret(A, 0, 0, W, H / 2); ret(R, 0, H / 2, W, H / 2); break;
      case 'F': ret(W2, 0, 0, W, H); poli(R, [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]]); break; case 'G': faixasV([Y, A, Y, A, Y, A]); break; case 'H': faixasV([W2, R]); break;
      case 'I': ret(Y, 0, 0, W, H); circ(K, 0.5, 0.5, 0.28); break; case 'J': faixasH([A, W2, A]); break; case 'K': faixasV([Y, A]); break;
      case 'L': xadrez(2, Y, K); break; case 'M': ret(A, 0, 0, W, H); aspa(W2, 0.2); break; case 'N': xadrez(4, A, W2); break;
      case 'O': poli(R, [[0, 0], [1, 0], [1, 1]]); poli(Y, [[0, 0], [1, 1], [0, 1]]); break; case 'P': ret(A, 0, 0, W, H); ret(W2, W / 3, H / 3, W / 3, H / 3); break; case 'Q': ret(Y, 0, 0, W, H); break;
      case 'R': ret(R, 0, 0, W, H); cruz(Y, 0.2); break; case 'S': ret(W2, 0, 0, W, H); ret(A, W / 3, H / 3, W / 3, H / 3); break; case 'T': faixasV([R, W2, A]); break;
      case 'U': xadrez(2, R, W2); break; case 'V': ret(W2, 0, 0, W, H); aspa(R, 0.2); break; case 'W': ret(A, 0, 0, W, H); ret(W2, W / 6, H / 6, (W * 2) / 3, (H * 2) / 3); ret(R, W / 3, H / 3, W / 3, H / 3); break;
      case 'X': ret(W2, 0, 0, W, H); cruz(A, 0.2); break; case 'Y': ret(Y, 0, 0, W, H); for (let i = -3; i < 6; i += 2) poli(R, [[i / 5, 1], [(i + 1) / 5, 1], [(i + 2) / 5, 0], [(i + 1) / 5, 0]]); break;
      case 'Z': poli(Y, [[0, 0], [1, 0], [0.5, 0.5]]); poli(A, [[1, 0], [1, 1], [0.5, 0.5]]); poli(R, [[1, 1], [0, 1], [0.5, 0.5]]); poli(K, [[0, 1], [0, 0], [0.5, 0.5]]); break;
      default: return false;
    }
    return true;
  }
}
