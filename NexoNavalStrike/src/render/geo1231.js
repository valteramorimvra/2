// v1.2.31 — primitivas geométricas de alto detalhe (módulo NOVO, tudo procedural): troncos facetados por loft (faces inclinadas),
// quadros de face (janelas, portas, painéis, escadas) em qualquer face, mastros em treliça, botes, antenas, guindastes.
// Sem LOD: tudo é geometria estática fundida por material (funde1231) — o mesmo modelo de perto e de longe.
import * as THREE from 'three';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
const _up = V(0, 1, 0);
export function Kit(g, M) {
  const k = { g, M, rails: [] };
  const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  k.mesh = mesh;
  k.cil = (r1, r2, h, n = 8) => new THREE.CylinderGeometry(r1, r2, h, n);
  /** plano em planta de 8 vértices (octógono achatado): bordas 0 proa,1 canto proa-BE,2 BE,3 canto popa-BE,4 popa,5 canto popa-BB,6 BB,7 canto proa-BB */
  k.plano = (hw, z0, z1, c) => { c = Math.min(c, hw * 0.9, (z1 - z0) * 0.45); return [[-hw + c, z0], [hw - c, z0], [hw, z0 + c], [hw, z1 - c], [hw - c, z1], [-hw + c, z1], [-hw, z1 - c], [-hw, z0 + c]]; };
  /** tronco: loft entre planta de baixo A (em y0) e de cima B (em y1) + tampa. Faces planas (normais por face). */
  k.loft = (A, B, y0, y1, mat, uvs = 0.12) => {
    const pos = [], uv = [], n = A.length; const cx = A.reduce((s, p) => s + p[0], 0) / n, cz = A.reduce((s, p) => s + p[1], 0) / n; let per = 0;
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; const a = A[i], b = A[j], c = B[j], d = B[i]; const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const P = [V(a[0], y0, a[1]), V(b[0], y0, b[1]), V(c[0], y1, c[1]), V(d[0], y1, d[1])]; const nn = new THREE.Vector3().crossVectors(P[1].clone().sub(P[0]), P[3].clone().sub(P[0]));
      const mid = V((a[0] + b[0]) / 2 - cx, 0, (a[1] + b[1]) / 2 - cz); const flip = nn.dot(mid) < 0; const idx = flip ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3];
      const U = [per, per + len, per + len, per], Vv = [y0, y0, y1, y1];
      for (const q of idx) { pos.push(P[q].x, P[q].y, P[q].z); uv.push(U[q] * uvs, Vv[q] * uvs); } per += len; }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; const t = [[cx, cz], B[i], B[j]]; const nn = new THREE.Vector3().crossVectors(V(t[1][0] - t[0][0], 0, t[1][1] - t[0][1]), V(t[2][0] - t[0][0], 0, t[2][1] - t[0][1])); const ord = nn.y > 0 ? [0, 1, 2] : [0, 2, 1];
      for (const q of ord) { pos.push(t[q][0], y1, t[q][1]); uv.push(t[q][0] * uvs, t[q][1] * uvs); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = mesh(geo, mat); return m; };
  /** bloco facetado: base (hw,z0,z1) → topo (thw,tz0,tz1), chanfro c. Retorna o registro para decorar as faces. */
  k.reg = []; k.bloco = (o) => { const mat = o.mat || M.sup; const A = k.plano(o.hw, o.z0, o.z1, o.c ?? 1.2), B = k.plano(o.thw ?? o.hw, o.tz0 ?? o.z0, o.tz1 ?? o.z1, o.tc ?? o.c ?? 1.2); const y1 = o.y + o.h; k.loft(A, B, o.y, y1, mat); const rb = { A, B, y0: o.y, y1, h: o.h, zc: (o.z0 + o.z1) / 2 }; if (mat === M.sup && o.h >= 1.6) k.reg.push(rb); return rb; };
  /** quadro da face i (0..7) na fração f de altura: devolve base ortonormal e ponto */
  k.face = (b, i, f) => { const j = (i + 1) % b.A.length; const a0 = b.A[i], a1 = b.A[j], b0 = b.B[i], b1 = b.B[j];
    const pb = V((a0[0] + a1[0]) / 2, b.y0, (a0[1] + a1[1]) / 2), pt = V((b0[0] + b1[0]) / 2, b.y1, (b0[1] + b1[1]) / 2); const upv = pt.clone().sub(pb).normalize(); const dir = V(a1[0] - a0[0], 0, a1[1] - a0[1]).normalize();
    let n = new THREE.Vector3().crossVectors(dir, upv).normalize(); const cx = b.A.reduce((s, p) => s + p[0], 0) / b.A.length, cz = b.A.reduce((s, p) => s + p[1], 0) / b.A.length; if (n.dot(V(pb.x - cx, 0, pb.z - cz)) < 0) n.negate();
    const right = new THREE.Vector3().crossVectors(upv, n).normalize(); const up2 = new THREE.Vector3().crossVectors(n, right).normalize(); const p = pb.clone().lerp(pt, f);
    return { p, n, right, up: up2, len: Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) }; };
  /** placa plana na face i: fração de altura f, deslocamento lateral u (m), w×h, material. Opcional rep (repetição UV em x). */
  k.placa = (b, i, f, u, w, h, mat, o = {}) => { const F = k.face(b, i, f); const geo = new THREE.PlaneGeometry(w, h); if (o.rep) { const uv = geo.attributes.uv; for (let q = 0; q < uv.count; q++) uv.setX(q, uv.getX(q) * o.rep); }
    const m = new THREE.Mesh(geo, mat); m.castShadow = false; m.receiveShadow = true; const mx = new THREE.Matrix4().makeBasis(F.right, F.up, F.n); m.quaternion.setFromRotationMatrix(mx); m.position.copy(F.p).addScaledVector(F.right, u).addScaledVector(F.n, o.off ?? 0.06);
    if (o.roll) m.rotateZ(o.roll); g.add(m); return m; };
  /** painel de radar poligonal (octógono SPY-1D ou retângulo AESA) sobre a face i, com moldura escura */
  k.painelFace = (b, i, f, u, tam, oct, mat, o = {}) => { const F = k.face(b, i, f); const m = new THREE.Mesh(oct ? new THREE.CircleGeometry(tam / 2, 8, Math.PI / 8) : new THREE.PlaneGeometry(tam, o.alt ?? tam), mat); const mx = new THREE.Matrix4().makeBasis(F.right, F.up, F.n); m.quaternion.setFromRotationMatrix(mx);
    m.position.copy(F.p).addScaledVector(F.right, u).addScaledVector(F.n, 0.1); g.add(m); m.castShadow = false;
    const fr = new THREE.Mesh(oct ? new THREE.CircleGeometry(tam / 2 + 0.18, 8, Math.PI / 8) : new THREE.PlaneGeometry(tam + 0.36, (o.alt ?? tam) + 0.36), M.escuro); fr.quaternion.copy(m.quaternion); fr.position.copy(F.p).addScaledVector(F.right, u).addScaledVector(F.n, 0.07); g.add(fr); return m; };

  /** v1.2.31 FACHADA: painéis 2,8×3,1 m em véus claros/escuros (pintura desigual), juntas verticais/horizontais, escorridos de sujeira/ferrugem — em TODAS as faces laterais de um bloco. Só planos (2 tris cada), 3 materiais translúcidos. */
  k.facetar = (b, seed = 1) => { let s = seed * 7919 + 13; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; const n = b.A.length;
    for (let i = 0; i < n; i++) { const F = k.face(b, i, 0.5); if (Math.abs(F.n.y) > 0.6) continue; const j = (i + 1) % n; const lb = Math.hypot(b.B[j][0] - b.B[i][0], b.B[j][1] - b.B[i][1]); const len = Math.min(F.len, lb); if (len < 2.4) continue;
      const hs = b.h / Math.max(0.35, Math.sqrt(1 - F.n.y * F.n.y) * 0 + 1) ; const nc = Math.max(1, Math.round(len / 2.8)), cw = len / nc, nr = Math.max(1, Math.round(b.h / 3.1)), rh = b.h / nr;
      for (let c = 0; c < nc; c++) for (let r = 0; r < nr; r++) { const t = R(); if (t > 0.58) continue; k.placa(b, i, (r + 0.5) / nr, (c + 0.5) * cw - len / 2, cw - 0.07, rh - 0.07, t < 0.3 ? M.velaC : M.velaE, { off: 0.04 }); }
      for (let c = 1; c < nc; c++) k.placa(b, i, 0.5, c * cw - len / 2, 0.07, b.h * 0.99, M.escuro, { off: 0.05 });
      for (let r = 1; r < nr; r++) k.placa(b, i, r / nr, 0, len * 0.99, 0.06, M.escuro, { off: 0.05 });
      for (let c = 0; c < nc; c++) if (R() < 0.45) { const hh = b.h * (0.22 + R() * 0.4); k.placa(b, i, 1 - hh / 2 / b.h - 0.01, (c + 0.15 + R() * 0.7) * cw - len / 2, 0.35 + R() * 0.5, hh, M.mancha, { off: 0.055 }); } } };
  /** radome/domo hemisférico saliente na face i */
  k.domoFace = (b, i, f, u, r, mat = M.claro) => { const F = k.face(b, i, f); const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.quaternion.setFromUnitVectors(_up, F.n); m.position.copy(F.p).addScaledVector(F.right, u).addScaledVector(F.n, 0.1); m.castShadow = true; g.add(m); return m; };
  k.cx = (x, y, z, w, h, d, mat = M.sup, ry = 0) => { const m = mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.rotation.y = ry; return m; };
  k.cv = (x, y, z, r1, r2, h, mat = M.sup, n = 8) => { const m = mesh(k.cil(r1, r2, h, n), mat); m.position.set(x, y + h / 2, z); return m; };
  k.domo = (x, y, z, r, mat = M.claro) => { const m = mesh(new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.position.set(x, y, z); return m; };
  k.esfera = (x, y, z, r, mat = M.claro) => { const m = mesh(new THREE.SphereGeometry(r, 10, 8), mat); m.position.set(x, y, z); return m; };
  k.tubo = (a, b, r, mat = M.sup, n = 5) => { const d = new THREE.Vector3().subVectors(b, a), len = d.length(); const m = mesh(k.cil(r, r, len, n), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(_up, d.normalize()); return m; };
  k.antena = (x, y, z, h, r = 0.05) => k.tubo(V(x, y, z), V(x, y + h, z), r, M.claro, 4);
  /** corrimão: postes + 2 réguas (LineSegments, um único draw para o navio inteiro) */
  k.rail = (pts, y, alt = 1.05, passo = 1.8) => { for (let i = 0; i + 1 < pts.length; i++) { const [x0, z0] = pts[i], [x1, z1] = pts[i + 1]; const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / passo));
      for (let s = 0; s <= n; s++) { const t = s / n; const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; k.rails.push(x, y, z, x, y + alt, z); }
      for (const f of [1, 0.55, 0.1]) k.rails.push(x0, y + alt * f, z0, x1, y + alt * f, z1); } };
  k.railsFim = () => { if (!k.rails.length) return; const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(k.rails, 3)); const ls = new THREE.LineSegments(lg, M.linha); g.add(ls); };
  /** escada vertical de quebra-peito (2 banzos + degraus como 1 tira texturizada: aqui só 2 banzos + 4 degraus) */
  k.escada = (x, y0, z, alt, yaw = 0, w = 0.55) => { const gg = new THREE.Group(); gg.position.set(x, y0, z); gg.rotation.y = yaw; g.add(gg); for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.05, alt, 0.05), M.escuro); m.position.set(s * w / 2, alt / 2, 0); gg.add(m); }
    const n = Math.max(2, Math.round(alt / 0.5)); for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.03), M.escuro); m.position.set(0, (i + 0.5) * alt / n, 0); gg.add(m); } return gg; };
  /** bote inflável rígido (RHIB) deitado no convés, proa para -z (yaw gira) */
  k.bote = (x, y, z, yaw = 0, esc = 1) => { const gg = new THREE.Group(); gg.position.set(x, y, z); gg.rotation.y = yaw; gg.scale.setScalar(esc); g.add(gg); const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; gg.add(m); return m; };
    add(new THREE.BoxGeometry(1.5, 0.35, 5.6), M.escuro, 0, 0.35, 0.1); for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.4, 0.4, 5.8, 8).rotateX(Math.PI / 2), M.bote, s * 0.95, 0.62, 0); add(new THREE.SphereGeometry(0.4, 8, 6), M.bote, s * 0.95, 0.62, -2.9).scale.set(1, 1, 1.4); }
    add(new THREE.BoxGeometry(0.9, 0.7, 0.9), M.aa, 0, 0.9, 0.4); add(new THREE.BoxGeometry(0.5, 0.3, 0.6), M.escuro, 0, 0.45, 2.7); return gg; };
  /** pau-de-carga / guindaste de convés articulado */
  k.guindaste = (x, y, z, yaw = 0, alt = 4.5, lanca = 7) => { const gg = new THREE.Group(); gg.position.set(x, y, z); gg.rotation.y = yaw; g.add(gg); const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); gg.add(m); return m; };
    add(new THREE.CylinderGeometry(0.4, 0.5, alt, 8), M.sup, 0, alt / 2, 0); add(new THREE.BoxGeometry(0.8, 0.8, 1.0), M.sup, 0, alt + 0.2, 0); const l = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, lanca), M.sup); l.position.set(0, alt + 0.9, -lanca / 2 * 0.8); l.rotation.x = 0.35; gg.add(l);
    add(new THREE.BoxGeometry(0.05, 2.4, 0.05), M.escuro, 0, alt - 0.4, -lanca * 0.78); return gg; };
  /** radar giratório (grupo 'radar*'): pedestal + antena de refletor em barra */
  k.radarBarra = (nome, x, y, z, larg = 4.6, alt = 1.5) => { const r = new THREE.Group(); r.name = nome; r.position.set(x, y, z); g.add(r); const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.7, 8), M.escuro); pe.position.y = 0.35; r.add(pe);
    const a = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, 0.16), M.rede || M.escuro); a.position.y = 0.7 + alt / 2; r.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(larg, 0.14, 0.4), M.sup); b.position.y = 0.7 + alt + 0.04; r.add(b); return r; };
  /** mastro em treliça afunilada: 4 pernas + anéis + diagonais. base b0 (meia largura), topo b1. */
  k.trelica = (x, y0, z, H, b0, b1, nNiv = 6, r = 0.1) => { const leg = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; for (const [sx, sz] of leg) k.tubo(V(x + sx * b0, y0, z + sz * b0), V(x + sx * b1, y0 + H, z + sz * b1), r, M.sup);
    for (let q = 0; q <= nNiv; q++) { const f = q / nNiv, hh = H * f, w = b0 + (b1 - b0) * f; const P = leg.map(([sx, sz]) => V(x + sx * w, y0 + hh, z + sz * w)); for (let i = 0; i < 4; i++) k.tubo(P[i], P[(i + 1) % 4], r * 0.55, M.sup, 4);
      if (q < nNiv) { const f2 = (q + 1) / nNiv, w2 = b0 + (b1 - b0) * f2; const Q = leg.map(([sx, sz]) => V(x + sx * w2, y0 + H * f2, z + sz * w2)); for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; k.tubo(P[i], Q[j], r * 0.45, M.sup, 4); } } } };

  /** aglomerado de sensores (ESM/ECM, domos, discos, caixas, chicotes) sobre uma plataforma — pseudo-aleatório com semente (determinístico) */
  k.cacho = (x, y, z, w, d, n, seed = 1, esc = 1) => { let s = seed * 9301 + 49297; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) { const px = x + (R() - 0.5) * w, pz = z + (R() - 0.5) * d, t = R(), q = esc * (0.8 + R() * 0.6);
      if (t < 0.28) k.cx(px, y, pz, 0.45 * q, 0.55 * q + R() * 0.4, 0.45 * q, R() < 0.5 ? M.escuro : M.pnl, R() * 3);
      else if (t < 0.5) { k.cv(px, y, pz, 0.17 * q, 0.2 * q, 0.55 * q, M.escuro, 8); k.domo(px, y + 0.55 * q, pz, 0.2 * q, M.claro); }
      else if (t < 0.66) k.domo(px, y, pz, 0.32 * q, M.claro);
      else if (t < 0.84) k.antena(px, y, pz, (1.0 + R() * 2.6) * esc, 0.022);
      else { k.cv(px, y, pz, 0.035, 0.035, 0.55 * q, M.sup, 4); k.cv(px, y + 0.55 * q, pz, 0.5 * q, 0.1, 0.16 * q, M.claro, 10); } } };
  /** plataforma de mastro: chapa + corrimão + 4 braços de apoio */
  k.plataforma = (x, y, z, w, d) => { k.cx(x, y, z, w, 0.18, d, M.sup); k.rail([[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2], [x - w / 2, z - d / 2]], y + 0.18, 1.0);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.tubo(V(x + sx * w * 0.2, y - 0.9, z + sz * d * 0.2), V(x + sx * w * 0.5, y, z + sz * d * 0.5), 0.05, M.sup, 4); };
  /** verga: tubo horizontal com escoras, antenas de ponta e caixas ESM */
  k.verga = (x, y, z, w, ry = 0) => { const c = Math.cos(ry), s = Math.sin(ry); const a = V(x - c * w / 2, y, z + s * w / 2), b = V(x + c * w / 2, y, z - s * w / 2); k.tubo(a, b, 0.08, M.sup, 5);
    for (const [e, sg] of [[a, -1], [b, 1]]) { k.tubo(V(x + c * sg * w * 0.22, y - 1.1, z - s * sg * w * 0.22), e, 0.035, M.sup, 3); k.antena(e.x, e.y, e.z, 2.2, 0.03); k.cx(e.x - c * sg * 0.7, y - 0.55, e.z + s * sg * 0.7, 0.5, 0.45, 0.5, M.escuro); }
    k.cx(x, y - 0.4, z, 0.7, 0.4, 0.7, M.pnl); };
  /** mastro treliçado completo: perna + travamentos + plataformas com aglomerados + vergas + topo com chicotes. Retorna {yTopo}. */
  k.mastroTreliça = (o) => { const { x = 0, y0, z, H, b0, b1, niveis = 8, r = 0.12, plat = [], vergas = [], topo = 7, seed = 3 } = o; k.trelica(x, y0, z, H, b0, b1, niveis, r);
    plat.forEach(([f, w, n], i) => { const yy = y0 + H * f, bw = b0 + (b1 - b0) * f; k.plataforma(x, yy, z, w, w * 0.9); k.cacho(x, yy + 0.18, z, w * 0.8, w * 0.7, n, seed + i, 1); });
    vergas.forEach(([f, w], i) => k.verga(x, y0 + H * f, z, w, i % 2 ? 0 : 0));
    const yT = y0 + H; k.cv(x, yT, z, 0.06, 0.12, topo, M.claro, 5); k.cx(x, yT + topo * 0.45, z, 1.3, 0.2, 0.3, M.claro); k.cx(x, yT + topo * 0.78, z, 0.8, 0.16, 0.25, M.claro); for (const [dx, dz, h] of [[0.5, 0.5, 3.4], [-0.5, 0.5, 2.6], [0.5, -0.5, 2.0], [-0.5, -0.5, 3.0]]) k.antena(x + dx, yT, z + dz, h, 0.025); return { yTopo: yT + topo }; };
  return k;
}
