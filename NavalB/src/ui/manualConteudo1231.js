// v1.2.31 — monta o HTML de cada seção do manual a partir de manualDados1231.js + dados reais do jogo (FONTES_1231). Sem DOM, sem THREE:
// funciona em qualquer lugar (teste node incluso). Nunca inventa número: caminho inexistente → etiqueta PENDENTE.
import { CATEGORIAS, LIGAR_1232, VERSAO_MANUAL } from './manualDados1231.js';

const PEND = '<span class="mn-pend">PENDENTE</span>';
const ROMANO = ['', 'I', 'II', 'III', 'IV'];
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const num = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v.toFixed(d).replace('.', ',') : null);
const n0 = (v) => (typeof v === 'number' && isFinite(v) ? Math.round(v).toLocaleString('pt-BR') : null);
const ou = (v, f = (x) => String(x)) => (v === undefined || v === null || (typeof v === 'number' && !isFinite(v)) ? PEND : f(v));

/** Categorias/seções/blocos ativos (filtra o que é de versão futura). */
export const visivel = (o) => LIGAR_1232 || !o.desde || o.desde <= VERSAO_MANUAL;
export const categoriasAtivas = () => CATEGORIAS.filter(visivel).map((c) => ({ ...c, secoes: c.secoes.filter(visivel) })).filter((c) => c.secoes.length);

/** Valores derivados que o jogo não guarda prontos. */
export function derivados(F) {
  const cl = Object.values(F.CLASSES).filter((c) => !c.mercante);
  const bomb = Object.entries(F.CLASSES).filter(([, c]) => c.nuclear).map(([k, c]) => ({ k, nome: c.nome, bombas: c.nuclear.bombas }));
  return { totalNavios: cl.length, totalNacoes: new Set(cl.map((c) => c.nacao)).size, totalPremium: cl.filter((c) => c.premium).length, telegrafo: (F.TELEG || []).map((t) => ({ Atrás: 'AR', Parado: 'PAR', Toda: 'TF' }[t] || t)).join(', '), bombardeiros: bomb };
}
export const contexto = (F) => ({ nuk: F.NUK, param: F.PARAM, sam: F.SAM, torpedo: F.TORPEDO, ciws: F.CIWS, a30: F.A30, laser: F.LASER, d: derivados(F), n: F.novos && F.novos.navios, h: F.novos && F.novos.hidro, v1230: F.v1230 });

const FMT = { pct: (v) => Math.round(v * 100), pct1: (v) => (v * 100).toFixed(1).replace('.', ','), km: (v) => (v / 1000).toFixed(1).replace('.', ',') };
export function interpola(txt, ctx) {
  return String(txt).replace(/\{\{\s*([\w.]+)(?:\|(\w+))?\s*\}\}/g, (m, cam, f) => {
    let v = ctx; for (const k of cam.split('.')) { v = v == null ? undefined : v[k]; }
    if (v === undefined || v === null) return PEND;
    if (f && FMT[f]) v = FMT[f](v);
    return typeof v === 'number' ? String(v).replace('.', ',') : String(v);
  });
}

const tabela = (cab, linhas, cls = '') => `<div class="mn-tabw"><table class="mn-tab ${cls}"><thead><tr>${cab.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c, i) => `<td${i === 0 ? ' class="mn-n"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const ficha = (pares) => `<dl class="mn-ficha">${pares.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

const canhaoTxt = (c) => (c.canhao ? `${c.canhao.cal} mm ${c.canhao.torres || 1}×${c.canhao.canos || 1}` : '—');

export const GERADORES = {
  tabelaNavios(F, ctx, tier) {
    const ks = Object.keys(F.CLASSES).filter((k) => { const c = F.CLASSES[k]; return !c.mercante && (c.tier || 1) === tier; });
    if (!ks.length) return `<p>${PEND}</p>`;
    const pais = (c) => (F.PAISES.find((q) => q[0] === c.nacao) || [0, c.nacao])[1];
    const linhas = ks.map((k) => { const c = F.CLASSES[k];
      return [`${esc(c.nome)}${c.premium ? ' <em class="mn-sel">PREMIUM</em>' : ''}<small>${esc(c.classe || '')}</small>`, esc(pais(c)), n0(c.L), num(c.vmax * F.NOS, 1), n0(c.vida), canhaoTxt(c), c.vls || 0, c.sam || 0, c.torp || 0, c.ciws || 0, c.heli || 0]; });
    return `<p class="mn-leg">Tier ${ROMANO[tier]} · ${ks.length} classes</p>` + tabela(['Navio', 'País', 'Comp. m', 'Vel. nós', 'Vida', 'Canhão', 'VLS', 'SAM', 'Torp.', 'CIWS', 'Aer.'], linhas, 'mn-navios');
  },
  novosNavios(F) {
    const N = F.novos && F.novos.navios; if (!N) return `<p>${PEND}</p>`;
    return N.IDS.map((id) => {
      const C = F.CLASSES[id], S = N.SPEC[id] || {}, nome = (C && C.nome) || (N.NOMES && N.NOMES[id]) || id, nac = (N.META && N.META[id] && N.META[id][0]) || (C && C.nacao);
      const pais = (F.PAISES.find((q) => q[0] === nac) || [0, nac || '—'])[1];
      const L = C ? C.L : S.L, B = C ? C.B : S.B, T = C ? C.T : S.T, v = C ? C.vmax * F.NOS : S.vmax != null ? S.vmax * F.NOS : undefined;
      const pares = [['País', esc(pais)], ['Comprimento', ou(L, (x) => num(x, 0) + ' m')], ['Boca', ou(B, (x) => num(x, 1) + ' m')], ['Calado', ou(T, (x) => num(x, 2) + ' m')], ['Deslocamento', ou(C ? C.desl : S.desl, (x) => n0(x) + ' t')], ['Velocidade máx.', ou(v, (x) => num(x, 0) + ' nós')]];
      if (C) pares.push(['Canhão', canhaoTxt(C)], ['VLS (antinavio)', C.vls], ['SAM (antiaéreo)', C.sam], ['Torpedos', C.torp], ['CIWS', C.ciws], ['Aeronaves', C.heli], ['Vida', n0(C.vida)]);
      else pares.push(['Armas e vida', PEND]);
      return `<article class="mn-card"><h4>${esc(nome)}${C ? '' : ' <em class="mn-sel">AINDA NÃO INTEGRADO</em>'}</h4>${ficha(pares)}</article>`;
    }).join('') + (N.IDS.some((id) => !F.CLASSES[id]) ? `<p class="mn-leg">Dimensões vêm do módulo dos novos navios; armas e vida entram aqui automaticamente quando os navios forem integrados.</p>` : '');
  },
  pinturas(F) {
    const ks = Object.keys(F.PINTURAS).filter((k) => !F.PINTURAS[k].fabrica);
    const grupo = (p) => (p.heroica ? 'Heroica' : p.lendaria ? 'Lendária' : p.nacional || p.nac ? 'Nacional' : p.especial ? 'Especial (ouro)' : p.ouro ? 'Especial (ouro)' : 'Comum');
    const linhas = ks.map((k) => { const p = F.PINTURAS[k]; const b = [];
      if (p.hp) b.push(`vida +${Math.round(p.hp * 100)}%`); if (p.furt) b.push(`furtividade +${Math.round(p.furt * 100)}%`);
      if (p.bonus) b.push(p.desc ? esc(p.desc) : 'bônus especial'); return [esc(p.nome), grupo(p), b.length ? b.join(' · ') : 'só visual']; });
    return `<p class="mn-leg">${ks.length} pinturas à venda ou liberadas.</p>` + tabela(['Pintura', 'Tipo', 'Bônus'], linhas, 'mn-pint');
  },
  calibres(F) {
    const m = new Map();
    for (const c of Object.values(F.CLASSES)) { const A = c.canhao; if (!A) continue; const o = m.get(A.cal) || { cal: A.cal, alc: 0, V0: 0, dano: 0, n: 0 }; o.alc = Math.max(o.alc, A.alc); o.V0 = Math.max(o.V0, A.V0); o.dano = Math.max(o.dano, A.dano); o.n++; m.set(A.cal, o); }
    const l = [...m.values()].sort((a, b) => a.cal - b.cal).map((o) => [`${o.cal} mm`, num(F.recargaMinCal(o.cal), 2) + ' s', num(o.alc / 1000, 1) + ' km', n0(o.V0) + ' m/s', num(o.dano * 0.65, 1) + ' HP', o.n]);
    return tabela(['Calibre', 'Recarga mín.', 'Alcance máx.', 'Vel. de boca', 'Dano/granada', 'Classes'], l) + '<p class="mn-leg">Alcance e velocidade: maior valor entre as classes do calibre. Dano de granada HE padrão, sem módulos nem comandante.</p>';
  },
  misseis(F) {
    const hp = F.hpRef(2);
    const l = Object.values(F.MISSEIS).map((p) => [esc(p.nome), num(p.alc / 1000, 1) + ' km', n0(p.v) + ' m/s', n0(p.vt) + ' m/s', Math.round(F.fracMissil({ perfil: p, danoMul: 1 }) * 100) + '%', Math.round((1 - (p.pkCiws || 1)) * 100) + '%']);
    return tabela(['Míssil', 'Alcance', 'Cruzeiro', 'Terminal', 'Dano (% do casco ref.)', 'Resistência à defesa'], l) + `<p class="mn-leg">Dano em % do casco de referência do tier do alvo. Resistência à defesa = chance de NÃO ser abatido pelo CIWS.</p>`;
  },
  torpedo(F) {
    const T = F.TORPEDO, P = F.PARAM;
    return ficha([['Velocidade', `${n0(T.v)} m/s · ${num(T.v * F.NOS, 0)} nós`], ['Alcance', num(T.alc / 1000, 1) + ' km'], ['Dano (% do casco ref.)', Math.round(F.fracTorpedo({ danoMul: 1 }) * 100) + '%'], ['Busca acústica', `${n0(T.buscaAlc)} m`], ['Recarga entre tubos', num(P.recarga.torpTubo, 1) + ' s']]) + '<p class="mn-leg">Pode ser interceptado pelo CIWS (de perto), pelos reparos de 30 mm e pelas iscas.</p>';
  },
  defesa(F) {
    const S = F.SAM, C = F.CIWS, A = F.A30, L = F.LASER;
    return ficha([['CIWS', `${n0(C.alc)} m · ${n0(C.rpm)} tiros/min · ${n0(C.mun)} tiros por canhão · recarga ${n0(C.recarga)} s`], [`SAM ${esc(S.nome)}`, `${num(S.alc / 1000, 1)} km · ${n0(S.v)} m/s · probabilidade ${Math.round(S.pk * 100)}%`], ['Reparo de 30 mm', `${n0(A.alc)} m`], ['Laser de defesa', `${num(L.alc / 1000, 1)} km · recarga ${num(L.recarga, 1)} s · probabilidade ${Math.round(L.pk * 100)}%`]]);
  },
  foguetes(F) {
    const m = new Map(); for (const c of Object.values(F.CLASSES)) if (c.rbu && !m.has(c.rbu.nome)) m.set(c.rbu.nome, c.rbu);
    const l = [...m.values()].map((R) => [esc(R.nome), R.foguetes, R.salvas, num(R.alc / 1000, 1) + ' km', num((R.min || 0) / 1000, 1) + ' km', R.dano + ' HP']);
    return l.length ? tabela(['Lançador', 'Foguetes/salva', 'Salvas', 'Alcance', 'Mínimo', 'Dano/foguete'], l) : `<p>${PEND}</p>`;
  },
  aeronaves(F) {
    const l = Object.values(F.HELIS).map((h) => [esc(h.nome), h.aviao ? 'avião' : 'helicóptero', esc(h.desc || '—'), n0(h.vmax) + ' m/s', n0(h.vida), n0(h.sensor) + ' m']);
    return tabela(['Aeronave', 'Tipo', 'Função', 'Vel. máx.', 'Vida', 'Sensor'], l, 'mn-aero') + '<p class="mn-leg">Aviões e drones podem ser abatidos por CIWS, SAM e laser.</p>';
  },
  consumiveis(F) {
    const efeito = { kit: (P) => `cura ${Math.round(P.cura * 100)}% da vida em ${P.dur} s`, controle: (P) => `apaga fogo e alagamento e restaura módulos${P.atraso ? ` após ${P.atraso} s` : ' na hora'}${P.imune ? `; imunidade de ${P.imune} s` : ''}`,
      bomba: (P) => `esgota ${Math.round(P.taxa * 100)}% da água a bordo por segundo durante ${P.dur} s`, reparoHeli: (P) => `restaura ${Math.round(P.cura * 100)}% da vida dos helicópteros${P.rearma ? ' e rearma/reabastece' : ''}`,
      abastece: (P) => `o ciclo de 25 s de rearme/reabastecimento no convoo cai para ${num(25 * (1 - P.fator), 1)} s` };
    const rot = { kit: 'KIT', controle: 'AVAR.', bomba: 'BOMBA', reparoHeli: 'HELI', abastece: 'ABAST.' };
    const l = F.ORDEM_CONS.map((k) => { const c = F.CONS[k]; return [`${esc(c.nome)} <small>botão ${rot[k] || ''}${c.heli ? ' · só com helicóptero' : ''}</small>`, `${n0(c.prata.custo.prata)} prata<br>${c.prata.usos} usos · recarga ${c.prata.recarga} s<br>${efeito[k](c.prata)}`, `${c.ouro.custo.ouro} ouro<br>${c.ouro.usos} usos · recarga ${c.ouro.recarga} s<br>${efeito[k](c.ouro)}`]; });
    return tabela(['Consumível', 'Prata', 'Ouro'], l, 'mn-cons');
  },
  cameras() {
    const l = [['CINEMA', 'cortes automáticos e câmera lenta em momentos fortes (toque para voltar)'], ['EXTERNA', 'terceira pessoa próxima do navio'], ['ÓPTICA', 'binóculo: a dispersão do canhão fica menor'], ['CONVÉS', 'câmera interna, na altura do convés'], ['CANHÃO', 'câmera interna, junto do canhão'], ['POPA', 'atrás e à direita, baixa'], ['3/4 ALTA', 'vista alta em três quartos'], ['POPA ALTA', 'sobre a popa, olhando à frente'], ['COSTADO', 'rente ao casco, o navio ocupa quase toda a largura'], ['MÍSSIL', 'acompanha o seu último míssil em voo'], ['FOGUETE', 'acompanha o último foguete'], ['PROJÉTIL', 'acompanha a última granada de canhão'], ['TORPEDO', 'acompanha o último torpedo']];
    return tabela(['Câmera', 'O que mostra'], l, 'mn-cam');
  },
  botoesHud() {
    const l = [['CANHÃO', 'segure para disparar todas as torres'], ['VLS', 'míssil antinavio no alvo travado (anel = solução de tiro; contador de células)'], ['TORP', 'torpedo no alvo travado ou na direção da mira'], ['ISCA TÉRM.', 'lança iscas contra mísseis'], ['REPARO', 'equipe de reparo: fogo e alagamento'], ['GRANADA', 'lança-granadas/foguetes (navios com lançador)'], ['NUCLEAR', 'bomba atômica (navios com bombardeiro nuclear)'], ['HELI / ESQUADRILHA', 'assume o helicóptero ou lança a esquadrilha'], ['ÓPTICA', 'liga o binóculo'], ['TRAVAR', 'trava o navio sob a mira; de novo destrava'], ['SAM', 'liga ou retém a defesa SAM automática'], ['CÂMERA', 'abre o leque de câmeras'], ['AUTO-MIRA', 'ajuda a mira no cone em volta do retículo (padrão: desligada)'], ['MIRA LIVRE', 'canhão vai ao ponto exato do retículo'], ['AUTO-FOGO', 'canhões atiram sozinhos enquanto a mira está no alvo travado'], ['ACÚSTICO / RETO', 'modo do torpedo'], ['RADAR ATIVO / PASSIVO', 'alterna o radar (ativo denuncia a sua posição)']];
    return tabela(['Botão', 'Função'], l, 'mn-btn');
  },
  nukeRegras(F) {
    const N = F.NUK, qs = (derivados(F).bombardeiros || []).map((b) => esc(b.nome.replace(/^Bombardeiro embarcado /, ''))).join(', ');
    return ficha([['Libera após', `${N.liberaApos} s de partida`], ['Bombas por surtida', N.bombasSurtida], ['Recarga', `${N.tRecargaPouso} s após o pouso`], ['Se o bombardeiro for abatido', `outro decola em ${N.relancaAbatido} s (a carga é perdida; 1 no ar por porta-aviões)`], ['Paiol', 'ilimitado'], ['Altura da explosão', `${N.hRajada} m sobre a água`], ['Alcance máximo', `${num(N.alcanceMax / 1000, 1)} km`], ['Primeira bomba pronta', `${N.tPrep1} s após decolar`]]);
  },
  nukeRaios(F) {
    const N = F.NUK;
    return tabela(['Zona', 'Distância', 'Efeito'], [['Destruição quase total', `até ${n0(N.raioTotal)} m`, 'dano máximo'], ['Dano pesado', `até ${n0(N.raioPesado)} m`, 'cai continuamente'], ['Borda', `até ${n0(N.raioBorda)} m`, 'dano chega a zero'], ['Aeronaves', `até ${n0(N.raioAereo)} m`, 'empurradas ou derrubadas'], ['Mísseis e drones inimigos', `até ${n0(N.raioMisseis)} m`, 'destruídos'], ['Aeronaves no convés', `até ${n0(N.raioConvés)} m`, 'podem ser arrancadas'], ['Pontes, prédios e árvores', `até ${n0(N.raioEstr)} m`, 'danificados']]);
  },
  nukeQuem(F) {
    const b = derivados(F).bombardeiros; if (!b.length) return `<p>${PEND}</p>`;
    return `<p>Navios com bombardeiro nuclear embarcado:</p><ul>${b.map((x) => `<li><b>${esc(x.nome)}</b></li>`).join('')}</ul>`;
  },
  // ---- hidroavião (1.2.32; só aparecem se LIGAR_1232) ----
  hidroEstado(F) { const H = F.novos && F.novos.hidro; const ok = H && (F.CLASSES[H.D.id] || F.CLASSES[H.D.classe]); return `<p class="mn-estado">${ok ? 'Integrado ao jogo.' : 'Estado: ' + PEND + ' (ainda não integrado ao jogo).'}</p>`; },
  hidroDados(F) { const H = F.novos && F.novos.hidro; if (!H) return `<p>${PEND}</p>`; const D = H.D;
    return ficha([['Comprimento', ou(D.L, (x) => num(x, 2) + ' m')], ['Envergadura', ou(D.envergadura, (x) => num(x, 2) + ' m')], ['Altura', ou(D.H, (x) => num(x, 2) + ' m')], ['Massa máx. (solo)', ou(D.mMax, (x) => n0(x) + ' kg')], ['Massa máx. (água)', ou(D.mAgua, (x) => n0(x) + ' kg')], ['Velocidade máx.', ou(D.vmax, (x) => num(x * 3.6, 0) + ' km/h')], ['Teto', ou(D.teto, (x) => n0(x) + ' m')], ['Alcance', ou(D.alc, (x) => n0(x / 1000) + ' km')], ['Turbinas', ou(D.motores, (x) => `${x} × ${num(D.empuxoN / 1000, 2)} kN`)]]); },
  hidroBotoes() { return tabela(['Botão', 'Função'], [['BOMBA', 'solta a bomba atômica'], ['TRAVAR', 'trava o alvo'], ['AUTO', 'vai ao alvo travado; você reassume quando quiser'], ['ESPERA', 'orbita sem atacar']], 'mn-btn') + `<p>${PEND}</p>`; },
  hidroResistencia(F) { const H = F.novos && F.novos.hidro; if (!H) return `<p>${PEND}</p>`; const D = H.D; return ficha([['Vida (valor inicial, ainda em calibragem)', ou(D.vida, n0)], ['Contramedidas', ou(D.flares, (x) => `${x} flares + ${D.chaff} chaffs`)]]) + `<p>${PEND} Valores finais de blindagem e vida.</p>`; },
  camoAereo(F) { return tabela(['Camuflagem', 'Cores'], F.ORDEM_CAMO_AEREO.map((k) => [esc(F.CAMO_AEREO[k].nome), `<i class="mn-sw" style="background:${F.CAMO_AEREO[k].c}"></i><i class="mn-sw" style="background:${F.CAMO_AEREO[k].c2}"></i>`]), 'mn-camo') + '<p class="mn-leg">Mais todas as pinturas do estaleiro (ver Navios › Pinturas).</p>'; },
};

/** HTML de uma seção (lazy: chamado só quando o jogador abre a seção). */
export function htmlSecao(F, secao) {
  const ctx = contexto(F);
  return secao.blocos.filter(visivel).map((b) => {
    try {
      if (b.gerar) return `<div class="mn-ger">${GERADORES[b.gerar] ? GERADORES[b.gerar](F, ctx, b.arg) : PEND}</div>`;
      if (b.h) return `<h4>${interpola(b.h, ctx)}</h4>`;
      if (b.p) return `<p>${interpola(b.p, ctx)}</p>`;
      if (b.nota) return `<p class="mn-nota">${interpola(b.nota, ctx)}</p>`;
      if (b.pend) return `<p class="mn-pendp">${PEND} ${interpola(b.pend, ctx)}</p>`;
      if (b.lista) return `<ul>${b.lista.map((x) => `<li>${interpola(x, ctx)}</li>`).join('')}</ul>`;
    } catch (e) { return `<p class="mn-pendp">${PEND} (erro ao montar este bloco: ${esc(e.message)})</p>`; }
    return '';
  }).join('');
}
