// Nexo Naval Strike v1.2.43 — telas novas: ÁRVORE TECNOLÓGICA com fotos (nível × tipo, no estilo World of Warships),
// MERCADO (ofertas do dia, caixas e câmbio, no estilo Modern Warships) e LOJA de pacotes (offline, compras de teste).
import { CLASSES, ORDEM_CLASSES } from '../sim/classes.js';
import { HIDROS, ORDEM_HIDROS } from '../sim/hidroaviao.js';
import { PRECO, PINTURAS, TIPO_NAVIO } from '../navalTechTreeEconomy.js';
import { NEXOS, ofertasDoDia, comprarOferta, CAIXAS, abreCaixa, chanceTxt, CAMBIO, trocar, LOJA, compraLoja, tempoAteVirar, diaHoje } from '../mercado.js';

const n0 = (v) => Math.round(v).toLocaleString('pt-BR');
export const moedaHtml = (m, v) => m === 'nexos' ? `<span class="moeda n">${NEXOS.icone} ${n0(v)}</span>` : m === 'ouro' ? `<span class="moeda o">● ${n0(v)}</span>` : `<span class="moeda p">◈ ${n0(v)}</span>`;
const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

/* ---------- tipo de cada navio para as LINHAS da árvore ---------- */
export const TIPOS_ARVORE = [['apoio', 'Apoio / mercante'], ['corveta', 'Corvetas'], ['fragata', 'Fragatas'], ['destroier', 'Contratorpedeiros'], ['cruzador', 'Cruzadores'], ['capitania', 'Capitânias e encouraçados'], ['porta', 'Porta-aviões'], ['hidro', 'Hidroaviões']];
export function tipoArvore(k) { const C = CLASSES[k]; if (C.civil || C.mercante) return 'apoio'; if (C.porta || C.superPA) return 'porta'; if (TIPO_NAVIO[k]) return TIPO_NAVIO[k]; const t = C.couracado ? 'capitania' : null; if (t) return t; const L = C.L || 100; return L < 105 ? 'corveta' : L < 140 ? 'fragata' : L < 175 ? 'destroier' : L < 235 ? 'cruzador' : 'capitania'; }
const nivel = (k) => { const C = CLASSES[k]; return C.superLend ? 6 : C.lendario ? 5 : C.tier || 1; };

/** ÁRVORE: linhas = tipo, colunas = nível I–IV + Lendário + Super lendário. Cada cartão tem a FOTO do navio (renderizada do próprio jogo). */
export function telaArvore(D) { const { mostra, voltar, eco, carteira, statusNavio, irEstaleiro, irHidro, som } = D;
  const ks = ORDEM_CLASSES.filter((k) => CLASSES[k] && CLASSES[k].L && !CLASSES[k].mercante); const grade = {};
  for (const k of ks) { const t = tipoArvore(k), nv = nivel(k); ((grade[t] = grade[t] || {})[nv] = grade[t][nv] || []).push(k); }
  const card = (k) => { const C = CLASSES[k], s = statusNavio(k); return `<button class="ar-card st-${s.cls}${C.premium ? ' prem' : ''}${C.lendario ? ' lend' : ''}${C.superLend ? ' slend' : ''}" data-k="${k}"><i class="ar-foto" style="background-image:url(fotos/navios/${k}.webp)"></i><b>${C.nome}</b><small>${s.txt}</small>${C.premium ? '<em class="ar-tag">PREMIUM</em>' : ''}</button>`; };
  const linhas = TIPOS_ARVORE.filter(([t]) => t === 'hidro' || grade[t]).map(([t, nome]) => {
    if (t === 'hidro') return `<div class="ar-linha"><div class="ar-tipo">${nome}</div>${[1, 2, 3, 4, 5, 6].map((nv) => `<div class="ar-cel">${nv === 3 ? ORDEM_HIDROS.map((h) => `<button class="ar-card st-possui hd" data-h="${h}"><i class="ar-foto" style="background-image:url(fotos/navios/${h}.webp)"></i><b>${HIDROS[h].nome}</b><small>${HIDROS[h].base.split(' (')[0]}</small></button>`).join('') : ''}</div>`).join('')}</div>`;
    return `<div class="ar-linha"><div class="ar-tipo">${nome}</div>${[1, 2, 3, 4, 5, 6].map((nv) => `<div class="ar-cel">${(grade[t][nv] || []).map(card).join('')}</div>`).join('')}</div>`; }).join('');
  const el = mostra('arvore', `${voltar()}${carteira()}<h2>Árvore tecnológica <small>nível × tipo · toque num navio para abrir no estaleiro</small></h2>
    <div class="ar-wrap"><div class="ar-grade"><div class="ar-linha ar-cab"><div class="ar-tipo"></div>${[1, 2, 3, 4].map((n) => `<div class="ar-cel"><b>NÍVEL ${ROMANO[n]}</b></div>`).join('')}<div class="ar-cel lend"><b>◆ LENDÁRIO</b></div><div class="ar-cel slend"><b>✦ SUPER</b></div></div>${linhas}</div></div>`);
  el.addEventListener('click', (e) => { const b = e.target.closest('.ar-card'); if (!b) return; som(); if (b.dataset.h) irHidro(b.dataset.h); else irEstaleiro(b.dataset.k); });
  void eco; void PRECO; }

/** MERCADO: ofertas do dia (renovam à meia-noite), caixas com tabela de chances e câmbio entre as moedas. */
/* ---------- preço de cada navio no COMÉRCIO (em Nexos) com variação diária, como uma bolsa ---------- */
export function precoNavioNx(k) { const p = PRECO[k] || {}; const base = p.ouro ? p.ouro / 10 : p.prata ? p.prata / 400 : 300; return Math.max(300, Math.round(base / 50) * 50); }
export function variacaoDia(k, dia = diaHoje()) { let h = dia; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; h = (h * 1664525 + 1013904223) >>> 0; return Math.round(((h / 4294967296) - 0.45) * 50) / 100; }
const CATS = [['todos', 'Todos', '✦'], ['navios', 'Navios', '⛴'], ['hidros', 'Hidroaviões', '✈'], ['pinturas', 'Camuflagens', '◩'], ['ofertas', 'Ofertas do dia', '%'], ['caixas', 'Caixas', '▣'], ['cambio', 'Câmbio', '⇄']];
const ORDENS = [['padrao', 'Padrão'], ['menor', 'Menor preço'], ['maior', 'Maior preço'], ['nivel', 'Nível'], ['alta', 'Maior alta do dia']];
/** MERCADO no estilo "Comércio": coluna de categorias, ordenação e grade de cartões com FOTO, nome, nível, preço em Nexos e variação do dia. */
export function telaMercado(D, aba = 'navios', ordem = 'padrao') { const { mostra, voltar, eco, save, carteira, som, toast, eventoCompra } = D;
  if (aba === 'cartas') aba = 'navios';
  const of = ofertasDoDia(eco); const comp = save.d.mercado && save.d.mercado.dia === diaHoje() ? save.d.mercado.ok : {};
  const precoNat = (k) => { const pr = PRECO[k] || {}; return pr.ouro ? { m: 'ouro', v: pr.ouro } : { m: 'prata', v: pr.prata || 0 }; }; /* v1.2.47: preço ORIGINAL do jogo (ouro nos premium, prata nos de linha) */
  const forca = (k) => { const C = CLASSES[k], p = precoNat(k); return (C.superLend ? 6 : C.lendario ? 5 : C.tier || 1) * 1e9 + (p.m === 'ouro' ? p.v * 400 : p.v); };
  const cartaNavio = (k) => { const C = CLASSES[k], p = precoNat(k), tem = eco.possui(k), nv = C.superLend ? '✦' : C.lendario ? '◆' : ROMANO[C.tier || 1];
    return { k, preco: p.m === 'ouro' ? p.v * 400 : p.v, v: 0, f: forca(k), nivel: C.superLend ? 6 : C.lendario ? 5 : C.tier || 1, html: `<button class="cm-card${tem ? ' tem' : ''}${C.lendario ? ' lend' : ''}${C.superLend ? ' slend' : ''}" data-nav="${k}"><span class="cm-topo"><b class="cm-nv">${nv}</b>${C.civil ? '<em class="cm-new">NOVO</em>' : C.premium ? '<em class="cm-prem">PREMIUM</em>' : ''}</span><i class="cm-foto" style="background-image:url(fotos/navios/${k}.webp)"></i><span class="cm-nome">${C.nome}</span><span class="cm-preco">${tem ? '<b class="cm-tem">NA FROTA ✓</b>' : p.v ? moedaHtml(p.m, p.v) : '<b class="cm-tem">GRÁTIS</b>'}</span></button>` }; };
  const cartaHidro = (h) => `<button class="cm-card tem" data-hd="${h}"><span class="cm-topo"><b class="cm-nv">✈</b><em class="cm-new">NOVO</em></span><i class="cm-foto" style="background-image:url(fotos/navios/${h}.webp)"></i><span class="cm-nome">${HIDROS[h].nome} <small>${HIDROS[h].base.split(' (')[0]}</small></span><span class="cm-preco"><b class="cm-tem">DISPONÍVEL ✓</b></span></button>`;
  const cartaPint = (p) => { const P0 = PINTURAS[p], tem = eco.possuiPintura(p), m = P0.ouro ? 'ouro' : 'prata', v = P0.ouro || P0.prata || 0; return `<button class="cm-card cm-pc${tem ? ' tem' : ''}${P0.lendaria ? ' lend' : ''}${P0.heroica ? ' slend' : ''}" data-pint="${p}"><span class="cm-topo"><b class="cm-nv">${P0.lendaria ? '◆' : P0.heroica ? '★' : '◩'}</b>${P0.bonus ? `<em class="cm-prem">+${Math.round(P0.bonus * 100)}%</em>` : P0.hp ? `<em class="cm-new cm-hp">+${Math.round(P0.hp * 100)}% HP</em>` : ''}</span><i class="cm-foto sw" style="background:linear-gradient(135deg,${P0.cores[0]} 0 33%,${P0.cores[1]} 33% 66%,${P0.cores[2]} 66%)"></i><span class="cm-nome">${P0.nome}</span><span class="cm-preco">${tem ? '<b class="cm-tem">POSSUI ✓</b>' : v ? moedaHtml(m, v) : '<b class="cm-tem">GRÁTIS</b>'}</span></button>`; };
  let corpo = '';
  if (aba === 'navios' || aba === 'todos') { let L = ORDEM_CLASSES.filter((k) => CLASSES[k] && CLASSES[k].L && !CLASSES[k].mercante).map(cartaNavio);
    if (ordem === 'padrao') L.sort((a, b) => b.f - a.f); else if (ordem === 'menor') L.sort((a, b) => a.preco - b.preco); else if (ordem === 'maior') L.sort((a, b) => b.preco - a.preco); else if (ordem === 'nivel') L.sort((a, b) => a.nivel - b.nivel); else if (ordem === 'alta') L.sort((a, b) => b.v - a.v);
    corpo = `<div class="cm-grade">${L.map((q) => q.html).join('')}${aba === 'todos' ? ORDEM_HIDROS.map(cartaHidro).join('') + PINTURAS_LISTA().map(cartaPint).join('') : ''}</div>`; }
  else if (aba === 'hidros') corpo = `<div class="cm-grade">${ORDEM_HIDROS.map(cartaHidro).join('')}</div>`;
  else if (aba === 'pinturas') corpo = `<div class="cm-grade">${PINTURAS_LISTA().map(cartaPint).join('')}</div>`;
  else if (aba === 'ofertas') corpo = `<div class="mk-ofertas">${of.map((o) => `<div class="mk-of${o.destaque ? ' dest' : ''}${comp[o.id] ? ' feito' : ''}">
        ${o.foto ? `<i class="mk-foto" style="background-image:url(${o.foto})"></i>` : o.cores ? `<i class="mk-foto sw" style="background:linear-gradient(135deg,${o.cores[0]} 0 33%,${o.cores[1]} 33% 66%,${o.cores[2]} 66%)"></i>` : `<i class="mk-foto ic ic-${o.tipo}"></i>`}
        <em class="mk-desc">−${Math.round(o.desc * 100)}%</em><b>${o.titulo}</b><small>${o.sub}</small>
        <div class="mk-preco"><s>${moedaHtml(o.moeda, o.de)}</s>${moedaHtml(o.moeda, o.preco)}</div>
        <button class="btn primario btn-peq" data-of="${o.id}" ${comp[o.id] ? 'disabled' : ''}>${comp[o.id] ? 'RESGATADO ✓' : 'COMPRAR'}</button></div>`).join('')}</div><p class="mu mk-rel">Ofertas renovam em <b>${tempoAteVirar()}</b></p>`;
  else if (aba === 'caixas') corpo = `<div class="mk-caixas">${Object.entries(CAIXAS).map(([id, C]) => `<div class="mk-cx" style="--cx:${C.cor}"><i class="mk-cxi"></i><b>${C.nome}</b><ul>${chanceTxt(C).map((t) => `<li>${t}</li>`).join('')}</ul>${C.garantia ? `<small>Garantia: pintura heroica ou lendária a cada ${C.garantia} caixas (${(save.d.caixas && save.d.caixas[id]) || 0} abertas)</small>` : ''}<button class="btn primario btn-peq" data-cx="${id}">ABRIR ${moedaHtml('nexos', C.preco)}</button></div>`).join('')}</div>`;
  else corpo = `<div class="mk-cambio">${CAMBIO.map((c) => `<div class="mk-tr"><b>${c.txt}</b><div class="mk-q">${[10, 100, 1000].map((q) => `<button class="btn btn-peq" data-tr="${c.id}" data-q="${q}">${n0(q)} → ${n0(q * c.taxa)}</button>`).join('')}</div></div>`).join('')}</div>`;
  const titulo = (CATS.find((c) => c[0] === aba) || CATS[1])[1];
  const el = mostra('mercado', `<div class="cm-topo-bar"><button class="cm-voltar" data-ir="inicio">‹ Voltar</button><h2>COMÉRCIO <small>// compra e venda de navios, hidroaviões e camuflagens</small></h2></div>${carteira()}
    <nav class="cm-cats">${CATS.map(([k, t, ic]) => `<button data-aba="${k}" class="${k === aba ? 'on' : ''}"><i>${ic}</i>${t}</button>`).join('')}<button data-ir2="loja" class="cm-loja"><i>＋</i>Loja</button></nav>
    <div class="cm-area">${['navios', 'todos'].includes(aba) ? `<div class="cm-filtro"><label>${titulo}</label><select data-ordem>${ORDENS.map(([k, t]) => `<option value="${k}" ${k === ordem ? 'selected' : ''}>${t}</option>`).join('')}</select><small>Preços variam todo dia · renovam em ${tempoAteVirar()}</small></div>` : `<div class="cm-filtro"><label>${titulo}</label></div>`}<div class="cm-corpo">${corpo}</div></div>`);
  el.querySelector('[data-ordem]') && el.querySelector('[data-ordem]').addEventListener('change', (e) => { som(); telaMercado(D, aba, e.target.value); });
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset;
    if (d.aba) { som(); return telaMercado(D, d.aba); } if (d.ir2) { som(); return telaLoja(D); }
    if (d.nav) { som(); return D.fichaNavio(d.nav, () => telaMercado(D, aba, ordem)); }
    if (d.hd) { som(); return D.irHidro(d.hd); }
    if (d.pint) { som(); return D.previaPintura(d.pint, () => telaMercado(D, aba, ordem)); }
    if (d.of) { const o = of.find((q) => q.id === d.of); const r = comprarOferta(eco, o, save); if (r.ok && r.txt) { mostraPremio(D, r); } else eventoCompra(r.ok, r.ok ? `${o.titulo} adquirido` : r.motivo); return telaMercado(D, aba); }
    if (d.cx) { const r = abreCaixa(eco, d.cx, save); if (!r.ok && r.motivo) { eventoCompra(false, r.motivo); return; } mostraPremio(D, r, CAIXAS[d.cx]); return telaMercado(D, aba); }
    if (d.tr) { const c = CAMBIO.find((q) => q.id === d.tr); const r = trocar(eco, c, +d.q); eventoCompra(r.ok, r.ok ? `+${n0(r.v)} de ${c.para}` : r.motivo); return telaMercado(D, aba); } });
  void toast; void voltar; }
/* v1.2.47: TODAS as camuflagens do jogo, as mais poderosas primeiro (bônus em todos os atributos > casco extra > furtividade > preço) */
const forcaPint = (p) => { const P = PINTURAS[p]; return (P.bonus || 0) * 1e4 + (P.hp || 0) * 1e3 + (P.furt || 0) * 1e2 + (P.ouro ? P.ouro * 400 : P.prata || 0) / 1e6; };
const PINTURAS_LISTA = () => Object.keys(PINTURAS).filter((p) => !PINTURAS[p].fabrica).sort((a, b) => forcaPint(b) - forcaPint(a));
/** Janela de compra do navio: foto grande, dados e COMPRAR em Nexos (ou ver no estaleiro). */
function confirmaNavio(D, k, volta) { const { eco, eventoCompra } = D; const C = CLASSES[k], v = variacaoDia(k), pr = Math.round(precoNavioNx(k) * (1 + v) / 10) * 10, tem = eco.possui(k);
  const m = document.createElement('div'); m.className = 'mk-premio cm-modal'; m.style.setProperty('--cx', C.lendario ? '#a78bfa' : '#38bdf8');
  m.innerHTML = `<div class="mk-pcx cm-mcx"><small>${C.classe} · ${C.superLend ? 'SUPER LENDÁRIO' : C.lendario ? 'LENDÁRIO' : 'Nível ' + ROMANO[C.tier || 1]}</small><b>${C.nome} ${C.num}</b><i class="mk-foto" style="background-image:url(fotos/navios/${k}.webp)"></i>
    <p class="cm-dados">${C.L} m · ${Math.round(C.vmax * 1.17 * 1.944)} nós · casco ${n0(C.vida)} · ${C.vls ? C.vls + ' VLS · ' : ''}${C.canhao.torres}× ${C.canhao.agua ? 'canhão d’água' : C.canhao.cal + ' mm'}</p>
    <div class="cm-acoes">${tem ? '<span class="cm-tem">NA FROTA ✓</span>' : `<button class="btn primario" data-c="1">COMPRAR ${moedaHtml('nexos', pr)}</button>`}<button class="btn" data-v="1">VER NO ESTALEIRO</button><button class="btn" data-x="1">FECHAR</button></div></div>`;
  document.querySelector('#ui').appendChild(m);
  m.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) { if (e.target === m) m.remove(); return; } if (b.dataset.x) { m.remove(); return; } if (b.dataset.v) { m.remove(); D.irEstaleiro(k); return; }
    if (b.dataset.c) { if (!eco.gasta('nexos', pr)) { eventoCompra(false, `${NEXOS.nome} insuficientes`); return; } eco.e.possui[k] = 1; eco.e.pesquisados[k] = 1; eco.save.salva(); eventoCompra(true, `${C.nome} adicionado à frota`); m.remove(); volta(); } }); }
function mostraPremio(D, r, C) { const { som } = D; som('compra'); const m = document.createElement('div'); m.className = 'mk-premio' + (r.raro ? ' raro' : ''); m.style.setProperty('--cx', (C && C.cor) || '#38bdf8');
  m.innerHTML = `<div class="mk-pcx"><i class="mk-brilho"></i><small>${C ? C.nome : 'Prêmio'}</small><b>${r.txt}</b>${r.k ? `<i class="mk-foto" style="background-image:url(fotos/navios/${r.k}.webp)"></i>` : r.p ? `<i class="mk-foto sw" style="background:linear-gradient(135deg,${PINTURAS[r.p].cores[0]} 0 33%,${PINTURAS[r.p].cores[1]} 33% 66%,${PINTURAS[r.p].cores[2]} 66%)"></i>` : ''}<button class="btn primario">OK</button></div>`;
  document.querySelector('#ui').appendChild(m); m.querySelector('button').onclick = () => m.remove(); }

/** LOJA: pacotes de Nexos, ouro e prata. Offline: a compra é de TESTE (credita sem cobrança). */
export function telaLoja(D, aba = 'nexos') { const { mostra, voltar, eco, carteira, som, eventoCompra } = D;
  const nome = { nexos: `${NEXOS.icone} ${NEXOS.nome}`, ouro: '● Ouro', prata: '◈ Prata' };
  const el = mostra('loja', `${voltar('mercado')}${carteira()}<h2>Loja <small>pacotes · compras de teste offline, nada é cobrado</small></h2>
    <div class="mk-abas">${Object.keys(LOJA).map((k) => `<button data-aba="${k}" class="${k === aba ? 'on' : ''}">${nome[k]}</button>`).join('')}</div>
    <div class="lj-pacotes">${LOJA[aba].map((p, i) => `<div class="lj-p lj-${aba}${p.tag ? ' destq' : ''}" style="--n:${i}">${p.tag ? `<em>${p.tag}</em>` : ''}<i class="lj-ic"></i><b>${moedaHtml(aba, p.q)}</b>${p.bonus ? `<small>+${n0(p.bonus)} de bônus</small>` : '<small>&nbsp;</small>'}<button class="btn primario btn-peq" data-p="${p.id}">R$ ${p.rs.toFixed(2).replace('.', ',')} <span class="lj-teste">teste</span></button></div>`).join('')}</div>
    <p class="mu lj-nota">Versão offline: os valores em reais são ilustrativos e a compra credita na hora, sem pagamento. Na versão da Play Store a loja usará o Google Play Billing.</p>`);
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset; if (d.aba) { som(); return telaLoja(D, d.aba); } if (d.p) { const r = compraLoja(eco, aba, d.p); eventoCompra(r.ok, r.ok ? `+${n0(r.v)} (compra de teste)` : 'Pacote inválido'); return telaLoja(D, aba); } }); }
