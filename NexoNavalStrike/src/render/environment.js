// Ambiente: céu físico simples (gradiente + sol + nuvens + estrelas), oceano de Gerstner em GLSL com normais por pixel,
// fresnel, reflexo do céu, especular do sol, espuma nas cristas e na arrebentação, névoa; luzes e sombras.
import * as THREE from 'three';
import { luzCidade, fatorHora } from './cidade.js';
import { ONDAS, NUKE_ONDAS } from '../sim/ocean.js';
/* v1.2.14 PERSPECTIVA AÉREA: antes de qualquer compilação, o trecho de névoa do three também DESSATURA com a distância (névoa original mantida; aditivos não ganham brilho) (silhuetas distantes azuladas/cinzentas, sem contorno duro). Mesmo número de programas (só muda o texto do chunk). */
if (!THREE.ShaderChunk.fog_fragment.includes('aerea1214')) THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace('gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );', '/* aerea1214 */ float fAe = smoothstep( 6000.0, 22000.0, vFogDepth ); /* v1.2.15: só além de ~6 km e no máx. 30% (1.2.14: 4%/km até 60% → cinza chapado) */ float lAe = dot( gl_FragColor.rgb, vec3( 0.299, 0.587, 0.114 ) ); gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3( lAe ), fAe * 0.3 ); gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );');
import { shadersAgua, CORES_AGUA, MAX_CASCOS, LUZ_ESPUMA } from '../naval5v5/agua.js';
import { GLSL_GERSTNER, NW } from '../naval5v5/gerstner.js';

export const TEMPOS = {
  dia: { el: 50, az: 0.9, zen: '#2f6db8', hor: '#b6d1e4', sol: '#fff1dc', is: 2.6, hemi: 0.9, agua: '#0a3550', raso: '#1f8a91', neb: 0.000075 },
  entardecer: { luzAgua: 0.85, el: 8, az: -1.2, zen: '#4d68a6', hor: '#f2a66c', sol: '#ffd3a6', is: 1.5, hemi: 0.8, agua: '#11324a', raso: '#2b6a6c', neb: 0.0001 },
  noite: { el: 34, az: 2.6, zen: '#06101f', hor: '#1a2b44', sol: '#b4c8ea', is: 0.85, hemi: 0.55, luzAgua: 0.55, expo: 1.25, agua: '#030b14', raso: '#082028', neb: 0.00013, noite: 1 },
};
const GLSL_CEU = `uniform vec3 uSol; uniform vec3 uCorSol; uniform vec3 uZen; uniform vec3 uHor; uniform float uNoite; uniform float uNuvem;
vec3 ceu(vec3 d){ float h = max(d.y, 0.0); vec3 c = mix(uHor, uZen, pow(h, 0.5)); float s = max(dot(d, uSol), 0.0); c += uCorSol * (pow(s, 6.0) * 0.25 + pow(s, 64.0) * 0.5) * (1.0 - uNuvem * 0.7);
  if (d.y < 0.0) c = mix(uHor, uHor * 0.72, clamp(-d.y * 4.0, 0.0, 1.0)); return mix(c, vec3(dot(c, vec3(0.3, 0.4, 0.3))) * 0.9, uNuvem * 0.55); }`;
const GLSL_ONDAS = GLSL_GERSTNER; // fonte única com a física (naval5v5/gerstner.js)
// (v1.1.0) o shader do mar foi para naval5v5/agua.js
const VS_CEU = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w * 0.99999; }`;
const FS_CEU = GLSL_CEU + `
varying vec3 vW; uniform float uChuva; uniform float uT2;
float hs(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float hs2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ns(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs2(i), hs2(i + vec2(1, 0)), f.x), mix(hs2(i + vec2(0, 1)), hs2(i + vec2(1, 1)), f.x), f.y); }
void main(){ vec3 d = normalize(vW - cameraPosition); vec3 c = ceu(d); float s = dot(d, uSol); c += uCorSol * smoothstep(0.99955, 0.99975, s) * 3.0 * (1.0 - uChuva) * (1.0 - uNuvem);
  if (d.y > 0.0) { vec2 p = d.xz / (d.y + 0.08) * 1.6 + vec2(uT2 * 0.004, 0.0); float n = ns(p) * 0.5 + ns(p * 2.1) * 0.3 + ns(p * 4.3) * 0.2; float cob = mix(0.62, 0.3, uNuvem);
    float nuv = smoothstep(cob, cob + 0.25, n) * smoothstep(0.0, 0.12, d.y); vec3 cn = mix(uHor * 1.05, vec3(1.0), 0.45) * (0.55 + 0.45 * max(uSol.y, 0.0)) + uCorSol * 0.12; if (uNoite > 0.0) cn = uHor * 1.2; c = mix(c, cn, nuv * 0.85); }
  if (uNoite > 0.0 && d.y > 0.0) { vec3 q = floor(d * 380.0); float h = hs(q); c += vec3(0.85, 0.9, 1.0) * step(0.9975, h) * uNoite * (0.5 + 0.5 * hs(q + 1.0)) * (1.0 - uChuva) * (1.0 - uNuvem); }
  gl_FragColor = vec4(c, 1.0); }`;

/** Malha polar do oceano: anéis com espaçamento crescente (≈1,5 m perto da câmera, km no horizonte). */
function geoOceano(nivel) {
  const nA = [96, 128, 192][nivel], nR = [70, 90, 120][nivel], d0 = [2.6, 1.9, 1.4][nivel], RMAX = 22000; const pos = [], idx = []; let r = 0;
  let lo = 1.0001, hi = 1.5; for (let k = 0; k < 60; k++) { const g = (lo + hi) / 2; if (d0 * (Math.pow(g, nR) - 1) / (g - 1) > RMAX) hi = g; else lo = g; } const gq = (lo + hi) / 2;
  for (let j = 0; j <= nR; j++) { r = j === 0 ? 0 : d0 * (Math.pow(gq, j) - 1) / (gq - 1); for (let i = 0; i < nA; i++) { const a = (i / nA) * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
  for (let j = 0; j < nR; j++) for (let i = 0; i < nA; i++) { const a = j * nA + i, b = j * nA + ((i + 1) % nA), c = (j + 1) * nA + i, d = (j + 1) * nA + ((i + 1) % nA); idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.userData.raio = r; return g;
}

export class Ambiente {
  constructor(cena, renderer) {
    this.cena = cena; this.R = renderer;
    this.uC = { uSol: { value: new THREE.Vector3(0, 1, 0) }, uCorSol: { value: new THREE.Color() }, uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uNoite: { value: 0 }, uNuvem: { value: 0 }, uChuva: { value: 0 }, uT2: { value: 0 } };
    this.uM = Object.assign({}, this.uC, { uT: { value: 0 }, uW: { value: Array.from({ length: NW }, () => new THREE.Vector4()) }, uQ: { value: Array.from({ length: NW }, () => new THREE.Vector4()) }, uAgua: { value: new THREE.Color() }, uRaso: { value: new THREE.Color() }, uProf: { value: null }, uTam: { value: 12000 }, uNeb: { value: 0.0001 }, uFog: { value: new THREE.Color() }, uFundo: { value: new THREE.Color(CORES_AGUA.fundo) }, uCosta: { value: new THREE.Color(CORES_AGUA.costa) }, uCrista: { value: new THREE.Color(CORES_AGUA.crista) }, uLuzAgua: { value: 1 }, uAmp: { value: 1 },
      uCas: { value: Array.from({ length: MAX_CASCOS }, () => new THREE.Vector4()) }, uDim: { value: Array.from({ length: MAX_CASCOS }, () => new THREE.Vector4()) }, uCurv: { value: new Float32Array(MAX_CASCOS) }, uNC: { value: 0 },
      uNk: { value: new THREE.Vector4(0, 0, 0, 0) }, uNkP: { value: new THREE.Vector4(0, 0, 0, 0) } /* v1.2.30 item 9: anel nuclear (ativo=0 → custo zero no VS) */ });
    this.ceu = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), new THREE.ShaderMaterial({ uniforms: this.uC, vertexShader: VS_CEU, fragmentShader: FS_CEU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    this.ceu.renderOrder = -10; this.ceu.frustumCulled = false; cena.add(this.ceu);
    this.sol = new THREE.DirectionalLight('#ffffff', 2); this.sol.castShadow = false; this.sol.shadow.mapSize.set(2048, 2048); this.sol.shadow.bias = -0.0004; this.sol.shadow.normalBias = 0.6; const sc = this.sol.shadow.camera; sc.left = sc.bottom = -170; sc.right = sc.top = 170; sc.near = 10; sc.far = 1600; cena.add(this.sol); cena.add(this.sol.target);
    this.hemi = new THREE.HemisphereLight('#bcd4ea', '#1d2a33', 0.8); cena.add(this.hemi);
    cena.fog = new THREE.FogExp2('#b6d1e4', 0.0001); this.nivel = -1;
  }
  criaMar(nivel) { if (this.nivel === nivel && this.mar) return; if (this.mar) { this.cena.remove(this.mar); this.mar.geometry.dispose(); } this.nivel = nivel;
    const sh = shadersAgua(GLSL_CEU, nivel); this.mar = new THREE.Mesh(geoOceano(nivel), new THREE.ShaderMaterial({ uniforms: this.uM, vertexShader: sh.vs, fragmentShader: sh.fs, fog: false, side: THREE.DoubleSide, precision: 'highp' /* v1.2.16: highp explícito (tempo, coordenadas de mundo e máscara do casco) */ })); this.mar.name = 'oceano'; this.mar.frustumCulled = false; this.mar.renderOrder = -1; this.cena.add(this.mar); }
  profundidade(T) { const n = T.n, px = new Uint8Array(n * n * 4); for (let i = 0; i < n * n; i++) { const v = Math.max(0, Math.min(1, -T.h[i] / 150)) * 255; px[i * 4] = v; px[i * 4 + 3] = 255; } const t = new THREE.DataTexture(px, n, n); t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; this.uM.uProf.value = t; this.uM.uTam.value = T.tam; }
  ondas() { let amp = 0; ONDAS.forEach((w, i) => { this.uM.uW.value[i].set(w.dx, w.dz, w.A, w.k); this.uM.uQ.value[i].set(w.Q, w.c, 0, 0); amp += w.A; }); this.uM.uAmp.value = amp; }
  /** Cascos para a espuma de interseção (até MAX_CASCOS, os mais próximos da câmera primeiro). */
  cascos(lista, n) { const C = this.uM.uCas.value, D = this.uM.uDim.value; const k = Math.min(n, MAX_CASCOS, this.nivel === 0 ? 4 : MAX_CASCOS); for (let i = 0; i < k; i++) { const s = lista[i]; C[i].set(s.x, s.z, Math.cos(s.rumo), Math.sin(s.rumo)); const kv = s._escV || 1; D[i].set(s.C.L * 0.5 * kv, s.C.B * 0.5 * kv /* v1.2.14: linha d'água real (tumblehome alarga na água) e escala visual de navio distante */, Math.abs(s.v), s.morto || s.afunda || s._hor ? 0 : Math.max(1, s.C.F * kv)); /* v1.2.14: w = borda livre (máscara por altura da água) */ { const v = Math.abs(s.v), w = s.w || 0; const kk = v > 1.5 && !s.morto ? Math.max(-0.02, Math.min(0.02, w / v)) : 0; s._kE = (s._kE || 0) + (kk - (s._kE || 0)) * 0.15; this.uM.uCurv.value[i] = s._kE; } /* v1.2.19 item 3: curvatura da trajetória → esteira curva (suavizada, raio mín. 50 m) */ /* v1.2.14: além do horizonte sem máscara */ } /* v1.2.13: w = máscara do casco (vivo) */ this.uM.uNC.value = k; }
  aplica(hora, tempo) {
    luzCidade(fatorHora(hora)); // janelas da cidade/navios, holofotes e reflexos acendem ao entardecer e à noite
    const tp = TEMPOS[hora] || TEMPOS.dia; const nub = tempo === 'nublado' ? 0.75 : tempo === 'chuva' ? 1 : 0; this.hora = hora; this.tempo = tempo;
    const el = tp.el / 57.3; const s = new THREE.Vector3(Math.sin(tp.az) * Math.cos(el), Math.sin(el), -Math.cos(tp.az) * Math.cos(el)); this.dirSol = s;
    this.uC.uSol.value.copy(s); this.uC.uCorSol.value.set(tp.sol); this.uC.uZen.value.set(tp.zen); this.uC.uHor.value.set(tp.hor); this.uC.uNoite.value = tp.noite ? 1 : 0; this.uC.uNuvem.value = nub; this.uC.uChuva.value = tempo === 'chuva' ? 1 : 0;
    if (nub) { this.uC.uZen.value.lerp(new THREE.Color(tp.noite ? '#05080d' : '#6f7c88'), nub * 0.8); this.uC.uHor.value.lerp(new THREE.Color(tp.noite ? '#0b1119' : '#9aa6b0'), nub * 0.7); }
    this.uM.uAgua.value.set(tp.agua); this.uM.uRaso.value.set(tp.raso); this.uM.uLuzAgua.value = (tp.luzAgua || 1) * (1 - nub * 0.25); this.expo = tp.expo || 1; const neb = tp.neb * (tempo === 'chuva' ? 2.6 : nub ? 1.5 : 1); this.uM.uNeb.value = neb;
    { const lz = Math.min(1, this.uM.uLuzAgua.value * (0.2 + 0.8 * Math.min(1, Math.max(0, s.y) * 2.4))); LUZ_ESPUMA.value.copy(this.uC.uHor.value).lerp(new THREE.Color(1, 1, 1), 0.55).multiplyScalar(lz); } /* v1.2.18 item 4: esteira iluminada pela cena */ this.uM.uFog.value.copy(this.uC.uHor.value); this.cena.fog.color.copy(this.uC.uHor.value); this.cena.fog.density = neb * 1.05;
    this.sol.color.set(tp.sol); this.sol.intensity = tp.is * (1 - nub * 0.55); this.hemi.intensity = tp.hemi * (1 + nub * 0.15); this.hemi.color.copy(this.uC.uZen.value).lerp(new THREE.Color('#ffffff'), 0.4);
    this.noite = !!tp.noite; this.ambienteEnv();
  }
  /** Mapa de ambiente (PMREM) a partir do próprio céu: reflexos PBR coerentes no metal e no vidro. */
  ambienteEnv() { try { if (!this.pmrem) this.pmrem = new THREE.PMREMGenerator(this.R); const c = new THREE.Scene(); const m = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({ uniforms: this.uC, vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, fragmentShader: FS_CEU, side: THREE.BackSide })); c.add(m); const rt = this.pmrem.fromScene(c, 0, 0.1, 1000); if (this.envRT) this.envRT.dispose(); this.envRT = rt; this.cena.environment = rt.texture; this.cena.environmentIntensity = this.noite ? 0.25 : 0.8; m.geometry.dispose(); m.material.dispose(); } catch (e) { /* sem PMREM: segue sem reflexos */ } }
  sombras(liga, tam) { this.sol.castShadow = liga; if (liga) { this.sol.shadow.mapSize.set(tam, tam); if (this.sol.shadow.map) { this.sol.shadow.map.dispose(); this.sol.shadow.map = null; } } }
  atualiza(t, cam, foco) {
    this.uM.uT.value = t; /* v1.2.16: t = relógio CONTÍNUO de render (sim.t + resto do acumulador), não mais o tempo do passo fixo de 60 Hz em degraus */ this.uC.uT2.value = t; this.ceu.position.copy(cam.position); this.ceu.scale.setScalar(cam.far * 0.9);
    if (this.mar) this.mar.position.set(cam.position.x, 0, cam.position.z); /* v1.2.16: o plano do mar segue a câmera de forma CONTÍNUA (antes: degraus de 4 m numa malha POLAR, que não coincide consigo mesma ao deslocar → a cada 4 m de câmera os vértices amostravam outras ondas e a água 'travava'/saltava). Ondas, espuma e ruído são em coordenadas de MUNDO: nada a compensar em UV */
    /* v1.2.30 item 9: sync anel nuclear → shader (só 1º vivo; se vazio, uNkP.w=0 e VS pula) */
    { const Q = NUKE_ONDAS; if (Q.length) { const o = Q[0]; this.uM.uNk.value.set(o.x, o.z, o.t0, o.A0); this.uM.uNkP.value.set(o.cg != null ? o.cg : o.c * 0.5, o.k, o.rMax, 1); } else { this.uM.uNkP.value.w = 0; } }
    if (foco) { this.sol.position.set(foco.x + this.dirSol.x * 800, this.dirSol.y * 800 + 20, foco.z + this.dirSol.z * 800); this.sol.target.position.set(foco.x, 0, foco.z); }
  }
}
