// Abstração de comandos: TUDO que um jogador (humano, bot ou remoto) pode fazer vira um comando serializável.
// A simulação só muda via comandos aplicados num tick → replays e multijogador por lockstep ficam possíveis.
export const TIPOS = {
  telegrafo: ['v'], leme: ['v'], mira: ['az', 'dist', 'px', 'pz', 'h', 'elD'] /* v1.2.25 item 1 */, miraLivre: ['v'], /* v1.2.14: MIRA LIVRE — ponto exato (mar ou casco) */ travar: ['alvo'], canhao: ['modo'], missil: ['alvo', 'n', 'az'],
  torpedo: ['alvo'], torpModo: ['v'], contramedida: [], radar: ['v'],
  auto: ['v'], pivo: ['v'], sam: ['v'], // v1.1.0: AUTO-FOGO, pivô por contra-rotação, defesa SAM automática
  reparo: [], uav: [], esquadrilha: ['m'] /* v1.2.32: 1 = metade, 2 = todas */, hidro: ['tipo'], hdPil: ['v'], hdMissil: [], hdTorp: [], hdFlare: [], hdVolta: [], /* v1.2.39: hidroaviões */ /* v1.2.16: LANÇAR ESQUADRILHA (faltava na lista → comando descartado) */ heliLanca: ['k'], heliCtrl: ['k', 'jx', 'jy', 'alt'], heliFogo: ['k'], heliVolta: ['k'], heliFlare: ['k'], iaNavio: ['v'], controle: ['k'], cons: ['k'], rbu: ['alvo', 'canal'], rumo: ['v'], optica: ['v'], nuclear: ['alvo', 'px', 'pz'], nkPiloto: ['v'], nkCtl: ['jx', 'jy'], nkTrava: ['alvo'], nkSolta: [], nkEspera: ['v'], nkThr: ['v'], nkMiraSolo: ['px', 'pz'], /* v1.2.28: acel + mira solo */ /* v1.2.26 item K */ /* v1.2.26: bombardeiro nuclear */ // v1.2.0: reparo, VANT, helicópteros
};
/** Valida e normaliza um comando vindo de qualquer fonte (inclusive rede). Devolve null se inválido. */
export function valida(c) {
  if (!c || typeof c !== 'object' || !(c.t in TIPOS) || !Number.isInteger(c.id) || c.id < 0 || c.id > 63) return null;
  const o = { id: c.id, t: c.t };
  for (const k of TIPOS[c.t]) if (k in c) { const v = c[k]; if (typeof v === 'number' && Number.isFinite(v)) o[k] = v; else if (typeof v === 'string' && v.length < 16) o[k] = v; else if (typeof v === 'boolean') o[k] = v ? 1 : 0; }
  return o;
}
export const serializa = (tick, cmds) => JSON.stringify({ k: tick, c: cmds });
export const desserializa = (s) => { try { const o = JSON.parse(s); return { tick: o.k | 0, cmds: (o.c || []).map(valida).filter(Boolean) }; } catch (e) { return null; } };
