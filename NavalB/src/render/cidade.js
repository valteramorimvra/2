// v1.2.0 (revisão visual) — cidade costeira procedural: prédios instanciados (InstancedMesh, 1 draw call por bloco)
// com janelas que ACENDEM ao entardecer/noite, holofotes, boias com luz e reflexos dourados falsos na água.
// Tudo gerado em canvas/código (sem assets externos).
import * as THREE from 'three';
const LUZES = new Set(); let NOITE = 0;
/** Registra um material cuja emissão segue a hora (0 = dia, ~0,5 = entardecer, 1 = noite). */
export function registraLuz(m, max = 1) { m.userData.luzMax = max; LUZES.add(m); m.emissiveIntensity = NOITE * max; if (m.opacity !== undefined && m.userData.opac) { m.opacity = NOITE * m.userData.opac; m.visible = m.opacity > 0; } return m; } /* v1.2.21 desempenho: halo aditivo com opacidade 0 (dia) não soma nada à imagem — material invisível = sem chamada de desenho */
export function luzCidade(f) { NOITE = f; for (const m of LUZES) { if (m.userData.opac) { m.opacity = f * m.userData.opac; m.visible = m.opacity > 0; } else m.emissiveIntensity = f * m.userData.luzMax; } }
export const fatorHora = (hora) => (hora === 'noite' ? 1 : hora === 'entardecer' ? 0.6 : 0);
let sd = 1; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
let TJ = null;
function texFachada() { if (TJ) return TJ; const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d'); const e = document.createElement('canvas'); e.width = 128; e.height = 256; const y = e.getContext('2d');
  x.fillStyle = '#9aa3ab'; x.fillRect(0, 0, 128, 256); y.fillStyle = '#000'; y.fillRect(0, 0, 128, 256); sd = 77;
  for (let r = 0; r < 32; r++) for (let k = 0; k < 8; k++) { const px = 4 + k * 15.5, py = 4 + r * 7.9; const on = rnd() < 0.62; x.fillStyle = on ? '#3b4650' : '#2a323a'; x.fillRect(px, py, 10, 5);
    if (on) { const q = rnd(); y.fillStyle = q < 0.6 ? '#ffcf87' : q < 0.85 ? '#fff1d6' : '#9fd3ff'; y.fillRect(px, py, 10, 5); } }
  const a = new THREE.CanvasTexture(c), b = new THREE.CanvasTexture(e); for (const t of [a, b]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; } TJ = [a, b]; return TJ; }
/** Bloco de prédios 3D ao longo de uma faixa (larg × prof), centrado na origem (mar no lado −z). v1.2.0 rev.2: janelas por
 * SHADER em coordenadas de mundo (≈3,2 × 3,6 m por andar, o mesmo tamanho em qualquer prédio — nada de recorte esticado),
 * aceso aleatório por prédio/andar, térreo com vitrines, arranha-céus com coroa acesa e luz de obstáculo vermelha. */
export function skyline(n, larg, prof, seed = 3, altMax = 120) { sd = seed * 7919 + 13;
  const mat = registraLuz(new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', roughness: 0.75, metalness: 0.15 }), 1.0);
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 vWp; varying vec3 vNo; varying float vId; varying float vH; varying float vYl;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vec4 wq = modelMatrix * instanceMatrix * vec4(position, 1.0); vWp = wq.xyz; vNo = normal; vId = float(gl_InstanceID); vH = instanceMatrix[3][1] + instanceMatrix[1][1]; /* v1.2.17: topo absoluto (torre recuada sobre embasamento) */ vYl = (instanceMatrix * vec4(position, 1.0)).y;');
    sh.fragmentShader = 'varying vec3 vWp; varying vec3 vNo; varying float vId; varying float vH; varying float vYl;\nfloat hj(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
        float lat = abs(vNo.y) < 0.5 ? 1.0 : 0.0; float hc = abs(vNo.x) > 0.5 ? vWp.z : vWp.x; float yl = vYl;
        vec2 cel = vec2(floor(hc / 3.2), floor(yl / 3.6)); vec2 fq = fract(vec2(hc / 3.2, yl / 3.6));
        float vidro = step(hj(vec2(vId, 5.0)), 0.3); /* v1.2.17 item 3: 30% torres de PELE DE VIDRO (caixilho fino), resto concreto com janelas recuadas */
        float jan = lat * mix(step(0.16, fq.x) * step(fq.x, 0.84) * step(0.22, fq.y) * step(fq.y, 0.82), step(0.04, fq.x) * step(0.1, fq.y) * step(fq.y, 0.94), vidro) * step(4.5, yl);
        float rnd = hj(cel + vec2(vId * 7.13, vId * 3.1)); float aceso = jan * step(rnd, 0.28 + 0.25 * hj(vec2(vId, 2.0)));
        float aa = clamp(1.6 - max(fwidth(hc / 3.2), fwidth(yl / 3.6)) * 2.2, 0.0, 1.0); /* antisserrilhado: longe vira média */
        float frac = 0.28 + 0.25 * hj(vec2(vId, 2.0)); float jm = lat * step(4.5, yl) * 0.37; jan = mix(jm, jan, aa); aceso = mix(jm * frac * 0.9, aceso, aa);
        float terreo = lat * step(yl, 4.2) * step(0.8, yl); float coroa = lat * step(150.0, vH) * step(vH - 7.0, yl);
        vec3 fach = diffuseColor.rgb * (0.55 + 0.25 * hj(vec2(vId, 9.0))); fach *= 1.0 - 0.5 * (1.0 - lat); float nt = clamp(emissive.r, 0.0, 1.0); fach *= 1.0 - 0.9 * nt; /* à noite a fachada some no escuro e só as janelas aparecem */
        float laje = lat * (1.0 - step(0.1, fq.y)) * (1.0 - vidro) * aa; fach *= 1.0 + 0.18 * laje; /* laje/peitoril aparente por andar */
        float pein = lat * (1.0 - step(0.16, fq.x) + step(0.84, fq.x)) * step(0.22, fq.y) * step(fq.y, 0.82) * (1.0 - vidro) * aa; fach *= 1.0 - 0.12 * pein; /* sombra do recuo da janela */
        vec3 Vv = normalize(cameraPosition - vWp); float fr = pow(1.0 - abs(dot(normalize(vNo), Vv)), 3.0); vec3 ceu = mix(vec3(0.30, 0.37, 0.44), vec3(0.58, 0.66, 0.74), clamp(yl / 200.0, 0.0, 1.0)) * (1.0 - 0.85 * nt);
        vec3 corVid = mix(vec3(0.10, 0.14, 0.18), ceu, 0.35 + 0.55 * fr) * (0.85 + 0.3 * hj(cel * 0.37 + vId));
        diffuseColor.rgb = mix(fach, mix(vec3(0.08, 0.1, 0.13), corVid, vidro), jan * 0.85);
        float tint = hj(cel * 1.7 + vId); vec3 corJ = tint < 0.7 ? vec3(1.0, 0.66, 0.32) : tint < 0.93 ? vec3(1.0, 0.84, 0.58) : vec3(0.6, 0.8, 1.0);
        vec3 brilho = corJ * aceso * (1.1 + 1.0 * rnd) + vec3(1.0, 0.8, 0.5) * terreo * 0.7 + vec3(1.0, 0.92, 0.75) * coroa * 2.2;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance = emissive * brilho;'); };
  mat.customProgramCacheKey = () => 'predios3';
  const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0); const im = new THREE.InstancedMesh(geo, mat, n * 2); /* v1.2.17 item 3: até 2 volumes por prédio (embasamento + torre recuada) — silhueta sem "blocos" */ const tetos = []; const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), cor = new THREE.Color();
  const altos = []; let k = 0;
  for (let i = 0; i < n; i++) { const u = rnd() - 0.5; const arr = rnd() < (n > 200 ? 0.06 : 0.13); /* v1.2.17 item 36: em orla grande, poucos arranha-céus num tecido denso de médios (silhueta de cidade real) */ const w = arr ? 28 + rnd() * 18 : 14 + rnd() * 30, d = arr ? 26 + rnd() * 16 : 14 + rnd() * 24; /* v1.2.17 item 36: arranha-céus com esbeltez real (≈ 1:6–1:8), não 'agulhas' */
    let h = 12 + Math.pow(rnd(), 1.5) * altMax * (1 - Math.abs(u) * 1.1); if (arr) h = Math.max(h, altMax * (1.3 + rnd() * 0.8) * (1 - Math.abs(u) * 0.9));
    h = Math.round(Math.max(10, h) / 3.6) * 3.6 + 0.4; const z = (rnd() - 0.5) * prof + (arr ? prof * 0.15 : 0);
    { const r0 = rnd(); if (r0 < 0.5) cor.setHSL(0.08 + rnd() * 0.05, 0.06 + rnd() * 0.08, 0.42 + rnd() * 0.24); else if (r0 < 0.75) cor.setHSL(0.57 + rnd() * 0.05, 0.05 + rnd() * 0.05, 0.36 + rnd() * 0.22); else if (r0 < 0.88) cor.setHSL(0.03 + rnd() * 0.03, 0.22 + rnd() * 0.12, 0.34 + rnd() * 0.14); else cor.setHSL(0.1, 0.03, 0.62 + rnd() * 0.12); } /* v1.2.17 item 36: paleta urbana real — concreto/arenito, cinza-azulado, tijolo e poucos brancos (antes tudo claro = 'blocos brancos') */ let wT = w, dT = d;
    if (h > 34 && rnd() < 0.62) { const h1 = Math.round(h * (0.3 + rnd() * 0.35) / 3.6) * 3.6 + 0.4; wT = w * (0.62 + rnd() * 0.22); dT = d * (0.62 + rnd() * 0.22); const ox = (rnd() - 0.5) * (w - wT) * 0.8; /* embasamento largo + torre recuada (setback) */
      p.set(u * larg, 0, z); s.set(w, h1, d); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, cor); k++; tetos.push([p.x, h1, z, w, d, 1]); p.set(u * larg + ox, h1, z); s.set(wT, h - h1, dT); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, cor); k++; p.x = u * larg + ox; }
    else { p.set(u * larg, 0, z); s.set(w, h, d); m.compose(p, q, s); im.setMatrixAt(k, m); im.setColorAt(k, cor); k++; }
    if (h > 150) altos.push([p.x, h, z, wT, dT]); else tetos.push([p.x, h, z, wT, dT, 0]); }
  im.count = k; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.userData.tetos = tetos; im.name = 'skyline'; im.userData.altos = altos; return im; }
/** v1.2.17 item 3: equipamentos de COBERTURA (casas de máquinas, condensadoras, caixas-d'água, platibanda) — tira o aspecto de bloco liso. */
function coberturas(tetos) { const g = new THREE.Group(); if (!tetos.length) return g; sd = 4271; const mt = new THREE.MeshStandardMaterial({ color: '#8a9096', roughness: 0.85, metalness: 0.1 }), mc = new THREE.MeshStandardMaterial({ color: '#6c7379', roughness: 0.7, metalness: 0.3 });
  const nB = tetos.length * 3, ib = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), mt, nB), ic = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 10).translate(0, 0.5, 0), mc, tetos.length); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(); let kb = 0, kc = 0;
  for (const [x, h, z, w, d, emb] of tetos) { if (!emb) { p.set(x + (rnd() - 0.5) * w * 0.3, h, z + (rnd() - 0.5) * d * 0.3); s.set(w * (0.22 + rnd() * 0.15), 3.2 + rnd() * 1.6, d * (0.22 + rnd() * 0.15)); m.compose(p, q, s); ib.setMatrixAt(kb++, m); } /* casa de máquinas */
    for (let j = 0; j < (emb ? 2 : 1); j++) { p.set(x + (rnd() - 0.5) * w * 0.7, h, z + (rnd() - 0.5) * d * 0.7); s.set(2.2 + rnd() * 2.5, 1.2 + rnd() * 0.8, 1.6 + rnd() * 1.6); m.compose(p, q, s); ib.setMatrixAt(kb++, m); } /* condensadoras */
    if (!emb && h < 90 && rnd() < 0.55) { p.set(x + (rnd() - 0.5) * w * 0.5, h, z + (rnd() - 0.5) * d * 0.5); s.set(3.4, 4.2, 3.4); m.compose(p, q, s); ic.setMatrixAt(kc++, m); } } /* caixa-d'água */
  ib.count = kb; ic.count = kc; ib.instanceMatrix.needsUpdate = ic.instanceMatrix.needsUpdate = true; g.add(ib, ic); g.name = 'coberturas'; return g; }
/** Coroas (topo aceso) e luzes de obstáculo vermelhas dos arranha-céus. */
function coroas(altos) { const g = new THREE.Group(); if (!altos.length) return g;
  const mt = registraLuz(new THREE.MeshStandardMaterial({ color: '#2a3138', emissive: '#bfe0ff', roughness: 0.4 }), 1.6); const mr = registraLuz(new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff2a1a' }), 3);
  const ia = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.5, 1, 4, 1).rotateY(Math.PI / 4).translate(0, 0.5, 0), mt, altos.length); const ib = new THREE.InstancedMesh(new THREE.SphereGeometry(1.1, 8, 6), mr, altos.length * 2); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  altos.forEach(([x, h, z, w, d], i) => { p.set(x, h, z); s.set(w * 0.8, 6 + w * 0.25, d * 0.8); m.compose(p, q, s); ia.setMatrixAt(i, m); const ht = h + 6 + w * 0.25; m.makeTranslation(x, ht + 9, z); ib.setMatrixAt(i * 2, m); m.makeTranslation(x + w * 0.38, h + 1, z - d * 0.38); ib.setMatrixAt(i * 2 + 1, m); });
  const an = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.6, 10, 5).translate(0, 5, 0), new THREE.MeshStandardMaterial({ color: '#30363c' }), altos.length); altos.forEach(([x, h, z, w], i) => { m.makeTranslation(x, h + 6 + w * 0.25 - 0.5, z); an.setMatrixAt(i, m); });
  g.add(ia, ib, an); g.name = 'coroas'; return g; }
/** Serra escura atrás da cidade (silhueta irregular, low-poly). */
export function montanhas(larg, alt = 320, seed = 5) { sd = seed * 31 + 7; const N = 90, pos = [], idx = []; let a = 0.5, v = 0;
  for (let i = 0; i <= N; i++) { v += (rnd() - 0.5) * 0.35; v *= 0.9; a = 0.55 + 0.35 * Math.sin(i * 0.17 + seed) + v; const x = (i / N - 0.5) * larg, h = alt * Math.max(0.25, a) * (1 - Math.pow(Math.abs(i / N - 0.5) * 1.6, 3) * 0.5);
    pos.push(x, -5, 60, x, h * 0.55, 20 + rnd() * 30, x + (rnd() - 0.5) * 20, h, -10 + rnd() * 20); }
  for (let i = 0; i < N; i++) { const b = i * 3, c = b + 3; for (const k of [0, 1]) idx.push(b + k, c + k, b + k + 1, c + k, c + k + 1, b + k + 1); }
  const gm = new THREE.BufferGeometry(); gm.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gm.setIndex(idx); gm.computeVertexNormals();
  const me = new THREE.Mesh(gm, new THREE.MeshStandardMaterial({ color: '#1c2329', roughness: 1, metalness: 0, flatShading: true, side: THREE.DoubleSide })); me.name = 'montanhas'; return me; }
let TS = null;
/** Reflexos ALONGADOS: faixas verticais tremidas que saem de cada luz forte e correm sobre a água em direção ao observador. */
function rastros(larg, prof, altos, n = 34) { if (!TS) { const c = document.createElement('canvas'); c.width = 32; c.height = 256; const x = c.getContext('2d'); sd = 19;
    for (let y = 0; y < 256; y++) { const f = Math.pow(y / 256, 0.8); for (let k = 0; k < 3; k++) { if (rnd() < 0.55) { const w = 6 + rnd() * 20, x0 = 16 - w / 2 + (rnd() - 0.5) * 8; const gr = x.createLinearGradient(x0, 0, x0 + w, 0); const a = f * (0.35 + rnd() * 0.6); gr.addColorStop(0, 'rgba(255,190,90,0)'); gr.addColorStop(0.5, `rgba(255,${200 + rnd() * 40 | 0},${110 + rnd() * 50 | 0},${a})`); gr.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = gr; x.fillRect(x0, y, w, 1); } } }
    TS = new THREE.CanvasTexture(c); TS.colorSpace = THREE.SRGBColorSpace; }
  const m = new THREE.MeshBasicMaterial({ map: TS, color: '#ffb54d', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); m.userData.opac = 0.85; registraLuz(m);
  const geo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0).rotateX(-Math.PI / 2); const im = new THREE.InstancedMesh(geo, m, n); const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const al = altos[i % Math.max(1, altos.length)]; const x = al && i < altos.length * 2 ? al[0] + (rnd() - 0.5) * 30 : (rnd() - 0.5) * larg * 0.9; const forte = al && i < altos.length * 2;
    p.set(x, 2.6, -prof * 0.62); s.set((forte ? 22 : 12) + rnd() * 22, 1, (forte ? 0.9 : 0.45) * prof * (3 + rnd() * 3.5)); mt.compose(p, q, s); im.setMatrixAt(i, mt); }
  im.renderOrder = 3; im.name = 'rastros'; return im; }
/** Luzes do cais (fileira de pontos amarelos na borda) — InstancedMesh emissivo. */
function luzesCais(larg, z, n = 40) { const m = registraLuz(new THREE.MeshStandardMaterial({ color: '#332200', emissive: '#ffc46b' }), 3); const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.9, 6, 4), m, n); const mt = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { mt.makeTranslation(((i + 0.5) / n - 0.5) * larg, 7, z); im.setMatrixAt(i, mt); } return im; }
/** Feixe de holofote (cone aditivo, aparece à noite). */
export function holofote(h = 260, ang = 0.15) { const g = new THREE.CylinderGeometry(1.5, h * Math.tan(ang), h, 16, 1, true).translate(0, -h / 2, 0).rotateX(Math.PI);
  const m = new THREE.MeshBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }); m.userData.opac = 0.12; registraLuz(m);
  const b = new THREE.Mesh(g, m); b.name = 'holofote'; return b; }
/** Boia de canal (vermelha/verde) com luz. */
export function boia(cor = '#dc2626') { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 3.2, 10).translate(0, 1.2, 0), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5 })); g.add(c);
  const t = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6, 8).translate(0, 3.6, 0), c.material); g.add(t); const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), registraLuz(new THREE.MeshStandardMaterial({ color: cor, emissive: cor }), 3)); l.position.y = 4.6; g.add(l); return g; }
let TR = null;
/** Reflexos dourados falsos das luzes da cidade (plano aditivo com riscos verticais, só à noite/entardecer). */
export function reflexos(larg, prof) { if (!TR) { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256); sd = 5;
    for (let i = 0; i < 900; i++) { const px = rnd() * 256, py = rnd() * 256, a = 0.15 + rnd() * 0.5; x.fillStyle = `rgba(255,${170 + rnd() * 60 | 0},${90 + rnd() * 60 | 0},${a * (1 - py / 300)})`; x.fillRect(px, py, 1 + rnd() * 2.5, 0.6 + rnd() * 1.2); }
    TR = new THREE.CanvasTexture(c); TR.wrapS = TR.wrapT = THREE.RepeatWrapping; TR.repeat.set(3, 1); }
  const m = new THREE.MeshBasicMaterial({ map: TR, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); m.userData.opac = 0.9; registraLuz(m);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(larg, prof), m); p.rotation.x = -Math.PI / 2; p.position.y = 0.4; p.renderOrder = 2; p.name = 'reflexos'; return p; }
/** Orla completa: prédios 3D + coroas + cais com luzes + holofotes + reflexos alongados (+ serra escura opcional). */
export function orla(larg = 1400, prof = 220, seed = 3, n = 90, alt = 100, opc = {}) { const g = new THREE.Group(); const sk = skyline(n, larg, prof, seed, alt); g.add(sk); g.add(coberturas(sk.userData.tetos || [])); g.add(coroas(sk.userData.altos));
  const chao = new THREE.Mesh(new THREE.BoxGeometry(larg * 1.1, 6, prof * 1.3).translate(0, -2, 0), new THREE.MeshStandardMaterial({ color: '#3f454b', roughness: 0.95 })); g.add(chao);
  const muro = new THREE.Mesh(new THREE.BoxGeometry(larg * 1.1, 2.2, 3).translate(0, 1.1, 0), new THREE.MeshStandardMaterial({ color: '#5b6066', roughness: 0.9 })); muro.position.z = -prof * 0.65; g.add(muro);
  g.add(luzesCais(larg * 1.05, -prof * 0.66, Math.round(larg / 28)));
  for (let i = 0; i < 4; i++) { const h = holofote(); h.position.set((i / 3 - 0.5) * larg * 0.6, 4, 0); h.rotation.z = (i % 2 ? 1 : -1) * 0.25; h.rotation.x = -0.12; g.add(h); }
  const rf = reflexos(larg, prof * 2.6); rf.position.z = -prof * 1.9; g.add(rf); g.add(rastros(larg, prof, sk.userData.altos, Math.round(n * 0.5)));
  if (opc.montes) { const mo = montanhas(larg * 1.6, opc.montes, seed); mo.position.z = prof * 1.6 + 120; g.add(mo); }
  g.name = 'orla'; return g; }
