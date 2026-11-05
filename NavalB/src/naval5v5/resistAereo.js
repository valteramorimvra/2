// v1.2.30 item 15b — RESISTÊNCIA do armamento de AERONAVE (míssil; o torpedo leve de aeronave quase não é interceptado — i ≈ 0–2% medido — e não é tocado) à defesa aérea. Decisão Valter 20:14/20:36.
// O fator multiplica a PROBABILIDADE DE ABATE de CADA sistema (CIWS, SAM, laser, 30 mm) com o MESMO valor: o sistema mais forte continua derrubando
// mais que o fraco, e o navio com mais AA derruba claramente mais que o de AA fraca (nenhum fica imune). Não é chance fixa de sobreviver.
// Só atua em arma de aeronave (m.heli). Míssil e torpedo de navio, e as próprias aeronaves (abatidas por CIWS/SAM/laser/30 mm), ficam como estão.
export const RES = { pkMissil: 0.2, velMissil: 1 };

/** Fator de resistência da arma 'a' (míssil ou torpedo) de aeronave; 1 para qualquer outra coisa. */
export const resAr = (a) => (a && a.heli ? a.resAr || 1 : 1);
/** Marca o míssil de aeronave recém-lançado. velMissil > 1 = voo mais rápido (janela de engajamento menor, efeito físico). */
export function resistMissil(m) { m.resAr = RES.pkMissil; if (RES.velMissil !== 1 && m.perfil) m.perfil = Object.assign({}, m.perfil, { v: m.perfil.v * RES.velMissil, vt: m.perfil.vt * RES.velMissil }); }
