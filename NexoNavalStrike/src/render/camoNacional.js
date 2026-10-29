// v1.2.19 item 12 — CAMUFLAGENS LENDÁRIAS NACIONAIS: atlas ÚNICO (canvas 2D, desenhado no próprio app — sem asset externo)
// com os motivos animais de cada nação, amostrado pelo shader da pintura tipo 24 (1 programa para TODAS as nacionais; a nação é
// só um uniform). Células 512×256 em grade 3×2, fundo transparente, bicho voltado para a ESQUERDA (= proa no casco).
// 0 BRA onça-pintada no bote · 1 EUA águia-de-cabeça-branca de asas abertas · 2 UK leão no bote · 3 CHN grou-de-coroa-vermelha em voo
import * as THREE from 'three';
let TEX = null;
const W = 512, H = 256;
/** contorno suave por pontos médios (quadráticas) */
function forma(x, P) { x.beginPath(); const n = P.length; const m = (i) => [(P[i][0] + P[(i + 1) % n][0]) / 2, (P[i][1] + P[(i + 1) % n][1]) / 2]; const s = m(n - 1); x.moveTo(s[0], s[1]); for (let i = 0; i < n; i++) { const q = m(i); x.quadraticCurveTo(P[i][0], P[i][1], q[0], q[1]); } x.closePath(); }
function rnd(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
const ell = (x, cx, cy, rx, ry, r = 0) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, r, 0, 6.283); x.fill(); };
const membro = (x, P, w0, w1) => { for (let i = 0; i < P.length - 1; i++) { const t = i / (P.length - 1); x.lineWidth = w0 + (w1 - w0) * t; x.beginPath(); x.moveTo(P[i][0], P[i][1]); x.lineTo(P[i + 1][0], P[i + 1][1]); x.stroke(); } };
/** felino em BOTE (partes anatômicas unidas num canvas próprio; pelagem aplicada por cima com source-atop) */
function felino(x, leao) { const c = document.createElement('canvas'); c.width = W; c.height = H; const q = c.getContext('2d'); q.lineCap = q.lineJoin = 'round';
  const g = q.createLinearGradient(0, 60, 0, 190); if (leao) { g.addColorStop(0, '#e9bb5a'); g.addColorStop(0.6, '#d09a3c'); g.addColorStop(1, '#f1d9a2'); } else { g.addColorStop(0, '#f2bd38'); g.addColorStop(0.55, '#e39d22'); g.addColorStop(1, '#f7ead0'); }
  q.fillStyle = g; q.strokeStyle = g;
  q.strokeStyle = leao ? '#a9782e' : '#b47a18'; membro(q, [[176, 126], [128, 158], [92, 176], [70, 184]], 26, 16); membro(q, [[332, 132], [372, 168], [420, 192], [452, 200]], 30, 16); // patas do lado de lá (sombra)
  q.fillStyle = g; q.strokeStyle = g;
  ell(q, 252, 112, 118, 37, -0.06); ell(q, 162, 106, 54, 42, -0.2); ell(q, 342, 108, 52, 44, 0.1); ell(q, 118, 92, 38, 28, -0.4);
  ell(q, 80, 82, 32, 26, -0.15); ell(q, 52, 92, 20, 15, 0.1); ell(q, 56, 108, 17, 7, 0.45); ell(q, 92, 58, 9, 10); ell(q, 106, 62, 8, 9);
  membro(q, [[150, 124], [106, 146], [64, 160], [36, 164]], 28, 17); ell(q, 32, 164, 13, 9); ell(q, 68, 186, 12, 8);
  membro(q, [[356, 128], [404, 150], [452, 166], [486, 172]], 32, 17); ell(q, 488, 172, 13, 8); ell(q, 454, 202, 12, 7);
  membro(q, [[384, 96], [426, 82], [458, 64], [482, 42]], leao ? 12 : 17, leao ? 7 : 11);
  q.globalCompositeOperation = 'source-atop';
  if (leao) { q.fillStyle = '#7a4718'; ell(q, 116, 86, 52, 52, 0.25); q.fillStyle = '#5d3410'; for (let i = 0; i < 14; i++) { const a = -1.2 + i * 0.22; ell(q, 116 + Math.cos(a) * 46, 86 + Math.sin(a) * 46, 12, 7, a); }
    q.fillStyle = '#e4b350'; ell(q, 70, 90, 26, 22, -0.15); ell(q, 50, 98, 17, 13, 0.1); q.fillStyle = '#5d3410'; ell(q, 482, 42, 12, 12); }
  else { const r = rnd(7); for (let i = 0; i < 95; i++) { const cx = 20 + r() * 470, cy = 40 + r() * 170, rr = 4 + r() * 6.5; q.fillStyle = '#9b6416'; ell(q, cx, cy, rr * 0.8, rr * 0.7); q.fillStyle = '#1b1208'; for (let k = 0; k < 5; k++) { if (r() < 0.18) continue; const a = k * 1.256 + r(); ell(q, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.85, rr * 0.42, rr * 0.26, a + 1.57); } }
    q.fillStyle = '#1b1208'; for (let k = 0; k < 6; k++) ell(q, 470 - k * 16, 58 + k * 9 - (k > 3 ? 4 : 0), 6, 4); ell(q, 482, 42, 7, 6); }
  q.fillStyle = 'rgba(255,248,230,0.55)'; ell(q, 250, 140, 100, 12, -0.04); ell(q, 56, 108, 15, 5, 0.45);
  q.globalCompositeOperation = 'source-over';
  q.fillStyle = '#c8f05a'; ell(q, 70, 78, 6, 3.6, -0.25); q.fillStyle = '#000'; ell(q, 69, 78, 1.8, 3);
  q.fillStyle = '#4a0c0c'; q.beginPath(); q.moveTo(40, 100); q.quadraticCurveTo(58, 104, 72, 100); q.quadraticCurveTo(58, 110, 42, 106); q.fill();
  q.fillStyle = '#fff'; for (const [a, b] of [[46, 100], [64, 100]]) { q.beginPath(); q.moveTo(a, b); q.lineTo(a + 2.5, b + 7); q.lineTo(a + 5, b); q.fill(); }
  q.fillStyle = '#2a1a0c'; ell(q, 34, 90, 4, 3); x.drawImage(c, 0, 0); }
function aguia(x) { // águia-de-cabeça-branca de asas abertas (vista de lado/frente), corpo marrom, cabeça e cauda brancas, bico e garras dourados
  const asa = (s) => { const P = []; const o = 256; P.push([o, 120]); for (let i = 0; i <= 7; i++) { const t = i / 7, X = o + s * (40 + t * 200), Y = 118 - Math.sin(t * 2.6) * 78 + t * 30; P.push([X, Y]); P.push([o + s * (52 + t * 200), Y + 22 + t * 10]); } P.push([o + s * 30, 150]); return P; };
  for (const s of [-1, 1]) { forma(x, asa(s)); const g = x.createLinearGradient(256, 40, 256 + s * 240, 160); g.addColorStop(0, '#5a3b22'); g.addColorStop(1, '#2b1a0e'); x.fillStyle = g; x.fill(); x.lineWidth = 2; x.strokeStyle = '#1a1009'; x.stroke();
    x.strokeStyle = 'rgba(210,170,120,0.35)'; x.lineWidth = 1.5; for (let i = 1; i < 7; i++) { const t = i / 7; x.beginPath(); x.moveTo(256 + s * 40, 128); x.lineTo(256 + s * (46 + t * 200), 140 - Math.sin(t * 2.6) * 70 + t * 30); x.stroke(); } }
  forma(x, [[236, 112], [246, 96], [268, 96], [278, 112], [282, 160], [270, 196], [244, 196], [232, 160]]); x.fillStyle = '#4a301b'; x.fill();
  forma(x, [[238, 196], [276, 196], [292, 236], [256, 246], [222, 236]]); x.fillStyle = '#f2f2ee'; x.fill(); x.strokeStyle = '#9a9a96'; x.lineWidth = 1.5; x.stroke();
  forma(x, [[232, 92], [236, 70], [256, 58], [276, 64], [284, 84], [280, 104], [262, 112], [244, 108]]); x.fillStyle = '#f7f7f3'; x.fill(); x.strokeStyle = '#a8a8a2'; x.stroke();
  x.beginPath(); x.moveTo(232, 80); x.quadraticCurveTo(212, 82, 214, 98); x.quadraticCurveTo(224, 92, 238, 92); x.fillStyle = '#e8b01e'; x.fill();
  x.beginPath(); x.arc(244, 76, 3.4, 0, 6.283); x.fillStyle = '#d9a300'; x.fill(); x.beginPath(); x.arc(244, 76, 1.6, 0, 6.283); x.fillStyle = '#000'; x.fill();
  x.strokeStyle = '#e8b01e'; x.lineWidth = 5; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(256 + s * 10, 190); x.lineTo(256 + s * 18, 214); x.stroke(); } }
function grou(x) { // grou-de-coroa-vermelha em voo: branco, pescoço e pontas das asas pretas, coroa vermelha
  forma(x, [[150, 120], [250, 112], [330, 116], [360, 126], [330, 138], [250, 140], [170, 134]]); x.fillStyle = '#f5f5f2'; x.fill();
  for (const [s, c] of [[1, '#f5f5f2'], [-1, '#e7e7e3']]) { forma(x, [[220, 120], [260, 60 + (s < 0 ? 30 : 0)], [300, 20 + (s < 0 ? 50 : 0)], [360, 10 + (s < 0 ? 60 : 0)], [380, 24 + (s < 0 ? 56 : 0)], [330, 70 + (s < 0 ? 30 : 0)], [290, 120]]); x.fillStyle = c; x.fill(); x.strokeStyle = '#b8b8b4'; x.lineWidth = 1.5; x.stroke();
    x.save(); x.clip(); x.fillStyle = '#151515'; x.fillRect(300, 0, 120, s < 0 ? 100 : 60); x.restore(); }
  x.strokeStyle = '#151515'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(160, 124); x.quadraticCurveTo(110, 118, 70, 112); x.stroke();
  x.beginPath(); x.ellipse(62, 110, 13, 9, 0, 0, 6.283); x.fillStyle = '#f5f5f2'; x.fill(); x.beginPath(); x.arc(60, 103, 5, 0, 6.283); x.fillStyle = '#d0141c'; x.fill();
  x.beginPath(); x.moveTo(50, 110); x.lineTo(20, 114); x.lineTo(50, 115); x.fillStyle = '#6a6a50'; x.fill(); x.strokeStyle = '#2a2a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(350, 130); x.lineTo(470, 140); x.moveTo(350, 134); x.lineTo(470, 148); x.stroke(); }
/** atlas compartilhado (1536×512, sRGB, mipmaps) — criado só quando uma nacional lendária é usada */
export function texNacional() { if (TEX) return TEX;
  const c = document.createElement('canvas'); c.width = W * 3; c.height = H * 2; const x = c.getContext('2d');
  const cel = (i, f) => { x.save(); x.translate((i % 3) * W, Math.floor(i / 3) * H); x.beginPath(); x.rect(0, 0, W, H); x.clip(); f(x); x.restore(); };
  cel(0, (q) => felino(q, false)); cel(1, aguia); cel(2, (q) => felino(q, true)); cel(3, grou);
  TEX = new THREE.CanvasTexture(c); TEX.colorSpace = THREE.SRGBColorSpace; TEX.anisotropy = (globalThis.__nnsAniso || 8) /* v1.2.21 item 20: anisotropia máx. também na camo nacional */; TEX.generateMipmaps = true; TEX.minFilter = THREE.LinearMipmapLinearFilter; TEX.needsUpdate = true; return TEX; }
