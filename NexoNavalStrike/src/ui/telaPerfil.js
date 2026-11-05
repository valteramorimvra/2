// v1.2.62 — PERFIL DO JOGADOR (estatísticas de carreira, vitrine de troféus) e PROGRESSÃO 1→100 (trilha horizontal com prêmios).
// O retrato no menu é o COMANDANTE DO NAVIO escolhido; o perfil é do jogador (nome, nível, posto, números).
import { POSTOS, NIVEL_MAX_PERFIL, nomeNivel, promocao, xpTotal, nivelDe, premioNivel, estPerfil, semeiaTotais, resgataNivel, pendentes, CARREIRA, GRAUS, grauCarreira, insignia, postoIdx } from '../progressao.js';
import { MEDALHAS, ORDEM_MEDALHAS, nivelTrofeu } from '../navalTrofeus.js';
import { AERONAVES, possuiAero } from '../aeronaves.js';
import { leHistorico } from '../historico.js';
import './perfil.css';

const n0 = (v) => Math.round(v || 0).toLocaleString('pt-BR');
const pc = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '—');
const hm = (s) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h} h ${m} min` : `${m} min`; };
const chips = (p) => (p ? [p.prata && `<span class="pf-m p">◈ ${n0(p.prata)}</span>`, p.ouro && `<span class="pf-m o">● ${n0(p.ouro)}</span>`, p.nexos && `<span class="pf-m n">◆ ${n0(p.nexos)}</span>`].filter(Boolean).join('') : '<span class="pf-m">Início da carreira</span>');
/** Contexto das conquistas de carreira. */
export function ctxCarreira(eco) { const P = estPerfil(eco), T = eco.e.tot; return { T, navios: Object.keys(eco.e.possui || {}).filter((k) => eco.e.possui[k]).length, aero: AERONAVES.filter((a) => possuiAero(eco, a.id)).length, nivel: nivelDe(P.xp), medalhas: Object.values(eco.e.trofeus || {}).reduce((a, b) => a + b, 0) }; }
/** Itens da vitrine (medalhas de batalha e conquistas de carreira já conquistadas). */
function trofeusDisponiveis(eco) { const ctx = ctxCarreira(eco), L = [];
  for (const m of ORDEM_MEDALHAS) { const q = (eco.e.trofeus || {})[m] || 0; if (!q) continue; const nv = nivelTrofeu(q).atual; L.push({ id: 'm:' + m, ic: MEDALHAS[m].icone, nome: MEDALHAS[m].nome, sub: `${q}× · ${nv ? nv.nome : ''}`, cor: nv ? nv.cor : MEDALHAS[m].cor }); }
  for (const c of CARREIRA) { const g = grauCarreira(c, ctx); if (g.g < 0) continue; L.push({ id: 'c:' + c[0], ic: c[3], nome: c[1], sub: `${GRAUS[g.g][0]} · ${n0(g.v)} ${c[2].toLowerCase()}`, cor: GRAUS[g.g][1] }); } return L; }
export function iconesVitrine(eco) { const P = estPerfil(eco), D = trofeusDisponiveis(eco); return (P.vitrine || []).map((id) => D.find((d) => d.id === id)).filter(Boolean); }

export function telaPerfil({ mostra, eco, save, som, eventoCompra, TELAS, nome, cmd }) {
  const P = estPerfil(eco); semeiaTotais(eco, leHistorico()); save.salva(); const T = eco.e.tot, n = nivelDe(P.xp), ctx = ctxCarreira(eco);
  const derrotas = Math.max(0, T.batalhas - T.vitorias - T.empates), x0 = xpTotal(n), x1 = n < NIVEL_MAX_PERFIL ? xpTotal(n + 1) : x0;
  const est = [['Batalhas', n0(T.batalhas)], ['Vitórias', n0(T.vitorias)], ['Derrotas', n0(derrotas)], ['Empates', n0(T.empates)], ['Taxa de vitória', pc(T.vitorias, T.batalhas)], ['Vezes MVP', n0(T.mvp)],
    ['Navios na frota', n0(ctx.navios)], ['Aeronaves no hangar', `${ctx.aero}/${AERONAVES.length}`], ['Precisão de canhão', pc(T.acertos, T.tiros)], ['Navios afundados', n0(T.afundados)], ['Dano causado', n0(T.dano)], ['Dano recebido', n0(T.danoRec)],
    ['Mísseis no alvo', `${n0(T.misAcertos)}/${n0(T.misLanc)}`], ['Torpedos no alvo', `${n0(T.torpAcertos)}/${n0(T.torpLanc)}`], ['Abates antiaéreos', n0(T.aereos)], ['Tempo em combate', hm(T.tempo)]];
  const desenha = () => { const V = iconesVitrine(eco); const el = mostra('perfil', `<button class="btn-voltar" data-ir="inicio">‹ Voltar</button>
    <div class="pf-wrap"><section class="pf-id"><button class="pf-medalha" data-ir="progressao" title="Progressão do perfil">${insignia(n)}<b>${n}</b></button>
      <div class="pf-nome"><small>PERFIL DO JOGADOR</small><h2>${nome}</h2><p>${nomeNivel(n)} · nível ${n}/${NIVEL_MAX_PERFIL}</p><div class="pf-xp"><i style="width:${x1 > x0 ? Math.round((100 * (P.xp - x0)) / (x1 - x0)) : 100}%"></i></div><em>${n0(P.xp)} XP${n < NIVEL_MAX_PERFIL ? ` · faltam ${n0(x1 - P.xp)} para o nível ${n + 1}` : ' · nível máximo'}</em></div>
      <div class="pf-cmd">${cmd ? `<i style="background-image:url(${cmd.url});${cmd.css || ''}"></i><span><small>Comandante do navio</small><b>${cmd.nome}</b></span>` : ''}</div></section>
    <section class="pf-vit"><h3>Vitrine de troféus <button class="pf-ed" data-a="ed">Editar</button></h3><div class="pf-slots">${[0, 1, 2].map((i) => V[i] ? `<div class="pf-tr" style="--c:${V[i].cor}"><i>${V[i].ic}</i><b>${V[i].nome}</b><small>${V[i].sub}</small></div>` : '<button class="pf-tr vazio" data-a="ed"><i>＋</i><b>Espaço livre</b><small>escolha um troféu</small></button>').join('')}</div></section>
    <section class="pf-est"><h3>Estatísticas de carreira</h3><div class="pf-grade">${est.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div>
      <p class="pf-nota">Batalhas e vitórias contam desde o primeiro jogo. Os números detalhados somam ${n0(T.detalhadas)} batalha(s) registradas no aparelho.</p></section>
    <section class="pf-car"><h3>Conquistas de carreira <button class="pf-ed" data-ir="trofeus">Sala de troféus ›</button></h3><div class="pf-lista">${CARREIRA.map((c) => { const g = grauCarreira(c, ctx), w = g.prox ? Math.round((100 * (g.v - g.ini)) / (g.prox - g.ini)) : 100;
      return `<div class="pf-cq${g.g < 0 ? ' nada' : ''}" style="--c:${g.g >= 0 ? GRAUS[g.g][1] : '#475569'}"><i>${c[3]}</i><span><b>${c[1]}</b><small>${c[2]}: ${n0(g.v)}${g.prox ? ` / ${n0(g.prox)} (${GRAUS[g.g + 1][0]})` : ' · Ouro'}</small><u><s style="width:${Math.max(0, w)}%"></s></u></span></div>`; }).join('')}</div></section></div>`, {});
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-a="ed"]'); if (b) { som(); editaVitrine(); } }); };
  const editaVitrine = () => { const D = trofeusDisponiveis(eco), sel = new Set(P.vitrine || []); const m = document.createElement('div'); m.className = 'pf-modal';
    m.innerHTML = `<div class="pf-mcx"><h3>Escolha até 3 troféus para o perfil</h3><div class="pf-opc">${D.length ? D.map((d) => `<button class="pf-tr${sel.has(d.id) ? ' on' : ''}" data-id="${d.id}" style="--c:${d.cor}"><i>${d.ic}</i><b>${d.nome}</b><small>${d.sub}</small></button>`).join('') : '<p class="mu">Ainda sem troféus — vença batalhas e conquiste medalhas para exibi-las aqui.</p>'}</div><div class="pf-acs"><button class="btn primario" data-ok="1">SALVAR</button><button class="btn" data-x="1">CANCELAR</button></div></div>`;
    document.querySelector('#ui').appendChild(m);
    m.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; som(); if (b.dataset.x) { m.remove(); return; } if (b.dataset.ok) { P.vitrine = [...sel]; save.salva(); m.remove(); eventoCompra(true, 'Vitrine do perfil atualizada'); desenha(); return; }
      const id = b.dataset.id; if (sel.has(id)) sel.delete(id); else if (sel.size < 3) sel.add(id); else { eventoCompra(false, 'Máximo de 3 troféus'); return; } b.classList.toggle('on', sel.has(id)); }); };
  desenha(); void TELAS;
}

export function telaProgressao({ mostra, eco, save, som, eventoCompra }) {
  const P = estPerfil(eco), n = nivelDe(P.xp); let foco = n;
  const card = (i) => { const p = premioNivel(i), feito = i <= n, pego = !!P.premios[i], promo = i > 1 && promocao(i);
    return `<div class="pg-c${feito ? ' ok' : ''}${i === n ? ' atual' : ''}${promo ? ' promo' : ''}" data-n="${i}">${promo ? `<em class="pg-promo">PROMOÇÃO</em>` : ''}<div class="pg-med">${insignia(i)}<b>${i}</b></div><h4>${nomeNivel(i)}</h4><small>${i === 1 ? 'início' : n0(xpTotal(i)) + ' XP'}</small><div class="pg-prem">${chips(p)}</div>
      ${!p ? '<span class="pg-st">✓</span>' : pego ? '<span class="pg-st ok">RESGATADO ✓</span>' : feito ? `<button class="pg-res" data-res="${i}">RESGATAR</button>` : '<span class="pg-st lock">🔒 bloqueado</span>'}</div>`; };
  const x0 = xpTotal(n), x1 = n < NIVEL_MAX_PERFIL ? xpTotal(n + 1) : x0, pend = pendentes(eco);
  const el = mostra('progressao', `<button class="btn-voltar" data-ir="inicio">‹ Voltar</button>
    <header class="pg-topo"><div class="pg-eu">${insignia(n)}<span><small>PROGRESSÃO DO PERFIL</small><b>Nível ${n} · ${nomeNivel(n)}</b><div class="pf-xp"><i style="width:${x1 > x0 ? Math.round((100 * (P.xp - x0)) / (x1 - x0)) : 100}%"></i></div><em>${n0(P.xp)} XP${n < 100 ? ` · próximo nível em ${n0(x1)} XP` : ''}</em></span></div>
      <div class="pg-dir">${pend ? `<button class="pg-todos" data-a="todos">RESGATAR TODOS (${pend})</button>` : ''}<small>XP por batalha: participação, vitória, pontuação, medalhas e MVP.</small></div></header>
    <nav class="pg-postos">${POSTOS.map((q, i) => `<button data-p="${q[0]}" class="${postoIdx(n) === i ? 'on' : ''}${n >= q[0] ? ' feito' : ''}">${q[1]}</button>`).join('')}</nav>
    <div class="pg-faixa"><button class="pg-seta e" data-s="-1" aria-label="Anteriores">‹</button><div class="pg-trilha"><div class="pg-linha"></div>${Array.from({ length: NIVEL_MAX_PERFIL }, (_, i) => card(i + 1)).join('')}</div><button class="pg-seta d" data-s="1" aria-label="Próximos">›</button></div>`, {});
  const tr = el.querySelector('.pg-trilha'); const vai = (i, suave = true) => { foco = Math.max(1, Math.min(NIVEL_MAX_PERFIL, i)); const c = tr.querySelector(`[data-n="${foco}"]`); if (c) tr.scrollTo({ left: c.offsetLeft - tr.clientWidth / 2 + c.offsetWidth / 2, behavior: suave ? 'smooth' : 'auto' }); };
  requestAnimationFrame(() => vai(n, false));
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.s) { som(); const w = tr.querySelector('.pg-c').offsetWidth + 12; foco = Math.round((tr.scrollLeft + tr.clientWidth / 2) / w) + 1; vai(foco + (+d.s) * Math.max(1, Math.floor(tr.clientWidth / w) - 1)); }
    else if (d.p) { som(); vai(+d.p); }
    else if (d.res) { const r = resgataNivel(eco, +d.res); eventoCompra(r.ok, r.msg); if (r.ok) { save.salva(); const c = b.closest('.pg-c'); b.outerHTML = '<span class="pg-st ok">RESGATADO ✓</span>'; c.classList.add('pego'); } }
    else if (d.a === 'todos') { let k = 0; for (let i = 2; i <= n; i++) if (!P.premios[i] && resgataNivel(eco, i).ok) k++; save.salva(); eventoCompra(true, `${k} prêmio(s) resgatado(s)`); telaProgressao({ mostra, eco, save, som, eventoCompra }); } });
  /* arrastar com o dedo/mouse também desliza a trilha (além da rolagem nativa) */
  let x = null; tr.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') x = e.clientX; }); tr.addEventListener('pointermove', (e) => { if (x != null) { tr.scrollLeft -= e.clientX - x; x = e.clientX; } }); for (const ev of ['pointerup', 'pointerleave']) tr.addEventListener(ev, () => { x = null; });
}
