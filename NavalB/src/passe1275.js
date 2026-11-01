/** v1.2.75 — passe de batalha offline. v1.2.99: 30 fases, uma batalha completa por fase; prêmio final = cruzador (tier 3). */
export const PASSE_N = 30;
export const PASSE_XP = 160;
export const PASSE_NAVIO = 'cruzador';
export function estPasse(eco) { const e = eco.e; if (!e.passe1275) e.passe1275 = { xp: 0, res: {} }; return e.passe1275; }
export function somaPasse(eco, x) { if (x > 0) estPasse(eco).xp += x; }
export const nivelPasse = (p) => Math.min(PASSE_N, Math.floor((p.xp || 0) / PASSE_XP));
export function premioPasse(i) {
  if (i === PASSE_N) return { ouro: 240, prata: 180000, navio: PASSE_NAVIO, nome: 'Cruzador', fig: 'fotos/navios/cruzador.webp' };
  if (i % 10 === 0) return { ouro: 60 + i * 6, nome: `${60 + i * 6} de ouro`, fig: '' };
  if (i % 5 === 0) return { prata: 150000 + i * 10000, nome: 'prata extra', fig: '' };
  return { prata: 45000 + i * 3000, nome: 'prata', fig: '' };
}
export function resgataPasse(eco, i) {
  const P = estPasse(eco); if (!(i >= 1 && i <= nivelPasse(P))) return { ok: false, msg: 'Fase ainda fechada' }; if (P.res[i]) return { ok: false, msg: 'Já resgatada' };
  const q = premioPasse(i); if (q.ouro) eco.credita('ouro', q.ouro); if (q.prata) eco.credita('prata', q.prata);
  if (q.navio && eco.e) { eco.e.possui[q.navio] = 1; eco.e.pesquisados[q.navio] = 1; }
  P.res[i] = 1; return { ok: true, msg: q.navio ? `Fase ${i} — ${q.nome} na frota` : `Fase ${i} — ${q.nome}` };
}
export function htmlPasse(eco) {
  const P = estPasse(eco), nv = nivelPasse(P); let b = '';
  for (let i = 1; i <= PASSE_N; i++) {
    const q = premioPasse(i), ok = i <= nv, feito = !!P.res[i];
    const fig = q.fig ? `<i class="ps-fig" style="background-image:url(${q.fig})"></i>` : `<i class="ps-fig ps-${q.ouro ? 'o' : 'p'}">${q.ouro ? '●' : '◈'}</i>`;
    b += `<button type="button" class="ps-it${feito ? ' feito' : ''}${ok ? ' aberto' : ''}" data-tier="${i}" ${ok && !feito ? '' : 'disabled'}>${ok ? '' : '<s class="ps-lock">🔒</s>'}${fig}<b>${i}</b><small>${q.nome}</small></button>`;
  }
  const nav = premioPasse(PASSE_N);
  return `<div class="ps-tela"><h2>Passe de Batalha</h2><p class="mu">Cada batalha completa abre uma fase. Fase <b>${nv}</b> de ${PASSE_N}. Teste drive não conta.</p><div class="ps-grade">${b}</div><button type="button" class="ps-final" data-ps-navio><img src="${nav.fig}" alt="">${nv < PASSE_N ? '<s class="ps-lock">🔒</s>' : ''}<span><b>Prêmio final</b><small>${nav.nome} · tier 3</small></span></button><div class="ps-zoom" hidden><button type="button" class="btn ps-volta" data-ps-volta>‹ Voltar</button><div class="ps-info"></div></div></div>`;
}
