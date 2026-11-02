// Naval B v1.3.04 — RENDER e HUD PRÓPRIOS dos caças Acauã e Uiraçu (Destróier Amorim). Não toca em nenhuma outra aeronave.
//  · BOTÕES DE ARMA (AAM / ASM / TORP / NUKE) com a munição SOMADA dos 2 caças; em 0 ficam esmaecidos (≈0,3) e desabilitados;
//    o clique dispara do caça que ainda tem aquela arma; o texto só é reescrito quando o número muda;
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
import { somaVt, TIPOS_VT } from '../sim/vtolAmorim.js';

const ROT = { aam: 'AAM', asm: 'ASM', torp: 'TORP', nuke: 'NUKE' };
const PAL = { '#1ee46e': '#bfe9cf', '#ffd21a': '#f1e6b8', '#2a7dff': '#c2d6f2', '#f2f6fa': '#eef2f6' };
const _v = new THREE.Vector3(), _w = new THREE.Vector3();

export class VtolAmorimFx {
  constructor(j) { this.j = j; this.soma = { aam: -1, asm: -1, torp: -1, nuke: -1 }; this._s = { aam: 0, asm: 0, torp: 0, nuke: 0 }; this.bts = null; this.nukes = [0, 0];
    const eu = j.eu; this.ativo = !!(eu && eu.C && eu.C.destAmorim);
    /* feixes: 2 por caça (4 linhas fixas) */ const mat = new THREE.LineBasicMaterial({ color: '#40f0ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.feixes = []; for (let i = 0; i < 4; i++) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const l = new THREE.Line(g, mat); l.frustumCulled = false; l.visible = false; j.cena.add(l); this.feixes.push(l); }
    if (this.ativo) this.criaBotoes(); }
  criaBotoes() { const H = this.j.hud; if (!H || !H.el) return; const box = document.createElement('div'); box.className = 'vt-armas';
    box.innerHTML = TIPOS_VT.map((t) => `<button type="button" class="vt-bt vt-${t}" data-vt="${t}"><b>${ROT[t]}</b><span>0</span></button>`).join(''); H.el.appendChild(box);
    box.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-vt]'); if (!b || b.disabled) return; e.preventDefault(); e.stopPropagation(); this.j.S.comando({ t: 'vtArma', tipo: b.dataset.vt }); if (navigator.vibrate) try { navigator.vibrate(20); } catch (er) {} });
    this.bts = {}; for (const t of TIPOS_VT) { const b = box.querySelector('.vt-' + t); this.bts[t] = { b, n: b.querySelector('span') }; } this.box = box; }
  /** botões: soma dos 2 caças; reescreve só quando muda */
  hud() { if (!this.bts) return; const sim = this.j.S.sim; somaVt(sim, this.j.eu, this._s);
    { let ar = false; for (let i = 0; i < sim.helis.length; i++) { const h = sim.helis[i]; if (h.vt && h.usado && h.dono === this.j.eu.id && h.estado >= EST.DECOLA && h.estado <= EST.RETORNO) { ar = true; break; } } if (ar !== this._ar) { this._ar = ar; this.box.classList.toggle('on', ar); } } /* só aparecem com caça no ar */
    for (const t of TIPOS_VT) { const v = this._s[t]; if (this.soma[t] === v) continue; this.soma[t] = v; const B = this.bts[t]; B.n.textContent = v; B.b.disabled = v <= 0; B.b.classList.toggle('vazio', v <= 0); } }
  /** fumaça colorida por bocal — mesmo pool e parâmetros do Urubu-rei (nuclearFx.trilha) */
  pool() { const nk = this.j.nuke; if (!nk) return null; if (!nk._trl && this.j.fx && this.j.fx.tex) nk._trl = new Particulas(this.j.cena, 6000, false, 3, { tex: this.j.fx.tex, turb: 1, desat: 1, dens: 0.8 }); return nk._trl; }
  fumaca(h, m) { const T = this.pool(); if (!T) return; const U = m.userData; if (!U.fumacaVtol) return; let cota = 60; if (!U._fx) U._fx = [null, null, null, null, null, null];
    const vv = Math.hypot(h.vx || 0, h.vy || 0, h.vz || 0); if (vv < 75 || !(h.estado >= EST.DECOLA && h.estado <= EST.POUSO)) { U._fx[0] = U._fx[3] = null; return; }
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
    if (this.nukes[0] > 0) this.nukes[0] -= dt; if (this.nukes[1] > 0) this.nukes[1] -= dt; this.hud(); }
  /** eventos do mundo (só os próprios dos caças) */
  evento(e, eu) { const j = this.j;
    if (e.t === 'vtNuke') { const k = this.nukes[0] <= 0 ? 0 : this.nukes[1] <= 0 ? 1 : -1; if (k < 0) return; this.nukes[k] = 4; if (j.fx) { j.fx.explosao(e.x, e.y, e.z, 4.5, 1); if (j.fx.clarao) j.fx.clarao(e.x, e.y + 30, e.z, 2.2); } if (j.audio && j.audio.nuclear) try { j.audio.nuclear('estrondo', j.distCam ? j.distCam(e.x, e.y, e.z) : 1500, j.pan ? j.pan(e.x, e.z) : 0, 0.5); } catch (er) {} return; } /* no máx. 2 efeitos ao mesmo tempo */
    if (!eu || e.id !== eu.id || !j.hud) return;
    if (e.t === 'vtSemMun') j.hud.msg('SEM MUNIÇÃO — VOLTAR AO NAVIO (botão BASE)', 3, '#f59e0b');
    else if (e.t === 'vtRearme') j.hud.msg('Caça rearmado no navio — estações cheias', 2, '#22c55e');
    else if (e.t === 'vtNegado') j.hud.msg(`${ROT[e.tipo] || ''}: sem caça no ar com essa arma pronta (ou sem alvo ao alcance)`, 1.6, '#94a3b8'); }
  dispose() { for (const L of this.feixes) { this.j.cena.remove(L); L.geometry.dispose(); } if (this.box) this.box.remove(); }
}
export { VTOL_GEO };
