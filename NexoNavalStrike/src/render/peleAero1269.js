// v1.2.69 (Valter) — ACABAMENTO REALISTA das aeronaves: pintura com juntas de painéis, portinholas de inspeção, rebites, sujeira e
// escorridos no sentido do fluxo de ar (relevo real na luz: a junta afunda, o rebite brilha), CAMUFLAGENS com padrão de verdade
// (manchas, fragmentos, digital, ondas) com ventre claro, CABINE DE VIDRO transparente com assento/painel por dentro, ESCAPES DE
// TITÂNIO com a coloração de calor (palha → roxo → azul) e pétalas, e ROTOR DETALHADO (cubo, punhos das pás, pontas pintadas,
// prato cíclico e hastes). Tudo procedural, no espaço do MODELO (atributo posM), sem texturas novas pesadas; 1 programa para todas as
// camuflagens (a escolha é uniforme). Puramente visual — nenhuma camuflagem de aeronave dá bônus.
import * as THREE from 'three';
import { CAMO_AEREO } from '../camoAereo.js';

/** Grava em cada geometria de pintura (material com userData.pele) a posição no espaço do modelo — painéis e camuflagem ficam contínuos entre as peças. */
export function marcaPosModelo(g) { g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), mt = new THREE.Matrix4(), v = new THREE.Vector3(), vistos = new Set();
  g.traverse((o) => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || Array.isArray(o.material) || !o.material || !o.material.userData.pele) return;
    if (vistos.has(o.geometry)) o.geometry = o.geometry.clone(); vistos.add(o.geometry); /* geometria compartilhada (asas espelhadas) → cópia própria */
    const pos = o.geometry.attributes.position, a = new Float32Array(pos.count * 3); mt.multiplyMatrices(inv, o.matrixWorld);
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mt); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; }
    o.geometry.setAttribute('posM', new THREE.BufferAttribute(a, 3)); });
  return g; }

const PAD = { liso: 0, manchas: 1, fragmentos: 2, digital: 3, ondas: 4 };
const GLSL_COMUM = `varying vec3 vPM; uniform vec3 uPC0; uniform vec3 uPC1; uniform vec3 uPC2; uniform vec3 uPCb; uniform float uPPad; uniform float uPTom; uniform float uPDet; uniform float uPSeed;
float pH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float pN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(pH(i), pH(i + vec2(1.0, 0.0)), f.x), mix(pH(i + vec2(0.0, 1.0)), pH(i + vec2(1.0, 1.0)), f.x), f.y); }
float pF(vec2 p){ return pN(p) * 0.55 + pN(p * 2.07 + 3.1) * 0.3 + pN(p * 4.3 + 7.7) * 0.15; }`;
/* juntas (1,7 × 0,9 m, fileiras desencontradas), portinholas, 2 fileiras de rebites, sujeira/escorridos; camuflagem por padrão; ventre claro */
const GLSL_COR = `float peleJ = 0.0, peleR = 0.0, peleS = 0.0;
if (length(fwidth(vPM)) > 1e-7) { vec3 P = vPM; vec3 Nf = normalize(cross(dFdx(P), dFdy(P))); vec3 An = abs(Nf); /* sem posM (malha antiga) → pele desligada */
  vec2 q = (An.x > An.y && An.x > An.z) ? P.zy : (An.y > An.z ? P.zx : P.xy);
  float pe = length(fwidth(P)); float lod = 1.0 - smoothstep(0.014, 0.045, pe), lodR = 1.0 - smoothstep(0.004, 0.012, pe);
  vec2 aa = fwidth(q) + 1e-5; /* derivadas FORA do desvio (fluxo uniforme) */
  if (lod > 0.001) { /* v1.2.71: longe (sem juntas visíveis) não calcula painéis/rebites — mesmo visual, menos custo na GPU do celular */
  vec2 cel = vec2(1.7, 0.9); float fil = floor(q.y / cel.y); cel.x *= 0.75 + 0.6 * pH(vec2(fil, 9.1)); vec2 gq = q / cel; gq.x += pH(vec2(fil, 3.7)) * 0.5; vec2 f = fract(gq), id = floor(gq);
  vec2 dm = min(f, 1.0 - f) * cel; float wj = 0.006;
  peleJ = max(1.0 - smoothstep(wj, wj + aa.x, dm.x), 1.0 - smoothstep(wj, wj + aa.y, dm.y));
  if (pH(id + uPSeed) < 0.1) { vec2 c0 = (f - 0.5) * cel, hs = cel * vec2(0.2, 0.26); float r = max(abs(c0.x) / hs.x, abs(c0.y) / hs.y); peleJ = max(peleJ, (1.0 - smoothstep(0.0, (wj + max(aa.x, aa.y)) / hs.x, abs(r - 1.0))) * 0.85); }
  peleJ *= lod;
  vec2 r1 = vec2(dm.x - 0.05, (fract(q.y / 0.12) - 0.5) * 0.12), r2 = vec2(dm.y - 0.045, (fract(q.x / 0.14) - 0.5) * 0.14); float ra = length(aa);
  if (lodR > 0.001) peleR = max(1.0 - smoothstep(0.009, 0.009 + ra, length(r1)), 1.0 - smoothstep(0.009, 0.009 + ra, length(r2))) * lodR; }
  float sj = pF(vec2(P.x * 0.5 + P.y * 0.3, P.z * 0.07) + uPSeed), mn = pF(P.xz * 0.33 + P.y * 0.21 + 11.0);
  peleS = smoothstep(0.56, 0.86, sj) * 0.6 + smoothstep(0.6, 0.9, mn) * 0.4;
  float vent = smoothstep(-0.12, -0.6, Nf.y);
  if (uPPad > 0.5) { vec2 cp = vec2(P.z - P.y * 0.6, P.x + P.y * 0.35) * 0.32; vec3 c;
    if (uPPad < 1.5) { float n = pF(cp * 0.9 + uPSeed), n2 = pF(cp * 1.3 + 17.0); c = mix(uPC0, uPC1, smoothstep(0.47, 0.5, n)); c = mix(c, uPC2, smoothstep(0.58, 0.61, n2)); }
    else if (uPPad < 2.5) { vec2 a1 = mat2(0.82, -0.57, 0.57, 0.82) * cp * 0.9, a2 = mat2(0.34, 0.94, -0.94, 0.34) * cp * 0.7; float h = pH(floor(a1) + floor(a2) * 7.13 + uPSeed); c = h < 0.38 ? uPC0 : (h < 0.72 ? uPC1 : uPC2); }
    else if (uPPad < 3.5) { vec2 px = floor(cp * 3.2) / 3.2; float n = pF(px * 0.9 + uPSeed), n2 = pF(px * 1.7 + 5.0); c = n < 0.45 ? uPC0 : (n < 0.6 ? uPC1 : uPC2); if (n2 > 0.68) c = uPC2; }
    else { float b = sin(cp.x * 1.6 + pF(cp * 0.6 + uPSeed) * 4.0 + cp.y * 0.4); c = mix(uPC0, uPC1, smoothstep(-0.1, 0.0, b)); c = mix(c, uPC2, smoothstep(0.62, 0.7, b)); }
    vec3 base = vec3(1.0);
    #ifdef USE_MAP
    base = sampledDiffuseColor.rgb; /* mantém janelas, portas, matrícula e manchas da textura */
    #ifndef USE_COLOR
    base /= 0.6;
    #endif
    #endif
    diffuseColor.rgb = mix(c, uPCb, vent) * uPTom * base; }
  else diffuseColor.rgb *= 1.0 + vent * 0.1;
  diffuseColor.rgb *= (1.0 - peleJ * 0.26 * uPDet) * (1.0 - peleS * 0.09 * uPDet); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.15 + 0.01, peleR * 0.4 * uPDet); }`;
const GLSL_RUG = 'roughnessFactor = clamp(roughnessFactor + (peleJ * 0.14 + peleS * 0.08 - peleR * 0.18) * uPDet, 0.04, 1.0);';
const GLSL_NOR = `{ float hh = (peleR * 0.0022 - peleJ * 0.0032) * uPDet; vec3 sp = -vViewPosition, dpx = dFdx(sp), dpy = dFdy(sp); vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1); vec2 dh = vec2(dFdx(hh), dFdy(hh)); vec3 gr = sign(det) * (dh.x * r1 + dh.y * r2); normal = normalize(abs(det) * normal - gr); }`;

const cor = (h) => new THREE.Color(h);
/** Aplica a pele NO material (encadeia um onBeforeCompile anterior, ex.: pintura do bombardeiro). camo = chave de CAMO_AEREO (liso → mantém a cor do material). */
export function aplicaPele(m, camo, tom = 1, det = 1) { const K = camo && camo !== 'padrao' ? CAMO_AEREO[camo] || null : null; let pad = K ? PAD[K.p || 'liso'] || 0 : 0;
  const liso = K && !pad && m.vertexColors; if (liso) pad = 1; /* pintura por vértice (hidroaviões-aves): o esquema liso cobre a peça inteira */
  const U = { uPC0: { value: cor(K ? K.c : '#808080') }, uPC1: { value: cor(K ? (liso ? K.c : K.c3 || K.c2) : '#808080') }, uPC2: { value: cor(K ? (liso ? K.c : K.c2) : '#808080') }, uPCb: { value: K ? (K.cv ? cor(K.cv) : cor(K.c).lerp(cor('#ffffff'), 0.22)) : cor('#a0a0a0') }, uPPad: { value: pad }, uPTom: { value: tom }, uPDet: { value: det }, uPSeed: { value: (camo || 'x').length * 1.37 } };
  const prev = Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') ? m.onBeforeCompile : null, kPrev = prev ? prev.toString() : '';
  m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 posM; varying vec3 vPM;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPM = posM;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GLSL_COMUM).replace('#include <alphamap_fragment>', GLSL_COR + '\n#include <alphamap_fragment>')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + GLSL_RUG).replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + GLSL_NOR); };
  m.customProgramCacheKey = () => 'pele1269|' + kPrev; m.userData.pele = 1; m.userData.camo = camo || 'padrao'; if (K && !pad && m.color) m.color.set(tom < 1 ? K.c2 : K.c); else if (pad && m.vertexColors && m.color) m.color.set('#ffffff'); m.needsUpdate = true; return m; }
const _PELE = new Map();
/** Cópia do material com a pele (cache por material × camuflagem × tom). */
export function peleAero(m0, camo, tom = 1) { const k = m0.uuid + '|' + (camo || 'padrao') + '|' + tom; let m = _PELE.get(k); if (!m) { m = aplicaPele(m0.clone(), CAMO_AEREO[camo] ? camo : null, tom); _PELE.set(k, m); } return m; }

/* ---------- titânio dos escapes: coloração de calor ao longo do bocal + pétalas ---------- */
let _TIT = null;
export function matTitanio() { if (_TIT) return _TIT; let map = null;
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 128);
    [[0, '#5b5f63'], [0.2, '#7f8387'], [0.4, '#5a6476'], [0.55, '#665f70'], [0.7, '#84765e'], [0.85, '#928772'], [1, '#66625c']].forEach(([p, h]) => gr.addColorStop(p, h)); x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 16; i++) { const px = i * 16; x.fillStyle = 'rgba(20,20,22,0.35)'; x.fillRect(px, 0, 1.4, 128); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(px + 2, 0, 1, 128); } /* pétalas */
    for (let i = 0; i < 900; i++) { const v = Math.random() * 50 | 0; x.fillStyle = `rgba(${v},${v},${v},0.12)`; x.fillRect(Math.random() * 256, Math.random() * 128, 2, 1); }
    map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; }
  _TIT = new THREE.MeshStandardMaterial({ color: '#ffffff', map, roughness: 0.34, metalness: 0.9, envMapIntensity: 1.35 }); return _TIT; }

/* ---------- cabine de vidro: transparente com película, assento/painel por dentro e arco do para-brisa ---------- */
const _VID = {};
export function matCupula(furtivo = 0) { const k = furtivo ? 'f' : 'n'; if (_VID[k]) return _VID[k];
  _VID[k] = new THREE.MeshPhysicalMaterial({ color: furtivo ? '#8a6a2c' : '#2a3a46', roughness: 0.03, metalness: furtivo ? 0.55 : 0.08, transparent: true, opacity: furtivo ? 0.62 : 0.4, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, side: THREE.DoubleSide });
  _VID[k].userData.cupula = 1; return _VID[k]; }
const _MI = {}; const matI = (k, c, r = 0.7, m = 0.2, e) => _MI[k] || (_MI[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r, metalness: m }, e ? { emissive: e, emissiveIntensity: 1.2 } : {})));
/** Interior visível pela cúpula: banheira escura, assento(s) ejetável(eis) com encosto de cabeça, painel com telas acesas e arco do para-brisa. */
export function interiorCabine(g) { g.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), add = [];
  g.traverse((o) => { if (!o.isMesh || !o.material || !o.material.userData || !o.material.userData.cupula || !o.geometry || o.geometry.type !== 'SphereGeometry') return;
    o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()); if (s.z < 0.9 || s.x < 0.6) return; add.push([o, c, s]); });
  for (const [o, c, s] of add) { const q = new THREE.Group(); const y0 = c.y - s.y * 0.18, duplo = s.x > 1.6 && s.z < 3.2, tandem = s.z > 4.2;
    const tub = new THREE.Mesh(new THREE.BoxGeometry(s.x * 0.74, s.y * 0.3, s.z * 0.8), matI('tub', '#1a1d20', 0.9, 0.1)); tub.position.set(c.x, y0 - s.y * 0.12, c.z); q.add(tub);
    const pos = duplo ? [[-s.x * 0.22, 0], [s.x * 0.22, 0]] : tandem ? [[0, -s.z * 0.16], [0, s.z * 0.2]] : [[0, s.z * 0.06]];
    for (const [dx, dz] of pos) { const as = new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.5, s.x * 0.36), s.y * 0.42, 0.14), matI('ass', '#2b2e25', 0.85, 0.1)); as.position.set(c.x + dx, y0 + s.y * 0.12, c.z + dz + 0.28); as.rotation.x = 0.22; q.add(as);
      const cb = new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.32, s.x * 0.24), 0.16, 0.12), matI('cab', '#14161a', 0.6, 0.3)); cb.position.set(c.x + dx, y0 + s.y * 0.4, c.z + dz + 0.36); q.add(cb); /* encosto de cabeça */
      const pn = new THREE.Mesh(new THREE.BoxGeometry(Math.min(0.62, s.x * 0.5), s.y * 0.2, 0.12), matI('pn', '#101214', 0.5, 0.2)); pn.position.set(c.x + dx, y0 + s.y * 0.05, c.z + dz - Math.min(0.9, s.z * 0.2)); pn.rotation.x = -0.35; q.add(pn);
      const tl = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(0.5, s.x * 0.4), s.y * 0.12), matI('tela', '#0b1a12', 0.4, 0, '#2f8f5a')); tl.position.set(c.x + dx, y0 + s.y * 0.06, c.z + dz - Math.min(0.9, s.z * 0.2) + 0.065); tl.rotation.x = -0.35; q.add(tl); }
    const ar = new THREE.Mesh(new THREE.TorusGeometry(s.x * 0.5, 0.035, 5, 18, Math.PI), matI('arco', '#202326', 0.5, 0.6)); ar.scale.y = (s.y * 0.95) / s.x; ar.position.set(c.x, c.y - s.y * 0.5, c.z - s.z * 0.18); q.add(ar); /* arco do para-brisa */
    for (const m of q.children) m.castShadow = false; g.add(q); }
  return g; }

/* ---------- rotor: cubo, punhos, pontas pintadas; prato cíclico e hastes de passo (fixos) ---------- */
export function detalhaRotor(g, rot, nPas, pa, M, ms) { if (!rot) return; const hub = ms(new THREE.CylinderGeometry(0.42, 0.48, 0.34, 14), M.esc); rot.add(hub); const tampa = ms(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.esc); tampa.position.y = 0.17; rot.add(tampa);
  for (let i = 0; i < nPas; i++) { const a = (i * Math.PI * 2) / nPas, s = Math.sin(a), c = Math.cos(a); const pu = ms(new THREE.BoxGeometry(0.26, 0.16, 0.85).translate(0, 0, 0.75), M.esc); pu.rotation.y = a; rot.add(pu);
    const am = ms(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 6), M.tit || M.esc); am.position.set(s * 0.95, 0.12, c * 0.95); rot.add(am); /* amortecedor/elastômero do punho */
    const pt = ms(new THREE.BoxGeometry(0.44, 0.06, pa * 0.07).translate(0, 0, pa * 0.965), M.ponta || M.claro); pt.rotation.y = a; rot.add(pt); } /* ponta da pá pintada (visível no giro) */
  const y = rot.position.y; const mastro = ms(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 10), M.tit || M.esc); mastro.position.y = y - 0.35; g.add(mastro);
  const pc = ms(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 16), M.esc); pc.position.y = y - 0.48; g.add(pc); const pc2 = ms(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 16), M.tit || M.esc); pc2.position.y = y - 0.4; g.add(pc2);
  for (let i = 0; i < nPas; i++) { const a = (i * Math.PI * 2) / nPas + 0.35; const h = ms(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 5), M.esc); h.position.set(Math.sin(a) * 0.4, y - 0.22, Math.cos(a) * 0.4); g.add(h); } }

/** Escapes de turbina do helicóptero (titânio), um de cada lado atrás do mastro, voltados para trás e para fora. */
export function escapesHeli(g, y, z, x, M, ms) { for (const sx of [-1, 1]) { const e = ms(new THREE.CylinderGeometry(0.2, 0.26, 0.9, 12).rotateX(Math.PI / 2), M.tit || M.esc); e.position.set(sx * x, y, z); e.rotation.y = sx * 0.35; g.add(e); const bo = ms(new THREE.CircleGeometry(0.19, 12), M.esc); bo.position.set(sx * (x + 0.16), y, z + 0.44); bo.rotation.y = sx * 0.35; g.add(bo); } }
