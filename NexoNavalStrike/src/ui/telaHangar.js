// v1.2.61 — TELA DO HANGAR (layout do modelo do Valter): barra superior (← HANGAR · LOJA · ÁRVORE TECNOLÓGICA), coluna direita com
// as aeronaves (miniaturas 3D reais), ficha à esquerda, ROTAÇÃO / UPGRADE embaixo à esquerda, abas ARMAS · AERONAVES · MÍSSEIS e indicador 360°.
// O galpão 3D (render/hangar3d.js) usa o mesmo renderizador do jogo; arrastar = girar 360°, pinça/roda = aproximar.
import { AERONAVES, AERO, CAT_AERO, MISSEIS_AERO, fichaAero, perfilArma, armaAero, escolheArmaAero, armaFixaNoVoo, possuiAero, compraAero, nivelAero, custoUpgrade, upgradeAero, ehHeliNavio, camoAero, escolheCamoAero } from '../aeronaves.js';
import { CAMO_AEREO, ORDEM_CAMO_AEREO } from '../camoAereo.js'; /* v1.2.69: aba PINTURA */
import { CLASSES, HELIS } from '../sim/classes.js';
import './hangar.css';

const MINI = new Map(); /* miniaturas já renderizadas (data URL) — guardadas no aparelho: Comércio e Árvore mostram a foto 3D real */
const CHAVE_MINI = 'nns-mini-aero-4'; /* v1.2.69: miniaturas refeitas com o acabamento novo */ try { const o = JSON.parse(localStorage.getItem(CHAVE_MINI) || '{}'); for (const k in o) MINI.set(k, o[k]); } catch (e) { /* sem armazenamento: renderiza de novo */ }
const guardaMini = () => { try { localStorage.setItem(CHAVE_MINI, JSON.stringify(Object.fromEntries(MINI))); } catch (e) { /* cota cheia: só memória */ } };
export const miniAero = (id) => MINI.get(id); /* também usadas no Comércio e na Árvore */
const maxVida = (a) => Math.max(...AERONAVES.filter((q) => !q.modelo.hidro === !a.modelo.hidro).map((q) => fichaAero(q.id).vida)); /* blindagem relativa à família (hidro × aeronaves de navio) */
const n0 = (v) => Math.round(v).toLocaleString('pt-BR');
const precoTxt = (a) => (a.preco.ouro ? `● ${n0(a.preco.ouro)}` : a.preco.prata ? `◎ ${n0(a.preco.prata)}` : 'GRÁTIS');
const SVG = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

export function telaHangar({ jogo, eco, save, som, eventoCompra, mostra, TELAS, testeDriveAero }) {
  const H = jogo.abreHangar(); if (!H) { TELAS.estaleiro(); return; }
  const st = (save.d.hangar = save.d.hangar || {}); let sel = AERO[st.sel] ? st.sel : 'raio', cat = st.cat || 'todas', aba = st.aba || 'aeronaves';
  const emUso = (id) => { const a = AERO[id]; if (a.modelo.hidro) return (save.ultimo.hidro || 'albatroz') === a.modelo.hidro; const k = save.ultimo.classe; return ehHeliNavio(id) && CLASSES[k] && CLASSES[k].heli ? eco.helisDe(k)[0] === id : false; };
  const el = mostra('hangar', `
  <header class="hg-top"><button class="hg-volta" data-a="volta">${SVG('<path d="M15 5l-7 7 7 7"/>')}<b>HANGAR</b></button><span class="hg-esp"></span>
    <button class="hg-tb" data-ir="loja">${SVG('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>')}LOJA</button><button class="hg-tb" data-ir="arvore">${SVG('<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M6 8.2v3.3h12V8.2M12 11.5v4.3"/>')}ÁRVORE TECNOLÓGICA</button></header>
  <aside class="hg-ficha"></aside>
  <div class="hg-360"><i></i><b>360°</b></div>
  <nav class="hg-lista"></nav>
  <div class="hg-acoes"><button data-a="rot" class="hg-ac">${SVG('<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>')}<b>ROTAÇÃO</b></button><button data-a="upg" class="hg-ac">${SVG('<path d="M12 19V6M6 11l6-6 6 6"/><path d="M5 21h14"/>')}<b>UPGRADE</b><small></small></button><button data-a="teste" class="hg-ac hg-teste">${SVG('<path d="M3 15l9-9 3 3-9 9H3z"/><path d="M14 4l6 6"/><path d="M16 14l4 4"/>')}<b>TESTE DRIVE</b><small>sai da base</small></button></div>
  <section class="hg-baixo"><nav class="hg-abas"><button data-aba="armas">ARMAS</button><button data-aba="aeronaves">AERONAVES</button><button data-aba="misseis">MÍSSEIS</button><button data-aba="pintura">PINTURA</button></nav><div class="hg-cards"></div></section>
  <div class="hg-atalhos"><button class="hg-big" data-ir="loja">${SVG('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>')}<b>LOJA</b></button><button class="hg-big" data-ir="arvore">${SVG('<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M6 8.2v3.3h12V8.2M12 11.5v4.3"/>')}<b>ÁRVORE TECNOLÓGICA</b></button></div>`, { transp: true });
  const $ = (s) => el.querySelector(s), lista = () => AERONAVES.filter((a) => cat === 'todas' || a.cat === cat);
  const desenhaLista = () => { $('.hg-lista').innerHTML = lista().map((a) => { const f = fichaAero(a.id), tem = possuiAero(eco, a.id);
    return `<button class="hg-it${a.id === sel ? ' on' : ''}${tem ? '' : ' bloq'}" data-id="${a.id}"><i class="hg-mini"${MINI.has(a.id) ? ` style="background-image:url(${MINI.get(a.id)})"` : ''}></i><b>${f.nome.split(' ').pop()}</b><small>${tem ? (emUso(a.id) ? 'EM USO' : 'T' + a.tier + ' · nv ' + nivelAero(eco, a.id)) : precoTxt(a)}</small></button>`; }).join('');
    const on = $('.hg-it.on'); if (on) on.scrollIntoView({ block: 'nearest' }); };
  const desenhaFicha = () => { const a = AERO[sel], f = fichaAero(sel), tem = possuiAero(eco, sel), nv = nivelAero(eco, sel); const barra = (r, v, max) => `<div class="hg-b"><span>${r}</span><i style="--v:${Math.min(1, v / max)}"></i><em>${v}</em></div>`;
    const acao = !tem ? `<button class="hg-comprar" data-a="compra">COMPRAR · ${precoTxt(a)}</button>` : a.modelo.hidro || ehHeliNavio(sel) ? (emUso(sel) ? '<button class="hg-usar on" disabled>EM USO ✓</button>' : '<button class="hg-usar" data-a="usa">USAR NA BATALHA</button>') : '<p class="hg-ala">Voa na ala dos porta-aviões e gigantes — o nível vale na batalha.</p>';
    $('.hg-ficha').innerHTML = `<small class="hg-cat">${(CAT_AERO.find((c) => c[0] === a.cat) || [, ''])[1]} · TIER ${'I II III IV V'.split(' ')[a.tier - 1]}</small><h2>${f.nome}</h2><p class="hg-papel">${a.papel}</p>
      ${barra('Velocidade', f.vmax, 1000)}${barra('Blindagem', Math.round(100 * f.vida / maxVida(a)), 100)}${barra('Arma (km)', +(f.alcance / 1000).toFixed(1), 16)}${barra('Sensor (km)', Math.round(f.sensor / 1000), 26)}
      <div class="hg-nv">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= nv ? 'on' : ''}"></i>`).join('')}<span>Nível ${nv}/5</span></div>${acao}`;
    const bu = $('[data-a="upg"]'); bu.classList.toggle('off', !tem || nv >= 5); bu.querySelector('small').textContent = tem && nv < 5 ? '◎ ' + n0(custoUpgrade(sel, nv)) : nv >= 5 ? 'MÁXIMO' : ''; $('[data-a="rot"]').classList.toggle('on', !!H.auto); };
  const desenhaCards = () => { el.querySelectorAll('[data-aba]').forEach((b) => b.classList.toggle('on', b.dataset.aba === aba)); const a = AERO[sel]; let h;
    if (aba === 'armas') { const fixa = armaFixaNoVoo(sel), ia = armaAero(eco, sel), H0 = HELIS[a.modelo.heli] || null;
      h = a.armas.map((w, i) => { const P = perfilArma(w, H0), on = fixa ? !/sem armas/i.test(w) : i === ia, det = P ? (P.arma ? `${P.rotulo} · alcance ${(P.alc / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km` : P.rotulo) : 'Apoio — revela alvos';
        return `<button class="hg-card hg-arma${on ? ' on' : ''}${fixa ? ' fixa' : ''}" data-arma="${i}"><b>${w}</b><small>${det}</small><em>${fixa ? (P ? 'A BORDO' : 'RADAR') : on ? 'ARMA PRINCIPAL ✓' : 'TOQUE PARA USAR'}</em></button>`; }).join('')
        + `<div class="hg-card hg-insp"><b>${fixa ? 'Escolha no voo' : 'Inspiração'}</b><small>${fixa ? 'Leva todas as armas; você escolhe nos botões ao pilotar' : a.insp}</small></div>`; }
    else if (aba === 'pintura') { const ca = camoAero(eco, sel), ori = a.modelo.hidro ? 'Plumagem original' : a.cat === 'bomb' ? 'Forças Armadas (original)' : 'Cinza naval (original)';
      h = ORDEM_CAMO_AEREO.map((k) => { const K = CAMO_AEREO[k], cs = [K.c, K.c3, K.c2, K.cv].filter(Boolean); return `<button class="hg-card hg-camo${k === ca ? ' on' : ''}" data-camo="${k}"><b>${k === 'padrao' ? ori : K.nome}</b><small class="hg-sw">${k === 'padrao' && a.modelo.hidro ? '<i style="background:linear-gradient(90deg,#d9dcdc,#b8301f,#3d3527)"></i>' : cs.map((c) => `<i style="background:${c}"></i>`).join('')}</small><em>${k === ca ? 'EM USO ✓' : K.p ? 'Padrão ' + K.p : 'Liso'}</em></button>`; }).join('')
        + '<div class="hg-card hg-insp"><b>Só visual</b><small>Painéis, rebites e desgaste em todas; nenhuma pintura de aeronave dá bônus</small></div>'; }
    else if (aba === 'misseis') { const tem = (m) => a.armas.some((w) => w.toLowerCase().startsWith(m[1].split(' (')[0].toLowerCase().slice(0, 9))); h = MISSEIS_AERO.map((m) => `<div class="hg-card${tem(m) ? ' on' : ' off'}"><b>${m[1]}</b><small>${m[2]}</small><em>${tem(m) ? 'NESTA AERONAVE' : 'não leva'}</em></div>`).join(''); }
    else h = [['todas', 'Todas'], ...CAT_AERO].map(([c, nm]) => `<button class="hg-card hg-cat-b${c === cat ? ' on' : ''}" data-cat="${c}"><b>${nm}</b><small>${c === 'todas' ? AERONAVES.length : AERONAVES.filter((q) => q.cat === c).length} aeronaves</small></button>`).join('');
    $('.hg-cards').innerHTML = h; };
  const escolhe = (id) => { sel = id; st.sel = id; save.salva(); H.mostra(AERO[id], camoAero(eco, id)); desenhaLista(); desenhaFicha(); desenhaCards(); };
  const tudo = () => { desenhaLista(); desenhaFicha(); desenhaCards(); };
  H.mostra(AERO[sel], camoAero(eco, sel)); tudo();
  /* miniaturas: uma por vez, sem travar a interface (cada uma monta o modelo e renderiza 220×130 fora da tela) */
  const fila = AERONAVES.filter((a) => !MINI.has(a.id)).map((a) => a.id); const proxima = () => { if (!H.ativo || !fila.length) return; const id = fila.shift(); try { MINI.set(id, H.miniatura(AERO[id])); const b = el.querySelector(`.hg-it[data-id="${id}"] .hg-mini`); if (b) b.style.backgroundImage = `url(${MINI.get(id)})`; if (!fila.length) guardaMini(); } catch (e) { /* segue sem miniatura */ } setTimeout(proxima, 70); }; setTimeout(proxima, 400);
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.id) { som(); escolhe(d.id); }
    else if (d.arma != null) { som(); if (armaFixaNoVoo(sel)) { eventoCompra(true, 'Leva todas as armas — escolha nos botões durante o voo'); return; } const r = escolheArmaAero(eco, sel, +d.arma); eventoCompra(r.ok, r.msg); if (r.ok) save.salva(); desenhaCards(); }
    else if (d.camo) { som(); const r = escolheCamoAero(eco, sel, d.camo); if (r.ok) { if (AERO[sel].cat === 'bomb') save.ajustes.pinturaBomb = d.camo === 'padrao' ? 'fab' : 'aero:' + d.camo; /* o bombardeiro usa a pintura dos Ajustes */ save.salva(); H.mostra(AERO[sel], d.camo); } eventoCompra(r.ok, `${d.camo === 'padrao' ? 'Pintura original' : CAMO_AEREO[d.camo].nome} — ${fichaAero(sel).nome}`); desenhaCards(); }
    else if (d.aba) { som(); aba = st.aba = d.aba; save.salva(); desenhaCards(); }
    else if (d.cat) { som(); cat = st.cat = d.cat; save.salva(); if (cat !== 'todas' && AERO[sel].cat !== cat) escolhe(lista()[0].id); else tudo(); }
    else if (d.a === 'volta') { som(); TELAS.inicio(); }
    else if (d.a === 'teste') { som(); if (/sem armas/i.test(AERO[sel].armas[0]) && !AERO[sel].modelo.heli) return; if (testeDriveAero) testeDriveAero(sel); }
    else if (d.a === 'rot') { som(); H.auto = !H.auto; H.tAuto = 0; desenhaFicha(); }
    else if (d.a === 'upg') { const r = upgradeAero(eco, sel); eventoCompra(r.ok, r.msg); if (r.ok) save.salva(); tudo(); }
    else if (d.a === 'compra') { const r = compraAero(eco, sel); eventoCompra(r.ok, r.msg); if (r.ok) save.salva(); tudo(); }
    else if (d.a === 'usa') { const a = AERO[sel], k = save.ultimo.classe; if (a.modelo.hidro) { save.ultimo.hidro = a.modelo.hidro; save.salva(); eventoCompra(true, `${fichaAero(sel).nome} — botão HIDRO em qualquer navio`); }
      else if (CLASSES[k] && CLASSES[k].heli) { eco.escolherHeli(k, 0, sel); eventoCompra(true, `${fichaAero(sel).nome} no hangar 1 do ${CLASSES[k].nome}`); } else eventoCompra(false, `O ${CLASSES[k] ? CLASSES[k].nome : 'navio atual'} não tem hangar — escolha um navio com helicóptero`); tudo(); } });
  /* toque: 1 dedo gira 360° (fora dos painéis), 2 dedos = pinça; roda do mouse = zoom */
  const pts = new Map(); let d0 = 0;
  el.addEventListener('pointerdown', (e) => { const pn = e.target.closest('button,aside,nav,section,header'); if (pn && pn !== el) return; /* v1.2.65: a própria tela é uma <section> — antes todo toque era ignorado e o 360° não girava com o dedo */ try { el.setPointerCapture(e.pointerId); } catch (er) { /* sem captura: segue */ } pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2) { const [p, q] = [...pts.values()]; d0 = Math.hypot(p[0] - q[0], p[1] - q[1]); } });
  el.addEventListener('pointermove', (e) => { const p0 = pts.get(e.pointerId); if (!p0) return; if (pts.size === 1) H.arrasta(e.clientX - p0[0], e.clientY - p0[1]); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [p, q] = [...pts.values()], d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d0 > 0) H.zoom(d0 / d); d0 = d; } });
  const fim = (e) => { pts.delete(e.pointerId); d0 = 0; }; el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', fim);
  el.addEventListener('wheel', (e) => { e.preventDefault(); H.zoom(e.deltaY > 0 ? 1.1 : 0.9); }, { passive: false });
}
