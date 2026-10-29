// v1.2.61 — CATÁLOGO DE AERONAVES como unidades próprias (hangar 3D, loja, árvore tecnológica).
// Nomes próprios (fictícios, aves e bichos do Brasil) inspirados em classes reais — evita marcas registradas (Play Store).
// Os modelos 3D e a física já existem no jogo: modelo.heli → sim/classes (HELIS) e render/aereo3d · modelo.hidro → sim/hidroaviao.
import { HELIS, ORDEM_HELIS } from './sim/classes.js';
import { HIDROS } from './sim/hidroaviao.js';

export const CAT_AERO = [['caca', 'Caças'], ['heli', 'Helicópteros'], ['hidro', 'Hidroaviões'], ['bomb', 'Bombardeiro'], ['apoio', 'Alerta aéreo e drones']];
/* id, categoria, tier, preço, modelo, inspiração (classe real), papel, mísseis/armas de exibição */
const A = (id, cat, tier, preco, modelo, insp, papel, armas) => ({ id, cat, tier, preco, modelo, insp, papel, armas });
export const AERONAVES = [
  A('raio', 'caca', 5, { ouro: 4200 }, { heli: 'raio' }, 'caça furtivo de 5ª geração embarcado', 'Superioridade aérea furtiva', ['AR-AR curto', 'AR-AR longo', 'Antinavio leve', 'Canhão 25 mm']),
  A('tesourao', 'caca', 5, { prata: 9800000 }, { heli: 'tesourao' }, 'caça furtivo multimissão (classe F-35C)', 'Multimissão furtivo', ['AR-AR curto', 'AR-AR longo', 'Bomba guiada', 'Antinavio leve']),
  A('tuiuiu', 'caca', 4, { prata: 7200000 }, { heli: 'tuiuiu' }, 'caça pesado bimotor (classe Su-57/J-20)', 'Caça pesado de longo alcance', ['AR-AR longo', 'Antinavio pesado', 'Canhão 30 mm']),
  A('caca', 'caca', 3, { prata: 0 }, { heli: 'caca' }, 'caça multirrol leve (classe Gripen Maritime)', 'Multirrol leve embarcado', ['AR-AR curto', 'Antinavio leve', 'Canhão 25 mm']),
  A('jato', 'caca', 2, { prata: 0 }, { heli: 'jato' }, 'caça de decolagem vertical', 'Caça VTOL', ['AR-AR curto', 'Antinavio leve']),
  A('tufao', 'heli', 4, { prata: 0 }, { heli: 'tufao' }, 'helicóptero pesado de ataque (classe Ka-52)', 'Ataque pesado blindado', ['Foguetes 70 mm', 'Canhão 30 mm', 'Míssil anticarro']),
  A('ataque', 'heli', 3, { prata: 0 }, { heli: 'ataque' }, 'helicóptero de ataque (classe AH-64 / Z-19)', 'Ataque', ['Foguetes 70 mm', 'Canhão 20 mm']),
  A('beijaflor', 'heli', 4, { ouro: 2600 }, { heli: 'beijaflor' }, 'helicóptero multimissão naval (classe MH-60R)', 'Multimissão naval', ['Antinavio leve', 'Torpedo leve', 'Metralhadora']),
  A('multi', 'heli', 1, { prata: 0 }, { heli: 'multi' }, 'helicóptero naval antinavio', 'Antinavio', ['Antinavio leve ×2']),
  A('asw', 'heli', 1, { prata: 0 }, { heli: 'asw' }, 'helicóptero antissubmarino', 'Antissubmarino', ['Torpedo leve']),
  A('coaxial', 'heli', 2, { prata: 0 }, { heli: 'coaxial' }, 'helicóptero de rotores coaxiais', 'Antissubmarino compacto', ['Torpedo leve ×2']),
  A('utilitario', 'heli', 2, { prata: 0 }, { heli: 'utilitario' }, 'helicóptero utilitário médio', 'Busca e transporte', ['Metralhadora 7,62 mm']),
  A('leve', 'heli', 1, { prata: 0 }, { heli: 'leve' }, 'helicóptero leve de reconhecimento', 'Reconhecimento', ['Metralhadora 12,7 mm']),
  A('albatroz', 'hidro', 3, { prata: 0 }, { hidro: 'albatroz' }, 'anfíbio a jato (classe Be-200)', 'Hidroavião de ataque', ['Mísseis antinavio', 'Torpedos', 'Bomba atômica']),
  A('guara', 'hidro', 4, { prata: 0 }, { hidro: 'guara' }, 'anfíbio STOL de 4 motores (classe US-2)', 'Hidroavião de patrulha', ['Mísseis antinavio', 'Torpedos', 'Bomba atômica']),
  A('bigua', 'hidro', 2, { prata: 0 }, { hidro: 'bigua' }, 'anfíbio bimotor (classe CL-515)', 'Hidroavião leve', ['Torpedos', 'Mísseis leves']),
  A('atoba', 'hidro', 5, { prata: 0 }, { hidro: 'atoba' }, 'anfíbio pesado (classe AG600)', 'Hidroavião pesado', ['Mísseis antinavio', 'Torpedos', 'Bomba atômica']),
  A('bombardeiroNuclear', 'bomb', 5, { ouro: 5200 }, { heli: 'bombardeiroNuclear' }, 'bombardeiro embarcado bimotor', 'Bombardeiro estratégico', ['Bomba atômica tática', 'Mísseis de cruzeiro']),
  A('coruja', 'apoio', 3, { prata: 2200000 }, { heli: 'coruja' }, 'alerta aéreo antecipado (classe E-2)', 'Radar aerotransportado', ['Sem armas — revela alvos']),
  A('vigia', 'apoio', 2, { prata: 1400000 }, { heli: 'vigia' }, 'alerta aéreo turboélice', 'Radar aerotransportado', ['Sem armas — revela alvos']),
  A('marimbondo', 'apoio', 3, { prata: 1900000 }, { heli: 'marimbondo' }, 'drone de combate furtivo', 'Drone de ataque', ['Bomba guiada', 'Antinavio leve']),
];
const NOMES_AERO = { jato: 'Caça VTOL Pica-pau', ataque: 'Helicóptero de ataque Jararaca', multi: 'Helicóptero naval Gaivota', asw: 'Helicóptero antissubmarino Lontra', coaxial: 'Helicóptero coaxial Tamanduá', utilitario: 'Helicóptero utilitário Capivara', leve: 'Helicóptero leve Sabiá', caca: 'Caça multirrol Gavião' };
export const AERO = Object.fromEntries(AERONAVES.map((a) => [a.id, a]));
/** Dados do modelo (nome oficial no jogo, velocidade, vida…) a partir das tabelas existentes. */
export function fichaAero(id) { const a = AERO[id]; if (!a) return null; if (a.modelo.hidro) { const S = HIDROS[a.modelo.hidro] || {}; return { nome: 'Hidroavião ' + (S.nome || id), vmax: Math.round((S.vMax || 140) * 3.6), vida: S.vida || 60, alcance: S.alcance || 0, sensor: 9000, descr: S.base ? `Inspirado no ${S.base}` : '' }; }
  const H = HELIS[a.modelo.heli] || {}; return { nome: NOMES_AERO[id] || H.nome || id, vmax: Math.round((H.vmax || 60) * 3.6), vida: H.vida || 30, alcance: H.alc || 0, sensor: H.sensor || 0, descr: H.desc || '' }; }
export const MISSEIS_AERO = [['fox2', 'AR-AR curto (infravermelho)', 'Trava pelo calor do motor; ótimo de perto, vulnerável a flares', 'ar'], ['fox3', 'AR-AR longo (radar ativo)', 'Dispara além do alcance visual; melhor contra bombardeiros', 'ar'],
  ['antinavio', 'Antinavio leve', 'Rasante sobre o mar contra o costado', 'mar'], ['pesado', 'Antinavio pesado', 'Ogiva grande; mais lento', 'mar'], ['bomba', 'Bomba guiada', 'Planeia até o alvo marcado', 'mar'], ['torpedo', 'Torpedo leve', 'Lançado perto do alvo', 'mar']];

/* ---------- posse, uso e evolução (salvos na economia) ---------- */
/* Tudo o que já era escolhível no estaleiro (helis de navio e hidroaviões) continua grátis — nada que o jogador tinha é retirado. */
const est = (eco) => { const e = eco.e; e.aero = e.aero || {}; return e.aero; };
export const possuiAero = (eco, id) => { const a = AERO[id]; if (!a) return false; if ((a.preco.prata === 0 && !a.preco.ouro)) return true; return !!(est(eco)[id] && est(eco)[id].tem); };
export function compraAero(eco, id) { const a = AERO[id]; if (!a || possuiAero(eco, id)) return { ok: false, msg: 'Já é sua' }; const m = a.preco.ouro ? 'ouro' : 'prata', v = a.preco.ouro || a.preco.prata || 0;
  if (v > 0 && !eco.gasta(m, v)) return { ok: false, msg: `${m === 'ouro' ? 'Ouro' : 'Prata'} insuficiente` }; const S = est(eco); S[id] = Object.assign(S[id] || {}, { tem: 1, nivel: S[id] && S[id].nivel || 1 }); return { ok: true, msg: `${(fichaAero(id) || {}).nome || id} no hangar` }; }
export const nivelAero = (eco, id) => (est(eco)[id] && est(eco)[id].nivel) || 1;
export const custoUpgrade = (id, nv) => Math.round((AERO[id] ? AERO[id].tier : 1) * 180000 * nv * nv);
export function upgradeAero(eco, id) { if (!possuiAero(eco, id)) return { ok: false, msg: 'Compre a aeronave primeiro' }; const nv = nivelAero(eco, id); if (nv >= 5) return { ok: false, msg: 'Nível máximo' }; const c = custoUpgrade(id, nv); if (!eco.gasta('prata', c)) return { ok: false, msg: 'Prata insuficiente' }; const S = est(eco); S[id] = Object.assign(S[id] || { tem: 1 }, { nivel: nv + 1 }); return { ok: true, msg: `Nível ${nv + 1}: +6% velocidade, +8% vida, recarga −5%` }; }
/* v1.2.65 (Valter): ARMA PRINCIPAL escolhida no hangar — cada cartão vira um perfil real na batalha (tipo de arma, munição por surtida,
   alcance e dano). Valores no padrão das armas que o jogo já usa (HELIS); a escolha fica salva por aeronave. */
export function perfilArma(nome, H) { const w = String(nome).toLowerCase(), base = H || {};
  if (/sem armas/.test(w)) return null;
  if (/ar-ar/.test(w)) { const longo = /longo/.test(w); return { tipo: 'ar', a2a: longo ? 1.25 : 1.5, a2aAlc: longo ? 2.4 : 1.35, rotulo: longo ? 'Interceptação além do alcance visual' : 'Combate aéreo aproximado' }; }
  if (/torpedo/.test(w)) return { tipo: 'torpedo', arma: 'torpedo', mun: /×2/.test(w) ? 2 : base.arma === 'torpedo' ? base.mun : 2, alc: 1800, dano: 38, rotulo: 'Lançado perto do alvo, corre sob a água' };
  if (/foguete/.test(w)) return { tipo: 'foguete', arma: 'foguete', mun: 24, alc: 2400, dano: 10, rotulo: 'Salva de foguetes não guiados' };
  if (/canh|metralh/.test(w)) { const cal = +((w.match(/(\d+(?:,\d+)?)\s*mm/) || [])[1] || (/metralh/.test(w) ? '12,7' : '20')).replace(',', '.'); return { tipo: 'mg', arma: 'mg', mun: 400, alc: cal >= 20 ? 1800 : 1100, dano: cal >= 30 ? 2.2 : cal >= 20 ? 1.6 : cal >= 12 ? 1.0 : 0.6, a2a: 1.15, rotulo: `Tiro contínuo ${String(cal).replace('.', ',')} mm` }; }
  if (/bomba guiada/.test(w)) return { tipo: 'missil', arma: 'missil', mun: 2, alc: 4500, dano: 32, rotulo: 'Planeia até o alvo marcado' };
  if (/pesado|cruzeiro/.test(w)) return { tipo: 'missil', arma: 'missil', mun: Math.max(1, (base.arma === 'missil' ? base.mun : 2) - 1), alc: Math.max(9000, base.alc || 0), dano: Math.round((base.dano || 24) * 1.35), rotulo: 'Ogiva grande, mais lento' };
  if (/anticarro/.test(w)) return { tipo: 'missil', arma: 'missil', mun: 8, alc: 5000, dano: 14, rotulo: 'Míssil guiado de precisão' };
  return { tipo: 'missil', arma: 'missil', mun: base.arma === 'missil' ? base.mun : /×2/.test(w) ? 2 : 2, alc: base.arma === 'missil' ? base.alc : 6000, dano: base.arma === 'missil' ? base.dano : 22, rotulo: 'Míssil guiado rasante' };
}
/** Hidroaviões e o bombardeiro levam TODAS as armas e o piloto escolhe no voo (botões MÍSSIL/TORP/BOMBA); as demais aeronaves voam pela IA com UMA arma principal escolhida aqui. */
export const armaFixaNoVoo = (id) => { const a = AERO[id]; return !!(a && (a.modelo.hidro || a.cat === 'bomb' || a.cat === 'apoio')); };
export const armaAero = (eco, id) => { const a = AERO[id], i = est(eco)[id] && est(eco)[id].arma; return a && Number.isInteger(i) && i >= 0 && i < a.armas.length ? i : 0; };
export function escolheArmaAero(eco, id, i) { const a = AERO[id]; if (!a || !(i >= 0 && i < a.armas.length)) return { ok: false, msg: 'Arma inválida' }; if (/sem armas/i.test(a.armas[i])) return { ok: false, msg: 'Aeronave de radar — sem armas' }; const S = est(eco); S[id] = Object.assign(S[id] || {}, { arma: i }); return { ok: true, msg: `${a.armas[i]} — arma principal` }; }
/** Perfis das armas escolhidas (só as diferentes da 1ª), por id do modelo de batalha — vai para a sessão do jogador. */
export const armasDoJogador = (eco) => Object.fromEntries(AERONAVES.filter((a) => !armaFixaNoVoo(a.id) && armaAero(eco, a.id) > 0).map((a) => [a.modelo.heli || a.modelo.hidro, a.armas[armaAero(eco, a.id)]]));
/** Bônus do nível de evolução (aplicado na batalha às aeronaves do jogador). */
export const bonusNivel = (nv) => ({ vel: 1 + 0.06 * (nv - 1), vida: 1 + 0.08 * (nv - 1), recarga: 1 - 0.05 * (nv - 1) });
export const ehHeliNavio = (id) => ORDEM_HELIS.includes(id);
