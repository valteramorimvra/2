// v1.2.31 — TELA DO MANUAL organizado (índice por categoria → seções). Acessível pelo menu principal (botão MANUAL).
// Rápido de abrir: o índice é só HTML estático; o conteúdo de cada seção é montado só quando você a abre (e fica em cache).
// Uso (main.js): telaManual1231({ mostra, voltar, som, fontes: FONTES_1231, abrirAntigo: () => TELAS.comoJogar() })
import './manualTutorial1231.css';
import { CREDITO_DEV, VERSAO_MANUAL, LINK_MANUAL_ANTIGO } from './manualDados1231.js';
import { categoriasAtivas, htmlSecao } from './manualConteudo1231.js';

const memoria = { cat: null, sec: {} }; // lembra onde o jogador estava (só enquanto o jogo está aberto)

export function htmlIndice1231(cats) {
  return `<div class="mn-idx" data-v="indice"><div class="mn-cards">${cats.map((c) => `<button class="mn-card-cat" data-cat="${c.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${c.icone}</svg><span><b>${c.titulo}</b><small>${c.resumo}</small></span><em>${c.secoes.length} seç.</em></button>`).join('')}</div></div>`;
}

export function telaManual1231({ mostra, voltar, som = () => {}, fontes, abrirAntigo = null, abrirTutorial = null, categoria = null, secao = null }) {
  const cats = categoriasAtivas(); const cache = new Map();
  const cabeca = (sub) => `<header class="mn-cab"><div><h2>MANUAL <small>${VERSAO_MANUAL}</small></h2>${sub ? `<span class="mn-mig">${sub}</span>` : ''}</div></header>`;
  const rodape = `<footer class="mn-rod"><span class="mn-dev">${CREDITO_DEV}</span><span>${abrirTutorial ? '<button class="mn-lnk" data-tut="1">Tutorial guiado</button> ' : ''}${abrirAntigo ? `<button class="mn-lnk" data-antigo="1">${LINK_MANUAL_ANTIGO.rotulo}</button>` : ''}</span></footer>`;
  const el = mostra('manual1231', `${voltar()}<div class="mn">${cabeca('')}<div class="mn-corpo"></div>${rodape}</div>`);
  const corpo = el.querySelector('.mn-corpo'), cab = el.querySelector('.mn-cab > div');
  const sec = (c, id) => c.secoes.find((s) => s.id === id) || c.secoes[0];

  function indice() { memoria.cat = null; cab.querySelector('.mn-mig')?.remove(); corpo.innerHTML = htmlIndice1231(cats); }
  function abreCat(id, secId) {
    const c = cats.find((x) => x.id === id); if (!c) return indice();
    memoria.cat = id; const s = sec(c, secId || memoria.sec[id]); memoria.sec[id] = s.id;
    cab.querySelector('.mn-mig')?.remove(); cab.insertAdjacentHTML('beforeend', `<span class="mn-mig"><button class="mn-ix" data-ix="1">‹ Índice</button> ${c.titulo}</span>`);
    corpo.innerHTML = `<div class="mn-cat" data-v="${c.id}"><nav class="mn-nav">${c.secoes.map((q) => `<button data-sec="${q.id}"${q.id === s.id ? ' class="on"' : ''}>${q.titulo}</button>`).join('')}</nav><article class="mn-art"></article></div>`;
    mostraSec(c, s);
  }
  function mostraSec(c, s) {
    const k = c.id + '/' + s.id; if (!cache.has(k)) cache.set(k, `<h3>${s.titulo}</h3>${htmlSecao(fontes, s)}`);
    const art = corpo.querySelector('.mn-art'); art.innerHTML = cache.get(k); art.scrollTop = 0;
    corpo.querySelectorAll('.mn-nav button').forEach((b) => b.classList.toggle('on', b.dataset.sec === s.id));
  }
  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat],[data-sec],[data-ix],[data-antigo],[data-tut]'); if (!t || !el.contains(t)) return;
    som();
    if (t.dataset.cat) abreCat(t.dataset.cat);
    else if (t.dataset.sec) { const c = cats.find((x) => x.id === memoria.cat); if (c) { memoria.sec[c.id] = t.dataset.sec; mostraSec(c, sec(c, t.dataset.sec)); } }
    else if (t.dataset.ix) indice();
    else if (t.dataset.antigo && abrirAntigo) abrirAntigo();
    else if (t.dataset.tut && abrirTutorial) abrirTutorial();
  });
  if (categoria) abreCat(categoria, secao); else indice();
  return el;
}
