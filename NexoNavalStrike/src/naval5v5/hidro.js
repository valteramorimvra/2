// Hidrodinâmica de navio pesado (milhares de toneladas), determinística, sem alocação.
// • Propulsão ∝ u·|u| (u = fração do telégrafo) contra arrasto QUADRÁTICO k·v·|v| (+ pequeno termo linear do casco):
//   empuxo máximo = arrasto em vmax; a velocidade de regime em cada degrau é ≈ u·vmax (exata a toda força) e a aceleração cai à medida que v se aproxima dela.
// • A massa entra pelo deslocamento: A0 = aceleração máxima em repouso ≈ 0,6·(5000 t / desl)^0,35 m/s².
// • Frenagem progressiva: ao reduzir o telégrafo as máquinas dão "atrás" (até 45% do empuxo) até a nova velocidade.
// • Giro: raio R(v) = Rmin·(1 + 1,25·(v/vmax)²) — mais aberto em alta velocidade; leme fraco em baixa velocidade
//   (eficácia ∝ escoamento no leme = velocidade + jato do hélice). PIVÔ: hélices em contra-rotação (um avante, outro atrás)
//   giram o navio quase no próprio eixo quando lento.
// • Adorno centrífugo para FORA da curva por lerp suave (entra a 0,8/s, recupera a 0,35/s), sem molas que oscilam.
// • Arfagem/caturro/balanço amortecidos (lerp) sobre a flutuação de Gerstner — sem tremor.
import { FTEL, LEME_MAX } from '../sim/classes.js';
import { clamp, ang } from '../sim/util.js';
import { flutuacaoCasco, dinamicaCasco } from '../sim/ocean.js';
import { PARAM } from '../armasParametros.js';

export const HIDRO = { kR: 1.25, frenagem: 0.45, linear: 0.0015, pivoTaxa: 0.05, adEntra: 0.8, adSai: 0.35, adK: 0.085, flut: 3.2 };

/** Aceleração máxima em repouso (m/s²) pelo deslocamento. */
export const acel0 = (C) => { const mA = C.acelMul || 1; return 0.6 * Math.pow(5000 / (C.desl || 5000), 0.35) * (C.acel ? 0.55 + 0.45 * (C.acel / mA) / 0.8 : 1) * mA; }; /* v1.2.21 item 19: módulo/comandante de aceleração multiplica o EMPUXO inteiro (antes +12% virava +5%) */
/** Coeficiente do arrasto quadrático (por unidade de massa) tal que empuxo máximo = arrasto em vmax. */
export const kArrasto = (C) => acel0(C) / (C.vmax * C.vmax);
/** Desaceleração por arrasto (m/s²) na velocidade v (quadrática + linear pequeno). */
export const arrasto = (C, v) => kArrasto(C) * v * Math.abs(v) + HIDRO.linear * v;
/** Raio de giro (m) com leme todo a uma dada velocidade. */
// v1.2.1: taxa de giro ≈ proporcional à velocidade (raio quase constante, abre um pouco em alta) — calibrado em PARAM.navio
export const raioMin = (C) => PARAM.navio.rRef * 0.95 / C.giro;
export const raioGiro = (C, v) => raioMin(C) * (1 + PARAM.navio.kR * (v / C.vmax) * (v / C.vmax));
/** Eficácia do leme: escoamento no leme (velocidade do casco + jato do hélice). */
export const eficaciaLeme = (C, v, u) => clamp(Math.max(Math.abs(v) / (0.35 * C.vmax), 0.22 * Math.abs(u)), 0, 1);

const _f = { arfagem: 0, caturro: 0, balanco: 0 };
/** Um passo de dinâmica do navio vivo (substitui a cinemática 1.0.0). Retorna dv (para o caimento ao frear). */
/** v1.2.33: fator de inércia de guinada (≥0,8…≤1,6) — porte (deslocamento, log) × tipo: corvetas viram mais rápido; cruzadores e porta-aviões mais devagar. Cacheado em C. */
export function kGiro(C) { if (C._kg) return C._kg; const d = Math.max(300, C.desl || (C.L * C.B * C.T * 0.55) || 3000), T = String(C.est25 || C.estilo || '');
  let k = 1 + 0.22 * Math.log10(d / 3000); k *= C.porta || C.superPA || /capitania|porta/.test(T) ? 1.18 : /cruzador/.test(T) ? 1.1 : /destroi/.test(T) ? 1.04 : /corveta|patrulha|lancha/.test(T) ? 0.9 : 1;
  return (C._kg = Math.max(0.8, Math.min(1.6, k))); }
export function passoHidro(sim, n, dt) {
  const C = n.C;
  if (n.tel !== n.telAlvo) { n.tTel = (n.tTel || 0) + dt; if (n.tTel > 0.35) { n.tel += Math.sign(n.telAlvo - n.tel); n.tTel = 0; } }
  const lento = n.vida < C.vida * 0.25 ? 0.7 : 1; const A0 = acel0(C);
  let u = FTEL[n.tel] * lento; const vAlvo = C.vmax * u;
  // pivô (contra-rotação): os dois eixos se anulam no empuxo e criam momento de guinada
  const piv = n.pivo || 0; if (piv) u *= 0.12;
  let a = arrasto(C, C.vmax) * u * Math.abs(u) - arrasto(C, n.v);
  if (!piv) { if (n.v > vAlvo + 0.4 && n.v > 0.05) a -= A0 * HIDRO.frenagem * clamp((n.v - vAlvo) / 2, 0, 1); else if (n.v < vAlvo - 0.4 && n.v < -0.05) a += A0 * HIDRO.frenagem * clamp((vAlvo - n.v) / 2, 0, 1); }
  { const PN = PARAM.navio, fL = clamp((C.L - PN.Lpequeno) / (PN.Lgrande - PN.Lpequeno), 0, 1), T = PN.tAcel[0] + (PN.tAcel[1] - PN.tAcel[0]) * fL; /* 0→vmax em ~12–18 s conforme o tamanho */
    if (!piv && u > 0 && n.v < vAlvo) a = Math.max(a, (1.83 * C.vmax / T) * ((C.acelMul || 1) / (C.vmaxMul || 1)) * (u * u - (n.v / C.vmax) ** 2)); } /* v1.2.21 item 19: aceleração da curva 0→vmax também × módulo/comandante (antes turbinas/navegação não mudavam a arrancada) */
  { const PD = PARAM.navio, br = (n.deriva || 0) / PD.betaMax; a -= PD.perdaCurva * br * br * arrasto(C, n.v); } /* v1.2.3: perda de velocidade na curva (arrasto do casco de través) */
  n.acelRel = clamp(a / Math.max(1e-3, 1.83 * C.vmax / 15), -1, 1); const vAnt = n.v; n.v += a * dt; if (Math.abs(n.v) < 0.004 && Math.abs(u) < 0.01) n.v = 0;
  if (n.encalheDuro && (n.telAlvo | 0) > 0 && n.v > 0) { n.v = 0; a = 0; n.acelRel = 0; } /* v1.2.29: motor avante contra terra não sobe n.v fantasma */
  n.acel = a;
  // piloto automático de rumo (toque no radar): leme PD até o rumo desejado; um comando manual de leme o desliga
  const PNg = PARAM.navio;
  /* v1.2.17 itens 37/37b — MARCHA A RÉ: com seguimento a ré o piloto de rumo NÃO governa (como nos navios reais, o piloto automático só atua avante); histerese
     entra em −0,25 m/s (≈ −0,5 nó) e sai em +0,05 m/s → sem alternância perto de 0. Antes o piloto mandava leme cheio + propulsor de proa e o navio girava ~2°/s
     logo a −1 nó (o "salto" visto pelo Valter). O rumo pedido fica guardado e volta a valer ao seguir avante. */
  if (n.v < -0.25 || (u < 0 && n.v < 0.3)) n.re = 1; else if (n.v > 0.05 && u >= 0) n.re = 0; /* máquina dando atrás (telégrafo em ré) também desliga o piloto */
  if (n.rumoAlvo != null) n.lemeCmd = n.re ? 0 : clamp(ang(n.rumoAlvo - n.rumo) * PNg.apKp - n.w * PNg.apKd, -1, 1);
  // leme: até 35° em ~1 s (servo). + = boreste (rumo aumenta → vira à direita); − = bombordo
  const lAlvo = n.lemeCmd * LEME_MAX; const tL = PNg.lemeTaxa * (1.12 - 0.24 * clamp((C.L - PNg.Lpequeno) / (PNg.Lgrande - PNg.Lpequeno), 0, 1.4)); n.leme += clamp(lAlvo - n.leme, -tL * dt, tL * dt); /* v1.2.11: servo do leme mais lento nos navios grandes (mais natural) */
  const ef = eficaciaLeme(C, n.v, u / (piv ? 0.12 : 1));
  let wAlvo = n.v >= 0 ? (n.v / raioGiro(C, n.v)) * (n.leme / LEME_MAX) * ef
    /* v1.2.17 itens 37/37b: A RÉ o leme é INVERTIDO (leme a BE → popa para BE, proa para BB: o sinal sai do próprio v < 0), FRACO (≈ 40% — a popa conduz, o
       fluxo da hélice a ré não passa pelo leme, então só conta a velocidade da água: sem o termo de esteira 0,22·|u|) e GRADUAL: ∝ v·|v| desde 0 → contínuo em 0/−1 nó.
       Antes: (v<0 ? −0,5 : 1) mantinha o MESMO sentido de avante e com a esteira da hélice. */
    : (n.v / raioGiro(C, n.v)) * (n.leme / LEME_MAX) * clamp(-n.v / (0.35 * C.vmax), 0, 1) * 0.4;
  { /* efeito transversal da hélice ("prop walk") dando atrás: popa cai para BB (proa a BE) — pequeno em navio de dois eixos (hélices de giro oposto quase se anulam):
       ≤ ~1,2°/min com máquina toda a ré, maior com pouco seguimento; some avante. */ const uRe = Math.max(0, -u) / Math.abs(FTEL[0]); if (uRe > 0 && !piv) wAlvo += uRe * (1.2 / 60) * Math.PI / 180 * (1 - 0.5 * clamp(-n.v / (0.3 * C.vmax), 0, 1)); }
  if (piv) wAlvo += piv * HIDRO.pivoTaxa * C.giro * clamp(1 - Math.abs(n.v) / (0.5 * C.vmax), 0, 1);
  { /* v1.2.16 (item 18): GIRO COM NAVIO PARADO — propulsor de proa (bow thruster) + hélices em sentidos opostos (twin-screw). Taxa por classe:
     *  ~4°/s (L ≤ 60 m) → ~2°/s (140 m) → ~0,6°/s (≥ 300 m); entra suave conforme o leme pedido e some com a velocidade (o leme assume). */
    const vA = Math.abs(n.v), cmd = n.lemeCmd || 0, fV = clamp(1 - vA / Math.max(1.5, 0.3 * C.vmax), 0, 1) * clamp(1 + n.v / 1.0, 0, 1); /* v1.2.17 item 37: com seguimento a ré o giro do propulsor sai GRADUALMENTE (zero a −1 m/s ≈ −1,9 nó, rampa linear: sem degrau em 0/−1 nó); daí para trás quem governa é o leme fraco e invertido */ const alvoT = !piv && n.vida > 0 && Math.abs(cmd) > 0.05 ? cmd * fV : 0; /* v1.2.17 item 37: sentido do giro parado NÃO depende do telégrafo (antes de testar, trocar para ré invertia o giro de uma vez em v = 0) */
    const tS = 1.6 + 2.4 * clamp((C.L - 60) / 240, 0, 1); n.thr = (n.thr || 0) + clamp(alvoT - (n.thr || 0), -dt / tS, dt / tS); /* rampa do motor elétrico do thruster */
    if (Math.abs(n.thr) > 1e-3) { const grau = C.L <= 60 ? 4 : C.L <= 140 ? 4 - 2 * (C.L - 60) / 80 : Math.max(0.6, 2 - 1.4 * (C.L - 140) / 160); wAlvo += n.thr * grau * Math.PI / 180 * (n.vida < C.vida * 0.25 ? 0.7 : 1); } else n.thr = 0; }
  // inércia de guinada: navios maiores demoram mais a começar e a parar de girar
  n.w += (wAlvo - n.w) * Math.min(1, dt / (PNg.tGiro * Math.sqrt(C.L / 142) * kGiro(C))); /* v1.2.33: inércia de guinada por porte e tipo */
  n.rumo = ang(n.rumo + n.w * dt);
  // v1.2.3: DERIVA — na curva a popa escorrega para fora (β ≈ kDeriva·L/R): o vetor velocidade fica fora da proa; resposta com inércia
  { const vAbs = Math.abs(n.v); const LR = vAbs > 0.5 ? (n.w * C.L) / vAbs : 0; const bAlvo = clamp(-PNg.kDeriva * LR, -PNg.betaMax, PNg.betaMax) * clamp(vAbs / 3, 0, 1);
    n.deriva = (n.deriva || 0) + (bAlvo - (n.deriva || 0)) * Math.min(1, dt / PNg.tDeriva); }
  { const vl = n.v * Math.tan(n.deriva); n.x += Math.sin(n.rumo) * n.v * dt + Math.cos(n.rumo) * vl * dt; n.z -= Math.cos(n.rumo) * n.v * dt - Math.sin(n.rumo) * vl * dt; }
  // adorno: para FORA da curva (centrífuga ∝ w·v), lerp suave; volta ao prumo devagar
  // banda de 3–8° na curva conforme o tamanho (pequeno inclina mais), proporcional à centrífuga relativa à curva mais fechada em velocidade máxima
  const PN = PARAM.navio, fL = clamp((C.L - PN.Lpequeno) / (PN.Lgrande - PN.Lpequeno), 0, 1), adMax = (PN.bandaPequeno + (PN.bandaGrande - PN.bandaPequeno) * fL) * Math.PI / 180;
  const wvRef = (C.vmax * C.vmax) / raioGiro(C, C.vmax); const alvoAd = clamp(-adMax * (n.w * Math.abs(n.v)) / Math.max(1e-3, wvRef) * 1.15, -adMax, adMax);
  const taxaAd = (Math.abs(alvoAd) > Math.abs(n.adorno) ? HIDRO.adEntra : HIDRO.adSai) * clamp(Math.sqrt(120 / C.L), 0.6, 1.5); /* v1.2.15: corveta inclina RÁPIDO, encouraçado/porta-aviões devagar (período de balanço ∝ √L) */
  { const wA = taxaAd * 1.6, zA = 1.0; n.adornoV = (n.adornoV || 0) + ((alvoAd - n.adorno) * wA * wA - 2 * zA * wA * (n.adornoV || 0)) * dt; n.adorno += n.adornoV * dt; } /* v1.2.10: adorno com mola amortecida — entra/sai da curva em curva S suave (amortecimento crítico), sem degrau */
  // flutuabilidade amortecida (o casco não acompanha cada marola) + caimento de proa ao frear / popa ao acelerar
  flutuacaoCasco(n.x, n.z, n.rumo, C.L, C.B, sim.t, _f, C.T || 0); /* v1.2.21 item 15: onda integrada sobre TODO o plano de flutuação (antes 4 pontos → ondas curtas 'vazavam' por aliasing: sobe-e-desce sem razão) */ const kf = Math.min(1, dt * HIDRO.flut * (120 / C.L + 0.4) * 0.5);
  const trim = clamp(a / A0, -1.5, 1) * 0.0055; /* v1.2.10: caimento um pouco mais perceptível ao acelerar/frear */
  const est = 1 - PNg.estab * clamp((Math.abs(n.v) / C.vmax - PNg.vEstab * 0.5) / (PNg.vEstab * 0.5), 0, 1) * clamp(n.avaria && n.avaria.motor != null ? n.avaria.motor : 1, 0, 1); /* v1.2.3: estabilizador de aletas (precisa de velocidade) */ const bAnt = n.balanco;
  if (n.flutIni) { /* v1.2.6: mola-amortecedor por grau de liberdade (amostras de proa/popa/bordos) — períodos de navio: arfagem ~4–5 s, caturro ~5–6 s, balanço ~8–10 s; ζ≈0,45 */
    const D = C._dinC || (C._dinC = dinamicaCasco(C)); void kf; /* v1.2.21 item 15: inércia (período natural) e amortecimento POR CLASSE — sem senoide, só a resposta do casco à superfície real */
    const mola = (x, v, alvo, w, z) => v + (w * w * (alvo - x) - 2 * z * w * v) * dt;
    n.arfV = mola(n.arfagem, n.arfV || 0, _f.arfagem, D.wH, D.zH); n.arfagem += n.arfV * dt;
    n.catV = mola(n.caturro, n.catV || 0, _f.caturro + trim, D.wP, D.zP); n.caturro += n.catV * dt;
    n.balV = mola(n.balanco, n.balV || 0, _f.balanco, D.wR, D.zR + 0.25 * (1 - est)); n.balanco += n.balV * dt; } /* estabilizador de aletas = amortecimento extra de balanço (como o real), não um corte do alvo */
  else { n.arfagem = _f.arfagem; n.caturro = _f.caturro; n.balanco = _f.balanco; n.flutIni = 1; }
  n.balancoV = dt > 0 ? (n.balancoV || 0) * 0.9 + 0.1 * Math.abs(n.balanco - bAnt) / dt : 0; n.estab = est;
  return n.v - vAnt;
}
