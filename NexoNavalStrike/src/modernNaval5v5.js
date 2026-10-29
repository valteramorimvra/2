// Nexo Naval Strike 3D — núcleo "modern naval 5v5" (v1.1.0). Fachada que reúne os submódulos naval5v5/ e faz a
// ponte com o motor de render (NavalCombat3D):
//   sim  → naval5v5/hidro.js (hidrodinâmica pesada + pivô), naval5v5/armas.js (multi-torre + AUTO-FOGO),
//          naval5v5/defesa.js (CIWS 1200 m / SAM 3 km / 30 mm 1500 m, drones e lanchas), naval5v5/gerstner.js
//   render → naval5v5/agua.js (shader do mar) + esta classe (SAMs, drones, lanchas, traçantes, espuma de casco,
//          alerta de míssil, salvas sincronizadas e rajada contínua do CIWS).
// Tudo com pools estáticos: nenhuma alocação no laço de quadro.

import * as THREE from 'three';
import { FASE } from './sim/world.js';
import { alturaMar } from './sim/ocean.js';
/** v1.2.33: acumulador de ritmo (traçantes/s) — no máx. 1 por quadro, sem sorteio. */
function ritmoAA(st, dt, r) { st._ac = (st._ac || 0) + dt * r; if (st._ac >= 1) { st._ac = Math.min(1, st._ac - 1); return true; } return false; }
export { passoHidro, raioGiro, raioMin, arrasto, eficaciaLeme, acel0, HIDRO } from './naval5v5/hidro.js';
export { passoArmas5, torreCobre, torresQueCobrem, AUTO } from './naval5v5/armas.js';
export { CIWS, A30, DEF, POOL5, probCiws, pA30 } from './naval5v5/defesa.js';
export { alturaGerstner, deslocaGerstner, GLSL_GERSTNER, esbeltez } from './naval5v5/gerstner.js';
import { POOL5 } from './naval5v5/defesa.js';

const COR_TIME = { azul: '#38bdf8', vermelho: '#ef4444' };

export class Naval5v5 {
  constructor(jogo) {
    this.j = jogo; const cena = jogo.cena; this.cena = cena;
    // --- SAMs (interceptadores brancos, finos) ---
    const mb = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.45, metalness: 0.2 }), mf = new THREE.MeshBasicMaterial({ color: '#fff1c2', toneMapped: false });
    const corpo = new THREE.CylinderGeometry(0.14, 0.14, 3.6, 8).rotateX(Math.PI / 2), nariz = new THREE.ConeGeometry(0.14, 0.6, 8).rotateX(-Math.PI / 2).translate(0, 0, -2.1), chama = new THREE.ConeGeometry(0.22, 2.4, 8).rotateX(Math.PI / 2).translate(0, 0, 3);
    this.sams = []; for (let i = 0; i < POOL5.sams; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(corpo, mb), new THREE.Mesh(nariz, mb), new THREE.Mesh(chama, mf)); g.visible = false; cena.add(g); this.sams.push(g); }
    // --- drones (asa fixa pequena, hélice traseira) ---
    const md = new THREE.MeshStandardMaterial({ color: '#4b5563', roughness: 0.6, metalness: 0.3 }), mdl = { azul: new THREE.MeshBasicMaterial({ color: '#7dd3fc', toneMapped: false }), vermelho: new THREE.MeshBasicMaterial({ color: '#fca5a5', toneMapped: false }) };
    const dCorpo = new THREE.CylinderGeometry(0.25, 0.18, 2.6, 8).rotateX(Math.PI / 2), dAsa = new THREE.BoxGeometry(3.6, 0.06, 0.55).translate(0, 0, 0.1), dCauda = new THREE.BoxGeometry(1.2, 0.05, 0.35).translate(0, 0, 1.2), dLuz = new THREE.SphereGeometry(0.16, 6, 4).translate(0, 0.2, -0.6);
    this.drones = []; for (let i = 0; i < POOL5.drones; i++) { const g = new THREE.Group(); const l = new THREE.Mesh(dLuz, mdl.azul); g.add(new THREE.Mesh(dCorpo, md), new THREE.Mesh(dAsa, md), new THREE.Mesh(dCauda, md), l); g.userData.luz = l; g.visible = false; cena.add(g); this.drones.push(g); }
    this.mdl = mdl;
    // --- lanchas de ataque rápido ---
    const mh = new THREE.MeshStandardMaterial({ color: '#6b7280', roughness: 0.55, metalness: 0.25 }), mc = { azul: new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.5 }), vermelho: new THREE.MeshStandardMaterial({ color: '#5f1e1e', roughness: 0.5 }) };
    const lCasco = new THREE.BoxGeometry(3.4, 1.3, 14).translate(0, 0.2, 0), lProa = new THREE.ConeGeometry(1.7, 4, 4).rotateX(-Math.PI / 2).rotateZ(Math.PI / 4).translate(0, 0.25, -9), lCab = new THREE.BoxGeometry(2.4, 1.6, 3.6).translate(0, 1.6, 0.6), lArma = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 6).rotateX(Math.PI / 2).translate(0, 1.6, -3.6);
    this.lanchas = []; for (let i = 0; i < POOL5.lanchas; i++) { const g = new THREE.Group(); const cab = new THREE.Mesh(lCab, mc.azul); g.add(new THREE.Mesh(lCasco, mh), new THREE.Mesh(lProa, mh), cab, new THREE.Mesh(lArma, md)); g.userData.cab = cab; g.visible = false; cena.add(g); this.lanchas.push(g); }
    // --- v1.2.11: feixes LASER (finos, discretos; aditivos sem luz dinâmica) ---
    const mL = new THREE.MeshBasicMaterial({ color: '#d7f3ff', transparent: true, opacity: 0.22, /* v1.2.14: −30% */ depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }); const gL = new THREE.CylinderGeometry(0.09, 0.09, 1, 6, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2);
    this.feixes = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(gL, mL); m.visible = false; m.frustumCulled = false; cena.add(m); this.feixes.push(m); } this._vL = new THREE.Vector3();
    this.mc = mc; this.v = new THREE.Vector3(); this.tAlerta = 0; this.salvas = new Map(); this.ordem = []; this.tCasco = 0; this.ciwsPerto = 1e9; this.ciwsPan = 0; this.alertaFeito = new Set();
    this._cmp = (a, b) => ((a.x - this._cpx) ** 2 + (a.z - this._cpz) ** 2) - ((b.x - this._cpx) ** 2 + (b.z - this._cpz) ** 2);
    this.menores = []; for (let i = 0; i < POOL5.drones + POOL5.lanchas; i++) this.menores.push({ x: 0, z: 0, meu: 0, drone: 0 }); this.menoresN = 0;
  }
  /** Mundo de um ponto local do navio sem alocar. */
  local(n, lx, ly, lz, o) { const c = Math.cos(n.rumo), s = Math.sin(n.rumo); o.x = n.x + lx * c - lz * s; o.y = ly + n.arfagem; o.z = n.z + lx * s + lz * c; return o; }

  /** Chamado a cada quadro, depois do passo da simulação. */
  /** v1.2.33: raio laser fino (designador) de um reparo antiaéreo que está disparando — pool de 24, aditivo, sem luz. */
  laserAA(p, st, cam) { if (!this._lz) { const P = this.feixes[0] && this.feixes[0].parent; if (!P) return; this._lz = []; const M = new THREE.MeshBasicMaterial({ color: '#ff2f2f', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), G = new THREE.CylinderGeometry(0.05, 0.05, 1, 5, 1, true).translate(0, 0.5, 0).rotateX(Math.PI / 2);
      for (let k = 0; k < 24; k++) { const x = new THREE.Mesh(G, M); x.visible = false; x.frustumCulled = false; P.add(x); this._lz.push(x); } this._lzV = new THREE.Vector3(); }
    if ((this._lzN | 0) >= this._lz.length) return; const g = this._lz[this._lzN | 0], L = Math.hypot(st.tx - p.x, st.ty - p.y, st.tz - p.z) || 1; this._lzN = (this._lzN | 0) + 1;
    g.visible = true; g.position.set(p.x, p.y, p.z); g.lookAt(this._lzV.set(st.tx, st.ty, st.tz)); const s = (0.8 + Math.min(1.4, Math.hypot(p.x - cam.x, p.z - cam.z) / 1800)) * (0.85 + 0.3 * Math.random()); g.scale.set(s, s, L); }
  laserAAFim() { if (!this._lz) return; for (let k = this._lzN | 0; k < this._lz.length; k++) this._lz[k].visible = false; this._lzN = 0; }
  quadro(dt) {
    const j = this.j, sim = j.S.sim, fx = j.fx, cp = j.cam.position; const o = this._o || (this._o = { x: 0, y: 0, z: 0 });
    // SAMs
    for (let i = 0; i < sim.sams.length; i++) { const s = sim.sams[i], m = this.sams[i]; m.visible = !!s.ativo; if (!s.ativo) continue; m.position.set(s.x, s.y, s.z); m.lookAt(s.x + s.vx, s.y + s.vy, s.z + s.vz); fx.rastroMissil(s.x - s.vx * 0.01, s.y - s.vy * 0.01, s.z - s.vz * 0.01, s.fase === 1); if (fx.chamaMotor && s.t < 2.5) { const vv = Math.hypot(s.vx, s.vy, s.vz) || 1; fx.chamaMotor(s.x - s.vx / vv * 2, s.y - s.vy / vv * 2, s.z - s.vz / vv * 2, 0.6, 0); } } /* v1.2.9: SAM com chama pequena no motor */
    // drones
    for (let i = 0; i < sim.drones.length; i++) { const q = sim.drones[i], m = this.drones[i]; m.visible = !!q.ativo; if (!q.ativo) continue; m.position.set(q.x, q.y, q.z); m.lookAt(q.x + q.vx, q.y + q.vy, q.z + q.vz); const l = m.userData.luz; l.material = this.mdl[q.time]; l.visible = (sim.t * 2 + i) % 1 < 0.5; }
    // lanchas (+ esteira/borrifo e disparos do canhão de proa)
    for (let i = 0; i < sim.lanchas.length; i++) { const l = sim.lanchas[i], m = this.lanchas[i]; m.visible = !!l.ativo; if (!l.ativo) continue; const y = Math.max(0, alturaSuave(sim, l.x, l.z)); m.position.set(l.x, y + 0.2, l.z); m.rotation.set(-0.04 * (l.v / 20), -l.rumo, Math.sin(sim.t * 2.1 + i) * 0.05, 'YXZ'); m.userData.cab.material = this.mc[l.time];
      if (Math.random() < 0.6) { const fx2 = Math.sin(l.rumo), fz2 = -Math.cos(l.rumo); fx.borrifo(l.x + fx2 * 6, l.z + fz2 * 6, fx2 * l.v * 0.4 + (Math.random() - 0.5) * 6, fz2 * l.v * 0.4 + (Math.random() - 0.5) * 6, 0.5); fx.bolhas(l.x - fx2 * 8, l.z - fz2 * 8); }
      if (l.fogo && Math.random() < 0.35) { const a = sim.navios[l.alvo]; if (a) { const dx = a.x - l.x, dz = a.z - l.z, d = Math.hypot(dx, dz); fx.tracante(l.x + Math.sin(l.rumo) * 4, y + 1.8, l.z - Math.cos(l.rumo) * 4, dx / d, 0.012, dz / d, 1, d / 1000 + 0.05); } } }
    // reparos de 30 mm e CIWS: pontaria, traçantes e áudio
    let perto = 1e9, pan = 0; const red = (j.save && j.save.ajustes.efDefesa) !== 'normal'; fx.trReduzido = red; /* v1.2.1 Efeitos de defesa: reduzido (padrão) | normal */ this._lzN = 0;
    for (let k = 0; k < sim.navios.length; k++) { const n = sim.navios[k], r = j.navios[k]; if (!r) continue;
      if (n.sec && r.sec) for (let a = 0; a < n.sec.length; a++) { const R = r.sec[a]; if (R) { R.g.rotation.y = -n.sec[a].az; if (R.el) R.el.rotation.x = n.sec[a].el; } } /* v1.2.18 item 14d: secundárias giram/elevam */
      for (let a = 0; a < n.a30.length; a++) { const st = n.a30[a], R = r.a30[a]; if (R) { R.g.rotation.y = -st.az; R.cab.rotation.x = st.el; } if (!st.fogo) continue; const pm = n.P.a30[a]; this.local(n, pm.x, pm.y, pm.z, o);
        if (a % 2 === 1) this.laserAA(o, st, cp); /* v1.2.33: laser fino nos reparos pares (2º, 4º…) */ if (ritmoAA(st, dt, red ? 4 : 16)) /* v1.2.33: traçantes em ritmo constante (sem engasgos), mesma potência */ { const dx = st.tx - o.x, dy = st.ty - o.y, dz = st.tz - o.z, d = Math.hypot(dx, dy, dz) || 1; fx.tracante(o.x, o.y, o.z, dx / d + (Math.random() - 0.5) * 0.02, dy / d + (Math.random() - 0.5) * 0.02, dz / d + (Math.random() - 0.5) * 0.02, 1, Math.min(1.6, d / 1000 + 0.1)); }
        const dc = Math.hypot(o.x - cp.x, o.y - cp.y, o.z - cp.z); if (dc < 2500) j.audio.a30(dc, j.pan(o.x, o.z)); }
      for (let c = 0; c < n.ciws.length; c++) { const st = n.ciws[c]; if (!st.fogo) continue; const pc = n.P.ciws[c]; this.local(n, pc.x, pc.y, pc.z, o); if (c % 2 === 1) this.laserAA(o, st, cp); /* v1.2.33 */
        const dx = st.tx - o.x, dy = st.ty - o.y, dz = st.tz - o.z, d = Math.hypot(dx, dy, dz) || 1; const q = red ? ((st._k = (st._k || 0) + 1) % 7 === 0 ? 1 : 0) : (Math.random() < 0.75 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0); /* v1.2.14: −30% traçantes */ /* v1.2.1 reduzido: 1 em 5 traçantes visíveis */
        const vsH = st.tipo === 'h'; for (let t = 0; t < q; t++) fx.tracante(o.x, o.y, o.z, dx / d + (Math.random() - 0.5) * 0.014, dy / d + (Math.random() - 0.5) * 0.014, dz / d + (Math.random() - 0.5) * 0.014, vsH ? 2 : 0, Math.min(1.1, d / 1100 + 0.08)); if (vsH && Math.random() < 0.084) fx.faiscas(st.tx, st.ty, st.tz);
        { const meuPerto = n === j.eu && j.camModo === 'perto'; const pb = (meuPerto ? (red ? 0.08 : 0.2) : red ? 0.25 : 0.5) * 0.6; /* v1.2.15: −15% */ if (Math.random() < pb) fx.brilho.emite(o.x, o.y, o.z, 0, 0, 0, '#ffd27a', meuPerto ? 0.36 : 0.75, meuPerto ? 1.4 : 2.6, 0.05, 0, 0, 0); /* v1.2.14: clarão do CIWS −30% */ } /* clarão do próprio CIWS atenuado na câmera próxima */
        const dc = Math.hypot(o.x - cp.x, o.y - cp.y, o.z - cp.z); if (dc < perto) { perto = dc; pan = j.pan(o.x, o.z); } j.audio.ciwsRajada(dc, j.pan(o.x, o.z)); } }
    this.laserAAFim(); j.audio.ciwsContinuo(perto < 2600, perto, pan);
    { let f = 0; const wo = this._wo || (this._wo = { x: 0, y: 0, z: 0 }); for (const n of sim.navios) { if (!n.lasers) continue; for (let i = 0; i < n.lasers.length && f < this.feixes.length; i++) { const L = n.lasers[i]; if (!L.on) continue; const pl = n.P.laser[i]; sim.mundo(n, pl.x, pl.y + 0.95, pl.z, wo);
        const m = this.feixes[f++]; const dx = L.tx - wo.x, dy = L.ty - wo.y, dz = L.tz - wo.z, d = Math.hypot(dx, dy, dz) || 1; m.visible = true; m.position.set(wo.x, wo.y, wo.z); m.lookAt(this._vL.set(L.tx, L.ty, L.tz)); const lg = (1 + Math.min(1, Math.hypot(wo.x - cp.x, wo.z - cp.z) / 1500)) * 0.8; m.scale.set(lg, lg, d); /* v1.2.14: feixe mais fino */
        if (Math.random() < 0.175) fx.faiscas(L.tx, L.ty, L.tz); if (Math.random() < 0.14) fx.fumaca.emite(L.tx, L.ty, L.tz, 0, 1, 0, '#9aa0a6', 0.25, 2, 1.2, 1.5, 0, 0.4); } } for (; f < this.feixes.length; f++) this.feixes[f].visible = false; } /* v1.2.11: laser */
    // espuma de interseção: os navios mais próximos da câmera vão para o shader (10 Hz)
    this.tCasco -= dt; if (this._bino !== !!j.bino) { this._bino = !!j.bino; this.tCasco = 0; } if (this.tCasco <= 0) { this.tCasco = 0.1; const L = this.ordem; L.length = 0; for (const n of sim.navios) if ((!n.morto || n.tMorto < 20) && !(j.bino && n === j.eu)) L.push(n); /* v1.2.14: óptica = navio próprio oculto, sem máscara/espuma dele */
      this._cpx = cp.x; this._cpz = cp.z; L.sort(this._cmp); }
    j.amb.cascos(this.ordem, this.ordem.length);
    // alerta de míssil inimigo (texto + alarme posicional + voz pt-BR)
    this.tAlerta -= dt; const eu = j.eu; if (!eu.morto && !j.mem.espectador) { let m0 = null, md = 1e9; for (const m of sim.misseis) { if (!m.ativo || m.alvo !== eu.id || m.isca >= 0 || m.fase < FASE.CRUZEIRO) continue; const d = Math.hypot(m.x - eu.x, m.z - eu.z); if (d < md) { md = d; m0 = m; } }
      if (m0 && md < 7000 && this.tAlerta <= 0) { this.tAlerta = 9; j.hud.msg('MÍSSIL INIMIGO — DEFESA ATIVADA', 3, '#ef4444'); j.audio.alertaMissil(j.pan(m0.x, m0.z)); } }
    // contatos pequenos para o radar
    let k2 = 0; for (const q of sim.drones) if (q.ativo && (q.time === eu.time || Math.hypot(q.x - eu.x, q.z - eu.z) < 6000)) { const M = this.menores[k2++]; M.x = q.x; M.z = q.z; M.meu = q.time === eu.time ? 1 : 0; M.drone = 1; }
    for (const l of sim.lanchas) if (l.ativo && (l.time === eu.time || Math.hypot(l.x - eu.x, l.z - eu.z) < 7000)) { const M = this.menores[k2++]; M.x = l.x; M.z = l.z; M.meu = l.time === eu.time ? 1 : 0; M.drone = 0; }
    this.menoresN = k2; if (!this._lista) this._lista = []; this._lista.length = 0; for (let i = 0; i < k2; i++) this._lista.push(this.menores[i]);
  }
  /** Lista (reutilizada) de drones/lanchas para o radar. */
  get listaMenores() { return this._lista || []; }

  /** Disparo de canhão: agrupa os canos/torres que dispararam no mesmo quadro numa salva sincronizada. */
  tiro(e, d, pan) { const k = e.id; let s = this.salvas.get(k); if (!s) { s = { n: 0, d, pan, cal: e.cal, l: [], pool: [] }; this.salvas.set(k, s); } if (!s.n) { s.d = d; s.pan = pan; s.l.length = 0; } s.n++; s.cal = e.cal; if (d < s.d) { s.d = d; s.pan = pan; } if (s.l.length < 12) { const v = s.pool[s.l.length] || (s.pool[s.l.length] = {}); v.d = d; v.pan = pan; v.cal = e.cal; v.torre = e.torre | 0; v.cano = e.cano | 0; s.l.push(v); } } /* v1.2.16: guarda cada torre/cano (objetos reutilizados) */
  /* v1.2.16: guarda cada torre/cano (objetos reutilizados) */
  fimEventos() { const j = this.j; for (const [id, s] of this.salvas) { if (!s.n) continue; const meu = id === j.eu.id; const nc = j.S && j.S.sim.navios[id], pes = !!(nc && nc.C.cruzeiroPesado && j.audio.buf && j.audio.buf.cp_grande); /* v1.2.19 item 2: só os 7 cruzeiros pesados usam o banco próprio; demais classes = exatamente a 1.2.17 */ const nome = pes ? (s.cal > 100 ? (s.d > 3200 && !meu ? 'cp_longe' : 'cp_grande') : s.cal >= 76 ? 'cp_100' : s.cal >= 20 ? 'cp_30' : 'cp_127') : s.d > 3200 ? 'canhao_longe' : s.cal > 100 ? 'canhao_grande' : 'canhao_medio'; if (j.audio.salvaTorres) j.audio.salvaTorres(pes ? nome : meu ? (s.cal > 100 ? 'canhao_grande' : 'canhao_medio') : nome, s.l, meu, meu ? 1.4 : 1.0); else j.audio.salva(nome, s.n, s.d, s.pan, meu ? 1 : 0.9); /* v1.2.16: voz por torre; navio do jogador sem atraso de distância */ { const cv = id === j.eu.id && j.camModo === 'conves'; j.audio.camada && j.audio.camada('canhao', { atraso: id !== j.eu.id, d: cv ? 0 : id === j.eu.id ? Math.min(s.d, 60) : s.d, pan: s.pan, vol: (cv ? 1.5 : id === j.eu.id ? 1.15 : 0.8) * Math.min(1.35, 0.85 + 0.1 * s.n), k: (s.cal || 127) * (cv ? 1.25 : 1) }); } /* v1.2.9: câmera CONVÉS = campo próximo (mais grave e forte) */ /* v1.2.8: camadas por calibre */ if (id === j.eu.id) j.mem.shake = Math.max(j.mem.shake, 0.06 + 0.03 * Math.min(4, s.n)); s.n = 0; } }

  /** Eventos novos da v1.1.0. Retorna true se tratou. */
  evento(e, d, pan) {
    const j = this.j, fx = j.fx, A = j.audio, eu = j.eu, sim = j.S.sim;
    switch (e.t) {
      case 'samLanc': { const r = j.navios[e.id]; if (r && r.tampaT) r.tampaT[e.cel] = 2.2; for (let k = 0; k < 4; k++) fx.fumaca.emite(e.x, e.y + 1, e.z, (Math.random() - 0.5) * 6, 3 + Math.random() * 3, (Math.random() - 0.5) * 6, '#eef0f2', 0.45, 4, 2.4, 4, 0, 0.8); /* v1.2.14: −30% */ A.toca('vls_lancamento', { d, pan, vol: 0.7, rate: 1.25 }); if (e.id === eu.id) j.hud.msg('SAM lançado — interceptando míssil', 1.6, '#22c55e'); return true; }
      case 'samAbate': if (e.arAr) { if (e.por === eu.id) { j.hud.msg('✈✖ AERONAVE INIMIGA ABATIDA — míssil ar-ar', 2.2, '#4ade80'); j.hud.logDefesa && j.hud.logDefesa('Abate ar-ar ✈'); } j.fx && j.fx.abateAereo && j.fx.abateAereo(e.x, e.y, e.z, 0, 0, 0, 1.4); return true; } /* v1.2.59: ícone de abate aéreo */
      case 'samAbate': if (!e.heli) j.abateAereo(e, d, pan, 1); /* heli derrubado tem a queda própria (derrubaAereo) */ /* v1.2.21 item 18: explosão no ar (mesmo efeito do CIWS, ogiva do SAM: um pouco mais forte) */ { const n = sim.navios[e.por]; if (n && n.time === eu.time && d < 6000) j.hud.logDefesa(n === eu ? 'SAM interceptou míssil' : 'SAM da frota interceptou'); } return true;
      case 'samFalha': case 'samFim': fx.faiscas(e.x, e.y, e.z); return true;
      case 'droneLanc': if (sim.navios[e.id] && sim.navios[e.id].time !== eu.time && !this._avisoDrone) { this._avisoDrone = 1; j.hud.msg('Drone inimigo lançado — CIWS e 30 mm em alerta', 2.2, '#f59e0b'); } return true;
      case 'droneMergulho': if (e.alvo === eu.id) j.hud.msg('Drone em mergulho sobre nós!', 1.6, '#ef4444'); return true;
      case 'droneAbatido': fx.explosao(e.x, e.y, e.z, 0.42); A.toca('explosao_longe', { d, pan, vol: 0.6 }); { const n = sim.navios[e.por]; if (n === eu) j.hud.logDefesa((e.arma === '30mm' ? '30 mm' : 'CIWS') + ' abateu drone'); } return true;
      case 'torpAbatido': fx.geiser(e.x, e.z, 1.1); A.toca('respingo_grande', { d, pan, vol: 0.8 }); { const n = sim.navios[e.por]; if (n && n.time === eu.time && d < 4000) j.hud.logDefesa(n === eu ? 'Torpedo destruído' : 'Frota destruiu torpedo'); } return true;
      case 'lanchaLanc': if (e.time !== eu.time && !this._avisoLancha) { this._avisoLancha = 1; j.hud.msg('Lanchas de ataque rápido inimigas na área', 2.2, '#f59e0b'); } return true;
      case 'lanchaAfunda': fx.explosao(e.x, 1.5, e.z, 0.9); fx.geiser(e.x, e.z, 0.8); A.toca('explosao_media', { d, pan, vol: 0.8 }); if (e.por === eu.id) j.hud.msg('Lancha inimiga afundada!', 1.4, '#22c55e'); return true;
      case 'salva': return true;
    }
    return false;
  }
}
function alturaSuave(sim, x, z) { return alturaMar(x, z, sim.t); }
