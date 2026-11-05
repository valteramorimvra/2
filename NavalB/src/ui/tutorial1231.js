// v1.2.31 — TUTORIAL OPCIONAL guiado (estilo Modern Warships): foco (spotlight) nos botões REAIS do HUD, cartão num canto (nunca no centro),
// avanço por PRÓXIMO ou fazendo a ação, PULAR a qualquer momento. NÃO bloqueia o jogo (overlay com pointer-events:none; só o cartão recebe toque).
// Estado em localStorage ('nns_tutorial1231'). Oferecido na 1ª abertura (sem forçar) e sempre disponível no menu. Sem THREE, sem rede.
import { PASSOS_1231 } from './tutorialPassos1231.js';
import { LIGAR_1232 } from './manualDados1231.js';
import { interpola, contexto } from './manualConteudo1231.js';
import { FONTES_1231 } from './fontes1231.js';
import './manualTutorial1231.css';

let _ctx = null; const CTX_TUTORIAL = () => _ctx || (_ctx = contexto(FONTES_1231));
export const LS_TUTORIAL = 'nns_tutorial1231';
const lerLS = () => { try { return JSON.parse(localStorage.getItem(LS_TUTORIAL)) || {}; } catch (e) { return {}; } };
const gravaLS = (o) => { try { localStorage.setItem(LS_TUTORIAL, JSON.stringify(o)); } catch (e) { /* sem storage: segue sem lembrar */ } };
/** { oferecido, concluido, pulado, naoPerguntar, passo } */
export const estadoTutorial1231 = () => lerLS();
export const salvaEstadoTutorial1231 = (parcial) => gravaLS({ ...lerLS(), ...parcial });
/** Oferecer na 1ª abertura: nunca perguntado e jogador não pediu para não perguntar mais. */
export const deveOferecerTutorial1231 = () => { const e = lerLS(); return !e.oferecido && !e.naoPerguntar && !e.concluido; };

/** Oferta (não forçada) na 1ª abertura: cartão pequeno no canto, o menu continua usável. `aceitar()` abre o tutorial. */
export function ofereceTutorial1231({ raiz = document.body, aceitar, som = () => {} }) {
  salvaEstadoTutorial1231({ oferecido: true });
  const el = document.createElement('div'); el.className = 'tt-oferta';
  el.innerHTML = '<b>Quer um tutorial rápido?</b><span>Guia pelos botões do jogo, num mar calmo. Dá para pular a qualquer momento.</span><div><button data-o="sim" class="tt-sim">FAZER AGORA</button><button data-o="nao">AGORA NÃO</button><button data-o="nunca">NÃO PERGUNTAR MAIS</button></div>';
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-o]'); if (!b) return; som(); if (b.dataset.o === 'nunca') salvaEstadoTutorial1231({ naoPerguntar: true }); el.remove(); if (b.dataset.o === 'sim') aceitar(); });
  raiz.appendChild(el); return el;
}

const visivel = (e) => { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false; for (let n = e; n && n !== document.body; n = n.parentElement) { if (n.hidden) return false; const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
const achaAlvo = (raiz, seletores) => { for (const s of seletores || []) { for (const e of raiz.querySelectorAll(s)) if (visivel(e)) return e; } return null; };

export class Tutorial1231 {
  /** @param {{raiz?:HTMLElement, hud:HTMLElement, jogo?:any, passos?:any[], aoFim?:Function, som?:Function, passoInicial?:number}} o */
  constructor({ raiz = document.body, hud, jogo = null, passos = PASSOS_1231, aoFim = () => {}, som = () => {}, passoInicial = 0 }) {
    this.raiz = raiz; this.hud = hud; this.jogo = jogo; this.aoFim = aoFim; this.som = som;
    this.passos = passos.filter((p) => LIGAR_1232 || !p.desde); this.i = Math.max(0, Math.min(passoInicial, this.passos.length - 1)); this.ativo = false; this.feito = false; this.tFeito = 0;
    const el = (this.el = document.createElement('div')); el.className = 'tt'; el.innerHTML = '<div class="tt-anel" hidden></div><div class="tt-cartao"><div class="tt-topo"><small></small><button class="tt-x" data-t="pula" aria-label="Pular tutorial">PULAR ✕</button></div><b class="tt-tit"></b><p class="tt-txt"></p><p class="tt-aviso" hidden></p><div class="tt-bts"><button data-t="ant">‹</button><i class="tt-pts"></i><button data-t="prox" class="tt-prox">PRÓXIMO ›</button></div></div>';
    this.anel = el.querySelector('.tt-anel'); this.cartao = el.querySelector('.tt-cartao');
    this.q = (s) => this.cartao.querySelector(s);
    this.cartao.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; this.som(); if (b.dataset.t === 'pula') this.pula(); else if (b.dataset.t === 'prox') this.vai(this.i + 1); else if (b.dataset.t === 'ant') this.vai(this.i - 1); });
    this._tick = this._tick.bind(this);
  }
  inicia() { this.ativo = true; globalThis.__nnsTutorial1231 = true; /* silencia as DICAS antigas do jogo enquanto o tutorial roda */ this.raiz.appendChild(this.el); this.mostra(); this._raf = requestAnimationFrame(this._tick); return this; }
  passo() { return this.passos[this.i]; }
  vai(n) { if (n >= this.passos.length) return this.conclui(); this.i = Math.max(0, n); this.feito = false; this.tFeito = 0; salvaEstadoTutorial1231({ passo: this.i }); this.mostra(); }
  mostra() {
    const p = this.passo(); this.alvoEl = null; this.q('small').textContent = `PASSO ${this.i + 1}/${this.passos.length}`; this.q('.tt-tit').textContent = p.titulo; this.q('.tt-txt').innerHTML = interpola(p.texto, CTX_TUTORIAL()); /* números da 1.2.30 vêm do jogo; sem valor → PENDENTE */
    this.q('.tt-pts').innerHTML = this.passos.map((_, k) => `<s${k === this.i ? ' class="on"' : k < this.i ? ' class="ok"' : ''}></s>`).join('');
    this.q('.tt-prox').textContent = this.i === this.passos.length - 1 ? 'CONCLUIR ✓' : 'PRÓXIMO ›'; this.q('[data-t=ant]').disabled = this.i === 0; this.cartao.classList.remove('feito');
    this._posiciona(true);
  }
  _posiciona(forca) {
    const p = this.passo(); const al = p.alvo ? achaAlvo(this.hud, p.alvo) : null; const av = this.q('.tt-aviso');
    if (p.alvo && !al && p.semAlvo) { av.hidden = false; av.textContent = p.semAlvo; } else av.hidden = true;
    this.alvoEl = al;
    if (!al) { this.anel.hidden = true; this._lugar(null); return; }
    const r = al.getBoundingClientRect(), pad = 6; const k = `${r.left | 0},${r.top | 0},${r.width | 0},${r.height | 0}`; if (!forca && k === this._k) return; this._k = k;
    Object.assign(this.anel.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px', borderRadius: Math.min(r.width, r.height) > 50 && Math.abs(r.width - r.height) < 12 ? '50%' : '12px' }); this.anel.hidden = false;
    this._lugar(r);
  }
  /** Cartão num dos 4 cantos (NUNCA no centro): o canto mais longe do foco que não o cobre. */
  _lugar(r) {
    const W = innerWidth, H = innerHeight, c = this.cartao, cw = c.offsetWidth || 280, ch = c.offsetHeight || 140, m = 8;
    const cantos = [['esq', 'topo', m, m], ['dir', 'topo', W - cw - m, m], ['esq', 'base', m, H - ch - m], ['dir', 'base', W - cw - m, H - ch - m]];
    let melhor = cantos[0], pior = -1;
    for (const q of cantos) { const x = q[2], y = q[3]; let d = 1e9; if (r) { const dx = Math.max(r.left - (x + cw), x - r.right, 0), dy = Math.max(r.top - (y + ch), y - r.bottom, 0); d = Math.hypot(dx, dy); if (dx === 0 && dy === 0) d = -1; } if (d > pior) { pior = d; melhor = q; } }
    c.style.left = melhor[2] + 'px'; c.style.top = melhor[3] + 'px';
  }
  _tick(t) {
    if (!this.ativo) return; this._raf = requestAnimationFrame(this._tick);
    if (!this.hud.isConnected) return this._fim(false); /* partida encerrada (sair pela pausa etc.): some sem gravar nada */
    const tela = document.getElementById('ui'); this.el.style.display = tela && !tela.hidden ? 'none' : ''; /* pausa/menu abertos: tutorial se esconde */
    if (this.el.style.display) return;
    this._posiciona(false);
    const p = this.passo(); if (!this.feito && p.ok) { let v = false; try { v = !!p.ok(this.jogo); } catch (e) { v = false; } if (v) { this.feito = true; this.tFeito = t; this.cartao.classList.add('feito'); } }
    if (this.feito && p.ok && t - this.tFeito > 1400) this.vai(this.i + 1);
  }
  pula() { salvaEstadoTutorial1231({ pulado: true, passo: this.i }); this._fim(false); }
  conclui() { salvaEstadoTutorial1231({ concluido: true, pulado: false, passo: 0 }); this._fim(true); }
  _fim(ok) { this.ativo = false; cancelAnimationFrame(this._raf); globalThis.__nnsTutorial1231 = false; this.el.remove(); try { this.aoFim(ok); } catch (e) { /* ignora */ } }
}
