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
export function telaMercado(D, aba = 'ofertas') { const { mostra, voltar, eco, save, carteira, som, toast, eventoCompra } = D;
  const of = ofertasDoDia(eco); const comp = save.d.mercado && save.d.mercado.dia === diaHoje() ? save.d.mercado.ok : {};
  const corpo = aba === 'ofertas' ? `<div class="mk-ofertas">${of.map((o) => `<div class="mk-of${o.destaque ? ' dest' : ''}${comp[o.id] ? ' feito' : ''}">
        ${o.foto ? `<i class="mk-foto" style="background-image:url(${o.foto})"></i>` : o.cores ? `<i class="mk-foto sw" style="background:linear-gradient(135deg,${o.cores[0]} 0 33%,${o.cores[1]} 33% 66%,${o.cores[2]} 66%)"></i>` : `<i class="mk-foto ic ic-${o.tipo}"></i>`}
        <em class="mk-desc">−${Math.round(o.desc * 100)}%</em><b>${o.titulo}</b><small>${o.sub}</small>
        <div class="mk-preco"><s>${moedaHtml(o.moeda, o.de)}</s>${moedaHtml(o.moeda, o.preco)}</div>
        <button class="btn primario btn-peq" data-of="${o.id}" ${comp[o.id] ? 'disabled' : ''}>${comp[o.id] ? 'RESGATADO ✓' : 'COMPRAR'}</button></div>`).join('')}</div><p class="mu mk-rel">Ofertas renovam em <b>${tempoAteVirar()}</b></p>`
    : aba === 'caixas' ? `<div class="mk-caixas">${Object.entries(CAIXAS).map(([id, C]) => `<div class="mk-cx" style="--cx:${C.cor}"><i class="mk-cxi"></i><b>${C.nome}</b><ul>${chanceTxt(C).map((t) => `<li>${t}</li>`).join('')}</ul>${C.garantia ? `<small>Garantia: pintura heroica ou lendária a cada ${C.garantia} caixas (${(save.d.caixas && save.d.caixas[id]) || 0} abertas)</small>` : ''}<button class="btn primario btn-peq" data-cx="${id}">ABRIR ${moedaHtml('nexos', C.preco)}</button></div>`).join('')}</div>`
    : `<div class="mk-cambio">${CAMBIO.map((c) => `<div class="mk-tr"><b>${c.txt}</b><div class="mk-q">${[10, 100, 1000].map((q) => `<button class="btn btn-peq" data-tr="${c.id}" data-q="${q}">${n0(q)} → ${n0(q * c.taxa)}</button>`).join('')}</div></div>`).join('')}</div>`;
  const el = mostra('mercado', `${voltar()}${carteira()}<h2>Mercado <small>moeda do jogo: ${NEXOS.icone} ${NEXOS.nome}</small></h2>
    <div class="mk-abas">${[['ofertas', 'OFERTAS DO DIA'], ['caixas', 'CAIXAS'], ['cambio', 'CÂMBIO']].map(([k, t]) => `<button data-aba="${k}" class="${k === aba ? 'on' : ''}">${t}</button>`).join('')}<button data-ir2="loja" class="mk-loja">＋ LOJA</button></div><div class="mk-corpo">${corpo}</div>`);
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset;
    if (d.aba) { som(); return telaMercado(D, d.aba); } if (d.ir2) { som(); return telaLoja(D); }
    if (d.of) { const o = of.find((q) => q.id === d.of); const r = comprarOferta(eco, o, save); if (r.ok && r.txt) { mostraPremio(D, r); } else eventoCompra(r.ok, r.ok ? `${o.titulo} adquirido` : r.motivo); return telaMercado(D, aba); }
    if (d.cx) { const r = abreCaixa(eco, d.cx, save); if (!r.ok && r.motivo) { eventoCompra(false, r.motivo); return; } mostraPremio(D, r, CAIXAS[d.cx]); return telaMercado(D, aba); }
    if (d.tr) { const c = CAMBIO.find((q) => q.id === d.tr); const r = trocar(eco, c, +d.q); eventoCompra(r.ok, r.ok ? `+${n0(r.v)} de ${c.para}` : r.motivo); return telaMercado(D, aba); } });
  void toast; }
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
