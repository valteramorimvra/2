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
/** Bônus do nível de evolução (aplicado na batalha às aeronaves do jogador). */
export const bonusNivel = (nv) => ({ vel: 1 + 0.06 * (nv - 1), vida: 1 + 0.08 * (nv - 1), recarga: 1 - 0.05 * (nv - 1) });
export const ehHeliNavio = (id) => ORDEM_HELIS.includes(id);
