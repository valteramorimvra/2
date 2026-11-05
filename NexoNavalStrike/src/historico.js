// v1.2.16 item 29: HISTÓRICO das últimas 25 batalhas (offline, só no aparelho; FIFO 25). Compatível com saves antigos:
// chave própria, criada vazia na primeira gravação; não toca no save do perfil.
export const HIST_K = 'nns_historico_v1', HIST_MAX = 25;
export function leHistorico() { try { const a = JSON.parse(localStorage.getItem(HIST_K) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function grava(a) { try { localStorage.setItem(HIST_K, JSON.stringify(a)); return true; } catch (e) { return false; } }
/** r = resultado de terminou(); cfg = config da partida; nomePintura(p) → nome legível da camuflagem. */
export function registraBatalha(r, cfg, nomePintura) {
  if (!r || !Array.isArray(r.navios)) return null; const s = r.stats || {}; const eu = r.navios.find((q) => q.eu) || {};
  const e = { v: 1, id: Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), quando: Date.now(), modo: cfg && cfg.pers ? 'personalizado' : 'normal', mapa: r.mapa || '', resultado: r.vitoria === true ? 'vitoria' : r.vitoria === false ? 'derrota' : 'empate', motivo: r.motivo || '', duracao: Math.round(r.tempo || 0), navio: eu.nome || '', classe: eu.classe || '',
    geral: { dano: Math.round(s.dano || 0), danoRec: Math.round(s.danoRec || 0), tiros: s.tiros || 0, acertos: s.acertos || 0, afundados: s.abates || 0, aereos: (s.intercept || 0) + (s.menores || 0) + (s.helisAbatidos || 0), misLanc: s.misLanc || 0, misAcertos: s.misAcertos || 0, torpLanc: s.torpLanc || 0, torpAcertos: s.torpAcertos || 0, tempoVivo: Math.round(r.tempoVivo != null ? r.tempoVivo : r.tempo || 0), sobreviveu: !!r.sobreviveu },
    navios: r.navios.map((q) => ({ lado: q.time, eu: !!q.eu, cmd: q.cmd || '', nome: q.nome, classe: q.classe || '', camo: nomePintura ? nomePintura(q.pintura, q) : q.pintura || '', dano: q.dano || 0, danoRec: q.danoRec || 0, abates: q.abates || 0, aereos: q.abatidos || 0, tiros: q.tiros || 0, acertos: q.acertos || 0, morto: !!q.morto, vida: Math.round((q.vida || 0) * 100), mvp: q.id === r.mvpId, pts: q.pts || 0, merc: !!q.merc })) };
  const a = leHistorico(); a.unshift(e); while (a.length > HIST_MAX) a.pop(); if (!grava(a)) { while (a.length > 5 && !grava(a)) a.pop(); } return e;
}
export const precisao = (ac, ti) => (ti ? Math.round((100 * ac) / ti) + '%' : '—');
