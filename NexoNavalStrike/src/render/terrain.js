// Ilhas e costa: malha da grade de alturas suavizada (Catmull-Rom) + ruído fractal proporcional à altura, cores por
// altitude/declive/clima (praia, vegetação, rocha, neve), vegetação instanciada, faróis e boias da zona central.
import * as THREE from 'three'; import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const _rocha = new THREE.Color(); /* v1.2.15 */
import { criaProps, mesclaEstatico } from './props.js';
import { criaLocais } from './locais.js';
import { criaRuinas } from './ruinas.js'; /* v1.2.25 item 10 */
import { Destruicao } from './destr.js';
import { alturaTerreno } from '../sim/maps.js';
import { fbm } from '../sim/maps.js';

/** v1.2.5: textura de detalhe do terreno (grão claro/escuro e pedriscos), repetida; tinge as cores por vértice. */
/* v1.2.15 ALTA RESOLUÇÃO (APK pode crescer): detalhe 1024² de rocha/solo (grão, pedriscos, estratos e fissuras em fbm periódico)
 * + NORMAL MAP gerado do mesmo relevo — ~3,5 cm/px no ladrilho de 36 m; gerado 1× por sessão e compartilhado (clones só mudam o repeat). */
let _DT = null;
function _geraDetalhe() { const N = 1024, H = new Float32Array(N * N); let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const oit = (g) => { const v = new Float32Array(g * g); for (let i = 0; i < v.length; i++) v[i] = rnd(); return (x, y) => { const fx = x * g, fy = y * g, i0 = Math.floor(fx), j0 = Math.floor(fy), u = fx - i0, w = fy - j0, a = (p, q) => v[((q % g + g) % g) * g + ((p % g + g) % g)]; const su = u * u * (3 - 2 * u), sw = w * w * (3 - 2 * w); return (a(i0, j0) * (1 - su) + a(i0 + 1, j0) * su) * (1 - sw) + (a(i0, j0 + 1) * (1 - su) + a(i0 + 1, j0 + 1) * su) * sw; }; };
  const O = [oit(8), oit(16), oit(32), oit(64), oit(128), oit(256)], A = [0.32, 0.22, 0.16, 0.12, 0.1, 0.08], E = oit(6);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x / N, v = y / N; let h = 0; for (let k = 0; k < 6; k++) h += O[k](u, v) * A[k];
    const mF = Math.max(0, Math.min(1, (E(u + 0.37, v + 0.61) - 0.62) / 0.12)); const fis = Math.max(0, 0.045 - Math.abs(O[2](u * 1.7, v * 0.6) - 0.5)) * -2.0 * mF; const est = Math.sin((v * 11.0 + E(u, v) * 2.4) * Math.PI * 2) * 0.035 * (0.4 + 0.6 * O[1](u, v)); /* v1.2.26 I: estratos de rocha no ladrilho 36 m (sem curvas de nível na malha) */ H[y * N + x] = h + fis + est; } /* v1.2.25: sem os 'estratos' senoidais e com fissuras fragmentadas — projetados de cima no relevo eles viravam LINHAS DE CURVA DE NÍVEL vistas de perto (Dalmácia e demais) */
  for (let i = 0; i < 9000; i++) { const cx = rnd() * N | 0, cy = rnd() * N | 0, r = 1 + rnd() * (rnd() < 0.1 ? 5 : 2), al = 0.05 + rnd() * 0.08; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r) continue; const q = (((cy + dy) % N + N) % N) * N + (((cx + dx) % N + N) % N); H[q] += al * (1 - (dx * dx + dy * dy) / (r * r + 1)); } } /* pedriscos */
  let mn = 1e9, mx = -1e9; for (const h of H) { if (h < mn) mn = h; if (h > mx) mx = h; }
  const cc = document.createElement('canvas'); cc.width = cc.height = N; const xc = cc.getContext('2d'), ic = xc.createImageData(N, N); const cn = document.createElement('canvas'); cn.width = cn.height = N; const xn = cn.getContext('2d'), inn = xn.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x, h = (H[i] - mn) / (mx - mn); const c = 172 + h * 83 | 0; const k = i * 4; ic.data[k] = c; ic.data[k + 1] = c; ic.data[k + 2] = c - 3; ic.data[k + 3] = 255;
    const a = H[y * N + (x + 1) % N] - H[y * N + (x - 1 + N) % N], b = H[((y + 1) % N) * N + x] - H[((y - 1 + N) % N) * N + x]; const nx = -a * 14, ny = -b * 14, L = Math.hypot(nx, ny, 1); /* v1.2.26 I: normal de rocha mais profunda */ inn.data[k] = (nx / L * 0.5 + 0.5) * 255; inn.data[k + 1] = (ny / L * 0.5 + 0.5) * 255; inn.data[k + 2] = (1 / L * 0.5 + 0.5) * 255; inn.data[k + 3] = 255; }
  xc.putImageData(ic, 0, 0); xn.putImageData(inn, 0, 0); const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = (globalThis.__nnsAniso || 8); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t; };
  return { cor: mk(cc, true), nor: mk(cn, false) }; }
function texDetalheTerra(rx, rz, normal = false) { if (!_DT) _DT = _geraDetalhe(); const t = (normal ? _DT.nor : _DT.cor).clone(); t.repeat.set(Math.max(1, rx), Math.max(1, rz)); t.needsUpdate = true; return t; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function terrenoCR(T, x, z) { const n = T.n, s2 = T.tam; const fx = (x / s2 + 0.5) * n - 0.5, fz = (z / s2 + 0.5) * n - 0.5; const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j; const g = (a, b) => T.h[clamp(b, 0, n - 1) * n + clamp(a, 0, n - 1)];
  const cr = (p0, p1, p2, p3, t) => p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0))); const r = []; for (let k = -1; k <= 2; k++) r.push(cr(g(i - 1, j + k), g(i, j + k), g(i + 1, j + k), g(i + 2, j + k), tx)); return cr(r[0], r[1], r[2], r[3], tz); }
export function relevo(T, x, z) { const hb = alturaTerreno(T, x, z); if (hb < -8) return hb; let h = terrenoCR(T, x, z); if (h > 2) h += (fbm(x / 140, z / 140, 7) - 0.5) * Math.min(48, h * 0.26) + (fbm(x / 28, z / 28, 3) - 0.5) * Math.min(4.5, h * 0.04); /* v1.2.26 I: micro-relevo de pedras */ return h; }

export function criaTerreno(cena, T, nivel) {
  const G = new THREE.Group(); const clima = T.def.clima; const seg = Math.round([128, 192, 256][nivel] * (T.def.segK || 1)); /* v1.2.25 item 10: arenas novas com ilhas pequenas pedem malha mais fina (segK) */
  // limites da área com terra (+margem) → malha só onde precisa
  let i0 = T.n, i1 = 0, j0 = T.n, j1 = 0; for (let j = 0; j < T.n; j++) for (let i = 0; i < T.n; i++) if (T.h[j * T.n + i] > -10) { i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
  if (i1 >= i0) { const cel = T.tam / T.n, bx0 = Math.max(-T.tam / 2, (i0 - 3) * cel - T.tam / 2), bx1 = Math.min(T.tam / 2, (i1 + 4) * cel - T.tam / 2), bz0 = Math.max(-T.tam / 2, (j0 - 3) * cel - T.tam / 2), bz1 = Math.min(T.tam / 2, (j1 + 4) * cel - T.tam / 2);
    const sx = Math.max(8, Math.round(seg * (bx1 - bx0) / T.tam)), sz = Math.max(8, Math.round(seg * (bz1 - bz0) / T.tam));
    const geo = new THREE.PlaneGeometry(bx1 - bx0, bz1 - bz0, sx, sz); geo.rotateX(-Math.PI / 2); geo.translate((bx0 + bx1) / 2, 0, (bz0 + bz1) / 2);
    const p = geo.attributes.position, cor = new Float32Array(p.count * 3), c = new THREE.Color(); const Hv = new Float32Array(p.count); for (let i = 0; i < p.count; i++) Hv[i] = relevo(T, p.getX(i), p.getZ(i));
    const cw = sx + 1, dxm = (bx1 - bx0) / sx, dzm = (bz1 - bz0) / sz; const hs = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = Hv[i]; const ci = i % cw, cj = (i / cw) | 0; const dx = (Hv[cj * cw + Math.min(sx, ci + 1)] - Hv[cj * cw + Math.max(0, ci - 1)]) / dxm, dz = (Hv[Math.min(sz, cj + 1) * cw + ci] - Hv[Math.max(0, cj - 1) * cw + ci]) / dzm; const dec = Math.hypot(dx, dz) / 2; const r = hs(Math.floor(x / 70), Math.floor(z / 70));
      if (h <= 0) { p.setY(i, h - 1.2); c.set(clima === 'tropical' ? '#b9a777' : '#5d5a4e'); }
      else { p.setY(i, h + (h < 2.5 ? 0 : 0.5));
        if (h < 1.1) c.set(clima === 'frio' ? '#5c5a52' : '#a89a72'); /* v1.2.5: areia molhada */
        else if (h < 4.2) c.set(clima === 'frio' ? '#7a766c' : clima === 'tropical' ? '#efe0b4' : '#e2d0a0'); /* v1.2.47: areia tropical clara */ /* v1.2.26 I: praia mais larga/clara */
        else if (dec > 0.75) { c.set(r > 0.5 ? '#5f6361' : '#4f5453'); const st = 0.88 + 0.16 * Math.sin(h * 0.45 + hs(x * 0.01, z * 0.01) * 2); c.multiplyScalar(st); if (h < 12) c.lerp(new THREE.Color('#6b5e4a'), 0.25); } /* v1.2.5: estratos na rocha */
        else if (h < 6 && clima !== 'frio') c.setRGB(0.42 + r * 0.06, 0.4 + r * 0.06, 0.24); /* v1.2.5: transição areia→capim */
        else if (clima === 'frio') { if (h > 300) c.set('#e8edf2'); else if (dec > 0.45) c.set('#5b605d'); else c.setRGB(0.2 + r * 0.05, 0.25 + r * 0.05, 0.2); }
        else if (dec > 0.5) c.setRGB(0.22 + r * 0.04, 0.26 + r * 0.05, 0.17);
        else if (clima === 'tropical') c.set(r > 0.5 ? '#4f7d36' : '#5a8a3c'); /* v1.2.47: verde tropical em sRGB (antes valores lineares lavavam a cor) */ /* v1.2.47: mata atlântica mais viva */ else c.setRGB(0.2 + r * 0.06, 0.3 + r * 0.08 - Math.min(0.1, h / 3000), 0.12 + r * 0.03);
        if (h >= 3.2 && dec <= 0.75) { const ss = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }; const kr = ss((dec - 0.42) / 0.33) * 0.65, ka = clima !== 'frio' ? ss((h - 200) / 280) * 0.7 : 0; const k = Math.max(kr, ka); if (k > 0) c.lerp(_rocha.set(r > 0.5 ? '#61655f' : '#545955'), k); } /* v1.2.15: transição SUAVE capim→rocha por declive e vegetação rareando com a altitude */
        if (h >= 6 && dec <= 0.6 && clima !== 'frio') { const ss2 = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }; const fm = fbm(x / 420, z / 420, 4), fm2 = fbm(x / 90 + 7, z / 90 - 3, 3); const mata = ss2((fm - 0.46) / 0.14) * (1 - ss2((h - 380) / 200)); c.lerp(_rocha.set(clima === 'tropical' ? '#1d3f1b' : '#24391f'), mata * 0.85); /* v1.2.47: manchas de MATA densa */ const campo = ss2((0.42 - fm) / 0.1) * ss2((80 - h) / 60); c.lerp(_rocha.set('#8c8a55'), campo * 0.5); /* clareiras/capim seco */ c.multiplyScalar(0.92 + fm2 * 0.16); }
        c.multiplyScalar((0.94 + hs(x, z) * 0.12)); } /* v1.2.15: variação macro (manchas de mata/campo) */
      cor[i * 3] = c.r; cor[i * 3 + 1] = c.g; cor[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(cor, 3)); geo.computeVertexNormals();
    const tm = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, map: texDetalheTerra((bx1 - bx0) / 36, (bz1 - bz0) / 36), normalMap: texDetalheTerra((bx1 - bx0) / 36, (bz1 - bz0) / 36, true), normalScale: new THREE.Vector2(1.65, 1.65) })); /* v1.2.26 I: normal de rocha mais marcada; v1.2.5/15: textura + normal resolução) */ tm.receiveShadow = true; G.add(tm);
    // vegetação instanciada
    { const nArv = [1800, 5200, 8400][nivel]; /* v1.2.47: matas densas */ /* v1.2.26 I: vegetação mais densa (celular em média também) */ const tronco = new THREE.CylinderGeometry(0.4, 0.6, 4, 5).translate(0, 2, 0); const copa = clima === 'tropical' ? mergeGeometries([new THREE.IcosahedronGeometry(3.6, 1).scale(1, 0.75, 1).translate(0, 6.6, 0), new THREE.IcosahedronGeometry(2.6, 1).scale(1, 0.8, 1).translate(2.2, 5.6, 0.8), new THREE.IcosahedronGeometry(2.4, 1).scale(1, 0.8, 1).translate(-1.8, 5.8, -1.2), new THREE.IcosahedronGeometry(2.2, 1).translate(0.4, 8.2, -0.6)].map((q) => q.toNonIndexed())) : new THREE.ConeGeometry(3.6, 11, 6).translate(0, 8, 0); /* v1.2.47: copa tropical em CACHOS (não bola) */
      const ac = new THREE.InstancedMesh(copa, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95 }), nArv), at = new THREE.InstancedMesh(tronco, new THREE.MeshStandardMaterial({ color: '#4a3a28', roughness: 0.95 }), nArv);
      const mt = new THREE.Matrix4(), cc = new THREE.Color(); let na = 0; let sd = 1; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
      for (let k = 0; k < nArv * 8 && na < nArv; k++) { const x = bx0 + rnd() * (bx1 - bx0), z = bz0 + rnd() * (bz1 - bz0), h = relevo(T, x, z); if (h < 5 || h > (clima === 'frio' ? 260 : 700)) continue; if (fbm(x / 420, z / 420, 4) < 0.46 && rnd() < 0.8) continue; /* v1.2.47: árvores agrupadas nas manchas de mata */ const dec = Math.abs(relevo(T, x + 25, z) - h) / 25; if (dec > 0.8) continue;
        const s = 0.9 + rnd() * 1.2; mt.makeScale(s, s * (0.85 + rnd() * 0.5), s); mt.setPosition(x, h - 0.4, z); ac.setMatrixAt(na, mt); at.setMatrixAt(na, mt); cc.setHSL(clima === 'frio' ? 0.36 : 0.26 + rnd() * 0.07, 0.55, (clima === 'frio' ? 0.05 : 0.055) + rnd() * 0.05); /* v1.2.47: copa verde-escura (cor linear) */ ac.setColorAt(na, cc); na++; }
      ac.count = at.count = na; ac.userData.arvNuke = 1; at.userData.arvNuke = 1; ac.instanceMatrix.setUsage(THREE.DynamicDrawUsage); at.instanceMatrix.setUsage(THREE.DynamicDrawUsage); G.add(ac); G.add(at); /* v1.2.30 nuke1230 item 6: tag p/ NuclearFx.arrancaArvores */
      if (clima === 'tropical') { /* v1.2.47: COQUEIROS na orla (tronco curvo e folhas pendentes), cor por vértice */ const nP = [260, 650, 1100][nivel]; const partes = []; const corV = (g, hex) => { const c3 = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c3.r; a[i * 3 + 1] = c3.g; a[i * 3 + 2] = c3.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
        let px = 0, py = 0; for (let k = 0; k < 6; k++) { const sg = new THREE.CylinderGeometry(0.22 - k * 0.015, 0.26 - k * 0.015, 2.1, 6).toNonIndexed(); sg.rotateZ(-0.06 * k); sg.translate(px, py + 1.05, 0); partes.push(corV(sg, k % 2 ? '#6b5236' : '#7a5f40')); px += Math.sin(0.06 * k) * 2.1 * 0.9; py += 2.05; }
        for (let f = 0; f < 8; f++) { const fo = new THREE.ConeGeometry(0.55, 5.2, 4).toNonIndexed(); fo.scale(1, 1, 0.18); fo.translate(0, 2.6, 0); fo.rotateZ(-1.15 - (f % 2) * 0.3); fo.rotateY((f / 8) * Math.PI * 2); fo.translate(px, py + 0.2, 0); partes.push(corV(fo, f % 3 ? '#2f7a2a' : '#3f8f30')); }
        const cq = new THREE.SphereGeometry(0.45, 6, 4).toNonIndexed(); cq.translate(px, py - 0.1, 0); partes.push(corV(cq, '#5d4a20'));
        const pg = mergeGeometries(partes); const pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), nP); let np = 0; const m2 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), vv = new THREE.Vector3(), ss = new THREE.Vector3();
        for (let k = 0; k < nP * 12 && np < nP; k++) { const x = bx0 + rnd() * (bx1 - bx0), z = bz0 + rnd() * (bz1 - bz0), h = relevo(T, x, z); if (h < 2.6 || h > 32) continue; const dec = Math.abs(relevo(T, x + 12, z) - h) / 12; if (dec > 0.5) continue; const sc = 0.8 + rnd() * 0.6; ee.set(0, rnd() * 6.28, (rnd() - 0.5) * 0.15); qq.setFromEuler(ee); m2.compose(vv.set(x, h - 0.3, z), qq, ss.set(sc, sc * (0.9 + rnd() * 0.3), sc)); pm.setMatrixAt(np++, m2); }
        pm.count = np; pm.castShadow = true; pm.userData.arvNuke = 1; G.add(pm); }
      /* v1.2.5: vegetação variada — arbustos baixos (cores variadas) por altura/declive */
      const nB = [700, 1600, 2400][nivel]; /* v1.2.26 I */ const ab = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.8, 0).scale(1, 0.6, 1).translate(0, 0.6, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), nB); let nb = 0;
      for (let k = 0; k < nB * 8 && nb < nB; k++) { const x = bx0 + rnd() * (bx1 - bx0), z = bz0 + rnd() * (bz1 - bz0), h = relevo(T, x, z); if (h < 3 || h > 400) continue; const dec = Math.abs(relevo(T, x + 12, z) - h) / 12; if (dec > 0.7) continue;
        const s = 0.6 + rnd() * 1.4; mt.makeScale(s * (0.8 + rnd() * 0.5), s, s * (0.8 + rnd() * 0.5)); mt.setPosition(x, h - 0.2, z); ab.setMatrixAt(nb, mt); cc.setHSL(clima === 'frio' ? 0.3 : 0.18 + rnd() * 0.14, 0.35 + rnd() * 0.2, 0.16 + rnd() * 0.12); ab.setColorAt(nb, cc); nb++; }
      ab.count = nb; G.add(ab); }
    // faróis em pontas de terra perto da linha de combate
    criaProps(G, T, relevo); // v1.2.0: faróis com feixe girante + portos (galpões, guindastes, contêineres)
    criaLocais(G, T, relevo); if (T.def.ruinas) { const ru = criaRuinas(T); if (ru) G.add(ru); } /* v1.2.25 item 10: cidade submersa no horizonte (1 chamada) */ if (G.userData.feixesExtra && G.userData.feixes) G.userData.feixes.push(...G.userData.feixesExtra); /* v1.2.19 itens 10/10b: bairros, pontes, faróis e marcos reais */
  }
  new Destruicao(G, T); /* v1.2.19 itens 11/11b: tudo que pode ser destruído, em TODAS as arenas */
  cena.add(G); return G;
}
function farol(x, y, z) { const g = new THREE.Group(); const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const c = cv.getContext('2d'); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#c81e1e' : '#f4f4f4'; c.fillRect(0, i * 8, 8, 8); } const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.4, 24, 14), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.6 })); t.position.y = 12; t.castShadow = true; g.add(t);
  const lan = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 2.6, 12), new THREE.MeshStandardMaterial({ color: '#fff7d6', emissive: '#ffe9a8', emissiveIntensity: 1.5 })); lan.position.y = 25.3; g.add(lan); const tp = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2, 12), new THREE.MeshStandardMaterial({ color: '#333' })); tp.position.y = 27.6; g.add(tp);
  g.position.set(x, y, z); g.name = 'farol'; return g; }

/** Marcação da zona marítima central: boias + anel translúcido na água (cor do dono). */
export function criaZona(cena, c) { const g = new THREE.Group(); g.position.set(c.x, 0, c.z);
  const anel = new THREE.Mesh(new THREE.RingGeometry(c.r - 6, c.r, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide })); anel.position.y = 0.6; anel.renderOrder = 2; g.add(anel);
  const bm = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.5, emissive: '#7c3d00', emissiveIntensity: 0.4 }); const boia = new THREE.CylinderGeometry(1.4, 1.8, 3, 10); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const b = new THREE.Mesh(boia, bm); b.position.set(Math.cos(a) * c.r, 1, Math.sin(a) * c.r); g.add(b); }
  mesclaEstatico(g); /* v1.2.14: 16 boias → 1 chamada */ cena.add(g); return { g, anel }; }
