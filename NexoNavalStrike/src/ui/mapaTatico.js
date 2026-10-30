// v1.2.67 (Valter) — MAPA TÁTICO em tela cheia (toque no mini-radar): batimetria e relevo da arena, unidades com símbolos militares
// (estilo MIL-STD-2525: amigo = círculo/cúpula azul, hostil = losango/divisa vermelho; letras do tipo), vetor de rumo, ficha do alvo
// (classe, armamento, distância, velocidade relativa, vida e avarias) e o botão ENGAJAR do PILOTO AUTOMÁTICO OFENSIVO.
// Inimigos só aparecem onde há CONTATO (posição do contato, não a real). O fundo de relevo é desenhado uma vez por arena (256²) e
// o mapa redesenha a ~12 Hz — custo desprezível no celular.
import { alturaTerreno } from '../sim/maps.js';
import { EST } from '../naval5v5/aereo.js';
import './mapaTatico.css';

const RELEVO = new WeakMap();
/** Relevo/batimetria da arena: azul por profundidade (sombreado), terra com sombreamento de encosta e linha de costa clara. */
function relevo(T) { if (RELEVO.has(T)) return RELEVO.get(T); const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), im = c.createImageData(N, N), d = im.data, tam = T.tam;
  const H = new Float32Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) H[j * N + i] = alturaTerreno(T, (i + 0.5) / N * tam - tam / 2, (j + 0.5) / N * tam - tam / 2);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const h = H[j * N + i], k = (j * N + i) * 4; const hx = H[j * N + Math.min(N - 1, i + 1)] - H[j * N + Math.max(0, i - 1)], hz = H[Math.min(N - 1, j + 1) * N + i] - H[Math.max(0, j - 1) * N + i]; const luz = Math.max(-1, Math.min(1, (-hx - hz) / 40));
    let r, g, b; if (h > 0) { const a = Math.min(1, h / 260); r = 74 + a * 70 + luz * 38; g = 92 + a * 40 + luz * 34; b = 58 + a * 30 + luz * 26; }
    else { const p = Math.min(1, -h / 220); r = 26 - p * 18; g = 78 - p * 46; b = 112 - p * 44; if (h > -12) { r += 30; g += 40; b += 30; } }
    const costa = (h > 0) !== (H[j * N + Math.min(N - 1, i + 1)] > 0) || (h > 0) !== (H[Math.min(N - 1, j + 1) * N + i] > 0); if (costa) { r = 214; g = 206; b = 170; }
    d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255; }
  c.putImageData(im, 0, 0); c.strokeStyle = 'rgba(160,200,230,.13)'; c.lineWidth = 1; for (let q = 1; q < 8; q++) { const p = q * N / 8; c.beginPath(); c.moveTo(p, 0); c.lineTo(p, N); c.moveTo(0, p); c.lineTo(N, p); c.stroke(); } /* quadrícula de 1/8 da arena */
  RELEVO.set(T, cv); return cv; }

const TIPO = (C) => C.base ? ['BS', 'Megabase flutuante'] : C.porta ? ['PA', 'Porta-aviões'] : C.mercante ? ['MC', 'Mercante'] : C.id === 'parcel' ? ['AP', 'Apoio offshore'] : /capitania|encoura/i.test(C.classe || '') || C.pf === 'capitania' ? ['CP', 'Capitânia'] : /cruzador/i.test(C.classe || '') ? ['CR', 'Cruzador'] : /contratorpedeiro|destr/i.test(C.classe || '') ? ['CT', 'Contratorpedeiro'] : /fragata/i.test(C.classe || '') ? ['FR', 'Fragata'] : ['CV', 'Corveta / patrulha'];
const TIPO_AR = (H) => H.bombardeiro ? 'BB' : H.drone ? 'DR' : H.aew ? 'AE' : H.aviao ? 'CÇ' : 'HL';
const kmTxt = (m) => (m / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' km';

export class MapaTatico {
  constructor(jogo) { this.g = jogo; this.el = null; this.sel = -1; this.t = 0; }
  get aberto() { return !!this.el; }
  abre() { if (this.el) return; const g = this.g; const el = document.createElement('div'); el.className = 'mapa-tat';
    el.innerHTML = `<canvas class="mt-cv"></canvas><aside class="mt-ficha"></aside><div class="mt-topo"><b>MAPA TÁTICO</b><span>toque no mar: rumo · toque num contato: ficha e ENGAJAR</span><button class="mt-fecha" data-mt="fecha" aria-label="Fechar">✕</button></div>
      <div class="mt-leg"><i class="lg-am"></i>amigo <i class="lg-hs"></i>hostil (contato) <i class="lg-ar"></i>aeronave</div>`;
    ((g.raizHud && g.raizHud.querySelector('.hud')) || g.raizHud || document.body).appendChild(el); this.el = el; this.cv = el.querySelector('.mt-cv'); this.ficha = el.querySelector('.mt-ficha');
    el.addEventListener('pointerdown', (e) => { e.stopPropagation(); const b = e.target.closest('[data-mt]'); if (b) { e.preventDefault(); this.botao(b.dataset.mt); return; } if (e.target === this.cv) this.toque(e); });
    requestAnimationFrame(() => { el.classList.add('on'); }); this.dim(); this.desenha(); g.audio && g.audio.bip && g.audio.bip(1200, 0.04, 0.05); }
  fecha() { if (!this.el) return; const el = this.el; this.el = null; el.classList.remove('on'); setTimeout(() => el.remove(), 220); }
  dim() { const r = { width: this.el.offsetWidth, height: this.el.offsetHeight }, dpr = Math.min(2, devicePixelRatio || 1); /* v1.2.69: tamanho de LAYOUT — o getBoundingClientRect pegava a janela ainda encolhida pela animação de entrada (scale .35) → mapa de 60 px, tela escura */ this.W = r.width; this.Hh = r.height; this.cv.width = r.width * dpr; this.cv.height = r.height * dpr; this.dpr = dpr;
    const lado = Math.min(r.height - 54, r.width - 290), x0 = 12 + Math.max(0, (r.width - 290 - lado) / 2); this.box = { x: x0, y: 44, s: lado }; }
  w2s(x, z) { const T = this.g.S.T || this.g.S.sim.T, b = this.box; return [b.x + (x / T.tam + 0.5) * b.s, b.y + (z / T.tam + 0.5) * b.s]; }
  s2w(px, py) { const T = this.g.S.T || this.g.S.sim.T, b = this.box; return [((px - b.x) / b.s - 0.5) * T.tam, ((py - b.y) / b.s - 0.5) * T.tam]; }
  /** Unidades visíveis: aliados (posição real) e inimigos detectados (posição do contato); aeronaves no ar. */
  unidades() { const g = this.g, sim = g.S.sim, eu = g.eu, L = []; const cont = sim.contatos[eu.time];
    for (const n of sim.navios) { if (n.morto) continue; if (n.time === eu.time) L.push({ id: n.id, n, x: n.x, z: n.z, rumo: n.rumo, v: n.v || 0, ami: 1 }); else { const c = cont.get(n.id); if (c) L.push({ id: n.id, n, x: c.x, z: c.z, rumo: c.rumo || 0, v: c.v || 0, ami: 0, idade: sim.t - (c.t || 0) }); } }
    for (const h of sim.helis) { if (!h.ativo || h.estado < EST.DECOLA || h.estado > EST.POUSO) continue; const ami = h.time === eu.time; if (!ami && !(sim.revelaTudo || this.vistoAr(h))) continue; L.push({ ar: 1, h, x: h.x, z: h.z, rumo: h.rumo, v: h.v || 0, ami, eu: eu.controle >= 0 && eu.helis && sim.helis[eu.helis[eu.controle]] === h }); }
    if (sim.nukes) for (const q of sim.nukes) { if (!q.ativo) continue; const ami = q.time === eu.time; L.push({ ar: 1, q, x: q.x, z: q.z, rumo: q.rumo || 0, v: Math.hypot(q.vx || 0, q.vz || 0), ami, hd: !!q.hidro }); }
    return L; }
  vistoAr(h) { const eu = this.g.eu; return Math.hypot(h.x - eu.x, h.z - eu.z) < (eu.C.radar || 14000) * (eu.radarAtivo ? 1 : 0.45); }
  /** Posição de referência do jogador: a aeronave que ele pilota (se houver) ou o navio. */
  ref() { const g = this.g, sim = g.S.sim, eu = g.eu; if (eu.controle >= 0 && eu.helis) { const h = sim.helis[eu.helis[eu.controle]]; if (h && h.ativo) return { x: h.x, z: h.z, rumo: h.rumo, v: h.v || 0, ar: h }; } return { x: eu.x, z: eu.z, rumo: eu.rumo, v: eu.v || 0 }; }
  toque(e) { const r = this.cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top, b = this.box; if (px < b.x || px > b.x + b.s || py < b.y || py > b.y + b.s) return;
    let best = null, bd = 26; for (const u of this.unidades()) { if (u.ar || u.n === this.g.eu) continue; const [sx, sy] = this.w2s(u.x, u.z), d = Math.hypot(sx - px, sy - py); if (d < bd) { bd = d; best = u; } }
    if (best) { this.sel = best.id; this.g.audio && this.g.audio.bip && this.g.audio.bip(1500, 0.03, 0.05); this.desenha(); return; }
    const eu = this.g.eu; if (eu.controle < 0 && !eu.morto) { const [wx, wz] = this.s2w(px, py), v = Math.atan2(wx - eu.x, -(wz - eu.z)); this.g.S.comando({ t: 'rumo', v }); this.g.hud.logImpacto && this.g.hud.logImpacto(`Rumo ${String(Math.round(((v * 57.29578) % 360 + 360) % 360)).padStart(3, '0')}° (mapa tático)`); this.rumoMarca = { x: wx, z: wz, t: 2.5 }; }
    this.sel = -1; this.desenha(); }
  engajado() { const g = this.g, sim = g.S.sim, eu = g.eu; if (eu.controle >= 0 && eu.helis) { const h = sim.helis[eu.helis[eu.controle]]; return h && h.apEng ? h.apAlvo : -1; } return eu.apAlvo >= 0 ? eu.apAlvo : -1; }
  botao(k) { const g = this.g; if (k === 'fecha') return this.fecha(); if (k === 'eng') { const atual = this.engajado(); if (atual >= 0 && atual === this.sel) { g.S.comando({ t: 'engajar', v: 0, alvo: -1 }); g.hud.msg('Piloto automático DESLIGADO — você no comando.', 2, '#38bdf8'); }
      else if (this.sel >= 0) { const hd = g.eu.hd && g.eu.hd.noAr >= 0 && g.eu.hd.pil; if (hd) { g.hud.msg('No hidroavião use TRAVAR e AUTO do próprio avião.', 2.4, '#f59e0b'); return; } g.S.comando({ t: 'engajar', v: 1, alvo: this.sel }); g.hud.msg('PILOTO AUTOMÁTICO OFENSIVO — engajando o alvo; mexa no leme/telégrafo ou toque em DESATIVAR para retomar.', 3, '#f59e0b'); this.fecha(); }
      this.desenha(); } else if (k === 'solta') { this.sel = -1; this.desenha(); } }
  passo(dt) { if (!this.el) return; this.t += dt; if (this.rumoMarca) { this.rumoMarca.t -= dt; if (this.rumoMarca.t <= 0) this.rumoMarca = null; } if (this.t > 0.08) { this.t = 0; this.desenha(); } }
  desenha() { if (!this.el) return; if (this.el.offsetWidth !== this.W || this.el.offsetHeight !== this.Hh) this.dim(); /* v1.2.69: girou a tela/mudou o tamanho → mede de novo */ const g = this.g, sim = g.S.sim, T = g.S.T || sim.T, c = this.cv.getContext('2d'), dpr = this.dpr, b = this.box; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, this.W, this.Hh);
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 14; c.drawImage(relevo(T), b.x, b.y, b.s, b.s); c.restore(); c.strokeStyle = 'rgba(212,175,55,.6)'; c.lineWidth = 1.5; c.strokeRect(b.x, b.y, b.s, b.s);
    const z = sim.match && sim.match.centro; if (z) { const [zx, zy] = this.w2s(z.x, z.z); c.strokeStyle = 'rgba(250,204,21,.7)'; c.setLineDash([5, 4]); c.beginPath(); c.arc(zx, zy, (z.r || 1500) / T.tam * b.s, 0, 7); c.stroke(); c.setLineDash([]); }
    const R = this.ref(), [rx, ry] = this.w2s(R.x, R.z), sel = this.sel, eng = this.engajado();
    if (this.rumoMarca) { const [mx, my] = this.w2s(this.rumoMarca.x, this.rumoMarca.z); c.strokeStyle = '#7dd3fc'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(rx, ry); c.lineTo(mx, my); c.stroke(); c.setLineDash([]); c.beginPath(); c.arc(mx, my, 6, 0, 7); c.stroke(); }
    for (const u of this.unidades()) { const [sx, sy] = this.w2s(u.x, u.z), cor = u.ami ? '#5ab4ff' : '#ff5a4f', s = u.ar ? 7 : 9; c.lineWidth = 2; c.strokeStyle = cor; c.fillStyle = u.ami ? 'rgba(20,60,110,.85)' : 'rgba(110,20,20,.85)';
      if (u.v > 0.5) { const L = Math.min(26, 6 + u.v * (u.ar ? 0.08 : 1.6)); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.sin(u.rumo) * L, sy - Math.cos(u.rumo) * L); c.stroke(); }
      c.beginPath(); if (u.ar) { if (u.ami) { c.arc(sx, sy + 2, s, Math.PI, 0); c.closePath(); } else { c.moveTo(sx - s, sy + 3); c.lineTo(sx, sy - s); c.lineTo(sx + s, sy + 3); c.closePath(); } }
      else if (u.ami) c.arc(sx, sy, s, 0, 7); else { c.moveTo(sx, sy - s - 2); c.lineTo(sx + s + 2, sy); c.lineTo(sx, sy + s + 2); c.lineTo(sx - s - 2, sy); c.closePath(); }
      c.globalAlpha = u.idade > 30 ? 0.55 : 1; c.fill(); c.stroke(); c.globalAlpha = 1;
      c.fillStyle = '#f4f6f8'; c.font = `700 ${u.ar ? 7 : 8}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(u.ar ? (u.h ? TIPO_AR(u.h.H) : u.hd ? 'HD' : 'BB') : TIPO(u.n.C)[0], sx, u.ar && u.ami ? sy - 1 : sy);
      if ((u.n && u.n === g.eu) || u.eu) { c.strokeStyle = '#fde68a'; c.lineWidth = 1.5; c.beginPath(); c.arc(sx, sy, s + 5, 0, 7); c.stroke(); }
      if (!u.ar && u.id === sel) { c.strokeStyle = '#facc15'; c.lineWidth = 2; c.strokeRect(sx - s - 6, sy - s - 6, (s + 6) * 2, (s + 6) * 2); c.setLineDash([4, 3]); c.beginPath(); c.moveTo(rx, ry); c.lineTo(sx, sy); c.stroke(); c.setLineDash([]); c.fillStyle = '#facc15'; c.font = '700 10px system-ui'; c.fillText(kmTxt(Math.hypot(u.x - R.x, u.z - R.z)), (rx + sx) / 2, (ry + sy) / 2 - 8); }
      if (!u.ar && u.id === eng) { c.strokeStyle = '#f59e0b'; c.lineWidth = 2; c.beginPath(); c.arc(sx, sy, s + 10 + Math.sin(performance.now() / 160) * 2, 0, 7); c.stroke(); } }
    this.fichaHtml(); }
  fichaHtml() { const g = this.g, sim = g.S.sim, eu = g.eu, sel = this.sel, eng = this.engajado(); const e = sel >= 0 ? sim.navios[sel] : null; let h, ac = '';
    if (!e || e.morto) { const C = eu.C; h = `<h3>${eu.comandante || 'Seu navio'}</h3><p class="mt-cls">${C.nome} ${C.num || ''} · ${TIPO(C)[1]}</p>${this.barra(eu)}<p class="mt-dica">Toque num contato do mapa para ver a ficha e ENGAJAR com o piloto automático.</p>${eng >= 0 ? `<p class="mt-eng">AUTO-PILOTO engajando: ${sim.navios[eng] ? sim.navios[eng].C.nome : '—'}</p>` : ''}`; if (eng >= 0) ac = '<button class="mt-bt mt-off" data-mt="eng">DESATIVAR AUTO-PILOTO</button>'; if (this.sel >= 0 && (!e || e.morto)) this.sel = -1; }
    else { const C = e.C, R = this.ref(), ami = e.time === eu.time, u = this.unidades().find((q) => !q.ar && q.id === e.id) || { x: e.x, z: e.z, v: e.v || 0, rumo: e.rumo }, d = Math.hypot(u.x - R.x, u.z - R.z);
      const vr = R.v * Math.cos(R.rumo - Math.atan2(u.x - R.x, -(u.z - R.z))) - u.v * Math.cos(u.rumo - Math.atan2(u.x - R.x, -(u.z - R.z))); /* aproximação (+) / afastamento (−) em m/s */
      const arm = [C.canhao && C.canhao.cal ? `Canhão ${C.canhao.cal} mm${e.torres ? ' ×' + e.torres.length : ''}` : '', C.vls ? `VLS ${C.vls} células` : '', C.sam ? `SAM ${C.sam}` : '', C.ciws ? `CIWS ×${C.ciws}` : '', C.laser ? `Laser ×${C.laser}` : '', C.torp ? 'Torpedos' : '', C.heli ? `Aeronaves ${C.heli}` : '', C.rbu ? 'Lança-foguetes ASW' : ''].filter(Boolean);
      const av = e.avaria || {}, avs = [e.incendio > 0 ? '<i class="av-fogo">INCÊNDIO</i>' : '', e.alagamento > 0 ? '<i class="av-agua">ALAGAMENTO</i>' : '', ...['motor', 'leme', 'radar', 'canhao', 'vls', 'ponte'].filter((k) => av[k] != null && av[k] < 0.999).map((k) => `<i>${{ motor: 'Motores', leme: 'Leme', radar: 'Radar', canhao: 'Canhões', vls: 'VLS', ponte: 'Ponte' }[k]} ${Math.round(av[k] * 100)}%</i>`)].filter(Boolean);
      h = `<h3 class="${ami ? 'ami' : 'hos'}">${C.nome} ${C.num || ''}</h3><p class="mt-cls">${C.classe || ''} · ${TIPO(C)[1]} · ${C.nacao || ''}${ami ? ' · AMIGO' : ' · HOSTIL'}</p>${this.barra(e)}
        <dl><dt>Distância</dt><dd>${kmTxt(d)}</dd><dt>Vel. relativa</dt><dd>${vr >= 0 ? 'aproxima' : 'afasta'} ${Math.abs(Math.round(vr * 1.944))} nós</dd><dt>Velocidade</dt><dd>${Math.round(u.v * 1.944)} nós</dd></dl>
        <p class="mt-sub">Armamento</p><p class="mt-arm">${arm.join(' · ') || '—'}</p><p class="mt-sub">Avarias</p><p class="mt-av">${avs.join('') || '<span>sem avarias visíveis</span>'}</p>`; ac = `${ami ? '' : `<button class="mt-bt ${eng === e.id ? 'mt-off' : 'mt-on'}" data-mt="eng">${eng === e.id ? 'DESATIVAR AUTO-PILOTO' : 'PILOTO AUTOMÁTICO · ENGAJAR'}</button>`}<button class="mt-bt mt-sec" data-mt="solta">desmarcar</button>`; }
    if (!this.fInfo) { this.ficha.innerHTML = '<div class="mt-info"></div><div class="mt-acoes"></div>'; this.fInfo = this.ficha.firstChild; this.fAc = this.ficha.lastChild; } /* botões num bloco próprio: só mudam com seleção/estado — o toque nunca cai num botão sendo recriado */
    if (this.fInfo._h !== h) { this.fInfo._h = h; this.fInfo.innerHTML = h; } if (this.fAc._h !== ac) { this.fAc._h = ac; this.fAc.innerHTML = ac; } }
  barra(n) { const v = Math.max(0, n.vida / (n.C.vida || 1)); return `<div class="mt-vida"><i style="width:${Math.round(v * 100)}%;background:${v > 0.6 ? '#22c55e' : v > 0.3 ? '#f59e0b' : '#ef4444'}"></i><span>${Math.round(n.vida).toLocaleString('pt-BR')} / ${Math.round(n.C.vida).toLocaleString('pt-BR')}</span></div>`; }
}
