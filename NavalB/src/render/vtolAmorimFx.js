// Naval B v1.3.06 — RENDER e TELA dos caças Acauã e Uiraçu (Destróier Amorim) no SISTEMA DO URUBU-REI. Não toca em nenhuma outra aeronave.
//  · DECOLAR (o botão nuclear do navio) → ao sair do heliponto entra a pilotagem do Urubu-rei (nkEntra, manual), como no Lençóis Maranhenses;
//  · TELA do Urubu-rei com os botões ADAPTADOS aos caças: LANÇAR = NUKE · AR-AR = AAM · MÍSSIL = ASM · TORP · BASE (volta e pousa) ·
//    FLARE, TRAVAR, IA, ESPERA, REPARO e EJETAR do próprio Urubu-rei. Munição SOMADA dos 2 caças; em 0 o botão fica esmaecido (≈0,3);
//    texto/estado reescritos só quando mudam;
//  · FUMAÇA COLORIDA: a trilha do Urubu-rei adaptada — um emissor por bocal (Acauã verde/amarela, Uiraçu azul/branca), só a ≥ 75 m/s,
//    mesmo pool de partículas (passo 1,8 m, máx. 60 por quadro, núcleo + véu pálido a cada 2º) — gancho cb.trilhaVt do nuclearFx;
//  · neblina nas asas (vórtices), câmera, motor e queda = os do Urubu-rei, sem cópia (o caça é uma aeronave do pool dele);
//  · LUZES: anticolisão vermelha ~1 Hz (150 ms) e estrobo branco duplo (2 × 70 ms, ciclo 1,4 s) — só a intensidade muda;
//  · PILONES: a estação disparada some e volta no rearme (em voo e pousado); FEIXES dos lasers; NUKE tático no máx. 2 ao mesmo tempo.
// Zero alocação por quadro: vetores e linhas criados uma vez.
import * as THREE from 'three';
import { Particulas } from './fx.js';
import { matsPisca, estacoesVtPorTipo } from './modeloVtol.js';
import { somaVt } from '../sim/vtolAmorim.js';

const ROT = { aam: 'AAM', asm: 'ASM', torp: 'TORP', nuke: 'NUKE' };
const NOME = { acaua: 'Acauã', uiracu: 'Uiraçu' };
const PAL = { '#1ee46e': '#bfe9cf', '#ffd21a': '#f1e6b8', '#2a7dff': '#c2d6f2', '#f2f6fa': '#eef2f6' };
const BT = { nkSolta: 'nuke', nkArAr: 'aam', hdMissil: 'asm', hdTorp: 'torp' };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export class VtolAmorimFx {
  constructor(j) { this.j = j; this._s = { aam: 0, asm: 0, torp: 0, nuke: 0 }; this._ult = { aam: -1, asm: -1, torp: -1, nuke: -1 }; this.nukes = [0, 0]; this._modo = false;
    const eu = j.eu; this.ativo = !!(eu && eu.C && eu.C.destAmorim);
    /* feixes: 2 por caça (4 linhas fixas) */ const mat = new THREE.LineBasicMaterial({ color: '#40f0ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.feixes = []; for (let i = 0; i < 4; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const l = new THREE.Line(g, mat); l.frustumCulled = false; l.visible = false; j.cena.add(l); this.feixes.push(l); }
    if (j.nuke && j.nuke.cb) j.nuke.cb.trilhaVt = (q, b) => this.fumaca(q, b.av); }
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
  /** fumaça colorida por bocal — trilha do Urubu-rei adaptada (mesmo pool e parâmetros) */
  pool() { const nk = this.j.nuke; if (!nk) return null; if (!nk._trl && this.j.fx && this.j.fx.tex) nk._trl = new Particulas(this.j.cena, 6000, false, 3, { tex: this.j.fx.tex, turb: 1, desat: 1, dens: 0.8 }); return nk._trl; }
  fumaca(q, m) { const T = this.pool(); if (!T || !m) return; const U = m.userData; if (!U.fumacaVtol) return; let cota = 60; if (!U._fx) U._fx = [null, null, null, null, null, null];
    const vv = Math.hypot(q.vx || 0, q.vy || 0, q.vz || 0); if (vv < 75 || q.fase < 2 || q.vtPouso) { U._fx[0] = U._fx[3] = null; return; } /* §7: só em voo a ≥ 75 m/s (decolagem e pouso verticais sem fumaça) */
    const c = this.j.cam; if (c && Math.hypot(c.position.x - q.x, c.position.y - q.y, c.position.z - q.z) > 8000) { U._fx[0] = U._fx[3] = null; return; } /* mesmo corte de distância do Urubu-rei */
    m.updateMatrixWorld(); for (let e = 0; e < U.fumacaVtol.length && e < 2; e++) { const F = U.fumacaVtol[e]; _v.set(F.p[0], F.p[1], F.p[2]); m.localToWorld(_v); const k = e * 3;
      if (U._fx[k] == null || Math.hypot(_v.x - U._fx[k], _v.y - U._fx[k + 1], _v.z - U._fx[k + 2]) > 400) { U._fx[k] = _v.x; U._fx[k + 1] = _v.y; U._fx[k + 2] = _v.z; continue; }
      const dx = _v.x - U._fx[k], dy = _v.y - U._fx[k + 1], dz = _v.z - U._fx[k + 2], d = Math.hypot(dx, dy, dz), passo = 1.8; if (d < passo) continue; const N = Math.min(cota, Math.floor(d / passo)); cota -= N; const pal = PAL[F.cor] || '#eef2f6';
      const vt = this.j.nuke && this.j.nuke.vento; for (let i = 1; i <= N; i++) { const f = (i * passo) / d, px = U._fx[k] + dx * f, py = U._fx[k + 1] + dy * f, pz = U._fx[k + 2] + dz * f, r = Math.random();
        T.emite(px, py, pz, (r - 0.5) * 1.6, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.6, F.cor, 0.42, 0.7 + r * 0.4, 5.5 + r * 2.5, 3.4, -0.03, 0.3);
        if (i % 2 === 0) T.emite(px, py, pz, (Math.random() - 0.5) * 2.4 + (vt ? vt.x * 0.3 : 0), (Math.random() - 0.3) * 1.2, (Math.random() - 0.5) * 2.4 + (vt ? vt.z * 0.3 : 0), pal, 0.1, 1.6 + r, 8 + r * 3, 4.2, -0.05, 0.25); }
      const f = (N * passo) / d; U._fx[k] += dx * f; U._fx[k + 1] += dy * f; U._fx[k + 2] += dz * f; if (cota <= 0) break; } }
  /** quadro: luzes, pilones, feixes, entrada na pilotagem e tela */
  quadro(dt, t) { const j = this.j, sim = j.S && j.S.sim; if (!sim) return; const P = matsPisca(); { const ta = t % 1, ts = t % 1.4; P.anti.emissiveIntensity = ta < 0.15 ? 2.2 : 0; P.estrobo.emissiveIntensity = ts < 0.07 || (ts > 0.17 && ts < 0.24) ? 3 : 0; }
    let f = 0; const NB = j.nuke && j.nuke.bomb;
    if (NB) for (let i = 0; i < sim.nukes.length; i++) { const q = sim.nukes[i]; if (!q.ativo || !q.vtol) continue; const n = sim.navios[q.dono], E = n && n.vtA && n.vtA[q.vtId], m = NB[i] && NB[i].av; if (!E || !m) continue; estacoesVtPorTipo(m, E);
      if (m.userData.lasersP) for (let k = 0; k < 2 && f < 4; k++) { const S = E.las[k]; if (!S.on) continue; const L = this.feixes[f++], p = m.userData.lasersP[k]; _w.set(p[0], p[1], p[2]); m.localToWorld(_w); const a = L.geometry.attributes.position.array; a[0] = _w.x; a[1] = _w.y; a[2] = _w.z; a[3] = S.tx; a[4] = S.ty; a[5] = S.tz; L.geometry.attributes.position.needsUpdate = true; L.visible = true; } }
    for (; f < 4; f++) this.feixes[f].visible = false;
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
  dispose() { for (const L of this.feixes) { this.j.cena.remove(L); L.geometry.dispose(); } if (this.j.nuke && this.j.nuke.cb) this.j.nuke.cb.trilhaVt = null; }
}
