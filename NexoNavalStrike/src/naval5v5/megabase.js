// v1.2.60 — MEGABASE AERONAVAL FLUTUANTE: integridade por SETORES e efeitos de cada perda (simulação determinística).
// pistas   → zerado: não lança mais aeronaves (crateras na pista)
// tanques  → zerado: explosão em CADEIA dos tanques de combustível (dano extra + incêndio intenso)
// defesas  → zerado: SAM e CIWS da base fora de ação
// terminal → zerado: terminal comercial em chamas (cenário)
export const SETORES = ['pistas', 'tanques', 'defesas', 'terminal'];
/** Setor atingido pelo ponto local (lx = través +BE, lz = ao longo, + popa). */
export function setorDe(n, lx, lz) { const C = n.C; if (lx > C.B * 0.36) return 'terminal'; if (lz > C.L * 0.26 && lx < -C.B * 0.12) return 'tanques';
  for (const c of (n.P && n.P.ciws) || []) if (Math.hypot(c.x - lx, c.z - lz) < 24) return 'defesas'; for (const c of (n.P && n.P.sam) || []) if (Math.hypot(c.x - lx, c.z - lz) < 18) return 'defesas'; return 'pistas'; }
export function setoresDe(n) { return n.setores || (n.setores = { pistas: 1, tanques: 1, defesas: 1, terminal: 1 }); }
/** Chamado pelo dano local (avarias.js) quando o alvo é a base. */
export function danoSetor(sim, n, lx, lz, d) { if (!n.C.base || n.morto) return; const S = setoresDe(n), k = setorDe(n, lx, lz), antes = S[k];
  S[k] = Math.max(0, S[k] - d / (n.C.vida * 0.16)); sim.evento({ t: 'baseDano', id: n.id, setor: k, lx, lz, f: +S[k].toFixed(3), d: Math.round(d) });
  if (antes > 0 && S[k] <= 0) setorCai(sim, n, k); }
function setorCai(sim, n, k) { sim.evento({ t: 'baseSetor', id: n.id, setor: k });
  if (k === 'pistas') n.pistaFora = 1;
  else if (k === 'defesas') { n.samAuto = 0; for (const c of n.ciws || []) c.mun = 0; }
  else if (k === 'tanques') { n.incendio = Math.max(n.incendio || 0, 60); for (let i = 0; i < 4; i++) sim.evento({ t: 'baseTanque', id: n.id, i, atraso: 0.6 + i * 1.1 }); sim.dano(n, n.C.vida * 0.09, null, 'missil', 1); }
  else if (k === 'terminal') n.incendio = Math.max(n.incendio || 0, 30); }
