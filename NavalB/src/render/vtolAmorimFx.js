// Naval B v1.3.08 — TELA dos caças Acauã e Uiraçu (Destróier Amorim). O voo, a câmera, a fumaça colorida, a neblina nas asas, o motor e a
// queda são os ORIGINAIS do Urubu-rei (sem adaptação). Aqui só os BOTÕES: DECOLAR (botão nuclear) → pilotagem do Urubu-rei; na tela,
// LANÇAR = NUKE · AR-AR = AAM · MÍSSIL = ASM · TORP, com a munição somada dos 2 caças (0 = esmaecido); o pilone disparado some; luzes do
// modelo piscando (estrobo/anticolisão); textos de caça no lugar de "bombardeiro". Zero alocação por quadro.
import { matsPisca, estacoesVtPorTipo } from './modeloVtol.js';
import { somaVt } from '../sim/vtolAmorim.js';

const ROT = { aam: 'AAM', asm: 'ASM', torp: 'TORP', nuke: 'NUKE' };
const NOME = { acaua: 'Acauã', uiracu: 'Uiraçu' };
const BT = { nkSolta: 'nuke', nkArAr: 'aam', hdMissil: 'asm', hdTorp: 'torp' };

export class VtolAmorimFx {
  constructor(j) { this.j = j; this._s = { aam: 0, asm: 0, torp: 0, nuke: 0 }; this._ult = { aam: -1, asm: -1, torp: -1, nuke: -1 }; this.nukes = [0, 0]; this._modo = false;
    const eu = j.eu; this.ativo = !!(eu && eu.C && eu.C.destAmorim);
  }
  /** caça pilotado na tela do Urubu-rei (ou null) */
  pilotado() { const j = this.j; if (!this.ativo || !j.nkPil) return null; const q = j.nkQ && j.nkQ(); return q && q.vtol ? q : null; }
  modo(on) { if (this._modo === on) return; this._modo = on; const H = this.j.hud; if (!H) return; H.el.classList.toggle('modo-vt', on); const r = H.r;
    const set = (k, t) => { const b = r['b_' + k] && r['b_' + k].querySelector('b'); if (b) b.textContent = t; };
    if (on) { for (const k in BT) set(k, ROT[BT[k]]); for (const t in this._ult) this._ult[t] = -1; } else { set('nkSolta', 'LANÇAR'); set('nkArAr', 'AR-AR'); set('hdMissil', 'MÍSSIL'); set('hdTorp', 'TORP'); for (const k in BT) H._cls(k, 'vt-zero', false); } }
  /** botão da tela do Urubu-rei; true = tratado aqui (caça pilotado) */
  acaoNk(a) { const q = this.pilotado(); if (!q) return false; const tipo = BT[a]; if (!tipo) return false; const j = this.j;
    if (this._s[tipo] <= 0) j.hud.msg(`${ROT[tipo]}: sem munição — BASE para voltar ao navio e rearmar`, 1.6, '#f59e0b'); else if (q.fase !== 2) j.hud.msg('Aguarde a decolagem', 1.2); else j.S.comando({ t: 'vtArma', tipo }); return true; }
  /** números dos botões (soma dos 2 caças) — só quando mudam */
  painel() { const H = this.j.hud; somaVt(this.j.eu, this._s); for (const k in BT) { const b = H.r['b_' + k] && H.r['b_' + k].querySelector('b'), t = ROT[BT[k]]; if (b && b.textContent !== t) b.textContent = t; } /* rótulos (o nkPasso põe LANÇAR ao entrar) — só escreve se mudou */ for (const k in BT) { const t = BT[k], v = this._s[t]; if (this._ult[t] === v) continue; this._ult[t] = v; if (t === 'nuke' || t === 'torp') H._q(k, String(v)); /* AR-AR e MÍSSIL: o próprio nkPasso escreve (q.aa / q.misseis = soma) */ H._cls(k, 'vt-zero', v <= 0); } }
  /** quadro: luzes, pilones, feixes, entrada na pilotagem e tela */
  quadro(dt, t) { const j = this.j, sim = j.S && j.S.sim; if (!sim) return; const P = matsPisca(); { const ta = t % 1, ts = t % 1.4; P.anti.emissiveIntensity = ta < 0.15 ? 2.2 : 0; P.estrobo.emissiveIntensity = ts < 0.07 || (ts > 0.17 && ts < 0.24) ? 3 : 0; }
    const NB = j.nuke && j.nuke.bomb; /* pilones: a estação disparada some (botões) */
    if (NB) for (let i = 0; i < sim.nukes.length; i++) { const q = sim.nukes[i]; if (!q.ativo || !q.vtol) continue; const n = sim.navios[q.dono], E = n && n.vtA && n.vtA[q.vtId], m = NB[i] && NB[i].av; if (E && m) estacoesVtPorTipo(m, E); }
    if (this.nukes[0] > 0) this.nukes[0] -= dt; if (this.nukes[1] > 0) this.nukes[1] -= dt;
    if (!this.ativo || !j.hud) return;
    if (j._apNk === 1 && !(j.cfg && j.cfg.aeroPrin) && j.nkQ && j.nkQ() && j.nkQ().vtol) { j._apNk = 2; j.nkEntra(); j.S.comando({ t: 'nkPiloto', v: 1 }); j.hud.msg('Decolagem vertical do heliponto — você pilota (sistema do Urubu-rei). Toque no manche após sair do navio.', 3, '#38bdf8'); } /* DECOLAR → pilotagem, como no Lençóis Maranhenses */
    const q = this.pilotado(); this.modo(!!q); if (q) this.painel(); }
  /** eventos: os próprios dos caças e os do sistema do Urubu-rei vindos do Destróier Amorim (textos de caça, não de bombardeiro). true = consumido. */
  evento(e, eu) { const j = this.j, sim = j.S.sim;
    if (e.t === 'vtNuke') { const k = this.nukes[0] <= 0 ? 0 : this.nukes[1] <= 0 ? 1 : -1; if (k < 0) return; this.nukes[k] = 4; if (j.fx) { j.fx.explosao(e.x, e.y, e.z, 4.5, 1); if (j.fx.clarao) j.fx.clarao(e.x, e.y + 30, e.z, 2.2); } if (j.audio && j.audio.nuclear) try { j.audio.nuclear('estrondo', j.distCam ? j.distCam(e.x, e.y, e.z) : 1500, j.pan ? j.pan(e.x, e.z) : 0, 0.5); } catch (er) {} return; } /* no máx. 2 efeitos ao mesmo tempo */
    const dn = e.id != null ? sim.navios[e.id] : null; if (!dn || !dn.C.destAmorim) return;
    const meu = !!(eu && dn === eu), H = j.hud; if (!H) return;
    switch (e.t) { /* troca o texto de bombardeiro pelo de caça (o evento segue para os outros sistemas com outro nome) */
      case 'nkDecola': e.t = 'vtDecola'; H.msg(meu ? 'Caças decolando na vertical do heliponto' : dn.time === (eu && eu.time) ? 'Caças do Destróier Amorim aliado decolaram' : 'ALERTA: caças inimigos decolaram', 2.2, meu ? '#38bdf8' : '#f87171'); break;
      case 'nkPousa': e.t = 'vtPousa'; if (meu) H.msg('Caça pousou no heliponto — rearme em 15 s', 2, '#22c55e'); break;
      case 'nkNegado': e.t = 'vtNegDec'; if (meu) H.msg(e.motivo === 'noAr' ? 'Caças já no ar' : e.motivo === 'recarga' ? `Próximo caça pronto em ${Math.max(1, Math.ceil((dn.nk && dn.nk.tRec || 0) - sim.t))} s` : 'Decolagem indisponível agora', 1.6); break;
      case 'nkIa': e.t = 'vtIa'; if (meu) H.msg(e.v ? (e.motivo === 'combustivel' ? 'Combustível de reserva — o caça volta e pousa' : e.motivo === 'base' ? 'Caça voltando ao navio para pousar' : 'IA no comando do caça') : 'Controle MANUAL do caça', 1.6, '#38bdf8'); break;
      case 'nkAtingido': e.t = 'vtAtingido'; if (meu && j.nkPil) { H.msg(`Caça atingido — ${Math.round(e.f * 100)}% de vida`, 1.8, '#f59e0b'); if (j.fx && j.fx.faiscas) j.fx.faiscas(e.x, e.y, e.z); } break;
      case 'vtSemMun': if (meu) H.msg('SEM MUNIÇÃO — VOLTAR AO NAVIO (botão BASE)', 3, '#f59e0b'); break;
      case 'vtRearme': if (meu) H.msg(e.volta ? `${NOME[e.vt]} de volta, pousado e cheio` : `${NOME[e.vt]} rearmado no heliponto`, 2, '#22c55e'); break;
      case 'vtAbatido': if (meu) H.msg(`${NOME[e.vt]} abatido — volta pousado e cheio em 20 s`, 2.4, '#f87171'); break;
      case 'vtAproxima': if (meu && j.nkPil) H.msg('Aproximação do heliponto — pouso vertical', 1.8, '#38bdf8'); break;
      case 'vtNegado': if (meu) H.msg(`${ROT[e.tipo] || ''}: sem caça com essa arma pronta (ou sem alvo ao alcance)`, 1.6, '#94a3b8'); break;
    } }
  dispose() {}
}
