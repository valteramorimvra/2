// Naval B v1.3.04 — RENDER e HUD PRÓPRIOS dos caças Acauã e Uiraçu (Destróier Amorim). Não toca em nenhuma outra aeronave.
//  · ARMAS na MESMA tela de pilotagem do Urubu-rei (sem botões novos — v1.3.05): munição SOMADA dos 2 caças, esmaecida em 0;
//    o toque dispara do caça que ainda tem aquela arma; o texto só é reescrito quando o número muda;
//  · FUMAÇA COLORIDA, um emissor por bocal (Acauã verde/amarela, Uiraçu azul/branca), só em voo a ≥ 75 m/s, mesmos parâmetros e o
//    MESMO pool de partículas do Urubu-rei (passo 1,8 m, máx. 60 por quadro, núcleo + véu pálido a cada 2º);
//  · LUZES: anticolisão vermelha ~1 Hz (150 ms acesa) e estrobo branco duplo (2 × 70 ms, ciclo 1,4 s) — só a intensidade muda;
//  · FEIXES dos 2 lasers (dorsal/ventral) quando atiram; NUKE tático: clarão + explosão grande, no máx. 2 ao mesmo tempo;
//  · mensagens "SEM MUNIÇÃO — VOLTAR AO NAVIO" e "rearmado".
// Zero alocação por quadro: vetores e linhas criados uma vez.
import * as THREE from 'three';
import { Particulas } from './fx.js';
import { matsPisca } from './modeloVtol.js';
import { VTOL_GEO } from './vtolDados.js';
import { EST } from '../naval5v5/aereo.js';
import { somaVt } from '../sim/vtolAmorim.js';

const ROT = { aam: 'AAM', asm: 'ASM', torp: 'TORP', nuke: 'NUKE' };
const PAL = { '#1ee46e': '#bfe9cf', '#ffd21a': '#f1e6b8', '#2a7dff': '#c2d6f2', '#f2f6fa': '#eef2f6' };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export class VtolAmorimFx {
  constructor(j) { this.j = j; this._s = { aam: 0, asm: 0, torp: 0, nuke: 0 }; this.nukes = [0, 0]; this._modo = false; this._lbl = null;
    const eu = j.eu; this.ativo = !!(eu && eu.C && eu.C.destAmorim);
    /* feixes: 2 por caça (4 linhas fixas) */ const mat = new THREE.LineBasicMaterial({ color: '#40f0ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.feixes = []; for (let i = 0; i < 4; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const l = new THREE.Line(g, mat); l.frustumCulled = false; l.visible = false; j.cena.add(l); this.feixes.push(l); } }
  /** v1.3.05 (Valter): SEM botões novos — as armas dos caças ficam na MESMA tela de pilotagem do Urubu-rei (o painel que o jogo já usa
   *  para pilotar aeronaves): LANÇAR = NUKE · AR-AR = AAM · MÍSSIL = ASM · TORP = TORP · PORTA = CANHÃO · BASE = volta ao navio.
   *  Contagem SOMADA dos 2 caças; em 0 o botão fica esmaecido e não dispara. Só vale com Acauã/Uiraçu pilotado; as outras aeronaves não mudam. */
  pilotado() { const j = this.j; if (!this.ativo || !j.aeroUI || j.nkPil) return null; const h = j.aeroH && j.aeroH(); return h && h.vt ? h : null; }
  modo(on) { if (this._modo === on) return; this._modo = on; const H = this.j.hud; if (!H) return; H.el.classList.toggle('modo-vt', on); const r = H.r;
    const set = (k, t) => { const b = r['b_' + k] && r['b_' + k].querySelector('b'); if (b) b.textContent = t; };
    if (on) { set('nkSolta', 'NUKE'); set('nkArAr', 'AAM'); set('hdMissil', 'ASM'); set('hdTorp', 'TORP'); set('nkPorta', 'CANHÃO'); set('nkVolta', 'BASE'); if (r.b_nkPorta) r.b_nkPorta.hidden = false; }
    else { set('nkSolta', this.j.aeroUI ? 'ARMA' : 'LANÇAR'); set('nkArAr', this.j.aeroUI ? 'POUSAR' : 'AR-AR'); set('hdMissil', 'MÍSSIL'); set('hdTorp', 'TORP'); set('nkPorta', 'PORTA'); } }
  /** ação de um botão da tela do Urubu-rei; true = tratada aqui (caça Acauã/Uiraçu pilotado) */
  acao(a) { const h = this.pilotado(); if (!h) return false; const j = this.j, tipo = a === 'nkSolta' ? 'nuke' : a === 'nkArAr' ? 'aam' : a === 'hdMissil' ? 'asm' : a === 'hdTorp' ? 'torp' : null;
    if (tipo) { if (this._s[tipo] <= 0) j.hud.msg(`${ROT[tipo]}: sem munição — BASE para voltar ao navio e rearmar`, 1.6, '#f59e0b'); else j.S.comando({ t: 'vtArma', tipo }); return true; }
    if (a === 'nkPorta') { j.S.comando({ t: 'heliFogo', k: j.eu.controle }); return true; }
    if (a === 'nkVolta' || a === 'hdVolta') { j.S.comando({ t: 'heliVolta', k: j.eu.controle }); j.hud.msg('Voltando ao navio — pouso no heliponto e rearme em 15 s', 2, '#38bdf8'); return true; }
    return false; }
  /** painel (no lugar do aeroPasso, só para Acauã/Uiraçu): mesma tela, textos só quando mudam */
  painel(h) { const j = this.j, H = j.hud, r = H.r, sim = j.S.sim, n = j.eu; this.modo(true); somaVt(sim, n, this._s); const S = this._s;
    const L = ['RÉ/MIN', 'DEVAGAR', 'MEIA', 'FORTE', 'MÁX']; if (r.nkThrLbl) { const t = L[(h.thr != null ? h.thr : 2) | 0]; if (r.nkThrLbl._v !== t) { r.nkThrLbl._v = t; r.nkThrLbl.textContent = t; } }
    const a = n.alvoId >= 0 ? sim.navios[n.alvoId] : null, dA = a && !a.morto ? Math.hypot(a.x - h.x, a.z - h.z) : 0, ia = !!h.apEng;
    const q = (k, tipo) => { const v = S[tipo]; H._q(k, String(v)); H._cls(k, 'off', v <= 0); H._cls(k, 'vt-zero', v <= 0); };
    q('nkSolta', 'nuke'); q('nkArAr', 'aam'); q('hdMissil', 'asm'); q('hdTorp', 'torp'); H._q('nkPorta', String(h.mun | 0)); H._cls('nkPorta', 'off', h.mun <= 0);
    H._q('nkIa', ia ? 'LIGADA' : 'DESL.'); H._cls('nkIa', 'nk-on', ia); H.el.classList.toggle('nk-ia', ia); H._q('nkTrava', a && !a.morto ? (dA / 1000).toFixed(1) + ' km' : '—'); H._q('nkSair', ''); H._q('nkVolta', h.estado === EST.RETORNO ? 'A CAMINHO' : '');
    const fl = h.flares ?? 10; H._q('nkFlare', fl <= 0 ? 'VAZIO' : String(fl)); H._cls('nkFlare', 'off', fl <= 0); if (r.b_nkEjeta) r.b_nkEjeta.hidden = true; if (r.b_nkPorta && r.b_nkPorta.hidden) r.b_nkPorta.hidden = false;
    if (r.nkInfo) { const vazio = S.aam + S.asm + S.torp + S.nuke <= 0; const html = `<b>${ia ? 'IA · ataque' : 'MANUAL'}</b><span>ALT ${Math.round(h.y)} m · ${Math.round(Math.hypot(h.vx || 0, h.vy || 0, h.vz || 0) * 3.6)} km/h</span><span>AAM ${S.aam} · ASM ${S.asm} · TORP ${S.torp} · NUKE ${S.nuke}</span><span>${a && !a.morto ? `ALVO ${(dA / 1000).toFixed(1)} km` : 'SEM TRAVA'}</span>${vazio ? '<span class="ok">SEM MUNIÇÃO — VOLTAR AO NAVIO (BASE)</span>' : ''}`; if (r.nkInfo._h !== html) { r.nkInfo._h = html; r.nkInfo.innerHTML = html; } } }
  /** fumaça colorida por bocal — mesmo pool e parâmetros do Urubu-rei (nuclearFx.trilha) */
  pool() { const nk = this.j.nuke; if (!nk) return null; if (!nk._trl && this.j.fx && this.j.fx.tex) nk._trl = new Particulas(this.j.cena, 6000, false, 3, { tex: this.j.fx.tex, turb: 1, desat: 1, dens: 0.8 }); return nk._trl; }
  fumaca(h, m) { const T = this.pool(); if (!T) return; const U = m.userData; if (!U.fumacaVtol) return; let cota = 60; if (!U._fx) U._fx = [null, null, null, null, null, null];
    const vv = Math.hypot(h.vx || 0, h.vy || 0, h.vz || 0); if (vv < 75 || !(h.estado === EST.VOO || h.estado === EST.RETORNO)) /* v1.3.05: decolagem/pouso vertical sem fumaça (a velocidade da decolagem é derivada da posição e dá picos) */ { U._fx[0] = U._fx[3] = null; return; }
    m.updateMatrixWorld(); for (let e = 0; e < U.fumacaVtol.length && e < 2; e++) { const F = U.fumacaVtol[e]; _v.set(F.p[0], F.p[1], F.p[2]); m.localToWorld(_v); const k = e * 3;
      if (U._fx[k] == null || Math.hypot(_v.x - U._fx[k], _v.y - U._fx[k + 1], _v.z - U._fx[k + 2]) > 400) { U._fx[k] = _v.x; U._fx[k + 1] = _v.y; U._fx[k + 2] = _v.z; continue; }
      const dx = _v.x - U._fx[k], dy = _v.y - U._fx[k + 1], dz = _v.z - U._fx[k + 2], d = Math.hypot(dx, dy, dz), passo = 1.8; if (d < passo) continue; const N = Math.min(cota, Math.floor(d / passo)); cota -= N; const pal = PAL[F.cor] || '#eef2f6';
      for (let i = 1; i <= N; i++) { const f = (i * passo) / d, px = U._fx[k] + dx * f, py = U._fx[k + 1] + dy * f, pz = U._fx[k + 2] + dz * f, r = Math.random();
        T.emite(px, py, pz, (r - 0.5) * 1.6, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.6, F.cor, 0.42, 0.7 + r * 0.4, 5.5 + r * 2.5, 3.4, -0.03, 0.3);
        if (i % 2 === 0) T.emite(px, py, pz, (Math.random() - 0.5) * 2.4, (Math.random() - 0.3) * 1.2, (Math.random() - 0.5) * 2.4, pal, 0.1, 1.6 + r, 8 + r * 3, 4.2, -0.05, 0.25); }
      const f = (N * passo) / d; U._fx[k] += dx * f; U._fx[k + 1] += dy * f; U._fx[k + 2] += dz * f; if (cota <= 0) break; } }
  /** quadro: luzes, fumaça, feixes e HUD */
  quadro(dt, t) { const sim = this.j.S && this.j.S.sim; if (!sim) return; const P = matsPisca(); { const ta = t % 1, ts = t % 1.4; P.anti.emissiveIntensity = ta < 0.15 ? 2.2 : 0; P.estrobo.emissiveIntensity = ts < 0.07 || (ts > 0.17 && ts < 0.24) ? 3 : 0; }
    let f = 0; const A = this.j.aereo;
    for (let i = 0; i < sim.helis.length; i++) { const h = sim.helis[i]; if (!h.vt || !h.usado) continue; const m = A && A.helis && A.helis[i]; if (m && m.visible) this.fumaca(h, m);
      if (m && m.userData.lasersP) for (let j = 0; j < 2 && f < 4; j++) { const E = h.vt.las[j]; if (!E.on) continue; const L = this.feixes[f++]; const p = m.userData.lasersP[j]; _w.set(p[0], p[1], p[2]); m.localToWorld(_w); const a = L.geometry.attributes.position.array; a[0] = _w.x; a[1] = _w.y; a[2] = _w.z; a[3] = E.tx; a[4] = E.ty; a[5] = E.tz; L.geometry.attributes.position.needsUpdate = true; L.visible = true; } }
    for (; f < 4; f++) this.feixes[f].visible = false;
    if (this.nukes[0] > 0) this.nukes[0] -= dt; if (this.nukes[1] > 0) this.nukes[1] -= dt; if (this._modo && !this.pilotado()) this.modo(false); }
  /** eventos do mundo (só os próprios dos caças) */
  evento(e, eu) { const j = this.j;
    if (e.t === 'vtNuke') { const k = this.nukes[0] <= 0 ? 0 : this.nukes[1] <= 0 ? 1 : -1; if (k < 0) return; this.nukes[k] = 4; if (j.fx) { j.fx.explosao(e.x, e.y, e.z, 4.5, 1); if (j.fx.clarao) j.fx.clarao(e.x, e.y + 30, e.z, 2.2); } if (j.audio && j.audio.nuclear) try { j.audio.nuclear('estrondo', j.distCam ? j.distCam(e.x, e.y, e.z) : 1500, j.pan ? j.pan(e.x, e.z) : 0, 0.5); } catch (er) {} return; } /* no máx. 2 efeitos ao mesmo tempo */
    if (!eu || e.id !== eu.id || !j.hud) return;
    if (e.t === 'vtSemMun') j.hud.msg('SEM MUNIÇÃO — VOLTAR AO NAVIO (botão BASE)', 3, '#f59e0b');
    else if (e.t === 'vtRearme') j.hud.msg('Caça rearmado no navio — estações cheias', 2, '#22c55e');
    else if (e.t === 'vtNegado') j.hud.msg(`${ROT[e.tipo] || ''}: sem caça no ar com essa arma pronta (ou sem alvo ao alcance)`, 1.6, '#94a3b8'); }
  dispose() { for (const L of this.feixes) { this.j.cena.remove(L); L.geometry.dispose(); } }
}
export { VTOL_GEO };
