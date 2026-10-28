// v1.2.18 itens 1/2/3 — BANCO DE SONS SINTETIZADOS EM JS PURO (sem arquivo/licença, sem OfflineAudioContext, determinístico).
// Gerado UMA vez no carregamento (em fatias, sem travar a UI) e tocado por fontes persistentes (motor) ou pelo mixer/pool (granadas).
// Tudo com energia na faixa AUDÍVEL DE ALTO-FALANTE DE CELULAR (400 Hz–8 kHz) além do grave físico — o motor antigo era quase todo < 300 Hz
// e ficava inaudível no aparelho (medido: +0,2 dB no mix real da partida; ver PROGRESSO-1.2.18.md).
// Laços: comprimento fixo com todas as periodicidades em ciclos INTEIROS e emenda em crossfade de igual potência (sem clique).

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 * 2 - 1; }; }
/** Biquad RBJ (estado próprio) — processa amostra a amostra. */
function bq(tipo, f, Q, sr) { const w = 2 * Math.PI * f / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * Q); let b0, b1, b2, a0, a1, a2;
  if (tipo === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (tipo === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
  a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; }
const TAU = Math.PI * 2;
/** Fecha o laço: gera N + X amostras e faz crossfade de igual potência dos X finais sobre o começo. */
function laco(N, X, gen) { const t = new Float32Array(N + X); for (let i = 0; i < N + X; i++) t[i] = gen(i); const a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = t[i]; for (let i = 0; i < X; i++) { const u = i / X; a[i] = t[i] * Math.sqrt(u) + t[N + i] * Math.sqrt(1 - u); } return a; }
function normaliza(a, alvo) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; const r = Math.sqrt(s / a.length) || 1; const k = alvo / r; for (let i = 0; i < a.length; i++) a[i] *= k; let p = 0; for (let i = 0; i < a.length; i++) p = Math.max(p, Math.abs(a[i])); if (p > 0.98) { const q = 0.98 / p; for (let i = 0; i < a.length; i++) a[i] *= q; } return a; }

/** Receitas: cada uma devolve Float32Array mono. sr = taxa do contexto. Duração de laço 4 s (múltiplo de todas as periodicidades). */
export const RECEITAS = {
  /** DIESEL de média rotação (marcha nominal = 25 explosões/s a rate 1): cada combustão = batida com ressonâncias do bloco (180/420/950/1900/3100 Hz),
   *  "matraca" das válvulas/injetores (2,5–4,5 kHz), assobio do TURBOCOMPRESSOR (5,2 kHz, harmônico inteiro do laço) e ronco grave do escape. */
  'nav:diesel'(sr) { const N = sr * 4, X = Math.round(sr * 0.25), r = rng(11), fF = 25, per = sr / fF; const res = [[180, 0.012, 0.5], [420, 0.008, 0.45], [950, 0.005, 0.38], [1900, 0.0032, 0.28], [3100, 0.0022, 0.2]];
    const lpEsc = bq('lp', 160, 0.8, sr), bpV = bq('bp', 3400, 1.6, sr), hpS = bq('hp', 900, 0.7, sr); const jit = []; for (let k = 0; k < 200; k++) jit.push(0.75 + 0.5 * Math.abs(r()));
    return normaliza(laco(N, X, (i) => { const k = Math.floor(i / per), ph = (i - k * per) / sr, J = jit[k % 100] * (k % 6 === 0 ? 1.15 : 1); let s = 0;
      for (const [f, tau, a] of res) s += a * J * Math.exp(-ph / tau) * Math.sin(TAU * f * ph + k * 0.7); const n = r();
      s += 0.55 * Math.exp(-ph / 0.004) * bpV(n) * J; /* matraca de válvula */ s += 0.9 * lpEsc(n * Math.exp(-ph / 0.018)) * J; /* pulso do escape */
      s += 0.05 * Math.sin(TAU * 5200 * i / sr) * (0.8 + 0.2 * Math.sin(TAU * 0.5 * i / sr)) + 0.02 * Math.sin(TAU * 10400 * i / sr); /* turbo */ s += 0.05 * hpS(r()); return s; }), 0.25); },
  /** TURBINA A GÁS (COGAG/CODOG): zumbido do compressor (passagem de pá 3 kHz + 2×, batimento entre estágios), rugido da combustão (ruído rosado LP 1,4 kHz) e sopro da tomada de ar. */
  'nav:turbina'(sr) { const N = sr * 4, X = Math.round(sr * 0.3), r = rng(23), lp = bq('lp', 1400, 0.6, sr), lp2 = bq('lp', 380, 0.7, sr), bpA = bq('bp', 2200, 0.9, sr);
    return normaliza(laco(N, X, (i) => { const t = i / sr, n = r(); return 0.11 * Math.sin(TAU * 3000 * t + 0.4 * Math.sin(TAU * 3 * t)) + 0.06 * Math.sin(TAU * 3020 * t) + 0.05 * Math.sin(TAU * 6000 * t) + 0.03 * Math.sin(TAU * 1500.25 * t) + 0.9 * lp(n) + 0.8 * lp2(n) + 0.35 * bpA(n); }), 0.25); },
  /** VAPOR (navio grande): chiado da turbina de vapor, ZUNIDO da engrenagem redutora (880 Hz + 1760 Hz) e rumor grave das caldeiras. */
  'nav:vapor'(sr) { const N = sr * 4, X = Math.round(sr * 0.3), r = rng(37), hp = bq('hp', 2400, 0.7, sr), lp = bq('lp', 220, 0.8, sr), bp = bq('bp', 650, 1.1, sr);
    return normaliza(laco(N, X, (i) => { const t = i / sr, n = r(); return 0.5 * hp(n) + 0.09 * Math.sin(TAU * 880 * t) * (0.85 + 0.15 * Math.sin(TAU * 2 * t)) + 0.035 * Math.sin(TAU * 1760 * t) + 1.2 * lp(n) + 0.4 * bp(n); }), 0.25); },
  /** ONDA DE PROA: chiado do casco cortando a água (BP 500 Hz–4 kHz) com rajadas irregulares de borrifo (envelopes aleatórios) e marulho. */
  'nav:proa'(sr) { const N = sr * 4, X = Math.round(sr * 0.4), r = rng(41), b1 = bq('bp', 900, 0.6, sr), b2 = bq('bp', 2600, 0.8, sr), hp = bq('hp', 4500, 0.7, sr), lpE = bq('lp', 3, 0.7, sr), lpE2 = bq('lp', 9, 0.7, sr), lpM = bq('lp', 380, 0.7, sr);
    return normaliza(laco(N, X, (i) => { const n = r(), e = Math.max(0, 0.55 + 18 * lpE(r())), e2 = Math.max(0, 0.3 + 30 * lpE2(r())); return (0.9 * b1(n) + 0.3 * b2(n)) * e + 0.09 * hp(n) * e2 + 0.5 * lpM(n) * e; }), 0.25); }, /* v1.2.21 item 4: mais marulho grave (lpM 380 Hz), menos chiado acima de 2,5 kHz */
  /** ESTEIRA/HÉLICES: água revolvida (LP 1,6 kHz) pulsando na frequência de PÁ (5 Hz a rate 1, 20 ciclos no laço), batida grave das pás e chiado de CAVITAÇÃO (estalos 3–7 kHz). */
  'nav:esteira'(sr) { const N = sr * 4, X = Math.round(sr * 0.3), r = rng(53), lp = bq('lp', 1600, 0.7, sr), lpG = bq('lp', 140, 0.9, sr), bpC = bq('bp', 5000, 1.2, sr), u = rng(54); let cv = 0;
    return normaliza(laco(N, X, (i) => { const t = i / sr, n = r(), am = 0.62 + 0.38 * Math.pow(0.5 + 0.5 * Math.sin(TAU * 5 * t), 2); cv = Math.max(cv * 0.996, (u() * 0.5 + 0.5) < 0.004 * am ? 0.6 + 0.4 * Math.abs(u()) : 0); return lp(n) * am * 0.9 + lpG(n) * am * 2.2 + bpC(n) * cv * 0.8; }), 0.25); },
  /** THRUSTER DE PROA: zumbido do motor elétrico (620 Hz + 1240 + 1860, ripple 120 Hz) + lavagem turbulenta da hélice no túnel (BP 300–1500 Hz) com batimento de pá. */
  'nav:thruster'(sr) { const N = sr * 4, X = Math.round(sr * 0.3), r = rng(67), bp = bq('bp', 700, 0.7, sr), bp2 = bq('bp', 1500, 1.0, sr);
    return normaliza(laco(N, X, (i) => { const t = i / sr, n = r(), am = 0.75 + 0.25 * Math.sin(TAU * 18 * t); return (0.12 * Math.sin(TAU * 620 * t) + 0.06 * Math.sin(TAU * 1240 * t) + 0.03 * Math.sin(TAU * 1860 * t)) * (0.85 + 0.15 * Math.sin(TAU * 120 * t)) + (bp(n) * 0.9 + bp2(n) * 0.4) * am; }), 0.25); },
  /** LANÇA-GRANADAS (disparo): estalo SECO do propelente (HP 3–9 kHz, 6 ms), baque do tubo (corpo 160–700 Hz), anel metálico do tubo (1,6/2,45 kHz),
   *  sopro dos gases (BP 1,2 kHz) e o "fiu" da granada se afastando (assobio caindo de 2,6 para 1,9 kHz). 1,3 s. */
  'gr:lanc'(sr) { const N = Math.round(sr * 1.3), r = rng(71), hp = bq('hp', 3000, 0.7, sr), bpC = bq('bp', 380, 0.8, sr), bpG = bq('bp', 1200, 0.9, sr), bpW = bq('bp', 2300, 9, sr), a = new Float32Array(N); let fw = 0;
    for (let i = 0; i < N; i++) { const t = i / sr, n = r(); let s = 0; s += 1.6 * hp(n) * Math.exp(-t / 0.006); s += 2.2 * bpC(n) * Math.exp(-t / 0.045) * (t < 0.002 ? t / 0.002 : 1); s += 0.9 * Math.sin(TAU * (90 - 40 * Math.min(1, t / 0.2)) * t) * Math.exp(-t / 0.09);
      s += (0.16 * Math.sin(TAU * 1610 * t) + 0.09 * Math.sin(TAU * 2450 * t)) * Math.exp(-t / 0.22); s += 0.8 * bpG(n) * Math.exp(-t / 0.14) * Math.min(1, t / 0.004);
      fw = 2600 - 700 * Math.min(1, t / 1.1); const ew = t < 0.05 ? 0 : Math.min(1, (t - 0.05) / 0.08) * Math.exp(-(t - 0.05) / 0.45); s += 3.5 * bpW(n) * ew + 0.05 * Math.sin(TAU * fw * t) * ew; a[i] = s; }
    return normaliza(a, 0.2); },
  /** GRANADA CHEGANDO (laço de 2 s): ASSOBIO da granada (ruído de banda estreita Q 12 em 1,8 kHz + tom com leve vibrato de rotação 14 Hz) + RAJADA DE VENTO
   *  do escoamento (BP 600–3000 Hz, turbulento). O tom sobe (rate) e o volume cresce com a aproximação, Doppler por rate, posicional por pan. */
  'gr:assobio'(sr) { const N = sr * 2, X = Math.round(sr * 0.25), r = rng(83), bpW = bq('bp', 1800, 12, sr), bpW2 = bq('bp', 3600, 10, sr), bpV = bq('bp', 1300, 0.6, sr), lpT = bq('lp', 22, 0.7, sr), bpR = bq('bp', 520, 0.8, sr);
    return normaliza(laco(N, X, (i) => { const t = i / sr, n = r(), tur = 0.7 + 8 * lpT(r()); return 2.4 * bpW(n) + 0.35 * bpW2(n) + 0.11 * Math.sin(TAU * 1800 * t + 0.6 * Math.sin(TAU * 14 * t)) + 0.6 * bpV(n) * Math.max(0.2, tur) + 0.9 * bpR(n) * Math.max(0.3, tur); }), 0.25); }, /* v1.2.21 item 5: assobio mais tonal e "rasgar do ar" grave (BP 520 Hz), menos chiado agudo (3,6 kHz −11 dB) */
  /* fiscal nukefumaca (item 4): ASSOBIO DE BOMBA CAINDO (laço 2 s, mono) — não é "apito": 4 parciais inarmônicos (aletas/estabilizadores) com tremor lento de turbulência e leve batimento,
     + sopro de banda estreita (BP Q alto, 1,2 e 2,5 kHz) e rasgo de ar grave (BP 600 Hz) modulados por turbulência; periodicidades em ciclos inteiros (laço sem clique). Tom-base 1,0 kHz p/ tocar a 0,7–1,8× (Doppler/velocidade). */
  'nk:assobio'(sr) { const N = sr * 2, X = Math.round(sr * 0.25), r = rng(2611), r2 = rng(97), bp1 = bq('bp', 1200, 22, sr), bp2 = bq('bp', 2500, 16, sr), bp3 = bq('bp', 600, 1.2, sr), bp4 = bq('bp', 3800, 9, sr), lpT = bq('lp', 9, 0.7, sr), lpU = bq('lp', 14, 0.7, sr);
    return normaliza(laco(N, X, (i) => { const t = i / sr, n = r(), tu = Math.max(0.25, 0.75 + 7 * lpT(r2())), tv = Math.max(0.3, 0.8 + 6 * lpU(r2()));
      const w = 1 + 0.004 * Math.sin(TAU * 3 * t) + 0.003 * Math.sin(TAU * 7 * t + 1);
      const ton = 0.30 * Math.sin(TAU * 1000 * t * w + 0.5 * Math.sin(TAU * 6 * t)) * (0.7 + 0.3 * Math.sin(TAU * 2 * t)) + 0.20 * Math.sin(TAU * 1510 * t * w + 0.3 * Math.sin(TAU * 5 * t + 1)) * (0.7 + 0.3 * Math.sin(TAU * 3 * t + 2)) + 0.12 * Math.sin(TAU * 2020 * t * w) * tu * 0.5 + 0.07 * Math.sin(TAU * 2760.5 * t * w + 1.3) * tv * 0.5;
      return ton + 1.5 * bp1(n) * tu + 0.9 * bp2(n) * tv + 0.55 * bp3(n) * tu + 0.18 * bp4(n) * tv; }), 0.3); },
  /** IMPACTO DE GRANADA perto: estalo da detonação (HP, 4 ms), estrondo (corpo 120–900 Hz), estilhaços metálicos (BP 3–6 kHz, estalos), coluna d'água caindo (chiado 1,5–5 kHz) e cauda grave. 2,6 s. */
  'gr:impacto'(sr) { const N = Math.round(sr * 2.6), r = rng(97), hp = bq('hp', 2500, 0.7, sr), bpB = bq('bp', 420, 0.6, sr), bpE = bq('bp', 4200, 1.5, sr), bpA = bq('bp', 2600, 0.5, sr), lp = bq('lp', 260, 0.8, sr), u = rng(98), a = new Float32Array(N); let est = 0;
    for (let i = 0; i < N; i++) { const t = i / sr, n = r(); let s = 2.2 * hp(n) * Math.exp(-t / 0.004) + 2.4 * bpB(n) * Math.exp(-t / 0.16) * Math.min(1, t / 0.0015) + 1.0 * Math.sin(TAU * (70 - 35 * Math.min(1, t / 0.5)) * t) * Math.exp(-t / 0.35);
      est = Math.max(est * 0.993, t < 0.6 && (u() * 0.5 + 0.5) < 0.002 * (1 - t / 0.6) ? 0.5 + 0.5 * Math.abs(u()) : 0); s += bpE(n) * est * 1.4; s += 1.1 * bpA(n) * (t > 0.25 ? Math.min(1, (t - 0.25) / 0.3) * Math.exp(-(t - 0.25) / 0.7) : 0); s += 1.6 * lp(n) * Math.exp(-t / 0.9); a[i] = s; }
    return normaliza(a, 0.2); },
};
/** Gera o banco em fatias (cede a UI entre receitas). criaBuf(nome, Float32Array) recebe cada uma pronta. Devolve ms gastos. */
export async function geraBanco(sr, criaBuf, nomes = Object.keys(RECEITAS)) { const t0 = performance.now(); for (const n of nomes) { await new Promise((ok) => setTimeout(ok, 0)); try { criaBuf(n, RECEITAS[n](sr)); } catch (e) { criaBuf(n, null, e); } } return Math.round(performance.now() - t0); }
