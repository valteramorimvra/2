// v1.3.57 (Valter) — ORIGEM DO DANO: quem fez cada ponto de dano do seu lado — o NAVIO, a AERONAVE que você PILOTAVA ou as aeronaves na IA (bots).
// O projétil da aeronave leva org = { pil, nome, arma, tick }; world.dano soma em dono.stats.fontes[navio|pil|bot] por arma (só conta).
export function orgDe(sim, a, arma) { const n = sim.navios[a.dono], jog = !!(n && n.papel === 'jogador');
  const pil = jog && (a.ctrl != null ? a.ctrl === 'jog' : !!a.manual && !(a.lider >= 0));
  return { pil: pil ? 1 : 0, nome: (a.H && a.H.nome) || (a.hidro ? 'Hidroavião' : 'Urubu-rei'), arma: arma || 'missil', tick: sim.tick }; }
/** Projétil reaproveitado do pool: a origem só vale se foi marcada no lançamento (mesmo passo ou o anterior). */
export function orgValida(sim, p) { if (!p._viv) { p._viv = 1; if (p.org && p.org.tick < sim.tick - 1) p.org = null; } return p.org || null; }
const CAT = { missil: 'missil', torpedo: 'torpedo', nuclear: 'nuclear', bomba: 'nuclear', canhao: 'canhao', foguete: 'foguete', mg: 'canhao', heli: 'canhao', porta: 'canhao' };
export function registraFonte(dono, org, como, apl) { if (!dono || !(apl > 0)) return; const k = org ? (org.pil ? 'pil' : 'bot') : 'navio', F = dono.stats.fontes || (dono.stats.fontes = {}), f = F[k] || (F[k] = { tot: 0, armas: {}, nomes: {} });
  const a = org ? (CAT[org.arma] || 'missil') : (CAT[como] || 'canhao'); f.tot += apl; f.armas[a] = (f.armas[a] || 0) + apl; if (org) f.nomes[org.nome] = (f.nomes[org.nome] || 0) + apl; }
