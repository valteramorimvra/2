// v1.2.17 item 25 — FICHA TÉCNICA de cada navio no estaleiro: símbolo, descrição e os números REAIS do combate,
// calculados com as MESMAS fórmulas e parâmetros que a simulação usa (world.js / defesa.js / danoReal.js), já com os
// modificadores daquele navio (módulos, propulsão, pintura, comandante). Munição padrão (HE) e míssil padrão.
import { CLASSES, MISSEIS, TORPEDO, SAM, HELIS } from './sim/classes.js';
import { PARAM, recargaMinCal } from './armasParametros.js';
import { CIWS, A30, LASER } from './naval5v5/defesa.js';
import { fracMissil, fracTorpedo, hpRef } from './naval5v5/danoReal.js';
import { layoutDe } from './sim/layout.js';
import { rbuV0 } from './sim/world.js';
import { NOS } from './sim/util.js';

const SIMB = { ciws: '<svg viewBox="0 0 24 24"><rect x="8" y="12" width="8" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 12V4M10 5h4M7 19h10" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  laser: '<svg viewBox="0 0 24 24"><path d="M4 18l6-6M10 12l10-8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="20" cy="4" r="1.6" fill="currentColor"/><rect x="2" y="17" width="5" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  a30: '<svg viewBox="0 0 24 24"><path d="M5 17h9l5-7M5 17v3h9v-3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M14 13l6-8" stroke="currentColor" stroke-width="1.2"/></svg>' };
const MACH = 343;
const r1 = (v, c = 1) => +v.toFixed(c);

/** Ficha do navio k com os modificadores m (modsDe). Retorna [{ id, simb, nome, desc, linhas:[{ k, rot, v, un, melhor:+1|-1|0, txt? }], nota }]. */
export function fichaTecnica(k, m = {}) {
  const C = CLASSES[k]; if (!C) return []; const L = layoutDe(C); const F = [];
  const tier = C.tier || 1, hp = hpRef(tier), dm = m.dano || 1;
  { const A = C.canhao, nc = A.canos || 1, nt = A.torres || 1, rec = Math.max(A.cad * 0.8, recargaMinCal(A.cal)) * (m.cad || 1) /* v1.2.21 item 19: mesma regra do combate (piso realista do calibre × carregador/comandante) */, dG = A.dano * 0.65 * (m.municaoEf ? m.municaoEf.dano : 1) * dm;
    F.push({ id: 'canhao', simb: 'fogo', nome: `Canhão principal ${A.cal} mm`, desc: `${nt > 1 ? nt + ' torres' : '1 torre'}${nc > 1 ? ' de ' + nc + ' canos' : ''}; granada explosiva (HE) com espoleta de impacto, tiro balístico com arrasto e dispersão por calibre. Não pode ser interceptada: se acerta, causa dano.`,
      linhas: [{ k: 'cal', rot: 'Calibre', v: A.cal, un: 'mm', melhor: 1 }, { k: 'canos', rot: 'Canos', v: nc * nt, un: '', melhor: 1 }, { k: 'rec', rot: 'Recarga', v: r1(rec, 2), un: 's', melhor: -1 }, { k: 'dano', rot: 'Dano por granada', v: r1(dG, 1), un: 'HP', melhor: 1 },
        { k: 'gpm', rot: 'Granadas por minuto (navio)', v: r1((60 / rec) * nc * nt, 0), un: '/min', melhor: 1 }, { k: 'alc', rot: 'Alcance', v: r1(A.alc / 1000, 1), un: 'km', melhor: 1 }, { k: 'v0', rot: 'Velocidade de boca', v: A.V0, un: 'm/s', melhor: 1 }] }); }
  if (C.vls) { const lista = (C.misseis || [C.missil]).map((q) => MISSEIS[q]).filter(Boolean); const pf = MISSEIS[C.missil] || lista[0]; const ef = m.missilEf || {}; const mv = m.misVel || 1, mt = m.trava || 1, PT = PARAM.trava;
    const fr = fracMissil({ perfil: pf, danoMul: (ef.dano || 1) * dm }); const res = 1 - (pf.pkCiws || 1) * (ef.pkCiws || 1);
    F.push({ id: 'missil', simb: 'vls', nome: `Míssil antinavio ${pf.nome}`, desc: `Lançamento vertical (VLS), cruzeiro rasante e mergulho terminal guiado por radar. Precisa de TRAVA: primeiro o radar trava o alvo, depois a solução de tiro é passada ao míssil (anel no botão VLS). Pode ser interceptado por CIWS, SAM, laser ou iscas.${lista.length > 1 ? ' Salva alterna perfis: ' + lista.map((q) => q.nome).join(', ') + '.' : ''}`,
      linhas: [{ k: 'cel', rot: 'Células VLS', v: C.vls + (m.vlsMais || 0), un: '', melhor: 1 }, { k: 'alc', rot: 'Alcance', v: r1(pf.alc / 1000, 1), un: 'km', melhor: 1 }, { k: 'vc', rot: 'Velocidade de cruzeiro', v: Math.round(pf.v * mv), un: 'm/s', melhor: 1, txt: `Mach ${(pf.v * mv / MACH).toFixed(2).replace('.', ',')}` },
        { k: 'vt', rot: 'Velocidade terminal', v: Math.round(pf.vt * mv), un: 'm/s', melhor: 1, txt: `Mach ${(pf.vt * mv / MACH).toFixed(2).replace('.', ',')}` }, { k: 'dano', rot: `Dano (vs. casco tier ${tier})`, v: Math.round(fr * hp), un: 'HP', melhor: 1, txt: `${Math.round(fr * 100)}% do casco` },
        { k: 'res', rot: 'Resistência à defesa', v: Math.round(res * 100), un: '%', melhor: 1, txt: 'menos abatível' }, { k: 'trA', rot: 'Tempo de trava (radar ativo)', v: r1((PT.tAtivo + PT.tMisAtivo) / mt, 1), un: 's', melhor: -1 },
        { k: 'trP', rot: 'Tempo de trava (passivo)', v: r1((PT.tPassivo + PT.tMisPassivo) / mt, 1), un: 's', melhor: -1 }, { k: 'salva', rot: 'Mísseis por salva', v: C.salva || 1, un: '', melhor: 1 }] }); }
  if (C.torp) { const tubos = (L.tubos || []).reduce((a, q) => a + (q.canos || 1), 0); const fr = fracTorpedo({ danoMul: m.torpDano || 1 });
    F.push({ id: 'torp', simb: 'torp', nome: 'Torpedo pesado', desc: `Lançado pelo tubo do bordo voltado para o alvo; corre submerso, filoguiado até o alvo travado e com busca acústica no fim; detona sob o casco. Pode ser interceptado (CIWS de perto, reparos de 30 mm, iscas).`,
      linhas: [{ k: 'n', rot: 'Torpedos a bordo', v: C.torp, un: '', melhor: 1 }, { k: 'tubos', rot: 'Tubos', v: tubos, un: '', melhor: 1 }, { k: 'rec', rot: 'Recarga entre tubos', v: PARAM.recarga.torpTubo, un: 's', melhor: -1 }, { k: 'v', rot: 'Velocidade', v: Math.round(TORPEDO.v), un: 'm/s', melhor: 1, txt: `${Math.round(TORPEDO.v * NOS)} nós` },
        { k: 'alc', rot: 'Alcance', v: r1(TORPEDO.alc / 1000, 1), un: 'km', melhor: 1 }, { k: 'dano', rot: `Dano (vs. casco tier ${tier})`, v: Math.round(fr * hp), un: 'HP', melhor: 1, txt: `${Math.round(fr * 100)}% do casco` }, { k: 'busca', rot: 'Busca acústica', v: TORPEDO.buscaAlc, un: 'm', melhor: 1 }] }); }
  for (const grp of C.sec || []) { const A = grp.arma; F.push({ id: 'sec' + A.cal, simb: 'a30', nome: `${A.nome} (secundária automática)`, desc: A.cal >= 76 ? 'Canhão automático de dupla função pelo través: granada real com arrasto e gravidade (mesmo motor do canhão principal), traçante. Entra no AUTO-FOGO de canhões junto com as torres principais.' : 'Canhões leves nas bordas: rajadas de traçantes com balística real, curto alcance. Entram no AUTO-FOGO de canhões.',
      linhas: [{ k: 'n', rot: 'Reparos', v: grp.n, un: '', melhor: 1 }, { k: 'cal', rot: 'Calibre', v: A.cal, un: 'mm', melhor: 1 }, { k: 'v0', rot: 'Velocidade de boca', v: A.V0, un: 'm/s', melhor: 1 }, { k: 'cad', rot: 'Cadência', v: Math.round(60 / A.cad), un: 'disparos/min', melhor: 1 }, { k: 'dano', rot: 'Dano por disparo', v: r1(A.dano * 0.65, 1), un: 'HP', melhor: 1 }, { k: 'alc', rot: 'Alcance', v: r1(A.alc / 1000, 1), un: 'km', melhor: 1 }] }); } /* v1.2.18 item 14d */
  if (C.rbu) { const R = C.rbu;
    F.push({ id: 'rbu', simb: 'gran', nome: `Lança-granadas ${R.nome}`, desc: 'Salva de foguetes-granada em arco (semiguiados para o alvo travado); explodem no casco ou sob a água (onda de choque). Não podem ser interceptados: se acertam, causam dano.',
      linhas: [{ k: 'fog', rot: 'Foguetes por salva', v: R.foguetes, un: '', melhor: 1 }, { k: 'salvas', rot: 'Salvas', v: R.salvas, un: '', melhor: 1 }, { k: 'rec', rot: 'Recarga', v: Math.max(R.cad, PARAM.recarga.rbu), un: 's', melhor: -1 }, { k: 'dano', rot: 'Dano por foguete', v: R.dano, un: 'HP', melhor: 1 },
        { k: 'alc', rot: 'Alcance', v: r1(R.alc / 1000, 1), un: 'km', melhor: 1, txt: `mín. ${r1((R.min || 0) / 1000, 1)} km` }, { k: 'v0', rot: 'Velocidade de lançamento', v: Math.round(rbuV0(R)), un: 'm/s', melhor: 1 }] }); }
  { const lin = [{ k: 'ciws', rot: 'CIWS', v: C.ciws || 0, un: '', melhor: 1, txt: `${CIWS.alc} m · ${CIWS.rpm} tpm` }, { k: 'ciwsT', rot: 'Eficácia do CIWS', v: Math.round((m.ciwsTaxa || 1) * 100), un: '%', melhor: 1 }, { k: 'mun', rot: 'Munição por CIWS', v: CIWS.mun, un: 'tiros', melhor: 1, txt: `recarga ${CIWS.recarga} s` }];
    if (C.sam) lin.push({ k: 'sam', rot: `SAM ${SAM.nome}`, v: C.sam, un: 'células', melhor: 1, txt: `${r1(SAM.alc / 1000, 1)} km · ${SAM.v} m/s` }, { k: 'samPk', rot: 'Probabilidade do SAM', v: Math.round(SAM.pk * (m.samPk || 1) * 100), un: '%', melhor: 1 });
    if (C.a30) lin.push({ k: 'a30', rot: 'Reparos de 30 mm', v: C.a30, un: '', melhor: 1, txt: `${A30.alc} m` });
    const nl = (L.laser || []).length; if (nl) lin.push({ k: 'laser', rot: 'Laser de defesa', v: nl, un: '', melhor: 1, txt: `${r1(LASER.alc / 1000, 1)} km · recarga ${LASER.recarga} s` });
    lin.push({ k: 'iscas', rot: 'Iscas (chaff/flare)', v: C.chaff || 0, un: '', melhor: 1 });
    F.push({ id: 'defesa', simb: 'ciws', nome: 'Defesa de ponto e de área', desc: 'Só mísseis, torpedos e aeronaves (drones, helicópteros, VANTs) podem ser interceptados. Tiros de canhão, granadas e foguetes não têm defesa.', linhas: lin }); }
  if (C.heli) { const n = C.heli; F.push({ id: 'heli', simb: 'heli', nome: 'Aviação embarcada', desc: `${n} hangar(es); o modelo de cada hangar é escolhido na aba Helis.`, linhas: [{ k: 'hang', rot: 'Hangares', v: n, un: '', melhor: 1 }, { k: 'fuel', rot: 'Autonomia (fator)', v: Math.round((m.heliFuel || 1) * 100), un: '%', melhor: 1 }] }); }
  return F;
}
export const HELIS_FICHA = HELIS;

/** HTML da ficha com comparação contra o navio atual (fa = ficha do atual, nomeAtual). */
export function fichaHtml(F, fa, mesmo, nomeAtual, IC = {}) { const SB = { ...IC, ...SIMB };
  const idx = {}; for (const s of fa || []) for (const l of s.linhas) idx[s.id + ':' + l.k] = l;
  const num = (v) => String(v).replace('.', ',');
  const cab = mesmo ? '<p class="ft-cmp">Este é o seu navio atual.</p>' : `<p class="ft-cmp">Comparação com o navio atual: <b>${nomeAtual}</b> <span class="ft-leg"><i class="up">▲ melhor</i> <i class="dn">▼ pior</i></span></p>`;
  return cab + F.map((s) => `<section class="ft-arma" data-ft="${s.id}"><header><i class="ft-ic">${SB[s.simb] || ''}</i><div><b>${s.nome}</b><small>${s.desc}</small></div></header><div class="ft-tab">${s.linhas.map((l) => { const a = idx[s.id + ':' + l.k];
    let cmp = ''; if (!mesmo) { if (!a) cmp = '<em class="ft-c nov">atual: —</em>'; else { const d = l.v - a.v; const cl = !d || !l.melhor ? 'eq' : d * l.melhor > 0 ? 'up' : 'dn'; cmp = `<em class="ft-c ${cl}">${cl === 'up' ? '▲' : cl === 'dn' ? '▼' : '='} atual ${num(a.v)}${a.un ? ' ' + a.un : ''}</em>`; } }
    return `<div class="ft-l" data-k="${l.k}"><span class="ft-r">${l.rot}</span><span class="ft-v"><b>${num(l.v)}</b>${l.un ? ' ' + l.un : ''}${l.txt ? ` <small>${l.txt}</small>` : ''}</span>${cmp}</div>`; }).join('')}</div></section>`).join('')
    + (fa && !mesmo ? (() => { const ids = new Set(F.map((s) => s.id)); const so = fa.filter((s) => !ids.has(s.id)); return so.length ? `<p class="ft-cmp">O navio atual tem e este não: ${so.map((s) => s.nome).join(', ')}.</p>` : ''; })() : '');
}
