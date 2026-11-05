// v1.2.60 — MEGABASE AERONAVAL FLUTUANTE: visual do módulo militar e do módulo comercial conectado.
// O convés de operações (pista, catapultas, elevadores, ilha, defesas e parque de aeronaves) vem do porta-aviões gigante;
// aqui o casco de navio fica escondido dentro de um PONTÃO retangular de concreto e entram hangares, tanques, radares,
// veículos, tripulação, terminal comercial com pontes de embarque, torre de controle envidraçada e aviões de linha.
// Coordenadas locais do navio: proa −z, boreste +x, y para cima. Tudo estático → o funde() do shipModels mescla por material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

let MB = null;
function mats() { if (MB) return MB; const S = (c, r = 0.85, m = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const tc = document.createElement('canvas'); tc.width = tc.height = 128; const x = tc.getContext('2d'); x.fillStyle = '#7d8289'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) { const v = 105 + Math.random() * 50 | 0; x.fillStyle = `rgba(${v},${v + 2},${v + 6},0.18)`; x.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  x.strokeStyle = 'rgba(40,44,50,0.35)'; x.lineWidth = 1; for (let k = 0; k <= 128; k += 32) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, 128); x.stroke(); x.beginPath(); x.moveTo(0, k); x.lineTo(128, k); x.stroke(); } /* juntas das placas de concreto */
  const tx = new THREE.CanvasTexture(tc); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(24, 24); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const concreto = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.92, metalness: 0.02 });
  MB = { concreto, casco: S('#4f565e', 0.8, 0.25), faixa: S('#20252b', 0.7, 0.2), hangar: S('#8b929a', 0.55, 0.45), boca: S('#15191e', 0.9, 0), tanque: S('#e7e9ec', 0.45, 0.35), tanqueEsc: S('#9aa1a9', 0.5, 0.4),
    vidro: new THREE.MeshStandardMaterial({ color: '#2b4c63', roughness: 0.08, metalness: 0.85, envMapIntensity: 1.6 }), terminal: S('#d9dde2', 0.5, 0.2), teto: S('#a9b1ba', 0.35, 0.6), amarelo: S('#e8b923', 0.7, 0),
    branco: S('#f2f4f6', 0.6, 0), pista: S('#2d3136', 0.95, 0), aviao: S('#f4f6f8', 0.35, 0.3), cauda: S('#1f5fae', 0.4, 0.2), motor: S('#b8bfc7', 0.3, 0.7), pneu: S('#16191c', 0.9, 0),
    veic: S('#4f5b3a', 0.7, 0.2), veic2: S('#c79a2c', 0.6, 0.2), radome: S('#eef0f2', 0.4, 0.1), luzV: new THREE.MeshBasicMaterial({ color: '#ff3b30' }), luzB: new THREE.MeshBasicMaterial({ color: '#d7f3ff' }),
    gente: S('#3f4a3a', 0.85, 0), genteL: S('#c8a24a', 0.8, 0), defensa: S('#1b1e22', 0.9, 0) };
  return MB; }
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function add(g, geo, m, x, y, z, ry = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; g.add(o); return o; }

/** Avião de linha (genérico, sem marca real): fuselagem, asa enflechada, empenagem, 2 motores sob as asas, janelas e cabine. */
function aviaoLinha(M) { const g = new THREE.Group(); const L = 40, R = 2.0;
  add(g, new THREE.CapsuleGeometry(R, L - 2 * R, 6, 14).rotateX(Math.PI / 2), M.aviao, 0, R + 2.2, 0);
  add(g, new THREE.SphereGeometry(R * 0.98, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(-Math.PI / 2).scale(1, 0.55, 0.9), M.vidro, 0, R + 2.75, -L / 2 + 2.6); /* para-brisa */
  add(g, box(0.05, 0.42, L * 0.72), M.faixa, R * 0.99, R + 2.55, 1).scale.x = 1; add(g, box(0.05, 0.42, L * 0.72), M.faixa, -R * 0.99, R + 2.55, 1); /* fileira de janelas */
  add(g, box(0.04, 0.5, L * 0.86), M.cauda, R * 0.99, R + 1.7, 1.5); add(g, box(0.04, 0.5, L * 0.86), M.cauda, -R * 0.99, R + 1.7, 1.5); /* faixa da companhia */
  const asa = new THREE.Shape(); asa.moveTo(0, 0); asa.lineTo(17, 7.5); asa.lineTo(17, 9.2); asa.lineTo(0, 7.2); asa.closePath();
  for (const s of [-1, 1]) { const w = add(g, new THREE.ExtrudeGeometry(asa, { depth: 0.45, bevelEnabled: false }).rotateX(Math.PI / 2), M.aviao, s * 1.6, R + 1.2, -4); w.scale.x = s;
    add(g, new THREE.CylinderGeometry(1.15, 1.05, 4.2, 14).rotateX(Math.PI / 2), M.motor, s * 6.4, R - 0.1, -3.2); add(g, new THREE.CylinderGeometry(0.85, 0.85, 0.2, 14).rotateX(Math.PI / 2), M.faixa, s * 6.4, R - 0.1, -5.25);
    const ht = new THREE.Shape(); ht.moveTo(0, 0); ht.lineTo(6.2, 3); ht.lineTo(6.2, 4.3); ht.lineTo(0, 3.6); ht.closePath(); const h = add(g, new THREE.ExtrudeGeometry(ht, { depth: 0.25, bevelEnabled: false }).rotateX(Math.PI / 2), M.aviao, s * 0.8, R + 3.3, L / 2 - 6); h.scale.x = s; }
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(6.5, 0); fin.lineTo(8.2, 7.6); fin.lineTo(5.4, 7.6); fin.closePath(); add(g, new THREE.ExtrudeGeometry(fin, { depth: 0.35, bevelEnabled: false }).rotateY(-Math.PI / 2), M.cauda, 0.17, R + 3.6, L / 2 - 9.5);
  for (const [x, z] of [[0, -L / 2 + 5], [-3.2, 0.5], [3.2, 0.5]]) add(g, new THREE.CylinderGeometry(0.55, 0.55, 0.45, 10).rotateZ(Math.PI / 2), M.pneu, x, 0.55, z); /* trem de pouso */
  return g; }

/** Hangar em arco semiaberto (meia-casca) com boca escura e caixilho. */
function hangar(M, w, l) { const g = new THREE.Group(); const r = w / 2;
  add(g, new THREE.CylinderGeometry(r, r, l, 28, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), M.hangar, 0, 0, 0);
  add(g, new THREE.CircleGeometry(r * 0.96, 24, 0, Math.PI), M.boca, 0, 0, -l / 2 + 0.6).rotation.y = Math.PI;
  add(g, new THREE.CircleGeometry(r, 24, 0, Math.PI), M.hangar, 0, 0, l / 2);
  for (let k = -2; k <= 2; k++) add(g, new THREE.TorusGeometry(r + 0.06, 0.12, 4, 24, Math.PI), M.faixa, 0, 0, k * l / 5).rotation.y = Math.PI / 2 * 0; /* nervuras */
  return g; }

export function extrasMegabase(g, C, P, dY) { const M = mats(), L = C.L, B = C.B, yD = (P.deckV && P.deckV.y) || (C.F + (C.hHangar || 7)), yP = yD - 0.45;
  const xMin = -B / 2 - 54, xMax = B / 2 + 8, W = xMax - xMin, xc = (xMin + xMax) / 2, Lp = L * 1.02;
  /* PONTÃO principal: esconde o casco de navio; costado escuro com faixa de linha d'água e defensas */
  add(g, box(W, yP + C.T, Lp), M.casco, xc, (yP - C.T) / 2, 0);
  const topo = add(g, new THREE.PlaneGeometry(W, Lp).rotateX(-Math.PI / 2), M.concreto, xc, yP + 0.02, 0); topo.material = M.concreto;
  add(g, box(W + 0.4, 1.4, Lp + 0.4), M.faixa, xc, 0.4, 0);
  for (let z = -Lp / 2 + 20; z < Lp / 2; z += 40) for (const x of [xMin - 0.6, xMax + 0.6]) add(g, new THREE.CylinderGeometry(1.4, 1.4, 6, 10), M.defensa, x, 4, z);
  /* MÓDULO MILITAR (bombordo): pistas de taxiamento amarelas, hangares em arco, tanques de combustível, radomes, torre radar, veículos e tripulação */
  const xm = (xMin + (-B / 2)) / 2;
  for (const z of [-L * 0.42, L * 0.42]) add(g, box(0.5, 0.05, L * 0.04), M.amarelo, xm, yP + 0.06, z);
  add(g, box(0.45, 0.05, L * 0.8), M.amarelo, xm + 14, yP + 0.06, -L * 0.02);
  for (const z of [-L * 0.33, -L * 0.21, -L * 0.09]) { const h = hangar(M, 30, 46); h.position.set(xm - 6, yP, z); g.add(h); }
  for (let i = 0; i < 4; i++) { const z = L * 0.29 + i * 18; add(g, new THREE.CylinderGeometry(7, 7, 9, 22), M.tanque, xm - 4, yP + 4.5, z); add(g, new THREE.CylinderGeometry(7.15, 7.15, 0.6, 22), M.tanqueEsc, xm - 4, yP + 8.9, z); add(g, box(0.6, 9.4, 0.6), M.faixa, xm - 4 + 7, yP + 4.7, z); }
  add(g, box(30, 1.2, 76), M.tanqueEsc, xm - 4, yP + 0.6, L * 0.29 + 27); /* dique de contenção */
  for (const [z, r] of [[L * 0.05, 4.5], [L * 0.1, 3.4]]) { add(g, new THREE.CylinderGeometry(1.4, 1.8, 14, 10), M.hangar, xm - 12, yP + 7, z); add(g, new THREE.SphereGeometry(r, 18, 12), M.radome, xm - 12, yP + 14 + r * 0.7, z); }
  { const mt = add(g, box(2, 26, 2), M.faixa, xm + 8, yP + 13, L * 0.16); void mt; const ant = add(g, box(9, 2.6, 0.5), M.hangar, xm + 8, yP + 27.5, L * 0.16); ant.name = ''; add(g, new THREE.SphereGeometry(0.45, 8, 6), M.luzV, xm + 8, yP + 29, L * 0.16).userData.luz = 1; }
  const vg = []; for (let i = 0; i < 18; i++) { const z = -L * 0.4 + i * (L * 0.8 / 18), x = xm + 12 + (i % 3) * 3; const b = box(2.4, 1.6, 4.8); b.translate(x, yP + 0.8, z); vg.push(b); }
  add(g, mergeGeometries(vg), M.veic, 0, 0, 0);
  const vg2 = []; for (let i = 0; i < 10; i++) { const b = box(2.2, 1.9, 3.4); b.translate(xm + 2 + (i % 2) * 4, yP + 0.95, -L * 0.03 + i * 6); vg2.push(b); } add(g, mergeGeometries(vg2), M.veic2, 0, 0, 0); /* tratores e empilhadeiras de munição */
  const cx = []; for (let i = 0; i < 24; i++) { const b = box(2.4, 1.2, 1.2); b.translate(xm - 18 + (i % 4) * 2.7, yP + 0.6 + Math.floor(i / 12) * 1.2, L * 0.14 + (Math.floor(i / 4) % 3) * 1.5); cx.push(b); } add(g, mergeGeometries(cx), M.veic, 0, 0, 0); /* caixas de munição */
  { const pg = []; for (let i = 0; i < 44; i++) { const c = new THREE.CapsuleGeometry(0.26, 1.2, 3, 6); c.translate(xm + 8 + Math.sin(i * 7.3) * 16, yP + 0.85, -L * 0.38 + i * (L * 0.76 / 44)); pg.push(c); } add(g, mergeGeometries(pg), M.gente, 0, 0, 0);
    const pl = []; for (let i = 0; i < 16; i++) { const c = new THREE.CapsuleGeometry(0.26, 1.2, 3, 6); c.translate(-B / 2 + 4 + (i % 4) * 9, yP + 0.85, -L * 0.3 + i * 18); pl.push(c); } add(g, mergeGeometries(pl), M.genteL, 0, 0, 0); } /* tripulação de convés e mecânicos */
  /* PONTE de ligação + MÓDULO COMERCIAL (boreste), um nível abaixo */
  const yC = C.F * 0.9, Wc = 120, Lc = L * 0.62, xcC = xMax + 26 + Wc / 2, zcC = L * 0.08;
  add(g, box(28, 3, 26), M.casco, xMax + 13, yC - 1.5, zcC - Lc * 0.2); add(g, box(28, 0.3, 26), M.concreto, xMax + 13, yC + 0.15, zcC - Lc * 0.2);
  add(g, new THREE.BoxGeometry(2.5, yP - yC, 26).translate(0, (yP - yC) / 2, 0), M.casco, xMax + 1.2, yC, zcC - Lc * 0.2); /* rampa/elevador */
  add(g, box(Wc, yC + C.T, Lc), M.casco, xcC, (yC - C.T) / 2, zcC); add(g, new THREE.PlaneGeometry(Wc, Lc).rotateX(-Math.PI / 2), M.concreto, xcC, yC + 0.02, zcC); add(g, box(Wc + 0.4, 1.4, Lc + 0.4), M.faixa, xcC, 0.4, zcC);
  /* pista comercial com tracejado central e cabeceiras */
  const xr = xcC + Wc / 2 - 18; add(g, box(30, 0.06, Lc * 0.96), M.pista, xr, yC + 0.05, zcC); for (let z = -Lc * 0.44; z < Lc * 0.44; z += 24) add(g, box(0.9, 0.08, 12), M.branco, xr, yC + 0.1, zcC + z);
  for (const s of [-1, 1]) for (let k = -5; k <= 5; k++) add(g, box(1.2, 0.08, 9), M.branco, xr + k * 2.4, yC + 0.1, zcC + s * (Lc * 0.46 - 6));
  /* TERMINAL: corpo envidraçado com cobertura curva, pilares e marquise */
  const xt = xcC - Wc / 2 + 18, zt = zcC - Lc * 0.05, lt = Lc * 0.62;
  add(g, box(24, 14, lt), M.terminal, xt, yC + 7, zt); add(g, box(0.3, 9, lt * 0.96), M.vidro, xt + 12.2, yC + 6.5, zt); add(g, box(0.3, 9, lt * 0.96), M.vidro, xt - 12.2, yC + 6.5, zt);
  add(g, new THREE.CylinderGeometry(15, 15, lt + 4, 24, 1, false, -Math.PI / 2 + 0.6, Math.PI - 1.2).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), M.teto, xt, yC + 14 - 12.4, zt).scale.set(1, 0.42, 1);
  for (let z = -lt / 2; z <= lt / 2; z += 14) add(g, box(0.6, 9, 0.6), M.faixa, xt + 12.6, yC + 4.5, zt + z);
  /* PONTES DE EMBARQUE (fingers) até os aviões estacionados */
  const AV = aviaoLinha(M);
  for (let i = 0; i < 4; i++) { const z = zt - lt * 0.36 + i * (lt * 0.24), xa = xt + 12 + 34; const fb = add(g, box(22, 3.4, 3.6), M.terminal, xt + 12 + 11, yC + 5.4, z); void fb; add(g, new THREE.CylinderGeometry(2.6, 2.6, 4, 12), M.terminal, xt + 12 + 22, yC + 5.4, z); add(g, box(1.2, 5, 1.2), M.faixa, xt + 12 + 22, yC + 2.5, z);
    const a = AV.clone(); a.position.set(xa + 2, yC, z + 4); a.rotation.y = -Math.PI / 2 + 0.06 * (i - 1.5); g.add(a);
    add(g, box(0.45, 0.06, 26), M.amarelo, xa, yC + 0.08, z + 4).rotation.y = Math.PI / 2; }
  /* TORRE DE CONTROLE envidraçada com luz de obstáculo */
  { const xT = xcC + 6, zT = zcC + Lc * 0.38; add(g, new THREE.CylinderGeometry(3.2, 4.2, 40, 16), M.terminal, xT, yC + 20, zT); add(g, new THREE.CylinderGeometry(8.4, 6.6, 6, 16), M.vidro, xT, yC + 43, zT);
    add(g, new THREE.CylinderGeometry(9.2, 9.2, 0.8, 16), M.teto, xT, yC + 46.4, zT); add(g, new THREE.CylinderGeometry(6.8, 6.8, 1.2, 16), M.terminal, xT, yC + 39.6, zT); add(g, new THREE.CylinderGeometry(0.25, 0.25, 7, 6), M.faixa, xT, yC + 50.3, zT);
    const lz = add(g, new THREE.SphereGeometry(0.55, 8, 6), M.luzV, xT, yC + 54, zT); lz.userData.luz = 1; const lb = add(g, new THREE.SphereGeometry(0.4, 8, 6), M.luzB, xT, yC + 47.2, zT + 8); lb.userData.luz = 1; }
  /* veículos de pátio comercial (rebocadores de aeronave, ônibus) */
  const vc = []; for (let i = 0; i < 10; i++) { const b = box(i % 3 ? 2.6 : 3, i % 3 ? 1.6 : 3, i % 3 ? 4.4 : 11); b.translate(xt + 18 + (i % 2) * 6, yC + (i % 3 ? 0.8 : 1.5), zt - lt * 0.42 + i * (lt * 0.085)); vc.push(b); } add(g, mergeGeometries(vc), M.branco, 0, 0, 0);
  g.userData.megabase = { xm, yP, xt, yC, zt, lt, xcC, zcC, Lc }; /* pontos dos setores (fogo/fumaça localizados no render) */
}
