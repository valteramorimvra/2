// Nexo Naval Strike v1.2.26 — RENDER da arma nuclear: bombardeiro 'Urubu-rei' (id 'bombardeiroNuclear', modelo do navios1226), bomba + paraquedas, e a DETONAÇÃO:
//  clarão (pulso duplo) → bola de fogo (ruído procedural) → esfera de choque + nuvem de condensação (Wilson) → anel de choque na água →
//  coluna d'água / base surge → COGUMELO (haste + capa toroidal que ROLA, sobe e se expande; incandescente no início) → céu escurece/clareia.
// Desempenho: TUDO criado no carregamento (memória estática, 0 alocação/0 programa novo em combate). Puffs = 1 InstancedBufferGeometry
// (1 draw call para cogumelo+haste+coluna+surge; ordenação de trás p/ frente na CPU; LOD por qualidade e por distância). Total ≤ 7 draw calls no pico.
// Luzes: NENHUMA luz nova (recompilaria todos os sombreadores); modula sol/hemi/exposição/céu/neblina já existentes e RESTAURA os valores-base no fim.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { modeloHeli } from './aereo3d.js'; /* v1.2.26: bombardeiro único 'bombardeiroNuclear' (Urubu-rei) */

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const Y0 = 150; // altura da rajada (= NUK.hRajada)
/** Curvas do cogumelo (m, s) — exportadas para teste/documentação */
export const CURVA = {
  topo: (T) => Y0 + 3300 * (1 - Math.exp(-T / 24)),              // altura do centro da capa
  raioCapa: (T) => 180 + 1050 * (1 - Math.exp(-T / 30)),          // raio maior do toro
  raioBola: (T) => 280 * (1 - Math.exp(-T / 0.32)),               // bola de fogo
  choque: (T) => 343 * T + 520 * (1 - Math.exp(-T / 0.5)),         // frente de choque (supersônica no início → 343 m/s)
  flash: (T) => Math.exp(-T / 0.03) + 0.9 * (1 - Math.exp(-T / 0.15)) * Math.exp(-T / 0.9), // pulso duplo térmico
  surge: (T) => (T < 2 ? 0 : 1900 * (1 - Math.exp(-(T - 2) / 14))),
  dura: 160,
};

function texPuff() { const N = 128, d = new Uint8Array(N * N * 4); const h = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i / N * 2 - 1, y = j / N * 2 - 1, r = Math.hypot(x, y); let f = 0, a = 0.5, s = 4; for (let o = 0; o < 5; o++) { f += a * vn(i / N * s + o * 7, j / N * s + o * 3); a *= 0.5; s *= 2; }
    const b = Math.max(0, 1 - r * r) ; const al = Math.max(0, Math.min(1, b * 1.6 * (0.45 + f) - 0.25 * r)); const k = (j * N + i) * 4; d[k] = d[k + 1] = d[k + 2] = Math.round(255 * Math.min(1, 0.55 + f * 0.6)); d[k + 3] = Math.round(255 * al); }
  const t = new THREE.DataTexture(d, N, N); t.needsUpdate = true; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t; }

const VS_PUFF = `attribute vec4 iPos; attribute vec4 iCol; attribute vec2 iExt; varying vec2 vUv; varying vec4 vCol; varying float vH; varying vec3 vN; varying float vD; varying float vSd;
void main(){ vec4 mv = modelViewMatrix * vec4(iPos.xyz, 1.0); float c = cos(iExt.y), s = sin(iExt.y); vUv = mat2(c, -s, s, c) * (uv - 0.5) + 0.5; mv.xy += position.xy * iPos.w; vN = normalize(vec3(position.xy * 1.7, 0.75)); vCol = iCol; vH = iExt.x; vD = -mv.z; vSd = iExt.y; gl_Position = projectionMatrix * mv; }`;
const FS_PUFF = `uniform sampler2D uTex; uniform vec3 uSolV; uniform vec3 uSolCor; uniform vec3 uAmb; uniform vec3 uFogCor; uniform float uFog; uniform float uFlash;
varying vec2 vUv; varying vec4 vCol; varying float vH; varying vec3 vN; varying float vD; varying float vSd;
/* fiscal nukefumaca (item 1, plano B): forma/alfa PROCEDURAIS no shader (sem textura): queda radial suave + fbm 2D por puff; sem RGB de fuligem escura */
float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), f.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){ float vR = length(vUv - 0.5) * 2.0; vec2 pp = (vUv - 0.5) * 2.0 + vec2(vSd * 3.7, vSd * 1.9); float fb = (vn2(pp * 1.7) * 0.55 + vn2(pp * 3.9 + 5.3) * 0.3 + vn2(pp * 8.3 + 9.1) * 0.15);
  float rr = vR + (fb - 0.5) * 0.62; float ta = 1.0 - smoothstep(0.28, 0.98, rr); ta *= ta * (3.0 - 2.0 * ta); vec4 tx = vec4(0.74 + 0.26 * fb, 0.0, 0.0, ta); float a = tx.a * vCol.a; if (a < 0.004) discard; float lam = clamp(dot(vN, uSolV) * 0.6 + 0.45, 0.0, 1.0);
  vec3 c = vCol.rgb * tx.r * (uAmb + uSolCor * lam + uFlash);
  vec3 q = mix(vec3(0.55, 0.08, 0.02), vec3(1.0, 0.55, 0.15), clamp(vH * 1.4, 0.0, 1.0)); q = mix(q, vec3(1.0, 0.95, 0.8), clamp(vH * 2.0 - 1.2, 0.0, 1.0)); c += q * vH * 2.6 * (0.6 + 0.4 * tx.r); float nt = 1.0 - clamp(dot(uAmb, vec3(0.333)) * 2.4, 0.0, 1.0); c += vec3(0.78, 0.46, 0.20) * nt * (0.5 + 1.0 * clamp(vH, 0.0, 1.0) + 0.45 * (1.0 - vR) + 0.5 * smoothstep(0.35, 0.95, vR) * clamp(vN.y * 0.5 + 0.7, 0.0, 1.0)) * (0.45 + 0.9 * fb); /* brasa p/ noite */
  float f = 1.0 - exp(-pow(uFog * vD, 2.0)); c = mix(c, uFogCor, f * (1.0 - clamp(vH, 0.0, 1.0))); gl_FragColor = vec4(c, a); }`;

const NOISE = `float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y), mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
const VS_OBJ = `varying vec3 vP; varying vec3 vNw; varying vec3 vV; void main(){ vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vNw = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`;
/** bola de fogo: ruído 3D animado + rampa de temperatura (núcleo branco → laranja → vermelho escuro na borda) */
const FS_BOLA = NOISE + `uniform float uT; uniform float uCalor; uniform float uA; varying vec3 vP; varying vec3 vNw; varying vec3 vV;
void main(){ float n = n3(vP * 3.0 + vec3(0.0, -uT * 1.5, 0.0)) * 0.6 + n3(vP * 7.0 - vec3(uT * 2.0)) * 0.4; float mu = clamp(dot(vNw, vV), 0.0, 1.0); float k = clamp(uCalor * (0.55 + 0.6 * mu) + (n - 0.5) * 0.5, 0.0, 1.2);
  vec3 c = mix(vec3(0.35, 0.05, 0.02), vec3(1.0, 0.42, 0.08), ss(0.1, 0.55, k)); c = mix(c, vec3(1.0, 0.9, 0.62), ss(0.55, 0.95, k)); c = mix(c, vec3(1.0), ss(0.95, 1.15, k));
  float borda = smoothstep(0.0, 0.55, mu + (n - 0.5) * 0.5); gl_FragColor = vec4(c * (1.2 + 2.5 * uCalor), uA * borda * (0.6 + 0.4 * mu)); }`.replace(/ss\(/g, 'smoothstep(');
/** casca de choque / nuvem de condensação: alfa na BORDA (fresnel) + ruído; uModo 0 = choque (refração clara), 1 = Wilson (névoa branca densa) */
const FS_CASCA = NOISE + `uniform float uA; uniform float uModo; uniform float uT; uniform vec3 uLuz; varying vec3 vP; varying vec3 vNw; varying vec3 vV;
void main(){ float mu = abs(dot(vNw, vV)); float n = n3(vP * 9.0 + uT * 0.4); float a; vec3 c;
  if (uModo < 0.5) { /* v1.2.26: frente de choque real é quase invisível — só uma ondulação tênue, sem contorno nítido de bolha */ a = (pow(1.0 - mu, 3.0) * 0.16 * (0.5 + n) + 0.015) * smoothstep(0.0, 0.18, mu); c = vec3(0.92, 0.95, 1.0) * uLuz; } else { /* v1.2.26: nuvem de condensação (Wilson) DENSA e realista — véu leitoso em camadas horizontais (estratos de umidade), flocos em 2 escalas, borda espessa (fresnel), saia baixa sobre a água e topo mais iluminado */ float n2 = n3(vP * 23.0 - uT * 0.9); float est = 0.55 + 0.45 * smoothstep(0.2, 0.9, 0.5 + 0.5 * sin(vP.y * 38.0 + n * 3.0)); float flo = smoothstep(0.18, 0.62, n * 0.65 + n2 * 0.35); float saia = 1.0 + 0.6 * (1.0 - smoothstep(0.0, 0.22, vP.y)); a = (0.62 + 0.38 * pow(1.0 - mu, 1.2)) * mix(0.55, 1.0, flo) * est * saia * smoothstep(-0.03, 0.12, vP.y); a *= smoothstep(0.0, 0.42, mu + (flo - 0.5) * 0.45 + (n2 - 0.5) * 0.2); /* silhueta esfiapada e macia, sem contorno geométrico */ a = clamp(a, 0.0, 0.97); c = mix(vec3(0.80, 0.83, 0.87), vec3(1.0), smoothstep(0.0, 0.8, vP.y) * 0.7 + flo * 0.3) * uLuz; }
  gl_FragColor = vec4(c, a * uA); }`;
const VS_ANEL = `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS_ANEL = `uniform float uA; uniform vec3 uLuz; uniform sampler2D uTex; uniform float uUsaTex; varying vec2 vU; void main(){ float r = vU.x; float b = smoothstep(0.80, 0.97, r) * (1.0 - smoothstep(0.97, 1.0, r)); float esc = smoothstep(0.3, 0.8, r) * (1.0 - smoothstep(0.8, 0.92, r)) * 0.25; vec3 c = mix(vec3(0.25, 0.3, 0.33), vec3(0.95, 0.97, 1.0), b / max(b + esc, 1e-3)) * uLuz; float a = (b * 0.8 + esc) * uA; if (uUsaTex > 0.5) { vec4 tx = texture2D(uTex, vec2(fract(r * 0.92 + 0.04), 0.5)); c = mix(c, tx.rgb * uLuz, 0.55); a = max(a, tx.a * uA * 0.85); } gl_FragColor = vec4(c, a); }`;
const FS_FLASH = `uniform float uA; varying vec2 vU; void main(){ vec2 p = vU * 2.0 - 1.0; float r = length(p); float g = exp(-r * r * 3.5) + 0.35 * exp(-r * 9.0); gl_FragColor = vec4(vec3(1.0, 0.97, 0.9) * g, 1.0) * uA; }`;
const FS_TELA = `uniform float uA; uniform vec3 uCor; void main(){ gl_FragColor = vec4(uCor * uA, uA); }`;

function geoBombardeiro() { const P = [], V = [], cor = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), C = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); const g2 = g.index ? g.toNonIndexed() : g; g2.deleteAttribute('uv'); return g2; };
  const CZ = '#59626c', ESC = '#3b434b', VID = '#141c24';
  P.push(cor(new THREE.CylinderGeometry(1.15, 0.65, 19, 14).rotateX(Math.PI / 2).translate(0, 0, 0.5), CZ)); // fuselagem
  P.push(cor(new THREE.ConeGeometry(1.15, 4.5, 14).rotateX(-Math.PI / 2).translate(0, 0, -11.25), CZ)); // nariz
  V.push(cor(new THREE.SphereGeometry(1, 16, 10).scale(0.85, 0.7, 2.4).translate(0, 0.95, -7.6), VID)); // cabine (vidro: material próprio)
  const asa = (span, z0, corda, enfl, esp, y) => { const s = new THREE.Shape(); s.moveTo(0, z0); s.lineTo(span, z0 + enfl); s.lineTo(span, z0 + enfl + corda * 0.42); s.lineTo(0, z0 + corda); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: esp, bevelEnabled: false }).rotateX(Math.PI / 2).translate(0, y + esp / 2, 0); return g; };
  for (const sx of [1, -1]) { P.push(cor(asa(11.5, -3, 7, 6.2, 0.45, -0.2).scale(sx, 1, 1), CZ)); P.push(cor(asa(4.6, 7.5, 3.2, 2.6, 0.25, 0.3).scale(sx, 1, 1), CZ)); // asa enflechada + estabilizador
    P.push(cor(new THREE.CylinderGeometry(0.72, 0.6, 6.2, 12).rotateX(Math.PI / 2).translate(sx * 4.3, -1.05, 1.8), ESC)); P.push(cor(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12).rotateX(Math.PI / 2).translate(sx * 4.3, -1.05, -1.4), '#1b1f23')); P.push(cor(new THREE.CylinderGeometry(0.55, 0.62, 0.6, 12, 1, true).rotateX(Math.PI / 2).translate(sx * 4.3, -1.05, 5.1), '#2b2622')); } // naceles (bimotor)
  { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(4.2, 4.6); s.lineTo(6.2, 4.6); s.lineTo(5.0, 0); s.closePath(); P.push(cor(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(0.15, 0.6, 5.2), ESC)); } // deriva
  const g = mergeGeometries([mergeGeometries(P, false), mergeGeometries(V, false)], true); g.computeVertexNormals(); // grupos: 0 = fuselagem, 1 = vidro
  { const nr = g.attributes.normal, cl = g.attributes.color, p = g.attributes.position, n0 = g.groups[0].count; for (let i = 0; i < n0; i++) { const ny = nr.getY(i), k = ny < -0.2 ? 1.45 : 1, f = 0.94 + 0.06 * Math.sin(p.getZ(i) * 2.1) * Math.sin(p.getX(i) * 1.7); cl.setXYZ(i, Math.min(1, cl.getX(i) * k * f), Math.min(1, cl.getY(i) * k * f), Math.min(1, cl.getZ(i) * k * f)); } } // ventre claro (contra-sombreamento naval) + leve variação de painéis
  g.computeBoundingSphere(); return g; }
function geoBomba() { const L = new THREE.LatheGeometry([[0, -2.0], [0.32, -1.75], [0.42, -1.2], [0.42, 0.9], [0.3, 1.5], [0.12, 1.75], [0, 1.8]].map(([r, y]) => new THREE.Vector2(r, y)), 14).rotateX(Math.PI / 2); // nariz em −z, cauda em +z
  const f = []; for (let k = 0; k < 4; k++) f.push(new THREE.BoxGeometry(0.04, 0.7, 0.6).translate(0, 0.45, 1.5).rotateZ(k * Math.PI / 2)); const g = mergeGeometries([L.toNonIndexed(), ...f.map((x) => x.toNonIndexed())].map((x) => { x.deleteAttribute('uv'); return x; }), false); g.computeVertexNormals(); return g; }

export class NuclearFx {
  /** @param cb { som(parte, x, y, z), tremor(k), vibra(ms), tremorOk(), msg(txt, cor) } */
  constructor(cena, R, amb, nivel, fx, cb = {}) { this.cena = cena; this.R = R; this.amb = amb; this.fx = fx; this.cb = cb; this.nivel = nivel; this.tl = 0; this.base = null; this.st = { picoPuffs: 0, deton: 0 };
    this.NP = [260, 480, 700][nivel] ?? 480; this.slots = [0, 1].map((i) => ({ i, ativo: 0, t0: 0, x: 0, y: 0, z: 0, d: 0, fila: [] }));
    const N = this.NP * 2; this.N = N; this.kind = new Uint8Array(N); this.pa = new Float32Array(N * 4); // a,b,c,s por puff
    let r = 1226; const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    for (let s = 0; s < 2; s++) for (let j = 0; j < this.NP; j++) { const i = s * this.NP + j, u = j / this.NP; this.kind[i] = u < 0.46 ? 0 : u < 0.66 ? 1 : u < 0.84 ? 2 : u < 0.94 ? 3 : 4; // 0 capa, 1 haste, 2 surge, 3 coluna, 4 saia
      this.pa[i * 4] = rnd() * Math.PI * 2; this.pa[i * 4 + 1] = rnd() * Math.PI * 2; this.pa[i * 4 + 2] = rnd(); this.pa[i * 4 + 3] = rnd(); }
    const ig = new THREE.InstancedBufferGeometry(); const pl = new THREE.PlaneGeometry(1, 1); ig.index = pl.index; ig.setAttribute('position', pl.attributes.position); ig.setAttribute('uv', pl.attributes.uv);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage); this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage); this.aExt = new THREE.InstancedBufferAttribute(new Float32Array(N * 2), 2).setUsage(THREE.DynamicDrawUsage);
    ig.setAttribute('iPos', this.aPos); ig.setAttribute('iCol', this.aCol); ig.setAttribute('iExt', this.aExt); ig.instanceCount = 1; this.ig = ig;
    this.tmp = { pos: new Float32Array(N * 4), col: new Float32Array(N * 4), ext: new Float32Array(N * 2), prof: new Float32Array(N), ord: new Uint32Array(N) }; this._ordArr = Array.from({ length: N }, (_, i) => i);
    this.uP = { uTex: { value: texPuff() }, uSolV: { value: new THREE.Vector3(0, 1, 0) }, uSolCor: { value: new THREE.Color(1, 1, 1) }, uAmb: { value: new THREE.Color(0.4, 0.4, 0.45) }, uFogCor: { value: new THREE.Color() }, uFog: { value: 0.0001 }, uFlash: { value: 0 } };
    this.puffs = new THREE.Mesh(ig, new THREE.ShaderMaterial({ uniforms: this.uP, vertexShader: VS_PUFF, fragmentShader: FS_PUFF, transparent: true, depthWrite: false })); this.puffs.frustumCulled = false; this.puffs.renderOrder = 7; this.puffs.visible = false; this.puffs.userData.nk = 1; cena.add(this.puffs);
    const sph = new THREE.SphereGeometry(1, 40, 20), dome = new THREE.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    this.bolaMat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uCalor: { value: 1 }, uA: { value: 1 } }, vertexShader: VS_OBJ, fragmentShader: FS_BOLA, transparent: true, depthWrite: false });
    this.bola = new THREE.Mesh(sph, this.bolaMat); this.bola.renderOrder = 6; // atrás dos puffs: a capa de fumaça engole a bola ao esfriar
    const casca = (modo) => new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uModo: { value: modo }, uT: { value: 0 }, uLuz: { value: new THREE.Color(1, 1, 1) } }, vertexShader: VS_OBJ, fragmentShader: FS_CASCA, transparent: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true });
    this.choque = new THREE.Mesh(sph, casca(0)); this.choque.renderOrder = 9; this.wilson = new THREE.Mesh(dome, casca(1)); this.wilson.renderOrder = 8;
    this.anel = new THREE.Mesh(new THREE.RingGeometry(0.0, 1, 128, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uLuz: { value: new THREE.Color(1, 1, 1) }, uTex: { value: null }, uUsaTex: { value: 0 } }, vertexShader: VS_ANEL, fragmentShader: FS_ANEL, transparent: true, depthWrite: false })); this.anel.renderOrder = 4;
    { const uv = this.anel.geometry.attributes.uv, p = this.anel.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, Math.hypot(p.getX(i), p.getZ(i)), 0); } // uv.x = raio normalizado
    this.brilhoM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, vertexShader: VS_ANEL, fragmentShader: FS_FLASH, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    this.brilho = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.brilhoM); this.brilho.renderOrder = 20;
    this.telaM = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uCor: { value: new THREE.Color(1, 0.97, 0.9) } }, vertexShader: VS_ANEL, fragmentShader: FS_TELA, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    this.tela = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.telaM); this.tela.renderOrder = 30;
    for (const m of [this.bola, this.choque, this.wilson, this.anel, this.brilho, this.tela]) { m.visible = false; m.userData.nk = 1; m.frustumCulled = false; cena.add(m); }
    this._ligaTexNuke(); /* v1.2.29: webp em public/tex/nuke/ → uniforms existentes; 0 nós/materiais novos em combate */
    // bombardeiros/bombas/paraquedas (pool 4, como na simulação)
    const gb = geoBombardeiro(), mb = [new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.28, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: '#1c2a36', roughness: 0.06, metalness: 0.9, envMapIntensity: 1.2 })], /* fuselagem: tinta naval fosca semimetálica; cabine: vidro escuro espelhado */ gbo = geoBomba(), mbo = new THREE.MeshStandardMaterial({ color: '#c9ccc4', roughness: 0.5, metalness: 0.5 });
    const gc = new THREE.SphereGeometry(9, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.42).translate(0, -9 * Math.cos(Math.PI * 0.42), 0), mc = new THREE.MeshStandardMaterial({ color: '#f2efe8', roughness: 0.9, side: THREE.DoubleSide, emissive: '#2a1c10' });
    this.bomb = []; for (let i = 0; i < 4; i++) { const a = modeloHeli('bombardeiroNuclear') || new THREE.Mesh(gb, mb) /* v1.2.26: o MESMO Urubu-rei do navios1226 (materiais PBR compartilhados com o parque/ala → 0 programas novos) */, b = new THREE.Mesh(gbo, mbo), c = new THREE.Mesh(gc, mc); a.rotation.order = 'YXZ'; b.rotation.order = 'YXZ'; for (const m of [a, b, c]) { m.visible = false; m.userData.nk = 1; m.traverse((o) => { o.userData.nk = 1; }); cena.add(m); }
      this.bomb.push({ av: a, bo: b, ch: c, tR: 0, queda: 0, vx: 0, vy: 0, vz: 0, rx: 0 }); }
    this.sams = Array.from({ length: 8 }, () => ({ t: -1, tv: 1, x: 0, y: 0, z: 0, idx: 0 })); this._v = new THREE.Vector3(); this._c = new THREE.Color(); this._c2 = new THREE.Color(); this.vento = { x: 3.5, z: -1.2 };
  }
  /** eventos nk* da simulação */
  evento(e, sim) { const fx = this.fx;
    switch (e.t) {
      case 'nkSamLanc': { const s = this.sams.find((q) => q.t < 0); if (s) { s.t = 0; s.tv = e.tv; s.x = e.x; s.y = e.y; s.z = e.z; s.idx = e.idx; } fx.lancaMissil(e.x, e.y, e.z); break; }
      case 'nkAbatido': { const b = this.bomb[e.idx]; fx.abateAereo(e.x, e.y, e.z, e.vx, e.vy, e.vz, 1.6); fx.clarao(e.x, e.y, e.z, 0.6); if (b) { b.queda = 1; b.vx = e.vx; b.vy = e.vy; b.vz = e.vz; b.av.visible = true; b.av.position.set(e.x, e.y, e.z); } break; }
      case 'nkBombaAbatida': fx.explosao(e.x, e.y, e.z, 1.3); fx.clarao(e.x, e.y, e.z, 0.7); break;
      case 'nkDetona': this.detona(e.x, e.y, e.z); break;
    } void sim; }
  detona(x, y, z) { const s = this.slots.find((q) => !q.ativo) || this.slots.reduce((a, b) => (a.t0 < b.t0 ? a : b)); const cam = this.camRef; s.ativo = 1; s.t0 = this.tl; s.x = x; s.y = y; s.z = z; this.st.deton++;
    const d = cam ? Math.hypot(cam.position.x - x, cam.position.y - y, cam.position.z - z) : 3000; s.d = d; const ts = d / 343, tw = Math.min(2.5, d / 1500), k = Math.max(0.18, 1 - d / 9000); /* fiscal nukefumaca (item 4 revisado): atraso REAL d/343 (sem cap); ganho alto + voz protegida no NavalAudio */
    s.fila.length = 0; s.fila.push(
      /* v1.2.29: clarão imediato; som atrasado pela velocidade do som (343 m/s); tremor/vibração por distância */
      [0, 'clarao'], [ts, 'estalo'], [ts + 0.08, 'estrondo'], [ts + 0.95, 'rolamento'], [0.55, 'coluna'],
      [tw, 'tremor', 0.4 * k], [ts, 'tremor', 2.6 * k], [ts + 1.8, 'tremor', 1.0 * k], [ts + 3.8, 'tremor', 0.55 * k]); /* REVISAO #9: vibra só via nkVibra */
    if (!this.base) this.capturaBase(); }
  capturaBase() { const A = this.amb, u = A.uC; this.base = { zen: u.uZen.value.clone(), hor: u.uHor.value.clone(), csol: u.uCorSol.value.clone(), sol: A.sol.color.clone(), is: A.sol.intensity, hemi: A.hemi.intensity, hc: A.hemi.color.clone(), expo: this.R.toneMappingExposure, fog: this.cena.fog ? this.cena.fog.color.clone() : null }; }
  restaura() { const A = this.amb, u = A.uC, B = this.base; if (!B) return; u.uZen.value.copy(B.zen); u.uHor.value.copy(B.hor); u.uCorSol.value.copy(B.csol); A.sol.color.copy(B.sol); A.sol.intensity = B.is; A.hemi.intensity = B.hemi; A.hemi.color.copy(B.hc); this.R.toneMappingExposure = B.expo; if (B.fog && this.cena.fog) this.cena.fog.color.copy(B.fog); this.base = null; }


  /** Carrega atlases webp no boot e liga a uniforms já existentes (puffs.uTex, anel.uTex). Sem Mesh/Material novos.
   *  v1.2.29: Promise — aguardar ANTES do preaquece/compile p/ não recompilar shader em combate (uUsaTex 0→1). */
  _ligaTexNuke() {
    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
    const root = (base.endsWith('/') ? base : base + '/') + 'tex/nuke/';
    const L = new THREE.TextureLoader();
    const carrega = (nome) => new Promise((ok) => { try { L.load(root + nome, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true; ok(tex); }, undefined, () => ok(null)); } catch (_) { ok(null); } });
    this.prontoTex = Promise.all([
      carrega('mushroom_smoke_atlas.webp').then((tex) => { if (!tex) return; const old = this.uP.uTex.value; this.uP.uTex.value = tex; if (old && old.dispose) try { old.dispose(); } catch (_) {} }),
      carrega('dust_cloud_atlas.webp').then((tex) => { if (tex) this._texDust = tex; }),
      carrega('fireball_atlas.webp').then((tex) => { if (tex) this._texFire = tex; }),
      carrega('shockwave_ring.webp').then((tex) => { if (!tex) return; const u = this.anel.material.uniforms; u.uTex.value = tex; u.uUsaTex.value = 1; }),
      carrega('shockwave_distortion.webp').then((tex) => { if (tex) this._texChoque = tex; }),
      carrega('water_foam.webp').then((tex) => { if (tex) this._texFoam = tex; }),
      carrega('water_spray.webp').then((tex) => { if (tex) this._texSpray = tex; }),
      carrega('debris_concrete_a.webp').then((tex) => { if (tex) this._texDebris = tex; }),
    ]).then(() => { this._texOk = 1; });
    return this.prontoTex;
  }

  passo(dt, sim, cam, alpha = 0) { this._alpha = alpha; this.tl += dt; this.camRef = cam; if (!this._pw && cam) { this._pw = 1; /* v1.2.26: pré-compila GLSL do nuclear no 1º quadro (o pico em T≈13 era a 1ª compilação de casca/bola/anel/puffs ao virarem visíveis) */ try { for (const m of [this.bola, this.choque, this.wilson, this.anel, this.brilho, this.tela, this.puffs]) m.visible = true; if (this.R && this.R.compile) this.R.compile(this.cena, cam); } catch (_) {} finally { for (const m of [this.bola, this.choque, this.wilson, this.anel, this.brilho, this.tela]) m.visible = false; this.puffs.visible = false; } } this.passoAvioes(dt, sim, alpha); this.passoSams(dt, sim); this.passoArvores(dt);
    let algum = 0, flashMax = 0, glow = 0, dim = 0; for (const s of this.slots) { if (!s.ativo) continue; const T = this.tl - s.t0; if (T > CURVA.dura) { s.ativo = 0; continue; } algum = 1;
      for (const q of s.fila) if (q[0] >= 0 && T >= q[0]) { const [, o, k] = q; q[0] = -1; if (o === 'tremor') { if (this.cb.tremorOk && this.cb.tremorOk()) this.cb.tremor && this.cb.tremor(k); } else if (o === 'vibra') { /* ignorado: nkVibra único */ } else if (o === 'clarao') { /* visual já via CURVA.flash */ } else this.cb.som && this.cb.som(o, s.x, s.y, s.z); }
      const kd = 1 / (1 + s.d / 6000); flashMax = Math.max(flashMax, CURVA.flash(T) * kd); glow = Math.max(glow, (0.75 * Math.exp(-T / 7) * (1 - Math.exp(-T / 0.4))) * kd); dim = Math.max(dim, 0.5 * ss(3, 25, T) * (1 - ss(55, 125, T)) / (1 + s.d / 15000)); }
    this.puffs.visible = algum; this.choque.visible = this.wilson.visible = this.anel.visible = this.bola.visible = this.brilho.visible = this.tela.visible = false;
    if (!algum) { if (this.base) this.restaura(); return; }
    this.ceu(flashMax, glow, dim); let n = 0, sm = null; for (const s of this.slots) if (s.ativo) { n = this.puffsSlot(s, this.tl - s.t0, cam, n); if (!sm || s.t0 > sm.t0) sm = s; } this.ordena(n, cam);
    this.objs(sm, this.tl - sm.t0, cam, flashMax); }

  ceu(f, g, dim) { const A = this.amb, u = A.uC, B = this.base, c = this._c; const quente = c.setRGB(1.0, 0.62, 0.32), poeira = this._c2.setRGB(0.24, 0.2, 0.18);
    u.uZen.value.copy(B.zen).lerp(poeira, dim * 0.8).lerp(quente, Math.min(0.85, g * 0.9 + f * 0.6)); u.uHor.value.copy(B.hor).lerp(poeira, dim).lerp(quente, Math.min(0.9, g + f * 0.7)); u.uCorSol.value.copy(B.csol).multiplyScalar(1 - dim * 0.6);
    A.sol.color.copy(B.sol).lerp(quente, Math.min(1, g * 1.2)); A.sol.intensity = B.is * (1 - dim * 0.55) + 6 * f + 2.2 * g; A.hemi.intensity = B.hemi * (1 - dim * 0.4) + 2.5 * f + g; A.hemi.color.copy(B.hc).lerp(quente, Math.min(1, g));
    this.R.toneMappingExposure = B.expo * (1 + 1.6 * f) * (1 - 0.25 * dim); if (B.fog && this.cena.fog) this.cena.fog.color.copy(B.fog).lerp(poeira, dim * 0.7).lerp(quente, Math.min(0.8, g + f * 0.5)); this.flash = f; }

  puffsSlot(s, T, cam, n0) { const P = this.tmp.pos, C = this.tmp.col, E = this.tmp.ext, pa = this.pa, NP = this.NP, cx = s.x, cz = s.z; const dc = Math.hypot(cam.position.x - cx, cam.position.z - cz);
    const lod = dc > 16000 ? 3 : dc > 9000 ? 2 : 1; const yc = CURVA.topo(T), Rc = CURVA.raioCapa(T), rc = 0.58 * Rc * (0.7 + 0.3 * (1 - Math.exp(-T / 10))), Rb = CURVA.raioBola(T), kc = ss(0.6, 5, T);
    const fade = 1 - ss(100, CURVA.dura, T), Phi = 2.6 * (1 - Math.exp(-T / 16)), hTopoHaste = yc - rc * 0.55, cresceH = ss(2, 12, T), rs = 0.2 * Rc, rsurge = CURVA.surge(T);
    let n = n0; const wx = this.vento.x * T, wz = this.vento.z * T;
    for (let j = 0; j < NP; j += lod) { const i = s.i * NP + j, k = this.kind[i], a = pa[i * 4], b = pa[i * 4 + 1], c = pa[i * 4 + 2], r = pa[i * 4 + 3]; let x, y, z, sz, al, h = 0, cr, cg, cb2;
      if (k === 0) { // CAPA toroidal: rola (sobe por dentro, sai por cima, desce pela borda); início = esfera da bola de fogo
        const ph = b - Phi * (0.7 + 0.6 * c), rr = Rc + rc * Math.cos(ph) * (0.75 + 0.3 * c), yy = yc + rc * 0.62 * Math.sin(ph) * (0.8 + 0.3 * r);
        const sx = Math.cos(a) * Math.sin(b), sy = Math.cos(b), sz2 = Math.sin(a) * Math.sin(b), rb = Rb * (0.35 + 0.55 * c);
        x = (1 - kc) * sx * rb + kc * Math.cos(a) * rr; z = (1 - kc) * sz2 * rb + kc * Math.sin(a) * rr; y = (1 - kc) * (Y0 + sy * rb + 30 * T) + kc * yy;
        sz = ((1 - kc) * Rb * 0.7 + kc * rc * (0.75 + 0.5 * r)) * (1 + 0.08 * Math.sin(T * 0.3 + a)); al = 0.82 * fade * ss(0.05, 0.5, T);
        const dentro = 0.5 - 0.5 * Math.cos(ph); h = Math.exp(-T / 3.5) * 1.25 + Math.exp(-T / 14) * 0.55 * dentro * (1 - c * 0.5); const sombra = 0.55 + 0.45 * Math.max(0, Math.sin(ph)); cr = 0.78 * sombra; cg = 0.7 * sombra; cb2 = 0.62 * sombra; }
      else if (k === 1) { // HASTE: puffs sobem ciclicamente; mais larga na base (spray/poeira), estreita no meio, junta na capa
        const u0 = (c + T * 0.014) % 1, yy = 20 + u0 * (hTopoHaste - 20); if (u0 > cresceH) { al = 0; x = cx; y = -999; z = cz; sz = 0; } else {
          const w = rs * (0.55 + 0.35 * r) * (1 + 1.3 * Math.pow(1 - u0, 3)) * (0.6 + 0.4 * kc), aa = a + T * 0.12; x = Math.cos(aa) * w * 0.6; z = Math.sin(aa) * w * 0.6; y = yy; sz = w * (0.9 + 0.5 * r); al = 0.7 * fade * ss(1.5, 6, T) * ss(1, 0.85, u0); }
        h = Math.exp(-T / 5) * 0.4 * (1 - u0 * 0.3); cr = 0.62; cg = 0.57; cb2 = 0.52; }
      else if (k === 2) { // BASE SURGE: anel baixo de névoa d'água expandindo
        const rr = rsurge * (0.72 + 0.4 * c); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = 40 + (60 + 160 * r) * (1 - Math.exp(-Math.max(0, T - 2) / 5)); sz = (120 + 160 * r) * (0.6 + 0.4 * ss(2, 14, T)) * (1 + T / 60);
        al = 0.6 * ss(2.2, 6, T) * (1 - ss(30, 80, T)); cr = cg = 0.92; cb2 = 0.95; }
      else if (k === 3) { // COLUNA D'ÁGUA oca: sobe e desaba (vira surge)
        const tc = T - 0.6, hc = tc > 0 ? 1100 * Math.sin(Math.min(Math.PI, tc / 13 * Math.PI)) : 0, u0 = c; const rr = (220 + 90 * r) * (1 + 0.6 * u0) * (1 + tc / 30); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = u0 * hc; sz = 110 + 120 * r;
        al = 0.7 * ss(0.6, 1.5, T) * (1 - ss(10, 18, T)); cr = cg = 0.95; cb2 = 1; }
      else { // SAIA (anel de condensação em volta da haste) — aparece com a capa subindo (5–40 s)
        const rr = Rc * (0.75 + 0.25 * c), yy = yc * (0.42 + 0.06 * r); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = yy; sz = rc * 0.45; al = 0.5 * ss(5, 12, T) * (1 - ss(28, 50, T)); cr = cg = cb2 = 0.96; }
      const pv = y / 3500; const o = n * 4; P[o] = cx + x + wx * pv; P[o + 1] = y; P[o + 2] = cz + z + wz * pv; P[o + 3] = al > 0.003 ? sz : 0; C[o] = cr; C[o + 1] = cg; C[o + 2] = cb2; C[o + 3] = al; E[n * 2] = h; E[n * 2 + 1] = a * 3 + r * 6 + T * 0.02 * (r - 0.5); n++; }
    return n; }

  ordena(n, cam) { const P = this.tmp.pos, pr = this.tmp.prof, ox = cam.position.x, oy = cam.position.y, oz = cam.position.z; for (let i = 0; i < n; i++) { const dx = P[i * 4] - ox, dy = P[i * 4 + 1] - oy, dz = P[i * 4 + 2] - oz; pr[i] = dx * dx + dy * dy + dz * dz; }
    const ord = this._ordArr; ord.length = n; for (let i = 0; i < n; i++) ord[i] = i; ord.sort((a, b) => pr[b] - pr[a]);
    const aP = this.aPos.array, aC = this.aCol.array, aE = this.aExt.array, C = this.tmp.col, E = this.tmp.ext; let m = 0;
    for (let q = 0; q < n; q++) { const i = ord[q]; if (P[i * 4 + 3] <= 0) continue; for (let k = 0; k < 4; k++) { aP[m * 4 + k] = P[i * 4 + k]; aC[m * 4 + k] = C[i * 4 + k]; } aE[m * 2] = E[i * 2]; aE[m * 2 + 1] = E[i * 2 + 1]; m++; }
    this.ig.instanceCount = Math.max(1, m); this.st.puffs = m; this.st.picoPuffs = Math.max(this.st.picoPuffs, m); this.aPos.needsUpdate = this.aCol.needsUpdate = this.aExt.needsUpdate = true; this.aPos.addUpdateRange && (this.aPos.clearUpdateRanges(), this.aPos.addUpdateRange(0, m * 4), this.aCol.clearUpdateRanges(), this.aCol.addUpdateRange(0, m * 4), this.aExt.clearUpdateRanges(), this.aExt.addUpdateRange(0, m * 2));
    const A = this.amb, U = this.uP; U.uSolV.value.copy(A.dirSol || A.uC.uSol.value).transformDirection(cam.matrixWorldInverse); U.uSolCor.value.copy(A.sol.color).multiplyScalar(Math.min(2.2, A.sol.intensity * 0.55)); U.uAmb.value.copy(A.hemi.color).multiplyScalar(Math.min(1.4, 0.25 + A.hemi.intensity * 0.35));
    if (this.cena.fog) { U.uFogCor.value.copy(this.cena.fog.color); U.uFog.value = this.cena.fog.density || 0.0001; } U.uFlash.value = Math.min(2, (this.flash || 0) * 3); }

  objs(s, T, cam, f) { const luz = Math.min(1.4, 0.35 + this.amb.sol.intensity * 0.3);
    if (T < 8) { const r = Math.max(5, CURVA.raioBola(T) * (1 - ss(3, 8, T) * 0.45)); this.bola.visible = true; this.bola.position.set(s.x, T < 0.6 ? s.y : CURVA.topo(T) * ss(0.6, 5, T) + s.y * (1 - ss(0.6, 5, T)), s.z); this.bola.scale.set(r, r * (1 - 0.25 * ss(2, 8, T)), r); this.bolaMat.uniforms.uT.value = T; this.bolaMat.uniforms.uCalor.value = Math.exp(-T / 2.2); this.bolaMat.uniforms.uA.value = 1 - ss(2.5, 7.5, T); }
    const rc = CURVA.choque(T); if (T < 8) { this.choque.visible = true; this.choque.position.set(s.x, s.y, s.z); this.choque.scale.setScalar(rc); this.choque.material.uniforms.uA.value = (1 - ss(2, 8, T)) * ss(0, 0.05, T); this.choque.material.uniforms.uLuz.value.setScalar(luz); }
    if (T > 0.25 && T < 5.2) { this.wilson.visible = true; this.wilson.position.set(s.x, 0, s.z); const rw = Math.max(200, rc * 0.92); this.wilson.scale.set(rw, rw * 0.6, rw); const m = this.wilson.material.uniforms; m.uA.value = ss(0.25, 0.7, T) * (1 - ss(2.4, 5.2, T)) * 1.0; m.uT.value = T; m.uLuz.value.setScalar(Math.max(luz, 0.9 + f)); }
    const rw = Math.sqrt(Math.max(0, rc * rc - s.y * s.y)); if (rw > 0 && T < 12) { this.anel.visible = true; this.anel.position.set(s.x, 0.8, s.z); this.anel.scale.setScalar(rw); this.anel.material.uniforms.uA.value = 1 - ss(5, 12, T); this.anel.material.uniforms.uLuz.value.setScalar(luz); }
    if (f > 0.01) { // clarão: brilho no ponto (sempre por cima) + véu de tela (adicional)
      const v = this._v.set(s.x, s.y, s.z).project(cam); if (v.z < 1) { this.brilho.visible = true; const d = Math.max(50, cam.position.distanceTo(this._v.set(s.x, s.y, s.z))); this.brilho.position.copy(this._v.set(s.x, s.y, s.z)); this.brilho.quaternion.copy(cam.quaternion); const sc = d * 0.9 * (0.4 + f); this.brilho.scale.set(sc, sc, 1); this.brilhoM.uniforms.uA.value = Math.min(1.5, f * 1.6); }
      this.tela.visible = true; this.tela.position.copy(cam.position); this.tela.quaternion.copy(cam.quaternion); this.tela.translateZ(-(cam.near + 0.5)); const hh = Math.tan(cam.fov * Math.PI / 360) * (cam.near + 0.5) * 1.2; this.tela.scale.set(hh * cam.aspect, hh, 1); this.telaM.uniforms.uA.value = Math.min(0.92, f * 1.1); } }

  /** v1.2.29: pose interpolada (alpha = S.acc/DT) — evita salto 1↔2 passos/frame a 200–285 m/s */
  _pose(q, a, o) { const A = a == null ? 0 : a; const px = q.px != null ? q.px : q.x, py = q.py != null ? q.py : q.y, pz = q.pz != null ? q.pz : q.z;
    o.x = px + (q.x - px) * A; o.y = py + (q.y - py) * A; o.z = pz + (q.z - pz) * A;
    const pr = q.prumo != null ? q.prumo : q.rumo, pp = q.ppitch != null ? q.ppitch : (q.pitch || 0), pl = q.proll != null ? q.proll : (q.roll || 0);
    let dr = q.rumo - pr; while (dr > Math.PI) dr -= Math.PI * 2; while (dr < -Math.PI) dr += Math.PI * 2;
    o.rumo = pr + dr * A; o.pitch = pp + ((q.pitch || 0) - pp) * A; o.roll = pl + ((q.roll || 0) - pl) * A; return o; }
  passoAvioes(dt, sim, alpha = 0) { const fx = this.fx, Q = sim.nukes; if (!Q) return; this.st.avioes = 0; const a = alpha, P = this._pAv || (this._pAv = { x: 0, y: 0, z: 0, rumo: 0, pitch: 0, roll: 0 }), Pb = this._pBo || (this._pBo = { x: 0, y: 0, z: 0 });
    for (let i = 0; i < 4; i++) { const q = Q[i], b = this.bomb[i]; if (!q) continue;
      if (b.queda) { const av = b.av; b.vy -= 9.81 * dt; b.vx *= 0.995; b.vz *= 0.995; av.position.x += b.vx * dt; av.position.y += b.vy * dt; av.position.z += b.vz * dt; av.rotation.x -= 0.6 * dt; av.rotation.z += 1.4 * dt; b.tR += dt;
        if (b.tR > 0.03) { b.tR = 0; fx.fumaca.emite(av.position.x, av.position.y, av.position.z, 0, 2, 0, '#2a2622', 0.7, 14, 6, 6); fx.brilho.emite(av.position.x, av.position.y, av.position.z, 0, 0, 0, '#ff9a3a', 0.9, 7, 0.35, 4); }
        if (av.position.y < 0) { b.queda = 0; av.visible = false; fx.explosao(av.position.x, 2, av.position.z, 1.2); for (let k = 0; k < 20; k++) fx.agua.emite(av.position.x, 1, av.position.z, (Math.random() - 0.5) * 18, 18 + Math.random() * 26, (Math.random() - 0.5) * 18, '#e8eef2', 0.8, 6, 2.2, 3, 9.8); } }
      else { b.av.visible = !!q.ativo; if (q.ativo) { this.st.avioes++; this._pose(q, a, P); b.av.position.set(P.x, P.y, P.z); b.av.rotation.set(P.pitch, -P.rumo, P.roll); if (q.fase >= 2) { b.tR += dt; if (b.tR > 0.06) { b.tR = 0; const c = Math.cos(P.rumo), s2 = Math.sin(P.rumo); for (const sx of [-4.3, 4.3]) fx.fumaca.emite(P.x + c * sx - s2 * 6, P.y - 1, P.z + s2 * sx + c * 6, 0, 0, 0, '#dfe4ea', 0.28, 4, 5, 3, 0, 0.1); } } } }
      const B = q.b; b.bo.visible = !!B.ativo; b.ch.visible = !!(B.ativo && B.chute); if (B.ativo) { const bx = B.px != null ? B.px : B.x, by = B.py != null ? B.py : B.y, bz = B.pz != null ? B.pz : B.z; Pb.x = bx + (B.x - bx) * a; Pb.y = by + (B.y - by) * a; Pb.z = bz + (B.z - bz) * a; b.bo.position.set(Pb.x, Pb.y, Pb.z); const v = Math.hypot(B.vx, B.vz); b.bo.rotation.set(Math.atan2(B.vy, v), -Math.atan2(B.vx, -B.vz), 0);
        if (B.chute) { const vv = Math.hypot(B.vx, B.vy, B.vz) || 1, o = Math.min(1, (B.t - 1.5) * 2); b.ch.position.set(Pb.x - B.vx / vv * 16, Pb.y - B.vy / vv * 16, Pb.z - B.vz / vv * 16); b.ch.scale.setScalar(0.2 + 0.8 * o); b.ch.lookAt(Pb.x, Pb.y, Pb.z); b.ch.rotateX(-Math.PI / 2); } } } }
  passoSams(dt, sim) { for (const s of this.sams) { if (s.t < 0) continue; s.t += dt; const q = sim.nukes && sim.nukes[s.idx]; if (!q || s.t > s.tv) { s.t = -1; continue; } const u = s.t / s.tv, x = s.x + (q.x - s.x) * u, y = s.y + (q.y - s.y) * u * u, z = s.z + (q.z - s.z) * u; this.fx.fumaca.emite(x, y, z, 0, 0, 0, '#e8eaec', 0.45, 5, 3.5, 4, 0, 0.2); this.fx.brilho.emite(x, y, z, 0, 0, 0, '#ffd27a', 1, 3, 0.08, 0); } }
  /** Cache InstancedMesh arvNuke no 1º uso (REVISAO #11). */
  _cacheArv() {
    if (this._arvMeshes) return;
    this._arvMeshes = []; this.cena.traverse((o) => { if (o.isInstancedMesh && o.userData && o.userData.arvNuke) this._arvMeshes.push(o); });
    this._arvQ = []; this._arvFree = [];
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6, 1.2), new THREE.MeshStandardMaterial({ color: '#3a5a2a', roughness: 0.95 }));
      m.visible = false; m.vivo = 0; m.userData.nk = 1; m.castShadow = false; this.cena.add(m); this._arvQ.push(m); this._arvFree.push(m);
    }
  }
  /** v1.2.29 nuke v2 item 6: árvores → corpos livres (pool 48); montanhas ficam. */
  arrancaArvores(cx, cz, r = 4200) {
    this._cacheArv();
    const mt = this._mtArv || (this._mtArv = new THREE.Matrix4()), p = this._vArv || (this._vArv = new THREE.Vector3());
    const s0 = this._sArv || (this._sArv = new THREE.Vector3()), q0 = this._qArv || (this._qArv = new THREE.Quaternion());
    const r2 = r * r, lim = 48; let n = 0;
    for (const o of this._arvMeshes) {
      if (n >= lim || !o.count) continue;
      const N = o.count;
      for (let i = 0; i < N && n < lim; i++) {
        o.getMatrixAt(i, mt); p.setFromMatrixPosition(mt);
        const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz; if (d2 > r2 || d2 < 4) continue;
        const d = Math.sqrt(d2), fc = Math.pow(1 - d / r, 1.2); if (fc < 0.08) continue;
        mt.decompose(p, q0, s0); if (s0.x < 1e-3) continue;
        mt.makeScale(0, 0, 0); mt.setPosition(p.x, p.y, p.z); o.setMatrixAt(i, mt); o.instanceMatrix.needsUpdate = true;
        const m = this._arvFree.pop(); if (!m) break;
        if (m.geometry !== o.geometry) { m.geometry = o.geometry; if (o.material) m.material = o.material; }
        m.vivo = 1; m.visible = true; m.position.copy(p); m.quaternion.copy(q0); m.scale.copy(s0);
        const ux = dx / d, uz = dz / d, v = 18 + 55 * fc;
        m.vx = ux * v; m.vy = 8 + 22 * fc; m.vz = uz * v;
        { const h = Math.sin(p.x * 12.9898 + p.z * 78.233) * 43758.5453; const r1 = h - Math.floor(h), r2b = (h * 1.7) - Math.floor(h * 1.7), r3 = (h * 2.3) - Math.floor(h * 2.3); m.wx = (r1 - 0.5) * 3; m.wy = (r2b - 0.5) * 4; m.wz = (r3 - 0.5) * 3; }
        m.tVivo = 0; n++;
      }
    }
    this._arvN = (this._arvN || 0) + n;
  }
  passoArvores(dt) {
    const Q = this._arvQ; if (!Q || !Q.length) return;
    const kd = Math.exp(-1.6 * dt); /* REVISAO #8: arrasto independente de FPS */
    for (const m of Q) {
      if (!m.vivo) continue; m.tVivo += dt; m.vy -= 9.81 * dt; m.vx *= kd; m.vz *= kd;
      m.position.x += m.vx * dt; m.position.y += m.vy * dt; m.position.z += m.vz * dt;
      m.rotation.x += m.wx * dt; m.rotation.y += m.wy * dt; m.rotation.z += m.wz * dt;
      if (m.position.y < 0) { m.position.y = 0; m.vy = 0; m.vx *= 0.4; m.vz *= 0.4; m.wx *= 0.5; m.wz *= 0.5; } /* não atravessa o chão */
      if (m.tVivo > 12) { m.vivo = 0; m.visible = false; if (this._arvFree) this._arvFree.push(m); }
    }
  }
}
