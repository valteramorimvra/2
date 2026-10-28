/* v1.2.16 (item 19): botão discreto "ocultar HUD" — deixa botões/textos/barras quase transparentes (0,07) e sem toque; tocar de novo restaura.
 * O próprio botão continua levemente visível. No estaleiro o arrastar/pinça/roda (ouvintes no próprio contêiner) continuam funcionando. */
export function botaoFantasma(el, { lado = 'dir', topo = 6, onToggle } = {}) {
  if (!el || el.querySelector(':scope > .btn-fantasma')) return null;
  const b = document.createElement('button'); b.className = 'btn-fantasma ' + (lado === 'esq' ? 'bf-esq' : 'bf-dir'); b.type = 'button'; b.style.top = `calc(env(safe-area-inset-top, 0px) + ${topo}px)`;
  b.setAttribute('aria-label', 'Ocultar interface'); b.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M1 8s2.6-4.6 7-4.6S15 8 15 8s-2.6 4.6-7 4.6S1 8 1 8z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.1" fill="currentColor"/></svg>';
  /* v1.2.21 item 21c: ligado = ícone de OLHO RISCADO (tocar volta a interface); 'fantasma-usado' desliga a animação de entrada para a transição de ida/volta ser suave */
  const OLHO = b.innerHTML, RISCADO = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M1 8s2.6-4.6 7-4.6S15 8 15 8s-2.6 4.6-7 4.6S1 8 1 8z" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2.1" fill="currentColor"/><path d="M2.2 13.8L13.8 2.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const alterna = (ev) => { ev.preventDefault(); ev.stopPropagation(); if (!el.classList.contains('fantasma-usado')) { el.classList.add('fantasma-usado'); for (const c of el.children) void getComputedStyle(c).opacity; /* fixa o estilo 'antes' sem a animação de entrada → a ida também tem transição */ } const on = el.classList.toggle('ui-fantasma'); b.classList.toggle('on', on); b.innerHTML = on ? RISCADO : OLHO; b.setAttribute('aria-label', on ? 'Mostrar interface' : 'Ocultar interface'); if (onToggle) onToggle(on); };
  b.addEventListener('pointerdown', (e) => e.stopPropagation()); b.addEventListener('click', alterna); el.appendChild(b); return b;
}
