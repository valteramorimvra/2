// Nexo Naval Strike v1.2.26 itens B/H — sons SINTETIZADOS (JS puro, pré-renderizados antes do combate, 0 nós em combate):
// aeronaves no convés (potência máxima/pós-combustor, catapulta a vapor e eletromagnética, fim de curso, enganche/cabo, partida de rotor)
// e QUEDA da coluna d'água (chuva pesada de água caindo no mar, chiado, lavagem grave).
export const SR_AA = 24000;
const DUR = { 'ae:potencia': 9, 'ae:catVapor': 3.6, 'ae:catEM': 3.6, 'ae:catFim': 2.6, 'ae:gancho': 4.2, 'ae:rotorParte': 8, 'respingo:queda': 4.6, 'respingo:quedaG': 6.8, 'canhao_trilho': 3.4 }; /* v1.2.26: canhão eletromagnético (som próprio) */
export const NOMES_AA = Object.keys(DUR);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1; }
// biquad (RBJ) com frequência variável por amostra
function bq() { return { x1: 0, x2: 0, y1: 0, y2: 0 }; }
function bqStep(st, x, tipo, f, Q, sr) { const w = 2 * Math.PI * Math.min(f, sr * 0.45) / sr, cs = Math.cos(w), al = Math.sin(w) / (2 * Q); let b0, b1, b2; const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
  if (tipo === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; } else if (tipo === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; } else { b0 = al; b1 = 0; b2 = -al; }
  const y = (b0 * x + b1 * st.x1 + b2 * st.x2 - a1 * st.y1 - a2 * st.y2) / a0; st.x2 = st.x1; st.x1 = x; st.y2 = st.y1; st.y1 = y; return y; }
const sm = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
function normaliza(y, pico = 0.89) { let m = 0; for (let i = 0; i < y.length; i++) m = Math.max(m, Math.abs(y[i])); const k = m > 0 ? pico / m : 1; for (let i = 0; i < y.length; i++) y[i] *= k;
  const F = Math.round(SR_AA * 0.004); for (let i = 0; i < F; i++) { y[i] *= i / F; y[y.length - 1 - i] *= i / F; } return y; }
export function geraAA(nome, sr = SR_AA) { const N = Math.round((DUR[nome] || 3) * sr), y = new Float32Array(N), R = rng(nome.length * 7919 + nome.charCodeAt(3) * 131); const f1 = bq(), f2 = bq(), f3 = bq(), f4 = bq(); let ph = 0, ph2 = 0, ph3 = 0, pink = 0, cr = 0;
  if (nome === 'ae:potencia') { for (let i = 0; i < N; i++) { const t = i / sr, r = R(); pink = pink * 0.97 + r * 0.03;
      const sp = sm(0, 1.6, t), ab = sm(1.7, 2.3, t), fim = 1 - sm(7, 9, t); const fw = 700 + 2100 * sp; ph += fw / sr; ph2 += fw * 1.98 / sr; ph3 += (40 + 70 * sp) / sr;
      const whine = (Math.sin(2 * Math.PI * ph) * 0.5 + Math.sin(2 * Math.PI * ph2) * 0.22) * (0.25 + 0.35 * sp) * (1 - 0.5 * ab);
      const roar = bqStep(f1, r, 'lp', 260 + 500 * sp + 250 * ab, 0.7, sr) * (0.4 + 1.4 * sp + 1.6 * ab); const mid = bqStep(f2, r, 'bp', 900 + 500 * sp, 0.8, sr) * (0.2 + 0.7 * sp + 0.5 * ab);
      cr = Math.max(cr * 0.93, R() > 0.996 - 0.006 * ab ? 0.6 + 0.4 * Math.abs(R()) : 0); const crack = bqStep(f3, r, 'hp', 1800, 0.7, sr) * cr * ab * 0.9; /* crepitar do pós-combustor */
      const thr = Math.sin(2 * Math.PI * ph3) * 0.35 * ab + pink * 6 * (0.3 + ab); y[i] = (whine + roar + mid + crack + thr) * fim; } }
  else if (nome === 'ae:catVapor' || nome === 'ae:catEM') { const vap = nome === 'ae:catVapor'; const t0 = 0.35, t1 = 2.55; for (let i = 0; i < N; i++) { const t = i / sr, r = R(), u = sm(t0, t1, t), on = t > t0 && t < t1 ? 1 : 0;
      const hiss = bqStep(f1, r, 'hp', vap ? 2500 : 4200, 0.7, sr) * (vap ? (sm(0, 0.25, t) * 0.5 + on * (0.6 + 0.6 * u) + (t >= t1 ? 1.1 * Math.exp(-(t - t1) * 1.6) : 0)) : on * 0.18);
      const run = bqStep(f2, r, 'bp', 160 + 760 * u, 1.6, sr) * on * (0.6 + 1.2 * u) * 1.6; /* lançadeira acelerando no trilho */
      ph += (vap ? 0 : 240 + 2600 * u) / sr; ph2 += (vap ? 0 : 120 + 1300 * u) / sr; const em = vap ? 0 : (Math.sin(2 * Math.PI * ph) * 0.35 + Math.sign(Math.sin(2 * Math.PI * ph2)) * 0.06) * on * (0.4 + 0.6 * u); /* zumbido do motor linear */
      const tk = Math.exp(-Math.max(0, t - t0) * 30) * (t >= t0 ? 1 : 0) * Math.sin(2 * Math.PI * 85 * (t - t0)) * 1.2; /* destrava */
      const stop = t >= t1 ? Math.exp(-(t - t1) * 9) * (Math.sin(2 * Math.PI * 52 * (t - t1)) * 1.6 + bqStep(f3, r, 'lp', 700, 0.8, sr) * 1.2) : 0; y[i] = hiss + run + em + tk + stop; } }
  else if (nome === 'ae:catFim') { for (let i = 0; i < N; i++) { const t = i / sr, r = R(); const th = Math.exp(-t * 7) * Math.sin(2 * Math.PI * (58 - 20 * t) * t) * 1.4;
      const cl = Math.exp(-t * 11) * (Math.sin(2 * Math.PI * 431 * t) * 0.5 + Math.sin(2 * Math.PI * 1127 * t) * 0.32 + Math.sin(2 * Math.PI * 2263 * t) * 0.18) + (t > 0.18 ? Math.exp(-(t - 0.18) * 14) * Math.sin(2 * Math.PI * 690 * t) * 0.3 : 0);
      const hs = bqStep(f1, r, 'hp', 2200, 0.7, sr) * sm(0.05, 0.3, t) * Math.exp(-t * 1.3) * 0.55; const wash = bqStep(f2, r, 'lp', 400, 0.7, sr) * Math.exp(-t * 4) * 0.9; y[i] = th + cl + hs + wash; } }
  else if (nome === 'ae:gancho') { for (let i = 0; i < N; i++) { const t = i / sr, r = R(); const thump = Math.exp(-t * 12) * Math.sin(2 * Math.PI * (75 - 30 * t) * t) * 1.5 + bqStep(f1, r, 'lp', 600, 0.7, sr) * Math.exp(-t * 15) * 1.3;
      const chirp = t > 0.02 && t < 0.25 ? bqStep(f2, r, 'bp', 2400, 3, sr) * Math.exp(-(t - 0.02) * 14) * 1.1 : 0; const cab = t > 0.12 && t < 2.4 ? 1 : 0, u = sm(0.12, 2.3, t); ph += (950 - 650 * u) / sr;
      const whine = cab * (Math.sin(2 * Math.PI * ph) * 0.28 + bqStep(f3, r, 'bp', 1400 - 900 * u, 2, sr) * 0.9) * (1 - u * 0.8); /* cabo de parada desenrolando */
      const sp = sm(0.1, 0.9, t) * (1 - sm(1.8, 4.2, t)); ph2 += (1500 + 900 * sp) / sr; const eng = (bqStep(f4, r, 'lp', 400 + 600 * sp, 0.7, sr) * 1.3 + Math.sin(2 * Math.PI * ph2) * 0.15) * (0.3 + sp); y[i] = thump + chirp + whine + eng; } }
  else if (nome === 'ae:rotorParte') { let phR = 0; for (let i = 0; i < N; i++) { const t = i / sr, r = R(); const st = sm(0, 3, t); ph += (380 + 1500 * st) / sr; ph2 += (760 + 3000 * st) / sr;
      const tur = (Math.sin(2 * Math.PI * ph) * 0.2 + Math.sin(2 * Math.PI * ph2) * 0.1) * (0.3 + 0.7 * st) + bqStep(f1, r, 'hp', 3000, 0.7, sr) * 0.25 * st; /* partida da turbina */
      const fr = 21 * sm(1.2, 7.5, t) ** 0.8; phR += fr / sr; const fase = phR - Math.floor(phR); const pulso = Math.exp(-fase * 18) * (0.2 + 0.8 * sm(1.2, 7, t)); /* batida das pás subindo até ~21 Hz */
      const slap = bqStep(f2, r, 'bp', 280 + 300 * sm(1, 7, t), 1.2, sr) * pulso * 2.6 + Math.sin(2 * Math.PI * phR * 2) * pulso * 0.5; const wash = bqStep(f3, r, 'lp', 300, 0.7, sr) * sm(2, 7, t) * 1.1; y[i] = tur + slap + wash; } }
  else if (nome === 'respingo:queda' || nome === 'respingo:quedaG') { const G = nome.endsWith('G'), D = DUR[nome]; for (let i = 0; i < N; i++) { const t = i / sr, r = R();
      const env = sm(0, G ? 0.35 : 0.25, t) * Math.exp(-Math.max(0, t - (G ? 0.6 : 0.4)) * (G ? 0.62 : 0.9)); /* massa d'água caindo: começa forte e rareia */
      const slab = Math.exp(-t * (G ? 5 : 7)) * (Math.sin(2 * Math.PI * (G ? 48 : 62) * t) * 1.2 + bqStep(f1, r, 'lp', G ? 380 : 520, 0.7, sr) * 2.2); /* impacto pesado da coluna no mar */
      cr = R() > (G ? 0.86 : 0.9) * (1 - 0.0 * t) ? 1 : cr * 0.6; const gotas = bqStep(f2, r * cr, 'bp', 1400 + 3600 * Math.abs(R()), 1.1, sr) * (G ? 1.5 : 1.3); /* chuva grossa: impactos curtos de gotas */
      const chiado = bqStep(f3, r, 'hp', 2600, 0.7, sr) * 0.75 + bqStep(f4, r, 'lp', G ? 260 : 330, 0.6, sr) * (G ? 1.6 : 1.2); /* chiado + lavagem grave */
      y[i] = slab + (gotas + chiado) * env * (1 - sm(D - 0.6, D, t)); } }
  if (nome === 'canhao_trilho') { /* v1.2.26: canhão ELETROMAGNÉTICO — sem propelente: (1) descarga do banco de capacitores (estalo elétrico seco + zumbido de 120 Hz e harmônicos + "zap" descendente),
      (2) onda de choque SUPERSÔNICA do projétil a Mach 6-7 (onda N de ~6 ms, estalo agudo), (3) baque do ar deslocado + ressonância metálica dos trilhos, (4) rolamento grave/eco curto. */
    const f5 = bq(), f6 = bq(); const P = [[612, 0.9, 5.5], [1187, 0.55, 7], [1903, 0.4, 9], [2741, 0.28, 12], [3960, 0.16, 15]];
    for (let i = 0; i < N; i++) { const t = i / sr, r = R(); pink = pink * 0.985 + r * 0.015;
      const pre = t < 0.09 ? sm(0, 0.09, t) * (Math.sin(2 * Math.PI * 120 * t) * 0.35 + Math.sin(2 * Math.PI * 240 * t) * 0.2 + Math.sin(2 * Math.PI * 360 * t) * 0.12) * 0.25 : 0; /* carga final dos capacitores */
      const t0 = t - 0.09; let v = pre;
      if (t0 >= 0) { const zf = 6200 * Math.exp(-t0 * 38) + 420; ph += zf / sr; const zap = Math.sin(2 * Math.PI * ph) * Math.exp(-t0 * 26) * 0.55 + bqStep(f1, r, 'bp', zf * 1.3, 2.2, sr) * Math.exp(-t0 * 30) * 1.4; /* arco/zap descendente */
        const crack = (t0 < 0.004 ? 1 : Math.exp(-(t0 - 0.004) * 260)) * bqStep(f2, r, 'hp', 1800, 0.7, sr) * 2.4; /* estalo elétrico seco */
        const zum = (Math.sin(2 * Math.PI * 120 * t0) * 0.5 + Math.sin(2 * Math.PI * 240 * t0 + 0.4) * 0.3 + Math.sin(2 * Math.PI * 600 * t0) * 0.12) * Math.exp(-t0 * 9) * 0.32; /* zumbido do pulso */
        const tn = t0 - 0.012, nw = tn >= 0 && tn < 0.006 ? (1 - 2 * tn / 0.006) * 1.6 : 0; /* onda N supersônica (sobe-desce-sobe) */
        const choque = nw + bqStep(f3, r, 'hp', 3200, 0.8, sr) * (tn >= 0 ? Math.exp(-tn * 120) : 0) * 1.2;
        const baque = bqStep(f4, r, 'lp', 160 + 300 * Math.exp(-t0 * 6), 0.8, sr) * Math.exp(-t0 * 2.6) * sm(0, 0.01, t0) * 4.2 + Math.sin(2 * Math.PI * (48 - 12 * Math.min(1, t0)) * t0) * Math.exp(-t0 * 3.8) * 0.85; /* v1.2.27: grave mais presente (como canhão grande) */
        let anel = 0; for (const [fq, a, dc] of P) anel += Math.sin(2 * Math.PI * fq * t0 + fq) * a * Math.exp(-t0 * dc); anel *= 0.24; /* trilhos/armadura vibrando */
        const rola = bqStep(f5, pink, 'lp', 200, 0.6, sr) * sm(0.04, 0.3, t0) * (1 - sm(1.4, 3.3, t0)) * 6.2 + bqStep(f6, r, 'bp', 700, 0.7, sr) * sm(0.15, 0.4, t0) * Math.exp(-t0 * 1.8) * 0.28; /* v1.2.27: cauda/eco mais longos */
        v += zap + crack + zum + choque + baque + anel + rola; }
      y[i] = v; } }
  return normaliza(y, nome === 'canhao_trilho' ? 0.92 : nome.startsWith('respingo') ? 0.8 : 0.85); } /* v1.2.27: railgun no mesmo teto dos canhões pesados */
