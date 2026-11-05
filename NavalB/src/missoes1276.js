/** v1.2.76 — três missões do dia, offline. Renova à meia-noite local. Sem bônus de combate. */
const DIA = () => new Date().toDateString();
export const MISSOES = [
  { id: 'torp', nome: 'Torpedos', meta: 12000, txt: 'Cause 12.000 de dano com torpedos', prata: 90000 },
  { id: 'ar', nome: 'Caça', meta: 2, txt: 'Abata 2 aeronaves inimigas', ouro: 40 },
  { id: 'vit', nome: 'Vitória', meta: 1, txt: 'Vença 1 batalha', prata: 140000 },
];
const ch = { torp: 'torp', ar: 'ar', vit: 'vit' };
export function estMissoes(eco) { const e = eco.e; if (!e.mis1276 || e.mis1276.dia !== DIA()) e.mis1276 = { dia: DIA(), torp: 0, ar: 0, vit: 0, ok: {} }; return e.mis1276; }
export function somaMissao(eco, r) { if (!r) return; const s = r.stats || {}, M = estMissoes(eco); M.torp += s.dano_torpedo || 0; M.ar += s.helisAbatidos || 0; if (r.vitoria === true) M.vit += 1; }
export function pendMissoes(eco) { const M = estMissoes(eco); let n = 0; for (const q of MISSOES) if (!M.ok[q.id] && (M[ch[q.id]] || 0) >= q.meta) n++; return n; }
export function resgataMissao(eco, id) { const q = MISSOES.find((m) => m.id === id); const M = estMissoes(eco); if (!q) return { ok: false, msg: 'Missão inválida' }; if (M.ok[id]) return { ok: false, msg: 'Já resgatada' }; if ((M[ch[id]] || 0) < q.meta) return { ok: false, msg: 'Ainda não concluída' }; M.ok[id] = 1; if (q.prata) eco.credita('prata', q.prata); if (q.ouro) eco.credita('ouro', q.ouro); return { ok: true, msg: `${q.nome} — recompensa creditada` }; }
export function htmlMissoes(eco) { const M = estMissoes(eco); let b = ''; for (const q of MISSOES) { const v = Math.min(q.meta, M[ch[q.id]] || 0), pct = Math.round(100 * v / q.meta), feito = M.ok[q.id], ok = !feito && v >= q.meta; const premio = q.ouro ? `${q.ouro} de ouro` : `${(q.prata / 1000).toFixed(0)} mil de prata`; b += `<button data-mis="${q.id}" ${ok ? '' : 'disabled'} style="text-align:left;padding:10px 12px;border-radius:8px;border:1px solid #334155;background:${feito ? '#14532d' : '#0f172a'};color:#e2e8f0"><b>${q.nome}</b> — ${q.txt}<br><small>${premio} · ${v.toLocaleString('pt-BR')} / ${q.meta.toLocaleString('pt-BR')}</small><i style="display:block;height:6px;margin-top:6px;border-radius:3px;background:#1e293b;overflow:hidden"><s style="display:block;height:100%;width:${pct}%;background:${feito ? '#22c55e' : '#38bdf8'}"></s></i>${feito ? ' ✓' : ok ? ' · RESGATAR' : ''}</button>`; }
  return `<h2>Missões do dia</h2><p class="mu">Três tarefas curtas. Renovam amanhã. Não dão vantagem na batalha — só prata e ouro.</p><div style="display:grid;gap:8px;max-width:560px">${b}</div>`; }
