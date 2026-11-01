// v1.2.25 itens 12 e 14 — detalhes 3D dos 6 navios novos (escola "Nexo 25"). Peças 100% procedurais e originais.
// Tudo com os MATERIAIS JÁ EXISTENTES do navio (M.sup, M.escuro, M.painel, M.claro, M.aa, M.vidro, M.janela, M.conves) → a fusão
// estática (funde) junta as peças por material: o custo é só de triângulos; o único material novo é M.amarelo (faixas do convés de
// voo dos porta-aviões, 1 chamada, LOD 'det'). Peças de LOD ficam com userData.det = 1 (somem de longe, como no resto do jogo).
import * as THREE from 'three';
import { prisma } from './textures.js';
import { bordaPA, PLANO_PA, eixoAngPA } from '../sim/classes1225.js';
const mesh = (g, m) => { const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
const cil = (r1, r2, h, n = 12) => new THREE.CylinderGeometry(r1, r2, h, n);
const caixa = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const bloco = (w, c, h, enc = 0.84, ch = 0.18) => { const x = w / 2, z = c / 2, a = Math.min(x, z) * ch * 2; return prisma(THREE, [[-x + a, -z], [x - a, -z], [x, -z + a], [x, z - a], [x - a, z], [-x + a, z], [-x, z - a], [-x, -z + a]], h, enc, 0.92); };
const det = (o) => { o.traverse((c) => { c.userData.det = 1; }); return o; };
function matsExtra(M) { if (!M.amarelo) M.amarelo = new THREE.MeshStandardMaterial({ color: '#c99a1e', roughness: 0.78, metalness: 0.05, polygonOffset: true, polygonOffsetFactor: -1 }); return M; }
/** Painel plano de radar (face + moldura) com a normal (nx, ny, nz) — orientado por lookAt (+z do objeto aponta para a normal). */
function painel(g, M, x, y, z, nx, ny, nz, w, h, dt = 0) { const p = new THREE.Group(); const mo = mesh(caixa(w + 0.34, h + 0.34, 0.16), M.escuro); p.add(mo); const fa = mesh(caixa(w, h, 0.2), M.painel); fa.position.z = 0.04; p.add(fa);
  p.position.set(x, y, z); p.lookAt(x + nx, y + ny, z + nz); if (dt) det(p); g.add(p); return p; }
/** Mastro integrado fechado (pirâmide facetada) com 4 painéis grandes (busca aérea) + 4 pequenos (controle de tiro), anel de ESM, cúpula e radar de navegação no topo. */
function mastroIntegrado(g, M, x0, yB, zM, wM, cM, hT, enc, kP = 1, rg = null) {
  const mm = mesh(bloco(wM, cM, hT, enc, 0.18), M.sup); mm.position.set(x0, yB, zM); g.add(mm);
  const inX = wM / 2 * (1 - enc), inZ = cM / 2 * 0.08, tX = Math.atan2(inX, hT), tZ = Math.atan2(inZ, hT);
  const aX = Math.min(wM / 2, cM / 2) * 0.36; /* chanfro */ const face = (f, k) => { const wx = wM * (1 - (1 - enc) * f), cz = cM * (1 - 0.08 * f); return { hx: wx / 2, hz: cz / 2, lx: (wx - 2 * aX * (1 - (1 - enc) * f)) * k, lz: (cz - 2 * aX * (1 - 0.08 * f)) * k }; };
  const f1 = 0.36, F1 = face(f1, 0.78), ps = Math.min(F1.lx, F1.lz, hT * 0.34) * kP, y1 = yB + hT * f1;
  painel(g, M, x0, y1, zM - F1.hz - 0.06, 0, Math.sin(tZ), -Math.cos(tZ), ps, ps); painel(g, M, x0, y1, zM + F1.hz + 0.06, 0, Math.sin(tZ), Math.cos(tZ), ps, ps);
  painel(g, M, x0 + F1.hx + 0.06, y1, zM, Math.cos(tX), Math.sin(tX), 0, ps, ps); painel(g, M, x0 - F1.hx - 0.06, y1, zM, -Math.cos(tX), Math.sin(tX), 0, ps, ps);
  const f2 = 0.76, F2 = face(f2, 0.7), p2 = Math.min(F2.lx, F2.lz, ps * 0.42), y2 = yB + hT * f2;
  painel(g, M, x0, y2, zM - F2.hz - 0.06, 0, Math.sin(tZ), -Math.cos(tZ), p2, p2 * 0.8, 1); painel(g, M, x0, y2, zM + F2.hz + 0.06, 0, Math.sin(tZ), Math.cos(tZ), p2, p2 * 0.8, 1);
  painel(g, M, x0 + F2.hx + 0.06, y2, zM, Math.cos(tX), Math.sin(tX), 0, p2, p2 * 0.8, 1); painel(g, M, x0 - F2.hx - 0.06, y2, zM, -Math.cos(tX), Math.sin(tX), 0, p2, p2 * 0.8, 1);
  { const fa = 0.6, Fa = face(fa, 1); const an = mesh(bloco(Fa.hx * 2 + 0.36, Fa.hz * 2 + 0.36, 0.55, 0.99, 0.18), M.escuro); an.position.set(x0, yB + hT * fa, zM); g.add(an); } /* anel de ESM/IFF */
  const yT = yB + hT, Ft = face(1, 1); const pt = mesh(caixa(Ft.hx * 2 * 0.9, 0.35, Ft.hz * 2 * 0.9), M.escuro); pt.position.set(x0, yT + 0.17, zM); g.add(pt);
  const rE = Math.min(Ft.hx, Ft.hz) * 0.55; const es = mesh(cil(rE, rE * 1.06, 1.3, 14), M.claro); es.position.set(x0, yT + 1.0, zM); g.add(es); const dm = mesh(new THREE.SphereGeometry(rE * 0.8, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), M.claro); dm.position.set(x0, yT + 1.6, zM); g.add(dm);
  for (const sx of [-1, 1]) { const an = det(mesh(cil(0.05, 0.09, hT * 0.45, 5), M.escuro)); an.position.set(x0 + sx * Ft.hx * 0.8, yT + hT * 0.22, zM + Ft.hz * 0.6); g.add(an); const yd = det(mesh(caixa(Ft.hx * 2 + 2.4, 0.16, 0.16), M.escuro)); yd.position.set(x0, yT + 0.5, zM - Ft.hz * 0.6); g.add(yd); }
  if (rg) { rg.position.set(x0, yT + 2.75, zM); const bs = mesh(cil(0.35, 0.45, 0.9, 10), M.escuro); bs.position.set(x0, yT + 2.2, zM); g.add(bs); }
  return { yT: yT + 3.2, ps };
}
/** Lançador de despistadores (6 tubos inclinados). */
function despist(g, M, x, y, z, sx) { const q = new THREE.Group(); q.add(mesh(caixa(0.9, 0.5, 1.2), M.sup)); for (let i = 0; i < 6; i++) { const t = mesh(cil(0.09, 0.09, 0.9, 6), M.escuro); t.position.set(((i % 3) - 1) * 0.26, 0.55, (Math.floor(i / 3) - 0.5) * 0.4); t.rotation.z = -sx * 0.6; q.add(t); } q.position.set(x, y, z); g.add(det(q)); }

/** Navios de linha (corveta/fragata/destróier/cruzador). X = dados da superestrutura genérica de montaModelo. */
function linha1225(g, C, P, M, dY, meia, X) { const L = C.L, { s, cS, wS, y0, h, rg } = X, tipo = C.est25;
  const K = { corveta: [0.56, 0.36, 0.092, 0.6], fragata: [0.56, 0.34, 0.088, 0.6], destroier: [0.58, 0.33, 0.084, 0.58], cruzador: [0.56, 0.3, 0.082, 0.58] }[tipo];
  const zM = s.z0 + cS * 0.46, yB = y0 + h * 2 - 0.12, wM = wS * K[0], cM = cS * K[1], hT = L * K[2];
  const r = mastroIntegrado(g, M, 0, yB, zM, wM, cM, hT, K[3], 1, rg); P.mastro1225 = r.yT;
  // casaria furtiva: saia inclinada fechando a base da superestrutura nos bordos (costado contínuo, sem cantos vivos) + portas embutidas
  for (const sx of [-1, 1]) { const sa = mesh(caixa(0.18, h * 0.9, cS * 0.82), M.sup); sa.position.set(sx * wS * 0.47, y0 + h * 0.45, (s.z0 + s.z1) / 2); sa.rotation.z = sx * 0.12; g.add(sa); }
  // despistadores nos 4 cantos do teto do 1º nível
  for (const sx of [-1, 1]) for (const zz of [s.z0 + cS * 0.08, s.z1 - cS * 0.22]) despist(g, M, sx * wS * 0.36, y0 + h + 0.25, zz, sx);
  // corveta/fragata: radar de navegação girando no teto do hangar fica onde a escola 'bra' já põe (radar2). Destróier/cruzador: casaria de ré com 2 painéis de popa e radar de vigilância de superfície girando.
  if (tipo === 'destroier' || tipo === 'cruzador') { const zA = s.z1 - cS * 0.27, hA = h * 0.9 + hT * (tipo === 'cruzador' ? 0.42 : 0.3), wA = wS * 0.46, cA = cS * 0.2;
    const ta = mesh(bloco(wA, cA, hA, 0.62, 0.22), M.sup); ta.position.set(0, y0 + h, zA); g.add(ta);
    const inX = wA / 2 * 0.38, tX = Math.atan2(inX, hA), ps = Math.min(cA * 0.42, hA * 0.36) * (tipo === 'cruzador' ? 1 : 0.85), ya = y0 + h + hA * 0.45, xa = wA / 2 * (1 - 0.38 * 0.45) + 0.06;
    for (const sx of [-1, 1]) { const p = painel(g, M, sx * xa, ya, zA + cA * 0.1, sx * Math.cos(tX) * 0.7, Math.sin(tX), 0.7, ps, ps); p.rotateY(0); }
    const r2 = g.getObjectByName('radar2'); if (r2) { r2.position.set(0, y0 + h + hA + 0.65, zA); const bs = mesh(cil(0.4, 0.55, 0.6, 10), M.escuro); bs.position.set(0, y0 + h + hA + 0.3, zA); g.add(bs); r2.scale.setScalar(1.25); }
    const tp = mesh(caixa(wA * 0.38, 0.3, cA * 0.5), M.escuro); tp.position.set(0, y0 + h + hA + 0.15, zA); g.add(tp); }
  // proa furtiva: borda (bulwark) fechada em V na proa, com escovém embutido
  { const zb = -L * 0.44, wb = meia(-L * 0.4) * 0.95; for (const sx of [-1, 1]) { const bw = mesh(caixa(0.16, 1.05, L * 0.1), M.sup); bw.position.set(sx * wb * 0.55, dY(zb) + 0.5, zb); bw.rotation.y = -sx * Math.atan2(wb * 0.9, L * 0.1); g.add(bw); } }
  // tubos de exaustão no topo da chaminé furtiva (pares escuros) — só detalhe
  { const zc = s.z1 - cS * 0.12; for (const sx of [-1, 1]) { const ex = det(mesh(cil(0.45, 0.5, 0.6, 10), M.escuro)); ex.position.set(sx * wS * 0.06, y0 + h * 2.2 + 0.3, zc); g.add(ex); } }
}
// ---------------------------------------------------------------------------------------------------------------------------------
// SUPER PORTA-AVIÕES (CATOBAR)
// ---------------------------------------------------------------------------------------------------------------------------------
/** Placa plana horizontal (polígono em x,z) com espessura e: ocupa y ∈ [−e, 0]. */
function chapa(pts, e) { const sh = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z))); return new THREE.ExtrudeGeometry(sh, { depth: e, bevelEnabled: false, curveSegments: 1 }).rotateX(Math.PI / 2); }
const espelha = (meio) => meio.concat(meio.slice().reverse().map(([x, z]) => [-x, z])); /* meia planta (x ≥ 0, da proa à popa) → planta inteira */
/** Deriva vertical: perfil (altura, z) → placa vertical no plano y-z. */
const deriva = (pts, e = 0.16) => chapa(pts, e).rotateZ(Math.PI / 2).translate(e / 2, 0, 0);
/** ---------- AERONAVES ESTACIONADAS (estáticas, só visual, LOD 'det', materiais do navio) ---------- */
function aeronaves(M) { const A = {};
  { const q = new THREE.Group(), B = M.aa; const f = mesh(cil(0.95, 0.62, 11, 8).rotateX(Math.PI / 2), B); f.position.set(0, 1.9, 0.6); q.add(f); const nz = mesh(new THREE.ConeGeometry(0.62, 4.4, 8).rotateX(-Math.PI / 2), B); nz.position.set(0, 1.9, -7.1); q.add(nz);
    const cp = mesh(new THREE.SphereGeometry(0.55, 10, 6).scale(1, 0.75, 2.6), M.vidro); cp.position.set(0, 2.55, -4.2); q.add(cp);
    for (const sx of [-1, 1]) { const it = mesh(caixa(0.75, 0.95, 3.4), B); it.position.set(sx * 1.05, 1.65, -1.2); q.add(it); const bc = mesh(cil(0.5, 0.45, 1.2, 8).rotateX(Math.PI / 2), M.escuro); bc.position.set(sx * 0.55, 1.9, 6.6); q.add(bc);
      const dv = mesh(deriva([[0, 3.8], [0, 7.3], [3.1, 8.0], [3.1, 6.7]]), B); dv.rotation.z = -sx * 0.36; dv.position.set(sx * 0.95, 2.3, 0); q.add(dv); }
    const w = mesh(chapa(espelha([[0, -5.8], [0.55, -5.4], [1.0, -1.6], [6.3, 2.0], [6.3, 3.5], [1.0, 3.9]]).map(([x, z]) => [x, z]), 0.22), B); w.position.y = 1.95; q.add(w);
    const st = mesh(chapa(espelha([[0, 4.9], [0.7, 4.8], [3.3, 6.6], [3.3, 7.7], [0.7, 7.5]]), 0.18), B); st.position.y = 1.8; q.add(st);
    for (const [x, z] of [[0, -5], [-1.6, 1.2], [1.6, 1.2]]) { const r = mesh(cil(0.35, 0.35, 0.3, 8).rotateZ(Math.PI / 2), M.escuro); r.position.set(x, 0.35, z); q.add(r); const pe = mesh(cil(0.09, 0.09, 1.4, 5), M.escuro); pe.position.set(x, 1.0, z); q.add(pe); }
    A.caca = q; }
  { const q = new THREE.Group(), B = M.sup; const w = mesh(chapa(espelha([[0, -8.2], [0.95, -5.6], [1.35, -2.2], [5.5, 2.5], [5.5, 3.9], [1.7, 4.5], [1.3, 7.3]]), 0.3), B); w.position.y = 2.05; q.add(w);
    const sp = mesh(bloco(2.3, 12.5, 1.0, 0.55, 0.3), B); sp.position.set(0, 2.0, 0.3); q.add(sp); const cp = mesh(new THREE.SphereGeometry(0.55, 8, 6).scale(1, 0.7, 2.8), M.vidro); cp.position.set(0, 2.85, -3.9); q.add(cp);
    const ht = mesh(chapa(espelha([[0.9, 5.2], [3.7, 6.3], [3.7, 7.8], [1.0, 7.7]]), 0.18), B); ht.position.y = 1.95; q.add(ht);
    for (const sx of [-1, 1]) { const dv = mesh(deriva([[0, 3.6], [0, 6.6], [2.7, 7.4], [2.7, 5.7]]), B); dv.rotation.z = -sx * 0.5; dv.position.set(sx * 1.15, 2.4, 0); q.add(dv);
      const r = mesh(cil(0.36, 0.36, 0.3, 8).rotateZ(Math.PI / 2), M.escuro); r.position.set(sx * 1.6, 0.36, 1.2); q.add(r); const pe = mesh(cil(0.09, 0.09, 1.5, 5), M.escuro); pe.position.set(sx * 1.6, 1.05, 1.2); q.add(pe); }
    const bc = mesh(cil(0.62, 0.6, 1.0, 8).rotateX(Math.PI / 2), M.escuro); bc.position.set(0, 2.0, 7.2); q.add(bc); const r0 = mesh(cil(0.3, 0.3, 0.3, 8).rotateZ(Math.PI / 2), M.escuro); r0.position.set(0, 0.3, -5); q.add(r0); const p0 = mesh(cil(0.09, 0.09, 1.5, 5), M.escuro); p0.position.set(0, 1.0, -5); q.add(p0);
    A.raio = q; }
  { const q = new THREE.Group(), B = M.aa; const f = mesh(cil(1.05, 1.1, 13, 10).rotateX(Math.PI / 2), B); f.position.set(0, 2.4, 0); q.add(f); const nz = mesh(new THREE.SphereGeometry(1.05, 10, 8).scale(1, 0.95, 1.7), B); nz.position.set(0, 2.4, -6.5); q.add(nz);
    const tc = mesh(cil(1.05, 0.35, 3.5, 10).rotateX(Math.PI / 2), B); tc.position.set(0, 2.6, 8.2); q.add(tc); const cp = mesh(caixa(1.5, 0.6, 1.6), M.vidro); cp.position.set(0, 3.2, -6.4); cp.rotation.x = 0.35; q.add(cp);
    const w = mesh(chapa(espelha([[0, -1.7], [1.2, -1.7], [12.3, -0.7], [12.3, 0.6], [1.2, 1.3], [0, 1.3]]), 0.32), B); w.position.y = 3.75; q.add(w);
    for (const sx of [-1, 1]) { const nc = mesh(cil(0.8, 0.65, 6.2, 10).rotateX(Math.PI / 2), B); nc.position.set(sx * 4.3, 3.2, -0.6); q.add(nc); for (const a of [0.4, 0.4 + Math.PI / 2]) { const pb = mesh(caixa(0.28, 4.1, 0.09), M.escuro); pb.position.set(sx * 4.3, 3.2, -3.85); pb.rotation.z = a; q.add(pb); }
      const r = mesh(cil(0.45, 0.45, 0.4, 8).rotateZ(Math.PI / 2), M.escuro); r.position.set(sx * 4.3, 0.45, 0.3); q.add(r); const pe = mesh(cil(0.12, 0.12, 2.3, 5), M.escuro); pe.position.set(sx * 4.3, 1.6, 0.3); q.add(pe); }
    const rd = mesh(cil(3.65, 3.65, 0.75, 24), M.claro); rd.position.set(0, 5.75, 1.2); q.add(rd); const rb = mesh(cil(3.68, 3.68, 0.22, 24), M.escuro); rb.position.set(0, 5.75, 1.2); q.add(rb);
    for (const z of [0.2, 2.2]) { const py = mesh(caixa(0.4, 1.6, 0.9), B); py.position.set(0, 4.6, z); q.add(py); }
    const hs = mesh(chapa(espelha([[0, 7.6], [4.3, 7.6], [4.3, 9.0], [0, 9.0]]), 0.2), B); hs.position.y = 3.4; q.add(hs);
    for (const x of [-4.2, -1.4, 1.4, 4.2]) { const dv = mesh(deriva([[-1.2, 7.4], [-1.2, 9.0], [1.6, 9.2], [1.6, 8.0]]), B); dv.position.set(x, 3.3, 0); q.add(dv); }
    const r0 = mesh(cil(0.35, 0.35, 0.3, 8).rotateZ(Math.PI / 2), M.escuro); r0.position.set(0, 0.35, -5.5); q.add(r0); const p0 = mesh(cil(0.1, 0.1, 1.6, 5), M.escuro); p0.position.set(0, 1.1, -5.5); q.add(p0);
    A.vigia = q; }
  { const q = new THREE.Group(), B = M.aa; const cb = mesh(bloco(2.5, 6.8, 2.5, 0.8, 0.3), B); cb.position.set(0, 0.75, 0); q.add(cb); const nz = mesh(new THREE.SphereGeometry(1.2, 10, 8).scale(1, 0.95, 1.4), B); nz.position.set(0, 1.85, -3.4); q.add(nz);
    const gl = mesh(caixa(2.0, 0.9, 1.0), M.vidro); gl.position.set(0, 2.5, -3.6); gl.rotation.x = -0.5; q.add(gl); const tb = mesh(cil(0.6, 0.32, 7.5, 8).rotateX(Math.PI / 2), B); tb.position.set(0, 2.6, 6.8); q.add(tb);
    const dv = mesh(deriva([[0, 9.6], [0, 11.2], [2.4, 11.4], [2.4, 10.4]]), B); dv.position.set(0, 2.6, 0); q.add(dv); const tr = mesh(cil(1.1, 1.1, 0.06, 12).rotateZ(Math.PI / 2), M.escuro); tr.position.set(0.25, 3.9, 10.7); q.add(tr);
    const hb = mesh(cil(0.32, 0.4, 0.9, 8), M.escuro); hb.position.set(0, 3.75, 0); q.add(hb); for (const a of [0.3, 0.3 + Math.PI / 2]) { const bl = mesh(caixa(0.5, 0.08, 15.6), M.escuro); bl.position.set(0, 4.2, 0); bl.rotation.y = a; q.add(bl); }
    for (const sx of [-1, 1]) { const sp = mesh(caixa(0.7, 0.7, 2.2), B); sp.position.set(sx * 1.55, 0.55, 0.6); q.add(sp); }
    A.heli = q; }
  { const q = new THREE.Group(); const b = mesh(caixa(2.2, 1.1, 3.8), M.amarelo); b.position.y = 0.75; q.add(b); const c = mesh(caixa(1.4, 0.8, 1.2), M.escuro); c.position.set(0, 1.6, 0.9); q.add(c); A.trator = q; }
  for (const k in A) det(A[k]); return A; }
/** Arranjo do convés por navio: [tipo, z/L, x (m; null = encostado na borda de boreste − dx), rumo (rad, + = nariz p/ bombordo), escala]. */
const PARQUE = {
  abrolhos: [['caca', -0.205, -3, 0], ['vigia', -0.15, 8.5, 0], ['caca', -0.39, -7.5, 1.05], ['raio', -0.355, -7.0, 1.05], ['caca', -0.32, -6.8, 1.05], ['raio', -0.285, -6.8, 1.05], ['heli', -0.085, -6.2, 1.3], ['caca', -0.04, -7.0, 1.2, 0.86],
    ['caca', 0.19, -5.5, 1.57], ['raio', 0.245, -6.5, 0.95], ['raio', 0.28, -6.5, 0.95], ['caca', 0.315, -6.5, 0.95], ['caca', 0.35, -6.5, 0.95], ['vigia', 0.405, -6.0, 1.57], ['heli', 0.455, -5.0, 1.0],
    ['trator', 0.17, -12.5, 0.2], ['trator', -0.06, -14, 1.4], ['trator', -0.25, -12, 0.4]],
  costaverde: [['caca', -0.205, -3, 0], ['raio', -0.15, 8.5, 0], ['caca', -0.39, -7.5, 1.05], ['raio', -0.355, -7.0, 1.05], ['caca', -0.32, -6.8, 1.05], ['raio', -0.285, -6.8, 1.05],
    ['raio', 0.03, -5.5, 1.57], ['heli', 0.075, -6.0, 1.3], ['vigia', 0.215, -6.0, 1.57], ['caca', 0.265, -6.5, 0.95], ['caca', 0.3, -6.5, 0.95], ['heli', 0.34, -6.2, 1.1], ['heli', 0.385, -6.2, 1.1], ['caca', 0.43, -5.5, 1.2, 0.86], ['heli', 0.47, -6.5, 0.8],
    ['trator', 0.11, -12, 0.3], ['trator', -0.21, -13, 1.2], ['trator', 0.25, -15, 0.2]],
};
/** Super porta-aviões CATOBAR: convés em ângulo, catapultas, cabos, elevadores laterais, ilha(s) com painéis planos, patrocínios das armas e ala aérea no convés. */
function portaAvioes1225(g, C, P, M, dY, meia, X) { const L = C.L, B = C.B, PL = PLANO_PA[C.id], A = P.pa1225, yD = A.yD, F = C.F, eD = 1.6, zA = -L / 2 + 27, zB = L / 2 - 13;
  // 1) remove a casaria genérica e tudo que ficaria sob/atravessando o convés de voo (fica só o casco, nomes, canhões, armas e radares, que são reposicionados)
  g.updateMatrixWorld(true); const DIN = /^(sec_\d+|lg\d|torre\d|ciws\d|a30_\d|laser\d|radar|radar2|radar3|flamula|tampas|linhas|nomeOuro|nomeOuroPopa|gala)$/, bx = new THREE.Box3(), sz = new THREE.Vector3(), luzes = [];
  for (const o of g.children.slice()) { if (DIN.test(o.name)) continue; if (o.userData.luz) { luzes.push(o); continue; } bx.setFromObject(o); if (bx.isEmpty()) continue; bx.getSize(sz); if (sz.z > L * 0.45) continue; if (bx.max.y > F + 0.35) g.remove(o); }
  { const li = g.getObjectByName('linhas'); if (li) { const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s0 = new THREE.Vector3(); for (let i = 0; i < li.count; i++) { li.getMatrixAt(i, m); m.decompose(p, q, s0); if (p.y > F + 1.6 || (p.z > zA - 1 && p.z < zB + 1)) { s0.set(0, 0, 0); m.compose(p, q, s0); li.setMatrixAt(i, m); } } li.instanceMatrix.needsUpdate = true; } }
  // 2) convés de voo: placa única pela planta (em ângulo a bombordo, patrocínio da ilha a boreste)
  const pl = []; for (const [z, x] of PL.be) pl.push([x * B / 2, z * L / 2]); for (const [z, x] of PL.bb.slice().reverse()) pl.push([x * B / 2, z * L / 2]);
  const dk = mesh(chapa(pl, eD), M.conves); dk.position.y = yD; g.add(dk);
  const borda = (z, l) => bordaPA(C, z, l);
  // 3) costado do hangar / alargamento (flare) da borda do convés até o costado, dos dois bordos, com aberturas dos elevadores
  { const pos = [], idx = []; const N = Math.ceil((zB - zA) / 3); for (const [l, sx] of [['bb', -1], ['be', 1]]) { const b0 = pos.length / 3; for (let i = 0; i <= N; i++) { const z = zA + (zB - zA) * i / N; pos.push(borda(z, l), yD - eD, z, sx * meia(z) * 0.995, F - 0.05, z); }
      for (let i = 0; i < N; i++) { const a = b0 + i * 2; if (sx > 0) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gf.setIndex(idx); gf.computeVertexNormals(); g.add(mesh(gf, M.sup));
    for (const [z, k] of [[zA, 1], [zB, -1]]) { const w = meia(z) * 2 * 0.99, hh = yD - eD - F; const pa = mesh(caixa(w, hh, 0.5), M.sup); pa.position.set(0, F + hh / 2, z); g.add(pa); const pt = mesh(caixa(w * 0.62, hh * 0.8, 0.3), M.escuro); pt.position.set(0, F + hh * 0.4, z - k * 0.3); g.add(pt); } }
  // 4) passarelas (catwalks) em grade sob a borda + linhas brancas de borda
  for (const lado of [PL.be, PL.bb]) for (let i = 1; i < lado.length; i++) { const [z0, x0] = lado[i - 1], [z1, x1] = lado[i]; const a = new THREE.Vector3(x0 * B / 2, 0, z0 * L / 2), b = new THREE.Vector3(x1 * B / 2, 0, z1 * L / 2), d = b.clone().sub(a), len = d.length(), m = a.clone().add(b).multiplyScalar(0.5), ry = Math.atan2(d.x, d.z);
    const out = new THREE.Vector3(d.z, 0, -d.x).normalize().multiplyScalar(Math.sign(x0 + x1) * Math.sign(d.z || 1) >= 0 ? 1 : -1); if (out.x * (x0 + x1) < 0) out.negate();
    const cw = det(mesh(caixa(1.5, 0.14, len), M.grade)); cw.position.set(m.x + out.x * 0.75, yD - 1.25, m.z + out.z * 0.75); cw.rotation.y = ry; g.add(cw);
    const wl = det(mesh(caixa(0.32, 0.04, len), M.claro)); wl.position.set(m.x - out.x * 0.8, yD + 0.02, m.z - out.z * 0.8); wl.rotation.y = ry; g.add(wl); }
  // 5) marcas do convés em ângulo: eixo tracejado, bordas (boreste = linha de segurança amarela), cabeceira, cabos de parada, lente óptica
  const ang = PL.ang, ra = Math.atan(ang), xc = (z) => eixoAngPA(C, z), zAng0 = -L * 0.14, zAng1 = L / 2 - 2;
  const faixa = (m, w, x, z, comp, rot) => { const q = det(mesh(caixa(w, 0.04, comp), m)); q.position.set(x, yD + 0.025, z); q.rotation.y = rot; g.add(q); return q; };
  for (let z = zAng1 - 6; z > zAng0; z -= 13) faixa(M.claro, 0.6, xc(z), z, 6.5, ra);
  { const len = (zAng1 - zAng0) / Math.cos(ra), zm = (zAng0 + zAng1) / 2; for (const [o, m] of [[-13.2, M.claro], [13.2, M.amarelo]]) faixa(m, 0.4, xc(zm) + o * Math.cos(ra), zm + o * Math.sin(ra) * 0, len, ra); }
  for (let k = 0; k < 5; k++) { const z = zAng1 - 1.5 - k * 0.1; faixa(M.claro, 1.0, xc(z) + (k - 2) * 5.0, z, 4.5, ra); } /* cabeceira */
  for (const f of [0.3, 0.33, 0.36, 0.39]) { const z = f * L, x = xc(z); const cb = det(mesh(cil(0.09, 0.09, 29, 6).rotateZ(Math.PI / 2), M.escuro)); cb.position.set(x, yD + 0.22, z); cb.rotation.y = ra; g.add(cb);
    for (const sx of [-1, 1]) { const s = det(mesh(caixa(0.7, 0.4, 0.6), M.escuro)); s.position.set(x + sx * 14.6 * Math.cos(ra), yD + 0.2, z - sx * 14.6 * Math.sin(ra)); g.add(s); } }
  { const z = L * 0.27, x = borda(z, 'bb') + 1.6; const lb = det(mesh(caixa(1.4, 3.2, 1.2), M.escuro)); lb.position.set(x, yD + 0.4, z); g.add(lb); const ll = det(mesh(caixa(1.2, 1.6, 0.1), M.janela)); ll.position.set(x, yD + 0.7, z - 0.65); g.add(ll);
    const br = det(mesh(caixa(2.2, 0.16, 0.14), M.janela)); br.position.set(x, yD + 0.7, z - 0.66); g.add(br); }
  // 6) catapultas: 2 de proa (eixo) e 2 de meia-nau (no convés em ângulo), trilho escuro + guias amarelas + lançadeira + defletor de jato (levantado na catapulta ocupada)
  const cats = [[PL.cat[0][0], -L * 0.2, 0, 92, 1], [PL.cat[1][0], -L * 0.2, 0, 92, 0]]; { const z1 = L * 0.06; for (const o of [-6.5, 4.5]) cats.push([xc(z1) + o, z1, ra, 90, 0]); }
  for (const [x0, z0, r, comp, ocup] of cats) { const dx = -Math.sin(r), dz = -Math.cos(r); const xm = x0 + dx * comp / 2, zm = z0 + dz * comp / 2;
    faixa(M.escuro, 0.5, xm, zm, comp, r); for (const o of [-1.6, 1.6]) faixa(M.amarelo, 0.22, xm + o * Math.cos(r), zm - o * Math.sin(r), comp, r);
    const sh = det(mesh(caixa(0.7, 0.35, 1.4), M.escuro)); sh.position.set(x0 + dx * 2, yD + 0.15, z0 + dz * 2); sh.rotation.y = r; g.add(sh);
    const jb = new THREE.Group(); jb.position.set(x0 - dx * 9, yD, z0 - dz * 9); jb.rotation.y = r; const pn = mesh(caixa(11, 4.0, 0.35).translate(0, 2.0, 0), M.sup); pn.rotation.x = ocup ? -0.95 : -Math.PI / 2 + 0.02; jb.add(pn);
    if (ocup) for (const sx of [-3.6, 0, 3.6]) { const br = mesh(caixa(0.3, 0.3, 2.4), M.escuro); br.position.set(sx, 1.0, 1.0); br.rotation.x = 0.7; jb.add(br); } g.add(jb); }
  // 7) elevadores laterais (plataforma no nível do convés para fora da borda, frisos, e abertura escura do hangar no costado)
  for (const [l, f, c] of PL.elev) { const z = f * L, len = c * L, sx = l === 'be' ? 1 : -1, xe = borda(z, l), w = 19; const xi = xe - sx * 12, xo = xe + sx * 7, wc = Math.abs(xo - xi), xm = (xi + xo) / 2;
    const pf = mesh(caixa(wc, eD, len), M.conves); pf.position.set(xm, yD - eD / 2 - 0.01, z); g.add(pf); for (const [ww, dd, x, zz] of [[wc, 0.3, xm, z - len / 2], [wc, 0.3, xm, z + len / 2], [0.3, len, xi, z]]) { const q = det(mesh(caixa(ww, 0.05, dd), M.amarelo)); q.position.set(x, yD + 0.03, zz); g.add(q); }
    const xh = meia(z) * sx, hh = yD - eD - F; const ab = mesh(caixa(0.4, hh * 0.85, len * 0.95), M.escuro); ab.position.set(xh + sx * 0.45, F + hh * 0.45, z); ab.rotation.z = -sx * Math.atan2(Math.abs(xe - xh), hh) * 0.5; g.add(ab);
    for (const zz of [z - len / 2 - 0.6, z + len / 2 + 0.6]) { const tr = mesh(caixa(1.2, hh + eD, 1.0), M.sup); tr.position.set(xe + sx * 0.4, F + (hh + eD) / 2, zz); g.add(tr); } void w; }
  // 8) pontos de helicóptero (material de heliponto já existente)
  for (const [f, dx] of (C.id === 'abrolhos' ? [[0.455, 11], [-0.085, 11]] : [[0.075, 11], [0.47, 11]])) { const z = f * L, pd = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), M.heli); pd.rotation.x = -Math.PI / 2; pd.position.set(borda(z, 'be') - dx, yD + 0.03, z); pd.userData.det = 1; g.add(pd); }
  // 9) patrocínios (sponsons) das armas automáticas: plataforma + braço até o costado + mão-francesa
  const spon = (x, y, z, r = 2.4) => { const sx = Math.sign(x), xh = meia(z) * 0.95; const pt = mesh(caixa(r * 2, 0.7, r * 2), M.sup); pt.position.set(x, y - 0.35, z); g.add(pt); const w = Math.abs(x) - xh; const ar = mesh(caixa(w, 0.8, r * 1.6), M.sup); ar.position.set(sx * (xh + w / 2), y - 0.4, z); g.add(ar);
    const mf = mesh(caixa(0.5, Math.hypot(w, 4.5), 0.5), M.sup); mf.position.set(sx * (xh + w / 2), y - 2.6, z); mf.rotation.z = sx * Math.atan2(w, 4.5); g.add(mf); };
  for (const c of P.ciws) spon(c.x, c.y - 0.3, c.z); for (const a of P.a30) spon(a.x, a.y - 1.1, a.z, 2.0); for (const l of P.laser) if (l.y < yD) spon(l.x, l.y - 1.2, l.z, 2.0);
  // 10) ilha(s)
  const il = A.il; let topo = null; const rg = X.rg, r2 = g.getObjectByName('radar2'), r3 = g.getObjectByName('radar3');
  il.forEach((I, k) => { const zc = (I.z0 + I.z1) / 2, cx = I.xc, w = I.w, c = I.c, nav = I.tipo !== 'ar'; let y = yD; const lv = nav ? [[1, 1, 3.6], [0.96, 0.9, 3.3]] : [[1, 1, 3.4]];
    for (const [kw, kc, hh] of lv) { const b = mesh(bloco(w * kw, c * kc, hh, 0.985, 0.14), M.sup); b.position.set(cx, y, zc + c * (1 - kc) * 0.35); g.add(b); const jn = det(mesh(caixa(w * kw * 1.002, 0.55, c * kc * 0.7), M.janela)); jn.position.set(cx, y + hh * 0.62, zc + c * (1 - kc) * 0.35); g.add(jn); y += hh; }
    // casaria dos radares (octógono de quinas largas): painel plano grande na face de vante e nas 2 quinas de ré → 360°
    { const W = w * 0.9, Cc = c * (nav ? 0.62 : 0.5), hh = nav ? 4.9 : 3.8, z3 = zc + c * 0.06, a = Math.min(W / 2, Cc / 2) * 0.86, ps = nav ? 4.3 : 3.1, yp = y + hh * 0.5;
      const b = mesh(bloco(W, Cc, hh, 0.97, 0.43), M.sup); b.position.set(cx, y, z3); g.add(b);
      painel(g, M, cx, yp, z3 - Cc / 2 - 0.12, 0, 0.12, -1, Math.min(ps, W - 2 * a + 1.2), ps * 0.92);
      for (const sx of [-1, 1]) painel(g, M, cx + sx * (W / 2 - a / 2 + 0.1), yp, z3 + Cc / 2 - a / 2 + 0.1, sx * 0.7, 0.12, 0.7, ps, ps * 0.92);
      y += hh; }
    const zf = zc - c * 0.5 + c * (nav ? 0.27 : 0.32), cpz = c * (nav ? 0.42 : 0.5); const pp = mesh(bloco(w * 1.04, cpz, 2.9, 1.0, 0.14), M.sup); pp.position.set(cx, y, zf); g.add(pp);
    const vg = mesh(caixa(w * 1.05, 0.95, cpz * 1.01), M.vidro); vg.position.set(cx, y + 1.75, zf); g.add(vg); const vf = mesh(caixa(w * 0.9, 1.1, 0.3), M.vidro); vf.position.set(cx, y + 1.7, zf - cpz / 2 - 0.2); vf.rotation.x = 0.28; g.add(vf);
    const ct = mesh(caixa(w * 1.1, 0.3, cpz * 1.08), M.sup); ct.position.set(cx, y + 2.95, zf); g.add(ct);
    if (nav) { /* controle de voo (vidraça saliente para bombordo, olhando o convés) */ const pf = mesh(caixa(2.6, 1.8, c * 0.36), M.vidro); pf.position.set(I.xi - 0.9, y - 1.3, zc + c * 0.16); g.add(pf); const pr = mesh(caixa(3.0, 0.3, c * 0.4), M.sup); pr.position.set(I.xi - 0.9, y - 0.25, zc + c * 0.16); g.add(pr); }
    // mastro integrado + topo
    const mH = nav ? 9.5 : 6.5, zm = zc + c * 0.12, mm = mesh(bloco(w * 0.5, c * 0.22, mH, 0.6, 0.22), M.sup); mm.position.set(cx, y, zm); g.add(mm);
    const p2 = nav ? 1.8 : 1.5, wm = w * 0.5 * (1 - 0.4 * 0.55) / 2 + 0.06, cm = c * 0.22 * 0.96 / 2 + 0.06, ym = y + mH * 0.55; painel(g, M, cx, ym, zm - cm, 0, 0.1, -1, p2, p2, 1); for (const sx of [-1, 1]) painel(g, M, cx + sx * wm, ym, zm + cm * 0.4, sx * 0.8, 0.1, 0.55, p2, p2, 1);
    const yt = y + mH; const pt = mesh(caixa(w * 0.38, 0.4, c * 0.2), M.escuro); pt.position.set(cx, yt + 0.2, zm); g.add(pt); const es = mesh(cil(1.1, 1.15, 1.3, 14), M.claro); es.position.set(cx, yt + 1.05, zm); g.add(es);
    const yd = det(mesh(caixa(w * 1.1, 0.2, 0.2), M.escuro)); yd.position.set(cx, yt - 1.5, zm - c * 0.06); g.add(yd); for (const sx of [-1, 1]) { const an = det(mesh(cil(0.05, 0.1, 6, 5), M.escuro)); an.position.set(cx + sx * w * 0.5, yt + 1.4, zm - c * 0.06); g.add(an); const dm = mesh(new THREE.SphereGeometry(1.05, 12, 8), M.claro); dm.position.set(cx + sx * w * 0.3, y + 1.0, zc + c * 0.36); g.add(dm); }
    if (k === 0 && rg) { rg.position.set(cx, yt + 2.5, zm); rg.scale.setScalar(1.35); topo = new THREE.Vector3(cx, yt + 4, zm); }
    if (r2 && il.length === 1) { const zr = zc + c * 0.44, yb = yD + 6.9; const ped = mesh(cil(0.45, 0.8, 5.7, 10), M.sup); ped.position.set(cx, yb + 2.85, zr); g.add(ped); r2.position.set(cx, yb + 6.1, zr); r2.scale.setScalar(2.0); }
    if (r2 && !nav) { r2.position.set(cx, yt + 2.6, zm); r2.scale.setScalar(2.0); }
    if (k === il.length - 1 && r3) { r3.position.set(cx, yt + 2.4, zm + 1.5); }
    if (k === 0) { const ex = mesh(caixa(w * 0.34, 1.2, c * 0.14), M.escuro); ex.position.set(cx, y + mH * 0.3 + 0.6, zm + c * 0.18); g.add(ex); g.userData.chamine = new THREE.Vector3(cx, y + mH * 0.3 + 1.2, zm + c * 0.18); g.userData.holofote = new THREE.Vector3(cx, yD + 13.6, I.z0 - 0.4); }
    if (k === 0) { const fl = g.getObjectByName('flamula'); if (fl) { fl.position.set(cx - w * 0.5, yt - 2.4, zm - c * 0.06); } }
  });
  // 11) luzes de navegação/convés remapeadas para a ilha e a popa
  { const I = il[0], yb = yD + 13; for (const o of luzes) { const st = o.userData.setor || (o.isSprite ? null : null); const p = o.position; if (Math.abs(p.z - L * 0.49) < 1 && p.x === 0) { p.set(0, yD - 1.2, L / 2 + 0.3); continue; }
      if (p.x < -0.1 && p.y > F) { p.set(I.xi - 0.5, yb, I.z0 + 3); continue; } if (p.x > 0.1 && p.y > F) { p.set(I.xe + 0.5, yb, I.z0 + 3); continue; } p.set(I.xc, yD + 10.5, I.z0 - 0.3); void st; } }
  P.topo1225 = topo;
  // 12) ala aérea no convés
  const AV = aeronaves(M); for (const [t, f, dxe, rot, esc] of PARQUE[C.id] || []) { const z = f * L, x = dxe > -1 ? dxe : borda(z, 'be') + dxe; const q = AV[t].clone(); q.position.set(x, yD, z); q.rotation.y = rot; if (esc) q.scale.setScalar(esc); g.add(q); }
}
export function extras1225(g, C, P, M, dY, meia, X) { if (!C.est25) return; matsExtra(M); if (C.superPA) portaAvioes1225(g, C, P, M, dY, meia, X); else linha1225(g, C, P, M, dY, meia, X); }
